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

  function addDoxdNavigation(){
    const app = document.getElementById('appView');
    if(!app) return;

    const add = (container, side=false) => {
      if(!container || container.querySelector('[data-doxd-link]')) return;
      const link = document.createElement(side ? 'a' : 'a');
      link.href = 'doxd.html';
      link.className = side ? 'side doxd-nav-link' : 'app-nav-link doxd-nav-link';
      link.dataset.doxdLink = 'true';
      link.textContent = side ? '🕵️ DoX\'d' : "DoX'd";
      container.appendChild(link);
    };

    add(app.querySelector('.app-nav-links'));
    add(app.querySelector('#mobileAppSidebar nav'), true);
  }

  if(document.readyState === 'loading') document.addEventListener('DOMContentLoaded', addDoxdNavigation);
  else addDoxdNavigation();
  new MutationObserver(addDoxdNavigation).observe(document.documentElement,{childList:true,subtree:true});
})();
