-- name: CreateNotification :one
INSERT INTO notifications (
    user_id,
    type,
    title,
    message,
    metadata
) VALUES (
    $1, $2, $3, $4, $5
) RETURNING *;

-- name: ListNotificationsByUserID :many
SELECT * FROM notifications
WHERE user_id = sqlc.arg('user_id')
  AND (sqlc.narg('unread_only')::boolean IS NULL OR (sqlc.narg('unread_only') = TRUE AND is_read = FALSE))
ORDER BY created_at DESC
LIMIT sqlc.arg('limit_count');

-- name: MarkNotificationAsRead :one
UPDATE notifications
SET
    is_read = TRUE,
    updated_at = CURRENT_TIMESTAMP
WHERE id = $1 AND user_id = $2
RETURNING *;

-- name: MarkAllNotificationsAsRead :exec
UPDATE notifications
SET
    is_read = TRUE,
    updated_at = CURRENT_TIMESTAMP
WHERE user_id = $1 AND is_read = FALSE;

-- name: DeleteNotification :exec
DELETE FROM notifications
WHERE id = $1 AND user_id = $2;
