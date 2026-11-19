-- name: CreateGoal :one
INSERT INTO goals (
    user_id,
    title,
    description,
    status,
    target_date,
    progress_pct
) VALUES (
    $1, $2, $3, $4, $5, $6
) RETURNING *;

-- name: GetGoalByID :one
SELECT * FROM goals
WHERE id = $1 AND user_id = $2;

-- name: ListGoalsByUserID :many
SELECT * FROM goals
WHERE user_id = $1
  AND (sqlc.narg('status')::varchar IS NULL OR status = sqlc.narg('status'))
ORDER BY created_at DESC;

-- name: UpdateGoal :one
UPDATE goals
SET
    title = COALESCE(sqlc.narg('title'), title),
    description = COALESCE(sqlc.narg('description'), description),
    status = COALESCE(sqlc.narg('status'), status),
    target_date = COALESCE(sqlc.narg('target_date'), target_date),
    progress_pct = COALESCE(sqlc.narg('progress_pct'), progress_pct),
    updated_at = CURRENT_TIMESTAMP
WHERE id = sqlc.arg('id') AND user_id = sqlc.arg('user_id')
RETURNING *;

-- name: UpdateGoalProgress :one
UPDATE goals
SET
    progress_pct = $3,
    updated_at = CURRENT_TIMESTAMP
WHERE id = $1 AND user_id = $2
RETURNING *;

-- name: DeleteGoal :exec
DELETE FROM goals
WHERE id = $1 AND user_id = $2;
