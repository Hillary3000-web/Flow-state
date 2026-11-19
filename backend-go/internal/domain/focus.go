package domain

import (
	"context"
	"encoding/json"
	"time"

	"github.com/google/uuid"
)

// SessionType defines the nature of the focus session.
type SessionType string

const (
	SessionTypePomodoro SessionType = "pomodoro"
	SessionTypeCustom   SessionType = "custom"
)

// FocusSession tracks time spent in deep work.
type FocusSession struct {
	ID              uuid.UUID       `json:"id"`
	UserID          uuid.UUID       `json:"user_id"`
	TaskID          *uuid.UUID      `json:"task_id"`
	TaskTitle       string          `json:"task_title,omitempty"`
	StartedAt       time.Time       `json:"started_at"`
	EndedAt         *time.Time      `json:"ended_at"`
	DurationSeconds int             `json:"duration_seconds"`
	SessionType     SessionType     `json:"session_type"`
	TargetMinutes   int             `json:"target_minutes"`
	DistractionLog  json.RawMessage `json:"distraction_log"`
	IsCompleted     bool            `json:"is_completed"`
	CreatedAt       time.Time       `json:"created_at"`
	UpdatedAt       time.Time       `json:"updated_at"`
}

// FocusPeriodStats holds metrics for a specific time window.
type FocusPeriodStats struct {
	Sessions     int `json:"sessions"`
	TotalMinutes int `json:"total_minutes"`
}

// FocusStats aggregate summary across timeframes.
type FocusStats struct {
	Today             FocusPeriodStats `json:"today"`
	ThisWeek          FocusPeriodStats `json:"this_week"`
	AllTime           FocusPeriodStats `json:"all_time"`
	CurrentStreakDays int              `json:"current_streak_days"`
}

// FocusRepository defines persistence contracts for FocusSessions.
type FocusRepository interface {
	Create(ctx context.Context, session *FocusSession) error
	GetByID(ctx context.Context, id uuid.UUID, userID uuid.UUID) (*FocusSession, error)
	EndSession(ctx context.Context, id uuid.UUID, userID uuid.UUID, endedAt time.Time, durationSeconds int, distractionLog json.RawMessage, isCompleted bool) (*FocusSession, error)
	ListByUserID(ctx context.Context, userID uuid.UUID, limit int) ([]*FocusSession, error)
	GetCompletedDates(ctx context.Context, userID uuid.UUID) ([]time.Time, error)
	GetStats(ctx context.Context, userID uuid.UUID, since time.Time) (sessionCount int64, totalMinutes int64, err error)
}
