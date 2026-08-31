/* OneMuslim approved avatar source-of-truth.
 * These are the two current regular identity avatars supplied by ElmiandCo.
 * Root-relative paths are intentional so avatars work on every page/route.
 */
(function(){
  'use strict';
  const APPROVED={
    male:'/assets/avatar/base/avatar-master-male.jpeg',
    female:'/assets/avatar/base/avatar-master-female.jpeg'
  };
  const PLATINUM={male:'/assets/avatars/platinum-male.PNG',female:'/assets/avatars/platinum-female.PNG'};
  window.OneMuslimApprovedAvatars=APPROVED;
  function currentProfile(){return window.profile||{};}
  function genderFor(p){return p?.avatar_gender==='female'?'female':'male';}
  function sourceFor(p){const g=genderFor(p);const platinum=p?.avatar_package==='platinum_package'&&Number(p?.xp_total??p?.xp??p?.rank_points??0)>=10000;return platinum?PLATINUM[g]:APPROVED[g];}
  function putImage(host,src,alt){
    if(!host||!src)return;
    const old=host.querySelector('img');
    if(old&&old.getAttribute('src')===src)return;
    host.innerHTML='';
    const img=document.createElement('img');
    img.src=src;img.alt=alt||'Selected avatar';img.loading='eager';
    host.appendChild(img);
  }
  function sync(){
    const p=currentProfile(),src=sourceFor(p),g=genderFor(p);
    document.querySelectorAll('#composerAvatar,#miniProfile .avatar,#miniProfile .mini-avatar,#miniProfile .profile-avatar,[data-profile-avatar="self"],.om-personal-avatar').forEach(el=>{
      putImage(el,src,'Selected avatar');el.classList.add('om-avatar-synced');
    });
    document.querySelectorAll('.om-pb-current-avatar,.om-pb-preview-avatar').forEach(el=>putImage(el,src,g==='female'?'Female Muslim avatar':'Male Muslim avatar'));
  }
  function decorateEditor(){
    const overlay=document.querySelector('.om-pb-overlay');if(!overlay)return;
    const p=currentProfile(),g=genderFor(p),src=sourceFor(p);
    overlay.querySelectorAll('.om-pb-choice.pb-gender').forEach(btn=>{
      const bg=btn.dataset.gender==='female'?'female':'male';
      putImage(btn.querySelector('.om-identity-avatar'),APPROVED[bg],bg==='female'?'Female Muslim avatar':'Male Muslim avatar');
      const label=btn.querySelector('.om-identity-label');if(label)label.textContent=bg==='female'?'Female':'Male';
    });
    overlay.querySelectorAll('.om-pb-choice.pb-package').forEach(btn=>{
      const isPlat=btn.dataset.package==='platinum_package';
      const avatar=btn.querySelector('.om-package-avatar');
      if(avatar)putImage(avatar,isPlat?PLATINUM[g]:APPROVED[g],isPlat?'Platinum avatar':'Original Muslim avatar');
    });
    putImage(overlay.querySelector('#pbCurrentAvatar'),src,g==='female'?'Female Muslim avatar':'Male Muslim avatar');
    putImage(overlay.querySelector('#pbPreviewAvatar'),src,g==='female'?'Female Muslim avatar':'Male Muslim avatar');
  }
  function patchBuilder(){
    const builder=window.OneMuslimProfileBuilder;
    if(!builder||builder.__approvedAvatarPatch)return false;
    builder.__approvedAvatarPatch=true;
    const originalOpen=builder.open;
    builder.open=function(){
      const result=originalOpen.apply(this,arguments);
      [0,50,150,400].forEach(ms=>setTimeout(()=>{decorateEditor();sync();},ms));
      return result;
    };
    return true;
  }
  function repairSavedAvatar(){
    const p=currentProfile();if(!p.avatar_gender)return;
    const desired=sourceFor(p);
    if(p.avatar_url===desired)return;
    window.profile={...p,avatar_url:desired};
    const sb=window.OneMuslimSupabaseClient?.getClient?.()||window.supabase?.createClient?.(window.APP_CONFIG?.SUPABASE_URL,window.APP_CONFIG?.SUPABASE_ANON_KEY);
    const userPromise=sb?.auth?.getUser?.();
    if(userPromise)userPromise.then(({data})=>{if(data?.user)sb.from('profiles').update({avatar_url:desired}).eq('id',data.user.id).then(()=>{});}).catch(()=>{});
  }
  function boot(){patchBuilder();decorateEditor();sync();repairSavedAvatar();}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot);else boot();
  [250,750,1500,3000].forEach(ms=>setTimeout(boot,ms));
  new MutationObserver(()=>{decorateEditor();sync();}).observe(document.body,{childList:true,subtree:true});
  window.addEventListener('profile:updated',()=>{setTimeout(()=>{repairSavedAvatar();boot();},0);});
  window.OneMuslimApprovedAvatarSrc=sourceFor;
  window.OneMuslimSyncApprovedAvatar=sync;
})();
