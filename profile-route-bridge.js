/* OneMuslim viewed-profile route bridge. Viewed profiles never reuse the My Profile editor. */
(() => {
  'use strict';
  let loading = null;
  function renderRoute(id){
    if(!id)return;
    const page=document.getElementById('profilePage');
    const app=document.getElementById('appView');
    if(!page||!app||app.classList.contains('hidden'))return;
    document.querySelectorAll('#appView .content > .page').forEach(x=>x.classList.add('hidden'));
    page.classList.remove('hidden');
    page.dataset.profileMode='viewed';
    page.dataset.profileUserId=String(id);
    page.dataset.omViewedRendered='1';
    if(typeof window.OneMuslimViewedProfile?.render==='function'){
      window.OneMuslimViewedProfile.render(id);return;
    }
    if(loading)return;
    loading=new Promise((resolve,reject)=>{
      const s=document.createElement('script');
      s.id='oneMuslimVisitedProfileScript';
      s.src='view-profile-page.js?v=20260912-04';
      s.onload=resolve;s.onerror=()=>reject(new Error('Viewed profile renderer failed to load.'));
      document.body.appendChild(s);
    }).then(()=>window.OneMuslimViewedProfile?.render?.(id)).catch(console.error).finally(()=>{loading=null});
  }
  function leaveViewedMode(){
    const page=document.getElementById('profilePage');
    if(page){page.dataset.profileMode='my-profile';delete page.dataset.profileUserId;page.dataset.omViewedRendered='';}
  }
  window.OneMuslimViewedProfileRoute={render:renderRoute,leave:leaveViewedMode};
  window.addEventListener('oneMuslim:open-profile',e=>renderRoute(e.detail?.id));
  window.addEventListener('popstate',()=>{
    const id=new URLSearchParams(location.search).get('profile');
    if(id)renderRoute(id);else leaveViewedMode();
  });
})();