package visionary

import "github.com/huanxing/huanxing-api/common"

type ImageRequest struct {
	Model               string         `json:"model"`
	Prompt              string         `json:"prompt"`
	Images              []string       `json:"images,omitempty"`
	AspectRatio         string         `json:"aspectRatio,omitempty"`
	ReplyType           string         `json:"replyType,omitempty"`
	Quality             string         `json:"quality,omitempty"`
	ImageSize           string         `json:"imageSize,omitempty"`
	OptimizeChineseText *bool          `json:"optimizeChineseText,omitempty"`
	Extra               map[string]any `json:"-"`
}

func (r ImageRequest) MarshalJSON() ([]byte, error) {
	type Alias ImageRequest
	base, err := common.Marshal(Alias(r))
	if err != nil {
		return nil, err
	}

	if len(r.Extra) == 0 {
		return base, nil
	}

	var out map[string]any
	if err := common.Unmarshal(base, &out); err != nil {
		return nil, err
	}
	for key, value := range r.Extra {
		if _, exists := out[key]; !exists {
			out[key] = value
		}
	}
	return common.Marshal(out)
}

type ImageResponse struct {
	ID      string        `json:"id"`
	Status  string        `json:"status"`
	Results []ImageResult `json:"results"`
	Error   any           `json:"error,omitempty"`
}

type ImageResult struct {
	URL           string `json:"url"`
	B64JSON       string `json:"b64_json,omitempty"`
	RevisedPrompt string `json:"revised_prompt,omitempty"`
}
