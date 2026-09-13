/* OneMuslim Avatar Expressions — contextual speech for login and profile saves. */
(function(){
  'use strict';
  const esc=s=>String(s??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[m]));
  let timer=null, lastKey='';

  function styles(){
    if(document.getElementById('om-avatar-expression-css'))return;
    const s=document.createElement('style');
    s.id='om-avatar-expression-css';
    s.textContent=`
      #om-avatar-expression{position:fixed;z-index:12000;max-width:min(330px,calc(100vw - 32px));padding:13px 17px;border:1px solid #d9c27b;border-radius:18px;background:#fffdf8;color:#1f4f40;box-shadow:0 14px 38px rgba(18,48,39,.2);font:700 14px/1.45 Arial,sans-serif;opacity:0;transform:translateY(7px) scale(.97);transition:opacity .2s ease,transform .2s ease;pointer-events:none}
      #om-avatar-expression.open{opacity:1;transform:translateY(0) scale(1)}
      #om-avatar-expression:after{content:"";position:absolute;right:24px;bottom:-8px;width:14px;height:14px;background:#fffdf8;border-right:1px solid #d9c27b;border-bottom:1px solid #d9c27b;transform:rotate(45deg)}
      #om-avatar-expression .om-expression-emoji{display:inline-block;margin-right:7px;font-size:16px}
      @media(max-width:600px){#om-avatar-expression{font-size:13px;padding:11px 14px;max-width:calc(100vw - 24px)}#om-avatar-expression:after{right:18px}}
    `;
    document.head.appendChild(s);
  }

  function anchor(){
    const avatar=document.getElementById('om-fpn-avatar');
    if(!avatar)return null;
    const r=avatar.getBoundingClientRect();
    const box=document.getElementById('om-avatar-expression');
    if(!box)return null;
    box.style.left='auto';box.style.right=Math.max(12,innerWidth-r.right)+'px';
    box.style.top=Math.max(12,r.top-box.offsetHeight-12)+'px';
    return avatar;
  }

  function express(message,emoji='✨',key=''){
    if(!message)return;
    styles();
    if(key&&key===lastKey)return;
    lastKey=key||message;
    let box=document.getElementById('om-avatar-expression');
    if(!box){box=document.createElement('div');box.id='om-avatar-expression';document.body.appendChild(box)}
    box.innerHTML=`<span class="om-expression-emoji">${emoji}</span>${esc(message)}`;
    const tryAnchor=()=>{
      if(!anchor())return false;
      requestAnimationFrame(()=>box.classList.add('open'));
      return true;
    };
    if(!tryAnchor()){
      let tries=0;
      const wait=setInterval(()=>{tries++;if(tryAnchor()||tries>30)clearInterval(wait)},100);
    }
    clearTimeout(timer);
    timer=setTimeout(()=>{box.classList.remove('open');setTimeout(()=>box.remove(),220)},5000);
  }

  function username(){
    const p=window.profile||{};
    return p.username||p.display_name||p.first_name||'friend';
  }

  window.OneMuslimAvatar={
    express:(message,options={})=>express(message,options.emoji||'✨',options.key||''),
    welcome:()=>express(`Asalamu-alykum ${username()}`,'🕌','login:'+username()),
    profileSaved:()=>express("Hey, let's give your changes a few moments to catch up, Insha-Allah",'✨','profile-saved')
  };

  function bindAuth(){
    const client=window.OneMuslimSupabaseClient?.getClient?.();
    if(!client?.auth?.onAuthStateChange)return;
    client.auth.onAuthStateChange((event,session)=>{
      if(event!=='SIGNED_IN'||!session?.user)return;
      let tries=0;
      const wait=setInterval(()=>{
        tries++;
        if(window.profile?.username||window.profile?.display_name||tries>30){
          clearInterval(wait);
          window.OneMuslimAvatar.welcome();
        }
      },100);
    });
  }

  function init(){
    styles();
    window.addEventListener('profile:updated',()=>window.OneMuslimAvatar.profileSaved());
    window.addEventListener('resize',()=>{const box=document.getElementById('om-avatar-expression');if(box?.classList.contains('open'))anchor()});
    bindAuth();
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();
})();
