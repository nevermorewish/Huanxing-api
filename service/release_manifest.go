package service

import (
	"fmt"
	"io"
	"net/http"
	"net/url"
	"sort"
	"strings"
	"sync"
	"time"

	"github.com/huanxing/huanxing-api/common"
	"github.com/huanxing/huanxing-api/setting/system_setting"
	"gopkg.in/yaml.v3"
)

const (
	releaseManifestMaxBytes        = 512 * 1024
	releaseManifestCacheTTL        = 5 * time.Minute
	releaseManifestFailureCacheTTL = time.Minute
)

type ReleasePlatform string

const (
	ReleasePlatformWindows  ReleasePlatform = "windows"
	ReleasePlatformMacArm   ReleasePlatform = "mac_arm"
	ReleasePlatformMacIntel ReleasePlatform = "mac_intel"
)

type releaseManifestCacheEntry struct {
	resolvedURL string
	expiresAt   time.Time
}

type electronLatestYAML struct {
	Files []struct {
		URL string `yaml:"url"`
	} `yaml:"files"`
	Path string `yaml:"path"`
}

type hermesLatestJSON struct {
	Assets map[string]struct {
		URL          string `json:"url"`
		VersionedURL string `json:"versionedUrl"`
		SourceURL    string `json:"sourceUrl"`
		FileName     string `json:"fileName"`
		Label        string `json:"label"`
		Platform     string `json:"platform"`
	} `json:"assets"`
}

var releaseManifestCache sync.Map

func ResolveReleaseDownloadURL(rawURL string, platform ReleasePlatform) string {
	rawURL = strings.TrimSpace(rawURL)
	if rawURL == "" || !isReleaseManifestURL(rawURL) {
		return rawURL
	}

	cacheKey := string(platform) + "|" + rawURL
	if entry, ok := releaseManifestCache.Load(cacheKey); ok {
		cached := entry.(releaseManifestCacheEntry)
		if time.Now().Before(cached.expiresAt) {
			return cached.resolvedURL
		}
		releaseManifestCache.Delete(cacheKey)
	}

	resolvedURL, err := resolveReleaseDownloadURL(rawURL, platform)
	if err != nil {
		common.SysLog(fmt.Sprintf("failed to resolve release manifest %s: %v", common.MaskSensitiveInfo(rawURL), err))
		releaseManifestCache.Store(cacheKey, releaseManifestCacheEntry{
			resolvedURL: "",
			expiresAt:   time.Now().Add(releaseManifestFailureCacheTTL),
		})
		return ""
	}

	releaseManifestCache.Store(cacheKey, releaseManifestCacheEntry{
		resolvedURL: resolvedURL,
		expiresAt:   time.Now().Add(releaseManifestCacheTTL),
	})
	return resolvedURL
}

func isReleaseManifestURL(rawURL string) bool {
	return manifestURLHasExtension(rawURL, ".json", ".yml", ".yaml")
}

func manifestURLHasExtension(rawURL string, extensions ...string) bool {
	parsedURL, err := url.Parse(strings.TrimSpace(rawURL))
	lowerURL := strings.ToLower(rawURL)
	if err == nil && parsedURL.Path != "" {
		lowerURL = strings.ToLower(parsedURL.Path)
	}
	for _, extension := range extensions {
		if strings.HasSuffix(lowerURL, extension) {
			return true
		}
	}
	return false
}

func resolveReleaseDownloadURL(rawURL string, platform ReleasePlatform) (string, error) {
	resp, err := DoDownloadRequest(rawURL, "resolve_release_manifest")
	if err != nil {
		return "", err
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		return "", fmt.Errorf("manifest returned status code %d", resp.StatusCode)
	}

	body, err := io.ReadAll(io.LimitReader(resp.Body, releaseManifestMaxBytes+1))
	if err != nil {
		return "", err
	}
	if len(body) > releaseManifestMaxBytes {
		return "", fmt.Errorf("manifest exceeds %d bytes", releaseManifestMaxBytes)
	}

	if manifestURLHasExtension(rawURL, ".json") {
		return resolveReleaseJSONDownloadURL(rawURL, body, platform)
	}
	return resolveReleaseYAMLDownloadURL(rawURL, body, platform)
}

func resolveReleaseJSONDownloadURL(manifestURL string, body []byte, platform ReleasePlatform) (string, error) {
	var manifest hermesLatestJSON
	if err := common.Unmarshal(body, &manifest); err != nil {
		return "", err
	}
	if len(manifest.Assets) == 0 {
		return "", fmt.Errorf("manifest has no assets")
	}

	keys := make([]string, 0, len(manifest.Assets))
	for key := range manifest.Assets {
		keys = append(keys, key)
	}
	sort.Strings(keys)

	bestScore := 0
	var bestURL string
	for _, key := range keys {
		asset := manifest.Assets[key]
		resolved := firstNonEmpty(asset.VersionedURL, asset.URL, asset.SourceURL, asset.FileName)
		if resolved == "" {
			continue
		}
		score := platformAssetScore(key, asset.Platform, strings.Join([]string{asset.FileName, resolved}, " "), asset.Label, platform)
		if score > bestScore {
			bestScore = score
			bestURL = resolved
		}
	}

	if bestURL != "" {
		return resolveManifestRelativeURL(manifestURL, bestURL)
	}

	return "", fmt.Errorf("manifest has no %s download URL", platform)
}

func resolveReleaseYAMLDownloadURL(manifestURL string, body []byte, platform ReleasePlatform) (string, error) {
	var manifest electronLatestYAML
	if err := yaml.Unmarshal(body, &manifest); err != nil {
		return "", err
	}

	candidates := make([]string, 0, len(manifest.Files)+1)
	if manifest.Path != "" {
		candidates = append(candidates, manifest.Path)
	}
	for _, file := range manifest.Files {
		if file.URL != "" {
			candidates = append(candidates, file.URL)
		}
	}
	if len(candidates) == 0 {
		return "", fmt.Errorf("manifest has no path or files")
	}

	bestScore := 0
	var bestURL string
	for _, candidate := range candidates {
		score := releaseYAMLCandidateScore(candidate, platform)
		if score > bestScore {
			bestScore = score
			bestURL = candidate
		}
	}
	if bestURL != "" {
		return resolveManifestRelativeURL(manifestURL, bestURL)
	}
	return "", fmt.Errorf("manifest has no %s download URL", platform)
}

func releaseYAMLCandidateScore(candidate string, platform ReleasePlatform) int {
	if !matchesPlatform(candidate, platform) {
		return 0
	}

	name := strings.ToLower(candidate)
	score := 100
	switch platform {
	case ReleasePlatformMacArm, ReleasePlatformMacIntel:
		if strings.Contains(name, ".dmg") {
			score += 50
		}
		if strings.Contains(name, ".zip") {
			score += 10
		}
	default:
		if strings.Contains(name, ".exe") {
			score += 50
		}
		if strings.Contains(name, ".msi") {
			score += 40
		}
	}

	switch platform {
	case ReleasePlatformMacArm:
		if strings.Contains(name, "arm64") || strings.Contains(name, "aarch64") || strings.Contains(name, "apple") {
			score += 20
		}
	case ReleasePlatformMacIntel:
		if strings.Contains(name, "x64") || strings.Contains(name, "x86_64") || strings.Contains(name, "intel") {
			score += 20
		}
	default:
		if strings.Contains(name, "x64") || strings.Contains(name, "win64") {
			score += 20
		}
	}
	return score
}

func platformAssetScore(key string, platformValue string, fileName string, label string, platform ReleasePlatform) int {
	haystack := strings.ToLower(strings.Join([]string{key, platformValue, fileName, label}, " "))
	switch platform {
	case ReleasePlatformMacArm:
		if (strings.Contains(haystack, "macos") || strings.Contains(haystack, "darwin")) &&
			(strings.Contains(haystack, "arm64") || strings.Contains(haystack, "aarch64") || strings.Contains(haystack, "apple")) {
			return 110
		}
		if (strings.Contains(haystack, "macos") || strings.Contains(haystack, "darwin") || strings.Contains(haystack, ".dmg")) &&
			!strings.Contains(haystack, "x64") &&
			!strings.Contains(haystack, "x86_64") &&
			!strings.Contains(haystack, "intel") {
			return 80
		}
	case ReleasePlatformMacIntel:
		if (strings.Contains(haystack, "macos") || strings.Contains(haystack, "darwin")) &&
			(strings.Contains(haystack, "x64") || strings.Contains(haystack, "x86_64") || strings.Contains(haystack, "intel")) {
			return 110
		}
		if (strings.Contains(haystack, "macos") || strings.Contains(haystack, "darwin") || strings.Contains(haystack, ".dmg")) &&
			!strings.Contains(haystack, "arm64") &&
			!strings.Contains(haystack, "aarch64") &&
			!strings.Contains(haystack, "apple") {
			return 80
		}
	default:
		if strings.Contains(haystack, "windows") || strings.Contains(haystack, "win32") {
			if strings.Contains(haystack, "x64") {
				return 110
			}
			return 100
		}
		if strings.Contains(haystack, ".exe") || strings.Contains(haystack, ".msi") || strings.Contains(haystack, "setup.exe") {
			return 70
		}
	}
	return 0
}

func matchesPlatform(candidate string, platform ReleasePlatform) bool {
	name := strings.ToLower(candidate)
	switch platform {
	case ReleasePlatformMacArm:
		isMac := strings.Contains(name, "mac") || strings.Contains(name, "darwin") || strings.Contains(name, ".dmg")
		if !isMac {
			return false
		}
		return strings.Contains(name, "arm64") ||
			strings.Contains(name, "aarch64") ||
			strings.Contains(name, "apple") ||
			(!strings.Contains(name, "x64") && !strings.Contains(name, "x86_64") && !strings.Contains(name, "intel"))
	case ReleasePlatformMacIntel:
		isMac := strings.Contains(name, "mac") || strings.Contains(name, "darwin") || strings.Contains(name, ".dmg")
		if !isMac {
			return false
		}
		return strings.Contains(name, "x64") ||
			strings.Contains(name, "x86_64") ||
			strings.Contains(name, "intel") ||
			(!strings.Contains(name, "arm64") && !strings.Contains(name, "aarch64") && !strings.Contains(name, "apple"))
	default:
		return strings.Contains(name, "windows") ||
			strings.Contains(name, "win32") ||
			strings.Contains(name, "win64") ||
			strings.Contains(name, "-win") ||
			strings.Contains(name, "_win") ||
			strings.Contains(name, ".exe") ||
			strings.Contains(name, ".msi")
	}
}

func resolveManifestRelativeURL(manifestURL string, candidate string) (string, error) {
	candidate = strings.TrimSpace(candidate)
	if candidate == "" {
		return "", fmt.Errorf("download URL is empty")
	}
	if parsedCandidate, err := url.Parse(candidate); err == nil && parsedCandidate.IsAbs() {
		if err := validateResolvedManifestURL(parsedCandidate.String()); err != nil {
			return "", err
		}
		return parsedCandidate.String(), nil
	}

	parsedManifest, err := url.Parse(manifestURL)
	if err != nil {
		return "", err
	}
	if !parsedManifest.IsAbs() {
		return "", fmt.Errorf("manifest URL is not absolute")
	}

	base := *parsedManifest
	if !strings.HasSuffix(base.Path, "/") {
		lastSlash := strings.LastIndex(base.Path, "/")
		if lastSlash < 0 {
			base.Path = "/"
		} else {
			base.Path = base.Path[:lastSlash+1]
		}
	}
	base.RawQuery = ""
	base.Fragment = ""

	parsedCandidate, err := url.Parse(candidate)
	if err != nil {
		return "", err
	}
	resolved := base.ResolveReference(parsedCandidate)

	if err := validateResolvedManifestURL(resolved.String()); err != nil {
		return "", err
	}

	return resolved.String(), nil
}

func validateResolvedManifestURL(downloadURL string) error {
	fetchSetting := system_setting.GetFetchSetting()
	if err := common.ValidateURLWithFetchSetting(downloadURL, fetchSetting.EnableSSRFProtection, fetchSetting.AllowPrivateIp, fetchSetting.DomainFilterMode, fetchSetting.IpFilterMode, fetchSetting.DomainList, fetchSetting.IpList, fetchSetting.AllowedPorts, fetchSetting.ApplyIPFilterForDomain); err != nil {
		return fmt.Errorf("resolved download URL rejected: %v", err)
	}
	return nil
}

func firstNonEmpty(values ...string) string {
	for _, value := range values {
		if strings.TrimSpace(value) != "" {
			return strings.TrimSpace(value)
		}
	}
	return ""
}
