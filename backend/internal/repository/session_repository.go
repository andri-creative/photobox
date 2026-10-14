package repository

import (
	"github.com/google/uuid"
	"github.com/photobox/backend/internal/models"
	"gorm.io/gorm"
)

type SessionRepository struct {
	db *gorm.DB
}

func NewSessionRepository(db *gorm.DB) *SessionRepository {
	return &SessionRepository{db: db}
}

func (r *SessionRepository) Create(session *models.Session) error {
	return r.db.Create(session).Error
}

func (r *SessionRepository) FindByID(id uuid.UUID) (*models.Session, error) {
	var session models.Session
	err := r.db.Preload("Tokens").Preload("Host").First(&session, "id = ?", id).Error
	if err != nil {
		return nil, err
	}
	return &session, nil
}

func (r *SessionRepository) FindByCode(code string) (*models.Session, error) {
	var session models.Session
	err := r.db.Preload("Tokens").Preload("Host").First(&session, "session_code = ?", code).Error
	if err != nil {
		return nil, err
	}
	return &session, nil
}

func (r *SessionRepository) Update(session *models.Session) error {
	return r.db.Save(session).Error
}

func (r *SessionRepository) Delete(id uuid.UUID) error {
	return r.db.Delete(&models.Session{}, "id = ?", id).Error
}
