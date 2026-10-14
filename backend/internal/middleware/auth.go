package middleware

import (
	"net/http"
	"strings"

	"github.com/gin-gonic/gin"
	"github.com/golang-jwt/jwt/v5"
)

type ContextUser struct {
	UserID   string
	Username string
	Role     string
}

func JWTAuth(secretKey string) gin.HandlerFunc {
	return func(c *gin.Context) {
		authHeader := c.GetHeader("Authorization")
		if authHeader == "" {
			c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{
				"error": "AUTH_TOKEN_MISSING",
			})
			return
		}

		tokenString, ok := strings.CutPrefix(authHeader, "Bearer ")
		if !ok {
			c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{
				"error": "AUTH_TOKEN_INVALID",
			})
			return
		}

		claims, err := jwt.ParseWithClaims(
			tokenString,
			jwt.MapClaims{},
			func(token *jwt.Token) (interface{}, error) {
				return []byte(secretKey), nil
			},
		)
		if err != nil || !claims.Valid {
			c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{
				"error": "TOKEN_EXPIRED_OR_INVALID",
			})
			return
		}

		mappedClaims := claims.Claims.(jwt.MapClaims)
		c.Set("userID", mappedClaims["userID"].(string))
		c.Set("username", mappedClaims["username"])
		c.Set("role", mappedClaims["role"])
		c.Next()
	}
}
