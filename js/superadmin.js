function renderSuperAdminView(user){
  const companies = db.companies || [];

  return `
    <div class="card">
      <h2 style="margin-top:0">MaintFlow Baltic – Klientai</h2>

      <div class="row row-3" style="margin-top:12px">
        <div>
          <div class="muted">Įmonės pavadinimas</div>
          <input id="newCompanyName" placeholder="Pvz. Nauja įmonė">
        </div>

        <div>
          <div class="muted">Kodas</div>
          <input id="newCompanyCode" placeholder="Pvz. CLIENT01">
        </div>

        <div class="right" style="align-items:flex-end">
          <button class="btn primary" id="createCompanyBtn">Sukurti klientą</button>
        </div>
      </div>
    </div>

<div class="card">
  <div class="headerline">
    <h2 style="margin:0">MaintFlow Baltic – Klientai</h2>
    <div class="right">
      <button class="btn" id="logoutBtn">Atsijungti</button>
    </div>
  </div>

      ${companies.map(c => `
        <div class="taskCard" style="margin-bottom:12px">
          <div class="headerline">
            <div>
              <b>${escapeHtml(c.name || '—')}</b> (${escapeHtml(c.code || '—')})
              <div class="muted">Statusas: ${c.is_active === false ? 'Išjungta' : 'Aktyvi'}</div>
              <div class="muted">Licencija iki: ${escapeHtml(c.license_until || '—')}</div>
              <div style="margin-top:8px">
  <b>Adminai:</b>
  ${
    (db.users || [])
      .filter(u => String(u.companyId) === String(c.id) && u.role === 'admin')
      .map(u => `
        <div class="muted">
          ${escapeHtml(u.display || u.username)} • ${escapeHtml(u.username || '')} • ${escapeHtml(u.email || '')}
        </div>
      `).join('') || '<div class="muted">Adminų nėra</div>'
  }
</div>
              <div class="right" style="margin-top:10px">
  <button class="btn primary" data-enter-company-admin="${c.id}">
    Įeiti į admin
  </button>
</div>
            </div>
          </div>

          <div style="margin-top:12px">
            <h4 style="margin:0 0 8px 0">Sukurti kliento adminą</h4>

            <div class="row row-4">
              <div>
                <div class="muted">Vardas</div>
                <input id="adminName_${c.id}" placeholder="Pvz. Jonas Jonaitis">
              </div>

              <div>
                <div class="muted">Username</div>
                <input id="adminUsername_${c.id}" placeholder="pvz. jonas">
              </div>

              <div>
                <div class="muted">El. paštas</div>
                <input id="adminEmail_${c.id}" placeholder="admin@imone.lt">
              </div>

              <div>
                <div class="muted">Slaptažodis</div>
                <input id="adminPass_${c.id}" type="password" placeholder="min. 6 simboliai">
              </div>
            </div>

            <div class="right" style="margin-top:10px">
              <button class="btn primary" data-create-company-admin="${c.id}">
                Sukurti adminą
              </button>
            </div>

            <div class="muted" style="font-size:12px;margin-top:6px" id="adminMsg_${c.id}"></div>
          </div>
        </div>
      `).join('') || '<div class="muted">Klientų nėra.</div>'}
    </div>
  `;
}

function bindSuperAdminView(user){
  bindShell();

  const createCompanyBtn = document.getElementById('createCompanyBtn');

  if(createCompanyBtn){
    createCompanyBtn.onclick = async ()=>{
      const name = safeTrim(document.getElementById('newCompanyName')?.value || '');
      const code = safeTrim(document.getElementById('newCompanyCode')?.value || '').toUpperCase();

      if(!name || !code){
        alert('Įrašyk įmonės pavadinimą ir kodą.');
        return;
      }

      const created = await createCompanyInSupabase(name, code);

      if(created){
        db.companies = db.companies || [];
        db.companies.push(created);
        saveDB_local(db);
        render();
      }
    };
  }

  document.querySelectorAll('[data-create-company-admin]').forEach(btn => {
  document.querySelectorAll('[data-enter-company-admin]').forEach(btn => {
  btn.onclick = async ()=>{
    const companyId = btn.getAttribute('data-enter-company-admin');

    db.session.adminCompanyId = companyId;
    db.session.adminView = 'tasks';

    await reloadCoreData();
    saveDB_local(db);

    render();
  };
});
    btn.onclick = async ()=>{
      const companyId = btn.getAttribute('data-create-company-admin');

      const name = safeTrim(document.getElementById(`adminName_${companyId}`)?.value || '');
      const username = safeTrim(document.getElementById(`adminUsername_${companyId}`)?.value || '');
      const email = safeTrim(document.getElementById(`adminEmail_${companyId}`)?.value || '');
      const password = safeTrim(document.getElementById(`adminPass_${companyId}`)?.value || '');
      const msg = document.getElementById(`adminMsg_${companyId}`);

      if(msg) msg.textContent = '';

      if(!name || !username || !email || !password){
        if(msg) msg.textContent = 'Užpildyk visus laukus.';
        return;
      }

      if(password.length < 6){
        if(msg) msg.textContent = 'Slaptažodis turi būti bent 6 simboliai.';
        return;
      }

      btn.disabled = true;
      const oldText = btn.textContent;
      btn.textContent = 'Kuriama...';

      try{
        const created = await createUserViaFunction({
          name,
          username,
          email,
          password,
          role: 'admin',
          company_id: companyId
        });

        if(!created){
          if(msg) msg.textContent = 'Nepavyko sukurti admino.';
          return;
        }

        if(msg) msg.textContent = 'Adminas sukurtas.';

        await reloadCoreData();
        saveDB_local(db);
      }catch(err){
        console.error('Klaida kuriant kliento adminą:', err);
        if(msg) msg.textContent = err.message || 'Nepavyko sukurti admino.';
      }finally{
        btn.disabled = false;
        btn.textContent = oldText;

      }
    };
  });
}
function renderAdminAsSuperAdmin(){
  const user = currentUser();
  if(!user || user.role !== 'superadmin') return;

  const adminUser = {
    ...user,
    role: 'admin',
    display: `${user.display || user.username} (Superadmin)`
  };

  const root = document.getElementById('app');
  root.innerHTML = renderAdminView(adminUser);
  bindAdminView(adminUser);
}