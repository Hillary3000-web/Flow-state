-- name: CreateUser :one
INSERT INTO users (
    email,
    username,
    password_hash,
    full_name,
    timezone,
    theme,
    preferences
) VALUES (
    $1, $2, $3, $4, $5, $6, $7
) RETURNING *;

-- name: GetUserByID :one
SELECT * FROM users
WHERE id = $1;

-- name: GetUserByEmail :one
SELECT * FROM users
WHERE email = $1;

-- name: GetUserByUsername :one
SELECT * FROM users
WHERE username = $1;

-- name: UpdateUserProfile :one
UPDATE users
SET
    full_name = COALESCE(sqlc.narg('full_name'), full_name),
    timezone = COALESCE(sqlc.narg('timezone'), timezone),
    theme = COALESCE(sqlc.narg('theme'), theme),
    preferences = COALESCE(sqlc.narg('preferences'), preferences),
    updated_at = CURRENT_TIMESTAMP
WHERE id = sqlc.arg('id')
RETURNING *;

-- name: UpdateUserPassword :exec
UPDATE users
SET
    password_hash = $2,
    updated_at = CURRENT_TIMESTAMP
WHERE id = $1;

-- name: UpdateUserAvatar :one
UPDATE users
SET
    avatar = $2,
    updated_at = CURRENT_TIMESTAMP
WHERE id = $1
RETURNING *;
