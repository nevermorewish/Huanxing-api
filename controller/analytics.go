package controller

import (
	"time"

	"github.com/gin-gonic/gin"
	"github.com/huanxing/huanxing-api/common"
	"github.com/huanxing/huanxing-api/model"
)

type UserAnalyticsRanking struct {
	Username     string  `json:"username"`
	Email        string  `json:"email"`
	Role         int     `json:"role"`
	RequestCount int64   `json:"request_count"`
	TokenCount   int64   `json:"token_count"`
	Consumption  float64 `json:"consumption"`
}

type UserAnalyticsResponse struct {
	TotalUsers       int64                  `json:"total_users"`
	ActiveToday      int64                  `json:"active_today"`
	ActivePeriod     int64                  `json:"active_period"`
	TotalConsumption float64                `json:"total_consumption"`
	Rankings         []UserAnalyticsRanking `json:"rankings"`
}

func GetUserAnalytics(c *gin.Context) {
	periodStart := getAnalyticsPeriodStart(c.DefaultQuery("period", "7d"))
	now := time.Now()
	todayStart := time.Date(now.Year(), now.Month(), now.Day(), 0, 0, 0, 0, now.Location()).Unix()

	var totalUsers int64
	if err := model.DB.Model(&model.User{}).Count(&totalUsers).Error; err != nil {
		common.ApiError(c, err)
		return
	}

	var activeToday int64
	if err := model.LOG_DB.Model(&model.Log{}).
		Where("created_at >= ? AND type = ?", todayStart, model.LogTypeConsume).
		Distinct("user_id").
		Count(&activeToday).Error; err != nil {
		common.ApiError(c, err)
		return
	}

	periodQuery := model.LOG_DB.Model(&model.Log{}).Where("type = ?", model.LogTypeConsume)
	if periodStart > 0 {
		periodQuery = periodQuery.Where("created_at >= ?", periodStart)
	}

	var activePeriod int64
	if err := periodQuery.Distinct("user_id").Count(&activePeriod).Error; err != nil {
		common.ApiError(c, err)
		return
	}

	consumptionQuery := model.LOG_DB.Model(&model.Log{}).Where("type = ?", model.LogTypeConsume)
	if periodStart > 0 {
		consumptionQuery = consumptionQuery.Where("created_at >= ?", periodStart)
	}

	var totalQuota int64
	if err := consumptionQuery.Select("COALESCE(SUM(quota), 0)").Scan(&totalQuota).Error; err != nil {
		common.ApiError(c, err)
		return
	}

	rows, err := getUserAnalyticsRankingRows(periodStart)
	if err != nil {
		common.ApiError(c, err)
		return
	}

	usersById := getUserAnalyticsUsersById(rows)
	rankings := make([]UserAnalyticsRanking, 0, len(rows))
	for _, row := range rows {
		user := usersById[row.UserId]
		rankings = append(rankings, UserAnalyticsRanking{
			Username:     user.Username,
			Email:        user.Email,
			Role:         user.Role,
			RequestCount: row.RequestCount,
			TokenCount:   row.TokenCount,
			Consumption:  float64(row.QuotaSum) / common.QuotaPerUnit,
		})
	}

	common.ApiSuccess(c, UserAnalyticsResponse{
		TotalUsers:       totalUsers,
		ActiveToday:      activeToday,
		ActivePeriod:     activePeriod,
		TotalConsumption: float64(totalQuota) / common.QuotaPerUnit,
		Rankings:         rankings,
	})
}

func getAnalyticsPeriodStart(period string) int64 {
	now := time.Now()
	todayStart := time.Date(now.Year(), now.Month(), now.Day(), 0, 0, 0, 0, now.Location()).Unix()

	switch period {
	case "today":
		return todayStart
	case "30d":
		return now.AddDate(0, 0, -30).Unix()
	case "all":
		return 0
	case "7d":
		fallthrough
	default:
		return now.AddDate(0, 0, -7).Unix()
	}
}

type userAnalyticsRankingRow struct {
	UserId       int   `gorm:"column:user_id"`
	RequestCount int64 `gorm:"column:request_count"`
	TokenCount   int64 `gorm:"column:token_count"`
	QuotaSum     int64 `gorm:"column:quota_sum"`
}

func getUserAnalyticsRankingRows(periodStart int64) ([]userAnalyticsRankingRow, error) {
	query := model.LOG_DB.Model(&model.Log{}).
		Select("user_id, COUNT(*) as request_count, COALESCE(SUM(prompt_tokens + completion_tokens), 0) as token_count, COALESCE(SUM(quota), 0) as quota_sum").
		Where("type = ?", model.LogTypeConsume).
		Group("user_id").
		Order("quota_sum DESC").
		Limit(100)
	if periodStart > 0 {
		query = query.Where("created_at >= ?", periodStart)
	}

	var rows []userAnalyticsRankingRow
	err := query.Find(&rows).Error
	return rows, err
}

type userAnalyticsUserInfo struct {
	Id       int    `gorm:"column:id"`
	Username string `gorm:"column:username"`
	Email    string `gorm:"column:email"`
	Role     int    `gorm:"column:role"`
}

func getUserAnalyticsUsersById(rows []userAnalyticsRankingRow) map[int]userAnalyticsUserInfo {
	userIds := make([]int, 0, len(rows))
	for _, row := range rows {
		if row.UserId > 0 {
			userIds = append(userIds, row.UserId)
		}
	}

	usersById := make(map[int]userAnalyticsUserInfo)
	if len(userIds) == 0 {
		return usersById
	}

	var users []userAnalyticsUserInfo
	if err := model.DB.Model(&model.User{}).
		Select("id, username, email, role").
		Where("id IN ?", userIds).
		Find(&users).Error; err != nil {
		common.SysLog("failed to load analytics users: " + err.Error())
		return usersById
	}
	for _, user := range users {
		usersById[user.Id] = user
	}
	return usersById
}
