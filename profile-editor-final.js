/* OneMuslim Profile Editor Bridge v2
 * The authenticated app historically loaded this file during sign-in, while
 * the unified builder was not included directly in index.html. Keep this file
 * as the single bridge that guarantees the real builder is available.
 */
(function(){
  'use strict';
  let loading = null;

  function loadBuilder(){
    if(typeof window.OneMuslimProfileBuilder?.open === 'function') return Promise.resolve();
    if(loading) return loading;

    loading = new Promise((resolve,reject)=>{
      const existing = document.querySelector('script[data-unified-profile-builder="1"]');
      if(existing){
        existing.addEventListener('load',()=>resolve(),{once:true});
        existing.addEventListener('error',()=>reject(new Error('Unified profile builder failed to load.')),{once:true});
        return;
      }
      const s=document.createElement('script');
      s.src='profile-builder.js?v=6';
      s.dataset.unifiedProfileBuilder='1';
      s.onload=()=>resolve();
      s.onerror=()=>reject(new Error('Unified profile builder failed to load.'));
      document.head.appendChild(s);
    }).finally(()=>{ loading=null; });

    return loading;
  }

  async function openUnified(){
    try{
      await loadBuilder();
      const open = window.OneMuslimProfileBuilder?.open || window.openProfileBuilder || window.OneMuslimOpenProfileEditor;
      if(typeof open !== 'function') throw new Error('Unified profile builder is unavailable.');
      return open();
    }catch(e){
      console.error('[OneMuslim] unified profile builder bridge failed',e);
      window.toast?.(e.message || 'Profile editor is unavailable.');
      return false;
    }
  }

  window.OneMuslimProfileEditorFinalRetired = false;
  window.OneMuslimProfileEditorBridge = {load:loadBuilder,open:openUnified};
  window.OneMuslimOpenProfileEditor = openUnified;
  window.openProfileEditor = openUnified;
  window.openProfileBuilder = openUnified;
})();