package service

import (
	"testing"

	"github.com/stretchr/testify/require"
)

func TestParseFeishuChatIDs(t *testing.T) {
	got := parseFeishuChatIDs("oc_a\noc_b, oc_a;oc_c\toc_d\r\n")

	require.Equal(t, []string{"oc_a", "oc_b", "oc_c", "oc_d"}, got)
}

func TestBuildFeishuChannelErrorCard(t *testing.T) {
	content, err := buildFeishuChannelErrorCard(FeishuChannelErrorAlert{
		ChannelID:   12,
		ChannelName: "primary",
		StatusCode:  500,
		Message:     "upstream failed",
	})

	require.NoError(t, err)
	require.Contains(t, content, "Channel error #12")
	require.Contains(t, content, "primary")
	require.Contains(t, content, "upstream failed")
}
