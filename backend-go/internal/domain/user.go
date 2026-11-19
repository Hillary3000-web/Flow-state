package domain

import (
	"context"
	"encoding/json"
	"time"

	"github.com/google/uuid"
)

// Theme represents user UI theme preference.
type Theme string

const (
	ThemeLight Theme = "light"
	ThemeDark  Theme = "dark"
)

// User represents the core account entity.
type User struct {
	ID           uuid.UUID       `json:"id"`
	Email        string          `json:"email"`
	Username     string          `json:"username"`
	PasswordHash string          `json:"-"`
	FullName     string          `json:"full_name"`
	Avatar       *string         `json:"avatar"`
	Timezone     string          `json:"timezone"`
	Theme        Theme           `json:"theme"`
	Preferences  json.RawMessage `json:"preferences"`
	CreatedAt    time.Time       `json:"created_at"`
	UpdatedAt    time.Time       `json:"updated_at"`
}

// UserRepository defines persistence contracts for User entities.
type UserRepository interface {
	Create(ctx context.Context, user *User) error
	GetByID(ctx context.Context, id uuid.UUID) (*User, error)
	GetByEmail(ctx context.Context, email string) (*User, error)
	GetByUsername(ctx context.Context, username string) (*User, error)
	UpdateProfile(ctx context.Context, user *User) error
	UpdatePassword(ctx context.Context, id uuid.UUID, passwordHash string) error
	UpdateAvatar(ctx context.Context, id uuid.UUID, avatarURL *string) error
}
