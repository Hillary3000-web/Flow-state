package usecase

import (
	"context"

	"github.com/flowstate/backend/internal/domain"
	"github.com/google/uuid"
)

// NotificationUsecase defines business logic for notifications.
type NotificationUsecase interface {
	ListNotifications(ctx context.Context, userID uuid.UUID, unreadOnly bool, limit int) ([]*domain.Notification, error)
	MarkAsRead(ctx context.Context, id, userID uuid.UUID) error
	MarkAllAsRead(ctx context.Context, userID uuid.UUID) error
	DeleteNotification(ctx context.Context, id, userID uuid.UUID) error
}

type notificationUsecase struct {
	notifRepo domain.NotificationRepository
}

// NewNotificationUsecase constructs a NotificationUsecase instance.
func NewNotificationUsecase(notifRepo domain.NotificationRepository) NotificationUsecase {
	return &notificationUsecase{notifRepo: notifRepo}
}

func (u *notificationUsecase) ListNotifications(ctx context.Context, userID uuid.UUID, unreadOnly bool, limit int) ([]*domain.Notification, error) {
	if limit <= 0 {
		limit = 50
	}
	return u.notifRepo.ListByUserID(ctx, userID, unreadOnly, limit)
}

func (u *notificationUsecase) MarkAsRead(ctx context.Context, id, userID uuid.UUID) error {
	return u.notifRepo.MarkAsRead(ctx, id, userID)
}

func (u *notificationUsecase) MarkAllAsRead(ctx context.Context, userID uuid.UUID) error {
	return u.notifRepo.MarkAllAsRead(ctx, userID)
}

func (u *notificationUsecase) DeleteNotification(ctx context.Context, id, userID uuid.UUID) error {
	return u.notifRepo.Delete(ctx, id, userID)
}

