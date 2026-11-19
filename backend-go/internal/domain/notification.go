package domain

import (
	"context"
	"encoding/json"
	"time"

	"github.com/google/uuid"
)

// NotificationType categories.
type NotificationType string

const (
	NotificationTypeReminder NotificationType = "reminder"
	NotificationTypeOverdue  NotificationType = "overdue"
	NotificationTypeStreak   NotificationType = "streak"
	NotificationTypeSystem   NotificationType = "system"
)

// Notification represents an in-app alert or notification.
type Notification struct {
	ID        uuid.UUID        `json:"id"`
	UserID    uuid.UUID        `json:"user_id"`
	Type      NotificationType `json:"type"`
	Title     string           `json:"title"`
	Message   string           `json:"message"`
	IsRead    bool             `json:"is_read"`
	Metadata  json.RawMessage  `json:"metadata"`
	CreatedAt time.Time        `json:"created_at"`
	UpdatedAt time.Time        `json:"updated_at"`
}

// NotificationRepository defines persistence contracts for Notifications.
type NotificationRepository interface {
	Create(ctx context.Context, notification *Notification) error
	ListByUserID(ctx context.Context, userID uuid.UUID, unreadOnly bool, limit int) ([]*Notification, error)
	MarkAsRead(ctx context.Context, id uuid.UUID, userID uuid.UUID) error
	MarkAllAsRead(ctx context.Context, userID uuid.UUID) error
	Delete(ctx context.Context, id uuid.UUID, userID uuid.UUID) error
}
