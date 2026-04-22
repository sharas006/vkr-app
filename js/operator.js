function ensureOperatorData(){
  if(!db.session) db.session = {};
  if(!db.session.opView) db.session.opView = 'home';
  if(!db.session.opHistoryFilter) db.session.opHistoryFilter = 'all';
  if(!db.session.opExpandedNotes) db.session.opExpandedNotes = {};
}

function normalizeNote(note){
  if(!note) return null;
  return {
    id: note.id,
    equipId: note.equipId ?? note.equip_id ?? null,
    date: note.date || note.created_at || '',
    text: note.text || '',
    author: note.author || note.user_name || '—',
    authorId: note.authorId ?? note.author_id ?? null,
    type: note.type || 'quick-note',
    checklistPoint: note.checklistPoint ?? note.checklist_point ?? null,
    status: note.status || 'open',
    createdAt: note.createdAt ?? note.created_at ?? null
  };
}

function normalizeDailyCheck(item){
  if(!item) return null;
  return {
    id: item.id,
    equipId: item.equipId ?? item.equip_id ?? null,
    userId: item.userId ?? item.user_id ?? null,
    userName: item.userName ?? item.user_name ?? null,
    date: item.date || '',
    shiftKey: item.shiftKey ?? item.shift_key ?? '',
    shiftName: item.shiftName ?? item.shift_name ?? '',
    doneAt: item.doneAt ?? item.done_at ?? null
  };
}

function formatShiftDate(dateObj){
  const y = dateObj.getFullYear();
  const m = String(dateObj.getMonth() + 1).padStart(2, '0');
  const d = String(dateObj.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function dailyChecksForEquip(eid){
  return (db.dailyChecks || [])
    .map(normalizeDailyCheck)
    .filter(Boolean)
    .filter(x => String(x.equipId) === String(eid));
}

function getLatestDailyCheck(eid){
  return dailyChecksForEquip(eid)
    .sort((a, b) => (a.doneAt || a.date || '') < (b.doneAt || b.date || '') ? 1 : -1)[0] || null;
}

function operatorNotesForEquip(eid){
  return (db.notes || [])
    .map(normalizeNote)
    .filter(Boolean)
    .filter(n => String(n.equipId) === String(eid))
    .sort((a, b) => {
      const ad = a.createdAt || a.date || '';
      const bd = b.createdAt || b.date || '';
      return ad < bd ? 1 : -1;
    });
}

function getChecklistForEquip(eid){
  const items = db.equipmentChecklists?.[eid] || [];
  if(items.length){
    return items.map((x, idx) => ({
      id: x.id || `chk_${eid}_${idx}`,
      textLt: x.textLt || x.text || '',
      textRu: x.textRu || '',
      sortOrder: x.sortOrder || (idx + 1)
    }));
  }

  return defaultChecklistTemplate().map((x, idx) => ({
    id: `default_${eid}_${idx}`,
    textLt: x.textLt || '',
    textRu: x.textRu || '',
    sortOrder: idx + 1
  }));
}

function getCurrentShiftInfo(now = new Date()){
  const d = new Date(now);
  const hour = d.getHours();

  // 07:00 - 18:59 = dieninė
  if(hour >= 7 && hour < 19){
    const shiftDate = formatShiftDate(d);
    return {
      shiftDate,
      shiftKey: `${shiftDate}_DAY`,
      shiftName: 'DAY'
    };
  }

  // 19:00 - 23:59 = naktinė tos pačios dienos
  // 00:00 - 06:59 = naktinė ankstesnės dienos
  const anchor = new Date(d);
  if(hour < 7){
    anchor.setDate(anchor.getDate() - 1);
  }

  const shiftDate = formatShiftDate(anchor);
  return {
    shiftDate,
    shiftKey: `${shiftDate}_NIGHT`,
    shiftName: 'NIGHT'
  };
}

function hasCurrentShiftCheck(eid){
  const shift = getCurrentShiftInfo();
  return dailyChecksForEquip(eid).some(x => x.shiftKey === shift.shiftKey);
}

function getOpenNotesForEquip(eid){
  return operatorNotesForEquip(eid).filter(n => (n.status || 'open') !== 'done' && (n.status || 'open') !== 'approved');
}

function noteTypeLabel(type){
  if(type === 'check') return t('check_note');
  if(type === 'check-summary') return t('check_summary');
  if(type === 'quick-note') return t('quick_note');
  return t('record');
}

function noteStatusLabel(status){
  if(status === 'done') return t('done');
  if(status === 'approved') return t('approved');
  if(status === 'in_progress') return t('in_progress');
  return t('active');
}

function noteStatusClass(status){
  if(status === 'done' || status === 'approved') return 'status-done';
  if(status === 'in_progress') return 'status-progress';
  return 'status-open';
}

function buildOperatorHistory(eid, filter){
  let notes = operatorNotesForEquip(eid);

  if(filter === 'open'){
    notes = notes.filter(n => {
      const st = n.status || 'open';
      return st === 'open' || st === 'in_progress';
    });
  }

  if(filter === 'check'){
    notes = notes.filter(n => n.type === 'check' || n.type === 'check-summary');
  }

  if(filter === 'quick'){
    notes = notes.filter(n => n.type === 'quick-note');
  }

if(!notes.length){
  return `<div class="muted">${escapeHtml(t('no_records'))}</div>`;
}

  return notes.map(n => {
    const expanded = !!db.session?.opExpandedNotes?.[n.id];

    return `
      <div class="note-card ${noteStatusClass(n.status)} ${expanded ? 'expanded' : 'collapsed'}">
        <div class="note-head">
          <div class="note-badges">
            <span class="pill small">${escapeHtml(noteTypeLabel(n.type))}</span>
            <span class="pill small ${noteStatusClass(n.status)}">${escapeHtml(noteStatusLabel(n.status))}</span>
          </div>
          <div class="muted small">${escapeHtml(fmt(n.createdAt || n.date) || n.date || '—')}</div>
        </div>

        <div class="note-summary-row">
          <div class="note-summary-text">
            ${escapeHtml((n.text || '').slice(0, 90))}${(n.text || '').length > 90 ? '…' : ''}
          </div>
          <button class="btn" type="button" data-toggle-note="${escapeHtml(n.id)}">
            ${expanded ? t('hide') : t('show')}
          </button>
        </div>

        <div class="note-details ${expanded ? '' : 'hidden'}">
          ${n.checklistPoint ? `
            <div class="muted small" style="margin-bottom:6px">
              ${escapeHtml(t('point'))}: <b>${escapeHtml(n.checklistPoint)}</b>
            </div>
          ` : ''}

          <div class="note-text">${escapeHtml(n.text || '')}</div>
          <div class="muted small">${escapeHtml(t('entered_by'))}: ${escapeHtml(n.author || '—')}</div>
          <div style="margin-top:6px">${noteFilesHtml(n.id)}</div>
        </div>
      </div>
    `;
  }).join('');
}

function operatorChecklistDefaults(){
  return defaultChecklistTemplate();
}

function renderOpLangSwitcher(){
  const lang = getOpLang();
  return `
    <div class="right" style="margin-bottom:10px">
      <button class="btn ${lang === 'lt' ? 'primary' : ''}" data-op-lang="lt">LT</button>
      <button class="btn ${lang === 'ru' ? 'primary' : ''}" data-op-lang="ru">RU</button>
    </div>
  `;
}

function renderOperatorView(user){
  ensureOperatorData();

  const eid = db.session.deviceEquipId || user.equipId || null;
  const rawView = db.session.opView || 'home';

  let body = '';

  if(!eid){
    body = `
      ${renderOpLangSwitcher()}
      <div class="card danger soft-danger">
        <h3 style="margin-top:0">${escapeHtml(t('no_device'))}</h3>
        <div class="muted" style="margin-top:6px">
          ${escapeHtml(t('device_not_linked_desc'))}
        </div>
        <div class="device-box" style="margin-top:12px">
          <div class="muted small">Device ID</div>
          <code>${escapeHtml(db.session.deviceId || getOrCreateDeviceId())}</code>
        </div>
        <div style="margin-top:12px">
          Paprašykite administratoriaus lange <b>Planšetės</b> priskirti šiai planšetei techniką.
        </div>
      </div>
    `;

    return renderShell(`${user.display || user.username} • operator`, body);
  }

  const shiftInfo = getCurrentShiftInfo();
  const shiftChecked = hasCurrentShiftCheck(eid);
  const view = (!shiftChecked && rawView !== 'check') ? 'check' : rawView;
  const latestCheck = getLatestDailyCheck(eid);

  if(view === 'home'){
    body = `
      ${renderOpLangSwitcher()}

      <div class="card operator-hero">
        <div class="headerline" style="align-items:flex-start">
          <div>
            <div class="muted small">Technika</div>
            <h2 style="margin:4px 0 4px 0">${escapeHtml(labelEquip(eid))}</h2>
            <div class="muted">${escapeHtml(t('operator_label'))}: ${escapeHtml(user.display || user.username)}</div>
          </div>
          <span class="pill">${shiftChecked ? escapeHtml(t('check_done')) : escapeHtml(t('need_check'))}</span>
        </div>
      </div>

      <div class="stats-grid">
        <div class="card stat-card ${shiftChecked ? 'stat-ok' : 'stat-warn'}">
          <div class="muted small">${escapeHtml(t('today_check'))}</div>
          <div class="stat-value">${shiftChecked ? escapeHtml(t('done_short')) : escapeHtml(t('not_done_short'))}</div>
          <div class="muted small">
            ${latestCheck
              ? `${escapeHtml(t('last_check'))}: ${escapeHtml(fmt(latestCheck.doneAt || latestCheck.date))}`
              : escapeHtml(t('no_record_yet'))
            }
          </div>
        </div>

        ${dashboardWeatherCard()}
      </div>

      ${shiftChecked ? '' : `
        <div class="card danger blink soft-danger">
          <b>❗ ${escapeHtml(t('today_check_not_done'))}</b>
          <div class="muted" style="margin-top:6px">
            ${escapeHtml(t('start_with_daily_check'))}
          </div>
        </div>
      `}

      <div class="action-grid">
        <button class="btn action-btn primary" id="opCheck">${escapeHtml(t('machine_check')).toUpperCase()}</button>
        <button class="btn action-btn amber" id="opQuickNote">${escapeHtml(t('report_defect')).toUpperCase()}</button>
        <button class="btn action-btn" id="opHist">${escapeHtml(t('history_notes')).toUpperCase()}</button>
        <button class="btn action-btn" id="opPw">${escapeHtml(t('password')).toUpperCase()}</button>
      </div>
    `;
  }

  if(view === 'check'){
    const fields = getChecklistForEquip(eid);

    body = `
      ${renderOpLangSwitcher()}

      <div class="card">
        <div class="headerline">
          <button class="btn" id="opBack1">${escapeHtml(t('back'))}</button>
          <div class="muted small">${escapeHtml(labelEquip(eid))}</div>
        </div>
        <h3>${escapeHtml(t('daily_check'))}</h3>

        <div class="muted" style="margin-top:-6px;margin-bottom:8px">
          ${escapeHtml(t('all_points_required'))}
        </div>

        <div class="check-progress">
          <div><b id="chkDoneCount">0</b> / ${fields.length} ${escapeHtml(t('marked'))}</div>
          <div class="muted small" id="chkRemain">${escapeHtml(t('remaining'))} ${fields.length}</div>
        </div>

        <div id="chkWrap"></div>

        <div class="right" style="margin-top:10px">
          <button class="btn primary" id="opSaveCheck">${escapeHtml(t('save_check'))}</button>
        </div>
      </div>
    `;
  }

  if(view === 'quicknote'){
    body = `
      ${renderOpLangSwitcher()}
      <div class="card">
        <button class="btn" id="opBackQuick">${escapeHtml(t('back'))}</button>
        <h3>${escapeHtml(t('report_defect'))}</h3>

        <div class="muted" style="margin-bottom:8px">
          ${escapeHtml(t('defect_desc_help'))}
        </div>

        <div>
          <div class="muted">${escapeHtml(t('defect_description'))}</div>
          <textarea id="quickNoteText" rows="5" placeholder="${escapeHtml(t('defect_placeholder'))}"></textarea>
        </div>

        <div style="margin-top:10px">
          <div class="muted">Nuotrauka / failas</div>
          <input type="file" id="quickNoteFile" accept="image/*,application/pdf">
        </div>

        <div class="right" style="margin-top:10px">
          <button class="btn amber" id="saveQuickNote">${escapeHtml(t('save_defect'))}</button>
        </div>
      </div>
    `;
  }

  if(view === 'history'){
    const filter = db.session.opHistoryFilter || 'all';
    body = `
      ${renderOpLangSwitcher()}
      <div class="card">
        <div class="headerline">
          <button class="btn" id="opBack3">${escapeHtml(t('back'))}</button>
          <div class="right" style="justify-content:flex-start">
            <button class="btn ${filter === 'all' ? 'primary' : ''}" data-hfilter="all">${escapeHtml(t('all'))}</button>
            <button class="btn ${filter === 'quick' ? 'primary' : ''}" data-hfilter="quick">${escapeHtml(t('quick_notes'))}</button>
            <button class="btn ${filter === 'check' ? 'primary' : ''}" data-hfilter="check">${escapeHtml(t('checks'))}</button>
            <button class="btn ${filter === 'open' ? 'primary' : ''}" data-hfilter="open">${escapeHtml(t('open'))}</button>
          </div>
        </div>

        <h3>${escapeHtml(t('history_notes'))}</h3>
        <div class="muted" style="margin-top:-4px;margin-bottom:10px">
          ${escapeHtml(t('history_all_records'))}
        </div>

        <div class="note-list" style="margin-top:10px">
          ${buildOperatorHistory(eid, filter)}
        </div>
      </div>
    `;
  }

  if(view === 'password'){
    body = `
      ${renderOpLangSwitcher()}
      ${changePasswordUI(user)}
    `;
  }

  return renderShell(`${user.display || user.username} • operator`, body);
}

function bindOperatorView(user){
  bindShell();
  bindTaskFileUploads(user);

  document.querySelectorAll('[data-op-lang]').forEach(btn => {
    btn.onclick = ()=>{
      const lang = btn.getAttribute('data-op-lang');
      setOpLang(lang);
      render();
    };
  });

  const eid = db.session.deviceEquipId || user.equipId || null;
  if(!eid) return;

  const shiftChecked = hasCurrentShiftCheck(eid);
  let view = db.session.opView || 'home';

  if(!shiftChecked && view !== 'check'){
    db.session.opView = 'check';
    saveDB_local(db);
    render();
    return;
  }

  view = db.session.opView || 'home';

  if(view === 'home'){
    loadDashboardWeather();

    const opCheck = document.getElementById('opCheck');
    const opQuickNote = document.getElementById('opQuickNote');
    const opHist = document.getElementById('opHist');
    const opPw = document.getElementById('opPw');

    if(opCheck){
      opCheck.onclick = ()=>{
        db.session.opView = 'check';
        saveDB_local(db);
        render();
      };
    }

    if(opQuickNote){
      opQuickNote.onclick = ()=>{
        if(!hasCurrentShiftCheck(eid)){
          db.session.opView = 'check';
          saveDB_local(db);
          render();
          return;
        }
        db.session.opView = 'quicknote';
        saveDB_local(db);
        render();
      };
    }

    if(opHist){
      opHist.onclick = ()=>{
        if(!hasCurrentShiftCheck(eid)){
          db.session.opView = 'check';
          saveDB_local(db);
          render();
          return;
        }
        db.session.opView = 'history';
        db.session.opHistoryFilter = 'all';
        saveDB_local(db);
        render();
      };
    }

    if(opPw){
      opPw.onclick = ()=>{
        if(!hasCurrentShiftCheck(eid)){
          db.session.opView = 'check';
          saveDB_local(db);
          render();
          return;
        }
        db.session.opView = 'password';
        saveDB_local(db);
        render();
      };
    }
  }

  if(view === 'check'){
    const fields = getChecklistForEquip(eid);
    const wrap = document.getElementById('chkWrap');
    const doneCountEl = document.getElementById('chkDoneCount');
    const remainEl = document.getElementById('chkRemain');

    function updateProgress(){
      const cards = Array.from(document.querySelectorAll('.chkCard'));
      const done = cards.filter(card => (card.dataset.status || 'none') !== 'none').length;
      if(doneCountEl) doneCountEl.textContent = String(done);
      if(remainEl) remainEl.textContent = `${t('remaining')} ${cards.length - done}`;
    }

    if(wrap){
      wrap.innerHTML = fields.map((f, i) => `
        <div class="card chkCard" data-i="${i}" data-status="none">
          <div class="chkTop">
            <div>
              <div class="chkTitle">${i + 1}. ${escapeHtml(checklistItemLabel(f))}</div>
              <div class="muted small" style="margin-top:2px">${escapeHtml(t('all_points_required'))}</div>
            </div>
            <div class="chkActions">
              <button type="button" class="btn okBtn" data-i="${i}">OK</button>
              <button type="button" class="btn red nokBtn" data-i="${i}">${escapeHtml(t('not_ok'))}</button>
            </div>
          </div>

          <div class="hidden" id="note-${i}" style="margin-top:8px">
            <textarea class="narea" data-i="${i}" placeholder="${escapeHtml(t('comment_required_if_nok'))}"></textarea>
          </div>
        </div>
      `).join('');

      wrap.onclick = (ev)=>{
        const ok = ev.target.closest('.okBtn');
        const nok = ev.target.closest('.nokBtn');
        if(!ok && !nok) return;

        const btn = ok || nok;
        const idx = btn.getAttribute('data-i');
        const card = btn.closest('.chkCard');
        if(!card) return;

        const noteWrap = document.getElementById(`note-${idx}`);
        const okBtn = card.querySelector('.okBtn');
        const nokBtn = card.querySelector('.nokBtn');

        card.classList.remove('is-ok', 'is-nok', 'req-miss');

        if(ok){
          card.dataset.status = 'ok';
          card.classList.add('is-ok');
          if(okBtn) okBtn.classList.add('pressed', 'green');
          if(nokBtn) nokBtn.classList.remove('pressed');
          if(noteWrap) noteWrap.classList.add('hidden');
        }

        if(nok){
          card.dataset.status = 'nok';
          card.classList.add('is-nok');
          if(nokBtn) nokBtn.classList.add('pressed');
          if(okBtn) okBtn.classList.remove('pressed', 'green');
          if(noteWrap) noteWrap.classList.remove('hidden');
        }

        updateProgress();
      };

      updateProgress();
    }

    const backBtn = document.getElementById('opBack1');
    if(backBtn){
      backBtn.onclick = ()=>{
        if(!hasCurrentShiftCheck(eid)){
          return;
        }
        db.session.opView = 'home';
        saveDB_local(db);
        render();
      };
    }

    const saveBtn = document.getElementById('opSaveCheck');
    if(saveBtn){
      let savingCheck = false;

      saveBtn.onclick = async ()=>{
        if(savingCheck) return;

        const currentShift = getCurrentShiftInfo();
        const alreadyCheckedShift = dailyChecksForEquip(eid).some(x => x.shiftKey === currentShift.shiftKey);

        if(alreadyCheckedShift){
          alert(t('today_check_already_saved'));
          db.session.opView = 'home';
          saveDB_local(db);
          render();
          return;
        }

        savingCheck = true;
        saveBtn.disabled = true;
        const oldText = saveBtn.textContent;
        saveBtn.textContent = t('saving');

        try {
          const cards = Array.from(document.querySelectorAll('.chkCard'));
          let hasError = false;
          let notesCount = 0;

          for(const card of cards){
            const status = card.dataset.status || 'none';

            if(status === 'none'){
              card.classList.add('req-miss');
              hasError = true;
              continue;
            }

            if(status === 'nok'){
              const ta = card.querySelector('.narea');
              const val = safeTrim(ta ? ta.value : '');
              if(!val){
                card.classList.add('req-miss');
                hasError = true;
              }
            }
          }

          if(hasError){
            alert(t('cannot_save_check_validation'));
            return;
          }

          for(const card of cards){
            const idx = Number(card.getAttribute('data-i'));
            const status = card.dataset.status;

            if(status === 'nok'){
              notesCount++;

              const ta = card.querySelector('.narea');
              const val = safeTrim(ta ? ta.value : '');
              const pointItem = fields[idx] || null;
              const point = pointItem
                ? (pointItem.textLt || checklistItemLabel(pointItem))
                : t('unknown_point');

              const savedNote = await createNoteInSupabase({
                equipId: eid,
                date: currentShift.shiftDate,
                text: val,
                author: user.display || user.username,
                authorId: user.id,
                type: 'check',
                status: 'open',
                checklistPoint: point
              });

              if(savedNote){
                if(!db.notes) db.notes = [];
                db.notes.unshift(savedNote);
              }
            }
          }

          const savedDailyCheck = await saveDailyCheckInSupabase({
            equipId: eid,
            userId: user.id,
            userName: user.display || user.username,
            date: currentShift.shiftDate,
            shiftKey: currentShift.shiftKey,
            shiftName: currentShift.shiftName,
            doneAt: new Date().toISOString()
          });

          if(!savedDailyCheck){
            alert(t('failed_save_daily_check'));
            return;
          }

          db.dailyChecks = (db.dailyChecks || [])
            .map(normalizeDailyCheck)
            .filter(x => !(String(x.equipId) === String(eid) && x.shiftKey === currentShift.shiftKey));

          db.dailyChecks.push(savedDailyCheck);

          const savedSummaryNote = await createNoteInSupabase({
            equipId: eid,
            date: currentShift.shiftDate,
            text: `Patikrą atliko ${user.display || user.username}. Pamaina: ${currentShift.shiftName}. Pastabų skaičius: ${notesCount}.`,
            author: user.display || user.username,
            authorId: user.id,
            type: 'check-summary',
            status: 'done'
          });

          if(savedSummaryNote){
            if(!db.notes) db.notes = [];
            db.notes.unshift(savedSummaryNote);
          }

          alert(t('check_saved'));
          db.session.opView = 'home';
          saveDB_local(db);
          render();
        } finally {
          savingCheck = false;
          saveBtn.disabled = false;
          saveBtn.textContent = oldText;
        }
      };
    }
  }

  if(view === 'quicknote'){
    const backBtn = document.getElementById('opBackQuick');
    if(backBtn){
      backBtn.onclick = ()=>{
        db.session.opView = 'home';
        saveDB_local(db);
        render();
      };
    }

    const saveBtn = document.getElementById('saveQuickNote');
    if(saveBtn){
      let savingQuickNote = false;

      saveBtn.onclick = async ()=>{
        if(savingQuickNote) return;

        const txt = safeTrim(document.getElementById('quickNoteText')?.value || '');
        const file = document.getElementById('quickNoteFile')?.files?.[0] || null;

        if(!txt){
          alert(t('enter_defect'));
          return;
        }

        savingQuickNote = true;
        saveBtn.disabled = true;
        const oldText = saveBtn.textContent;
        saveBtn.textContent = t('saving');

        try {
          const savedNote = await createNoteInSupabase({
            equipId: eid,
            date: getCurrentShiftInfo().shiftDate,
            text: txt,
            author: user.display || user.username,
            authorId: user.id,
            type: 'quick-note',
            status: 'open'
          });

          if(!savedNote){
            alert(t('failed_save_defect'));
            return;
          }

          if(!db.notes) db.notes = [];
          db.notes.unshift(savedNote);

          if(file){
            const savedFile = await uploadTaskFileToSupabase(file, { noteId: savedNote.id }, user);
            if(savedFile){
              if(!db.taskFiles) db.taskFiles = [];
              db.taskFiles.unshift(savedFile);
            } else {
              alert(t('defect_saved_but_file_failed'));
            }
          }

          alert(t('defect_saved'));
          db.session.opView = 'home';
          saveDB_local(db);
          render();
        } finally {
          savingQuickNote = false;
          saveBtn.disabled = false;
          saveBtn.textContent = oldText;
        }
      };
    }
  }

  if(view === 'history'){
    const backBtn = document.getElementById('opBack3');
    if(backBtn){
      backBtn.onclick = ()=>{
        db.session.opView = 'home';
        saveDB_local(db);
        render();
      };
    }

    document.querySelectorAll('[data-hfilter]').forEach(btn => {
      btn.onclick = ()=>{
        db.session.opHistoryFilter = btn.getAttribute('data-hfilter') || 'all';
        saveDB_local(db);
        render();
      };
    });

    document.querySelectorAll('[data-toggle-note]').forEach(btn => {
      btn.onclick = ()=>{
        const noteId = btn.getAttribute('data-toggle-note');
        if(!db.session.opExpandedNotes) db.session.opExpandedNotes = {};
        db.session.opExpandedNotes[noteId] = !db.session.opExpandedNotes[noteId];
        saveDB_local(db);
        render();
      };
    });
  }

  if(view === 'password'){
    bindChangePassword(user);
  }
}