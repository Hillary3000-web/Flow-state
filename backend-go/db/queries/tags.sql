-- name: CreateTag :one
INSERT INTO tags (
    user_id,
    name,
    color
) VALUES (
    $1, $2, $3
) RETURNING *;

-- name: GetTagByID :one
SELECT * FROM tags
WHERE id = $1 AND user_id = $2;

-- name: ListTagsByUserID :many
SELECT * FROM tags
WHERE user_id = $1
ORDER BY name ASC;

-- name: DeleteTag :exec
DELETE FROM tags
WHERE id = $1 AND user_id = $2;

-- name: AddTagToTask :exec
INSERT INTO task_tags (
    task_id,
    tag_id
) VALUES (
    $1, $2
) ON CONFLICT DO NOTHING;

-- name: RemoveTagFromTask :exec
DELETE FROM task_tags
WHERE task_id = $1 AND tag_id = $2;

-- name: ListTagsByTaskID :many
SELECT t.* FROM tags t
JOIN task_tags tt ON t.id = tt.tag_id
WHERE tt.task_id = $1
ORDER BY t.name ASC;
