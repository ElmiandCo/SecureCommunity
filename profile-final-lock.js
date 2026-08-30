/* OneMuslim Profile Final Lock — the last authority for the authenticated profile editor. */
(function(){
  'use strict';
  let opening=false;
  const $=s=>document.querySelector(s);
  const profile=()=>window.profile||{};
  const esc=v=>String(v??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[m]));

  function openBuilder(){
    if(opening)return;
    const open=window.OneMuslimProfileBuilder?.open||window.OneMuslimOpenProfileEditor||window.openProfileBuilder||window.openProfileEditor;
    if(typeof open!=='function'){window.toast?.('Profile builder is still loading. Please try again.');return;}
    opening=true;
    Promise.resolve(open()).finally(()=>{opening=false});
  }

  function avatar(){
    const p=profile();
    if(p.avatar_package==='platinum_package') return `assets/avatars/${p.avatar_gender==='female'?'platinum-female.PNG':'platinum-male.PNG'}`;
    if(p.avatar_url)return p.avatar_url;
    if(p.avatar_config&&typeof p.avatar_config==='object')return p.avatar_config.asset||p.avatar_config.url||'';
    return '';
  }

  function bg(){
    const p=profile();
    const map={
      'Islamic Geometry':'linear-gradient(135deg,#0f4b3d,#1d6b58)',
      'Mosque Silhouette':'linear-gradient(135deg,#f1dfbb,#d2b77a)',
      'Islamic Arch':'linear-gradient(135deg,#eee2c9,#c9b58d)',
      'Crescent & Stars':'linear-gradient(135deg,#0b2630,#173f52)',
      'Luxury Gold':'linear-gradient(135deg,#fff5d9,#c89d3c)',
      'Emerald':'linear-gradient(135deg,#0d4b3d,#1f6b57)',
      'Dark Mosque':'linear-gradient(135deg,#061e1a,#173a31)',
      'Minimal Cream':'linear-gradient(135deg,#fffdf8,#eee8dc)',
      'default':'linear-gradient(135deg,#0e4437,#214e42)'
    };
    return map[p.profile_background]||map.default;
  }

  function styles(){
    if($('#om-final-card-style'))return;
    const s=document.createElement('style');s.id='om-final-card-style';s.textContent=`
      .om-final-card{position:relative;overflow:hidden;margin:32px 0 20px;border:1px solid #e5dfd0;border-radius:28px;min-height:270px;background:#fff;box-shadow:0 18px 55px rgba(18,48,39,.09)}
      .om-final-card-bg{position:absolute;inset:0;background-size:cover;background-position:center}
      .om-final-card-bg:after{content:"";position:absolute;inset:0;background:linear-gradient(180deg,rgba(5,34,27,.08),rgba(255,255,255,.08) 40%,rgba(255,255,255,.96) 70%)}
      .om-final-card-fg{position:relative;z-index:1;margin-top:92px;background:rgba(255,255,255,.96);border-radius:34px 34px 28px 28px;padding:26px 22px 22px}
      .om-final-head{display:flex;align-items:center;gap:14px}.om-final-avatar{width:76px;height:76px;border-radius:50%;border:5px solid #fff;box-shadow:0 8px 22px #0002;background:#b9cbbf;overflow:hidden;display:flex;align-items:center;justify-content:center;font-size:25px;font-weight:800;color:#173c31;flex:none}.om-final-avatar img{width:100%;height:100%;object-fit:contain}.om-final-name{font-size:24px;font-weight:800;color:#18362c}.om-final-user{font-size:14px;color:#708078;margin-top:3px}.om-final-rank{margin-left:auto;text-align:right}.om-final-rank strong{display:block;color:#c89d3c;font-size:17px}.om-final-rank span{font-size:11px;color:#61756b}.om-final-progress{height:8px;border-radius:99px;background:#e5ece8;overflow:hidden;margin:18px 0 7px}.om-final-progress i{display:block;height:100%;background:linear-gradient(90deg,#1f6a55,#c89d3c)}.om-final-xp{text-align:right;font-size:11px;color:#63766d}.om-final-stats{display:grid;grid-template-columns:repeat(3,1fr);gap:8px;border-top:1px solid #eee9df;margin-top:16px;padding-top:14px}.om-final-stat{text-align:center}.om-final-stat b{display:block;color:#1d4e40;font-size:19px}.om-final-stat span{font-size:11px;color:#728078}.om-final-actions{margin-top:18px;display:flex;gap:10px;flex-wrap:wrap}.om-final-actions button{border:1px solid #1f6a55;border-radius:999px;background:#fff;color:#1f6a55;padding:11px 18px;font-size:15px;font-weight:700}
    `;document.head.appendChild(s);
  }

  function rank(){
    const p=profile(), xp=Number(p.xp_total??p.xp??0)||0;
    const tier=window.OneMuslimProfileSystem?.getTier?.(p);
    const label=tier?.label||p.profile_title||'Muslim';
    const idx=window.OneMuslimProfileSystem?.rankIndex?.(label);
    return {xp,label,index:Number.isFinite(idx)?idx+1:1};
  }

  function renderCard(){
    const panel=$('#profilePanel'), button=$('#editProfile');
    if(!panel||!button)return;
    if(panel.querySelector('.om-final-card'))return;
    styles();
    const p=profile(), r=rank(), src=avatar();
    const name=p.display_name||`${p.first_name||''} ${p.last_name||''}`.trim()||'Your Name';
    const badges=Number(p.badges_count??p.badges??0)||0;
    const following=Number(p.following_count??p.following??0)||0;
    const html=`<article class="om-final-card"><div class="om-final-card-bg" style="background:${bg()}"></div><div class="om-final-card-fg"><div class="om-final-head"><div class="om-final-avatar">${src?`<img src="${esc(src)}" alt="Selected avatar">`:esc((name.match(/\b\w/g)||[]).slice(0,2).join('').toUpperCase())}</div><div><div class="om-final-name">${esc(name)}</div><div class="om-final-user">@${esc(p.username||'username')}</div></div><div class="om-final-rank"><strong>Rank ${r.index}</strong><span>${esc(r.label)}</span></div></div><div class="om-final-progress"><i style="width:${Math.min(100,(r.xp%5000)/50)}%"></i></div><div class="om-final-xp">${r.xp.toLocaleString()} XP</div><div class="om-final-stats"><div class="om-final-stat"><b>${r.xp.toLocaleString()}</b><span>Total XP</span></div><div class="om-final-stat"><b>${badges}</b><span>Badges</span></div><div class="om-final-stat"><b>${following}</b><span>Following</span></div></div><div class="om-final-actions"><button type="button" data-final-edit>Edit profile</button></div></div></article>`;
    button.insertAdjacentHTML('afterend',html);
    const newBtn=panel.querySelector('[data-final-edit]');
    if(newBtn)newBtn.addEventListener('click',e=>{e.preventDefault();e.stopPropagation();openBuilder()},true);
  }

  function cleanLegacy(){
    const panel=$('#profilePanel');
    if(!panel)return;
    const legacy=panel.querySelector('.profile-form,#saveProfile');
    if(legacy){
      // If the legacy editor has already rendered, do not let it remain visible.
      panel.innerHTML='';
      openBuilder();
      return;
    }
    const oldBtn=$('#editProfile');
    if(oldBtn&&!oldBtn.dataset.finalLocked){
      oldBtn.dataset.finalLocked='1';
      oldBtn.addEventListener('click',e=>{e.preventDefault();e.stopImmediatePropagation();openBuilder()},true);
    }
    renderCard();
  }

  function init(){
    document.addEventListener('click',e=>{
      const b=e.target.closest?.('#editProfile');
      if(!b)return;
      e.preventDefault();e.stopImmediatePropagation();openBuilder();
    },true);
    cleanLegacy();
    new MutationObserver(()=>cleanLegacy()).observe(document.body,{childList:true,subtree:true});
    [100,400,900,1800,3000].forEach(ms=>setTimeout(cleanLegacy,ms));
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();
})();
