/**
 * MDS API Client - v1.7.0 Core Precision
 * Communicates with the backend REST API
 */

let API_BASE = (localStorage.getItem('mds_server_url') ? `${localStorage.getItem('mds_server_url')}/api` : null) || 'http://localhost:3000/api';

export function setServerUrl(url) {
  const cleanUrl = url.replace(/\/$/, '');
  API_BASE = `${cleanUrl}/api`;
  localStorage.setItem('mds_server_url', cleanUrl);
}

export function getServerUrl() {
  return localStorage.getItem('mds_server_url') || 'http://localhost:3000';
}

let _authToken = null;

export function setToken(token) {
  _authToken = token;
  if (token) sessionStorage.setItem('mds_token', token);
  else sessionStorage.removeItem('mds_token');
}

export function getToken() {
  if (!_authToken) _authToken = sessionStorage.getItem('mds_token');
  return _authToken;
}

export function clearToken() {
  _authToken = null;
  sessionStorage.removeItem('mds_token');
  sessionStorage.removeItem('mds_user');
}

export function disconnect() {
  clearToken();
  localStorage.removeItem('mds_server_url');
  localStorage.removeItem('mds_is_paired');
  localStorage.removeItem('mds_pairing_code');
}

async function request(method, path, body = null, isFormData = false) {
  const token = getToken();
  const headers = {};
  if (token) headers['Authorization'] = `Bearer ${token}`;
  if (body && !isFormData) headers['Content-Type'] = 'application/json';

  const options = { method, headers };
  if (body) options.body = isFormData ? body : JSON.stringify(body);

  try {
    const res = await fetch(`${API_BASE}${path}`, options);
    
    if (res.status === 401 && path !== '/auth/login') {
      clearToken();
      window.dispatchEvent(new Event('auth:expired'));
      throw new Error('Session expired. Please log in again.');
    }
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || `HTTP ${res.status}`);
    return data;
  } catch (err) {
    if (err.message === 'Failed to fetch') {
      throw new Error('Cannot connect to MDS server. Is the backend running?');
    }
    throw err;
  }
}

/**
 * Generic API Client
 * @param {string} path API Endpoint path (e.g. '/auth/me')
 * @param {object} options { method: 'GET', body: null, isFormData: false }
 * @returns {Promise<any>}
 */
export async function client(path, options = {}) {
  const { method = 'GET', body = null, isFormData = false } = options;
  return request(method, path, body, isFormData);
}

export const auth = {
  login: (email, password) => request('POST', '/auth/login', { email, password }),
  me: () => request('GET', '/auth/me'),
  changePassword: (currentPassword, newPassword) => request('POST', '/auth/change-password', { currentPassword, newPassword }),
  checkPairingStatus: (code) => request('GET', `/auth/pairing-status/${code}`),
};

export const patients = {
  list: (params = {}) => request('GET', `/patients?${new URLSearchParams(params)}`),
  get: (id) => request('GET', `/patients/${id}`),
  create: (data) => request('POST', '/patients', data),
  update: (id, data) => request('PUT', `/patients/${id}`, data),
  delete: (id) => request('DELETE', `/patients/${id}`),
  addAllergy: (id, data) => request('POST', `/patients/${id}/allergies`, data),
  deleteAllergy: (id, aid) => request('DELETE', `/patients/${id}/allergies/${aid}`),
  addMedication: (id, data) => request('POST', `/patients/${id}/medications`, data),
  deleteMedication: (id, mid) => request('DELETE', `/patients/${id}/medications/${mid}`),
  addDiagnosis: (id, data) => request('POST', `/patients/${id}/diagnoses`, data),
};

export const appointments = {
  list: (params = {}) => request('GET', `/appointments?${new URLSearchParams(params)}`),
  today: () => request('GET', '/appointments/today'),
  get: (id) => request('GET', `/appointments/${id}`),
  create: (data) => request('POST', '/appointments', data),
  update: (id, data) => request('PUT', `/appointments/${id}`, data),
  cancel: (id, reason) => request('DELETE', `/appointments/${id}`, { cancellation_reason: reason }),
};

export const treatments = {
  list: (params = {}) => request('GET', `/treatments?${new URLSearchParams(params)}`),
  categories: () => request('GET', '/treatments/categories'),
  get: (id) => request('GET', `/treatments/${id}`),
  create: (data) => request('POST', '/treatments', data),
  update: (id, data) => request('PUT', `/treatments/${id}`, data),
  delete: (id) => request('DELETE', `/treatments/${id}`),
};

export const records = {
  list: (params = {}) => request('GET', `/records?${new URLSearchParams(params)}`),
  get: (id) => request('GET', `/records/${id}`),
  create: (data) => request('POST', '/records', data),
  update: (id, data) => request('PUT', `/records/${id}`, data),
  addTreatment: (id, data) => request('POST', `/records/${id}/treatments`, data),
  removeTreatment: (id, tid) => request('DELETE', `/records/${id}/treatments/${tid}`),
};

export const finance = {
  invoices: (params = {}) => request('GET', `/finance/invoices?${new URLSearchParams(params)}`),
  getInvoice: (id) => request('GET', `/finance/invoices/${id}`),
  createInvoice: (data) => request('POST', '/finance/invoices', data),
  pay: (id, amount, method) => request('PATCH', `/finance/invoices/${id}/pay`, { amount, payment_method: method }),
  stats: () => request('GET', '/finance/stats'),
};

export const vitals = {
  list: (patientId) => request('GET', `/vitals/${patientId}`),
  create: (data) => request('POST', '/vitals', data),
  delete: (id) => request('DELETE', `/vitals/${id}`),
};

export const treatmentPlans = {
  list: (params = {}) => request('GET', `/treatment-plans?${new URLSearchParams(params)}`),
  get: (id) => request('GET', `/treatment-plans/${id}`),
  create: (data) => request('POST', '/treatment-plans', data),
  updateStatus: (id, status) => request('PATCH', `/treatment-plans/${id}/status`, { status }),
  updateItemStatus: (id, itemId, status, payment_action = null) => request('PATCH', `/treatment-plans/${id}/items/${itemId}/status`, { status, payment_action }),
};

export const dashboard = {
  stats: () => request('GET', '/dashboard/stats'),
};

export const users = {
  list: () => request('GET', '/users'),
  doctors: () => request('GET', '/users/doctors'),
  create: (data) => request('POST', '/users', data),
  update: (id, data) => request('PUT', `/users/${id}`, data),
  resetPassword: (id, password) => request('PUT', `/users/${id}/reset-password`, { password }),
};

export const notifications = {
  list: () => request('GET', '/notifications'),
  markRead: (id) => request('PATCH', `/notifications/${id}/read`),
  markAllRead: () => request('PATCH', '/notifications/read-all'),
};

export const odontogram = {
  get: (patientId) => request('GET', `/odontogram/${patientId}`),
  update: (patientId, data) => request('POST', `/odontogram/${patientId}`, data),
};

export const inventory = {
  list: () => request('GET', '/inventory'),
  updateStock: (id, delta) => request('PATCH', `/inventory/${id}/stock`, { delta }),
};

export const logs = {
  list: () => request('GET', '/logs'),
};

export const settings = {
  get: (key) => request('GET', `/settings/${key}`),
  update: (key, value) => request('PUT', `/settings/${key}`, { value }),
};

export const staff = {
  list: () => request('GET', '/users'),
  getStats: (id) => request('GET', `/users/${id}/stats`)
};
