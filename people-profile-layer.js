/* OneMuslim People profile cards — saved profile color + avatar presentation. */
(function(){
  'use strict';

  const BG={
    default:'#eef4ef',
    cream:'#f5efe2',
    sand:'#eee3cf',
    sky:'#e4f0f5',
    rose:'#f3e4e7',
    lavender:'#ebe6f3',
    charcoal:'#2d3532',
    emerald:'#dfece5'
  };

  const ACCENTS={
    emerald:'#1f6a55',
    gold:'#c89d3c',
    navy:'#31506b',
    plum:'#694d72',
    ruby:'#8b4650',
    silver:'#7d858c'
  };

  function esc(v){return String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));}
  function background(value){return BG[value]||value||BG.default;}
  function accent(value){return ACCENTS[value]||value||ACCENTS.emerald;}
  function avatar(profile){
    try{
      if(window.OneMuslimProfileSystem?.getAvatarAsset)return window.OneMuslimProfileSystem.getAvatarAsset(profile);
    }catch(e){}
    return profile.avatar_url||'';
  }

  async function decorate(){
    const grid=document.getElementById('profilesGrid');
    const client=window.OneMuslimSupabaseClient?.getClient?.();
    if(!grid||!client)return;

    const cards=[...grid.querySelectorAll(':scope > .profile-card')].filter(c=>!c.dataset.omPeopleLayered);
    if(!cards.length)return;

    const usernames=cards.map(card=>{
      const p=[...card.querySelectorAll('p')].find(x=>x.textContent.trim().startsWith('@'));
      return p?p.textContent.trim().slice(1):'';
    }).filter(Boolean);
    if(!usernames.length)return;

    const {data,error}=await client.from('profiles').select('id,username,display_name,first_name,last_name,bio,avatar_url,avatar_gender,avatar_package,avatar_config,custom_photo,profile_background,profile_accent,profile_title').in('username',usernames);
    if(error||!Array.isArray(data))return;

    const byUsername=new Map(data.map(p=>[String(p.username||'').toLowerCase(),p]));
    cards.forEach(card=>{
      if(card.dataset.omPeopleLayered==='1')return;
      const usernameEl=[...card.querySelectorAll('p')].find(x=>x.textContent.trim().startsWith('@'));
      const username=usernameEl?.textContent.trim().slice(1)||'';
      const p=byUsername.get(username.toLowerCase());
      if(!p)return;

      const bg=background(p.profile_background);
      const ac=accent(p.profile_accent);
      const img=avatar(p);
      const name=p.display_name||[p.first_name,p.last_name].filter(Boolean).join(' ')||p.username||'Member';
      const title=p.profile_title||'';

      card.classList.add('om-people-profile-card');
      card.style.setProperty('--om-people-bg',bg);
      card.style.setProperty('--om-people-accent',ac);
      card.innerHTML=`
        <div class="om-people-banner" aria-hidden="true">
          <span class="om-people-banner-pill">${esc(title||'MEMBER')}</span>
        </div>
        <div class="om-people-body">
          <div class="om-people-avatar">${img?`<img src="${esc(img)}" alt="">`:`<span>${esc((name||'M').charAt(0).toUpperCase())}</span>`}</div>
          <div class="om-people-identity">
            <h3>${esc(name)}</h3>
            <p class="om-people-username">@${esc(p.username||'')}</p>
          </div>
          ${p.bio?`<p class="om-people-bio">${esc(p.bio)}</p>`:''}
        </div>`;
      card.dataset.omPeopleLayered='1';
    });
  }

  function injectStyle(){
    if(document.getElementById('om-people-profile-layer-style'))return;
    const style=document.createElement('style');
    style.id='om-people-profile-layer-style';
    style.textContent=`
      .profiles-grid .om-people-profile-card{position:relative;overflow:hidden;padding:0!important;border:1px solid color-mix(in srgb,var(--om-people-accent) 25%,#d8ddd8);border-radius:24px;background:var(--om-people-bg);box-shadow:0 12px 32px rgba(22,45,36,.10);transition:transform .18s ease,box-shadow .18s ease}
      .profiles-grid .om-people-profile-card:hover{transform:translateY(-3px);box-shadow:0 18px 42px rgba(22,45,36,.14)}
      .om-people-banner{height:108px;background:linear-gradient(135deg,var(--om-people-accent),color-mix(in srgb,var(--om-people-accent) 55%,var(--om-people-bg)));padding:14px;display:flex;justify-content:flex-end;align-items:flex-start}
      .om-people-banner-pill{font-size:9px;font-weight:900;letter-spacing:.13em;text-transform:uppercase;padding:7px 9px;border-radius:999px;background:rgba(255,255,255,.82);color:var(--om-people-accent);border:1px solid rgba(255,255,255,.72);backdrop-filter:blur(7px)}
      .om-people-body{position:relative;padding:0 20px 20px;margin-top:-42px}
      .om-people-avatar{width:84px;height:84px;border-radius:50%;overflow:hidden;display:grid;place-items:center;background:linear-gradient(135deg,#b9cbbf,#234d40);border:5px solid rgba(255,255,255,.94);box-shadow:0 9px 22px rgba(0,0,0,.16);font-size:28px;font-weight:900;color:#fff}
      .om-people-avatar img{width:100%;height:100%;object-fit:cover;display:block}
      .om-people-identity{margin-top:12px}.om-people-identity h3{margin:0;font-size:21px;line-height:1.15;color:#20352c}.om-people-username{margin:5px 0 0!important;color:#66766e!important;font-size:13px!important}
      .om-people-bio{margin:12px 0 0!important;color:#3e5148!important;font-size:14px!important;line-height:1.45!important}
      @media(max-width:640px){.om-people-banner{height:92px}.om-people-body{padding:0 16px 18px}.om-people-avatar{width:72px;height:72px}.om-people-identity h3{font-size:19px}}
    `;
    document.head.appendChild(style);
  }

  function init(){
    injectStyle();
    decorate();
    const grid=document.getElementById('profilesGrid');
    if(grid&&!grid.dataset.omPeopleObserver){
      grid.dataset.omPeopleObserver='1';
      new MutationObserver(()=>decorate()).observe(grid,{childList:true});
    }
  }

  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();
  window.OneMuslimPeopleProfileLayer={refresh:decorate};
})();
