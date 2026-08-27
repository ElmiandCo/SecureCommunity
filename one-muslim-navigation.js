(function(){
  function injectStyle(){
    if(document.getElementById('oneMuslimNavigationStyles')) return;
    const s=document.createElement('style'); s.id='oneMuslimNavigationStyles';
    s.textContent=`
      body.dashboard-theme{background:#fbfaf6!important;color:#172c25!important}
      body.dashboard-theme #appView{background:#fbfaf6!important;color:#172c25!important;padding:0!important;max-width:none!important}
      body.dashboard-theme #appView .app-layout{grid-template-columns:280px minmax(0,1fr)!important;gap:0!important;max-width:none!important;min-height:100vh!important}
      body.dashboard-theme #appView .sidebar{background:#fff!important;border:0!important;border-right:1px solid #e8e3d8!important;border-radius:0!important;padding:28px 18px!important;min-height:100vh!important;box-shadow:none!important}
      body.dashboard-theme #appView .content{max-width:1180px!important;width:100%!important;margin:0 auto!important;padding:22px 30px 50px!important}
      body.dashboard-theme #appView .page-head{min-height:48px;display:flex;align-items:center;gap:16px;margin-bottom:18px!important}
      body.dashboard-theme #appView .page-head>div:first-child{min-width:0}
      body.dashboard-theme #appView .page-head h2{font-family:Georgia,serif!important;color:#173d31!important;font-size:30px!important;margin:4px 0!important}
      body.dashboard-theme #appView .eyebrow{color:#2a6b57!important}
      body.dashboard-theme #appView .composer,body.dashboard-theme #appView .post,body.dashboard-theme #appView .profile-card,body.dashboard-theme #appView .profile-panel,body.dashboard-theme #appView .lesson-card,body.dashboard-theme #appView .lesson-player{background:#fff!important;border:1px solid #e8e3d8!important;border-radius:18px!important;box-shadow:0 5px 20px rgba(40,60,50,.05)!important}
      body.dashboard-theme #appView .primary{background:#1f5b49!important;border-color:#1f5b49!important;box-shadow:none!important;border-radius:999px!important}
      body.dashboard-theme #appView .ghost,body.dashboard-theme #appView .outline{color:#1f5b49!important;border-color:#9bb8ad!important;border-radius:999px!important}
      body.dashboard-theme #appView .side{color:#24352f!important;border-radius:14px!important;padding:13px 15px!important;font-size:16px!important}
      body.dashboard-theme #appView .side.active,body.dashboard-theme #appView .side:hover{background:#e8f0ec!important;color:#1f5b49!important}
      body.dashboard-theme #appView .xp-card{background:#f1f5ed!important;border-color:#dbe5d8!important;color:#2b6a54!important}
      body.dashboard-theme #appView .post p,body.dashboard-theme #appView .profile-card p,body.dashboard-theme #appView .lesson-card p{color:#354d43!important}
      .site-nav-actions{margin-left:auto;display:flex;align-items:center;gap:8px}
      .site-nav-actions button{border:1px solid #d8ded8;background:#fff;color:#35564a;border-radius:999px;padding:8px 13px;font-weight:700;font-size:12px;cursor:pointer}
      .site-nav-actions button:hover{background:#eef4f0;color:#1f5b49;border-color:#a9c0b6}
      .site-nav-actions .home-btn{background:#1f5b49;color:#fff;border-color:#1f5b49}
      .site-nav-actions .home-btn:hover{background:#174838;color:#fff}
      @media(max-width:850px){body.dashboard-theme #appView .app-layout{grid-template-columns:1fr!important}body.dashboard-theme #appView .sidebar{min-height:auto!important;border-right:0!important;border-bottom:1px solid #e8e3d8!important;padding:14px!important}.site-nav-actions{gap:5px}.site-nav-actions button{padding:7px 10px}.site-nav-actions .back-label{display:none}body.dashboard-theme #appView .content{padding:16px 14px 40px!important}}
    `; document.head.appendChild(s);
  }
  function clickPage(page){ const b=document.querySelector(`.side[data-page="${page}"]`); if(b) b.click(); }
  function init(){
    injectStyle();
    const pages=['feed','profiles','profile','lessons'];
    let history=['feed'];
    let suppress=false;
    document.addEventListener('click',function(e){
      const side=e.target.closest('.side[data-page]');
      if(!side || suppress) return;
      const page=side.dataset.page;
      const current=history[history.length-1];
      if(page!==current){ history.push(page); if(history.length>25)history.shift(); }
    },true);
    function addControls(head,page){
      if(!head || head.querySelector('.site-nav-actions')) return;
      const actions=document.createElement('div'); actions.className='site-nav-actions';
      const back=document.createElement('button'); back.type='button'; back.innerHTML='← <span class="back-label">Back</span>';
      const home=document.createElement('button'); home.type='button'; home.className='home-btn'; home.textContent='Home';
      back.onclick=function(){
        if(history.length>1){ history.pop(); const prev=history[history.length-1]; suppress=true; clickPage(prev); setTimeout(()=>suppress=false,0); }
        else if(page!=='feed'){ suppress=true; clickPage('feed'); setTimeout(()=>suppress=false,0); }
      };
      home.onclick=function(){ history=['feed']; suppress=true; clickPage('feed'); setTimeout(()=>suppress=false,0); };
      actions.append(back,home); head.appendChild(actions);
    }
    function scan(){ pages.forEach(p=>{ const page=document.getElementById(p+'Page'); if(page){ addControls(page.querySelector('.page-head'),p); }}); }
    scan(); setTimeout(scan,300); setTimeout(scan,900);
    const observer=new MutationObserver(scan); observer.observe(document.body,{childList:true,subtree:true});
  }
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',init); else init();
})();