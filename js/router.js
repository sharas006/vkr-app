function render(){
  const root = document.getElementById('app');
  if(!root) return;

  if(!db){
    root.innerHTML = '<div class="card">Kraunama...</div>';
    return;
  }

  const user = currentUser();

if(!user){
  if(typeof clearOperatorIdleTimer === 'function') clearOperatorIdleTimer();
  root.innerHTML = renderLogin();
  bindLogin();
  return;
}

if(user.role === 'admin'){
  if(typeof clearOperatorIdleTimer === 'function') clearOperatorIdleTimer();
  root.innerHTML = renderAdminView(user);
  bindAdminView(user);
  return;
}

if(user.role === 'operator'){
  root.innerHTML = renderOperatorView(user);
  bindShell();
  bindOperatorView(user);
  if(typeof syncOperatorIdleLogout === 'function') syncOperatorIdleLogout();
  return;
}

if(user.role === 'mechanic'){
  if(typeof clearOperatorIdleTimer === 'function') clearOperatorIdleTimer();
  root.innerHTML = renderMechanicView(user);
  bindShell();
  bindMechanicView(user);
  return;
}

  root.innerHTML = renderShell(
    `${user.display || user.username} • ${user.role || 'naudotojas'}`,
    `
      <div class="card">
        <h3 style="margin-top:0">Prisijungimas veikia</h3>
        <div class="muted">Šiai rolei ekranas dar nejungtas.</div>
      </div>
    `
  );

  bindShell();
}