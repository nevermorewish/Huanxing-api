package controller

import (
	"strconv"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/huanxing/huanxing-api/common"
	"github.com/huanxing/huanxing-api/constant"
	"github.com/huanxing/huanxing-api/model"
)

type StatusCheckPoint struct {
	Status        string `json:"status"`
	LatencyMs     *int   `json:"latency_ms,omitempty"`
	PingLatencyMs *int   `json:"ping_latency_ms,omitempty"`
	CheckedAt     string `json:"checked_at"`
	Message       string `json:"message,omitempty"`
}

type StatusStatistics struct {
	SuccessRate      float64 `json:"successRate"`
	OperationalCount int     `json:"operationalCount"`
	TotalChecks      int     `json:"totalChecks"`
}

type StatusProvider struct {
	Id         string             `json:"id"`
	Name       string             `json:"name"`
	Type       string             `json:"type"`
	Model      string             `json:"model"`
	Latest     *StatusCheckPoint  `json:"latest,omitempty"`
	Statistics *StatusStatistics  `json:"statistics,omitempty"`
	Timeline   []StatusCheckPoint `json:"timeline"`
}

type StatusSummary struct {
	Total       int `json:"total"`
	Operational int `json:"operational"`
}

type StatusMetadata struct {
	GeneratedAt time.Time `json:"generatedAt"`
}

type StatusMonitorResponse struct {
	Providers []StatusProvider `json:"providers"`
	Summary   StatusSummary    `json:"summary"`
	Metadata  StatusMetadata   `json:"metadata"`
}

func GetStatusMonitor(c *gin.Context) {
	monitors, err := model.ListEnabledChannelTypeMonitors()
	if err != nil {
		common.ApiError(c, err)
		return
	}

	providers := make([]StatusProvider, 0, len(monitors))
	operational := 0
	for _, monitor := range monitors {
		histories, err := model.ListChannelTypeMonitorHistory(monitor.Id, 60)
		if err != nil {
			common.ApiError(c, err)
			return
		}
		timeline := make([]StatusCheckPoint, 0, len(histories))
		operationalCount := 0
		for _, history := range histories {
			if history.Status == model.ChannelTypeMonitorStatusOperational {
				operationalCount++
			}
			var latency *int
			if history.LatencyMs > 0 {
				latency = &history.LatencyMs
			}
			timeline = append(timeline, StatusCheckPoint{
				Status:    history.Status,
				LatencyMs: latency,
				CheckedAt: time.Unix(history.CheckedAt, 0).Format(time.RFC3339),
				Message:   history.Message,
			})
		}

		var latest *StatusCheckPoint
		if monitor.LastCheckedAt > 0 {
			var latency *int
			if monitor.LastLatencyMs > 0 {
				latency = &monitor.LastLatencyMs
			}
			latest = &StatusCheckPoint{
				Status:    monitor.LastStatus,
				LatencyMs: latency,
				CheckedAt: time.Unix(monitor.LastCheckedAt, 0).Format(time.RFC3339),
				Message:   monitor.LastMessage,
			}
			if monitor.LastStatus == model.ChannelTypeMonitorStatusOperational {
				operational++
			}
		}

		successRate := 0.0
		if len(histories) > 0 {
			successRate = float64(operationalCount) / float64(len(histories)) * 100
		}
		providers = append(providers, StatusProvider{
			Id:     strconv.Itoa(monitor.Id),
			Name:   monitor.GroupName,
			Type:   constant.GetChannelTypeName(monitor.ChannelType),
			Model:  resolveStatusMonitorModel(monitor, histories),
			Latest: latest,
			Statistics: &StatusStatistics{
				SuccessRate:      successRate,
				OperationalCount: operationalCount,
				TotalChecks:      len(histories),
			},
			Timeline: timeline,
		})
	}

	common.ApiSuccess(c, StatusMonitorResponse{
		Providers: providers,
		Summary:   StatusSummary{Total: len(providers), Operational: operational},
		Metadata:  StatusMetadata{GeneratedAt: time.Now()},
	})
}

func resolveStatusMonitorModel(monitor *model.ChannelTypeMonitor, histories []*model.ChannelTypeMonitorHistory) string {
	if monitor.TestModel != "" {
		return monitor.TestModel
	}
	for _, history := range histories {
		if history.Model != "" {
			return history.Model
		}
	}
	return constant.GetChannelTypeName(monitor.ChannelType)
}
