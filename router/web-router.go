package router

import (
	"embed"
	"io/fs"
	"mime"
	"net/http"
	"path"
	"strings"

	"github.com/gin-contrib/gzip"
	"github.com/gin-contrib/static"
	"github.com/gin-gonic/gin"
	"github.com/huanxing/huanxing-api/common"
	"github.com/huanxing/huanxing-api/controller"
	"github.com/huanxing/huanxing-api/middleware"
)

var docsContentTypes = map[string]string{
	".css":  "text/css; charset=utf-8",
	".gif":  "image/gif",
	".html": "text/html; charset=utf-8",
	".jpeg": "image/jpeg",
	".jpg":  "image/jpeg",
	".js":   "text/javascript; charset=utf-8",
	".png":  "image/png",
	".svg":  "image/svg+xml",
	".webp": "image/webp",
}

// ThemeAssets holds the embedded default frontend assets.
type ThemeAssets struct {
	DefaultBuildFS   embed.FS
	DefaultIndexPage []byte
	DocsFS           embed.FS
}

func SetWebRouter(router *gin.Engine, assets ThemeAssets) {
	defaultFS := common.EmbedFolder(assets.DefaultBuildFS, "web/default/dist")
	docsFS, err := fs.Sub(assets.DocsFS, "doc")
	if err != nil {
		panic(err)
	}
	serveIndex := func(c *gin.Context) {
		c.Set(middleware.RouteTagKey, "web")
		c.Header("Cache-Control", "no-cache")
		c.Data(http.StatusOK, "text/html; charset=utf-8", assets.DefaultIndexPage)
	}

	router.Use(gzip.Gzip(gzip.DefaultCompression))
	router.Use(middleware.GlobalWebRateLimit())
	router.Use(middleware.Cache())
	router.GET("/docs", func(c *gin.Context) {
		c.Redirect(http.StatusMovedPermanently, "/docs/")
	})
	router.GET("/docs/*filepath", serveDocs(docsFS))
	for _, route := range []string{
		"/about",
		"/about/",
		"/hermes",
		"/hermes/",
		"/hermes-client",
		"/hermes-client/",
		"/openclaw",
		"/openclaw/",
		"/pricing",
		"/pricing/",
		"/rankings",
		"/rankings/",
	} {
		router.GET(route, serveIndex)
	}
	router.Use(static.Serve("/", defaultFS))
	router.NoRoute(func(c *gin.Context) {
		if strings.HasPrefix(c.Request.RequestURI, "/v1") || strings.HasPrefix(c.Request.RequestURI, "/api") || strings.HasPrefix(c.Request.RequestURI, "/assets") {
			controller.RelayNotFound(c)
			return
		}
		serveIndex(c)
	})
}

func serveDocs(docsFS fs.FS) gin.HandlerFunc {
	return func(c *gin.Context) {
		requestPath := strings.TrimPrefix(c.Param("filepath"), "/")
		if requestPath == "" {
			requestPath = "index.html"
		}
		requestPath = path.Clean("/" + requestPath)
		requestPath = strings.TrimPrefix(requestPath, "/")
		if strings.HasSuffix(c.Param("filepath"), "/") {
			requestPath = path.Join(requestPath, "index.html")
		}

		if !docsFileExists(docsFS, requestPath) {
			if isDocsStaticAsset(requestPath) {
				controller.RelayNotFound(c)
				return
			}
			requestPath = "index.html"
		}

		if strings.HasSuffix(requestPath, ".html") {
			c.Header("Cache-Control", "no-cache, no-store, must-revalidate")
			c.Header("Pragma", "no-cache")
			c.Header("Expires", "0")
		} else {
			c.Header("Cache-Control", "no-cache, no-store, must-revalidate")
		}

		content, err := fs.ReadFile(docsFS, requestPath)
		if err != nil {
			controller.RelayNotFound(c)
			return
		}
		contentType := docsContentType(requestPath)
		c.Data(http.StatusOK, contentType, content)
	}
}

func docsFileExists(docsFS fs.FS, name string) bool {
	info, err := fs.Stat(docsFS, name)
	return err == nil && !info.IsDir()
}

func docsContentType(name string) string {
	ext := strings.ToLower(path.Ext(name))
	if contentType, ok := docsContentTypes[ext]; ok {
		return contentType
	}
	contentType := mime.TypeByExtension(ext)
	if contentType == "" {
		contentType = "application/octet-stream"
	}
	return contentType
}

func isDocsStaticAsset(name string) bool {
	ext := strings.ToLower(path.Ext(name))
	if ext == "" || ext == ".html" {
		return false
	}
	return true
}
