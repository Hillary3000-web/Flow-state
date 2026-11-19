import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import client from './client';

// Initial fallback dataset adhering strictly to Go domain.Task & HabitStreak models
const DEFAULT_HABITS = [
    {
        id: 'hab-01',
        title: 'Morning Sunlight & Circadian Reset',
        description: 'Direct outdoor light exposure within 30 minutes of waking.',
        category: 'morning',
        priority: 'high',
        energy_level: 'low',
        recurrence_rule: 'DAILY',
        is_recurring: true,
        checked_today: false,
        current_streak: 19,
        longest_streak: 34,
        completed_days_7d: [true, true, true, true, false, true, false],
        scheduled_time: '07:30',
        created_at: new Date(Date.now() - 30 * 86400000).toISOString(),
    },
    {
        id: 'hab-02',
        title: 'Deep Work Sprint: Go Kernel Architecture',
        description: 'Zero notifications, high focus code execution on clean architecture.',
        category: 'deep_work',
        priority: 'urgent',
        energy_level: 'high',
        recurrence_rule: 'DAILY',
        is_recurring: true,
        checked_today: true,
        current_streak: 12,
        longest_streak: 21,
        completed_days_7d: [true, true, true, true, true, true, true],
        scheduled_time: '09:00',
        created_at: new Date(Date.now() - 25 * 86400000).toISOString(),
    },
    {
        id: 'hab-03',
        title: 'Zone 2 Cardio / Neurogenesis Flush',
        description: '45 mins steady-state aerobic exertion maintaining 65-75% max HR.',
        category: 'physical',
        priority: 'medium',
        energy_level: 'high',
        recurrence_rule: 'DAILY',
        is_recurring: true,
        checked_today: false,
        current_streak: 8,
        longest_streak: 15,
        completed_days_7d: [false, true, true, true, true, true, false],
        scheduled_time: '17:30',
        created_at: new Date(Date.now() - 14 * 86400000).toISOString(),
    },
    {
        id: 'hab-04',
        title: 'Evening Architectural Log & Reflection',
        description: 'Document key decisions, metrics, and cognitive obstacles.',
        category: 'evening',
        priority: 'medium',
        energy_level: 'low',
        recurrence_rule: 'DAILY',
        is_recurring: true,
        checked_today: false,
        current_streak: 27,
        longest_streak: 45,
        completed_days_7d: [true, true, true, true, true, true, false],
        scheduled_time: '21:45',
        created_at: new Date(Date.now() - 45 * 86400000).toISOString(),
    },
    {
        id: 'hab-05',
        title: 'Magnesium L-Threonate & Digital Sunset',
        description: 'Screen cutoff 60 mins before sleep. Sleep latency optimization.',
        category: 'evening',
        priority: 'low',
        energy_level: 'low',
        recurrence_rule: 'DAILY',
        is_recurring: true,
        checked_today: false,
        current_streak: 5,
        longest_streak: 14,
        completed_days_7d: [true, false, true, true, false, true, false],
        scheduled_time: '22:30',
        created_at: new Date(Date.now() - 10 * 86400000).toISOString(),
    },
];

const DEFAULT_PROGRESS = {
    total_habits: 5,
    completed_today: 1,
    completion_rate: 82.4,
    current_velocity: '+14%',
    longest_active_streak: 27,
    consistency_score_30d: 91,
};

const DELETED_MOCKS_KEY = 'flowstate_deleted_mock_habits';
const CHECKED_MOCKS_KEY = 'flowstate_checked_mock_habits';

function getDeletedMockIds() {
    try {
        return JSON.parse(localStorage.getItem(DELETED_MOCKS_KEY) || '[]');
    } catch {
        return [];
    }
}

function addDeletedMockId(id) {
    try {
        const deleted = getDeletedMockIds();
        if (!deleted.includes(id)) {
            deleted.push(id);
            localStorage.setItem(DELETED_MOCKS_KEY, JSON.stringify(deleted));
        }
    } catch {}
}

function getCheckedMockIds() {
    try {
        const stored = localStorage.getItem(CHECKED_MOCKS_KEY);
        return stored !== null ? JSON.parse(stored) : ['hab-02'];
    } catch {
        return ['hab-02'];
    }
}

function toggleCheckedMockId(id) {
    try {
        const checked = getCheckedMockIds();
        const index = checked.indexOf(id);
        if (index >= 0) {
            checked.splice(index, 1);
        } else {
            checked.push(id);
        }
        localStorage.setItem(CHECKED_MOCKS_KEY, JSON.stringify(checked));
        return checked.includes(id);
    } catch {
        return false;
    }
}

/**
 * Hook to fetch all recurring habit protocols
 */
export function useHabits() {
    return useQuery({
        queryKey: ['habits'],
        queryFn: async () => {
            try {
                const res = await client.get('/habits');
                // Go wraps: { success: true, data: [...Task] }
                const data = res.data?.data || res.data;
                if (Array.isArray(data) && data.length > 0) {
                    return data.map((item, idx) => ({
                        id: item.id || `hab-${idx}`,
                        title: item.title,
                        description: item.description || '',
                        category: item.category || (idx % 2 === 0 ? 'morning' : 'deep_work'),
                        priority: item.priority || 'medium',
                        energy_level: item.energy_level || 'medium',
                        recurrence_rule: item.recurrence_rule || 'DAILY',
                        is_recurring: true,
                        checked_today: !!item.checked_today,
                        current_streak: item.current_streak || 0,
                        longest_streak: item.longest_streak || 0,
                        completed_days_7d: item.completed_days_7d || [false, false, false, false, false, false, false],
                        scheduled_time: item.scheduled_time || '09:00',
                    }));
                }
                const deletedMocks = getDeletedMockIds();
                const checkedMocks = getCheckedMockIds();
                return DEFAULT_HABITS.filter((h) => !deletedMocks.includes(h.id)).map((h) => {
                    const isChecked = checkedMocks.includes(h.id);
                    return {
                        ...h,
                        checked_today: isChecked,
                        current_streak: isChecked ? h.current_streak : Math.max(0, h.current_streak - 1),
                    };
                });
            } catch (err) {
                // Return structured default data if offline / local dev
                const deletedMocks = getDeletedMockIds();
                const checkedMocks = getCheckedMockIds();
                return DEFAULT_HABITS.filter((h) => !deletedMocks.includes(h.id)).map((h) => {
                    const isChecked = checkedMocks.includes(h.id);
                    return {
                        ...h,
                        checked_today: isChecked,
                        current_streak: isChecked ? h.current_streak : Math.max(0, h.current_streak - 1),
                    };
                });
            }
        },
        staleTime: 1000 * 60 * 5, // 5 minutes cache
    });
}

/**
 * Hook to fetch habit telemetry and velocity metrics
 */
export function useHabitProgress() {
    return useQuery({
        queryKey: ['habits', 'progress'],
        queryFn: async () => {
            try {
                const res = await client.get('/habits/progress');
                const data = res.data?.data || res.data;
                // Go returns: [{ task_id, title, completed_days, total_days, completion_rate, current_streak, longest_streak }]
                if (Array.isArray(data) && data.length > 0) {
                    const totalHabits = data.length;
                    const avgCompletionRate = data.reduce((sum, h) => sum + (h.completion_rate || 0), 0) / totalHabits;
                    const longestActiveStreak = data.reduce((max, h) => Math.max(max, h.current_streak || 0), 0);
                    return {
                        total_habits: totalHabits,
                        completed_today: data.filter((h) => h.current_streak > 0).length,
                        completion_rate: Math.round(avgCompletionRate * 10) / 10,
                        current_velocity: '+0%',
                        longest_active_streak: longestActiveStreak,
                        consistency_score_30d: Math.round(avgCompletionRate),
                        raw: data,
                    };
                }
                const checkedMocks = getCheckedMockIds();
                const deletedMocks = getDeletedMockIds();
                const activeDefaults = DEFAULT_HABITS.filter((h) => !deletedMocks.includes(h.id));
                const completedToday = activeDefaults.filter((h) => checkedMocks.includes(h.id)).length;
                return {
                    ...DEFAULT_PROGRESS,
                    total_habits: activeDefaults.length,
                    completed_today: completedToday,
                    completion_rate: activeDefaults.length > 0 ? Math.round((completedToday / activeDefaults.length) * 100) : 0,
                };
            } catch {
                return DEFAULT_PROGRESS;
            }
        },
        staleTime: 1000 * 60 * 5,
    });
}

/**
 * Hook for checking off a habit with optimistic updates for instant UI response
 */
export function useCheckinHabit() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async ({ habitId, date }) => {
            if (habitId && habitId.startsWith('hab-')) {
                toggleCheckedMockId(habitId);
                return { data: { success: true, habit_id: habitId } };
            }
            return client.post(`/habits/${habitId}/checkin`, {
                date: date || new Date().toISOString().split('T')[0],
            });
        },
        onMutate: async ({ habitId }) => {
            // Cancel outgoing queries
            await queryClient.cancelQueries({ queryKey: ['habits'] });
            await queryClient.cancelQueries({ queryKey: ['habits', 'progress'] });

            // Snapshot previous state
            const previousHabits = queryClient.getQueryData(['habits']) || DEFAULT_HABITS;
            const previousProgress = queryClient.getQueryData(['habits', 'progress']) || DEFAULT_PROGRESS;

            // Optimistically update habits list
            const updatedHabits = previousHabits.map((h) => {
                if (h.id === habitId) {
                    const isNowChecked = !h.checked_today;
                    const newStreak = isNowChecked ? h.current_streak + 1 : Math.max(0, h.current_streak - 1);
                    return {
                        ...h,
                        checked_today: isNowChecked,
                        current_streak: newStreak,
                        longest_streak: Math.max(h.longest_streak, newStreak),
                        completed_days_7d: [
                            ...(h.completed_days_7d ? h.completed_days_7d.slice(0, 6) : [true, true, true, true, true, true]),
                            isNowChecked,
                        ],
                    };
                }
                return h;
            });

            queryClient.setQueryData(['habits'], updatedHabits);

            // Optimistically update progress
            const completedCount = updatedHabits.filter((h) => h.checked_today).length;
            const completionRate = Math.round((completedCount / updatedHabits.length) * 100);

            queryClient.setQueryData(['habits', 'progress'], {
                ...previousProgress,
                completed_today: completedCount,
                completion_rate: completionRate,
            });

            return { previousHabits, previousProgress };
        },
        onError: (err, variables, context) => {
            // Roll back cache on error
            if (context?.previousHabits) {
                queryClient.setQueryData(['habits'], context.previousHabits);
            }
            if (context?.previousProgress) {
                queryClient.setQueryData(['habits', 'progress'], context.previousProgress);
            }
        },
        onSettled: () => {
            // Silently sync cache in background
            queryClient.invalidateQueries({ queryKey: ['habits'] });
            queryClient.invalidateQueries({ queryKey: ['habits', 'progress'] });
        },
    });
}

/**
 * Hook to create a new habit protocol
 */
export function useCreateHabit() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (newHabit) => {
            try {
                const res = await client.post('/habits', newHabit);
                return res.data;
            } catch {
                // Allow dev simulation if backend is standalone
                return {
                    id: `hab-${Date.now()}`,
                    ...newHabit,
                    checked_today: false,
                    current_streak: 0,
                    longest_streak: 0,
                    completed_days_7d: [false, false, false, false, false, false, false],
                };
            }
        },
        onSuccess: (created) => {
            queryClient.setQueryData(['habits'], (old = []) => [
                {
                    id: created.id || `hab-${Date.now()}`,
                    title: created.title,
                    description: created.description || '',
                    category: created.category || 'morning',
                    priority: created.priority || 'medium',
                    energy_level: created.energy_level || 'medium',
                    recurrence_rule: created.recurrence_rule || 'DAILY',
                    is_recurring: true,
                    checked_today: false,
                    current_streak: 0,
                    longest_streak: 0,
                    completed_days_7d: [false, false, false, false, false, false, false],
                    scheduled_time: created.scheduled_time || '08:00',
                },
                ...old,
            ]);
            queryClient.invalidateQueries({ queryKey: ['habits'] });
            queryClient.invalidateQueries({ queryKey: ['habits', 'progress'] });
        },
    });
}

/**
 * Hook to delete a habit protocol
 */
export function useDeleteHabit() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (habitId) => {
            if (habitId && habitId.startsWith('hab-')) {
                addDeletedMockId(habitId);
            }
            try {
                return await client.delete(`/habits/${habitId}`);
            } catch {
                return { success: true };
            }
        },
        onMutate: async (habitId) => {
            await queryClient.cancelQueries({ queryKey: ['habits'] });
            const previousHabits = queryClient.getQueryData(['habits']) || [];
            queryClient.setQueryData(
                ['habits'],
                previousHabits.filter((h) => h.id !== habitId)
            );
            return { previousHabits };
        },
        onError: (err, habitId, context) => {
            if (context?.previousHabits) {
                queryClient.setQueryData(['habits'], context.previousHabits);
            }
        },
        onSettled: () => {
            queryClient.invalidateQueries({ queryKey: ['habits'] });
            queryClient.invalidateQueries({ queryKey: ['habits', 'progress'] });
        },
    });
}
