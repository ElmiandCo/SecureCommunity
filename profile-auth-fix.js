(() => {
  const { createClient } = window.supabase || {};
  const cfg = window.APP_CONFIG || {};
  if (!createClient || !cfg.SUPABASE_URL || !cfg.SUPABASE_ANON_KEY) return;
  const sbFix = createClient(cfg.SUPABASE_URL, cfg.SUPABASE_ANON_KEY, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
      storage: window.localStorage,
      storageKey: 'e-secure-community-auth'
    }
  });
  const $ = id => document.getElementById(id);
  const toastFix = msg => {
    const x = $('toast');
    if (!x) return;
    x.textContent = msg;
    x.classList.remove('hidden');
    clearTimeout(window.__profileFixToast);
    window.__profileFixToast = setTimeout(() => x.classList.add('hidden'), 2800);
  };
  const currentUser = async () => (await sbFix.auth.getUser()).data.user;
  const esc = s => String(s ?? '').replace(/[&<>"']/g, m => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[m]));

  async function saveProfileFixed(button) {
    const user = await currentUser();
    if (!user) { toastFix('Your session expired. Please sign in again.'); return; }
    const username = ($('pfUser')?.value || '').trim().toLowerCase();
    if (!/^[a-z0-9_.-]{3,30}$/.test(username)) {
      toastFix('Username must be 3–30 characters and use letters, numbers, dots, underscores, or hyphens.');
      return;
    }
    const { data: taken, error: checkError } = await sbFix.from('profiles').select('id').eq('username', username).neq('id', user.id).limit(1).maybeSingle();
    if (checkError) { toastFix('We could not check that username. Please try again.'); return; }
    if (taken) { toastFix('That username is already taken.'); return; }

    const payload = {
      display_name: ($('pfDisplay')?.value || '').trim(),
      first_name: ($('pfFirst')?.value || '').trim(),
      last_name: ($('pfLast')?.value || '').trim(),
      username,
      bio: ($('pfBio')?.value || '').trim(),
      location: ($('pfLocation')?.value || '').trim(),
      city: ($('pfCity')?.value || '').trim(),
      state: ($('pfState')?.value || '').trim(),
      country: ($('pfCountry')?.value || '').trim(),
      gender: $('pfGender')?.value || '',
      website: ($('pfWebsite')?.value || '').trim()
    };

    button.disabled = true;
    button.textContent = 'Saving...';
    const { data, error } = await sbFix.from('profiles').update(payload).eq('id', user.id).select().single();
    button.disabled = false;
    button.textContent = 'Save profile';
    if (error) {
      toastFix(/duplicate|unique/i.test(error.message) ? 'That username is already taken.' : (error.message || 'Profile could not be saved.'));
      return;
    }

    // Keep auth metadata aligned with editable identity fields without changing the password/session.
    await sbFix.auth.updateUser({ data: {
      display_name: payload.display_name,
      first_name: payload.first_name,
      last_name: payload.last_name,
      username: payload.username
    }});

    window.profile = data;
    if (typeof window.loadProfile === 'function') await window.loadProfile();
    if (typeof window.loadPosts === 'function') await window.loadPosts();
    if (typeof window.renderApp === 'function') window.renderApp();
    toastFix('Profile saved successfully. ✓');
  }

  // Capture the existing Save button before the original inline onclick handler runs.
  document.addEventListener('click', event => {
    const button = event.target.closest('#saveProfile');
    if (!button) return;
    event.preventDefault();
    event.stopImmediatePropagation();
    saveProfileFixed(button).catch(err => {
      console.error('Profile save failed:', err);
      button.disabled = false;
      button.textContent = 'Save profile';
      toastFix('Profile could not be saved. Please try again.');
    });
  }, true);

  // Explicitly keep the Supabase session cached in localStorage. A normal page refresh/revisit
  // should restore the session until the member signs out or the session expires.
  sbFix.auth.getSession().then(({ data }) => {
    if (data.session) {
      // The main app's Supabase client shares the same persisted auth session.
      window.__secureCommunitySessionCached = true;
    }
  });
})();