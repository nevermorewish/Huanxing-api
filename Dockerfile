FROM crpi-dzjyl2rfnlfugj1m.cn-shanghai.personal.cr.aliyuncs.com/frogclaw/base-bun:1 AS builder

WORKDIR /build
COPY web/default/package.json .
COPY web/default/bun.lock .
RUN bun install
COPY ./web/default .
COPY ./VERSION .
RUN DISABLE_ESLINT_PLUGIN='true' VITE_REACT_APP_VERSION=$(cat VERSION) bun run build

FROM crpi-dzjyl2rfnlfugj1m.cn-shanghai.personal.cr.aliyuncs.com/frogclaw/base-golang:1.26.1-alpine AS builder2
ENV GO111MODULE=on CGO_ENABLED=0

ARG TARGETOS
ARG TARGETARCH
ENV GOOS=${TARGETOS:-linux} GOARCH=${TARGETARCH:-amd64}
ENV GOEXPERIMENT=greenteagc

WORKDIR /build

ADD go.mod go.sum ./
RUN go mod download

COPY . .
COPY --from=builder /build/dist ./web/default/dist
RUN go build -ldflags "-s -w -X 'github.com/huanxing/huanxing-api/common.Version=$(cat VERSION)'" -o huanxing-api

FROM crpi-dzjyl2rfnlfugj1m.cn-shanghai.personal.cr.aliyuncs.com/frogclaw/base-debian:bookworm-slim

RUN apt-get update \
    && apt-get install -y --no-install-recommends ca-certificates tzdata libasan8 wget \
    && rm -rf /var/lib/apt/lists/* \
    && update-ca-certificates

COPY --from=builder2 /build/huanxing-api /
COPY LICENSE NOTICE THIRD-PARTY-LICENSES.md /licenses/
EXPOSE 3000
WORKDIR /data
ENTRYPOINT ["/huanxing-api"]
