package controller

import (
	"bytes"
	"net/http"
	"net/http/httptest"
	"testing"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/glebarez/sqlite"
	"github.com/huanxing/huanxing-api/common"
	"github.com/huanxing/huanxing-api/dto"
	"github.com/huanxing/huanxing-api/model"
	relaycommon "github.com/huanxing/huanxing-api/relay/common"
	"github.com/huanxing/huanxing-api/types"
	"gorm.io/gorm"
)

func TestUpdateChannelTypeMonitorPersistsOverrides(t *testing.T) {
	gin.SetMode(gin.TestMode)

	db, err := gorm.Open(sqlite.Open(":memory:"), &gorm.Config{})
	if err != nil {
		t.Fatalf("open sqlite: %v", err)
	}
	originalDB := model.DB
	model.DB = db
	t.Cleanup(func() {
		model.DB = originalDB
	})

	if err := model.DB.AutoMigrate(&model.ChannelTypeMonitor{}, &model.ChannelTypeMonitorHistory{}); err != nil {
		t.Fatalf("auto migrate: %v", err)
	}
	monitor := &model.ChannelTypeMonitor{
		ChannelType:     1,
		GroupName:       "Codex",
		Enabled:         true,
		IntervalSeconds: 600,
	}
	if err := model.CreateChannelTypeMonitor(monitor); err != nil {
		t.Fatalf("create monitor: %v", err)
	}

	router := gin.New()
	router.PUT("/api/admin/channel-type-monitors/:id", UpdateChannelTypeMonitor)

	body := []byte(`{
		"channel_type": 1,
		"group_name": "Codex",
		"api_url": "https://example.com/v1/",
		"api_key": "sk-test",
		"test_model": "gpt-test",
		"enabled": true,
		"interval_seconds": 600
	}`)
	req := httptest.NewRequest(http.MethodPut, "/api/admin/channel-type-monitors/1", bytes.NewReader(body))
	req.Header.Set("Content-Type", "application/json")
	rec := httptest.NewRecorder()
	router.ServeHTTP(rec, req)

	if rec.Code != http.StatusOK {
		t.Fatalf("status = %d, body = %s", rec.Code, rec.Body.String())
	}
	var res struct {
		Success bool   `json:"success"`
		Message string `json:"message"`
		Data    struct {
			APIURL    string `json:"api_url"`
			HasAPIKey bool   `json:"has_api_key"`
			TestModel string `json:"test_model"`
		} `json:"data"`
	}
	if err := common.Unmarshal(rec.Body.Bytes(), &res); err != nil {
		t.Fatalf("unmarshal response: %v", err)
	}
	if !res.Success {
		t.Fatalf("response failed: %s", res.Message)
	}
	if res.Data.APIURL != "https://example.com/v1" || !res.Data.HasAPIKey || res.Data.TestModel != "gpt-test" {
		t.Fatalf("unexpected response data: %+v", res.Data)
	}

	saved, err := model.GetChannelTypeMonitorById(monitor.Id)
	if err != nil {
		t.Fatalf("get monitor: %v", err)
	}
	if saved.APIURL != "https://example.com/v1" {
		t.Fatalf("api_url = %q", saved.APIURL)
	}
	if saved.APIKey != "sk-test" {
		t.Fatalf("api_key = %q", saved.APIKey)
	}
	if saved.TestModel != "gpt-test" {
		t.Fatalf("test_model = %q", saved.TestModel)
	}
}

func TestChannelTypeMonitorSkipsModelTestConsumeLog(t *testing.T) {
	gin.SetMode(gin.TestMode)

	db, err := gorm.Open(sqlite.Open(":memory:"), &gorm.Config{})
	if err != nil {
		t.Fatalf("open sqlite: %v", err)
	}
	originalDB := model.DB
	originalLogDB := model.LOG_DB
	originalRedisEnabled := common.RedisEnabled
	model.DB = db
	model.LOG_DB = db
	common.RedisEnabled = false
	t.Cleanup(func() {
		model.DB = originalDB
		model.LOG_DB = originalLogDB
		common.RedisEnabled = originalRedisEnabled
	})

	if err := model.DB.AutoMigrate(&model.User{}, &model.Log{}); err != nil {
		t.Fatalf("auto migrate: %v", err)
	}
	if err := model.DB.Create(&model.User{Id: 1, Username: "root"}).Error; err != nil {
		t.Fatalf("create user: %v", err)
	}

	ctx, _ := gin.CreateTestContext(httptest.NewRecorder())
	ctx.Request = httptest.NewRequest(http.MethodPost, "/v1/chat/completions", nil)
	ctx.Set("username", "root")
	now := time.Now()
	info := &relaycommon.RelayInfo{
		OriginModelName:   "gpt-test",
		UsingGroup:        "default",
		StartTime:         now,
		FirstResponseTime: now,
		ChannelMeta:       &relaycommon.ChannelMeta{},
	}
	channel := &model.Channel{Id: 123}
	usage := &dto.Usage{PromptTokens: 1, CompletionTokens: 1, TotalTokens: 2}

	recordChannelTestConsumeLog(ctx, channel, info, types.PriceData{}, usage, nil, 0, 1, channelTestOptions{
		skipConsumeLog: true,
	})

	var count int64
	if err := model.LOG_DB.Model(&model.Log{}).Where("token_name = ?", "模型测试").Count(&count).Error; err != nil {
		t.Fatalf("count skipped logs: %v", err)
	}
	if count != 0 {
		t.Fatalf("expected no model test logs, got %d", count)
	}

	recordChannelTestConsumeLog(ctx, channel, info, types.PriceData{}, usage, nil, 0, 1, channelTestOptions{})

	if err := model.LOG_DB.Model(&model.Log{}).Where("token_name = ?", "模型测试").Count(&count).Error; err != nil {
		t.Fatalf("count recorded logs: %v", err)
	}
	if count != 1 {
		t.Fatalf("expected one model test log, got %d", count)
	}
}
