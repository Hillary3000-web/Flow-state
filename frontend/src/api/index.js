import client from './client';

export const authAPI = {
  register: (data) => client.post('/auth/register/', data),
  login: (data) => client.post('/auth/login/', data),
  refresh: (data) => client.post('/auth/refresh/', data),
  logout: (data) => client.post('/auth/logout/', data),
  getMe: () => client.get('/auth/me/'),
  updateMe: (data) => client.patch('/auth/me/', data),
  changePassword: (data) => client.post('/auth/password/change/', data),
};

export const goalsAPI = {
  list: (params) => client.get('/goals/', { params }),
  get: (id) => client.get(`/goals/${id}/`),
  create: (data) => client.post('/goals/', data),
  update: (id, data) => client.patch(`/goals/${id}/`, data),
  delete: (id) => client.delete(`/goals/${id}/`),
};

export const projectsAPI = {
  list: (params) => client.get('/projects/', { params }),
  get: (id) => client.get(`/projects/${id}/`),
  create: (data) => client.post('/projects/', data),
  update: (id, data) => client.patch(`/projects/${id}/`, data),
  delete: (id) => client.delete(`/projects/${id}/`),
};

export const tasksAPI = {
  list: (params) => client.get('/tasks/', { params }),
  get: (id) => client.get(`/tasks/${id}/`),
  create: (data) => client.post('/tasks/', data),
  update: (id, data) => client.patch(`/tasks/${id}/`, data),
  delete: (id) => client.delete(`/tasks/${id}/`),
  complete: (id) => client.post(`/tasks/${id}/complete/`),
  quickCapture: (data) => client.post('/tasks/quick-capture/', data),
  reorder: (items) => client.patch('/tasks/reorder/', { items }),
  aiBreakdown: (id) => client.post(`/tasks/${id}/ai-breakdown/`),
};

export const subtasksAPI = {
  list: (params) => client.get('/subtasks/', { params }),
  create: (data) => client.post('/subtasks/', data),
  update: (id, data) => client.patch(`/subtasks/${id}/`, data),
  delete: (id) => client.delete(`/subtasks/${id}/`),
  toggle: (id) => client.post(`/subtasks/${id}/toggle/`),
};

export const scheduleAPI = {
  listBlocks: (params) => client.get('/schedule/blocks/', { params }),
  createBlock: (data) => client.post('/schedule/blocks/', data),
  updateBlock: (id, data) => client.patch(`/schedule/blocks/${id}/`, data),
  deleteBlock: (id) => client.delete(`/schedule/blocks/${id}/`),
  reorderBlocks: (items) => client.patch('/schedule/blocks/reorder/', { items }),
  weekly: (params) => client.get('/schedule/weekly/', { params }),
  risks: () => client.get('/schedule/risks/'),
};

export const focusAPI = {
  listSessions: (params) => client.get('/focus/sessions/', { params }),
  createSession: (data) => client.post('/focus/sessions/', data),
  updateSession: (id, data) => client.patch(`/focus/sessions/${id}/`, data),
  stats: () => client.get('/focus/stats/'),
};

export const habitsAPI = {
  list: () => client.get('/habits/'),
  checkin: (taskId) => client.post(`/habits/${taskId}/checkin/`),
  streaks: (taskId) => client.get(`/habits/${taskId}/streaks/`),
  progress: () => client.get('/habits/progress/'),
};

export const analyticsAPI = {
  overview: () => client.get('/analytics/overview/'),
  trends: (params) => client.get('/analytics/trends/', { params }),
  burndown: (params) => client.get('/analytics/burndown/', { params }),
  timeAllocation: () => client.get('/analytics/time-allocation/'),
};

export const notificationsAPI = {
  list: (params) => client.get('/notifications/', { params }),
  markRead: (id) => client.patch(`/notifications/${id}/read/`),
  markAllRead: () => client.post('/notifications/read-all/'),
};
