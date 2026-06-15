package common

import (
	"testing"

	"github.com/huanxing/huanxing-api/dto"
	"github.com/huanxing/huanxing-api/setting/model_setting"
	"github.com/huanxing/huanxing-api/types"
	"github.com/stretchr/testify/require"
)

func TestShouldPassThroughRequestBody_ChannelSetting(t *testing.T) {
	originalGlobalPassThrough := model_setting.GetGlobalSettings().PassThroughRequestEnabled
	t.Cleanup(func() {
		model_setting.GetGlobalSettings().PassThroughRequestEnabled = originalGlobalPassThrough
	})
	model_setting.GetGlobalSettings().PassThroughRequestEnabled = false

	tests := []struct {
		name     string
		format   types.RelayFormat
		setting  dto.ChannelSettings
		expected bool
	}{
		{
			name:     "disabled",
			format:   types.RelayFormatOpenAI,
			setting:  dto.ChannelSettings{PassThroughBodyEnabled: false},
			expected: false,
		},
		{
			name:   "disabled ignores claude messages only",
			format: types.RelayFormatClaude,
			setting: dto.ChannelSettings{
				PassThroughBodyEnabled:        false,
				PassThroughClaudeMessagesOnly: true,
			},
			expected: false,
		},
		{
			name:   "legacy all entries",
			format: types.RelayFormatOpenAI,
			setting: dto.ChannelSettings{
				PassThroughBodyEnabled:        true,
				PassThroughClaudeMessagesOnly: false,
			},
			expected: true,
		},
		{
			name:   "claude messages only rejects openai entry",
			format: types.RelayFormatOpenAI,
			setting: dto.ChannelSettings{
				PassThroughBodyEnabled:        true,
				PassThroughClaudeMessagesOnly: true,
			},
			expected: false,
		},
		{
			name:   "claude messages only accepts claude entry",
			format: types.RelayFormatClaude,
			setting: dto.ChannelSettings{
				PassThroughBodyEnabled:        true,
				PassThroughClaudeMessagesOnly: true,
			},
			expected: true,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			info := &RelayInfo{
				RelayFormat: tt.format,
				ChannelMeta: &ChannelMeta{
					ChannelSetting: tt.setting,
				},
			}

			require.Equal(t, tt.expected, info.ShouldPassThroughRequestBody())
		})
	}
}

func TestShouldPassThroughRequestBody_GlobalOverride(t *testing.T) {
	originalGlobalPassThrough := model_setting.GetGlobalSettings().PassThroughRequestEnabled
	t.Cleanup(func() {
		model_setting.GetGlobalSettings().PassThroughRequestEnabled = originalGlobalPassThrough
	})
	model_setting.GetGlobalSettings().PassThroughRequestEnabled = true

	info := &RelayInfo{
		RelayFormat: types.RelayFormatOpenAI,
		ChannelMeta: &ChannelMeta{
			ChannelSetting: dto.ChannelSettings{
				PassThroughBodyEnabled:        false,
				PassThroughClaudeMessagesOnly: true,
			},
		},
	}

	require.True(t, info.ShouldPassThroughRequestBody())
}
