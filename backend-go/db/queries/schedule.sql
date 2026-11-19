-- name: CreateTimeBlock :one
INSERT INTO time_blocks (
    user_id,
    task_id,
    title,
    block_date,
    start_time,
    end_time,
    block_type,
    is_completed,
    sort_order
) VALUES (
    $1, $2, $3, $4, $5, $6, $7, $8, $9
) RETURNING *;

-- name: GetTimeBlockByID :one
SELECT tb.*, t.title as task_title
FROM time_blocks tb
LEFT JOIN tasks t ON tb.task_id = t.id
WHERE tb.id = $1 AND tb.user_id = $2;

-- name: ListTimeBlocksByDateRange :many
SELECT tb.*, t.title as task_title
FROM time_blocks tb
LEFT JOIN tasks t ON tb.task_id = t.id
WHERE tb.user_id = $1
  AND tb.block_date >= $2 AND tb.block_date <= $3
ORDER BY tb.block_date ASC, tb.start_time ASC, tb.sort_order ASC;

-- name: UpdateTimeBlock :one
UPDATE time_blocks
SET
    task_id = COALESCE(sqlc.narg('task_id'), task_id),
    title = COALESCE(sqlc.narg('title'), title),
    block_date = COALESCE(sqlc.narg('block_date'), block_date),
    start_time = COALESCE(sqlc.narg('start_time'), start_time),
    end_time = COALESCE(sqlc.narg('end_time'), end_time),
    block_type = COALESCE(sqlc.narg('block_type'), block_type),
    is_completed = COALESCE(sqlc.narg('is_completed'), is_completed),
    sort_order = COALESCE(sqlc.narg('sort_order'), sort_order),
    updated_at = CURRENT_TIMESTAMP
WHERE id = sqlc.arg('id') AND user_id = sqlc.arg('user_id')
RETURNING *;

-- name: UpdateTimeBlockOrderAndTime :exec
UPDATE time_blocks
SET
    sort_order = sqlc.arg('sort_order'),
    start_time = COALESCE(sqlc.narg('start_time'), start_time),
    end_time = COALESCE(sqlc.narg('end_time'), end_time),
    updated_at = CURRENT_TIMESTAMP
WHERE id = sqlc.arg('id') AND user_id = sqlc.arg('user_id');

-- name: DeleteTimeBlock :exec
DELETE FROM time_blocks
WHERE id = $1 AND user_id = $2;
