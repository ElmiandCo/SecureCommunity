/* OneMuslim Profile Runtime Lock — final authority for My Profile editing. */
(function(){
  'use strict';
  let opening=false;
  const q=s=>document.querySelector(s);
  const p=()=>window.profile||{};
  const esc=v=>String(v??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[m]));

  function openBuilder(){
    if(opening)return;
    const open=window.OneMuslimProfileBuilder?.open||window.OneMuslimOpenProfileEditor||window.openProfileBuilder||window.openProfileEditor;
    if(typeof open!=='function'){window.toast?.('Profile builder is still loading. Please try again.');return;}
    opening=true;
    try{Promise.resolve(open()).finally(()=>{opening=false})}catch(e){opening=false;console.error(e);window.toast?.('Profile builder could not be opened.');}
  }

  // Replace the legacy app.js editProfile function before the authenticated app renders.
  window.editProfile=openBuilder;

  function avatar(){
    const x=p();
    if(x.avatar_package==='platinum_package')return `assets/avatars/${x.avatar_gender==='female'?'platinum-female.PNG':'platinum-male.PNG'}`;
    if(x.avatar_url)return x.avatar_url;
    if(x.avatar_config&&typeof x.avatar_config==='object')return x.avatar_config.asset||x.avatar_config.url||'';
    return '';
  }
  function background(){
    const x=p();
    return ({
      'Islamic Geometry':'linear-gradient(135deg,#0f4b3d,#1d6b58)',
      'Mosque Silhouette':'linear-gradient(135deg,#f1dfbb,#d2b77a)',
      'Islamic Arch':'linear-gradient(135deg,#eee2c9,#c9b58d)',
      'Crescent & Stars':'linear-gradient(135deg,#0b2630,#173f52)',
      'Luxury Gold':'linear-gradient(135deg,#fff5d9,#c89d3c)',
      'Emerald':'linear-gradient(135deg,#0d4b3d,#1f6b57)',
      'Dark Mosque':'linear-gradient(135deg,#061e1a,#173a31)',
      'Minimal Cream':'linear-gradient(135deg,#fffdf8,#eee8dc)',
      'default':'linear-gradient(135deg,#0e4437,#214e42)'
    })[x.profile_background]||'linear-gradient(135deg,#0e4437,#214e42)';
  }
  function styles(){
    if(q('#om-runtime-card-style'))return;
    const s=document.createElement('style');s.id='om-runtime-card-style';s.textContent=`
      .om-runtime-card{position:relative;overflow:hidden;margin:32px 0 20px;border:1px solid #e5dfd0;border-radius:28px;min-height:270px;background:#fff;box-shadow:0 18px 55px rgba(18,48,39,.09)}
      .om-runtime-bg{position:absolute;inset:0;background-size:cover;background-position:center}.om-runtime-bg:after{content:"";position:absolute;inset:0;background:linear-gradient(180deg,rgba(5,34,27,.08),rgba(255,255,255,.08) 40%,rgba(255,255,255,.96) 70%)}
      .om-runtime-fg{position:relative;z-index:1;margin-top:92px;background:rgba(255,255,255,.96);border-radius:34px 34px 28px 28px;padding:26px 22px 22px}.om-runtime-head{display:flex;align-items:center;gap:14px}.om-runtime-avatar{width:76px;height:76px;border-radius:50%;border:5px solid #fff;box-shadow:0 8px 22px #0002;background:#b9cbbf;overflow:hidden;display:flex;align-items:center;justify-content:center;font-size:25px;font-weight:800;color:#173c31;flex:none}.om-runtime-avatar img{width:100%;height:100%;object-fit:contain}.om-runtime-name{font-size:24px;font-weight:800;color:#18362c}.om-runtime-user{font-size:14px;color:#708078;margin-top:3px}.om-runtime-rank{margin-left:auto;text-align:right}.om-runtime-rank strong{display:block;color:#c89d3c;font-size:17px}.om-runtime-rank span{font-size:11px;color:#61756b}.om-runtime-progress{height:8px;border-radius:99px;background:#e5ece8;overflow:hidden;margin:18px 0 7px}.om-runtime-progress i{display:block;height:100%;background:linear-gradient(90deg,#1f6a55,#c89d3c)}.om-runtime-xp{text-align:right;font-size:11px;color:#63766d}.om-runtime-stats{display:grid;grid-template-columns:repeat(3,1fr);gap:8px;border-top:1px solid #eee9df;margin-top:16px;padding-top:14px}.om-runtime-stat{text-align:center}.om-runtime-stat b{display:block;color:#1d4e40;font-size:19px}.om-runtime-stat span{font-size:11px;color:#728078}.om-runtime-actions{margin-top:18px}.om-runtime-actions button{border:1px solid #1f6a55;border-radius:999px;background:#fff;color:#1f6a55;padding:11px 18px;font-size:15px;font-weight:700}
    `;document.head.appendChild(s);
  }
  function renderCard(){
    const panel=q('#profilePanel'), button=q('#editProfile');
    if(!panel||!button||panel.querySelector('.om-runtime-card,.om-personal-card'))return;
    styles();
    const x=p(), xp=Number(x.xp_total??x.xp??0)||0, name=x.display_name||`${x.first_name||''} ${x.last_name||''}`.trim()||'Your Name';
    const tier=window.OneMuslimProfileSystem?.getTier?.(x), label=tier?.label||x.profile_title||'Muslim';
    const idx=window.OneMuslimProfileSystem?.rankIndex?.(label); const rank=Number.isFinite(idx)?idx+1:1;
    const badges=Number(x.badges_count??x.badges??0)||0, following=Number(x.following_count??x.following??0)||0, src=avatar();
    const card=document.createElement('article');card.className='om-runtime-card';card.innerHTML=`<div class="om-runtime-bg" style="background:${background()}"></div><div class="om-runtime-fg"><div class="om-runtime-head"><div class="om-runtime-avatar">${src?`<img src="${esc(src)}" alt="Selected avatar">`:esc((name.match(/\\b\\w/g)||[]).slice(0,2).join('').toUpperCase())}</div><div><div class="om-runtime-name">${esc(name)}</div><div class="om-runtime-user">@${esc(x.username||'username')}</div></div><div class="om-runtime-rank"><strong>Rank ${rank}</strong><span>${esc(label)}</span></div></div><div class="om-runtime-progress"><i style="width:${Math.min(100,(xp%5000)/50)}%"></i></div><div class="om-runtime-xp">${xp.toLocaleString()} XP</div><div class="om-runtime-stats"><div class="om-runtime-stat"><b>${xp.toLocaleString()}</b><span>Total XP</span></div><div class="om-runtime-stat"><b>${badges}</b><span>Badges</span></div><div class="om-runtime-stat"><b>${following}</b><span>Following</span></div></div><div class="om-runtime-actions"><button type="button">Edit profile</button></div></div>`;
    button.insertAdjacentElement('afterend',card);
    card.querySelector('button').onclick=e=>{e.preventDefault();e.stopPropagation();openBuilder()};
  }
  function guard(){
    const panel=q('#profilePanel');
    if(!panel)return;
    // If the old editor has already rendered, immediately replace it with the real builder.
    if(panel.querySelector('.profile-form,#saveProfile')){panel.innerHTML='';openBuilder();return;}
    const old=q('#editProfile');
    if(old&&!old.dataset.runtimeLocked){old.dataset.runtimeLocked='1';old.addEventListener('click',e=>{e.preventDefault();e.stopImmediatePropagation();openBuilder()},true)}
    renderCard();
  }
  document.addEventListener('click',e=>{const b=e.target.closest?.('#editProfile');if(!b)return;e.preventDefault();e.stopImmediatePropagation();openBuilder()},true);
  const start=()=>{guard();new MutationObserver(()=>guard()).observe(document.body,{childList:true,subtree:true});[100,400,900,1800,3000].forEach(ms=>setTimeout(guard,ms));};
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start);else start();
})();
