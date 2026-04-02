/**
 * MDS App - Main Orchestrator
 * Handles authentication, navigation, and page routing
 */

import * as api from './api.js';
import { renderLogin } from '../../pages/login.js';
import { renderDashboard } from '../../pages/dashboard.js';
import { renderPatients } from '../../pages/patients.js';
import { renderPatientDetail } from '../../pages/patient-detail.js';
import { renderAppointments } from '../../pages/appointments.js';
import { renderTreatments } from '../../pages/treatments.js';
import { renderRecords } from '../../pages/records.js';
import { renderFinance } from '../../pages/finance.js';
import { renderNotifications } from '../../pages/notifications.js';
import { renderSettings } from '../../pages/settings.js';
import { renderInventory } from '../../pages/inventory.js';
import { renderLogs } from '../../pages/logs.js';
import { renderReports } from '../../pages/reports.js';
import { renderClinicalSession } from '../../pages/clinical-session.js';
import { renderSystem } from '../../pages/system.js';

// ── State ─────────────────────────────────────────────────────────
let currentPage = 'dashboard';
let currentUser = null;
let unreadCount = 0;

const pageMap = {
  dashboard:      { render: renderDashboard,      label: 'Dashboard' },
  patients:       { render: renderPatients,        label: 'Patients' },
  'patient-detail': { render: renderPatientDetail, label: 'Patient Detail' },
  appointments:   { render: renderAppointments,    label: 'Appointments' },
  records:        { render: renderRecords,         label: 'Medical Records' },
  treatments:     { render: renderTreatments,      label: 'Treatments' },
  finance:        { render: renderFinance,         label: 'Finance' },
  notifications:  { render: renderNotifications,   label: 'Notifications' },
  inventory:      { render: renderInventory,       label: 'Inventory' },
  logs:           { render: renderLogs,            label: 'Audit Logs' },
  reports:        { render: renderReports,         label: 'Reports' },
  'clinical-session': { render: renderClinicalSession, label: 'Clinical Session' },
  system:         { render: renderSystem,          label: 'System Info' },
  settings:       { render: renderSettings,        label: 'Settings' },
};

// ── Toast System ──────────────────────────────────────────────────
export function toast(message, type = 'info', duration = 3500) {
  const container = document.getElementById('toast-container');
  const el = document.createElement('div');
  el.className = `toast ${type}`;
  const icons = { 
    success: '<i class="fas fa-check-circle"></i>', 
    error: '<i class="fas fa-times-circle"></i>', 
    warning: '<i class="fas fa-exclamation-triangle"></i>', 
    info: '<i class="fas fa-info-circle"></i>' 
  };
  el.innerHTML = `<span>${icons[type] || '<i class="fas fa-info-circle"></i>'}</span><span>${message}</span>`;
  container.appendChild(el);
  setTimeout(() => { el.style.opacity = '0'; el.style.transform = 'translateX(20px)'; el.style.transition = 'all 0.3s ease'; setTimeout(() => el.remove(), 300); }, duration);
}

// ── Navigation ────────────────────────────────────────────────────
export function navigateTo(page, params = {}) {
  const entry = pageMap[page];
  if (!entry) return;

  currentPage = page;
  document.getElementById('topbar-page').textContent = entry.label;

  // Update sidebar active state
  document.querySelectorAll('.nav-item').forEach(el => el.classList.remove('active'));
  const navEl = document.getElementById(`nav-${page}`);
  if (navEl) navEl.classList.add('active');

  const main = document.getElementById('main-content');
  main.innerHTML = `<div class="loading-overlay"><div class="spinner"></div> Loading…</div>`;

  entry.render(main, params).catch(err => {
    main.innerHTML = `<div class="empty-state"><div class="empty-state-icon"><i class="fas fa-exclamation-circle"></i></div><h3>Error loading page</h3><p>${err.message}</p></div>`;
  });
}

// ── Sidebar Toggle ─────────────────────────────────────────────────
function initSidebar() {
  const sidebar = document.getElementById('sidebar');
  document.getElementById('sidebar-toggle').addEventListener('click', () => {
    sidebar.classList.toggle('collapsed');
  });

  document.querySelectorAll('.nav-item[data-page]').forEach(item => {
    item.addEventListener('click', () => navigateTo(item.dataset.page));
    item.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') navigateTo(item.dataset.page); });
  });
}

// ── Global Search ──────────────────────────────────────────────────
function initSearch() {
  document.addEventListener('keydown', e => {
    if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
      e.preventDefault();
      document.getElementById('global-search-input').focus();
    }
  });

  let searchTimer;
  document.getElementById('global-search-input').addEventListener('input', e => {
    clearTimeout(searchTimer);
    const q = e.target.value.trim();
    if (q.length < 2) return;
    searchTimer = setTimeout(() => {
      navigateTo('patients', { search: q });
    }, 400);
  });
}

// ── Notifications Badge ────────────────────────────────────────────
async function refreshNotifBadge() {
  try {
    const data = await api.notifications.list();
    unreadCount = data.unread || 0;
    const badge1 = document.getElementById('topbar-notif-badge');
    const badge2 = document.getElementById('notif-badge');
    if (unreadCount > 0) {
      badge1.style.display = '';
      badge2.style.display = '';
      badge2.textContent = unreadCount;
    } else {
      badge1.style.display = 'none';
      badge2.style.display = 'none';
    }
  } catch (_) {}
}

// ── Boot ──────────────────────────────────────────────────────────
async function boot() {
  const token = api.getToken();
  const savedUser = sessionStorage.getItem('mds_user');

  if (token && savedUser) {
    try {
      currentUser = JSON.parse(savedUser);
      showApp();
      return;
    } catch (_) {}
  }

  showLogin();
}

function showLogin() {
  document.getElementById('login-screen').style.display = '';
  document.getElementById('app').style.display = 'none';
  renderLogin(document.getElementById('login-screen'), onLoginSuccess);
}

function onLoginSuccess(user, token) {
  api.setToken(token);
  currentUser = user;
  sessionStorage.setItem('mds_user', JSON.stringify(user));
  showApp();
}

function showApp() {
  document.getElementById('login-screen').style.display = 'none';
  document.getElementById('app').style.display = '';

  // Update sidebar user info
  document.getElementById('sidebar-user-name').textContent = `${currentUser.name} ${currentUser.surname}`;
  document.getElementById('sidebar-user-role').textContent = currentUser.role;
  document.getElementById('sidebar-avatar').textContent = (currentUser.name[0] + currentUser.surname[0]).toUpperCase();

  initSidebar();
  initSearch();

  document.getElementById('logout-btn').addEventListener('click', () => {
    if (confirm('Are you sure you want to logout?')) {
      api.clearToken();
      sessionStorage.removeItem('mds_user');
      showLogin();
    }
  });

  document.getElementById('notif-btn').addEventListener('click', () => navigateTo('notifications'));

  // Role-based nav hiding
  if (currentUser.role === 'receptionist') {
    document.getElementById('nav-records')?.remove();
    document.getElementById('nav-treatments')?.remove();
  }
  if (currentUser.role !== 'admin') {
    document.getElementById('nav-settings')?.remove();
    document.getElementById('nav-logs')?.remove();
    document.getElementById('nav-system')?.remove();
  }
  if (currentUser.role === 'receptionist') {
    document.getElementById('nav-reports')?.remove();
  }

  navigateTo('dashboard');
  refreshNotifBadge();
  setInterval(refreshNotifBadge, 60000); // refresh every minute
}

// Handle session expiry
window.addEventListener('auth:expired', () => {
  toast('Session expired. Please log in again.', 'warning');
  showLogin();
});

// Expose navigation globally for use in page modules
window.mdsNavigateTo = navigateTo;
window.mdsToast = toast;
window.mdsCurrentUser = () => currentUser;

boot();
