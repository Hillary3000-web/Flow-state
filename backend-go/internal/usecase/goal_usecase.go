package usecase

import (
	"context"
	"time"

	"github.com/flowstate/backend/internal/domain"
	"github.com/google/uuid"
)

// GoalUsecase defines business logic for goals, projects, and subtasks.
type GoalUsecase interface {
	CreateGoal(ctx context.Context, userID uuid.UUID, title, description string, targetDate *time.Time, status domain.GoalStatus) (*domain.Goal, error)
	GetGoal(ctx context.Context, id, userID uuid.UUID) (*domain.Goal, error)
	ListGoals(ctx context.Context, userID uuid.UUID, status *domain.GoalStatus) ([]*domain.Goal, error)
	UpdateGoal(ctx context.Context, id, userID uuid.UUID, title, description *string, targetDate *time.Time, status *domain.GoalStatus, progressPct *int) (*domain.Goal, error)
	DeleteGoal(ctx context.Context, id, userID uuid.UUID) error

	CreateProject(ctx context.Context, userID, goalID uuid.UUID, title, description, color string, status domain.GoalStatus) (*domain.Project, error)
	GetProject(ctx context.Context, id, userID uuid.UUID) (*domain.Project, error)
	ListProjects(ctx context.Context, userID uuid.UUID, status *domain.GoalStatus) ([]*domain.Project, error)
	UpdateProject(ctx context.Context, id, userID uuid.UUID, title, description, color *string, status *domain.GoalStatus) (*domain.Project, error)
	DeleteProject(ctx context.Context, id, userID uuid.UUID) error

	CreateSubtask(ctx context.Context, taskID uuid.UUID, title string) (*domain.Subtask, error)
	GetSubtask(ctx context.Context, id uuid.UUID) (*domain.Subtask, error)
	ListSubtasks(ctx context.Context, taskID uuid.UUID) ([]*domain.Subtask, error)
	UpdateSubtask(ctx context.Context, subtask *domain.Subtask) (*domain.Subtask, error)
	ToggleSubtask(ctx context.Context, id uuid.UUID) (*domain.Subtask, error)
	DeleteSubtask(ctx context.Context, id uuid.UUID) error
}

type goalUsecase struct {
	goalRepo    domain.GoalRepository
	projectRepo domain.ProjectRepository
	subtaskRepo domain.SubtaskRepository
}

// NewGoalUsecase constructs a GoalUsecase instance.
func NewGoalUsecase(
	goalRepo domain.GoalRepository,
	projectRepo domain.ProjectRepository,
	subtaskRepo domain.SubtaskRepository,
) GoalUsecase {
	return &goalUsecase{
		goalRepo:    goalRepo,
		projectRepo: projectRepo,
		subtaskRepo: subtaskRepo,
	}
}

func (u *goalUsecase) CreateGoal(ctx context.Context, userID uuid.UUID, title, description string, targetDate *time.Time, status domain.GoalStatus) (*domain.Goal, error) {
	if status == "" {
		status = domain.GoalStatusActive
	}
	goal := &domain.Goal{
		UserID:      userID,
		Title:       title,
		Description: description,
		Status:      status,
		TargetDate:  targetDate,
		ProgressPct: 0,
	}
	if err := u.goalRepo.Create(ctx, goal); err != nil {
		return nil, err
	}
	return goal, nil
}

func (u *goalUsecase) GetGoal(ctx context.Context, id, userID uuid.UUID) (*domain.Goal, error) {
	return u.goalRepo.GetByID(ctx, id, userID)
}

func (u *goalUsecase) ListGoals(ctx context.Context, userID uuid.UUID, status *domain.GoalStatus) ([]*domain.Goal, error) {
	return u.goalRepo.ListByUserID(ctx, userID, status)
}

func (u *goalUsecase) UpdateGoal(ctx context.Context, id, userID uuid.UUID, title, description *string, targetDate *time.Time, status *domain.GoalStatus, progressPct *int) (*domain.Goal, error) {
	goal, err := u.goalRepo.GetByID(ctx, id, userID)
	if err != nil {
		return nil, err
	}
	if title != nil {
		goal.Title = *title
	}
	if description != nil {
		goal.Description = *description
	}
	if targetDate != nil {
		goal.TargetDate = targetDate
	}
	if status != nil {
		goal.Status = *status
	}
	if progressPct != nil {
		goal.ProgressPct = *progressPct
	}
	if err := u.goalRepo.Update(ctx, goal); err != nil {
		return nil, err
	}
	return goal, nil
}

func (u *goalUsecase) DeleteGoal(ctx context.Context, id, userID uuid.UUID) error {
	return u.goalRepo.Delete(ctx, id, userID)
}

func (u *goalUsecase) CreateProject(ctx context.Context, userID, goalID uuid.UUID, title, description, color string, status domain.GoalStatus) (*domain.Project, error) {
	if status == "" {
		status = domain.GoalStatusActive
	}
	if color == "" {
		color = "#6366f1"
	}
	project := &domain.Project{
		GoalID:      goalID,
		UserID:      userID,
		Title:       title,
		Description: description,
		Status:      status,
		Color:       color,
	}
	if err := u.projectRepo.Create(ctx, project); err != nil {
		return nil, err
	}
	return project, nil
}

func (u *goalUsecase) GetProject(ctx context.Context, id, userID uuid.UUID) (*domain.Project, error) {
	return u.projectRepo.GetByID(ctx, id, userID)
}

func (u *goalUsecase) ListProjects(ctx context.Context, userID uuid.UUID, status *domain.GoalStatus) ([]*domain.Project, error) {
	return u.projectRepo.ListByUserID(ctx, userID, status)
}

func (u *goalUsecase) UpdateProject(ctx context.Context, id, userID uuid.UUID, title, description, color *string, status *domain.GoalStatus) (*domain.Project, error) {
	proj, err := u.projectRepo.GetByID(ctx, id, userID)
	if err != nil {
		return nil, err
	}
	if title != nil {
		proj.Title = *title
	}
	if description != nil {
		proj.Description = *description
	}
	if color != nil {
		proj.Color = *color
	}
	if status != nil {
		proj.Status = *status
	}
	if err := u.projectRepo.Update(ctx, proj); err != nil {
		return nil, err
	}
	return proj, nil
}

func (u *goalUsecase) DeleteProject(ctx context.Context, id, userID uuid.UUID) error {
	return u.projectRepo.Delete(ctx, id, userID)
}

func (u *goalUsecase) CreateSubtask(ctx context.Context, taskID uuid.UUID, title string) (*domain.Subtask, error) {
	subtask := &domain.Subtask{
		TaskID:      taskID,
		Title:       title,
		IsCompleted: false,
	}
	if err := u.subtaskRepo.Create(ctx, subtask); err != nil {
		return nil, err
	}
	return subtask, nil
}

func (u *goalUsecase) GetSubtask(ctx context.Context, id uuid.UUID) (*domain.Subtask, error) {
	return u.subtaskRepo.GetByID(ctx, id)
}

func (u *goalUsecase) ListSubtasks(ctx context.Context, taskID uuid.UUID) ([]*domain.Subtask, error) {
	return u.subtaskRepo.ListByTaskID(ctx, taskID)
}

func (u *goalUsecase) UpdateSubtask(ctx context.Context, subtask *domain.Subtask) (*domain.Subtask, error) {
	if err := u.subtaskRepo.Update(ctx, subtask); err != nil {
		return nil, err
	}
	return subtask, nil
}

func (u *goalUsecase) ToggleSubtask(ctx context.Context, id uuid.UUID) (*domain.Subtask, error) {
	return u.subtaskRepo.ToggleComplete(ctx, id)
}

func (u *goalUsecase) DeleteSubtask(ctx context.Context, id uuid.UUID) error {
	return u.subtaskRepo.Delete(ctx, id)
}

