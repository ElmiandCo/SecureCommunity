(function(){
  const $=(s,r=document)=>r.querySelector(s);
  const load=(href,id)=>{if(document.getElementById(id))return;const l=document.createElement('link');l.id=id;l.rel='stylesheet';l.href=href;document.head.appendChild(l)};
  load('dashboard-theme.css','oneMuslimDashboardBase');load('onemuslim-home.css','oneMuslimHomeStyles');load('landing-enhancements.css','oneMuslimLandingEnhancements');load('global-parallax.css','oneMuslimGlobalParallax');load('people-theme.css','oneMuslimPeopleTheme');
  ['start-pack.js','guest-xp.js'].forEach(src=>{if(!document.querySelector('script[src="'+src+'"]')){const s=document.createElement('script');s.src=src;s.defer=true;document.head.appendChild(s)}});
  document.body.classList.add('dashboard-theme','onemuslim-theme');

  function setupGlobalParallax(){
    if(document.getElementById('omGlobalBackdrop'))return;
    const backdrop=document.createElement('div');
    backdrop.id='omGlobalBackdrop';
    backdrop.setAttribute('aria-hidden','true');
    backdrop.innerHTML=`<canvas class="omg-canvas"></canvas><div class="omg-haze"></div><div class="omg-galaxy"></div><div class="omg-network"></div><div class="omg-geometry"></div><div class="omg-dust"></div><div class="omg-crescent">☾</div><div class="omg-ornament"></div><div class="omg-vignette"></div>`;
    document.body.prepend(backdrop);

    const canvas=backdrop.querySelector('.omg-canvas'),ctx=canvas.getContext('2d');
    let w=0,h=0,stars=[],targetX=0,targetY=0,smoothX=0,smoothY=0;
    function resize(){
      const d=Math.min(window.devicePixelRatio||1,2);w=window.innerWidth;h=window.innerHeight;
      canvas.width=w*d;canvas.height=h*d;canvas.style.width=w+'px';canvas.style.height=h+'px';ctx.setTransform(d,0,0,d,0,0);
      stars=Array.from({length:Math.min(180,Math.max(80,Math.floor(w*h/9000)))},()=>({x:Math.random()*w,y:Math.random()*h,z:.12+Math.random()*.88,r:.35+Math.random()*1.15,a:.25+Math.random()*.65,p:Math.random()*Math.PI*2}));
    }
    function move(x,y){targetX=x/window.innerWidth-.5;targetY=y/window.innerHeight-.5}
    window.addEventListener('pointermove',e=>move(e.clientX,e.clientY),{passive:true});
    window.addEventListener('pointerleave',()=>{targetX=targetY=0},{passive:true});
    window.addEventListener('resize',resize,{passive:true});
    function draw(){
      smoothX+=(targetX-smoothX)*.035;smoothY+=(targetY-smoothY)*.035;ctx.clearRect(0,0,w,h);
      for(const s of stars){
        const depth=s.z*.32;
        const x=(s.x+smoothX*depth*38+Math.sin(s.p)*s.z*10+w)%w;
        const y=(s.y+smoothY*depth*28+h)%h;
        ctx.globalAlpha=s.a*(.35+.65*s.z);ctx.beginPath();ctx.arc(x,y,s.r*s.z+.25,0,Math.PI*2);ctx.fillStyle='#fff7d6';ctx.fill();
      }
      ctx.globalAlpha=1;
      const g=backdrop.querySelector('.omg-galaxy'),geo=backdrop.querySelector('.omg-geometry'),crescent=backdrop.querySelector('.omg-crescent');
      g.style.transform=`translate3d(${smoothX*10}px,${smoothY*8}px,0) rotate(-17deg) scale(1.12)`;
      geo.style.transform=`translate3d(${smoothX*7}px,${smoothY*6}px,0) scale(.94) rotate(${35+smoothX*4}deg)`;
      crescent.style.transform=`translate3d(${smoothX*-12}px,${smoothY*-9}px,0) rotate(-18deg)`;
      requestAnimationFrame(draw);
    }
    resize();draw();
  }
  setupGlobalParallax();

  const pv=$('#publicView');if(!pv)return;

  window.__omOpenAuth=function(mode){
    try{
      let renderer=window.showAuth;
      if(typeof renderer!=='function')renderer=Function('return typeof showAuth === "function" ? showAuth : null')();
      const view=document.getElementById('authView');
      if(typeof renderer==='function'){
        renderer(mode||'login');
        window.showAuth=renderer;
      }
      if(view){
        view.classList.remove('hidden');
        view.classList.add('om-auth-overlay');
      }
      document.body.classList.add('om-auth-modal-open');
      document.getElementById('authBootGuard')?.remove();
    }catch(e){console.warn('One Muslim auth bridge:',e)}
  };

  function landing(){
    pv.innerHTML=`
      <div class="om-parallax om-login-landing" id="oneMuslimLanding" aria-label="One Muslim landing page">
        <nav class="om-public-nav" aria-label="Public navigation">
          <div class="om-public-nav-brand"><span class="om-public-nav-mark">☾</span><span>ONE MUSLIM</span></div>
          <div class="om-public-nav-actions">
            <button type="button" class="om-nav-btn om-nav-btn-ghost" id="publicSignIn">Sign In</button>
            <button type="button" class="om-nav-btn om-nav-btn-primary" id="publicCreateAccount">Create Account</button>
          </div>
        </nav>
        <div class="om-login-atmosphere" aria-hidden="true"></div>
        <div class="om-login-center">
          <div class="om-login-brand"><span class="om-login-mark">☾</span><span>ONE MUSLIM</span></div>
          <p class="om-login-tagline">A private space for your faith, growth, and community.</p>
          <button type="button" class="om-center-signin" id="publicCenterSignIn">Sign In</button>
        </div>
      </div>`;

    const styleId='om-public-nav-inline-css';
    if(!document.getElementById(styleId)){
      const style=document.createElement('style');style.id=styleId;style.textContent=`
        #publicView{position:relative!important;z-index:100!important;min-height:100vh!important}
        #oneMuslimLanding{position:relative!important;min-height:100vh!important;width:100%!important;box-sizing:border-box!important}
        .om-public-nav{position:fixed!important;top:0!important;left:0!important;right:0!important;z-index:2147483000!important;height:84px!important;display:flex!important;align-items:center!important;justify-content:space-between!important;padding:0 34px!important;box-sizing:border-box!important;background:linear-gradient(180deg,rgba(5,20,16,.92),rgba(5,20,16,.32),transparent)!important;pointer-events:auto!important}
        .om-public-nav-brand{display:flex!important;align-items:center!important;gap:10px!important;color:#f6f1e5!important;font:700 15px/1.1 Arial,sans-serif!important;letter-spacing:.22em!important;text-shadow:0 2px 18px rgba(0,0,0,.6)!important}
        .om-public-nav-mark{display:grid!important;place-items:center!important;width:34px!important;height:34px!important;border:1px solid rgba(216,180,90,.75)!important;border-radius:50%!important;color:#d8b45a!important;font-size:19px!important}
        .om-public-nav-actions{display:flex!important;align-items:center!important;gap:12px!important}
        .om-nav-btn,.om-center-signin{appearance:none!important;-webkit-appearance:none!important;border-radius:999px!important;padding:12px 22px!important;font:700 14px/1 Arial,sans-serif!important;letter-spacing:.04em!important;cursor:pointer!important;transition:transform .18s ease,box-shadow .18s ease,background .18s ease!important;pointer-events:auto!important}
        .om-nav-btn:hover,.om-center-signin:hover{transform:translateY(-1px)!important}
        .om-nav-btn-ghost{background:rgba(10,31,26,.7)!important;border:1px solid rgba(216,180,90,.7)!important;color:#f6f1e5!important;box-shadow:0 8px 25px rgba(0,0,0,.22)!important}
        .om-nav-btn-primary,.om-center-signin{background:linear-gradient(135deg,#c89d3c,#e2c56f)!important;border:1px solid #efd88c!important;color:#10251d!important;box-shadow:0 10px 30px rgba(0,0,0,.28)!important}
        .om-login-center{position:absolute!important;inset:0!important;z-index:500!important;display:flex!important;flex-direction:column!important;align-items:center!important;justify-content:center!important;text-align:center!important;padding:100px 20px 40px!important;box-sizing:border-box!important;pointer-events:none!important}
        .om-login-brand{display:flex!important;align-items:center!important;gap:14px!important;color:#f6f1e5!important;font:800 clamp(25px,4vw,42px)/1 Arial,sans-serif!important;letter-spacing:.18em!important;text-shadow:0 4px 35px rgba(0,0,0,.65)!important}
        .om-login-mark{color:#d8b45a!important;font-size:1.05em!important}
        .om-login-tagline{max-width:560px!important;margin:18px 0 26px!important;color:rgba(246,241,229,.78)!important;font:400 16px/1.6 Arial,sans-serif!important}
        .om-center-signin{pointer-events:auto!important;padding:14px 30px!important;font-size:15px!important}
        @media(max-width:620px){.om-public-nav{height:72px!important;padding:0 16px!important}.om-public-nav-brand span:last-child{display:none!important}.om-nav-btn{padding:10px 15px!important;font-size:13px!important}.om-public-nav-actions{gap:7px!important}.om-login-center{padding-top:80px!important}}
      `;document.head.appendChild(style);
    }

    const signIn=document.getElementById('publicSignIn');
    const create=document.getElementById('publicCreateAccount');
    const center=document.getElementById('publicCenterSignIn');
    signIn?.addEventListener('click',()=>window.__omOpenAuth('login'));
    create?.addEventListener('click',()=>window.__omOpenAuth('signup'));
    center?.addEventListener('click',()=>window.__omOpenAuth('login'));
    pv.classList.add('om-public-login-ready');
  }
  landing();
})();
