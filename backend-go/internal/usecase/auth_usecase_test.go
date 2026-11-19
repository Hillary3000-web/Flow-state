package usecase

import (
	"context"
	"testing"
	"time"

	"github.com/flowstate/backend/internal/domain"
	"github.com/google/uuid"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/mock"
)

func TestRegister_Success(t *testing.T) {
	mockRepo := new(MockUserRepository)
	jwtMgr := NewJWTManager("test-secret-key-123456789012345678", 15*time.Minute, 7*24*time.Hour)
	usecase := NewAuthUsecase(mockRepo, jwtMgr)
	ctx := context.Background()

	mockRepo.On("Create", ctx, mock.MatchedBy(func(u *domain.User) bool {
		return u.Email == "test@example.com" && u.Username == "testuser"
	})).Run(func(args mock.Arguments) {
		u := args.Get(1).(*domain.User)
		u.ID = uuid.New()
	}).Return(nil)

	res, err := usecase.Register(ctx, RegisterInput{
		Email:    "test@example.com",
		Username: "testuser",
		Password: "SecurePassword123!",
		FullName: "Test User",
	})

	assert.NoError(t, err)
	assert.NotNil(t, res)
	assert.Equal(t, "test@example.com", res.User.Email)
	assert.Equal(t, "testuser", res.User.Username)
	assert.NotEmpty(t, res.Tokens.AccessToken)
	assert.NotEmpty(t, res.Tokens.RefreshToken)
	mockRepo.AssertExpectations(t)
}

func TestRegister_UserAlreadyExists(t *testing.T) {
	mockRepo := new(MockUserRepository)
	jwtMgr := NewJWTManager("test-secret-key-123456789012345678", 15*time.Minute, 7*24*time.Hour)
	usecase := NewAuthUsecase(mockRepo, jwtMgr)
	ctx := context.Background()

	mockRepo.On("Create", ctx, mock.Anything).Return(domain.ErrConflict)

	res, err := usecase.Register(ctx, RegisterInput{
		Email:    "duplicate@example.com",
		Username: "duplicate",
		Password: "Password123!",
	})

	assert.ErrorIs(t, err, domain.ErrUserAlreadyExists)
	assert.Nil(t, res)
	mockRepo.AssertExpectations(t)
}

func TestRegister_InvalidInput(t *testing.T) {
	mockRepo := new(MockUserRepository)
	jwtMgr := NewJWTManager("test-secret-key-123456789012345678", 15*time.Minute, 7*24*time.Hour)
	usecase := NewAuthUsecase(mockRepo, jwtMgr)
	ctx := context.Background()

	res, err := usecase.Register(ctx, RegisterInput{
		Email:    "",
		Username: "test",
		Password: "Password123!",
	})

	assert.ErrorIs(t, err, domain.ErrInvalidInput)
	assert.Nil(t, res)
}

func TestLogin_Success(t *testing.T) {
	mockRepo := new(MockUserRepository)
	jwtMgr := NewJWTManager("test-secret-key-123456789012345678", 15*time.Minute, 7*24*time.Hour)
	usecase := NewAuthUsecase(mockRepo, jwtMgr)
	ctx := context.Background()

	password := "CorrectPassword123!"
	hash, _ := HashPassword(password)
	user := &domain.User{
		ID:           uuid.New(),
		Email:        "user@example.com",
		Username:     "validuser",
		PasswordHash: hash,
	}

	mockRepo.On("GetByEmail", ctx, "user@example.com").Return(user, nil)

	res, err := usecase.Login(ctx, LoginInput{
		Email:    "user@example.com",
		Password: password,
	})

	assert.NoError(t, err)
	assert.NotNil(t, res)
	assert.Equal(t, user.ID, res.User.ID)
	assert.NotEmpty(t, res.Tokens.AccessToken)
	assert.NotEmpty(t, res.Tokens.RefreshToken)
	mockRepo.AssertExpectations(t)
}

func TestLogin_UserNotFound(t *testing.T) {
	mockRepo := new(MockUserRepository)
	jwtMgr := NewJWTManager("test-secret-key-123456789012345678", 15*time.Minute, 7*24*time.Hour)
	usecase := NewAuthUsecase(mockRepo, jwtMgr)
	ctx := context.Background()

	mockRepo.On("GetByEmail", ctx, "unknown@example.com").Return(nil, domain.ErrNotFound)

	res, err := usecase.Login(ctx, LoginInput{
		Email:    "unknown@example.com",
		Password: "Password123!",
	})

	assert.ErrorIs(t, err, domain.ErrInvalidCredentials)
	assert.Nil(t, res)
	mockRepo.AssertExpectations(t)
}

func TestLogin_InvalidPassword(t *testing.T) {
	mockRepo := new(MockUserRepository)
	jwtMgr := NewJWTManager("test-secret-key-123456789012345678", 15*time.Minute, 7*24*time.Hour)
	usecase := NewAuthUsecase(mockRepo, jwtMgr)
	ctx := context.Background()

	hash, _ := HashPassword("CorrectPassword")
	user := &domain.User{
		ID:           uuid.New(),
		Email:        "user@example.com",
		PasswordHash: hash,
	}

	mockRepo.On("GetByEmail", ctx, "user@example.com").Return(user, nil)

	res, err := usecase.Login(ctx, LoginInput{
		Email:    "user@example.com",
		Password: "WrongPassword",
	})

	assert.ErrorIs(t, err, domain.ErrInvalidCredentials)
	assert.Nil(t, res)
	mockRepo.AssertExpectations(t)
}

func TestGetMe_Success(t *testing.T) {
	mockRepo := new(MockUserRepository)
	jwtMgr := NewJWTManager("test-secret-key-123456789012345678", 15*time.Minute, 7*24*time.Hour)
	usecase := NewAuthUsecase(mockRepo, jwtMgr)
	ctx := context.Background()

	userID := uuid.New()
	user := &domain.User{
		ID:       userID,
		Email:    "me@example.com",
		Username: "meuser",
	}

	mockRepo.On("GetByID", ctx, userID).Return(user, nil)

	res, err := usecase.GetMe(ctx, userID)

	assert.NoError(t, err)
	assert.Equal(t, userID, res.ID)
	mockRepo.AssertExpectations(t)
}

func TestGetMe_NotFound(t *testing.T) {
	mockRepo := new(MockUserRepository)
	jwtMgr := NewJWTManager("test-secret-key-123456789012345678", 15*time.Minute, 7*24*time.Hour)
	usecase := NewAuthUsecase(mockRepo, jwtMgr)
	ctx := context.Background()

	userID := uuid.New()
	mockRepo.On("GetByID", ctx, userID).Return(nil, domain.ErrNotFound)

	res, err := usecase.GetMe(ctx, userID)

	assert.ErrorIs(t, err, domain.ErrUserNotFound)
	assert.Nil(t, res)
	mockRepo.AssertExpectations(t)
}

func TestChangePassword_Success(t *testing.T) {
	mockRepo := new(MockUserRepository)
	jwtMgr := NewJWTManager("test-secret-key-123456789012345678", 15*time.Minute, 7*24*time.Hour)
	usecase := NewAuthUsecase(mockRepo, jwtMgr)
	ctx := context.Background()

	userID := uuid.New()
	oldPass := "OldSecret123"
	hash, _ := HashPassword(oldPass)
	user := &domain.User{
		ID:           userID,
		PasswordHash: hash,
	}

	mockRepo.On("GetByID", ctx, userID).Return(user, nil)
	mockRepo.On("UpdatePassword", ctx, userID, mock.AnythingOfType("string")).Return(nil)

	err := usecase.ChangePassword(ctx, userID, oldPass, "NewSecret456")

	assert.NoError(t, err)
	mockRepo.AssertExpectations(t)
}

func TestChangePassword_InvalidOldPassword(t *testing.T) {
	mockRepo := new(MockUserRepository)
	jwtMgr := NewJWTManager("test-secret-key-123456789012345678", 15*time.Minute, 7*24*time.Hour)
	usecase := NewAuthUsecase(mockRepo, jwtMgr)
	ctx := context.Background()

	userID := uuid.New()
	hash, _ := HashPassword("OldSecret123")
	user := &domain.User{
		ID:           userID,
		PasswordHash: hash,
	}

	mockRepo.On("GetByID", ctx, userID).Return(user, nil)

	err := usecase.ChangePassword(ctx, userID, "WrongOldSecret", "NewSecret456")

	assert.ErrorIs(t, err, domain.ErrInvalidPassword)
	mockRepo.AssertExpectations(t)
}
