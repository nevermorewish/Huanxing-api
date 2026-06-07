package sora

import (
	"encoding/json"
	"strings"
	"testing"

	"github.com/huanxing/huanxing-api/model"
	"github.com/huanxing/huanxing-api/relay/channel/task/taskcommon"
	"github.com/huanxing/huanxing-api/setting/system_setting"

	"github.com/tidwall/gjson"
)

// ConvertToOpenAIVideo 必须把客户端 ID 换成公开的 task_xxxx，并在上游返回直链 CDN
// 地址（metadata.url）时改写为本网关代理地址，避免泄露上游供应商、绕过网关。
func TestConvertToOpenAIVideo(t *testing.T) {
	const publicTaskID = "task_PUBLIC123"
	proxyURL := taskcommon.BuildProxyURL(publicTaskID)

	tests := []struct {
		name        string
		data        string
		wantMetaURL string // 期望的 metadata.url；空串表示该字段不应存在
	}{
		{
			name:        "上游直链应改写为网关代理地址",
			data:        `{"id":"task_UPSTREAM","object":"video","status":"completed","metadata":{"url":"https://upload.apib.ai/f/video/abc.mp4"}}`,
			wantMetaURL: proxyURL,
		},
		{
			name:        "无 metadata.url 时不应注入",
			data:        `{"id":"task_UPSTREAM","object":"video","status":"completed"}`,
			wantMetaURL: "",
		},
		{
			name:        "已是网关代理地址不应二次改写",
			data:        `{"id":"task_UPSTREAM","object":"video","status":"completed","metadata":{"url":"` + proxyURL + `"}}`,
			wantMetaURL: proxyURL,
		},
		{
			name:        "data 直链地址应改写",
			data:        `{"id":"task_UPSTREAM","metadata":{"url":"http://cdn.example.com/v.mp4"}}`,
			wantMetaURL: proxyURL,
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
			// 改写后绝不能再出现上游域名。
			if strings.Contains(meta.String(), "apib.ai") {
				t.Errorf("metadata.url still leaks upstream host: %q", meta.String())
			}
		})
	}

	// 兜底确认默认 ServerAddress 下代理地址形如 .../v1/videos/<id>/content。
	if !strings.HasSuffix(proxyURL, "/v1/videos/"+publicTaskID+"/content") {
		t.Fatalf("unexpected proxy URL shape: %q (ServerAddress=%q)", proxyURL, system_setting.ServerAddress)
	}
}
