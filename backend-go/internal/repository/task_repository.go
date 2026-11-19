package repository

import (
	"context"
	"time"

	"github.com/flowstate/backend/internal/domain"
	"github.com/flowstate/backend/internal/repository/db"
	"github.com/google/uuid"
)

type taskRepository struct {
	q *db.Queries
}

// NewTaskRepository creates a TaskRepository backed by SQLC.
func NewTaskRepository(q *db.Queries) domain.TaskRepository {
	return &taskRepository{q: q}
}

func (r *taskRepository) Create(ctx context.Context, t *domain.Task) error {
	var estMin *int32
	if t.EstimatedMinutes != nil {
		v := int32(*t.EstimatedMinutes)
		estMin = &v
	}
	var actMin *int32
	if t.ActualMinutes != nil {
		v := int32(*t.ActualMinutes)
		actMin = &v
	}
	priority := string(t.Priority)
	if priority == "" {
		priority = "P3"
	}
	energy := string(t.EnergyLevel)
	if energy == "" {
		energy = "medium"
	}
	status := string(t.Status)
	if status == "" {
		status = "todo"
	}

	created, err := r.q.CreateTask(ctx, db.CreateTaskParams{
		UserID:           t.UserID,
		ProjectID:        t.ProjectID,
		Title:            t.Title,
		Description:      t.Description,
		Priority:         priority,
		EnergyLevel:      energy,
		Status:           status,
		DueDate:          t.DueDate,
		EstimatedMinutes: estMin,
		ActualMinutes:    actMin,
		IsRecurring:      t.IsRecurring,
		RecurrenceRule:   t.RecurrenceRule,
		SortOrder:        int32(t.SortOrder),
	})
	if err != nil {
		return mapDBError(err)
	}

	*t = *mapDBTaskToDomain(&created)
	return nil
}

func (r *taskRepository) GetByID(ctx context.Context, id uuid.UUID, userID uuid.UUID) (*domain.Task, error) {
	t, err := r.q.GetTaskByID(ctx, id, userID)
	if err != nil {
		return nil, mapDBError(err)
	}
	domTask := mapDBTaskToDomain(&t)

	// Fetch subtasks
	subtasks, err := r.q.ListSubtasksByTaskID(ctx, id)
	if err == nil {
		domTask.Subtasks = make([]*domain.Subtask, len(subtasks))
		for i := range subtasks {
			domTask.Subtasks[i] = mapDBSubtaskToDomain(&subtasks[i])
			if subtasks[i].IsCompleted {
				domTask.CompletedSubtasks++
			}
		}
		domTask.SubtaskCount = len(subtasks)
	}

	// Fetch tags
	tags, err := r.q.ListTagsByTaskID(ctx, id)
	if err == nil {
		domTask.Tags = make([]*domain.Tag, len(tags))
		for i := range tags {
			domTask.Tags[i] = mapDBTagToDomain(&tags[i])
		}
	}

	return domTask, nil
}

func (r *taskRepository) List(ctx context.Context, userID uuid.UUID, f domain.TaskFilter) ([]*domain.Task, error) {
	var status *string
	if f.Status != nil {
		s := string(*f.Status)
		status = &s
	}
	var priority *string
	if f.Priority != nil {
		p := string(*f.Priority)
		priority = &p
	}
	var energy *string
	if f.EnergyLevel != nil {
		e := string(*f.EnergyLevel)
		energy = &e
	}
	var search *string
	if f.Search != "" {
		search = &f.Search
	}
	limit := int32(f.Limit)
	if limit <= 0 {
		limit = 100
	}
	offset := int32(f.Offset)

	items, err := r.q.ListTasks(ctx, db.ListTasksParams{
		UserID:      userID,
		ProjectID:   f.ProjectID,
		Status:      status,
		Priority:    priority,
		EnergyLevel: energy,
		IsRecurring: f.IsRecurring,
		Search:      search,
		LimitCount:  limit,
		OffsetCount: offset,
	})
	if err != nil {
		return nil, mapDBError(err)
	}

	result := make([]*domain.Task, len(items))
	for i := range items {
		result[i] = mapDBTaskToDomain(&items[i])
	}
	return result, nil
}

func (r *taskRepository) ListRecurring(ctx context.Context, userID uuid.UUID) ([]*domain.Task, error) {
	items, err := r.q.ListRecurringTasksByUserID(ctx, userID)
	if err != nil {
		return nil, mapDBError(err)
	}
	result := make([]*domain.Task, len(items))
	for i := range items {
		result[i] = mapDBTaskToDomain(&items[i])
	}
	return result, nil
}

func (r *taskRepository) ListOverdue(ctx context.Context, userID uuid.UUID, before time.Time) ([]*domain.Task, error) {
	items, err := r.q.ListOverdueTasks(ctx, db.ListOverdueTasksParams{
		UserID:  userID,
		DueDate: before,
	})
	if err != nil {
		return nil, mapDBError(err)
	}
	result := make([]*domain.Task, len(items))
	for i := range items {
		result[i] = mapDBTaskToDomain(&items[i])
	}
	return result, nil
}

func (r *taskRepository) ListAtRisk(ctx context.Context, userID uuid.UUID, start time.Time, end time.Time) ([]*domain.Task, error) {
	items, err := r.q.ListAtRiskTasks(ctx, db.ListAtRiskTasksParams{
		UserID:    userID,
		DueDate:   start,
		DueDate_2: end,
	})
	if err != nil {
		return nil, mapDBError(err)
	}
	result := make([]*domain.Task, len(items))
	for i := range items {
		result[i] = mapDBTaskToDomain(&items[i])
	}
	return result, nil
}

func (r *taskRepository) Update(ctx context.Context, t *domain.Task) error {
	var priority *string
	if t.Priority != "" {
		p := string(t.Priority)
		priority = &p
	}
	var energy *string
	if t.EnergyLevel != "" {
		e := string(t.EnergyLevel)
		energy = &e
	}
	var status *string
	if t.Status != "" {
		s := string(t.Status)
		status = &s
	}
	var estMin *int32
	if t.EstimatedMinutes != nil {
		v := int32(*t.EstimatedMinutes)
		estMin = &v
	}
	var actMin *int32
	if t.ActualMinutes != nil {
		v := int32(*t.ActualMinutes)
		actMin = &v
	}
	sortOrder := int32(t.SortOrder)

	updated, err := r.q.UpdateTask(ctx, db.UpdateTaskParams{
		ProjectID:        t.ProjectID,
		Title:            &t.Title,
		Description:      &t.Description,
		Priority:         priority,
		EnergyLevel:      energy,
		Status:           status,
		DueDate:          t.DueDate,
		EstimatedMinutes: estMin,
		ActualMinutes:    actMin,
		IsRecurring:      &t.IsRecurring,
		RecurrenceRule:   &t.RecurrenceRule,
		SortOrder:        &sortOrder,
		CompletedAt:      t.CompletedAt,
		ID:               t.ID,
		UserID:           t.UserID,
	})
	if err != nil {
		return mapDBError(err)
	}

	*t = *mapDBTaskToDomain(&updated)
	return nil
}

func (r *taskRepository) MarkComplete(ctx context.Context, id uuid.UUID, userID uuid.UUID, completedAt time.Time) (*domain.Task, error) {
	updated, err := r.q.MarkTaskComplete(ctx, db.MarkTaskCompleteParams{
		ID:          id,
		UserID:      userID,
		CompletedAt: completedAt,
	})
	if err != nil {
		return nil, mapDBError(err)
	}
	return mapDBTaskToDomain(&updated), nil
}

func (r *taskRepository) UpdateSortOrder(ctx context.Context, id uuid.UUID, userID uuid.UUID, sortOrder int) error {
	err := r.q.UpdateTaskSortOrder(ctx, db.UpdateTaskSortOrderParams{
		ID:        id,
		UserID:    userID,
		SortOrder: int32(sortOrder),
	})
	return mapDBError(err)
}

func (r *taskRepository) Delete(ctx context.Context, id uuid.UUID, userID uuid.UUID) error {
	err := r.q.DeleteTask(ctx, id, userID)
	return mapDBError(err)
}

// Subtask Repository

type subtaskRepository struct {
	q *db.Queries
}

// NewSubtaskRepository creates a SubtaskRepository backed by SQLC.
func NewSubtaskRepository(q *db.Queries) domain.SubtaskRepository {
	return &subtaskRepository{q: q}
}

func (r *subtaskRepository) Create(ctx context.Context, s *domain.Subtask) error {
	created, err := r.q.CreateSubtask(ctx, db.CreateSubtaskParams{
		TaskID:      s.TaskID,
		Title:       s.Title,
		IsCompleted: s.IsCompleted,
		SortOrder:   int32(s.SortOrder),
	})
	if err != nil {
		return mapDBError(err)
	}
	*s = *mapDBSubtaskToDomain(&created)
	return nil
}

func (r *subtaskRepository) GetByID(ctx context.Context, id uuid.UUID) (*domain.Subtask, error) {
	item, err := r.q.GetSubtaskByID(ctx, id)
	if err != nil {
		return nil, mapDBError(err)
	}
	return mapDBSubtaskToDomain(&item), nil
}

func (r *subtaskRepository) ListByTaskID(ctx context.Context, taskID uuid.UUID) ([]*domain.Subtask, error) {
	items, err := r.q.ListSubtasksByTaskID(ctx, taskID)
	if err != nil {
		return nil, mapDBError(err)
	}
	result := make([]*domain.Subtask, len(items))
	for i := range items {
		result[i] = mapDBSubtaskToDomain(&items[i])
	}
	return result, nil
}

func (r *subtaskRepository) Update(ctx context.Context, s *domain.Subtask) error {
	sortOrder := int32(s.SortOrder)
	updated, err := r.q.UpdateSubtask(ctx, db.UpdateSubtaskParams{
		Title:       &s.Title,
		IsCompleted: &s.IsCompleted,
		SortOrder:   &sortOrder,
		ID:          s.ID,
	})
	if err != nil {
		return mapDBError(err)
	}
	*s = *mapDBSubtaskToDomain(&updated)
	return nil
}

func (r *subtaskRepository) ToggleComplete(ctx context.Context, id uuid.UUID) (*domain.Subtask, error) {
	updated, err := r.q.ToggleSubtaskComplete(ctx, id)
	if err != nil {
		return nil, mapDBError(err)
	}
	return mapDBSubtaskToDomain(&updated), nil
}

func (r *subtaskRepository) Delete(ctx context.Context, id uuid.UUID) error {
	return mapDBError(r.q.DeleteSubtask(ctx, id))
}

// Tag Repository

type tagRepository struct {
	q *db.Queries
}

// NewTagRepository creates a TagRepository backed by SQLC.
func NewTagRepository(q *db.Queries) domain.TagRepository {
	return &tagRepository{q: q}
}

func (r *tagRepository) Create(ctx context.Context, t *domain.Tag) error {
	color := t.Color
	if color == "" {
		color = "#8b5cf6"
	}
	created, err := r.q.CreateTag(ctx, db.CreateTagParams{
		UserID: t.UserID,
		Name:   t.Name,
		Color:  color,
	})
	if err != nil {
		return mapDBError(err)
	}
	*t = *mapDBTagToDomain(&created)
	return nil
}

func (r *tagRepository) GetByID(ctx context.Context, id uuid.UUID, userID uuid.UUID) (*domain.Tag, error) {
	item, err := r.q.GetTagByID(ctx, id, userID)
	if err != nil {
		return nil, mapDBError(err)
	}
	return mapDBTagToDomain(&item), nil
}

func (r *tagRepository) ListByUserID(ctx context.Context, userID uuid.UUID) ([]*domain.Tag, error) {
	items, err := r.q.ListTagsByUserID(ctx, userID)
	if err != nil {
		return nil, mapDBError(err)
	}
	result := make([]*domain.Tag, len(items))
	for i := range items {
		result[i] = mapDBTagToDomain(&items[i])
	}
	return result, nil
}

func (r *tagRepository) Delete(ctx context.Context, id uuid.UUID, userID uuid.UUID) error {
	return mapDBError(r.q.DeleteTag(ctx, id, userID))
}

func (r *tagRepository) AddTagToTask(ctx context.Context, taskID uuid.UUID, tagID uuid.UUID) error {
	return mapDBError(r.q.AddTagToTask(ctx, db.AddTagToTaskParams{
		TaskID: taskID,
		TagID:  tagID,
	}))
}

func (r *tagRepository) RemoveTagFromTask(ctx context.Context, taskID uuid.UUID, tagID uuid.UUID) error {
	return mapDBError(r.q.RemoveTagFromTask(ctx, db.RemoveTagFromTaskParams{
		TaskID: taskID,
		TagID:  tagID,
	}))
}

func (r *tagRepository) ListTagsByTaskID(ctx context.Context, taskID uuid.UUID) ([]*domain.Tag, error) {
	items, err := r.q.ListTagsByTaskID(ctx, taskID)
	if err != nil {
		return nil, mapDBError(err)
	}
	result := make([]*domain.Tag, len(items))
	for i := range items {
		result[i] = mapDBTagToDomain(&items[i])
	}
	return result, nil
}
