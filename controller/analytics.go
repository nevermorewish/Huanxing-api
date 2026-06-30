package controller

import (
	"bytes"
	"encoding/csv"
	"fmt"
	"net/http"
	"sort"
	"strconv"
	"strings"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/huanxing/huanxing-api/common"
	"github.com/huanxing/huanxing-api/model"
)

type UserModelUsage struct {
	ModelName    string  `json:"model_name"`
	RequestCount int64   `json:"request_count"`
	TokenCount   int64   `json:"token_count"`
	Consumption  float64 `json:"consumption"`
}

type UserAnalyticsRanking struct {
	Username     string           `json:"username"`
	DisplayName  string           `json:"display_name"`
	Remark       string           `json:"remark"`
	Role         int              `json:"role"`
	RequestCount int64            `json:"request_count"`
	TokenCount   int64            `json:"token_count"`
	Consumption  float64          `json:"consumption"`
	Models       []UserModelUsage `json:"models"`
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

	userIds := extractUserIds(rows)
	usersById := getUsersByIds(userIds)
	modelUsageByUser, err := getUserModelUsage(periodStart, 0, 0, userIds)
	if err != nil {
		common.ApiError(c, err)
		return
	}

	rankings := make([]UserAnalyticsRanking, 0, len(rows))
	for _, row := range rows {
		user := usersById[row.UserId]
		rankings = append(rankings, UserAnalyticsRanking{
			Username:     user.Username,
			DisplayName:  user.DisplayName,
			Remark:       user.Remark,
			Role:         user.Role,
			RequestCount: row.RequestCount,
			TokenCount:   row.TokenCount,
			Consumption:  float64(row.QuotaSum) / common.QuotaPerUnit,
			Models:       modelUsageByUser[row.UserId],
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

// ExportUserAnalytics exports per-user usage statistics within an optional
// [start, end] time range as a UTF-8 (BOM) CSV file that opens directly in
// Excel. One row per user (highest consumption first); the per-model breakdown
// is rendered in a single multi-line "Model Usage" cell, mirroring the
// analytics page. start/end are unix seconds; either may be omitted.
func ExportUserAnalytics(c *gin.Context) {
	start := parseUnixQuery(c.Query("start"))
	end := parseUnixQuery(c.Query("end"))
	lang := c.DefaultQuery("lang", "en")

	// Rows arrive grouped by (user_id, model_name), ordered by user then by
	// per-model quota desc, so each user's models stay sorted by consumption.
	rows, err := getUserModelUsageRows(0, start, end, nil)
	if err != nil {
		common.ApiError(c, err)
		return
	}

	type userAggregate struct {
		UserId       int
		RequestCount int64
		TokenCount   int64
		QuotaSum     int64
		Models       []userModelUsageRow
	}
	aggregates := make([]*userAggregate, 0)
	aggByUser := make(map[int]*userAggregate)
	for _, row := range rows {
		agg := aggByUser[row.UserId]
		if agg == nil {
			agg = &userAggregate{UserId: row.UserId}
			aggByUser[row.UserId] = agg
			aggregates = append(aggregates, agg)
		}
		agg.RequestCount += row.RequestCount
		agg.TokenCount += row.TokenCount
		agg.QuotaSum += row.QuotaSum
		agg.Models = append(agg.Models, row)
	}

	// Highest-consumption users first.
	sort.SliceStable(aggregates, func(i, j int) bool {
		return aggregates[i].QuotaSum > aggregates[j].QuotaSum
	})

	userIds := make([]int, 0, len(aggregates))
	for _, agg := range aggregates {
		if agg.UserId > 0 {
			userIds = append(userIds, agg.UserId)
		}
	}
	usersById := getUsersByIds(userIds)

	buf := &bytes.Buffer{}
	// UTF-8 BOM so Excel renders non-ASCII (e.g. Chinese) correctly.
	buf.WriteString("\xEF\xBB\xBF")
	writer := csv.NewWriter(buf)
	_ = writer.Write(analyticsExportHeaders(lang))
	for _, agg := range aggregates {
		user := usersById[agg.UserId]
		modelLines := make([]string, 0, len(agg.Models))
		for _, m := range agg.Models {
			modelLines = append(modelLines, formatModelUsageLine(
				m.ModelName, m.RequestCount, float64(m.QuotaSum)/common.QuotaPerUnit, lang))
		}
		_ = writer.Write([]string{
			analyticsDisplayName(user),
			user.Remark,
			analyticsRoleLabel(user.Role, lang),
			strconv.FormatInt(agg.RequestCount, 10),
			strconv.FormatInt(agg.TokenCount, 10),
			strconv.FormatFloat(float64(agg.QuotaSum)/common.QuotaPerUnit, 'f', 2, 64),
			strings.Join(modelLines, "\n"),
		})
	}
	writer.Flush()

	filename := fmt.Sprintf("user-analytics-%s.csv", time.Now().Format("20060102-150405"))
	c.Header("Content-Disposition", "attachment; filename="+filename)
	c.Data(http.StatusOK, "text/csv; charset=utf-8", buf.Bytes())
}

// analyticsDisplayName prefers the user's display name, falling back to the
// username when no display name is set.
func analyticsDisplayName(user userAnalyticsUserInfo) string {
	if user.DisplayName != "" {
		return user.DisplayName
	}
	return user.Username
}

// formatModelUsageLine renders one model's usage as "model / N次 / $X.XX",
// matching the analytics page's Model Usage cell.
func formatModelUsageLine(modelName string, requestCount int64, consumption float64, lang string) string {
	unit := ""
	if lang == "zh" {
		unit = "次"
	}
	return fmt.Sprintf("%s / %d%s / $%.2f", modelName, requestCount, unit, consumption)
}

func parseUnixQuery(value string) int64 {
	if value == "" {
		return 0
	}
	n, err := strconv.ParseInt(value, 10, 64)
	if err != nil || n < 0 {
		return 0
	}
	return n
}

func analyticsExportHeaders(lang string) []string {
	if lang == "zh" {
		return []string{"显示名称", "备注", "角色", "请求次数", "Token 数", "消费 ($)", "模型用量"}
	}
	return []string{"Display Name", "Remark", "Role", "Requests", "Tokens", "Consumption ($)", "Model Usage"}
}

func analyticsRoleLabel(role int, lang string) string {
	if lang == "zh" {
		switch role {
		case common.RoleRootUser:
			return "超级管理员"
		case common.RoleAdminUser:
			return "管理员"
		default:
			return "普通用户"
		}
	}
	switch role {
	case common.RoleRootUser:
		return "Root"
	case common.RoleAdminUser:
		return "Admin"
	default:
		return "User"
	}
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

type userModelUsageRow struct {
	UserId       int    `gorm:"column:user_id"`
	ModelName    string `gorm:"column:model_name"`
	RequestCount int64  `gorm:"column:request_count"`
	TokenCount   int64  `gorm:"column:token_count"`
	QuotaSum     int64  `gorm:"column:quota_sum"`
}

// getUserModelUsageRows aggregates consume logs grouped by (user_id, model_name).
// periodStart (when > 0) and start/end (when > 0) bound the time range. When
// userIds is non-empty, results are restricted to those users.
func getUserModelUsageRows(periodStart, start, end int64, userIds []int) ([]userModelUsageRow, error) {
	query := model.LOG_DB.Model(&model.Log{}).
		Select("user_id, model_name, COUNT(*) as request_count, COALESCE(SUM(prompt_tokens + completion_tokens), 0) as token_count, COALESCE(SUM(quota), 0) as quota_sum").
		Where("type = ?", model.LogTypeConsume).
		Group("user_id, model_name").
		Order("user_id ASC, quota_sum DESC")
	if periodStart > 0 {
		query = query.Where("created_at >= ?", periodStart)
	}
	if start > 0 {
		query = query.Where("created_at >= ?", start)
	}
	if end > 0 {
		query = query.Where("created_at <= ?", end)
	}
	if len(userIds) > 0 {
		query = query.Where("user_id IN ?", userIds)
	}

	var rows []userModelUsageRow
	err := query.Find(&rows).Error
	return rows, err
}

func getUserModelUsage(periodStart, start, end int64, userIds []int) (map[int][]UserModelUsage, error) {
	result := make(map[int][]UserModelUsage)
	if len(userIds) == 0 {
		return result, nil
	}
	rows, err := getUserModelUsageRows(periodStart, start, end, userIds)
	if err != nil {
		return nil, err
	}
	for _, row := range rows {
		result[row.UserId] = append(result[row.UserId], UserModelUsage{
			ModelName:    row.ModelName,
			RequestCount: row.RequestCount,
			TokenCount:   row.TokenCount,
			Consumption:  float64(row.QuotaSum) / common.QuotaPerUnit,
		})
	}
	return result, nil
}

type userAnalyticsUserInfo struct {
	Id          int    `gorm:"column:id"`
	Username    string `gorm:"column:username"`
	DisplayName string `gorm:"column:display_name"`
	Remark      string `gorm:"column:remark"`
	Role        int    `gorm:"column:role"`
}

func extractUserIds(rows []userAnalyticsRankingRow) []int {
	userIds := make([]int, 0, len(rows))
	for _, row := range rows {
		if row.UserId > 0 {
			userIds = append(userIds, row.UserId)
		}
	}
	return userIds
}

func getUsersByIds(userIds []int) map[int]userAnalyticsUserInfo {
	usersById := make(map[int]userAnalyticsUserInfo)
	if len(userIds) == 0 {
		return usersById
	}

	var users []userAnalyticsUserInfo
	if err := model.DB.Model(&model.User{}).
		Select("id, username, display_name, remark, role").
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
