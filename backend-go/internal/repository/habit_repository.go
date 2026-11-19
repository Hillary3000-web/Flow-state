package repository

import (
	"context"
	"time"

	"github.com/flowstate/backend/internal/domain"
	"github.com/flowstate/backend/internal/repository/db"
	"github.com/google/uuid"
)

type habitRepository struct {
	q *db.Queries
}

// NewHabitRepository creates an instance of HabitRepository backed by SQLC.
func NewHabitRepository(q *db.Queries) domain.HabitRepository {
	return &habitRepository{q: q}
}

func (r *habitRepository) GetStreakByDate(ctx context.Context, userID uuid.UUID, taskID uuid.UUID, date time.Time) (*domain.HabitStreak, error) {
	h, err := r.q.GetHabitStreakByDate(ctx, db.GetHabitStreakByDateParams{
		UserID:     userID,
		TaskID:     taskID,
		StreakDate: date,
	})
	if err != nil {
		return nil, mapDBError(err)
	}
	return mapDBHabitStreakToDomain(&h), nil
}

func (r *habitRepository) UpsertStreak(ctx context.Context, streak *domain.HabitStreak) error {
	upserted, err := r.q.UpsertHabitStreak(ctx, db.UpsertHabitStreakParams{
		UserID:         streak.UserID,
		TaskID:         streak.TaskID,
		StreakDate:     streak.StreakDate,
		CurrentStreak:  int32(streak.CurrentStreak),
		LongestStreak:  int32(streak.LongestStreak),
		CompletedToday: streak.CompletedToday,
	})
	if err != nil {
		return mapDBError(err)
	}

	*streak = *mapDBHabitStreakToDomain(&upserted)
	return nil
}

func (r *habitRepository) ListStreaksByTask(ctx context.Context, userID uuid.UUID, taskID uuid.UUID, limit int) ([]*domain.HabitStreak, error) {
	lim := int32(limit)
	if lim <= 0 {
		lim = 30
	}
	items, err := r.q.ListHabitStreaksByTask(ctx, db.ListHabitStreaksByTaskParams{
		UserID: userID,
		TaskID: taskID,
		Limit:  lim,
	})
	if err != nil {
		return nil, mapDBError(err)
	}

	result := make([]*domain.HabitStreak, len(items))
	for i := range items {
		result[i] = mapDBHabitStreakToDomain(&items[i])
	}
	return result, nil
}

func (r *habitRepository) ListStreaksInRange(ctx context.Context, userID uuid.UUID, startDate time.Time, endDate time.Time) ([]*domain.HabitStreak, error) {
	items, err := r.q.ListHabitStreaksInRange(ctx, db.ListHabitStreaksInRangeParams{
		UserID:    userID,
		StartDate: startDate,
		EndDate:   endDate,
	})
	if err != nil {
		return nil, mapDBError(err)
	}

	result := make([]*domain.HabitStreak, len(items))
	for i := range items {
		result[i] = mapDBHabitStreakToDomain(&items[i])
	}
	return result, nil
}

func (r *habitRepository) GetLatestStreak(ctx context.Context, userID uuid.UUID, taskID uuid.UUID) (*domain.HabitStreak, error) {
	item, err := r.q.GetLatestHabitStreak(ctx, db.GetLatestHabitStreakParams{
		UserID: userID,
		TaskID: taskID,
	})
	if err != nil {
		return nil, mapDBError(err)
	}
	return mapDBHabitStreakToDomain(&item), nil
}

func (r *habitRepository) CreateDailyCheckin(ctx context.Context, checkin *domain.DailyCheckin) error {
	created, err := r.q.CreateDailyCheckin(ctx, db.CreateDailyCheckinParams{
		UserID:         checkin.UserID,
		CheckinDate:    checkin.CheckinDate,
		EnergyLevel:    int32(checkin.EnergyLevel),
		Reflection:     checkin.Reflection,
		TasksPlanned:   int32(checkin.TasksPlanned),
		TasksCompleted: int32(checkin.TasksCompleted),
	})
	if err != nil {
		return mapDBError(err)
	}

	*checkin = *mapDBDailyCheckinToDomain(&created)
	return nil
}

func (r *habitRepository) GetDailyCheckinByDate(ctx context.Context, userID uuid.UUID, date time.Time) (*domain.DailyCheckin, error) {
	item, err := r.q.GetDailyCheckinByDate(ctx, db.GetDailyCheckinByDateParams{
		UserID:      userID,
		CheckinDate: date,
	})
	if err != nil {
		return nil, mapDBError(err)
	}
	return mapDBDailyCheckinToDomain(&item), nil
}

func (r *habitRepository) ListDailyCheckins(ctx context.Context, userID uuid.UUID, limit int) ([]*domain.DailyCheckin, error) {
	lim := int32(limit)
	if lim <= 0 {
		lim = 30
	}
	items, err := r.q.ListDailyCheckins(ctx, db.ListDailyCheckinsParams{
		UserID: userID,
		Limit:  lim,
	})
	if err != nil {
		return nil, mapDBError(err)
	}

	result := make([]*domain.DailyCheckin, len(items))
	for i := range items {
		result[i] = mapDBDailyCheckinToDomain(&items[i])
	}
	return result, nil
}
