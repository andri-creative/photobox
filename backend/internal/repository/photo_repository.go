package repository

import (
	"github.com/google/uuid"
	"github.com/photobox/backend/internal/models"
	"gorm.io/gorm"
)

type PhotoRepository struct {
	db *gorm.DB
}

func NewPhotoRepository(db *gorm.DB) *PhotoRepository {
	return &PhotoRepository{db: db}
}

func (r *PhotoRepository) Create(photo *models.Photo) error {
	return r.db.Create(photo).Error
}

func (r *PhotoRepository) FindBySessionID(sessionID uuid.UUID) ([]models.Photo, error) {
	var photos []models.Photo
	err := r.db.Where("session_id = ?", sessionID).
		Order("created_at DESC").
		Find(&photos).Error
	return photos, err
}

func (r *PhotoRepository) FindByID(id uuid.UUID) (*models.Photo, error) {
	var photo models.Photo
	err := r.db.First(&photo, "id = ?", id).Error
	if err != nil {
		return nil, err
	}
	return &photo, nil
}
