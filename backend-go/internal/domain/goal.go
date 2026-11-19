package domain

import (
	"context"
	"time"

	"github.com/google/uuid"
)

// GoalStatus represents status of a goal or project.
type GoalStatus string

const (
	GoalStatusActive    GoalStatus = "active"
	GoalStatusCompleted GoalStatus = "completed"
	GoalStatusArchived  GoalStatus = "archived"
)

// Goal represents a high-level objective.
type Goal struct {
	ID          uuid.UUID    `json:"id"`
	UserID      uuid.UUID    `json:"user_id"`
	Title       string       `json:"title"`
	Description string       `json:"description"`
	Status      GoalStatus   `json:"status"`
	TargetDate  *time.Time   `json:"target_date"`
	ProgressPct int          `json:"progress_pct"`
	Projects    []*Project   `json:"projects,omitempty"`
	CreatedAt   time.Time    `json:"created_at"`
	UpdatedAt   time.Time    `json:"updated_at"`
}

// Project groups related tasks under a specific goal.
type Project struct {
	ID             uuid.UUID  `json:"id"`
	GoalID         uuid.UUID  `json:"goal_id"`
	UserID         uuid.UUID  `json:"user_id"`
	Title          string     `json:"title"`
	Description    string     `json:"description"`
	Status         GoalStatus `json:"status"`
	Color          string     `json:"color"`
	SortOrder      int        `json:"sort_order"`
	TaskCount      int        `json:"task_count,omitempty"`
	CompletedTasks int        `json:"completed_tasks,omitempty"`
	CreatedAt      time.Time  `json:"created_at"`
	UpdatedAt      time.Time  `json:"updated_at"`
}

// GoalRepository defines data access methods for Goals.
type GoalRepository interface {
	Create(ctx context.Context, goal *Goal) error
	GetByID(ctx context.Context, id uuid.UUID, userID uuid.UUID) (*Goal, error)
	ListByUserID(ctx context.Context, userID uuid.UUID, status *GoalStatus) ([]*Goal, error)
	Update(ctx context.Context, goal *Goal) error
	UpdateProgress(ctx context.Context, id uuid.UUID, userID uuid.UUID, progressPct int) error
	Delete(ctx context.Context, id uuid.UUID, userID uuid.UUID) error
}

// ProjectRepository defines data access methods for Projects.
type ProjectRepository interface {
	Create(ctx context.Context, project *Project) error
	GetByID(ctx context.Context, id uuid.UUID, userID uuid.UUID) (*Project, error)
	ListByGoalID(ctx context.Context, goalID uuid.UUID, userID uuid.UUID) ([]*Project, error)
	ListByUserID(ctx context.Context, userID uuid.UUID, status *GoalStatus) ([]*Project, error)
	Update(ctx context.Context, project *Project) error
	Delete(ctx context.Context, id uuid.UUID, userID uuid.UUID) error
}
