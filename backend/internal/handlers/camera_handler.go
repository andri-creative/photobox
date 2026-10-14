package handlers

import (
	"net/http"

	"github.com/gin-gonic/gin"
)

type CameraHandler struct {
	// Placeholder untuk kamera stream management
	// Implementasi GoCV akan ditambahkan nanti
}

func NewCameraHandler() *CameraHandler {
	return &CameraHandler{}
}

func (h *CameraHandler) StartStream(c *gin.Context) {
	// Placeholder: akan diimplementasikan dengan GoCV
	c.JSON(http.StatusNotImplemented, gin.H{
		"error":   "Camera stream not implemented yet",
		"message": "Use HTML5 Media Devices API on frontend for camera access",
	})
}

func (h *CameraHandler) StopStream(c *gin.Context) {
	// Placeholder
	c.JSON(http.StatusNoContent, nil)
}

func (h *CameraHandler) Routes(r *gin.RouterGroup) {
	r.POST("/stream", h.StartStream)
	r.POST("/stop", h.StopStream)
}
