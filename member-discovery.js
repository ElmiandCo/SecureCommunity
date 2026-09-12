(() => {
  const {createClient}=window.supabase||{};
  const cfg=window.APP_CONFIG||{};
  if(!createClient)return;
  const db=createClient(cfg.SUPABASE_URL,cfg.SUPABASE_ANON_KEY,{auth:{persistSession:true,autoRefreshToken:true,detectSessionInUrl:true}});
  const esc=s=>String(s??'').replace(/[&<>\"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;',"'":'&#039;'}[m]));
  const name=u=>u?.display_name||`${u?.first_name||''} ${u?.last_name||''}`.trim()||'Member';
  const ps=()=>window.OneMuslimProfileSystem||null;
  const xp=u=>Number(u?.xp_total??u?.xp??u?.rank_points??u?.points??0)||0;
  const gender=u=>{const c=u?.avatar_config&&typeof u.avatar_config==='object'?u.avatar_config:{};return (u?.avatar_gender||c.gender||'male')==='female'?'female':'male'};
  const bgName=u=>String(u?.profile_background||u?.avatar_config?.background||'default');
  const platinum=u=>xp(u)>=10000;
  const avatar=u=>{const g=gender(u),p=ps();return p?(platinum(u)?p.getPlatinumAvatarAsset(g):p.getRegularAvatarAsset(g)):(platinum(u)?`/assets/avatar/platinum/platinum-${g}.PNG`:`/assets/avatar/base/avatar-master-${g}.jpeg`)};
  const bgAssets={
    'Islamic Geometry':'/assets/onemuslim/pattern-light.svg','Mosque Silhouette':'/assets/onemuslim/mosque-light.svg','Islamic Arch':'/assets/onemuslim/arch-gold.svg','Crescent & Stars':'/assets/onemuslim/crescent-gold.svg','Luxury Gold':'/assets/onemuslim/cinematic-golden-clouds.svg','Emerald':'/assets/onemuslim/pattern-dark.svg','Dark Mosque':'/assets/onemuslim/mosque-dark.svg','Minimal Cream':'/assets/onemuslim/corner-ornament.svg'
  };
  const icons={
    profile:'<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="8" r="3.2"/><path d="M5.5 20c.6-3.5 2.8-5.2 6.5-5.2s5.9 1.7 6.5 5.2"/></svg>',
    message:'<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 5.5h14v10H9l-4 3v-13Z"/><path d="M8 9.5h8M8 12.5h5"/></svg>',
    follow:'<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="9" cy="8" r="3"/><path d="M3.8 19c.5-3.1 2.2-4.7 5.2-4.7s4.7 1.6 5.2 4.7M17 9v6M14 12h6"/></svg>'
  };

  function styles(){
    if(document.getElementById('memberDiscoveryStylesV4'))return;
    const s=document.createElement('style');s.id='memberDiscoveryStylesV4';s.textContent=`
      body.dashboard-theme #profilesGrid .people-theme-card{position:relative;min-height:0!important;height:100%!important;padding:0 18px 16px!important;box-sizing:border-box!important;overflow:hidden!important;display:flex!important;flex-direction:column!important;background:#fff!important;border:1px solid #dfe7ef!important;border-radius:20px!important;box-shadow:0 8px 24px rgba(21,35,59,.06)!important}
      .people-card-top{position:relative!important;height:92px!important;min-height:92px!important;margin:0 -18px!important;padding:0!important;display:flex!important;justify-content:center!important;align-items:flex-end!important;background:linear-gradient(180deg,#edf3f7,#f8fafc)!important;background-position:center!important;background-size:cover!important;overflow:visible!important}
      .people-card-top.has-bg:after{content:"";position:absolute;inset:0;background:linear-gradient(180deg,rgba(7,20,34,.03),rgba(7,20,34,.18));pointer-events:none!important}
      .people-card-avatar-wrap{position:relative!important;z-index:5!important;width:82px!important;height:82px!important;flex:0 0 82px!important;margin-bottom:-24px!important}
      .people-card-avatar{display:block!important;width:82px!important;height:82px!important;border-radius:50%!important;object-fit:cover!important;border:5px solid #fff!important;margin:0!important;box-shadow:0 8px 22px rgba(21,35,59,.18)!important;background:#e9eef6!important}
      .people-card-avatar-wrap .status-dot{position:absolute!important;right:0!important;bottom:3px!important;width:12px!important;height:12px!important;border-radius:50%!important;background:#20c77a!important;border:3px solid #fff!important}
      .people-card-body{display:flex!important;flex-direction:column!important;flex:1!important;min-height:0!important;padding-top:36px!important}
      .people-card-heading{display:flex!important;align-items:flex-start!important;justify-content:space-between!important;gap:7px!important}
      .people-card-heading h3{margin:0 0 3px!important;min-width:0!important;overflow-wrap:anywhere!important;font-size:18px!important;line-height:1.18!important;color:#15243b!important}
      .people-card-meta{display:flex!important;align-items:center!important;gap:6px!important;flex-wrap:wrap!important}
      .people-card-meta .username{color:#6b7b93!important;font-size:11px!important}
      .people-card-more{width:28px!important;height:28px!important;flex:0 0 28px!important;border:0!important;border-radius:8px!important;background:#f1f5f9!important;color:#60708a!important;font-size:16px!important;line-height:1!important;cursor:pointer!important}
      .people-card-location{display:flex!important;align-items:center!important;gap:4px!important;margin:8px 0 2px!important;color:#64748b!important;font-size:11px!important;font-weight:650!important}
      .people-card-location svg{width:13px!important;height:13px!important;fill:none!important;stroke:currentColor!important;stroke-width:1.8!important}
      .people-card-bio{margin:4px 0!important;color:#52657f!important;font-size:12px!important;line-height:1.4!important;display:-webkit-box!important;-webkit-line-clamp:3!important;-webkit-box-orient:vertical!important;overflow:hidden!important;min-height:50px!important}
      .design-badge,.platinum-badge{display:inline-flex!important;align-items:center!important;gap:4px!important;width:max-content!important;padding:4px 7px!important;border-radius:999px!important;font-size:9px!important;font-weight:850!important}
      .design-badge{background:#eef4ff!important;border:1px solid #d5e3ff!important;color:#315fae!important}
      .platinum-badge{background:linear-gradient(135deg,#fafbfc,#d8dce1,#fff)!important;border:1px solid #b9c0c8!important;color:#4f5963!important}
      .member-card-actions{display:grid!important;grid-template-columns:repeat(3,1fr)!important;gap:8px!important;margin-top:auto!important;padding-top:12px!important}
      .member-card-actions button{width:100%!important;height:38px!important;min-width:0!important;padding:0!important;border-radius:11px!important;font-size:0!important;display:grid!important;place-items:center!important;box-sizing:border-box!important;cursor:pointer!important}
      .member-card-actions button svg{width:18px!important;height:18px!important;fill:none!important;stroke:currentColor!important;stroke-width:1.8!important;stroke-linecap:round!important;stroke-linejoin:round!important}
      .member-card-actions .primary{background:#185f55!important;color:#fff!important;border:1px solid #185f55!important;box-shadow:0 6px 15px rgba(24,95,85,.15)!important}
      .member-card-actions .outline{background:#f1f5f8!important;color:#185f55!important;border:1px solid #d8e2e7!important}
      .member-card-actions .outline:hover{background:#e5efed!important}
      .people-empty{grid-column:1/-1;padding:50px 20px;text-align:center;border:1px dashed #ccd8e8;border-radius:18px;background:#fff;color:#687991}
    `;document.head.appendChild(s);
  }

  async function members(){
    const user=(await db.auth.getUser()).data.user;if(!user)return[];
    const {data,error}=await db.from('profiles').select('*').neq('id',user.id).order('display_name');
    if(error){console.error('People members:',error);return[]}
    return data||[];
  }

  function card(u){
    const n=name(u),g=gender(u),plat=platinum(u),bn=bgName(u),bg=bgAssets[bn],loc=[u.city,u.state,u.country].filter(Boolean).join(', '),tier=ps()?.getTier?.(u);
    const top=`<div class="people-card-top${bg?' has-bg':''}"${bg?` style="background-image:url('${esc(bg)}')"`:''}><div class="people-card-avatar-wrap"><img class="people-card-avatar" src="${esc(avatar(u))}" alt="${esc(n)} avatar" loading="lazy"><span class="status-dot" aria-hidden="true"></span></div></div>`;
    const badges=`${plat?'<span class="platinum-badge">✦ Platinum</span>':''}${bn&&bn!=='default'&&bn!=='Minimal Cream'?`<span class="design-badge">✦ ${esc(bn)}</span>`:''}`;
    const location=loc?`<div class="people-card-location"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 21s6-5.1 6-11a6 6 0 1 0-12 0c0 5.9 6 11 6 11Z"/><circle cx="12" cy="10" r="2"/></svg>${esc(loc)}</div>`:'';
    return `<article class="profile-card people-theme-card${plat?' is-platinum':''}" data-profile-id="${esc(u.id)}" data-profile-gender="${g}" data-platinum="${plat?'1':'0'}" data-profile-background="${esc(bn)}">${top}<div class="people-card-body"><div class="people-card-heading"><div><h3>${esc(n)}</h3><div class="people-card-meta"><span class="username">@${esc(u.username||'')}</span>${plat&&tier?.label&&tier.label!=='Platinum'?`<span class="people-card-xp">${esc(tier.label)}</span>`:''}</div></div><button class="people-card-more" type="button" aria-label="More options" title="More options">•••</button></div>${location}<p class="people-card-bio">${esc(u.bio||'Member of the OneMuslim community.')}</p><div>${badges}</div><div class="member-card-actions"><button class="outline" type="button" data-view-profile="${esc(u.id)}" aria-label="View profile" title="View profile">${icons.profile}</button><button class="primary" type="button" data-message-user="${esc(u.id)}" aria-label="Message" title="Message">${icons.message}</button><button class="outline om-card-follow" type="button" data-follow-target="${esc(u.id)}" aria-label="Follow" title="Follow">${icons.follow}</button></div></div></article>`;
  }

  function shell(page){
    page.querySelector('.page-head')?.remove();page.querySelector('.people-hero')?.remove();page.querySelector('.people-controls')?.remove();
    const grid=document.getElementById('profilesGrid');if(!grid)return null;
    const hero=document.createElement('section');hero.className='people-hero';hero.innerHTML='<div class="people-hero-copy"><span class="eyebrow">ONE MUSLIM COMMUNITY</span><h1>People</h1><p>Discover and connect with the OneMuslim community.</p></div><div class="people-hero-badge"><strong>🌙 A global community</strong><span>United by faith, knowledge, growth, and good deeds.</span></div>';page.insertBefore(hero,grid);
    const controls=document.createElement('section');controls.className='people-controls';controls.innerHTML='<div class="people-tabs" role="tablist" aria-label="People filters"><button class="people-tab active" data-people-tab="all">All Members</button><button class="people-tab" data-people-tab="male">Muslim Men</button><button class="people-tab" data-people-tab="female">Muslim Women</button><button class="people-tab platinum" data-people-tab="platinum">✦ Platinum</button><button class="people-tab" data-people-tab="designs">🎨 Designs</button></div><div class="people-search"><input id="memberQuery" placeholder="Search members…" aria-label="Search members"><select id="memberLocation" aria-label="Filter by location"><option value="">All locations</option></select><select id="memberCommunity" aria-label="Filter by community"><option value="">All communities</option></select><select id="memberSort" aria-label="Sort people"><option value="name">A–Z</option><option value="newest">Newest</option><option value="xp">XP</option></select></div>';page.insertBefore(controls,grid);return{controls,grid};
  }

  async function render(){
    const grid=document.getElementById('profilesGrid'),page=document.getElementById('profilesPage');if(!grid||!page)return;
    const rows=await members();const s=shell(page);if(!s)return;
    const {controls}=s,q=controls.querySelector('#memberQuery'),loc=controls.querySelector('#memberLocation'),comm=controls.querySelector('#memberCommunity'),sort=controls.querySelector('#memberSort');
    [...new Set(rows.map(u=>[u.city,u.state,u.country].filter(Boolean).join(', ')).filter(Boolean))].sort().forEach(x=>loc.insertAdjacentHTML('beforeend',`<option value="${esc(x)}">${esc(x)}</option>`));
    [...new Set(rows.map(u=>u.community).filter(Boolean))].sort().forEach(x=>comm.insertAdjacentHTML('beforeend',`<option value="${esc(x)}">${esc(x)}</option>`));
    let tab='all';
    const filter=()=>{
      const term=(q.value||'').toLowerCase().trim(),lv=loc.value,cv=comm.value,sv=sort.value;
      let out=rows.filter(u=>{const text=`${name(u)} ${u.username||''} ${u.bio||''}`.toLowerCase(),lt=[u.city,u.state,u.country].filter(Boolean).join(', ');const ok=tab==='all'||(tab==='male'&&gender(u)==='male')||(tab==='female'&&gender(u)==='female')||(tab==='platinum'&&platinum(u))||(tab==='designs'&&bgName(u)!=='default'&&bgName(u)!=='Minimal Cream');return ok&&(!term||text.includes(term))&&(!lv||lt===lv)&&(!cv||u.community===cv)});
      if(sv==='xp')out.sort((a,b)=>xp(b)-xp(a));else if(sv==='newest')out.sort((a,b)=>new Date(b.created_at||0)-new Date(a.created_at||0));else out.sort((a,b)=>name(a).localeCompare(name(b)));
      grid.dataset.omPeopleRendering='1';grid.innerHTML=out.map(card).join('')||'<div class="people-empty">No members match those filters.</div>';delete grid.dataset.omPeopleRendering;wire();window.OneMuslimProfileFollows?.decorateCards?.();
    };
    controls.querySelectorAll('[data-people-tab]').forEach(b=>b.addEventListener('click',()=>{tab=b.dataset.peopleTab;controls.querySelectorAll('[data-people-tab]').forEach(x=>x.classList.toggle('active',x===b));filter()}));
    [q,loc,comm,sort].forEach(x=>x.addEventListener('input',filter));[loc,comm,sort].forEach(x=>x.addEventListener('change',filter));
    filter();
  }

  function wire(){
    document.querySelectorAll('[data-view-profile]').forEach(b=>b.onclick=()=>window.openUserProfile?.(b.dataset.viewProfile));
    document.querySelectorAll('[data-message-user]').forEach(b=>b.onclick=()=>window.openDmWith?.(b.dataset.messageUser));
  }

  styles();
  let rendering=false;
  const ensure=async()=>{
    const page=document.getElementById('profilesPage'),grid=document.getElementById('profilesGrid');if(!page||!grid||rendering)return;
    if(!document.getElementById('memberQuery')||!grid.querySelector('.people-theme-card')){rendering=true;try{await render()}finally{rendering=false}}
  };
  const start=()=>{ensure();const page=document.getElementById('profilesPage');if(page&&!page.dataset.omPeopleObserver){page.dataset.omPeopleObserver='1';const observer=new MutationObserver(()=>ensure());observer.observe(page,{childList:true,subtree:true})}};
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start);else start();
  window.memberDiscoveryRender=render;
})();
