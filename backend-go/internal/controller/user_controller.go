package controller

import (
	"encoding/json"
	"net/http"

	"github.com/flowstate/backend/internal/controller/middleware"
	"github.com/flowstate/backend/internal/domain"
	"github.com/flowstate/backend/internal/usecase"
	"github.com/gin-gonic/gin"
)

// UserController handles HTTP requests for authentication and user accounts.
type UserController struct {
	authUsecase usecase.AuthUsecase
}

// NewUserController constructs a UserController.
func NewUserController(authUsecase usecase.AuthUsecase) *UserController {
	return &UserController{
		authUsecase: authUsecase,
	}
}

type registerRequest struct {
	Email    string `json:"email" binding:"required,email"`
	Username string `json:"username" binding:"required"`
	Password string `json:"password" binding:"required,min=6"`
	FullName string `json:"full_name"`
}

// Register godoc
// POST /api/v1/auth/register
func (ctrl *UserController) Register(c *gin.Context) {
	var req registerRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		respondError(c, domain.ErrInvalidInput)
		return
	}

	result, err := ctrl.authUsecase.Register(c.Request.Context(), usecase.RegisterInput{
		Email:    req.Email,
		Username: req.Username,
		Password: req.Password,
		FullName: req.FullName,
	})
	if err != nil {
		respondError(c, err)
		return
	}

	respondSuccess(c, http.StatusCreated, result)
}

type loginRequest struct {
	Email    string `json:"email" binding:"required,email"`
	Password string `json:"password" binding:"required"`
}

// Login godoc
// POST /api/v1/auth/login
func (ctrl *UserController) Login(c *gin.Context) {
	var req loginRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		respondError(c, domain.ErrInvalidCredentials)
		return
	}

	result, err := ctrl.authUsecase.Login(c.Request.Context(), usecase.LoginInput{
		Email:    req.Email,
		Password: req.Password,
	})
	if err != nil {
		respondError(c, err)
		return
	}

	respondSuccess(c, http.StatusOK, result)
}

type refreshTokenRequest struct {
	RefreshToken string `json:"refresh_token"`
	Refresh      string `json:"refresh"` // Django SimpleJWT compatibility
}

// RefreshToken godoc
// POST /api/v1/auth/refresh
func (ctrl *UserController) RefreshToken(c *gin.Context) {
	var req refreshTokenRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		respondError(c, domain.ErrInvalidInput)
		return
	}

	tokenStr := req.RefreshToken
	if tokenStr == "" {
		tokenStr = req.Refresh
	}
	if tokenStr == "" {
		respondError(c, domain.ErrInvalidInput)
		return
	}

	tokens, err := ctrl.authUsecase.RefreshToken(c.Request.Context(), tokenStr)
	if err != nil {
		respondError(c, err)
		return
	}

	respondSuccess(c, http.StatusOK, tokens)
}

// GetMe godoc
// GET /api/v1/auth/me
func (ctrl *UserController) GetMe(c *gin.Context) {
	userID, err := middleware.GetUserID(c)
	if err != nil {
		respondError(c, domain.ErrUnauthorized)
		return
	}

	user, err := ctrl.authUsecase.GetMe(c.Request.Context(), userID)
	if err != nil {
		respondError(c, err)
		return
	}

	respondSuccess(c, http.StatusOK, user)
}

type updateProfileRequest struct {
	FullName    *string          `json:"full_name"`
	Timezone    *string          `json:"timezone"`
	Theme       *domain.Theme    `json:"theme"`
	Preferences *json.RawMessage `json:"preferences"`
}

// UpdateProfile godoc
// PATCH /api/v1/auth/me
func (ctrl *UserController) UpdateProfile(c *gin.Context) {
	userID, err := middleware.GetUserID(c)
	if err != nil {
		respondError(c, domain.ErrUnauthorized)
		return
	}

	var req updateProfileRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		respondError(c, domain.ErrInvalidInput)
		return
	}

	var prefBytes []byte
	if req.Preferences != nil {
		prefBytes = []byte(*req.Preferences)
	}

	user, err := ctrl.authUsecase.UpdateProfile(
		c.Request.Context(),
		userID,
		req.FullName,
		req.Timezone,
		req.Theme,
		prefBytes,
	)
	if err != nil {
		respondError(c, err)
		return
	}

	respondSuccess(c, http.StatusOK, user)
}

type changePasswordRequest struct {
	OldPassword string `json:"old_password" binding:"required"`
	NewPassword string `json:"new_password" binding:"required,min=6"`
}

// ChangePassword godoc
// POST /api/v1/auth/change-password
func (ctrl *UserController) ChangePassword(c *gin.Context) {
	userID, err := middleware.GetUserID(c)
	if err != nil {
		respondError(c, domain.ErrUnauthorized)
		return
	}

	var req changePasswordRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		respondError(c, domain.ErrInvalidInput)
		return
	}

	if err := ctrl.authUsecase.ChangePassword(c.Request.Context(), userID, req.OldPassword, req.NewPassword); err != nil {
		respondError(c, err)
		return
	}

	respondSuccess(c, http.StatusOK, gin.H{
		"message": "password updated successfully",
	})
}
