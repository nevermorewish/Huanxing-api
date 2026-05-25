package relay

import (
	"net/http"

	"github.com/huanxing/huanxing-api/common"
	"github.com/huanxing/huanxing-api/logger"
	"github.com/huanxing/huanxing-api/model"

	"github.com/gin-gonic/gin"
)

func beginDetailLogCapture(c *gin.Context, httpResp *http.Response) *model.ChatCacheBuilder {
	if !common.LogDetailEnabled {
		return nil
	}
	builder, err := model.GenCache(c, httpResp, 0)
	if err != nil {
		logger.LogError(c, "failed to capture detail log response: "+err.Error())
		return nil
	}
	return builder
}

func persistDetailLog(c *gin.Context, logID int, builder *model.ChatCacheBuilder) {
	if !common.LogDetailEnabled || builder == nil {
		return
	}
	chatCache := builder.ToChatCache(c, logID)
	if err := chatCache.Insert(); err != nil {
		logger.LogError(c, "failed to insert detail log: "+err.Error())
	}
}
