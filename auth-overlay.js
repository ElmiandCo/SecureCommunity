/* OneMuslim auth UI — authentication is an explicit action, never the public landing page. */
(function(){
  'use strict';
  const style=document.createElement('style');
  style.id='om-auth-overlay-css';
  style.textContent=`
    #authView.om-auth-overlay{position:fixed!important;inset:0!important;z-index:30000!important;display:flex!important;align-items:center!important;justify-content:center!important;padding:24px!important;box-sizing:border-box!important;background:transparent!important;backdrop-filter:none!important}
    #authView.om-auth-overlay.hidden{display:none!important}
    #authView.om-auth-overlay .om-auth-canvas{display:none!important}
    #authView.om-auth-overlay .auth-card{position:relative;z-index:2;width:min(430px,calc(100vw - 30px));max-height:min(760px,calc(100vh - 30px));overflow:auto;margin:0!important;border:1px solid rgba(120,91,255,.45)!important;border-radius:28px!important;background:rgba(10,10,18,.94)!important;color:#fff!important;box-shadow:0 30px 100px rgba(0,0,0,.55),0 0 70px rgba(93,72,255,.12)!important;padding:32px!important;backdrop-filter:blur(18px)!important}
    #authView.om-auth-overlay .auth-card h2,#authView.om-auth-overlay .auth-card label,#authView.om-auth-overlay .auth-card p{color:#fff!important}
    #authView.om-auth-overlay .auth-card p{opacity:.72!important}
    #authView.om-auth-overlay .auth-logo{margin:0 auto 14px!important;width:52px;height:52px;display:grid;place-items:center;border:1px solid rgba(120,91,255,.7);border-radius:50%;color:#9f8cff;font-size:25px;background:linear-gradient(135deg,rgba(93,72,255,.14),rgba(41,171,255,.12))}
    #authView.om-auth-overlay #backPublic{display:none!important}
    #authView.om-auth-overlay .auth-nav-actions{display:none!important}
    #authView.om-auth-overlay .switch{margin-top:16px!important;color:#c7c7d2!important}
    #authView.om-auth-overlay .switch button,#authView.om-auth-overlay .forgot{color:#9f8cff!important}
    #authView.om-auth-overlay .field input{background:rgba(255,255,255,.06)!important;color:#fff!important;border:1px solid rgba(255,255,255,.14)!important}
    #authView.om-auth-overlay .field input:focus{border-color:#8c78ff!important;box-shadow:0 0 0 3px rgba(93,72,255,.14)!important}
    #authView.om-auth-overlay .primary{background:linear-gradient(135deg,#6d4aff,#2196f3)!important;border:0!important;color:#fff!important;box-shadow:0 10px 28px rgba(45,38,120,.35)!important}
    #authView.om-auth-overlay .social{background:rgba(255,255,255,.055)!important;color:#fff!important;border-color:rgba(255,255,255,.13)!important}
    #authView.om-auth-overlay .divider{color:rgba(255,255,255,.5)!important}
    body.om-auth-modal-open{overflow:hidden!important}
    @media(max-width:520px){#authView.om-auth-overlay{padding:10px!important}#authView.om-auth-overlay .auth-card{width:calc(100vw - 20px);max-height:calc(100vh - 20px);padding:26px 20px!important;border-radius:24px!important}}
  `;
  document.head.appendChild(style);

  function modalState(on){
    document.body.classList.toggle('om-auth-modal-open',on);
    document.getElementById('authView')?.classList.toggle('om-auth-overlay',on);
  }
  function open(mode){window.showAuth?.(mode||'login');setTimeout(()=>modalState(true),0)}
  function wire(){
    const login=document.getElementById('openLogin'),signup=document.getElementById('openSignup');
    if(login&&!login.dataset.overlayWired){login.dataset.overlayWired='1';login.onclick=()=>open('login')}
    if(signup&&!signup.dataset.overlayWired){signup.dataset.overlayWired='1';signup.onclick=()=>open('signup')}
    const back=document.getElementById('backPublic');
    if(back)back.onclick=()=>modalState(false);
  }
  function sync(){
    wire();
    const app=document.getElementById('appView');const logged=!!app&&!app.classList.contains('hidden');
    document.querySelectorAll('[data-public-auth="signup"]').forEach(b=>b.style.display=logged?'none':'');
    document.querySelectorAll('[data-public-auth="login"]').forEach(b=>b.style.display=logged?'none':'');
    if(logged)modalState(false);
  }
  // Deliberately no showFirstVisitAuth(): public visitors stay on the public site.
  let repairRunning=false;
  async function repairSession(){
    if(repairRunning)return;
    repairRunning=true;
    try{
      const client=window.OneMuslimSupabaseClient?.getClient?.()||null;
      if(!client)return;
      const {data,error}=await client.auth.getSession();
      if(error||!data?.session)return;
      const app=document.getElementById('appView');
      if(app?.classList.contains('hidden')&&typeof window.enterApp==='function')await window.enterApp();
    }catch(e){console.warn('OneMuslim session restore:',e)}
    finally{repairRunning=false}
  }
  function bootRepair(){[250,750,1500,3000,5000].forEach(ms=>setTimeout(repairSession,ms))}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>{sync();bootRepair()},{once:true});
  else{sync();bootRepair()}
  new MutationObserver(sync).observe(document.body,{childList:true,subtree:true,attributes:true,attributeFilter:['class']});
  const client=window.OneMuslimSupabaseClient?.getClient?.();
  client?.auth.onAuthStateChange((event,session)=>{if(session&&event!=='SIGNED_OUT')setTimeout(repairSession,0)});
})();
