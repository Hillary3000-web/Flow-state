package controller

import (
	"errors"
	"log"
	"net/http"

	"github.com/flowstate/backend/internal/domain"
	"github.com/gin-gonic/gin"
)

// Response standard envelope for JSON outputs.
type Response struct {
	Success bool   `json:"success"`
	Data    any    `json:"data,omitempty"`
	Error   string `json:"error,omitempty"`
}

// respondSuccess sends a successful JSON response.
func respondSuccess(c *gin.Context, statusCode int, data any) {
	c.JSON(statusCode, Response{
		Success: true,
		Data:    data,
	})
}

// respondError maps domain errors to appropriate HTTP status codes and responds with JSON.
func respondError(c *gin.Context, err error) {
	statusCode := http.StatusInternalServerError
	errorMessage := err.Error()

	switch {
	case errors.Is(err, domain.ErrInvalidInput):
		statusCode = http.StatusBadRequest
	case errors.Is(err, domain.ErrInvalidCredentials):
		statusCode = http.StatusUnauthorized
	case errors.Is(err, domain.ErrInvalidPassword):
		statusCode = http.StatusBadRequest
	case errors.Is(err, domain.ErrUnauthorized):
		statusCode = http.StatusUnauthorized
	case errors.Is(err, domain.ErrForbidden):
		statusCode = http.StatusForbidden
	case errors.Is(err, domain.ErrNotFound):
		statusCode = http.StatusNotFound
	case errors.Is(err, domain.ErrUserNotFound):
		statusCode = http.StatusNotFound
	case errors.Is(err, domain.ErrHabitNotFound):
		statusCode = http.StatusNotFound
	case errors.Is(err, domain.ErrConflict):
		statusCode = http.StatusConflict
	case errors.Is(err, domain.ErrUserAlreadyExists):
		statusCode = http.StatusConflict
	case errors.Is(err, domain.ErrCheckinAlreadyExists):
		statusCode = http.StatusConflict
	default:
		log.Printf("[API ERROR] %s %s -> %v", c.Request.Method, c.Request.URL.Path, err)
		statusCode = http.StatusInternalServerError
		errorMessage = "an unexpected error occurred"
	}

	c.JSON(statusCode, Response{
		Success: false,
		Error:   errorMessage,
	})
}
