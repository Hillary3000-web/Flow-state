-- name: CreateFocusSession :one
INSERT INTO focus_sessions (
    user_id,
    task_id,
    started_at,
    session_type,
    target_minutes
) VALUES (
    $1, $2, $3, $4, $5
) RETURNING *;

-- name: GetFocusSessionByID :one
SELECT fs.*, t.title as task_title
FROM focus_sessions fs
LEFT JOIN tasks t ON fs.task_id = t.id
WHERE fs.id = $1 AND fs.user_id = $2;

-- name: EndFocusSession :one
UPDATE focus_sessions
SET
    ended_at = $3,
    duration_seconds = $4,
    distraction_log = $5,
    is_completed = $6,
    updated_at = CURRENT_TIMESTAMP
WHERE id = $1 AND user_id = $2
RETURNING *;

-- name: ListFocusSessionsByUserID :many
SELECT fs.*, t.title as task_title
FROM focus_sessions fs
LEFT JOIN tasks t ON fs.task_id = t.id
WHERE fs.user_id = $1
ORDER BY fs.started_at DESC
LIMIT $2;

-- name: GetCompletedFocusSessionDates :many
SELECT DISTINCT DATE(started_at) as session_date
FROM focus_sessions
WHERE user_id = $1 AND is_completed = TRUE
ORDER BY session_date DESC;

-- name: GetFocusStatsSince :one
SELECT
    COUNT(*) as session_count,
    COALESCE(SUM(duration_seconds), 0)::bigint as total_duration_seconds
FROM focus_sessions
WHERE user_id = $1
  AND is_completed = TRUE
  AND started_at >= $2;
