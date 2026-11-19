package domain

import (
	"context"
	"time"

	"github.com/google/uuid"
)

// HabitStreak tracks daily habit completion streaks for recurring tasks.
type HabitStreak struct {
	ID             uuid.UUID `json:"id"`
	UserID         uuid.UUID `json:"user_id"`
	TaskID         uuid.UUID `json:"task_id"`
	TaskTitle      string    `json:"task_title,omitempty"`
	StreakDate     time.Time `json:"streak_date"`
	CurrentStreak  int       `json:"current_streak"`
	LongestStreak  int       `json:"longest_streak"`
	CompletedToday bool      `json:"completed_today"`
	CreatedAt      time.Time `json:"created_at"`
	UpdatedAt      time.Time `json:"updated_at"`
}

// DailyCheckin captures subjective energy and reflection.
type DailyCheckin struct {
	ID             uuid.UUID `json:"id"`
	UserID         uuid.UUID `json:"user_id"`
	CheckinDate    time.Time `json:"checkin_date"`
	EnergyLevel    int       `json:"energy_level"` // 1-5
	Reflection     string    `json:"reflection"`
	TasksPlanned   int       `json:"tasks_planned"`
	TasksCompleted int       `json:"tasks_completed"`
	CreatedAt      time.Time `json:"created_at"`
	UpdatedAt      time.Time `json:"updated_at"`
}

// HabitProgress summarizes 30-day habit completion stats.
type HabitProgress struct {
	TaskID         uuid.UUID `json:"task_id"`
	Title          string    `json:"title"`
	CompletedDays  int       `json:"completed_days"`
	TotalDays      int       `json:"total_days"`
	CompletionRate float64   `json:"completion_rate"`
	CurrentStreak  int       `json:"current_streak"`
	LongestStreak  int       `json:"longest_streak"`
}

// HabitRepository defines persistence contracts for Habits and Daily Checkins.
type HabitRepository interface {
	GetStreakByDate(ctx context.Context, userID uuid.UUID, taskID uuid.UUID, date time.Time) (*HabitStreak, error)
	UpsertStreak(ctx context.Context, streak *HabitStreak) error
	ListStreaksByTask(ctx context.Context, userID uuid.UUID, taskID uuid.UUID, limit int) ([]*HabitStreak, error)
	ListStreaksInRange(ctx context.Context, userID uuid.UUID, startDate time.Time, endDate time.Time) ([]*HabitStreak, error)
	GetLatestStreak(ctx context.Context, userID uuid.UUID, taskID uuid.UUID) (*HabitStreak, error)
	CreateDailyCheckin(ctx context.Context, checkin *DailyCheckin) error
	GetDailyCheckinByDate(ctx context.Context, userID uuid.UUID, date time.Time) (*DailyCheckin, error)
	ListDailyCheckins(ctx context.Context, userID uuid.UUID, limit int) ([]*DailyCheckin, error)
}
