package repository

import (
	"context"

	"github.com/flowstate/backend/internal/domain"
	"github.com/flowstate/backend/internal/repository/db"
	"github.com/google/uuid"
)

type notificationRepository struct {
	q *db.Queries
}

// NewNotificationRepository creates a NotificationRepository backed by SQLC.
func NewNotificationRepository(q *db.Queries) domain.NotificationRepository {
	return &notificationRepository{q: q}
}

func (r *notificationRepository) Create(ctx context.Context, n *domain.Notification) error {
	meta := []byte(n.Metadata)
	if len(meta) == 0 {
		meta = []byte("{}")
	}
	t := string(n.Type)
	if t == "" {
		t = "system"
	}

	created, err := r.q.CreateNotification(ctx, db.CreateNotificationParams{
		UserID:   n.UserID,
		Type:     t,
		Title:    n.Title,
		Message:  n.Message,
		Metadata: meta,
	})
	if err != nil {
		return mapDBError(err)
	}
	*n = *mapDBNotificationToDomain(&created)
	return nil
}

func (r *notificationRepository) ListByUserID(ctx context.Context, userID uuid.UUID, unreadOnly bool, limit int) ([]*domain.Notification, error) {
	var unread *bool
	if unreadOnly {
		t := true
		unread = &t
	}
	lim := int32(limit)
	if lim <= 0 {
		lim = 50
	}

	items, err := r.q.ListNotificationsByUserID(ctx, db.ListNotificationsByUserIDParams{
		UserID:     userID,
		UnreadOnly: unread,
		LimitCount: lim,
	})
	if err != nil {
		return nil, mapDBError(err)
	}

	result := make([]*domain.Notification, len(items))
	for i := range items {
		result[i] = mapDBNotificationToDomain(&items[i])
	}
	return result, nil
}

func (r *notificationRepository) MarkAsRead(ctx context.Context, id uuid.UUID, userID uuid.UUID) error {
	_, err := r.q.MarkNotificationAsRead(ctx, id, userID)
	return mapDBError(err)
}

func (r *notificationRepository) MarkAllAsRead(ctx context.Context, userID uuid.UUID) error {
	return mapDBError(r.q.MarkAllNotificationsAsRead(ctx, userID))
}

func (r *notificationRepository) Delete(ctx context.Context, id uuid.UUID, userID uuid.UUID) error {
	return mapDBError(r.q.DeleteNotification(ctx, id, userID))
}
