function renderLogin(){
  return `
    <div class="card login-card">
      <div style="text-align:center;margin-bottom:14px">
        <img src="assets/logo.png" style="height:70px">
      </div>

      <h2 style="margin:0 0 6px 0">VKR • Prisijungimas</h2>
      <div class="muted">Prisijunk, ir atsidarys tavo rolės langas.</div>

      <div class="row" style="margin-top:12px">
        <div>
          <div class="muted">Vartotojas</div>
          <input id="lgUser" placeholder="pvz. petras">
        </div>

        <div>
          <div class="muted">Slaptažodis</div>
          <input id="lgPass" type="password" placeholder="••••••">
        </div>

        <div class="right">
          <button class="btn primary" id="lgBtn">Prisijungti</button>
        </div>

        <div class="muted" style="font-size:12px" id="lgMsg"></div>
      </div>
    </div>
  `;
}

function bindLogin(){
  const u = document.getElementById('lgUser');
  const p = document.getElementById('lgPass');
  const b = document.getElementById('lgBtn');
  const msg = document.getElementById('lgMsg');

  async function go(){
    msg.textContent = 'Jungiamasi...';

    const res = await doLogin(
      safeTrim(u.value),
      safeTrim(p.value)
    );

if(!res.ok){
  console.error('LOGIN FAILED:', res);
  msg.textContent = (res.msg || 'Klaida.') + (res.debug ? ' | ' + res.debug : '');
  return;
}

    msg.textContent = '';
    render();
  }

  b.onclick = go;
  p.addEventListener('keydown', async (e)=>{
    if(e.key === 'Enter') await go();
  });
}

function renderShell(title, bodyHtml){
  return `
    <div class="card">
      <div class="headerline">
        <img src="assets/logo.png" style="height:60px">
        <div class="right">
          <span class="pill">${escapeHtml(title)}</span>
          <button class="btn" id="logoutBtn">Atsijungti</button>
        </div>
      </div>
    </div>
    ${bodyHtml}
  `;
}

function bindShell(){
  const btn = document.getElementById('logoutBtn');
  if(btn){
    btn.onclick = logout;
  }
}