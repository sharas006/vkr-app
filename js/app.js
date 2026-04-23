let operatorIdleTimer = null;
let operatorIdleTrackingBound = false;
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