package domain

import (
	"context"
	"time"

	"github.com/google/uuid"
)

// TaskPriority levels.
type TaskPriority string

const (
	PriorityP1 TaskPriority = "P1" // Urgent
	PriorityP2 TaskPriority = "P2" // High
	PriorityP3 TaskPriority = "P3" // Medium
	PriorityP4 TaskPriority = "P4" // Low
)

// EnergyLevel requirements.
type EnergyLevel string

const (
	EnergyLow    EnergyLevel = "low"
	EnergyMedium EnergyLevel = "medium"
	EnergyHigh   EnergyLevel = "high"
)

// TaskStatus states.
type TaskStatus string

const (
	TaskStatusTodo       TaskStatus = "todo"
	TaskStatusInProgress TaskStatus = "in_progress"
	TaskStatusDone       TaskStatus = "done"
	TaskStatusCancelled  TaskStatus = "cancelled"
)

// Task is the core actionable work item.
type Task struct {
	ID                uuid.UUID    `json:"id"`
	UserID            uuid.UUID    `json:"user_id"`
	ProjectID         *uuid.UUID   `json:"project_id"`
	Title             string       `json:"title"`
	Description       string       `json:"description"`
	Priority          TaskPriority `json:"priority"`
	EnergyLevel       EnergyLevel  `json:"energy_level"`
	Status            TaskStatus   `json:"status"`
	DueDate           *time.Time   `json:"due_date"`
	EstimatedMinutes  *int         `json:"estimated_minutes"`
	ActualMinutes     *int         `json:"actual_minutes"`
	IsRecurring       bool         `json:"is_recurring"`
	RecurrenceRule    string       `json:"recurrence_rule"`
	SortOrder         int          `json:"sort_order"`
	CompletedAt       *time.Time   `json:"completed_at"`
	CreatedAt         time.Time    `json:"created_at"`
	UpdatedAt         time.Time    `json:"updated_at"`

	// Enriched fields
	Subtasks          []*Subtask   `json:"subtasks,omitempty"`
	SubtaskCount      int          `json:"subtask_count,omitempty"`
	CompletedSubtasks int          `json:"completed_subtasks,omitempty"`
	Tags              []*Tag       `json:"tags,omitempty"`
	CheckedToday      bool         `json:"checked_today"`
	CurrentStreak     int          `json:"current_streak"`
	LongestStreak     int          `json:"longest_streak"`
	CompletedDays7D   []bool       `json:"completed_days_7d,omitempty"`
}

// Subtask represents a smaller step inside a task.
type Subtask struct {
	ID          uuid.UUID `json:"id"`
	TaskID      uuid.UUID `json:"task_id"`
	Title       string    `json:"title"`
	IsCompleted bool      `json:"is_completed"`
	SortOrder   int       `json:"sort_order"`
	CreatedAt   time.Time `json:"created_at"`
	UpdatedAt   time.Time `json:"updated_at"`
}

// Tag represents a categorization label.
type Tag struct {
	ID        uuid.UUID `json:"id"`
	UserID    uuid.UUID `json:"user_id"`
	Name      string    `json:"name"`
	Color     string    `json:"color"`
	CreatedAt time.Time `json:"created_at"`
	UpdatedAt time.Time `json:"updated_at"`
}

// TaskFilter encapsulates query filters for listing tasks.
type TaskFilter struct {
	ProjectID   *uuid.UUID
	Status      *TaskStatus
	Priority    *TaskPriority
	EnergyLevel *EnergyLevel
	IsRecurring *bool
	Search      string
	Limit       int
	Offset      int
}

// TaskRepository defines persistence contracts for Tasks.
type TaskRepository interface {
	Create(ctx context.Context, task *Task) error
	GetByID(ctx context.Context, id uuid.UUID, userID uuid.UUID) (*Task, error)
	List(ctx context.Context, userID uuid.UUID, filter TaskFilter) ([]*Task, error)
	ListRecurring(ctx context.Context, userID uuid.UUID) ([]*Task, error)
	ListOverdue(ctx context.Context, userID uuid.UUID, before time.Time) ([]*Task, error)
	ListAtRisk(ctx context.Context, userID uuid.UUID, start time.Time, end time.Time) ([]*Task, error)
	Update(ctx context.Context, task *Task) error
	MarkComplete(ctx context.Context, id uuid.UUID, userID uuid.UUID, completedAt time.Time) (*Task, error)
	UpdateSortOrder(ctx context.Context, id uuid.UUID, userID uuid.UUID, sortOrder int) error
	Delete(ctx context.Context, id uuid.UUID, userID uuid.UUID) error
}

// SubtaskRepository defines persistence contracts for Subtasks.
type SubtaskRepository interface {
	Create(ctx context.Context, subtask *Subtask) error
	GetByID(ctx context.Context, id uuid.UUID) (*Subtask, error)
	ListByTaskID(ctx context.Context, taskID uuid.UUID) ([]*Subtask, error)
	Update(ctx context.Context, subtask *Subtask) error
	ToggleComplete(ctx context.Context, id uuid.UUID) (*Subtask, error)
	Delete(ctx context.Context, id uuid.UUID) error
}

// TagRepository defines persistence contracts for Tags.
type TagRepository interface {
	Create(ctx context.Context, tag *Tag) error
	GetByID(ctx context.Context, id uuid.UUID, userID uuid.UUID) (*Tag, error)
	ListByUserID(ctx context.Context, userID uuid.UUID) ([]*Tag, error)
	Delete(ctx context.Context, id uuid.UUID, userID uuid.UUID) error
	AddTagToTask(ctx context.Context, taskID uuid.UUID, tagID uuid.UUID) error
	RemoveTagFromTask(ctx context.Context, taskID uuid.UUID, tagID uuid.UUID) error
	ListTagsByTaskID(ctx context.Context, taskID uuid.UUID) ([]*Tag, error)
}
