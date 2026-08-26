(()=>{
'use strict';
function boot(){
  const $=id=>document.getElementById(id);
  const auth=(mode)=>{
    if(typeof window.showAuth==='function'){
      window.showAuth(mode);
      return true;
    }
    return false;
  };

  // Do not intercept the whole document or stop other handlers.
  // The previous capture-phase handler could swallow legitimate clicks.
  const login=$("openLogin");
  const signup=$("openSignup");
  const back=$("backPublic");

  if(login && typeof login.onclick !== 'function') login.addEventListener('click',()=>auth('login'));
  if(signup && typeof signup.onclick !== 'function') signup.addEventListener('click',()=>auth('signup'));
  if(back && typeof back.onclick !== 'function') back.addEventListener('click',()=>{
    if(typeof window.setScreen==='function') window.setScreen('publicView');
    else { $("authView")?.classList.add('hidden'); $("publicView")?.classList.remove('hidden'); }
  });

  // App navigation is intentionally handled only for sidebar buttons.
  document.querySelectorAll('[data-page]').forEach(el=>{
    if(el.dataset.interactionFixBound==='1') return;
    el.dataset.interactionFixBound='1';
    el.addEventListener('click',()=>{
      const page=el.getAttribute('data-page');
      if(!page) return;
      document.querySelectorAll('.page').forEach(p=>p.classList.add('hidden'));
      $(page+'Page')?.classList.remove('hidden');
      document.querySelectorAll('.side').forEach(b=>b.classList.toggle('active',b===el));
      if(page==='feed' && typeof window.renderApp==='function') window.renderApp();
    });
  });
}
if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',boot); else boot();
})();
