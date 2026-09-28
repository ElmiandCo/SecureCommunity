/* OneMuslim auth visibility guard — public-first architecture.
   The public homepage is never replaced by the login screen. Authentication is
   opened only by an explicit user action, a protected-route request, or the
   account-conversion journey. */
(function(){
  'use strict';
  const journeyConvert=()=>new URLSearchParams(location.search).get('journey')==='convert';
  const authRequested=()=>{const p=new URLSearchParams(location.search);return p.get('auth')==='login'||p.get('auth')==='signup'||p.get('reset')==='1'};
  if(journeyConvert()&&!document.getElementById('omJourneyConversionScript')){
    const s=document.createElement('script');s.id='omJourneyConversionScript';s.src='journey-conversion.js?v=20260912-01';document.head.appendChild(s);
  }
  const css=document.createElement('style');
  css.id='om-auth-force-fix-css';
  css.textContent=`
    html,body{min-height:100%!important}
    body.om-auth-modal-open{overflow:hidden!important}
    #authView.om-auth-overlay{position:fixed!important;inset:0!important;z-index:2147483645!important;display:flex!important;visibility:visible!important;opacity:1!important;overflow-y:auto!important;overflow-x:hidden!important;align-items:flex-start!important;justify-content:center!important;padding:clamp(70px,10vh,110px) 18px 40px!important;-webkit-overflow-scrolling:touch!important;overscroll-behavior:contain!important}
    #authView.om-auth-overlay.hidden{display:none!important;visibility:hidden!important}
    #authView.om-auth-overlay .auth-card{flex:0 0 auto!important;width:min(460px,100%)!important;max-height:none!important;overflow:visible!important;margin:0 auto!important}
    #authView.om-auth-overlay .auth-card .form{padding-bottom:2px}
    @media(max-width:520px){#authView.om-auth-overlay{padding:64px 10px 28px!important;align-items:flex-start!important}#authView.om-auth-overlay .auth-card{width:100%!important}}
  `;
  document.head.appendChild(css);

  function getClient(){try{return window.OneMuslimSupabaseClient?.getClient?.()||null}catch(e){return null}}
  function hasApp(){const app=document.getElementById('appView');return !!(app&&!app.classList.contains('hidden'))}
  function openAuth(mode='login'){
    if(hasApp()&&!journeyConvert())return;
    const view=document.getElementById('authView');if(!view)return;
    try{window.showAuth?.(mode)}catch(e){console.warn('Auth open:',e)}
    view.classList.remove('hidden');view.classList.add('om-auth-overlay');document.body.classList.add('om-auth-modal-open');
    document.getElementById('authBootGuard')?.classList.add('hidden');
  }
  function closeAuth(){
    const view=document.getElementById('authView');if(!view)return;
    view.classList.add('hidden');view.classList.remove('om-auth-overlay');document.body.classList.remove('om-auth-modal-open');
  }
  async function boot(){
    const sb=getClient();if(!sb){setTimeout(boot,250);return}
    try{
      const {data,error}=await sb.auth.getSession();
      if(error)throw error;
      if(data?.session){
        if(data.session.user?.is_anonymous&&journeyConvert()){openAuth('signup');return}
        if(!journeyConvert())closeAuth();
        return;
      }
      // No session is a normal public state. Do NOT open auth automatically.
      if(authRequested()){
        const mode=new URLSearchParams(location.search).get('reset')==='1'?'reset':(new URLSearchParams(location.search).get('auth')==='signup'?'signup':'login');
        openAuth(mode);
      }
    }catch(e){console.warn('Auth session check:',e)}
  }
  function wireAuthChanges(){
    const sb=getClient();if(!sb){setTimeout(wireAuthChanges,250);return}
    sb.auth.onAuthStateChange((event,session)=>{
      if(session?.user?.is_anonymous&&journeyConvert()){openAuth('signup');return}
      if(session&&!journeyConvert())closeAuth();
      // SIGNED_OUT intentionally returns the user to the public homepage.
      if(event==='SIGNED_OUT')closeAuth();
    });
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>{boot();wireAuthChanges()},{once:true});
  else{boot();wireAuthChanges()}
})();
