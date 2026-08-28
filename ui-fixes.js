/* OneMuslim interaction safety net. Keeps every primary navigation action functional. */
(function(){
  function showPage(page){
    const app=document.getElementById('appView');
    if(!app)return;
    const map={
      'public-home':'publicHomePage',
      feed:'feedPage',
      profiles:'profilesPage',
      profile:'profilePage',
      lessons:'lessonsPage'
    };
    const id=map[page]||page;
    const target=document.getElementById(id);
    if(!target)return;
    app.querySelectorAll('.content > .page').forEach(p=>p.classList.add('hidden'));
    target.classList.remove('hidden');
    app.querySelectorAll('[data-page]').forEach(b=>b.classList.toggle('active',b.dataset.page===page));
    window.scrollTo({top:0,behavior:'smooth'});
  }

  function wireNavigation(){
    document.querySelectorAll('#appView [data-page]').forEach(btn=>{
      if(btn.dataset.uiFix==='1')return;
      btn.dataset.uiFix='1';
      btn.addEventListener('click',function(e){
        const page=this.dataset.page;
        if(page==='public-home'){
          e.preventDefault();
          e.stopImmediatePropagation();
          showPage(page);
        }
      },true);
    });
  }

  function ensureAuthBridge(){
    const publicView=document.getElementById('publicView');
    if(!publicView || publicView.dataset.authFix==='1')return;
    publicView.dataset.authFix='1';
    ['openLogin','openSignup'].forEach(id=>{
      if(document.getElementById(id))return;
      const b=document.createElement('button');
      b.id=id;b.type='button';b.hidden=true;b.tabIndex=-1;
      b.setAttribute('aria-hidden','true');
      document.body.appendChild(b);
    });
  }

  function wirePublicAuth(){
    document.querySelectorAll('[data-public-auth]').forEach(btn=>{
      if(btn.dataset.authFix==='1')return;
      btn.dataset.authFix='1';
      btn.addEventListener('click',function(e){
        e.preventDefault();
        const mode=this.dataset.publicAuth==='login'?'login':'signup';
        const bridge=document.getElementById(mode==='login'?'openLogin':'openSignup');
        if(bridge)bridge.click();
      });
    });
  }

  function init(){
    ensureAuthBridge();wireNavigation();wirePublicAuth();
    const observer=new MutationObserver(()=>{ensureAuthBridge();wireNavigation();wirePublicAuth()});
    observer.observe(document.body,{childList:true,subtree:true});
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();
})();
