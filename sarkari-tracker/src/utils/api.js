import { API_BASE } from './constants';

export const getToken = () => localStorage.getItem('sarkari_token');
export const setToken = (token) => localStorage.setItem('sarkari_token', token);
export const removeToken = () => localStorage.removeItem('sarkari_token');

export const apiCall = async (endpoint, options = {}) => {
  const token = getToken();
  const headers = {
    ...(options.body instanceof FormData ? {} : { 'Content-Type': 'application/json' }),
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...options.headers,
  };

  const response = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers,
  });

  const data = await response.json().catch(() => null);

  if (!response.ok) {
    const errorMsg = data?.error || data?.message || `Request failed with status ${response.status}`;
    throw new Error(errorMsg);
  }

  return data;
};

// Auth
export const login = (emailOrCreds, password) => {
  const body = typeof emailOrCreds === 'object' ? emailOrCreds : { email: emailOrCreds, password };
  return apiCall('/api/auth/login', { method: 'POST', body: JSON.stringify(body) });
};

export const register = (userData) => apiCall('/api/auth/register', { method: 'POST', body: JSON.stringify(userData) });
export const getMe = () => apiCall('/api/auth/me');

// Public Exams
export const getExams = (params) => {
  const query = params ? new URLSearchParams(params).toString() : '';
  return apiCall(`/api/exams${query ? `?${query}` : ''}`);
};
export const getExam = (id) => apiCall(`/api/exams/${id}`);
export const getExamCategories = () => apiCall('/api/exams/categories');

// Applications / Candidate Tracker
export const getJobs = () => apiCall('/api/jobs');
export const createJob = (data) => apiCall('/api/jobs', { method: 'POST', body: JSON.stringify(data) });
export const applyToExam = (examId, extra = {}) => apiCall('/api/jobs', { 
  method: 'POST', 
  body: JSON.stringify({ exam_id: examId, ...extra }) 
});
export const updateJob = (id, data) => apiCall(`/api/jobs/${id}`, { method: 'PUT', body: JSON.stringify(data) });
export const updateJobStatus = (id, status) => apiCall(`/api/jobs/${id}/status`, { 
  method: 'PUT', 
  body: JSON.stringify({ status }) 
});
export const toggleChecklistItem = (appId, itemId, is_checked, document_file) => 
  apiCall(`/api/jobs/${appId}/checklist/${itemId}`, {
    method: 'PUT',
    body: JSON.stringify({ is_checked, document_file })
  });
export const addChecklistItem = (appId, item_title) =>
  apiCall(`/api/jobs/${appId}/checklist`, {
    method: 'POST',
    body: JSON.stringify({ item_title })
  });
export const exportJobsCsv = () => {
  const token = getToken();
  fetch('/api/jobs/export/csv', {
    headers: token ? { Authorization: `Bearer ${token}` } : {}
  })
    .then(res => {
      if (!res.ok) throw new Error('Failed to export CSV');
      return res.blob();
    })
    .then(blob => {
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `my_sarkari_applications_${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      a.remove();
    })
    .catch(err => alert('Failed to download CSV: ' + err.message));
};
export const uploadFile = async (file) => {
  const token = getToken();
  const formData = new FormData();
  formData.append('file', file);
  const response = await fetch('/api/admin/upload-file', {
    method: 'POST',
    headers: token ? { Authorization: `Bearer ${token}` } : {},
    body: formData
  });
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || `HTTP error ${response.status}`);
  }
  return response.json();
};

// Candidate Personal Document Upload & Delete
export const uploadJobDocument = async (jobId, file, docType) => {
  const token = getToken();
  const formData = new FormData();
  formData.append('file', file);
  formData.append('doc_type', docType);
  const response = await fetch(`/api/jobs/${jobId}/upload`, {
    method: 'POST',
    headers: token ? { Authorization: `Bearer ${token}` } : {},
    body: formData
  });
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || `Upload failed with status ${response.status}`);
  }
  return response.json();
};

export const deleteJobDocument = (jobId, docType) => 
  apiCall(`/api/jobs/${jobId}/document/${docType}`, { method: 'DELETE' });

export const deleteJob = (id) => apiCall(`/api/jobs/${id}`, { method: 'DELETE' });
export const getJobStats = () => apiCall('/api/jobs/stats');
export const checkExamApplication = (examId) => apiCall(`/api/jobs/check/${examId}`);
export const analyzeJobKeywords = (id) => apiCall(`/api/jobs/${id}/analyze`, { method: 'POST' });
export const scanJobAi = (id) => apiCall(`/api/jobs/${id}/scan-ai`, { method: 'POST' });
export const adoptJobAiDates = (id, dates) => apiCall(`/api/jobs/${id}/adopt-dates`, { 
  method: 'POST', 
  body: JSON.stringify(dates) 
});
export const scanExamAi = (id) => apiCall(`/api/exams/${id}/scan-ai`, { method: 'POST' });

// Notifications
export const getNotifications = () => apiCall('/api/notifications');
export const markNotificationRead = (id) => apiCall(`/api/notifications/${id}/read`, { method: 'PUT' });
export const markAllNotificationsRead = () => apiCall('/api/notifications/read-all', { method: 'PUT' });
export const deleteNotification = (id) => apiCall(`/api/notifications/${id}`, { method: 'DELETE' });
export const clearReadNotifications = () => apiCall('/api/notifications/clear-read', { method: 'DELETE' });
export const clearAllNotifications = () => apiCall('/api/notifications/clear-all', { method: 'DELETE' });
export const getUnreadCount = () => apiCall('/api/notifications/unread-count');

// Daily Exam Intelligence Questions & Answers
export const getDailyQuestions = () => apiCall('/api/questions');
export const triggerDailyExamChecks = () => apiCall('/api/run-daily-checks', { method: 'POST' });
export const getExamAnswers = (examId, customExamName) => {
  const params = new URLSearchParams();
  if (examId) params.append('exam_id', examId);
  if (customExamName) params.append('custom_exam_name', customExamName);
  return apiCall(`/api/exam-answers?${params.toString()}`);
};

// Reminders
export const getReminders = () => apiCall('/api/reminders');
export const createReminder = (data) => apiCall('/api/reminders', { method: 'POST', body: JSON.stringify(data) });

// Admin Panel APIs
export const adminGetExams = () => apiCall('/api/admin/exams');
export const adminCreateExam = (data) => apiCall('/api/admin/exams', { method: 'POST', body: JSON.stringify(data) });
export const adminDuplicateExam = (id) => apiCall(`/api/admin/exams/${id}/duplicate`, { method: 'POST' });
export const adminGetExamContent = (id) => apiCall(`/api/admin/exams/${id}/content`);
export const adminSaveExamContent = (id, contentData) => apiCall(`/api/admin/exams/${id}/content`, {
  method: 'POST',
  body: JSON.stringify(contentData)
});
export const adminUploadFile = (formData) => apiCall('/api/admin/upload-file', {
  method: 'POST',
  body: formData
});
export const adminBulkImportCutoffs = (id, rows) => apiCall(`/api/admin/exams/${id}/cutoffs/bulk`, {
  method: 'POST',
  body: JSON.stringify({ rows })
});
export const adminAddPyq = (id, pyqData) => apiCall(`/api/admin/exams/${id}/pyqs`, {
  method: 'POST',
  body: JSON.stringify(pyqData)
});
export const adminGetAuditLogs = () => apiCall('/api/admin/audit-logs');

// Web Intelligence & Expected Dates APIs
export const getWebDiscoveries = (examId) => apiCall(`/api/exams/${examId}/web-discoveries`);
export const scanWebForExam = (examId) => apiCall(`/api/exams/${examId}/scan-web`, { method: 'POST' });

// Admin Human-in-the-Loop Review & Web Confirmation APIs
export const adminGetReviewQueue = () => apiCall('/api/admin/review');
export const adminApproveReview = (id) => apiCall(`/api/admin/review/${id}/approve`, { method: 'POST' });
export const adminRejectReview = (id) => apiCall(`/api/admin/review/${id}/reject`, { method: 'POST' });
export const adminGetWebDiscoveries = () => apiCall('/api/admin/web-discoveries');
export const adminConfirmWebDiscovery = (id) => apiCall(`/api/admin/web-discoveries/${id}/confirm`, { method: 'POST' });
export const adminRejectWebDiscovery = (id) => apiCall(`/api/admin/web-discoveries/${id}/reject`, { method: 'POST' });

// Candidate Contribution APIs (Direct Publish: No Waiting for Admin)
export const candidateUploadFile = (formData) => apiCall('/api/candidate/upload-file', {
  method: 'POST',
  body: formData
});
export const candidateContributeExam = (examId, data) => apiCall(`/api/candidate/exams/${examId}/contribute`, {
  method: 'POST',
  body: JSON.stringify(data)
});
export const candidateGetContributions = (examId) => apiCall(`/api/candidate/exams/${examId}/contributions`);
