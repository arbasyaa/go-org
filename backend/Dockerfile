# syntax=docker/dockerfile:1

FROM golang:1.26-alpine AS build
WORKDIR /src

# Retry: mirror Alpine kadang "temporary error" di server build.
RUN for i in 1 2 3 4 5; do apk add --no-cache ca-certificates git && exit 0; echo "apk retry $i"; sleep 5; done; exit 1

ENV GOPRIVATE=github.com/lrndwy/gokil
ENV GONOSUMCHECK=github.com/lrndwy/gokil
ENV GONOSUMDB=github.com/lrndwy/gokil

COPY go.mod go.sum ./
RUN go mod download

COPY . .

ARG PROJECT=backend
RUN CGO_ENABLED=0 go build -trimpath -ldflags="-s -w" -o /out/app ./cmd/${PROJECT}

FROM alpine:3.20
WORKDIR /app
# CA bundle disalin dari stage build (tanpa apk/jaringan di stage ini).
COPY --from=build /etc/ssl/certs/ca-certificates.crt /etc/ssl/certs/ca-certificates.crt

COPY --from=build /out/app /app/app
COPY docker-entrypoint.sh /app/entrypoint.sh
COPY /migrations/* /app/migrations/
RUN chmod +x /app/entrypoint.sh

EXPOSE 8080
ENTRYPOINT ["/app/entrypoint.sh"]
CMD []
