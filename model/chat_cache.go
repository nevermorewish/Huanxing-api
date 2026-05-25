package model

import (
	"bytes"
	"io"
	"net/http"
	"strings"

	"github.com/huanxing/huanxing-api/common"

	"github.com/gin-gonic/gin"
)

type ChatCache struct {
	ID                  int    `json:"id" gorm:"primaryKey"`
	Model               string `json:"model" gorm:"type:varchar(128);not null;index"`
	UserId              int    `json:"user_id" gorm:"type:bigint;not null;index"`
	Username            string `json:"username" gorm:"type:varchar(64);not null;default:'';index"`
	Data                string `json:"data" gorm:"type:text;not null"`
	CreatedAt           int64  `json:"created_at" gorm:"type:bigint;not null;index"`
	ResultStr           string `json:"result_str" gorm:"type:text;not null"`
	LogId               int    `json:"log_id" gorm:"type:bigint;not null;index"`
	TokenKey            string `json:"token_key" gorm:"type:varchar(255);not null;default:''"`
	TokenName           string `json:"token_name" gorm:"type:varchar(255);not null;default:'';index"`
	RequestId           string `json:"request_id,omitempty" gorm:"type:varchar(64);not null;default:'';index"`
	UpstreamRequestId   string `json:"upstream_request_id,omitempty" gorm:"type:varchar(128);not null;default:'';index"`
	ResponseContentType string `json:"response_content_type" gorm:"type:varchar(128);not null;default:''"`
}

type ChatCacheBuilder struct {
	body                bytes.Buffer
	responseContentType string
}

func (b *ChatCacheBuilder) Write(p []byte) (int, error) {
	return b.body.Write(p)
}

func (b *ChatCacheBuilder) ToChatCache(c *gin.Context, logID int) *ChatCache {
	requestBody := ""
	if storage, err := common.GetBodyStorage(c); err == nil && storage != nil {
		if requestBytes, bytesErr := storage.Bytes(); bytesErr == nil {
			requestBody = string(requestBytes)
		}
	} else if value, exists := c.Get(common.KeyRequestBody); exists && value != nil {
		if requestBytes, ok := value.([]byte); ok {
			requestBody = string(requestBytes)
		}
	}

	modelName := c.GetString("original_model")
	if modelName == "" {
		modelName = c.GetString("request_model")
	}

	return &ChatCache{
		Model:               modelName,
		UserId:              c.GetInt("id"),
		Username:            c.GetString("username"),
		Data:                requestBody,
		CreatedAt:           common.GetTimestamp(),
		ResultStr:           b.body.String(),
		LogId:               logID,
		TokenKey:            c.GetString("token_key"),
		TokenName:           c.GetString("token_name"),
		RequestId:           c.GetString(common.RequestIdKey),
		UpstreamRequestId:   c.GetString(common.UpstreamRequestIdKey),
		ResponseContentType: b.responseContentType,
	}
}

func GenCache(_ *gin.Context, httpResp *http.Response, _ int) (*ChatCacheBuilder, error) {
	builder := &ChatCacheBuilder{}
	if httpResp == nil || httpResp.Body == nil {
		return builder, nil
	}

	contentType := httpResp.Header.Get("Content-Type")
	builder.responseContentType = contentType
	if strings.HasPrefix(contentType, "text/event-stream") {
		httpResp.Body = io.NopCloser(io.TeeReader(httpResp.Body, builder))
		return builder, nil
	}

	bodyBytes, err := io.ReadAll(httpResp.Body)
	if closeErr := httpResp.Body.Close(); err == nil && closeErr != nil {
		err = closeErr
	}
	if err != nil {
		return nil, err
	}
	_, _ = builder.Write(bodyBytes)
	httpResp.Body = io.NopCloser(bytes.NewReader(bodyBytes))
	return builder, nil
}

func (cache *ChatCache) Insert() error {
	return DB.Create(cache).Error
}

func GetChatCacheByID(id int) (*ChatCache, error) {
	var cache ChatCache
	err := DB.Where("id = ?", id).First(&cache).Error
	if err != nil {
		return nil, err
	}
	return &cache, nil
}

func GetChatCacheByLogID(logID int) (*ChatCache, error) {
	var cache ChatCache
	err := DB.Where("log_id = ?", logID).Order("id desc").First(&cache).Error
	if err != nil {
		return nil, err
	}
	return &cache, nil
}

func GetChatCaches(startIdx, num int, username, modelName, tokenName, requestId string, logID int, startTimestamp, endTimestamp int64) (logs []*ChatCache, total int64, err error) {
	tx := DB.Model(&ChatCache{})
	tx = applyLogContainsFilter(tx, "username", username)
	tx = applyLogContainsFilter(tx, "model", modelName)
	tx = applyLogContainsFilter(tx, "token_name", tokenName)
	if requestId != "" {
		tx = tx.Where("request_id = ?", requestId)
	}
	if logID > 0 {
		tx = tx.Where("log_id = ?", logID)
	}
	if startTimestamp != 0 {
		tx = tx.Where("created_at >= ?", startTimestamp)
	}
	if endTimestamp != 0 {
		tx = tx.Where("created_at <= ?", endTimestamp)
	}
	if err = tx.Count(&total).Error; err != nil {
		return nil, 0, err
	}
	err = tx.Order("id desc").Limit(num).Offset(startIdx).Find(&logs).Error
	return logs, total, err
}
