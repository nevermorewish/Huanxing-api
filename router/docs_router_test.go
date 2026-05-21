package router

import (
	"embed"
	"io/fs"
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"

	"github.com/gin-gonic/gin"
)

//go:embed testdata/docs
var testDocsFS embed.FS

func TestServeDocs(t *testing.T) {
	gin.SetMode(gin.TestMode)
	docsFS, err := fs.Sub(testDocsFS, "testdata/docs")
	if err != nil {
		t.Fatal(err)
	}
	r := gin.New()
	r.GET("/docs/*filepath", serveDocs(docsFS))

	tests := []struct {
		name         string
		path         string
		wantStatus   int
		wantBody     string
		wantNoStore  bool
		wantMimeHint string
	}{
		{
			name:         "serves docs index",
			path:         "/docs/",
			wantStatus:   http.StatusOK,
			wantBody:     "docs index",
			wantNoStore:  true,
			wantMimeHint: "text/html",
		},
		{
			name:         "serves static asset",
			path:         "/docs/app.js",
			wantStatus:   http.StatusOK,
			wantBody:     "console.log",
			wantNoStore:  true,
			wantMimeHint: "text/javascript",
		},
		{
			name:         "falls back to docs index",
			path:         "/docs/missing/page.html",
			wantStatus:   http.StatusOK,
			wantBody:     "docs index",
			wantNoStore:  true,
			wantMimeHint: "text/html",
		},
		{
			name:         "serves image asset",
			path:         "/docs/pixel.png",
			wantStatus:   http.StatusOK,
			wantNoStore:  true,
			wantMimeHint: "image/png",
		},
		{
			name:         "does not fallback missing image to html",
			path:         "/docs/missing.png",
			wantStatus:   http.StatusNotFound,
			wantNoStore:  false,
			wantMimeHint: "application/json",
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			req := httptest.NewRequest(http.MethodGet, tt.path, nil)
			w := httptest.NewRecorder()
			r.ServeHTTP(w, req)

			if w.Code != tt.wantStatus {
				t.Fatalf("status = %d, want %d", w.Code, tt.wantStatus)
			}
			if tt.wantBody != "" && !strings.Contains(w.Body.String(), tt.wantBody) {
				t.Fatalf("body = %q, want substring %q", w.Body.String(), tt.wantBody)
			}
			if tt.wantNoStore && !strings.Contains(w.Header().Get("Cache-Control"), "no-store") {
				t.Fatalf("Cache-Control = %q, want no-store", w.Header().Get("Cache-Control"))
			}
			if !strings.Contains(w.Header().Get("Content-Type"), tt.wantMimeHint) {
				t.Fatalf("Content-Type = %q, want hint %q", w.Header().Get("Content-Type"), tt.wantMimeHint)
			}
		})
	}
}
