-- name: CreateProject :one
INSERT INTO projects (
    goal_id,
    user_id,
    title,
    description,
    status,
    color,
    sort_order
) VALUES (
    $1, $2, $3, $4, $5, $6, $7
) RETURNING *;

-- name: GetProjectByID :one
SELECT * FROM projects
WHERE id = $1 AND user_id = $2;

-- name: ListProjectsByGoalID :many
SELECT * FROM projects
WHERE goal_id = $1 AND user_id = $2
ORDER BY sort_order ASC, created_at DESC;

-- name: ListProjectsByUserID :many
SELECT * FROM projects
WHERE user_id = $1
  AND (sqlc.narg('status')::varchar IS NULL OR status = sqlc.narg('status'))
ORDER BY sort_order ASC, created_at DESC;

-- name: UpdateProject :one
UPDATE projects
SET
    goal_id = COALESCE(sqlc.narg('goal_id'), goal_id),
    title = COALESCE(sqlc.narg('title'), title),
    description = COALESCE(sqlc.narg('description'), description),
    status = COALESCE(sqlc.narg('status'), status),
    color = COALESCE(sqlc.narg('color'), color),
    sort_order = COALESCE(sqlc.narg('sort_order'), sort_order),
    updated_at = CURRENT_TIMESTAMP
WHERE id = sqlc.arg('id') AND user_id = sqlc.arg('user_id')
RETURNING *;

-- name: DeleteProject :exec
DELETE FROM projects
WHERE id = $1 AND user_id = $2;
