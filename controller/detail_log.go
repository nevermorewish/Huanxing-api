package controller

import (
	"strconv"

	"github.com/huanxing/huanxing-api/common"
	"github.com/huanxing/huanxing-api/model"

	"github.com/gin-gonic/gin"
)

func GetDetailLogs(c *gin.Context) {
	pageInfo := common.GetPageQuery(c)
	startTimestamp, _ := strconv.ParseInt(c.Query("start_timestamp"), 10, 64)
	endTimestamp, _ := strconv.ParseInt(c.Query("end_timestamp"), 10, 64)
	logID, _ := strconv.Atoi(c.Query("log_id"))
	username := c.Query("username")
	tokenName := c.Query("token_name")
	modelName := c.Query("model_name")
	requestId := c.Query("request_id")

	logs, total, err := model.GetChatCaches(
		pageInfo.GetStartIdx(),
		pageInfo.GetPageSize(),
		username,
		modelName,
		tokenName,
		requestId,
		logID,
		startTimestamp,
		endTimestamp,
	)
	if err != nil {
		common.ApiError(c, err)
		return
	}
	pageInfo.SetTotal(int(total))
	pageInfo.SetItems(logs)
	common.ApiSuccess(c, pageInfo)
}

func GetDetailLog(c *gin.Context) {
	id, err := strconv.Atoi(c.Param("id"))
	if err != nil || id <= 0 {
		common.ApiErrorMsg(c, "invalid detail log id")
		return
	}
	log, err := model.GetChatCacheByID(id)
	if err != nil {
		common.ApiError(c, err)
		return
	}
	common.ApiSuccess(c, log)
}
