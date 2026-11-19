package controller

import (
	"bytes"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/flowstate/backend/internal/controller/middleware"
	"github.com/flowstate/backend/internal/domain"
	"github.com/flowstate/backend/internal/usecase"
	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/mock"
)

func init() {
	gin.SetMode(gin.TestMode)
}

func TestUserController_Register_Success(t *testing.T) {
	mockAuth := new(MockAuthUsecase)
	ctrl := NewUserController(mockAuth)

	r := gin.New()
	r.POST("/register", ctrl.Register)

	reqBody := registerRequest{
		Email:    "test@example.com",
		Username: "testuser",
		Password: "Password123!",
		FullName: "Test User",
	}
	bodyBytes, _ := json.Marshal(reqBody)

	mockAuth.On("Register", mock.Anything, usecase.RegisterInput{
		Email:    reqBody.Email,
		Username: reqBody.Username,
		Password: reqBody.Password,
		FullName: reqBody.FullName,
	}).Return(&usecase.AuthResponse{
		User: &domain.User{
			ID:       uuid.New(),
			Email:    reqBody.Email,
			Username: reqBody.Username,
		},
		Tokens: &usecase.TokenPair{
			AccessToken:  "mock-access-token",
			RefreshToken: "mock-refresh-token",
		},
	}, nil)

	req, _ := http.NewRequest(http.MethodPost, "/register", bytes.NewReader(bodyBytes))
	req.Header.Set("Content-Type", "application/json")
	w := httptest.NewRecorder()

	r.ServeHTTP(w, req)

	assert.Equal(t, http.StatusCreated, w.Code)

	var resp Response
	err := json.Unmarshal(w.Body.Bytes(), &resp)
	assert.NoError(t, err)
	assert.True(t, resp.Success)
	mockAuth.AssertExpectations(t)
}

func TestUserController_Register_BadRequest(t *testing.T) {
	mockAuth := new(MockAuthUsecase)
	ctrl := NewUserController(mockAuth)

	r := gin.New()
	r.POST("/register", ctrl.Register)

	// Missing password and invalid email
	badBody := []byte(`{"email":"not-an-email"}`)
	req, _ := http.NewRequest(http.MethodPost, "/register", bytes.NewReader(badBody))
	req.Header.Set("Content-Type", "application/json")
	w := httptest.NewRecorder()

	r.ServeHTTP(w, req)

	assert.Equal(t, http.StatusBadRequest, w.Code)
}

func TestUserController_Register_Conflict(t *testing.T) {
	mockAuth := new(MockAuthUsecase)
	ctrl := NewUserController(mockAuth)

	r := gin.New()
	r.POST("/register", ctrl.Register)

	reqBody := registerRequest{
		Email:    "duplicate@example.com",
		Username: "dupuser",
		Password: "Password123!",
	}
	bodyBytes, _ := json.Marshal(reqBody)

	mockAuth.On("Register", mock.Anything, mock.Anything).Return(nil, domain.ErrUserAlreadyExists)

	req, _ := http.NewRequest(http.MethodPost, "/register", bytes.NewReader(bodyBytes))
	req.Header.Set("Content-Type", "application/json")
	w := httptest.NewRecorder()

	r.ServeHTTP(w, req)

	assert.Equal(t, http.StatusConflict, w.Code)
	mockAuth.AssertExpectations(t)
}

func TestUserController_Login_Success(t *testing.T) {
	mockAuth := new(MockAuthUsecase)
	ctrl := NewUserController(mockAuth)

	r := gin.New()
	r.POST("/login", ctrl.Login)

	reqBody := loginRequest{
		Email:    "user@example.com",
		Password: "ValidPassword123!",
	}
	bodyBytes, _ := json.Marshal(reqBody)

	mockAuth.On("Login", mock.Anything, usecase.LoginInput{
		Email:    reqBody.Email,
		Password: reqBody.Password,
	}).Return(&usecase.AuthResponse{
		User: &domain.User{
			ID:    uuid.New(),
			Email: reqBody.Email,
		},
		Tokens: &usecase.TokenPair{
			AccessToken: "access",
		},
	}, nil)

	req, _ := http.NewRequest(http.MethodPost, "/login", bytes.NewReader(bodyBytes))
	req.Header.Set("Content-Type", "application/json")
	w := httptest.NewRecorder()

	r.ServeHTTP(w, req)

	assert.Equal(t, http.StatusOK, w.Code)
	mockAuth.AssertExpectations(t)
}

func TestUserController_Login_Unauthorized(t *testing.T) {
	mockAuth := new(MockAuthUsecase)
	ctrl := NewUserController(mockAuth)

	r := gin.New()
	r.POST("/login", ctrl.Login)

	reqBody := loginRequest{
		Email:    "user@example.com",
		Password: "WrongPassword!",
	}
	bodyBytes, _ := json.Marshal(reqBody)

	mockAuth.On("Login", mock.Anything, mock.Anything).Return(nil, domain.ErrInvalidCredentials)

	req, _ := http.NewRequest(http.MethodPost, "/login", bytes.NewReader(bodyBytes))
	req.Header.Set("Content-Type", "application/json")
	w := httptest.NewRecorder()

	r.ServeHTTP(w, req)

	assert.Equal(t, http.StatusUnauthorized, w.Code)
	mockAuth.AssertExpectations(t)
}

func TestUserController_GetMe_Success(t *testing.T) {
	mockAuth := new(MockAuthUsecase)
	ctrl := NewUserController(mockAuth)

	userID := uuid.New()
	r := gin.New()
	r.GET("/me", func(c *gin.Context) {
		c.Set(middleware.ContextUserIDKey, userID)
		ctrl.GetMe(c)
	})

	mockAuth.On("GetMe", mock.Anything, userID).Return(&domain.User{
		ID:       userID,
		Email:    "me@example.com",
		Username: "meuser",
	}, nil)

	req, _ := http.NewRequest(http.MethodGet, "/me", nil)
	w := httptest.NewRecorder()

	r.ServeHTTP(w, req)

	assert.Equal(t, http.StatusOK, w.Code)
	mockAuth.AssertExpectations(t)
}

func TestUserController_GetMe_Unauthorized(t *testing.T) {
	mockAuth := new(MockAuthUsecase)
	ctrl := NewUserController(mockAuth)

	r := gin.New()
	// Route without setting user_id in context
	r.GET("/me", ctrl.GetMe)

	req, _ := http.NewRequest(http.MethodGet, "/me", nil)
	w := httptest.NewRecorder()

	r.ServeHTTP(w, req)

	assert.Equal(t, http.StatusUnauthorized, w.Code)
}

func TestUserController_ChangePassword_Success(t *testing.T) {
	mockAuth := new(MockAuthUsecase)
	ctrl := NewUserController(mockAuth)

	userID := uuid.New()
	r := gin.New()
	r.POST("/change-password", func(c *gin.Context) {
		c.Set(middleware.ContextUserIDKey, userID)
		ctrl.ChangePassword(c)
	})

	reqBody := changePasswordRequest{
		OldPassword: "OldPass123!",
		NewPassword: "NewPass456!",
	}
	bodyBytes, _ := json.Marshal(reqBody)

	mockAuth.On("ChangePassword", mock.Anything, userID, "OldPass123!", "NewPass456!").Return(nil)

	req, _ := http.NewRequest(http.MethodPost, "/change-password", bytes.NewReader(bodyBytes))
	req.Header.Set("Content-Type", "application/json")
	w := httptest.NewRecorder()

	r.ServeHTTP(w, req)

	assert.Equal(t, http.StatusOK, w.Code)
	mockAuth.AssertExpectations(t)
}

func TestUserController_ChangePassword_InvalidOldPassword(t *testing.T) {
	mockAuth := new(MockAuthUsecase)
	ctrl := NewUserController(mockAuth)

	userID := uuid.New()
	r := gin.New()
	r.POST("/change-password", func(c *gin.Context) {
		c.Set(middleware.ContextUserIDKey, userID)
		ctrl.ChangePassword(c)
	})

	reqBody := changePasswordRequest{
		OldPassword: "WrongOldPassword",
		NewPassword: "NewPass456!",
	}
	bodyBytes, _ := json.Marshal(reqBody)

	mockAuth.On("ChangePassword", mock.Anything, userID, "WrongOldPassword", "NewPass456!").Return(domain.ErrInvalidPassword)

	req, _ := http.NewRequest(http.MethodPost, "/change-password", bytes.NewReader(bodyBytes))
	req.Header.Set("Content-Type", "application/json")
	w := httptest.NewRecorder()

	r.ServeHTTP(w, req)

	assert.Equal(t, http.StatusBadRequest, w.Code)
	mockAuth.AssertExpectations(t)
}
