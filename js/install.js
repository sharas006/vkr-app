let deferredPrompt = null;

window.addEventListener('beforeinstallprompt', (e) => {
  e.preventDefault();
  deferredPrompt = e;

  showInstallButton();
});

function showInstallButton(){
  const btn = document.createElement('button');
  btn.textContent = '📲 Įdiegti programą';
  btn.className = 'btn primary';
  btn.style.position = 'fixed';
  btn.style.bottom = '20px';
  btn.style.right = '20px';
  btn.style.zIndex = '9999';

  btn.onclick = async () => {
    if(!deferredPrompt) return;

    deferredPrompt.prompt();
    const choice = await deferredPrompt.userChoice;

    if(choice.outcome === 'accepted'){
      console.log('User installed app');
    }

    deferredPrompt = null;
    btn.remove();
  };

  document.body.appendChild(btn);
}