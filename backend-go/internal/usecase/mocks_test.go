package usecase

import (
	"context"
	"time"

	"github.com/flowstate/backend/internal/domain"
	"github.com/google/uuid"
	"github.com/stretchr/testify/mock"
)

// MockUserRepository is a testify mock for domain.UserRepository.
type MockUserRepository struct {
	mock.Mock
}

func (m *MockUserRepository) Create(ctx context.Context, user *domain.User) error {
	args := m.Called(ctx, user)
	return args.Error(0)
}

func (m *MockUserRepository) GetByID(ctx context.Context, id uuid.UUID) (*domain.User, error) {
	args := m.Called(ctx, id)
	if args.Get(0) == nil {
		return nil, args.Error(1)
	}
	return args.Get(0).(*domain.User), args.Error(1)
}

func (m *MockUserRepository) GetByEmail(ctx context.Context, email string) (*domain.User, error) {
	args := m.Called(ctx, email)
	if args.Get(0) == nil {
		return nil, args.Error(1)
	}
	return args.Get(0).(*domain.User), args.Error(1)
}

func (m *MockUserRepository) GetByUsername(ctx context.Context, username string) (*domain.User, error) {
	args := m.Called(ctx, username)
	if args.Get(0) == nil {
		return nil, args.Error(1)
	}
	return args.Get(0).(*domain.User), args.Error(1)
}

func (m *MockUserRepository) UpdateProfile(ctx context.Context, user *domain.User) error {
	args := m.Called(ctx, user)
	return args.Error(0)
}

func (m *MockUserRepository) UpdatePassword(ctx context.Context, id uuid.UUID, passwordHash string) error {
	args := m.Called(ctx, id, passwordHash)
	return args.Error(0)
}

func (m *MockUserRepository) UpdateAvatar(ctx context.Context, id uuid.UUID, avatarURL *string) error {
	args := m.Called(ctx, id, avatarURL)
	return args.Error(0)
}

// MockTaskRepository is a testify mock for domain.TaskRepository.
type MockTaskRepository struct {
	mock.Mock
}

func (m *MockTaskRepository) Create(ctx context.Context, task *domain.Task) error {
	args := m.Called(ctx, task)
	return args.Error(0)
}

func (m *MockTaskRepository) GetByID(ctx context.Context, id uuid.UUID, userID uuid.UUID) (*domain.Task, error) {
	args := m.Called(ctx, id, userID)
	if args.Get(0) == nil {
		return nil, args.Error(1)
	}
	return args.Get(0).(*domain.Task), args.Error(1)
}

func (m *MockTaskRepository) List(ctx context.Context, userID uuid.UUID, filter domain.TaskFilter) ([]*domain.Task, error) {
	args := m.Called(ctx, userID, filter)
	if args.Get(0) == nil {
		return nil, args.Error(1)
	}
	return args.Get(0).([]*domain.Task), args.Error(1)
}

func (m *MockTaskRepository) ListRecurring(ctx context.Context, userID uuid.UUID) ([]*domain.Task, error) {
	args := m.Called(ctx, userID)
	if args.Get(0) == nil {
		return nil, args.Error(1)
	}
	return args.Get(0).([]*domain.Task), args.Error(1)
}

func (m *MockTaskRepository) ListOverdue(ctx context.Context, userID uuid.UUID, before time.Time) ([]*domain.Task, error) {
	args := m.Called(ctx, userID, before)
	if args.Get(0) == nil {
		return nil, args.Error(1)
	}
	return args.Get(0).([]*domain.Task), args.Error(1)
}

func (m *MockTaskRepository) ListAtRisk(ctx context.Context, userID uuid.UUID, start time.Time, end time.Time) ([]*domain.Task, error) {
	args := m.Called(ctx, userID, start, end)
	if args.Get(0) == nil {
		return nil, args.Error(1)
	}
	return args.Get(0).([]*domain.Task), args.Error(1)
}

func (m *MockTaskRepository) Update(ctx context.Context, task *domain.Task) error {
	args := m.Called(ctx, task)
	return args.Error(0)
}

func (m *MockTaskRepository) MarkComplete(ctx context.Context, id uuid.UUID, userID uuid.UUID, completedAt time.Time) (*domain.Task, error) {
	args := m.Called(ctx, id, userID, completedAt)
	if args.Get(0) == nil {
		return nil, args.Error(1)
	}
	return args.Get(0).(*domain.Task), args.Error(1)
}

func (m *MockTaskRepository) UpdateSortOrder(ctx context.Context, id uuid.UUID, userID uuid.UUID, sortOrder int) error {
	args := m.Called(ctx, id, userID, sortOrder)
	return args.Error(0)
}

func (m *MockTaskRepository) Delete(ctx context.Context, id uuid.UUID, userID uuid.UUID) error {
	args := m.Called(ctx, id, userID)
	return args.Error(0)
}

// MockHabitRepository is a testify mock for domain.HabitRepository.
type MockHabitRepository struct {
	mock.Mock
}

func (m *MockHabitRepository) GetStreakByDate(ctx context.Context, userID uuid.UUID, taskID uuid.UUID, date time.Time) (*domain.HabitStreak, error) {
	args := m.Called(ctx, userID, taskID, date)
	if args.Get(0) == nil {
		return nil, args.Error(1)
	}
	return args.Get(0).(*domain.HabitStreak), args.Error(1)
}

func (m *MockHabitRepository) UpsertStreak(ctx context.Context, streak *domain.HabitStreak) error {
	args := m.Called(ctx, streak)
	return args.Error(0)
}

func (m *MockHabitRepository) ListStreaksByTask(ctx context.Context, userID uuid.UUID, taskID uuid.UUID, limit int) ([]*domain.HabitStreak, error) {
	args := m.Called(ctx, userID, taskID, limit)
	if args.Get(0) == nil {
		return nil, args.Error(1)
	}
	return args.Get(0).([]*domain.HabitStreak), args.Error(1)
}

func (m *MockHabitRepository) ListStreaksInRange(ctx context.Context, userID uuid.UUID, startDate time.Time, endDate time.Time) ([]*domain.HabitStreak, error) {
	args := m.Called(ctx, userID, startDate, endDate)
	if args.Get(0) == nil {
		return nil, args.Error(1)
	}
	return args.Get(0).([]*domain.HabitStreak), args.Error(1)
}

func (m *MockHabitRepository) GetLatestStreak(ctx context.Context, userID uuid.UUID, taskID uuid.UUID) (*domain.HabitStreak, error) {
	args := m.Called(ctx, userID, taskID)
	if args.Get(0) == nil {
		return nil, args.Error(1)
	}
	return args.Get(0).(*domain.HabitStreak), args.Error(1)
}

func (m *MockHabitRepository) CreateDailyCheckin(ctx context.Context, checkin *domain.DailyCheckin) error {
	args := m.Called(ctx, checkin)
	return args.Error(0)
}

func (m *MockHabitRepository) GetDailyCheckinByDate(ctx context.Context, userID uuid.UUID, date time.Time) (*domain.DailyCheckin, error) {
	args := m.Called(ctx, userID, date)
	if args.Get(0) == nil {
		return nil, args.Error(1)
	}
	return args.Get(0).(*domain.DailyCheckin), args.Error(1)
}

func (m *MockHabitRepository) ListDailyCheckins(ctx context.Context, userID uuid.UUID, limit int) ([]*domain.DailyCheckin, error) {
	args := m.Called(ctx, userID, limit)
	if args.Get(0) == nil {
		return nil, args.Error(1)
	}
	return args.Get(0).([]*domain.DailyCheckin), args.Error(1)
}
