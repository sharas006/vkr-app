let operatorIdleTimer = null;
let operatorIdleTrackingBound = false;
let deviceHeartbeatTimer = null;
let liveRefreshTimer = null;

function stopDeviceHeartbeat(){
  if(deviceHeartbeatTimer){
    clearInterval(deviceHeartbeatTimer);
    deviceHeartbeatTimer = null;
  }
}

function startDeviceHeartbeat(){
  stopDeviceHeartbeat();

  const user = currentUser();
  if(!user || user.role !== 'operator') return;

  const runHeartbeat = async () => {
    try {
      const updated = await heartbeatCurrentDevice(user);
      if(updated){
        if(!db.devices) db.devices = [];

        const idx = db.devices.findIndex(x => String(x.device_code) === String(updated.device_code));
        if(idx >= 0) db.devices[idx] = updated;
        else db.devices.unshift(updated);

        db.session.deviceEquipId = updated.equip_id || null;
        db.session.deviceId = updated.device_code || getDeviceCode();
        saveDB_local(db);
      }
    } catch(err){
      console.error('Device heartbeat klaida:', err);
    }
  };

  runHeartbeat();
  deviceHeartbeatTimer = setInterval(runHeartbeat, 30000);
}

function startLiveRefresh(){
  stopLiveRefresh();

  const user = currentUser();
  if(!user) return;

  liveRefreshTimer = setInterval(async () => {
    try {
      const active = document.activeElement;
      const isEditing =
        active &&
        (
          active.tagName === 'INPUT' ||
          active.tagName === 'TEXTAREA' ||
          active.tagName === 'SELECT' ||
          active.isContentEditable
        );

      const oldAdminView = db.session.adminView;
      const oldMechView = db.session.mechView;
      const oldOpView = db.session.opView;
      const oldExpanded = JSON.parse(JSON.stringify(db.session.taskExpanded || {}));

      // SENI DUOMENYS NOTIFICATION PALYGINIMUI
      const oldTasksForNotify = Array.isArray(db.tasks) ? db.tasks.slice() : [];
      const oldNotesForNotify = Array.isArray(db.notes) ? db.notes.slice() : [];

      await reloadCoreData();

      // TIKRINAM NOTIFICATIONS NET JEIGU VARTOTOJAS KAŽKĄ RAŠO
      if(typeof checkNewNotifications === 'function'){
        checkNewNotifications(oldTasksForNotify, oldNotesForNotify);
      }

      db.session.adminView = oldAdminView;
      db.session.mechView = oldMechView;
      db.session.opView = oldOpView;
      db.session.taskExpanded = oldExpanded;

      saveDB_local(db);

      // JEIGU VARTOTOJAS RAŠO — NERENDERINAM, KAD NENUMUŠTŲ LAUKŲ
      if(isEditing){
        console.log('Live refresh: notification patikrinta, render praleistas – vartotojas pildo lauką');
        return;
      }

      if(currentUser()){
        render();
      }

    } catch(err){
      console.warn('Live refresh klaida:', err);
    }
  }, 10000);
}

function stopLiveRefresh(){
  if(liveRefreshTimer){
    clearInterval(liveRefreshTimer);
    liveRefreshTimer = null;
  }
}

document.addEventListener('visibilitychange', () => {
  const user = currentUser();
  if(!user || user.role !== 'operator') return;

  if(document.visibilityState === 'visible'){
    startDeviceHeartbeat();
  }
});

window.addEventListener('beforeunload', () => {
  stopDeviceHeartbeat();
});
window.addEventListener('unhandledrejection', e => {
  console.warn('Unhandled promise:', e.reason);
});

window.addEventListener('error', e => {
  console.warn('Global error:', e.message);
});
function clearOperatorIdleTimer(){
  if(operatorIdleTimer){
    clearTimeout(operatorIdleTimer);
    operatorIdleTimer = null;
  }
}

function shouldUseOperatorIdleLogout(){
  return !!db?.session?.currentUser && db.session.currentUser.role === 'operator';
}

async function handleOperatorIdleLogout(){
  clearOperatorIdleTimer();

  if(!shouldUseOperatorIdleLogout()) return;

  alert('Dėl 30 min. neaktyvumo planšetė buvo atjungta.');
  await logout();
}

function resetOperatorIdleTimer(){
  clearOperatorIdleTimer();

  if(!shouldUseOperatorIdleLogout()) return;

  operatorIdleTimer = setTimeout(() => {
    handleOperatorIdleLogout();
  }, APP_CONFIG.INACTIVITY_LOGOUT_MS || (30 * 60 * 1000));
}

function bindOperatorIdleTracking(){
  if(operatorIdleTrackingBound) return;
  operatorIdleTrackingBound = true;

  const events = [
    'pointerdown',
    'pointermove',
    'keydown',
    'touchstart',
    'click',
    'scroll'
  ];

  events.forEach(evt => {
    window.addEventListener(evt, () => {
      resetOperatorIdleTimer();
    }, { passive: true });
  });

  document.addEventListener('visibilitychange', () => {
    if(document.visibilityState === 'visible'){
      resetOperatorIdleTimer();
    }
  });
}

function syncOperatorIdleLogout(){
  bindOperatorIdleTracking();

  if(shouldUseOperatorIdleLogout()){
    resetOperatorIdleTimer();
  } else {
    clearOperatorIdleTimer();
  }
}

async function boot(){
  const local = loadDB_local();
  db = local || seedDB();

  await restoreSessionFromAuth();
  const companiesFromCloud = await loadCompaniesFromSupabase(
  currentUser()?.role === 'superadmin'
);
if(Array.isArray(companiesFromCloud)) db.companies = companiesFromCloud;
 

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
if(Array.isArray(devicesFromCloud)) db.devices = devicesFromCloud;

  const checklistsFromCloud = await loadEquipmentChecklistsFromSupabase();
  if(checklistsFromCloud && Object.keys(checklistsFromCloud).length) db.equipmentChecklists = checklistsFromCloud;

  saveDB_local(db);
  render();
}

boot();