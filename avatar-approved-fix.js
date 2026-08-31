/* OneMuslim avatar hard-stop: the two approved master identity images are the only regular avatars. */
(function(){
  'use strict';
  const ROOT='/assets/avatar/base/';
  const APPROVED={
    male:ROOT+'avatar-master-male.jpeg',
    female:ROOT+'avatar-master-female.jpeg'
  };
  const OLD=[
    '/assets/avatar/male/male-1-original.jpg',
    'assets/avatar/male/male-1-original.jpg',
    '/assets/avatar/base/master.png',
    'assets/avatar/base/master.png'
  ];
  const PLATINUM={male:'/assets/avatars/platinum-male.PNG',female:'/assets/avatars/platinum-female.PNG'};
  const getProfile=()=>window.profile||{};
  const gender=()=>getProfile().avatar_gender==='female'?'female':'male';
  const approved=()=>APPROVED[gender()];
  const isOld=src=>!!src&&OLD.some(x=>String(src).includes(x));
  const setImg=(img,src,alt)=>{if(!img||!src)return;img.src=src;img.alt=alt||'Profile avatar';};

  function repairEditor(){
    const overlay=document.querySelector('.om-pb-overlay');
    if(!overlay)return;
    const g=gender();

    /* The gender cards must ALWAYS show the two approved master images. */
    overlay.querySelectorAll('.om-pb-choice.pb-gender').forEach(btn=>{
      const bg=btn.dataset.gender==='female'?'female':'male';
      const img=btn.querySelector('.om-identity-avatar img');
      if(img)setImg(img,APPROVED[bg],bg==='female'?'Female Muslim avatar':'Male Muslim avatar');
    });

    /* Current/preview avatar must use the selected standard master image. */
    ['#pbCurrentAvatar','#pbPreviewAvatar'].forEach(sel=>{
      const host=overlay.querySelector(sel);
      if(!host)return;
      let img=host.querySelector('img');
      if(!img){img=document.createElement('img');host.innerHTML='';host.appendChild(img);}
      setImg(img,approved(),g==='female'?'Female Muslim avatar':'Male Muslim avatar');
    });

    /* Original finish is the approved master; Platinum remains separate. */
    const original=overlay.querySelector('.om-pb-choice.pb-package[data-package="default"] .om-package-avatar img');
    if(original)setImg(original,approved(),g==='female'?'Original female avatar':'Original male avatar');

    /* Never allow the deleted legacy image to remain anywhere in the editor. */
    overlay.querySelectorAll('img').forEach(img=>{
      if(isOld(img.getAttribute('src')))setImg(img,approved(),g==='female'?'Female Muslim avatar':'Male Muslim avatar');
    });
  }

  function repairAll(){
    const g=gender(),src=approved();
    document.querySelectorAll('img').forEach(img=>{
      if(isOld(img.getAttribute('src')))setImg(img,src,g==='female'?'Female Muslim avatar':'Male Muslim avatar');
    });
    repairEditor();
  }

  async function repairSavedProfile(){
    const p=getProfile();
    if(!p||!p.avatar_gender)return;
    const desired=approved();
    if(p.avatar_url!==desired)window.profile={...p,avatar_url:desired};
    try{
      const sb=window.OneMuslimSupabaseClient?.getClient?.();
      const auth=await sb?.auth?.getUser?.();
      const id=auth?.data?.user?.id;
      if(sb&&id&&p.avatar_url!==desired){
        await sb.from('profiles').update({avatar_url:desired}).eq('id',id);
      }
    }catch(_e){}
  }

  function patchBuilder(){
    const b=window.OneMuslimProfileBuilder;
    if(!b||b.__approvedMasterHardStop)return;
    b.__approvedMasterHardStop=true;
    if(typeof b.open==='function'){
      const originalOpen=b.open;
      b.open=function(){
        const result=originalOpen.apply(this,arguments);
        [0,50,150,400,1000].forEach(ms=>setTimeout(repairAll,ms));
        return result;
      };
    }
  }

  function boot(){patchBuilder();repairAll();repairSavedProfile();}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot);else boot();
  [100,500,1500,3000].forEach(ms=>setTimeout(boot,ms));
  new MutationObserver(()=>repairAll()).observe(document.body,{childList:true,subtree:true});
  window.addEventListener('profile:updated',()=>setTimeout(boot,0));
  window.OneMuslimApprovedAvatars=APPROVED;
})();
