(function(){
  'use strict';

  function style(){
    if(document.getElementById('oneMuslimNavigationStyles'))return;
    const s=document.createElement('style');s.id='oneMuslimNavigationStyles';
    s.textContent=`
:root{--om-green:#1f5b49;--om-deep:#12382e;--om-gold:#c89d3c;--om-cream:#fbf8f1;--om-line:#e6e1d6;--om-muted:#718078;--om-text:#182c25}
body.dashboard-theme{background:var(--om-cream)!important;color:var(--om-text)!important;overflow-x:hidden!important}
body.dashboard-theme #appView{background:var(--om-cream)!important;padding:0!important;max-width:none!important}
body.dashboard-theme #appView .app-layout{display:grid!important;grid-template-columns:250px minmax(0,1fr)!important;min-height:100vh!important}
body.dashboard-theme #appView .sidebar{display:flex!important;grid-column:1!important;grid-row:1!important;position:sticky!important;top:0!important;height:100vh!important;min-height:100vh!important;box-sizing:border-box!important;background:linear-gradient(180deg,#fffdf8,#f4f7f2)!important;border-right:1px solid var(--om-line)!important;border-radius:0!important;padding:28px 18px!important;box-shadow:8px 0 30px rgba(27,55,45,.035)!important;z-index:1100!important;flex-direction:column!important}
body.dashboard-theme #appView .sidebar:before{content:'';position:absolute;inset:auto 0 0 0;height:230px;background:url('assets/onemuslim/pattern-light.svg') left bottom/250px no-repeat;opacity:.32;pointer-events:none}
body.dashboard-theme #appView .mini-profile,body.dashboard-theme #appView .xp-card,body.dashboard-theme #appView .sidebar nav,body.dashboard-theme #appView .logout{position:relative;z-index:1}
body.dashboard-theme #appView .mini-profile{margin-bottom:16px!important}
body.dashboard-theme #appView .xp-card{margin:0 0 22px!important;border:1px solid #d9e5de!important;border-radius:18px!important;background:#f4f8f5!important;color:var(--om-green)!important;padding:13px!important}
body.dashboard-theme #appView .side{width:100%!important;border:0!important;background:transparent!important;color:#4d655b!important;border-radius:14px!important;padding:13px 14px!important;font-weight:750!important;text-align:left!important;cursor:pointer!important}
body.dashboard-theme #appView .side.active,body.dashboard-theme #appView .side:hover{background:#e8f1ec!important;color:var(--om-green)!important}
body.dashboard-theme #appView .logout{margin-top:auto!important;border:0!important;background:transparent!important;color:#9d4d58!important;padding:13px 14px!important;text-align:left!important;cursor:pointer!important}
body.dashboard-theme #appView .app-nav{display:none!important}
body.dashboard-theme #appView .content{grid-column:2!important;grid-row:1!important;max-width:none!important;width:100%!important;margin:0!important;padding:34px 48px 70px!important;box-sizing:border-box!important;min-width:0!important}
body.dashboard-theme #appView .page{animation:omFade .18s ease-out}@keyframes omFade{from{opacity:.7;transform:translateY(4px)}to{opacity:1;transform:none}}
body.dashboard-theme #appView .page-head{min-height:58px!important;display:flex!important;align-items:center!important;gap:18px!important;margin-bottom:22px!important}
body.dashboard-theme #appView .page-head h2{font-family:Georgia,'Times New Roman',serif!important;color:var(--om-green)!important;font-size:32px!important;margin:4px 0!important}
body.dashboard-theme #appView .page-head:after{content:'';margin-left:auto;width:82px;height:28px;background:url('assets/onemuslim/divider-gold.svg') center/contain no-repeat;opacity:.62}
.site-nav-actions{margin-left:auto;display:flex;align-items:center;gap:8px}.site-nav-actions button,.auth-nav-actions button{border:1px solid #d8ded8;background:#fff;color:#35564a;border-radius:999px;padding:8px 13px;font-weight:800;font-size:12px;cursor:pointer}.site-nav-actions .home-btn,.auth-nav-actions .home-btn{background:var(--om-green);color:#fff;border-color:var(--om-green)}
.auth-nav-actions{display:flex;justify-content:space-between;gap:8px;margin-bottom:8px}.auth-nav-actions button{font-size:15px;padding:10px 18px}.auth-card>#backPublic{display:none!important}.auth-card>.switch{display:block!important;margin:0 0 22px!important;text-align:right!important;font-size:14px!important;color:#718078!important}.auth-card>.switch button{color:var(--om-green)!important;font-weight:800!important;border:0!important;background:transparent!important;cursor:pointer!important}
body.dashboard-theme #appView .composer,body.dashboard-theme #appView .post,body.dashboard-theme #appView .profile-card,body.dashboard-theme #appView .profile-panel,body.dashboard-theme #appView .lesson-card,body.dashboard-theme #appView .lesson-player{background:#fff!important;border:1px solid var(--om-line)!important;border-radius:20px!important;box-shadow:0 8px 30px rgba(40,60,50,.055)!important}
body.dashboard-theme #appView .primary{background:var(--om-green)!important;border-color:var(--om-green)!important;border-radius:999px!important}
body.dashboard-theme #appView .ghost,body.dashboard-theme #appView .outline{color:var(--om-green)!important;border-color:#9bb8ad!important;border-radius:999px!important}
body.dashboard-theme #appView #publicHomePage>.om-landing>.om-site-nav{display:none!important}
body.dashboard-theme #appView #publicHomePage>.om-landing{padding-top:10px!important}
@media(max-width:1000px){
 body.dashboard-theme #appView .app-layout{display:block!important;min-height:100vh!important}
 body.dashboard-theme #appView .sidebar{position:fixed!important;left:0!important;top:0!important;width:min(300px,86vw)!important;height:100vh!important;min-height:100vh!important;transform:translateX(-105%)!important;transition:transform .22s ease!important;box-shadow:20px 0 50px rgba(18,56,46,.16)!important;z-index:1400!important}
 body.dashboard-theme #appView .sidebar.open{transform:translateX(0)!important}
 body.dashboard-theme #appView .app-nav{display:flex!important;position:sticky!important;top:0!important;z-index:1200!important;height:68px!important;align-items:center!important;gap:9px!important;padding:0 12px!important;background:rgba(255,255,255,.97)!important;border-bottom:1px solid var(--om-line)!important;box-shadow:0 3px 18px rgba(27,55,45,.04)!important;backdrop-filter:blur(12px)!important}
 body.dashboard-theme #appView .app-nav-menu{display:block!important;order:1!important;border:1px solid #d6ddd7!important;background:#fff!important;color:var(--om-green)!important;border-radius:12px!important;padding:8px 11px!important;font-size:20px!important;cursor:pointer!important;position:relative!important;z-index:1500!important;touch-action:manipulation!important}
 body.dashboard-theme #appView .app-nav-brand{display:flex!important;order:2!important;align-items:center!important;gap:9px!important;min-width:0!important;font-family:Georgia,'Times New Roman',serif!important;font-size:20px!important;font-weight:700!important;color:var(--om-green)!important;white-space:nowrap!important}
 body.dashboard-theme #appView .om-nav-mark{display:grid!important;place-items:center!important;width:36px!important;height:36px!important;border:2px solid var(--om-gold)!important;border-radius:50%!important;background:#fffaf0!important;color:var(--om-green)!important;font-size:18px!important;flex:0 0 auto!important;overflow:hidden!important}
 body.dashboard-theme #appView .om-nav-mark img{width:100%!important;height:100%!important;display:block!important;object-fit:cover!important;border-radius:50%!important}
 body.dashboard-theme #appView .app-nav-links{display:none!important}
 body.dashboard-theme #appView .app-nav-search{order:3!important;flex:1 1 auto!important;min-width:0!important;max-width:none!important;height:40px!important;margin-left:auto!important;border:1px solid var(--om-line)!important;border-radius:999px!important;background:#f8f8f5!important;color:var(--om-text)!important;padding:0 13px!important;font-size:14px!important;outline:none!important}
 body.dashboard-theme #appView .app-nav-back{order:4!important;border:1px solid #d6ddd7!important;background:#fff!important;color:#456258!important;border-radius:999px!important;padding:9px 11px!important;font-size:0!important;cursor:pointer!important}.app-nav-back:before{content:'←';font-size:17px!important}
 body.dashboard-theme #appView .content{padding:20px 14px 45px!important}
}
@media(max-width:480px){body.dashboard-theme #appView .app-nav-brand{font-size:0!important}.app-nav-brand .om-nav-mark{width:36px!important;height:36px!important}.app-nav-search{font-size:13px!important}.auth-nav-actions button{font-size:14px!important;padding:9px 15px!important}}
body.dark-theme{background:#0e1b17!important;color:#edf4ef!important}body.dark-theme #appView{background:#0e1b17!important}body.dark-theme #appView .sidebar,body.dark-theme #appView .app-nav{background:#14231e!important;border-color:#29473c!important}body.dark-theme #appView .side{color:#b8c8c0!important}body.dark-theme #appView .side.active,body.dark-theme #appView .side:hover{background:#24483d!important;color:#e7f1ec!important}
`;
    document.head.appendChild(s);
  }

  function avatarSrc(){
    const p=window.profile||{};
    if(p.avatar_url)return String(p.avatar_url);
    if(p.avatar_config&&typeof p.avatar_config==='object'&&(p.avatar_config.asset||p.avatar_config.url))return String(p.avatar_config.asset||p.avatar_config.url);
    if(p.avatar_package==='platinum_package')return `assets/avatars/${p.avatar_gender==='female'?'platinum-female.PNG':'platinum-male.PNG'}`;
    if(p.avatar_gender==='female')return 'assets/avatar/base/master.png';
    if(p.avatar_gender==='male')return 'assets/avatar/male/male-1-original.jpg';
    return '';
  }

  function syncNavAvatar(){
    const mark=document.querySelector('#appView .om-nav-mark');
    if(!mark)return;
    const src=avatarSrc();
    if(!src){if(mark.querySelector('img'))mark.innerHTML='✦';return;}
    const existing=mark.querySelector('img');
    if(existing&&existing.getAttribute('src')===src)return;
    mark.innerHTML='';
    const img=document.createElement('img');img.src=src;img.alt='Profile photo';img.loading='eager';
    img.onerror=()=>{mark.innerHTML='✦';};
    mark.appendChild(img);
  }

  function show(page){
    const map={'public-home':'publicHomePage',feed:'feedPage',profiles:'profilesPage',profile:'profilePage',lessons:'lessonsPage'};
    const target=document.getElementById(map[page]||page);
    if(!target)return false;
    document.querySelectorAll('#appView .content > .page').forEach(p=>p.classList.add('hidden'));
    target.classList.remove('hidden');
    document.querySelectorAll('#appView .app-nav-link,#appView .side').forEach(b=>b.classList.toggle('active',b.dataset.page===page));
    document.getElementById('mobileAppSidebar')?.classList.remove('open');
    window.scrollTo({top:0,behavior:'smooth'});
    syncNavAvatar();
    return true;
  }

  function init(){
    style();
    const app=document.getElementById('appView');
    if(!app)return;
    let history=['profile'];
    const sidebar=()=>document.getElementById('mobileAppSidebar');

    // Single routing path for both the top navigation and drawer.
    // Do not call side.click() from here: another navigation listener is already installed,
    // and doing so can recurse indefinitely on mobile.
    document.addEventListener('click',e=>{
      const nav=e.target.closest?.('#appView .app-nav-link[data-page],#appView .side[data-page]');
      if(nav){
        e.preventDefault();
        e.stopImmediatePropagation();
        const page=nav.dataset.page||'feed';
        if(history[history.length-1]!==page)history.push(page);
        show(page);
        return;
      }
      const menu=e.target.closest?.('#appView #appMenuToggle');
      if(menu){
        e.preventDefault();
        e.stopImmediatePropagation();
        sidebar()?.classList.toggle('open');
        return;
      }
      const back=e.target.closest?.('#appView #appBack');
      if(back){
        e.preventDefault();
        e.stopImmediatePropagation();
        if(history.length>1)history.pop();
        show(history[history.length-1]||'profile');
      }
    },true);

    function scan(){
      const publicHome=document.querySelector('#appView #publicHomePage .om-site-nav');if(publicHome)publicHome.remove();
      const card=document.querySelector('#authView .auth-card');
      if(card){
        const original=card.querySelector('#backPublic');if(original)original.style.display='none';
        let row=card.querySelector('.auth-nav-actions');
        if(!row){
          row=document.createElement('div');row.className='auth-nav-actions';
          const b=document.createElement('button');b.type='button';b.textContent='← Back';b.onclick=()=>document.getElementById('backPublic')?.click();
          const h=document.createElement('button');h.type='button';h.className='home-btn';h.textContent='Home';h.onclick=()=>document.getElementById('backPublic')?.click();
          row.append(b,h);card.insertBefore(row,card.firstChild);
        }
        const sw=card.querySelector('#authSwitch');const form=card.querySelector('#authForm');
        if(sw&&form&&form.previousElementSibling!==sw)form.parentNode.insertBefore(sw,form);
      }
      syncNavAvatar();
    }

    scan();
    setTimeout(scan,250);setTimeout(scan,800);setTimeout(scan,1600);
    new MutationObserver(scan).observe(document.body,{childList:true,subtree:true});
    setInterval(syncNavAvatar,1000);

    const activateProfile=()=>{
      if(document.getElementById('profilePage')&&!document.getElementById('profilePage').classList.contains('hidden')){syncNavAvatar();return;}
      if(document.getElementById('appView')&&!document.getElementById('appView').classList.contains('hidden'))show('profile');
    };
    setTimeout(activateProfile,350);
    setTimeout(activateProfile,1000);
  }

  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();
})();
