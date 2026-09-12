/* OneMuslim App Version — increment VERSION by 0.01 for every shipped update. */
(() => {
  'use strict';

  const VERSION = 'X.01';
  const STAGE = 'Navigation';
  const LABEL = `${VERSION} · ${STAGE}`;
  window.OneMuslimVersion = Object.freeze({ VERSION, STAGE, LABEL });

  function addStyles() {
    if (document.getElementById('oneMuslimVersionStyles')) return;
    const style = document.createElement('style');
    style.id = 'oneMuslimVersionStyles';
    style.textContent = `
      .om-app-version{
        display:block;
        margin:0 0 12px;
        padding:0 2px;
        color:#8a7560;
        font:700 10px/1.2 Arial,sans-serif;
        letter-spacing:.11em;
        text-transform:uppercase;
        text-align:center;
        opacity:.78;
        user-select:none;
      }
    `;
    document.head.appendChild(style);
  }

  function findProfileMenu() {
    const candidates = [...document.querySelectorAll('div,section,aside,dialog,nav')];
    return candidates
      .filter(el => {
        if (el.closest('#publicView,#authView')) return false;
        const text = (el.textContent || '').replace(/\s+/g, ' ').trim();
        return /OneJourney/i.test(text) && /Sign\s*Out/i.test(text) && /(DM|Direct Message)/i.test(text);
      })
      .sort((a,b) => a.textContent.length - b.textContent.length)[0] || null;
  }

  function inject() {
    addStyles();
    const menu = findProfileMenu();
    if (!menu || menu.querySelector('.om-app-version')) return;
    const badge = document.createElement('div');
    badge.className = 'om-app-version';
    badge.textContent = LABEL;
    badge.setAttribute('aria-label', `Application version ${VERSION}, ${STAGE}`);
    menu.insertBefore(badge, menu.firstChild);
  }

  function boot() {
    inject();
    const observer = new MutationObserver(() => inject());
    observer.observe(document.body, { childList:true, subtree:true });
    setTimeout(inject, 250);
    setTimeout(inject, 800);
    setTimeout(inject, 1600);
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot, { once:true });
  else boot();
})();
