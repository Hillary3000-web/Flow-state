package repository

import (
	"context"

	"github.com/flowstate/backend/internal/domain"
	"github.com/flowstate/backend/internal/repository/db"
	"github.com/google/uuid"
)

type goalRepository struct {
	q *db.Queries
}

// NewGoalRepository creates a GoalRepository backed by SQLC.
func NewGoalRepository(q *db.Queries) domain.GoalRepository {
	return &goalRepository{q: q}
}

func (r *goalRepository) Create(ctx context.Context, g *domain.Goal) error {
	status := string(g.Status)
	if status == "" {
		status = "active"
	}
	created, err := r.q.CreateGoal(ctx, db.CreateGoalParams{
		UserID:      g.UserID,
		Title:       g.Title,
		Description: g.Description,
		Status:      status,
		TargetDate:  g.TargetDate,
		ProgressPct: int32(g.ProgressPct),
	})
	if err != nil {
		return mapDBError(err)
	}
	*g = *mapDBGoalToDomain(&created)
	return nil
}

func (r *goalRepository) GetByID(ctx context.Context, id uuid.UUID, userID uuid.UUID) (*domain.Goal, error) {
	g, err := r.q.GetGoalByID(ctx, id, userID)
	if err != nil {
		return nil, mapDBError(err)
	}
	domGoal := mapDBGoalToDomain(&g)

	// Fetch projects under this goal
	projects, err := r.q.ListProjectsByGoalID(ctx, id, userID)
	if err == nil {
		domGoal.Projects = make([]*domain.Project, len(projects))
		for i := range projects {
			domGoal.Projects[i] = mapDBProjectToDomain(&projects[i])
		}
	}

	return domGoal, nil
}

func (r *goalRepository) ListByUserID(ctx context.Context, userID uuid.UUID, status *domain.GoalStatus) ([]*domain.Goal, error) {
	var st *string
	if status != nil {
		s := string(*status)
		st = &s
	}
	items, err := r.q.ListGoalsByUserID(ctx, db.ListGoalsByUserIDParams{
		UserID: userID,
		Status: st,
	})
	if err != nil {
		return nil, mapDBError(err)
	}
	result := make([]*domain.Goal, len(items))
	for i := range items {
		result[i] = mapDBGoalToDomain(&items[i])
	}
	return result, nil
}

func (r *goalRepository) Update(ctx context.Context, g *domain.Goal) error {
	var st *string
	if g.Status != "" {
		s := string(g.Status)
		st = &s
	}
	pct := int32(g.ProgressPct)
	updated, err := r.q.UpdateGoal(ctx, db.UpdateGoalParams{
		Title:       &g.Title,
		Description: &g.Description,
		Status:      st,
		TargetDate:  g.TargetDate,
		ProgressPct: &pct,
		ID:          g.ID,
		UserID:      g.UserID,
	})
	if err != nil {
		return mapDBError(err)
	}
	*g = *mapDBGoalToDomain(&updated)
	return nil
}

func (r *goalRepository) UpdateProgress(ctx context.Context, id uuid.UUID, userID uuid.UUID, progressPct int) error {
	_, err := r.q.UpdateGoalProgress(ctx, db.UpdateGoalProgressParams{
		ID:          id,
		UserID:      userID,
		ProgressPct: int32(progressPct),
	})
	return mapDBError(err)
}

func (r *goalRepository) Delete(ctx context.Context, id uuid.UUID, userID uuid.UUID) error {
	return mapDBError(r.q.DeleteGoal(ctx, id, userID))
}

// Project Repository

type projectRepository struct {
	q *db.Queries
}

// NewProjectRepository creates a ProjectRepository backed by SQLC.
func NewProjectRepository(q *db.Queries) domain.ProjectRepository {
	return &projectRepository{q: q}
}

func (r *projectRepository) Create(ctx context.Context, p *domain.Project) error {
	status := string(p.Status)
	if status == "" {
		status = "active"
	}
	color := p.Color
	if color == "" {
		color = "#6366f1"
	}
	created, err := r.q.CreateProject(ctx, db.CreateProjectParams{
		GoalID:      p.GoalID,
		UserID:      p.UserID,
		Title:       p.Title,
		Description: p.Description,
		Status:      status,
		Color:       color,
		SortOrder:   int32(p.SortOrder),
	})
	if err != nil {
		return mapDBError(err)
	}
	*p = *mapDBProjectToDomain(&created)
	return nil
}

func (r *projectRepository) GetByID(ctx context.Context, id uuid.UUID, userID uuid.UUID) (*domain.Project, error) {
	p, err := r.q.GetProjectByID(ctx, id, userID)
	if err != nil {
		return nil, mapDBError(err)
	}
	return mapDBProjectToDomain(&p), nil
}

func (r *projectRepository) ListByGoalID(ctx context.Context, goalID uuid.UUID, userID uuid.UUID) ([]*domain.Project, error) {
	items, err := r.q.ListProjectsByGoalID(ctx, goalID, userID)
	if err != nil {
		return nil, mapDBError(err)
	}
	result := make([]*domain.Project, len(items))
	for i := range items {
		result[i] = mapDBProjectToDomain(&items[i])
	}
	return result, nil
}

func (r *projectRepository) ListByUserID(ctx context.Context, userID uuid.UUID, status *domain.GoalStatus) ([]*domain.Project, error) {
	var st *string
	if status != nil {
		s := string(*status)
		st = &s
	}
	items, err := r.q.ListProjectsByUserID(ctx, db.ListProjectsByUserIDParams{
		UserID: userID,
		Status: st,
	})
	if err != nil {
		return nil, mapDBError(err)
	}
	result := make([]*domain.Project, len(items))
	for i := range items {
		result[i] = mapDBProjectToDomain(&items[i])
	}
	return result, nil
}

func (r *projectRepository) Update(ctx context.Context, p *domain.Project) error {
	var st *string
	if p.Status != "" {
		s := string(p.Status)
		st = &s
	}
	sortOrder := int32(p.SortOrder)
	updated, err := r.q.UpdateProject(ctx, db.UpdateProjectParams{
		GoalID:      &p.GoalID,
		Title:       &p.Title,
		Description: &p.Description,
		Status:      st,
		Color:       &p.Color,
		SortOrder:   &sortOrder,
		ID:          p.ID,
		UserID:      p.UserID,
	})
	if err != nil {
		return mapDBError(err)
	}
	*p = *mapDBProjectToDomain(&updated)
	return nil
}

func (r *projectRepository) Delete(ctx context.Context, id uuid.UUID, userID uuid.UUID) error {
	return mapDBError(r.q.DeleteProject(ctx, id, userID))
}
