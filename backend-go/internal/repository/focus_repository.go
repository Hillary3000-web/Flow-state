package repository

import (
	"context"
	"encoding/json"
	"time"

	"github.com/flowstate/backend/internal/domain"
	"github.com/flowstate/backend/internal/repository/db"
	"github.com/google/uuid"
)

type focusRepository struct {
	q *db.Queries
}

// NewFocusRepository creates a FocusRepository backed by SQLC.
func NewFocusRepository(q *db.Queries) domain.FocusRepository {
	return &focusRepository{q: q}
}

func (r *focusRepository) Create(ctx context.Context, s *domain.FocusSession) error {
	sessionType := string(s.SessionType)
	if sessionType == "" {
		sessionType = "pomodoro"
	}
	targetMin := s.TargetMinutes
	if targetMin <= 0 {
		targetMin = 25
	}
	created, err := r.q.CreateFocusSession(ctx, db.CreateFocusSessionParams{
		UserID:        s.UserID,
		TaskID:        s.TaskID,
		StartedAt:     s.StartedAt,
		SessionType:   sessionType,
		TargetMinutes: int32(targetMin),
	})
	if err != nil {
		return mapDBError(err)
	}
	*s = *mapDBFocusSessionToDomain(&created)
	return nil
}

func (r *focusRepository) GetByID(ctx context.Context, id uuid.UUID, userID uuid.UUID) (*domain.FocusSession, error) {
	row, err := r.q.GetFocusSessionByID(ctx, id, userID)
	if err != nil {
		return nil, mapDBError(err)
	}

	distractionLog := row.DistractionLog
	if len(distractionLog) == 0 {
		distractionLog = []byte("[]")
	}

	dom := &domain.FocusSession{
		ID:              row.ID,
		UserID:          row.UserID,
		TaskID:          row.TaskID,
		StartedAt:       row.StartedAt,
		EndedAt:         row.EndedAt,
		DurationSeconds: int(row.DurationSeconds),
		SessionType:     domain.SessionType(row.SessionType),
		TargetMinutes:   int(row.TargetMinutes),
		DistractionLog:  json.RawMessage(distractionLog),
		IsCompleted:     row.IsCompleted,
		CreatedAt:       row.CreatedAt,
		UpdatedAt:       row.UpdatedAt,
	}
	if row.TaskTitle != nil {
		dom.TaskTitle = *row.TaskTitle
	}
	return dom, nil
}

func (r *focusRepository) EndSession(ctx context.Context, id uuid.UUID, userID uuid.UUID, endedAt time.Time, durationSeconds int, distractionLog json.RawMessage, isCompleted bool) (*domain.FocusSession, error) {
	log := []byte(distractionLog)
	if len(log) == 0 {
		log = []byte("[]")
	}
	updated, err := r.q.EndFocusSession(ctx, db.EndFocusSessionParams{
		ID:              id,
		UserID:          userID,
		EndedAt:         &endedAt,
		DurationSeconds: int32(durationSeconds),
		DistractionLog:  log,
		IsCompleted:     isCompleted,
	})
	if err != nil {
		return nil, mapDBError(err)
	}
	return mapDBFocusSessionToDomain(&updated), nil
}

func (r *focusRepository) ListByUserID(ctx context.Context, userID uuid.UUID, limit int) ([]*domain.FocusSession, error) {
	lim := int32(limit)
	if lim <= 0 {
		lim = 50
	}
	rows, err := r.q.ListFocusSessionsByUserID(ctx, userID, lim)
	if err != nil {
		return nil, mapDBError(err)
	}

	result := make([]*domain.FocusSession, len(rows))
	for i, row := range rows {
		log := row.DistractionLog
		if len(log) == 0 {
			log = []byte("[]")
		}
		item := &domain.FocusSession{
			ID:              row.ID,
			UserID:          row.UserID,
			TaskID:          row.TaskID,
			StartedAt:       row.StartedAt,
			EndedAt:         row.EndedAt,
			DurationSeconds: int(row.DurationSeconds),
			SessionType:     domain.SessionType(row.SessionType),
			TargetMinutes:   int(row.TargetMinutes),
			DistractionLog:  json.RawMessage(log),
			IsCompleted:     row.IsCompleted,
			CreatedAt:       row.CreatedAt,
			UpdatedAt:       row.UpdatedAt,
		}
		if row.TaskTitle != nil {
			item.TaskTitle = *row.TaskTitle
		}
		result[i] = item
	}
	return result, nil
}

func (r *focusRepository) GetCompletedDates(ctx context.Context, userID uuid.UUID) ([]time.Time, error) {
	dates, err := r.q.GetCompletedFocusSessionDates(ctx, userID)
	if err != nil {
		return nil, mapDBError(err)
	}
	return dates, nil
}

func (r *focusRepository) GetStats(ctx context.Context, userID uuid.UUID, since time.Time) (int64, int64, error) {
	row, err := r.q.GetFocusStatsSince(ctx, userID, since)
	if err != nil {
		return 0, 0, mapDBError(err)
	}
	totalMinutes := row.TotalDurationSeconds / 60
	return row.SessionCount, totalMinutes, nil
}
