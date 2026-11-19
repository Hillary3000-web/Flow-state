package domain

import (
	"context"
	"time"

	"github.com/google/uuid"
)

// BlockType categories for time scheduling.
type BlockType string

const (
	BlockTypeDeepWork BlockType = "deep_work"
	BlockTypeMeeting  BlockType = "meeting"
	BlockTypeBreak    BlockType = "break"
	BlockTypeTask     BlockType = "task"
)

// TimeBlock represents a scheduled segment of time.
type TimeBlock struct {
	ID          uuid.UUID  `json:"id"`
	UserID      uuid.UUID  `json:"user_id"`
	TaskID      *uuid.UUID `json:"task_id"`
	TaskTitle   string     `json:"task_title,omitempty"`
	Title       string     `json:"title"`
	BlockDate   time.Time  `json:"block_date"`
	StartTime   string     `json:"start_time"` // "HH:MM:SS"
	EndTime     string     `json:"end_time"`   // "HH:MM:SS"
	BlockType   BlockType  `json:"block_type"`
	IsCompleted bool       `json:"is_completed"`
	SortOrder   int        `json:"sort_order"`
	CreatedAt   time.Time  `json:"created_at"`
	UpdatedAt   time.Time  `json:"updated_at"`
}

// ScheduleRepository defines persistence contracts for TimeBlocks.
type ScheduleRepository interface {
	Create(ctx context.Context, block *TimeBlock) error
	GetByID(ctx context.Context, id uuid.UUID, userID uuid.UUID) (*TimeBlock, error)
	ListByDateRange(ctx context.Context, userID uuid.UUID, startDate time.Time, endDate time.Time) ([]*TimeBlock, error)
	Update(ctx context.Context, block *TimeBlock) error
	UpdateOrderAndTime(ctx context.Context, id uuid.UUID, userID uuid.UUID, sortOrder int, startTime *string, endTime *string) error
	Delete(ctx context.Context, id uuid.UUID, userID uuid.UUID) error
}
