/* OneMuslim — keep the selected avatar as the user's profile photo. */
(function(){
  'use strict';
  const avatarUrl=()=>{
    const p=window.profile||{};
    if(p.avatar_url)return p.avatar_url;
    if(p.avatar_package==='platinum_package'&&Number(p.xp_total||p.xp||0)>=10000)return p.avatar_gender==='female'?'/assets/avatars/platinum-female.PNG':'/assets/avatars/platinum-male.PNG';
    const c=p.avatar_config||{};
    const preset=String(p.avatar_preset||p.avatar_base||c.preset||c.base||'male-1').toLowerCase();
    const n=preset.includes('3')?'3':preset.includes('2')?'2':'1';
    if(String(p.avatar_gender||c.gender||'male').toLowerCase()==='male')return `/assets/avatar/male/male-${n}-original.jpg`;
    return '';
  };
  function sync(){
    const src=avatarUrl();if(!src)return;
    document.querySelectorAll('#composerAvatar,.mini-profile .avatar,.profile-hero .avatar,.om-member-avatar').forEach(el=>{
      if(el.tagName==='IMG')el.src=src;
      else el.innerHTML=`<img src="${src}" alt="Selected profile avatar">`;
    });
  }
  function init(){
    sync();
    setTimeout(sync,300);setTimeout(sync,1000);setTimeout(sync,2500);
    new MutationObserver(sync).observe(document.body,{childList:true,subtree:true});
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();
})();
