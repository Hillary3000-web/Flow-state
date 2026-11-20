package usecase

import (
	"context"
	"encoding/json"
	"time"

	"github.com/flowstate/backend/internal/domain"
	"github.com/google/uuid"
)

// FocusUsecase defines business logic for focus sessions and stats.
type FocusUsecase interface {
	CreateSession(ctx context.Context, userID uuid.UUID, taskID *uuid.UUID, sessionType domain.SessionType, targetMinutes int) (*domain.FocusSession, error)
	GetSession(ctx context.Context, id, userID uuid.UUID) (*domain.FocusSession, error)
	EndSession(ctx context.Context, id, userID uuid.UUID, durationSeconds int, distractionLog json.RawMessage, isCompleted bool) (*domain.FocusSession, error)
	ListSessions(ctx context.Context, userID uuid.UUID, limit int) ([]*domain.FocusSession, error)
	GetStats(ctx context.Context, userID uuid.UUID) (*domain.FocusStats, error)
}

type focusUsecase struct {
	focusRepo domain.FocusRepository
}

// NewFocusUsecase constructs a FocusUsecase instance.
func NewFocusUsecase(focusRepo domain.FocusRepository) FocusUsecase {
	return &focusUsecase{focusRepo: focusRepo}
}

func (u *focusUsecase) CreateSession(ctx context.Context, userID uuid.UUID, taskID *uuid.UUID, sessionType domain.SessionType, targetMinutes int) (*domain.FocusSession, error) {
	if sessionType == "" {
		sessionType = domain.SessionTypePomodoro
	}
	if targetMinutes <= 0 {
		targetMinutes = 25
	}
	now := time.Now().UTC()
	session := &domain.FocusSession{
		ID:            uuid.New(),
		UserID:        userID,
		TaskID:        taskID,
		StartedAt:     now,
		SessionType:   sessionType,
		TargetMinutes: targetMinutes,
		IsCompleted:   false,
		CreatedAt:     now,
	}
	if err := u.focusRepo.Create(ctx, session); err != nil {
		return nil, err
	}
	return session, nil
}

func (u *focusUsecase) GetSession(ctx context.Context, id, userID uuid.UUID) (*domain.FocusSession, error) {
	return u.focusRepo.GetByID(ctx, id, userID)
}

func (u *focusUsecase) EndSession(ctx context.Context, id, userID uuid.UUID, durationSeconds int, distractionLog json.RawMessage, isCompleted bool) (*domain.FocusSession, error) {
	now := time.Now().UTC()
	return u.focusRepo.EndSession(ctx, id, userID, now, durationSeconds, distractionLog, isCompleted)
}

func (u *focusUsecase) ListSessions(ctx context.Context, userID uuid.UUID, limit int) ([]*domain.FocusSession, error) {
	if limit <= 0 {
		limit = 50
	}
	return u.focusRepo.ListByUserID(ctx, userID, limit)
}

func (u *focusUsecase) GetStats(ctx context.Context, userID uuid.UUID) (*domain.FocusStats, error) {
	now := time.Now().UTC()
	todayStart := time.Date(now.Year(), now.Month(), now.Day(), 0, 0, 0, 0, time.UTC)
	weekStart := todayStart.AddDate(0, 0, -int(now.Weekday()))
	epochStart := time.Date(1970, 1, 1, 0, 0, 0, 0, time.UTC)

	todaySessions, todayMins, _ := u.focusRepo.GetStats(ctx, userID, todayStart)
	weekSessions, weekMins, _ := u.focusRepo.GetStats(ctx, userID, weekStart)
	allSessions, allMins, _ := u.focusRepo.GetStats(ctx, userID, epochStart)

	dates, _ := u.focusRepo.GetCompletedDates(ctx, userID)
	streak := calculateDateStreak(dates)

	return &domain.FocusStats{
		Today: domain.FocusPeriodStats{
			Sessions:     int(todaySessions),
			TotalMinutes: int(todayMins),
		},
		ThisWeek: domain.FocusPeriodStats{
			Sessions:     int(weekSessions),
			TotalMinutes: int(weekMins),
		},
		AllTime: domain.FocusPeriodStats{
			Sessions:     int(allSessions),
			TotalMinutes: int(allMins),
		},
		CurrentStreakDays: streak,
	}, nil
}

func calculateDateStreak(dates []time.Time) int {
	if len(dates) == 0 {
		return 0
	}
	dateSet := make(map[string]bool)
	for _, d := range dates {
		dateSet[d.UTC().Format("2006-01-02")] = true
	}
	now := time.Now().UTC()
	todayStr := now.Format("2006-01-02")
	yesterdayStr := now.AddDate(0, 0, -1).Format("2006-01-02")

	startDay := todayStr
	if !dateSet[todayStr] {
		if dateSet[yesterdayStr] {
			startDay = yesterdayStr
		} else {
			return 0
		}
	}

	curr, _ := time.Parse("2006-01-02", startDay)
	streak := 0
	for {
		key := curr.Format("2006-01-02")
		if dateSet[key] {
			streak++
			curr = curr.AddDate(0, 0, -1)
		} else {
			break
		}
	}
	return streak
}
