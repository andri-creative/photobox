package handlers

import (
	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"github.com/photobox/backend/internal/service"
)

type AuthHandler struct {
	authService *service.AuthService
	jwtSecret   string
}

func NewAuthHandler(authService *service.AuthService, jwtSecret string) *AuthHandler {
	return &AuthHandler{authService: authService, jwtSecret: jwtSecret}
}

func (h *AuthHandler) Register(c *gin.Context) {
	var req service.RegisterRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(400, gin.H{"error": err.Error()})
		return
	}
	resp, status, err := h.authService.Register(req)
	if err != nil {
		c.JSON(status, gin.H{"error": err.Error()})
		return
	}
	c.JSON(status, resp)
}

func (h *AuthHandler) Login(c *gin.Context) {
	var req service.LoginRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(400, gin.H{"error": err.Error()})
		return
	}
	resp, status, err := h.authService.Login(req, h.jwtSecret)
	if err != nil {
		c.JSON(status, gin.H{"error": err.Error()})
		return
	}
	c.JSON(status, resp)
}

func (h *AuthHandler) Me(c *gin.Context) {
	userIDStr := c.GetString("userID")
	userID, err := uuid.Parse(userIDStr)
	if err != nil {
		c.JSON(400, gin.H{"error": "invalid user id"})
		return
	}
	user, status, err := h.authService.Me(userID)
	if err != nil {
		c.JSON(status, gin.H{"error": err.Error()})
		return
	}
	c.JSON(status, gin.H{"user": user})
}

func (h *AuthHandler) Routes(r *gin.RouterGroup) {
	r.POST("/register", h.Register)
	r.POST("/login", h.Login)
	r.GET("/me", h.Me)
}
