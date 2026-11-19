package usecase

import (
	"context"
	"time"

	"github.com/flowstate/backend/internal/domain"
	"github.com/google/uuid"
)

// AnalyticsOverview represents high-level metrics for the dashboard.
type AnalyticsOverview struct {
	CompletedTasks     int   `json:"completed"`
	InProgressTasks    int   `json:"in_progress"`
	OverdueTasks       int   `json:"overdue"`
	TodayFocusMinutes  int64 `json:"today_focus_minutes"`
	TotalTasks         int   `json:"total_tasks"`
}

// TrendItem represents completion and focus minutes for a single day.
type TrendItem struct {
	Date         string `json:"date"`
	Completed    int    `json:"completed"`
	FocusMinutes int    `json:"focus_minutes"`
}

// AnalyticsUsecase defines business logic for metrics, trends, and charts.
type AnalyticsUsecase interface {
	GetOverview(ctx context.Context, userID uuid.UUID) (*AnalyticsOverview, error)
	GetTrends(ctx context.Context, userID uuid.UUID, days int) ([]TrendItem, error)
	GetBurndown(ctx context.Context, userID uuid.UUID, days int) ([]map[string]any, error)
	GetTimeAllocation(ctx context.Context, userID uuid.UUID) (map[string]int, error)
}

type analyticsUsecase struct {
	taskRepo     domain.TaskRepository
	focusRepo    domain.FocusRepository
	scheduleRepo domain.ScheduleRepository
}

// NewAnalyticsUsecase constructs an AnalyticsUsecase instance.
func NewAnalyticsUsecase(
	taskRepo domain.TaskRepository,
	focusRepo domain.FocusRepository,
	scheduleRepo domain.ScheduleRepository,
) AnalyticsUsecase {
	return &analyticsUsecase{
		taskRepo:     taskRepo,
		focusRepo:    focusRepo,
		scheduleRepo: scheduleRepo,
	}
}

func (u *analyticsUsecase) GetOverview(ctx context.Context, userID uuid.UUID) (*AnalyticsOverview, error) {
	now := time.Now().UTC()
	todayStart := time.Date(now.Year(), now.Month(), now.Day(), 0, 0, 0, 0, time.UTC)

	tasks, err := u.taskRepo.List(ctx, userID, domain.TaskFilter{})
	if err != nil {
		return nil, err
	}

	completed := 0
	inProgress := 0
	for _, t := range tasks {
		if t.Status == domain.TaskStatusDone {
			completed++
		} else if t.Status == domain.TaskStatusInProgress {
			inProgress++
		}
	}

	overdueTasks, _ := u.taskRepo.ListOverdue(ctx, userID, now)
	_, todayFocusMins, _ := u.focusRepo.GetStats(ctx, userID, todayStart)

	return &AnalyticsOverview{
		CompletedTasks:    completed,
		InProgressTasks:   inProgress,
		OverdueTasks:      len(overdueTasks),
		TodayFocusMinutes: todayFocusMins,
		TotalTasks:        len(tasks),
	}, nil
}

func (u *analyticsUsecase) GetTrends(ctx context.Context, userID uuid.UUID, days int) ([]TrendItem, error) {
	if days <= 0 {
		days = 14
	}
	now := time.Now().UTC()
	trends := make([]TrendItem, days)

	tasks, _ := u.taskRepo.List(ctx, userID, domain.TaskFilter{})

	for i := 0; i < days; i++ {
		targetDate := now.AddDate(0, 0, -(days - 1 - i))
		dateStr := targetDate.Format("2006-01-02")

		completedCount := 0
		for _, t := range tasks {
			if t.Status == domain.TaskStatusDone && t.CompletedAt != nil {
				if t.CompletedAt.UTC().Format("2006-01-02") == dateStr {
					completedCount++
				}
			}
		}

		dayStart := time.Date(targetDate.Year(), targetDate.Month(), targetDate.Day(), 0, 0, 0, 0, time.UTC)
		dayEnd := dayStart.AddDate(0, 0, 1)
		_, mins, _ := u.focusRepo.GetStats(ctx, userID, dayStart)
		_ = dayEnd

		trends[i] = TrendItem{
			Date:         targetDate.Format("Jan 02"),
			Completed:    completedCount,
			FocusMinutes: int(mins),
		}
	}

	return trends, nil
}

func (u *analyticsUsecase) GetBurndown(ctx context.Context, userID uuid.UUID, days int) ([]map[string]any, error) {
	if days <= 0 {
		days = 7
	}
	tasks, _ := u.taskRepo.List(ctx, userID, domain.TaskFilter{})
	total := len(tasks)
	remaining := total

	now := time.Now().UTC()
	res := make([]map[string]any, days)
	for i := 0; i < days; i++ {
		targetDate := now.AddDate(0, 0, -(days - 1 - i))
		dateStr := targetDate.Format("2006-01-02")

		completedOnDay := 0
		for _, t := range tasks {
			if t.Status == domain.TaskStatusDone && t.CompletedAt != nil && t.CompletedAt.UTC().Format("2006-01-02") == dateStr {
				completedOnDay++
			}
		}
		remaining -= completedOnDay
		if remaining < 0 {
			remaining = 0
		}

		res[i] = map[string]any{
			"day":       targetDate.Format("Mon"),
			"remaining": remaining,
			"ideal":     int(float64(total) * float64(days-1-i) / float64(days)),
		}
	}
	return res, nil
}

func (u *analyticsUsecase) GetTimeAllocation(ctx context.Context, userID uuid.UUID) (map[string]int, error) {
	now := time.Now().UTC()
	weekStart := time.Date(now.Year(), now.Month(), now.Day(), 0, 0, 0, 0, time.UTC).AddDate(0, 0, -7)
	blocks, err := u.scheduleRepo.ListByDateRange(ctx, userID, weekStart, now.AddDate(0, 0, 1))
	if err != nil {
		return map[string]int{"deep_work": 0, "task": 0, "meeting": 0, "break": 0}, nil
	}

	res := map[string]int{
		"deep_work": 0,
		"task":      0,
		"meeting":   0,
		"break":     0,
	}

	for _, b := range blocks {
		t := string(b.BlockType)
		res[t] += 60 // average 1 hour block
	}

	return res, nil
}

