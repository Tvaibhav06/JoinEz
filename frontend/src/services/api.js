const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

async function request(endpoint, options = {}) {
  const token = localStorage.getItem('joineazy_token');
  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...options.headers
  };

  const config = {
    ...options,
    headers
  };

  if (options.body && typeof options.body === 'object') {
    config.body = JSON.stringify(options.body);
  }

  const response = await fetch(`${API_BASE_URL}${endpoint}`, config);
  const data = await response.json().catch(() => ({
    success: false,
    message: 'Unable to parse server response'
  }));

  if (!response.ok) {
    const error = new Error(data.message || 'Something went wrong');
    error.statusCode = response.status;
    error.errors = data.errors;
    throw error;
  }

  return data;
}

export const api = {
  // Auth
  register: (body) => request('/auth/register', { method: 'POST', body }),
  login: (body) => request('/auth/login', { method: 'POST', body }),
  getMe: () => request('/auth/me', { method: 'GET' }),

  // Groups
  createGroup: (body) => request('/groups', { method: 'POST', body }),
  getMyGroup: () => request('/groups/my-group', { method: 'GET' }),
  getGroupById: (id) => request(`/groups/${id}`, { method: 'GET' }),
  addGroupMember: (groupId, body) => request(`/groups/${groupId}/members`, { method: 'POST', body }),
  getGroupProgress: (groupId) => request(`/groups/${groupId}/progress`, { method: 'GET' }),

  // Assignments
  getAssignments: () => request('/assignments', { method: 'GET' }),
  getAssignmentById: (id) => request(`/assignments/${id}`, { method: 'GET' }),
  createAssignment: (body) => request('/assignments', { method: 'POST', body }),
  updateAssignment: (id, body) => request(`/assignments/${id}`, { method: 'PUT', body }),

  // Submission Confirmations
  step1Submission: (assignmentId) => request(`/assignments/${assignmentId}/submission/step1`, { method: 'POST' }),
  confirmSubmission: (assignmentId) => request(`/assignments/${assignmentId}/submission/confirm`, { method: 'POST' }),
  getSubmissionStatus: (assignmentId) => request(`/assignments/${assignmentId}/submission`, { method: 'GET' }),

  // Admin Monitoring & Analytics
  getAdminGroupMonitoring: (assignmentId) => request(`/admin/assignments/${assignmentId}/groups`, { method: 'GET' }),
  getAdminStudentMonitoring: (assignmentId) => request(`/admin/assignments/${assignmentId}/students`, { method: 'GET' }),
  getCompletionAnalytics: (assignmentId) =>
    request(`/admin/analytics/completion${assignmentId ? `?assignment_id=${assignmentId}` : ''}`, { method: 'GET' }),
  getGroupPerformanceAnalytics: () => request('/admin/analytics/group-performance', { method: 'GET' }),
  getAdminDashboardSummary: () => request('/admin/dashboard/summary', { method: 'GET' })
};

export default api;
