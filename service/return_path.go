package service

import (
	"strings"

	"github.com/huanxing/huanxing-api/common"
	"github.com/huanxing/huanxing-api/setting/system_setting"
)

func PaymentReturnURL(suffix string) string {
	base := strings.TrimRight(system_setting.ServerAddress, "/")
	return base + common.ThemeAwarePath(suffix)
}
