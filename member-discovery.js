(() => {
  const {createClient}=window.supabase||{};
  const cfg=window.APP_CONFIG||{};
  if(!createClient)return;
  const db=createClient(cfg.SUPABASE_URL,cfg.SUPABASE_ANON_KEY,{auth:{persistSession:true,autoRefreshToken:true,detectSessionInUrl:true}});
  const esc=s=>String(s??'').replace(/[&<>\"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;',"'":'&#039;'}[m]));
  const name=u=>u?.display_name||`${u?.first_name||''} ${u?.last_name||''}`.trim()||'Member';
  const profileSystem=()=>window.OneMuslimProfileSystem||null;
  const xp=u=>Number(u?.xp_total??u?.xp??u?.rank_points??u?.points??0)||0;
  const gender=u=>{const c=u?.avatar_config&&typeof u.avatar_config==='object'?u.avatar_config:{};return (u?.avatar_gender||c.gender||'male')==='female'?'female':'male'};
  const backgroundName=u=>u?.profile_background||u?.avatar_config?.background||'default';
  const hasDesign=u=>{const b=String(backgroundName(u)||'default');return b!=='default'&&b!=='Minimal Cream'};
  const isPlatinum=u=>xp(u)>=10000;
  const avatarUrl=u=>{const ps=profileSystem(),g=gender(u);if(ps)return isPlatinum(u)?ps.getPlatinumAvatarAsset(g):ps.getRegularAvatarAsset(g);return isPlatinum(u)?`/assets/avatar/platinum/platinum-${g}.PNG`:`/assets/avatar/base/avatar-master-${g}.jpeg`};
  const background=u=>{const b=String(backgroundName(u)||'');return b&&b!=='default'&&b!=='Minimal Cream'?b:''};
  const icon={
    profile:'<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="8" r="3.2"/><path d="M5.5 20c.6-3.5 2.8-5.2 6.5-5.2s5.9 1.7 6.5 5.2"/></svg>',
    message:'<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 5.5h14v10H9l-4 3v-13Z"/><path d="M8 9.5h8M8 12.5h5"/></svg>',
    follow:'<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="9" cy="8" r="3"/><path d="M3.8 19c.5-3.1 2.2-4.7 5.2-4.7s4.7 1.6 5.2 4.7M17 9v6M14 12h6"/></svg>'
  };

  function addStyles(){
    if(document.getElementById('memberDiscoveryStylesV3'))return;
    const s=document.createElement('style');s.id='memberDiscoveryStylesV3';s.textContent=`
      .people-empty{grid-column:1/-1;padding:50px 20px;text-align:center;border:1px dashed #ccd8e8;border-radius:18px;background:#fff;color:#687991}
      .people-card-top{position:relative;display:flex;justify-content:center;align-items:flex-end;height:106px;margin:0 -18px 0;padding-top:12px;box-sizing:border-box;background:linear-gradient(180deg,#f1f5fa 0%,#f8fafc 100%);overflow:visible}
      .people-card-top.has-bg{background-position:center;background-size:cover}
      .people-card-top.has-bg:after{content:"";position:absolute;inset:0;background:linear-gradient(180deg,rgba(8,20,37,.08),rgba(8,20,37,.28));pointer-events:none}
      .people-card-avatar-wrap{position:relative;z-index:3;width:86px;height:86px;flex:0 0 86px}
      .people-card-avatar{display:block;width:86px!important;height:86px!important;border-radius:50%!important;object-fit:cover!important;border:5px solid #fff!important;box-shadow:0 8px 22px rgba(21,35,59,.18)!important;background:#e9eef6!important;margin:0!important}
      .people-card-avatar-wrap .status-dot{position:absolute;right:1px;bottom:5px;width:13px;height:13px;border-radius:50%;background:#20c77a;border:3px solid #fff}
      .people-card-body{display:flex;flex-direction:column;flex:1;min-height:0;padding-top:13px}
      .people-card-heading{display:flex;align-items:flex-start;justify-content:space-between;gap:8px}
      .people-card-heading h3{min-width:0;overflow-wrap:anywhere}
      .people-card-more{width:32px;height:32px;border:0;border-radius:9px;background:#f1f5f9;color:#5d6e88;font-size:18px;line-height:1;cursor:pointer;flex:0 0 32px}
      .people-card-more:hover{background:#e5edf7;color:#19345b}
      .people-card-meta{display:flex;align-items:center;gap:7px;flex-wrap:wrap;margin-top:2px}
      .people-card-meta .username{color:#6b7b93;font-size:12px}
      .people-card-location{display:flex;align-items:center;gap:5px;margin:9px 0 3px;color:#64748b;font-size:11px;font-weight:650}
      .people-card-location svg{width:13px;height:13px;fill:none;stroke:currentColor;stroke-width:1.8}
      .people-card-bio{margin:5px 0!important;color:#52657f!important;font-size:12px!important;line-height:1.45!important;display:-webkit-box!important;-webkit-line-clamp:3!important;-webkit-box-orient:vertical!important;overflow:hidden!important;min-height:52px!important}
      .member-card-actions{display:grid!important;grid-template-columns:1fr 1fr 1fr!important;gap:8px!important;margin-top:auto!important;padding-top:13px!important}
      .member-card-actions button{width:100%!important;height:40px!important;border-radius:11px!important;font-size:0!important;font-weight:800!important;cursor:pointer!important;display:grid!important;place-items:center!important;box-sizing:border-box!important}
      .member-card-actions button svg{width:18px!important;height:18px!important;fill:none!important;stroke:currentColor!important;stroke-width:1.8!important;stroke-linecap:round!important;stroke-linejoin:round!important}
      .member-card-actions .primary{background:#135f56!important;color:#fff!important;border:1px solid #135f56!important;box-shadow:0 7px 16px rgba(19,95,86,.16)!important}
      .member-card-actions .outline{background:#f1f5f8!important;color:#1b5b54!important;border:1px solid #d8e2e7!important}
      .member-card-actions .outline:hover{background:#e6f0ef!important}
      .platinum-badge{display:inline-flex!important;align-items:center!important;gap:5px!important;width:max-content!important;padding:4px 8px!important;border-radius:999px!important;background:linear-gradient(135deg,#fafbfc,#d8dce1,#fff)!important;border:1px solid #b9c0c8!important;color:#4f5963!important;font-size:10px!important;font-weight:850!important}
      .design-badge{display:inline-flex!important;align-items:center!important;gap:5px!important;width:max-content!important;padding:4px 8px!important;border-radius:999px!important;background:#eef4ff!important;border:1px solid #d5e3ff!important;color:#315fae!important;font-size:10px!important;font-weight:800!important;margin:5px 0 0!important}
    `;document.head.appendChild(s)
  }

  async function members(){
    const user=(await db.auth.getUser()).data.user;
    if(!user)return[];
    const {data,error}=await db.from('profiles').select('*').neq('id',user.id).order('display_name');
    if(error){console.error(error);return[]}
    return data||[]
  }

  function card(u){
    const n=name(u),g=gender(u),plat=isPlatinum(u),design=hasDesign(u),tier=profileSystem()?.getTier?.(u);
    const location=[u.city,u.state,u.country].filter(Boolean).join(', ');
    const bg=background(u);
    const avatar=`<img class="people-card-avatar" src="${esc(avatarUrl(u))}" alt="${esc(n)} avatar" loading="lazy">`;
    const tierHtml=plat?`<span class="platinum-badge">✦ Platinum</span>`:'';
    const designHtml=design?`<span class="design-badge">✦ ${esc(bg)}</span>`:'';
    const xpHtml=plat&&tier?.label&&tier.label!=='Platinum'?`<span class="people-card-xp">${esc(tier.label)}</span>`:'';
    const locHtml=location?`<div class="people-card-location"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 21s6-5.1 6-11a6 6 0 1 0-12 0c0 5.9 6 11 6 11Z"/><circle cx="12" cy="10" r="2"/></svg>${esc(location)}</div>`:'';
    return `<article class="profile-card people-theme-card${plat?' is-platinum':''}" data-profile-id="${esc(u.id)}" data-profile-gender="${g}" data-platinum="${plat?'1':'0'}" data-profile-background="${esc(backgroundName(u))}">
      <div class="people-card-top${bg?' has-bg':''}"${bg?' style="background-image:url(\''+esc(bg)+'\')"':''}>
        <div class="people-card-avatar-wrap">${avatar}<span class="status-dot" aria-hidden="true"></span></div>
      </div>
      <div class="people-card-body">
        <div class="people-card-heading"><div><h3>${esc(n)}</h3><div class="people-card-meta"><span class="username">@${esc(u.username||'')}</span>${tierHtml}${xpHtml}</div></div><button class="people-card-more" type="button" aria-label="More options" title="More options">•••</button></div>
        ${locHtml}
        <p class="people-card-bio">${esc(u.bio||'Member of the OneMuslim community.')}</p>
        ${designHtml}
        <div class="member-card-actions">
          <button class="outline" type="button" data-view-profile="${esc(u.id)}" aria-label="View profile" title="View profile">${icon.profile}</button>
          <button class="primary" type="button" data-message-user="${esc(u.id)}" aria-label="Message" title="Message">${icon.message}</button>
          <button class="outline om-card-follow" type="button" data-follow-target="${esc(u.id)}" aria-label="Follow" title="Follow">${icon.follow}</button>
        </div>
      </div>
    </article>`
  }

  function buildShell(page){
    page.querySelector('.page-head')?.remove();page.querySelector('.people-hero')?.remove();page.querySelector('.people-controls')?.remove();
    const grid=document.getElementById('profilesGrid');if(!grid)return null;
    const hero=document.createElement('section');hero.className='people-hero';hero.innerHTML=`<div class="people-hero-copy"><span class="eyebrow">ONE MUSLIM COMMUNITY</span><h1>People</h1><p>Discover and connect with the OneMuslim community.</p></div><div class="people-hero-badge"><strong>🌙 A global community</strong><span>United by faith, knowledge, growth, and good deeds.</span></div>`;page.insertBefore(hero,grid);
    const controls=document.createElement('section');controls.className='people-controls';controls.innerHTML=`<div class="people-tabs" role="tablist" aria-label="People filters"><button class="people-tab active" data-people-tab="all">All Members</button><button class="people-tab" data-people-tab="male">Muslim Men</button><button class="people-tab" data-people-tab="female">Muslim Women</button><button class="people-tab platinum" data-people-tab="platinum">✦ Platinum</button><button class="people-tab" data-people-tab="designs">🎨 Designs</button></div><div class="people-search"><input id="memberQuery" placeholder="Search members…" aria-label="Search members"><select id="memberLocation" aria-label="Filter by location"><option value="">All locations</option></select><select id="memberCommunity" aria-label="Filter by community"><option value="">All communities</option></select><select id="memberSort" aria-label="Sort people"><option value="name">A–Z</option><option value="newest">Newest</option><option value="xp">XP</option></select></div>`;page.insertBefore(controls,grid);return{hero,controls,grid}
  }

  async function render(){
    const grid=document.getElementById('profilesGrid'),page=document.getElementById('profilesPage');if(!grid||!page)return;
    const rows=await members(),shell=buildShell(page);if(!shell)return;
    const {controls}=shell,qEl=controls.querySelector('#memberQuery'),locEl=controls.querySelector('#memberLocation'),commEl=controls.querySelector('#memberCommunity'),sortEl=controls.querySelector('#memberSort');
    const locs=[...new Set(rows.map(u=>[u.city,u.state,u.country].filter(Boolean).join(', ')).filter(Boolean))].sort();
    const comms=[...new Set(rows.map(u=>u.community).filter(Boolean))].sort();
    locs.forEach(x=>locEl.insertAdjacentHTML('beforeend',`<option value="${esc(x)}">${esc(x)}</option>`));
    comms.forEach(x=>commEl.insertAdjacentHTML('beforeend',`<option value="${esc(x)}">${esc(x)}</option>`));
    let tab='all';
    const filter=()=>{
      const q=(qEl.value||'').toLowerCase().trim(),loc=locEl.value,comm=commEl.value,sort=sortEl.value;
      let out=rows.filter(u=>{const text=`${name(u)} ${u.username||''} ${u.bio||''}`.toLowerCase(),locText=[u.city,u.state,u.country].filter(Boolean).join(', ');const matchTab=tab==='all'||(tab==='male'&&gender(u)==='male')||(tab==='female'&&gender(u)==='female')||(tab==='platinum'&&isPlatinum(u))||(tab==='designs'&&hasDesign(u));return matchTab&&(!q||text.includes(q))&&(!loc||locText===loc)&&(!comm||u.community===comm)});
      if(sort==='xp')out.sort((a,b)=>xp(b)-xp(a));else if(sort==='newest')out.sort((a,b)=>new Date(b.created_at||0)-new Date(a.created_at||0));else out.sort((a,b)=>name(a).localeCompare(name(b)));
      grid.innerHTML=out.map(card).join('')||`<div class="people-empty">No members match those filters.</div>`;wire();window.OneMuslimProfileFollows?.decorateCards?.();window.OneMuslimPeopleProfileLayer?.refresh?.();
    };
    controls.querySelectorAll('[data-people-tab]').forEach(btn=>btn.addEventListener('click',()=>{tab=btn.dataset.peopleTab;controls.querySelectorAll('[data-people-tab]').forEach(x=>x.classList.toggle('active',x===btn));filter()}));
    [qEl,locEl,commEl,sortEl].forEach(x=>x.addEventListener('input',filter));[locEl,commEl,sortEl].forEach(x=>x.addEventListener('change',filter));
    filter();
  }

  function wire(){
    document.querySelectorAll('[data-view-profile]').forEach(b=>b.onclick=()=>window.openUserProfile?.(b.dataset.viewProfile));
    document.querySelectorAll('[data-message-user]').forEach(b=>b.onclick=()=>window.openDmWith?.(b.dataset.messageUser));
  }

  addStyles();let booted=false;const tick=()=>{const page=document.getElementById('profilesPage');if(!page)return;if(!booted||!document.getElementById('memberQuery')){booted=true;render()}};setInterval(tick,1000);window.memberDiscoveryRender=render;
})();
