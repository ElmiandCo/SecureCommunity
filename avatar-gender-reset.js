/* OneMuslim AvatarStudio — gender selection reset. Regular avatars only. */
(function(){
  'use strict';
  const REGULAR={
    male:['assets/avatar/male/male-1-original.jpg','assets/avatar/male/male-2-original.jpg','assets/avatar/male/male-3-original.jpg'],
    female:null
  };
  const PLACEHOLDER='assets/avatar/base/master.png';
  function resetToGender(button){
    const overlay=button.closest('.om-pb-overlay');
    if(!overlay)return;
    const gender=button.dataset.gender==='female'?'female':'male';
    const p=window.profile||{};
    // Gender selection is a base identity choice. It must clear premium/custom layers.
    const regular=gender==='male'?REGULAR.male[0]:REGULAR.female;
    const draft=window.__omAvatarStudioDraft;
    if(draft){
      draft.avatar_gender=gender;
      draft.avatar_package='default';
      draft.avatar_url=regular||PLACEHOLDER;
      draft.avatar_config=null;
      draft.avatar_mask=null;
      draft.avatar_headwear=null;
      draft.avatar_shirt_color=null;
      draft.avatar_background_color=null;
      draft.avatar_eye_glow=null;
    }
    // Persist the reset through the existing save flow; the builder's save handler reads these fields.
    const current=overlay.querySelector('#pbCurrentAvatar');
    const preview=overlay.querySelector('#pbPreviewAvatar');
    const src=regular||PLACEHOLDER;
    const html=`<img src="${src}" alt="${gender} Muslim avatar">`;
    [current,preview].forEach(el=>{if(el)el.innerHTML=html;});
    overlay.querySelectorAll('.pb-gender').forEach(x=>x.classList.toggle('selected',x===button));
    overlay.querySelectorAll('.pb-package').forEach(x=>x.classList.toggle('selected',x.dataset.package==='default'));
    const save=overlay.querySelector('#pbSave');
    if(save)save.dataset.avatarGenderReset='1';
    overlay.dispatchEvent(new CustomEvent('onemuslim:avatar-gender-reset',{detail:{gender,avatarUrl:regular||PLACEHOLDER}}));
  }
  // Capture the builder's existing gender click so its platinum-selection handler cannot run.
  document.addEventListener('click',function(e){
    const button=e.target.closest?.('.om-pb-overlay .pb-gender');
    if(!button)return;
    e.preventDefault();
    e.stopImmediatePropagation();
    resetToGender(button);
  },true);
  window.OneMuslimAvatarGenderReset={resetToGender,REGULAR};
})();