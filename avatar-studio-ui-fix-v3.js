/* OneMuslim AvatarStudio v3 — real regular identity choices + consistent avatar rendering. */
(function(){
  'use strict';
  const REGULAR={male:'/assets/avatar/male/male-1-original.jpg',female:'/assets/avatar/base/master.png'};
  const PLATINUM={male:'/assets/avatars/platinum-male.PNG',female:'/assets/avatars/platinum-female.PNG'};
  const studioGender=()=>document.querySelector('.om-pb-overlay .pb-gender.selected')?.dataset.gender || window.profile?.avatar_gender || 'male';
  const studioPackage=()=>document.querySelector('.om-pb-overlay .pb-package.selected')?.dataset.package || window.profile?.avatar_package || 'default';
  const avatarFor=(p={})=>{
    const system=window.OneMuslimProfileSystem;
    const derived=system?.getAvatarAsset?.(p);
    if(derived)return derived;
    const gender=p.avatar_gender==='female'?'female':'male';
    return p.avatar_package==='platinum_package' ? PLATINUM[gender] : REGULAR[gender];
  };
  function style(){
    if(document.getElementById('om-avatar-studio-v3-style'))return;
    const s=document.createElement('style');s.id='om-avatar-studio-v3-style';s.textContent=`
      .om-pb-choice.pb-gender{display:flex!important;flex-direction:column!important;align-items:center!important;justify-content:center!important;gap:8px!important;min-width:126px!important;min-height:150px!important;padding:12px!important;overflow:hidden!important}
      .om-pb-choice.pb-gender .om-identity-avatar{width:92px!important;height:92px!important;border-radius:50%!important;overflow:hidden!important;background:#edf4ef!important;border:3px solid #fff!important;box-shadow:0 6px 18px rgba(18,48,39,.14)!important;display:block!important;flex:0 0 auto!important}
      .om-pb-choice.pb-gender .om-identity-avatar img{width:100%!important;height:100%!important;object-fit:cover!important;object-position:center top!important;display:block!important}
      .om-pb-choice.pb-gender .om-identity-label{font-weight:800!important;font-size:15px!important;color:#294c40!important}
      .om-pb-avatar-photo img,.om-pb-preview-avatar img,.om-personal-avatar img{object-fit:cover!important;object-position:center top!important}
      .om-avatar-sync-img{width:100%!important;height:100%!important;object-fit:cover!important;object-position:center top!important;border-radius:50%!important;display:block!important}
      #composerAvatar.om-avatar-synced,#miniProfile .avatar.om-avatar-synced,#miniProfile .mini-avatar.om-avatar-synced,#miniProfile .profile-avatar.om-avatar-synced{overflow:hidden!important;padding:0!important}
      .om-pb-choice.pb-package .om-package-avatar{width:34px;height:34px;border-radius:50%;overflow:hidden;display:inline-block;vertical-align:middle;margin-right:7px}
      .om-pb-choice.pb-package .om-package-avatar img{width:100%;height:100%;object-fit:cover;object-position:center top;display:block}
    `;document.head.appendChild(s);
  }
  function decorateStudio(o){
    if(!o||!o.matches?.('.om-pb-overlay'))return;
    const gender=studioGender();
    o.querySelectorAll('.pb-gender').forEach(btn=>{
      const g=btn.dataset.gender==='female'?'female':'male';
      const selected=btn.classList.contains('selected');
      if(btn.dataset.omDecorated!=='1'){
        btn.innerHTML=`<span class="om-identity-avatar"><img src="${REGULAR[g]}" alt="${g} Muslim avatar"></span><span class="om-identity-label">${g==='female'?'Female':'Male'}</span>`;
        btn.dataset.omDecorated='1';
      }else{
        const img=btn.querySelector('img');if(img&&img.getAttribute('src')!==REGULAR[g])img.src=REGULAR[g];
      }
      btn.setAttribute('aria-pressed',selected?'true':'false');
    });
    const platinum=o.querySelector('.pb-package[data-package="platinum_package"]');
    if(platinum){
      const label=gender==='female'?'Platinum Female':'Platinum Male';
      const locked=platinum.disabled;
      platinum.innerHTML=`<span class="om-package-avatar"><img src="${PLATINUM[gender]}" alt="${label}"></span>${label}${locked?' 🔒':''}`;
    }
    const original=o.querySelector('.pb-package[data-package="default"]');
    if(original&&!original.querySelector('.om-package-avatar'))original.innerHTML='<span class="om-package-avatar"><img src="'+REGULAR[gender]+'" alt="Original Muslim avatar"></span>Original';
    const current=o.querySelector('#pbCurrentAvatar');
    const preview=o.querySelector('#pbPreviewAvatar');
    const src=(studioPackage()==='platinum_package'&&!o.querySelector('.pb-package[data-package="platinum_package"]')?.disabled)?PLATINUM[gender]:REGULAR[gender];
    [current,preview].forEach(host=>{if(!host)return;let img=host.querySelector('img');if(!img){host.innerHTML=`<img src="${src}" alt="Selected avatar">`;img=host.querySelector('img')}if(img&&img.src!==new URL(src,location.href).href)img.src=src;});
  }
  function setOwnAvatar(el,src){
    if(!el||!src)return;
    const existing=el.querySelector('img.om-avatar-sync-img');
    if(existing&&existing.getAttribute('src')===src)return;
    el.classList.add('om-avatar-synced');
    el.textContent='';
    const img=document.createElement('img');img.className='om-avatar-sync-img';img.src=src;img.alt='Profile photo';img.loading='eager';
    img.onerror=()=>{el.classList.remove('om-avatar-synced');el.textContent='';};
    el.appendChild(img);
  }
  function syncOwnAvatar(){
    const p=window.profile||{};const src=avatarFor(p);if(!src)return;
    const nav=document.querySelector('#appView .om-nav-mark');if(nav)setOwnAvatar(nav,src);
    const composer=document.getElementById('composerAvatar');if(composer)setOwnAvatar(composer,src);
    document.querySelectorAll('#miniProfile .avatar,#miniProfile .mini-avatar,#miniProfile .profile-avatar,[data-profile-avatar="self"]').forEach(el=>setOwnAvatar(el,src));
    const personal=document.querySelector('.om-personal-avatar');if(personal){const img=personal.querySelector('img');if(!img||img.getAttribute('src')!==src){personal.innerHTML=`<img src="${src}" alt="Selected avatar">`;}}
  }
  function scan(){style();const o=document.querySelector('.om-pb-overlay');if(o)decorateStudio(o);syncOwnAvatar();}
  function init(){
    scan();
    let queued=false;
    const observer=new MutationObserver(()=>{if(queued)return;queued=true;requestAnimationFrame(()=>{queued=false;scan()})});
    observer.observe(document.body,{childList:true,subtree:true});
    window.addEventListener('profile:updated',scan);
    setInterval(scan,1500);
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();
  window.OneMuslimAvatarStudioV3={avatarFor,scan,syncOwnAvatar};
})();
