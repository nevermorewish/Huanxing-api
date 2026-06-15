package visionary

const (
	ModelGPTImage2       = "gpt-image-2"
	ModelNanoBananaPro   = "nano-banana-pro"
	ModelNanoBananaProCL = "nano-banana-pro-cl"
	ModelNanoBanana2     = "nano-banana-2"
	ModelNanoBanana22K   = "nano-banana-2-2k"
	ModelNanoBanana24K   = "nano-banana-2-4k"

	pathGPTImage2  = "/v1/api/generate"
	pathNanoBanana = "/v1/api/nano-banana"
)

var ModelList = []string{
	ModelGPTImage2,
	ModelNanoBananaPro,
	ModelNanoBananaProCL,
	ModelNanoBanana2,
	ModelNanoBanana22K,
	ModelNanoBanana24K,
}

var ChannelName = "visionary"
