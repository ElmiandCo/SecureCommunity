/* OneMuslim auth overlay: the login/signup surface sits directly over the shared parallax world. */
(function(){
  'use strict';
  const style=document.createElement('style');
  style.id='om-auth-overlay-css';
  style.textContent=`
    #authView.om-auth-overlay{position:fixed!important;inset:0!important;z-index:30000!important;display:flex!important;align-items:center!important;justify-content:center!important;padding:24px!important;box-sizing:border-box!important;background:transparent!important;backdrop-filter:none!important}
    #authView.om-auth-overlay.hidden{display:none!important}
    #authView.om-auth-overlay .om-auth-canvas{display:none!important}
    #authView.om-auth-overlay .auth-card{position:relative;z-index:2;width:min(430px,calc(100vw - 30px));max-height:min(760px,calc(100vh - 30px));overflow:auto;margin:0!important;border:1px solid rgba(200,157,60,.55)!important;border-radius:28px!important;background:rgba(10,31,26,.94)!important;color:#f6f1e5!important;box-shadow:0 30px 100px rgba(0,0,0,.48),0 0 70px rgba(200,157,60,.08)!important;padding:32px!important;backdrop-filter:blur(18px)!important}
    #authView.om-auth-overlay .auth-card h2,#authView.om-auth-overlay .auth-card label,#authView.om-auth-overlay .auth-card p{color:#f6f1e5!important}
    #authView.om-auth-overlay .auth-card p{opacity:.72!important}
    #authView.om-auth-overlay .auth-logo{margin:0 auto 14px!important;width:52px;height:52px;display:grid;place-items:center;border:1px solid rgba(200,157,60,.7);border-radius:50%;color:#d8b45a;font-size:25px;background:rgba(200,157,60,.07)}
    #authView.om-auth-overlay #backPublic{display:none!important}
    #authView.om-auth-overlay .auth-nav-actions{display:none!important}
    #authView.om-auth-overlay .switch{margin-top:16px!important;color:#c6d0cb!important}
    #authView.om-auth-overlay .switch button,#authView.om-auth-overlay .forgot{color:#d8b45a!important}
    #authView.om-auth-overlay .field input{background:rgba(255,255,255,.06)!important;color:#fff!important;border:1px solid rgba(255,255,255,.14)!important}
    #authView.om-auth-overlay .field input:focus{border-color:#c89d3c!important;box-shadow:0 0 0 3px rgba(200,157,60,.12)!important}
    #authView.om-auth-overlay .primary{background:linear-gradient(135deg,#1f6b52,#2d8063)!important;border-color:#3b8c70!important;color:#fff!important;box-shadow:0 10px 28px rgba(0,0,0,.25)!important}
    #authView.om-auth-overlay .social{background:rgba(255,255,255,.055)!important;color:#f6f1e5!important;border-color:rgba(255,255,255,.13)!important}
    #authView.om-auth-overlay .divider{color:rgba(246,241,229,.5)!important}
    body.om-auth-modal-open{overflow:hidden!important}
    @media(max-width:520px){#authView.om-auth-overlay{padding:10px!important}#authView.om-auth-overlay .auth-card{width:calc(100vw - 20px);max-height:calc(100vh - 20px);padding:26px 20px!important;border-radius:24px!important}}
  `;
  document.head.appendChild(style);

  function modalState(on){document.body.classList.toggle('om-auth-modal-open',on);const v=document.getElementById('authView');v?.classList.toggle('om-auth-overlay',on)}
  function open(mode){window.showAuth?.(mode||'login');setTimeout(()=>modalState(true),0)}
  function wire(){
    const login=document.getElementById('openLogin'),signup=document.getElementById('openSignup');
    if(login&&!login.dataset.overlayWired){login.dataset.overlayWired='1';login.onclick=()=>open('login')}
    if(signup&&!signup.dataset.overlayWired){signup.dataset.overlayWired='1';signup.onclick=()=>open('signup')}
    /* No return-to-landing button: authentication is the landing experience. */
    const back=document.getElementById('backPublic');if(back)back.style.display='none';
  }
  function sync(){
    wire();
    const app=document.getElementById('appView');const logged=!!app&&!app.classList.contains('hidden');
    document.querySelectorAll('[data-public-auth="signup"]').forEach(b=>b.style.display=logged?'none':'');
    document.querySelectorAll('[data-public-auth="login"]').forEach(b=>b.style.display=logged?'none':'');
    if(logged)modalState(false);
  }
  function showFirstVisitAuth(){
    const app=document.getElementById('appView');
    if(app && !app.classList.contains('hidden'))return;
    setTimeout(()=>{
      const currentApp=document.getElementById('appView');
      if(currentApp && !currentApp.classList.contains('hidden'))return;
      open('login');
    },180);
  }
  let repairRunning=false;
  async function repairSession(){
    if(repairRunning)return;
    repairRunning=true;
    try{
      const client=window.OneMuslimSupabaseClient?.getClient?.() || null;
      if(!client)return;
      const {data,error}=await client.auth.getSession();
      if(error||!data?.session)return;
      const app=document.getElementById('appView');
      if(app?.classList.contains('hidden') && typeof window.enterApp==='function')await window.enterApp();
    }catch(e){console.warn('OneMuslim session restore:',e)}
    finally{repairRunning=false}
  }
  function bootRepair(){repairSession();[250,750,1500,3000,5000].forEach(ms=>setTimeout(repairSession,ms))}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>{sync();bootRepair();showFirstVisitAuth()});
  else {sync();bootRepair();showFirstVisitAuth()}
  new MutationObserver(sync).observe(document.body,{childList:true,subtree:true,attributes:true,attributeFilter:['class']});
  const client=window.OneMuslimSupabaseClient?.getClient?.();
  client?.auth.onAuthStateChange((event,session)=>{if(session && event!=='SIGNED_OUT')setTimeout(repairSession,0)});
})();
