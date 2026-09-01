/* OneMuslim Videos navigation bootstrap. */
(function(){
  'use strict';
  function wire(){
    const app=document.getElementById('appView');if(!app)return;
    const content=app.querySelector('.content');if(!content)return;
    if(!document.getElementById('omPage-videos')){
      const page=document.createElement('div');page.id='omPage-videos';page.className='page hidden';page.dataset.omPage='videos';content.appendChild(page);
    }
    const navs=[app.querySelector('.app-nav-links'),app.querySelector('.sidebar nav')].filter(Boolean);
    navs.forEach(nav=>{
      if(nav.querySelector('[data-page="videos"]'))return;
      const b=document.createElement('button');b.type='button';b.className=nav.classList.contains('app-nav-links')?'app-nav-link':'side';b.dataset.page='videos';b.innerHTML=nav.classList.contains('app-nav-links')?'Videos':'▶ Videos';
      nav.appendChild(b);
    });
  }
  function handle(e){
    const target=e.target.closest?.('#appView [data-page="videos"]');
    if(!target)return;
    e.preventDefault();
    e.stopImmediatePropagation();
    wire();
    window.OneMuslimVideos?.show?.('videos');
  }
  function init(){wire();document.addEventListener('click',handle,true);new MutationObserver(wire).observe(document.body,{childList:true,subtree:true});}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();
})();
