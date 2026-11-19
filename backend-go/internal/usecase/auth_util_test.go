package usecase

import (
	"testing"
	"time"

	"github.com/flowstate/backend/internal/domain"
	"github.com/google/uuid"
)

func TestPasswordHashing(t *testing.T) {
	password := "SecretPassword123!"
	hash, err := HashPassword(password)
	if err != nil {
		t.Fatalf("failed to hash password: %v", err)
	}

	if err := CheckPassword(password, hash); err != nil {
		t.Fatalf("expected password to match hash: %v", err)
	}

	if err := CheckPassword("WrongPassword", hash); err == nil {
		t.Fatalf("expected password verification to fail for wrong password")
	}
}

func TestJWTManager(t *testing.T) {
	mgr := NewJWTManager("super-secret-key-1234567890123456", 15*time.Minute, 7*24*time.Hour)
	user := &domain.User{
		ID:       uuid.New(),
		Email:    "test@example.com",
		Username: "testuser",
	}

	tokens, err := mgr.GenerateTokenPair(user)
	if err != nil {
		t.Fatalf("failed to generate token pair: %v", err)
	}
	if tokens.AccessToken == "" || tokens.RefreshToken == "" {
		t.Fatalf("expected tokens to be non-empty")
	}

	claims, err := mgr.ValidateToken(tokens.AccessToken)
	if err != nil {
		t.Fatalf("failed to validate access token: %v", err)
	}
	if claims.UserID != user.ID || claims.Email != user.Email {
		t.Errorf("claim mismatch: got user %v, expected %v", claims.UserID, user.ID)
	}

	// Test invalid token
	_, err = mgr.ValidateToken("invalid.token.string")
	if err == nil {
		t.Fatalf("expected error for invalid token string")
	}
}
