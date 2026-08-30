/* Legacy profile-builder retired.
 * The only editor is profile-editor-final.js. This compatibility file is intentionally
 * harmless if an older index still references profile-builder.js.
 */
(function(){
  'use strict';
  async function launch(e){
    const button=e.target.closest('#editProfile');
    if(!button)return;
    e.preventDefault();e.stopPropagation();e.stopImmediatePropagation();
    try{
      const sb=window.OneMuslimSupabaseClient?.getClient?.()||window.supabase?.createClient?.(window.APP_CONFIG?.SUPABASE_URL,window.APP_CONFIG?.SUPABASE_ANON_KEY);
      const user=(await sb.auth.getUser()).data.user;
      if(!user)throw new Error('Your session expired. Please sign in again.');
      const {data,error}=await sb.from('profiles').select('*').eq('id',user.id).maybeSingle();
      if(error)throw error;
      window.profile=data||{};
      window.OneMuslimOpenProfileEditor?.();
    }catch(err){window.toast?.(err.message||'Unable to open your profile editor.');}
  }
  document.addEventListener('click',launch,true);
})();
