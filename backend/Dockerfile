FROM golang:1.21-alpine AS builder

WORKDIR /app
COPY go.mod go.sum ./
RUN go mod download
COPY . .
RUN CGO_ENABLED=0 go build -o /photobox-server ./cmd/api

FROM alpine:latest

WORKDIR /app
COPY --from=builder /photobox-server .

EXPOSE 18080
CMD ["./photobox-server"]
