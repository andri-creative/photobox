package main

import (
	"log"

	"github.com/gin-gonic/gin"
	"github.com/photobox/backend/internal/config"
	"github.com/photobox/backend/internal/database"
	"github.com/photobox/backend/internal/handlers"
	"github.com/photobox/backend/internal/middleware"
	"github.com/photobox/backend/internal/models"
	"github.com/photobox/backend/internal/repository"
	"github.com/photobox/backend/internal/service"
)

func main() {
	cfg := config.GetDBConfig()

	db, err := database.Connect(cfg)
	if err != nil {
		log.Fatalf("Failed to connect to database: %v", err)
	}

	// Auto-migrate models
	if err := db.AutoMigrate(
		&models.User{},
		&models.Session{},
		&models.Token{},
		&models.Photo{},
	); err != nil {
		log.Fatalf("Failed to auto-migrate: %v", err)
	}
	log.Println("Database auto-migrated successfully")

	// Repositories
	userRepo := repository.NewUserRepository(db)
	sessionRepo := repository.NewSessionRepository(db)
	tokenRepo := repository.NewTokenRepository(db)
	photoRepo := repository.NewPhotoRepository(db)

	// Services
	authService := service.NewAuthService(userRepo)
	sessionService := service.NewSessionService(sessionRepo, tokenRepo)
	photoService := service.NewPhotoService(photoRepo)

	// Handlers
	authHandler := handlers.NewAuthHandler(authService, cfg.JWTSecret)
	sessionHandler := handlers.NewSessionHandler(sessionService)
	photoHandler := handlers.NewPhotoHandler(photoService)
	cameraHandler := handlers.NewCameraHandler()

	// Gin
	router := gin.Default()

	// CORS
	router.Use(middleware.CORS(cfg.CORSOrigin))

	// Health check
	router.GET("/health", func(c *gin.Context) {
		c.JSON(200, gin.H{"status": "ok"})
	})

	// API routes
	v1 := router.Group("/api/v1")

	// Auth routes
	auth := v1.Group("/auth")
	{
		auth.POST("/register", authHandler.Register)
		auth.POST("/login", authHandler.Login)
		auth.GET("/me", middleware.JWTAuth(cfg.JWTSecret), authHandler.Me)
	}

	// Protected routes
	protected := v1.Group("", middleware.JWTAuth(cfg.JWTSecret))
	{
		// Session routes
		sessions := protected.Group("/sessions")
		{
			sessions.POST("/", sessionHandler.Create)
			sessions.GET("/:id", sessionHandler.Get)
			sessions.GET("/:id/tokens", sessionHandler.GetTokens)
			sessions.POST("/:id/join", sessionHandler.Join)
			sessions.DELETE("/:id", sessionHandler.Delete)
		}

		// Camera routes
		camera := protected.Group("/camera")
		{
			camera.POST("/stream", cameraHandler.StartStream)
			camera.POST("/stop", cameraHandler.StopStream)
		}

		// Photo routes
		photos := protected.Group("/photos")
		{
			photos.POST("/capture", photoHandler.Capture)
			photos.GET("/session/:id", photoHandler.GetBySession)
			photos.GET("/:id/download", photoHandler.Download)
		}
	}

	port := cfg.Port
	log.Printf("Server starting on port %s", port)
	router.Run(":" + port)
}
