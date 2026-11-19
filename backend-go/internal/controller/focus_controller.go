package controller

import (
	"encoding/json"
	"net/http"
	"strconv"

	"github.com/flowstate/backend/internal/controller/middleware"
	"github.com/flowstate/backend/internal/domain"
	"github.com/flowstate/backend/internal/usecase"
	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
)

// FocusController handles HTTP requests for focus sessions.
type FocusController struct {
	focusUsecase usecase.FocusUsecase
}

// NewFocusController constructs a FocusController.
func NewFocusController(focusUsecase usecase.FocusUsecase) *FocusController {
	return &FocusController{focusUsecase: focusUsecase}
}

type createFocusSessionRequest struct {
	TaskID        *uuid.UUID `json:"task_id"`
	SessionType   string     `json:"session_type"`
	TargetMinutes int        `json:"target_minutes"`
}

type updateFocusSessionRequest struct {
	DurationSeconds int             `json:"duration_seconds"`
	DistractionLog  json.RawMessage `json:"distraction_log"`
	IsCompleted     bool            `json:"is_completed"`
}

func (ctrl *FocusController) CreateSession(c *gin.Context) {
	userID, err := middleware.GetUserID(c)
	if err != nil {
		respondError(c, domain.ErrUnauthorized)
		return
	}
	var req createFocusSessionRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		respondError(c, domain.ErrInvalidInput)
		return
	}
	session, err := ctrl.focusUsecase.CreateSession(c.Request.Context(), userID, req.TaskID, domain.SessionType(req.SessionType), req.TargetMinutes)
	if err != nil {
		respondError(c, err)
		return
	}
	respondSuccess(c, http.StatusCreated, session)
}

func (ctrl *FocusController) GetSession(c *gin.Context) {
	userID, err := middleware.GetUserID(c)
	if err != nil {
		respondError(c, domain.ErrUnauthorized)
		return
	}
	id, err := uuid.Parse(c.Param("id"))
	if err != nil {
		respondError(c, domain.ErrInvalidInput)
		return
	}
	session, err := ctrl.focusUsecase.GetSession(c.Request.Context(), id, userID)
	if err != nil {
		respondError(c, err)
		return
	}
	respondSuccess(c, http.StatusOK, session)
}

func (ctrl *FocusController) UpdateSession(c *gin.Context) {
	userID, err := middleware.GetUserID(c)
	if err != nil {
		respondError(c, domain.ErrUnauthorized)
		return
	}
	id, err := uuid.Parse(c.Param("id"))
	if err != nil {
		respondError(c, domain.ErrInvalidInput)
		return
	}
	var req updateFocusSessionRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		respondError(c, domain.ErrInvalidInput)
		return
	}
	session, err := ctrl.focusUsecase.EndSession(c.Request.Context(), id, userID, req.DurationSeconds, req.DistractionLog, req.IsCompleted)
	if err != nil {
		respondError(c, err)
		return
	}
	respondSuccess(c, http.StatusOK, session)
}

func (ctrl *FocusController) ListSessions(c *gin.Context) {
	userID, err := middleware.GetUserID(c)
	if err != nil {
		respondError(c, domain.ErrUnauthorized)
		return
	}
	limit := 50
	if l := c.Query("limit"); l != "" {
		if val, err := strconv.Atoi(l); err == nil && val > 0 {
			limit = val
		}
	}
	sessions, err := ctrl.focusUsecase.ListSessions(c.Request.Context(), userID, limit)
	if err != nil {
		respondError(c, err)
		return
	}
	respondSuccess(c, http.StatusOK, sessions)
}

func (ctrl *FocusController) GetStats(c *gin.Context) {
	userID, err := middleware.GetUserID(c)
	if err != nil {
		respondError(c, domain.ErrUnauthorized)
		return
	}
	stats, err := ctrl.focusUsecase.GetStats(c.Request.Context(), userID)
	if err != nil {
		respondError(c, err)
		return
	}
	respondSuccess(c, http.StatusOK, stats)
}

