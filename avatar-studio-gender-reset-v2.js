/* OneMuslim AvatarStudio — regular gender identity reset. */
(function(){
  'use strict';
  const REGULAR={male:'assets/avatar/male/male-1-original.jpg',female:null};
  const FEMALE_PLACEHOLDER='assets/avatar/base/master.png';
  const client=()=>window.OneMuslimSupabaseClient?.getClient?.()||window.supabase?.createClient?.(window.APP_CONFIG?.SUPABASE_URL,window.APP_CONFIG?.SUPABASE_ANON_KEY);
  const esc=s=>String(s??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[m]));
  async function safeUpdate(sb,id,payload){
    let work={...payload};
    for(let i=0;i<20;i++){
      const r=await sb.from('profiles').update(work).eq('id',id).select().single();
      if(!r.error)return r.data;
      const m=String(r.error.message||'').match(/Could not find the ['"]([^'"]+)['"] column of ['"]profiles['"] in the schema cache/i);
      if(!m||!(m[1] in work))throw r.error;
      delete work[m[1]];
    }
    throw new Error('Profile could not be saved because the database schema rejected the update.');
  }
  function selectedRegular(g){return g==='female'?FEMALE_PLACEHOLDER:REGULAR.male;}
  function resetVisual(overlay,gender){
    const src=selectedRegular(gender);
    const html=`<img src="${src}" alt="${gender} Muslim avatar">`;
    [overlay.querySelector('#pbCurrentAvatar'),overlay.querySelector('#pbPreviewAvatar')].forEach(el=>{if(el)el.innerHTML=html;});
    overlay.querySelectorAll('.pb-gender').forEach(x=>x.classList.toggle('selected',x.dataset.gender===gender));
    overlay.querySelectorAll('.pb-package').forEach(x=>x.classList.toggle('selected',x.dataset.package==='default'));
    const note=overlay.querySelector('.om-pb-note');if(note)note.textContent='Original Muslim avatar selected. Premium customization has been reset.';
  }
  function bind(){
    document.addEventListener('click',async function(e){
      const genderButton=e.target.closest?.('.om-pb-overlay .pb-gender');
      if(genderButton){
        e.preventDefault();e.stopImmediatePropagation();
        const overlay=genderButton.closest('.om-pb-overlay');
        overlay.dataset.omGender=genderButton.dataset.gender;
        resetVisual(overlay,genderButton.dataset.gender);
        return;
      }
      const save=e.target.closest?.('.om-pb-overlay #pbSave');
      if(!save)return;
      const overlay=save.closest('.om-pb-overlay');
      const gender=overlay.dataset.omGender;
      if(!gender)return;
      e.preventDefault();e.stopImmediatePropagation();
      if(save.dataset.busy==='1')return;save.dataset.busy='1';save.textContent='Saving…';save.disabled=true;
      try{
        const sb=client();if(!sb)throw new Error('Secure profile service is unavailable.');
        const auth=await sb.auth.getUser();const user=auth?.data?.user;if(!user)throw new Error('Your session expired. Please sign in again.');
        const val=id=>overlay.querySelector(id)?.value?.trim?.()||'';
        const username=val('#pfUser').toLowerCase();
        if(!/^[a-z0-9_.-]{3,30}$/.test(username))throw new Error('Username must be 3–30 characters and use letters, numbers, dots, underscores, or hyphens.');
        const avatar=selectedRegular(gender);
        const payload={display_name:val('#pfDisplay'),username,first_name:val('#pfFirst'),last_name:val('#pfLast'),bio:val('#pfBio'),location:val('#pfLocation'),city:val('#pfCity'),state:val('#pfState'),country:val('#pfCountry'),gender:overlay.querySelector('#pfGender')?.value||'',website:val('#pfWebsite'),group_team:overlay.querySelector('#pbGroup')?.value||'',profile_visibility:overlay.querySelector('#pbPrivacy')?.value||'public',avatar_url:avatar,avatar_gender:gender,avatar_package:'default',avatar_config:null,profile_background:(window.profile||{}).profile_background||'default',profile_accent:(window.profile||{}).profile_accent||'emerald'};
        const data=await safeUpdate(sb,user.id,payload);
        window.profile={...(window.profile||{}),...data,...payload};
        try{const st=JSON.parse(localStorage.getItem('onemuslim_platform_v1')||'{}');st.profile={...(st.profile||{}),...window.profile};localStorage.setItem('onemuslim_platform_v1',JSON.stringify(st));}catch{}
        window.OneMuslimPlatform?.refreshFloat?.();window.renderProfile?.();window.refreshProfile?.();
        window.toast?.('Profile saved with your regular avatar.');
        overlay.remove();
      }catch(err){
        save.dataset.busy='0';save.disabled=false;save.textContent='Save changes';window.toast?.(err.message||'Could not save profile.');
      }
    },true);
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',bind);else bind();
})();