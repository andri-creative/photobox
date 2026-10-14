package models

import (
	"time"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

type User struct {
	ID           uuid.UUID `gorm:"type:uuid;primaryKey" json:"id"`
	Username     string    `gorm:"uniqueIndex;size:50" json:"username"`
	PasswordHash string    `gorm:"size:255" json:"-"`
	Role         string    `gorm:"size:10;default:'guest'" json:"role"`
	CreatedAt    time.Time `json:"createdAt"`
	UpdatedAt    time.Time `json:"updatedAt"`
}

func (User) TableName() string {
	return "users"
}

type Session struct {
	ID              uuid.UUID      `gorm:"type:uuid;primaryKey" json:"id"`
	HostID          uuid.UUID      `gorm:"type:uuid" json:"hostId"`
	Host            *User          `json:"host,omitempty"`
	SessionCode     string         `gorm:"size:8;uniqueIndex" json:"sessionCode"`
	BackgroundImage string         `gorm:"type:text" json:"backgroundImage"`
	Active          bool           `gorm:"default:true" json:"active"`
	CreatedAt       time.Time      `json:"createdAt"`
	UpdatedAt       time.Time      `json:"updatedAt"`
	Tokens          []Token        `json:"tokens,omitempty"`
	Photos          []Photo        `json:"photos,omitempty"`
	DeletedAt       gorm.DeletedAt `gorm:"index" json:"-"`
}

func (Session) TableName() string {
	return "sessions"
}

type Token struct {
	ID        uuid.UUID `gorm:"type:uuid;primaryKey" json:"id"`
	SessionID uuid.UUID `gorm:"type:uuid;index" json:"sessionId"`
	Token     string    `gorm:"size:16;uniqueIndex" json:"token"`
	GuestID   *uuid.UUID `gorm:"type:uuid" json:"guestId,omitempty"`
	Used      bool      `gorm:"default:false" json:"used"`
	CreatedAt time.Time `json:"createdAt"`
}

func (Token) TableName() string {
	return "tokens"
}

type Photo struct {
	ID          uuid.UUID `gorm:"type:uuid;primaryKey" json:"id"`
	SessionID   uuid.UUID `gorm:"type:uuid;index" json:"sessionId"`
	ImagePath   string    `gorm:"type:text" json:"imagePath"`
	ThumbnailPath string  `gorm:"type:text" json:"thumbnailPath"`
	CreatedAt   time.Time `json:"createdAt"`
}

func (Photo) TableName() string {
	return "photos"
}
