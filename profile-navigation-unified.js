/* OneMuslim unified profile navigation. Keep member profile clicks inside the authenticated app. */
(() => {
  'use strict';
  const cfg = window.APP_CONFIG || {};
  const createClient = window.supabase?.createClient;
  if (!createClient || !cfg.SUPABASE_URL || !cfg.SUPABASE_ANON_KEY) return;
  const db = createClient(cfg.SUPABASE_URL, cfg.SUPABASE_ANON_KEY, { auth: { persistSession:true, autoRefreshToken:true, detectSessionInUrl:true } });

  const openProfile = id => {
    if (!id) return;
    const app=document.getElementById('appView');
    const page=document.getElementById('profilePage');
    if(app && page && !app.classList.contains('hidden')){
      history.pushState({profile:id},'',`index.html?profile=${encodeURIComponent(id)}`);
      page.dataset.omViewedRendered='';
      window.dispatchEvent(new CustomEvent('oneMuslim:open-profile',{detail:{id}}));
      return;
    }
    window.location.href=`index.html?profile=${encodeURIComponent(id)}`;
  };
  window.OneMuslimOpenProfile=openProfile;

  const findProfileId = async username => {
    const clean=String(username||'').replace(/^@/,'').trim(); if(!clean)return null;
    const {data,error}=await db.from('profiles').select('id').eq('username',clean).maybeSingle();
    if(error){console.error('Profile navigation lookup:',error);return null} return data?.id||null;
  };
  const usernameFromSmall=el=>{const m=(el?.textContent||'').match(/@([A-Za-z0-9_.-]+)/);return m?.[1]||''};

  const init=()=>{
    if(document.documentElement.dataset.profileNavigationUnified==='1')return;
    document.documentElement.dataset.profileNavigationUnified='1';
    const style=document.createElement('style');style.id='profileNavigationUnifiedStyles';style.textContent=`.post-head .post-author,.post-head .post-author b,.post-head .avatar,.comment-head b,.comment > .avatar{cursor:pointer}.post-head .post-author:hover b,.comment-head b:hover{text-decoration:underline}`;document.head.appendChild(style);
    document.addEventListener('click',async event=>{
      const view=event.target.closest?.('[data-view-profile]');
      if(view){event.preventDefault();event.stopImmediatePropagation();openProfile(view.dataset.viewProfile);return}
      const card=event.target.closest?.('.people-theme-card[data-profile-id]');
      if(card&&!event.target.closest('button,a,input,select,textarea,label')){event.preventDefault();event.stopImmediatePropagation();openProfile(card.dataset.profileId);return}
      const post=event.target.closest?.('.post[data-post]');
      if(post){
        const author=event.target.closest?.('.post-head .post-author,.post-head .post-author b,.post-head > .avatar');
        if(author&&!event.target.closest('button,a')){const username=usernameFromSmall(post.querySelector('.post-author small'));if(username){event.preventDefault();event.stopImmediatePropagation();const id=await findProfileId(username);if(id)openProfile(id)}return}
        const comment=event.target.closest?.('.comment');
        if(comment&&(event.target.closest('.comment-head b')||event.target.closest('.comment > .avatar'))){const username=usernameFromSmall(comment.querySelector('.comment-head small'));if(username){event.preventDefault();event.stopImmediatePropagation();const id=await findProfileId(username);if(id)openProfile(id)}}
      }
    },true);
  };
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
})();