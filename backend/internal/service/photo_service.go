package service

import (
	"errors"
	"net/http"

	"github.com/google/uuid"
	"github.com/photobox/backend/internal/models"
	"github.com/photobox/backend/internal/repository"
)

type PhotoService struct {
	photoRepo *repository.PhotoRepository
}

func NewPhotoService(photoRepo *repository.PhotoRepository) *PhotoService {
	return &PhotoService{photoRepo: photoRepo}
}

type CaptureRequest struct {
	SessionID   uuid.UUID `json:"sessionId"`
	ImagePath   string    `json:"imagePath" binding:"required"`
	ThumbnailPath string  `json:"thumbnailPath"`
}

func (s *PhotoService) Capture(req CaptureRequest) (*models.Photo, int, error) {
	photo := &models.Photo{
		ID:            uuid.New(),
		SessionID:     req.SessionID,
		ImagePath:     req.ImagePath,
		ThumbnailPath: req.ThumbnailPath,
	}
	if err := s.photoRepo.Create(photo); err != nil {
		return nil, http.StatusInternalServerError, err
	}
	return photo, http.StatusCreated, nil
}

func (s *PhotoService) GetPhotosBySession(sessionID uuid.UUID) ([]models.Photo, int, error) {
	photos, err := s.photoRepo.FindBySessionID(sessionID)
	if err != nil {
		return nil, http.StatusInternalServerError, err
	}
	return photos, http.StatusOK, nil
}

func (s *PhotoService) GetPhotoByID(id uuid.UUID) (*models.Photo, int, error) {
	photo, err := s.photoRepo.FindByID(id)
	if err != nil {
		return nil, http.StatusNotFound, errors.New("photo not found")
	}
	return photo, http.StatusOK, nil
}
