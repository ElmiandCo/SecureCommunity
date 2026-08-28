(function(){
  function injectStyle(){
    if(document.getElementById('oneMuslimNavigationStyles')) return;
    const s=document.createElement('style'); s.id='oneMuslimNavigationStyles';
    s.textContent=`
      :root{--om-green:#1f5b49;--om-green-dark:#12382e;--om-gold:#c89d3c;--om-cream:#fbf8f1;--om-line:#e6e1d6;--om-text:#182c25;--om-muted:#718078;}
      body.dashboard-theme{background:var(--om-cream)!important;color:var(--om-text)!important;}
      body.dashboard-theme #appView{background:var(--om-cream)!important;color:var(--om-text)!important;padding:0!important;max-width:none!important;}
      body.dashboard-theme #appView .app-layout{display:block!important;min-height:100vh!important;}
      body.dashboard-theme #appView .sidebar{display:none!important;}

      body.dashboard-theme #appView .app-nav{position:sticky!important;top:0!important;z-index:1000!important;height:76px!important;display:flex!important;align-items:center!important;gap:18px!important;padding:0 42px!important;background:rgba(255,255,255,.96)!important;border:0!important;border-bottom:1px solid var(--om-line)!important;box-shadow:0 3px 18px rgba(27,55,45,.04)!important;backdrop-filter:blur(12px)!important;}
      body.dashboard-theme #appView .app-nav:before{content:'';position:absolute;left:0;bottom:0;width:150px;height:100%;pointer-events:none;background:url('assets/onemuslim/pattern-light.svg') left bottom/190px 190px no-repeat;opacity:.38;z-index:-1;}
      body.dashboard-theme #appView .app-nav-brand{display:flex!important;align-items:center!important;gap:11px!important;min-width:190px!important;font-family:Georgia,'Times New Roman',serif!important;font-size:25px!important;font-weight:700!important;color:var(--om-green)!important;white-space:nowrap!important;}
      body.dashboard-theme #appView .om-nav-mark{display:grid!important;place-items:center!important;width:42px!important;height:42px!important;border:2px solid var(--om-gold)!important;border-radius:50%!important;background:#fffaf0!important;color:var(--om-green)!important;font-size:22px!important;box-shadow:0 3px 12px rgba(200,157,60,.13)!important;}
      body.dashboard-theme #appView .app-nav-links{display:flex!important;align-items:center!important;gap:4px!important;}
      body.dashboard-theme #appView .app-nav-link{border:0!important;background:transparent!important;color:#53645d!important;border-radius:999px!important;padding:10px 15px!important;font-size:14px!important;font-weight:600!important;cursor:pointer!important;}
      body.dashboard-theme #appView .app-nav-link:hover{background:#f1f4ef!important;color:var(--om-green)!important;}
      body.dashboard-theme #appView .app-nav-link.active{background:var(--om-green)!important;color:#fff!important;box-shadow:0 4px 12px rgba(31,91,73,.16)!important;}
      body.dashboard-theme #appView .app-nav-search{order:3!important;flex:1 1 320px!important;max-width:430px!important;min-width:180px!important;height:44px!important;margin-left:auto!important;border:1px solid var(--om-line)!important;border-radius:999px!important;background:#f8f8f5!important;color:var(--om-text)!important;padding:0 18px!important;font-size:14px!important;outline:none!important;}
      body.dashboard-theme #appView .app-nav-search:focus{border-color:#9bb8ad!important;background:#fff!important;box-shadow:0 0 0 4px rgba(31,91,73,.06)!important;}
      body.dashboard-theme #appView .app-nav-back{order:4!important;border:1px solid #d6ddd7!important;background:#fff!important;color:#456258!important;border-radius:999px!important;padding:9px 14px!important;font-weight:700!important;cursor:pointer!important;}
      body.dashboard-theme #appView .app-nav-back:hover{border-color:#9bb8ad!important;color:var(--om-green)!important;background:#f6f8f5!important;}
      body.dashboard-theme #appView .app-nav-menu{display:none!important;border:1px solid #d6ddd7!important;background:#fff!important;color:var(--om-green)!important;border-radius:12px!important;padding:8px 11px!important;font-size:20px!important;cursor:pointer!important;}

      body.dashboard-theme #appView .content{max-width:1240px!important;width:100%!important;margin:0 auto!important;padding:34px 42px 60px!important;box-sizing:border-box!important;}
      body.dashboard-theme #appView .page{animation:omFade .18s ease-out;}
      @keyframes omFade{from{opacity:.65;transform:translateY(4px)}to{opacity:1;transform:none}}
      body.dashboard-theme #appView .page-head{min-height:58px!important;display:flex!important;align-items:center!important;gap:18px!important;margin-bottom:22px!important;}
      body.dashboard-theme #appView .page-head h2{font-family:Georgia,'Times New Roman',serif!important;color:var(--om-green)!important;font-size:32px!important;letter-spacing:-.3px!important;margin:4px 0!important;}
      body.dashboard-theme #appView .eyebrow{color:#2a6b57!important;letter-spacing:.13em!important;font-weight:800!important;}
      body.dashboard-theme #appView .page-head:after{content:'';margin-left:auto;width:82px;height:28px;background:url('assets/onemuslim/divider-gold.svg') center/contain no-repeat;opacity:.62;}

      body.dashboard-theme #appView .composer,body.dashboard-theme #appView .post,body.dashboard-theme #appView .profile-card,body.dashboard-theme #appView .profile-panel,body.dashboard-theme #appView .lesson-card,body.dashboard-theme #appView .lesson-player{background:#fff!important;border:1px solid var(--om-line)!important;border-radius:20px!important;box-shadow:0 8px 30px rgba(40,60,50,.055)!important;}
      body.dashboard-theme #appView .primary{background:var(--om-green)!important;border-color:var(--om-green)!important;box-shadow:0 5px 14px rgba(31,91,73,.15)!important;border-radius:999px!important;}
      body.dashboard-theme #appView .ghost,body.dashboard-theme #appView .outline{color:var(--om-green)!important;border-color:#9bb8ad!important;border-radius:999px!important;}
      body.dashboard-theme #appView .side{color:#24352f!important;border-radius:14px!important;padding:13px 15px!important;font-size:16px!important;}
      body.dashboard-theme #appView .side.active,body.dashboard-theme #appView .side:hover{background:#e8f0ec!important;color:var(--om-green)!important;}
      body.dashboard-theme #appView .xp-card{background:#f1f5ed!important;border-color:#dbe5d8!important;color:#2b6a54!important;}
      body.dashboard-theme #appView .post p,body.dashboard-theme #appView .profile-card p,body.dashboard-theme #appView .lesson-card p{color:#354d43!important;}

      .site-nav-actions{margin-left:auto;display:flex;align-items:center;gap:8px;}
      .site-nav-actions button{border:1px solid #d8ded8;background:#fff;color:#35564a;border-radius:999px;padding:8px 13px;font-weight:700;font-size:12px;cursor:pointer;}
      .site-nav-actions button:hover{background:#eef4f0;color:var(--om-green);border-color:#a9c0b6;}
      .site-nav-actions .home-btn{background:var(--om-green);color:#fff;border-color:var(--om-green);}
      .site-nav-actions .home-btn:hover{background:#174838;color:#fff;}
      .auth-nav-actions{display:flex;justify-content:space-between;gap:8px;margin-bottom:12px;}
      .auth-nav-actions button{border:1px solid #d8ded8;background:#fff;color:#35564a;border-radius:999px;padding:8px 13px;font-weight:700;font-size:12px;cursor:pointer;}
      .auth-nav-actions .home-btn{background:var(--om-green);color:#fff;border-color:var(--om-green);}

      @media(max-width:1000px){
        body.dashboard-theme #appView .app-nav{padding:0 22px!important;gap:10px!important;}
        body.dashboard-theme #appView .app-nav-brand{min-width:auto!important;}
        body.dashboard-theme #appView .app-nav-links{display:none!important;}
        body.dashboard-theme #appView .app-nav-menu{display:block!important;order:1!important;}
        body.dashboard-theme #appView .app-nav-brand{order:2!important;}
        body.dashboard-theme #appView .app-nav-search{order:3!important;max-width:none!important;}
        body.dashboard-theme #appView .app-nav-back{order:4!important;}
        body.dashboard-theme #appView .content{padding:26px 22px 50px!important;}
      }
      @media(max-width:650px){
        body.dashboard-theme #appView .app-nav{height:68px!important;padding:0 14px!important;}
        body.dashboard-theme #appView .app-nav-brand{font-size:20px!important;gap:7px!important;}
        body.dashboard-theme #appView .om-nav-mark{width:36px!important;height:36px!important;font-size:18px!important;}
        body.dashboard-theme #appView .app-nav-search{min-width:0!important;height:40px!important;padding:0 13px!important;}
        body.dashboard-theme #appView .app-nav-back{font-size:0!important;padding:9px 11px!important;}
        body.dashboard-theme #appView .app-nav-back:before{content:'←';font-size:17px!important;}
        body.dashboard-theme #appView .content{padding:20px 14px 40px!important;}
        body.dashboard-theme #appView .page-head{align-items:flex-start!important;}
        body.dashboard-theme #appView .page-head:after{display:none!important;}
        body.dashboard-theme #appView .page-head h2{font-size:28px!important;}
      }
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
      const top=e.target.closest('.app-nav-link[data-page]');
      const nav=side||top;
      if(!nav || suppress) return;
      const page=nav.dataset.page;
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
    function addAuthHome(){
      const card=document.querySelector('#authView .auth-card');
      if(!card || card.querySelector('.auth-nav-actions')) return;
      const row=document.createElement('div'); row.className='auth-nav-actions';
      const back=document.createElement('button'); back.type='button'; back.textContent='← Back';
      const home=document.createElement('button'); home.type='button'; home.className='home-btn'; home.textContent='Home';
      back.onclick=()=>document.getElementById('backPublic')?.click();
      home.onclick=()=>document.getElementById('backPublic')?.click();
      row.append(back,home); card.insertBefore(row,card.firstChild);
    }
    function scan(){ pages.forEach(p=>{ const page=document.getElementById(p+'Page'); if(page) addControls(page.querySelector('.page-head'),p); }); addAuthHome(); }
    scan(); setTimeout(scan,300); setTimeout(scan,900);
    const observer=new MutationObserver(scan); observer.observe(document.body,{childList:true,subtree:true});
  }
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',init); else init();
})();