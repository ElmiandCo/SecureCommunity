/* OneMuslim profile page UI bridge.
   Connects the existing Profile Builder to the rendered My Profile card
   without replacing the builder-owned click handler. */
(function(){
  'use strict';
  const style=document.createElement('style');
  style.id='om-profile-ui-fix-css';
  style.textContent=`
    #profilePanel.profile-panel{background:#fff!important;border:1px solid #e5e1d7!important;border-radius:28px!important;padding:28px!important;box-shadow:0 10px 40px rgba(18,48,39,.07)!important;}
    #profilePanel .profile-hero{display:flex;align-items:center;gap:18px;flex-wrap:wrap;}
    #profilePanel .profile-hero .avatar{width:82px;height:82px;flex:0 0 82px;overflow:hidden;display:grid;place-items:center;}
    #profilePanel .profile-hero .avatar img{width:100%;height:100%;object-fit:contain;display:block;}
    #profilePanel #editProfile{margin-top:22px;min-height:48px;padding:0 22px;font-weight:800;}
    .om-profile-avatar-img{width:100%;height:100%;object-fit:cover;display:block;border-radius:inherit;}
  `;
  document.head.appendChild(style);
  function avatarUrl(){
    const p=window.profile||{};
    if(p.avatar_url) return p.avatar_url;
    const sys=window.OneMuslimProfileSystem;
    return sys?.getAvatarAsset?.(p)||null;
  }
  function repairProfilePanel(){
    const panel=document.getElementById('profilePanel');
    if(!panel)return;
    panel.classList.add('profile-panel');
    const edit=panel.querySelector('#editProfile');
    if(edit) edit.textContent='Customize Avatar & Profile';
    const url=avatarUrl();
    const heroAvatar=panel.querySelector('.profile-hero .avatar');
    if(url&&heroAvatar&&!heroAvatar.querySelector('img')){
      heroAvatar.textContent='';
      const img=document.createElement('img');
      img.src=url;img.alt='Profile avatar';img.className='om-profile-avatar-img';
      heroAvatar.appendChild(img);
    }
  }
  function refreshOtherAvatars(){
    const url=avatarUrl();
    if(!url)return;
    ['#miniProfile .avatar','#composerAvatar'].forEach(sel=>{
      const el=document.querySelector(sel);
      if(!el||el.querySelector('img'))return;
      el.textContent='';
      const img=document.createElement('img');
      img.src=url;img.alt='Profile avatar';img.className='om-profile-avatar-img';
      el.appendChild(img);
    });
  }
  function init(){
    repairProfilePanel();
    refreshOtherAvatars();
    new MutationObserver(()=>{repairProfilePanel();refreshOtherAvatars()}).observe(document.body,{childList:true,subtree:true});
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();
})();
