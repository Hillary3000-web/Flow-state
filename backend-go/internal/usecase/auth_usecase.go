package usecase

import (
	"context"
	"errors"
	"strings"

	"github.com/flowstate/backend/internal/domain"
	"github.com/google/uuid"
)

// RegisterInput holds registration payload.
type RegisterInput struct {
	Email    string `json:"email"`
	Username string `json:"username"`
	Password string `json:"password"`
	FullName string `json:"full_name"`
}

// LoginInput holds user authentication payload.
type LoginInput struct {
	Email    string `json:"email"`
	Password string `json:"password"`
}

// AuthResponse returns authenticated user along with JWT tokens.
type AuthResponse struct {
	User   *domain.User `json:"user"`
	Tokens *TokenPair   `json:"tokens"`
}

// AuthUsecase defines authentication and user account usecases.
type AuthUsecase interface {
	Register(ctx context.Context, in RegisterInput) (*AuthResponse, error)
	Login(ctx context.Context, in LoginInput) (*AuthResponse, error)
	RefreshToken(ctx context.Context, refreshToken string) (*TokenPair, error)
	GetMe(ctx context.Context, userID uuid.UUID) (*domain.User, error)
	UpdateProfile(ctx context.Context, userID uuid.UUID, fullName *string, timezone *string, theme *domain.Theme, preferences []byte) (*domain.User, error)
	ChangePassword(ctx context.Context, userID uuid.UUID, oldPassword, newPassword string) error
}

type authUsecase struct {
	userRepo domain.UserRepository
	jwtMgr   *JWTManager
}

// NewAuthUsecase constructs an AuthUsecase instance.
func NewAuthUsecase(userRepo domain.UserRepository, jwtMgr *JWTManager) AuthUsecase {
	return &authUsecase{
		userRepo: userRepo,
		jwtMgr:   jwtMgr,
	}
}

func (u *authUsecase) Register(ctx context.Context, in RegisterInput) (*AuthResponse, error) {
	email := strings.TrimSpace(strings.ToLower(in.Email))
	username := strings.TrimSpace(in.Username)

	if email == "" || username == "" || in.Password == "" {
		return nil, domain.ErrInvalidInput
	}

	// Hash password
	hashedPassword, err := HashPassword(in.Password)
	if err != nil {
		return nil, domain.ErrInternal
	}

	newUser := &domain.User{
		Email:        email,
		Username:     username,
		PasswordHash: hashedPassword,
		FullName:     strings.TrimSpace(in.FullName),
		Timezone:     "UTC",
		Theme:        domain.ThemeDark,
		Preferences:  []byte("{}"),
	}

	if err := u.userRepo.Create(ctx, newUser); err != nil {
		if errors.Is(err, domain.ErrConflict) {
			return nil, domain.ErrUserAlreadyExists
		}
		return nil, err
	}

	tokens, err := u.jwtMgr.GenerateTokenPair(newUser)
	if err != nil {
		return nil, domain.ErrInternal
	}

	return &AuthResponse{
		User:   newUser,
		Tokens: tokens,
	}, nil
}

func (u *authUsecase) Login(ctx context.Context, in LoginInput) (*AuthResponse, error) {
	email := strings.TrimSpace(strings.ToLower(in.Email))
	if email == "" || in.Password == "" {
		return nil, domain.ErrInvalidCredentials
	}

	user, err := u.userRepo.GetByEmail(ctx, email)
	if err != nil {
		if errors.Is(err, domain.ErrNotFound) {
			return nil, domain.ErrInvalidCredentials
		}
		return nil, err
	}

	// Verify password
	if err := CheckPassword(in.Password, user.PasswordHash); err != nil {
		return nil, domain.ErrInvalidCredentials
	}

	tokens, err := u.jwtMgr.GenerateTokenPair(user)
	if err != nil {
		return nil, domain.ErrInternal
	}

	return &AuthResponse{
		User:   user,
		Tokens: tokens,
	}, nil
}

func (u *authUsecase) RefreshToken(ctx context.Context, refreshToken string) (*TokenPair, error) {
	claims, err := u.jwtMgr.ValidateToken(refreshToken)
	if err != nil {
		return nil, domain.ErrUnauthorized
	}

	user, err := u.userRepo.GetByID(ctx, claims.UserID)
	if err != nil {
		return nil, domain.ErrUnauthorized
	}

	return u.jwtMgr.GenerateTokenPair(user)
}

func (u *authUsecase) GetMe(ctx context.Context, userID uuid.UUID) (*domain.User, error) {
	user, err := u.userRepo.GetByID(ctx, userID)
	if err != nil {
		if errors.Is(err, domain.ErrNotFound) {
			return nil, domain.ErrUserNotFound
		}
		return nil, err
	}
	return user, nil
}

func (u *authUsecase) UpdateProfile(ctx context.Context, userID uuid.UUID, fullName *string, timezone *string, theme *domain.Theme, preferences []byte) (*domain.User, error) {
	user, err := u.userRepo.GetByID(ctx, userID)
	if err != nil {
		if errors.Is(err, domain.ErrNotFound) {
			return nil, domain.ErrUserNotFound
		}
		return nil, err
	}

	if fullName != nil {
		user.FullName = strings.TrimSpace(*fullName)
	}
	if timezone != nil {
		user.Timezone = strings.TrimSpace(*timezone)
	}
	if theme != nil {
		user.Theme = *theme
	}
	if len(preferences) > 0 {
		user.Preferences = preferences
	}

	if err := u.userRepo.UpdateProfile(ctx, user); err != nil {
		return nil, err
	}

	return user, nil
}

func (u *authUsecase) ChangePassword(ctx context.Context, userID uuid.UUID, oldPassword, newPassword string) error {
	if newPassword == "" {
		return domain.ErrInvalidInput
	}

	user, err := u.userRepo.GetByID(ctx, userID)
	if err != nil {
		if errors.Is(err, domain.ErrNotFound) {
			return domain.ErrUserNotFound
		}
		return err
	}

	if err := CheckPassword(oldPassword, user.PasswordHash); err != nil {
		return domain.ErrInvalidPassword
	}

	newHash, err := HashPassword(newPassword)
	if err != nil {
		return domain.ErrInternal
	}

	return u.userRepo.UpdatePassword(ctx, userID, newHash)
}
