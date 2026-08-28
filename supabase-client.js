/* OneMuslim Supabase Client — one browser client for the entire app. */
(function(){
  'use strict';
  if(!window.supabase?.createClient) throw new Error('Supabase SDK is required before supabase-client.js.');
  if(window.OneMuslimSupabaseClient) return;

  const originalCreateClient = window.supabase.createClient.bind(window.supabase);
  let singleton = null;
  let singletonKey = '';

  function getClient(){
    const cfg = window.APP_CONFIG || {};
    if(!cfg.SUPABASE_URL || !cfg.SUPABASE_ANON_KEY) return null;
    const key = `${cfg.SUPABASE_URL}|${cfg.SUPABASE_ANON_KEY}`;
    if(!singleton || singletonKey !== key){
      singleton = originalCreateClient(cfg.SUPABASE_URL,cfg.SUPABASE_ANON_KEY,{
        auth:{
          persistSession:true,
          autoRefreshToken:true,
          detectSessionInUrl:true
        }
      });
      singletonKey = key;
    }
    return singleton;
  }

  const existingCreateClient = window.supabase.createClient;
  window.supabase.createClient = function(url,key,options){
    const cfg = window.APP_CONFIG || {};
    if(url === cfg.SUPABASE_URL && key === cfg.SUPABASE_ANON_KEY){
      return getClient();
    }
    return existingCreateClient(url,key,options);
  };

  window.OneMuslimSupabaseClient = Object.freeze({getClient});
})();
