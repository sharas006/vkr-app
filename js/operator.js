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
    doneAt: item.doneAt ?? item.done_at ?? null
  };
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

function dailyChecksForEquip(eid){
  return (db.dailyChecks || [])
    .map(normalizeDailyCheck)
    .filter(Boolean)
    .filter(x => String(x.equipId) === String(eid));
}

function hasTodayCheck(eid){
  return dailyChecksForEquip(eid).some(x => x.date === today());
}

function getChecklistForEquip(eid){
  const items = db.equipmentChecklists?.[eid] || [];
  if(items.length){
    return items.map(x => x.text);
  }

  return [
    'Variklio tepalas',
    'Hidraulikos tepalas',
    'Greičių dėžės tepalas',
    'Aušinimo skystis',
    'Langų apiplovimo skystis',
    'Tepimo bakelio papildymas',
    'Vizualinė apžiūra: mašinos',
    'Vizualinė apžiūra: hidraulinių žarnų',
    'Vizualinė apžiūra: ratų',
    'Rankinis tepimo taškų pratepimas'
  ];
}

function getOpenNotesForEquip(eid){
  return operatorNotesForEquip(eid).filter(n => (n.status || 'open') !== 'done' && (n.status || 'open') !== 'approved');
}

function getLatestDailyCheck(eid){
  return dailyChecksForEquip(eid)
    .sort((a, b) => (a.doneAt || a.date || '') < (b.doneAt || b.date || '') ? 1 : -1)[0] || null;
}

function noteTypeLabel(type){
  if(type === 'check') return 'Patikros pastaba';
  if(type === 'check-summary') return 'Patikra';
  if(type === 'quick-note') return 'Trūkumas';
  return 'Įrašas';
}

function noteStatusLabel(status){
  if(status === 'done') return 'Baigta';
  if(status === 'approved') return 'Patvirtinta';
  if(status === 'in_progress') return 'Vykdoma';
  return 'Atvira';
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
    return '<div class="muted">Įrašų nerasta.</div>';
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
            ${expanded ? 'Slėpti' : 'Rodyti'}
          </button>
        </div>

        <div class="note-details ${expanded ? '' : 'hidden'}">
          ${n.checklistPoint ? `
            <div class="muted small" style="margin-bottom:6px">
              Punktas: <b>${escapeHtml(n.checklistPoint)}</b>
            </div>
          ` : ''}

          <div class="note-text">${escapeHtml(n.text || '')}</div>
          <div class="muted small">Įrašė: ${escapeHtml(n.author || '—')}</div>
          <div style="margin-top:6px">${noteFilesHtml(n.id)}</div>
        </div>
      </div>
    `;
  }).join('');
}

function operatorChecklistDefaults(){
  return [
    'Variklio tepalas',
    'Hidraulikos tepalas',
    'Greičių dėžės tepalas',
    'Aušinimo skystis',
    'Langų apiplovimo skystis',
    'Tepimo bakelio papildymas',
    'Vizualinė apžiūra: mašinos',
    'Vizualinė apžiūra: hidraulinių žarnų',
    'Vizualinė apžiūra: ratų',
    'Rankinis tepimo taškų pratepimas',
    'Pridėti nuo savęs'
  ];
}

function renderOperatorView(user){
  ensureOperatorData();

  const eid = db.session.deviceEquipId || user.equipId || null;
  const todayChecked = eid ? hasTodayCheck(eid) : false;
  const view = db.session.opView || 'home';

  let body = '';

  if(!eid){
    body = `
      <div class="card danger soft-danger">
        <h3 style="margin-top:0">Planšetė nepriskirta technikai</h3>
        <div class="muted" style="margin-top:6px">
          Ši planšetė dar nesusieta su technikos vienetu.
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

    return renderShell(
      `${user.display || user.username} • operator`,
      body
    );
  }

  const latestCheck = getLatestDailyCheck(eid);

  if(view === 'home'){
    body = `
      <div class="card operator-hero">
        <div class="headerline" style="align-items:flex-start">
          <div>
            <div class="muted small">Technika</div>
            <h2 style="margin:4px 0 4px 0">${escapeHtml(labelEquip(eid))}</h2>
            <div class="muted">Operatorius: ${escapeHtml(user.display || user.username)}</div>
          </div>
          <span class="pill">${todayChecked ? 'Patikra atlikta' : 'Reikia patikros'}</span>
        </div>
      </div>

      <div class="stats-grid">
        <div class="card stat-card ${todayChecked ? 'stat-ok' : 'stat-warn'}">
          <div class="muted small">Šiandienos patikra</div>
          <div class="stat-value">${todayChecked ? 'Atlikta' : 'Neatlikta'}</div>
          <div class="muted small">
            ${latestCheck ? 'Paskutinė: ' + escapeHtml(fmt(latestCheck.doneAt || latestCheck.date)) : 'Dar nėra įrašo'}
          </div>
        </div>

        ${dashboardWeatherCard()}
      </div>

      ${todayChecked ? '' : `
        <div class="card danger blink soft-danger">
          <b>❗ Šiandienos patikra neatlikta</b>
          <div class="muted" style="margin-top:6px">
            Pradėkite darbą nuo kasdienės patikros.
          </div>
        </div>
      `}

      <div class="action-grid">
        <button class="btn action-btn primary" id="opCheck">MAŠINOS PATIKRA</button>
        <button class="btn action-btn amber" id="opQuickNote">PRANEŠTI TRŪKUMĄ</button>
        <button class="btn action-btn" id="opHist">ISTORIJA / PASTABOS</button>
        <button class="btn action-btn" id="opPw">SLAPTAŽODIS</button>
      </div>
    `;
  }

  if(view === 'check'){
    const fields = getChecklistForEquip(eid);

    body = `
      <div class="card">
        <div class="headerline">
          <button class="btn" id="opBack1">← Atgal</button>
          <div class="muted small">${escapeHtml(labelEquip(eid))}</div>
        </div>
        <h3>Kasdienė patikra</h3>

        <div class="muted" style="margin-top:-6px;margin-bottom:8px">
          Visi punktai turi būti pažymėti. Jei pasirinksite NOT OK, komentaras privalomas.
        </div>

        <div class="check-progress">
          <div><b id="chkDoneCount">0</b> / ${fields.length} pažymėta</div>
          <div class="muted small" id="chkRemain">Liko ${fields.length}</div>
        </div>

        <div id="chkWrap"></div>

        <div class="right" style="margin-top:10px">
          <button class="btn primary" id="opSaveCheck">Išsaugoti patikrą</button>
        </div>
      </div>
    `;
  }

  if(view === 'quicknote'){
    body = `
      <div class="card">
        <button class="btn" id="opBackQuick">← Atgal</button>
        <h3>Pranešti trūkumą</h3>

        <div class="muted" style="margin-bottom:8px">
          Trumpai ir aiškiai aprašykite problemą. Įrašas bus matomas istorijoje kaip atviras trūkumas.
        </div>

        <div>
          <div class="muted">Trūkumo aprašymas</div>
          <textarea id="quickNoteText" rows="5" placeholder="Pvz.: bėga tepalas, neveikia apšvietimas, girdisi pašalinis garsas..."></textarea>
        </div>

        <div style="margin-top:10px">
          <div class="muted">Nuotrauka / dokumentas (nebūtina)</div>
          <input type="file" id="quickNoteFile" accept="image/*,.pdf">
        </div>

        <div class="right" style="margin-top:10px">
          <button class="btn amber" id="saveQuickNote">Išsaugoti trūkumą</button>
        </div>
      </div>
    `;
  }

  if(view === 'history'){
    const filter = db.session.opHistoryFilter || 'all';
    body = `
      <div class="card">
        <div class="headerline">
          <button class="btn" id="opBack3">← Atgal</button>
          <div class="right" style="justify-content:flex-start">
            <button class="btn ${filter === 'all' ? 'primary' : ''}" data-hfilter="all">Visi</button>
            <button class="btn ${filter === 'quick' ? 'primary' : ''}" data-hfilter="quick">Trūkumai</button>
            <button class="btn ${filter === 'check' ? 'primary' : ''}" data-hfilter="check">Patikra</button>
            <button class="btn ${filter === 'open' ? 'primary' : ''}" data-hfilter="open">Atviri</button>
          </div>
        </div>

        <h3>Istorija / pastabos</h3>
        <div class="muted" style="margin-top:-4px;margin-bottom:10px">
          Čia rodomi visi šios technikos įrašai.
        </div>

        <div class="note-list" style="margin-top:10px">
          ${buildOperatorHistory(eid, filter)}
        </div>
      </div>
    `;
  }

  if(view === 'password'){
    body = changePasswordUI(user);
  }

  return renderShell(
    `${user.display || user.username} • operator`,
    body
  );
}

function bindOperatorView(user){
  bindShell();
  bindTaskFileUploads(user);

  const eid = db.session.deviceEquipId || user.equipId || null;
  const view = db.session.opView || 'home';

  if(!eid) return;

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
        db.session.opView = 'quicknote';
        saveDB_local(db);
        render();
      };
    }

    if(opHist){
      opHist.onclick = ()=>{
        db.session.opView = 'history';
        db.session.opHistoryFilter = 'all';
        saveDB_local(db);
        render();
      };
    }

    if(opPw){
      opPw.onclick = ()=>{
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
      if(remainEl) remainEl.textContent = done === cards.length ? 'Viskas pažymėta' : `Liko ${cards.length - done}`;
    }

    if(wrap){
      wrap.innerHTML = fields.map((f, i) => `
        <div class="card chkCard" data-i="${i}" data-status="none">
          <div class="chkTop">
            <div>
              <div class="chkTitle">${i + 1}. ${escapeHtml(f)}</div>
              <div class="muted small" style="margin-top:2px">Pasirink OK arba NOT OK</div>
            </div>
            <div class="chkActions">
              <button type="button" class="btn okBtn" data-i="${i}">OK</button>
              <button type="button" class="btn red nokBtn" data-i="${i}">NOT OK</button>
            </div>
          </div>

          <div class="hidden" id="note-${i}" style="margin-top:8px">
            <textarea class="narea" data-i="${i}" placeholder="Komentaras (privaloma jei NOT OK)"></textarea>
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
        const okBtn = card ? card.querySelector('.okBtn') : null;
        const nokBtn = card ? card.querySelector('.nokBtn') : null;
        const note = card ? card.querySelector('#note-' + idx) : null;

        if(card){
          card.classList.remove('req-miss');
          card.classList.remove('is-ok', 'is-nok');
        }

        if(ok){
          if(okBtn) okBtn.classList.add('pressed', 'green');
          if(nokBtn) nokBtn.classList.remove('pressed');
          if(note) note.classList.add('hidden');
          if(card){
            card.dataset.status = 'ok';
            card.classList.add('is-ok');
          }
        } else {
          if(nokBtn) nokBtn.classList.add('pressed');
          if(okBtn) okBtn.classList.remove('pressed', 'green');
          if(note) note.classList.remove('hidden');
          if(card){
            card.dataset.status = 'nok';
            card.classList.add('is-nok');
          }
        }

        updateProgress();
      };

      updateProgress();
    }

    const backBtn = document.getElementById('opBack1');
    if(backBtn){
      backBtn.onclick = ()=>{
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

        const alreadyCheckedToday = (db.dailyChecks || [])
          .map(normalizeDailyCheck)
          .some(x =>
            String(x.equipId) === String(eid) &&
            String(x.date) === String(today())
          );

        if(alreadyCheckedToday){
          alert('Šiandienos patikra šiai technikai jau išsaugota.');
          db.session.opView = 'home';
          saveDB_local(db);
          render();
          return;
        }

        savingCheck = true;
        saveBtn.disabled = true;
        const oldText = saveBtn.textContent;
        saveBtn.textContent = 'Saugoma...';

        try {
          const cards = Array.from(document.querySelectorAll('.chkCard'));
          let hasError = false;

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
            alert('Negalima išsaugoti: visi punktai turi būti pažymėti, o NOT OK turi turėti komentarą.');
            return;
          }

          let notesCount = 0;

          const alreadyCheckedBeforeSave = (db.dailyChecks || [])
            .map(normalizeDailyCheck)
            .some(x =>
              String(x.equipId) === String(eid) &&
              String(x.date) === String(today())
            );

          if(alreadyCheckedBeforeSave){
            alert('Šiandienos patikra šiai technikai jau išsaugota.');
            db.session.opView = 'home';
            saveDB_local(db);
            render();
            return;
          }

          for(const card of cards){
            const idx = Number(card.getAttribute('data-i'));
            const status = card.dataset.status;

            if(status === 'nok'){
              notesCount++;

              const ta = card.querySelector('.narea');
              const val = safeTrim(ta ? ta.value : '');
              const point = fields[idx] || 'Nežinomas punktas';

            const savedNote = await createNoteInSupabase({
              equipId: eid,
              date: today(),
              text: txt,
              author: user.display || user.username,
              authorId: user.id,
              type: 'quick-note',
              status: 'open'
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
            date: today(),
            doneAt: new Date().toISOString()
          });

          if(!savedDailyCheck){
            alert('Nepavyko išsaugoti dienos patikros.');
            return;
          }

          db.dailyChecks = (db.dailyChecks || [])
            .map(normalizeDailyCheck)
            .filter(x => !(String(x.equipId) === String(eid) && x.date === today()));

          db.dailyChecks.push(savedDailyCheck);

          const savedSummaryNote = await createNoteInSupabase({
            equipId: eid,
            date: today(),
            text: `Patikrą atliko ${user.display || user.username}. Pastabų skaičius: ${notesCount}.`,
            author: user.display || user.username,
            authorId: user.id,
            type: 'check-summary',
            status: 'done'
          });

          if(savedSummaryNote){
            if(!db.notes) db.notes = [];
            db.notes.unshift(savedSummaryNote);
          }

          alert('Patikra išsaugota.');
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
          alert('Įrašyk trūkumą.');
          return;
        }

        savingQuickNote = true;
        saveBtn.disabled = true;
        const oldText = saveBtn.textContent;
        saveBtn.textContent = 'Saugoma...';

        try {
          const savedNote = await createNoteInSupabase({
            equipId: eid,
            date: today(),
            text: txt,
            author: user.display || user.username,
            authorId: user.id,
            type: 'quick-note',
            status: 'open'
          });

          if(!savedNote){
            alert('Nepavyko išsaugoti trūkumo.');
            return;
          }

          if(!db.notes) db.notes = [];
          db.notes.unshift(savedNote);

          if(file){
            const savedFile = await uploadTaskFileToSupabase(
              file,
              { noteId: savedNote.id },
              user
            );

            if(savedFile){
              if(!db.taskFiles) db.taskFiles = [];
              db.taskFiles.unshift(savedFile);
            } else {
              alert('Trūkumas išsaugotas, bet nuotraukos įkelti nepavyko.');
            }
          }

          alert('Trūkumas išsaugotas.');
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