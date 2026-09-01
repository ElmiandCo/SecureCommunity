/* OneMuslim avatar hard-stop: the two approved master identity images are the only regular avatars. */
(function(){
  'use strict';
  const ROOT='/assets/avatar/base/';
  const APPROVED={male:ROOT+'avatar-master-male.jpeg',female:ROOT+'avatar-master-female.jpeg'};
  const OLD=['/assets/avatar/male/male-1-original.jpg','assets/avatar/male/male-1-original.jpg','/assets/avatar/base/master.png','assets/avatar/base/master.png'];
  const PLATINUM={male:'/assets/avatars/platinum-male.PNG',female:'/assets/avatars/platinum-female.PNG'};
  const getProfile=()=>window.profile||{};
  const gender=()=>getProfile().avatar_gender==='female'?'female':'male';
  const approved=()=>APPROVED[gender()];
  const isOld=src=>!!src&&OLD.some(x=>String(src).includes(x));
  const setImg=(img,src,alt)=>{if(!img||!src)return;img.src=src;img.alt=alt||'Profile avatar';};
  const avatarForProfile=p=>window.OneMuslimProfileSystem?.getAvatarAsset?.(p)||((p?.avatar_package==='platinum_package')?PLATINUM[p?.avatar_gender==='female'?'female':'male']:(p?.avatar_gender==='female'?APPROVED.female:APPROVED.male));

  function repairEditor(){
    const overlay=document.querySelector('.om-pb-overlay');
    if(!overlay)return;
    const g=gender();
    overlay.querySelectorAll('.om-pb-choice.pb-gender').forEach(btn=>{
      const bg=btn.dataset.gender==='female'?'female':'male';
      const img=btn.querySelector('.om-identity-avatar img');
      if(img)setImg(img,APPROVED[bg],bg==='female'?'Female Muslim avatar':'Male Muslim avatar');
    });
    const current=overlay.querySelector('#pbCurrentAvatar img');
    const preview=overlay.querySelector('#pbPreviewAvatar img');
    if(current&&isOld(current.getAttribute('src')))setImg(current,approved(),g==='female'?'Female Muslim avatar':'Male Muslim avatar');
    if(preview&&isOld(preview.getAttribute('src')))setImg(preview,approved(),g==='female'?'Female Muslim avatar':'Male Muslim avatar');
    const original=overlay.querySelector('.om-pb-choice.pb-package[data-package="default"] .om-package-avatar img');
    if(original)setImg(original,approved(),g==='female'?'Original female avatar':'Original male avatar');
    const platinum=overlay.querySelector('.om-pb-choice.pb-package[data-package="platinum_package"] .om-package-avatar img');
    if(platinum)setImg(platinum,PLATINUM[g],g==='female'?'Platinum female avatar':'Platinum male avatar');
    overlay.querySelectorAll('img').forEach(img=>{if(isOld(img.getAttribute('src')))setImg(img,approved(),g==='female'?'Female Muslim avatar':'Male Muslim avatar');});
  }

  function repairAll(){
    const g=gender(),src=approved();
    document.querySelectorAll('img').forEach(img=>{if(isOld(img.getAttribute('src')))setImg(img,src,g==='female'?'Female Muslim avatar':'Male Muslim avatar');});
    repairEditor();
    schedulePostAvatarSync();
  }

  async function repairSavedProfile(){
    const p=getProfile();
    if(!p||!p.avatar_gender)return;
    const desired=avatarForProfile(p);
    if(p.avatar_url!==desired)window.profile={...p,avatar_url:desired};
    try{
      const sb=window.OneMuslimSupabaseClient?.getClient?.();
      const auth=await sb?.auth?.getUser?.();
      const id=auth?.data?.user?.id;
      if(sb&&id&&p.avatar_url!==desired){
        await sb.from('profiles').update({avatar_url:desired,avatar_config:{gender:p.avatar_gender,package:p.avatar_package||'default'},avatar_updated_at:new Date().toISOString()}).eq('id',id);
      }
    }catch(_e){}
  }

  let postAvatarTimer=0;
  function schedulePostAvatarSync(){clearTimeout(postAvatarTimer);postAvatarTimer=setTimeout(syncPostAvatars,200);}
  async function syncPostAvatars(){
    const sb=window.OneMuslimSupabaseClient?.getClient?.();
    if(!sb)return;
    const posts=[...document.querySelectorAll('.post[data-post]')];
    if(!posts.length)return;
    const usernames=[...new Set(posts.map(post=>{const text=post.querySelector('.post-author small')?.textContent||'';return (text.match(/@([A-Za-z0-9_.-]+)/)||[])[1]||'';}).filter(Boolean))];
    if(!usernames.length)return;
    try{
      const {data,error}=await sb.from('profiles').select('username,avatar_url,avatar_config,avatar_gender,avatar_package,avatar_updated_at,xp_total,profile_title,custom_photo,unlocked_packages').in('username',usernames);
      if(error)throw error;
      const byUsername=new Map((data||[]).map(p=>[String(p.username||'').toLowerCase(),p]));
      posts.forEach(post=>{
        const text=post.querySelector('.post-author small')?.textContent||'';
        const username=(text.match(/@([A-Za-z0-9_.-]+)/)||[])[1]?.toLowerCase();
        const p=byUsername.get(username);if(!p)return;
        const src=avatarForProfile(p),host=post.querySelector('.post-head .avatar');
        if(!host||!src)return;
        let img=host.querySelector('img.om-post-avatar');
        if(img&&img.getAttribute('src')===src)return;
        host.textContent='';host.style.overflow='hidden';
        img=document.createElement('img');img.className='om-post-avatar';img.src=src;img.alt=`${p.username||'Member'} profile avatar`;img.loading='lazy';img.style.cssText='width:100%;height:100%;object-fit:cover;object-position:center top;display:block';host.appendChild(img);
      });
    }catch(_e){}
  }

  function patchBuilder(){
    const b=window.OneMuslimProfileBuilder;
    if(!b||b.__approvedMasterHardStop)return;
    b.__approvedMasterHardStop=true;
    if(typeof b.open==='function'){
      const originalOpen=b.open;
      b.open=function(){const result=originalOpen.apply(this,arguments);[0,50,150,400,1000].forEach(ms=>setTimeout(repairAll,ms));return result;};
    }
  }
  function boot(){patchBuilder();repairAll();repairSavedProfile();}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot);else boot();
  [100,500,1500,3000].forEach(ms=>setTimeout(boot,ms));
  new MutationObserver(()=>repairAll()).observe(document.body,{childList:true,subtree:true});
  window.addEventListener('profile:updated',()=>setTimeout(boot,0));
  window.OneMuslimApprovedAvatars=APPROVED;
})();
