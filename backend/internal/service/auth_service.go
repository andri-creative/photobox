package service

import (
	"errors"
	"net/http"

	"github.com/google/uuid"
	"github.com/photobox/backend/internal/models"
	"github.com/photobox/backend/internal/repository"
	"github.com/photobox/backend/internal/utils"
)

type AuthService struct {
	userRepo *repository.UserRepository
}

func NewAuthService(userRepo *repository.UserRepository) *AuthService {
	return &AuthService{userRepo: userRepo}
}

type RegisterRequest struct {
	Username string `json:"username" binding:"required,min=3,max=50"`
	Password string `json:"password" binding:"required,min=6"`
	Role     string `json:"role"`
}

type LoginRequest struct {
	Username string `json:"username" binding:"required"`
	Password string `json:"password" binding:"required"`
}

type AuthResponse struct {
	Token string       `json:"token"`
	User  *models.User `json:"user"`
}

func (s *AuthService) Register(req RegisterRequest) (*AuthResponse, int, error) {
	exists, _ := s.userRepo.Exists(req.Username)
	if exists {
		return nil, http.StatusConflict, errors.New("username already exists")
	}

	hash, err := utils.HashPassword(req.Password)
	if err != nil {
		return nil, http.StatusInternalServerError, err
	}

	role := req.Role
	if role == "" {
		role = "guest"
	}

	user := &models.User{
		ID:           utils.GenerateUUID(),
		Username:     req.Username,
		PasswordHash: hash,
		Role:         role,
	}
	if err := s.userRepo.Create(user); err != nil {
		return nil, http.StatusInternalServerError, err
	}

	return &AuthResponse{User: user}, http.StatusCreated, nil
}

func (s *AuthService) Login(req LoginRequest, jwtSecret string) (*AuthResponse, int, error) {
	user, err := s.userRepo.FindByUsername(req.Username)
	if err != nil {
		return nil, http.StatusNotFound, errors.New("user not found")
	}
	if !utils.VerifyPassword(user.PasswordHash, req.Password) {
		return nil, http.StatusUnauthorized, errors.New("invalid credentials")
	}

	token, err := utils.GenerateJWT(user.ID, user.Username, user.Role, jwtSecret)
	if err != nil {
		return nil, http.StatusInternalServerError, err
	}

	return &AuthResponse{Token: token, User: user}, http.StatusOK, nil
}

func (s *AuthService) Me(userUUID uuid.UUID) (*models.User, int, error) {
	user, err := s.userRepo.FindByID(userUUID)
	if err != nil {
		return nil, http.StatusNotFound, err
	}
	return user, http.StatusOK, nil
}
