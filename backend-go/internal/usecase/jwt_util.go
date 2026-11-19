package usecase

import (
	"errors"
	"time"

	"github.com/flowstate/backend/internal/domain"
	"github.com/golang-jwt/jwt/v5"
	"github.com/google/uuid"
)

var (
	ErrInvalidToken = errors.New("invalid or expired token")
)

// UserClaims defines JWT token payload.
type UserClaims struct {
	UserID   uuid.UUID `json:"user_id"`
	Email    string    `json:"email"`
	Username string    `json:"username"`
	jwt.RegisteredClaims
}

// TokenPair contains generated access and refresh tokens.
// Both snake_case and short-form aliases are emitted for broad client compatibility.
type TokenPair struct {
	AccessToken  string `json:"access_token"`
	RefreshToken string `json:"refresh_token"`
	// Alias fields for frontend compatibility
	Access  string `json:"access"`
	Refresh string `json:"refresh"`
}

// JWTManager manages creation and validation of JSON Web Tokens.
type JWTManager struct {
	secretKey       []byte
	accessDuration  time.Duration
	refreshDuration time.Duration
}

// NewJWTManager creates a new JWTManager.
func NewJWTManager(secretKey string, accessDuration, refreshDuration time.Duration) *JWTManager {
	if accessDuration <= 0 {
		accessDuration = 60 * time.Minute
	}
	if refreshDuration <= 0 {
		refreshDuration = 7 * 24 * time.Hour
	}
	return &JWTManager{
		secretKey:       []byte(secretKey),
		accessDuration:  accessDuration,
		refreshDuration: refreshDuration,
	}
}

// GenerateTokenPair generates both an access token and a refresh token for a user.
func (m *JWTManager) GenerateTokenPair(user *domain.User) (*TokenPair, error) {
	now := time.Now()

	// Access Token
	accessClaims := &UserClaims{
		UserID:   user.ID,
		Email:    user.Email,
		Username: user.Username,
		RegisteredClaims: jwt.RegisteredClaims{
			Subject:   user.ID.String(),
			IssuedAt:  jwt.NewNumericDate(now),
			ExpiresAt: jwt.NewNumericDate(now.Add(m.accessDuration)),
		},
	}
	accessToken := jwt.NewWithClaims(jwt.SigningMethodHS256, accessClaims)
	accessStr, err := accessToken.SignedString(m.secretKey)
	if err != nil {
		return nil, err
	}

	// Refresh Token
	refreshClaims := &UserClaims{
		UserID:   user.ID,
		Email:    user.Email,
		Username: user.Username,
		RegisteredClaims: jwt.RegisteredClaims{
			Subject:   user.ID.String(),
			IssuedAt:  jwt.NewNumericDate(now),
			ExpiresAt: jwt.NewNumericDate(now.Add(m.refreshDuration)),
		},
	}
	refreshToken := jwt.NewWithClaims(jwt.SigningMethodHS256, refreshClaims)
	refreshStr, err := refreshToken.SignedString(m.secretKey)
	if err != nil {
		return nil, err
	}

	return &TokenPair{
		AccessToken:  accessStr,
		RefreshToken: refreshStr,
		Access:       accessStr,
		Refresh:      refreshStr,
	}, nil
}

// ValidateToken validates a token string and extracts its claims.
func (m *JWTManager) ValidateToken(tokenStr string) (*UserClaims, error) {
	token, err := jwt.ParseWithClaims(tokenStr, &UserClaims{}, func(token *jwt.Token) (interface{}, error) {
		if _, ok := token.Method.(*jwt.SigningMethodHMAC); !ok {
			return nil, ErrInvalidToken
		}
		return m.secretKey, nil
	})
	if err != nil {
		return nil, ErrInvalidToken
	}

	claims, ok := token.Claims.(*UserClaims)
	if !ok || !token.Valid {
		return nil, ErrInvalidToken
	}

	return claims, nil
}
