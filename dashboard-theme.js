(function(){
  const $=(s,r=document)=>r.querySelector(s);
  const load=(href,id)=>{if(document.getElementById(id))return;const l=document.createElement('link');l.id=id;l.rel='stylesheet';l.href=href;document.head.appendChild(l)};
  load('dashboard-theme.css','oneMuslimDashboardBase');load('onemuslim-home.css','oneMuslimHomeStyles');load('landing-enhancements.css','oneMuslimLandingEnhancements');load('global-parallax.css','oneMuslimGlobalParallax');
  ['start-pack.js','guest-xp.js'].forEach(src=>{if(!document.querySelector('script[src="'+src+'"]')){const s=document.createElement('script');s.src=src;s.defer=true;document.head.appendChild(s)}});
  document.body.classList.add('dashboard-theme','onemuslim-theme');

  /* The Coming Soon page is the visual source of truth for the shared world.
     We reuse its dark space, gold dust, geometry, galaxy, crescent and ornament language
     without copying its four-page text/scenes onto application pages. */
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
      stars=Array.from({length:Math.min(240,Math.max(100,Math.floor(w*h/6500)))},()=>({x:Math.random()*w,y:Math.random()*h,z:.12+Math.random()*.88,r:.35+Math.random()*1.25,a:.25+Math.random()*.65,p:Math.random()*Math.PI*2}));
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
  const context=new URLSearchParams(location.search).get('from')||location.hash.replace(/^#/,'');const isShahada=/new[-_ ]?revert|shahada|revert/i.test(context);
  function landing(){pv.innerHTML=`<div class="om-parallax" id="oneMuslimLanding"><div class="om-world" id="omWorld" aria-hidden="true"></div><nav class="om-parallax-nav"><a class="om-brand" href="#"><span>1</span><b>ONE MUSLIM</b></a><div class="om-nav-actions"><button data-auth="login">Sign In</button><button class="gold" data-auth="signup">Create Account</button></div></nav><main class="om-story"><div class="om-phase" id="omPhase"><span class="om-eyebrow">ONE MUSLIM · A JOURNEY OF FAITH</span><div class="om-copy" id="omCopy"></div><div class="om-actions" id="omActions"></div><div class="om-progress"><i></i><span>01</span><span>02</span><span>03</span><span>04</span></div></div></main><div class="om-scroll-hint"><span></span>Scroll to journey</div></div>`;wireAuth();renderPhase(isShahada?1:0);setupParallax();setupScroll()}
  const phases=[{title:`Welcome to <em>One Muslim.</em>`,body:`A place to learn, grow, connect, and walk the journey together.`,actions:[['Begin the journey','next']]},{title:`Is this your <em>first time?</em>`,body:`However you arrived here, you belong in this conversation.`,actions:[['Yes — I’m new here','new'],['No — welcome back','next']]},{title:`One <strong>Allah</strong>.<br>One <em>Ummah.</em>`,body:`A community built around knowledge, faith, and meaningful connection.`,actions:[['Continue','next']]},{title:`What do you want to <em>learn?</em>`,body:`Choose your path. You can change it anytime.`,actions:[['Learn in a fun way','fun'],['Serious only','serious']]},{title:`Your journey starts <em>here.</em>`,body:`Explore My Notes, One University, community conversations, lessons, and more.`,actions:[['Create your account','signup'],['Sign in','login']]}];
  let phase=0,busy=false;
  function renderPhase(index){phase=Math.max(0,Math.min(index,phases.length-1));const p=phases[phase],copy=$('#omCopy'),actions=$('#omActions');if(!copy)return;busy=true;copy.classList.add('leaving');actions.classList.add('leaving');setTimeout(()=>{copy.innerHTML=`<h1>${p.title}</h1><p>${p.body}</p>`;actions.innerHTML=p.actions.map(([label,key])=>`<button class="om-cta ${key==='next'?'primary':''}" data-action="${key}">${label}</button>`).join('');copy.classList.remove('leaving');actions.classList.remove('leaving');$('#omPhase').dataset.phase=String(phase);$('#omPhase .om-progress i').style.width=`${(phase/(phases.length-1))*100}%`;actions.querySelectorAll('[data-action]').forEach(b=>b.onclick=()=>act(b.dataset.action));busy=false},busy?340:120)}
  function act(key){if(busy)return;if(key==='next')return renderPhase(phase+1);if(key==='new')return renderPhase(2);if(key==='fun'||key==='serious')return renderPhase(4);if(key==='signup')return $('#openSignup')?.click();if(key==='login')return $('#openLogin')?.click()}
  function wireAuth(){pv.querySelectorAll('[data-auth]').forEach(b=>b.onclick=()=>$(b.dataset.auth==='login'?'#openLogin':'#openSignup')?.click())}
  function setupParallax(){const world=$('#omWorld');if(!world)return;const layers=[...world.querySelectorAll('[data-depth]')];if(!layers.length)return;let tx=0,ty=0,x=0,y=0;const move=(cx,cy)=>{const r=world.getBoundingClientRect();tx=(cx-r.left)/r.width-.5;ty=(cy-r.top)/r.height-.5};world.addEventListener('pointermove',e=>move(e.clientX,e.clientY),{passive:true});world.addEventListener('pointerleave',()=>{tx=ty=0},{passive:true});const tick=()=>{x+=(tx-x)*.055;y+=(ty-y)*.055;layers.forEach(el=>{const d=+el.dataset.depth;el.style.transform=`translate3d(${x*d*44}px,${y*d*30}px,0) scale(${1+d*.045})`});requestAnimationFrame(tick)};tick()}
  function setupScroll(){let last=0;window.addEventListener('wheel',e=>{if(Math.abs(e.deltaY)<8)return;const now=Date.now();if(now-last<700)return;last=now;if(e.deltaY>0&&phase<phases.length-1)renderPhase(phase+1);if(e.deltaY<0&&phase>0)renderPhase(phase-1)},{passive:true});let sy=0;window.addEventListener('touchstart',e=>sy=e.touches[0].clientY,{passive:true});window.addEventListener('touchend',e=>{const d=sy-e.changedTouches[0].clientY;if(Math.abs(d)>45){if(d>0&&phase<phases.length-1)renderPhase(phase+1);if(d<0&&phase>0)renderPhase(phase-1)}},{passive:true})}
  landing();
})();
