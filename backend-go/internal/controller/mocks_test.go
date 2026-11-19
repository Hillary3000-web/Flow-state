package controller

import (
	"context"
	"time"

	"github.com/flowstate/backend/internal/domain"
	"github.com/flowstate/backend/internal/usecase"
	"github.com/google/uuid"
	"github.com/stretchr/testify/mock"
)

// MockAuthUsecase is a testify mock for usecase.AuthUsecase.
type MockAuthUsecase struct {
	mock.Mock
}

func (m *MockAuthUsecase) Register(ctx context.Context, in usecase.RegisterInput) (*usecase.AuthResponse, error) {
	args := m.Called(ctx, in)
	if args.Get(0) == nil {
		return nil, args.Error(1)
	}
	return args.Get(0).(*usecase.AuthResponse), args.Error(1)
}

func (m *MockAuthUsecase) Login(ctx context.Context, in usecase.LoginInput) (*usecase.AuthResponse, error) {
	args := m.Called(ctx, in)
	if args.Get(0) == nil {
		return nil, args.Error(1)
	}
	return args.Get(0).(*usecase.AuthResponse), args.Error(1)
}

func (m *MockAuthUsecase) RefreshToken(ctx context.Context, refreshToken string) (*usecase.TokenPair, error) {
	args := m.Called(ctx, refreshToken)
	if args.Get(0) == nil {
		return nil, args.Error(1)
	}
	return args.Get(0).(*usecase.TokenPair), args.Error(1)
}

func (m *MockAuthUsecase) GetMe(ctx context.Context, userID uuid.UUID) (*domain.User, error) {
	args := m.Called(ctx, userID)
	if args.Get(0) == nil {
		return nil, args.Error(1)
	}
	return args.Get(0).(*domain.User), args.Error(1)
}

func (m *MockAuthUsecase) UpdateProfile(ctx context.Context, userID uuid.UUID, fullName *string, timezone *string, theme *domain.Theme, preferences []byte) (*domain.User, error) {
	args := m.Called(ctx, userID, fullName, timezone, theme, preferences)
	if args.Get(0) == nil {
		return nil, args.Error(1)
	}
	return args.Get(0).(*domain.User), args.Error(1)
}

func (m *MockAuthUsecase) ChangePassword(ctx context.Context, userID uuid.UUID, oldPassword, newPassword string) error {
	args := m.Called(ctx, userID, oldPassword, newPassword)
	return args.Error(0)
}

// MockHabitUsecase is a testify mock for usecase.HabitUsecase.
type MockHabitUsecase struct {
	mock.Mock
}

func (m *MockHabitUsecase) CreateHabit(ctx context.Context, in usecase.CreateHabitInput) (*domain.Task, error) {
	args := m.Called(ctx, in)
	if args.Get(0) == nil {
		return nil, args.Error(1)
	}
	return args.Get(0).(*domain.Task), args.Error(1)
}

func (m *MockHabitUsecase) ListHabits(ctx context.Context, userID uuid.UUID) ([]*domain.Task, error) {
	args := m.Called(ctx, userID)
	if args.Get(0) == nil {
		return nil, args.Error(1)
	}
	return args.Get(0).([]*domain.Task), args.Error(1)
}

func (m *MockHabitUsecase) CheckinHabit(ctx context.Context, userID uuid.UUID, taskID uuid.UUID, checkinDate time.Time) (*domain.HabitStreak, error) {
	args := m.Called(ctx, userID, taskID, checkinDate)
	if args.Get(0) == nil {
		return nil, args.Error(1)
	}
	return args.Get(0).(*domain.HabitStreak), args.Error(1)
}

func (m *MockHabitUsecase) GetStreakHistory(ctx context.Context, userID uuid.UUID, taskID uuid.UUID, limit int) ([]*domain.HabitStreak, error) {
	args := m.Called(ctx, userID, taskID, limit)
	if args.Get(0) == nil {
		return nil, args.Error(1)
	}
	return args.Get(0).([]*domain.HabitStreak), args.Error(1)
}

func (m *MockHabitUsecase) GetHabitProgress(ctx context.Context, userID uuid.UUID) ([]*domain.HabitProgress, error) {
	args := m.Called(ctx, userID)
	if args.Get(0) == nil {
		return nil, args.Error(1)
	}
	return args.Get(0).([]*domain.HabitProgress), args.Error(1)
}

func (m *MockHabitUsecase) CreateDailyCheckin(ctx context.Context, userID uuid.UUID, date time.Time, energyLevel int, reflection string, tasksPlanned int, tasksCompleted int) (*domain.DailyCheckin, error) {
	args := m.Called(ctx, userID, date, energyLevel, reflection, tasksPlanned, tasksCompleted)
	if args.Get(0) == nil {
		return nil, args.Error(1)
	}
	return args.Get(0).(*domain.DailyCheckin), args.Error(1)
}

func (m *MockHabitUsecase) GetDailyCheckin(ctx context.Context, userID uuid.UUID, date time.Time) (*domain.DailyCheckin, error) {
	args := m.Called(ctx, userID, date)
	if args.Get(0) == nil {
		return nil, args.Error(1)
	}
	return args.Get(0).(*domain.DailyCheckin), args.Error(1)
}

func (m *MockHabitUsecase) ListDailyCheckins(ctx context.Context, userID uuid.UUID, limit int) ([]*domain.DailyCheckin, error) {
	args := m.Called(ctx, userID, limit)
	if args.Get(0) == nil {
		return nil, args.Error(1)
	}
	return args.Get(0).([]*domain.DailyCheckin), args.Error(1)
}

func (m *MockHabitUsecase) DeleteHabit(ctx context.Context, userID uuid.UUID, taskID uuid.UUID) error {
	args := m.Called(ctx, userID, taskID)
	return args.Error(0)
}

