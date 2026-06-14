package controller

import (
	"bytes"
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/gin-gonic/gin"
	"github.com/glebarez/sqlite"
	"github.com/huanxing/huanxing-api/common"
	"github.com/huanxing/huanxing-api/model"
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
