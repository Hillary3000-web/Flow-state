package repository

import (
	"context"

	"github.com/flowstate/backend/internal/domain"
	"github.com/flowstate/backend/internal/repository/db"
	"github.com/google/uuid"
)

type userRepository struct {
	q *db.Queries
}

// NewUserRepository creates an instance of UserRepository backed by SQLC.
func NewUserRepository(q *db.Queries) domain.UserRepository {
	return &userRepository{q: q}
}

func (r *userRepository) Create(ctx context.Context, u *domain.User) error {
	pref := []byte(u.Preferences)
	if len(pref) == 0 {
		pref = []byte("{}")
	}
	theme := string(u.Theme)
	if theme == "" {
		theme = "dark"
	}
	tz := u.Timezone
	if tz == "" {
		tz = "UTC"
	}

	created, err := r.q.CreateUser(ctx, db.CreateUserParams{
		Email:        u.Email,
		Username:     u.Username,
		PasswordHash: u.PasswordHash,
		FullName:     u.FullName,
		Timezone:     tz,
		Theme:        theme,
		Preferences:  pref,
	})
	if err != nil {
		return mapDBError(err)
	}

	*u = *mapDBUserToDomain(&created)
	return nil
}

func (r *userRepository) GetByID(ctx context.Context, id uuid.UUID) (*domain.User, error) {
	u, err := r.q.GetUserByID(ctx, id)
	if err != nil {
		return nil, mapDBError(err)
	}
	return mapDBUserToDomain(&u), nil
}

func (r *userRepository) GetByEmail(ctx context.Context, email string) (*domain.User, error) {
	u, err := r.q.GetUserByEmail(ctx, email)
	if err != nil {
		return nil, mapDBError(err)
	}
	return mapDBUserToDomain(&u), nil
}

func (r *userRepository) GetByUsername(ctx context.Context, username string) (*domain.User, error) {
	u, err := r.q.GetUserByUsername(ctx, username)
	if err != nil {
		return nil, mapDBError(err)
	}
	return mapDBUserToDomain(&u), nil
}

func (r *userRepository) UpdateProfile(ctx context.Context, u *domain.User) error {
	var fullName *string
	if u.FullName != "" {
		fullName = &u.FullName
	}
	var timezone *string
	if u.Timezone != "" {
		timezone = &u.Timezone
	}
	var theme *string
	if u.Theme != "" {
		t := string(u.Theme)
		theme = &t
	}
	var pref []byte
	if len(u.Preferences) > 0 {
		pref = []byte(u.Preferences)
	}

	updated, err := r.q.UpdateUserProfile(ctx, db.UpdateUserProfileParams{
		FullName:    fullName,
		Timezone:    timezone,
		Theme:       theme,
		Preferences: pref,
		ID:          u.ID,
	})
	if err != nil {
		return mapDBError(err)
	}

	*u = *mapDBUserToDomain(&updated)
	return nil
}

func (r *userRepository) UpdatePassword(ctx context.Context, id uuid.UUID, passwordHash string) error {
	err := r.q.UpdateUserPassword(ctx, db.UpdateUserPasswordParams{
		ID:           id,
		PasswordHash: passwordHash,
	})
	return mapDBError(err)
}

func (r *userRepository) UpdateAvatar(ctx context.Context, id uuid.UUID, avatarURL *string) error {
	_, err := r.q.UpdateUserAvatar(ctx, db.UpdateUserAvatarParams{
		ID:     id,
		Avatar: avatarURL,
	})
	return mapDBError(err)
}
