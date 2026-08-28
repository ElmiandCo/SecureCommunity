/* OneMuslim navigation: desktop top navigation, mobile drawer, Back + Home. */
(function(){
  function wireApp(){
    const app=document.getElementById('appView');
    if(!app) return;
    const links=[...app.querySelectorAll('.app-nav-link[data-page]')];
    const sides=[...app.querySelectorAll('.side[data-page]')];
    const menu=document.getElementById('appMenuToggle');
    const sidebar=document.getElementById('mobileAppSidebar');
    const back=document.getElementById('appBack');
    if(!app.dataset.navWired){
      app.dataset.navWired='1';
      let current='feed'; const stack=[]; let goingBack=false;
      const show=(page,push=true)=>{
        const target=sides.find(b=>b.dataset.page===page);
        if(target){if(push&&!goingBack&&current!==page)stack.push(current);target.click();}
        else if(window.OneMuslimPlatform?.showPage)window.OneMuslimPlatform.showPage(page);
        current=page; links.forEach(b=>b.classList.toggle('active',b.dataset.page===page)); sidebar?.classList.remove('open');
      };
      sides.forEach(b=>b.addEventListener('click',()=>{current=b.dataset.page||'feed';links.forEach(x=>x.classList.toggle('active',x.dataset.page===current));sidebar?.classList.remove('open');}));
      links.forEach(b=>b.addEventListener('click',()=>show(b.dataset.page||'feed')));
      menu?.addEventListener('click',()=>sidebar?.classList.toggle('open'));
      back?.addEventListener('click',()=>{const previous=stack.pop()||'feed';goingBack=true;show(previous,false);goingBack=false;});
      document.addEventListener('click',e=>{if(sidebar?.classList.contains('open')&&!sidebar.contains(e.target)&&e.target!==menu)sidebar.classList.remove('open')});
    }
  }
  function wirePublic(){
    const home=document.querySelector('.social-home'); if(!home||home.dataset.mobileNav==='1')return; home.dataset.mobileNav='1';
    const top=home.querySelector('.social-top'),sidebar=home.querySelector('.social-sidebar');if(!top||!sidebar)return;
    const button=document.createElement('button');button.className='social-mobile-menu-btn';button.type='button';button.setAttribute('aria-label','Open navigation');button.textContent='☰';top.insertBefore(button,top.firstChild);
    const drawer=document.createElement('div');drawer.className='mobile-social-menu';drawer.innerHTML='<div class="mobile-menu-title">OneMuslim</div>';
    sidebar.querySelectorAll('.social-nav button').forEach(original=>{const b=document.createElement('button');b.type='button';b.innerHTML=original.innerHTML;b.addEventListener('click',()=>original.click());drawer.appendChild(b)});
    home.appendChild(drawer);button.addEventListener('click',()=>drawer.classList.toggle('open'));document.addEventListener('click',e=>{if(drawer.classList.contains('open')&&!drawer.contains(e.target)&&e.target!==button)drawer.classList.remove('open')});
  }
  function loadPlatform(){if(document.getElementById('oneMuslimPlatformScript'))return;const s=document.createElement('script');s.id='oneMuslimPlatformScript';s.src='one-muslim-platform.js';s.defer=true;document.body.appendChild(s)}
  function init(){loadPlatform();wireApp();wirePublic();const observer=new MutationObserver(()=>{wireApp();wirePublic()});observer.observe(document.body,{childList:true,subtree:true});}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();
})();
