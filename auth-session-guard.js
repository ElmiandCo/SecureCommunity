/* E-Secure Community — auth bootstrap guard.
   Keeps the public shell from flashing while Supabase restores a persisted session.
   It observes the existing app auth state; it does not create a second Supabase client. */
(function(){
  'use strict';
  const MAX_WAIT_MS = 8000;
  const started = Date.now();
  const style = document.createElement('style');
  style.textContent = '#authBootGuard{position:fixed;inset:0;z-index:2147483646;display:flex;align-items:center;justify-content:center;background:#090b12;color:#fff;font:600 15px system-ui,sans-serif;letter-spacing:.02em}#authBootGuard.hidden{display:none}';
  document.head.appendChild(style);
  const guard = document.createElement('div');
  guard.id = 'authBootGuard';
  guard.setAttribute('aria-live','polite');
  guard.textContent = 'Restoring secure session…';
  document.body.appendChild(guard);

  function finish(){
    if(!guard.classList.contains('hidden')){
      guard.classList.add('hidden');
      setTimeout(()=>guard.remove(),250);
    }
  }
  function check(){
    const badge = document.getElementById('sessionBadge');
    const publicView = document.getElementById('publicView');
    const appView = document.getElementById('appView');
    if(badge?.textContent === 'SECURE SESSION' || !publicView?.classList.contains('hidden') && !appView?.classList.contains('hidden')){
      finish();
      return true;
    }
    if(Date.now()-started >= MAX_WAIT_MS){
      finish();
      return true;
    }
    return false;
  }
  const observer = new MutationObserver(check);
  observer.observe(document.body,{subtree:true,childList:true,characterData:true,attributes:true,attributeFilter:['class']});
  const timer = setInterval(()=>{if(check()){clearInterval(timer);observer.disconnect();}},100);
  setTimeout(()=>{clearInterval(timer);observer.disconnect();finish();},MAX_WAIT_MS+250);
})();
