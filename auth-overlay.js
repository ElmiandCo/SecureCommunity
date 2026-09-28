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
  function open(mode){
    window.showAuth?.(mode||'login');
    setTimeout(()=>modalState(true),0);
  }
  function showVerificationMessage(email){
    const box=document.getElementById('authMessage');
    if(!box)return;
    box.innerHTML=`<b>Check your email.</b><br>We sent a verification link to <strong>${String(email||'').replace(/[&<>"']/g,'')}</strong>.<br><br><button type="button" id="resendVerification" class="forgot">Resend verification email</button>`;
    box.classList.remove('hidden');
    document.getElementById('resendVerification')?.addEventListener('click',async()=>{
      const client=window.OneMuslimSupabaseClient?.getClient?.();
      if(!client||!email)return;
      const {error}=await client.auth.resend({type:'signup',email,options:{emailRedirectTo:`${window.location.origin}/`}});
      if(error) box.innerHTML=`We couldn't resend the verification email. ${String(error.message||'Please try again.')}`;
      else box.innerHTML=`<b>Verification email sent.</b><br>Check your inbox (and spam folder) for the confirmation link.`;
    });
  }
  function isPasswordIdentity(user){
    const provider=user?.app_metadata?.provider;
    const providers=user?.app_metadata?.providers||[];
    return provider==='email'||providers.includes('email')||(user?.identities||[]).some(i=>i.provider==='email');
  }
  async function enforceVerifiedEmail(session){
    const user=session?.user;
    if(!user||!isPasswordIdentity(user))return true;
    if(user.email_confirmed_at||user.confirmed_at)return true;
    const email=user.email||'';
    const client=window.OneMuslimSupabaseClient?.getClient?.();
    if(client)await client.auth.signOut();
    open('login');
    showVerificationMessage(email);
    return false;
  }
  function wire(){
    const login=document.getElementById('openLogin'),signup=document.getElementById('openSignup');
    if(login&&!login.dataset.overlayWired){login.dataset.overlayWired='1';login.onclick=()=>open('login')}
    if(signup&&!signup.dataset.overlayWired){signup.dataset.overlayWired='1';signup.onclick=()=>open('signup')}
    const back=document.getElementById('backPublic');
    if(back)back.onclick=()=>modalState(false);
    const google=document.querySelector('.social[data-provider="google"]');
    if(google)google.textContent='Continue with Google';
    document.querySelectorAll('.social[data-provider="apple"],.social[data-provider="facebook"]').forEach(b=>b.style.display='none');
  }
  function sync(){
    wire();
    const app=document.getElementById('appView');const logged=!!app&&!app.classList.contains('hidden');
    document.querySelectorAll('[data-public-auth="signup"]').forEach(b=>b.style.display=logged?'none':'');
    document.querySelectorAll('[data-public-auth="login"]').forEach(b=>b.style.display=logged?'none':'');
    if(logged)modalState(false);
  }
  let repairRunning=false;
  async function repairSession(){
    if(repairRunning)return;
    repairRunning=true;
    try{
      const client=window.OneMuslimSupabaseClient?.getClient?.()||null;
      if(!client)return;
      const {data,error}=await client.auth.getSession();
      if(error||!data?.session)return;
      if(!(await enforceVerifiedEmail(data.session)))return;
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
  client?.auth.onAuthStateChange(async(event,session)=>{
    if(session&&event!=='SIGNED_OUT'){
      if(await enforceVerifiedEmail(session))setTimeout(repairSession,0);
    }
  });
})();
