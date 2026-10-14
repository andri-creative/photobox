package repository

import (
	"github.com/google/uuid"
	"github.com/photobox/backend/internal/models"
	"gorm.io/gorm"
)

type TokenRepository struct {
	db *gorm.DB
}

func NewTokenRepository(db *gorm.DB) *TokenRepository {
	return &TokenRepository{db: db}
}

func (r *TokenRepository) CreateBatch(tokens []models.Token) error {
	return r.db.Create(&tokens).Error
}

func (r *TokenRepository) FindBySessionID(sessionID uuid.UUID) ([]models.Token, error) {
	var tokens []models.Token
	err := r.db.Where("session_id = ?", sessionID).Find(&tokens).Error
	return tokens, err
}

func (r *TokenRepository) FindByToken(token string, sessionID uuid.UUID) (*models.Token, error) {
	var t models.Token
	err := r.db.Where("token = ? AND session_id = ?", token, sessionID).First(&t).Error
	if err != nil {
		return nil, err
	}
	return &t, nil
}

func (r *TokenRepository) MarkUsed(tokenID uuid.UUID, guestID *uuid.UUID) error {
	return r.db.Model(&models.Token{}).
		Where("id = ?", tokenID).
		Updates(map[string]interface{}{
			"used":    true,
			"guest_id": guestID,
		}).Error
}
