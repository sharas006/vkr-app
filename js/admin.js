function renderAdminView(user){
  const view = db.session.adminView || 'tasks';

  const newActiveCount = (db.tasks || []).filter(t =>
    t.status === 'Nauja' || t.status === 'Vykdoma'
  ).length;

  const waitingCount = (db.tasks || []).filter(t =>
    t.status === 'Perduota vadovui' || t.status === 'Laukianti'
  ).length;

  const waitingAttentionCount = (db.tasks || []).filter(t =>
    t.status === 'Perduota vadovui'
  ).length;

  const approvalsCount = (db.tasks || []).filter(t =>
    t.status === 'Perduota tvirtinimui'
  ).length;

  const usersCount = (db.users || []).length;
  const equipmentCount = (db.equipment || []).length;
  const devicesCount = (db.devices || []).length;
  const activeTasksCount = (db.tasks || []).filter(t =>
    t.status === 'Nauja' || t.status === 'Vykdoma'
  ).length;

  const dashboardInfo = `
    <div style="display:grid; grid-template-columns:repeat(auto-fit, minmax(180px, 1fr)); gap:12px; margin:14px 0 18px 0;">
      <div class="card" style="padding:12px 16px; border:3px solid #17384d; border-radius:12px; margin:0;">
        <div class="muted" style="font-size:12px">Naudotojų</div>
        <div style="font-size:28px; font-weight:700;">${usersCount}</div>
      </div>

      <div class="card" style="padding:12px 16px; border:3px solid #17384d; border-radius:12px; margin:0;">
        <div class="muted" style="font-size:12px">Technikos vienetų</div>
        <div style="font-size:28px; font-weight:700;">${equipmentCount}</div>
      </div>

      <div class="card" style="padding:12px 16px; border:3px solid #17384d; border-radius:12px; margin:0;">
        <div class="muted" style="font-size:12px">Planšečių</div>
        <div style="font-size:28px; font-weight:700;">${devicesCount}</div>
      </div>

      <div class="card" style="padding:12px 16px; border:3px solid #17384d; border-radius:12px; margin:0;">
        <div class="muted" style="font-size:12px">Aktyvių užduočių</div>
        <div style="font-size:28px; font-weight:700;">${activeTasksCount}</div>
      </div>
    </div>
  `;

  const tabs = `
    <div class="card">
      <div class="headerline" style="align-items:flex-start; gap:16px; margin-bottom:12px;">
        <div style="display:flex; align-items:center; gap:12px;">
          <img src="assets/logo.png" alt="Logo" style="height:68px; width:auto; display:block;">
        </div>

        <div class="right" style="margin-left:auto;">
          <span class="pill">${escapeHtml(user.display || user.username)}</span>
          <button class="btn" id="logoutBtn">Atsijungti</button>
        </div>
      </div>

<div class="tabs" style="display:flex; flex-wrap:wrap; gap:10px; margin-bottom:12px">
  <button class="btn ${view==='tasks' ? 'primary' : ''} ${newActiveCount ? 'blink' : ''}" data-tab="tasks">
    Užduotys ${newActiveCount ? `(${newActiveCount})` : ''}
  </button>

  <button class="btn ${view==='waiting' ? 'primary' : ''} ${waitingAttentionCount ? 'blink' : ''}" data-tab="waiting">
    Laukiančios ${waitingCount ? `(${waitingCount})` : ''}
  </button>

  <button class="btn ${view==='approvals' ? 'primary' : ''} ${approvalsCount ? 'blink' : ''}" data-tab="approvals">
    Patvirtinimai ${approvalsCount ? `(${approvalsCount})` : ''}
  </button>

  ${tabBtn('notes','Pastabos',view)}
  ${tabBtn('lube','Tepimai',view)}
</div>

      ${dashboardInfo}

      <div class="tabs" style="display:flex; flex-wrap:wrap; gap:10px">
        ${tabBtn('devices','Planšetės',view)}
        ${tabBtn('users','Naudotojai',view)}
        ${tabBtn('equip','Technika',view)}
        ${tabBtn('grabs','Greiferiai',view)}
        ${tabBtn('password','Slaptažodis',view)}
        ${tabBtn('analysis','Mechanikų analizė',view)}
        ${tabBtn('history','Remonto istorija',view)}
        ${tabBtn('checks','Patikrų registras',view)}
      </div>
    </div>`;

  let body = '';

  if(view === 'lube') body = adminLube();
  else if(view === 'tasks') body = adminTasks();
  else if(view === 'waiting') body = adminWaitingTasks();
  else if(view === 'approvals') body = adminApprovals();
  else if(view === 'notes') body = adminNotes(user);
  else if(view === 'checks') body = adminChecksRegistry();
  else if(view === 'devices') body = adminDevices();
  else if(view === 'users') body = adminUsers();
  else if(view === 'equip') body = adminEquip();
  else if(view === 'grabs') body = adminGrabs();
  else if(view === 'password') body = changePasswordUI(user);
  else if(view === 'history') body = adminHistory();
  else if(view === 'analysis') body = adminMechanicAnalysis();

  return tabs + body;
}

function bindAdminView(user){
  bindShell();

  document.querySelectorAll('[data-tab]').forEach(btn => {
    btn.onclick = ()=>{
      db.session.adminView = btn.getAttribute('data-tab');
      saveDB_local(db);
      render();
    };
  });

  const view = db.session.adminView || 'tasks';

  if(view === 'users') bindAdminUsers();
  if(view === 'equip') {
  bindAdminEquip();
}
  if(view === 'tasks') bindAdminTasks();
  if(view === 'waiting') bindAdminWaitingTasks();
  if(view === 'approvals') bindAdminApprovals();
  if(view === 'notes') bindAdminNotes(user);
  if(view === 'checks') bindAdminChecksRegistry();
  if(view === 'devices'){
  (async ()=>{
    await reloadCoreData();
    render();
  })();
  bindAdminDevices();
}
  if(view === 'password') bindChangePassword(user);
  if(view === 'lube') bindAdminLube();
  if(view === 'grabs') bindAdminGrabs();
  if(view === 'history') bindAdminHistory();
  if(view === 'analysis') bindAdminMechanicAnalysis();

  if(view === 'tasks') bindTaskFileUploads(user);
  if(view === 'history') bindTaskFileUploads(user);
  if(view === 'approvals') bindTaskFileUploads(user);
  if(view === 'notes') bindTaskFileUploads(user);
}

function adminDashboard(){
  const kpiUsers = (db.users || []).length;
  const kpiEquipment = (db.equipment || []).length;
  const kpiDevices = (db.devices || []).length;
  const kpiOpenTasks = (db.tasks || []).filter(t =>
    t.status === 'Nauja' || t.status === 'Vykdoma'
  ).length;

  return `
    <div class="kpi">
      <div class="card">
        <div class="muted">Naudotojų</div>
        <h2>${kpiUsers}</h2>
      </div>
      <div class="card">
        <div class="muted">Technikos vienetų</div>
        <h2>${kpiEquipment}</h2>
      </div>
      <div class="card">
        <div class="muted">Planšečių</div>
        <h2>${kpiDevices}</h2>
      </div>
      <div class="card">
        <div class="muted">Aktyvių užduočių</div>
        <h2>${kpiOpenTasks}</h2>
      </div>
    </div>
  `;
}

function adminLube(){
  const equipmentOpts = (db.equipment || [])
    .map(e => `<option value="${e.id}">${escapeHtml(labelEquip(e.id))}</option>`)
    .join('');

  const grabOpts = (db.grabs || [])
    .map(g => `<option value="${g.id}">${escapeHtml(labelAssetForSelect(g.id))}</option>`)
    .join('');

  const allAssets = [
    ...(db.equipment || []).map(e => ({ id: e.id, label: labelEquip(e.id) })),
    ...(db.grabs || []).map(g => ({ id: g.id, label: labelAssetForSelect(g.id) }))
  ];

  const rows = allAssets.map(asset => {
    const recs = (db.lube?.[asset.id] || []).slice().sort((a,b) => {
      const ad = a.date || '';
      const bd = b.date || '';
      return ad < bd ? 1 : -1;
    });

    const latest = recs[0] || null;

    return `
      <tr>
        <td>${escapeHtml(asset.label || '')}</td>
        <td>${escapeHtml(latest?.date || '—')}</td>
        <td>${escapeHtml(latest?.by || '—')}</td>
        <td>${escapeHtml(latest?.note || '—')}</td>
      </tr>
    `;
  }).join('') || `<tr><td colspan="4" class="muted">Įrašų nėra</td></tr>`;

  return `
    <div class="card">
      <h3 style="margin-top:0">Tepimai</h3>

      <div class="row row-4">
        <div>
          <div class="muted">Technika</div>
          <select id="adminLubeEquip">
            <option value="">— Pasirink techniką —</option>
            ${equipmentOpts}
          </select>
        </div>

        <div>
          <div class="muted">Greiferis</div>
          <select id="adminLubeGrab">
            <option value="">— Arba pasirink greiferį —</option>
            ${grabOpts}
          </select>
        </div>

        <div>
          <div class="muted">Pastaba</div>
          <input id="adminLubeNote" placeholder="Pvz. Sutepiau visus taškus">
        </div>

        <div class="right" style="align-items:flex-end">
          <button class="btn primary" id="adminLubeSave">Išsaugoti tepimą</button>
        </div>
      </div>

      <div class="muted" style="font-size:12px;margin-top:8px" id="adminLubeMsg"></div>
    </div>

    <div class="card">
      <h3 style="margin-top:0">Paskutiniai tepimai</h3>
      <table>
        <thead>
          <tr>
            <th>Objektas</th>
            <th>Data</th>
            <th>Kas atliko</th>
            <th>Pastaba</th>
          </tr>
        </thead>
        <tbody>${rows}</tbody>
      </table>
    </div>
  `;
}

function bindAdminLube(){
  const saveBtn = document.getElementById('adminLubeSave');
  const equipEl = document.getElementById('adminLubeEquip');
  const grabEl = document.getElementById('adminLubeGrab');
  const noteEl = document.getElementById('adminLubeNote');
  const msg = document.getElementById('adminLubeMsg');

  if(saveBtn){
    saveBtn.onclick = async ()=>{
      const equipId = safeTrim(equipEl?.value || '');
      const grabId = safeTrim(grabEl?.value || '');
      const assetId = grabId || equipId;
      const note = safeTrim(noteEl?.value || '');

      if(!assetId){
        if(msg) msg.textContent = 'Pasirink techniką arba greiferį.';
        return;
      }

      const saved = await createLubeRecordInSupabase({
        assetId,
        date: today(),
        by: currentUser()?.display || currentUser()?.username || '',
        byId: currentUser()?.id || null,
        note
      });

      if(!saved){
        if(msg) msg.textContent = 'Nepavyko išsaugoti tepimo.';
        return;
      }

      if(!db.lube) db.lube = {};
      if(!db.lube[assetId]) db.lube[assetId] = [];
      db.lube[assetId].unshift(saved);

      if(noteEl) noteEl.value = '';
      if(equipEl) equipEl.value = '';
      if(grabEl) grabEl.value = '';

      saveDB_local(db);
      render();
    };
  }
}

function adminTasks(){
  const tasks = sortNewestFirst(
    (db.tasks || []).filter(t =>
      t.status === 'Nauja' || t.status === 'Vykdoma'
    )
  );

  const eqOpts = (db.equipment || [])
    .map(e => `<option value="${e.id}">${escapeHtml(labelEquip(e.id))}</option>`)
    .join('');

  const mechanicOpts = (db.users || [])
    .filter(u => String(u.role || '').trim().toLowerCase() === 'mechanic')
    .map(u => `<option value="${u.id}">${escapeHtml(u.display || u.username)}</option>`)
    .join('');

  const rows = tasks.length ? tasks.map(t => {
    const expanded = isTaskExpanded(`admin-task-${t.id}`);
    const done = t.status === 'Perduota tvirtinimui' || t.status === 'Patvirtinta';
    const cardClass = done ? 'taskCard' : `taskCard ${taskIsAttention(t) ? 'danger' : ''}`;

    const progressHtml = (t.progressLog && t.progressLog.length) ? `
      <div style="margin-top:10px"><b>Komentarų istorija:</b></div>
      <div style="margin-top:6px">
        ${(t.progressLog || []).map(log => `
          <div>• ${escapeHtml(log.date || '—')} — ${escapeHtml(log.byName || log.by || '—')}: ${escapeHtml(log.text || '')}</div>
        `).join('')}
      </div>
    ` : '';

    const assignedNames = Array.isArray(t.assignedTo)
      ? t.assignedTo.map(id => userDisplay(id)).filter(Boolean)
      : [];

    return `
      <div class="${cardClass}">
        <div class="taskHead" data-toggle-admin-task="${t.id}">
          <div class="taskHeadLeft">
            <div class="taskMeta">
              ${escapeHtml(labelEquip(t.equipId) || '—')} • sukurta ${escapeHtml(timeAgo(t.createdAt))}
            </div>
            <div class="taskTitle">${escapeHtml(t.title || '')}</div>
            <div class="taskSummary">${escapeHtml(taskShortSummary(t))}</div>
          </div>

          <div class="taskRight">
            <span class="taskBadge">${escapeHtml(t.status || '—')}</span>
            <span class="taskCaret">${expanded ? '▲' : '▼'}</span>
          </div>
        </div>

        <div class="taskBody ${expanded ? '' : 'hidden'}">
          ${t.initialComment ? `
            <div><b>Pradinis komentaras:</b> ${escapeHtml(t.initialComment)}</div>
          ` : ''}

          <div style="margin-top:8px"><b>Sukūrė:</b> ${escapeHtml(t.createdBy || '—')}</div>
          <div style="margin-top:6px"><b>Priskyrimas:</b> ${t.shared ? 'Bendra visiems mechanikams' : escapeHtml(assignedNames.join(', ') || '—')}</div>
          <div style="margin-top:6px"><b>Įkelta:</b> ${escapeHtml(fmt(t.createdAt) || '—')} (${escapeHtml(timeAgo(t.createdAt))})</div>

          ${progressHtml}

          <div style="margin-top:8px"><b>Failai:</b></div>
          <div style="margin-top:4px">
            ${taskFilesHtml(t.id)}
          </div>

          <div style="margin-top:10px">
            <div class="muted">Įkelti failą</div>
            <input type="file" data-task-file="${t.id}">
            <div class="right" style="margin-top:8px">
              <button class="btn" data-upload-task-file="${t.id}">Įkelti failą</button>
            </div>
          </div>
        </div>
      </div>
    `;
  }).join('') : '<div class="card"><div class="muted">Aktyvių užduočių nėra.</div></div>';

  return `
    <div class="card">
      <h3 style="margin-top:0">Aktyvios užduotys</h3>

      <div class="row" style="grid-template-columns:repeat(6, minmax(0, 1fr)); gap:12px;">
        <div>
          <div class="muted">Technika</div>
          <select id="ntEquipId">
            <option value="">— Pasirink techniką —</option>
            ${eqOpts}
          </select>
        </div>

        <div>
          <div class="muted">Pavadinimas</div>
          <input id="ntTitle" placeholder="Pvz. Pakeisti hidraulikos žarną">
        </div>

        <div>
          <div class="muted">Komentaras</div>
          <input id="ntComment" placeholder="Papildoma informacija">
        </div>

        <div>
          <div class="muted">Priskyrimas</div>
          <select id="ntAssignMode">
            <option value="shared">Bendra visiems</option>
            <option value="single">Priskirti mechanikui</option>
          </select>
        </div>

        <div id="ntMechanicWrap" class="hidden">
          <div class="muted">Mechanikas</div>
          <select id="ntMechanicId">
            <option value="">— Pasirink mechaniką —</option>
            ${mechanicOpts}
          </select>
        </div>

        <div>
          <div class="muted">Nuotrauka</div>
          <input type="file" id="ntFile" accept="image/*">
        </div>
      </div>

      <div class="right" style="margin-top:12px; align-items:flex-end">
        <button class="btn primary" id="ntSave">Sukurti užduotį</button>
      </div>

      <div class="muted" style="font-size:12px;margin-top:8px" id="ntMsg"></div>
    </div>

    <div>
      ${rows}
    </div>
  `;
}

function bindAdminTasks(){
  document.querySelectorAll('[data-toggle-admin-task]').forEach(btn => {
    btn.onclick = ()=>{
      const taskId = btn.getAttribute('data-toggle-admin-task');
      toggleTaskExpanded(`admin-task-${taskId}`);
    };
  });

  const saveBtn = document.getElementById('ntSave');
  const equipEl = document.getElementById('ntEquipId');
  const titleEl = document.getElementById('ntTitle');
  const commentEl = document.getElementById('ntComment');
  const assignModeEl = document.getElementById('ntAssignMode');
  const mechanicWrapEl = document.getElementById('ntMechanicWrap');
  const mechanicEl = document.getElementById('ntMechanicId');
  const fileEl = document.getElementById('ntFile');
  const msg = document.getElementById('ntMsg');

  function refreshAssignUi(){
    const mode = assignModeEl?.value || 'shared';
    if(mechanicWrapEl){
      mechanicWrapEl.classList.toggle('hidden', mode !== 'single');
    }
  }

  if(assignModeEl){
    assignModeEl.onchange = refreshAssignUi;
    refreshAssignUi();
  }

  if(saveBtn){
    saveBtn.onclick = async ()=>{
      if(msg) msg.textContent = '';

      const equipId = safeTrim(equipEl?.value || '');
      const title = safeTrim(titleEl?.value || '');
      const initialComment = safeTrim(commentEl?.value || '');
      const assignMode = safeTrim(assignModeEl?.value || 'shared');
      const mechanicId = safeTrim(mechanicEl?.value || '');

      if(!equipId){
        if(msg) msg.textContent = 'Pasirink techniką.';
        return;
      }

      if(!title){
        if(msg) msg.textContent = 'Įrašyk užduoties pavadinimą.';
        return;
      }

      if(assignMode === 'single' && !mechanicId){
        if(msg) msg.textContent = 'Pasirink mechaniką.';
        return;
      }

      const shared = assignMode !== 'single';
      const assignedTo = shared ? [] : [mechanicId];

      const savedTask = await createTaskInSupabase({
        equipId,
        title,
        status: 'Nauja',
        shared,
        assignedTo,
        source: 'admin',
        initialComment,
        createdBy: currentUser()?.display || currentUser()?.username || '',
        createdById: currentUser()?.id || null,
        createdByRole: currentUser()?.role || 'admin'
      });

      if(!savedTask){
        if(msg) msg.textContent = 'Nepavyko sukurti užduoties.';
        return;
      }

      db.tasks = db.tasks || [];
      db.tasks.unshift(savedTask);

      const file = fileEl?.files?.[0];
      if(file){
        const uploaded = await uploadTaskFileToSupabase(
          file,
          { taskId: savedTask.id },
          currentUser()
        );

        if(uploaded){
          db.taskFiles = db.taskFiles || [];
          db.taskFiles.unshift(uploaded);
        }else{
          if(msg) msg.textContent = 'Užduotis sukurta, bet nuotraukos įkelti nepavyko.';
        }
      }

      if(equipEl) equipEl.value = '';
      if(titleEl) titleEl.value = '';
      if(commentEl) commentEl.value = '';
      if(assignModeEl) assignModeEl.value = 'shared';
      if(mechanicEl) mechanicEl.value = '';
      if(fileEl) fileEl.value = '';

      refreshAssignUi();
      saveDB_local(db);
      render();
    };
  }
}

function adminWaitingTasks(){
  if(!db.session) db.session = {};
  if(!db.session.adminCollapsed) db.session.adminCollapsed = {};

  const waiting = (db.tasks || [])
    .filter(t => t.status === 'Perduota vadovui' || t.status === 'Laukianti')
    .sort((a,b) => (b.createdAt || 0) - (a.createdAt || 0));

  const groupsMap = {};
  waiting.forEach(t => {
    const key = t.equipId || '—';
    if(!groupsMap[key]){
      groupsMap[key] = {
        equipId: key,
        label: labelEquip(key) || key,
        items: []
      };
    }
    groupsMap[key].items.push(t);
  });

  const groups = Object.values(groupsMap);

  const cards = groups.length ? groups.map(group => {
    const collapsed = !!db.session.adminCollapsed[`waiting_${group.equipId}`];
    const headCls = 'groupHead danger';

    const inner = group.items.map(t => `
      <div class="taskCard danger">
        <div class="taskHead">
          <div class="taskHeadLeft">
            <div class="taskMeta">${escapeHtml(labelEquip(t.equipId) || '—')}</div>
            <div class="taskTitle">${escapeHtml(t.title || '')}</div>
            <div class="taskSummary">${escapeHtml(taskShortSummary(t))}</div>
          </div>
          <div class="taskRight">
            <span class="taskBadge">${escapeHtml(t.status || '—')}</span>
          </div>
        </div>

        <div class="taskBody">
          <div><b>Paliko:</b> ${escapeHtml(t.createdBy || '—')}</div>
          <div style="margin-top:6px"><b>Statusas:</b> ${escapeHtml(t.status || '—')}</div>

          ${(t.progressLog && t.progressLog.length) ? `
            <div style="margin-top:10px"><b>Komentarų istorija:</b></div>
            <div style="margin-top:6px">
              ${(t.progressLog || []).map(log => `
                <div>• ${escapeHtml(log.date || '—')} — ${escapeHtml(log.by || '—')}: ${escapeHtml(log.text || '')}</div>
              `).join('')}
            </div>
          ` : ''}

          <div style="margin-top:12px">
            <div class="muted">Vadovo komentaras / situacija</div>
            <textarea class="adminWaitComment" placeholder="Pvz.: užsakytos dalys, laukiam tiekėjo atsakymo..."></textarea>
          </div>

          <div class="right" style="margin-top:8px">
            <button class="btn amber" data-wait="${t.id}">Išsaugoti kaip laukiančią</button>
            <button class="btn primary" data-reopen="${t.id}">Aktyvuoti darbui</button>
          </div>
        </div>
      </div>
    `).join('');

    return `
      <div class="groupBox">
        <div class="${headCls}" data-admin-group="waiting_${group.equipId}">
          <div>
            <b>${escapeHtml(group.label)}</b>
            <div class="muted" style="font-size:12px">Įrašų: ${group.items.length}</div>
          </div>
          <div style="display:flex;align-items:center;gap:8px">
            <span class="groupCount">${group.items.length}</span>
            <span class="caret">${collapsed ? '▸' : '▾'}</span>
          </div>
        </div>
        ${collapsed ? '' : `<div class="groupBody">${inner}</div>`}
      </div>
    `;
  }).join('') : '<div class="card"><div class="muted">Laukiančių užduočių nėra</div></div>';

  return `
    <div class="card">
      <h3 style="margin-top:0">Laukiančios užduotys</h3>
    </div>
    ${cards}
  `;
}

function bindAdminWaitingTasks(){
  document.querySelectorAll('[data-admin-group]').forEach(el => {
    el.onclick = () => {
      const key = el.getAttribute('data-admin-group');
      if(!db.session.adminCollapsed) db.session.adminCollapsed = {};
      db.session.adminCollapsed[key] = !db.session.adminCollapsed[key];
      saveDB_local(db);
      render();
    };
  });

  document.querySelectorAll('[data-wait]').forEach(b => {
    b.onclick = async ()=>{
      const id = b.getAttribute('data-wait');
      const t = (db.tasks || []).find(x => String(x.id) === String(id));
      if(!t) return;

      const card = b.closest('.taskBody');
      const ta = card ? card.querySelector('.adminWaitComment') : null;
      const comment = ta ? safeTrim(ta.value) : '';

      const newProgressLog = [...(t.progressLog || [])];

      if(comment){
        newProgressLog.push({
          date: fmt(Date.now()),
          by: currentUser()?.display || currentUser()?.username || 'Administratorius',
          byName: currentUser()?.display || currentUser()?.username || 'Administratorius',
          text: `[Laukianti] ${comment}`
        });
      }

      const updated = await updateTaskInSupabase(t.id, {
        status: 'Laukianti',
        progressLog: newProgressLog
      });

      if(!updated){
        alert('Nepavyko išsaugoti laukiančios būsenos.');
        return;
      }

      const idx = (db.tasks || []).findIndex(x => String(x.id) === String(t.id));
      if(idx >= 0) db.tasks[idx] = updated;

      saveDB_local(db);
      render();
    };
  });

  document.querySelectorAll('[data-reopen]').forEach(b => {
    b.onclick = async ()=>{
      const id = b.getAttribute('data-reopen');
      const t = (db.tasks || []).find(x => String(x.id) === String(id));
      if(!t) return;

      const card = b.closest('.taskBody');
      const ta = card ? card.querySelector('.adminWaitComment') : null;
      const comment = ta ? safeTrim(ta.value) : '';

      const newProgressLog = [...(t.progressLog || [])];

      newProgressLog.push({
        date: fmt(Date.now()),
        by: currentUser()?.display || currentUser()?.username || 'Administratorius',
        byName: currentUser()?.display || currentUser()?.username || 'Administratorius',
        text: comment
          ? `[Grąžinta į naujas] ${comment}`
          : `[Grąžinta į naujas] Užduotis vėl aktyvuota darbui`
      });

      const updated = await updateTaskInSupabase(t.id, {
        status: 'Nauja',
        progressLog: newProgressLog,
        passedToManagerAt: null,
        passedToManagerBy: '',
        passedToManagerById: null
      });

      if(!updated){
        alert('Nepavyko aktyvuoti užduoties darbui.');
        return;
      }

      const idx = (db.tasks || []).findIndex(x => String(x.id) === String(t.id));
      if(idx >= 0) db.tasks[idx] = updated;

      saveDB_local(db);
      render();
    };
  });
}

function adminApprovals(){
  const waiting = (db.tasks || [])
    .filter(t => (t.status || '') === 'Perduota tvirtinimui')
    .sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));

  const rows = waiting.length ? waiting.map(t => {
    const approval = sortNewestFirst(
      (db.approvals || []).filter(a => String(a.taskId) === String(t.id))
    )[0] || null;

    const helpers = Array.isArray(approval?.helpers) ? approval.helpers : [];
    const mechanicComment = approval?.comment || '';

    return `
      <div class="note-card status-open">
        <div class="note-head">
          <div class="note-badges">
            <span class="pill small">Užduotis</span>
            <span class="pill small status-open">Laukia tvirtinimo</span>
          </div>
          <div class="muted small">${escapeHtml(fmt(t.createdAt) || '—')}</div>
        </div>

        <div class="muted small" style="margin-bottom:6px">
          Technika: <b>${escapeHtml(labelEquip(t.equipId) || '—')}</b>
        </div>

        <div class="note-text">${escapeHtml(t.title || '')}</div>

        ${t.initialComment ? `
          <div class="muted small" style="margin-top:6px">
            Komentaras: ${escapeHtml(t.initialComment)}
          </div>
        ` : ''}

        <div class="muted small" style="margin-top:6px">
          Sukūrė: ${escapeHtml(t.createdBy || '—')}
        </div>

        ${t.passedToManagerAt ? `
          <div class="muted small" style="margin-top:6px">
            Perdavė tvirtinimui: ${escapeHtml(t.passedToManagerBy || '—')} • ${escapeHtml(fmt(t.passedToManagerAt) || '—')}
          </div>
        ` : ''}

        <div class="muted small" style="margin-top:6px">
          Mechaniko komentaras: ${escapeHtml(mechanicComment || '—')}
        </div>

        <div class="muted small" style="margin-top:6px">
          Padėjo: ${escapeHtml(helpers.length ? helpers.join(', ') : '—')}
        </div>

        <div class="muted small" style="margin-top:6px">
          Failai:
          <div style="margin-top:4px">${taskFilesHtml(t.id)}</div>
        </div>

        <div class="right" style="margin-top:10px">
          <button class="btn" data-approval-return="${t.id}">Grąžinti</button>
          <button class="btn primary" data-approval-approve="${t.id}">Patvirtinti</button>
        </div>
      </div>
    `;
  }).join('') : '<div class="card"><div class="muted">Nėra užduočių, laukiančių tvirtinimo.</div></div>';

  return `
    <div class="card">
      <h3 style="margin-top:0">Užduotys, laukiančios tvirtinimo</h3>
    </div>
    <div class="note-list">
      ${rows}
    </div>
  `;
}

function bindAdminApprovals(){
  document.querySelectorAll('[data-approval-approve]').forEach(btn => {
    btn.onclick = async ()=>{
      const taskId = btn.getAttribute('data-approval-approve');
      if(!taskId) return;

      const task = (db.tasks || []).find(t => String(t.id) === String(taskId));
      if(!task) return;

      const updated = await updateTaskInSupabase(taskId, {
        status: 'Patvirtinta'
      });

      if(!updated){
        alert('Nepavyko patvirtinti užduoties.');
        return;
      }

      const approval = sortNewestFirst(
        (db.approvals || []).filter(a => String(a.taskId) === String(taskId))
      )[0] || null;

      const alreadyCompleted = (db.completed || []).some(c => String(c.taskId) === String(taskId));

      if(!alreadyCompleted){
        const completedPayload = {
          taskId: updated.id,
          equipId: updated.equipId,
          title: updated.title,
          date: approval?.date || today(),
          durationMin: approval?.durationMin || 0,
          doneBy: approval?.doneBy || updated.passedToManagerBy || '—',
          doneById: approval?.doneById || updated.passedToManagerById || null,
          role: approval?.role || 'mechanikas',
          comment: approval?.comment || '',
          initialComment: updated.initialComment || '',
          helpers: Array.isArray(approval?.helpers) ? approval.helpers : [],
          progressLog: updated.progressLog || []
        };

        const savedCompleted = await createCompletedInSupabase(completedPayload);

        if(savedCompleted){
          db.completed = db.completed || [];
          db.completed.unshift(savedCompleted);
        }
      }

      const idx = (db.tasks || []).findIndex(t => String(t.id) === String(taskId));
      if(idx >= 0) db.tasks[idx] = updated;

      saveDB_local(db);
      render();
    };
  });

  document.querySelectorAll('[data-approval-return]').forEach(btn => {
    btn.onclick = async ()=>{
      const taskId = btn.getAttribute('data-approval-return');
      if(!taskId) return;

      const updated = await updateTaskInSupabase(taskId, {
        status: 'Vykdoma',
        passedToManagerAt: null,
        passedToManagerBy: '',
        passedToManagerById: null
      });

      if(!updated){
        alert('Nepavyko grąžinti užduoties.');
        return;
      }

      const idx = (db.tasks || []).findIndex(t => String(t.id) === String(taskId));
      if(idx >= 0) db.tasks[idx] = updated;

      saveDB_local(db);
      render();
    };
  });
}

function adminNotes(user){
  const equipFilter = safeTrim(db.session?.adminNotesEquip || '');
  const userFilter = safeTrim(db.session?.adminNotesUser || '');
  const dateFrom = safeTrim(db.session?.adminNotesDateFrom || '');
  const dateTo = safeTrim(db.session?.adminNotesDateTo || '');
  const showOpen = db.session?.adminNotesOpen !== false;
  const showDone = db.session?.adminNotesDone !== false;

  let notes = (db.notes || [])
    .map(normalizeNote)
    .filter(Boolean)
    .filter(n => n.status !== 'task')
    .filter(n => n.type === 'quick-note')
    .sort((a, b) => {
      const ad = a.createdAt || a.date || '';
      const bd = b.createdAt || b.date || '';
      return ad < bd ? 1 : -1;
    });

  const rows = notes.length ? notes.map(n => {
    const expanded = isTaskExpanded(`admin-note-${n.id}`);
    const done = (n.status || '') === 'done' || (n.status || '') === 'approved';
    const cardClass = done ? 'note-card status-done' : 'note-card status-open';

    return `
      <div
        class="${cardClass} admin-note-card"
        data-machine="${escapeHtml(labelEquip(n.equipId) || '')}"
        data-user="${escapeHtml(n.author || '')}"
        data-date="${escapeHtml(String(n.date || '').slice(0,10))}"
        data-state="${done ? 'done' : 'open'}"
      >
        <div class="note-head">
          <div class="note-badges">
            <span class="pill small">${escapeHtml(noteTypeLabel(n.type))}</span>
            <span class="pill small ${noteStatusClass(n.status)}">${escapeHtml(noteStatusLabel(n.status))}</span>
          </div>
          <div class="muted small">${escapeHtml(fmt(n.createdAt || n.date) || n.date || '—')}</div>
        </div>

        <div class="note-summary-row">
          <div class="note-summary-text">
            <b>${escapeHtml(labelEquip(n.equipId) || '—')}</b> ${n.text ? escapeHtml((n.text || '').slice(0, 120)) : ''}
            ${(n.text || '').length > 120 ? '…' : ''}
          </div>
          <div class="right">
            <button class="btn" type="button" data-toggle-admin-note="${n.id}">
              ${expanded ? 'Slėpti' : 'Rodyti'}
            </button>
            ${String(n.status || '') !== 'task' ? `
              <button class="btn primary" data-admin-note-task="${n.id}">
                Paversti užduotimi
              </button>
            ` : `
              <span class="pill small status-progress">Jau paversta</span>
            `}
          </div>
        </div>

        <div class="note-details ${expanded ? '' : 'hidden'}">
          ${n.checklistPoint ? `
            <div class="muted small" style="margin-bottom:6px">
              Punktas: <b>${escapeHtml(n.checklistPoint)}</b>
            </div>
          ` : ''}

          <div class="note-text">${escapeHtml(n.text || '—')}</div>
          <div class="muted small">Įrašė: ${escapeHtml(n.author || '—')}</div>
          <div style="margin-top:6px">${noteFilesHtml(n.id)}</div>
        </div>
      </div>
    `;
  }).join('') : '<div class="card"><div class="muted">Pastabų nėra</div></div>';

return `
  <div class="card">
    <h3 style="margin-top:0">Pastabos</h3>
    <div class="muted">Rodomi tik operatorių įrašyti trūkumai ir gedimai.</div>
  </div>
  <div class="note-list">
    ${rows}
  </div>
`;
}

function bindAdminNotes(user){
  document.querySelectorAll('[data-toggle-admin-note]').forEach(btn => {
    btn.onclick = ()=>{
      const noteId = btn.getAttribute('data-toggle-admin-note');
      toggleTaskExpanded(`admin-note-${noteId}`);
    };
  });

  document.querySelectorAll('[data-admin-note-task]').forEach(btn => {
    btn.onclick = async ()=>{
      const id = btn.getAttribute('data-admin-note-task');
      const note = (db.notes || []).find(n => String(n.id) === String(id));
      if(!note) return;

      if(note.status === 'task'){
        alert('Ši pastaba jau paversta į užduotį.');
        return;
      }

      const title = note.text ? note.text.slice(0, 120) : 'Užduotis pagal pastabą';
      const extraComment = prompt('Komentaras (nebūtina):', '') || '';

      const savedTask = await createTaskInSupabase({
        equipId: note.equipId,
        title,
        status: 'Nauja',
        shared: true,
        assignedTo: [],
        source: 'note',
        fromNoteId: note.id,
        initialComment: extraComment,
        createdBy: user.display || user.username,
        createdById: user.id,
        createdByRole: user.role
      });

      if(!savedTask){
        alert('Nepavyko sukurti užduoties iš pastabos.');
        return;
      }

      const updatedNote = await updateNoteInSupabase(note.id, {
        status: 'task',
        linkedTaskId: savedTask.id
      });

      if(!updatedNote){
        alert('Užduotis sukurta, bet nepavyko atnaujinti pastabos statuso.');
        return;
      }

      db.tasks = db.tasks || [];
      db.tasks.unshift(savedTask);

      const noteIdx = (db.notes || []).findIndex(n => String(n.id) === String(note.id));
      if(noteIdx >= 0) db.notes[noteIdx] = updatedNote;

      (db.taskFiles || []).forEach(f => {
        if(String(f.noteId) === String(note.id)){
          f.taskId = savedTask.id;
          f.noteId = null;
        }
      });

      saveDB_local(db);
      render();
    };
  });

  const equipEl = document.getElementById('adminNotesEquip');
  const userEl = document.getElementById('adminNotesUser');
  const dateFromEl = document.getElementById('adminNotesDateFrom');
  const dateToEl = document.getElementById('adminNotesDateTo');
  const openEl = document.getElementById('adminNotesOpen');
  const doneEl = document.getElementById('adminNotesDone');
  const clearBtn = document.getElementById('adminNotesClear');
  const foundEl = document.getElementById('adminNotesFound');

  function norm(v){
    return String(v || '')
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .trim();
  }

  function applyNotesFilterLive(){
    const equipNeedle = norm(equipEl?.value || '');
    const userNeedle = norm(userEl?.value || '');
    const dateFrom = dateFromEl?.value || '';
    const dateTo = dateToEl?.value || '';
    const showOpen = openEl ? !!openEl.checked : true;
    const showDone = doneEl ? !!doneEl.checked : true;

    let visible = 0;

    document.querySelectorAll('.admin-note-card').forEach(card => {
      const machine = norm(card.getAttribute('data-machine') || '');
      const user = norm(card.getAttribute('data-user') || '');
      const date = String(card.getAttribute('data-date') || '');
      const state = String(card.getAttribute('data-state') || '');

      const okEquip = !equipNeedle || machine.includes(equipNeedle);
      const okUser = !userNeedle || user.includes(userNeedle);
      const okDateFrom = !dateFrom || (date && date >= dateFrom);
      const okDateTo = !dateTo || (date && date <= dateTo);
      const okState =
        (state === 'open' && showOpen) ||
        (state === 'done' && showDone);

      const show = okEquip && okUser && okDateFrom && okDateTo && okState;
      card.style.display = show ? '' : 'none';
      if(show) visible++;
    });

    if(foundEl) foundEl.textContent = `Rasta: ${visible}`;

    if(!db.session) db.session = {};
    db.session.adminNotesEquip = equipEl?.value || '';
    db.session.adminNotesUser = userEl?.value || '';
    db.session.adminNotesDateFrom = dateFromEl?.value || '';
    db.session.adminNotesDateTo = dateToEl?.value || '';
    db.session.adminNotesOpen = openEl ? !!openEl.checked : true;
    db.session.adminNotesDone = doneEl ? !!doneEl.checked : true;
    saveDB_local(db);
  }

  if(equipEl) equipEl.addEventListener('input', applyNotesFilterLive);
  if(userEl) userEl.addEventListener('input', applyNotesFilterLive);
  if(dateFromEl) dateFromEl.addEventListener('change', applyNotesFilterLive);
  if(dateToEl) dateToEl.addEventListener('change', applyNotesFilterLive);
  if(openEl) openEl.addEventListener('change', applyNotesFilterLive);
  if(doneEl) doneEl.addEventListener('change', applyNotesFilterLive);

  if(clearBtn){
    clearBtn.onclick = ()=>{
      if(equipEl) equipEl.value = '';
      if(userEl) userEl.value = '';
      if(dateFromEl) dateFromEl.value = '';
      if(dateToEl) dateToEl.value = '';
      if(openEl) openEl.checked = true;
      if(doneEl) doneEl.checked = true;
      applyNotesFilterLive();
    };
  }

  applyNotesFilterLive();
}

function adminChecksRegistry(){
  const equipFilter = safeTrim(db.session?.adminChecksEquip || '');
  const userFilter = safeTrim(db.session?.adminChecksUser || '');
  const dateFrom = safeTrim(db.session?.adminChecksDateFrom || '');
  const dateTo = safeTrim(db.session?.adminChecksDateTo || '');
  const showOpen = db.session?.adminChecksOpen !== false;
  const showDone = db.session?.adminChecksDone !== false;

  let checks = (db.dailyChecks || [])
    .map(normalizeDailyCheck)
    .filter(Boolean)
    .sort((a, b) => {
      const ad = a.doneAt || a.date || '';
      const bd = b.doneAt || b.date || '';
      return ad < bd ? 1 : -1;
    });

  const rows = checks.length ? checks.map(ch => {
    const relatedNotes = (db.notes || [])
      .map(normalizeNote)
      .filter(Boolean)
      .filter(n =>
        String(n.equipId) === String(ch.equipId) &&
        String(n.date || '').slice(0, 10) === String(ch.date || '').slice(0, 10) &&
        (
          String(n.authorId || '') === String(ch.userId || '') ||
          String(n.author || '') === String(ch.userName || '')
        )
      );

    const nokNotes = relatedNotes.filter(n => n.type === 'check');
    const quickNotes = relatedNotes.filter(n => n.type === 'quick-note');
    const summary = relatedNotes.find(n => n.type === 'check-summary') || null;

    const checklistItems = getChecklistForEquip(ch.equipId) || [];
    const totalChecklistCount = checklistItems.length;
    const nokCount = nokNotes.length;
    const okCount = Math.max(0, totalChecklistCount - nokCount);

    const state = (nokCount > 0 || quickNotes.length > 0) ? 'open' : 'done';
    const badShort = nokNotes.length
      ? nokNotes
          .map(n => (n.checklistPoint || n.text || '').replace(/^❌\s*/, ''))
          .slice(0, 2)
          .join(', ')
      : '—';

    const expandedKey = `admin-check-${ch.id}`;
    const expanded = isTaskExpanded(expandedKey);

    return `
      <div
        class="taskCard admin-check-card"
        data-machine="${escapeHtml(labelEquip(ch.equipId) || '')}"
        data-user="${escapeHtml(ch.userName || '')}"
        data-date="${escapeHtml(String(ch.date || '').slice(0,10))}"
        data-state="${state}"
      >
        <div class="taskHead" data-toggle-admin-check="${ch.id}">
          <div class="taskHeadLeft">
            <div class="taskMeta">${escapeHtml(labelEquip(ch.equipId) || '—')}</div>
            <div class="taskTitle">${escapeHtml(ch.userName || '—')} • ${escapeHtml(ch.date || '—')}</div>
            <div class="taskSummary">
              TVARKOJE: ${okCount} • NOT OK: ${nokCount} • Papildomi trūkumai: ${quickNotes.length}
            </div>
          </div>

          <div class="taskRight">
            <span class="taskBadge">${escapeHtml(fmt(ch.doneAt) || '—')}</span>
            <span class="taskCaret">${expanded ? '▲' : '▼'}</span>
          </div>
        </div>

        <div class="taskBody ${expanded ? '' : 'hidden'}">
          <div><b>Technika:</b> ${escapeHtml(labelEquip(ch.equipId) || '—')}</div>
          <div style="margin-top:6px"><b>Atliko:</b> ${escapeHtml(ch.userName || '—')}</div>
          <div style="margin-top:6px"><b>Data:</b> ${escapeHtml(ch.date || '—')}</div>
          <div style="margin-top:6px"><b>Atlikta:</b> ${escapeHtml(fmt(ch.doneAt) || '—')}</div>

          ${summary ? `
            <div style="margin-top:10px"><b>Santrauka:</b> ${escapeHtml(summary.text || '')}</div>
          ` : ''}

          <div style="margin-top:12px"><b>✅ Tvarkoje (${okCount})</b></div>
          <div style="margin-top:6px">
            ${okCount > 0
              ? checklistItems
                  .filter(point => !nokNotes.some(n => String(n.checklistPoint || '') === String(point)))
                  .map(point => `<div>• ${escapeHtml(point)}</div>`)
                  .join('')
              : '<div class="muted">Nėra</div>'}
          </div>

          <div style="margin-top:12px"><b>❌ NOT OK (${nokCount})</b></div>
          <div style="margin-top:6px">
            ${nokNotes.length ? nokNotes.map(n => `
              <div class="card danger" style="padding:10px; margin-bottom:8px">
                <div><b>${escapeHtml(n.checklistPoint || '—')}</b>${n.text ? ` — ${escapeHtml(n.text)}` : ''}</div>
                <div class="muted small" style="margin-top:6px">${noteFilesHtml(n.id)}</div>
                <div class="right" style="margin-top:8px">
                  ${String(n.status || '') !== 'task'
                    ? `<button class="btn primary" data-admin-note-task="${n.id}">Paversti užduotimi</button>`
                    : `<span class="pill small status-progress">Jau paversta</span>`}
                </div>
              </div>
            `).join('') : '<div class="muted">Nėra</div>'}
          </div>

          <div style="margin-top:12px"><b>🟠 Papildomi operatoriaus trūkumai (${quickNotes.length})</b></div>
          <div style="margin-top:6px">
            ${quickNotes.length ? quickNotes.map(n => `
              <div class="card soft-danger" style="padding:10px; margin-bottom:8px">
                <div>${escapeHtml(n.text || '—')}</div>
                <div class="muted small" style="margin-top:6px">Įrašė: ${escapeHtml(n.author || '—')}</div>
                <div class="muted small" style="margin-top:6px">${noteFilesHtml(n.id)}</div>
                <div class="right" style="margin-top:8px">
                  ${String(n.status || '') !== 'task'
                    ? `<button class="btn primary" data-admin-note-task="${n.id}">Paversti užduotimi</button>`
                    : `<span class="pill small status-progress">Jau paversta</span>`}
                </div>
              </div>
            `).join('') : '<div class="muted">Nėra</div>'}
          </div>
        </div>
      </div>
    `;
  }).join('') : '<div class="card"><div class="muted">Patikrų nėra</div></div>';

  return `
    <div class="card">
      <div class="headerline">
        <h3 style="margin:0">Patikrų registras</h3>
        <div class="muted" id="adminChecksFound">Rasta: ${checks.length}</div>
      </div>

      <div class="filter-bar" style="margin-top:12px">
        <div class="filter-item filter-grow">
          <div class="muted">technika</div>
          <input id="checksEquip" type="text" value="${escapeHtml(equipFilter)}" placeholder="pvz. bobcat, lhm400, 432">
        </div>

        <div class="filter-item filter-grow">
          <div class="muted">operatorius</div>
          <input id="checksUser" type="text" value="${escapeHtml(userFilter)}" placeholder="pvz. andrius">
        </div>

        <div class="filter-item filter-date">
          <div class="muted">nuo</div>
          <input id="checksDateFrom" type="date" value="${escapeHtml(dateFrom)}">
        </div>

        <div class="filter-item filter-date">
          <div class="muted">iki</div>
          <input id="checksDateTo" type="date" value="${escapeHtml(dateTo)}">
        </div>

        <label class="filter-check">
          <input type="checkbox" id="checksOpen" ${showOpen ? 'checked' : ''}> atvira
        </label>

        <label class="filter-check">
          <input type="checkbox" id="checksDone" ${showDone ? 'checked' : ''}> baigta
        </label>

        <div class="filter-actions">
          <button class="btn" id="checksClear">Išvalyti</button>
        </div>
      </div>
    </div>

    <div>
      ${rows}
    </div>
  `;
}

function bindAdminChecksRegistry(){
  document.querySelectorAll('[data-toggle-admin-check]').forEach(btn => {
    btn.onclick = ()=>{
      const id = btn.getAttribute('data-toggle-admin-check');
      toggleTaskExpanded(`admin-check-${id}`);
    };
  });

  document.querySelectorAll('[data-admin-note-task]').forEach(btn => {
    btn.onclick = async ()=>{
      const id = btn.getAttribute('data-admin-note-task');
      const note = (db.notes || []).find(n => String(n.id) === String(id));
      if(!note) return;

      if(note.status === 'task'){
        alert('Ši pastaba jau paversta į užduotį.');
        return;
      }

      const title = note.text ? note.text.slice(0, 120) : 'Užduotis pagal pastabą';
      const extraComment = prompt('Komentaras (nebūtina):', '') || '';

      const savedTask = await createTaskInSupabase({
        equipId: note.equipId,
        title,
        status: 'Nauja',
        shared: true,
        assignedTo: [],
        source: 'note',
        fromNoteId: note.id,
        initialComment: extraComment,
        createdBy: currentUser()?.display || currentUser()?.username || 'Administratorius',
        createdById: currentUser()?.id || null,
        createdByRole: currentUser()?.role || 'admin'
      });

      if(!savedTask){
        alert('Nepavyko sukurti užduoties iš pastabos.');
        return;
      }

      const updatedNote = await updateNoteInSupabase(note.id, {
        status: 'task',
        linkedTaskId: savedTask.id
      });

      if(!updatedNote){
        alert('Užduotis sukurta, bet nepavyko atnaujinti pastabos statuso.');
        return;
      }

      db.tasks = db.tasks || [];
      db.tasks.unshift(savedTask);

      const noteIdx = (db.notes || []).findIndex(n => String(n.id) === String(note.id));
      if(noteIdx >= 0) db.notes[noteIdx] = updatedNote;

      (db.taskFiles || []).forEach(f => {
        if(String(f.noteId) === String(note.id)){
          f.taskId = savedTask.id;
          f.noteId = null;
        }
      });

      saveDB_local(db);
      render();
    };
  });

  const equipEl = document.getElementById('checksEquip');
  const userEl = document.getElementById('checksUser');
  const dateFromEl = document.getElementById('checksDateFrom');
  const dateToEl = document.getElementById('checksDateTo');
  const openEl = document.getElementById('checksOpen');
  const doneEl = document.getElementById('checksDone');
  const clearBtn = document.getElementById('checksClear');
  const foundEl = document.getElementById('adminChecksFound');

  function norm(v){
    return String(v || '')
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .trim();
  }

  function applyChecksFilterLive(){
    const equipNeedle = norm(equipEl?.value || '');
    const userNeedle = norm(userEl?.value || '');
    const dateFrom = dateFromEl?.value || '';
    const dateTo = dateToEl?.value || '';
    const showOpen = !!openEl?.checked;
    const showDone = !!doneEl?.checked;

    let visible = 0;

    document.querySelectorAll('.admin-check-card').forEach(card => {
      const machine = norm(card.getAttribute('data-machine') || '');
      const user = norm(card.getAttribute('data-user') || '');
      const date = String(card.getAttribute('data-date') || '');
      const state = String(card.getAttribute('data-state') || '');

      const okEquip = !equipNeedle || machine.includes(equipNeedle);
      const okUser = !userNeedle || user.includes(userNeedle);
      const okDateFrom = !dateFrom || (date && date >= dateFrom);
      const okDateTo = !dateTo || (date && date <= dateTo);
      const okState =
        (state === 'open' && showOpen) ||
        (state === 'done' && showDone);

      const show = okEquip && okUser && okDateFrom && okDateTo && okState;
      card.style.display = show ? '' : 'none';
      if(show) visible++;
    });

    if(foundEl) foundEl.textContent = `Rasta: ${visible}`;

    if(!db.session) db.session = {};
    db.session.adminChecksEquip = equipEl?.value || '';
    db.session.adminChecksUser = userEl?.value || '';
    db.session.adminChecksDateFrom = dateFromEl?.value || '';
    db.session.adminChecksDateTo = dateToEl?.value || '';
    db.session.adminChecksOpen = !!openEl?.checked;
    db.session.adminChecksDone = !!doneEl?.checked;
    saveDB_local(db);
  }

  if(equipEl) equipEl.addEventListener('input', applyChecksFilterLive);
  if(userEl) userEl.addEventListener('input', applyChecksFilterLive);
  if(dateFromEl) dateFromEl.addEventListener('change', applyChecksFilterLive);
  if(dateToEl) dateToEl.addEventListener('change', applyChecksFilterLive);
  if(openEl) openEl.addEventListener('change', applyChecksFilterLive);
  if(doneEl) doneEl.addEventListener('change', applyChecksFilterLive);

  if(clearBtn){
    clearBtn.onclick = ()=>{
      if(equipEl) equipEl.value = '';
      if(userEl) userEl.value = '';
      if(dateFromEl) dateFromEl.value = '';
      if(dateToEl) dateToEl.value = '';
      if(openEl) openEl.checked = true;
      if(doneEl) doneEl.checked = true;
      applyChecksFilterLive();
    };
  }

  applyChecksFilterLive();
}

function adminDevices(){
  const eqOpts = (db.equipment || [])
    .map(e => `<option value="${e.id}">${escapeHtml(labelEquip(e.id))}</option>`)
    .join('');

const rows = ((db.devices || []).slice().sort((a,b)=>{
  const ad = a.last_seen_at || '';
  const bd = b.last_seen_at || '';
  return ad < bd ? 1 : -1;
})).map(d => {
  const shortId = String(d.device_id || '');
  const shortSeen = String(fmt(d.last_seen_at) || '—').slice(0, 16);

  return `
    <tr class="compact-row">
      <td class="compact-id" title="${escapeHtml(d.device_id || '')}">
        ${escapeHtml(shortId)}
      </td>

      <td class="compact-name">
        ${escapeHtml(d.device_name || '—')}
      </td>

      <td class="compact-equip" title="${escapeHtml(labelEquip(d.equip_id) || d.equip_id || '—')}">
        ${escapeHtml(labelEquip(d.equip_id) || d.equip_id || '—')}
      </td>

      <td class="compact-user" title="${escapeHtml(d.last_user_name || '—')}">
        ${escapeHtml(d.last_user_name || '—')}
      </td>

      <td class="compact-date">
        ${escapeHtml(shortSeen)}
      </td>

      <td class="compact-actions">
        <div class="mini-actions">
          <button class="btn btn-sm" data-edit-device="${d.device_id}">Keisti</button>
          <button class="btn btn-sm" data-delete-device="${d.device_id}">Trinti</button>
        </div>
      </td>
    </tr>
  `;
}).join('') || `<tr><td colspan="6" class="muted">Planšečių dar nėra</td></tr>`;

  return `
    <div class="card" id="devicesTopCard">
      <h3 style="margin-top:0">Priskirti techniką planšetei</h3>
      <div class="row">
        <div>
          <div class="muted">Device ID</div>
          <input id="dDeviceId" readonly>
        </div>

        <div>
          <div class="muted">Planšetės pavadinimas</div>
          <input id="dDeviceName" placeholder="pvz. Liebherr kabina">
        </div>

        <div>
          <div class="muted">Technika</div>
          <select id="dEquipId">
            <option value="">— Nepriskirta —</option>
            ${eqOpts}
          </select>
        </div>

        <div class="right">
          <button class="btn" id="dClear">Išvalyti</button>
          <button class="btn primary" id="dSave">Išsaugoti</button>
        </div>

        <div class="muted" style="font-size:12px" id="dMsg"></div>
      </div>
    </div>

    <div class="card">
      <div class="headerline" style="margin-bottom:10px">
        <h3 style="margin:0">Planšečių registras</h3>
        <button class="btn" id="devicesRefresh">Atnaujinti</button>
      </div>
<table class="compact-table">
  <thead>
    <tr>
      <th>Device ID</th>
      <th>Pavad.</th>
      <th>Technika</th>
      <th>Vartotojas</th>
      <th>Matyta</th>
      <th></th>
    </tr>
  </thead>
  <tbody>${rows}</tbody>
</table>
    </div>
  `;
}

function bindAdminDevices(){
  const idEl = document.getElementById('dDeviceId');
  const nmEl = document.getElementById('dDeviceName');
  const eqEl = document.getElementById('dEquipId');
  const msg = document.getElementById('dMsg');
  const refreshBtn = document.getElementById('devicesRefresh');
if(refreshBtn){
  refreshBtn.onclick = async ()=>{
    await reloadCoreData();
    render();
  };
}
if(window.__devicesAutoRefresh){
  clearInterval(window.__devicesAutoRefresh);
}

window.__devicesAutoRefresh = setInterval(async () => {
  if((db.session?.adminView || '') !== 'devices') return;
  await reloadCoreData();
  render();
}, 5000);

  function scrollToTopCard(){
    const el = document.getElementById('devicesTopCard');
    if(el){
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }

  function clear(){
    if(idEl) idEl.value = '';
    if(nmEl) nmEl.value = '';
    if(eqEl) eqEl.value = '';
    if(msg) msg.textContent = '';
  }

  const clearBtn = document.getElementById('dClear');
  if(clearBtn) clearBtn.onclick = clear;

  document.querySelectorAll('[data-edit-device]').forEach(btn => {
    btn.onclick = ()=>{
      const deviceId = btn.getAttribute('data-edit-device');
      const d = (db.devices || []).find(x => x.device_id === deviceId);
      if(!d) return;

      if(idEl) idEl.value = d.device_id || '';
      if(nmEl) nmEl.value = d.device_name || '';
      if(eqEl) eqEl.value = d.equip_id || '';
      if(msg) msg.textContent = 'Redaguoji planšetę: ' + (d.device_name || d.device_id);

      scrollToTopCard();
    };
  });

  document.querySelectorAll('[data-delete-device]').forEach(btn => {
    btn.onclick = async ()=>{
      const deviceId = btn.getAttribute('data-delete-device');
      if(!deviceId) return;

      if(!confirm('Tikrai trinti planšetę iš registro?')) return;

      const ok = await deleteDeviceFromSupabase(deviceId);
      if(!ok){
        if(msg) msg.textContent = 'Nepavyko ištrinti planšetės.';
        return;
      }

      db.devices = (db.devices || []).filter(x => x.device_id !== deviceId);
      saveDB_local(db);
      render();
    };
  });

  const saveBtn = document.getElementById('dSave');
  if(saveBtn){
    saveBtn.onclick = async ()=>{
      const deviceId = safeTrim(idEl?.value || '');
      const deviceName = safeTrim(nmEl?.value || '');
      const equipId = safeTrim(eqEl?.value || '');

      if(!deviceId){
        if(msg) msg.textContent = 'Pirma pasirink planšetę iš sąrašo.';
        return;
      }

      const updated = await updateDeviceInSupabase(deviceId, {
        deviceName,
        equipId
      });

      if(!updated){
        if(msg) msg.textContent = 'Nepavyko išsaugoti.';
        return;
      }

      const idx = (db.devices || []).findIndex(x => x.device_id === deviceId);
      if(idx >= 0) db.devices[idx] = updated;

      saveDB_local(db);
      if(msg) msg.textContent = 'Išsaugota.';
      render();

      setTimeout(() => {
        scrollToTopCard();
      }, 50);
    };
  }
}

  function bindChecklistRowActions(){
    document.querySelectorAll('[data-cl-up]').forEach(btn => {
      btn.onclick = async ()=>{
        const equipId = safeTrim(eqEl?.value || '');
        const idx = Number(btn.getAttribute('data-cl-up'));
        const arr = collectChecklistFromInputs(equipId);
        if(idx <= 0) return;

        [arr[idx - 1], arr[idx]] = [arr[idx], arr[idx - 1]];
        await saveChecklist(equipId, arr);
      };
    });

    document.querySelectorAll('[data-cl-down]').forEach(btn => {
      btn.onclick = async ()=>{
        const equipId = safeTrim(eqEl?.value || '');
        const idx = Number(btn.getAttribute('data-cl-down'));
        const arr = collectChecklistFromInputs(equipId);
        if(idx >= arr.length - 1) return;

        [arr[idx + 1], arr[idx]] = [arr[idx], arr[idx + 1]];
        await saveChecklist(equipId, arr);
      };
    });

    document.querySelectorAll('[data-cl-del]').forEach(btn => {
      btn.onclick = async ()=>{
        const equipId = safeTrim(eqEl?.value || '');
        const idx = Number(btn.getAttribute('data-cl-del'));
        const arr = collectChecklistFromInputs(equipId);
        arr.splice(idx, 1);
        await saveChecklist(equipId, arr);
      };
    });
}

function adminUsers(){
  if(!db.session) db.session = {};
  if(!db.session.usersSubView) db.session.usersSubView = 'list';

  const sub = db.session.usersSubView || 'list';

  const eqOpts = (db.equipment || [])
    .map(e => `<option value="${e.id}">${escapeHtml(labelEquip(e.id))}</option>`)
    .join('');

  const rows = (db.users || []).map(u => `
    <tr>
      <td>${escapeHtml(u.display || '')}</td>
      <td>${escapeHtml(u.username || '')}</td>
      <td>${escapeHtml(u.role || '')}</td>
      <td>${escapeHtml(u.email || '—')}</td>
      <td>${escapeHtml(labelEquip(u.equipId) || u.equipId || '—')}</td>
      <td class="right">
        <button class="btn" data-edit-user="${u.id}">Keisti</button>
      </td>
    </tr>
  `).join('') || `<tr><td colspan="6" class="muted">Naudotojų nėra</td></tr>`;

  return `
    <div class="card">
      <div class="tabs" style="display:flex; gap:8px; flex-wrap:wrap">
        <button class="btn ${sub === 'list' ? 'primary' : ''}" data-users-sub="list">Naudotojai</button>
        <button class="btn ${sub === 'create' ? 'primary' : ''}" data-users-sub="create">Sukurti naudotoją</button>
      </div>
    </div>

    <div class="card" id="usersTopCard">
      <h3 style="margin-top:0">${sub === 'create' ? 'Sukurti naudotoją' : 'Keisti naudotoją'}</h3>

      <div class="row">
        <div>
          <div class="muted">Vardas</div>
          <input id="uDisplay" placeholder="Vardas">
        </div>

        <div>
          <div class="muted">Username</div>
          <input id="uUsername" placeholder="Username">
        </div>

        <div>
          <div class="muted">El. paštas</div>
          <input id="uEmail" type="email" placeholder="vardas@imone.lt">
        </div>

        <div>
          <div class="muted">Rolė</div>
          <select id="uRole">
            <option value="operator">operator</option>
            <option value="mechanic">mechanic</option>
            <option value="admin">admin</option>
          </select>
        </div>

        <div>
          <div class="muted">Technika</div>
          <select id="uEquip">
            <option value="">— Nepriskirta —</option>
            ${eqOpts}
          </select>
        </div>

        <div>
          <div class="muted">Slaptažodis ${sub === 'create' ? '' : '(nebūtina)'}</div>
          <input id="uPassword" type="password" placeholder="${sub === 'create' ? 'Laikinas slaptažodis' : 'Palik tuščią jei nekeiti'}">
        </div>

        <input type="hidden" id="uId">

        <div class="right">
          <button class="btn" id="uClear">Išvalyti</button>
          <button class="btn primary" id="uSave">${sub === 'create' ? 'Sukurti' : 'Išsaugoti'}</button>
        </div>

        <div class="muted" style="font-size:12px" id="uMsg"></div>
      </div>
    </div>

    ${sub === 'list' ? `
      <div class="card">
        <h3 style="margin-top:0">Naudotojai</h3>
        <table>
          <thead>
            <tr>
              <th>Vardas</th>
              <th>Username</th>
              <th>Rolė</th>
              <th>Email</th>
              <th>Technika</th>
              <th></th>
            </tr>
          </thead>
          <tbody>${rows}</tbody>
        </table>
      </div>
    ` : ''}
  `;
}

function bindAdminUsers(){
  document.querySelectorAll('[data-users-sub]').forEach(btn => {
    btn.onclick = ()=>{
      db.session.usersSubView = btn.getAttribute('data-users-sub');
      saveDB_local(db);
      render();
    };
  });

  const sub = db.session?.usersSubView || 'list';

  const idEl = document.getElementById('uId');
  const dEl = document.getElementById('uDisplay');
  const unEl = document.getElementById('uUsername');
  const emailEl = document.getElementById('uEmail');
  const rEl = document.getElementById('uRole');
  const eqEl = document.getElementById('uEquip');
  const pwEl = document.getElementById('uPassword');
  const msg = document.getElementById('uMsg');

  function scrollToTopCard(){
    const el = document.getElementById('usersTopCard');
    if(el){
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }

  function clear(){
    if(idEl) idEl.value = '';
    if(dEl) dEl.value = '';
    if(unEl) unEl.value = '';
    if(emailEl) emailEl.value = '';
    if(rEl) rEl.value = 'operator';
    if(eqEl) eqEl.value = '';
    if(pwEl) pwEl.value = '';
    if(msg) msg.textContent = '';
  }

  const clearBtn = document.getElementById('uClear');
  if(clearBtn){
    clearBtn.onclick = clear;
  }

  document.querySelectorAll('[data-edit-user]').forEach(btn => {
    btn.onclick = ()=>{
      const id = btn.getAttribute('data-edit-user');
      const u = (db.users || []).find(x => String(x.id) === String(id));
      if(!u) return;

      db.session.usersSubView = 'list';
      saveDB_local(db);

      if(idEl) idEl.value = u.id || '';
      if(dEl) dEl.value = u.display || '';
      if(unEl) unEl.value = u.username || '';
      if(emailEl) emailEl.value = u.email || '';
      if(rEl) rEl.value = u.role || 'operator';
      if(eqEl) eqEl.value = u.equipId || '';
      if(pwEl) pwEl.value = '';
      if(msg) msg.textContent = 'Redaguoji: ' + (u.display || u.username);

      scrollToTopCard();
    };
  });

  const saveBtn = document.getElementById('uSave');
  if(saveBtn){
    saveBtn.onclick = async ()=>{
      const id = safeTrim(idEl?.value || '');
      const display = safeTrim(dEl?.value || '');
      const username = safeTrim(unEl?.value || '');
      const email = safeTrim(emailEl?.value || '');
      const role = safeTrim(rEl?.value || 'operator');
      const equipId = safeTrim(eqEl?.value || '');
      const password = safeTrim(pwEl?.value || '');

      if(!display){
        if(msg) msg.textContent = 'Reikia vardo.';
        return;
      }

      if(!username){
        if(msg) msg.textContent = 'Reikia username.';
        return;
      }

      if(!email){
        if(msg) msg.textContent = 'Reikia el. pašto.';
        return;
      }

if(sub === 'create'){
  if(!password || password.length < 6){
    if(msg) msg.textContent = 'Kuriant naudotoją reikia slaptažodžio (min 6 simboliai).';
    return;
  }

  if(!email){
    if(msg) msg.textContent = 'Reikia el. pašto.';
    return;
  }

  try{
    const result = await createUserViaFunction({
      username,
      name: display,
      role,
      email,
      password,
      equipId: role === 'operator' ? (equipId || null) : null
    });

    const createdUser = {
      id: result.user.id,
      username: result.user.username,
      display: result.user.name || result.user.username,
      role: result.user.role,
      equipId: result.user.equip_id || null,
      authUserId: result.user.auth_user_id || null,
      email: result.user.email_login || ''
    };

    db.users = db.users || [];
    db.users.push(createdUser);

    saveDB_local(db);
    clear();
    if(msg) msg.textContent = 'Naudotojas sukurtas.';
    render();

    setTimeout(() => {
      scrollToTopCard();
    }, 50);

  } catch(err){
    console.error('Klaida kuriant user:', err);
    if(msg) msg.textContent = err?.message || 'Nepavyko sukurti naudotojo.';
  }

  return;
}

      if(!id){
        if(msg) msg.textContent = 'Pirma pasirink naudotoją iš sąrašo.';
        return;
      }

      const updatePayload = {
        display,
        username,
        email,
        role,
        equipId: role === 'operator' ? equipId : null
      };

      if(password){
        updatePayload.password = password;
      }

      const updated = await updateUserInSupabase(id, updatePayload);

      if(!updated){
        if(msg) msg.textContent = 'Nepavyko išsaugoti naudotojo.';
        return;
      }

      const idx = (db.users || []).findIndex(x => String(x.id) === String(id));
      if(idx >= 0) db.users[idx] = updated;

      if(db.session?.userId === id && db.session?.currentUser){
        db.session.currentUser = updated;
      }

      saveDB_local(db);
      if(msg) msg.textContent = 'Išsaugota.';
      render();

      setTimeout(() => {
        scrollToTopCard();
      }, 50);
    };
  }
}

function adminEquip(){
  const sub = db.session?.equipSubView || 'equip';

  const rows = (db.equipment || []).map(e => `
    <tr>
      <td>${escapeHtml(e.type || '')}</td>
      <td>${escapeHtml(e.num || '')}</td>
      <td>${escapeHtml(e.name || '')}</td>
      <td>${escapeHtml(e.model || '')}</td>
      <td class="right">
        <button class="btn" data-edit-equip="${e.id}">Keisti</button>
        <button class="btn" data-open-checklist="${e.id}">Patikra</button>
      </td>
    </tr>
  `).join('') || `<tr><td colspan="5" class="muted">Technikos nėra</td></tr>`;

  const selectedEquipId = db.session?.editChecklistEquipId || '';
  const selectedEquip = (db.equipment || []).find(x => String(x.id) === String(selectedEquipId)) || null;
  const checklist = selectedEquipId ? (db.equipmentChecklists?.[selectedEquipId] || []) : [];

  const checklistHtml = !selectedEquip
    ? `<div class="muted">Pasirink techniką iš lentelės mygtuku <b>Patikra</b> arba iš sąrašo žemiau.</div>`
    : (checklist.length
        ? checklist.map((item, idx) => `
            <div class="check-admin-row">
              <div style="flex:1">
                <div><b>${idx + 1}.</b></div>

                <div class="small muted" style="margin-top:6px">LT</div>
                <input type="text" data-cl-lt="${idx}" value="${escapeHtml(item.textLt || item.text || '')}">

                <div class="small muted" style="margin-top:8px">RU</div>
                <input type="text" data-cl-ru="${idx}" value="${escapeHtml(item.textRu || '')}">
              </div>

              <div class="right">
                <button class="btn" data-cl-up="${idx}">↑</button>
                <button class="btn" data-cl-down="${idx}">↓</button>
                <button class="btn" data-cl-del="${idx}">Trinti</button>
              </div>
            </div>
          `).join('')
        : `<div class="muted">Šiai technikai dar nėra atskirų patikros punktų. Operatoriui bus rodomas numatytas sąrašas.</div>`);

  const equipOpts = (db.equipment || []).map(e => `
    <option value="${e.id}" ${String(selectedEquipId) === String(e.id) ? 'selected' : ''}>
      ${escapeHtml(labelEquip(e.id))}
    </option>
  `).join('');

  return `
    <div class="card" id="equipTopCard">
      <div class="tabs" style="display:flex; gap:8px; flex-wrap:wrap">
        <button class="btn ${sub === 'equip' ? 'primary' : ''}" data-equip-sub="equip">Technika</button>
        <button class="btn ${sub === 'checklists' ? 'primary' : ''}" data-equip-sub="checklists">Patikros šablonai</button>
      </div>
    </div>

    ${sub === 'equip' ? `
      <div class="card">
        <h3 style="margin-top:0">Technikos sąrašas</h3>
        <table>
          <thead>
            <tr>
              <th>Tipas</th>
              <th>Nr.</th>
              <th>Pavadinimas</th>
              <th>Modelis</th>
              <th></th>
            </tr>
          </thead>
          <tbody>${rows}</tbody>
        </table>
      </div>

      <div class="card">
        <h3 style="margin-top:0">Pridėti / redaguoti techniką</h3>

        <input type="hidden" id="eId">

        <div class="row row-4">
          <div>
            <div class="muted">Tipas</div>
            <input id="eType" placeholder="Pvz. Krautuvas">
          </div>

          <div>
            <div class="muted">Nr.</div>
            <input id="eNum" placeholder="Pvz. 106">
          </div>

          <div>
            <div class="muted">Pavadinimas</div>
            <input id="eName" placeholder="Pvz. Hyundai">
          </div>

          <div>
            <div class="muted">Modelis</div>
            <input id="eModel" placeholder="Pvz. HL960A">
          </div>
        </div>

        <div class="right" style="margin-top:12px">
          <button class="btn" id="eClear">Išvalyti</button>
          <button class="btn primary" id="eSave">Išsaugoti</button>
        </div>

        <div class="muted" style="font-size:12px;margin-top:8px" id="eMsg"></div>
      </div>
    ` : `
      <div class="card" id="checklistCard">
        <div class="headerline" style="margin-bottom:10px">
          <h3 style="margin:0">Patikros šablonai</h3>
          <div class="muted">Technika: <b>${selectedEquip ? escapeHtml(labelEquip(selectedEquip.id)) : '—'}</b></div>
        </div>

        <div class="row row-2" style="margin-bottom:12px">
          <div>
            <div class="muted">Technika</div>
            <select id="checklistEquipSelect">
              <option value="">— Pasirink techniką —</option>
              ${equipOpts}
            </select>
          </div>
          <div></div>
        </div>

        <div class="note-list">
          ${checklistHtml}
        </div>

        <div class="row row-2" style="margin-top:16px">
          <div>
            <div class="muted">Naujas punktas LT</div>
            <input id="newChecklistLt" placeholder="Pvz. Variklio tepalas">
          </div>

          <div>
            <div class="muted">Naujas punktas RU</div>
            <input id="newChecklistRu" placeholder="Напр. Моторное масло">
          </div>
        </div>

        <div class="right" style="margin-top:10px; gap:8px">
          <button class="btn" id="clearChecklistEquip">Nuimti pasirinkimą</button>
          <button class="btn" id="loadChecklistDefault">Užkrauti default</button>
          <button class="btn primary" id="addChecklistItem">Pridėti punktą</button>
        </div>

        <div class="muted" style="font-size:12px;margin-top:8px" id="checklistMsg"></div>
      </div>
    `}
  `;
}

function bindAdminEquip(){
  document.querySelectorAll('[data-equip-sub]').forEach(btn => {
    btn.onclick = ()=>{
      db.session.equipSubView = btn.getAttribute('data-equip-sub');
      saveDB_local(db);
      render();
    };
  });

  const sub = db.session?.equipSubView || 'equip';

  function scrollToTopCard(){
    const el = document.getElementById('equipTopCard');
    if(el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  function scrollToChecklistCard(){
    const el = document.getElementById('checklistCard');
    if(el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  if(sub === 'equip'){
    const idEl = document.getElementById('eId');
    const tEl = document.getElementById('eType');
    const nEl = document.getElementById('eNum');
    const nmEl = document.getElementById('eName');
    const mEl = document.getElementById('eModel');
    const msg = document.getElementById('eMsg');

    function clear(){
      if(idEl) idEl.value = '';
      if(tEl) tEl.value = '';
      if(nEl) nEl.value = '';
      if(nmEl) nmEl.value = '';
      if(mEl) mEl.value = '';
      if(msg) msg.textContent = '';
    }

    const clearBtn = document.getElementById('eClear');
    if(clearBtn) clearBtn.onclick = clear;

    document.querySelectorAll('[data-edit-equip]').forEach(btn => {
      btn.onclick = ()=>{
        const id = btn.getAttribute('data-edit-equip');
        const e = (db.equipment || []).find(x => String(x.id) === String(id));
        if(!e) return;

        if(idEl) idEl.value = e.id;
        if(tEl) tEl.value = e.type || '';
        if(nEl) nEl.value = e.num || '';
        if(nmEl) nmEl.value = e.name || '';
        if(mEl) mEl.value = e.model || '';
        if(msg) msg.textContent = 'Redaguoji: ' + labelEquip(e.id);

        scrollToTopCard();
      };
    });

    document.querySelectorAll('[data-open-checklist]').forEach(btn => {
      btn.onclick = async ()=>{
        const equipId = btn.getAttribute('data-open-checklist');
        db.session.editChecklistEquipId = equipId;
        db.session.equipSubView = 'checklists';
        saveDB_local(db);

        await ensureDefaultChecklistForEquipment(equipId);

        render();
        setTimeout(scrollToChecklistCard, 50);
      };
    });

    const saveBtn = document.getElementById('eSave');
    if(saveBtn){
      saveBtn.onclick = async ()=>{
        const id = safeTrim(idEl?.value || '');
        const type = safeTrim(tEl?.value || '');
        const num = safeTrim(nEl?.value || '');
        const name = safeTrim(nmEl?.value || '');
        const model = safeTrim(mEl?.value || '');

        if(!type || !num){
          if(msg) msg.textContent = 'Užpildyk bent tipą ir numerį.';
          return;
        }

        let updated = null;

        if(id){
          updated = await updateEquipmentInSupabase(id, { type, num, name, model });
        } else {
          updated = await createEquipmentInSupabase({ type, num, name, model });
        }

        if(!updated){
          if(msg) msg.textContent = 'Nepavyko išsaugoti technikos.';
          return;
        }

        const idx = (db.equipment || []).findIndex(x => String(x.id) === String(updated.id));
        if(idx >= 0){
          db.equipment[idx] = updated;
        } else {
          db.equipment = db.equipment || [];
          db.equipment.unshift(updated);
        }

        saveDB_local(db);
        if(msg) msg.textContent = 'Išsaugota.';
        render();
        setTimeout(scrollToTopCard, 50);
      };
    }
  }

  if(sub === 'checklists'){
    const equipSelect = document.getElementById('checklistEquipSelect');
    const msgEl = document.getElementById('checklistMsg');
    const newLtEl = document.getElementById('newChecklistLt');
    const newRuEl = document.getElementById('newChecklistRu');
    const clearEquipBtn = document.getElementById('clearChecklistEquip');
    const loadDefaultBtn = document.getElementById('loadChecklistDefault');
    const addBtn = document.getElementById('addChecklistItem');

    function ensureChecklistArray(equipId){
      if(!db.equipmentChecklists) db.equipmentChecklists = {};
      if(!db.equipmentChecklists[equipId]) db.equipmentChecklists[equipId] = [];
      return db.equipmentChecklists[equipId];
    }

    function collectChecklistFromInputs(equipId){
      const current = ensureChecklistArray(equipId).slice();

      return current.map((item, idx) => {
        const ltEl = document.querySelector(`[data-cl-lt="${idx}"]`);
        const ruEl = document.querySelector(`[data-cl-ru="${idx}"]`);

        return {
          ...item,
          textLt: safeTrim(ltEl?.value || item.textLt || item.text || ''),
          textRu: safeTrim(ruEl?.value || item.textRu || '')
        };
      }).filter(item => safeTrim(item.textLt || item.textRu || ''));
    }

    async function saveChecklist(equipId, arr){
      if(!equipId){
        if(msgEl) msgEl.textContent = 'Pirma pasirink techniką.';
        return false;
      }

      const normalized = arr.map((item, idx) => ({
        id: item.id || ('chkitem-' + rid()),
        textLt: safeTrim(item.textLt || item.text || ''),
        textRu: safeTrim(item.textRu || ''),
        sortOrder: idx + 1
      })).filter(item => item.textLt || item.textRu);

      const ok = await replaceEquipmentChecklistInSupabase(equipId, normalized);
      if(!ok){
        if(msgEl) msgEl.textContent = 'Nepavyko išsaugoti patikros punktų.';
        return false;
      }

      db.equipmentChecklists[equipId] = normalized;
      saveDB_local(db);

      if(msgEl) msgEl.textContent = 'Išsaugota.';
      render();
      setTimeout(scrollToChecklistCard, 50);
      return true;
    }

    if(equipSelect){
      equipSelect.onchange = async ()=>{
        const equipId = safeTrim(equipSelect.value || '');
        db.session.editChecklistEquipId = equipId || '';
        saveDB_local(db);

        if(equipId){
          await ensureDefaultChecklistForEquipment(equipId);
        }

        render();
        setTimeout(scrollToChecklistCard, 50);
      };
    }

    if(clearEquipBtn){
      clearEquipBtn.onclick = ()=>{
        db.session.editChecklistEquipId = '';
        saveDB_local(db);
        render();
      };
    }

    if(loadDefaultBtn){
      loadDefaultBtn.onclick = async ()=>{
        const equipId = safeTrim(db.session?.editChecklistEquipId || '');
        if(!equipId){
          if(msgEl) msgEl.textContent = 'Pirma pasirink techniką.';
          return;
        }

        const arr = defaultChecklistTemplate().map(item => ({
          id: 'chkitem-' + rid(),
          textLt: item.textLt || '',
          textRu: item.textRu || ''
        }));

        await saveChecklist(equipId, arr);
      };
    }

    if(addBtn){
      addBtn.onclick = async ()=>{
        const equipId = safeTrim(db.session?.editChecklistEquipId || '');
        const textLt = safeTrim(newLtEl?.value || '');
        const textRu = safeTrim(newRuEl?.value || '');

        if(!equipId){
          if(msgEl) msgEl.textContent = 'Pirma pasirink techniką.';
          return;
        }

        if(!textLt){
          if(msgEl) msgEl.textContent = 'Įrašyk LT punktą.';
          return;
        }

        const arr = collectChecklistFromInputs(equipId);
        arr.push({
          id: 'chkitem-' + rid(),
          textLt,
          textRu
        });

        const ok = await saveChecklist(equipId, arr);
        if(ok){
          if(newLtEl) newLtEl.value = '';
          if(newRuEl) newRuEl.value = '';
        }
      };
    }

    document.querySelectorAll('[data-cl-up]').forEach(btn => {
      btn.onclick = async ()=>{
        const equipId = safeTrim(db.session?.editChecklistEquipId || '');
        if(!equipId) return;

        const idx = Number(btn.getAttribute('data-cl-up'));
        const arr = collectChecklistFromInputs(equipId);
        if(idx <= 0) return;

        [arr[idx - 1], arr[idx]] = [arr[idx], arr[idx - 1]];
        await saveChecklist(equipId, arr);
      };
    });

    document.querySelectorAll('[data-cl-down]').forEach(btn => {
      btn.onclick = async ()=>{
        const equipId = safeTrim(db.session?.editChecklistEquipId || '');
        if(!equipId) return;

        const idx = Number(btn.getAttribute('data-cl-down'));
        const arr = collectChecklistFromInputs(equipId);
        if(idx >= arr.length - 1) return;

        [arr[idx + 1], arr[idx]] = [arr[idx], arr[idx + 1]];
        await saveChecklist(equipId, arr);
      };
    });

    document.querySelectorAll('[data-cl-del]').forEach(btn => {
      btn.onclick = async ()=>{
        const equipId = safeTrim(db.session?.editChecklistEquipId || '');
        if(!equipId) return;

        const idx = Number(btn.getAttribute('data-cl-del'));
        const arr = collectChecklistFromInputs(equipId);
        if(idx < 0 || idx >= arr.length) return;

        arr.splice(idx, 1);
        await saveChecklist(equipId, arr);
      };
    });
  }
}

function adminGrabs(){
  const eqOpts = (db.equipment || [])
    .map(e => `<option value="${e.id}">${escapeHtml(labelEquip(e.id))}</option>`)
    .join('');

  const rows = (db.grabs || []).map(g => `
    <tr>
      <td>${escapeHtml(g.label || '')}</td>
      <td>${escapeHtml(labelEquip(g.parentEquipId) || '—')}</td>
      <td class="right">
        <button class="btn" data-edit-grab="${g.id}">Keisti</button>
        <button class="btn" data-delete-grab="${g.id}">Trinti</button>
      </td>
    </tr>
  `).join('') || `<tr><td colspan="3" class="muted">Greiferių nėra</td></tr>`;

  return `
    <div class="card" id="grabsTopCard">
      <h3 style="margin-top:0">Pridėti / keisti greiferį</h3>

      <div class="row">
        <div>
          <div class="muted">Pavadinimas</div>
          <input id="gLabel" placeholder="Pvz. E-Crane – metalinis greiferis">
        </div>

        <div>
          <div class="muted">Priskirta technika</div>
          <select id="gParentEquip">
            <option value="">— Nepriskirta —</option>
            ${eqOpts}
          </select>
        </div>

        <input type="hidden" id="gId">

        <div class="right">
          <button class="btn" id="gClear">Išvalyti</button>
          <button class="btn primary" id="gSave">Išsaugoti</button>
        </div>

        <div class="muted" style="font-size:12px" id="gMsg"></div>
      </div>
    </div>

    <div class="card">
      <h3 style="margin-top:0">Greiferiai</h3>
      <table>
        <thead>
          <tr>
            <th>Pavadinimas</th>
            <th>Priskirta technika</th>
            <th></th>
          </tr>
        </thead>
        <tbody>${rows}</tbody>
      </table>
    </div>
  `;
}

function bindAdminGrabs(){
  const idEl = document.getElementById('gId');
  const labelEl = document.getElementById('gLabel');
  const parentEl = document.getElementById('gParentEquip');
  const msg = document.getElementById('gMsg');

  function scrollToTopCard(){
    const el = document.getElementById('grabsTopCard');
    if(el){
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }

  function clear(){
    if(idEl) idEl.value = '';
    if(labelEl) labelEl.value = '';
    if(parentEl) parentEl.value = '';
    if(msg) msg.textContent = '';
  }

  const clearBtn = document.getElementById('gClear');
  if(clearBtn) clearBtn.onclick = clear;

  document.querySelectorAll('[data-edit-grab]').forEach(btn => {
    btn.onclick = ()=>{
      const id = btn.getAttribute('data-edit-grab');
      const g = (db.grabs || []).find(x => x.id === id);
      if(!g) return;

      if(idEl) idEl.value = g.id || '';
      if(labelEl) labelEl.value = g.label || '';
      if(parentEl) parentEl.value = g.parentEquipId || '';
      if(msg) msg.textContent = 'Redaguoji: ' + (g.label || g.id);

      scrollToTopCard();
    };
  });

  document.querySelectorAll('[data-delete-grab]').forEach(btn => {
    btn.onclick = async ()=>{
      const id = btn.getAttribute('data-delete-grab');
      if(!id) return;

      if(!confirm('Tikrai trinti greiferį?')) return;

      const ok = await deleteGrabFromSupabase(id);
      if(!ok){
        if(msg) msg.textContent = 'Nepavyko ištrinti greiferio.';
        return;
      }

      db.grabs = (db.grabs || []).filter(x => x.id !== id);
      saveDB_local(db);
      render();
    };
  });

  const saveBtn = document.getElementById('gSave');
  if(saveBtn){
    saveBtn.onclick = async ()=>{
      const id = safeTrim(idEl?.value || '');
      const label = safeTrim(labelEl?.value || '');
      const parentEquipId = safeTrim(parentEl?.value || '');

      if(!label){
        if(msg) msg.textContent = 'Reikia pavadinimo.';
        return;
      }

      if(id){
        const updated = await updateGrabInSupabase(id, {
          label,
          parentEquipId
        });

        if(!updated){
          if(msg) msg.textContent = 'Nepavyko atnaujinti greiferio.';
          return;
        }

        const idx = (db.grabs || []).findIndex(x => x.id === id);
        if(idx >= 0) db.grabs[idx] = updated;
      } else {
        const saved = await createGrabInSupabase({
          id: 'grab-' + rid(),
          label,
          parentEquipId
        });

        if(!saved){
          if(msg) msg.textContent = 'Nepavyko sukurti greiferio.';
          return;
        }

        db.grabs = db.grabs || [];
        db.grabs.push(saved);
      }

      saveDB_local(db);
      clear();
      render();

      setTimeout(() => {
        scrollToTopCard();
      }, 50);
    };
  }
}

function analyticsApprovalDate(a){
  return safeTrim(a.date || '').slice(0, 10);
}

function mechanicApprovalRows(){
  return sortNewestFirst(db.completed || []);
}

function adminMechanicAnalysis(){
  const mechanics = (db.users || [])
    .filter(u => String(u.role || '').trim().toLowerCase() === 'mechanic')
    .sort((a, b) => {
      const an = String(a.display || a.username || '').toLowerCase();
      const bn = String(b.display || b.username || '').toLowerCase();
      return an.localeCompare(bn, 'lt');
    });

  const rows = mechanics.length ? mechanics.map(m => {
    const mechanicId = String(m.id || '');

    const completedBy = (db.completed || []).filter(c =>
      String(c.doneById || '') === mechanicId
    );

    const approvalsBy = (db.approvals || []).filter(a =>
      String(a.doneById || '') === mechanicId
    );

    const helpedInCompleted = (db.completed || []).filter(c =>
      Array.isArray(c.helpers) && c.helpers.map(String).includes(mechanicId)
    );

    const helpedInApprovals = (db.approvals || []).filter(a =>
      Array.isArray(a.helpers) && a.helpers.map(String).includes(mechanicId)
    );

    const completedCount = completedBy.length;
    const approvalsCount = approvalsBy.length;
    const helpedCount = helpedInCompleted.length;

    const totalWorkTime = completedBy.reduce((sum, c) => {
      return sum + Number(c.durationMin || 0);
    }, 0);

    return `
      <tr>
        <td>${escapeHtml(m.display || m.username || '—')}</td>
        <td>${completedCount}</td>
        <td>${helpedCount}</td>
        <td>${approvalsCount}</td>
        <td>${escapeHtml(fmtMinutes(totalWorkTime) || '0 min')}</td>
      </tr>
    `;
  }).join('') : `
    <tr>
      <td colspan="5" class="muted">Mechanikų nėra</td>
    </tr>
  `;

  return `
    <div class="card">
      <h3 style="margin-top:0">Mechanikų analizė</h3>
      <div class="muted" style="margin-bottom:10px">
        Rodoma, kiek darbų mechanikas atliko, kiek kartų buvo kaip padėjęs,
        kiek šiuo metu yra perdavęs tvirtinimui, ir bendras atliktų darbų laikas.
      </div>

      <table>
        <thead>
          <tr>
            <th>Mechanikas</th>
            <th>Atliko darbų</th>
            <th>Buvo padėjęs</th>
            <th>Laukia tvirtinimo</th>
            <th>Bendras laikas</th>
          </tr>
        </thead>
        <tbody>
          ${rows}
        </tbody>
      </table>
    </div>
  `;
}

function bindAdminMechanicAnalysis(){
  document.querySelectorAll('[data-toggle-admin-analytics]').forEach(btn => {
    btn.onclick = ()=>{
      const id = btn.getAttribute('data-toggle-admin-analytics');
      toggleTaskExpanded(`admin-analytics-${id}`);
    };
  });

  const userEl = document.getElementById('adminAnalyticsUser');
  const fromEl = document.getElementById('adminAnalyticsDateFrom');
  const toEl = document.getElementById('adminAnalyticsDateTo');
  const clearBtn = document.getElementById('adminAnalyticsClear');

  function apply(){
    if(!db.session) db.session = {};
    db.session.adminAnalyticsUser = userEl?.value || '';
    db.session.adminAnalyticsDateFrom = fromEl?.value || '';
    db.session.adminAnalyticsDateTo = toEl?.value || '';
    saveDB_local(db);
    render();
  }

  if(userEl) userEl.onchange = apply;
  if(fromEl) fromEl.onchange = apply;
  if(toEl) toEl.onchange = apply;

  if(clearBtn){
    clearBtn.onclick = ()=>{
      if(userEl) userEl.value = '';
      if(fromEl) fromEl.value = '';
      if(toEl) toEl.value = '';
      apply();
    };
  }
}

function historyNormalize(v){
  return String(v || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
}

function historyItemMatches(item, query, equipFilter, byFilter, dateFrom, dateTo){
  const machineText = historyNormalize(labelEquip(item.equipId) || '');
  const byText = historyNormalize(item.doneBy || '');
  const titleText = historyNormalize(item.title || '');
  const commentText = historyNormalize(item.comment || '');
  const helperText = historyNormalize((item.helpers || []).join(' '));
  const dateText = String(item.date || '').slice(0, 10);

  const allText = `${machineText} ${byText} ${titleText} ${commentText} ${helperText} ${dateText}`;

  const byQuery = !query || allText.includes(historyNormalize(query));
  const byEquip = !equipFilter || machineText.includes(historyNormalize(equipFilter));
  const byUser = !byFilter || byText.includes(historyNormalize(byFilter));
  const byFrom = !dateFrom || (dateText && dateText >= dateFrom);
  const byTo = !dateTo || (dateText && dateText <= dateTo);

  return byQuery && byEquip && byUser && byFrom && byTo;
}

function historyChartHtml(items){
  const counts = {};

  (items || []).forEach(item => {
    const name = item.doneBy || '—';
    counts[name] = (counts[name] || 0) + 1;
  });

  const rows = Object.entries(counts)
    .sort((a, b) => b[1] - a[1]);

  if(!rows.length){
    return `<div class="muted">Nėra duomenų diagramai.</div>`;
  }

  const max = Math.max(...rows.map(x => x[1]), 1);
  const total = rows.reduce((sum, [, count]) => sum + count, 0);

  return `
    <div style="display:grid;gap:12px">
      ${rows.map(([name, count]) => {
        const percent = Math.round((count / total) * 100);
        const width = Math.max(8, Math.round((count / max) * 100));

        return `
          <div>
            <div class="headerline" style="margin-bottom:6px">
              <div><b>${escapeHtml(name)}</b></div>
              <div class="muted">${count} darb. • ${percent}%</div>
            </div>

            <div style="height:28px;background:#eef2f7;border-radius:999px;overflow:hidden;border:1px solid var(--border)">
              <div style="
                width:${width}%;
                height:100%;
                background:linear-gradient(90deg, #0ea5e9, #38bdf8);
                display:flex;
                align-items:center;
                justify-content:flex-end;
                padding-right:10px;
                color:#fff;
                font-weight:700;
                white-space:nowrap;
              ">
                ${count}
              </div>
            </div>
          </div>
        `;
      }).join('')}
    </div>
  `;
}

function exportHistoryRowsToXlsx(rows, filename){
  if(typeof XLSX === 'undefined'){
    alert('Excel biblioteka neužkrauta.');
    return;
  }

  const data = rows.map(item => ({
    Data: item.date || '',
    Technika: labelEquip(item.equipId) || '',
    Darbas: item.title || '',
    'Atliko': item.doneBy || '',
    'Padėjo': (item.helpers || []).map(id => userDisplay(id)).filter(Boolean).join(', '),
    'Trukmė (min)': Number(item.durationMin || 0),
    Komentaras: item.comment || '',
    'Pradinis komentaras': item.initialComment || '',
    'Task ID': item.taskId || '',
    'Failų kiekis': (db.taskFiles || []).filter(f => String(f.taskId) === String(item.taskId)).length
  }));

  const ws = XLSX.utils.json_to_sheet(data);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Remonto istorija');
  XLSX.writeFile(wb, filename || 'remonto_istorija.xlsx');
}

function adminHistory(){
  const query = safeTrim(db.session?.adminHistoryQuery || '');
  const equipFilter = safeTrim(db.session?.adminHistoryEquip || '');
  const byFilter = safeTrim(db.session?.adminHistoryBy || '');
  const dateFrom = safeTrim(db.session?.adminHistoryDateFrom || '');
  const dateTo = safeTrim(db.session?.adminHistoryDateTo || '');

  const items = sortNewestFirst(db.completed || []);
  const selectedMap = db.session?.adminHistorySelected || {};
  const visibleLimit = Number(db.session?.adminHistoryLimit || 30);

  function helpersText(helperIds){
    const names = (helperIds || []).map(id => userDisplay(id)).filter(Boolean);
    return names.length ? names.join(', ') : '—';
  }

  const filteredItems = items.filter(item =>
    historyItemMatches(item, query, equipFilter, byFilter, dateFrom, dateTo)
  );

  const visibleItems = filteredItems.slice(0, visibleLimit);
  const hasMore = filteredItems.length > visibleLimit;

  const rows = visibleItems.length ? visibleItems.map(item => {
    const expanded = isTaskExpanded(`admin-history-${item.id}`);
    const checked = !!selectedMap[item.id];

    return `
      <div class="taskCard admin-history-card">
        <div class="taskHead" data-toggle-admin-history="${item.id}">
          <div class="taskHeadLeft">
            <div class="taskMeta">${escapeHtml(labelEquip(item.equipId) || '—')}</div>
            <div class="taskTitle">
              <label style="display:flex;align-items:center;gap:10px;cursor:pointer">
                <input type="checkbox" data-history-select="${item.id}" ${checked ? 'checked' : ''} onclick="event.stopPropagation()">
                <span>${escapeHtml(item.title || '')}</span>
              </label>
            </div>
            <div class="taskSummary">
              ${escapeHtml(item.doneBy || '—')} • ${escapeHtml(item.date || '—')} • ${escapeHtml(fmtMinutes(item.durationMin) || '—')}
            </div>
          </div>

          <div class="taskRight">
            <span class="taskBadge">Užbaigta</span>
            <span class="taskCaret">${expanded ? '▲' : '▼'}</span>
          </div>
        </div>

        <div class="taskBody ${expanded ? '' : 'hidden'}">
          <div><b>Technika:</b> ${escapeHtml(labelEquip(item.equipId) || '—')}</div>
          <div style="margin-top:6px"><b>Atliko:</b> ${escapeHtml(item.doneBy || '—')}</div>
          <div style="margin-top:6px"><b>Padėjo:</b> ${escapeHtml(helpersText(item.helpers || []))}</div>
          <div style="margin-top:6px"><b>Komentaras:</b> ${escapeHtml(item.comment || '—')}</div>

          ${(item.progressLog && item.progressLog.length) ? `
            <div style="margin-top:10px"><b>Komentarų istorija:</b></div>
            <div style="margin-top:6px">
              ${(item.progressLog || []).map(log => `
                <div>• ${escapeHtml(log.date || '—')} — ${escapeHtml(log.byName || log.by || '—')}: ${escapeHtml(log.text || '')}</div>
              `).join('')}
            </div>
          ` : ''}

          <div style="margin-top:8px"><b>Failai:</b></div>
          <div style="margin-top:4px">${completedFilesHtml(item.taskId)}</div>
        </div>
      </div>
    `;
  }).join('') : '<div class="card"><div class="muted">Istorijos įrašų nėra</div></div>';

  return `
    <div class="card">
      <div class="headerline">
        <h3 style="margin:0">Remonto istorija</h3>
        <div class="muted" id="histFound">Rasta: ${filteredItems.length}</div>
      </div>

      <div class="row row-5" style="margin-top:12px">
        <div>
          <div class="muted">Paieška</div>
          <input id="histQuery" value="${escapeHtml(query)}" placeholder="Pvz. žarna, vaidotas...">
        </div>
        <div>
          <div class="muted">Technika</div>
          <input id="histEquip" value="${escapeHtml(equipFilter)}" placeholder="Pvz. fuchs, lhm...">
        </div>
        <div>
          <div class="muted">Atliko</div>
          <input id="histBy" value="${escapeHtml(byFilter)}" placeholder="Pvz. vaidotas...">
        </div>
        <div>
          <div class="muted">Data nuo</div>
          <input type="date" id="histDateFrom" value="${escapeHtml(dateFrom)}">
        </div>
        <div>
          <div class="muted">Data iki</div>
          <input type="date" id="histDateTo" value="${escapeHtml(dateTo)}">
        </div>
      </div>

      <div class="right" style="margin-top:12px; gap:8px; flex-wrap:wrap">
        <button class="btn" id="histSelectVisible">Pažymėti rodomus</button>
        <button class="btn" id="histClearSelection">Nuimti pažymėjimą</button>
        <button class="btn" id="histClear">Išvalyti filtrą</button>
        <button class="btn" id="histExportSelected">Eksportuoti pažymėtus</button>
        <button class="btn primary" id="histExportFiltered">Eksportuoti filtruotus</button>
      </div>

      <div style="margin-top:14px">
        <div class="headerline">
          <b>Suvestinė</b>
          <div class="muted" id="histChartTotal">Iš viso: ${filteredItems.length}</div>
        </div>
        <div id="histChart" style="margin-top:10px">
          ${historyChartHtml(filteredItems)}
        </div>
      </div>
    </div>

    <div>
      ${rows}
    </div>

    ${hasMore ? `
      <div class="card">
        <div class="right">
          <button class="btn" id="histShowMore">Rodyti daugiau</button>
        </div>
      </div>
    ` : ''}
  `;
}

function bindAdminHistory(){
  document.querySelectorAll('[data-toggle-admin-history]').forEach(btn => {
    btn.onclick = ()=>{
      const id = btn.getAttribute('data-toggle-admin-history');
      toggleTaskExpanded(`admin-history-${id}`);
    };
  });

  const queryEl = document.getElementById('histQuery');
  const equipEl = document.getElementById('histEquip');
  const byEl = document.getElementById('histBy');
  const clearBtn = document.getElementById('histClear');
  const foundEl = document.getElementById('histFound');
  const chartEl = document.getElementById('histChart');
  const chartTotalEl = document.getElementById('histChartTotal');
  const fromEl = document.getElementById('histDateFrom');
  const toEl = document.getElementById('histDateTo');
  const exportSelectedBtn = document.getElementById('histExportSelected');
  const exportFilteredBtn = document.getElementById('histExportFiltered');
  const selectVisibleBtn = document.getElementById('histSelectVisible');
  const clearSelectionBtn = document.getElementById('histClearSelection');
  const showMoreBtn = document.getElementById('histShowMore');

  if(!db.session) db.session = {};
  if(!db.session.adminHistorySelected) db.session.adminHistorySelected = {};
  if(!db.session.adminHistoryLimit) db.session.adminHistoryLimit = 30;

  function getFilteredItems(){
    const query = safeTrim(queryEl?.value || '');
    const equipFilter = safeTrim(equipEl?.value || '');
    const byFilter = safeTrim(byEl?.value || '');
    const dateFrom = safeTrim(fromEl?.value || '');
    const dateTo = safeTrim(toEl?.value || '');

    return sortNewestFirst(db.completed || []).filter(item =>
      historyItemMatches(item, query, equipFilter, byFilter, dateFrom, dateTo)
    );
  }

  function applyFilter(){
    const query = safeTrim(queryEl?.value || '');
    const equipFilter = safeTrim(equipEl?.value || '');
    const byFilter = safeTrim(byEl?.value || '');
    const dateFrom = safeTrim(fromEl?.value || '');
    const dateTo = safeTrim(toEl?.value || '');

    const filteredItems = getFilteredItems();
    const visibleLimit = Number(db.session?.adminHistoryLimit || 30);
    const visibleIds = new Set(filteredItems.slice(0, visibleLimit).map(x => String(x.id)));

    let visible = 0;

    document.querySelectorAll('.admin-history-card').forEach(card => {
      const checkbox = card.querySelector('[data-history-select]');
      const id = checkbox ? String(checkbox.getAttribute('data-history-select')) : '';
      const show = visibleIds.has(id);

      card.style.display = show ? '' : 'none';
      if(show) visible++;
    });

    if(foundEl){
      foundEl.textContent = `Rasta: ${filteredItems.length}`;
    }

    if(chartEl){
      chartEl.innerHTML = historyChartHtml(filteredItems);
    }

    if(chartTotalEl){
      chartTotalEl.textContent = `Iš viso: ${filteredItems.length}`;
    }

    db.session.adminHistoryQuery = query;
    db.session.adminHistoryEquip = equipFilter;
    db.session.adminHistoryBy = byFilter;
    db.session.adminHistoryDateFrom = dateFrom;
    db.session.adminHistoryDateTo = dateTo;
    saveDB_local(db);
  }

  document.querySelectorAll('[data-history-select]').forEach(ch => {
    ch.onchange = ()=>{
      const id = ch.getAttribute('data-history-select');
      if(!db.session.adminHistorySelected) db.session.adminHistorySelected = {};

      if(ch.checked){
        db.session.adminHistorySelected[id] = true;
      } else {
        delete db.session.adminHistorySelected[id];
      }

      saveDB_local(db);
    };
  });

  if(selectVisibleBtn){
    selectVisibleBtn.onclick = ()=>{
      const filteredItems = getFilteredItems();
      const visibleLimit = Number(db.session?.adminHistoryLimit || 30);

      filteredItems.slice(0, visibleLimit).forEach(item => {
        db.session.adminHistorySelected[item.id] = true;
      });

      saveDB_local(db);
      render();
    };
  }

  if(clearSelectionBtn){
    clearSelectionBtn.onclick = ()=>{
      db.session.adminHistorySelected = {};
      saveDB_local(db);
      render();
    };
  }

  if(exportFilteredBtn){
    exportFilteredBtn.onclick = ()=>{
      const filteredItems = getFilteredItems();
      if(!filteredItems.length){
        alert('Nėra ką eksportuoti.');
        return;
      }
      exportHistoryRowsToXlsx(filteredItems, 'remonto_istorija_filtruota.xlsx');
    };
  }

  if(exportSelectedBtn){
    exportSelectedBtn.onclick = ()=>{
      const selectedMap = db.session?.adminHistorySelected || {};
      const selectedItems = sortNewestFirst(db.completed || []).filter(item => !!selectedMap[item.id]);

      if(!selectedItems.length){
        alert('Nėra pažymėtų įrašų eksportui.');
        return;
      }

      exportHistoryRowsToXlsx(selectedItems, 'remonto_istorija_pazymeta.xlsx');
    };
  }

  if(showMoreBtn){
    showMoreBtn.onclick = ()=>{
      db.session.adminHistoryLimit = Number(db.session.adminHistoryLimit || 30) + 30;
      saveDB_local(db);
      render();
    };
  }

  if(queryEl) queryEl.addEventListener('input', applyFilter);
  if(equipEl) equipEl.addEventListener('input', applyFilter);
  if(byEl) byEl.addEventListener('input', applyFilter);
  if(fromEl) fromEl.addEventListener('change', applyFilter);
  if(toEl) toEl.addEventListener('change', applyFilter);

  if(clearBtn){
    clearBtn.onclick = ()=>{
      if(queryEl) queryEl.value = '';
      if(equipEl) equipEl.value = '';
      if(byEl) byEl.value = '';
      if(fromEl) fromEl.value = '';
      if(toEl) toEl.value = '';

      db.session.adminHistoryQuery = '';
      db.session.adminHistoryEquip = '';
      db.session.adminHistoryBy = '';
      db.session.adminHistoryDateFrom = '';
      db.session.adminHistoryDateTo = '';
      db.session.adminHistoryLimit = 30;
      saveDB_local(db);

      render();
    };
  }

  applyFilter();
}