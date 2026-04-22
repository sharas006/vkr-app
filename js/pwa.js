if ('serviceWorker' in navigator) {
  window.addEventListener('load', async () => {
    try {
      await navigator.serviceWorker.register('./service-worker.js');
      console.log('Service Worker užregistruotas');
    } catch (err) {
      console.error('Service Worker registracijos klaida:', err);
    }
  });
}