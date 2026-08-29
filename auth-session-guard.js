/* OneMuslim — secure-session loading experience.
   Lightweight looping canvas animation keeps the screen branded while Supabase restores the session.
   It stops immediately when the existing auth bootstrap finishes. */
(function(){
  'use strict';

  const MAX_WAIT_MS = 8000;
  const started = Date.now();

  const style = document.createElement('style');
  style.textContent = `
    #authBootGuard{position:fixed;inset:0;z-index:2147483646;display:flex;align-items:center;justify-content:center;overflow:hidden;background:#fbf8f1;color:#1f5b49;opacity:1;transition:opacity .32s ease;font-family:system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif}
    #authBootGuard.hidden{opacity:0;pointer-events:none}
    #authBootGuard .om-loader-scene{position:relative;width:min(82vw,360px);height:260px;display:flex;align-items:center;justify-content:center}
    #authBootGuard canvas{position:absolute;inset:0;width:100%;height:100%}
    #authBootGuard .om-loader-copy{position:relative;z-index:2;text-align:center;transform:translateY(12px)}
    #authBootGuard .om-loader-mark{width:64px;height:64px;margin:0 auto 16px;border:2px solid #c89d3c;border-radius:50%;display:grid;place-items:center;background:rgba(255,255,255,.72);box-shadow:0 8px 32px rgba(200,157,60,.2);color:#1f5b49;font-size:29px;line-height:1}
    #authBootGuard .om-loader-title{margin:0;font-family:Georgia,"Times New Roman",serif;font-size:27px;font-weight:700;letter-spacing:.01em;color:#1f5b49}
    #authBootGuard .om-loader-status{margin:8px 0 0;color:#718078;font-size:13px;letter-spacing:.04em}
    #authBootGuard .om-loader-dots:after{content:"";display:inline-block;width:18px;text-align:left;animation:omLoaderDots 1.35s steps(4,end) infinite}
    @keyframes omLoaderDots{0%{content:""}25%{content:"."}50%{content:".."}75%{content:"..."}100%{content:""}}
    @media(prefers-reduced-motion:reduce){#authBootGuard canvas{display:none}#authBootGuard .om-loader-dots:after{animation:none;content:"..."}}
  `;
  document.head.appendChild(style);

  const guard = document.createElement('div');
  guard.id = 'authBootGuard';
  guard.setAttribute('aria-live','polite');
  guard.innerHTML = `
    <div class="om-loader-scene" aria-label="Loading OneMuslim">
      <canvas aria-hidden="true"></canvas>
      <div class="om-loader-copy">
        <div class="om-loader-mark">✦</div>
        <h1 class="om-loader-title">OneMuslim</h1>
        <p class="om-loader-status">Restoring secure session<span class="om-loader-dots"></span></p>
      </div>
    </div>`;
  document.body.appendChild(guard);

  const canvas = guard.querySelector('canvas');
  const ctx = canvas.getContext('2d');
  let raf = 0;
  let running = true;

  function resize(){
    const rect = canvas.getBoundingClientRect();
    const dpr = Math.min(window.devicePixelRatio || 1,2);
    canvas.width = Math.max(1,Math.round(rect.width*dpr));
    canvas.height = Math.max(1,Math.round(rect.height*dpr));
    ctx.setTransform(dpr,0,0,dpr,0,0);
  }

  function draw(time){
    if(!running) return;
    const w = canvas.clientWidth;
    const h = canvas.clientHeight;
    const cx = w/2;
    const cy = h/2;
    const pulse = (Math.sin(time/650)+1)/2;
    const rotation = time/2600;
    ctx.clearRect(0,0,w,h);

    const glow = ctx.createRadialGradient(cx,cy,18,cx,cy,125);
    glow.addColorStop(0,'rgba(200,157,60,.13)');
    glow.addColorStop(1,'rgba(200,157,60,0)');
    ctx.fillStyle = glow;
    ctx.fillRect(0,0,w,h);

    ctx.save();
    ctx.translate(cx,cy);
    ctx.rotate(rotation);
    ctx.lineWidth = 1.5;
    ctx.strokeStyle = 'rgba(31,91,73,.20)';
    ctx.beginPath();
    for(let i=0;i<8;i++){
      const a=(Math.PI*2*i)/8;
      const r=82+pulse*5;
      const x=Math.cos(a)*r;
      const y=Math.sin(a)*r;
      if(i===0) ctx.moveTo(x,y); else ctx.lineTo(x,y);
    }
    ctx.closePath();
    ctx.stroke();

    ctx.strokeStyle='rgba(200,157,60,.46)';
    ctx.lineWidth=2;
    ctx.beginPath();
    ctx.arc(0,0,91+pulse*4,-Math.PI/2,Math.PI*1.35);
    ctx.stroke();
    ctx.restore();
    raf=requestAnimationFrame(draw);
  }

  function finish(){
    if(!running) return;
    running=false;
    cancelAnimationFrame(raf);
    guard.classList.add('hidden');
    setTimeout(()=>guard.remove(),360);
  }

  function check(){
    const badge=document.getElementById('sessionBadge');
    const publicView=document.getElementById('publicView');
    const appView=document.getElementById('appView');
    if(badge?.textContent==='SECURE SESSION' || (!publicView?.classList.contains('hidden') && !appView?.classList.contains('hidden'))){
      finish();
      return true;
    }
    if(Date.now()-started>=MAX_WAIT_MS){
      finish();
      return true;
    }
    return false;
  }

  resize();
  window.addEventListener('resize',resize,{passive:true});
  if(!window.matchMedia('(prefers-reduced-motion: reduce)').matches) raf=requestAnimationFrame(draw);

  const observer=new MutationObserver(check);
  observer.observe(document.body,{subtree:true,childList:true,characterData:true,attributes:true,attributeFilter:['class']});
  const timer=setInterval(()=>{
    if(check()){
      clearInterval(timer);
      observer.disconnect();
      window.removeEventListener('resize',resize);
    }
  },100);
  setTimeout(()=>{
    clearInterval(timer);
    observer.disconnect();
    window.removeEventListener('resize',resize);
    finish();
  },MAX_WAIT_MS+250);
})();
