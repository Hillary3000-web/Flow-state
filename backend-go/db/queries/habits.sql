-- name: GetHabitStreakByDate :one
SELECT * FROM habit_streaks
WHERE user_id = $1 AND task_id = $2 AND streak_date = $3;

-- name: UpsertHabitStreak :one
INSERT INTO habit_streaks (
    user_id,
    task_id,
    streak_date,
    current_streak,
    longest_streak,
    completed_today
) VALUES (
    $1, $2, $3, $4, $5, $6
)
ON CONFLICT (user_id, task_id, streak_date)
DO UPDATE SET
    current_streak = EXCLUDED.current_streak,
    longest_streak = EXCLUDED.longest_streak,
    completed_today = EXCLUDED.completed_today,
    updated_at = CURRENT_TIMESTAMP
RETURNING *;

-- name: ListHabitStreaksByTask :many
SELECT * FROM habit_streaks
WHERE user_id = $1 AND task_id = $2
ORDER BY streak_date DESC
LIMIT $3;

-- name: ListHabitStreaksInRange :many
SELECT * FROM habit_streaks
WHERE user_id = $1
  AND streak_date >= $2 AND streak_date <= $3
ORDER BY streak_date DESC;

-- name: GetLatestHabitStreak :one
SELECT * FROM habit_streaks
WHERE user_id = $1 AND task_id = $2
ORDER BY streak_date DESC
LIMIT 1;

-- name: CreateDailyCheckin :one
INSERT INTO daily_checkins (
    user_id,
    checkin_date,
    energy_level,
    reflection,
    tasks_planned,
    tasks_completed
) VALUES (
    $1, $2, $3, $4, $5, $6
)
ON CONFLICT (user_id, checkin_date)
DO UPDATE SET
    energy_level = EXCLUDED.energy_level,
    reflection = EXCLUDED.reflection,
    tasks_planned = EXCLUDED.tasks_planned,
    tasks_completed = EXCLUDED.tasks_completed,
    updated_at = CURRENT_TIMESTAMP
RETURNING *;

-- name: GetDailyCheckinByDate :one
SELECT * FROM daily_checkins
WHERE user_id = $1 AND checkin_date = $2;

-- name: ListDailyCheckins :many
SELECT * FROM daily_checkins
WHERE user_id = $1
ORDER BY checkin_date DESC
LIMIT $2;
