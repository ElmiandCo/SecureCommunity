/* OneMuslim auth visibility + scrolling guard. Loaded last so older theme scripts cannot hide the auth surface. */
(function(){
  'use strict';
  const css=document.createElement('style');
  css.id='om-auth-force-fix-css';
  css.textContent=`
    html,body{min-height:100%!important}
    body.om-auth-modal-open{overflow:hidden!important}
    #authView.om-auth-overlay{position:fixed!important;inset:0!important;z-index:2147483645!important;display:flex!important;visibility:visible!important;opacity:1!important;overflow-y:auto!important;overflow-x:hidden!important;align-items:flex-start!important;justify-content:center!important;padding:clamp(70px,10vh,110px) 18px 40px!important}
    #authView.om-auth-overlay.hidden{display:flex!important;visibility:visible!important}
    #authView.om-auth-overlay .auth-card{flex:0 0 auto!important;width:min(460px,100%)!important;max-height:none!important;overflow:visible!important;margin:0 auto!important}
    #authView.om-auth-overlay .auth-card .form{padding-bottom:2px}
    @media(max-width:520px){#authView.om-auth-overlay{padding:64px 10px 28px!important;align-items:flex-start!important}#authView.om-auth-overlay .auth-card{width:100%!important}}
  `;
  document.head.appendChild(css);

  function openAuth(mode){
    const app=document.getElementById('appView');
    if(app && !app.classList.contains('hidden'))return;
    const view=document.getElementById('authView');
    if(!view)return;
    try{ if(typeof window.showAuth==='function') window.showAuth(mode||'login'); }catch(e){console.warn('Auth open:',e)}
    view.classList.remove('hidden');
    view.classList.add('om-auth-overlay');
    document.body.classList.add('om-auth-modal-open');
    const guard=document.getElementById('authBootGuard');
    if(guard){guard.classList.add('hidden');setTimeout(()=>guard.remove(),50)}
  }

  function boot(){
    openAuth('login');
    [300,900,1800].forEach(ms=>setTimeout(()=>{
      const app=document.getElementById('appView');
      if(!app || app.classList.contains('hidden')){
        const view=document.getElementById('authView');
        if(view && (!view.querySelector('#email') || !view.querySelector('#password')))openAuth('login');
        else if(view){view.classList.remove('hidden');view.classList.add('om-auth-overlay');document.body.classList.add('om-auth-modal-open')}
      }
    },ms));
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot);else boot();
})();
