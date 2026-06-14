package common

import (
	"embed"
	"io/fs"
	"net/http"
	"os"
	"strings"

	"github.com/gin-contrib/static"
)

// Credit: https://github.com/gin-contrib/static/issues/19

type embedFileSystem struct {
	http.FileSystem
}

func (e *embedFileSystem) Exists(prefix string, path string) bool {
	if p := strings.TrimPrefix(path, prefix); len(p) < len(path) {
		file, err := e.Open(p)
		if err != nil {
			return false
		}
		defer file.Close()

		info, err := file.Stat()
		return err == nil && !info.IsDir()
	}
	file, err := e.Open(path)
	if err != nil {
		return false
	}
	defer file.Close()

	info, err := file.Stat()
	return err == nil && !info.IsDir()
}

func (e *embedFileSystem) Open(name string) (http.File, error) {
	if name == "/" {
		// This will make sure the index page goes to NoRouter handler,
		// which will use the replaced index bytes with analytic codes.
		return nil, os.ErrNotExist
	}
	return e.FileSystem.Open(name)
}

func EmbedFolder(fsEmbed embed.FS, targetPath string) static.ServeFileSystem {
	efs, err := fs.Sub(fsEmbed, targetPath)
	if err != nil {
		panic(err)
	}
	return &embedFileSystem{
		FileSystem: http.FS(efs),
	}
}
