-- name: CreateSubtask :one
INSERT INTO subtasks (
    task_id,
    title,
    is_completed,
    sort_order
) VALUES (
    $1, $2, $3, $4
) RETURNING *;

-- name: GetSubtaskByID :one
SELECT * FROM subtasks
WHERE id = $1;

-- name: ListSubtasksByTaskID :many
SELECT * FROM subtasks
WHERE task_id = $1
ORDER BY sort_order ASC, created_at ASC;

-- name: UpdateSubtask :one
UPDATE subtasks
SET
    title = COALESCE(sqlc.narg('title'), title),
    is_completed = COALESCE(sqlc.narg('is_completed'), is_completed),
    sort_order = COALESCE(sqlc.narg('sort_order'), sort_order),
    updated_at = CURRENT_TIMESTAMP
WHERE id = sqlc.arg('id')
RETURNING *;

-- name: ToggleSubtaskComplete :one
UPDATE subtasks
SET
    is_completed = NOT is_completed,
    updated_at = CURRENT_TIMESTAMP
WHERE id = $1
RETURNING *;

-- name: DeleteSubtask :exec
DELETE FROM subtasks
WHERE id = $1;

-- name: CountSubtasksByTaskID :one
SELECT COUNT(*) FROM subtasks
WHERE task_id = $1;

-- name: CountCompletedSubtasksByTaskID :one
SELECT COUNT(*) FROM subtasks
WHERE task_id = $1 AND is_completed = TRUE;
