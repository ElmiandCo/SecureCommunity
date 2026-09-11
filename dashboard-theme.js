(function(){
  const $=(s,r=document)=>r.querySelector(s);
  const load=(href,id)=>{if(document.getElementById(id))return;const l=document.createElement('link');l.id=id;l.rel='stylesheet';l.href=href;document.head.appendChild(l)};
  load('dashboard-theme.css','oneMuslimDashboardBase');load('onemuslim-home.css','oneMuslimHomeStyles');load('landing-enhancements.css','oneMuslimLandingEnhancements');load('global-parallax.css','oneMuslimGlobalParallax');
  ['start-pack.js','guest-xp.js'].forEach(src=>{if(!document.querySelector('script[src="'+src+'"]')){const s=document.createElement('script');s.src=src;s.defer=true;document.head.appendChild(s)}});
  document.body.classList.add('dashboard-theme','onemuslim-theme');

  /* Shared One Muslim visual world. This remains the visual source of truth for
     the landing/login backdrop while the application functionality stays in app.js. */
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

  /* The landing screen is intentionally minimal: the shared parallax world is
     the backdrop and authentication is the first interaction. No avatars are
     created or loaded here. Login/signup switching remains handled by app.js. */
  const pv=$('#publicView');if(!pv)return;
  function landing(){
    pv.innerHTML=`<div class="om-parallax om-login-landing" id="oneMuslimLanding" aria-label="One Muslim sign in"><div class="om-login-atmosphere" aria-hidden="true"></div><div class="om-login-brand"><span class="om-login-mark">☾</span><span>ONE MUSLIM</span></div></div>`;
    pv.classList.add('om-public-login-ready');
  }
  landing();
})();
