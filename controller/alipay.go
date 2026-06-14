package controller

import (
	"context"
	"errors"
	"fmt"
	"net/http"
	"net/url"
	"strconv"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/huanxing/huanxing-api/common"
	"github.com/huanxing/huanxing-api/logger"
	"github.com/huanxing/huanxing-api/model"
	"github.com/huanxing/huanxing-api/service"
	"github.com/huanxing/huanxing-api/setting"
	"github.com/huanxing/huanxing-api/setting/operation_setting"
	"github.com/shopspring/decimal"
	"github.com/smartwalle/alipay/v3"
)

func GetAlipayClient() (*alipay.Client, error) {
	if !isAlipayConfigured() {
		return nil, errors.New("支付宝未配置")
	}
	client, err := alipay.New(setting.AlipayAppId, setting.AlipayPrivateKey, !setting.AlipaySandboxEnabled)
	if err != nil {
		return nil, err
	}
	if err := client.LoadAliPayPublicKey(setting.AlipayPublicKey); err != nil {
		return nil, err
	}
	return client, nil
}

func alipayTradeSuccess(status alipay.TradeStatus) bool {
	return status == alipay.TradeStatusSuccess || status == alipay.TradeStatusFinished
}

func alipayNotifyValues(c *gin.Context) (url.Values, error) {
	if err := c.Request.ParseForm(); err != nil {
		return nil, err
	}
	return c.Request.Form, nil
}

func buildAlipayPagePayURL(client *alipay.Client, tradeNo string, subject string, money float64, notifyURL string, returnURL string) (string, error) {
	payURL, err := client.TradePagePay(alipay.TradePagePay{
		Trade: alipay.Trade{
			NotifyURL:      notifyURL,
			ReturnURL:      returnURL,
			Subject:        subject,
			OutTradeNo:     tradeNo,
			TotalAmount:    strconv.FormatFloat(money, 'f', 2, 64),
			ProductCode:    "FAST_INSTANT_TRADE_PAY",
			GoodsType:      "0",
			TimeoutExpress: "30m",
		},
	})
	if err != nil {
		return "", err
	}
	return payURL.String(), nil
}

func RequestAlipay(c *gin.Context) {
	if !isAlipayTopUpEnabled() {
		c.JSON(http.StatusOK, gin.H{"message": "error", "data": "当前管理员未配置支付宝支付信息"})
		return
	}

	var req EpayRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusOK, gin.H{"message": "error", "data": "参数错误"})
		return
	}
	if req.Amount < getMinTopup() {
		c.JSON(http.StatusOK, gin.H{"message": "error", "data": fmt.Sprintf("充值数量不能小于 %d", getMinTopup())})
		return
	}

	client, err := GetAlipayClient()
	if err != nil {
		c.JSON(http.StatusOK, gin.H{"message": "error", "data": "当前管理员未配置支付宝支付信息"})
		return
	}

	id := c.GetInt("id")
	group, err := model.GetUserGroup(id, true)
	if err != nil {
		c.JSON(http.StatusOK, gin.H{"message": "error", "data": "获取用户分组失败"})
		return
	}
	payMoney := getPayMoney(req.Amount, group)
	if payMoney < 0.01 {
		c.JSON(http.StatusOK, gin.H{"message": "error", "data": "充值金额过低"})
		return
	}

	tradeNo := fmt.Sprintf("USR%dNO%s%d", id, common.GetRandomString(6), time.Now().Unix())
	amount := req.Amount
	if operation_setting.GetQuotaDisplayType() == operation_setting.QuotaDisplayTypeTokens {
		dAmount := decimal.NewFromInt(req.Amount)
		dQuotaPerUnit := decimal.NewFromFloat(common.QuotaPerUnit)
		amount = dAmount.Div(dQuotaPerUnit).IntPart()
	}
	topUp := &model.TopUp{
		UserId:          id,
		Amount:          amount,
		Money:           payMoney,
		TradeNo:         tradeNo,
		PaymentMethod:   model.PaymentMethodAlipay,
		PaymentProvider: model.PaymentProviderAlipay,
		CreateTime:      time.Now().Unix(),
		Status:          common.TopUpStatusPending,
	}
	if err := topUp.Insert(); err != nil {
		logger.LogError(c.Request.Context(), fmt.Sprintf("支付宝 创建充值订单失败 user_id=%d trade_no=%s amount=%d error=%q", id, tradeNo, req.Amount, err.Error()))
		c.JSON(http.StatusOK, gin.H{"message": "error", "data": "创建订单失败"})
		return
	}

	callbackAddress := service.GetCallbackAddress()
	payURL, err := buildAlipayPagePayURL(
		client,
		tradeNo,
		fmt.Sprintf("TUC%d", req.Amount),
		payMoney,
		callbackAddress+"/api/user/alipay/notify",
		paymentReturnPath("/console/log"),
	)
	if err != nil {
		_ = model.UpdatePendingTopUpStatus(tradeNo, model.PaymentProviderAlipay, common.TopUpStatusExpired)
		logger.LogError(c.Request.Context(), fmt.Sprintf("支付宝 拉起支付失败 user_id=%d trade_no=%s amount=%d error=%q", id, tradeNo, req.Amount, err.Error()))
		c.JSON(http.StatusOK, gin.H{"message": "error", "data": "拉起支付失败"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "success", "data": gin.H{"pay_link": payURL}})
}

func AlipayNotify(c *gin.Context) {
	if !isAlipayWebhookEnabled() {
		_, _ = c.Writer.Write([]byte("fail"))
		return
	}
	client, err := GetAlipayClient()
	if err != nil {
		_, _ = c.Writer.Write([]byte("fail"))
		return
	}
	values, err := alipayNotifyValues(c)
	if err != nil {
		_, _ = c.Writer.Write([]byte("fail"))
		return
	}
	notification, err := client.DecodeNotification(context.Background(), values)
	if err != nil || !alipayTradeSuccess(notification.TradeStatus) || notification.OutTradeNo == "" {
		_, _ = c.Writer.Write([]byte("fail"))
		return
	}

	LockOrder(notification.OutTradeNo)
	defer UnlockOrder(notification.OutTradeNo)
	if err := model.RechargeAlipay(notification.OutTradeNo, notification.BuyerId, c.ClientIP()); err != nil {
		_, _ = c.Writer.Write([]byte("fail"))
		return
	}
	_, _ = c.Writer.Write([]byte("success"))
}

func SubscriptionRequestAlipay(c *gin.Context) {
	if !isAlipayTopUpEnabled() {
		common.ApiErrorMsg(c, "当前管理员未配置支付宝支付信息")
		return
	}

	var req SubscriptionEpayPayRequest
	if err := c.ShouldBindJSON(&req); err != nil || req.PlanId <= 0 {
		common.ApiErrorMsg(c, "参数错误")
		return
	}
	client, err := GetAlipayClient()
	if err != nil {
		common.ApiErrorMsg(c, "当前管理员未配置支付宝支付信息")
		return
	}

	plan, err := model.GetSubscriptionPlanById(req.PlanId)
	if err != nil {
		common.ApiError(c, err)
		return
	}
	if !plan.Enabled {
		common.ApiErrorMsg(c, "套餐未启用")
		return
	}
	if plan.PriceAmount < 0.01 {
		common.ApiErrorMsg(c, "套餐金额过低")
		return
	}
	userId := c.GetInt("id")
	if plan.MaxPurchasePerUser > 0 {
		count, err := model.CountUserSubscriptionsByPlan(userId, plan.Id)
		if err != nil {
			common.ApiError(c, err)
			return
		}
		if count >= int64(plan.MaxPurchasePerUser) {
			common.ApiErrorMsg(c, "已达到该套餐购买上限")
			return
		}
	}

	tradeNo := fmt.Sprintf("SUBUSR%dNO%s%d", userId, common.GetRandomString(6), time.Now().Unix())
	order := &model.SubscriptionOrder{
		UserId:          userId,
		PlanId:          plan.Id,
		Money:           plan.PriceAmount,
		TradeNo:         tradeNo,
		PaymentMethod:   model.PaymentMethodAlipay,
		PaymentProvider: model.PaymentProviderAlipay,
		CreateTime:      time.Now().Unix(),
		Status:          common.TopUpStatusPending,
	}
	if err := order.Insert(); err != nil {
		common.ApiErrorMsg(c, "创建订单失败")
		return
	}

	callbackAddress := service.GetCallbackAddress()
	payURL, err := buildAlipayPagePayURL(
		client,
		tradeNo,
		fmt.Sprintf("SUB:%s", plan.Title),
		plan.PriceAmount,
		callbackAddress+"/api/subscription/alipay/notify",
		callbackAddress+"/api/subscription/alipay/return",
	)
	if err != nil {
		_ = model.ExpireSubscriptionOrder(tradeNo, model.PaymentProviderAlipay)
		common.ApiErrorMsg(c, "拉起支付失败")
		return
	}
	c.JSON(http.StatusOK, gin.H{"message": "success", "data": gin.H{"pay_link": payURL}})
}

func SubscriptionAlipayNotify(c *gin.Context) {
	if !isAlipayWebhookEnabled() {
		_, _ = c.Writer.Write([]byte("fail"))
		return
	}
	client, err := GetAlipayClient()
	if err != nil {
		_, _ = c.Writer.Write([]byte("fail"))
		return
	}
	values, err := alipayNotifyValues(c)
	if err != nil {
		_, _ = c.Writer.Write([]byte("fail"))
		return
	}
	notification, err := client.DecodeNotification(context.Background(), values)
	if err != nil || !alipayTradeSuccess(notification.TradeStatus) || notification.OutTradeNo == "" {
		_, _ = c.Writer.Write([]byte("fail"))
		return
	}

	LockOrder(notification.OutTradeNo)
	defer UnlockOrder(notification.OutTradeNo)
	if err := model.CompleteSubscriptionOrder(notification.OutTradeNo, common.GetJsonString(notification), model.PaymentProviderAlipay, model.PaymentMethodAlipay); err != nil {
		_, _ = c.Writer.Write([]byte("fail"))
		return
	}
	_, _ = c.Writer.Write([]byte("success"))
}

func SubscriptionAlipayReturn(c *gin.Context) {
	client, err := GetAlipayClient()
	if err != nil {
		c.Redirect(http.StatusFound, paymentReturnPath("/console/subscription?pay=fail"))
		return
	}
	values, err := alipayNotifyValues(c)
	if err != nil {
		c.Redirect(http.StatusFound, paymentReturnPath("/console/subscription?pay=fail"))
		return
	}
	notification, err := client.DecodeNotification(context.Background(), values)
	if err != nil || notification.OutTradeNo == "" {
		c.Redirect(http.StatusFound, paymentReturnPath("/console/subscription?pay=fail"))
		return
	}
	if alipayTradeSuccess(notification.TradeStatus) {
		LockOrder(notification.OutTradeNo)
		defer UnlockOrder(notification.OutTradeNo)
		if err := model.CompleteSubscriptionOrder(notification.OutTradeNo, common.GetJsonString(notification), model.PaymentProviderAlipay, model.PaymentMethodAlipay); err != nil {
			c.Redirect(http.StatusFound, paymentReturnPath("/console/subscription?pay=fail"))
			return
		}
		c.Redirect(http.StatusFound, paymentReturnPath("/console/subscription?pay=success"))
		return
	}
	c.Redirect(http.StatusFound, paymentReturnPath("/console/subscription?pay=pending"))
}
