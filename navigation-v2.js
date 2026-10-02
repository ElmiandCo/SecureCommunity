/* One Muslim Navigation V2 */
(()=>{'use strict';
const $=(s,r=document)=>r.querySelector(s), $$=(s,r=document)=>[...r.querySelectorAll(s)];
const groups=[
 {title:'Explore',items:[['public-home','⌂','Home','Your One Muslim home'],['feed','◉','Community Feed','Posts and conversations'],['communities','◇','Communities','Groups and spaces'],['profiles','◉','People','Discover members']]},
 {title:'Learn & Grow',items:[['lessons','★','Lessons','Learn and earn XP'],['newsletter','📰','Newsletter','Read the latest edition']]},
 {title:'Your Space',items:[['profile','◎','My Profile','Your identity and activity'],['settings','⚙','Settings','Privacy and preferences'],['appearance','☀','Day / Night','Switch between Day and Night mode']]},
 {title:'Tools & More',items:[['hudhud','🐦','HudHud AI','Your AI companion'],['shop','🛍','Shop','One Muslim collection'],['coming-soon','✦','Coming Soon','What is next']]},
 {title:'Administration',items:[['admin','⚙','Admin Console','Platform controls']]}
];
function proxy(page){
 if(page==='settings'){window.OneMuslimSettings?.open?.();return}
 if(page==='appearance'){window.OneMuslimSettings?.open?.('appearance');return}
 if(page==='communities'){
   const run=()=>{if(window.OneMuslimCommunities?.show){window.OneMuslimCommunities.show();return true}
     const el=$('[data-page="communities"]',document.getElementById('appView'));if(el){el.click();return true}return false};
   if(!run())setTimeout(run,250);
   return;
 }
 if(page==='newsletter'){location.href='newsletter.html';return}
 if(page==='hudhud'){location.href='hudhud-ai.html';return}
 const el=$('[data-page="'+page+'"]',document.getElementById('appView'));
 if(el){el.click();return}
 if(page==='admin'){$('#omAdminNav')?.click();return}
 if(page==='coming-soon'){location.href='coming-soon.html';return}
}
function init(){
 const app=$('#appView'); if(!app||$('#omNav2'))return;
 const nav=document.createElement('div');nav.id='omNav2';nav.className='om-nav2';
 nav.innerHTML='<div class="om-nav2-brand"><img src="assets/won-muslim-logo.svg" alt=""><span>ONE MUSLIM</span></div><div class="om-nav2-desktop-links"><button type="button" data-desktop-nav="public-home">Home</button><button type="button" data-desktop-nav="feed">Feed</button><button type="button" data-desktop-nav="communities">Communities</button><button type="button" data-desktop-nav="profiles">People</button><button type="button" data-desktop-nav="lessons">Learn</button></div><button class="om-nav2-trigger" id="omNav2Open" type="button">☰ <span>Menu</span><small>All areas</small></button><button class="om-nav2-back" id="omNav2Back" type="button">← Back</button>';
 app.prepend(nav);
 const overlay=document.createElement('div');overlay.id='omNav2Overlay';overlay.className='om-nav2-overlay';
 const panel=document.createElement('aside');panel.id='omNav2Panel';panel.className='om-nav2-panel';panel.setAttribute('aria-label','One Muslim navigation');
 panel.innerHTML='<div class="om-nav2-panel-head"><strong>Where do you want to go?</strong><button class="om-nav2-close" type="button">×</button></div><input class="om-nav2-search" id="omNav2Search" placeholder="Search navigation…" aria-label="Search navigation"><div id="omNav2Groups"></div><div class="om-nav2-footer"><button id="omNav2Signout" class="danger" type="button">Sign out</button><button class="om-nav2-close2" type="button">Close</button></div>';
 document.body.append(overlay,panel);
 const host=$('#omNav2Groups');
 function render(filter=''){
   host.innerHTML='';
   groups.forEach(g=>{const items=g.items.filter(x=>(x[2]+' '+x[3]).toLowerCase().includes(filter.toLowerCase())||!filter);if(!items.length)return;
    const sec=document.createElement('section');sec.className='om-nav2-group';sec.innerHTML='<div class="om-nav2-group-title">'+g.title+'</div><div class="om-nav2-items"></div>';
    const grid=$('.om-nav2-items',sec);
    items.forEach(x=>{const b=document.createElement('button');b.type='button';b.className='om-nav2-item';b.dataset.nav2=x[0];b.innerHTML='<span class="om-nav2-icon">'+x[1]+'</span><span class="om-nav2-copy"><b>'+x[2]+'</b><span>'+x[3]+'</span></span>';b.onclick=()=>{proxy(x[0]);close()};grid.append(b)});host.append(sec);
   });
 }
 function open(){overlay.classList.add('open');panel.classList.add('open');setTimeout(()=>$('#omNav2Search')?.focus(),50)}
 function close(){overlay.classList.remove('open');panel.classList.remove('open')}
 $('#omNav2Open').onclick=open;$('[data-desktop-nav]').forEach(b=>b.onclick=()=>{proxy(b.dataset.desktopNav);});$('.om-nav2-close',panel).onclick=close;$('.om-nav2-close2',panel).onclick=close;overlay.onclick=close;
 $('#omNav2Search').oninput=e=>render(e.target.value);
 $('#omNav2Signout').onclick=()=>window.OneMuslimLogout?.();
 $('#omNav2Back').onclick=()=>$('#appBack')?.click();
 render();
}
function boot(){if(!$('#appView'))return;init();new MutationObserver(()=>{if(!$('#omNav2')&&$('#appView'))init()}).observe(document.body,{childList:true,subtree:true})}
document.readyState==='loading'?document.addEventListener('DOMContentLoaded',boot):boot();
})();