/* OneMuslim canonical profile router. All viewed-profile entry points use this path. */
(() => {
  'use strict';

  const PROFILE_SCRIPT_ID = 'oneMuslimVisitedProfileScript';
  const PROFILE_SCRIPT_SRC = 'view-profile-page.js?v=20260912-04';

  const getId = () => new URLSearchParams(window.location.search).get('profile');
  const appReady = () => {
    const app = document.getElementById('appView');
    const page = document.getElementById('profilePage');
    return !!(app && page && !app.classList.contains('hidden'));
  };

  const showPage = page => {
    const target = document.getElementById(`${page}Page`);
    if (!target) return false;
    document.querySelectorAll('#appView .content > .page').forEach(el => {
      el.classList.toggle('hidden', el !== target);
    });
    document.querySelectorAll('#appView .app-nav-link,#appView .side').forEach(el => {
      el.classList.toggle('active', el.dataset.page === page);
    });
    return true;
  };

  const ensureRenderer = () => new Promise((resolve, reject) => {
    if (window.OneMuslimViewedProfile?.render) return resolve(window.OneMuslimViewedProfile);
    const existing = document.getElementById(PROFILE_SCRIPT_ID);
    if (existing) {
      let tries = 0;
      const wait = () => {
        if (window.OneMuslimViewedProfile?.render) return resolve(window.OneMuslimViewedProfile);
        if (++tries > 100) return reject(new Error('Profile renderer did not initialize.'));
        setTimeout(wait, 50);
      };
      return wait();
    }
    const script = document.createElement('script');
    script.id = PROFILE_SCRIPT_ID;
    script.src = PROFILE_SCRIPT_SRC;
    script.onload = () => {
      let tries = 0;
      const wait = () => {
        if (window.OneMuslimViewedProfile?.render) return resolve(window.OneMuslimViewedProfile);
        if (++tries > 100) return reject(new Error('Profile renderer did not initialize.'));
        setTimeout(wait, 50);
      };
      wait();
    };
    script.onerror = () => reject(new Error('Unable to load the profile renderer.'));
    document.body.appendChild(script);
  });

  const render = async id => {
    if (!id || !appReady()) return false;
    const page = document.getElementById('profilePage');
    page.dataset.omViewedRendered = '1';
    showPage('profile');
    try {
      const renderer = await ensureRenderer();
      await renderer.render(id);
      return true;
    } catch (err) {
      console.error('OneMuslim profile route:', err);
      const panel = document.getElementById('profilePanel');
      if (panel) panel.innerHTML = `<div style="padding:32px;text-align:center"><h2>Profile unavailable</h2><p>${String(err.message || 'Unable to load this profile.').replace(/[&<>"']/g, m => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[m]))}</p></div>`;
      return false;
    }
  };

  const open = (id, options = {}) => {
    if (!id) return;
    const url = `index.html?profile=${encodeURIComponent(id)}`;
    if (options.replace) history.replaceState({ profile: id }, '', url);
    else if (location.search !== `?profile=${encodeURIComponent(id)}`) history.pushState({ profile: id }, '', url);
    else history.replaceState({ profile: id }, '', url);

    document.getElementById('omProfileModal')?.remove();

    if (!appReady()) {
      window.location.href = url;
      return;
    }

    render(id);
  };

  const close = (options = {}) => {
    document.getElementById('omProfileModal')?.remove();
    document.getElementById('profilePage')?.classList.add('hidden');
    document.getElementById('profilePage')?.removeAttribute('data-om-viewed-rendered');
    if (options.history !== false && getId()) history.pushState({}, '', 'index.html');
    showPage(options.page || 'profiles');
  };

  window.OneMuslimProfileRouter = { open, close, render };

  window.addEventListener('oneMuslim:open-profile', e => {
    const id = e.detail?.id;
    if (id) open(id, { replace: true });
  });

  window.addEventListener('popstate', () => {
    const id = getId();
    if (id) {
      if (appReady()) render(id);
      else {
        let tries = 0;
        const wait = () => {
          if (appReady()) return render(id);
          if (++tries < 100) setTimeout(wait, 100);
        };
        wait();
      }
    } else {
      document.getElementById('profilePage')?.classList.add('hidden');
      document.getElementById('profilePage')?.removeAttribute('data-om-viewed-rendered');
      showPage('profiles');
    }
  });

  const init = () => {
    const id = getId();
    if (!id) return;
    let tries = 0;
    const wait = () => {
      if (appReady()) return render(id);
      if (++tries < 120) setTimeout(wait, 100);
    };
    wait();
  };

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init, { once: true });
  else init();
})();
