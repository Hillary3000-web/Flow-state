package middleware

import (
	"errors"
	"net/http"
	"strings"

	"github.com/flowstate/backend/internal/domain"
	"github.com/flowstate/backend/internal/usecase"
	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
)

const (
	ContextUserIDKey   = "user_id"
	ContextEmailKey    = "email"
	ContextUsernameKey = "username"
)

// JWTAuthMiddleware verifies Bearer token in Authorization header and stores claims in Gin context.
func JWTAuthMiddleware(jwtMgr *usecase.JWTManager) gin.HandlerFunc {
	return func(c *gin.Context) {
		authHeader := c.GetHeader("Authorization")
		if authHeader == "" {
			c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{
				"success": false,
				"error":   "authorization header is required",
			})
			return
		}

		parts := strings.SplitN(authHeader, " ", 2)
		if len(parts) != 2 || !strings.EqualFold(parts[0], "Bearer") {
			c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{
				"success": false,
				"error":   "authorization header format must be Bearer <token>",
			})
			return
		}

		tokenStr := parts[1]
		claims, err := jwtMgr.ValidateToken(tokenStr)
		if err != nil {
			c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{
				"success": false,
				"error":   "invalid or expired authorization token",
			})
			return
		}

		c.Set(ContextUserIDKey, claims.UserID)
		c.Set(ContextEmailKey, claims.Email)
		c.Set(ContextUsernameKey, claims.Username)

		c.Next()
	}
}

// GetUserID extracts the authenticated user's UUID from the Gin context.
func GetUserID(c *gin.Context) (uuid.UUID, error) {
	val, exists := c.Get(ContextUserIDKey)
	if !exists {
		return uuid.Nil, domain.ErrUnauthorized
	}
	userID, ok := val.(uuid.UUID)
	if !ok {
		return uuid.Nil, errors.New("invalid user id in context")
	}
	return userID, nil
}
