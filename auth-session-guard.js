/* OneMuslim — dynamic cinematic secure-session loader.
   Seven-Heavens-inspired night scene: stars, Milky Way, golden orbital geometry,
   crescent, horizon, mosque silhouettes, layered parallax and living light.
   Text intentionally says: Say “Bismillah”... */
(function(){
  'use strict';

  const MAX_WAIT_MS = 8000;
  const started = Date.now();
  const style=document.createElement('style');
  style.textContent=`
    #authBootGuard{position:fixed;inset:0;z-index:2147483646;overflow:hidden;background:#061613;color:#fff;opacity:1;transition:opacity .5s ease;font-family:system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif}
    #authBootGuard.hidden{opacity:0;pointer-events:none}
    #authBootGuard .om-loader-scene{position:absolute;inset:-4%;overflow:hidden;background:radial-gradient(circle at 50% 58%,#173d35 0,#0b2924 38%,#04120f 100%);transform:scale(1.04);will-change:transform}
    #authBootGuard canvas{position:absolute;inset:0;width:100%;height:100%;will-change:transform}
    #authBootGuard .om-loader-copy{position:absolute;left:50%;bottom:8.5%;z-index:4;width:90%;transform:translateX(-50%);text-align:center;text-shadow:0 2px 18px rgba(0,0,0,.65);pointer-events:none}
    #authBootGuard .om-loader-title{margin:0;color:#fff1c9;font-family:Georgia,"Times New Roman",serif;font-size:clamp(36px,9vw,64px);font-weight:700;letter-spacing:-.02em}
    #authBootGuard .om-loader-divider{width:90px;height:1px;margin:13px auto 10px;background:linear-gradient(90deg,transparent,#e2bb62,transparent);position:relative}
    #authBootGuard .om-loader-divider:after{content:"✦";position:absolute;left:50%;top:50%;transform:translate(-50%,-58%);color:#e2bb62;font-size:12px;background:transparent}
    #authBootGuard .om-loader-status{margin:0;color:#f0cd82;font-size:clamp(13px,3.5vw,17px);font-weight:500;letter-spacing:.08em}
    #authBootGuard .om-loader-dots:after{content:"";display:inline-block;width:18px;text-align:left;animation:omDots 1.35s steps(4,end) infinite}
    @keyframes omDots{0%{content:""}25%{content:"."}50%{content:".."}75%{content:"..."}100%{content:""}}
    @media(prefers-reduced-motion:reduce){#authBootGuard .om-loader-dots:after{animation:none;content:"..."}}
  `;
  document.head.appendChild(style);

  const guard=document.createElement('div');
  guard.id='authBootGuard';
  guard.setAttribute('aria-live','polite');
  guard.innerHTML=`<div class="om-loader-scene" aria-label="Loading OneMuslim"><canvas aria-hidden="true"></canvas><div class="om-loader-copy"><h1 class="om-loader-title">OneMuslim</h1><div class="om-loader-divider"></div><p class="om-loader-status">Say “Bismillah”<span class="om-loader-dots"></span></p></div></div>`;
  document.body.appendChild(guard);

  const scene=guard.querySelector('.om-loader-scene');
  const canvas=guard.querySelector('canvas');
  const ctx=canvas.getContext('2d');
  let running=true;
  let raf=0;
  let W=0,H=0,DPR=1;
  let px=0,py=0,tpx=0,tpy=0;
  let autoT=0;
  const stars=[];
  const particles=[];
  const rand=(a,b)=>a+Math.random()*(b-a);

  function resize(){
    W=canvas.clientWidth; H=canvas.clientHeight; DPR=Math.min(devicePixelRatio||1,2);
    canvas.width=Math.max(1,Math.round(W*DPR)); canvas.height=Math.max(1,Math.round(H*DPR));
    ctx.setTransform(DPR,0,0,DPR,0,0);
    stars.length=0; particles.length=0;
    for(let i=0;i<170;i++) stars.push({x:rand(0,W),y:rand(0,H*.72),r:rand(.35,1.35),a:rand(.25,.95),phase:rand(0,Math.PI*2),depth:rand(.15,1)});
    for(let i=0;i<34;i++) particles.push({x:rand(0,W),y:rand(H*.15,H*.75),r:rand(.7,1.7),speed:rand(.08,.28),phase:rand(0,Math.PI*2),depth:rand(.3,1)});
  }

  function roundRect(x,y,w,h,r){ctx.beginPath();ctx.moveTo(x+r,y);ctx.arcTo(x+w,y,x+w,y+h,r);ctx.arcTo(x+w,y+h,x,y+h,r);ctx.arcTo(x,y+h,x,y,r);ctx.arcTo(x,y,x+w,y,r);ctx.closePath()}

  function draw(time){
    if(!running)return;
    const s=time*.001;
    // Slow autonomous camera drift keeps the scene alive even without touch.
    autoT=s*.34;
    const autoX=Math.sin(autoT)*.16+Math.sin(autoT*.43)*.06;
    const autoY=Math.cos(autoT*.71)*.12;
    const cameraX=px+autoX, cameraY=py+autoY;
    ctx.clearRect(0,0,W,H);

    const sky=ctx.createLinearGradient(0,0,0,H);
    sky.addColorStop(0,'#020b0a'); sky.addColorStop(.38,'#08231f'); sky.addColorStop(.68,'#174238'); sky.addColorStop(1,'#061613');
    ctx.fillStyle=sky; ctx.fillRect(0,0,W,H);

    // Deep-space parallax haze.
    ctx.save(); ctx.translate(cameraX*-5,cameraY*-3); ctx.rotate(-.48);
    const mw=ctx.createRadialGradient(W*.49,H*.35,20,W*.49,H*.35,W*.55);
    mw.addColorStop(0,'rgba(235,238,205,.17)'); mw.addColorStop(.28,'rgba(174,205,185,.08)'); mw.addColorStop(1,'rgba(0,0,0,0)');
    ctx.fillStyle=mw; ctx.fillRect(-W*.2,-H*.15,W*1.4,H*1.05); ctx.restore();

    // Stars sit farthest away, so they move the least.
    for(const st of stars){
      const tw=.55+.45*Math.sin(s*1.7+st.phase);
      ctx.globalAlpha=st.a*tw; ctx.fillStyle='#fff0bf'; ctx.beginPath();
      ctx.arc(st.x+cameraX*-3*st.depth,st.y+cameraY*-2*st.depth,st.r,0,Math.PI*2); ctx.fill();
    }
    ctx.globalAlpha=1;

    // Crescent — mid-distance layer.
    const moonX=W*.17+cameraX*-8, moonY=H*.47+cameraY*-5, mr=Math.min(W,H)*.035;
    ctx.save(); ctx.shadowBlur=18; ctx.shadowColor='rgba(241,199,104,.45)'; ctx.fillStyle='#f1d48b'; ctx.beginPath(); ctx.arc(moonX,moonY,mr,0,Math.PI*2); ctx.fill(); ctx.fillStyle='#0a2823'; ctx.shadowBlur=0; ctx.beginPath(); ctx.arc(moonX+mr*.42,moonY-mr*.16,mr*.92,0,Math.PI*2); ctx.fill(); ctx.restore();

    // Seven golden orbital arcs with gentle breathing motion.
    const cx=W/2+cameraX*-2, cy=H*.37+cameraY*-2, base=Math.min(W*.43,H*.23);
    ctx.save(); ctx.translate(cx,cy);
    for(let i=0;i<7;i++){
      const r=base*(.45+i*.15);
      ctx.strokeStyle=`rgba(221,181,91,${.17+i*.035})`; ctx.lineWidth=i===6?1.5:1;
      ctx.beginPath(); ctx.arc(0,0,r,Math.PI*1.06,Math.PI*1.94); ctx.stroke();
      const a=-Math.PI/2;
      const bx=Math.cos(a)*r, by=Math.sin(a)*r;
      const pulse=1.8+1.1*Math.sin(s*2+i);
      ctx.fillStyle='#f5d789'; ctx.shadowBlur=10; ctx.shadowColor='rgba(245,215,137,.7)'; ctx.beginPath(); ctx.arc(bx,by,pulse,0,Math.PI*2); ctx.fill();
    }
    ctx.shadowBlur=0; ctx.restore();

    // Central emblem.
    const ey=H*.47+cameraY*-3;
    ctx.save(); ctx.translate(W/2+cameraX*-2,ey);
    const eg=ctx.createRadialGradient(0,0,8,0,0,Math.min(W,H)*.12); eg.addColorStop(0,'rgba(255,231,157,.3)'); eg.addColorStop(1,'rgba(255,231,157,0)'); ctx.fillStyle=eg; ctx.beginPath(); ctx.arc(0,0,Math.min(W,H)*.16,0,Math.PI*2); ctx.fill();
    ctx.strokeStyle='#e6c36c'; ctx.lineWidth=2; ctx.beginPath(); ctx.arc(0,0,Math.min(W,H)*.075,0,Math.PI*2); ctx.stroke();
    ctx.strokeStyle='rgba(236,231,199,.85)'; ctx.lineWidth=1.2; ctx.beginPath();
    for(let i=0;i<8;i++){const a=Math.PI/8+i*Math.PI/4; const r=Math.min(W,H)*.055; const x=Math.cos(a)*r,y=Math.sin(a)*r; i?ctx.lineTo(x,y):ctx.moveTo(x,y)} ctx.closePath(); ctx.stroke();
    ctx.fillStyle='#fff5d4'; ctx.shadowBlur=22; ctx.shadowColor='rgba(255,221,132,.9)'; ctx.beginPath(); ctx.moveTo(0,-18);ctx.lineTo(5,-5);ctx.lineTo(18,0);ctx.lineTo(5,5);ctx.lineTo(0,18);ctx.lineTo(-5,5);ctx.lineTo(-18,0);ctx.lineTo(-5,-5);ctx.closePath();ctx.fill(); ctx.restore();

    const hy=H*.69+cameraY*1; const hg=ctx.createRadialGradient(W/2,hy,0,W/2,hy,W*.48); hg.addColorStop(0,'rgba(244,190,91,.5)'); hg.addColorStop(.25,'rgba(222,160,70,.16)'); hg.addColorStop(1,'rgba(0,0,0,0)'); ctx.fillStyle=hg; ctx.fillRect(0,hy-H*.2,W,H*.35);

    // Mountains are closer, so they move more.
    ctx.save(); ctx.translate(cameraX*-4,cameraY*-1);
    ctx.fillStyle='#0a1d19'; ctx.beginPath(); ctx.moveTo(0,H*.79); for(let i=0;i<14;i++){const x=i*W/13; const peak=H*(.72-rand(0,.11)); ctx.lineTo(x,peak);ctx.lineTo(x+W/26,H*.79)} ctx.lineTo(W,H);ctx.lineTo(0,H);ctx.closePath();ctx.fill();
    ctx.fillStyle='#102b25'; ctx.beginPath();ctx.moveTo(0,H*.82);ctx.lineTo(W*.16,H*.72);ctx.lineTo(W*.28,H*.79);ctx.lineTo(W*.43,H*.7);ctx.lineTo(W*.58,H*.78);ctx.lineTo(W*.75,H*.69);ctx.lineTo(W,H*.8);ctx.lineTo(W,H);ctx.lineTo(0,H);ctx.closePath();ctx.fill(); ctx.restore();

    // Valley/path layer.
    ctx.save(); ctx.translate(cameraX*-2,cameraY*-1);
    const rg=ctx.createLinearGradient(0,H*.77,0,H); rg.addColorStop(0,'rgba(226,191,111,.38)');rg.addColorStop(1,'rgba(17,54,47,.12)');ctx.fillStyle=rg;ctx.beginPath();ctx.moveTo(W*.49,H*.72);ctx.bezierCurveTo(W*.45,H*.82,W*.58,H*.87,W*.48,H);ctx.lineTo(W*.61,H);ctx.bezierCurveTo(W*.65,H*.88,W*.54,H*.81,W*.52,H*.72);ctx.closePath();ctx.fill();ctx.restore();

    // Foreground mosque/city layer moves most noticeably.
    ctx.save(); ctx.translate(cameraX*-7,cameraY*-2);
    for(let i=0;i<95;i++){const x=rand(W*.08,W*.92), y=rand(H*.78,H*.91);ctx.globalAlpha=rand(.18,.65);ctx.fillStyle='#edc46d';ctx.fillRect(x,y,rand(1,2),rand(1,2));} ctx.globalAlpha=1;
    const mx=W*.73,my=H*.79, mwid=Math.min(W*.34,230), mh=Math.min(H*.12,120);
    ctx.fillStyle='#071512'; roundRect(mx-mwid/2,my-mh*.35,mwid,mh*.6,8);ctx.fill();
    ctx.beginPath();ctx.ellipse(mx,my-mh*.35,mwid*.25,mh*.34,0,Math.PI,0);ctx.fill();
    for(const dx of [-mwid*.38,mwid*.38]){ctx.fillRect(mx+dx-4,my-mh*.8,8,mh*.82);ctx.beginPath();ctx.moveTo(mx+dx-9,my-mh*.8);ctx.lineTo(mx+dx,my-mh*.93);ctx.lineTo(mx+dx+9,my-mh*.8);ctx.closePath();ctx.fill();}
    ctx.fillStyle='#e4bb65';ctx.globalAlpha=.7;ctx.fillRect(mx-3,my-mh*.2,6,mh*.2);ctx.globalAlpha=1;ctx.restore();

    for(const p of particles){const yy=(p.y-(s*p.speed*30)%H+H)%H;ctx.globalAlpha=.15+.35*(.5+.5*Math.sin(s+p.phase));ctx.fillStyle='#f1ce7e';ctx.beginPath();ctx.arc(p.x+cameraX*-8*p.depth,yy+cameraY*-5*p.depth,p.r,0,Math.PI*2);ctx.fill();} ctx.globalAlpha=1;

    // Subtle camera breathing, separate from pointer movement.
    scene.style.transform=`translate3d(${cameraX*2}px,${cameraY*2}px,0) scale(1.04)`;
    raf=requestAnimationFrame(draw);
  }

  function setPointer(x,y){tpx=Math.max(-1,Math.min(1,x));tpy=Math.max(-1,Math.min(1,y));}
  const pointerHandler=e=>setPointer((e.clientX/innerWidth-.5)*2,(e.clientY/innerHeight-.5)*2);
  window.addEventListener('pointermove',pointerHandler,{passive:true});
  window.addEventListener('resize',resize,{passive:true});
  if(window.DeviceOrientationEvent) window.addEventListener('deviceorientation',e=>{if(typeof e.gamma==='number')setPointer(e.gamma/30,(e.beta||0)/30)},{passive:true});

  function finish(){
    if(!running)return; running=false; cancelAnimationFrame(raf); guard.classList.add('hidden');
    setTimeout(()=>guard.remove(),520);
    window.removeEventListener('pointermove',pointerHandler);
    window.removeEventListener('resize',resize);
  }
  function check(){
    const badge=document.getElementById('sessionBadge');
    const publicView=document.getElementById('publicView');
    const appView=document.getElementById('appView');
    if(badge?.textContent==='SECURE SESSION' || (!publicView?.classList.contains('hidden')&&!appView?.classList.contains('hidden'))){finish();return true}
    if(Date.now()-started>=MAX_WAIT_MS){finish();return true}
    return false;
  }

  resize();
  if(window.matchMedia('(prefers-reduced-motion: reduce)').matches){tpx=tpy=0}
  raf=requestAnimationFrame(draw);
  const observer=new MutationObserver(check); observer.observe(document.body,{subtree:true,childList:true,characterData:true,attributes:true,attributeFilter:['class']});
  const timer=setInterval(()=>{if(check()){clearInterval(timer);observer.disconnect()}},100);
  setTimeout(()=>{clearInterval(timer);observer.disconnect();finish()},MAX_WAIT_MS+250);
})();
