/* OneMuslim approved avatar source-of-truth.
 * These are the two current regular identity avatars supplied by ElmiandCo.
 */
(function(){
  'use strict';
  const APPROVED={
    male:'avatar-master-male2.jpeg',
    female:'avatar-master-female.jpeg'
  };
  window.OneMuslimApprovedAvatars=APPROVED;
  function currentProfile(){return window.profile||{};}
  function sourceFor(p){return APPROVED[p?.avatar_gender==='female'?'female':'male'];}
  function sync(){
    const p=currentProfile(),src=sourceFor(p);
    document.querySelectorAll('#composerAvatar,#miniProfile .avatar,#miniProfile .mini-avatar,#miniProfile .profile-avatar,[data-profile-avatar="self"],.om-personal-avatar').forEach(el=>{
      if(!el)return;
      const img=el.querySelector('img');
      if(img){img.src=src;img.alt='Selected avatar';}
    });
  }
  window.OneMuslimApprovedAvatarSrc=sourceFor;
  window.OneMuslimSyncApprovedAvatar=sync;
  function patchBuilder(){
    const builder=window.OneMuslimProfileBuilder;
    if(!builder||builder.__approvedAvatarPatch)return false;
    builder.__approvedAvatarPatch=true;
    const originalOpen=builder.open;
    builder.open=function(){
      const result=originalOpen.apply(this,arguments);
      setTimeout(function(){
        document.querySelectorAll('.om-pb-choice.pb-gender[data-gender="male"] img').forEach(i=>i.src=APPROVED.male);
        document.querySelectorAll('.om-pb-choice.pb-gender[data-gender="female"] img').forEach(i=>i.src=APPROVED.female);
        document.querySelectorAll('.om-pb-current-avatar img,.om-pb-preview-avatar img').forEach(i=>i.src=sourceFor(currentProfile()));
      },0);
      return result;
    };
    return true;
  }
  function boot(){patchBuilder();sync();}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot);else boot();
  [250,750,1500,3000].forEach(ms=>setTimeout(boot,ms));
})();
