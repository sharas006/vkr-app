async function reloadCoreData(){
  const isSuper = currentUser()?.role === 'superadmin';

  const companiesFromCloud = await loadCompaniesFromSupabase(isSuper);
  if(Array.isArray(companiesFromCloud)) db.companies = companiesFromCloud;

  const usersFromCloud = await loadUsersFromSupabase();
  if(Array.isArray(usersFromCloud)) db.users = usersFromCloud;

  const tasksFromCloud = await loadTasksFromSupabase();
  if(Array.isArray(tasksFromCloud)) db.tasks = tasksFromCloud;

  const taskFilesFromCloud = await loadTaskFilesFromSupabase();
  if(Array.isArray(taskFilesFromCloud)) db.taskFiles = taskFilesFromCloud;

  const equipmentFromCloud = await loadEquipmentFromSupabase();
  if(Array.isArray(equipmentFromCloud)) db.equipment = equipmentFromCloud;

  const grabsFromCloud = await loadGrabsFromSupabase();
  if(Array.isArray(grabsFromCloud)) db.grabs = grabsFromCloud;

  const notesFromCloud = await loadNotesFromSupabase();
  if(Array.isArray(notesFromCloud)) db.notes = notesFromCloud;

  const approvalsFromCloud = await loadApprovalsFromSupabase();
  if(Array.isArray(approvalsFromCloud)) db.approvals = approvalsFromCloud;

  const completedFromCloud = await loadCompletedFromSupabase();
  if(Array.isArray(completedFromCloud)) db.completed = completedFromCloud;

  const lubeFromCloud = await loadLubeFromSupabase();
  if(lubeFromCloud) db.lube = lubeFromCloud;

  const dailyChecksFromCloud = await loadDailyChecksFromSupabase();
  if(Array.isArray(dailyChecksFromCloud)) db.dailyChecks = dailyChecksFromCloud;

  const devicesFromCloud = await loadDevicesFromSupabase();
  if(Array.isArray(devicesFromCloud)) db.devices = devicesFromCloud;

  const checklistsFromCloud = await loadEquipmentChecklistsFromSupabase();
  if(checklistsFromCloud) db.equipmentChecklists = checklistsFromCloud;

  // 🔥🔥🔥 ČIA ESMĖ
const companyId = getCompanyId();

if(companyId){
  db.tasks = (db.tasks || []).filter(x => String(x.companyId) === String(companyId));
  db.notes = (db.notes || []).filter(x => String(x.companyId) === String(companyId));
  db.taskFiles = (db.taskFiles || []).filter(x => String(x.companyId) === String(companyId));
  db.dailyChecks = (db.dailyChecks || []).filter(x => String(x.companyId) === String(companyId));
  db.equipment = (db.equipment || []).filter(x => String(x.companyId) === String(companyId));

  // PAPILDOMAI PRIDĖK ŠITAS
  db.grabs = (db.grabs || []).filter(x => String(x.companyId) === String(companyId));
  db.completed = (db.completed || []).filter(x => String(x.companyId) === String(companyId));
  db.approvals = (db.approvals || []).filter(x => String(x.companyId) === String(companyId));
}

await ensureDefaultChecklistsForAllEquipment();

  saveDB_local(db);
}

async function logout(){
  if(typeof clearOperatorIdleTimer === 'function') clearOperatorIdleTimer();
  if(typeof stopDeviceHeartbeat === 'function') stopDeviceHeartbeat();
  if(typeof stopLiveRefresh === 'function') stopLiveRefresh();

  await sb.auth.signOut();
db.session.userId = null;
db.session.currentUser = null;
db.session.adminCompanyId = null;
  saveDB_local(db);
  render();
}

async function restoreSessionFromAuth(){
  const { data, error } = await sb.auth.getUser();
  if(error || !data?.user) return;

  const authUser = data.user;

  const { data: profile, error: profileError } = await sb
    .from('users')
    .select('*')
    .eq('auth_user_id', authUser.id)
    .single();

  if(profileError || !profile) return;

db.session.userId = profile.id;
db.session.currentUser = {
  id: profile.id,
  authUserId: authUser.id,
  username: profile.username,
  display: profile.name || profile.username,
  role: profile.role,
  equipId: profile.equip_id || null,
  companyId: profile.company_id || null,
  email: authUser.email || ''
};

if(profile.company_id){
  localStorage.setItem('company_id', profile.company_id);
}
const companyRows = await loadCompaniesFromSupabase();
if(Array.isArray(companyRows) && companyRows.length){
  db.companies = companyRows;
  localStorage.setItem('company_name', companyRows[0].name || companyRows[0].code || '');
}
  const existingIdx = (db.users || []).findIndex(u => u.id === profile.id);
const normalizedUser = {
  id: profile.id,
  authUserId: authUser.id,
  username: profile.username,
  display: profile.name || profile.username,
  role: profile.role,
  equipId: profile.equip_id || null,
  companyId: profile.company_id || null,
  email: authUser.email || ''
};

  if(existingIdx >= 0){
    db.users[existingIdx] = normalizedUser;
  } else {
    db.users.push(normalizedUser);
  }

if(normalizedUser.role === 'operator'){
  const upsertedDevice = await upsertCurrentDevice(normalizedUser);

  if(upsertedDevice){
    if(!db.devices) db.devices = [];
    const idx = db.devices.findIndex(x => String(x.device_code) === String(upsertedDevice.device_code));
    if(idx >= 0){
      db.devices[idx] = upsertedDevice;
    } else {
      db.devices.unshift(upsertedDevice);
    }
  }

  const currentDevice = upsertedDevice || await getCurrentDeviceRecord();
  db.session.deviceEquipId = currentDevice?.equip_id || null;
  db.session.deviceId = currentDevice?.device_code || getDeviceCode();
} else {
  db.session.deviceEquipId = null;
  db.session.deviceId = null;
}
}

async function doLogin(username, password){
  try{
    const { data: loginRow, error: loginLookupError } = await sb
      .from('users')
      .select('id, username, name, role, equip_id, company_id, auth_user_id, email_login')
      .eq('username', username)
      .maybeSingle();

if(loginLookupError){
  console.error('Login lookup klaida:', loginLookupError);
  return {
    ok:false,
    msg:'Nepavyko rasti vartotojo.',
    debug: loginLookupError.message || JSON.stringify(loginLookupError)
  };
}

    if(!loginRow || !loginRow.email_login){
      return { ok:false, msg:'Nerastas vartotojas arba nepriskirtas el. paštas.' };
    }

    const { data: authData, error: authError } = await sb.auth.signInWithPassword({
      email: loginRow.email_login,
      password
    });

    if(authError){
      console.error('Login klaida:', authError);
      return { ok:false, msg:'Neteisingi prisijungimo duomenys.' };
    }

    const authUser = authData?.user;
    if(!authUser){
      return { ok:false, msg:'Nepavyko gauti vartotojo.' };
    }

    const { data: profile, error: profileError } = await sb
      .from('users')
      .select('*')
      .eq('auth_user_id', authUser.id)
      .single();

    if(profileError || !profile){
      console.error('Profilio klaida:', profileError);
      await sb.auth.signOut();
      return { ok:false, msg:'Nerastas vartotojo profilis.' };
    }

const normalizedUser = {
  id: profile.id,
  authUserId: authUser.id,
  username: profile.username,
  display: profile.name || profile.username,
  role: profile.role,
  equipId: profile.equip_id || null,
  companyId: profile.company_id || null,
  email: profile.email_login || authUser.email || ''
};

    db.session.userId = normalizedUser.id;
    db.session.currentUser = normalizedUser;
    if(normalizedUser.companyId){
  localStorage.setItem('company_id', normalizedUser.companyId);
}
const companyRows = await loadCompaniesFromSupabase();
if(Array.isArray(companyRows) && companyRows.length){
  db.companies = companyRows;
  localStorage.setItem('company_name', companyRows[0].name || companyRows[0].code || '');
}
    const existingIdx = (db.users || []).findIndex(u => u.id === normalizedUser.id);
    if(existingIdx >= 0){
      db.users[existingIdx] = normalizedUser;
    } else {
      db.users.push(normalizedUser);
    }

    await reloadCoreData();

    if(normalizedUser.role === 'operator'){
      await upsertCurrentDevice(normalizedUser);

      const currentDevice = await getCurrentDeviceRecord();
      db.session.deviceEquipId = currentDevice?.equip_id || null;
      db.session.deviceId = currentDevice?.device_id || getOrCreateDeviceId();
    } else {
      db.session.deviceEquipId = null;
      db.session.deviceId = null;
    }

    saveDB_local(db);
    return { ok:true, user: normalizedUser };

}catch(err){
  console.error(err);
  return {
    ok:false,
    msg:'Nepavyko prisijungti.',
    debug: err?.message || String(err)
  };
}
}