package sora

import (
	"encoding/json"
	"testing"

	"github.com/huanxing/huanxing-api/model"

	"github.com/tidwall/gjson"
)

// ConvertToOpenAIVideo 必须把客户端 ID 换成公开的 task_xxxx，并原样透传上游返回的
// metadata.url（真实 CDN 直链），与火山(doubao)行为一致 —— 客户端可直接打开。
// 之前会改写成网关 /content 代理，但该代理按 user_id 隔离，跨用户打开会 404，故取消改写。
func TestConvertToOpenAIVideo(t *testing.T) {
	const publicTaskID = "task_PUBLIC123"

	tests := []struct {
		name        string
		data        string
		wantMetaURL string // 期望的 metadata.url；空串表示该字段不应存在
	}{
		{
			name:        "上游直链应原样透传",
			data:        `{"id":"task_UPSTREAM","object":"video","status":"completed","metadata":{"url":"https://media.pixverse.ai/abc.mp4"}}`,
			wantMetaURL: "https://media.pixverse.ai/abc.mp4",
		},
		{
			name:        "无 metadata.url 时不应注入",
			data:        `{"id":"task_UPSTREAM","object":"video","status":"completed"}`,
			wantMetaURL: "",
		},
	}

	a := &TaskAdaptor{}
	for _, tc := range tests {
		t.Run(tc.name, func(t *testing.T) {
			task := &model.Task{
				TaskID: publicTaskID,
				Data:   json.RawMessage(tc.data),
			}
			out, err := a.ConvertToOpenAIVideo(task)
			if err != nil {
				t.Fatalf("ConvertToOpenAIVideo returned error: %v", err)
			}

			// id 必须替换为对外暴露的公开 ID，不能泄露上游 ID。
			if got := gjson.GetBytes(out, "id").String(); got != publicTaskID {
				t.Errorf("id = %q, want %q", got, publicTaskID)
			}

			meta := gjson.GetBytes(out, "metadata.url")
			if tc.wantMetaURL == "" {
				if meta.Exists() {
					t.Errorf("metadata.url should not exist, got %q", meta.String())
				}
				return
			}
			if got := meta.String(); got != tc.wantMetaURL {
				t.Errorf("metadata.url = %q, want %q", got, tc.wantMetaURL)
			}
		})
	}
}
