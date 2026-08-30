/* OneMuslim Profile Landing — single profile editor entry point. */
(function(){
  'use strict';
  let opened=false;
  let syncing=false;

  function client(){
    return window.OneMuslimSupabaseClient?.getClient?.()
      || window.supabase?.createClient?.(window.APP_CONFIG?.SUPABASE_URL,window.APP_CONFIG?.SUPABASE_ANON_KEY);
  }

  function loadAvatarSync(){
    if(document.querySelector('script[data-selected-avatar-sync]'))return;
    const s=document.createElement('script');
    s.src='selected-avatar-sync.js';
    s.dataset.selectedAvatarSync='1';
    s.defer=true;
    document.body.appendChild(s);
  }

  async function syncProfile(){
    if(syncing)return window.profile||null;
    const sb=client();
    if(!sb)return null;
    syncing=true;
    try{
      const {data:{user}}=await sb.auth.getUser();
      if(!user)return null;
      const {data,error}=await sb.from('profiles').select('*').eq('id',user.id).maybeSingle();
      if(error)throw error;
      if(data)window.profile=data;
      return data||null;
    }catch(e){
      console.error('Profile editor sync failed:',e);
      return window.profile||null;
    }finally{syncing=false;}
  }

  function openUnifiedEditor(){
    loadAvatarSync();
    if(typeof window.OneMuslimOpenProfileEditor!=='function'){
      console.error('Unified profile editor is not available.');
      window.toast?.('Profile editor is still loading. Please try again.');
      return false;
    }
    window.OneMuslimOpenProfileEditor();
    return true;
  }

  function wireEditButton(){
    const btn=document.getElementById('editProfile');
    if(!btn||btn.dataset.unifiedProfileEditor==='1')return;
    btn.dataset.unifiedProfileEditor='1';
    btn.onclick=async function(e){
      e.preventDefault();
      e.stopImmediatePropagation();
      await syncProfile();
      openUnifiedEditor();
    };
  }

  async function tryOpenLanding(){
    const app=document.getElementById('appView');
    if(!app||app.classList.contains('hidden'))return;
    await syncProfile();
    wireEditButton();
    if(opened)return;
    if(typeof window.OneMuslimOpenProfileEditor!=='function')return;
    const profileButton=document.querySelector('#appView [data-page="profile"]');
    if(profileButton)profileButton.click();
    opened=true;
    openUnifiedEditor();
  }

  function init(){
    loadAvatarSync();
    wireEditButton();
    [150,400,800,1200,2000,3500].forEach(ms=>setTimeout(()=>{tryOpenLanding();wireEditButton();},ms));
    new MutationObserver(()=>{
      wireEditButton();
      const app=document.getElementById('appView');
      if(app&&!app.classList.contains('hidden')&&!opened)tryOpenLanding();
    }).observe(document.body,{childList:true,subtree:true,attributes:true,attributeFilter:['class']});
  }

  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();
})();