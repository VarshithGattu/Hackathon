// Minimal frontend logic for demo purposes
const API = 'https://hackathon-0ll0.onrender.com/api';
// track which reminders we've notified this session to avoid duplicates
const notifiedReminders = new Set();
// confirmation callback holder
let _confirmCallback = null;

async function login(){
  if (!validateLogin()) return;
  const res = await fetch(API + '/auth/login', {
    method:'POST', headers:{'Content-Type':'application/json'},
    body: JSON.stringify({ email: document.getElementById('email').value, password: document.getElementById('password').value })
  });
  const data = await res.json();
  if (data.token){ localStorage.setItem('token', data.token); window.location='dashboard.html'; }
  else showToast('Login failed', 'danger');
}

async function register(){
  if (!validateRegister()) return;
  const body = {
    name: document.getElementById('name').value,
    email: document.getElementById('email').value,
    phone: document.getElementById('phone').value,
    password: document.getElementById('password').value
  };
  const res = await fetch(API + '/auth/register', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify(body) });
  const d = await res.json();
  showToast('Registered', 'success');
  window.location = 'index.html';
}

function tokenHeaders(){
  return { 'Content-Type':'application/json', Authorization: 'Bearer ' + localStorage.getItem('token') };
}

async function addMedicine(){
  if (!validateAddMedicine()) return;
  const body = {
    name: document.getElementById('mname').value,
    dosage: document.getElementById('mdose').value,
    schedule: (document.getElementById('mschedule').value||'').split(',').map(s=>s.trim()),
    startDate: document.getElementById('mstart').value || null,
    endDate: document.getElementById('mend').value || null,
    repeatPattern: document.getElementById('mrepeat').value,
    notes: document.getElementById('mnotes').value
  };
  const res = await fetch(API + '/medicines', { method:'POST', headers: tokenHeaders(), body: JSON.stringify(body) });
  const d = await res.json();
  showToast('Medicine added', 'success');
  window.location='dashboard.html';
}

async function loadTodayReminders(){
  const el = document.getElementById('reminderList');
  if (!el) return;
  const res = await fetch(API + '/reminders/today', { headers: tokenHeaders() });
  const list = await res.json();
  el.innerHTML = '';
  list.forEach(r => {
    const name = (r.medicineId && r.medicineId.name) ? r.medicineId.name : 'Unknown';
    const time = new Date(r.scheduledTime).toLocaleTimeString();
    // Create a flexible item that works with <ul> or <div class="list-group">
    const item = document.createElement('div');
    item.className = 'list-group-item d-flex justify-content-between align-items-center reminder-item';
  const left = document.createElement('div');
  const status = r.status || '';
  const badgeClass = statusBadgeClass(status);
  left.innerHTML = `<div class="fw-semibold">${escapeHtml(name)}</div><div class="small text-muted">${time} &nbsp; <span class="badge ${badgeClass}">${escapeHtml(status)}</span></div>`;
    const actions = document.createElement('div');
    actions.className = 'reminder-actions';

    const takeBtn = document.createElement('button'); takeBtn.className='btn btn-sm btn-success'; takeBtn.innerHTML = '<i class="fa-solid fa-check me-1"></i>Take'; takeBtn.onclick = ()=> mark(r._id,'Taken');
    const missBtn = document.createElement('button'); missBtn.className='btn btn-sm btn-outline-danger'; missBtn.innerHTML = '<i class="fa-solid fa-xmark me-1"></i>Miss'; missBtn.onclick = ()=> mark(r._id,'Missed');
    const snoozeBtn = document.createElement('button'); snoozeBtn.className='btn btn-sm btn-outline-secondary'; snoozeBtn.innerHTML = '<i class="fa-solid fa-bed me-1"></i>Snooze'; snoozeBtn.onclick = ()=> snooze(r._id,10);

    actions.appendChild(takeBtn);
    actions.appendChild(missBtn);
    actions.appendChild(snoozeBtn);

    item.appendChild(left);
    item.appendChild(actions);
    // add subtle animation
    item.classList.add('animate-in');
    el.appendChild(item);
  });
  // apply any search filter currently set
  applyReminderFilter();
  // trigger browser notifications for upcoming reminders
  triggerNotifications(list || []);
  // show empty state when no reminders
  if (!list || list.length === 0){
    const empty = document.createElement('div');
    empty.className = 'empty-state animate-in';
    empty.innerHTML = `<div class="icon"><i class="fa-solid fa-face-smile"></i></div><div class="fw-semibold">No reminders for today</div><div class="small text-muted mt-1">Add a medicine to start receiving reminders</div><div class="mt-3"><a href="addMedicine.html" class="btn btn-primary btn-sm">Add Medicine</a></div>`;
    el.appendChild(empty);
  }
}

async function mark(id, status){
  // confirm on Missed (destructive) action
  if (status === 'Missed'){
    showConfirm('Confirm mark missed', 'Are you sure you want to mark this reminder as missed?', 'Mark Missed', async ()=>{
      try{ await fetch(API + '/reminders/'+id+'/mark', { method:'PUT', headers: tokenHeaders(), body: JSON.stringify({ status }) }); showToast('Marked Missed','warning'); }
      catch(e){ showToast('Failed to mark reminder','danger'); }
      loadTodayReminders();
    });
    return;
  }
  try{ await fetch(API + '/reminders/'+id+'/mark', { method:'PUT', headers: tokenHeaders(), body: JSON.stringify({ status }) }); showToast('Marked ' + status, status === 'Taken' ? 'success' : 'info'); }
  catch(e){ showToast('Failed to mark reminder','danger'); }
  loadTodayReminders();
}

async function snooze(id, minutes){
  showConfirm('Snooze reminder', `Snooze for ${minutes} minutes?`, 'Snooze', async ()=>{
    try{ await fetch(API + '/reminders/'+id+'/snooze', { method:'PUT', headers: tokenHeaders(), body: JSON.stringify({ minutes }) }); showToast('Snoozed for ' + minutes + ' min', 'info'); }
    catch(e){ showToast('Failed to snooze','danger'); }
    loadTodayReminders();
  });
}

async function loadHistory(){
  const from = document.getElementById('from').value;
  const to = document.getElementById('to').value;
  const res = await fetch(API + '/reminders/history?from='+from+'&to='+to, { headers: tokenHeaders() });
  const list = await res.json();
  const el = document.getElementById('historyList');
  if (!el) return;
  el.innerHTML = '';
  list.forEach(r=>{
    const li = document.createElement('li');
    li.className = 'list-group-item';
    li.textContent = (r.medicineId && r.medicineId.name ? r.medicineId.name : '') + ' ' + new Date(r.scheduledTime).toLocaleString() + ' - ' + r.status;
    el.appendChild(li);
  });
}

function logout(){ localStorage.removeItem('token'); window.location='index.html'; }

// Auto-run on pages
document.addEventListener('DOMContentLoaded', ()=> {
  if (window.location.pathname.endsWith('dashboard.html') || window.location.pathname.endsWith('reminders.html')) {
    loadTodayReminders();
    setInterval(loadTodayReminders, 30*1000);
  }
});

// --- UI helpers: Toasts & Notifications ---
function ensureToastContainer(){
  if (document.getElementById('toastContainer')) return;
  const container = document.createElement('div');
  container.id = 'toastContainer';
  container.style.position = 'fixed';
  container.style.right = '20px';
  container.style.bottom = '20px';
  container.style.zIndex = 1080;
  document.body.appendChild(container);
}

function showToast(message, type = 'primary', timeout = 3000){
  ensureToastContainer();
  const container = document.getElementById('toastContainer');
  const toast = document.createElement('div');
  toast.className = `toast align-items-center text-bg-${type} border-0`;
  toast.setAttribute('role','alert');
  toast.setAttribute('aria-live','assertive');
  toast.setAttribute('aria-atomic','true');
  toast.style.minWidth = '200px';
  toast.innerHTML = `<div class="d-flex"><div class="toast-body">${escapeHtml(message)}</div><button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast" aria-label="Close"></button></div>`;
  container.appendChild(toast);
  const bsToast = new bootstrap.Toast(toast, { delay: timeout });
  bsToast.show();
  // remove from DOM after hidden
  toast.addEventListener('hidden.bs.toast', ()=> toast.remove());
}

async function requestNotificationPermission(){
  if (!('Notification' in window)) return;
  if (Notification.permission === 'default'){
    try{ await Notification.requestPermission(); }catch(e){}
  }
}

function showBrowserNotification(title, body){
  if (!('Notification' in window)) return;
  if (Notification.permission === 'granted'){
    try{ new Notification(title, { body }); }catch(e){}
  }
}

// --- client-side validation & confirmation modal helpers ---
function validateLogin(){
  const email = document.getElementById('email')?.value?.trim();
  const password = document.getElementById('password')?.value;
  if (!email) { showToast('Please enter your email','warning'); return false; }
  if (!password) { showToast('Please enter your password','warning'); return false; }
  return true;
}

function validateRegister(){
  const name = document.getElementById('name')?.value?.trim();
  const email = document.getElementById('email')?.value?.trim();
  const password = document.getElementById('password')?.value;
  if (!name) { showToast('Please enter your name','warning'); return false; }
  if (!email) { showToast('Please enter your email','warning'); return false; }
  if (!password || password.length < 6) { showToast('Password must be at least 6 characters','warning'); return false; }
  return true;
}

function validateAddMedicine(){
  const name = document.getElementById('mname')?.value?.trim();
  const schedule = document.getElementById('mschedule')?.value?.trim();
  if (!name) { showToast('Please enter medicine name','warning'); return false; }
  if (!schedule) { showToast('Please provide at least one schedule time','warning'); return false; }
  return true;
}

function showConfirm(title, message, confirmText = 'Confirm', onConfirm){
  ensureConfirmModal();
  _confirmCallback = onConfirm;
  const modalEl = document.getElementById('globalConfirmModal');
  if (!modalEl) return;
  modalEl.querySelector('.modal-title').textContent = title;
  modalEl.querySelector('.modal-body').textContent = message;
  modalEl.querySelector('.btn-confirm').textContent = confirmText;
  const bs = new bootstrap.Modal(modalEl);
  bs.show();
}

function ensureConfirmModal(){
  if (document.getElementById('globalConfirmModal')) return;
  const html = `
  <div class="modal fade" id="globalConfirmModal" tabindex="-1" aria-hidden="true">
    <div class="modal-dialog modal-sm modal-dialog-centered">
      <div class="modal-content">
        <div class="modal-header"><h5 class="modal-title"></h5><button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button></div>
        <div class="modal-body"></div>
        <div class="modal-footer"><button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancel</button><button type="button" class="btn btn-danger btn-confirm">Confirm</button></div>
      </div>
    </div>
  </div>`;
  const div = document.createElement('div'); div.innerHTML = html; document.body.appendChild(div.firstElementChild);
  // wire confirm button
  document.querySelector('#globalConfirmModal .btn-confirm').addEventListener('click', ()=>{
    const bs = bootstrap.Modal.getInstance(document.getElementById('globalConfirmModal'));
    bs.hide();
    try{ if (_confirmCallback) _confirmCallback(); }catch(e){ console.error(e); }
    _confirmCallback = null;
  });
}

function triggerNotifications(reminders){
  requestNotificationPermission();
  const now = Date.now();
  const soonWindow = 60 * 1000; // 1 minute
  reminders.forEach(r=>{
    if (!r || !r._id || r.status === 'Taken') return;
    const t = new Date(r.scheduledTime).getTime();
    if (isNaN(t)) return;
    const diff = t - now;
    if (diff <= soonWindow && diff >= -5*60*1000){ // within next 1 min or just passed up to 5m
      if (!notifiedReminders.has(r._id)){
        const name = r.medicineId?.name || 'Medicine reminder';
        showBrowserNotification('Reminder: ' + name, 'Scheduled at ' + new Date(r.scheduledTime).toLocaleTimeString());
        notifiedReminders.add(r._id);
      }
    }
  });
}

// --- Search/filter helpers for reminders page ---
function applyReminderFilter(){
  const qEl = document.getElementById('reminderSearch');
  const query = qEl ? qEl.value.trim().toLowerCase() : '';
  const list = document.getElementById('reminderList');
  if (!list) return;
  Array.from(list.children).forEach(item=>{
    const text = item.textContent || item.innerText || '';
    const match = !query || text.toLowerCase().includes(query);
    item.style.display = match ? '' : 'none';
  });
}

// status -> badge class mapping
function statusBadgeClass(status){
  if (!status) return 'bg-light text-muted';
  const s = String(status).toLowerCase();
  if (s === 'taken') return 'badge-status-taken';
  if (s === 'missed') return 'badge-status-missed';
  if (s === 'snoozed') return 'badge-status-snoozed';
  if (s === 'upcoming' || s === 'scheduled' || s === 'pending') return 'badge-status-upcoming';
  return 'bg-light text-muted';
}

// attach search handlers if present
document.addEventListener('DOMContentLoaded', ()=>{
  // request notification permission early
  requestNotificationPermission();

  const search = document.getElementById('reminderSearch');
  if (search){
    search.addEventListener('input', applyReminderFilter);
    const clear = document.getElementById('clearSearch');
    if (clear) clear.addEventListener('click', ()=>{ search.value=''; applyReminderFilter(); });
  }

  // If on dashboard, load adherence summary
  if (window.location.pathname.endsWith('dashboard.html')){
    loadAdherenceSummary();
  }
});

async function loadAdherenceSummary(){
  try{
    const to = new Date();
    const from = new Date(to.getTime() - 6*24*60*60*1000); // last 7 days
    const fmt = d => d.toISOString().slice(0,10);
    const res = await fetch(API + '/reminders/history?from=' + fmt(from) + '&to=' + fmt(to), { headers: tokenHeaders() });
    const list = await res.json();
    const total = list.length || 0;
    const taken = list.filter(r=> r.status === 'Taken').length;
    const percent = total ? Math.round((taken/total)*100) : 0;
    const pctEl = document.getElementById('adherencePercent');
    const bar = document.getElementById('adherenceBar');
    const text = document.getElementById('adherenceText');
    if (pctEl) pctEl.textContent = percent + '%';
    if (bar) { bar.style.width = percent + '%'; bar.setAttribute('aria-valuenow', percent); }
    if (text) text.textContent = `${taken} taken of ${total} scheduled in last 7 days`;
  }catch(e){ console.error(e); }
}

// simple HTML escape to avoid accidental injection when inserting names
function escapeHtml(unsafe) {
  return String(unsafe).replace(/[&<>"'`]/g, function (m) {
    return ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":"&#39;","`":"&#96;"})[m];
  });
}
