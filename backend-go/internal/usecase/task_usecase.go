package usecase

import (
	"context"
	"strings"
	"time"

	"github.com/flowstate/backend/internal/domain"
	"github.com/google/uuid"
)

// CreateTaskInput encapsulates data needed to create a new task.
type CreateTaskInput struct {
	UserID           uuid.UUID           `json:"user_id"`
	ProjectID        *uuid.UUID          `json:"project_id"`
	Title            string              `json:"title"`
	Description      string              `json:"description"`
	Priority         domain.TaskPriority `json:"priority"`
	EnergyLevel      domain.EnergyLevel  `json:"energy_level"`
	DueDate          *time.Time          `json:"due_date"`
	EstimatedMinutes *int                `json:"estimated_minutes"`
	IsRecurring      bool                `json:"is_recurring"`
	RecurrenceRule   string              `json:"recurrence_rule"`
}

// UpdateTaskInput encapsulates fields that can be updated on a task.
type UpdateTaskInput struct {
	ID               uuid.UUID            `json:"id"`
	UserID           uuid.UUID            `json:"user_id"`
	ProjectID        *uuid.UUID           `json:"project_id"`
	Title            *string              `json:"title"`
	Description      *string              `json:"description"`
	Priority         *domain.TaskPriority `json:"priority"`
	EnergyLevel      *domain.EnergyLevel  `json:"energy_level"`
	Status           *domain.TaskStatus   `json:"status"`
	DueDate          *time.Time           `json:"due_date"`
	EstimatedMinutes *int                 `json:"estimated_minutes"`
	ActualMinutes    *int                 `json:"actual_minutes"`
	IsRecurring      *bool                `json:"is_recurring"`
	RecurrenceRule   *string              `json:"recurrence_rule"`
	SortOrder        *int                 `json:"sort_order"`
	CompletedAt      *time.Time           `json:"completed_at"`
}

// ReorderTaskItem encapsulates id and new sort order for reordering.
type ReorderTaskItem struct {
	ID        uuid.UUID `json:"id"`
	SortOrder int       `json:"sort_order"`
}

// TaskUsecase defines business logic for tasks.
type TaskUsecase interface {
	CreateTask(ctx context.Context, in CreateTaskInput) (*domain.Task, error)
	GetTask(ctx context.Context, userID, taskID uuid.UUID) (*domain.Task, error)
	ListTasks(ctx context.Context, userID uuid.UUID, filter domain.TaskFilter) ([]*domain.Task, error)
	UpdateTask(ctx context.Context, in UpdateTaskInput) (*domain.Task, error)
	DeleteTask(ctx context.Context, userID, taskID uuid.UUID) error
	MarkComplete(ctx context.Context, userID, taskID uuid.UUID) (*domain.Task, error)
	QuickCapture(ctx context.Context, userID uuid.UUID, rawText string, priority domain.TaskPriority) (*domain.Task, error)
	ReorderTasks(ctx context.Context, userID uuid.UUID, items []ReorderTaskItem) error
}

type taskUsecase struct {
	taskRepo domain.TaskRepository
}

// NewTaskUsecase constructs a TaskUsecase instance.
func NewTaskUsecase(taskRepo domain.TaskRepository) TaskUsecase {
	return &taskUsecase{
		taskRepo: taskRepo,
	}
}

func (u *taskUsecase) CreateTask(ctx context.Context, in CreateTaskInput) (*domain.Task, error) {
	title := strings.TrimSpace(in.Title)
	if title == "" {
		return nil, domain.ErrInvalidInput
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
		UserID:           in.UserID,
		ProjectID:        in.ProjectID,
		Title:            title,
		Description:      in.Description,
		Priority:         priority,
		EnergyLevel:      energy,
		Status:           domain.TaskStatusTodo,
		DueDate:          in.DueDate,
		EstimatedMinutes: in.EstimatedMinutes,
		IsRecurring:      in.IsRecurring,
		RecurrenceRule:   in.RecurrenceRule,
	}

	if err := u.taskRepo.Create(ctx, task); err != nil {
		return nil, err
	}
	return task, nil
}

func (u *taskUsecase) GetTask(ctx context.Context, userID, taskID uuid.UUID) (*domain.Task, error) {
	return u.taskRepo.GetByID(ctx, taskID, userID)
}

func (u *taskUsecase) ListTasks(ctx context.Context, userID uuid.UUID, filter domain.TaskFilter) ([]*domain.Task, error) {
	return u.taskRepo.List(ctx, userID, filter)
}

func (u *taskUsecase) UpdateTask(ctx context.Context, in UpdateTaskInput) (*domain.Task, error) {
	task, err := u.taskRepo.GetByID(ctx, in.ID, in.UserID)
	if err != nil {
		return nil, err
	}

	if in.Title != nil {
		task.Title = strings.TrimSpace(*in.Title)
	}
	if in.Description != nil {
		task.Description = *in.Description
	}
	if in.Priority != nil {
		task.Priority = *in.Priority
	}
	if in.EnergyLevel != nil {
		task.EnergyLevel = *in.EnergyLevel
	}
	if in.Status != nil {
		task.Status = *in.Status
		if *in.Status == domain.TaskStatusDone && task.CompletedAt == nil {
			now := time.Now().UTC()
			task.CompletedAt = &now
		}
	}
	if in.DueDate != nil {
		task.DueDate = in.DueDate
	}
	if in.EstimatedMinutes != nil {
		task.EstimatedMinutes = in.EstimatedMinutes
	}
	if in.ActualMinutes != nil {
		task.ActualMinutes = in.ActualMinutes
	}
	if in.IsRecurring != nil {
		task.IsRecurring = *in.IsRecurring
	}
	if in.RecurrenceRule != nil {
		task.RecurrenceRule = *in.RecurrenceRule
	}
	if in.SortOrder != nil {
		task.SortOrder = *in.SortOrder
	}
	if in.ProjectID != nil {
		task.ProjectID = in.ProjectID
	}
	if in.CompletedAt != nil {
		task.CompletedAt = in.CompletedAt
	}

	if err := u.taskRepo.Update(ctx, task); err != nil {
		return nil, err
	}
	return task, nil
}

func (u *taskUsecase) DeleteTask(ctx context.Context, userID, taskID uuid.UUID) error {
	return u.taskRepo.Delete(ctx, taskID, userID)
}

func (u *taskUsecase) MarkComplete(ctx context.Context, userID, taskID uuid.UUID) (*domain.Task, error) {
	return u.taskRepo.MarkComplete(ctx, taskID, userID, time.Now().UTC())
}

func (u *taskUsecase) QuickCapture(ctx context.Context, userID uuid.UUID, rawText string, priority domain.TaskPriority) (*domain.Task, error) {
	rawText = strings.TrimSpace(rawText)
	if rawText == "" {
		return nil, domain.ErrInvalidInput
	}

	if priority == "" {
		priority = domain.PriorityP3
	}

	task := &domain.Task{
		UserID:      userID,
		Title:       rawText,
		Priority:    priority,
		EnergyLevel: domain.EnergyMedium,
		Status:      domain.TaskStatusTodo,
	}

	if err := u.taskRepo.Create(ctx, task); err != nil {
		return nil, err
	}
	return task, nil
}

func (u *taskUsecase) ReorderTasks(ctx context.Context, userID uuid.UUID, items []ReorderTaskItem) error {
	for _, item := range items {
		if err := u.taskRepo.UpdateSortOrder(ctx, item.ID, userID, item.SortOrder); err != nil {
			return err
		}
	}
	return nil
}
