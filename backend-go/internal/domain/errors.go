package domain

import "errors"

// Standard domain errors returned across layers.
var (
	ErrNotFound            = errors.New("resource not found")
	ErrConflict            = errors.New("resource already exists")
	ErrUnauthorized        = errors.New("unauthorized")
	ErrForbidden           = errors.New("forbidden")
	ErrInvalidInput        = errors.New("invalid input data")
	ErrInternal            = errors.New("internal server error")
	ErrInvalidPassword     = errors.New("invalid password")
	ErrUserNotFound        = errors.New("user not found")
	ErrInvalidCredentials  = errors.New("invalid email or password")
	ErrUserAlreadyExists   = errors.New("user with this email or username already exists")
	ErrHabitNotFound       = errors.New("habit not found")
	ErrCheckinAlreadyExists = errors.New("checkin already completed for today")
)
