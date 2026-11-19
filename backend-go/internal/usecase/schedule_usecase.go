package usecase

import (
	"context"
	"time"

	"github.com/flowstate/backend/internal/domain"
	"github.com/google/uuid"
)

// ReorderBlockItem represents an item to update in sort order.
type ReorderBlockItem struct {
	ID        uuid.UUID `json:"id"`
	SortOrder int       `json:"sort_order"`
	StartTime *string   `json:"start_time"`
	EndTime   *string   `json:"end_time"`
}

// ScheduleUsecase defines business logic for schedule time blocks.
type ScheduleUsecase interface {
	CreateBlock(ctx context.Context, userID uuid.UUID, taskID *uuid.UUID, title string, blockDate time.Time, startTime, endTime string, blockType domain.BlockType) (*domain.TimeBlock, error)
	GetBlock(ctx context.Context, id, userID uuid.UUID) (*domain.TimeBlock, error)
	ListBlocksByDate(ctx context.Context, userID uuid.UUID, date time.Time) ([]*domain.TimeBlock, error)
	ListWeeklyBlocks(ctx context.Context, userID uuid.UUID, startDate time.Time) ([]*domain.TimeBlock, error)
	UpdateBlock(ctx context.Context, id, userID uuid.UUID, title *string, startTime, endTime *string, blockType *domain.BlockType, isCompleted *bool) (*domain.TimeBlock, error)
	ReorderBlocks(ctx context.Context, userID uuid.UUID, items []ReorderBlockItem) error
	DeleteBlock(ctx context.Context, id, userID uuid.UUID) error
	GetRisks(ctx context.Context, userID uuid.UUID) (overdue []*domain.Task, atRisk []*domain.Task, err error)
}

type scheduleUsecase struct {
	scheduleRepo domain.ScheduleRepository
	taskRepo     domain.TaskRepository
}

// NewScheduleUsecase constructs a ScheduleUsecase instance.
func NewScheduleUsecase(scheduleRepo domain.ScheduleRepository, taskRepo domain.TaskRepository) ScheduleUsecase {
	return &scheduleUsecase{
		scheduleRepo: scheduleRepo,
		taskRepo:     taskRepo,
	}
}

func (u *scheduleUsecase) CreateBlock(ctx context.Context, userID uuid.UUID, taskID *uuid.UUID, title string, blockDate time.Time, startTime, endTime string, blockType domain.BlockType) (*domain.TimeBlock, error) {
	if blockType == "" {
		blockType = domain.BlockTypeTask
	}
	if startTime == "" {
		startTime = "09:00:00"
	}
	if endTime == "" {
		endTime = "10:00:00"
	}
	normalizedDate := time.Date(blockDate.Year(), blockDate.Month(), blockDate.Day(), 0, 0, 0, 0, time.UTC)
	block := &domain.TimeBlock{
		UserID:      userID,
		TaskID:      taskID,
		Title:       title,
		BlockDate:   normalizedDate,
		StartTime:   startTime,
		EndTime:     endTime,
		BlockType:   blockType,
		IsCompleted: false,
	}
	if err := u.scheduleRepo.Create(ctx, block); err != nil {
		return nil, err
	}
	return block, nil
}

func (u *scheduleUsecase) GetBlock(ctx context.Context, id, userID uuid.UUID) (*domain.TimeBlock, error) {
	return u.scheduleRepo.GetByID(ctx, id, userID)
}

func (u *scheduleUsecase) ListBlocksByDate(ctx context.Context, userID uuid.UUID, date time.Time) ([]*domain.TimeBlock, error) {
	start := time.Date(date.Year(), date.Month(), date.Day(), 0, 0, 0, 0, time.UTC)
	end := start.AddDate(0, 0, 1)
	return u.scheduleRepo.ListByDateRange(ctx, userID, start, end)
}

func (u *scheduleUsecase) ListWeeklyBlocks(ctx context.Context, userID uuid.UUID, startDate time.Time) ([]*domain.TimeBlock, error) {
	start := time.Date(startDate.Year(), startDate.Month(), startDate.Day(), 0, 0, 0, 0, time.UTC)
	end := start.AddDate(0, 0, 7)
	return u.scheduleRepo.ListByDateRange(ctx, userID, start, end)
}

func (u *scheduleUsecase) UpdateBlock(ctx context.Context, id, userID uuid.UUID, title *string, startTime, endTime *string, blockType *domain.BlockType, isCompleted *bool) (*domain.TimeBlock, error) {
	block, err := u.scheduleRepo.GetByID(ctx, id, userID)
	if err != nil {
		return nil, err
	}
	if title != nil {
		block.Title = *title
	}
	if startTime != nil {
		block.StartTime = *startTime
	}
	if endTime != nil {
		block.EndTime = *endTime
	}
	if blockType != nil {
		block.BlockType = *blockType
	}
	if isCompleted != nil {
		block.IsCompleted = *isCompleted
	}
	if err := u.scheduleRepo.Update(ctx, block); err != nil {
		return nil, err
	}
	return block, nil
}

func (u *scheduleUsecase) ReorderBlocks(ctx context.Context, userID uuid.UUID, items []ReorderBlockItem) error {
	for _, it := range items {
		if err := u.scheduleRepo.UpdateOrderAndTime(ctx, it.ID, userID, it.SortOrder, it.StartTime, it.EndTime); err != nil {
			return err
		}
	}
	return nil
}

func (u *scheduleUsecase) DeleteBlock(ctx context.Context, id, userID uuid.UUID) error {
	return u.scheduleRepo.Delete(ctx, id, userID)
}

func (u *scheduleUsecase) GetRisks(ctx context.Context, userID uuid.UUID) ([]*domain.Task, []*domain.Task, error) {
	now := time.Now().UTC()
	overdue, err := u.taskRepo.ListOverdue(ctx, userID, now)
	if err != nil {
		overdue = []*domain.Task{}
	}
	atRiskEnd := now.Add(48 * time.Hour)
	atRisk, err := u.taskRepo.ListAtRisk(ctx, userID, now, atRiskEnd)
	if err != nil {
		atRisk = []*domain.Task{}
	}
	return overdue, atRisk, nil
}

