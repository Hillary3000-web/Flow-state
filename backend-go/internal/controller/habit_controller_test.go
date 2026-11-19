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

func TestHabitController_CreateHabit_Success(t *testing.T) {
	mockHabit := new(MockHabitUsecase)
	ctrl := NewHabitController(mockHabit)

	userID := uuid.New()
	r := gin.New()
	r.POST("/habits", func(c *gin.Context) {
		c.Set(middleware.ContextUserIDKey, userID)
		ctrl.CreateHabit(c)
	})

	reqBody := createHabitRequest{
		Title:          "Deep Reading",
		Description:    "Read 20 pages every day",
		Priority:       domain.PriorityP2,
		EnergyLevel:    domain.EnergyMedium,
		RecurrenceRule: "daily",
	}
	bodyBytes, _ := json.Marshal(reqBody)

	mockHabit.On("CreateHabit", mock.Anything, usecase.CreateHabitInput{
		UserID:         userID,
		Title:          reqBody.Title,
		Description:    reqBody.Description,
		Priority:       reqBody.Priority,
		EnergyLevel:    reqBody.EnergyLevel,
		RecurrenceRule: reqBody.RecurrenceRule,
	}).Return(&domain.Task{
		ID:          uuid.New(),
		UserID:      userID,
		Title:       reqBody.Title,
		IsRecurring: true,
	}, nil)

	req, _ := http.NewRequest(http.MethodPost, "/habits", bytes.NewReader(bodyBytes))
	req.Header.Set("Content-Type", "application/json")
	w := httptest.NewRecorder()

	r.ServeHTTP(w, req)

	assert.Equal(t, http.StatusCreated, w.Code)
	mockHabit.AssertExpectations(t)
}

func TestHabitController_CreateHabit_BadRequest(t *testing.T) {
	mockHabit := new(MockHabitUsecase)
	ctrl := NewHabitController(mockHabit)

	userID := uuid.New()
	r := gin.New()
	r.POST("/habits", func(c *gin.Context) {
		c.Set(middleware.ContextUserIDKey, userID)
		ctrl.CreateHabit(c)
	})

	// Missing title
	req, _ := http.NewRequest(http.MethodPost, "/habits", bytes.NewReader([]byte(`{}`)))
	req.Header.Set("Content-Type", "application/json")
	w := httptest.NewRecorder()

	r.ServeHTTP(w, req)

	assert.Equal(t, http.StatusBadRequest, w.Code)
}

func TestHabitController_ListHabits_Success(t *testing.T) {
	mockHabit := new(MockHabitUsecase)
	ctrl := NewHabitController(mockHabit)

	userID := uuid.New()
	r := gin.New()
	r.GET("/habits", func(c *gin.Context) {
		c.Set(middleware.ContextUserIDKey, userID)
		ctrl.ListHabits(c)
	})

	mockHabit.On("ListHabits", mock.Anything, userID).Return([]*domain.Task{
		{ID: uuid.New(), UserID: userID, Title: "Habit 1", IsRecurring: true},
		{ID: uuid.New(), UserID: userID, Title: "Habit 2", IsRecurring: true},
	}, nil)

	req, _ := http.NewRequest(http.MethodGet, "/habits", nil)
	w := httptest.NewRecorder()

	r.ServeHTTP(w, req)

	assert.Equal(t, http.StatusOK, w.Code)
	mockHabit.AssertExpectations(t)
}

func TestHabitController_CheckinHabit_Success(t *testing.T) {
	mockHabit := new(MockHabitUsecase)
	ctrl := NewHabitController(mockHabit)

	userID := uuid.New()
	taskID := uuid.New()
	r := gin.New()
	r.POST("/habits/:id/checkin", func(c *gin.Context) {
		c.Set(middleware.ContextUserIDKey, userID)
		ctrl.CheckinHabit(c)
	})

	mockHabit.On("CheckinHabit", mock.Anything, userID, taskID, mock.AnythingOfType("time.Time")).Return(&domain.HabitStreak{
		ID:             uuid.New(),
		UserID:         userID,
		TaskID:         taskID,
		CurrentStreak:  3,
		LongestStreak:  3,
		CompletedToday: true,
	}, nil)

	req, _ := http.NewRequest(http.MethodPost, "/habits/"+taskID.String()+"/checkin", bytes.NewReader([]byte(`{}`)))
	req.Header.Set("Content-Type", "application/json")
	w := httptest.NewRecorder()

	r.ServeHTTP(w, req)

	assert.Equal(t, http.StatusOK, w.Code)
	mockHabit.AssertExpectations(t)
}

func TestHabitController_CheckinHabit_NotFound(t *testing.T) {
	mockHabit := new(MockHabitUsecase)
	ctrl := NewHabitController(mockHabit)

	userID := uuid.New()
	taskID := uuid.New()
	r := gin.New()
	r.POST("/habits/:id/checkin", func(c *gin.Context) {
		c.Set(middleware.ContextUserIDKey, userID)
		ctrl.CheckinHabit(c)
	})

	mockHabit.On("CheckinHabit", mock.Anything, userID, taskID, mock.AnythingOfType("time.Time")).Return(nil, domain.ErrHabitNotFound)

	req, _ := http.NewRequest(http.MethodPost, "/habits/"+taskID.String()+"/checkin", bytes.NewReader([]byte(`{}`)))
	req.Header.Set("Content-Type", "application/json")
	w := httptest.NewRecorder()

	r.ServeHTTP(w, req)

	assert.Equal(t, http.StatusNotFound, w.Code)
	mockHabit.AssertExpectations(t)
}

func TestHabitController_GetStreakHistory_Success(t *testing.T) {
	mockHabit := new(MockHabitUsecase)
	ctrl := NewHabitController(mockHabit)

	userID := uuid.New()
	taskID := uuid.New()
	r := gin.New()
	r.GET("/habits/:id/streaks", func(c *gin.Context) {
		c.Set(middleware.ContextUserIDKey, userID)
		ctrl.GetStreakHistory(c)
	})

	mockHabit.On("GetStreakHistory", mock.Anything, userID, taskID, 30).Return([]*domain.HabitStreak{
		{CurrentStreak: 2, CompletedToday: true},
	}, nil)

	req, _ := http.NewRequest(http.MethodGet, "/habits/"+taskID.String()+"/streaks", nil)
	w := httptest.NewRecorder()

	r.ServeHTTP(w, req)

	assert.Equal(t, http.StatusOK, w.Code)
	mockHabit.AssertExpectations(t)
}

func TestHabitController_GetHabitProgress_Success(t *testing.T) {
	mockHabit := new(MockHabitUsecase)
	ctrl := NewHabitController(mockHabit)

	userID := uuid.New()
	r := gin.New()
	r.GET("/habits/progress", func(c *gin.Context) {
		c.Set(middleware.ContextUserIDKey, userID)
		ctrl.GetHabitProgress(c)
	})

	mockHabit.On("GetHabitProgress", mock.Anything, userID).Return([]*domain.HabitProgress{
		{Title: "Workout", CompletedDays: 20, TotalDays: 30, CompletionRate: 66.7, CurrentStreak: 3},
	}, nil)

	req, _ := http.NewRequest(http.MethodGet, "/habits/progress", nil)
	w := httptest.NewRecorder()

	r.ServeHTTP(w, req)

	assert.Equal(t, http.StatusOK, w.Code)
	mockHabit.AssertExpectations(t)
}

func TestHabitController_CreateDailyCheckin_Success(t *testing.T) {
	mockHabit := new(MockHabitUsecase)
	ctrl := NewHabitController(mockHabit)

	userID := uuid.New()
	r := gin.New()
	r.POST("/habits/checkins", func(c *gin.Context) {
		c.Set(middleware.ContextUserIDKey, userID)
		ctrl.CreateDailyCheckin(c)
	})

	reqBody := createDailyCheckinRequest{
		EnergyLevel:    4,
		Reflection:     "Productive day",
		TasksPlanned:   5,
		TasksCompleted: 4,
	}
	bodyBytes, _ := json.Marshal(reqBody)

	mockHabit.On("CreateDailyCheckin", mock.Anything, userID, mock.AnythingOfType("time.Time"), 4, "Productive day", 5, 4).Return(&domain.DailyCheckin{
		ID:             uuid.New(),
		UserID:         userID,
		EnergyLevel:    4,
		Reflection:     "Productive day",
		TasksPlanned:   5,
		TasksCompleted: 4,
	}, nil)

	req, _ := http.NewRequest(http.MethodPost, "/habits/checkins", bytes.NewReader(bodyBytes))
	req.Header.Set("Content-Type", "application/json")
	w := httptest.NewRecorder()

	r.ServeHTTP(w, req)

	assert.Equal(t, http.StatusCreated, w.Code)
	mockHabit.AssertExpectations(t)
}

func TestHabitController_CreateDailyCheckin_InvalidEnergy(t *testing.T) {
	mockHabit := new(MockHabitUsecase)
	ctrl := NewHabitController(mockHabit)

	userID := uuid.New()
	r := gin.New()
	r.POST("/habits/checkins", func(c *gin.Context) {
		c.Set(middleware.ContextUserIDKey, userID)
		ctrl.CreateDailyCheckin(c)
	})

	// Invalid energy_level = 10 (validation max=5)
	badBody := []byte(`{"energy_level": 10}`)
	req, _ := http.NewRequest(http.MethodPost, "/habits/checkins", bytes.NewReader(badBody))
	req.Header.Set("Content-Type", "application/json")
	w := httptest.NewRecorder()

	r.ServeHTTP(w, req)

	assert.Equal(t, http.StatusBadRequest, w.Code)
}
