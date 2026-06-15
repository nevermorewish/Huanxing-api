package visionary

import (
	"encoding/json"
	"errors"
	"fmt"
	"io"
	"net/http"
	"strings"
	"time"

	"github.com/huanxing/huanxing-api/common"
	appconstant "github.com/huanxing/huanxing-api/constant"
	"github.com/huanxing/huanxing-api/dto"
	"github.com/huanxing/huanxing-api/relay/channel"
	"github.com/huanxing/huanxing-api/relay/channel/openai"
	relaycommon "github.com/huanxing/huanxing-api/relay/common"
	relayconstant "github.com/huanxing/huanxing-api/relay/constant"
	"github.com/huanxing/huanxing-api/service"
	"github.com/huanxing/huanxing-api/types"

	"github.com/gin-gonic/gin"
)

type Adaptor struct {
	openaiAdaptor openai.Adaptor
}

func (a *Adaptor) Init(info *relaycommon.RelayInfo) {
	a.openaiAdaptor.Init(info)
}

func (a *Adaptor) GetRequestURL(info *relaycommon.RelayInfo) (string, error) {
	if info == nil {
		return "", errors.New("visionary adaptor: relay info is nil")
	}
	baseURL := visionaryBaseURL(info)
	if baseURL == "" {
		baseURL = appconstant.ChannelBaseURLs[appconstant.ChannelTypeVisionary]
	}

	switch info.RelayMode {
	case relayconstant.RelayModeImagesGenerations, relayconstant.RelayModeChatCompletions:
		path, err := requestPathForModel(visionaryUpstreamModel(info))
		if err != nil {
			return "", err
		}
		return relaycommon.GetFullRequestURL(baseURL, path, visionaryChannelType(info)), nil
	default:
		return relaycommon.GetFullRequestURL(baseURL, info.RequestURLPath, visionaryChannelType(info)), nil
	}
}

func (a *Adaptor) SetupRequestHeader(c *gin.Context, req *http.Header, info *relaycommon.RelayInfo) error {
	if info == nil {
		return errors.New("visionary adaptor: relay info is nil")
	}
	channel.SetupApiRequestHeader(info, c, req)
	req.Set("Authorization", "Bearer "+info.ApiKey)
	req.Set("Content-Type", "application/json")
	if req.Get("Accept") == "" {
		req.Set("Accept", "application/json")
	}
	return nil
}

func (a *Adaptor) ConvertOpenAIRequest(c *gin.Context, info *relaycommon.RelayInfo, request *dto.GeneralOpenAIRequest) (any, error) {
	if request == nil {
		return nil, errors.New("request is nil")
	}
	if info != nil && info.RelayMode == relayconstant.RelayModeChatCompletions && isVisionaryModel(request.Model) {
		return chatRequestToImageRequest(request)
	}
	return a.openaiAdaptor.ConvertOpenAIRequest(c, info, request)
}

func (a *Adaptor) ConvertImageRequest(_ *gin.Context, info *relaycommon.RelayInfo, request dto.ImageRequest) (any, error) {
	model := strings.TrimSpace(request.Model)
	if model == "" {
		model = strings.TrimSpace(visionaryUpstreamModel(info))
	}
	if model == "" {
		model = ModelGPTImage2
	}
	if info != nil && info.ChannelMeta != nil {
		info.UpstreamModelName = model
	}
	if !isVisionaryModel(model) {
		return nil, fmt.Errorf("visionary image model %q is not supported", model)
	}
	if strings.TrimSpace(request.Prompt) == "" {
		return nil, errors.New("prompt is required")
	}

	out := ImageRequest{
		Model:     visionaryCanonicalModel(model),
		Prompt:    request.Prompt,
		ReplyType: "json",
		Extra:     decodeRawObject(request.ExtraFields),
	}

	if size := strings.TrimSpace(request.Size); size != "" {
		out.AspectRatio = size
	}
	if quality := strings.TrimSpace(request.Quality); quality != "" {
		out.Quality = quality
	}

	out.Extra = mergeVisionaryExtra(out.Extra, request.Extra)
	readStringExtra(out.Extra, "aspectRatio", &out.AspectRatio)
	readStringExtra(out.Extra, "aspect_ratio", &out.AspectRatio)
	readStringExtra(out.Extra, "replyType", &out.ReplyType)
	readStringExtra(out.Extra, "reply_type", &out.ReplyType)
	readStringExtra(out.Extra, "imageSize", &out.ImageSize)
	readStringExtra(out.Extra, "image_size", &out.ImageSize)
	readStringExtra(out.Extra, "resolution", &out.ImageSize)
	readStringExtra(out.Extra, "quality", &out.Quality)
	readStringSliceExtra(out.Extra, "images", &out.Images)
	readBoolExtra(out.Extra, "optimizeChineseText", &out.OptimizeChineseText)
	readBoolExtra(out.Extra, "optimize_chinese_text", &out.OptimizeChineseText)

	if len(request.Image) > 0 && len(out.Images) == 0 {
		out.Images = rawMessageToStringSlice(request.Image)
	}

	if out.AspectRatio == "" {
		out.AspectRatio = "1:1"
	}
	if out.ReplyType == "" {
		out.ReplyType = "json"
	}
	out.ImageSize = normalizeImageSizeForModel(model, out.ImageSize)
	if out.Extra == nil {
		out.Extra = map[string]any{}
	}
	deleteConsumedExtra(out.Extra)
	if len(out.Extra) == 0 {
		out.Extra = nil
	}
	return out, nil
}

func (a *Adaptor) ConvertEmbeddingRequest(c *gin.Context, info *relaycommon.RelayInfo, request dto.EmbeddingRequest) (any, error) {
	return a.openaiAdaptor.ConvertEmbeddingRequest(c, info, request)
}

func (a *Adaptor) ConvertAudioRequest(c *gin.Context, info *relaycommon.RelayInfo, request dto.AudioRequest) (io.Reader, error) {
	return a.openaiAdaptor.ConvertAudioRequest(c, info, request)
}

func (a *Adaptor) ConvertRerankRequest(c *gin.Context, relayMode int, request dto.RerankRequest) (any, error) {
	return a.openaiAdaptor.ConvertRerankRequest(c, relayMode, request)
}

func (a *Adaptor) ConvertOpenAIResponsesRequest(c *gin.Context, info *relaycommon.RelayInfo, request dto.OpenAIResponsesRequest) (any, error) {
	return a.openaiAdaptor.ConvertOpenAIResponsesRequest(c, info, request)
}

func (a *Adaptor) ConvertClaudeRequest(c *gin.Context, info *relaycommon.RelayInfo, request *dto.ClaudeRequest) (any, error) {
	return a.openaiAdaptor.ConvertClaudeRequest(c, info, request)
}

func (a *Adaptor) ConvertGeminiRequest(c *gin.Context, info *relaycommon.RelayInfo, request *dto.GeminiChatRequest) (any, error) {
	return a.openaiAdaptor.ConvertGeminiRequest(c, info, request)
}

func (a *Adaptor) DoRequest(c *gin.Context, info *relaycommon.RelayInfo, requestBody io.Reader) (any, error) {
	return channel.DoApiRequest(a, c, info, requestBody)
}

func (a *Adaptor) DoResponse(c *gin.Context, resp *http.Response, info *relaycommon.RelayInfo) (usage any, err *types.NewAPIError) {
	if info != nil {
		switch info.RelayMode {
		case relayconstant.RelayModeImagesGenerations:
			return visionaryImageHandler(c, resp, info)
		case relayconstant.RelayModeChatCompletions:
			if isVisionaryModel(visionaryUpstreamModel(info)) {
				return visionaryChatHandler(c, resp, info)
			}
		}
	}
	return a.openaiAdaptor.DoResponse(c, resp, info)
}

func (a *Adaptor) GetModelList() []string {
	return ModelList
}

func (a *Adaptor) GetChannelName() string {
	return ChannelName
}

func requestPathForModel(model string) (string, error) {
	switch visionaryCanonicalModel(model) {
	case "", ModelGPTImage2:
		return pathGPTImage2, nil
	case ModelNanoBananaPro, ModelNanoBananaProCL:
		return pathNanoBanana, nil
	default:
		return "", fmt.Errorf("visionary image model %q is not supported", model)
	}
}

func isVisionaryModel(model string) bool {
	switch normalizedVisionaryModel(model) {
	case ModelGPTImage2, ModelNanoBananaPro, ModelNanoBananaProCL:
		return true
	case ModelNanoBanana2, ModelNanoBanana22K, ModelNanoBanana24K:
		return true
	default:
		return false
	}
}

func normalizedVisionaryModel(model string) string {
	return strings.ToLower(strings.TrimSpace(model))
}

func visionaryCanonicalModel(model string) string {
	switch normalizedVisionaryModel(model) {
	case ModelNanoBanana2, ModelNanoBanana22K, ModelNanoBanana24K:
		return ModelNanoBananaPro
	default:
		return normalizedVisionaryModel(model)
	}
}

func defaultImageSizeForModel(model string) string {
	switch normalizedVisionaryModel(model) {
	case ModelNanoBananaPro, ModelNanoBananaProCL, ModelNanoBanana2:
		return "2K"
	case ModelNanoBanana22K:
		return "2K"
	case ModelNanoBanana24K:
		return "4K"
	default:
		return ""
	}
}

func normalizeImageSizeForModel(model string, imageSize string) string {
	normalizedSize := strings.ToUpper(strings.TrimSpace(imageSize))
	switch normalizedVisionaryModel(model) {
	case ModelNanoBananaPro, ModelNanoBananaProCL, ModelNanoBanana2, ModelNanoBanana22K, ModelNanoBanana24K:
		if normalizedSize == "" || normalizedSize == "1K" {
			return defaultImageSizeForModel(model)
		}
		return normalizedSize
	default:
		return strings.TrimSpace(imageSize)
	}
}

func chatRequestToImageRequest(request *dto.GeneralOpenAIRequest) (*ImageRequest, error) {
	prompt, images := extractPromptAndImages(request.Messages)
	if prompt == "" {
		if p, ok := request.Prompt.(string); ok {
			prompt = strings.TrimSpace(p)
		}
	}
	if prompt == "" {
		return nil, errors.New("prompt is required")
	}

	out := &ImageRequest{
		Model:       request.Model,
		Prompt:      prompt,
		Images:      images,
		AspectRatio: strings.TrimSpace(request.Size),
		ReplyType:   "json",
	}
	if out.AspectRatio == "" {
		out.AspectRatio = "1:1"
	}
	return out, nil
}

func extractPromptAndImages(messages []dto.Message) (string, []string) {
	var prompt string
	var images []string
	for i := len(messages) - 1; i >= 0; i-- {
		if messages[i].Role != "user" {
			continue
		}
		parts := messages[i].ParseContent()
		var textParts []string
		for _, part := range parts {
			switch part.Type {
			case dto.ContentTypeText:
				if strings.TrimSpace(part.Text) != "" {
					textParts = append(textParts, strings.TrimSpace(part.Text))
				}
			case dto.ContentTypeImageURL:
				if image := part.GetImageMedia(); image != nil && strings.TrimSpace(image.Url) != "" {
					images = append(images, strings.TrimSpace(image.Url))
				}
			}
		}
		prompt = strings.TrimSpace(strings.Join(textParts, "\n"))
		if prompt == "" {
			prompt = strings.TrimSpace(messages[i].StringContent())
		}
		break
	}
	return prompt, images
}

func visionaryImageHandler(c *gin.Context, resp *http.Response, info *relaycommon.RelayInfo) (*dto.Usage, *types.NewAPIError) {
	responseBody, err := io.ReadAll(resp.Body)
	if err != nil {
		return nil, types.NewOpenAIError(err, types.ErrorCodeReadResponseBodyFailed, http.StatusInternalServerError)
	}
	service.CloseResponseBodyGracefully(resp)

	imageResp, openaiResp, newAPIError := normalizeVisionaryImageResponse(responseBody, info)
	if newAPIError != nil {
		return nil, newAPIError
	}

	jsonResp, err := common.Marshal(openaiResp)
	if err != nil {
		return nil, types.NewError(err, types.ErrorCodeBadResponseBody)
	}

	service.IOCopyBytesGracefully(c, resp, jsonResp)

	usage := &dto.Usage{}
	if len(imageResp.Results) > 0 {
		usage.PromptTokens = len(imageResp.Results)
		usage.TotalTokens = len(imageResp.Results)
	}
	return usage, nil
}

func visionaryChatHandler(c *gin.Context, resp *http.Response, info *relaycommon.RelayInfo) (*dto.Usage, *types.NewAPIError) {
	responseBody, err := io.ReadAll(resp.Body)
	if err != nil {
		return nil, types.NewOpenAIError(err, types.ErrorCodeReadResponseBodyFailed, http.StatusInternalServerError)
	}
	service.CloseResponseBodyGracefully(resp)

	imageResp, _, newAPIError := normalizeVisionaryImageResponse(responseBody, info)
	if newAPIError != nil {
		return nil, newAPIError
	}

	content := visionaryResultsMarkdown(imageResp.Results)
	created := time.Now().Unix()
	if info != nil && !info.StartTime.IsZero() {
		created = info.StartTime.Unix()
	}
	promptTokens := 0
	model := ""
	if info != nil && info.ChannelMeta != nil {
		promptTokens = info.GetEstimatePromptTokens()
		model = info.UpstreamModelName
	}
	if model == "" {
		model = imageResp.ID
	}
	if model == "" {
		model = ChannelName
	}
	if created == 0 {
		created = time.Now().Unix()
	}
	usage := &dto.Usage{
		PromptTokens:     promptTokens,
		CompletionTokens: len(imageResp.Results),
		TotalTokens:      promptTokens + len(imageResp.Results),
	}
	chatResp := dto.OpenAITextResponse{
		Id:      imageResp.ID,
		Object:  "chat.completion",
		Created: created,
		Model:   model,
		Choices: []dto.OpenAITextResponseChoice{
			{
				Index: 0,
				Message: dto.Message{
					Role:    "assistant",
					Content: content,
				},
				FinishReason: "stop",
			},
		},
		Usage: *usage,
	}
	if chatResp.Id == "" {
		chatResp.Id = fmt.Sprintf("chatcmpl-visionary-%d", created)
	}

	jsonResp, err := common.Marshal(chatResp)
	if err != nil {
		return nil, types.NewError(err, types.ErrorCodeBadResponseBody)
	}
	service.IOCopyBytesGracefully(c, resp, jsonResp)
	return usage, nil
}

func visionaryBaseURL(info *relaycommon.RelayInfo) string {
	if info == nil || info.ChannelMeta == nil {
		return ""
	}
	return strings.TrimSpace(info.ChannelBaseUrl)
}

func visionaryUpstreamModel(info *relaycommon.RelayInfo) string {
	if info == nil || info.ChannelMeta == nil {
		return ""
	}
	return strings.TrimSpace(info.UpstreamModelName)
}

func visionaryChannelType(info *relaycommon.RelayInfo) int {
	if info == nil || info.ChannelMeta == nil {
		return appconstant.ChannelTypeVisionary
	}
	return info.ChannelType
}

func normalizeVisionaryImageResponse(responseBody []byte, info *relaycommon.RelayInfo) (*ImageResponse, *dto.ImageResponse, *types.NewAPIError) {
	var imageResp ImageResponse
	if err := common.Unmarshal(responseBody, &imageResp); err != nil {
		return nil, nil, types.NewOpenAIError(err, types.ErrorCodeBadResponseBody, http.StatusInternalServerError)
	}
	if imageResp.Error != nil {
		return nil, nil, types.WithOpenAIError(types.OpenAIError{
			Message: visionaryErrorMessage(imageResp.Error),
			Type:    "visionary_error",
			Code:    "visionary_error",
		}, http.StatusBadGateway)
	}
	if strings.TrimSpace(imageResp.Status) != "" && !strings.EqualFold(imageResp.Status, "succeeded") {
		return nil, nil, types.WithOpenAIError(types.OpenAIError{
			Message: fmt.Sprintf("visionary generation status: %s", imageResp.Status),
			Type:    "visionary_error",
			Code:    imageResp.Status,
		}, http.StatusBadGateway)
	}

	created := time.Now().Unix()
	if info != nil && !info.StartTime.IsZero() {
		created = info.StartTime.Unix()
	}
	openaiResp := &dto.ImageResponse{
		Created: created,
	}
	for _, result := range imageResp.Results {
		if strings.TrimSpace(result.URL) == "" && strings.TrimSpace(result.B64JSON) == "" {
			continue
		}
		openaiResp.Data = append(openaiResp.Data, dto.ImageData{
			Url:           result.URL,
			B64Json:       result.B64JSON,
			RevisedPrompt: result.RevisedPrompt,
		})
	}
	return &imageResp, openaiResp, nil
}

func visionaryErrorMessage(errValue any) string {
	switch value := errValue.(type) {
	case string:
		return value
	case map[string]any:
		if msg := common.Interface2String(value["message"]); msg != "" {
			return msg
		}
		if msg := common.Interface2String(value["error"]); msg != "" {
			return msg
		}
	}
	return fmt.Sprintf("%v", errValue)
}

func visionaryResultsMarkdown(results []ImageResult) string {
	urls := make([]string, 0, len(results))
	for _, result := range results {
		if strings.TrimSpace(result.URL) != "" {
			urls = append(urls, strings.TrimSpace(result.URL))
		}
	}
	if len(urls) == 0 {
		return ""
	}
	if len(urls) == 1 {
		return urls[0]
	}
	for i, url := range urls {
		urls[i] = fmt.Sprintf("%d. %s", i+1, url)
	}
	return strings.Join(urls, "\n")
}

func decodeRawObject(raw []byte) map[string]any {
	if len(raw) == 0 {
		return nil
	}
	var out map[string]any
	if err := common.Unmarshal(raw, &out); err != nil {
		return nil
	}
	return out
}

func mergeVisionaryExtra(target map[string]any, source map[string]json.RawMessage) map[string]any {
	if len(source) == 0 {
		return target
	}
	if target == nil {
		target = map[string]any{}
	}
	for key, raw := range source {
		if _, exists := target[key]; exists {
			continue
		}
		var value any
		if err := common.Unmarshal(raw, &value); err == nil {
			target[key] = value
		}
	}
	return target
}

func readStringExtra(extra map[string]any, key string, target *string) {
	if len(extra) == 0 || target == nil {
		return
	}
	if value, ok := extra[key]; ok {
		if str := strings.TrimSpace(common.Interface2String(value)); str != "" {
			*target = str
		}
	}
}

func readStringSliceExtra(extra map[string]any, key string, target *[]string) {
	if len(extra) == 0 || target == nil {
		return
	}
	value, ok := extra[key]
	if !ok {
		return
	}
	switch typed := value.(type) {
	case []string:
		*target = append(*target, typed...)
	case []any:
		for _, item := range typed {
			if str := strings.TrimSpace(common.Interface2String(item)); str != "" {
				*target = append(*target, str)
			}
		}
	case string:
		if str := strings.TrimSpace(typed); str != "" {
			*target = append(*target, str)
		}
	}
}

func readBoolExtra(extra map[string]any, key string, target **bool) {
	if len(extra) == 0 || target == nil {
		return
	}
	value, ok := extra[key]
	if !ok {
		return
	}
	if boolValue, ok := value.(bool); ok {
		*target = &boolValue
	}
}

func rawMessageToStringSlice(raw []byte) []string {
	if len(raw) == 0 {
		return nil
	}
	var items []string
	if err := common.Unmarshal(raw, &items); err == nil {
		return compactStrings(items)
	}
	var item string
	if err := common.Unmarshal(raw, &item); err == nil && strings.TrimSpace(item) != "" {
		return []string{strings.TrimSpace(item)}
	}
	return nil
}

func compactStrings(items []string) []string {
	out := make([]string, 0, len(items))
	for _, item := range items {
		if str := strings.TrimSpace(item); str != "" {
			out = append(out, str)
		}
	}
	return out
}

func deleteConsumedExtra(extra map[string]any) {
	for _, key := range []string{
		"aspectRatio",
		"aspect_ratio",
		"replyType",
		"reply_type",
		"imageSize",
		"image_size",
		"resolution",
		"quality",
		"images",
		"optimizeChineseText",
		"optimize_chinese_text",
	} {
		delete(extra, key)
	}
}
