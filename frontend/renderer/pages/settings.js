import * as api from '../assets/js/api.js';

export async function renderSettings(container) {
  const user = window.mdsCurrentUser();
  let users = [];
  try { users = await api.users.list(); } catch (_) {}

  container.innerHTML = `
  <div class="page-header">
    <div class="page-title"><h2>Settings</h2><p>System configuration and user management</p></div>
  </div>

  <div style="display:grid;grid-template-columns:220px 1fr;gap:20px">
    <!-- Settings Sidebar -->
    <div class="card" style="height:fit-content">
      <div style="padding:8px">
        ${['Users','My Profile','Invoices','System'].map((s,i) => {
          const icons = { 'Users': '<i class="fas fa-users-cog"></i>', 'My Profile': '<i class="fas fa-user-circle"></i>', 'Invoices': '<i class="fas fa-file-invoice"></i>', 'System': '<i class="fas fa-server"></i>' };
          return `<div class="nav-item ${i===0?'active':''}" data-stab="${s.toLowerCase().replace(' ','-')}" style="color:var(--text-primary);display:flex;align-items:center;gap:10px">${icons[s]} ${s}</div>`
        }).join('')}
      </div>
    </div>

    <!-- Settings Content -->
    <div>
      <!-- Users Tab -->
      <div class="tab-content active" id="stab-users">
        <div class="card">
          <div class="card-header">
            <div class="card-title"><i class="fas fa-users"></i> System Users</div>
            <button class="btn btn-primary btn-sm" id="new-user-btn"><i class="fas fa-user-plus"></i> Add User</button>
          </div>
          <div class="table-wrapper">
            <table>
              <thead><tr><th>Name</th><th>Email</th><th>Role</th><th>Last Login</th><th>Status</th><th>Actions</th></tr></thead>
              <tbody>
                ${users.length === 0 ? `<tr><td colspan="6"><div class="empty-state" style="padding:30px">No users</div></td></tr>` :
                users.map(u => `<tr>
                  <td>
                    <div style="display:flex;align-items:center;gap:8px">
                      <div class="avatar avatar-sm">${u.name[0]}${u.surname[0]}</div>
                      <span style="font-weight:600">${u.name} ${u.surname}</span>
                    </div>
                  </td>
                  <td style="color:var(--text-secondary)">${u.email}</td>
                  <td><span class="badge ${u.role==='admin'?'badge-danger':u.role==='doctor'?'badge-primary':'badge-info'}">${u.role}</span></td>
                  <td style="font-size:12px;color:var(--text-muted)">${u.last_login ? new Date(u.last_login).toLocaleDateString('sk-SK') : 'Never'}</td>
                  <td><span class="badge ${u.active?'badge-success':'badge-muted'}">${u.active?'Active':'Inactive'}</span></td>
                  <td>
                    <button class="btn btn-sm btn-secondary toggle-user" data-id="${u.id}" data-active="${u.active}">${u.active?'<i class="fas fa-user-minus"></i> Deactivate':'<i class="fas fa-user-check"></i> Activate'}</button>
                    <button class="btn btn-sm btn-ghost reset-pw" data-id="${u.id}"><i class="fas fa-key"></i> Reset PW</button>
                  </td>
                </tr>`).join('')}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <!-- My Profile Tab -->
      <div class="tab-content" id="stab-my-profile">
        <div class="card">
          <div class="card-header"><div class="card-title"><i class="fas fa-user-circle"></i> My Profile</div></div>
          <div class="card-body">
            <div class="form-grid form-grid-2">
              <div class="form-group"><label class="form-label">Name</label><input class="form-control" value="${user.name}" disabled></div>
              <div class="form-group"><label class="form-label">Surname</label><input class="form-control" value="${user.surname}" disabled></div>
              <div class="form-group"><label class="form-label">Email</label><input class="form-control" value="${user.email}" disabled></div>
              <div class="form-group"><label class="form-label">Role</label><input class="form-control" value="${user.role}" disabled></div>
            </div>
            <hr style="border:none;border-top:1px solid var(--border);margin:20px 0">
            <h4 style="font-size:13px;font-weight:700;margin-bottom:16px">Change Password</h4>
            <div style="max-width:400px">
              <div class="form-group"><label class="form-label">Current Password</label><input class="form-control" type="password" id="cur-pw"></div>
              <div class="form-group"><label class="form-label">New Password</label><input class="form-control" type="password" id="new-pw"></div>
              <button class="btn btn-primary" id="change-pw-btn">Update Password</button>
            </div>
          </div>
        </div>
      </div>

      <!-- System Tab -->
      <div class="tab-content" id="stab-system">
        <div class="card">
          <div class="card-header"><div class="card-title"><i class="fas fa-cog"></i> System Info</div></div>
          <div class="card-body">
            <table style="max-width:400px">
              <tbody>
                <tr><td style="color:var(--text-muted);padding:8px 0">Application</td><td style="font-weight:600">MDS - Medical Dental System</td></tr>
                <tr><td style="color:var(--text-muted);padding:8px 0">Version</td><td>v1.4.0</td></tr>
                <tr><td style="color:var(--text-muted);padding:8px 0">API Endpoint</td><td style="font-family:monospace;font-size:12px">http://localhost:3000/api</td></tr>
                <tr><td style="color:var(--text-muted);padding:8px 0">Logged in as</td><td>${user.name} ${user.surname} (${user.role})</td></tr>
              </tbody>
            </table>
            <div class="alert alert-info" style="margin-top:16px;max-width:400px">
              <span class="alert-icon"><i class="fas fa-info-circle"></i></span>
              <span>Configure the database connection in <code style="font-family:monospace;background:var(--bg-app);padding:1px 4px;border-radius:4px">backend/.env</code></span>
            </div>

            <div style="margin-top:24px;padding-top:20px;border-top:1px solid var(--border);max-width:400px">
              <h4 style="font-size:13px;font-weight:700;color:var(--danger);margin-bottom:8px">Danger Zone</h4>
              <p style="font-size:12px;color:var(--text-muted);margin-bottom:16px">Unpairing will disconnect this device from the server. You will need the pairing PIN and server IP to connect again.</p>
              <button class="btn btn-danger btn-block" id="disconnect-btn">
                <i class="fas fa-unlink"></i> Disconnect from Server
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- Invoices Tab (D&D Editor) -->
      <div class="tab-content" id="stab-invoices">
        <div class="card">
          <div class="card-header">
            <div class="card-title"><i class="fas fa-file-invoice"></i> Invoice Designer</div>
            <button class="btn btn-success btn-sm" id="save-template-btn"><i class="fas fa-save"></i> Save Layout</button>
          </div>
          <div class="card-body">
            <p style="font-size:13px; color:var(--text-muted); margin-bottom:20px">Drag and reorder the sections below to customize your invoice layout.</p>
            
            <div id="invoice-editor-canvas" style="display:flex; flex-direction:column; gap:12px; background:var(--bg-app); padding:20px; border-radius:12px; border:2px dashed var(--border)">
              <!-- Drag and drop items will be injected here -->
            </div>

            <div class="alert alert-warning" style="margin-top:20px">
              <i class="fas fa-exclamation-triangle"></i>
              <div>The changes will apply to all <strong>future</strong> PDF/Viewed invoices immediately.</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>

  <!-- New User Modal -->
  <div class="modal-backdrop" id="new-user-modal-backdrop">
    <div class="modal modal-md">
      <div class="modal-header"><div class="modal-title"><i class="fas fa-user-plus"></i> Add New User</div><div class="modal-close" onclick="document.getElementById('new-user-modal-backdrop').classList.remove('open')"><i class="fas fa-times"></i></div></div>
      <div class="modal-body">
        <div class="form-grid form-grid-2">
          <div class="form-group"><label class="form-label">First Name *</label><input class="form-control" id="nu-name"></div>
          <div class="form-group"><label class="form-label">Last Name *</label><input class="form-control" id="nu-surname"></div>
          <div class="form-group"><label class="form-label">Email *</label><input class="form-control" type="email" id="nu-email"></div>
          <div class="form-group"><label class="form-label">Phone</label><input class="form-control" id="nu-phone" type="tel"></div>
          <div class="form-group"><label class="form-label">Role *</label>
            <select class="form-control form-select" id="nu-role">
              <option value="receptionist">Receptionist</option>
              <option value="doctor">Doctor</option>
              <option value="admin">Admin</option>
            </select>
          </div>
          <div class="form-group"><label class="form-label">Password *</label><input class="form-control" type="password" id="nu-pw" placeholder="Min 6 characters"></div>
        </div>
      </div>
      <div class="modal-footer">
        <button class="btn btn-secondary" onclick="document.getElementById('new-user-modal-backdrop').classList.remove('open')">Cancel</button>
        <button class="btn btn-primary" id="save-user-btn">Create User</button>
      </div>
    </div>
  </div>`;

  // Settings tab switching
  container.querySelectorAll('[data-stab]').forEach(btn => {
    btn.addEventListener('click', () => {
      container.querySelectorAll('[data-stab]').forEach(b => b.classList.remove('active'));
      container.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
      btn.classList.add('active');
      document.getElementById(`stab-${btn.dataset.stab}`).classList.add('active');
    });
  });

  // Create user
  document.getElementById('new-user-btn')?.addEventListener('click', () => document.getElementById('new-user-modal-backdrop').classList.add('open'));
  document.getElementById('save-user-btn')?.addEventListener('click', async () => {
    const btn = document.getElementById('save-user-btn');
    btn.textContent = 'Creating…'; btn.disabled = true;
    try {
      await api.users.create({
        name: document.getElementById('nu-name').value,
        surname: document.getElementById('nu-surname').value,
        email: document.getElementById('nu-email').value,
        password: document.getElementById('nu-pw').value,
        role: document.getElementById('nu-role').value,
        phone: document.getElementById('nu-phone').value,
      });
      window.mdsToast('User created', 'success');
      document.getElementById('new-user-modal-backdrop').classList.remove('open');
      renderSettings(container);
    } catch (err) { window.mdsToast(err.message, 'error'); }
    finally { btn.textContent = 'Create User'; btn.disabled = false; }
  });

  // Toggle user
  document.querySelectorAll('.toggle-user').forEach(btn => {
    btn.addEventListener('click', async () => {
      const active = parseInt(btn.dataset.active) === 1 ? 0 : 1;
      await api.users.update(parseInt(btn.dataset.id), { active }).catch(e => window.mdsToast(e.message, 'error'));
      renderSettings(container);
    });
  });

  // Reset PW
  document.querySelectorAll('.reset-pw').forEach(btn => {
    btn.addEventListener('click', async () => {
      const pw = prompt('Enter new password for this user (min 6 chars):');
      if (!pw || pw.length < 6) return;
      try { await api.users.resetPassword(parseInt(btn.dataset.id), pw); window.mdsToast('Password reset', 'success'); }
      catch (err) { window.mdsToast(err.message, 'error'); }
    });
  });

  // Change password
  document.getElementById('change-pw-btn')?.addEventListener('click', async () => {
    const cur = document.getElementById('cur-pw').value;
    const nw = document.getElementById('new-pw').value;
    if (!cur || !nw) { window.mdsToast('Both fields required', 'error'); return; }
    try { await api.auth.changePassword(cur, nw); window.mdsToast('Password updated', 'success'); }
    catch (err) { window.mdsToast(err.message, 'error'); }
  });

  // Invoices Tab: Drag & Drop Designer
  const canvas = document.getElementById('invoice-editor-canvas');
  if (canvas) {
    const blockLabels = {
      'header': 'Clinic Header (Name, Logo, Address)',
      'clinic_info': 'Clinic Details (Tax ID, Phone)',
      'patient_info': 'Patient Information (Name, Address)',
      'treatment_table': 'Treatments Table (Procedures, Prices)',
      'totals': 'Totals Summary (Subtotal, Discount, Balance)',
      'footer': 'Footer (Notes, Thank you message)'
    };

    let template = [];
    async function loadTemplate() {
      try {
        const res = await api.settings.get('invoice_template');
        template = res.value || ['header', 'clinic_info', 'patient_info', 'treatment_table', 'totals', 'footer'];
        renderBlocks();
      } catch (err) { window.mdsToast('Failed to load template', 'error'); }
    }

    function renderBlocks() {
      canvas.innerHTML = '';
      template.forEach((block, index) => {
        const div = document.createElement('div');
        div.className = 'card';
        div.draggable = true;
        div.style.padding = '12px 16px';
        div.style.cursor = 'grab';
        div.style.display = 'flex';
        div.style.alignItems = 'center';
        div.style.justifyContent = 'space-between';
        div.dataset.index = index;
        div.dataset.block = block;

        div.innerHTML = `
          <div class="flex items-center gap-12">
            <i class="fas fa-bars" style="color:var(--text-muted)"></i>
            <span style="font-weight:600">${blockLabels[block]}</span>
          </div>
          <span class="badge badge-primary">ID: ${block}</span>
        `;

        // D&D Events
        div.ondragstart = (e) => { e.dataTransfer.setData('text/plain', index); div.style.opacity = '0.5'; };
        div.ondragend = () => { div.style.opacity = '1'; };
        div.ondragover = (e) => e.preventDefault();
        div.ondrop = (e) => {
          e.preventDefault();
          const fromIndex = parseInt(e.dataTransfer.getData('text/plain'));
          const toIndex = index;
          const item = template.splice(fromIndex, 1)[0];
          template.splice(toIndex, 0, item);
          renderBlocks();
        };

        canvas.appendChild(div);
      });
    }

    document.getElementById('save-template-btn').onclick = async () => {
      try {
        await api.settings.update('invoice_template', template);
        window.mdsToast('Invoice layout saved!', 'success');
      } catch (err) { window.mdsToast(err.message, 'error'); }
    };

    loadTemplate();
  }
}
