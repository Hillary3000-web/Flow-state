-- name: CreateTask :one
INSERT INTO tasks (
    user_id,
    project_id,
    title,
    description,
    priority,
    energy_level,
    status,
    due_date,
    estimated_minutes,
    actual_minutes,
    is_recurring,
    recurrence_rule,
    sort_order
) VALUES (
    $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13
) RETURNING *;

-- name: GetTaskByID :one
SELECT * FROM tasks
WHERE id = $1 AND user_id = $2;

-- name: ListTasks :many
SELECT * FROM tasks
WHERE user_id = sqlc.arg('user_id')
  AND (sqlc.narg('project_id')::uuid IS NULL OR project_id = sqlc.narg('project_id'))
  AND (sqlc.narg('status')::varchar IS NULL OR status = sqlc.narg('status'))
  AND (sqlc.narg('priority')::varchar IS NULL OR priority = sqlc.narg('priority'))
  AND (sqlc.narg('energy_level')::varchar IS NULL OR energy_level = sqlc.narg('energy_level'))
  AND (sqlc.narg('is_recurring')::boolean IS NULL OR is_recurring = sqlc.narg('is_recurring'))
  AND (sqlc.narg('search')::text IS NULL OR title ILIKE '%' || sqlc.narg('search') || '%' OR description ILIKE '%' || sqlc.narg('search') || '%')
ORDER BY sort_order ASC, created_at DESC
LIMIT sqlc.arg('limit_count') OFFSET sqlc.arg('offset_count');

-- name: ListRecurringTasksByUserID :many
SELECT * FROM tasks
WHERE user_id = $1 AND is_recurring = TRUE
ORDER BY sort_order ASC, created_at DESC;

-- name: ListOverdueTasks :many
SELECT * FROM tasks
WHERE user_id = $1
  AND status IN ('todo', 'in_progress')
  AND due_date IS NOT NULL
  AND due_date < $2
ORDER BY due_date ASC;

-- name: ListAtRiskTasks :many
SELECT * FROM tasks
WHERE user_id = $1
  AND status IN ('todo', 'in_progress')
  AND due_date IS NOT NULL
  AND due_date >= $2 AND due_date <= $3
ORDER BY due_date ASC;

-- name: UpdateTask :one
UPDATE tasks
SET
    project_id = COALESCE(sqlc.narg('project_id'), project_id),
    title = COALESCE(sqlc.narg('title'), title),
    description = COALESCE(sqlc.narg('description'), description),
    priority = COALESCE(sqlc.narg('priority'), priority),
    energy_level = COALESCE(sqlc.narg('energy_level'), energy_level),
    status = COALESCE(sqlc.narg('status'), status),
    due_date = COALESCE(sqlc.narg('due_date'), due_date),
    estimated_minutes = COALESCE(sqlc.narg('estimated_minutes'), estimated_minutes),
    actual_minutes = COALESCE(sqlc.narg('actual_minutes'), actual_minutes),
    is_recurring = COALESCE(sqlc.narg('is_recurring'), is_recurring),
    recurrence_rule = COALESCE(sqlc.narg('recurrence_rule'), recurrence_rule),
    sort_order = COALESCE(sqlc.narg('sort_order'), sort_order),
    completed_at = COALESCE(sqlc.narg('completed_at'), completed_at),
    updated_at = CURRENT_TIMESTAMP
WHERE id = sqlc.arg('id') AND user_id = sqlc.arg('user_id')
RETURNING *;

-- name: MarkTaskComplete :one
UPDATE tasks
SET
    status = 'done',
    completed_at = $3,
    updated_at = CURRENT_TIMESTAMP
WHERE id = $1 AND user_id = $2
RETURNING *;

-- name: UpdateTaskSortOrder :exec
UPDATE tasks
SET
    sort_order = $3,
    updated_at = CURRENT_TIMESTAMP
WHERE id = $1 AND user_id = $2;

-- name: DeleteTask :exec
DELETE FROM tasks
WHERE id = $1 AND user_id = $2;
