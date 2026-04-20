function renderMechanicView(user){
  const view = db.session?.mechView || 'tasks';

  return `
    <div class="card">
      <div class="headerline" style="align-items:flex-start; gap:16px; margin-bottom:12px;">
        <div style="display:flex; align-items:center; gap:12px;">
          <img src="assets/logo.png" alt="Logo" style="height:68px; width:auto; display:block;">
        </div>

        <div class="right" style="margin-left:auto;">
          <span class="pill">${escapeHtml(user.display || user.username)}</span>
          <button class="btn ${view === 'password' ? 'primary' : ''}" data-mech-tab="password">Slaptažodis</button>
          <button class="btn" id="logoutBtn">Atsijungti</button>
        </div>
      </div>

      <div class="tabs" style="margin-top:10px">
        ${tabBtn('tasks','Užduotys',view)}
        ${tabBtn('lube','Tepimai',view)}
        ${tabBtn('notes','Pastabos',view)}
        ${tabBtn('password','Slaptažodis',view)}
      </div>
    </div>

    ${view === 'tasks' ? mechanicTasks(user) : ''}
    ${view === 'lube' ? mechanicLube(user) : ''}
    ${view === 'notes' ? mechanicNotes(user) : ''}
    ${view === 'password' ? changePasswordUI(user) : ''}
  `;
}

function mechanicTasks(user){
  const myId = String(user.id || '');
  const myName = String(user.display || user.username || '').trim().toLowerCase();

  const active = sortNewestFirst(mechanicVisibleTasks(myId));
  const waiting = sortNewestFirst(mechanicWaitingTasks(myId));
  const unseen = active.filter(t => !isSeen(t, myId));

  const mechUsers = (db.users || [])
    .filter(u => u && String(u.role || '').trim().toLowerCase() === 'mechanic')
    .filter(u => (u.display || u.username));

  const helperUsers = mechUsers.filter(u => {
    const uid = String(u.id || '');
    const uname = String(u.display || u.username || '').trim().toLowerCase();

    if(uid && myId && uid === myId) return false;
    if(uname && myName && uname === myName) return false;
    return true;
  });

  const alarmHtml = unseen.length ? `
    <div class="card danger blink" style="padding:10px">
      <div class="alarm">🚨 Nematytos užduotys: ${unseen.length}</div>
      <div class="muted" style="margin-top:6px;font-size:12px">
        Informacija. SEEN spaudžiama prie konkrečios užduoties.
      </div>
    </div>
  ` : '';

  const createHtml = `
    <div class="card">
      <h3 style="margin-top:0">Sukurti savo užduotį</h3>
      <div class="row row-3">
        <div>
          <div class="muted">Technika</div>
          <select id="mEq">
            ${(db.equipment || []).map(e => `
              <option value="${e.id}">${escapeHtml(labelEquip(e.id))}</option>
            `).join('')}
          </select>
        </div>

        <div>
          <div class="muted">Užduoties pavadinimas</div>
          <input id="mTitle" placeholder="Pvz.: Pakeisti žarną, patikrinti cilindrą...">
        </div>

        <div class="right" style="align-items:flex-end">
          <button class="btn primary" id="mCreate">Sukurti užduotį</button>
        </div>
      </div>
    </div>
  `;

  const activeCards = active.length ? active.map(t => {
    const isUnseen = !isSeen(t, myId);
    const expandedKey = `mech_${t.id}`;
    const expanded = isTaskExpanded(expandedKey);
    const cardCls = 'taskCard danger' + (isUnseen ? ' blink' : '');

    const helperPanelId = `helpers_${t.id}`;
    const helperCountId = `helperCount_${t.id}`;

    const helperChecksHtml = helperUsers.length
      ? `
        <div id="${helperPanelId}" style="
          margin-top:8px;
          padding:10px 12px;
          border:1px solid #d1d5db;
          border-radius:10px;
          background:#fff;
        ">
          <div style="
            display:grid;
            grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
            gap:8px 14px;
          ">
            ${helperUsers.map(m => `
              <label style="
                display:flex;
                align-items:center;
                gap:8px;
                padding:6px 8px;
                border:1px solid #e5e7eb;
                border-radius:8px;
                background:#f9fafb;
                cursor:pointer;
              ">
                <input
                  type="checkbox"
                  class="helperCheck"
                  value="${m.id}"
                  data-task-helper="${t.id}"
                  style="width:16px;height:16px"
                >
                <span>${escapeHtml(m.display || m.username)}</span>
              </label>
            `).join('')}
          </div>

          <div class="muted small" style="margin-top:8px" id="${helperCountId}">
            Pažymėta: 0
          </div>
        </div>
      `
      : `
        <div style="
          margin-top:8px;
          padding:10px 12px;
          border:1px solid #d1d5db;
          border-radius:10px;
          background:#fff;
        ">
          <div class="muted">Nėra kitų mechanikų</div>
        </div>
      `;

    const progressHtml = (t.progressLog || []).length ? `
      <div class="muted" style="margin-bottom:10px;font-size:14px">
        Ankstesni komentarai:
        ${(t.progressLog || []).map(p => `
          <div>• ${escapeHtml(p.date || '')} — ${escapeHtml(p.byName || p.by || '')}: ${escapeHtml(p.text || '')}</div>
        `).join('')}
      </div>
    ` : '';

    return `
      <div class="${cardCls}">
        <div class="taskHead" data-toggle-task="${expandedKey}">
          <div class="taskHeadLeft">
            <div class="taskMeta">${escapeHtml(labelEquip(t.equipId))}</div>
            <div class="taskTitle">${escapeHtml(t.title)}</div>
            <div class="taskMeta">
              Paliko: ${escapeHtml(t.createdBy || '—')}
              ${t.createdByRole ? `(${escapeHtml(t.createdByRole)})` : ''}
            </div>
            <div class="taskSummary">${escapeHtml(taskShortSummary(t))}</div>
          </div>

          <div class="taskRight">
            <span class="taskBadge">${escapeHtml(t.status || '—')}${isUnseen ? ' • NEMATYTA' : ''}</span>
            <span class="taskCaret">${expanded ? '▼' : '▸'}</span>
          </div>
        </div>

        ${expanded ? `
          <div class="taskBody">
            ${t.initialComment ? `
              <div style="
                margin-bottom:12px;
                padding:12px 14px;
                border:2px solid #f59e0b;
                border-radius:12px;
                background:#fffbeb;
                color:#92400e;
                font-size:18px;
                line-height:1.45;
                font-weight:700;
              ">
                <div style="font-size:14px; font-weight:600; margin-bottom:6px;">
                  Admin komentaras
                </div>
                <div>${escapeHtml(t.initialComment)}</div>
              </div>
            ` : ''}

            <div class="muted" style="margin-bottom:4px">
              Priskirta: ${t.shared ? 'Bendra visiems' : 'Asmeninė'}
            </div>

            <div class="muted" style="margin-bottom:10px">
              Matė: ${escapeHtml(seenInfo(t))}
            </div>

            ${progressHtml}

            <div style="margin-top:10px">
              <div class="muted">Komentaras (nebūtina)</div>
              <textarea class="mComment" placeholder="Komentaras apie atliktą darbą..."></textarea>
            </div>

            <div class="right" style="margin-top:8px">
              <button class="btn" data-m-save-comment="${t.id}">Išsaugoti komentarą</button>
            </div>

            <div style="margin-top:14px">
              <div style="
                display:flex;
                align-items:center;
                justify-content:space-between;
                gap:12px;
                flex-wrap:wrap;
              ">
                <div class="muted" style="font-weight:600">Padėję mechanikai (jei buvo)</div>
                ${helperUsers.length ? `
                  <button
                    type="button"
                    class="btn"
                    data-toggle-helpers="${t.id}"
                    style="padding:6px 10px"
                  >
                    Rodyti / slėpti
                  </button>
                ` : ''}
              </div>

              ${helperChecksHtml}
            </div>

            <div class="right" style="margin-top:14px">
              ${isUnseen ? `<button class="btn" data-seen="${t.id}">SEEN</button>` : ''}
              <button class="btn" data-m-activate="${t.id}">Vykdoma</button>
              <button class="btn amber" data-m-wait="${t.id}">Perduoti vadovui</button>
              <button class="btn primary" data-m-done="${t.id}">Baigta (siųsti patvirtinimui)</button>
            </div>

            <div style="margin-top:14px">
              <div class="muted">Pridėti foto / dokumentą</div>
              <input type="file" data-task-file="${t.id}">
              <div class="right" style="margin-top:8px">
                <button class="btn" data-upload-task-file="${t.id}">Įkelti failą</button>
              </div>
            </div>

            <div style="margin-top:10px">
              <div class="muted">Prikabinti failai / nuotraukos</div>
              <div style="margin-top:4px">${taskFilesHtml(t.id)}</div>
            </div>
          </div>
        ` : ''}
      </div>
    `;
  }).join('') : '<div class="card"><div class="muted">Aktyvių užduočių nėra</div></div>';

  const waitingCards = waiting.length ? waiting.map(t => {
    const expandedKey = `mech_wait_${t.id}`;
    const expanded = isTaskExpanded(expandedKey);
    const progress = t.progressLog || [];

    return `
      <div class="taskCard">
        <div class="taskHead" data-toggle-task="${expandedKey}">
          <div class="taskHeadLeft">
            <div class="taskMeta">${escapeHtml(labelEquip(t.equipId))}</div>
            <div class="taskTitle">${escapeHtml(t.title)}</div>
            <div class="taskMeta">Paliko: ${escapeHtml(t.createdBy || '—')}</div>
            <div class="taskSummary">${escapeHtml(taskShortSummary(t))}</div>
          </div>

          <div class="taskRight">
            <span class="taskBadge">${escapeHtml(t.status || '—')}</span>
            <span class="taskCaret">${expanded ? '▼' : '▸'}</span>
          </div>
        </div>

        ${expanded ? `
          <div class="taskBody">
            ${(progress && progress.length) ? `
              <div class="muted" style="margin-top:4px;font-size:12px">
                Komentarų istorija:
                ${progress.map(p => `
                  <div>• ${escapeHtml(p.date || '')} — ${escapeHtml(p.byName || p.by || '')}: ${escapeHtml(p.text || '')}</div>
                `).join('')}
              </div>
            ` : ''}

            <div style="margin-top:10px">
              <div class="muted">Komentaras</div>
              <textarea class="mWaitComment" placeholder="Pvz.: detalė užsakyta, laukiam tiekėjo..."></textarea>
            </div>

            <div style="margin-top:10px">
              <div class="muted">Prikabinti failai / nuotraukos</div>
              <div style="margin-top:4px">${taskFilesHtml(t.id)}</div>
            </div>

            <div class="right" style="margin-top:10px">
              <button class="btn amber" data-m-save-wait="${t.id}">Išsaugoti laukiančią</button>
              <button class="btn primary" data-m-activate="${t.id}">Aktyvuoti darbui</button>
            </div>
          </div>
        ` : ''}
      </div>
    `;
  }).join('') : '<div class="card"><div class="muted">Laukiančių užduočių nėra</div></div>';

  return `
    ${alarmHtml}
    ${createHtml}

    <div class="card">
      <h3 style="margin-top:0">Aktyvios užduotys</h3>
    </div>
    ${activeCards}

    <div class="card">
      <h3 style="margin-top:0">Laukiančios užduotys</h3>
    </div>
    ${waitingCards}
  `;
}

function mechanicLube(user){
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
          <select id="lubeEquip">
            <option value="">— Pasirink techniką —</option>
            ${equipmentOpts}
          </select>
        </div>

        <div>
          <div class="muted">Greiferis</div>
          <select id="lubeGrab">
            <option value="">— Arba pasirink greiferį —</option>
            ${grabOpts}
          </select>
        </div>

        <div>
          <div class="muted">Pastaba</div>
          <input id="lubeNote" placeholder="Pvz. Sutepiau visus taškus">
        </div>

        <div class="right" style="align-items:flex-end">
          <button class="btn primary" id="saveLube">Išsaugoti tepimą</button>
        </div>
      </div>

      <div class="muted" style="font-size:12px;margin-top:8px" id="lubeMsg"></div>
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

function mechanicNotes(user){
  if(!db.session) db.session = {};
  if(!db.session.mechExpandedNotes) db.session.mechExpandedNotes = {};

const notes = (db.notes || [])
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
    const expanded = !!db.session.mechExpandedNotes[n.id];
    const done = (n.status || '') === 'done' || (n.status || '') === 'approved';
    const cardClass = done ? 'mech-row done' : 'mech-row open';

    return `
      <div class="${cardClass}">
        <div class="mech-line">
          <div class="mech-main">
            <span class="mech-badge ${done ? 'done' : 'open'}">
              ${escapeHtml(noteTypeLabel(n.type))}
            </span>

            <span class="mech-tech">
              ${escapeHtml(labelEquip(n.equipId) || '—')}
            </span>

            ${n.checklistPoint ? `
              <span class="mech-point">${escapeHtml(n.checklistPoint)}</span>
            ` : ''}

            <span class="mech-text">
              ${escapeHtml((n.text || '').slice(0, 110))}${(n.text || '').length > 110 ? '…' : ''}
            </span>

            <span class="mech-author">
              ${escapeHtml(n.author || '—')}
            </span>

            <span class="mech-date">
              ${escapeHtml(fmt(n.createdAt || n.date) || n.date || '—')}
            </span>
          </div>

          <div class="mech-actions">
            <button class="btn" type="button" data-toggle-note="${n.id}">
              ${expanded ? 'Slėpti' : 'Rodyti'}
            </button>
            <button class="btn primary" data-note-task="${n.id}">
              Paversti užduotimi
            </button>
          </div>
        </div>

        <div class="mech-details ${expanded ? '' : 'hidden'}">
          <div><b>Pilnas tekstas:</b> ${escapeHtml(n.text || '—')}</div>
          <div style="margin-top:6px"><b>Įrašė:</b> ${escapeHtml(n.author || '—')}</div>
          <div style="margin-top:6px"><b>Prikabinti failai / nuotraukos:</b></div>
          <div style="margin-top:4px">
            ${noteFilesHtml(n.id)}
          </div>
        </div>
      </div>
    `;
  }).join('') : '<div class="card"><div class="muted">Pastabų nėra</div></div>';

  return `
    <div class="card">
      <h3 style="margin-top:0">Pastabos</h3>
    </div>

    <div class="mech-list">
      ${rows}
    </div>
  `;
}

function bindMechanicNotes(user){
  document.querySelectorAll('[data-toggle-note]').forEach(btn => {
    btn.onclick = ()=>{
      const noteId = btn.getAttribute('data-toggle-note');
      if(!db.session.mechExpandedNotes) db.session.mechExpandedNotes = {};
      db.session.mechExpandedNotes[noteId] = !db.session.mechExpandedNotes[noteId];
      saveDB_local(db);
      render();
    };
  });

  document.querySelectorAll('[data-note-task]').forEach(btn => {
    btn.onclick = async ()=>{
      const id = btn.getAttribute('data-note-task');
      const note = (db.notes || []).find(n => String(n.id) === String(id));
      if(!note) return;

      if(note.status === 'task'){
        alert('Ši pastaba jau paversta į užduotį.');
        return;
      }

      const title = note.text ? note.text.slice(0, 120) : 'Užduotis pagal pastabą';
      const extraComment = prompt('Komentaras (nebūtina, pvz. ką tiksliai atlikti):', '') || '';

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
}

function bindMechanicView(user){
  bindShell();

  document.querySelectorAll('[data-mech-tab], [data-tab]').forEach(btn => {
    btn.onclick = ()=>{
      db.session.mechView =
        btn.getAttribute('data-mech-tab') ||
        btn.getAttribute('data-tab') ||
        'tasks';
      saveDB_local(db);
      render();
    };
  });

  const view = db.session?.mechView || 'tasks';

  if(view === 'tasks'){
    bindMechanicTasks(user);
    bindTaskFileUploads(user);
  }

  if(view === 'lube'){
    bindMechanicLube(user);
  }

  if(view === 'notes'){
    bindMechanicNotes(user);
    bindTaskFileUploads(user);
  }

  if(view === 'password'){
    bindChangePassword(user);
  }
}

function bindMechanicTasks(user){
  document.querySelectorAll('[data-toggle-task]').forEach(btn => {
    btn.onclick = async ()=>{
      const key = btn.getAttribute('data-toggle-task');
      const taskId = String(key || '').replace(/^mech_/, '').replace(/^mech_wait_/, '');
      const t = (db.tasks || []).find(x => String(x.id) === String(taskId));

      // jei tai aktyvi užduotis ir ji dar nematyta – pažymim automatiškai
      if(t && !isSeen(t, user.id) && String(key || '').startsWith('mech_')){
        const seenBy = { ...(t.seenBy || {}) };
        seenBy[user.id] = new Date().toISOString();

        const updated = await updateTaskInSupabase(t.id, { seenBy });
        if(updated){
          const idx = db.tasks.findIndex(x => String(x.id) === String(t.id));
          if(idx >= 0) db.tasks[idx] = updated;
        }
      }

      toggleTaskExpanded(key);
    };
  });

  document.querySelectorAll('[data-toggle-helpers]').forEach(btn => {
    btn.onclick = ()=>{
      const taskId = btn.getAttribute('data-toggle-helpers');
      const panel = document.getElementById(`helpers_${taskId}`);
      if(!panel) return;

      if(panel.style.display === 'none'){
        panel.style.display = '';
      }else{
        panel.style.display = 'none';
      }
    };
  });

  function updateHelperCounts(){
    document.querySelectorAll('[id^="helperCount_"]').forEach(el => {
      const taskId = el.id.replace('helperCount_', '');
      const checked = document.querySelectorAll(`.helperCheck[data-task-helper="${taskId}"]:checked`).length;
      el.textContent = `Pažymėta: ${checked}`;
    });
  }

  document.querySelectorAll('.helperCheck').forEach(ch => {
    ch.onchange = updateHelperCounts;
  });

  updateHelperCounts();

  document.querySelectorAll('[data-seen]').forEach(btn => {
    btn.onclick = async ()=>{
      const id = btn.getAttribute('data-seen');
      const t = (db.tasks || []).find(x => String(x.id) === String(id));
      if(!t) return;

      const seenBy = { ...(t.seenBy || {}) };
      seenBy[user.id] = new Date().toISOString();

      const updated = await updateTaskInSupabase(t.id, { seenBy });
      if(!updated){
        alert('Nepavyko pažymėti SEEN.');
        return;
      }

      const idx = db.tasks.findIndex(x => String(x.id) === String(t.id));
      if(idx >= 0) db.tasks[idx] = updated;

      saveDB_local(db);
      render();
    };
  });

  document.querySelectorAll('[data-m-save-comment]').forEach(btn => {
    btn.onclick = async ()=>{
      const id = btn.getAttribute('data-m-save-comment');
      const t = (db.tasks || []).find(x => String(x.id) === String(id));
      if(!t) return;

      const card = btn.closest('.taskBody');
      const ta = card ? card.querySelector('.mComment') : null;
      const comment = safeTrim(ta?.value || '');

      if(!comment){
        alert('Įrašyk komentarą.');
        return;
      }

      const newProgressLog = [...(t.progressLog || [])];
      newProgressLog.push({
        date: fmt(Date.now()),
        by: user.display || user.username,
        byName: user.display || user.username,
        text: comment
      });

      const updated = await updateTaskInSupabase(t.id, {
        progressLog: newProgressLog
      });

      if(!updated){
        alert('Nepavyko išsaugoti komentaro.');
        return;
      }

      const idx = db.tasks.findIndex(x => String(x.id) === String(t.id));
      if(idx >= 0) db.tasks[idx] = updated;

      if(ta) ta.value = '';

      saveDB_local(db);
      render();
    };
  });

  document.querySelectorAll('[data-m-wait]').forEach(btn => {
    btn.onclick = async ()=>{
      const id = btn.getAttribute('data-m-wait');
      const t = (db.tasks || []).find(x => String(x.id) === String(id));
      if(!t) return;

      const card = btn.closest('.taskBody');
      const ta = card ? card.querySelector('.mComment') : null;
      const comment = safeTrim(ta?.value || '');

      const newProgressLog = [...(t.progressLog || [])];
      if(comment){
        newProgressLog.push({
          date: fmt(Date.now()),
          by: user.display || user.username,
          byName: user.display || user.username,
          text: `[Laukianti] ${comment}`
        });
      }

      const updated = await updateTaskInSupabase(t.id, {
        status: 'Perduota vadovui',
        progressLog: newProgressLog
      });

      if(!updated){
        alert('Nepavyko perduoti vadovui.');
        return;
      }

      const idx = db.tasks.findIndex(x => String(x.id) === String(t.id));
      if(idx >= 0) db.tasks[idx] = updated;

      saveDB_local(db);
      render();
    };
  });

  document.querySelectorAll('[data-m-save-wait]').forEach(btn => {
    btn.onclick = async ()=>{
      const id = btn.getAttribute('data-m-save-wait');
      const t = (db.tasks || []).find(x => String(x.id) === String(id));
      if(!t) return;

      const card = btn.closest('.taskBody');
      const ta = card ? card.querySelector('.mWaitComment') : null;
      const comment = safeTrim(ta?.value || '');

      const newProgressLog = [...(t.progressLog || [])];
      if(comment){
        newProgressLog.push({
          date: fmt(Date.now()),
          by: user.display || user.username,
          byName: user.display || user.username,
          text: `[Laukianti] ${comment}`
        });
      }

      const updated = await updateTaskInSupabase(t.id, {
        status: 'Laukianti',
        progressLog: newProgressLog
      });

      if(!updated){
        alert('Nepavyko išsaugoti laukiančios.');
        return;
      }

      const idx = db.tasks.findIndex(x => String(x.id) === String(t.id));
      if(idx >= 0) db.tasks[idx] = updated;

      saveDB_local(db);
      render();
    };
  });

  document.querySelectorAll('[data-m-activate]').forEach(btn => {
    btn.onclick = async ()=>{
      const id = btn.getAttribute('data-m-activate');
      const t = (db.tasks || []).find(x => String(x.id) === String(id));
      if(!t) return;

      const updated = await updateTaskInSupabase(t.id, {
        status: 'Vykdoma'
      });

      if(!updated){
        alert('Nepavyko aktyvuoti užduoties.');
        return;
      }

      const idx = db.tasks.findIndex(x => String(x.id) === String(t.id));
      if(idx >= 0) db.tasks[idx] = updated;

      saveDB_local(db);
      render();
    };
  });

document.querySelectorAll('[data-m-done]').forEach(btn => {
  btn.onclick = async ()=>{
    const id = btn.getAttribute('data-m-done');
    const t = (db.tasks || []).find(x => String(x.id) === String(id));
    if(!t) return;

    const card = btn.closest('.taskBody');
    const ta = card ? card.querySelector('.mComment') : null;
    const liveComment = safeTrim(ta?.value || '');

    const helperIds = card
      ? Array.from(card.querySelectorAll('.helperCheck:checked')).map(x => x.value).filter(Boolean)
      : [];

    const cleanHelperIds = helperIds.filter(h => String(h) !== String(user.id));

    const newProgressLog = [...(t.progressLog || [])];

    if(liveComment){
      newProgressLog.push({
        date: fmt(Date.now()),
        by: user.display || user.username,
        byName: user.display || user.username,
        text: liveComment
      });
    }

    // jei šiuo momentu textarea tuščia, imam paskutinį mechaniko komentarą iš istorijos
    const latestMechanicComment = [...newProgressLog]
      .reverse()
      .find(log =>
        String(log.byName || log.by || '').trim() === String(user.display || user.username || '').trim() &&
        !String(log.text || '').startsWith('[Laukianti]') &&
        !String(log.text || '').startsWith('[Grąžinta')
      );

    const approvalComment = liveComment || safeTrim(latestMechanicComment?.text || '');

    const updatedTask = await updateTaskInSupabase(t.id, {
      status: 'Perduota tvirtinimui',
      progressLog: newProgressLog,
      passedToManagerAt: new Date().toISOString(),
      passedToManagerBy: user.display || user.username,
      passedToManagerById: user.id
    });

    if(!updatedTask){
      alert('Nepavyko užbaigti užduoties');
      return;
    }

    const savedApproval = await createApprovalInSupabase({
      taskId: updatedTask.id,
      equipId: updatedTask.equipId,
      issue: updatedTask.title,
      date: today(),
      start: nowHM(),
      durationMin: 30,
      doneBy: user.display || user.username || '—',
      doneById: user.id || null,
      role: 'mechanikas',
      comment: approvalComment,
      initialComment: updatedTask.initialComment || '',
      helpers: cleanHelperIds
    });

    if(savedApproval){
      db.approvals = db.approvals || [];
      db.approvals.unshift(savedApproval);
    }

    const idx = db.tasks.findIndex(x => String(x.id) === String(t.id));
    if(idx >= 0) db.tasks[idx] = updatedTask;

    saveDB_local(db);
    render();
  };
});

  const create = document.getElementById('mCreate');
  if(create){
    create.onclick = async ()=>{
      const equipId = document.getElementById('mEq')?.value || '';
      const title = safeTrim(document.getElementById('mTitle')?.value) || 'Užduotis';

      if(!equipId){
        alert('Pasirink techniką.');
        return;
      }

      const savedTask = await createTaskInSupabase({
        equipId,
        title,
        status: 'Nauja',
        assignedTo: [],
        shared: true,
        source: 'mechanic-self',
        createdAt: Date.now(),
        createdBy: user.display || user.username,
        createdById: user.id,
        createdByRole: user.role
      });

      if(!savedTask){
        alert('Nepavyko sukurti užduoties.');
        return;
      }

      db.tasks.unshift(savedTask);

      const titleEl = document.getElementById('mTitle');
      if(titleEl) titleEl.value = '';

      saveDB_local(db);
      render();
    };
  }
}