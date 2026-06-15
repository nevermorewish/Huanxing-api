package constant

import "testing"

func TestPath2RelayModeVisionaryImagePaths(t *testing.T) {
	tests := map[string]int{
		"/v1/api/generate":       RelayModeImagesGenerations,
		"/v1/api/nano-banana":    RelayModeImagesGenerations,
		"/v1/images/generations": RelayModeImagesGenerations,
	}

	for path, want := range tests {
		if got := Path2RelayMode(path); got != want {
			t.Fatalf("Path2RelayMode(%q) = %d, want %d", path, got, want)
		}
	}
}
