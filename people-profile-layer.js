/* OneMuslim People profile cards — use the real saved OneMuslim background assets. */
(function(){
  'use strict';

  const ASSET='/assets/onemuslim/';
  const BACKGROUNDS={
    'default':{color:'#eef4ef',image:`url("${ASSET}pattern-light.svg")`},
    'Islamic Geometry':{color:'#fbf5e8',image:`url("${ASSET}pattern-light.svg")`},
    'Mosque Silhouette':{color:'#f7ecd6',image:`url("${ASSET}mosque-light.svg")`},
    'Islamic Arch':{color:'#f8f2e5',image:`url("${ASSET}arch-gold.svg")`},
    'Crescent & Stars':{color:'#0e2d27',image:`url("${ASSET}crescent-gold.svg"), url("${ASSET}pattern-dark.svg")`},
    'Luxury Gold':{color:'#fff8e8',image:`url("${ASSET}cinematic-golden-clouds.svg")`},
    'Emerald':{color:'#0d4b3d',image:`url("${ASSET}pattern-dark.svg")`},
    'Dark Mosque':{color:'#061e1a',image:`url("${ASSET}mosque-dark.svg")`},
    'Minimal Cream':{color:'#fffdf8',image:`url("${ASSET}corner-ornament.svg"), url("${ASSET}pattern-light.svg")`}
  };

  const ACCENTS={emerald:'#1f6a55',gold:'#c89d3c',navy:'#31506b',plum:'#694d72',ruby:'#8b4650',silver:'#7d858c'};

  function background(profile){
    const saved=profile?.profile_background||profile?.avatar_config?.background||'default';
    if(typeof saved==='string' && saved.startsWith('linear-gradient')){
      return {color:'#eef4ef',image:saved};
    }
    return BACKGROUNDS[saved] || BACKGROUNDS.default;
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
      card.style.setProperty('--om-people-bg-color',bg.color);
      card.style.setProperty('--om-people-bg-image',bg.image);
      card.style.setProperty('--om-people-accent',accent(profile.profile_accent));

      let banner=card.querySelector(':scope > .om-people-banner');
      if(!banner){
        banner=document.createElement('div');
        banner.className='om-people-banner';
        banner.setAttribute('aria-hidden','true');
        card.prepend(banner);
      }
      banner.style.backgroundColor=bg.color;
      banner.style.backgroundImage=bg.image;
      banner.style.backgroundPosition='center';
      banner.style.backgroundRepeat='no-repeat';
      banner.style.backgroundSize='cover';
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
      .profiles-grid .om-people-banner{height:104px;width:100%;display:block;margin:0;border-radius:23px 23px 0 0;position:relative;overflow:hidden}
      .profiles-grid .om-people-banner::after{content:"";position:absolute;inset:0;background:linear-gradient(to bottom,rgba(255,255,255,.04),rgba(0,0,0,.08));pointer-events:none}
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
