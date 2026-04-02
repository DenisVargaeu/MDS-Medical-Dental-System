import * as api from '../assets/js/api.js';

export async function renderNotifications(container) {
  container.innerHTML = `
  <div class="page-header">
    <div class="page-title"><h2>Notifications</h2><p>System alerts and reminders</p></div>
    <button class="btn btn-secondary" id="mark-all-btn"><i class="fas fa-check-double"></i> Mark All Read</button>
  </div>
  <div id="notif-list"><div class="loading-overlay"><div class="spinner"></div></div></div>`;

  await load();

  document.getElementById('mark-all-btn').addEventListener('click', async () => {
    await api.notifications.markAllRead().catch(() => {});
    window.mdsToast('All notifications marked as read', 'success');
    await load();
  });

  async function load() {
    const list = document.getElementById('notif-list');
    try {
      const data = await api.notifications.list();
      const notifs = data.data;
      if (notifs.length === 0) {
        list.innerHTML = `<div class="card"><div class="empty-state"><div class="empty-state-icon"><i class="fas fa-bell-slash"></i></div><h3>No notifications</h3><p>You're all caught up!</p></div></div>`;
        return;
      }
      const typeIcon = { 
        appointment: '<i class="fas fa-calendar-alt"></i>', 
        allergy: '<i class="fas fa-exclamation-triangle"></i>', 
        payment: '<i class="fas fa-euro-sign"></i>', 
        system: '<i class="fas fa-cog"></i>', 
        reminder: '<i class="fas fa-clock"></i>', 
        warning: '<i class="fas fa-exclamation-circle"></i>' 
      };
      list.innerHTML = `<div class="card">
        ${notifs.map(n => `
          <div style="display:flex;align-items:flex-start;gap:12px;padding:14px 16px;border-bottom:1px solid var(--border);background:${n.is_read ? 'transparent' : 'var(--primary-ghost)'};transition:var(--transition)" id="notif-${n.id}">
            <div style="width:36px;height:36px;border-radius:50%;background:var(--bg-app);display:flex;align-items:center;justify-content:center;font-size:16px;flex-shrink:0;color:var(--primary)">${typeIcon[n.type] || '<i class="fas fa-bell"></i>'}</div>
            <div style="flex:1">
              <div style="font-weight:${n.is_read ? '400' : '600'};font-size:13.5px">${n.title}</div>
              <div style="font-size:12px;color:var(--text-secondary);margin-top:2px">${n.message || ''}</div>
              <div style="font-size:11px;color:var(--text-muted);margin-top:4px">${new Date(n.created_at).toLocaleString('sk-SK')}</div>
            </div>
            ${!n.is_read ? `<button class="btn btn-sm btn-ghost mark-read-btn" data-id="${n.id}" style="flex-shrink:0">Mark read</button>` : ''}
          </div>`).join('')}
      </div>`;

      document.querySelectorAll('.mark-read-btn').forEach(btn => {
        btn.addEventListener('click', async () => {
          await api.notifications.markRead(parseInt(btn.dataset.id)).catch(() => {});
          const row = document.getElementById(`notif-${btn.dataset.id}`);
          row.style.background = 'transparent';
          btn.remove();
        });
      });
    } catch (err) {
      list.innerHTML = `<div class="empty-state"><div class="empty-state-icon"><i class="fas fa-exclamation-triangle"></i></div><h3>${err.message}</h3></div>`;
    }
  }
}
