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
  if(typeof stopDeviceHeartbeat === 'function') stopDeviceHeartbeat();
  root.innerHTML = renderLogin();
  bindLogin();
  return;
}

if(user.role === 'superadmin'){
  if(typeof clearOperatorIdleTimer === 'function') clearOperatorIdleTimer();
  if(typeof stopDeviceHeartbeat === 'function') stopDeviceHeartbeat();

  if(db.session.adminCompanyId){
    renderAdminAsSuperAdmin();
  } else {
    root.innerHTML = renderSuperAdminView(user);
    bindSuperAdminView(user);
  }

  if(typeof startLiveRefresh === 'function') startLiveRefresh();
  return;
}

if(user.role === 'admin'){
  if(typeof clearOperatorIdleTimer === 'function') clearOperatorIdleTimer();
  if(typeof stopDeviceHeartbeat === 'function') stopDeviceHeartbeat();
  root.innerHTML = renderAdminView(user);
  bindAdminView(user);
  if(typeof startLiveRefresh === 'function') startLiveRefresh();
  return;
}

if(user.role === 'operator'){
root.innerHTML = renderOperatorView(user);
bindShell();
bindOperatorView(user);
if(typeof syncOperatorIdleLogout === 'function') syncOperatorIdleLogout();
if(typeof startDeviceHeartbeat === 'function') startDeviceHeartbeat();
if(typeof startLiveRefresh === 'function') startLiveRefresh();
return;
}

if(user.role === 'mechanic'){
  if(typeof clearOperatorIdleTimer === 'function') clearOperatorIdleTimer();
  if(typeof stopDeviceHeartbeat === 'function') stopDeviceHeartbeat();
root.innerHTML = renderMechanicView(user);
bindShell();
bindMechanicView(user);
if(typeof startLiveRefresh === 'function') startLiveRefresh();
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