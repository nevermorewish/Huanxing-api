package controller

import (
	"errors"
	"fmt"
	"strconv"
	"strings"
	"sync"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/huanxing/huanxing-api/common"
	"github.com/huanxing/huanxing-api/constant"
	"github.com/huanxing/huanxing-api/model"
	"gorm.io/gorm"
)

const (
	defaultChannelTypeMonitorIntervalSeconds = 600
	minChannelTypeMonitorIntervalSeconds     = 60
	maxChannelTypeMonitorIntervalSeconds     = 86400
)

type channelTypeMonitorRequest struct {
	ChannelType     int     `json:"channel_type"`
	GroupName       string  `json:"group_name"`
	APIURL          string  `json:"api_url"`
	APIKey          *string `json:"api_key"`
	TestModel       string  `json:"test_model"`
	Enabled         bool    `json:"enabled"`
	IntervalSeconds int     `json:"interval_seconds"`
}

type channelTypeMonitorResponse struct {
	Id              int    `json:"id"`
	ChannelType     int    `json:"channel_type"`
	ChannelTypeName string `json:"channel_type_name"`
	GroupName       string `json:"group_name"`
	APIURL          string `json:"api_url"`
	HasAPIKey       bool   `json:"has_api_key"`
	TestModel       string `json:"test_model"`
	Enabled         bool   `json:"enabled"`
	IntervalSeconds int    `json:"interval_seconds"`
	LastStatus      string `json:"last_status"`
	LastMessage     string `json:"last_message"`
	LastLatencyMs   *int   `json:"last_latency_ms"`
	LastCheckedAt   *int64 `json:"last_checked_at"`
	CreatedAt       int64  `json:"created_at"`
	UpdatedAt       int64  `json:"updated_at"`
}

type channelTypeMonitorHistoryResponse struct {
	Id          int    `json:"id"`
	MonitorId   int    `json:"monitor_id"`
	ChannelId   int    `json:"channel_id"`
	ChannelName string `json:"channel_name"`
	Model       string `json:"model"`
	Status      string `json:"status"`
	LatencyMs   *int   `json:"latency_ms"`
	Message     string `json:"message"`
	CheckedAt   int64  `json:"checked_at"`
}

func channelTypeMonitorToResponse(monitor *model.ChannelTypeMonitor) channelTypeMonitorResponse {
	var latency *int
	if monitor.LastLatencyMs > 0 {
		latency = &monitor.LastLatencyMs
	}
	var checkedAt *int64
	if monitor.LastCheckedAt > 0 {
		checkedAt = &monitor.LastCheckedAt
	}
	return channelTypeMonitorResponse{
		Id:              monitor.Id,
		ChannelType:     monitor.ChannelType,
		ChannelTypeName: constant.GetChannelTypeName(monitor.ChannelType),
		GroupName:       monitor.GroupName,
		APIURL:          monitor.APIURL,
		HasAPIKey:       strings.TrimSpace(monitor.APIKey) != "",
		TestModel:       monitor.TestModel,
		Enabled:         monitor.Enabled,
		IntervalSeconds: monitor.IntervalSeconds,
		LastStatus:      monitor.LastStatus,
		LastMessage:     monitor.LastMessage,
		LastLatencyMs:   latency,
		LastCheckedAt:   checkedAt,
		CreatedAt:       monitor.CreatedAt,
		UpdatedAt:       monitor.UpdatedAt,
	}
}

func channelTypeMonitorHistoryToResponse(item *model.ChannelTypeMonitorHistory) channelTypeMonitorHistoryResponse {
	var latency *int
	if item.LatencyMs > 0 {
		latency = &item.LatencyMs
	}
	return channelTypeMonitorHistoryResponse{
		Id:          item.Id,
		MonitorId:   item.MonitorId,
		ChannelId:   item.ChannelId,
		ChannelName: item.ChannelName,
		Model:       item.Model,
		Status:      item.Status,
		LatencyMs:   latency,
		Message:     item.Message,
		CheckedAt:   item.CheckedAt,
	}
}

func normalizeChannelTypeMonitorInterval(seconds int) int {
	if seconds <= 0 {
		seconds = defaultChannelTypeMonitorIntervalSeconds
	}
	if seconds < minChannelTypeMonitorIntervalSeconds {
		return minChannelTypeMonitorIntervalSeconds
	}
	if seconds > maxChannelTypeMonitorIntervalSeconds {
		return maxChannelTypeMonitorIntervalSeconds
	}
	return seconds
}

func normalizeChannelTypeMonitorGroupName(groupName string, channelType int) string {
	groupName = strings.TrimSpace(groupName)
	if groupName == "" {
		return constant.GetChannelTypeName(channelType)
	}
	if len([]rune(groupName)) > 64 {
		runes := []rune(groupName)
		groupName = string(runes[:64])
	}
	return groupName
}

func normalizeChannelTypeMonitorURL(apiURL string) string {
	apiURL = strings.TrimSpace(apiURL)
	if len(apiURL) > 2048 {
		apiURL = apiURL[:2048]
	}
	return strings.TrimRight(apiURL, "/")
}

func normalizeChannelTypeMonitorKey(apiKey string) string {
	return strings.TrimSpace(apiKey)
}

func normalizeChannelTypeMonitorModel(testModel string) string {
	testModel = strings.TrimSpace(testModel)
	if len([]rune(testModel)) > 255 {
		runes := []rune(testModel)
		testModel = string(runes[:255])
	}
	return testModel
}

func validateChannelTypeMonitorRequest(req channelTypeMonitorRequest) error {
	if req.ChannelType <= constant.ChannelTypeUnknown || req.ChannelType >= constant.ChannelTypeDummy {
		return fmt.Errorf("invalid channel type: %d", req.ChannelType)
	}
	if _, ok := common.ChannelType2APIType(req.ChannelType); !ok {
		return fmt.Errorf("%s channel type does not support monitor tests", constant.GetChannelTypeName(req.ChannelType))
	}
	return nil
}

func ListChannelTypeMonitors(c *gin.Context) {
	pageInfo := common.GetPageQuery(c)
	search := c.Query("search")
	var channelType *int
	if raw := strings.TrimSpace(c.Query("channel_type")); raw != "" {
		value, err := strconv.Atoi(raw)
		if err != nil {
			common.ApiError(c, err)
			return
		}
		channelType = &value
	}
	var enabled *bool
	if raw := strings.TrimSpace(c.Query("enabled")); raw != "" {
		value, err := strconv.ParseBool(raw)
		if err != nil {
			common.ApiError(c, err)
			return
		}
		enabled = &value
	}

	monitors, total, err := model.ListChannelTypeMonitors(model.ChannelTypeMonitorListParams{
		Offset:      pageInfo.GetStartIdx(),
		Limit:       pageInfo.GetPageSize(),
		Search:      search,
		ChannelType: channelType,
		Enabled:     enabled,
	})
	if err != nil {
		common.ApiError(c, err)
		return
	}

	items := make([]channelTypeMonitorResponse, 0, len(monitors))
	for _, monitor := range monitors {
		items = append(items, channelTypeMonitorToResponse(monitor))
	}
	common.ApiSuccess(c, gin.H{
		"items":     items,
		"total":     total,
		"page":      pageInfo.GetPage(),
		"page_size": pageInfo.GetPageSize(),
	})
}

func GetChannelTypeMonitor(c *gin.Context) {
	id, ok := parseChannelTypeMonitorId(c)
	if !ok {
		return
	}
	monitor, err := model.GetChannelTypeMonitorById(id)
	if err != nil {
		common.ApiError(c, err)
		return
	}
	common.ApiSuccess(c, channelTypeMonitorToResponse(monitor))
}

func CreateChannelTypeMonitor(c *gin.Context) {
	var req channelTypeMonitorRequest
	if err := common.UnmarshalBodyReusable(c, &req); err != nil {
		common.ApiError(c, err)
		return
	}
	if err := validateChannelTypeMonitorRequest(req); err != nil {
		common.ApiError(c, err)
		return
	}

	monitor := &model.ChannelTypeMonitor{
		ChannelType:     req.ChannelType,
		GroupName:       normalizeChannelTypeMonitorGroupName(req.GroupName, req.ChannelType),
		APIURL:          normalizeChannelTypeMonitorURL(req.APIURL),
		TestModel:       normalizeChannelTypeMonitorModel(req.TestModel),
		Enabled:         req.Enabled,
		IntervalSeconds: normalizeChannelTypeMonitorInterval(req.IntervalSeconds),
	}
	if req.APIKey != nil {
		monitor.APIKey = normalizeChannelTypeMonitorKey(*req.APIKey)
	}
	if err := model.CreateChannelTypeMonitor(monitor); err != nil {
		common.ApiError(c, err)
		return
	}
	common.ApiSuccess(c, channelTypeMonitorToResponse(monitor))
}

func UpdateChannelTypeMonitor(c *gin.Context) {
	id, ok := parseChannelTypeMonitorId(c)
	if !ok {
		return
	}
	monitor, err := model.GetChannelTypeMonitorById(id)
	if err != nil {
		common.ApiError(c, err)
		return
	}

	var req channelTypeMonitorRequest
	if err := common.UnmarshalBodyReusable(c, &req); err != nil {
		common.ApiError(c, err)
		return
	}
	if req.ChannelType == 0 {
		req.ChannelType = monitor.ChannelType
	}
	if err := validateChannelTypeMonitorRequest(req); err != nil {
		common.ApiError(c, err)
		return
	}
	monitor.ChannelType = req.ChannelType
	monitor.GroupName = normalizeChannelTypeMonitorGroupName(req.GroupName, req.ChannelType)
	monitor.APIURL = normalizeChannelTypeMonitorURL(req.APIURL)
	if req.APIKey != nil {
		if normalized := normalizeChannelTypeMonitorKey(*req.APIKey); normalized != "" {
			monitor.APIKey = normalized
		}
	}
	monitor.TestModel = normalizeChannelTypeMonitorModel(req.TestModel)
	monitor.Enabled = req.Enabled
	monitor.IntervalSeconds = normalizeChannelTypeMonitorInterval(req.IntervalSeconds)
	if err := model.UpdateChannelTypeMonitor(monitor); err != nil {
		common.ApiError(c, err)
		return
	}
	common.ApiSuccess(c, channelTypeMonitorToResponse(monitor))
}

func DeleteChannelTypeMonitor(c *gin.Context) {
	id, ok := parseChannelTypeMonitorId(c)
	if !ok {
		return
	}
	if err := model.DeleteChannelTypeMonitor(id); err != nil {
		common.ApiError(c, err)
		return
	}
	common.ApiSuccess(c, nil)
}

func RunChannelTypeMonitor(c *gin.Context) {
	id, ok := parseChannelTypeMonitorId(c)
	if !ok {
		return
	}
	monitor, err := model.GetChannelTypeMonitorById(id)
	if err != nil {
		common.ApiError(c, err)
		return
	}
	history, err := runChannelTypeMonitorCheck(monitor)
	if err != nil {
		common.ApiError(c, err)
		return
	}
	common.ApiSuccess(c, gin.H{
		"monitor": channelTypeMonitorToResponse(monitor),
		"result":  channelTypeMonitorHistoryToResponse(history),
	})
}

func ListChannelTypeMonitorHistory(c *gin.Context) {
	id, ok := parseChannelTypeMonitorId(c)
	if !ok {
		return
	}
	limit, _ := strconv.Atoi(c.DefaultQuery("limit", "60"))
	histories, err := model.ListChannelTypeMonitorHistory(id, limit)
	if err != nil {
		common.ApiError(c, err)
		return
	}
	items := make([]channelTypeMonitorHistoryResponse, 0, len(histories))
	for _, history := range histories {
		items = append(items, channelTypeMonitorHistoryToResponse(history))
	}
	common.ApiSuccess(c, gin.H{"items": items})
}

func parseChannelTypeMonitorId(c *gin.Context) (int, bool) {
	id, err := strconv.Atoi(c.Param("id"))
	if err != nil || id <= 0 {
		common.ApiError(c, fmt.Errorf("invalid monitor id"))
		return 0, false
	}
	return id, true
}

func runChannelTypeMonitorCheck(monitor *model.ChannelTypeMonitor) (*model.ChannelTypeMonitorHistory, error) {
	channel, err := pickChannelForMonitor(monitor.ChannelType)
	now := common.GetTimestamp()
	if err != nil {
		history := &model.ChannelTypeMonitorHistory{
			MonitorId: monitor.Id,
			Status:    model.ChannelTypeMonitorStatusError,
			Message:   err.Error(),
			CheckedAt: now,
		}
		if createErr := model.CreateChannelTypeMonitorHistory(history); createErr != nil {
			return nil, createErr
		}
		updateMonitorWithHistory(monitor, history)
		return history, nil
	}
	channel = applyMonitorOverrides(channel, monitor)

	tik := time.Now()
	isStream := false
	apiType, _ := common.ChannelType2APIType(channel.Type)
	if apiType == constant.APITypeOpenAI || apiType == constant.APITypeCodex {
		isStream = true
	}
	testModel := resolveMonitorModel(channel, monitor)
	result := testChannel(channel, testModel, "", isStream)
	latencyMs := int(time.Since(tik).Milliseconds())
	status := model.ChannelTypeMonitorStatusOperational
	message := ""
	if result.localErr != nil {
		status = model.ChannelTypeMonitorStatusFailed
		message = result.localErr.Error()
	} else if result.newAPIError != nil {
		status = model.ChannelTypeMonitorStatusFailed
		message = result.newAPIError.Error()
	}
	if message == "" {
		message = "ok"
	}

	history := &model.ChannelTypeMonitorHistory{
		MonitorId:   monitor.Id,
		ChannelId:   channel.Id,
		ChannelName: channel.Name,
		Model:       testModel,
		Status:      status,
		LatencyMs:   latencyMs,
		Message:     message,
		CheckedAt:   now,
	}
	if err := model.CreateChannelTypeMonitorHistory(history); err != nil {
		return nil, err
	}
	updateMonitorWithHistory(monitor, history)
	if status == model.ChannelTypeMonitorStatusOperational {
		channel.UpdateResponseTime(int64(latencyMs))
	}
	return history, nil
}

func applyMonitorOverrides(channel *model.Channel, monitor *model.ChannelTypeMonitor) *model.Channel {
	clone := *channel
	if apiURL := normalizeChannelTypeMonitorURL(monitor.APIURL); apiURL != "" {
		clone.BaseURL = &apiURL
	}
	if apiKey := normalizeChannelTypeMonitorKey(monitor.APIKey); apiKey != "" {
		clone.Key = apiKey
		clone.Keys = nil
		clone.ChannelInfo.IsMultiKey = false
	}
	if testModel := normalizeChannelTypeMonitorModel(monitor.TestModel); testModel != "" {
		clone.TestModel = &testModel
	}
	return &clone
}

func pickChannelForMonitor(channelType int) (*model.Channel, error) {
	var channel model.Channel
	err := model.DB.
		Where("type = ? AND status = ?", channelType, common.ChannelStatusEnabled).
		Order("priority desc, response_time asc, id asc").
		First(&channel).Error
	if errors.Is(err, gorm.ErrRecordNotFound) {
		err = model.DB.
			Where("type = ?", channelType).
			Order("priority desc, id asc").
			First(&channel).Error
	}
	if err != nil {
		return nil, err
	}
	return &channel, nil
}

func resolveMonitorModel(channel *model.Channel, monitor *model.ChannelTypeMonitor) string {
	if monitor != nil && strings.TrimSpace(monitor.TestModel) != "" {
		return strings.TrimSpace(monitor.TestModel)
	}
	if channel.TestModel != nil && strings.TrimSpace(*channel.TestModel) != "" {
		return strings.TrimSpace(*channel.TestModel)
	}
	models := channel.GetModels()
	if len(models) > 0 {
		return strings.TrimSpace(models[0])
	}
	return "gpt-4o-mini"
}

func updateMonitorWithHistory(monitor *model.ChannelTypeMonitor, history *model.ChannelTypeMonitorHistory) {
	monitor.LastStatus = history.Status
	monitor.LastMessage = history.Message
	monitor.LastLatencyMs = history.LatencyMs
	monitor.LastCheckedAt = history.CheckedAt
	if err := model.UpdateChannelTypeMonitor(monitor); err != nil {
		common.SysLog(fmt.Sprintf("failed to update channel type monitor %d: %v", monitor.Id, err))
	}
}

var channelTypeMonitorSchedulerOnce sync.Once
var channelTypeMonitorRunLocks sync.Map

func AutomaticallyRunChannelTypeMonitors() {
	if !common.IsMasterNode {
		return
	}
	channelTypeMonitorSchedulerOnce.Do(func() {
		for {
			time.Sleep(30 * time.Second)
			monitors, err := model.ListDueChannelTypeMonitors(common.GetTimestamp())
			if err != nil {
				common.SysLog(fmt.Sprintf("failed to list due channel type monitors: %v", err))
				continue
			}
			for _, monitor := range monitors {
				if !tryLockChannelTypeMonitor(monitor.Id) {
					continue
				}
				go func(m *model.ChannelTypeMonitor) {
					defer unlockChannelTypeMonitor(m.Id)
					_, err := runChannelTypeMonitorCheck(m)
					if err != nil {
						common.SysLog(fmt.Sprintf("failed to run channel type monitor %d: %v", m.Id, err))
					}
				}(monitor)
			}
		}
	})
}

func tryLockChannelTypeMonitor(id int) bool {
	_, loaded := channelTypeMonitorRunLocks.LoadOrStore(id, struct{}{})
	return !loaded
}

func unlockChannelTypeMonitor(id int) {
	channelTypeMonitorRunLocks.Delete(id)
}
