package common

import (
	"net/http"
	"testing"
	"testing/fstest"
)

func TestEmbedFileSystemExistsIgnoresSpaRouteDirectories(t *testing.T) {
	fileSystem := &embedFileSystem{
		FileSystem: http.FS(fstest.MapFS{
			"about/screenshot.png":           &fstest.MapFile{Data: []byte("image")},
			"hermes-client/workbench.png":    &fstest.MapFile{Data: []byte("image")},
			"openclaw-client/screenshot.png": &fstest.MapFile{Data: []byte("image")},
			"pricing/screenshot.png":         &fstest.MapFile{Data: []byte("image")},
			"rankings/screenshot.png":        &fstest.MapFile{Data: []byte("image")},
		}),
	}

	routes := []string{
		"/about",
		"/hermes-client",
		"/openclaw-client",
		"/pricing",
		"/rankings",
	}

	for _, route := range routes {
		if fileSystem.Exists("/", route) {
			t.Fatalf("expected directory %q without trailing slash to be ignored", route)
		}

		if fileSystem.Exists("/", route+"/") {
			t.Fatalf("expected directory %q with trailing slash to be ignored", route+"/")
		}
	}

	if !fileSystem.Exists("/", "/hermes-client/workbench.png") {
		t.Fatal("expected concrete file to exist")
	}
}
