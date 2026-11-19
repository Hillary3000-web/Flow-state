package repository

import (
	"encoding/json"
	"errors"

	"github.com/flowstate/backend/internal/domain"
	"github.com/flowstate/backend/internal/repository/db"
	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgconn"
)

// mapDBError maps database/pgx errors into standard domain errors.
func mapDBError(err error) error {
	if err == nil {
		return nil
	}
	if errors.Is(err, pgx.ErrNoRows) {
		return domain.ErrNotFound
	}
	var pgErr *pgconn.PgError
	if errors.As(err, &pgErr) {
		switch pgErr.Code {
		case "23505": // unique_violation
			return domain.ErrConflict
		case "23503": // foreign_key_violation
			return domain.ErrInvalidInput
		case "23514": // check_violation
			return domain.ErrInvalidInput
		}
	}
	return err
}

func mapDBUserToDomain(u *db.User) *domain.User {
	if u == nil {
		return nil
	}
	pref := u.Preferences
	if len(pref) == 0 {
		pref = []byte("{}")
	}
	return &domain.User{
		ID:           u.ID,
		Email:        u.Email,
		Username:     u.Username,
		PasswordHash: u.PasswordHash,
		FullName:     u.FullName,
		Avatar:       u.Avatar,
		Timezone:     u.Timezone,
		Theme:        domain.Theme(u.Theme),
		Preferences:  json.RawMessage(pref),
		CreatedAt:    u.CreatedAt,
		UpdatedAt:    u.UpdatedAt,
	}
}

func mapDBGoalToDomain(g *db.Goal) *domain.Goal {
	if g == nil {
		return nil
	}
	return &domain.Goal{
		ID:          g.ID,
		UserID:      g.UserID,
		Title:       g.Title,
		Description: g.Description,
		Status:      domain.GoalStatus(g.Status),
		TargetDate:  g.TargetDate,
		ProgressPct: int(g.ProgressPct),
		CreatedAt:   g.CreatedAt,
		UpdatedAt:   g.UpdatedAt,
	}
}

func mapDBProjectToDomain(p *db.Project) *domain.Project {
	if p == nil {
		return nil
	}
	return &domain.Project{
		ID:          p.ID,
		GoalID:      p.GoalID,
		UserID:      p.UserID,
		Title:       p.Title,
		Description: p.Description,
		Status:      domain.GoalStatus(p.Status),
		Color:       p.Color,
		SortOrder:   int(p.SortOrder),
		CreatedAt:   p.CreatedAt,
		UpdatedAt:   p.UpdatedAt,
	}
}

func mapDBTaskToDomain(t *db.Task) *domain.Task {
	if t == nil {
		return nil
	}
	var estMin *int
	if t.EstimatedMinutes != nil {
		val := int(*t.EstimatedMinutes)
		estMin = &val
	}
	var actMin *int
	if t.ActualMinutes != nil {
		val := int(*t.ActualMinutes)
		actMin = &val
	}
	return &domain.Task{
		ID:               t.ID,
		UserID:           t.UserID,
		ProjectID:        t.ProjectID,
		Title:            t.Title,
		Description:      t.Description,
		Priority:         domain.TaskPriority(t.Priority),
		EnergyLevel:      domain.EnergyLevel(t.EnergyLevel),
		Status:           domain.TaskStatus(t.Status),
		DueDate:          t.DueDate,
		EstimatedMinutes: estMin,
		ActualMinutes:    actMin,
		IsRecurring:      t.IsRecurring,
		RecurrenceRule:   t.RecurrenceRule,
		SortOrder:        int(t.SortOrder),
		CompletedAt:      t.CompletedAt,
		CreatedAt:        t.CreatedAt,
		UpdatedAt:        t.UpdatedAt,
	}
}

func mapDBSubtaskToDomain(s *db.Subtask) *domain.Subtask {
	if s == nil {
		return nil
	}
	return &domain.Subtask{
		ID:          s.ID,
		TaskID:      s.TaskID,
		Title:       s.Title,
		IsCompleted: s.IsCompleted,
		SortOrder:   int(s.SortOrder),
		CreatedAt:   s.CreatedAt,
		UpdatedAt:   s.UpdatedAt,
	}
}

func mapDBTagToDomain(t *db.Tag) *domain.Tag {
	if t == nil {
		return nil
	}
	return &domain.Tag{
		ID:        t.ID,
		UserID:    t.UserID,
		Name:      t.Name,
		Color:     t.Color,
		CreatedAt: t.CreatedAt,
		UpdatedAt: t.UpdatedAt,
	}
}

func mapDBHabitStreakToDomain(h *db.HabitStreak) *domain.HabitStreak {
	if h == nil {
		return nil
	}
	return &domain.HabitStreak{
		ID:             h.ID,
		UserID:         h.UserID,
		TaskID:         h.TaskID,
		StreakDate:     h.StreakDate,
		CurrentStreak:  int(h.CurrentStreak),
		LongestStreak:  int(h.LongestStreak),
		CompletedToday: h.CompletedToday,
		CreatedAt:      h.CreatedAt,
		UpdatedAt:      h.UpdatedAt,
	}
}

func mapDBDailyCheckinToDomain(d *db.DailyCheckin) *domain.DailyCheckin {
	if d == nil {
		return nil
	}
	return &domain.DailyCheckin{
		ID:             d.ID,
		UserID:         d.UserID,
		CheckinDate:    d.CheckinDate,
		EnergyLevel:    int(d.EnergyLevel),
		Reflection:     d.Reflection,
		TasksPlanned:   int(d.TasksPlanned),
		TasksCompleted: int(d.TasksCompleted),
		CreatedAt:      d.CreatedAt,
		UpdatedAt:      d.UpdatedAt,
	}
}

func mapDBFocusSessionToDomain(f *db.FocusSession) *domain.FocusSession {
	if f == nil {
		return nil
	}
	log := f.DistractionLog
	if len(log) == 0 {
		log = []byte("[]")
	}
	return &domain.FocusSession{
		ID:              f.ID,
		UserID:          f.UserID,
		TaskID:          f.TaskID,
		StartedAt:       f.StartedAt,
		EndedAt:         f.EndedAt,
		DurationSeconds: int(f.DurationSeconds),
		SessionType:     domain.SessionType(f.SessionType),
		TargetMinutes:   int(f.TargetMinutes),
		DistractionLog:  json.RawMessage(log),
		IsCompleted:     f.IsCompleted,
		CreatedAt:       f.CreatedAt,
		UpdatedAt:       f.UpdatedAt,
	}
}

func mapDBTimeBlockToDomain(t *db.TimeBlock) *domain.TimeBlock {
	if t == nil {
		return nil
	}
	return &domain.TimeBlock{
		ID:          t.ID,
		UserID:      t.UserID,
		TaskID:      t.TaskID,
		Title:       t.Title,
		BlockDate:   t.BlockDate,
		StartTime:   t.StartTime,
		EndTime:     t.EndTime,
		BlockType:   domain.BlockType(t.BlockType),
		IsCompleted: t.IsCompleted,
		SortOrder:   int(t.SortOrder),
		CreatedAt:   t.CreatedAt,
		UpdatedAt:   t.UpdatedAt,
	}
}

func mapDBNotificationToDomain(n *db.Notification) *domain.Notification {
	if n == nil {
		return nil
	}
	meta := n.Metadata
	if len(meta) == 0 {
		meta = []byte("{}")
	}
	return &domain.Notification{
		ID:        n.ID,
		UserID:    n.UserID,
		Type:      domain.NotificationType(n.Type),
		Title:     n.Title,
		Message:   n.Message,
		IsRead:    n.IsRead,
		Metadata:  json.RawMessage(meta),
		CreatedAt: n.CreatedAt,
		UpdatedAt: n.UpdatedAt,
	}
}
