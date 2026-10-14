package service

import (
	"errors"
	"net/http"
	"time"

	"github.com/google/uuid"
	"github.com/photobox/backend/internal/models"
	"github.com/photobox/backend/internal/repository"
	"github.com/photobox/backend/internal/utils"
)

type SessionService struct {
	sessionRepo *repository.SessionRepository
	tokenRepo   *repository.TokenRepository
}

func NewSessionService(
	sessionRepo *repository.SessionRepository,
	tokenRepo *repository.TokenRepository,
) *SessionService {
	return &SessionService{sessionRepo: sessionRepo, tokenRepo: tokenRepo}
}

type CreateSessionRequest struct {
	BackgroundImage string `json:"backgroundImage"`
}

func (s *SessionService) CreateSession(hostID uuid.UUID, req CreateSessionRequest) (*models.Session, int, error) {
	bg := req.BackgroundImage
	if bg == "" {
		bg = "beach"
	}

	session := &models.Session{
		ID:              utils.GenerateUUID(),
		HostID:          hostID,
		SessionCode:     utils.GenerateSessionCode(),
		BackgroundImage: bg,
		Active:          true,
	}
	if err := s.sessionRepo.Create(session); err != nil {
		return nil, http.StatusInternalServerError, err
	}

	tokens := make([]models.Token, 0, 6)
	for i := 0; i < 6; i++ {
		tokens = append(tokens, models.Token{
			ID:        utils.GenerateUUID(),
			SessionID: session.ID,
			Token:     utils.GenerateJoinToken(),
			Used:      false,
		})
	}
	if err := s.tokenRepo.CreateBatch(tokens); err != nil {
		return nil, http.StatusInternalServerError, err
	}

	session.Tokens = tokens
	return session, http.StatusCreated, nil
}

type JoinRequest struct {
	Token string `json:"token" binding:"required"`
}

const TOKEN_TTL = 30 * time.Minute

func (s *SessionService) JoinSession(sessionID uuid.UUID, req JoinRequest, guestID uuid.UUID) (*models.Session, int, error) {
	session, err := s.sessionRepo.FindByID(sessionID)
	if err != nil {
		return nil, http.StatusNotFound, errors.New("session not found")
	}
	if !session.Active {
		return nil, http.StatusGone, errors.New("session is no longer active")
	}

	token, err := s.tokenRepo.FindByToken(req.Token, sessionID)
	if err != nil {
		return nil, http.StatusUnauthorized, errors.New("invalid or used token")
	}
	if token.Used {
		return nil, http.StatusConflict, errors.New("token already used")
	}
	if time.Since(token.CreatedAt) > TOKEN_TTL {
		return nil, http.StatusGone, errors.New("token expired (30 min TTL)")
	}

	if err := s.tokenRepo.MarkUsed(token.ID, &guestID); err != nil {
		return nil, http.StatusInternalServerError, err
	}
	return session, http.StatusOK, nil
}

func (s *SessionService) GetSession(id uuid.UUID) (*models.Session, int, error) {
	session, err := s.sessionRepo.FindByID(id)
	if err != nil {
		return nil, http.StatusNotFound, err
	}
	return session, http.StatusOK, nil
}

func (s *SessionService) DeleteSession(id uuid.UUID) (int, error) {
	err := s.sessionRepo.Delete(id)
	if err != nil {
		return http.StatusInternalServerError, err
	}
	return http.StatusNoContent, nil
}
