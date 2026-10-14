package handlers

import (
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"github.com/photobox/backend/internal/service"
)

type PhotoHandler struct {
	photoService *service.PhotoService
}

func NewPhotoHandler(photoService *service.PhotoService) *PhotoHandler {
	return &PhotoHandler{photoService: photoService}
}

func (h *PhotoHandler) Capture(c *gin.Context) {
	var req service.CaptureRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	photo, status, err := h.photoService.Capture(req)
	if err != nil {
		c.JSON(status, gin.H{"error": err.Error()})
		return
	}
	c.JSON(status, photo)
}

func (h *PhotoHandler) GetBySession(c *gin.Context) {
	sessionID, err := uuid.Parse(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid session id"})
		return
	}
	photos, status, err := h.photoService.GetPhotosBySession(sessionID)
	if err != nil {
		c.JSON(status, gin.H{"error": err.Error()})
		return
	}
	c.JSON(status, photos)
}

func (h *PhotoHandler) Download(c *gin.Context) {
	id, err := uuid.Parse(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid photo id"})
		return
	}
	photo, status, err := h.photoService.GetPhotoByID(id)
	if err != nil {
		c.JSON(status, gin.H{"error": err.Error()})
		return
	}
	c.JSON(status, photo)
}

func (h *PhotoHandler) Routes(r *gin.RouterGroup) {
	r.POST("/capture", h.Capture)
	r.GET("/session/:id", h.GetBySession)
	r.GET("/:id/download", h.Download)
}
