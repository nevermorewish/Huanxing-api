package visionary

import (
	"encoding/json"
	"testing"

	"github.com/huanxing/huanxing-api/dto"
	relaycommon "github.com/huanxing/huanxing-api/relay/common"
	relayconstant "github.com/huanxing/huanxing-api/relay/constant"
)

func TestGetRequestURLUsesVisionaryNativePaths(t *testing.T) {
	adaptor := &Adaptor{}
	tests := map[string]string{
		ModelGPTImage2:       "https://visionary.beer/v1/api/generate",
		ModelNanoBananaPro:   "https://visionary.beer/v1/api/nano-banana",
		ModelNanoBananaProCL: "https://visionary.beer/v1/api/nano-banana",
		ModelNanoBanana2:     "https://visionary.beer/v1/api/nano-banana",
		ModelNanoBanana22K:   "https://visionary.beer/v1/api/nano-banana",
		ModelNanoBanana24K:   "https://visionary.beer/v1/api/nano-banana",
	}

	for model, want := range tests {
		got, err := adaptor.GetRequestURL(&relaycommon.RelayInfo{
			RelayMode: relayconstant.RelayModeImagesGenerations,
			ChannelMeta: &relaycommon.ChannelMeta{
				ChannelBaseUrl:    "https://visionary.beer",
				UpstreamModelName: model,
			},
		})
		if err != nil {
			t.Fatalf("GetRequestURL(%q) returned error: %v", model, err)
		}
		if got != want {
			t.Fatalf("GetRequestURL(%q) = %q, want %q", model, got, want)
		}
	}
}

func TestConvertImageRequestAcceptsHuanxingNanoBananaAliases(t *testing.T) {
	adaptor := &Adaptor{}
	converted, err := adaptor.ConvertImageRequest(nil, &relaycommon.RelayInfo{}, dto.ImageRequest{
		Model:   ModelNanoBanana22K,
		Prompt:  "create image",
		Size:    "2048x2048",
		Quality: "high",
		Extra: map[string]json.RawMessage{
			"aspect_ratio": []byte(`"16:9"`),
			"resolution":   []byte(`"4K"`),
		},
	})
	if err != nil {
		t.Fatalf("ConvertImageRequest returned error: %v", err)
	}

	req, ok := converted.(ImageRequest)
	if !ok {
		t.Fatalf("converted request type = %T, want visionary.ImageRequest", converted)
	}
	if req.Model != ModelNanoBananaPro {
		t.Fatalf("Model = %q, want %q", req.Model, ModelNanoBananaPro)
	}
	if req.AspectRatio != "16:9" {
		t.Fatalf("AspectRatio = %q, want 16:9", req.AspectRatio)
	}
	if req.ImageSize != "4K" {
		t.Fatalf("ImageSize = %q, want 4K", req.ImageSize)
	}
	if _, ok := req.Extra["resolution"]; ok {
		t.Fatalf("Extra still contains consumed resolution: %#v", req.Extra)
	}
}

func TestConvertImageRequestDefaultsNanoBananaImageSize(t *testing.T) {
	adaptor := &Adaptor{}
	converted, err := adaptor.ConvertImageRequest(nil, &relaycommon.RelayInfo{}, dto.ImageRequest{
		Model:  ModelNanoBananaPro,
		Prompt: "create image",
		Size:   "16:9",
	})
	if err != nil {
		t.Fatalf("ConvertImageRequest returned error: %v", err)
	}

	req, ok := converted.(ImageRequest)
	if !ok {
		t.Fatalf("converted request type = %T, want visionary.ImageRequest", converted)
	}
	if req.ImageSize != "2K" {
		t.Fatalf("ImageSize = %q, want 2K", req.ImageSize)
	}
}

func TestConvertImageRequestMapsOpenAIFields(t *testing.T) {
	adaptor := &Adaptor{}
	converted, err := adaptor.ConvertImageRequest(nil, &relaycommon.RelayInfo{}, dto.ImageRequest{
		Model:       ModelNanoBananaPro,
		Prompt:      "create image",
		Size:        "16:9",
		Quality:     "high",
		ExtraFields: []byte(`{"imageSize":"2K","images":["https://example.com/input.png"]}`),
	})
	if err != nil {
		t.Fatalf("ConvertImageRequest returned error: %v", err)
	}

	req, ok := converted.(ImageRequest)
	if !ok {
		t.Fatalf("converted request type = %T, want visionary.ImageRequest", converted)
	}
	if req.Model != ModelNanoBananaPro {
		t.Fatalf("Model = %q, want %q", req.Model, ModelNanoBananaPro)
	}
	if req.Prompt != "create image" {
		t.Fatalf("Prompt = %q, want create image", req.Prompt)
	}
	if req.AspectRatio != "16:9" {
		t.Fatalf("AspectRatio = %q, want 16:9", req.AspectRatio)
	}
	if req.Quality != "high" {
		t.Fatalf("Quality = %q, want high", req.Quality)
	}
	if req.ImageSize != "2K" {
		t.Fatalf("ImageSize = %q, want 2K", req.ImageSize)
	}
	if len(req.Images) != 1 || req.Images[0] != "https://example.com/input.png" {
		t.Fatalf("Images = %#v, want input URL", req.Images)
	}
	if req.ReplyType != "json" {
		t.Fatalf("ReplyType = %q, want json", req.ReplyType)
	}
}
