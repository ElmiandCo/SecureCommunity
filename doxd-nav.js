(() => {
  document.querySelectorAll('[data-doxd-link]').forEach(el => {
    el.addEventListener('click', () => { window.location.href = 'doxd.html'; });
  });
})();
