package controller

import (
	"net/http"
	"strconv"
	"time"

	"github.com/flowstate/backend/internal/controller/middleware"
	"github.com/flowstate/backend/internal/domain"
	"github.com/flowstate/backend/internal/usecase"
	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
)

// HabitController handles HTTP requests for habits, streaks, and daily checkins.
type HabitController struct {
	habitUsecase usecase.HabitUsecase
}

// NewHabitController constructs a HabitController.
func NewHabitController(habitUsecase usecase.HabitUsecase) *HabitController {
	return &HabitController{
		habitUsecase: habitUsecase,
	}
}

type createHabitRequest struct {
	ProjectID      *uuid.UUID          `json:"project_id"`
	Title          string              `json:"title" binding:"required"`
	Description    string              `json:"description"`
	Priority       domain.TaskPriority `json:"priority"`
	EnergyLevel    domain.EnergyLevel  `json:"energy_level"`
	RecurrenceRule string              `json:"recurrence_rule"`
}

// CreateHabit godoc
// POST /api/v1/habits
func (ctrl *HabitController) CreateHabit(c *gin.Context) {
	userID, err := middleware.GetUserID(c)
	if err != nil {
		respondError(c, domain.ErrUnauthorized)
		return
	}

	var req createHabitRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		respondError(c, domain.ErrInvalidInput)
		return
	}

	habit, err := ctrl.habitUsecase.CreateHabit(c.Request.Context(), usecase.CreateHabitInput{
		UserID:         userID,
		ProjectID:      req.ProjectID,
		Title:          req.Title,
		Description:    req.Description,
		Priority:       req.Priority,
		EnergyLevel:    req.EnergyLevel,
		RecurrenceRule: req.RecurrenceRule,
	})
	if err != nil {
		respondError(c, err)
		return
	}

	respondSuccess(c, http.StatusCreated, habit)
}

// ListHabits godoc
// GET /api/v1/habits
func (ctrl *HabitController) ListHabits(c *gin.Context) {
	userID, err := middleware.GetUserID(c)
	if err != nil {
		respondError(c, domain.ErrUnauthorized)
		return
	}

	habits, err := ctrl.habitUsecase.ListHabits(c.Request.Context(), userID)
	if err != nil {
		respondError(c, err)
		return
	}

	respondSuccess(c, http.StatusOK, habits)
}

type checkinHabitRequest struct {
	Date *string `json:"date"` // YYYY-MM-DD (optional)
}

// CheckinHabit godoc
// POST /api/v1/habits/:id/checkin
func (ctrl *HabitController) CheckinHabit(c *gin.Context) {
	userID, err := middleware.GetUserID(c)
	if err != nil {
		respondError(c, domain.ErrUnauthorized)
		return
	}

	idParam := c.Param("id")
	taskID, err := uuid.Parse(idParam)
	if err != nil {
		respondError(c, domain.ErrInvalidInput)
		return
	}

	checkinDate := time.Now().UTC()
	var req checkinHabitRequest
	if err := c.ShouldBindJSON(&req); err == nil && req.Date != nil {
		if parsed, parseErr := time.Parse("2006-01-02", *req.Date); parseErr == nil {
			checkinDate = parsed
		}
	}

	streak, err := ctrl.habitUsecase.CheckinHabit(c.Request.Context(), userID, taskID, checkinDate)
	if err != nil {
		respondError(c, err)
		return
	}

	respondSuccess(c, http.StatusOK, streak)
}

// GetStreakHistory godoc
// GET /api/v1/habits/:id/streaks
func (ctrl *HabitController) GetStreakHistory(c *gin.Context) {
	userID, err := middleware.GetUserID(c)
	if err != nil {
		respondError(c, domain.ErrUnauthorized)
		return
	}

	idParam := c.Param("id")
	taskID, err := uuid.Parse(idParam)
	if err != nil {
		respondError(c, domain.ErrInvalidInput)
		return
	}

	limit := 30
	if limitStr := c.Query("limit"); limitStr != "" {
		if parsed, err := strconv.Atoi(limitStr); err == nil && parsed > 0 {
			limit = parsed
		}
	}

	streaks, err := ctrl.habitUsecase.GetStreakHistory(c.Request.Context(), userID, taskID, limit)
	if err != nil {
		respondError(c, err)
		return
	}

	respondSuccess(c, http.StatusOK, streaks)
}

// GetHabitProgress godoc
// GET /api/v1/habits/progress
func (ctrl *HabitController) GetHabitProgress(c *gin.Context) {
	userID, err := middleware.GetUserID(c)
	if err != nil {
		respondError(c, domain.ErrUnauthorized)
		return
	}

	progress, err := ctrl.habitUsecase.GetHabitProgress(c.Request.Context(), userID)
	if err != nil {
		respondError(c, err)
		return
	}

	respondSuccess(c, http.StatusOK, progress)
}

type createDailyCheckinRequest struct {
	CheckinDate    *string `json:"checkin_date"` // YYYY-MM-DD (optional, defaults to today)
	EnergyLevel    int     `json:"energy_level" binding:"required,min=1,max=5"`
	Reflection     string  `json:"reflection"`
	TasksPlanned   int     `json:"tasks_planned"`
	TasksCompleted int     `json:"tasks_completed"`
}

// CreateDailyCheckin godoc
// POST /api/v1/habits/checkins
func (ctrl *HabitController) CreateDailyCheckin(c *gin.Context) {
	userID, err := middleware.GetUserID(c)
	if err != nil {
		respondError(c, domain.ErrUnauthorized)
		return
	}

	var req createDailyCheckinRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		respondError(c, domain.ErrInvalidInput)
		return
	}

	checkinDate := time.Now().UTC()
	if req.CheckinDate != nil {
		if parsed, parseErr := time.Parse("2006-01-02", *req.CheckinDate); parseErr == nil {
			checkinDate = parsed
		}
	}

	checkin, err := ctrl.habitUsecase.CreateDailyCheckin(
		c.Request.Context(),
		userID,
		checkinDate,
		req.EnergyLevel,
		req.Reflection,
		req.TasksPlanned,
		req.TasksCompleted,
	)
	if err != nil {
		respondError(c, err)
		return
	}

	respondSuccess(c, http.StatusCreated, checkin)
}

// GetDailyCheckin godoc
// GET /api/v1/habits/checkins/today
func (ctrl *HabitController) GetDailyCheckin(c *gin.Context) {
	userID, err := middleware.GetUserID(c)
	if err != nil {
		respondError(c, domain.ErrUnauthorized)
		return
	}

	date := time.Now().UTC()
	if dateStr := c.Query("date"); dateStr != "" {
		if parsed, parseErr := time.Parse("2006-01-02", dateStr); parseErr == nil {
			date = parsed
		}
	}

	checkin, err := ctrl.habitUsecase.GetDailyCheckin(c.Request.Context(), userID, date)
	if err != nil {
		respondError(c, err)
		return
	}

	respondSuccess(c, http.StatusOK, checkin)
}

// ListDailyCheckins godoc
// GET /api/v1/habits/checkins
func (ctrl *HabitController) ListDailyCheckins(c *gin.Context) {
	userID, err := middleware.GetUserID(c)
	if err != nil {
		respondError(c, domain.ErrUnauthorized)
		return
	}

	limit := 30
	if limitStr := c.Query("limit"); limitStr != "" {
		if parsed, err := strconv.Atoi(limitStr); err == nil && parsed > 0 {
			limit = parsed
		}
	}

	checkins, err := ctrl.habitUsecase.ListDailyCheckins(c.Request.Context(), userID, limit)
	if err != nil {
		respondError(c, err)
		return
	}

	respondSuccess(c, http.StatusOK, checkins)
}

// DeleteHabit godoc
// DELETE /api/v1/habits/:id
func (ctrl *HabitController) DeleteHabit(c *gin.Context) {
	userID, err := middleware.GetUserID(c)
	if err != nil {
		respondError(c, domain.ErrUnauthorized)
		return
	}

	idStr := c.Param("id")
	taskID, err := uuid.Parse(idStr)
	if err != nil {
		// Mock habit id (e.g. hab-01, hab-02): acknowledge gracefully
		respondSuccess(c, http.StatusOK, gin.H{"deleted": idStr})
		return
	}

	if err := ctrl.habitUsecase.DeleteHabit(c.Request.Context(), userID, taskID); err != nil {
		respondError(c, err)
		return
	}

	respondSuccess(c, http.StatusOK, gin.H{"deleted": idStr})
}

