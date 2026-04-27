function rid(){
  return 'id' + Math.random().toString(16).slice(2) + Math.random().toString(16).slice(2);
}

function today(){
  const d = new Date();
  return d.toISOString().slice(0, 10);
}

function nowHM(){
  const d = new Date();
  return ('0' + d.getHours()).slice(-2) + ':' + ('0' + d.getMinutes()).slice(-2);
}

function fmt(dt){
  if(!dt) return '—';
  const x = new Date(dt);
  if(isNaN(x * 1)) return dt;
  const y = x.getFullYear();
  const m = ('0' + (x.getMonth() + 1)).slice(-2);
  const d = ('0' + x.getDate()).slice(-2);
  const hh = ('0' + x.getHours()).slice(-2);
  const mm = ('0' + x.getMinutes()).slice(-2);
  return `${y}-${m}-${d} ${hh}:${mm}`;
}

function fmtMinutes(min){
  if(min === null || min === undefined || isNaN(min)) return '—';
  const h = Math.floor(min / 60);
  const m = min % 60;
  if(h <= 0) return `${m} min`;
  return `${h} val. ${m} min`;
}

function safeTrim(s){
  return (s || '').toString().trim();
}

function getCompanyId(){
  const user = currentUser ? currentUser() : null;

  return (
    user?.companyId ||
    user?.company_id ||
    db?.session?.currentUser?.companyId ||
    db?.session?.currentUser?.company_id ||
    localStorage.getItem('company_id') ||
    null
  );
}

function escapeHtml(s){
  return (s || '').toString()
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

function tabBtn(key, label, active){
  const cls = 'btn' + (key === active ? ' primary' : '');
  return `<button class="${cls}" data-tab="${key}">${label}</button>`;
}

function isTaskExpanded(key){
  if(!db.session) db.session = {};
  if(!db.session.taskExpanded) db.session.taskExpanded = {};
  return !!db.session.taskExpanded[key];
}

function toggleTaskExpanded(key){
  if(!db.session) db.session = {};
  if(!db.session.taskExpanded) db.session.taskExpanded = {};
  db.session.taskExpanded[key] = !db.session.taskExpanded[key];
  saveDB_local(db);
  render();
}

function taskShortSummary(t){
  const comments = Array.isArray(t.progressLog) ? t.progressLog.length : 0;

  const files = (db.taskFiles || []).filter(f => {
    return String(f.taskId) === String(t.id) ||
      (t?.fromNoteId && String(f.noteId) === String(t.fromNoteId));
  }).length;

  const bits = [];
  if(t.initialComment) bits.push('yra pradinis komentaras');
  if(comments) bits.push(`komentarų: ${comments}`);
  if(files) bits.push(`failų: ${files}`);

  return bits.length ? bits.join(' • ') : 'be komentarų ir failų';
}

function getOrCreateDeviceId(){
  let id = localStorage.getItem('vkr_device_id');
  if(id) return id;

  id = 'dev_' + Math.random().toString(36).slice(2,10) + Date.now().toString(36);
  localStorage.setItem('vkr_device_id', id);
  return id;
}

function getDeviceName(){
  return localStorage.getItem('vkr_device_name') || '';
}

function setDeviceName(name){
  localStorage.setItem('vkr_device_name', safeTrim(name || ''));
}

function getDeviceCode(){
  return localStorage.getItem('vkr_device_code') || '';
}

function setDeviceCode(code){
  localStorage.setItem('vkr_device_code', safeTrim(code || '').toUpperCase());
}

function userDisplay(uid){
  const u = (db.users || []).find(x => x.id === uid);
  return u ? (u.display || u.username) : '(nenurodyta)';
}

function usersByRole(role){
  return (db.users || []).filter(u => u.role === role);
}

function labelEquip(eid){
  const e = (db.equipment || []).find(x => x.id === eid);
  if(e) return `${e.type || 'Technika'}${e.num ? (' Nr. ' + e.num) : ''}`;

  const g = (db.grabs || []).find(x => x.id === eid);
  if(g) return g.label || eid;

  return eid || '';
}

function defaultChecklistTemplate(){
  return [
    { textLt: 'Variklio tepalas', textRu: 'Моторное масло' },
    { textLt: 'Hidraulikos tepalas', textRu: 'Гидравлическое масло' },
    { textLt: 'Greičių dėžės tepalas', textRu: 'Масло коробки передач' },
    { textLt: 'Aušinimo skystis', textRu: 'Охлаждающая жидкость' },
    { textLt: 'Langų apiplovimo skystis', textRu: 'Жидкость омывателя стекла' },
    { textLt: 'Tepimo bakelio papildymas', textRu: 'Пополнение бака смазки' },
    { textLt: 'Vizualinė apžiūra: mašinos', textRu: 'Визуальный осмотр машины' },
    { textLt: 'Vizualinė apžiūra: hidraulinių žarnų', textRu: 'Визуальный осмотр гидравлических шлангов' },
    { textLt: 'Vizualinė apžiūra: ratų', textRu: 'Визуальный осмотр колёс' },
    { textLt: 'Rankinis tepimo taškų pratepimas', textRu: 'Ручная смазка точек смазки' },
    { textLt: 'Pridėti nuo savęs', textRu: 'Добавить от себя' }
  ];
}

async function ensureDefaultChecklistForEquipment(equipId){
  if(!equipId) return true;

  if(!db.equipmentChecklists) db.equipmentChecklists = {};
  if(!db.equipmentChecklists[equipId]) db.equipmentChecklists[equipId] = [];

  const existing = db.equipmentChecklists[equipId] || [];
  const defaults = defaultChecklistTemplate();

  let nextSort = existing.length
    ? Math.max(...existing.map(x => Number(x.sortOrder || 0))) + 1
    : 1;

  for(const item of defaults){
    const alreadyExists = (db.equipmentChecklists[equipId] || []).some(x =>
      safeTrim(x.textLt || x.text).toLowerCase() === safeTrim(item.textLt).toLowerCase()
    );

    if(alreadyExists) continue;

    const { data, error } = await sb
      .from('equipment_checklists')
      .insert([{
        equip_id: equipId,
        item_text_lt: item.textLt,
        item_text_ru: item.textRu,
        item_text: item.textLt,
        sort_order: nextSort,
        is_active: true
      }])
      .select()
      .single();

    if(error){
      console.error('Nepavyko užtikrinti default checklist:', error);
      return false;
    }

    db.equipmentChecklists[equipId].push({
      id: data.id,
      textLt: data.item_text_lt || '',
      textRu: data.item_text_ru || '',
      sortOrder: data.sort_order || 0
    });

    nextSort++;
  }

  db.equipmentChecklists[equipId] = db.equipmentChecklists[equipId]
    .slice()
    .sort((a,b) => Number(a.sortOrder || 0) - Number(b.sortOrder || 0));

  return true;
}

async function ensureDefaultChecklistsForAllEquipment(){
  if(!db.equipmentChecklists) db.equipmentChecklists = {};

  for(const e of (db.equipment || [])){
    const ok = await ensureDefaultChecklistForEquipment(e.id);
    if(!ok){
      console.warn('Nepavyko užkrauti default punktų technikai:', e.id);
    }
  }

  saveDB_local(db);
}

async function boot(){
  const local = loadDB_local();
  db = local || seedDB();

  await restoreSessionFromAuth();

  const usersFromCloud = await loadUsersFromSupabase();
  if(Array.isArray(usersFromCloud) && usersFromCloud.length) db.users = usersFromCloud;

  const tasksFromCloud = await loadTasksFromSupabase();
  if(Array.isArray(tasksFromCloud) && tasksFromCloud.length) db.tasks = tasksFromCloud;

  const taskFilesFromCloud = await loadTaskFilesFromSupabase();
  if(Array.isArray(taskFilesFromCloud) && taskFilesFromCloud.length) db.taskFiles = taskFilesFromCloud;

  const equipmentFromCloud = await loadEquipmentFromSupabase();
  if(Array.isArray(equipmentFromCloud) && equipmentFromCloud.length) db.equipment = equipmentFromCloud;

  const grabsFromCloud = await loadGrabsFromSupabase();
  if(Array.isArray(grabsFromCloud) && grabsFromCloud.length) db.grabs = grabsFromCloud;

  const notesFromCloud = await loadNotesFromSupabase();
  if(Array.isArray(notesFromCloud) && notesFromCloud.length) db.notes = notesFromCloud;

  const approvalsFromCloud = await loadApprovalsFromSupabase();
  if(Array.isArray(approvalsFromCloud) && approvalsFromCloud.length) db.approvals = approvalsFromCloud;

  const completedFromCloud = await loadCompletedFromSupabase();
  if(Array.isArray(completedFromCloud) && completedFromCloud.length) db.completed = completedFromCloud;

  const lubeFromCloud = await loadLubeFromSupabase();
  if(lubeFromCloud && Object.keys(lubeFromCloud).length) db.lube = lubeFromCloud;

  const dailyChecksFromCloud = await loadDailyChecksFromSupabase();
  if(Array.isArray(dailyChecksFromCloud) && dailyChecksFromCloud.length) db.dailyChecks = dailyChecksFromCloud;

  const devicesFromCloud = await loadDevicesFromSupabase();
  if(Array.isArray(devicesFromCloud) && devicesFromCloud.length) db.devices = devicesFromCloud;

  const checklistsFromCloud = await loadEquipmentChecklistsFromSupabase();
  if(checklistsFromCloud && Object.keys(checklistsFromCloud).length) db.equipmentChecklists = checklistsFromCloud;

  // NAUJA: automatiškai užtikrinam default punktus visai technikai
  await ensureDefaultChecklistsForAllEquipment();

  saveDB_local(db);
  render();
}

async function reloadCoreData(){
  const usersFromCloud = await loadUsersFromSupabase();
  if(Array.isArray(usersFromCloud) && usersFromCloud.length) db.users = usersFromCloud;

  const tasksFromCloud = await loadTasksFromSupabase();
  if(Array.isArray(tasksFromCloud) && tasksFromCloud.length) db.tasks = tasksFromCloud;

  const taskFilesFromCloud = await loadTaskFilesFromSupabase();
  if(Array.isArray(taskFilesFromCloud) && taskFilesFromCloud.length) db.taskFiles = taskFilesFromCloud;

  const equipmentFromCloud = await loadEquipmentFromSupabase();
  if(Array.isArray(equipmentFromCloud) && equipmentFromCloud.length) db.equipment = equipmentFromCloud;

  const grabsFromCloud = await loadGrabsFromSupabase();
  if(Array.isArray(grabsFromCloud) && grabsFromCloud.length) db.grabs = grabsFromCloud;

  const notesFromCloud = await loadNotesFromSupabase();
  if(Array.isArray(notesFromCloud) && notesFromCloud.length) db.notes = notesFromCloud;

  const approvalsFromCloud = await loadApprovalsFromSupabase();
  if(Array.isArray(approvalsFromCloud) && approvalsFromCloud.length) db.approvals = approvalsFromCloud;

  const completedFromCloud = await loadCompletedFromSupabase();
  if(Array.isArray(completedFromCloud) && completedFromCloud.length) db.completed = completedFromCloud;

  const lubeFromCloud = await loadLubeFromSupabase();
  if(lubeFromCloud && Object.keys(lubeFromCloud).length) db.lube = lubeFromCloud;

  const dailyChecksFromCloud = await loadDailyChecksFromSupabase();
  if(Array.isArray(dailyChecksFromCloud) && dailyChecksFromCloud.length) db.dailyChecks = dailyChecksFromCloud;

  const devicesFromCloud = await loadDevicesFromSupabase();
  if(Array.isArray(devicesFromCloud) && devicesFromCloud.length) db.devices = devicesFromCloud;

  const checklistsFromCloud = await loadEquipmentChecklistsFromSupabase();
  if(checklistsFromCloud && Object.keys(checklistsFromCloud).length) db.equipmentChecklists = checklistsFromCloud;

  // NAUJA
  await ensureDefaultChecklistsForAllEquipment();
}

function labelAssetForSelect(assetId){
  if(!db || !Array.isArray(db.grabs)) return labelEquip(assetId);
  const g = db.grabs.find(x => x && x.id === assetId);
  if(!g) return labelEquip(assetId);
  const parent = g.parentEquipId ? labelEquip(g.parentEquipId) : '—';
  return `${g.label || g.id} (priskirta: ${parent})`;
}

function parentOfAsset(assetId){
  if(!db || !Array.isArray(db.grabs)) return '—';
  const g = db.grabs.find(x => x && x.id === assetId);
  if(!g) return '—';
  return g.parentEquipId ? labelEquip(g.parentEquipId) : '—';
}

function taskSortKey(t){
  const created = Number(t.createdAt || t.startedAt || 0);

  const lastProgress = Array.isArray(t.progressLog) && t.progressLog.length
    ? new Date(t.progressLog[t.progressLog.length - 1].date || 0).getTime()
    : 0;

  return Math.max(created, isNaN(lastProgress) ? 0 : lastProgress);
}

function sortNewestFirst(arr){
  return (arr || []).slice().sort((a,b)=>taskSortKey(b)-taskSortKey(a));
}

function seenInfo(t){
  const ids = t.seenBy ? Object.keys(t.seenBy) : [];
  if(!ids.length) return 'Nematė niekas';
  return 'Matė: ' + ids.map(uid => userDisplay(uid)+' ('+fmt(t.seenBy[uid])+')').join(', ');
}

function isSeen(t, userId){
  return !!(t.seenBy && t.seenBy[userId]);
}

function mechanicVisibleTasks(userId){
  return (db.tasks || []).filter(t=>{
    return (
      t.status === 'Nauja' ||
      t.status === 'Vykdoma'
    );
  });
}

function mechanicWaitingTasks(userId){
  return (db.tasks || []).filter(t=>{
    return (
      t.status === 'Perduota vadovui' ||
      t.status === 'Laukianti'
    );
  });
}

function unseenForMechanic(userId){
  return mechanicVisibleTasks(userId).filter(t=>!isSeen(t,userId));
}

function changePasswordUI(user){
  return `
    <div class="card">
      <div class="headerline">
        <h3 style="margin:0">Slaptažodis</h3>
        <div class="right">
          <button class="btn" id="pwBack">Grįžti</button>
        </div>
      </div>

      <div class="row row-3" style="margin-top:12px">
        <div>
          <div class="muted">Dabartinis slaptažodis</div>
          <input id="pwOld" type="password" placeholder="Įvesk dabartinį slaptažodį">
        </div>

        <div>
          <div class="muted">Naujas</div>
          <input id="pwNew" type="password" placeholder="Įvesk naują slaptažodį">
        </div>

        <div>
          <div class="muted">Pakartoti</div>
          <input id="pwNew2" type="password" placeholder="Pakartok naują slaptažodį">
        </div>
      </div>

      <div class="right" style="margin-top:12px">
        <button class="btn primary" id="pwSave">Išsaugoti</button>
      </div>

      <div class="muted" style="font-size:12px; margin-top:10px" id="pwMsg"></div>
    </div>
  `;
}

function taskIsAttention(t){
  return t.status === 'Nauja' || t.status === 'Perduota vadovui' || t.status === 'Perduota tvirtinimui';
}

function bindChangePassword(user){
  const saveBtn = document.getElementById('pwSave');
  const backBtn = document.getElementById('pwBack');

  if(backBtn){
    backBtn.onclick = ()=>{
      if(user?.role === 'admin'){
        db.session.adminView = 'tasks';
      } else if(user?.role === 'mechanic'){
        db.session.mechView = 'tasks';
      } else if(user?.role === 'operator'){
        db.session.opView = 'home';
      }

      saveDB_local(db);
      render();
    };
  }

  if(!saveBtn) return;

  saveBtn.onclick = async ()=>{
    const oldPass = safeTrim(document.getElementById('pwOld')?.value || '');
    const nv1 = safeTrim(document.getElementById('pwNew')?.value || '');
    const nv2 = safeTrim(document.getElementById('pwNew2')?.value || '');
    const msg = document.getElementById('pwMsg');

    if(msg) msg.textContent = '';

    if(!oldPass){
      if(msg) msg.textContent = 'Įvesk dabartinį slaptažodį.';
      return;
    }

    if(!nv1 || nv1.length < 6){
      if(msg) msg.textContent = 'Naujas slaptažodis per trumpas (min 6 simboliai).';
      return;
    }

    if(nv1 !== nv2){
      if(msg) msg.textContent = 'Nauji slaptažodžiai nesutampa.';
      return;
    }

    const email = user?.email || user?.email_login || '';
    if(!email){
      if(msg) msg.textContent = 'Nepavyko nustatyti vartotojo el. pašto.';
      return;
    }

    // patikrinam seną slaptažodį prisijungiant iš naujo
    const { error: signInError } = await sb.auth.signInWithPassword({
      email,
      password: oldPass
    });

    if(signInError){
      if(msg) msg.textContent = 'Dabartinis slaptažodis neteisingas.';
      return;
    }

    const { error } = await sb.auth.updateUser({
      password: nv1
    });

    if(error){
      if(msg) msg.textContent = 'Nepavyko pakeisti slaptažodžio: ' + error.message;
      return;
    }

    if(msg) msg.textContent = 'Slaptažodis pakeistas.';

    const oldEl = document.getElementById('pwOld');
    const newEl = document.getElementById('pwNew');
    const new2El = document.getElementById('pwNew2');

    if(oldEl) oldEl.value = '';
    if(newEl) newEl.value = '';
    if(new2El) new2El.value = '';
  };
}

function isTaskExpanded(key){
  if(!db.session) db.session = {};
  if(!db.session.taskExpanded) db.session.taskExpanded = {};
  return !!db.session.taskExpanded[key];
}

function toggleTaskExpanded(key){
  if(!db.session) db.session = {};
  if(!db.session.taskExpanded) db.session.taskExpanded = {};
  db.session.taskExpanded[key] = !db.session.taskExpanded[key];
  saveDB_local(db);
  render();
}

function taskShortSummary(t){
  const comments = Array.isArray(t.progressLog) ? t.progressLog.length : 0;

  const files = (db.taskFiles || []).filter(f => {
    return String(f.taskId) === String(t.id) ||
      (t?.fromNoteId && String(f.noteId) === String(t.fromNoteId));
  }).length;

  const bits = [];
  if(t.initialComment) bits.push('yra pradinis komentaras');
  if(comments) bits.push(`komentarų: ${comments}`);
  if(files) bits.push(`failų: ${files}`);

  return bits.length ? bits.join(' • ') : 'be komentarų ir failų';
}

function taskIsAttention(t){
  return t.status === 'Nauja' || t.status === 'Perduota vadovui' || t.status === 'Perduota tvirtinimui';
}

function labelAssetForSelect(assetId){
  if(!db || !Array.isArray(db.grabs)) return labelEquip(assetId);
  const g = db.grabs.find(x => x && x.id === assetId);
  if(!g) return labelEquip(assetId);
  const parent = g.parentEquipId ? labelEquip(g.parentEquipId) : '—';
  return `${g.label || g.id} (priskirta: ${parent})`;
}

function sortNewestFirst(arr){
  return (arr || []).slice().sort((a,b)=>{
    const av = a.createdAt || a.doneAt || a.date || 0;
    const bv = b.createdAt || b.doneAt || b.date || 0;
    return bv > av ? 1 : -1;
  });
}
function timeAgo(ts){
  if(!ts) return '—';

  const t = new Date(ts).getTime();
  if(!t || isNaN(t)) return '—';

  const diffMs = Date.now() - t;
  const diffMin = Math.floor(diffMs / 60000);
  const diffH = Math.floor(diffMin / 60);
  const diffD = Math.floor(diffH / 24);

  if(diffMin < 1) return 'ką tik';
  if(diffMin < 60) return `prieš ${diffMin} min.`;
  if(diffH < 24) return `prieš ${diffH} val.`;
  return `prieš ${diffD} d.`;
}
function normalizeSearchText(v){
  return String(v || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
}

function equipSearchText(eid){
  const e = (db.equipment || []).find(x => x.id === eid);
  if(e){
    return normalizeSearchText([
      e.type || '',
      e.num || '',
      e.name || '',
      e.model || '',
      `${e.type || ''} ${e.num || ''}`,
      `${e.type || ''} nr ${e.num || ''}`
    ].join(' '));
  }

  const g = (db.grabs || []).find(x => x.id === eid);
  if(g){
    return normalizeSearchText([
      g.label || '',
      g.parentEquipId ? labelEquip(g.parentEquipId) : ''
    ].join(' '));
  }

  return normalizeSearchText(eid || '');
}
function labelEquipFull(eid){
  const e = (db.equipment || []).find(x => x.id === eid);
  if(e){
    const parts = [
      e.type || '',
      e.num ? `Nr. ${e.num}` : '',
      e.name || '',
      e.model || ''
    ].filter(Boolean);
    return parts.join(' • ');
  }

  const g = (db.grabs || []).find(x => x.id === eid);
  if(g) return g.label || eid;

  return eid || '';
}
function labelEquipFull(eid){
  const e = (db.equipment || []).find(x => x.id === eid);
  if(e){
    return [
      e.type || '',
      e.num ? `Nr. ${e.num}` : '',
      e.name || '',
      e.model || ''
    ].filter(Boolean).join(' ');
  }

  const g = (db.grabs || []).find(x => x.id === eid);
  if(g) return g.label || eid;

  return eid || '';
}
function weatherCodeToText(code){
  const map = {
    0: 'Giedra',
    1: 'Daugiausia giedra',
    2: 'Mažai debesuota',
    3: 'Debesuota',
    45: 'Rūkas',
    48: 'Šerkšnas / rūkas',
    51: 'Silpna dulksna',
    53: 'Dulksna',
    55: 'Stipri dulksna',
    56: 'Šalanti dulksna',
    57: 'Stipri šalanti dulksna',
    61: 'Silpnas lietus',
    63: 'Lietus',
    65: 'Stiprus lietus',
    66: 'Šalantis lietus',
    67: 'Stiprus šalantis lietus',
    71: 'Silpnas sniegas',
    73: 'Sniegas',
    75: 'Stiprus sniegas',
    77: 'Sniego kruopos',
    80: 'Trumpi lietūs',
    81: 'Lietūs',
    82: 'Stiprūs lietūs',
    85: 'Trumpi snygiai',
    86: 'Stiprūs snygiai',
    95: 'Perkūnija',
    96: 'Perkūnija su kruša',
    99: 'Stipri perkūnija su kruša'
  };
  return map[code] || '—';
}

function weatherCodeToIcon(code){
  if(code === 0) return '☀️';
  if([1,2].includes(code)) return '🌤️';
  if(code === 3) return '☁️';
  if([45,48].includes(code)) return '🌫️';
  if([51,53,55,56,57].includes(code)) return '🌦️';
  if([61,63,65,66,67,80,81,82].includes(code)) return '🌧️';
  if([71,73,75,77,85,86].includes(code)) return '❄️';
  if([95,96,99].includes(code)) return '⛈️';
  return '🌡️';
}

function formatHourLT(dateStr){
  const d = new Date(dateStr);
  const hh = String(d.getHours()).padStart(2, '0');
  return `${hh}:00`;
}
function dashboardWeatherCard(){
  return `
    <div class="card weather-card" id="weatherCard">
      <div class="weather-top">
        <div>
          <div class="muted">Orai</div>
          <div class="weather-place" id="weatherPlace">Klaipėda</div>
          <div class="weather-main" id="weatherMain">Įkeliami orai...</div>
          <div class="weather-desc" id="weatherDesc"></div>
        </div>

        <div class="weather-temp" id="weatherTemp">--°C</div>
      </div>

      <div class="weather-forecast" id="weatherForecast">
        <div class="weather-loading">Įkeliama prognozė...</div>
      </div>
    </div>
  `;
}
async function loadDashboardWeather(){
  const placeEl = document.getElementById('weatherPlace');
  const mainEl = document.getElementById('weatherMain');
  const descEl = document.getElementById('weatherDesc');
  const tempEl = document.getElementById('weatherTemp');
  const fcEl = document.getElementById('weatherForecast');

  if(!placeEl || !mainEl || !descEl || !tempEl || !fcEl) return;

  try {
    const lat = 55.7033;
    const lon = 21.1443;
    const place = 'Klaipėda';

    placeEl.textContent = place;

    const res = await fetch(
      `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,weather_code,wind_speed_10m&hourly=temperature_2m,weather_code,wind_speed_10m&forecast_days=1&timezone=auto`
    );

    const data = await res.json();

    if(!data || !data.current || !data.hourly){
      throw new Error('Nėra orų duomenų');
    }

    const current = data.current;
    const hourly = data.hourly;

    mainEl.textContent = `${weatherCodeToIcon(current.weather_code)} ${weatherCodeToText(current.weather_code)}`;
    descEl.textContent = `Vėjas ${Math.round(current.wind_speed_10m)} km/h`;
    tempEl.textContent = `${Math.round(current.temperature_2m)}°C`;

    const times = hourly.time || [];
    const temps = hourly.temperature_2m || [];
    const codes = hourly.weather_code || [];
    const winds = hourly.wind_speed_10m || [];

    const now = new Date();
    const currentHour = now.getHours();

    const nextIndexes = [];
    for(let i = 0; i < times.length; i++){
      const h = new Date(times[i]).getHours();
      if(h >= currentHour && nextIndexes.length < 3){
        nextIndexes.push(i);
      }
    }

    fcEl.innerHTML = nextIndexes.map(i => `
      <div class="weather-forecast-item">
        <div class="weather-forecast-time">${formatHourLT(times[i])}</div>
        <div class="weather-forecast-temp">
          ${weatherCodeToIcon(codes[i])} ${Math.round(temps[i])}°C
        </div>
        <div class="weather-forecast-wind">${Math.round(winds[i])} km/h</div>
      </div>
    `).join('');

  } catch (err) {
    console.error('Nepavyko užkrauti orų:', err);
    mainEl.textContent = 'Nepavyko užkrauti orų';
    descEl.textContent = '';
    tempEl.textContent = '--°C';
    fcEl.innerHTML = `<div class="weather-error">Bandykite vėliau</div>`;
  }
}
async function migrateChecklistRuFromDefaults(){
  const defaultMap = {};
  defaultChecklistTemplate().forEach(item => {
    defaultMap[safeTrim(item.textLt).toLowerCase()] = item.textRu || '';
  });

  const allEquipIds = Object.keys(db.equipmentChecklists || {});
  for(const equipId of allEquipIds){
    const current = (db.equipmentChecklists[equipId] || []).map((item, idx) => {
      const textLt = safeTrim(item.textLt || item.text || '');
      const textRu = safeTrim(item.textRu || '');

      return {
        id: item.id || ('chkitem-' + rid()),
        textLt,
        textRu: textRu || defaultMap[textLt.toLowerCase()] || '',
        sortOrder: idx + 1
      };
    });

    const ok = await replaceEquipmentChecklistInSupabase(equipId, current);
    if(ok){
      db.equipmentChecklists[equipId] = current;
    }
  }

  saveDB_local(db);
  render();
  alert('Checklist RU migracija baigta.');
}