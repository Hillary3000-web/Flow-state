package repository

import (
	"context"
	"time"

	"github.com/flowstate/backend/internal/domain"
	"github.com/flowstate/backend/internal/repository/db"
	"github.com/google/uuid"
)

type scheduleRepository struct {
	q *db.Queries
}

// NewScheduleRepository creates a ScheduleRepository backed by SQLC.
func NewScheduleRepository(q *db.Queries) domain.ScheduleRepository {
	return &scheduleRepository{q: q}
}

func (r *scheduleRepository) Create(ctx context.Context, b *domain.TimeBlock) error {
	blockType := string(b.BlockType)
	if blockType == "" {
		blockType = "task"
	}
	created, err := r.q.CreateTimeBlock(ctx, db.CreateTimeBlockParams{
		UserID:      b.UserID,
		TaskID:      b.TaskID,
		Title:       b.Title,
		BlockDate:   b.BlockDate,
		StartTime:   b.StartTime,
		EndTime:     b.EndTime,
		BlockType:   blockType,
		IsCompleted: b.IsCompleted,
		SortOrder:   int32(b.SortOrder),
	})
	if err != nil {
		return mapDBError(err)
	}
	*b = *mapDBTimeBlockToDomain(&created)
	return nil
}

func (r *scheduleRepository) GetByID(ctx context.Context, id uuid.UUID, userID uuid.UUID) (*domain.TimeBlock, error) {
	row, err := r.q.GetTimeBlockByID(ctx, id, userID)
	if err != nil {
		return nil, mapDBError(err)
	}
	dom := &domain.TimeBlock{
		ID:          row.ID,
		UserID:      row.UserID,
		TaskID:      row.TaskID,
		Title:       row.Title,
		BlockDate:   row.BlockDate,
		StartTime:   row.StartTime,
		EndTime:     row.EndTime,
		BlockType:   domain.BlockType(row.BlockType),
		IsCompleted: row.IsCompleted,
		SortOrder:   int(row.SortOrder),
		CreatedAt:   row.CreatedAt,
		UpdatedAt:   row.UpdatedAt,
	}
	if row.TaskTitle != nil {
		dom.TaskTitle = *row.TaskTitle
	}
	return dom, nil
}

func (r *scheduleRepository) ListByDateRange(ctx context.Context, userID uuid.UUID, startDate time.Time, endDate time.Time) ([]*domain.TimeBlock, error) {
	rows, err := r.q.ListTimeBlocksByDateRange(ctx, db.ListTimeBlocksByDateRangeParams{
		UserID:      userID,
		BlockDate:   startDate,
		BlockDate_2: endDate,
	})
	if err != nil {
		return nil, mapDBError(err)
	}

	result := make([]*domain.TimeBlock, len(rows))
	for i, row := range rows {
		item := &domain.TimeBlock{
			ID:          row.ID,
			UserID:      row.UserID,
			TaskID:      row.TaskID,
			Title:       row.Title,
			BlockDate:   row.BlockDate,
			StartTime:   row.StartTime,
			EndTime:     row.EndTime,
			BlockType:   domain.BlockType(row.BlockType),
			IsCompleted: row.IsCompleted,
			SortOrder:   int(row.SortOrder),
			CreatedAt:   row.CreatedAt,
			UpdatedAt:   row.UpdatedAt,
		}
		if row.TaskTitle != nil {
			item.TaskTitle = *row.TaskTitle
		}
		result[i] = item
	}
	return result, nil
}

func (r *scheduleRepository) Update(ctx context.Context, b *domain.TimeBlock) error {
	var blockType *string
	if b.BlockType != "" {
		bt := string(b.BlockType)
		blockType = &bt
	}
	sortOrder := int32(b.SortOrder)
	updated, err := r.q.UpdateTimeBlock(ctx, db.UpdateTimeBlockParams{
		TaskID:      b.TaskID,
		Title:       &b.Title,
		BlockDate:   &b.BlockDate,
		StartTime:   &b.StartTime,
		EndTime:     &b.EndTime,
		BlockType:   blockType,
		IsCompleted: &b.IsCompleted,
		SortOrder:   &sortOrder,
		ID:          b.ID,
		UserID:      b.UserID,
	})
	if err != nil {
		return mapDBError(err)
	}
	*b = *mapDBTimeBlockToDomain(&updated)
	return nil
}

func (r *scheduleRepository) UpdateOrderAndTime(ctx context.Context, id uuid.UUID, userID uuid.UUID, sortOrder int, startTime *string, endTime *string) error {
	err := r.q.UpdateTimeBlockOrderAndTime(ctx, db.UpdateTimeBlockOrderAndTimeParams{
		SortOrder: int32(sortOrder),
		StartTime: startTime,
		EndTime:   endTime,
		ID:        id,
		UserID:    userID,
	})
	return mapDBError(err)
}

func (r *scheduleRepository) Delete(ctx context.Context, id uuid.UUID, userID uuid.UUID) error {
	return mapDBError(r.q.DeleteTimeBlock(ctx, id, userID))
}
