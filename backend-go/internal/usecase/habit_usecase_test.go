package usecase

import (
	"context"
	"testing"
	"time"

	"github.com/flowstate/backend/internal/domain"
	"github.com/google/uuid"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/mock"
)

func TestCreateHabit_Success(t *testing.T) {
	mockHabitRepo := new(MockHabitRepository)
	mockTaskRepo := new(MockTaskRepository)
	usecase := NewHabitUsecase(mockHabitRepo, mockTaskRepo)
	ctx := context.Background()

	userID := uuid.New()
	mockTaskRepo.On("Create", ctx, mock.MatchedBy(func(task *domain.Task) bool {
		return task.UserID == userID && task.Title == "Morning Jog" && task.IsRecurring == true
	})).Run(func(args mock.Arguments) {
		task := args.Get(1).(*domain.Task)
		task.ID = uuid.New()
	}).Return(nil)

	res, err := usecase.CreateHabit(ctx, CreateHabitInput{
		UserID: userID,
		Title:  "Morning Jog",
	})

	assert.NoError(t, err)
	assert.NotNil(t, res)
	assert.True(t, res.IsRecurring)
	assert.Equal(t, "Morning Jog", res.Title)
	assert.Equal(t, "daily", res.RecurrenceRule)
	mockTaskRepo.AssertExpectations(t)
}

func TestCreateHabit_InvalidInput(t *testing.T) {
	mockHabitRepo := new(MockHabitRepository)
	mockTaskRepo := new(MockTaskRepository)
	usecase := NewHabitUsecase(mockHabitRepo, mockTaskRepo)
	ctx := context.Background()

	res, err := usecase.CreateHabit(ctx, CreateHabitInput{
		UserID: uuid.New(),
		Title:  "",
	})

	assert.ErrorIs(t, err, domain.ErrInvalidInput)
	assert.Nil(t, res)
}

func TestCheckinHabit_TaskNotFound(t *testing.T) {
	mockHabitRepo := new(MockHabitRepository)
	mockTaskRepo := new(MockTaskRepository)
	usecase := NewHabitUsecase(mockHabitRepo, mockTaskRepo)
	ctx := context.Background()

	userID := uuid.New()
	taskID := uuid.New()
	mockTaskRepo.On("GetByID", ctx, taskID, userID).Return(nil, domain.ErrNotFound)

	streak, err := usecase.CheckinHabit(ctx, userID, taskID, time.Now())

	assert.ErrorIs(t, err, domain.ErrHabitNotFound)
	assert.Nil(t, streak)
	mockTaskRepo.AssertExpectations(t)
}

func TestCheckinHabit_TaskNotRecurring(t *testing.T) {
	mockHabitRepo := new(MockHabitRepository)
	mockTaskRepo := new(MockTaskRepository)
	usecase := NewHabitUsecase(mockHabitRepo, mockTaskRepo)
	ctx := context.Background()

	userID := uuid.New()
	taskID := uuid.New()
	regularTask := &domain.Task{
		ID:          taskID,
		UserID:      userID,
		Title:       "One-off Task",
		IsRecurring: false,
	}

	mockTaskRepo.On("GetByID", ctx, taskID, userID).Return(regularTask, nil)

	streak, err := usecase.CheckinHabit(ctx, userID, taskID, time.Now())

	assert.ErrorIs(t, err, domain.ErrHabitNotFound)
	assert.Nil(t, streak)
	mockTaskRepo.AssertExpectations(t)
}

func TestCheckinHabit_IdempotentSameDay(t *testing.T) {
	mockHabitRepo := new(MockHabitRepository)
	mockTaskRepo := new(MockTaskRepository)
	usecase := NewHabitUsecase(mockHabitRepo, mockTaskRepo)
	ctx := context.Background()

	userID := uuid.New()
	taskID := uuid.New()
	today := time.Date(2026, 10, 4, 12, 0, 0, 0, time.UTC)
	normalizedToday := time.Date(2026, 10, 4, 0, 0, 0, 0, time.UTC)

	habitTask := &domain.Task{
		ID:          taskID,
		UserID:      userID,
		Title:       "Daily Coding",
		IsRecurring: true,
	}

	existingStreak := &domain.HabitStreak{
		ID:             uuid.New(),
		UserID:         userID,
		TaskID:         taskID,
		StreakDate:     normalizedToday,
		CurrentStreak:  5,
		LongestStreak:  5,
		CompletedToday: true,
	}

	mockTaskRepo.On("GetByID", ctx, taskID, userID).Return(habitTask, nil)
	mockHabitRepo.On("GetStreakByDate", ctx, userID, taskID, normalizedToday).Return(existingStreak, nil)
	mockHabitRepo.On("UpsertStreak", ctx, mock.Anything).Return(nil)

	res, err := usecase.CheckinHabit(ctx, userID, taskID, today)

	assert.NoError(t, err)
	assert.Equal(t, 4, res.CurrentStreak)
	assert.False(t, res.CompletedToday)
	mockTaskRepo.AssertExpectations(t)
	mockHabitRepo.AssertExpectations(t)
}

func TestCheckinHabit_ConsecutiveDay(t *testing.T) {
	mockHabitRepo := new(MockHabitRepository)
	mockTaskRepo := new(MockTaskRepository)
	usecase := NewHabitUsecase(mockHabitRepo, mockTaskRepo)
	ctx := context.Background()

	userID := uuid.New()
	taskID := uuid.New()
	day2 := time.Date(2026, 10, 2, 14, 0, 0, 0, time.UTC)
	normalizedDay2 := time.Date(2026, 10, 2, 0, 0, 0, 0, time.UTC)
	normalizedYesterday := time.Date(2026, 10, 1, 0, 0, 0, 0, time.UTC)

	habitTask := &domain.Task{
		ID:          taskID,
		UserID:      userID,
		Title:       "Morning Meditation",
		IsRecurring: true,
	}

	yesterdayStreak := &domain.HabitStreak{
		StreakDate:     normalizedYesterday,
		CurrentStreak:  1,
		LongestStreak:  1,
		CompletedToday: true,
	}

	mockTaskRepo.On("GetByID", ctx, taskID, userID).Return(habitTask, nil)
	mockHabitRepo.On("GetStreakByDate", ctx, userID, taskID, normalizedDay2).Return(nil, domain.ErrNotFound)
	mockHabitRepo.On("GetStreakByDate", ctx, userID, taskID, normalizedYesterday).Return(yesterdayStreak, nil)
	mockHabitRepo.On("UpsertStreak", ctx, mock.MatchedBy(func(s *domain.HabitStreak) bool {
		return s.CurrentStreak == 2 && s.LongestStreak == 2 && s.CompletedToday == true
	})).Return(nil)

	res, err := usecase.CheckinHabit(ctx, userID, taskID, day2)

	assert.NoError(t, err)
	assert.Equal(t, 2, res.CurrentStreak)
	assert.Equal(t, 2, res.LongestStreak)
	mockTaskRepo.AssertExpectations(t)
	mockHabitRepo.AssertExpectations(t)
}

func TestCheckinHabit_BrokenStreak(t *testing.T) {
	mockHabitRepo := new(MockHabitRepository)
	mockTaskRepo := new(MockTaskRepository)
	usecase := NewHabitUsecase(mockHabitRepo, mockTaskRepo)
	ctx := context.Background()

	userID := uuid.New()
	taskID := uuid.New()
	day4 := time.Date(2026, 10, 4, 10, 0, 0, 0, time.UTC)
	normalizedDay4 := time.Date(2026, 10, 4, 0, 0, 0, 0, time.UTC)
	normalizedYesterday := time.Date(2026, 10, 3, 0, 0, 0, 0, time.UTC)

	habitTask := &domain.Task{
		ID:          taskID,
		UserID:      userID,
		Title:       "Morning Meditation",
		IsRecurring: true,
	}

	historicalLatest := &domain.HabitStreak{
		LongestStreak: 5,
	}

	mockTaskRepo.On("GetByID", ctx, taskID, userID).Return(habitTask, nil)
	mockHabitRepo.On("GetStreakByDate", ctx, userID, taskID, normalizedDay4).Return(nil, domain.ErrNotFound)
	// Yesterday was missed
	mockHabitRepo.On("GetStreakByDate", ctx, userID, taskID, normalizedYesterday).Return(nil, domain.ErrNotFound)
	mockHabitRepo.On("GetLatestStreak", ctx, userID, taskID).Return(historicalLatest, nil)
	mockHabitRepo.On("UpsertStreak", ctx, mock.MatchedBy(func(s *domain.HabitStreak) bool {
		// Streak resets to 1, longest preserved as 5
		return s.CurrentStreak == 1 && s.LongestStreak == 5 && s.CompletedToday == true
	})).Return(nil)

	res, err := usecase.CheckinHabit(ctx, userID, taskID, day4)

	assert.NoError(t, err)
	assert.Equal(t, 1, res.CurrentStreak)
	assert.Equal(t, 5, res.LongestStreak)
	mockTaskRepo.AssertExpectations(t)
	mockHabitRepo.AssertExpectations(t)
}

func TestDailyCheckin_Validation(t *testing.T) {
	mockHabitRepo := new(MockHabitRepository)
	mockTaskRepo := new(MockTaskRepository)
	usecase := NewHabitUsecase(mockHabitRepo, mockTaskRepo)
	ctx := context.Background()

	userID := uuid.New()

	// Invalid energy level > 5
	res, err := usecase.CreateDailyCheckin(ctx, userID, time.Now(), 6, "Feeling high energy", 5, 4)
	assert.ErrorIs(t, err, domain.ErrInvalidInput)
	assert.Nil(t, res)

	// Invalid energy level < 1
	res, err = usecase.CreateDailyCheckin(ctx, userID, time.Now(), 0, "No energy", 5, 0)
	assert.ErrorIs(t, err, domain.ErrInvalidInput)
	assert.Nil(t, res)

	// Valid energy level = 4
	mockHabitRepo.On("CreateDailyCheckin", ctx, mock.MatchedBy(func(d *domain.DailyCheckin) bool {
		return d.EnergyLevel == 4 && d.Reflection == "Great day"
	})).Return(nil)

	res, err = usecase.CreateDailyCheckin(ctx, userID, time.Now(), 4, "Great day", 5, 5)
	assert.NoError(t, err)
	assert.NotNil(t, res)
	assert.Equal(t, 4, res.EnergyLevel)
	mockHabitRepo.AssertExpectations(t)
}
