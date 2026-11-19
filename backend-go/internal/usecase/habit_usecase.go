package usecase

import (
	"context"
	"errors"
	"fmt"
	"math"
	"time"

	"github.com/flowstate/backend/internal/domain"
	"github.com/google/uuid"
)

// CreateHabitInput represents payload for creating a recurring task habit.
type CreateHabitInput struct {
	UserID         uuid.UUID           `json:"user_id"`
	ProjectID      *uuid.UUID          `json:"project_id"`
	Title          string              `json:"title"`
	Description    string              `json:"description"`
	Priority       domain.TaskPriority `json:"priority"`
	EnergyLevel    domain.EnergyLevel  `json:"energy_level"`
	RecurrenceRule string              `json:"recurrence_rule"`
}

// HabitUsecase defines habit and streak business logic.
type HabitUsecase interface {
	CreateHabit(ctx context.Context, in CreateHabitInput) (*domain.Task, error)
	ListHabits(ctx context.Context, userID uuid.UUID) ([]*domain.Task, error)
	CheckinHabit(ctx context.Context, userID uuid.UUID, taskID uuid.UUID, checkinDate time.Time) (*domain.HabitStreak, error)
	GetStreakHistory(ctx context.Context, userID uuid.UUID, taskID uuid.UUID, limit int) ([]*domain.HabitStreak, error)
	GetHabitProgress(ctx context.Context, userID uuid.UUID) ([]*domain.HabitProgress, error)
	CreateDailyCheckin(ctx context.Context, userID uuid.UUID, date time.Time, energyLevel int, reflection string, tasksPlanned int, tasksCompleted int) (*domain.DailyCheckin, error)
	GetDailyCheckin(ctx context.Context, userID uuid.UUID, date time.Time) (*domain.DailyCheckin, error)
	ListDailyCheckins(ctx context.Context, userID uuid.UUID, limit int) ([]*domain.DailyCheckin, error)
	DeleteHabit(ctx context.Context, userID uuid.UUID, taskID uuid.UUID) error
}

type habitUsecase struct {
	habitRepo domain.HabitRepository
	taskRepo  domain.TaskRepository
}

// NewHabitUsecase constructs a HabitUsecase instance.
func NewHabitUsecase(habitRepo domain.HabitRepository, taskRepo domain.TaskRepository) HabitUsecase {
	return &habitUsecase{
		habitRepo: habitRepo,
		taskRepo:  taskRepo,
	}
}

func (u *habitUsecase) CreateHabit(ctx context.Context, in CreateHabitInput) (*domain.Task, error) {
	if in.Title == "" {
		return nil, domain.ErrInvalidInput
	}
	recurrence := in.RecurrenceRule
	if recurrence == "" {
		recurrence = "daily"
	}
	priority := in.Priority
	if priority == "" {
		priority = domain.PriorityP3
	}
	energy := in.EnergyLevel
	if energy == "" {
		energy = domain.EnergyMedium
	}

	task := &domain.Task{
		UserID:         in.UserID,
		ProjectID:      in.ProjectID,
		Title:          in.Title,
		Description:    in.Description,
		Priority:       priority,
		EnergyLevel:    energy,
		Status:         domain.TaskStatusTodo,
		IsRecurring:    true,
		RecurrenceRule: recurrence,
	}

	if err := u.taskRepo.Create(ctx, task); err != nil {
		return nil, err
	}
	return task, nil
}

func (u *habitUsecase) ListHabits(ctx context.Context, userID uuid.UUID) ([]*domain.Task, error) {
	habits, err := u.taskRepo.ListRecurring(ctx, userID)
	if err != nil {
		return nil, err
	}

	today := time.Now().UTC()
	normalizedToday := time.Date(today.Year(), today.Month(), today.Day(), 0, 0, 0, 0, time.UTC)
	startWindow := normalizedToday.AddDate(0, 0, -6)

	streaksInRange, _ := u.habitRepo.ListStreaksInRange(ctx, userID, startWindow, normalizedToday)
	streakMap := make(map[string]*domain.HabitStreak)
	for _, s := range streaksInRange {
		key := fmt.Sprintf("%s_%s", s.TaskID.String(), s.StreakDate.Format("2006-01-02"))
		streakMap[key] = s
	}

	for _, h := range habits {
		todayKey := fmt.Sprintf("%s_%s", h.ID.String(), normalizedToday.Format("2006-01-02"))
		if todayStreak, ok := streakMap[todayKey]; ok && todayStreak.CompletedToday {
			h.CheckedToday = true
			h.CurrentStreak = todayStreak.CurrentStreak
			h.LongestStreak = todayStreak.LongestStreak
		} else {
			latest, _ := u.habitRepo.GetLatestStreak(ctx, userID, h.ID)
			if latest != nil {
				h.LongestStreak = latest.LongestStreak
				yesterdayKey := fmt.Sprintf("%s_%s", h.ID.String(), normalizedToday.AddDate(0, 0, -1).Format("2006-01-02"))
				if yStreak, yOk := streakMap[yesterdayKey]; yOk && yStreak.CompletedToday {
					h.CurrentStreak = yStreak.CurrentStreak
				}
			}
		}

		h.CompletedDays7D = make([]bool, 7)
		for d := 0; d < 7; d++ {
			dayDate := normalizedToday.AddDate(0, 0, d-6)
			k := fmt.Sprintf("%s_%s", h.ID.String(), dayDate.Format("2006-01-02"))
			if s, ok := streakMap[k]; ok && s.CompletedToday {
				h.CompletedDays7D[d] = true
			}
		}
	}

	return habits, nil
}

func (u *habitUsecase) CheckinHabit(ctx context.Context, userID uuid.UUID, taskID uuid.UUID, checkinDate time.Time) (*domain.HabitStreak, error) {
	// 1. Verify task belongs to user and is a habit (recurring)
	task, err := u.taskRepo.GetByID(ctx, taskID, userID)
	if err != nil {
		if errors.Is(err, domain.ErrNotFound) {
			return nil, domain.ErrHabitNotFound
		}
		return nil, err
	}
	if !task.IsRecurring {
		return nil, domain.ErrHabitNotFound
	}

	// Normalize date to YYYY-MM-DD
	normalizedDate := time.Date(checkinDate.Year(), checkinDate.Month(), checkinDate.Day(), 0, 0, 0, 0, time.UTC)

	// 2. Check if already checked in today -> Toggle behavior
	existingToday, err := u.habitRepo.GetStreakByDate(ctx, userID, taskID, normalizedDate)
	if err == nil && existingToday != nil && existingToday.CompletedToday {
		existingToday.CompletedToday = false
		existingToday.CurrentStreak = int(math.Max(0, float64(existingToday.CurrentStreak-1)))
		if err := u.habitRepo.UpsertStreak(ctx, existingToday); err != nil {
			return nil, err
		}
		existingToday.TaskTitle = task.Title
		return existingToday, nil
	}

	// 3. Consistency Streak Calculation Logic
	yesterdayDate := normalizedDate.AddDate(0, 0, -1)
	yesterdayStreak, _ := u.habitRepo.GetStreakByDate(ctx, userID, taskID, yesterdayDate)

	currentStreak := 1
	longestStreak := 1

	// Check if yesterday was completed
	if yesterdayStreak != nil && yesterdayStreak.CompletedToday {
		currentStreak = yesterdayStreak.CurrentStreak + 1
		longestStreak = yesterdayStreak.LongestStreak
	} else {
		// Yesterday was not completed: streak was broken, resets to 1
		// Retain historical longest streak from latest previous record if available
		latestRecord, err := u.habitRepo.GetLatestStreak(ctx, userID, taskID)
		if err == nil && latestRecord != nil {
			longestStreak = latestRecord.LongestStreak
		}
	}

	if currentStreak > longestStreak {
		longestStreak = currentStreak
	}

	streakRecord := &domain.HabitStreak{
		UserID:         userID,
		TaskID:         taskID,
		StreakDate:     normalizedDate,
		CurrentStreak:  currentStreak,
		LongestStreak:  longestStreak,
		CompletedToday: true,
	}

	if err := u.habitRepo.UpsertStreak(ctx, streakRecord); err != nil {
		return nil, err
	}

	streakRecord.TaskTitle = task.Title
	return streakRecord, nil
}

func (u *habitUsecase) GetStreakHistory(ctx context.Context, userID uuid.UUID, taskID uuid.UUID, limit int) ([]*domain.HabitStreak, error) {
	if limit <= 0 {
		limit = 30
	}
	return u.habitRepo.ListStreaksByTask(ctx, userID, taskID, limit)
}

func (u *habitUsecase) GetHabitProgress(ctx context.Context, userID uuid.UUID) ([]*domain.HabitProgress, error) {
	habits, err := u.taskRepo.ListRecurring(ctx, userID)
	if err != nil {
		return nil, err
	}

	today := time.Now().UTC()
	startWindow := today.AddDate(0, 0, -30)

	streaksInRange, err := u.habitRepo.ListStreaksInRange(ctx, userID, startWindow, today)
	if err != nil {
		return nil, err
	}

	// Map completed counts and latest streak per task ID
	completedCounts := make(map[uuid.UUID]int)
	latestStreaks := make(map[uuid.UUID]*domain.HabitStreak)

	for _, s := range streaksInRange {
		if s.CompletedToday {
			completedCounts[s.TaskID]++
		}
		if existing, ok := latestStreaks[s.TaskID]; !ok || s.StreakDate.After(existing.StreakDate) {
			latestStreaks[s.TaskID] = s
		}
	}

	progressList := make([]*domain.HabitProgress, 0, len(habits))
	for _, h := range habits {
		completed := completedCounts[h.ID]
		latest := latestStreaks[h.ID]

		currStreak := 0
		longStreak := 0
		if latest != nil {
			currStreak = latest.CurrentStreak
			longStreak = latest.LongestStreak
		}

		rate := math.Round((float64(completed)/30.0*100.0)*10) / 10

		progressList = append(progressList, &domain.HabitProgress{
			TaskID:         h.ID,
			Title:          h.Title,
			CompletedDays:  completed,
			TotalDays:      30,
			CompletionRate: rate,
			CurrentStreak:  currStreak,
			LongestStreak:  longStreak,
		})
	}

	return progressList, nil
}

func (u *habitUsecase) CreateDailyCheckin(ctx context.Context, userID uuid.UUID, date time.Time, energyLevel int, reflection string, tasksPlanned int, tasksCompleted int) (*domain.DailyCheckin, error) {
	if energyLevel < 1 || energyLevel > 5 {
		return nil, domain.ErrInvalidInput
	}
	normalizedDate := time.Date(date.Year(), date.Month(), date.Day(), 0, 0, 0, 0, time.UTC)

	checkin := &domain.DailyCheckin{
		UserID:         userID,
		CheckinDate:    normalizedDate,
		EnergyLevel:    energyLevel,
		Reflection:     reflection,
		TasksPlanned:   tasksPlanned,
		TasksCompleted: tasksCompleted,
	}

	if err := u.habitRepo.CreateDailyCheckin(ctx, checkin); err != nil {
		if errors.Is(err, domain.ErrConflict) {
			return nil, domain.ErrCheckinAlreadyExists
		}
		return nil, err
	}
	return checkin, nil
}

func (u *habitUsecase) GetDailyCheckin(ctx context.Context, userID uuid.UUID, date time.Time) (*domain.DailyCheckin, error) {
	normalizedDate := time.Date(date.Year(), date.Month(), date.Day(), 0, 0, 0, 0, time.UTC)
	checkin, err := u.habitRepo.GetDailyCheckinByDate(ctx, userID, normalizedDate)
	if err != nil {
		if errors.Is(err, domain.ErrNotFound) {
			return nil, domain.ErrNotFound
		}
		return nil, err
	}
	return checkin, nil
}

func (u *habitUsecase) ListDailyCheckins(ctx context.Context, userID uuid.UUID, limit int) ([]*domain.DailyCheckin, error) {
	if limit <= 0 {
		limit = 30
	}
	return u.habitRepo.ListDailyCheckins(ctx, userID, limit)
}

func (u *habitUsecase) DeleteHabit(ctx context.Context, userID uuid.UUID, taskID uuid.UUID) error {
	return u.taskRepo.Delete(ctx, taskID, userID)
}

