package utils

import (
	"crypto/rand"
	"encoding/hex"
	"strings"

	"github.com/google/uuid"
)

func GenerateSessionCode() string {
	b := make([]byte, 4)
	rand.Read(b)
	return strings.ToUpper(hex.EncodeToString(b))
}

func GenerateJoinToken() string {
	b := make([]byte, 3)
	rand.Read(b)
	return strings.ToUpper(hex.EncodeToString(b))
}

func GenerateUUID() uuid.UUID {
	return uuid.New()
}
