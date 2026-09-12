/* OneMuslim shared session bridge for standalone pages. */
(() => {
  'use strict';
  const sb = window.OneMuslimSupabaseClient?.getClient?.();
  if (!sb) return;
  const avatar = p => p?.avatar_url || (p?.avatar_package === 'platinum_package' ? `assets/avatars/${p.avatar_gender === 'female' ? 'platinum-female.PNG' : 'platinum-male.PNG'}` : '');
  const esc = s => String(s ?? '').replace(/[&<>"']/g, m => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[m]));
  async function boot(){
    const { data:{ user } } = await sb.auth.getUser();
    if (!user) return;
    const { data:p } = await sb.from('profiles').select('id,display_name,username,avatar_url,avatar_package,avatar_gender').eq('id',user.id).maybeSingle();
    window.OneMuslimCurrentUser = Object.freeze({ user, profile:p || null });
    document.documentElement.dataset.omAuthenticated = 'true';
    const host = document.querySelector('.community-header,.doxd-header');
    if (!host || host.querySelector('[data-om-session]')) return;
    const link = document.createElement('a');
    link.href = 'index.html';
    link.className = 'om-shared-session';
    link.dataset.omSession = 'true';
    const src = avatar(p);
    link.innerHTML = `${src ? `<img src="${esc(src)}" alt="">` : '<span class="om-session-fallback">●</span>'}<span class="om-session-name">${esc(p?.display_name || p?.username || 'My Account')}</span>`;
    link.title = 'Open My Profile';
    host.appendChild(link);
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded',boot,{once:true}); else boot();
})();
