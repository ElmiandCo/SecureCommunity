/* OneMuslim auth overlay: sign-in/create-account modal with a lightweight canvas backdrop. */
(function(){
  'use strict';
  const style=document.createElement('style');
  style.id='om-auth-overlay-css';
  style.textContent=`
    #authView.om-auth-overlay{position:fixed!important;inset:0!important;z-index:30000!important;display:flex!important;align-items:center!important;justify-content:center!important;padding:24px!important;box-sizing:border-box!important;background:rgba(7,24,19,.72)!important;backdrop-filter:blur(12px)!important}
    #authView.om-auth-overlay.hidden{display:none!important}
    #authView.om-auth-overlay .om-auth-canvas{position:absolute;inset:0;width:100%;height:100%;pointer-events:none;opacity:.9}
    #authView.om-auth-overlay .auth-card{position:relative;z-index:2;width:min(460px,calc(100vw - 30px));max-height:min(760px,calc(100vh - 30px));overflow:auto;margin:0!important;border:1px solid rgba(200,157,60,.55)!important;border-radius:28px!important;background:rgba(255,253,248,.97)!important;box-shadow:0 30px 100px rgba(0,0,0,.34)!important;padding:28px!important}
    #authView.om-auth-overlay .auth-logo{margin:0 auto 12px!important}
    #authView.om-auth-overlay #backPublic{display:block!important;position:absolute;left:20px;top:18px;border:0;background:transparent;color:#60756a;cursor:pointer;font-weight:700}
    #authView.om-auth-overlay .auth-nav-actions{display:none!important}
    #authView.om-auth-overlay .switch{margin-top:16px!important}
    body.om-auth-modal-open{overflow:hidden!important}
    @media(max-width:520px){#authView.om-auth-overlay{padding:10px!important}#authView.om-auth-overlay .auth-card{width:calc(100vw - 20px);max-height:calc(100vh - 20px);padding:24px 20px!important;border-radius:24px!important}}
  `;
  document.head.appendChild(style);

  function addCanvas(){
    const view=document.getElementById('authView');if(!view||view.querySelector('.om-auth-canvas'))return;
    const canvas=document.createElement('canvas');canvas.className='om-auth-canvas';canvas.setAttribute('aria-hidden','true');view.prepend(canvas);
    const ctx=canvas.getContext('2d');let raf=0;
    function resize(){const d=Math.min(devicePixelRatio||1,2);canvas.width=innerWidth*d;canvas.height=innerHeight*d;ctx.setTransform(d,0,0,d,0,0)}
    function draw(t){const w=innerWidth,h=innerHeight,cx=w/2,cy=h/2;ctx.clearRect(0,0,w,h);ctx.strokeStyle='rgba(200,157,60,.18)';ctx.lineWidth=1;ctx.beginPath();for(let i=0;i<12;i++){const a=i*Math.PI/6+t/9000,r=Math.min(w,h)*.36;const x=cx+Math.cos(a)*r,y=cy+Math.sin(a)*r;i?ctx.lineTo(x,y):ctx.moveTo(x,y)}ctx.closePath();ctx.stroke();ctx.strokeStyle='rgba(120,180,150,.12)';ctx.beginPath();ctx.arc(cx,cy,Math.min(w,h)*.28+t%3000/80,0,Math.PI*2);ctx.stroke();raf=requestAnimationFrame(draw)}
    resize();addEventListener('resize',resize,{passive:true});if(!matchMedia('(prefers-reduced-motion: reduce)').matches)raf=requestAnimationFrame(draw);view.__authCanvasCleanup=()=>{cancelAnimationFrame(raf);removeEventListener('resize',resize)};
  }
  function modalState(on){document.body.classList.toggle('om-auth-modal-open',on);const v=document.getElementById('authView');v?.classList.toggle('om-auth-overlay',on);if(on)addCanvas()}
  function open(mode){window.showAuth?.(mode||'login');setTimeout(()=>modalState(true),0)}
  function closeToPublic(){
    sessionStorage.setItem('om-auth-welcome-dismissed','1');
    modalState(false);
    const v=document.getElementById('authView');v?.classList.add('hidden');
    const pv=document.getElementById('publicView');pv?.classList.remove('hidden');
  }
  function wire(){
    const login=document.getElementById('openLogin'),signup=document.getElementById('openSignup');
    if(login&&!login.dataset.overlayWired){login.dataset.overlayWired='1';login.onclick=()=>open('login')}
    if(signup&&!signup.dataset.overlayWired){signup.dataset.overlayWired='1';signup.onclick=()=>open('signup')}
    const back=document.getElementById('backPublic');if(back&&!back.dataset.overlayWired){back.dataset.overlayWired='1';back.addEventListener('click',closeToPublic)}
    const view=document.getElementById('authView');if(view&&!view.dataset.overlayWired){view.dataset.overlayWired='1';view.addEventListener('click',e=>{if(e.target===view)closeToPublic()})}
  }
  function sync(){
    wire();
    const app=document.getElementById('appView');const logged=!!app&&!app.classList.contains('hidden');
    document.querySelectorAll('[data-public-auth="signup"]').forEach(b=>b.style.display=logged?'none':'');
    document.querySelectorAll('[data-public-auth="login"]').forEach(b=>b.style.display=logged?'none':'');
    if(logged)modalState(false);
  }
  function showFirstVisitAuth(){
    if(sessionStorage.getItem('om-auth-welcome-dismissed')==='1')return;
    const app=document.getElementById('appView');
    if(app && !app.classList.contains('hidden'))return;
    setTimeout(()=>{
      const currentApp=document.getElementById('appView');
      if(currentApp && !currentApp.classList.contains('hidden'))return;
      open('login');
    },250);
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
