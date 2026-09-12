/* OneMuslim auth visibility guard — never show the login screen over an existing Supabase session. */
(function(){
  'use strict';

  const css=document.createElement('style');
  css.id='om-auth-force-fix-css';
  css.textContent=`
    html,body{min-height:100%!important}
    body.om-auth-modal-open{overflow:hidden!important}
    #authView.om-auth-overlay{position:fixed!important;inset:0!important;z-index:2147483645!important;display:flex!important;visibility:visible!important;opacity:1!important;overflow-y:auto!important;overflow-x:hidden!important;align-items:flex-start!important;justify-content:center!important;padding:clamp(70px,10vh,110px) 18px 40px!important;-webkit-overflow-scrolling:touch!important;overscroll-behavior:contain!important}
    #authView.om-auth-overlay.hidden{display:flex!important;visibility:visible!important}
    #authView.om-auth-overlay .auth-card{flex:0 0 auto!important;width:min(460px,100%)!important;max-height:none!important;overflow:visible!important;margin:0 auto!important}
    #authView.om-auth-overlay .auth-card .form{padding-bottom:2px}
    @media(max-width:520px){#authView.om-auth-overlay{padding:64px 10px 28px!important;align-items:flex-start!important}#authView.om-auth-overlay .auth-card{width:100%!important}}
  `;
  document.head.appendChild(css);

  function getClient(){
    try{return window.OneMuslimSupabaseClient?.getClient?.() || null;}catch(e){return null;}
  }

  function getExistingShowAuth(){
    try{
      const fn=Function('return typeof showAuth === "function" ? showAuth : null')();
      return typeof fn==='function' ? fn : null;
    }catch(e){return null;}
  }

  function hasApp(){
    const app=document.getElementById('appView');
    return !!(app && !app.classList.contains('hidden'));
  }

  function openAuth(mode='login'){
    if(hasApp()) return;
    const view=document.getElementById('authView');
    if(!view) return;
    try{
      const renderer=window.showAuth||getExistingShowAuth();
      if(typeof renderer==='function'){
        renderer(mode);
        if(!window.showAuth) window.showAuth=renderer;
      }
    }catch(e){console.warn('Auth open:',e);}
    view.classList.remove('hidden');
    view.classList.add('om-auth-overlay');
    document.body.classList.add('om-auth-modal-open');
    const guard=document.getElementById('authBootGuard');
    if(guard){guard.classList.add('hidden');setTimeout(()=>guard.remove(),50);}
  }

  function closeAuth(){
    const view=document.getElementById('authView');
    if(!view) return;
    view.classList.add('hidden');
    view.classList.remove('om-auth-overlay');
    document.body.classList.remove('om-auth-modal-open');
  }

  async function boot(){
    const sb=getClient();
    if(!sb){
      // Supabase client is not ready yet. Give the app a moment instead of
      // immediately assuming the visitor is signed out.
      setTimeout(boot,250);
      return;
    }

    let resolved=false;
    try{
      const {data,error}=await sb.auth.getSession();
      resolved=true;
      if(error) throw error;

      if(data?.session){
        // An existing session is authoritative. app.js owns the transition
        // into the authenticated app; this guard must never cover it with login.
        closeAuth();
        return;
      }
    }catch(e){
      console.warn('Auth session check:',e);
    }

    if(resolved && !hasApp()) openAuth('login');
  }

  function wireAuthChanges(){
    const sb=getClient();
    if(!sb){setTimeout(wireAuthChanges,250);return;}
    sb.auth.onAuthStateChange((event,session)=>{
      if(session){
        closeAuth();
      }else if(event==='SIGNED_OUT'){
        openAuth('login');
      }
    });
  }

  if(document.readyState==='loading'){
    document.addEventListener('DOMContentLoaded',()=>{boot();wireAuthChanges();},{once:true});
  }else{
    boot();
    wireAuthChanges();
  }
})();
