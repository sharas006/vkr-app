const isLocalDev =
  location.hostname === '127.0.0.1' ||
  location.hostname === 'localhost';

if ('serviceWorker' in navigator && !isLocalDev) {
  window.addEventListener('load', async () => {
    try {
      await navigator.serviceWorker.register('./service-worker.js');
      console.log('Service Worker užregistruotas');
    } catch (err) {
      console.error('Service Worker registracijos klaida:', err);
    }
  });
}