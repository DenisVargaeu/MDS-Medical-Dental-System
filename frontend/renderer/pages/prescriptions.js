import * as api from '../assets/js/api.js';

export async function renderPrescriptions(container, params = {}) {
  container.innerHTML = `
    <div class="page-header flex justify-between items-center">
      <div>
        <h1 class="page-title">Prescription Management</h1>
        <p class="page-subtitle">Generate and manage digital medical prescriptions</p>
      </div>
      <button class="btn btn-primary" id="new-presc-btn"><i class="fas fa-plus"></i> New Prescription</button>
    </div>

    <div class="card" style="margin-bottom:24px">
      <div class="card-header flex justify-between items-center">
         <div class="flex items-center gap-12" style="width:100%">
            <label class="form-label" style="margin-bottom:0">Select Patient:</label>
            <select class="form-control" id="presc-patient-select" style="max-width:300px"></select>
         </div>
      </div>
    </div>

    <div id="patient-presc-view" class="empty-state" style="padding:60px">
       <div class="empty-state-icon"><i class="fas fa-user-injured"></i></div>
       <h3>Please select a patient</h3>
       <p>Select a patient above to view their history or create a new prescription.</p>
    </div>

    <!-- Modals -->
    <div class="modal-backdrop" id="presc-modal-backdrop">
      <div class="modal modal-lg">
        <div class="modal-header">
           <div class="modal-title">New Prescription</div>
           <div class="modal-close" id="presc-modal-close">&times;</div>
        </div>
        <div class="modal-body">
           <form id="presc-form">
              <div class="form-group" style="margin-bottom:16px">
                 <label class="form-label">Patient Name</label>
                 <div id="presc-patient-name" style="font-weight:700; color:var(--primary)">-</div>
              </div>
              <div class="form-group">
                 <label class="form-label">Medications Listing</label>
                 <div id="med-rows-container">
                    <div class="flex gap-4 med-row" style="margin-bottom:8px">
                       <input type="text" class="form-control med-name" placeholder="Medication (e.g. Paracetamol 500mg)" style="flex:2">
                       <input type="text" class="form-control med-dosage" placeholder="Dosage (e.g. 1-0-1)" style="flex:1">
                       <button class="btn btn-sm btn-ghost remove-med-row" type="button"><i class="fas fa-times"></i></button>
                    </div>
                 </div>
                 <button class="btn btn-xs btn-outline" id="add-med-row-btn" type="button"><i class="fas fa-plus"></i> Add Line</button>
              </div>
              <div class="form-group" style="margin-top:20px">
                 <label class="form-label">General Instructions</label>
                 <textarea class="form-control" id="presc-instructions" rows="3" placeholder="Additional instructions (e.g. Take after meal)"></textarea>
              </div>
              <div class="form-group">
                 <label class="form-label">Valid Until</label>
                 <input type="date" class="form-control" id="presc-valid-until">
              </div>
           </form>
        </div>
        <div class="modal-footer">
           <button class="btn btn-secondary" id="presc-modal-cancel">Cancel</button>
           <button class="btn btn-primary" id="save-presc-btn">Save & Print Preview</button>
        </div>
      </div>
    </div>
  `;

  const patientSelect = document.getElementById('presc-patient-select');
  const view = document.getElementById('patient-presc-view');
  const modal = document.getElementById('presc-modal-backdrop');
  let selectedPatient = null;

  async function init() {
     const patients = await api.patients.list({ limit: 100 });
     patientSelect.innerHTML = `<option value="">-- Choose Patient --</option>` + patients.data.map(p => `
        <option value="${p.id}" ${params.patientId == p.id ? 'selected' : ''}>${p.last_name} ${p.first_name} (#${p.id})</option>
     `).join('');
     
     if (params.patientId) {
        selectedPatient = patients.data.find(p => p.id == params.patientId);
        loadPatientHistory(params.patientId);
     }
  }

  async function loadPatientHistory(pid) {
     view.innerHTML = `<div class="spinner"></div> Loading history...`;
     try {
        const history = await api.prescriptions.list(pid);
        if (history.length === 0) {
           view.innerHTML = `<div class="empty-state" style="padding:40px"><div class="empty-state-icon"><i class="fas fa-history"></i></div><h3>No history found</h3><p>Click "New Prescription" to start.</p></div>`;
        } else {
           view.innerHTML = `
              <div class="grid grid-2 gap-12" id="presc-history-list">
                 ${history.map(h => `
                    <div class="card p-16 flex justify-between items-center" style="background:rgba(255,255,255,0.03); border:1px solid rgba(255,255,255,0.05)">
                       <div>
                          <div style="font-weight:700; color:var(--primary)">${new Date(h.date).toLocaleDateString()}</div>
                          <div style="font-size:12px; color:var(--text-muted)">Dr. ${h.doctor_name} ${h.doctor_surname}</div>
                          <div style="margin-top:8px">
                             ${JSON.parse(h.medications).map(m => `<span class="badge badge-sm badge-outline" style="margin-right:4px">${m.name}</span>`).slice(0, 3).join('')}
                             ${JSON.parse(h.medications).length > 3 ? '...' : ''}
                          </div>
                       </div>
                       <div class="flex gap-4">
                          <button class="btn btn-sm btn-outline print-presc" data-id="${h.id}"><i class="fas fa-print"></i></button>
                          <button class="btn btn-sm btn-ghost delete-presc" data-id="${h.id}"><i class="fas fa-trash"></i></button>
                       </div>
                    </div>
                 `).join('')}
              </div>
           `;
           
           view.querySelectorAll('.delete-presc').forEach(btn => {
              btn.onclick = async () => {
                 if (!confirm('Delete this prescription history?')) return;
                 await api.prescriptions.delete(btn.dataset.id);
                 loadPatientHistory(pid);
              };
           });

           view.querySelectorAll('.print-presc').forEach(btn => {
              btn.onclick = () => {
                 const p = history.find(h => h.id == btn.dataset.id);
                 renderPrintView(p);
              };
           });
        }
     } catch (err) { view.innerHTML = `<p class="text-danger">${err.message}</p>`; }
  }

  patientSelect.onchange = () => {
     const pid = patientSelect.value;
     if (!pid) {
        selectedPatient = null;
        view.innerHTML = '...';
        return;
     }
     selectedPatient = { id: pid, name: patientSelect.options[patientSelect.selectedIndex].text };
     loadPatientHistory(pid);
  };

  document.getElementById('new-presc-btn').onclick = () => {
     if (!selectedPatient) return window.mdsToast('Please select a patient first.', 'warning');
     document.getElementById('presc-patient-name').textContent = selectedPatient.name;
     modal.classList.add('open');
  };

  document.getElementById('presc-modal-close').onclick = () => modal.classList.remove('open');
  document.getElementById('presc-modal-cancel').onclick = () => modal.classList.remove('open');

  document.getElementById('add-med-row-btn').onclick = () => {
     const row = document.createElement('div');
     row.className = 'flex gap-4 med-row';
     row.style.marginBottom = '8px';
     row.innerHTML = `
        <input type="text" class="form-control med-name" placeholder="Medication" style="flex:2">
        <input type="text" class="form-control med-dosage" placeholder="Dosage" style="flex:1">
        <button class="btn btn-sm btn-ghost remove-med-row" type="button"><i class="fas fa-times"></i></button>
     `;
     document.getElementById('med-rows-container').appendChild(row);
     row.querySelector('.remove-med-row').onclick = () => row.remove();
  };

  document.getElementById('save-presc-btn').onclick = async () => {
     const medRows = document.querySelectorAll('.med-row');
     const medications = Array.from(medRows).map(r => ({
        name: r.querySelector('.med-name').value,
        dosage: r.querySelector('.med-dosage').value
     })).filter(m => m.name);

     if (medications.length === 0) return window.mdsToast('Add at least one medication.', 'warning');

     const data = {
        patient_id: selectedPatient.id,
        medications: medications,
        instructions: document.getElementById('presc-instructions').value,
        valid_until: document.getElementById('presc-valid-until').value
     };

     try {
        const saved = await api.prescriptions.create(data);
        window.mdsToast('Prescription saved!', 'success');
        modal.classList.remove('open');
        loadPatientHistory(selectedPatient.id);
        renderPrintView(saved);
     } catch (err) { window.mdsToast(err.message, 'error'); }
  };

  async function renderPrintView(presc) {
     const medications = typeof presc.medications === 'string' ? JSON.parse(presc.medications) : presc.medications;
     const settings = await api.settings.get('clinic_info');
     const clinic = typeof settings.setting_value === 'string' ? JSON.parse(settings.setting_value) : settings.setting_value;

     const printHtml = `
        <!DOCTYPE html>
        <html>
        <head>
          <title>Prescription - ${selectedPatient ? selectedPatient.name : 'MDS'}</title>
          <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css">
          <style>
            @page { size: A5; margin: 20mm; }
            body { font-family: 'Inter', sans-serif; color: #333; line-height: 1.5; padding: 20px; }
            .header { border-bottom: 2px solid #000; padding-bottom: 10px; margin-bottom: 20px; display: flex; justify-content: space-between; }
            .clinic-name { font-size: 20px; font-weight: 800; text-transform: uppercase; }
            .clinic-info { font-size: 10px; color: #666; }
            .presc-title { font-size: 24px; font-weight: 800; text-align: center; margin: 20px 0; color: #000; }
            .patient-section { background: #f9f9f9; padding: 15px; border-radius: 8px; margin-bottom: 20px; border-left: 4px solid #000; }
            .rx-symbol { font-size: 40px; font-weight: 800; font-family: serif; margin-bottom: 15px; }
            .med-table { width: 100%; border-collapse: collapse; margin-bottom: 30px; }
            .med-table td { padding: 10px 0; border-bottom: 1px dashed #ccc; }
            .med-name { font-weight: 700; font-size: 16px; }
            .med-dosage { font-style: italic; color: #555; }
            .footer { margin-top: 50px; display: flex; justify-content: space-between; align-items: flex-end; }
            .signature-box { width: 150px; border-top: 1px solid #000; padding-top: 5px; text-align: center; font-size: 11px; }
            @media print { .no-print { display: none; } }
          </style>
        </head>
        <body>
          <div class="header">
             <div>
                <div class="clinic-name">${clinic.name || 'MDS CLINIC'}</div>
                <div class="clinic-info">${clinic.address || ''} | ${clinic.phone || ''} | ${clinic.email || ''}</div>
             </div>
             <div style="font-size:12px; font-weight:700">DATE: ${new Date(presc.date).toLocaleDateString()}</div>
          </div>
          
          <div class="presc-title">MEDICAL PRESCRIPTION</div>
          
          <div class="patient-section">
             <div style="font-size:12px; color:#666">PATIENT:</div>
             <div style="font-size:18px; font-weight:700">${selectedPatient ? selectedPatient.name : 'Unknown Patient'}</div>
          </div>

          <div class="rx-symbol">℞</div>
          
          <table class="med-table">
             ${medications.map(m => `
                <tr>
                   <td class="med-name">${m.name}</td>
                   <td class="med-dosage" align="right">${m.dosage}</td>
                </tr>
             `).join('')}
          </table>

          <div style="margin-top:20px; min-height:80px">
             <div style="font-weight:700; font-size:12px; text-decoration:underline">INSTRUCTIONS:</div>
             <p style="font-size:14px">${presc.instructions || 'Apply as directed.'}</p>
          </div>

          <div class="footer">
             <div style="font-size:10px; color:#999">Valid until: ${presc.valid_until ? new Date(presc.valid_until).toLocaleDateString() : 'N/A'}</div>
             <div class="signature-box">Physician's Signature</div>
          </div>

          <div class="no-print" style="position:fixed; bottom:20px; right:20px;">
             <button onclick="window.print()" style="padding:12px 24px; background:#000; color:#fff; border:none; border-radius:50px; font-weight:700; cursor:pointer; box-shadow:0 10px 20px rgba(0,0,0,0.2)">
                <i class="fas fa-print"></i> Print Now
             </button>
          </div>
        </body>
        </html>
     `;

     const printWindow = window.open('', '_blank');
     printWindow.document.write(printHtml);
     printWindow.document.close();
  }

  init();
}
