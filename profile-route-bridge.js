/* Keeps profile navigation inside the authenticated OneMuslim shell. */
(() => {
  'use strict';
  function renderRoute(id){
    if(!id)return;
    const page=document.getElementById('profilePage');
    const app=document.getElementById('appView');
    if(!page||!app||app.classList.contains('hidden'))return;
    document.querySelectorAll('#appView .content > .page').forEach(x=>x.classList.add('hidden'));
    page.classList.remove('hidden');
    page.dataset.omViewedRendered='';
    const old=document.getElementById('oneMuslimVisitedProfileScript');
    old?.remove();
    const s=document.createElement('script');
    s.id='oneMuslimVisitedProfileScript';
    s.src='view-profile-page.js?v=20260912-03';
    s.defer=true;
    document.body.appendChild(s);
  }
  window.addEventListener('oneMuslim:open-profile',e=>renderRoute(e.detail?.id));
  window.addEventListener('popstate',()=>{
    const id=new URLSearchParams(location.search).get('profile');
    if(id)renderRoute(id);
  });
})();
