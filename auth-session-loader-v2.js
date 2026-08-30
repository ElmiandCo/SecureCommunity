/* OneMuslim — cinematic secure-session loader v2.
   Dynamic seven-heavens-inspired night sky with obvious layered parallax.
   The loader is intentionally lightweight and disappears as soon as the app
   has established a secure session (or after the safety timeout).
*/
(function(){
  'use strict';
  if(document.getElementById('authBootGuard'))return;

  const MAX_WAIT_MS=8000;
  const started=Date.now();
  const reduceMotion=window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

  const style=document.createElement('style');
  style.id='om-session-loader-v2-css';
  style.textContent=`
    #authBootGuard{position:fixed;inset:0;z-index:2147483646;overflow:hidden;background:#03110e;color:#fff;opacity:1;transition:opacity .55s ease;font-family:system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif}
    #authBootGuard.hidden{opacity:0;pointer-events:none}
    #authBootGuard .om-v2-scene{position:absolute;inset:-7%;overflow:hidden;background:#03110e;transform:translate3d(0,0,0) scale(1.04);will-change:transform}
    #authBootGuard canvas{position:absolute;inset:0;width:100%;height:100%;display:block}
    #authBootGuard .om-v2-vignette{position:absolute;inset:0;background:radial-gradient(circle at 50% 42%,transparent 0 35%,rgba(0,0,0,.18) 68%,rgba(0,0,0,.68) 100%);pointer-events:none}
    #authBootGuard .om-v2-copy{position:absolute;left:50%;bottom:8.5%;width:min(92%,560px);transform:translateX(-50%);z-index:5;text-align:center;text-shadow:0 3px 25px rgba(0,0,0,.72);pointer-events:none}
    #authBootGuard .om-v2-kicker{margin:0 0 8px;color:#e7c878;font-size:10px;font-weight:800;letter-spacing:.28em;text-transform:uppercase;opacity:.9}
    #authBootGuard .om-v2-title{margin:0;color:#fff3cb;font-family:Georgia,"Times New Roman",serif;font-size:clamp(42px,11vw,72px);line-height:1;font-weight:700;letter-spacing:-.035em}
    #authBootGuard .om-v2-divider{width:110px;height:1px;margin:15px auto 11px;background:linear-gradient(90deg,transparent,#e6c36c,transparent);position:relative}
    #authBootGuard .om-v2-divider:after{content:"✦";position:absolute;left:50%;top:50%;transform:translate(-50%,-58%);padding:0 7px;color:#e6c36c;font-size:12px}
    #authBootGuard .om-v2-status{margin:0;color:#f1d38b;font-size:clamp(13px,3.7vw,17px);font-weight:600;letter-spacing:.09em}
    #authBootGuard .om-v2-dots:after{content:"";display:inline-block;width:18px;text-align:left;animation:omV2Dots 1.35s steps(4,end) infinite}
    @keyframes omV2Dots{0%{content:""}25%{content:"."}50%{content:".."}75%{content:"..."}100%{content:""}}
    @media(prefers-reduced-motion:reduce){#authBootGuard .om-v2-dots:after{animation:none;content:"..."}}
  `;
  document.head.appendChild(style);

  const guard=document.createElement('div');
  guard.id='authBootGuard';
  guard.setAttribute('aria-live','polite');
  guard.innerHTML=`<div class="om-v2-scene"><canvas aria-hidden="true"></canvas><div class="om-v2-vignette"></div><div class="om-v2-copy"><p class="om-v2-kicker">SECURE SESSION</p><h1 class="om-v2-title">OneMuslim</h1><div class="om-v2-divider"></div><p class="om-v2-status">Say “Bismillah”<span class="om-v2-dots"></span></p></div></div>`;
  document.body.appendChild(guard);

  const scene=guard.querySelector('.om-v2-scene');
  const canvas=guard.querySelector('canvas');
  const ctx=canvas.getContext('2d');
  let W=0,H=0,DPR=1,raf=0,running=true;
  let targetX=0,targetY=0,cameraX=0,cameraY=0;
  let stars=[],dust=[];
  const rand=(a,b)=>a+Math.random()*(b-a);
  const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));

  function resize(){
    W=Math.max(1,canvas.clientWidth);H=Math.max(1,canvas.clientHeight);DPR=Math.min(window.devicePixelRatio||1,2);
    canvas.width=Math.round(W*DPR);canvas.height=Math.round(H*DPR);ctx.setTransform(DPR,0,0,DPR,0,0);
    stars=Array.from({length:220},()=>({x:rand(0,W),y:rand(0,H*.7),r:rand(.35,1.45),a:rand(.3,.95),phase:rand(0,Math.PI*2),depth:rand(.08,.55)}));
    dust=Array.from({length:70},()=>({x:rand(0,W),y:rand(0,H),r:rand(.5,1.8),phase:rand(0,Math.PI*2),speed:rand(.035,.12),depth:rand(.35,1)}));
  }

  function pointer(x,y){
    targetX=clamp(x,-1,1);targetY=clamp(y,-1,1);
  }
  const onPointer=e=>pointer((e.clientX/innerWidth-.5)*2,(e.clientY/innerHeight-.5)*2);
  window.addEventListener('pointermove',onPointer,{passive:true});
  window.addEventListener('resize',resize,{passive:true});
  if(window.DeviceOrientationEvent){window.addEventListener('deviceorientation',e=>{if(typeof e.gamma==='number')pointer(e.gamma/28,(e.beta||0)/35)},{passive:true});}

  function polygon(cx,cy,r,n,rotation){
    ctx.beginPath();
    for(let i=0;i<n;i++){const a=rotation+i*Math.PI*2/n,x=cx+Math.cos(a)*r,y=cy+Math.sin(a)*r;i?ctx.lineTo(x,y):ctx.moveTo(x,y)}
    ctx.closePath();
  }

  function draw(t){
    if(!running)return;
    const s=t*.001;
    if(!reduceMotion){
      targetX*=.995;targetY*=.995;
      const driftX=Math.sin(s*.28)*.055+Math.sin(s*.73)*.018;
      const driftY=Math.cos(s*.31)*.04;
      cameraX+=(targetX+driftX-cameraX)*.035;
      cameraY+=(targetY+driftY-cameraY)*.035;
    }else{cameraX*=.92;cameraY*=.92;}

    ctx.clearRect(0,0,W,H);
    const sky=ctx.createLinearGradient(0,0,0,H);
    sky.addColorStop(0,'#010907');sky.addColorStop(.32,'#05201b');sky.addColorStop(.64,'#0b352d');sky.addColorStop(1,'#03130f');
    ctx.fillStyle=sky;ctx.fillRect(0,0,W,H);

    // Milky Way layer — very far away, almost stationary.
    ctx.save();
    ctx.translate(cameraX*-2,cameraY*-1);
    ctx.rotate(-.35);
    const mw=ctx.createRadialGradient(W*.52,H*.32,10,W*.52,H*.32,W*.65);
    mw.addColorStop(0,'rgba(230,239,216,.14)');mw.addColorStop(.25,'rgba(164,204,184,.09)');mw.addColorStop(.62,'rgba(104,161,143,.025)');mw.addColorStop(1,'rgba(0,0,0,0)');
    ctx.fillStyle=mw;ctx.fillRect(-W*.25,-H*.2,W*1.5,H*1.1);ctx.restore();

    // Stars.
    for(const st of stars){
      const tw=.55+.45*Math.sin(s*1.8+st.phase);
      const x=st.x+cameraX*-8*st.depth;
      const y=st.y+cameraY*-5*st.depth;
      ctx.globalAlpha=st.a*tw;ctx.fillStyle='#fff1bd';ctx.beginPath();ctx.arc(x,y,st.r,0,Math.PI*2);ctx.fill();
      if(st.r>1.05&&tw>.88){ctx.globalAlpha*=.35;ctx.fillRect(x-3,y-.35,6,.7);ctx.fillRect(x-.35,y-3,.7,6);}
    }
    ctx.globalAlpha=1;

    // Seven orbital heavens — large and unmistakably layered.
    const cx=W*.5+cameraX*-4,cy=H*.29+cameraY*-3,base=Math.min(W*.42,H*.27);
    ctx.save();ctx.translate(cx,cy);
    for(let i=0;i<7;i++){
      const r=base*(.42+i*.115)+Math.sin(s*.65+i)*1.5;
      ctx.strokeStyle=`rgba(229,194,108,${.2+i*.025})`;ctx.lineWidth=i===6?1.7:1;
      ctx.beginPath();ctx.arc(0,0,r,Math.PI*1.06,Math.PI*1.94);ctx.stroke();
      const bx=Math.cos(-Math.PI/2)*r,by=Math.sin(-Math.PI/2)*r;
      const pulse=1.4+1.15*(.5+.5*Math.sin(s*2+i));
      ctx.fillStyle='#f6d989';ctx.shadowBlur=12;ctx.shadowColor='rgba(246,217,137,.75)';ctx.beginPath();ctx.arc(bx,by,pulse,0,Math.PI*2);ctx.fill();
    }
    ctx.shadowBlur=0;ctx.restore();

    // Crescent, middle layer.
    const mr=Math.min(W,H)*.035;const moonX=W*.16+cameraX*-14;const moonY=H*.47+cameraY*-8;
    ctx.save();ctx.shadowBlur=24;ctx.shadowColor='rgba(241,205,121,.5)';ctx.fillStyle='#f2d48c';ctx.beginPath();ctx.arc(moonX,moonY,mr,0,Math.PI*2);ctx.fill();ctx.shadowBlur=0;ctx.fillStyle='#06221d';ctx.beginPath();ctx.arc(moonX+mr*.42,moonY-mr*.18,mr*.93,0,Math.PI*2);ctx.fill();ctx.restore();

    // Central luminous emblem.
    const ex=W*.5+cameraX*-7,ey=H*.46+cameraY*-5,er=Math.min(W,H)*.065;
    const glow=ctx.createRadialGradient(ex,ey,2,ex,ey,er*2.8);glow.addColorStop(0,'rgba(255,224,142,.34)');glow.addColorStop(1,'rgba(255,224,142,0)');ctx.fillStyle=glow;ctx.beginPath();ctx.arc(ex,ey,er*2.8,0,Math.PI*2);ctx.fill();
    ctx.save();ctx.translate(ex,ey);ctx.strokeStyle='#e7c46e';ctx.lineWidth=2;ctx.beginPath();ctx.arc(0,0,er,0,Math.PI*2);ctx.stroke();ctx.strokeStyle='rgba(241,234,205,.85)';ctx.lineWidth=1.2;polygon(0,0,er*.72,8,Math.PI/8);ctx.stroke();ctx.fillStyle='#fff5d1';ctx.shadowBlur=22;ctx.shadowColor='rgba(255,221,132,.95)';polygon(0,0,er*.46,8,Math.PI/8);ctx.fill();ctx.restore();

    // Horizon glow.
    const hy=H*.68+cameraY*2;const hg=ctx.createRadialGradient(W*.5,hy,0,W*.5,hy,W*.48);hg.addColorStop(0,'rgba(236,188,91,.34)');hg.addColorStop(.3,'rgba(220,163,76,.10)');hg.addColorStop(1,'rgba(0,0,0,0)');ctx.fillStyle=hg;ctx.fillRect(0,hy-H*.25,W,H*.38);

    // Distant mountain layer.
    ctx.save();ctx.translate(cameraX*-5,cameraY*-2);ctx.fillStyle='#071b17';ctx.beginPath();ctx.moveTo(0,H*.79);for(let i=0;i<16;i++){const x=i*W/15;const peak=H*(.72-rand(0,.11));ctx.lineTo(x,peak);ctx.lineTo(x+W/30,H*.79)}ctx.lineTo(W,H);ctx.lineTo(0,H);ctx.closePath();ctx.fill();ctx.restore();

    // Foreground mosque + trees, strongest parallax.
    ctx.save();ctx.translate(cameraX*-15,cameraY*-6);
    ctx.fillStyle='#020e0b';ctx.beginPath();ctx.moveTo(0,H*.91);for(let i=0;i<15;i++){const x=i*W/14;const peak=H*(.76-rand(0,.08));ctx.lineTo(x,peak);ctx.lineTo(x+W/28,H*.91)}ctx.lineTo(W,H);ctx.lineTo(0,H);ctx.closePath();ctx.fill();
    const mx=W*.72,my=H*.8,mw=Math.min(W*.36,245),mh=Math.min(H*.15,150);ctx.fillStyle='#020d0b';ctx.fillRect(mx-mw/2,my-mh*.28,mw,mh*.58);ctx.beginPath();ctx.ellipse(mx,my-mh*.28,mw*.25,mh*.33,0,Math.PI,0);ctx.fill();
    for(const dx of [-mw*.38,mw*.38]){ctx.fillRect(mx+dx-4,my-mh*.78,8,mh*.62);ctx.beginPath();ctx.moveTo(mx+dx-10,my-mh*.78);ctx.lineTo(mx+dx,my-mh*.94);ctx.lineTo(mx+dx+10,my-mh*.78);ctx.closePath();ctx.fill();}
    ctx.fillStyle='#e2bb67';ctx.fillRect(mx-3,my-mh*.18,6,mh*.18);
    ctx.restore();

    // Floating gold dust, closer to camera.
    for(const p of dust){const yy=(p.y-(s*p.speed*35)%H+H)%H;const x=p.x+cameraX*-20*p.depth,y=yy+cameraY*-9*p.depth;ctx.globalAlpha=.12+.28*(.5+.5*Math.sin(s*1.2+p.phase));ctx.fillStyle='#f0cd7a';ctx.beginPath();ctx.arc(x,y,p.r,0,Math.PI*2);ctx.fill();}ctx.globalAlpha=1;

    scene.style.transform=`translate3d(${cameraX*5}px,${cameraY*5}px,0) scale(1.04)`;
    raf=requestAnimationFrame(draw);
  }

  function finish(){
    if(!running)return;running=false;cancelAnimationFrame(raf);guard.classList.add('hidden');
    setTimeout(()=>guard.remove(),560);
    window.removeEventListener('pointermove',onPointer);window.removeEventListener('resize',resize);
  }
  function ready(){
    const badge=document.getElementById('sessionBadge');
    const app=document.getElementById('appView');
    const publicView=document.getElementById('publicView');
    if(badge?.textContent?.trim()==='SECURE SESSION')return true;
    if(app&&!app.classList.contains('hidden'))return true;
    if(publicView&&!publicView.classList.contains('hidden')&&Date.now()-started>1200)return true;
    return Date.now()-started>=MAX_WAIT_MS;
  }

  resize();raf=requestAnimationFrame(draw);
  const observer=new MutationObserver(()=>{if(ready()){observer.disconnect();finish()}});
  observer.observe(document.body,{subtree:true,childList:true,characterData:true,attributes:true,attributeFilter:['class']});
  const timer=setInterval(()=>{if(ready()){clearInterval(timer);observer.disconnect();finish()}},100);
  setTimeout(()=>{clearInterval(timer);observer.disconnect();finish()},MAX_WAIT_MS+250);
})();
