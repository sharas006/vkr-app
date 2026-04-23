async function loadTasksFromSupabase(){
  const { data, error } = await sb
    .from('tasks')
    .select('*')
    .order('created_at', { ascending: false });

  if(error){
    console.error('Klaida gaunant tasks:', error);
    return [];
  }

  return (data || []).map(t => ({
    id: t.id,
    equipId: t.equip_id,
    title: t.title,
    status: t.status,
    assignedTo: Array.isArray(t.assigned_to) ? t.assigned_to : [],
    shared: !!t.shared,
    source: t.source || '',
    createdAt: t.created_at ? new Date(t.created_at).getTime() : Date.now(),
    initialComment: t.initial_comment || '',
    fromNoteId: t.from_note_id || null,
    seenBy: t.seen_by || {},
    progressLog: Array.isArray(t.progress_log) ? t.progress_log : [],
    passedToManagerAt: t.passed_to_manager_at || null,
    passedToManagerBy: t.passed_to_manager_by || '',
    passedToManagerById: t.passed_to_manager_by_id || null,
    createdBy: t.created_by || '',
    createdById: t.created_by_id || null,
    createdByRole: t.created_by_role || ''
  }));
}

async function loadEquipmentChecklistsFromSupabase(){
  const { data, error } = await sb
    .from('equipment_checklists')
    .select('*')
    .eq('is_active', true)
    .order('sort_order', { ascending: true });

  if(error){
    console.error('Klaida gaunant equipment_checklists:', error);
    return {};
  }

  const grouped = {};
  (data || []).forEach(r => {
    if(!grouped[r.equip_id]) grouped[r.equip_id] = [];
grouped[r.equip_id].push({
  id: r.id,
  textLt: r.item_text_lt || r.item_text || '',
  textRu: r.item_text_ru || '',
  sortOrder: r.sort_order || 0
});
  });

  return grouped;
}

async function replaceEquipmentChecklistInSupabase(equipId, items){
  const { error: deleteError } = await sb
    .from('equipment_checklists')
    .delete()
    .eq('equip_id', equipId);

  if(deleteError){
    console.error('Klaida trinant equipment_checklists:', deleteError);
    return false;
  }

  if(!items.length) return true;

const payload = items.map((item, idx) => ({
  equip_id: equipId,
  item_text_lt: item.textLt || '',
  item_text_ru: item.textRu || '',
  item_text: item.textLt || item.textRu || '',
  sort_order: idx + 1,
  is_active: true
}));

  const { error: insertError } = await sb
    .from('equipment_checklists')
    .insert(payload);

  if(insertError){
    console.error('Klaida saugant equipment_checklists:', insertError);
    return false;
  }

  return true;
}

async function loadTaskFilesFromSupabase(){
  const { data, error } = await sb
    .from('task_files')
    .select('*')
    .order('created_at', { ascending: false });

  if(error){
    console.error('Klaida gaunant task_files:', error);
    return [];
  }

  return (data || []).map(f => ({
    id: f.id,
    taskId: f.task_id || null,
    noteId: f.note_id || null,
    fileName: f.file_name || '',
    filePath: f.file_path || '',
    contentType: f.content_type || '',
    uploadedById: f.uploaded_by_id || null,
    uploadedByName: f.uploaded_by_name || '',
    createdAt: f.created_at || null
  }));
}

async function createTaskFileInSupabase(item){
  const payload = {
    task_id: item.taskId || null,
    note_id: item.noteId || null,
    file_name: item.fileName,
    file_path: item.filePath,
    content_type: item.contentType || null,
    uploaded_by_id: item.uploadedById || null,
    uploaded_by_name: item.uploadedByName || ''
  };

  const { data, error } = await sb
    .from('task_files')
    .insert([payload])
    .select()
    .single();

  if(error){
    console.error('Klaida kuriant task_files įrašą:', error);
    return null;
  }

  return {
    id: data.id,
    taskId: data.task_id || null,
    noteId: data.note_id || null,
    fileName: data.file_name || '',
    filePath: data.file_path || '',
    contentType: data.content_type || '',
    uploadedById: data.uploaded_by_id || null,
    uploadedByName: data.uploaded_by_name || '',
    createdAt: data.created_at || null
  };
}

async function getTaskFileUrl(filePath){
  const { data, error } = await sb
    .storage
    .from('task-files')
    .createSignedUrl(filePath, 60 * 60);

  if(error){
    console.error('Klaida gaunant failo URL:', error);
    return null;
  }

  return data?.signedUrl || null;
}

async function uploadTaskFileToSupabase(file, target, user){
  if(!file) return null;

  const taskId = target?.taskId || null;
  const noteId = target?.noteId || null;

  if(!taskId && !noteId){
    alert('Nenurodytas failo susiejimas.');
    return null;
  }

  const ownerId = taskId || ('note_' + noteId);
  const cleanName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
  const path = `${ownerId}/${Date.now()}_${cleanName}`;

  const { error: uploadError } = await sb
    .storage
    .from('task-files')
    .upload(path, file, {
      cacheControl: '3600',
      upsert: false
    });

  if(uploadError){
    console.error('Klaida keliant failą į Storage:', uploadError);
    alert('Nepavyko įkelti failo: ' + uploadError.message);
    return null;
  }

  const saved = await createTaskFileInSupabase({
    taskId,
    noteId,
    fileName: file.name,
    filePath: path,
    contentType: file.type || '',
    uploadedById: user?.id || null,
    uploadedByName: user?.display || user?.username || ''
  });

  return saved;
}

async function loadNotesFromSupabase(){
  const { data, error } = await sb
    .from('notes')
    .select('*')
    .order('created_at', { ascending: false });

  if(error){
    console.error('Klaida gaunant notes:', error);
    return [];
  }

  return (data || []).map(n => ({
    id: n.id,
    equipId: n.equip_id,
    date: n.date || '',
    text: n.text || '',
    author: n.author || '',
    authorId: n.author_id || null,
    type: n.type || '',
    status: n.status || '',
    linkedTaskId: n.linked_task_id || null,
    checklistPoint: n.checklist_point || '',
    createdAt: n.created_at || null
  }));
}

async function createNoteInSupabase(note){
  const payload = {
    equip_id: note.equipId,
    date: note.date || '',
    text: note.text || '',
    author: note.author || '',
    author_id: note.authorId || null,
    type: note.type || '',
    status: note.status || null,
    linked_task_id: note.linkedTaskId || null,
    checklist_point: note.checklistPoint || null
  };

  const { data, error } = await sb
    .from('notes')
    .insert([payload])
    .select()
    .single();

  if(error){
    console.error('Klaida kuriant note:', error);
    return null;
  }

  return {
    id: data.id,
    equipId: data.equip_id,
    date: data.date || '',
    text: data.text || '',
    author: data.author || '',
    authorId: data.author_id || null,
    type: data.type || '',
    status: data.status || '',
    linkedTaskId: data.linked_task_id || null,
    checklistPoint: data.checklist_point || '',
    createdAt: data.created_at || null
  };
}

async function updateNoteInSupabase(noteId, updates){
  const payload = {};

  if(updates.equipId !== undefined) payload.equip_id = updates.equipId;
  if(updates.date !== undefined) payload.date = updates.date;
  if(updates.text !== undefined) payload.text = updates.text;
  if(updates.author !== undefined) payload.author = updates.author;
  if(updates.authorId !== undefined) payload.author_id = updates.authorId;
  if(updates.type !== undefined) payload.type = updates.type;
  if(updates.status !== undefined) payload.status = updates.status;
  if(updates.linkedTaskId !== undefined) payload.linked_task_id = updates.linkedTaskId;
  if(updates.checklistPoint !== undefined) payload.checklist_point = updates.checklistPoint;

  const { data, error } = await sb
    .from('notes')
    .update(payload)
    .eq('id', noteId)
    .select()
    .single();

  if(error){
    console.error('Klaida atnaujinant note:', error);
    return null;
  }

  return {
    id: data.id,
    equipId: data.equip_id,
    date: data.date || '',
    text: data.text || '',
    author: data.author || '',
    authorId: data.author_id || null,
    type: data.type || '',
    status: data.status || '',
    linkedTaskId: data.linked_task_id || null,
    checklistPoint: data.checklist_point || '',
    createdAt: data.created_at || null
  };
}

async function loadUsersFromSupabase(){
  const { data, error } = await sb
    .from('users')
    .select('*')
    .order('name', { ascending: true });

  if(error){
    console.error('Klaida gaunant users:', error);
    return [];
  }

  return (data || []).map(u => ({
    id: u.id,
    username: u.username,
    display: u.name || u.username,
    role: u.role,
    equipId: u.equip_id || null,
    authUserId: u.auth_user_id || null,
    email: u.email_login || ''
  }));
}

async function updateUserInSupabase(userId, updates){
  const payload = {};

  if(updates.display !== undefined) payload.name = updates.display;
  if(updates.username !== undefined) payload.username = updates.username;
  if(updates.role !== undefined) payload.role = updates.role;
  if(updates.equipId !== undefined) payload.equip_id = updates.equipId;

  const { data, error } = await sb
    .from('users')
    .update(payload)
    .eq('id', userId)
    .select()
    .single();

  if(error){
    console.error('Klaida atnaujinant user:', error);
    return null;
  }

  return {
    id: data.id,
    username: data.username,
    display: data.name || data.username,
    role: data.role,
    equipId: data.equip_id || null,
    authUserId: data.auth_user_id || null,
    email: data.email_login || ''
  };
}

async function createUserInSupabase(user){
  const payload = {
    name: user.display,
    username: user.username,
    role: user.role,
    equip_id: user.equipId || null,
    email_login: user.email || null
  };

  const { data, error } = await sb
    .from('users')
    .insert([payload])
    .select()
    .single();

  if(error){
    console.error('Klaida kuriant user:', error);
    return null;
  }

  return {
    id: data.id,
    username: data.username,
    display: data.name || data.username,
    role: data.role,
    equipId: data.equip_id || null,
    authUserId: data.auth_user_id || null,
    email: data.email_login || ''
  };
}

async function deleteUserFromSupabase(userId){
  const { error } = await sb
    .from('users')
    .delete()
    .eq('id', userId);

  if(error){
    console.error('Klaida trinant user:', error);
    return false;
  }

  return true;
}

async function deleteUserViaFunction(userId){
  const { data: sessionData, error: sessionError } = await sb.auth.getSession();

  if(sessionError){
    throw new Error(sessionError.message || 'Nepavyko gauti sesijos');
  }

  const accessToken = sessionData?.session?.access_token;
  if(!accessToken){
    throw new Error('Nėra aktyvios sesijos');
  }

  const res = await fetch(`${APP_CONFIG.SUPABASE_URL}/functions/v1/delete-user`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${accessToken}`,
      'apikey': APP_CONFIG.SUPABASE_ANON_KEY
    },
    body: JSON.stringify({ userId })
  });

  let body = null;
  try{
    body = await res.json();
  }catch(_e){
    body = null;
  }

  if(!res.ok){
    console.error('Delete user function klaida:', res.status, body);
    throw new Error(
      body?.error ||
      body?.message ||
      `Delete user function klaida (${res.status})`
    );
  }

  if(body?.error){
    throw new Error(body.error);
  }

  return body;
}

async function createUserViaFunction(payload){
  const { data: sessionData, error: sessionError } = await sb.auth.getSession();

  if(sessionError){
    throw new Error(sessionError.message || 'Nepavyko gauti sesijos');
  }

  const accessToken = sessionData?.session?.access_token;
  if(!accessToken){
    throw new Error('Nėra aktyvios sesijos');
  }

  const res = await fetch(`${APP_CONFIG.SUPABASE_URL}/functions/v1/create-user`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${accessToken}`,
      'apikey': APP_CONFIG.SUPABASE_ANON_KEY
    },
    body: JSON.stringify(payload)
  });

  let body = null;
  try{
    body = await res.json();
  }catch(_e){
    body = null;
  }

  if(!res.ok){
    console.error('Create user function klaida:', res.status, body);
    throw new Error(
      body?.error ||
      body?.message ||
      `Create user function klaida (${res.status})`
    );
  }

  if(body?.error){
    throw new Error(body.error);
  }

  return body;
}

async function loadEquipmentFromSupabase(){
  const { data, error } = await sb
    .from('equipment')
    .select('*')
    .order('type', { ascending: true });

  if(error){
    console.error('Klaida gaunant equipment:', error);
    return [];
  }

  return (data || []).map(e => ({
    id: e.id,
    type: e.type,
    num: e.num,
    name: e.name || '',
    model: e.model || ''
  }));
}

async function createEquipmentInSupabase(equip){
  const payload = {
    id: equip.id,
    type: equip.type,
    num: equip.num,
    name: equip.name || '',
    model: equip.model || ''
  };

  const { data, error } = await sb
    .from('equipment')
    .insert([payload])
    .select()
    .single();

  if(error){
    console.error('Klaida kuriant equipment:', error);
    return null;
  }

  return {
    id: data.id,
    type: data.type,
    num: data.num,
    name: data.name || '',
    model: data.model || ''
  };
}

async function updateEquipmentInSupabase(equipId, updates){
  const payload = {};

  if(updates.type !== undefined) payload.type = updates.type;
  if(updates.num !== undefined) payload.num = updates.num;
  if(updates.name !== undefined) payload.name = updates.name;
  if(updates.model !== undefined) payload.model = updates.model;

  const { data, error } = await sb
    .from('equipment')
    .update(payload)
    .eq('id', equipId)
    .select()
    .single();

  if(error){
    console.error('Klaida atnaujinant equipment:', error);
    return null;
  }

  return {
    id: data.id,
    type: data.type,
    num: data.num,
    name: data.name || '',
    model: data.model || ''
  };
}

async function deleteEquipmentFromSupabase(equipId){
  const { error } = await sb
    .from('equipment')
    .delete()
    .eq('id', equipId);

  if(error){
    console.error('Klaida trinant equipment:', error);
    return false;
  }

  return true;
}

async function loadGrabsFromSupabase(){
  const { data, error } = await sb
    .from('grabs')
    .select('*')
    .order('label', { ascending: true });

  if(error){
    console.error('Klaida gaunant grabs:', error);
    return [];
  }

  return (data || []).map(g => ({
    id: g.id,
    label: g.label,
    parentEquipId: g.parent_equip_id || ''
  }));
}

async function createGrabInSupabase(grab){
  const payload = {
    id: grab.id,
    label: grab.label,
    parent_equip_id: grab.parentEquipId || null
  };

  const { data, error } = await sb
    .from('grabs')
    .insert([payload])
    .select()
    .single();

  if(error){
    console.error('Klaida kuriant grab:', error);
    return null;
  }

  return {
    id: data.id,
    label: data.label,
    parentEquipId: data.parent_equip_id || ''
  };
}

async function updateGrabInSupabase(grabId, updates){
  const payload = {};

  if(updates.label !== undefined) payload.label = updates.label;
  if(updates.parentEquipId !== undefined) payload.parent_equip_id = updates.parentEquipId || null;

  const { data, error } = await sb
    .from('grabs')
    .update(payload)
    .eq('id', grabId)
    .select()
    .single();

  if(error){
    console.error('Klaida atnaujinant grab:', error);
    return null;
  }

  return {
    id: data.id,
    label: data.label,
    parentEquipId: data.parent_equip_id || ''
  };
}

async function deleteGrabFromSupabase(grabId){
  const { error } = await sb
    .from('grabs')
    .delete()
    .eq('id', grabId);

  if(error){
    console.error('Klaida trinant grab:', error);
    return false;
  }

  return true;
}

async function createTaskInSupabase(task){
  const payload = {
    equip_id: task.equipId || null,
    title: task.title || '',
    status: task.status || 'Nauja',
    assigned_to: Array.isArray(task.assignedTo) ? task.assignedTo : [],
    shared: !!task.shared,
    source: task.source || '',
    initial_comment: task.initialComment || '',
    from_note_id: task.fromNoteId || null,
    seen_by: task.seenBy || {},
    progress_log: Array.isArray(task.progressLog) ? task.progressLog : [],
    passed_to_manager_at: task.passedToManagerAt || null,
    passed_to_manager_by: task.passedToManagerBy || '',
    passed_to_manager_by_id: task.passedToManagerById || null,
    created_by: task.createdBy || '',
    created_by_id: task.createdById || null,
    created_by_role: task.createdByRole || ''
  };

  const { data, error } = await sb
    .from('tasks')
    .insert([payload])
    .select()
    .single();

  if(error){
    console.error('Klaida kuriant task:', error);
    return null;
  }

  return {
    id: data.id,
    equipId: data.equip_id,
    title: data.title,
    status: data.status,
    assignedTo: Array.isArray(data.assigned_to) ? data.assigned_to : [],
    shared: !!data.shared,
    source: data.source || '',
    createdAt: data.created_at ? new Date(data.created_at).getTime() : Date.now(),
    initialComment: data.initial_comment || '',
    fromNoteId: data.from_note_id || null,
    seenBy: data.seen_by || {},
    progressLog: Array.isArray(data.progress_log) ? data.progress_log : [],
    passedToManagerAt: data.passed_to_manager_at || null,
    passedToManagerBy: data.passed_to_manager_by || '',
    passedToManagerById: data.passed_to_manager_by_id || null,
    createdBy: data.created_by || '',
    createdById: data.created_by_id || null,
    createdByRole: data.created_by_role || ''
  };
}

async function loadApprovalsFromSupabase(){
  const { data, error } = await sb
    .from('approvals')
    .select('*')
    .order('created_at', { ascending: false });

  if(error){
    console.error('Klaida gaunant approvals:', error);
    return [];
  }

  return (data || []).map(a => ({
    id: a.id,
    taskId: a.task_id || null,
    equipId: a.equip_id || '',
    issue: a.issue || '',
    date: a.date || '',
    start: a.start || '',
    durationMin: a.duration_min || 0,
    doneBy: a.done_by || '',
    doneById: a.done_by_id || null,
    role: a.role || '',
    comment: a.comment || '',
    initialComment: a.initial_comment || '',
    helpers: Array.isArray(a.helpers) ? a.helpers : []
  }));
}

async function createApprovalInSupabase(approval){
  const payload = {
    task_id: approval.taskId || null,
    equip_id: approval.equipId,
    issue: approval.issue,
    date: approval.date || '',
    start: approval.start || '',
    duration_min: approval.durationMin || 0,
    done_by: approval.doneBy || '',
    done_by_id: approval.doneById || null,
    role: approval.role || '',
    comment: approval.comment || '',
    initial_comment: approval.initialComment || '',
    helpers: approval.helpers || []
  };

  const { data, error } = await sb
    .from('approvals')
    .insert([payload])
    .select()
    .single();

  if(error){
    console.error('Klaida kuriant approval:', error);
    return null;
  }

  return {
    id: data.id,
    taskId: data.task_id || null,
    equipId: data.equip_id || '',
    issue: data.issue || '',
    date: data.date || '',
    start: data.start || '',
    durationMin: data.duration_min || 0,
    doneBy: data.done_by || '',
    doneById: data.done_by_id || null,
    role: data.role || '',
    comment: data.comment || '',
    initialComment: data.initial_comment || '',
    helpers: Array.isArray(data.helpers) ? data.helpers : []
  };
}

async function deleteApprovalFromSupabase(id){
  const { error } = await sb
    .from('approvals')
    .delete()
    .eq('id', id);

  if(error){
    console.error('Klaida trinant approval:', error);
    return false;
  }

  return true;
}

async function loadCompletedFromSupabase(){
  const { data, error } = await sb
    .from('completed')
    .select('*')
    .order('created_at', { ascending: false });

  if(error){
    console.error('Klaida gaunant completed:', error);
    return [];
  }

  return (data || []).map(c => ({
    id: c.id,
    taskId: c.task_id || null,
    equipId: c.equip_id || '',
    title: c.title || '',
    date: c.date || '',
    durationMin: c.duration_min || 0,
    doneBy: c.done_by || '',
    doneById: c.done_by_id || null,
    role: c.role || '',
    comment: c.comment || '',
    helpers: Array.isArray(c.helpers) ? c.helpers : [],
    progressLog: Array.isArray(c.progress_log) ? c.progress_log : []
  }));
}

async function createCompletedInSupabase(item){
  const payload = {
    task_id: item.taskId || null,
    equip_id: item.equipId,
    title: item.title,
    date: item.date || '',
    duration_min: item.durationMin || 0,
    done_by: item.doneBy || '',
    done_by_id: item.doneById || null,
    role: item.role || '',
    comment: item.comment || '',
    helpers: item.helpers || [],
    progress_log: item.progressLog || []
  };

  const { data, error } = await sb
    .from('completed')
    .insert([payload])
    .select()
    .single();

  if(error){
    console.error('Klaida kuriant completed:', error);
    return null;
  }

  return {
    id: data.id,
    taskId: data.task_id || null,
    equipId: data.equip_id || '',
    title: data.title || '',
    date: data.date || '',
    durationMin: data.duration_min || 0,
    doneBy: data.done_by || '',
    doneById: data.done_by_id || null,
    role: data.role || '',
    comment: data.comment || '',
    helpers: Array.isArray(data.helpers) ? data.helpers : [],
    progressLog: Array.isArray(data.progress_log) ? data.progress_log : []
  };
}

async function loadLubeFromSupabase(){
  const { data, error } = await sb
    .from('lube_records')
    .select('*')
    .order('created_at', { ascending: false });

  if(error){
    console.error('Klaida gaunant lube_records:', error);
    return {};
  }

  const grouped = {};
  (data || []).forEach(r => {
    const assetId = r.asset_id;
    if(!grouped[assetId]) grouped[assetId] = [];
    grouped[assetId].push({
      id: r.id,
      date: r.date || '',
      by: r.by_name || '',
      byId: r.by_id || null,
      note: r.note || ''
    });
  });

  return grouped;
}

async function createLubeRecordInSupabase(rec){
  const payload = {
    asset_id: rec.assetId,
    date: rec.date || '',
    by_name: rec.by || '',
    by_id: rec.byId || null,
    note: rec.note || ''
  };

  const { data, error } = await sb
    .from('lube_records')
    .insert([payload])
    .select()
    .single();

  if(error){
    console.error('Klaida kuriant lube record:', error);
    alert('Supabase klaida: ' + (error.message || JSON.stringify(error)));
    return null;
  }

  return {
    id: data.id,
    assetId: data.asset_id,
    date: data.date || '',
    by: data.by_name || '',
    byId: data.by_id || null,
    note: data.note || ''
  };
}

async function loadDailyChecksFromSupabase(){
  const { data, error } = await sb
    .from('daily_checks')
    .select('*')
    .order('created_at', { ascending: false });

  if(error){
    console.error('Klaida gaunant daily_checks:', error);
    return [];
  }

  return (data || []).map(x => ({
    id: x.id,
    equipId: x.equip_id,
    userId: x.user_id,
    userName: x.user_name || '',
    date: x.date || '',
    shiftKey: x.shift_key || '',
    shiftName: x.shift_name || '',
    doneAt: x.done_at || null
  }));
}

async function saveDailyCheckInSupabase(item){
  const payload = {
    equip_id: item.equipId,
    user_id: item.userId,
    user_name: item.userName || '',
    date: item.date || '',
    shift_key: item.shiftKey || '',
    shift_name: item.shiftName || '',
    done_at: item.doneAt || null
  };

  const { data: existing, error: existingError } = await sb
    .from('daily_checks')
    .select('id')
    .eq('equip_id', item.equipId)
    .eq('shift_key', item.shiftKey)
    .maybeSingle();

  if(existingError){
    console.error('Klaida tikrinant daily_check:', existingError);
    return null;
  }

  if(existing?.id){
    const { data, error } = await sb
      .from('daily_checks')
      .update(payload)
      .eq('id', existing.id)
      .select()
      .single();

    if(error){
      console.error('Klaida atnaujinant daily_check:', error);
      return null;
    }

    return {
      id: data.id,
      equipId: data.equip_id,
      userId: data.user_id,
      userName: data.user_name || '',
      date: data.date || '',
      shiftKey: data.shift_key || '',
      shiftName: data.shift_name || '',
      doneAt: data.done_at || null
    };
  }

  const { data, error } = await sb
    .from('daily_checks')
    .insert([payload])
    .select()
    .single();

  if(error){
    console.error('Klaida saugant daily check:', error);
    return null;
  }

  return {
    id: data.id,
    equipId: data.equip_id,
    userId: data.user_id,
    userName: data.user_name || '',
    date: data.date || '',
    shiftKey: data.shift_key || '',
    shiftName: data.shift_name || '',
    doneAt: data.done_at || null
  };
}

async function loadDevicesFromSupabase(){
  const { data, error } = await sb
    .from('devices')
    .select('*')
    .order('last_seen_at', { ascending: false });

  if(error){
    console.error('Klaida gaunant devices:', error);
    return [];
  }

  return data || [];
}

async function updateDeviceInSupabase(deviceId, updates){
  const payload = {};

  if(updates.deviceName !== undefined) payload.device_name = updates.deviceName || null;
  if(updates.equipId !== undefined) payload.equip_id = updates.equipId || null;

  const { data, error } = await sb
    .from('devices')
    .update(payload)
    .eq('device_id', deviceId)
    .select()
    .single();

  if(error){
    console.error('Klaida atnaujinant device:', error);
    return null;
  }

  return data;
}

async function deleteDeviceFromSupabase(deviceId){
  const { error } = await sb
    .from('devices')
    .delete()
    .eq('device_id', deviceId);

  if(error){
    console.error('Klaida trinant device:', error);
    return false;
  }

  return true;
}

async function getCurrentDeviceRecord(){
  const deviceId = getOrCreateDeviceId();

  const { data, error } = await sb
    .from('devices')
    .select('*')
    .eq('device_id', deviceId)
    .maybeSingle();

  if(error){
    console.error('Klaida gaunant current device:', error);
    return null;
  }

  return data || null;
}

async function upsertCurrentDevice(user){
  const deviceId = getOrCreateDeviceId();
  const deviceName = getDeviceName();

  const payload = {
    device_id: deviceId,
    device_name: deviceName || null,
    last_seen_at: new Date().toISOString(),
    last_user_id: user?.id || null,
    last_user_name: user?.display || user?.username || ''
  };

  const { data, error } = await sb
    .from('devices')
    .upsert([payload], {
      onConflict: 'device_id'
    })
    .select()
    .single();

  if(error){
    console.error('Device upsert klaida:', error);
    return null;
  }

  return data;
}

async function updateTaskInSupabase(taskId, updates){
  const payload = {};

  if(updates.passedToManagerAt !== undefined) payload.passed_to_manager_at = updates.passedToManagerAt;
  if(updates.passedToManagerBy !== undefined) payload.passed_to_manager_by = updates.passedToManagerBy;
  if(updates.passedToManagerById !== undefined) payload.passed_to_manager_by_id = updates.passedToManagerById;
  if(updates.equipId !== undefined) payload.equip_id = updates.equipId;
  if(updates.title !== undefined) payload.title = updates.title;
  if(updates.status !== undefined) payload.status = updates.status;
  if(updates.assignedTo !== undefined) payload.assigned_to = updates.assignedTo;
  if(updates.shared !== undefined) payload.shared = updates.shared;
  if(updates.source !== undefined) payload.source = updates.source;
  if(updates.initialComment !== undefined) payload.initial_comment = updates.initialComment;
  if(updates.fromNoteId !== undefined) payload.from_note_id = updates.fromNoteId;
  if(updates.seenBy !== undefined) payload.seen_by = updates.seenBy;
  if(updates.progressLog !== undefined) payload.progress_log = updates.progressLog;
  if(updates.createdBy !== undefined) payload.created_by = updates.createdBy;
  if(updates.createdById !== undefined) payload.created_by_id = updates.createdById;
  if(updates.createdByRole !== undefined) payload.created_by_role = updates.createdByRole;

  const { data, error } = await sb
    .from('tasks')
    .update(payload)
    .eq('id', taskId)
    .select()
    .single();

  if(error){
    console.error('Klaida atnaujinant task:', error);
    return null;
  }

  return {
    id: data.id,
    equipId: data.equip_id,
    title: data.title,
    status: data.status,
    assignedTo: Array.isArray(data.assigned_to) ? data.assigned_to : [],
    shared: !!data.shared,
    source: data.source || '',
    createdAt: data.created_at ? new Date(data.created_at).getTime() : Date.now(),
    initialComment: data.initial_comment || '',
    fromNoteId: data.from_note_id || null,
    seenBy: data.seen_by || {},
    progressLog: Array.isArray(data.progress_log) ? data.progress_log : [],
    passedToManagerAt: data.passed_to_manager_at || null,
    passedToManagerBy: data.passed_to_manager_by || '',
    passedToManagerById: data.passed_to_manager_by_id || null,
    createdBy: data.created_by || '',
    createdById: data.created_by_id || null,
    createdByRole: data.created_by_role || ''
  };
}
async function createUserViaFunction(payload){
  const { data: sessionData, error: sessionError } = await sb.auth.getSession();

  if(sessionError){
    throw new Error(sessionError.message || 'Nepavyko gauti sesijos');
  }

  const accessToken = sessionData?.session?.access_token;
  if(!accessToken){
    throw new Error('Nėra aktyvios sesijos');
  }

  const res = await fetch(`${APP_CONFIG.SUPABASE_URL}/functions/v1/create-user`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${accessToken}`,
      'apikey': APP_CONFIG.SUPABASE_ANON_KEY
    },
    body: JSON.stringify(payload)
  });

  let body = null;
  try{
    body = await res.json();
  } catch(_e){
    body = null;
  }

  if(!res.ok){
    console.error('Function HTTP klaida:', res.status, body);
    throw new Error(
      body?.error ||
      body?.message ||
      `Function klaida (${res.status})`
    );
  }

  if(body?.error){
    throw new Error(body.error);
  }

  return body;
}