package config

import (
	"fmt"
	"os"
)

type Config struct {
	Port       string
	Env        string
	DBHost     string
	DBPort     string
	DBUser     string
	DBPassword string
	DBName     string
	DBSSLMode  string
	JWTSecret  string
	CORSOrigin string
}

func GetDBConfig() *Config {
	return &Config{
		Port:       getEnv("PORT", "18080"),
		Env:        getEnv("NODE_ENV", "development"),
		DBHost:     getEnv("DB_HOST", "192.168.110.220"),
		DBPort:     getEnv("DB_PORT", "25432"),
		DBUser:     getEnv("DB_USER", "postgres"),
		DBPassword: getEnv("DB_PASSWORD", "admin123"),
		DBName:     getEnv("DB_NAME", "photobox"),
		DBSSLMode:  getEnv("DB_SSLMODE", "disable"),
		JWTSecret:  getEnv("JWT_SECRET", "dev-secret-key-change-me"),
		CORSOrigin: getEnv("CORS_ORIGINS", "http://localhost:5173"),
	}
}

func getEnv(key, fallback string) string {
	if value := os.Getenv(key); value != "" {
		return value
	}
	return fallback
}

func (c *Config) DSN() string {
	return fmt.Sprintf(
		"host=%s port=%s user=%s password=%s dbname=%s sslmode=%s",
		c.DBHost, c.DBPort, c.DBUser, c.DBPassword, c.DBName, c.DBSSLMode,
	)
}
