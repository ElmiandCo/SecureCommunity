(() => {
  const {createClient}=window.supabase||{};
  const cfg=window.APP_CONFIG||{};
  if(!createClient)return;
  const db=createClient(cfg.SUPABASE_URL,cfg.SUPABASE_ANON_KEY,{auth:{persistSession:true,autoRefreshToken:true,detectSessionInUrl:true}});
  const esc=s=>String(s??'').replace(/[&<>\"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;',"'":'&#039;'}[m]));
  const name=u=>u?.display_name||`${u?.first_name||''} ${u?.last_name||''}`.trim()||'Member';
  const profileSystem=()=>window.OneMuslimProfileSystem||null;
  const xp=u=>Number(u?.xp_total??u?.xp??u?.rank_points??u?.points??0)||0;
  const gender=u=>{const cfg=u?.avatar_config&&typeof u.avatar_config==='object'?u.avatar_config:{};return (u?.avatar_gender||cfg.gender||'male')==='female'?'female':'male'};
  const backgroundName=u=>u?.profile_background||u?.avatar_config?.background||'default';
  const hasDesign=u=>{const b=String(backgroundName(u)||'default');return b!=='default'&&b!=='Minimal Cream'};
  const isPlatinum=u=>xp(u)>=10000;
  const avatarUrl=u=>{
    const ps=profileSystem(),g=gender(u);
    if(ps){return isPlatinum(u)?ps.getPlatinumAvatarAsset(g):ps.getRegularAvatarAsset(g)}
    return isPlatinum(u)?`/assets/avatar/platinum/platinum-${g}.PNG`:`/assets/avatar/base/avatar-master-${g}.jpeg`;
  };
  const designLabel=u=>String(backgroundName(u)||'default');

  function addStyles(){
    if(document.getElementById('memberDiscoveryStylesV2'))return;
    const s=document.createElement('style');s.id='memberDiscoveryStylesV2';s.textContent=`
      .people-empty{grid-column:1/-1;padding:50px 20px;text-align:center;border:1px dashed #ccd8e8;border-radius:18px;background:#fff;color:#687991}
      .people-card-avatar-wrap{position:relative;height:0;z-index:4}
      .people-card-avatar{display:block;width:76px;height:76px;border-radius:50%;object-fit:cover;border:5px solid #fff;box-shadow:0 7px 20px rgba(21,35,59,.16);background:#e9eef6}
      .people-card-avatar-wrap .status-dot{position:absolute;left:59px;top:56px;width:12px;height:12px;border-radius:50%;background:#20c77a;border:3px solid #fff}
      .people-card-meta{display:flex;align-items:center;gap:7px;flex-wrap:wrap;margin-top:4px}
      .people-card-meta .username{color:#6b7b93;font-size:12px}
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
    const avatar=`<img class="people-card-avatar" src="${esc(avatarUrl(u))}" alt="${esc(n)} avatar" loading="lazy">`;
    const tierHtml=plat?`<span class="platinum-badge">✦ Platinum</span>`:'';
    const designHtml=design?`<span class="design-badge">✦ ${esc(designLabel(u))}</span>`:'';
    const xpHtml=plat&&tier?.label&&tier.label!=='Platinum'?`<span class="people-card-xp">${esc(tier.label)}</span>`:'';
    return `<div class="profile-card people-theme-card${plat?' is-platinum':''}" data-profile-id="${esc(u.id)}" data-profile-gender="${g}" data-platinum="${plat?'1':'0'}" data-profile-background="${esc(backgroundName(u))}">
      <div class="people-card-avatar-wrap">${avatar}<span class="status-dot" aria-hidden="true"></span></div>
      <div style="height:42px"></div>
      <h3>${esc(n)}</h3>
      <div class="people-card-meta"><span class="username">@${esc(u.username||'')}</span>${tierHtml}${xpHtml}</div>
      ${designHtml}
      <p>${esc(u.bio||'Member of the OneMuslim community.')}</p>
      <small>${esc(location||'Community member')}</small>
      <div class="member-card-actions">
        <button class="outline" data-view-profile="${esc(u.id)}">View Profile</button>
        <button class="primary" data-message-user="${esc(u.id)}">Message</button>
        <button class="outline om-card-follow" data-follow-target="${esc(u.id)}">Follow</button>
      </div>
    </div>`
  }

  function buildShell(page){
    page.querySelector('.page-head')?.remove();
    page.querySelector('.people-hero')?.remove();
    page.querySelector('.people-controls')?.remove();
    const grid=document.getElementById('profilesGrid');
    if(!grid)return null;
    const hero=document.createElement('section');
    hero.className='people-hero';
    hero.innerHTML=`<div class="people-hero-copy"><span class="eyebrow">ONE MUSLIM COMMUNITY</span><h1>People</h1><p>Discover and connect with the OneMuslim community.</p></div><div class="people-hero-badge"><strong>🌙 A global community</strong><span>United by faith, knowledge, growth, and good deeds.</span></div>`;
    page.insertBefore(hero,grid);
    const controls=document.createElement('section');
    controls.className='people-controls';
    controls.innerHTML=`
      <div class="people-tabs" role="tablist" aria-label="People filters">
        <button class="people-tab active" data-people-tab="all">All Members</button>
        <button class="people-tab" data-people-tab="male">Muslim Men</button>
        <button class="people-tab" data-people-tab="female">Muslim Women</button>
        <button class="people-tab platinum" data-people-tab="platinum">✦ Platinum</button>
        <button class="people-tab" data-people-tab="designs">🎨 Designs</button>
      </div>
      <div class="people-search">
        <input id="memberQuery" placeholder="Search members…" aria-label="Search members">
        <select id="memberLocation" aria-label="Filter by location"><option value="">All locations</option></select>
        <select id="memberCommunity" aria-label="Filter by community"><option value="">All communities</option></select>
        <select id="memberSort" aria-label="Sort people"><option value="name">A–Z</option><option value="newest">Newest</option><option value="xp">XP</option></select>
      </div>`;
    page.insertBefore(controls,grid);
    return {hero,controls,grid}
  }

  async function render(){
    const grid=document.getElementById('profilesGrid'),page=document.getElementById('profilesPage');
    if(!grid||!page)return;
    const rows=await members();
    const shell=buildShell(page);
    if(!shell)return;
    const {controls}=shell;
    const qEl=controls.querySelector('#memberQuery'),locEl=controls.querySelector('#memberLocation'),commEl=controls.querySelector('#memberCommunity'),sortEl=controls.querySelector('#memberSort');
    const locs=[...new Set(rows.map(u=>[u.city,u.state,u.country].filter(Boolean).join(', ')).filter(Boolean))].sort();
    const comms=[...new Set(rows.map(u=>u.community).filter(Boolean))].sort();
    locs.forEach(x=>locEl.insertAdjacentHTML('beforeend',`<option value="${esc(x)}">${esc(x)}</option>`));
    comms.forEach(x=>commEl.insertAdjacentHTML('beforeend',`<option value="${esc(x)}">${esc(x)}</option>`));
    let tab='all';
    const filter=()=>{
      const q=(qEl.value||'').toLowerCase().trim(),loc=locEl.value,comm=commEl.value,sort=sortEl.value;
      let out=rows.filter(u=>{
        const text=`${name(u)} ${u.username||''} ${u.bio||''}`.toLowerCase();
        const locText=[u.city,u.state,u.country].filter(Boolean).join(', ');
        const matchTab=tab==='all'||(tab==='male'&&gender(u)==='male')||(tab==='female'&&gender(u)==='female')||(tab==='platinum'&&isPlatinum(u))||(tab==='designs'&&hasDesign(u));
        return matchTab&&(!q||text.includes(q))&&(!loc||locText===loc)&&(!comm||u.community===comm)
      });
      if(sort==='xp')out.sort((a,b)=>xp(b)-xp(a));
      else if(sort==='newest')out.sort((a,b)=>new Date(b.created_at||0)-new Date(a.created_at||0));
      else out.sort((a,b)=>name(a).localeCompare(name(b)));
      grid.innerHTML=out.map(card).join('')||`<div class="people-empty">No members match those filters.</div>`;
      wire();
      window.OneMuslimProfileFollows?.decorateCards?.();
      window.OneMuslimPeopleProfileLayer?.refresh?.();
    };
    controls.querySelectorAll('[data-people-tab]').forEach(btn=>btn.addEventListener('click',()=>{
      tab=btn.dataset.peopleTab;
      controls.querySelectorAll('[data-people-tab]').forEach(x=>x.classList.toggle('active',x===btn));
      filter();
    }));
    [qEl,locEl,commEl,sortEl].forEach(x=>x.addEventListener('input',filter));
    [locEl,commEl,sortEl].forEach(x=>x.addEventListener('change',filter));
    filter();
  }

  function wire(){
    document.querySelectorAll('[data-view-profile]').forEach(b=>b.onclick=()=>window.openUserProfile?.(b.dataset.viewProfile));
    document.querySelectorAll('[data-message-user]').forEach(b=>b.onclick=()=>window.openDmWith?.(b.dataset.messageUser));
  }

  addStyles();
  let booted=false;
  const tick=()=>{
    const page=document.getElementById('profilesPage');
    if(!page)return;
    if(!booted||!document.getElementById('memberQuery')){booted=true;render()}
  };
  setInterval(tick,1000);
  window.memberDiscoveryRender=render;
})();
