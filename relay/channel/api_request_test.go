package channel

import (
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/gin-gonic/gin"
	"github.com/huanxing/huanxing-api/dto"
	relaycommon "github.com/huanxing/huanxing-api/relay/common"
	"github.com/huanxing/huanxing-api/types"
	"github.com/stretchr/testify/require"
)

func TestProcessHeaderOverride_ChannelTestSkipsPassthroughRules(t *testing.T) {
	t.Parallel()

	gin.SetMode(gin.TestMode)
	recorder := httptest.NewRecorder()
	ctx, _ := gin.CreateTestContext(recorder)
	ctx.Request = httptest.NewRequest(http.MethodPost, "/v1/chat/completions", nil)
	ctx.Request.Header.Set("X-Trace-Id", "trace-123")

	info := &relaycommon.RelayInfo{
		IsChannelTest: true,
		ChannelMeta: &relaycommon.ChannelMeta{
			HeadersOverride: map[string]any{
				"*": "",
			},
		},
	}

	headers, err := processHeaderOverride(info, ctx)
	require.NoError(t, err)
	require.Empty(t, headers)
}

func TestSetupApiRequestHeader_PassesThroughUserAgent(t *testing.T) {
	t.Parallel()

	gin.SetMode(gin.TestMode)
	recorder := httptest.NewRecorder()
	ctx, _ := gin.CreateTestContext(recorder)
	ctx.Request = httptest.NewRequest(http.MethodPost, "/v1/responses", nil)
	ctx.Request.Header.Set("Content-Type", "application/json")
	ctx.Request.Header.Set("Accept", "application/json")
	ctx.Request.Header.Set("User-Agent", "claude-cli/2.1.156 (external, cli)")

	headers := http.Header{}
	SetupApiRequestHeader(&relaycommon.RelayInfo{}, ctx, &headers)

	require.Equal(t, "application/json", headers.Get("Content-Type"))
	require.Equal(t, "application/json", headers.Get("Accept"))
	require.Equal(t, "claude-cli/2.1.156 (external, cli)", headers.Get("User-Agent"))
}

func TestSetupApiRequestHeader_PassThroughBodyCopiesClientFingerprintHeaders(t *testing.T) {
	t.Parallel()

	gin.SetMode(gin.TestMode)
	recorder := httptest.NewRecorder()
	ctx, _ := gin.CreateTestContext(recorder)
	ctx.Request = httptest.NewRequest(http.MethodPost, "/v1/messages?beta=true", nil)
	ctx.Request.Host = "frogapi.top"
	ctx.Request.Header.Set("Content-Type", "application/json")
	ctx.Request.Header.Set("Accept", "application/json")
	ctx.Request.Header.Set("Accept-Encoding", "gzip, deflate, br, zstd")
	ctx.Request.Header.Set("Content-Length", "97648")
	ctx.Request.Header.Set("User-Agent", "claude-cli/2.1.156 (external, cli)")
	ctx.Request.Header.Set("X-Claude-Code-Session-Id", "e0fd1868-a202-4c08-b5a2-685b502b3baa")
	ctx.Request.Header.Set("X-Stainless-Arch", "x64")
	ctx.Request.Header.Set("X-Stainless-Lang", "js")
	ctx.Request.Header.Set("X-Stainless-OS", "Windows")
	ctx.Request.Header.Set("X-Stainless-Package-Version", "0.94.0")
	ctx.Request.Header.Set("X-Stainless-Retry-Count", "0")
	ctx.Request.Header.Set("X-Stainless-Runtime", "node")
	ctx.Request.Header.Set("X-Stainless-Runtime-Version", "v24.3.0")
	ctx.Request.Header.Set("X-Stainless-Timeout", "600")
	ctx.Request.Header.Set("anthropic-beta", "claude-code-20250219,context-1m-2025-08-07")
	ctx.Request.Header.Set("anthropic-dangerous-direct-browser-access", "true")
	ctx.Request.Header.Set("anthropic-version", "2023-06-01")
	ctx.Request.Header.Set("x-api-key", "client-key")
	ctx.Request.Header.Set("x-app", "cli")

	headers := http.Header{}
	SetupApiRequestHeader(&relaycommon.RelayInfo{
		ChannelMeta: &relaycommon.ChannelMeta{
			ChannelSetting: dto.ChannelSettings{PassThroughBodyEnabled: true},
		},
	}, ctx, &headers)

	require.Equal(t, "application/json", headers.Get("Content-Type"))
	require.Equal(t, "application/json", headers.Get("Accept"))
	require.Equal(t, "claude-cli/2.1.156 (external, cli)", headers.Get("User-Agent"))
	require.Equal(t, "e0fd1868-a202-4c08-b5a2-685b502b3baa", headers.Get("X-Claude-Code-Session-Id"))
	require.Equal(t, "x64", headers.Get("X-Stainless-Arch"))
	require.Equal(t, "js", headers.Get("X-Stainless-Lang"))
	require.Equal(t, "Windows", headers.Get("X-Stainless-OS"))
	require.Equal(t, "0.94.0", headers.Get("X-Stainless-Package-Version"))
	require.Equal(t, "0", headers.Get("X-Stainless-Retry-Count"))
	require.Equal(t, "node", headers.Get("X-Stainless-Runtime"))
	require.Equal(t, "v24.3.0", headers.Get("X-Stainless-Runtime-Version"))
	require.Equal(t, "600", headers.Get("X-Stainless-Timeout"))
	require.Equal(t, "claude-code-20250219,context-1m-2025-08-07", headers.Get("anthropic-beta"))
	require.Equal(t, "true", headers.Get("anthropic-dangerous-direct-browser-access"))
	require.Equal(t, "2023-06-01", headers.Get("anthropic-version"))
	require.Equal(t, "cli", headers.Get("x-app"))
	require.Empty(t, headers.Get("Accept-Encoding"))
	require.Empty(t, headers.Get("Content-Length"))
	require.Empty(t, headers.Get("Host"))
	require.Empty(t, headers.Get("x-api-key"))
}

func TestSetupApiRequestHeader_ClaudeMessagesOnlyStillPassesThroughOpenAIEntryHeaders(t *testing.T) {
	t.Parallel()

	gin.SetMode(gin.TestMode)
	recorder := httptest.NewRecorder()
	ctx, _ := gin.CreateTestContext(recorder)
	ctx.Request = httptest.NewRequest(http.MethodPost, "/v1/chat/completions", nil)
	ctx.Request.Header.Set("Content-Type", "application/json")
	ctx.Request.Header.Set("Accept", "application/json")
	ctx.Request.Header.Set("User-Agent", "openai-client/1.0")
	ctx.Request.Header.Set("X-Stainless-Package-Version", "0.94.0")
	ctx.Request.Header.Set("anthropic-beta", "claude-code-20250219")

	headers := http.Header{}
	SetupApiRequestHeader(&relaycommon.RelayInfo{
		RelayFormat: types.RelayFormatOpenAI,
		ChannelMeta: &relaycommon.ChannelMeta{
			ChannelSetting: dto.ChannelSettings{
				PassThroughBodyEnabled:        true,
				PassThroughClaudeMessagesOnly: true,
			},
		},
	}, ctx, &headers)

	require.Equal(t, "application/json", headers.Get("Content-Type"))
	require.Equal(t, "application/json", headers.Get("Accept"))
	require.Equal(t, "openai-client/1.0", headers.Get("User-Agent"))
	require.Equal(t, "0.94.0", headers.Get("X-Stainless-Package-Version"))
	require.Equal(t, "claude-code-20250219", headers.Get("anthropic-beta"))
}

func TestSetupApiRequestHeader_ClaudeMessagesOnlyPassesThroughClaudeEntry(t *testing.T) {
	t.Parallel()

	gin.SetMode(gin.TestMode)
	recorder := httptest.NewRecorder()
	ctx, _ := gin.CreateTestContext(recorder)
	ctx.Request = httptest.NewRequest(http.MethodPost, "/v1/messages", nil)
	ctx.Request.Header.Set("Content-Type", "application/json")
	ctx.Request.Header.Set("Accept", "application/json")
	ctx.Request.Header.Set("X-Stainless-Package-Version", "0.94.0")
	ctx.Request.Header.Set("anthropic-beta", "claude-code-20250219")

	headers := http.Header{}
	SetupApiRequestHeader(&relaycommon.RelayInfo{
		RelayFormat: types.RelayFormatClaude,
		ChannelMeta: &relaycommon.ChannelMeta{
			ChannelSetting: dto.ChannelSettings{
				PassThroughBodyEnabled:        true,
				PassThroughClaudeMessagesOnly: true,
			},
		},
	}, ctx, &headers)

	require.Equal(t, "application/json", headers.Get("Content-Type"))
	require.Equal(t, "application/json", headers.Get("Accept"))
	require.Equal(t, "0.94.0", headers.Get("X-Stainless-Package-Version"))
	require.Equal(t, "claude-code-20250219", headers.Get("anthropic-beta"))
}

func TestApplyHeaderOverrideToRequest_OverridesUserAgent(t *testing.T) {
	t.Parallel()

	upstreamReq := httptest.NewRequest(http.MethodPost, "https://example.com/v1/responses", nil)
	upstreamReq.Header.Set("User-Agent", "claude-cli/2.1.156 (external, cli)")

	applyHeaderOverrideToRequest(upstreamReq, map[string]string{
		"user-agent": "custom-upstream-agent",
	})

	require.Equal(t, "custom-upstream-agent", upstreamReq.Header.Get("User-Agent"))
}

func TestProcessHeaderOverride_ChannelTestSkipsClientHeaderPlaceholder(t *testing.T) {
	t.Parallel()

	gin.SetMode(gin.TestMode)
	recorder := httptest.NewRecorder()
	ctx, _ := gin.CreateTestContext(recorder)
	ctx.Request = httptest.NewRequest(http.MethodPost, "/v1/chat/completions", nil)
	ctx.Request.Header.Set("X-Trace-Id", "trace-123")

	info := &relaycommon.RelayInfo{
		IsChannelTest: true,
		ChannelMeta: &relaycommon.ChannelMeta{
			HeadersOverride: map[string]any{
				"X-Upstream-Trace": "{client_header:X-Trace-Id}",
			},
		},
	}

	headers, err := processHeaderOverride(info, ctx)
	require.NoError(t, err)
	_, ok := headers["x-upstream-trace"]
	require.False(t, ok)
}

func TestProcessHeaderOverride_NonTestKeepsClientHeaderPlaceholder(t *testing.T) {
	t.Parallel()

	gin.SetMode(gin.TestMode)
	recorder := httptest.NewRecorder()
	ctx, _ := gin.CreateTestContext(recorder)
	ctx.Request = httptest.NewRequest(http.MethodPost, "/v1/chat/completions", nil)
	ctx.Request.Header.Set("X-Trace-Id", "trace-123")

	info := &relaycommon.RelayInfo{
		IsChannelTest: false,
		ChannelMeta: &relaycommon.ChannelMeta{
			HeadersOverride: map[string]any{
				"X-Upstream-Trace": "{client_header:X-Trace-Id}",
			},
		},
	}

	headers, err := processHeaderOverride(info, ctx)
	require.NoError(t, err)
	require.Equal(t, "trace-123", headers["x-upstream-trace"])
}

func TestProcessHeaderOverride_RuntimeOverrideIsFinalHeaderMap(t *testing.T) {
	t.Parallel()

	gin.SetMode(gin.TestMode)
	recorder := httptest.NewRecorder()
	ctx, _ := gin.CreateTestContext(recorder)
	ctx.Request = httptest.NewRequest(http.MethodPost, "/v1/chat/completions", nil)

	info := &relaycommon.RelayInfo{
		IsChannelTest:             false,
		UseRuntimeHeadersOverride: true,
		RuntimeHeadersOverride: map[string]any{
			"x-static":  "runtime-value",
			"x-runtime": "runtime-only",
		},
		ChannelMeta: &relaycommon.ChannelMeta{
			HeadersOverride: map[string]any{
				"X-Static": "legacy-value",
				"X-Legacy": "legacy-only",
			},
		},
	}

	headers, err := processHeaderOverride(info, ctx)
	require.NoError(t, err)
	require.Equal(t, "runtime-value", headers["x-static"])
	require.Equal(t, "runtime-only", headers["x-runtime"])
	_, exists := headers["x-legacy"]
	require.False(t, exists)
}

func TestProcessHeaderOverride_PassthroughSkipsAcceptEncoding(t *testing.T) {
	t.Parallel()

	gin.SetMode(gin.TestMode)
	recorder := httptest.NewRecorder()
	ctx, _ := gin.CreateTestContext(recorder)
	ctx.Request = httptest.NewRequest(http.MethodPost, "/v1/chat/completions", nil)
	ctx.Request.Header.Set("X-Trace-Id", "trace-123")
	ctx.Request.Header.Set("Accept-Encoding", "gzip")

	info := &relaycommon.RelayInfo{
		IsChannelTest: false,
		ChannelMeta: &relaycommon.ChannelMeta{
			HeadersOverride: map[string]any{
				"*": "",
			},
		},
	}

	headers, err := processHeaderOverride(info, ctx)
	require.NoError(t, err)
	require.Equal(t, "trace-123", headers["x-trace-id"])

	_, hasAcceptEncoding := headers["accept-encoding"]
	require.False(t, hasAcceptEncoding)
}

func TestProcessHeaderOverride_PassHeadersTemplateSetsRuntimeHeaders(t *testing.T) {
	t.Parallel()

	gin.SetMode(gin.TestMode)
	recorder := httptest.NewRecorder()
	ctx, _ := gin.CreateTestContext(recorder)
	ctx.Request = httptest.NewRequest(http.MethodPost, "/v1/responses", nil)
	ctx.Request.Header.Set("Originator", "Codex CLI")
	ctx.Request.Header.Set("Session_id", "sess-123")

	info := &relaycommon.RelayInfo{
		IsChannelTest: false,
		RequestHeaders: map[string]string{
			"Originator": "Codex CLI",
			"Session_id": "sess-123",
		},
		ChannelMeta: &relaycommon.ChannelMeta{
			ParamOverride: map[string]any{
				"operations": []any{
					map[string]any{
						"mode":  "pass_headers",
						"value": []any{"Originator", "Session_id", "X-Codex-Beta-Features"},
					},
				},
			},
			HeadersOverride: map[string]any{
				"X-Static": "legacy-value",
			},
		},
	}

	_, err := relaycommon.ApplyParamOverrideWithRelayInfo([]byte(`{"model":"gpt-4.1"}`), info)
	require.NoError(t, err)
	require.True(t, info.UseRuntimeHeadersOverride)
	require.Equal(t, "Codex CLI", info.RuntimeHeadersOverride["originator"])
	require.Equal(t, "sess-123", info.RuntimeHeadersOverride["session_id"])
	_, exists := info.RuntimeHeadersOverride["x-codex-beta-features"]
	require.False(t, exists)
	require.Equal(t, "legacy-value", info.RuntimeHeadersOverride["x-static"])

	headers, err := processHeaderOverride(info, ctx)
	require.NoError(t, err)
	require.Equal(t, "Codex CLI", headers["originator"])
	require.Equal(t, "sess-123", headers["session_id"])
	_, exists = headers["x-codex-beta-features"]
	require.False(t, exists)

	upstreamReq := httptest.NewRequest(http.MethodPost, "https://example.com/v1/responses", nil)
	applyHeaderOverrideToRequest(upstreamReq, headers)
	require.Equal(t, "Codex CLI", upstreamReq.Header.Get("Originator"))
	require.Equal(t, "sess-123", upstreamReq.Header.Get("Session_id"))
	require.Empty(t, upstreamReq.Header.Get("X-Codex-Beta-Features"))
}
