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
import { renderPairing } from '../../pages/pairing.js';
import { renderTreatmentPlans } from '../../pages/treatment-plans.js';

// ── State ─────────────────────────────────────────────────────────
let currentPage = 'dashboard';
let currentUser = null;
let unreadCount = 0;
let pairingCheckInterval = null;
let expirationTimer = null;
let isInitialized = false;
let notifInterval = null;

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
  'treatment-plans': { render: renderTreatmentPlans, label: 'Treatment Plans' },
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
  // Prevent redundant navigation to the same page with same params (simple check)
  if (currentPage === page && Object.keys(params).length === 0 && document.getElementById('main-content').innerHTML !== '') {
    return;
  }

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

// ── Pairing Expiration Check ──────────────────────────────────────
function startPairingCheck() {
  if (pairingCheckInterval) return;

  pairingCheckInterval = setInterval(async () => {
    const isPaired = localStorage.getItem('mds_is_paired') === 'true';
    const code = localStorage.getItem('mds_pairing_code');
    
    if (!isPaired || !code) return;

    try {
      const res = await api.auth.checkPairingStatus(code);
      if (!res.valid) {
        handlePairingExpiration();
      }
    } catch (err) {
      // If server is unreachable, we don't necessarily want to kick them out yet
      console.warn('[Pairing Check] Server unreachable');
    }
  }, 30000); // Check every 30 seconds
}

function handlePairingExpiration() {
  if (expirationTimer) return; // Already handles

  clearInterval(pairingCheckInterval);
  pairingCheckInterval = null;

  toast('Pairing PIN has changed or expired! You will be disconnected in 60 minutes.', 'warning', 10000);
  
  // Start 60 minute countdown
  expirationTimer = setTimeout(() => {
    toast('Pairing expired. Disconnecting now...', 'danger', 5000);
    setTimeout(() => {
      window.mdsDisconnect();
    }, 2000);
  }, 3600000); // 60 minutes
}

// ── Boot ──────────────────────────────────────────────────────────
async function boot() {
  // Check if device is paired
  const isPaired = localStorage.getItem('mds_is_paired') === 'true';
  if (!isPaired) {
    showPairing();
    return;
  }

  const token = api.getToken();
  const savedUser = sessionStorage.getItem('mds_user');

  if (token && savedUser) {
    try {
      currentUser = JSON.parse(savedUser);
      showApp();
      startPairingCheck(); // Start check if already app shown
      return;
    } catch (_) {}
  }

  showLogin();
}

function showPairing() {
  document.getElementById('pairing-screen').style.display = '';
  document.getElementById('login-screen').style.display = 'none';
  document.getElementById('app').style.display = 'none';
  renderPairing(document.getElementById('pairing-screen'), () => {
    document.getElementById('pairing-screen').style.display = 'none';
    showLogin();
  });
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

  if (!isInitialized) {
    initSidebar();
    initSearch();
    
    document.getElementById('logout-btn').addEventListener('click', () => {
      if (confirm('Are you sure you want to logout?')) {
        if (notifInterval) {
          clearInterval(notifInterval);
          notifInterval = null;
        }
        api.clearToken();
        sessionStorage.removeItem('mds_user');
        showLogin();
      }
    });

    document.getElementById('notif-btn').addEventListener('click', () => navigateTo('notifications'));
    isInitialized = true;
  }

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
  startPairingCheck();
  
  if (!notifInterval) {
    notifInterval = setInterval(refreshNotifBadge, 60000); // refresh every minute
  }
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

window.mdsDisconnect = () => {
  api.disconnect();
  currentUser = null;
  showPairing();
};

/**
 * Global Invoice Generator (v1.4.0)
 * Renders a professional, printable invoice based on the saved layout template.
 */
window.mdsRenderInvoiceModal = async (id) => {
  const data = await api.finance.getInvoice(id).catch(e => toast(e.message, 'error'));
  if (!data) return;
  const { invoice, items } = data;
  
  // Fetch Template from Settings
  const { value: template } = await api.settings.get('invoice_template').catch(() => ({ value: ['header', 'clinic_info', 'patient_info', 'treatment_table', 'totals', 'footer'] }));

  const modal = document.createElement('div');
  modal.className = 'modal-backdrop open';
  modal.id = 'global-invoice-modal';
  modal.innerHTML = `
    <div class="modal modal-xl" style="background:#f0f2f5; height:90vh !important; display:flex; flex-direction:column">
      <div class="modal-header">
        <div class="modal-title" style="display:flex; align-items:center; gap:12px">
          <i class="fas fa-file-invoice-dollar" style="color:var(--primary)"></i>
          <span>Invoice No. ${invoice.invoice_number}</span>
          <span class="badge badge-${invoice.status==='paid'?'success':'warning'}" style="margin-left:8px">${invoice.status.toUpperCase()}</span>
        </div>
        <div class="flex gap-12">
          <button class="btn btn-primary btn-sm" onclick="window.print()"><i class="fas fa-print"></i> Print</button>
          <div class="modal-close" onclick="this.closest('.modal-backdrop').remove()"><i class="fas fa-times"></i></div>
        </div>
      </div>
      <div class="modal-body" style="background:#f0f2f5; display:flex; justify-content:center; padding:40px; overflow-y:auto; flex:1">
        <!-- The printable invoice page -->
        <style>
          @media print {
            body * { visibility: hidden; }
            #printable-invoice, #printable-invoice * { visibility: visible; }
            #printable-invoice { position: absolute; left: 0; top: 0; width: 100% !important; margin: 0 !important; padding: 10mm !important; box-shadow: none !important; }
            .modal-backdrop { background: none !important; }
            .modal-header, .modal-footer { display: none !important; }
          }
        </style>
        <div id="printable-invoice" style="width:210mm; min-height:297mm; background:#fff; padding:25mm; box-shadow:0 10px 30px rgba(0,0,0,0.1); font-family: 'Inter', system-ui, sans-serif; color:#2d3748">
          ${template.map(block => {
            if (block === 'header') return `
              <div style="display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:40px">
                <div>
                  <div style="background:var(--primary); color:#fff; padding:10px 20px; border-radius:8px; font-weight:800; font-size:24px; display:inline-block">MDS</div>
                  <h1 style="font-size:32px; font-weight:900; margin-top:16px; letter-spacing:-1px; color:#1a202c">INVOICE</h1>
                  <div style="font-size:12px; color:#718096; margin-top:4px">Medical Dental System (Faktúra)</div>
                </div>
                <div style="text-align:right">
                  <div style="font-size:12px; color:#a0aec0; text-transform:uppercase; font-weight:700">Invoice Number</div>
                  <div style="font-size:16px; font-weight:800; color:#2d3748">#${invoice.invoice_number}</div>
                  <div style="margin-top:12px; font-size:12px; color:#a0aec0; text-transform:uppercase; font-weight:700">Issue Date</div>
                  <div style="font-size:14px; font-weight:600">${new Date(invoice.issue_date).toLocaleDateString('sk-SK')}</div>
                </div>
              </div>`;
            
            if (block === 'clinic_info') return `
              <div style="margin-bottom:40px; display:grid; grid-template-columns:1fr 1fr; gap:40px">
                <div>
                  <div style="font-size:11px; color:#a0aec0; text-transform:uppercase; font-weight:700; border-bottom:1px solid #edf2f7; padding-bottom:4px; margin-bottom:12px">Clinic Details (Dodávateľ)</div>
                  <div style="font-weight:700; font-size:15px; color:#1a202c">Medical Dental System Ltd.</div>
                  <div style="font-size:13px; color:#4a5568; line-height:1.6">Main St. 123, 811 01 Bratislava<br>Slovak Republic<br>ICO: 12345678 | DIC: 2021123456</div>
                </div>
                <div>
                  <div style="font-size:11px; color:#a0aec0; text-transform:uppercase; font-weight:700; border-bottom:1px solid #edf2f7; padding-bottom:4px; margin-bottom:12px">Contact</div>
                  <div style="font-size:13px; color:#4a5568; line-height:1.6">Phone: +421 900 000 000<br>Email: dental@mds.sk<br>Website: www.mds-medical.sk</div>
                </div>
              </div>`;
            
            if (block === 'patient_info') return `
              <div style="margin-bottom:40px; background:#f7fafc; padding:24px; border-radius:12px; border:1px solid #e2e8f0; display:grid; grid-template-columns:3fr 1fr; gap:20px">
                <div>
                  <div style="font-size:11px; color:#a0aec0; text-transform:uppercase; font-weight:700; margin-bottom:8px">Received By (Odberateľ)</div>
                  <div style="font-size:18px; font-weight:800; color:#1a202c">${invoice.first_name} ${invoice.last_name}</div>
                  <div style="font-size:13px; color:#4a5568; margin-top:4px">${invoice.address || 'Address not listed'}</div>
                  <div style="font-size:13px; color:#4a5568">${invoice.phone || ''}</div>
                </div>
                <div style="text-align:right">
                  <div style="font-size:11px; color:#a0aec0; text-transform:uppercase; font-weight:700; margin-bottom:8px">Patient ID</div>
                  <div style="font-size:16px; font-weight:700; color:#2d3748">#${invoice.patient_id}</div>
                </div>
              </div>`;
            
            if (block === 'treatment_table') return `
              <div style="margin-bottom:40px">
                <table style="width:100%; border-collapse:collapse">
                  <thead>
                    <tr style="background:#f8fafc; border-bottom:2px solid #edf2f7">
                      <th style="padding:14px; text-align:left; font-size:11px; font-weight:800; color:#a0aec0; text-transform:uppercase">Description</th>
                      <th style="padding:14px; text-align:center; font-size:11px; font-weight:800; color:#a0aec0; text-transform:uppercase">Qty</th>
                      <th style="padding:14px; text-align:right; font-size:11px; font-weight:800; color:#a0aec0; text-transform:uppercase">Price</th>
                      <th style="padding:14px; text-align:right; font-size:11px; font-weight:800; color:#a0aec0; text-transform:uppercase">Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    ${items.map(i => `
                      <tr style="border-bottom:1px solid #edf2f7">
                        <td style="padding:14px; font-size:14px">
                          <div style="font-weight:700; color:#2d3748">${i.treatment_name}</div>
                          <div style="font-size:11px; color:#a0aec0; margin-top:2px">${i.tooth_number ? `Tooth: ${i.tooth_number}` : 'General Dental Procedure'}</div>
                        </td>
                        <td style="padding:14px; text-align:center; font-size:14px; color:#4a5568">${i.quantity}</td>
                        <td style="padding:14px; text-align:right; font-size:14px; color:#4a5568">€${parseFloat(i.unit_price).toFixed(2)}</td>
                        <td style="padding:14px; text-align:right; font-size:14px; font-weight:700; color:#2d3748">€${parseFloat(i.total_price).toFixed(2)}</td>
                      </tr>
                    `).join('')}
                  </tbody>
                </table>
              </div>`;
            
            if (block === 'totals') return `
              <div style="display:flex; justify-content:flex-end">
                <div style="width:280px">
                  <div style="display:flex; justify-content:space-between; padding:8px 0; border-bottom:1px solid #edf2f7; font-size:14px">
                    <span style="color:#718096">Subtotal:</span>
                    <span style="font-weight:600">€${parseFloat(invoice.subtotal).toFixed(2)}</span>
                  </div>
                  ${invoice.discount_amount > 0 ? `
                  <div style="display:flex; justify-content:space-between; padding:8px 0; border-bottom:1px solid #edf2f7; font-size:14px; color:var(--success)">
                    <span>Discount (${invoice.discount_percent}%):</span>
                    <span style="font-weight:600">-€${parseFloat(invoice.discount_amount).toFixed(2)}</span>
                  </div>` : ''}
                  <div style="display:flex; justify-content:space-between; padding:20px 0; font-size:24px; font-weight:900; color:var(--primary)">
                    <span>TOTAL:</span>
                    <span>€${parseFloat(invoice.total).toFixed(2)}</span>
                  </div>
                </div>
              </div>`;
            
            if (block === 'footer') return `
              <div style="margin-top:80px; padding-top:24px; border-top:2px solid #edf2f7; display:grid; grid-template-columns:2fr 1fr; gap:40px">
                <div>
                  <div style="font-size:11px; color:#a0aec0; text-transform:uppercase; font-weight:700; margin-bottom:8px">Clinic Notes & Signature</div>
                  <p style="font-size:13px; color:#718096; line-height:1.6">${invoice.notes || 'Please pay by bank transfer or at the reception. Thank you for your visit!'}</p>
                </div>
                <div style="text-align:right; font-size:13px; color:#718096">
                  <div style="margin-top:40px; font-style:italic">Physician\\'s Signature</div>
                  <div style="margin-top:12px; border-top:1px solid #edf2f7; display:inline-block; width:150px"></div>
                </div>
              </div>`;
            return '';
          }).join('')}
        </div>
      </div>
    </div>
  `;
  document.body.appendChild(modal);
};

boot();
