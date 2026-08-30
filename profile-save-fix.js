/* OneMuslim Profile Save Fix v1
 * Owns the Save button persistence path so the unified profile editor cannot
 * silently fail because of a schema mismatch or an uncaught async exception.
 */
(function(){
  'use strict';

  const getClient=()=>window.OneMuslimSupabaseClient?.getClient?.()||window.supabase?.createClient?.(window.APP_CONFIG?.SUPABASE_URL,window.APP_CONFIG?.SUPABASE_ANON_KEY);
  const val=(root,id)=>root.querySelector('#'+id)?.value?.trim?.()??'';
  const toast=(message)=>{if(typeof window.toast==='function')window.toast(message);else console.warn(message);};

  function readDraft(root){
    const current=window.profile||{};
    return {
      display_name:val(root,'pfDisplay'),
      username:val(root,'pfUser').toLowerCase(),
      first_name:val(root,'pfFirst'),
      last_name:val(root,'pfLast'),
      bio:val(root,'pfBio'),
      location:val(root,'pfLocation'),
      city:val(root,'pfCity'),
      state:val(root,'pfState'),
      country:val(root,'pfCountry'),
      gender:val(root,'pfGender'),
      website:val(root,'pfWebsite'),
      group_team:val(root,'pbGroup')==='__create__'?'':val(root,'pbGroup'),
      profile_visibility:val(root,'pbPrivacy')||'public',
      avatar_url:current.avatar_url||current.avatar_asset||null,
      avatar_asset:current.avatar_asset||null,
      avatar_gender:current.avatar_gender||'male',
      avatar_package:current.avatar_package||'default',
      profile_background:current.profile_background||'default',
      profile_accent:current.profile_accent||'emerald'
    };
  }

  async function save(root,button){
    if(button.dataset.saving==='1')return;
    button.dataset.saving='1';
    const original=button.textContent;
    button.textContent='Saving…';
    button.disabled=true;
    try{
      const sb=getClient();
      if(!sb)throw new Error('Secure profile service is unavailable.');
      const auth=await sb.auth.getUser();
      const user=auth?.data?.user;
      if(!user)throw new Error('Your session expired. Please sign in again.');

      const draft=readDraft(root);
      if(!/^[a-z0-9_.-]{3,30}$/.test(draft.username)){
        throw new Error('Username must be 3–30 characters and use letters, numbers, dots, underscores, or hyphens.');
      }

      // Read the real row first. This makes the save compatible with the
      // deployed Supabase schema instead of assuming every legacy field exists.
      const existingResult=await sb.from('profiles').select('*').eq('id',user.id).maybeSingle();
      if(existingResult.error)throw existingResult.error;
      if(!existingResult.data)throw new Error('Your profile record could not be found.');
      const existing=existingResult.data;

      // Build the complete intended profile, then only send columns that
      // actually exist in the current profiles table.
      const desired={...draft};
      const avatarConfig={
        ...(existing.avatar_config&&typeof existing.avatar_config==='object'?existing.avatar_config:{}),
        package:draft.avatar_package,
        gender:draft.avatar_gender,
        background:draft.profile_background,
        accent:draft.profile_accent,
        asset:draft.avatar_url||draft.avatar_asset||null
      };
      if(Object.prototype.hasOwnProperty.call(existing,'avatar_config'))desired.avatar_config=avatarConfig;

      const payload={};
      Object.keys(desired).forEach(key=>{
        if(Object.prototype.hasOwnProperty.call(existing,key))payload[key]=desired[key];
      });

      // Some deployments store the profile presentation in avatar_config rather
      // than individual columns. Keep both representations synchronized when
      // those columns are available.
      if(Object.prototype.hasOwnProperty.call(existing,'avatar_config'))payload.avatar_config=avatarConfig;

      const result=await sb.from('profiles').update(payload).eq('id',user.id).select().single();
      if(result.error)throw result.error;

      window.profile={...existing,...result.data,...draft};
      const state=JSON.parse(localStorage.getItem('onemuslim_platform_v1')||'{}');
      state.profile={...(state.profile||{}),...window.profile};
      localStorage.setItem('onemuslim_platform_v1',JSON.stringify(state));

      // Refresh visible profile surfaces without forcing a page reload.
      window.OneMuslimPlatform?.refreshFloat?.();
      window.renderProfile?.();
      window.refreshProfile?.();
      root.remove();
      toast('Profile saved successfully.');
    }catch(error){
      console.error('[OneMuslim] profile save failed:',error);
      toast(error?.message||'Unable to save your profile.');
    }finally{
      button.dataset.saving='0';
      button.textContent=original;
      button.disabled=false;
    }
  }

  document.addEventListener('click',function(event){
    const button=event.target?.closest?.('#pbSave');
    if(!button)return;
    const root=button.closest('.om-pb-overlay');
    if(!root)return;
    // Capture phase wins over profile-builder.js's onclick handler. This is
    // intentional: the old handler can throw before showing an error.
    event.preventDefault();
    event.stopPropagation();
    event.stopImmediatePropagation();
    save(root,button);
  },true);
})();
