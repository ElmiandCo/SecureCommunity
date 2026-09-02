/* OneMuslim People profile cards — show each member's saved background. */
(function(){
  'use strict';

  const BACKGROUNDS={
    'default':'linear-gradient(135deg,#eef4ef,#dfece5)',
    'Islamic Geometry':'linear-gradient(135deg,#fbf5e8,#f1e6cf)',
    'Mosque Silhouette':'linear-gradient(135deg,#f7ecd6,#ead8b5)',
    'Islamic Arch':'linear-gradient(135deg,#f8f2e5,#e9dfcc)',
    'Crescent & Stars':'linear-gradient(135deg,#0e2d27,#193f35)',
    'Luxury Gold':'linear-gradient(135deg,#fff8e8,#d8b66a)',
    'Emerald':'linear-gradient(135deg,#0d4b3d,#1f6b57)',
    'Dark Mosque':'linear-gradient(135deg,#061e1a,#173a31)',
    'Minimal Cream':'linear-gradient(135deg,#fffdf8,#f4f0e7)'
  };

  const ACCENTS={emerald:'#1f6a55',gold:'#c89d3c',navy:'#31506b',plum:'#694d72',ruby:'#8b4650',silver:'#7d858c'};

  function background(profile){
    const saved=profile?.profile_background||profile?.avatar_config?.background||'default';
    return BACKGROUNDS[saved] || (typeof saved==='string'&&saved.startsWith('linear-gradient')?saved:BACKGROUNDS.default);
  }
  function accent(value){return ACCENTS[value]||value||ACCENTS.emerald;}

  async function decorate(){
    const grid=document.getElementById('profilesGrid');
    const client=window.OneMuslimSupabaseClient?.getClient?.();
    if(!grid||!client)return;

    const cards=[...grid.querySelectorAll(':scope > .profile-card')];
    if(!cards.length)return;

    const usernames=cards.map(card=>{
      const el=[...card.querySelectorAll('p')].find(x=>x.textContent.trim().startsWith('@'));
      return el?.textContent.trim().slice(1)||'';
    }).filter(Boolean);
    if(!usernames.length)return;

    const {data,error}=await client.from('profiles').select('id,username,profile_background,avatar_config,profile_accent').in('username',usernames);
    if(error||!Array.isArray(data))return;

    const byUsername=new Map(data.map(p=>[String(p.username||'').toLowerCase(),p]));
    cards.forEach(card=>{
      const usernameEl=[...card.querySelectorAll('p')].find(x=>x.textContent.trim().startsWith('@'));
      const username=usernameEl?.textContent.trim().slice(1)||'';
      const profile=byUsername.get(username.toLowerCase());
      if(!profile)return;

      const bg=background(profile);
      card.classList.add('om-people-profile-card');
      card.style.setProperty('--om-people-bg',bg);
      card.style.setProperty('--om-people-accent',accent(profile.profile_accent));

      let banner=card.querySelector(':scope > .om-people-banner');
      if(!banner){
        banner=document.createElement('div');
        banner.className='om-people-banner';
        banner.setAttribute('aria-hidden','true');
        card.prepend(banner);
      }
      banner.style.background=bg;
      card.dataset.omPeopleLayered='1';
    });
  }

  function injectStyle(){
    if(document.getElementById('om-people-profile-layer-style'))return;
    const style=document.createElement('style');
    style.id='om-people-profile-layer-style';
    style.textContent=`
      .profiles-grid .om-people-profile-card{position:relative;overflow:hidden;border:1px solid color-mix(in srgb,var(--om-people-accent) 25%,#d8ddd8);border-radius:24px;background:#fff;box-shadow:0 12px 32px rgba(22,45,36,.10);transition:transform .18s ease,box-shadow .18s ease}
      .profiles-grid .om-people-profile-card:hover{transform:translateY(-3px);box-shadow:0 18px 42px rgba(22,45,36,.14)}
      .profiles-grid .om-people-banner{height:104px;width:100%;display:block;margin:0;border-radius:23px 23px 0 0}
      .profiles-grid .om-people-profile-card>.avatar{position:relative;margin-top:-38px;margin-left:20px;border:5px solid #fff;z-index:2}
      .profiles-grid .om-people-profile-card>h3,.profiles-grid .om-people-profile-card>p,.profiles-grid .om-people-profile-card>.member-card-actions{position:relative;z-index:2}
      @media(max-width:640px){.profiles-grid .om-people-banner{height:92px}.profiles-grid .om-people-profile-card>.avatar{margin-top:-32px;margin-left:16px}}
    `;
    document.head.appendChild(style);
  }

  function init(){
    injectStyle();
    const run=()=>decorate();
    run();
    const grid=document.getElementById('profilesGrid');
    if(grid&&!grid.dataset.omPeopleObserver){
      grid.dataset.omPeopleObserver='1';
      new MutationObserver(run).observe(grid,{childList:true});
    }
  }

  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();
  window.OneMuslimPeopleProfileLayer={refresh:decorate};
})();
