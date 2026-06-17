package service

import (
	"testing"

	"github.com/stretchr/testify/require"
)

func TestResolveReleaseYAMLDownloadURL(t *testing.T) {
	body := []byte(`version: 0.4.14
files:
  - url: FengchiClaw-0.4.14-win-x64.exe
    sha512: abc
    size: 261180216
path: FengchiClaw-0.4.14-win-x64.exe
sha512: abc
releaseDate: '2026-06-14T04:36:56.366Z'
`)

	resolved, err := resolveReleaseYAMLDownloadURL(
		"https://ai.fengchiyun.com/downloads/fengchiclaw/latest/latest.yml",
		body,
		ReleasePlatformWindows,
	)

	require.NoError(t, err)
	require.Equal(t, "https://ai.fengchiyun.com/downloads/fengchiclaw/latest/FengchiClaw-0.4.14-win-x64.exe", resolved)
}

func TestResolveReleaseYAMLDownloadURLDoesNotFallbackForMac(t *testing.T) {
	body := []byte(`version: 0.4.14
files:
  - url: FengchiClaw-0.4.14-win-x64.exe
path: FengchiClaw-0.4.14-win-x64.exe
`)

	resolved, err := resolveReleaseYAMLDownloadURL(
		"https://ai.fengchiyun.com/downloads/fengchiclaw/latest/latest.yml",
		body,
		ReleasePlatformMacArm,
	)

	require.Error(t, err)
	require.Empty(t, resolved)
}

func TestResolveReleaseYAMLDownloadURLDoesNotTreatDarwinAsWindows(t *testing.T) {
	body := []byte(`version: 0.4.14
files:
  - url: FengchiClaw-0.4.14-darwin-arm64.dmg
  - url: FengchiClaw-0.4.14-win-x64.exe
path: FengchiClaw-0.4.14-darwin-arm64.dmg
`)

	resolved, err := resolveReleaseYAMLDownloadURL(
		"https://ai.fengchiyun.com/downloads/fengchiclaw/latest/latest.yml",
		body,
		ReleasePlatformWindows,
	)

	require.NoError(t, err)
	require.Equal(t, "https://ai.fengchiyun.com/downloads/fengchiclaw/latest/FengchiClaw-0.4.14-win-x64.exe", resolved)
}

func TestResolveReleaseYAMLDownloadURLPrefersMacDMGOverZip(t *testing.T) {
	body := []byte(`version: 0.4.19
files:
  - url: FengchiClaw-0.4.19-mac-x64.zip
    sha512: x64zip
    size: 270145289
  - url: FengchiClaw-0.4.19-mac-arm64.zip
    sha512: armzip
    size: 261589894
  - url: FengchiClaw-0.4.19-mac-arm64.zip
    sha512: armzip
    size: 261589894
  - url: FengchiClaw-0.4.19-mac-x64.dmg
    sha512: x64dmg
    size: 234200194
  - url: FengchiClaw-0.4.19-mac-x64.dmg
    sha512: x64dmg
    size: 234200194
  - url: FengchiClaw-0.4.19-mac-arm64.dmg
    sha512: armdmg
    size: 227551314
  - url: FengchiClaw-0.4.19-mac-arm64.dmg
    sha512: armdmg
    size: 227551314
path: FengchiClaw-0.4.19-mac-x64.zip
sha512: x64zip
releaseDate: '2026-06-17T05:49:42.332Z'
`)

	armResolved, err := resolveReleaseYAMLDownloadURL(
		"https://ai.fengchiyun.com/downloads/fengchiclaw/latest/latest-mac.yml",
		body,
		ReleasePlatformMacArm,
	)
	require.NoError(t, err)
	require.Equal(t, "https://ai.fengchiyun.com/downloads/fengchiclaw/latest/FengchiClaw-0.4.19-mac-arm64.dmg", armResolved)

	intelResolved, err := resolveReleaseYAMLDownloadURL(
		"https://ai.fengchiyun.com/downloads/fengchiclaw/latest/latest-mac.yml",
		body,
		ReleasePlatformMacIntel,
	)
	require.NoError(t, err)
	require.Equal(t, "https://ai.fengchiyun.com/downloads/fengchiclaw/latest/FengchiClaw-0.4.19-mac-x64.dmg", intelResolved)
}

func TestResolveReleaseYAMLDownloadURLErrorsWithoutMatchingPlatform(t *testing.T) {
	body := []byte(`version: 0.4.14
files:
  - url: FengchiClaw-0.4.14-darwin-arm64.dmg
path: FengchiClaw-0.4.14-darwin-arm64.dmg
`)

	resolved, err := resolveReleaseYAMLDownloadURL(
		"https://ai.fengchiyun.com/downloads/fengchiclaw/latest/latest.yml",
		body,
		ReleasePlatformWindows,
	)

	require.Error(t, err)
	require.Empty(t, resolved)
}

func TestResolveReleaseJSONDownloadURLPrefersVersionedURL(t *testing.T) {
	body := []byte(`{
  "repository": "nevermorewish/HuanXing-Hermes",
  "version": "v0.3.12",
  "semver": "0.3.12",
  "assets": {
    "windows": {
      "label": "Windows installer",
      "platform": "windows",
      "fileName": "FengchiHermes Desktop_0.3.12_x64-setup.exe",
      "url": "https://ai.fengchiyun.com/downloads/fengchihermes/latest/FengchiHermes%20Desktop_0.3.12_x64-setup.exe",
      "versionedUrl": "https://ai.fengchiyun.com/downloads/fengchihermes/releases/v0.3.12/FengchiHermes%20Desktop_0.3.12_x64-setup.exe",
      "sourceUrl": "https://github.com/nevermorewish/HuanXing-Hermes/releases/download/v0.3.12/FengchiHermes%20Desktop_0.3.12_x64-setup.exe"
    }
  }
}`)

	resolved, err := resolveReleaseJSONDownloadURL(
		"https://ai.fengchiyun.com/downloads/fengchihermes/latest.json",
		body,
		ReleasePlatformWindows,
	)

	require.NoError(t, err)
	require.Equal(t, "https://ai.fengchiyun.com/downloads/fengchihermes/releases/v0.3.12/FengchiHermes%20Desktop_0.3.12_x64-setup.exe", resolved)
}

func TestResolveReleaseJSONDownloadURLMatchesPlatformMetadata(t *testing.T) {
	body := []byte(`{
  "assets": {
    "installer": {
      "label": "macOS Apple Silicon",
      "platform": "darwin",
      "fileName": "FengchiHermes_0.3.12_aarch64.dmg",
      "url": "FengchiHermes_0.3.12_aarch64.dmg"
    },
    "windows": {
      "label": "Windows installer",
      "platform": "windows",
      "fileName": "FengchiHermes_0.3.12_x64-setup.exe",
      "url": "FengchiHermes_0.3.12_x64-setup.exe"
    }
  }
}`)

	resolved, err := resolveReleaseJSONDownloadURL(
		"https://ai.fengchiyun.com/downloads/fengchihermes/latest.json",
		body,
		ReleasePlatformMacArm,
	)

	require.NoError(t, err)
	require.Equal(t, "https://ai.fengchiyun.com/downloads/fengchihermes/FengchiHermes_0.3.12_aarch64.dmg", resolved)
}

func TestIsReleaseManifestURLIgnoresQueryString(t *testing.T) {
	require.True(t, isReleaseManifestURL("https://ai.fengchiyun.com/downloads/fengchihermes/latest.json?cache=1"))
	require.True(t, manifestURLHasExtension("https://ai.fengchiyun.com/downloads/fengchiclaw/latest/latest.yml?cache=1", ".yml"))
	require.False(t, manifestURLHasExtension("https://ai.fengchiyun.com/downloads/fengchiclaw/latest/latest.yml?format=json", ".json"))
}
