'use strict';

const $ = (s, root = document) => root.querySelector(s);
const $$ = (s, root = document) => [...root.querySelectorAll(s)];
const state = { user: null, csrfToken: '', allowedEmailDomain: 'utpuebla.edu.mx', rides: [], deferredInstall: null };

const els = {
  navToggle: $('#navToggle'), navLinks: $('#navLinks'), installBtn: $('#installBtn'), installHeroBtn: $('#installHeroBtn'), loginBtn: $('#loginBtn'), registerBtn: $('#registerBtn'), userMenuBtn: $('#userMenuBtn'), userInitial: $('#userInitial'), userName: $('#userName'),
  publishHeroBtn: $('#publishHeroBtn'), publishDashboardBtn: $('#publishDashboardBtn'), networkBadge: $('#networkBadge'), searchForm: $('#searchForm'), originFilter: $('#originFilter'), dateFilter: $('#dateFilter'), seatFilter: $('#seatFilter'), clearFilters: $('#clearFilters'), resultText: $('#resultText'), routesGrid: $('#routesGrid'), routesEmpty: $('#routesEmpty'), dashboard: $('#dashboard'), publishedList: $('#publishedList'), reservationList: $('#reservationList'), publishedCount: $('#publishedCount'), reservationCount: $('#reservationCount'), toastStack: $('#toastStack'),
  authModal: $('#authModal'), authForm: $('#authForm'), authMode: $('#authMode'), authTitle: $('#authTitle'), authSubtitle: $('#authSubtitle'), authName: $('#authName'), authStudentId: $('#authStudentId'), authEmail: $('#authEmail'), authPassword: $('#authPassword'), authSubmit: $('#authSubmit'), switchAuth: $('#switchAuth'),
  publishModal: $('#publishModal'), publishForm: $('#publishForm'), reserveModal: $('#reserveModal'), reserveForm: $('#reserveForm'), reserveRideId: $('#reserveRideId'), reserveTitle: $('#reserveTitle'), reserveSummary: $('#reserveSummary'), reserveSeats: $('#reserveSeats'), userModal: $('#userModal'), accountName: $('#accountName'), accountEmail: $('#accountEmail'), logoutBtn: $('#logoutBtn'), closeUserModal: $('#closeUserModal'), goDashboard: $('#goDashboard'), publicationUrl: $('#publicationUrl'), copyUrlBtn: $('#copyUrlBtn'), publicationNote: $('#publicationNote'), pwaStatus: $('#pwaStatus')
};

function el(tag, className, text) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text !== undefined) node.textContent = text;
  return node;
}
function money(value) { return new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN', maximumFractionDigits: 0 }).format(value); }
function dateTime(value) { return new Intl.DateTimeFormat('es-MX', { weekday: 'short', day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' }).format(new Date(value)); }
function toast(message, type = 'ok') {
  const node = el('div', `toast ${type === 'error' ? 'error' : type === 'warn' ? 'warn' : ''}`, message);
  els.toastStack.append(node); setTimeout(() => node.remove(), 4300);
}
function setBusy(button, busy, label = 'Procesando…') {
  if (!button) return; if (busy) { button.dataset.oldText = button.textContent; button.textContent = label; button.disabled = true; } else { button.textContent = button.dataset.oldText || button.textContent; button.disabled = false; }
}
async function api(path, options = {}) {
  const method = options.method || 'GET';
  const headers = { ...(options.headers || {}) };
  if (options.body && typeof options.body !== 'string') { headers['Content-Type'] = 'application/json'; options.body = JSON.stringify(options.body); }
  if (!['GET', 'HEAD'].includes(method) && state.csrfToken) headers['X-CSRF-Token'] = state.csrfToken;
  const response = await fetch(path, { ...options, method, headers, credentials: 'same-origin' });
  let data = {};
  try { data = await response.json(); } catch {}
  if (!response.ok) { const error = new Error(data.error || `Error ${response.status}`); error.status = response.status; throw error; }
  return data;
}
function updateNetwork() {
  const online = navigator.onLine;
  els.networkBadge.textContent = online ? '● En línea' : '● Sin conexión';
  els.networkBadge.classList.toggle('offline', !online);
  if (!online) toast('Estás sin conexión. Puedes consultar la última lista guardada, pero no modificar datos.', 'warn');
}

async function loadSession() {
  try {
    const data = await api('/api/session'); state.user = data.user; state.csrfToken = data.csrfToken; state.allowedEmailDomain = data.allowedEmailDomain || 'utpuebla.edu.mx'; renderAuthState();
  } catch { renderAuthState(); }
}
function renderAuthState() {
  const logged = !!state.user;
  els.loginBtn.hidden = logged; els.registerBtn.hidden = logged; els.userMenuBtn.hidden = !logged; els.dashboard.hidden = !logged;
  if (logged) {
    els.userName.textContent = state.user.name.split(' ')[0]; els.userInitial.textContent = state.user.name.trim().charAt(0).toUpperCase(); els.accountName.textContent = state.user.name; els.accountEmail.textContent = state.user.email;
    loadDashboard().catch(() => {});
  }
}
function openAuth(mode = 'login') {
  els.authMode.value = mode; const register = mode === 'register';
  $$('.register-only', els.authForm).forEach(n => n.hidden = !register);
  els.authTitle.textContent = register ? 'Crear cuenta' : 'Iniciar sesión';
  els.authSubtitle.textContent = register ? `Regístrate con un correo @${state.allowedEmailDomain}.` : 'Accede a tus rutas y reservaciones.';
  els.authSubmit.textContent = register ? 'Crear cuenta segura' : 'Entrar'; els.switchAuth.textContent = register ? '¿Ya tienes cuenta? Inicia sesión' : '¿No tienes cuenta? Regístrate';
  els.authPassword.autocomplete = register ? 'new-password' : 'current-password';
  if (!els.authModal.open) els.authModal.showModal();
}

function routeInfoCell(label, value) { const box = el('div'); box.append(el('span', '', label), el('b', '', value)); return box; }
function renderRoutes(rides) {
  state.rides = rides; els.routesGrid.replaceChildren(); els.routesEmpty.hidden = rides.length > 0; els.resultText.textContent = `${rides.length} ruta${rides.length === 1 ? '' : 's'} disponible${rides.length === 1 ? '' : 's'}`;
  for (const ride of rides) {
    const card = el('article', 'route-card');
    const top = el('div', 'route-top'); const place = el('div', 'route-place'); const pin = el('div', 'route-pin', '📍'); const ptxt = el('div'); ptxt.append(el('small', '', 'Salida'), el('b', '', ride.origin)); place.append(pin, ptxt); top.append(place, el('span', 'route-badge', `${ride.seatsAvailable} lugar${ride.seatsAvailable === 1 ? '' : 'es'}`));
    const info = el('div', 'route-info'); info.append(routeInfoCell('Salida', dateTime(ride.departureAt)), routeInfoCell('Aportación', `${money(ride.contribution)} / lugar`), routeInfoCell('Punto', ride.pickupPoint), routeInfoCell('Vehículo', `${ride.vehicle} · ${ride.color}`));
    const driver = el('div', 'route-driver'); const driverMain = el('div', 'driver-main'); const avatar = el('div', 'avatar', ride.driver.name.charAt(0).toUpperCase()); const dtext = el('div', 'route-driver'); const nameWrap = el('div'); nameWrap.append(el('small', '', 'Conduce'), el('b', '', ride.driver.name)); driverMain.append(avatar, nameWrap); driver.append(driverMain, ride.driver.verified ? el('span', 'verified', '✓ Institucional') : el('span', 'verified', 'Cuenta'));
    card.append(top, el('div', 'route-line'), info, driver);
    if (ride.notes) card.append(el('p', 'route-notes', ride.notes));
    const actions = el('div', 'route-actions');
    const reserveBtn = el('button', 'btn primary', state.user && state.user.id === ride.driver.id ? 'Tu ruta' : 'Reservar'); reserveBtn.type = 'button'; reserveBtn.disabled = ride.seatsAvailable < 1 || (state.user && state.user.id === ride.driver.id); reserveBtn.addEventListener('click', () => openReserve(ride));
    actions.append(reserveBtn); card.append(actions); els.routesGrid.append(card);
  }
}
async function loadRides() {
  const params = new URLSearchParams(); const origin = els.originFilter.value.trim(); const date = els.dateFilter.value; const seats = els.seatFilter.value;
  if (origin) params.set('origin', origin);
  if (date) { const start = new Date(`${date}T00:00:00`); const end = new Date(start); end.setDate(end.getDate() + 1); params.set('from', start.toISOString()); params.set('to', end.toISOString()); }
  if (seats) params.set('seats', seats);
  try {
    const data = await api(`/api/rides?${params}`); renderRoutes(data.rides); localStorage.setItem('rodando:lastRides', JSON.stringify({ at: Date.now(), rides: data.rides }));
  } catch (e) {
    const saved = JSON.parse(localStorage.getItem('rodando:lastRides') || 'null');
    if (saved?.rides) { renderRoutes(saved.rides); els.resultText.textContent += ' · copia offline'; toast('Mostrando la última lista guardada.', 'warn'); }
    else { els.resultText.textContent = 'No se pudieron cargar las rutas.'; els.routesEmpty.hidden = false; }
  }
}

function requireLogin(action = 'continuar') { if (state.user) return true; toast(`Inicia sesión para ${action}.`, 'warn'); openAuth('login'); return false; }
function openPublish() { if (!requireLogin('publicar una ruta')) return; if (!navigator.onLine) return toast('Necesitas conexión para publicar una ruta.', 'warn'); const dt = els.publishForm.elements.departureAt; const d = new Date(Date.now() + 3600000); d.setMinutes(Math.ceil(d.getMinutes() / 5) * 5, 0, 0); dt.value = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}T${String(d.getHours()).padStart(2,'0')}:${String(d.getMinutes()).padStart(2,'0')}`; els.publishModal.showModal(); }
function openReserve(ride) {
  if (!requireLogin('reservar un lugar')) return; if (!navigator.onLine) return toast('Necesitas conexión para reservar.', 'warn');
  els.reserveRideId.value = ride.id; els.reserveTitle.textContent = `${ride.origin} → UTP`; els.reserveSummary.textContent = `${dateTime(ride.departureAt)} · ${ride.pickupPoint} · ${money(ride.contribution)} por persona · conduce ${ride.driver.name}.`;
  els.reserveSeats.replaceChildren(); for (let i = 1; i <= Math.min(ride.seatsAvailable, 4); i++) { const option = el('option', '', `${i} lugar${i === 1 ? '' : 'es'}`); option.value = i; els.reserveSeats.append(option); }
  els.reserveModal.showModal();
}

async function loadDashboard() {
  if (!state.user) return;
  try {
    const data = await api('/api/dashboard'); renderDashboard(data);
  } catch (e) { if (e.status === 401) { state.user = null; renderAuthState(); } }
}
function dashStatus(status) { const labels = { active: 'Activa', cancelled: 'Cancelada', completed: 'Completada', confirmed: 'Confirmada' }; return labels[status] || status; }
function renderDashboard(data) {
  els.publishedList.replaceChildren(); els.reservationList.replaceChildren(); els.publishedCount.textContent = data.published.length; els.reservationCount.textContent = data.reservations.filter(x => x.reservationStatus === 'confirmed').length;
  if (!data.published.length) els.publishedList.append(el('div', 'dash-empty', 'Aún no has publicado rutas.'));
  for (const ride of data.published) {
    const item = el('div', 'dash-item'); const top = el('div', 'dash-item-top'); const b = el('b', '', `${ride.origin} → UTP`); const status = el('span', `status-pill ${ride.status === 'cancelled' ? 'cancelled' : ''}`, dashStatus(ride.status)); top.append(b, status); item.append(top, el('p','',`${dateTime(ride.departureAt)} · ${ride.seatsAvailable}/${ride.seatsTotal} lugares libres · ${money(ride.contribution)}`));
    if (ride.passengers?.length) { const people = el('p','',`Reservas: ${ride.passengers.map(p => `${p.name} (${p.seats})`).join(', ')}`); item.append(people); }
    if (ride.status === 'active' && new Date(ride.departureAt) > new Date()) { const cancel = el('button','btn danger','Cancelar ruta'); cancel.type='button'; cancel.addEventListener('click', () => cancelRide(ride.id)); item.append(cancel); }
    els.publishedList.append(item);
  }
  if (!data.reservations.length) els.reservationList.append(el('div', 'dash-empty', 'Aún no has realizado reservaciones.'));
  for (const entry of data.reservations) {
    const ride = entry.ride; const item = el('div','dash-item'); const top = el('div','dash-item-top'); top.append(el('b','',`${ride.origin} → UTP`), el('span',`status-pill ${entry.reservationStatus === 'cancelled' ? 'cancelled':''}`,dashStatus(entry.reservationStatus))); item.append(top,el('p','',`${dateTime(ride.departureAt)} · ${entry.reservedSeats} lugar${entry.reservedSeats === 1 ? '' : 'es'} · ${ride.driver.name}`));
    if (entry.reservationStatus === 'confirmed' && entry.driverContact) item.append(el('p','',`Contacto del conductor: ${entry.driverContact}`));
    if (entry.reservationStatus === 'confirmed' && ride.status === 'active' && new Date(ride.departureAt) > new Date()) { const cancel = el('button','btn danger','Cancelar reserva'); cancel.type='button'; cancel.addEventListener('click', () => cancelReservation(ride.id)); item.append(cancel); }
    els.reservationList.append(item);
  }
}
async function cancelRide(id) { if (!confirm('¿Cancelar esta ruta? Los pasajeros dejarán de verla como disponible.')) return; try { await api(`/api/rides/${id}`,{method:'DELETE'}); toast('Ruta cancelada.'); await Promise.all([loadRides(),loadDashboard()]); } catch(e){ toast(e.message,'error'); } }
async function cancelReservation(id) { if (!confirm('¿Cancelar tu reservación? Los lugares volverán a estar disponibles.')) return; try { await api(`/api/rides/${id}/reserve`,{method:'DELETE'}); toast('Reservación cancelada.'); await Promise.all([loadRides(),loadDashboard()]); } catch(e){ toast(e.message,'error'); } }


$$('.modal-close').forEach(btn => btn.addEventListener('click', e => { e.preventDefault(); btn.closest('dialog')?.close(); }));
$$('button[value="cancel"]').forEach(btn => btn.addEventListener('click', e => { e.preventDefault(); btn.closest('dialog')?.close(); }));

els.authForm.addEventListener('submit', async e => {
  e.preventDefault(); const mode = els.authMode.value; const body = { email: els.authEmail.value, password: els.authPassword.value };
  if (mode === 'register') { body.name = els.authName.value; body.studentId = els.authStudentId.value; }
  setBusy(els.authSubmit,true,mode === 'register'?'Creando cuenta…':'Entrando…');
  try { const data = await api(mode === 'register' ? '/api/register' : '/api/login',{method:'POST',body}); state.user=data.user; state.csrfToken=data.csrfToken; renderAuthState(); els.authModal.close(); els.authForm.reset(); toast(mode === 'register'?'Cuenta creada. Ya puedes publicar y reservar.':'Sesión iniciada.'); await Promise.all([loadRides(),loadDashboard()]); }
  catch(err){ toast(err.message,'error'); } finally { setBusy(els.authSubmit,false); }
});
els.switchAuth.addEventListener('click',()=>openAuth(els.authMode.value==='login'?'register':'login'));
els.loginBtn.addEventListener('click',()=>openAuth('login')); els.registerBtn.addEventListener('click',()=>openAuth('register'));
els.publishHeroBtn.addEventListener('click',openPublish); els.publishDashboardBtn.addEventListener('click',openPublish);

els.publishForm.addEventListener('submit', async e => {
  e.preventDefault(); if (!navigator.onLine) return toast('Necesitas conexión para publicar.', 'warn'); const fd = new FormData(els.publishForm); const localDate = String(fd.get('departureAt') || ''); const d = new Date(localDate);
  const body = { origin:fd.get('origin'), pickupPoint:fd.get('pickupPoint'), departureAt:Number.isNaN(d.getTime())?localDate:d.toISOString(), seatsTotal:Number(fd.get('seatsTotal')), contribution:Number(fd.get('contribution')), vehicle:fd.get('vehicle'), color:fd.get('color'), plateLast4:fd.get('plateLast4'), notes:fd.get('notes') };
  setBusy($('#publishSubmit'),true,'Publicando…');
  try { await api('/api/rides',{method:'POST',body}); els.publishModal.close(); els.publishForm.reset(); toast('Ruta publicada correctamente.'); await Promise.all([loadRides(),loadDashboard()]); }
  catch(err){ toast(err.message,'error'); } finally { setBusy($('#publishSubmit'),false); }
});
els.reserveForm.addEventListener('submit', async e => {
  e.preventDefault(); const id=els.reserveRideId.value; setBusy($('#reserveSubmit'),true,'Reservando…');
  try { await api(`/api/rides/${id}/reserve`,{method:'POST',body:{seats:Number(els.reserveSeats.value)}}); els.reserveModal.close(); toast('Reservación confirmada.'); await Promise.all([loadRides(),loadDashboard()]); }
  catch(err){ toast(err.message,'error'); } finally { setBusy($('#reserveSubmit'),false); }
});

els.searchForm.addEventListener('submit',e=>{e.preventDefault();loadRides();}); els.clearFilters.addEventListener('click',()=>{els.searchForm.reset();els.seatFilter.value='1';loadRides();});
els.userMenuBtn.addEventListener('click',()=>els.userModal.showModal()); els.closeUserModal.addEventListener('click',()=>els.userModal.close()); els.goDashboard.addEventListener('click',()=>els.userModal.close());
els.logoutBtn.addEventListener('click',async()=>{try{await api('/api/logout',{method:'POST'});}catch{} state.user=null;state.csrfToken='';els.userModal.close();renderAuthState();await loadSession();toast('Sesión cerrada.');});
els.navToggle.addEventListener('click',()=>{const open=els.navLinks.classList.toggle('open');els.navToggle.setAttribute('aria-expanded',String(open));}); $$('.nav-links a').forEach(a=>a.addEventListener('click',()=>els.navLinks.classList.remove('open')));

window.addEventListener('online',()=>{updateNetwork();loadRides();});
window.addEventListener('offline',updateNetwork);

function isStandalone() {
  return window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone === true;
}
function updatePwaStatus(label) {
  if (!els.pwaStatus) return;
  els.pwaStatus.textContent = label || (isStandalone() ? '✓ PWA instalada' : 'PWA lista');
  els.pwaStatus.classList.toggle('installed', isStandalone());
}
async function requestInstall() {
  if (isStandalone()) return toast('Rodando UTP ya está instalada en este dispositivo.');
  if (!state.deferredInstall) {
    toast('Si no aparece el instalador, usa el menú del navegador → Instalar Rodando UTP.', 'warn');
    return;
  }
  state.deferredInstall.prompt();
  const choice = await state.deferredInstall.userChoice;
  if (choice.outcome === 'accepted') toast('Instalación aceptada.');
  state.deferredInstall = null;
  els.installBtn.hidden = true;
}

window.addEventListener('beforeinstallprompt',e=>{
  e.preventDefault();
  state.deferredInstall=e;
  els.installBtn.hidden=false;
  updatePwaStatus('✓ PWA instalable');
});
els.installBtn.addEventListener('click',requestInstall);
els.installHeroBtn?.addEventListener('click',requestInstall);
window.addEventListener('appinstalled',()=>{
  els.installBtn.hidden=true;
  state.deferredInstall=null;
  updatePwaStatus('✓ PWA instalada');
  toast('Rodando UTP quedó instalada.');
});

function renderPublicationUrl() {
  if (!els.publicationUrl) return;
  const url = `${location.origin}${location.pathname === '/' ? '' : location.pathname}`;
  els.publicationUrl.textContent = url;
  const published = location.protocol === 'https:' && !['localhost','127.0.0.1'].includes(location.hostname);
  if (els.publicationNote) {
    els.publicationNote.textContent = published
      ? 'Esta es la URL pública de la aplicación. Puedes anexarla directamente a tu entrega.'
      : 'Estás ejecutando la aplicación de manera local. Para tu entrega final publícala en un servidor Node con HTTPS y esta sección mostrará automáticamente la URL pública.';
  }
}
els.copyUrlBtn?.addEventListener('click', async () => {
  try {
    await navigator.clipboard.writeText(els.publicationUrl.textContent);
    toast('URL copiada al portapapeles.');
  } catch {
    toast('No se pudo copiar automáticamente. Selecciona la URL manualmente.', 'warn');
  }
});

if ('serviceWorker' in navigator) {
  window.addEventListener('load', async () => {
    try {
      await navigator.serviceWorker.register('/service-worker.js');
      updatePwaStatus();
    } catch {
      updatePwaStatus('Service Worker no disponible');
    }
  });
}

(async function init(){
  renderPublicationUrl();
  updatePwaStatus();
  updateNetwork();
  await loadSession();
  await loadRides();
})();
