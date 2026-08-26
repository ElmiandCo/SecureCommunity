(()=>{
'use strict';
function boot(){
  const $=id=>document.getElementById(id);

  // app.js defines showAuth as a global lexical function, not window.showAuth.
  // Call the actual global function when it exists, with a direct DOM fallback.
  const auth=(mode)=>{
    if(typeof showAuth==='function'){
      showAuth(mode);
      return true;
    }
    const publicView=$("publicView");
    const authView=$("authView");
    if(publicView && authView){
      publicView.classList.add('hidden');
      authView.classList.remove('hidden');
      return true;
    }
    return false;
  };

  const login=$("openLogin");
  const signup=$("openSignup");
  const back=$("backPublic");

  if(login && !login.dataset.interactionFixBound){
    login.dataset.interactionFixBound='1';
    login.addEventListener('click',()=>auth('login'));
  }
  if(signup && !signup.dataset.interactionFixBound){
    signup.dataset.interactionFixBound='1';
    signup.addEventListener('click',()=>auth('signup'));
  }
  if(back && !back.dataset.interactionFixBound){
    back.dataset.interactionFixBound='1';
    back.addEventListener('click',()=>{
      if(typeof setScreen==='function') setScreen('publicView');
      else {
        $("authView")?.classList.add('hidden');
        $("publicView")?.classList.remove('hidden');
      }
    });
  }

  document.querySelectorAll('[data-page]').forEach(el=>{
    if(el.dataset.pageInteractionFixBound==='1') return;
    el.dataset.pageInteractionFixBound='1';
    el.addEventListener('click',()=>{
      const page=el.getAttribute('data-page');
      if(!page) return;
      document.querySelectorAll('.page').forEach(p=>p.classList.add('hidden'));
      $(page+'Page')?.classList.remove('hidden');
      document.querySelectorAll('.side').forEach(b=>b.classList.toggle('active',b===el));
      if(page==='feed' && typeof renderApp==='function') renderApp();
    });
  });
}
if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',boot); else boot();
})();
