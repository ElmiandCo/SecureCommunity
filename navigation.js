/* OneMuslim navigation: desktop top navigation, mobile drawer, Back + Home. */
(function(){
  function wireApp(){
    const app=document.getElementById('appView');
    if(!app || app.dataset.navWired==='1') return;
    app.dataset.navWired='1';
    const links=[...app.querySelectorAll('.app-nav-link[data-page]')];
    const sides=[...app.querySelectorAll('.side[data-page]')];
    const menu=document.getElementById('appMenuToggle');
    const sidebar=document.getElementById('mobileAppSidebar');
    const back=document.getElementById('appBack');
    const stack=[];
    let current='feed';
    let goingBack=false;

    function activate(page, push){
      const target=sides.find(b=>b.dataset.page===page);
      if(target && !goingBack && push && current!==page) stack.push(current);
      if(target) target.click();
      links.forEach(b=>b.classList.toggle('active',b.dataset.page===page));
      current=page;
      sidebar?.classList.remove('open');
    }

    sides.forEach(b=>b.addEventListener('click',()=>{
      const page=b.dataset.page||'feed';
      if(!goingBack && current!==page) stack.push(current);
      current=page;
      links.forEach(x=>x.classList.toggle('active',x.dataset.page===page));
      sidebar?.classList.remove('open');
    }));
    links.forEach(b=>b.addEventListener('click',()=>activate(b.dataset.page||'feed',true)));
    menu?.addEventListener('click',()=>sidebar?.classList.toggle('open'));
    back?.addEventListener('click',()=>{
      const previous=stack.pop() || 'feed';
      goingBack=true;
      activate(previous,false);
      goingBack=false;
    });

    document.addEventListener('click',e=>{
      if(!sidebar?.classList.contains('open')) return;
      if(!sidebar.contains(e.target) && e.target!==menu) sidebar.classList.remove('open');
    });
  }

  function wirePublic(){
    const home=document.querySelector('.social-home');
    if(!home || home.dataset.mobileNav==='1') return;
    home.dataset.mobileNav='1';
    const top=home.querySelector('.social-top');
    const sidebar=home.querySelector('.social-sidebar');
    if(!top || !sidebar) return;

    const button=document.createElement('button');
    button.className='social-mobile-menu-btn';
    button.type='button';
    button.setAttribute('aria-label','Open navigation');
    button.textContent='☰';
    top.insertBefore(button,top.firstChild);

    const drawer=document.createElement('div');
    drawer.className='mobile-social-menu';
    drawer.innerHTML='<div class="mobile-menu-title">OneMuslim</div>';
    sidebar.querySelectorAll('.social-nav button').forEach(original=>{
      const b=document.createElement('button');
      b.type='button';
      b.innerHTML=original.innerHTML;
      b.addEventListener('click',()=>original.click());
      drawer.appendChild(b);
    });
    home.appendChild(drawer);
    button.addEventListener('click',()=>drawer.classList.toggle('open'));
    document.addEventListener('click',e=>{
      if(drawer.classList.contains('open') && !drawer.contains(e.target) && e.target!==button) drawer.classList.remove('open');
    });
  }

  function init(){
    wireApp(); wirePublic();
    const observer=new MutationObserver(()=>{wireApp();wirePublic();});
    observer.observe(document.body,{childList:true,subtree:true});
  }
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',init); else init();
})();
