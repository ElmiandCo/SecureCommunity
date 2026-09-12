/* OneMuslim shared session/theme bridge for standalone pages. */
(() => {
  'use strict';
  const sb = window.OneMuslimSupabaseClient?.getClient?.();
  if (!sb) return;
  function theme(){
    if(document.getElementById('oneMuslimSharedTheme'))return;
    const s=document.createElement('style');s.id='oneMuslimSharedTheme';
    s.textContent=`
      .community-page,.doxd-page{background:#fbf8f1!important;color:#182c25!important}
      .community-header,.doxd-header{position:sticky!important;top:0!important;height:68px!important;min-height:68px!important;box-sizing:border-box!important;background:rgba(255,253,248,.98)!important;color:#182c25!important;border-bottom:1px solid #e6e1d6!important;box-shadow:0 4px 20px rgba(27,55,45,.06)!important;backdrop-filter:blur(14px)!important;z-index:5000!important}
      .community-header .brand,.doxd-brand{color:#1f5b49!important}
      .community-header nav a,.doxd-header nav a{color:#536960!important}
      .community-header nav a.active,.community-header nav a:hover,.doxd-header nav a.active,.doxd-header nav a:hover{color:#1f5b49!important;font-weight:800!important}
      .om-shared-session{margin-left:auto;display:flex!important;align-items:center!important;gap:8px!important;text-decoration:none!important;color:#1f5b49!important;font-weight:800!important;font-size:13px!important;min-width:0!important;max-width:220px!important}
      .om-shared-session img,.om-session-fallback{width:36px!important;height:36px!important;border-radius:50%!important;display:grid!important;place-items:center!important;object-fit:cover!important;background:#e8f1ec!important;border:2px solid #c89d3c!important;color:#1f5b49!important;flex:0 0 auto!important}
      .om-session-name{overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
      @media(max-width:650px){.om-session-name{display:none}.community-header,.doxd-header{height:60px!important;min-height:60px!important}.om-shared-session{margin-left:0}.om-shared-session img,.om-session-fallback{width:34px!important;height:34px!important}}
    `;document.head.appendChild(s);
  }
  const avatar=p=>p?.avatar_url||(p?.avatar_package==='platinum_package'?`assets/avatars/${p.avatar_gender==='female'?'platinum-female.PNG':'platinum-male.PNG'}`:'');
  const esc=s=>String(s??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[m]));
  async function boot(){
    theme();
    const {data:{user}}=await sb.auth.getUser();
    if(!user)return;
    const {data:p}=await sb.from('profiles').select('id,display_name,username,avatar_url,avatar_package,avatar_gender').eq('id',user.id).maybeSingle();
    window.OneMuslimCurrentUser=Object.freeze({user,profile:p||null});
    document.documentElement.dataset.omAuthenticated='true';
    const host=document.querySelector('.community-header,.doxd-header');
    if(!host||host.querySelector('[data-om-session]'))return;
    const link=document.createElement('a');link.href='index.html';link.className='om-shared-session';link.dataset.omSession='true';
    const src=avatar(p);link.innerHTML=`${src?`<img src="${esc(src)}" alt="">`:'<span class="om-session-fallback">●</span>'}<span class="om-session-name">${esc(p?.display_name||p?.username||'My Account')}</span>`;
    link.title='Open My Profile';host.appendChild(link);
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
})();
