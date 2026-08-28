/* OneMuslim Auth Hardening v1 — session continuity, recovery, and explicit sign-out safety. */
(function(){
  'use strict';
  const cfg=()=>window.APP_CONFIG||{};
  let client=null;
  let lastUserId=null;
  function getClient(){
    if(client)return client;
    if(!window.supabase?.createClient||!cfg().SUPABASE_URL||!cfg().SUPABASE_ANON_KEY)return null;
    client=window.supabase.createClient(cfg().SUPABASE_URL,cfg().SUPABASE_ANON_KEY,{auth:{persistSession:true,autoRefreshToken:true,detectSessionInUrl:true,flowType:'pkce'}});
    return client;
  }
  async function restore(){
    const sb=getClient(); if(!sb)return null;
    const {data,error}=await sb.auth.getSession();
    if(error){console.warn('Auth session restore failed',error);return null;}
    const session=data?.session||null;
    lastUserId=session?.user?.id||null;
    return session;
  }
  async function refresh(){
    const sb=getClient(); if(!sb)return null;
    const {data,error}=await sb.auth.refreshSession();
    if(error){console.warn('Auth session refresh failed',error);return null;}
    lastUserId=data?.session?.user?.id||lastUserId;
    return data?.session||null;
  }
  async function signOut(){
    const sb=getClient();
    if(!sb)return;
    const {error}=await sb.auth.signOut({scope:'local'});
    if(error)throw error;
    lastUserId=null;
  }
  function install(){
    const sb=getClient(); if(!sb)return;
    sb.auth.onAuthStateChange((event,session)=>{
      if(event==='SIGNED_OUT')lastUserId=null;
      else if(session?.user)lastUserId=session.user.id;
    });
    document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='visible')restore();});
    window.addEventListener('online',()=>restore());
  }
  window.OneMuslimAuth=Object.freeze({restore,refresh,signOut,install,getClient});
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',install,{once:true});else install();
})();
