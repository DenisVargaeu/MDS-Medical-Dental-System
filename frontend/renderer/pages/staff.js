import * as api from '../assets/js/api.js';

export async function renderStaff(container, params = {}) {
  container.innerHTML = `
    <div class="page-header flex justify-between items-center">
      <div>
        <h1 class="page-title">Staff Management</h1>
        <p class="page-subtitle">Manage clinic employees and track their clinical performance</p>
      </div>
      <button class="btn btn-primary" id="add-staff-btn"><i class="fas fa-user-plus"></i> Add Employee</button>
    </div>

    <!-- Staff Grid -->
    <div class="staff-grid grid-3" id="staff-container">
      <div class="card p-40 text-center col-span-3">
         <div class="spinner"></div> Loading staff directory...
      </div>
    </div>

    <!-- Add Staff Modal -->
    <div class="modal-backdrop" id="staff-modal-backdrop">
      <div class="modal">
        <div class="modal-header">
           <div class="modal-title">New Employee Register</div>
           <div class="modal-close" id="staff-modal-close">&times;</div>
        </div>
        <div class="modal-body">
           <form id="staff-form">
              <div class="form-grid form-grid-2">
                 <div class="form-group">
                   <label class="form-label">First Name</label>
                   <input type="text" class="form-control" id="s-name" required>
                 </div>
                 <div class="form-group">
                   <label class="form-label">Last Name</label>
                   <input type="text" class="form-control" id="s-surname" required>
                 </div>
              </div>
              <div class="form-group">
                 <label class="form-label">Email Address</label>
                 <input type="email" class="form-control" id="s-email" required>
              </div>
              <div class="form-group">
                 <label class="form-label">Temporary Password</label>
                 <input type="password" class="form-control" id="s-password" required>
              </div>
              <div class="form-grid form-grid-2">
                 <div class="form-group">
                   <label class="form-label">Role</label>
                   <select class="form-control" id="s-role">
                      <option value="doctor">Doctor</option>
                      <option value="receptionist">Receptionist</option>
                      <option value="admin">Administrator</option>
                   </select>
                 </div>
                 <div class="form-group">
                   <label class="form-label">Phone</label>
                   <input type="text" class="form-control" id="s-phone">
                 </div>
              </div>
           </form>
        </div>
        <div class="modal-footer">
           <button class="btn btn-secondary" id="staff-modal-cancel">Cancel</button>
           <button class="btn btn-primary" id="save-staff-btn">Register Employee</button>
        </div>
      </div>
    </div>
  `;

  const staffContainer = document.getElementById('staff-container');
  const modal = document.getElementById('staff-modal-backdrop');

  async function loadStaff() {
     try {
        const users = await api.staff.list();
        
        if (users.length === 0) {
           staffContainer.innerHTML = '<div class="card p-40 text-center col-span-3">No staff members found.</div>';
           return;
        }

        staffContainer.innerHTML = '';
        for (const u of users) {
           const card = document.createElement('div');
           card.className = 'card stat-card animate-scale-in';
           card.style.flexDirection = 'column';
           card.style.padding = '24px';
           card.style.gap = '0';
           
           // Fetch stats for this user
           let stats = { total_appointments: 0, total_records: 0, total_revenue: 0 };
           try { stats = await api.staff.getStats(u.id); } catch (_) {}

           const roleIcon = u.role === 'admin' ? 'fa-user-shield' : u.role === 'doctor' ? 'fa-stethoscope' : 'fa-user-edit';

           card.innerHTML = `
              <div style="display:flex; align-items:center; gap:16px; margin-bottom:20px; width:100%">
                 <div class="avatar avatar-md shadow">${u.name[0]}${u.surname[0]}</div>
                 <div style="flex:1">
                    <div style="font-size:17px; font-weight:800; color:var(--text-primary); letter-spacing:-0.3px">${u.name} ${u.surname}</div>
                    <div class="badge ${u.role === 'admin' ? 'badge-danger' : u.role === 'doctor' ? 'badge-primary' : 'badge-info'}" style="margin-top:4px">
                       <i class="fas ${roleIcon}"></i> ${u.role.toUpperCase()}
                    </div>
                 </div>
                 <div style="text-align:right">
                    <span class="status-indicator" style="background:${u.active ? 'var(--success)' : 'var(--text-muted)'}; animation:${u.active ? 'pulseGreen 2s infinite' : 'none'}"></span>
                 </div>
              </div>
              
              <div style="display:grid; grid-template-columns:1fr 1fr 1fr; gap:12px; background:var(--bg-app); padding:16px; border-radius:var(--radius); margin-bottom:24px; width:100%">
                 <div style="text-align:center">
                    <div style="font-size:15px; font-weight:800; color:var(--primary)">${stats.total_appointments}</div>
                    <div style="font-size:9px; color:var(--text-muted); font-weight:700; text-transform:uppercase; letter-spacing:0.5px">Apps</div>
                 </div>
                 <div style="text-align:center; border-left:1px solid var(--border); border-right:1px solid var(--border)">
                    <div style="font-size:15px; font-weight:800; color:var(--text-primary)">${stats.total_records}</div>
                    <div style="font-size:9px; color:var(--text-muted); font-weight:700; text-transform:uppercase; letter-spacing:0.5px">Records</div>
                 </div>
                 <div style="text-align:center">
                    <div style="font-size:15px; font-weight:800; color:var(--success)">€${parseFloat(stats.total_revenue).toFixed(0)}</div>
                    <div style="font-size:9px; color:var(--text-muted); font-weight:700; text-transform:uppercase; letter-spacing:0.5px">Revenue</div>
                 </div>
              </div>

              <div style="display:flex; gap:8px; width:100%">
                 <button class="btn btn-secondary btn-sm flex-1 reset-pass" data-id="${u.id}" title="Reset Password"><i class="fas fa-key"></i> Reset</button>
                 <button class="btn btn-ghost btn-sm flex-1 toggle-active" data-id="${u.id}" data-active="${u.active}" style="color:${u.active?'var(--danger)':'var(--success)'}">
                    <i class="fas ${u.active?'fa-user-slash':'fa-user-check'}"></i> ${u.active ? 'Suspend' : 'Activate'}
                 </button>
              </div>
           `;
           staffContainer.appendChild(card);
           
           // Actions
           card.querySelector('.reset-pass').onclick = async () => {
              const newPass = prompt('Enter new temporary password (min 6 chars):');
              if (!newPass || newPass.length < 6) return;
              try {
                 await api.request('PUT', `/users/${u.id}/reset-password`, { password: newPass });
                 window.mdsToast('Password reset successfully', 'success');
              } catch (err) { window.mdsToast(err.message, 'error'); }
           };

           card.querySelector('.toggle-active').onclick = async () => {
              try {
                 await api.request('PUT', `/users/${u.id}`, { active: !u.active });
                 window.mdsToast(`User ${u.active ? 'suspended' : 'activated'}`, 'info');
                 loadStaff();
              } catch (err) { window.mdsToast(err.message, 'error'); }
           };
        }

     } catch (err) {
        staffContainer.innerHTML = `<div class="card p-40 text-center col-span-3 text-danger">Error: ${err.message}</div>`;
     }
  }

  document.getElementById('add-staff-btn').onclick = () => modal.classList.add('open');
  document.getElementById('staff-modal-close').onclick = () => modal.classList.remove('open');
  document.getElementById('staff-modal-cancel').onclick = () => modal.classList.remove('open');

  document.getElementById('save-staff-btn').onclick = async () => {
     const data = {
        name: document.getElementById('s-name').value,
        surname: document.getElementById('s-surname').value,
        email: document.getElementById('s-email').value,
        password: document.getElementById('s-password').value,
        role: document.getElementById('s-role').value,
        phone: document.getElementById('s-phone').value
     };
     try {
        await api.request('POST', '/users', data);
        window.mdsToast('Employee registered!', 'success');
        modal.classList.remove('open');
        loadStaff();
     } catch (err) { window.mdsToast(err.message, 'error'); }
  };

  loadStaff();
}
