package model

import (
	"strings"

	"github.com/huanxing/huanxing-api/common"
	"github.com/huanxing/huanxing-api/constant"
	"gorm.io/gorm"
)

const (
	ChannelTypeMonitorStatusOperational = "operational"
	ChannelTypeMonitorStatusDegraded    = "degraded"
	ChannelTypeMonitorStatusFailed      = "failed"
	ChannelTypeMonitorStatusError       = "error"
)

type ChannelTypeMonitor struct {
	Id              int    `json:"id"`
	ChannelType     int    `json:"channel_type" gorm:"uniqueIndex;not null"`
	GroupName       string `json:"group_name" gorm:"type:varchar(64);default:''"`
	APIURL          string `json:"api_url" gorm:"column:api_url;type:varchar(2048);default:''"`
	APIKey          string `json:"api_key" gorm:"column:api_key;type:text"`
	TestModel       string `json:"test_model" gorm:"column:test_model;type:varchar(255);default:''"`
	Enabled         bool   `json:"enabled" gorm:"default:true"`
	IntervalSeconds int    `json:"interval_seconds" gorm:"default:600"`
	LastStatus      string `json:"last_status" gorm:"type:varchar(32);default:''"`
	LastMessage     string `json:"last_message" gorm:"type:varchar(1024);default:''"`
	LastLatencyMs   int    `json:"last_latency_ms" gorm:"default:0"`
	LastCheckedAt   int64  `json:"last_checked_at" gorm:"bigint;default:0"`
	CreatedAt       int64  `json:"created_at" gorm:"bigint"`
	UpdatedAt       int64  `json:"updated_at" gorm:"bigint"`
}

type ChannelTypeMonitorHistory struct {
	Id          int    `json:"id"`
	MonitorId   int    `json:"monitor_id" gorm:"index;not null"`
	ChannelId   int    `json:"channel_id" gorm:"index;default:0"`
	Model       string `json:"model" gorm:"type:varchar(255);default:''"`
	Status      string `json:"status" gorm:"type:varchar(32);index;not null"`
	LatencyMs   int    `json:"latency_ms" gorm:"default:0"`
	Message     string `json:"message" gorm:"type:varchar(1024);default:''"`
	CheckedAt   int64  `json:"checked_at" gorm:"bigint;index"`
	ChannelName string `json:"channel_name" gorm:"type:varchar(255);default:''"`
}

type ChannelTypeMonitorListParams struct {
	Offset      int
	Limit       int
	Search      string
	ChannelType *int
	Enabled     *bool
}

func (m *ChannelTypeMonitor) BeforeCreate(tx *gorm.DB) error {
	now := common.GetTimestamp()
	m.CreatedAt = now
	m.UpdatedAt = now
	if strings.TrimSpace(m.GroupName) == "" {
		m.GroupName = constant.GetChannelTypeName(m.ChannelType)
	}
	return nil
}

func (m *ChannelTypeMonitor) BeforeUpdate(tx *gorm.DB) error {
	m.UpdatedAt = common.GetTimestamp()
	return nil
}

func CreateChannelTypeMonitor(monitor *ChannelTypeMonitor) error {
	return DB.Create(monitor).Error
}

func UpdateChannelTypeMonitor(monitor *ChannelTypeMonitor) error {
	monitor.UpdatedAt = common.GetTimestamp()
	return DB.Model(&ChannelTypeMonitor{}).
		Where("id = ?", monitor.Id).
		Updates(map[string]interface{}{
			"channel_type":     monitor.ChannelType,
			"group_name":       monitor.GroupName,
			"api_url":          monitor.APIURL,
			"api_key":          monitor.APIKey,
			"test_model":       monitor.TestModel,
			"enabled":          monitor.Enabled,
			"interval_seconds": monitor.IntervalSeconds,
			"last_status":      monitor.LastStatus,
			"last_message":     monitor.LastMessage,
			"last_latency_ms":  monitor.LastLatencyMs,
			"last_checked_at":  monitor.LastCheckedAt,
			"updated_at":       monitor.UpdatedAt,
		}).Error
}

func DeleteChannelTypeMonitor(id int) error {
	return DB.Transaction(func(tx *gorm.DB) error {
		if err := tx.Where("monitor_id = ?", id).Delete(&ChannelTypeMonitorHistory{}).Error; err != nil {
			return err
		}
		return tx.Delete(&ChannelTypeMonitor{}, id).Error
	})
}

func GetChannelTypeMonitorById(id int) (*ChannelTypeMonitor, error) {
	monitor := &ChannelTypeMonitor{}
	err := DB.First(monitor, "id = ?", id).Error
	if err != nil {
		return nil, err
	}
	return monitor, nil
}

func GetChannelTypeMonitorByChannelType(channelType int) (*ChannelTypeMonitor, error) {
	monitor := &ChannelTypeMonitor{}
	err := DB.First(monitor, "channel_type = ?", channelType).Error
	if err != nil {
		return nil, err
	}
	return monitor, nil
}

func ListChannelTypeMonitors(params ChannelTypeMonitorListParams) ([]*ChannelTypeMonitor, int64, error) {
	query := DB.Model(&ChannelTypeMonitor{})
	if params.ChannelType != nil {
		query = query.Where("channel_type = ?", *params.ChannelType)
	}
	if params.Enabled != nil {
		query = query.Where("enabled = ?", *params.Enabled)
	}
	if strings.TrimSpace(params.Search) != "" {
		keyword := "%" + strings.TrimSpace(params.Search) + "%"
		query = query.Where("group_name LIKE ? OR last_message LIKE ?", keyword, keyword)
	}

	var total int64
	if err := query.Count(&total).Error; err != nil {
		return nil, 0, err
	}

	var monitors []*ChannelTypeMonitor
	listQuery := query.Order("channel_type asc, id desc")
	if params.Limit > 0 {
		listQuery = listQuery.Limit(params.Limit).Offset(params.Offset)
	}
	err := listQuery.Find(&monitors).Error
	return monitors, total, err
}

func ListEnabledChannelTypeMonitors() ([]*ChannelTypeMonitor, error) {
	var monitors []*ChannelTypeMonitor
	err := DB.Where("enabled = ?", true).Order("channel_type asc").Find(&monitors).Error
	return monitors, err
}

func ListDueChannelTypeMonitors(now int64) ([]*ChannelTypeMonitor, error) {
	var monitors []*ChannelTypeMonitor
	err := DB.Where("enabled = ? AND (last_checked_at = ? OR last_checked_at + interval_seconds <= ?)", true, 0, now).
		Order("last_checked_at asc").
		Find(&monitors).Error
	return monitors, err
}

func CreateChannelTypeMonitorHistory(history *ChannelTypeMonitorHistory) error {
	return DB.Create(history).Error
}

func ListChannelTypeMonitorHistory(monitorId int, limit int) ([]*ChannelTypeMonitorHistory, error) {
	if limit <= 0 || limit > 200 {
		limit = 60
	}
	var histories []*ChannelTypeMonitorHistory
	err := DB.Where("monitor_id = ?", monitorId).
		Order("checked_at desc, id desc").
		Limit(limit).
		Find(&histories).Error
	return histories, err
}
