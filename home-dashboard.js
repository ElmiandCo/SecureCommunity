/* OneMuslim My Home — profile hero + customizable component builder. */
(() => {
  'use strict';
  const { createClient } = window.supabase || {};
  const cfg = window.APP_CONFIG || {};
  if (!createClient || !cfg.SUPABASE_URL || !cfg.SUPABASE_ANON_KEY) return;
  const sb = createClient(cfg.SUPABASE_URL, cfg.SUPABASE_ANON_KEY, { auth:{persistSession:true,autoRefreshToken:true,detectSessionInUrl:true} });
  const $ = id => document.getElementById(id);
  const esc = s => String(s ?? '').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[m]));
  const displayName = p => p?.display_name || `${p?.first_name||''} ${p?.last_name||''}`.trim() || 'Member';
  const initials = n => (n||'M').split(/\s+/).filter(Boolean).map(x=>x[0]).join('').slice(0,2).toUpperCase();
  const fmt = t => { try{return new Date(t).toLocaleDateString([], {month:'short',day:'numeric'});}catch{return '';} };

  const COMPONENTS = {
    ai_post:{icon:'✦',title:'OneMuslim AI',desc:'The latest automatically generated community reminder.',kind:'social'},
    recent_posts:{icon:'▤',title:'Recent Posts',desc:'A clean stream of the newest community posts.',kind:'social'},
    community_feed:{icon:'◉',title:'Community Feed',desc:'Highlight a community you belong to on your home page.',kind:'social'},
    lessons:{icon:'▣',title:'Lessons',desc:'Continue your learning path and see progress.',kind:'learning'},
    rank:{icon:'♛',title:'Rank & Achievements',desc:'Show your XP, rank and progression.',kind:'personal'},
    daily:{icon:'🔥',title:'Daily Check-in',desc:'Claim your daily XP reward when available.',kind:'personal'},
    notes:{icon:'✎',title:'My Notes',desc:'Keep your private study notes close at hand.',kind:'personal'},
    custom:{icon:'✦',title:'Custom Content',desc:'Add your own text, link or reminder.',kind:'personal'}
  };
  const DEFAULT_LAYOUT = ['ai_post','recent_posts','lessons','community_feed','rank'];
  const BG = {
    default:'linear-gradient(135deg,#e9e4d4 0%,#f7f4eb 52%,#ded7c2 100%)',
    'Islamic Geometry':'linear-gradient(135deg,#fbf5e8,#f1e6cf)',
    'Mosque Silhouette':'linear-gradient(135deg,#f7ecd6,#ead8b5)',
    'Islamic Arch':'linear-gradient(135deg,#f8f2e5,#e9dfcc)',
    'Crescent & Stars':'linear-gradient(135deg,#0e2d27,#193f35)',
    'Luxury Gold':'linear-gradient(135deg,#fff8e8,#d8b66a)',
    Emerald:'linear-gradient(135deg,#0d4b3d,#1f6b57)',
    'Dark Mosque':'linear-gradient(135deg,#061e1a,#173a31)',
    'Minimal Cream':'linear-gradient(135deg,#fffdf8,#f4f0e7)'
  };

  let me=null, profile=null, layout=[], posts=[], aiPost=null, lessons=[], communities=[];
  let mounted=false, dragged=null;

  function profileBackground(p){
    const v=p?.profile_background || p?.avatar_config?.background || 'default';
    if(typeof v === 'string' && v.startsWith('linear-gradient')) return v;
    return BG[v] || BG.default;
  }
  function avatarSrc(p){
    if(window.OneMuslimProfileSystem?.getAvatarAsset) return window.OneMuslimProfileSystem.getAvatarAsset(p);
    const gender=p?.avatar_gender==='female'?'female':'male';
    if(p?.avatar_package==='platinum_package' && Number(p?.xp_total||0)>=10000) return `/assets/avatars/platinum/platinum-${gender}.PNG`;
    return `/assets/avatar/base/avatar-master-${gender}.jpeg`;
  }
  function rankNumber(xp){return Math.floor(Math.max(0,Number(xp)||0)/1000)+1;}
  function rankTitle(p){return p?.profile_title || 'Muslim';}

  async function load(){
    const {data:{user}}=await sb.auth.getUser();
    if(!user) return;
    me=user;
    const [pr,lay,ps,ls,cm,fl] = await Promise.all([
      sb.from('profiles').select('*').eq('id',user.id).maybeSingle(),
      sb.from('home_layouts').select('components').eq('user_id',user.id).maybeSingle(),
      sb.from('posts').select('id,user_id,body,created_at').order('created_at',{ascending:false}).limit(24),
      sb.from('lessons').select('id,title,description,difficulty,points_per_question,sort_order').eq('active',true).order('sort_order').limit(6),
      sb.from('communities').select('id,name,description').order('name').limit(40),
      sb.from('profile_follows').select('following_id').eq('follower_id',user.id)
    ]);
    profile=pr.data||null;
    layout=Array.isArray(lay.data?.components) && lay.data.components.length ? lay.data.components.filter(x=>COMPONENTS[x?.type]) : DEFAULT_LAYOUT.map(type=>({type}));
    posts=ps.data||[];
    lessons=ls.data||[];
    communities=cm.data||[];
    window.__omHomeFollowingCount=(fl.data||[]).length;
    if(posts.length){
      const ids=[...new Set(posts.map(p=>p.user_id).filter(Boolean))];
      const {data:profiles}=await sb.from('profiles').select('id,display_name,username,is_ai,ai_label').in('id',ids);
      const map=new Map((profiles||[]).map(p=>[p.id,p]));
      posts=posts.map(p=>({...p,profiles:map.get(p.user_id)||{}}));
      aiPost=posts.find(p=>p.profiles?.is_ai) || null;
    } else aiPost=null;
    render();
  }

  async function saveLayout(){
    if(!me)return;
    const components=layout.map(x=>({type:x.type,config:x.config||{}}));
    const {error}=await sb.from('home_layouts').upsert({user_id:me.id,components,updated_at:new Date().toISOString()},{onConflict:'user_id'});
    if(error) console.error('Home layout save:',error);
  }

  function componentShell(item,body){
    const meta=COMPONENTS[item.type]||COMPONENTS.custom;
    return `<article class="om-home-widget" draggable="true" data-home-widget="${esc(item.type)}" data-home-index="${layout.indexOf(item)}">
      <div class="om-widget-head"><div class="om-widget-title"><span class="om-widget-icon">${meta.icon}</span><div><h3>${esc(item.config?.title||meta.title)}</h3><small>${esc(meta.kind==='learning'?'LEARNING':meta.kind==='social'?'COMMUNITY':'PERSONAL')}</small></div></div><div class="om-widget-tools"><button type="button" class="om-widget-grip" title="Drag to reorder" aria-label="Drag to reorder">⋮⋮</button><button type="button" class="om-widget-remove" data-remove-home="${esc(item.type)}" aria-label="Remove ${esc(meta.title)}">×</button></div></div>
      ${body}
    </article>`;
  }

  function renderAi(item){
    if(!aiPost) return componentShell(item,`<div class="om-widget-empty"><b>No AI post yet.</b><span>OneMuslim AI will appear here when its next scheduled post is published.</span></div>`);
    return componentShell(item,`<div class="om-ai-post"><div class="om-ai-badge">AI · AUTOMATIC</div><p>${esc(aiPost.body||'')}</p><small>@onemuslim_ai · ${fmt(aiPost.created_at)}</small></div>`);
  }
  function renderRecent(item){
    const list=posts.filter(p=>!p.profiles?.is_ai).slice(0,4);
    return componentShell(item,list.length?`<div class="om-post-list">${list.map(p=>`<button type="button" class="om-post-row" data-go-community="1"><span class="om-row-avatar">${esc(initials(displayName(p.profiles)))}</span><span><b>${esc(displayName(p.profiles))}</b><small>${esc((p.body||'').slice(0,105))}</small></span><time>${fmt(p.created_at)}</time></button>`).join('')}</div><button class="om-widget-link" data-go-community="1">View community →</button>`:`<div class="om-widget-empty">No community posts yet.</div>`);
  }
  function renderLessons(item){
    const shown=lessons.slice(0,3);
    return componentShell(item,shown.length?`<div class="om-lesson-list">${shown.map((l,i)=>`<button type="button" class="om-lesson-row" data-go-lessons="1"><span class="om-lesson-num">0${i+1}</span><span><b>${esc(l.title)}</b><small>${esc(l.description||'Continue this lesson')}</small></span><strong>→</strong></button>`).join('')}</div><button class="om-widget-link" data-go-lessons="1">Open all lessons →</button>`:`<div class="om-widget-empty">Lessons will appear here as they become available.</div>`);
  }
  function renderCommunity(item){
    const selected=item.config?.communityId ? communities.find(c=>c.id===item.config.communityId) : null;
    const title=selected?.name || item.config?.communityName || 'Your Community';
    return componentShell(item,`<div class="om-community-feature"><div class="om-community-mark">◉</div><div><b>${esc(title)}</b><p>${esc(selected?.description||'Choose a community for this space from the component settings.')}</p></div></div><button class="om-widget-link" data-edit-component="community_feed">Choose community →</button>`);
  }
  function renderRank(item){
    const xp=Number(profile?.xp_total||0), rank=rankNumber(xp), pct=Math.min(100,xp%1000/10), following=window.__omHomeFollowingCount||0;
    return componentShell(item,`<div class="om-rank-widget"><div class="om-rank-avatar"><img src="${esc(avatarSrc(profile))}" alt="Your avatar"></div><div class="om-rank-main"><div><span>Rank ${rank}</span><b>${esc(rankTitle(profile))}</b></div><strong>${xp.toLocaleString()} <small>XP</small></strong><div class="om-progress"><i style="width:${pct}%"></i></div><small>${Math.max(0,1000-(xp%1000)).toLocaleString()} XP to next rank</small></div><div class="om-rank-stat"><b>${following}</b><small>Following</small></div></div>`);
  }
  function renderDaily(item){
    return componentShell(item,`<div class="om-daily"><span class="om-daily-fire">🔥</span><div><b>Daily check-in</b><p>Keep showing up and build your XP streak.</p></div><button type="button" class="om-action" id="homeDailyClaim">Claim XP</button></div>`);
  }
  function renderNotes(item){
    return componentShell(item,`<div class="om-notes-widget"><b>Your private study space</b><p>Open My Notes to continue your personal AI study threads and notes.</p><button type="button" class="om-action" data-go-notes="1">Open Notes</button></div>`);
  }
  function renderCustom(item){
    return componentShell(item,`<div class="om-custom-widget"><h4>${esc(item.config?.heading||'Your space')}</h4><p>${esc(item.config?.body||'Add your own reminder, text, link or idea.')}</p>${item.config?.url?`<a href="${esc(item.config.url)}" target="_blank" rel="noopener">Open link →</a>`:''}</div>`);
  }
  function renderWidget(item){
    switch(item.type){
      case 'ai_post':return renderAi(item);
      case 'recent_posts':return renderRecent(item);
      case 'lessons':return renderLessons(item);
      case 'community_feed':return renderCommunity(item);
      case 'rank':return renderRank(item);
      case 'daily':return renderDaily(item);
      case 'notes':return renderNotes(item);
      default:return renderCustom(item);
    }
  }

  function render(){
    const host=$('publicHomePage');
    if(!host || !me || !profile) return;
    mounted=true;
    const name=displayName(profile), xp=Number(profile.xp_total||0), rank=rankNumber(xp);
    host.innerHTML=`<div class="om-myhome">
      <header class="om-home-header"><div><span class="om-home-kicker">ONE MUSLIM · PERSONAL SPACE</span><h2>My Home</h2></div><button type="button" class="om-customize-btn" id="omCustomizeHome">✦ Customize Home</button></header>
      <section class="om-profile-hero" style="background:${profileBackground(profile)}">
        <div class="om-hero-glow" aria-hidden="true"></div><div class="om-hero-ornament" aria-hidden="true">☾</div>
        <div class="om-hero-inner">
          <div class="om-hero-avatar"><img src="${esc(avatarSrc(profile))}" alt="${esc(name)} avatar"></div>
          <div class="om-hero-identity"><span class="om-private-chip">🔐 PRIVATE PROFILE</span><h1>${esc(name)}</h1><p>@${esc(profile.username||'member')}</p><div class="om-hero-pills"><span>♛ Rank ${rank}</span><span>✦ ${xp.toLocaleString()} XP</span><span>☪ ${esc(rankTitle(profile))}</span></div></div>
          <button type="button" class="om-edit-profile" id="omHomeEditProfile">Edit profile</button>
        </div>
      </section>
      <section class="om-home-profile-card"><div class="om-profile-card-top"><div><span class="om-home-kicker">YOUR PROFILE</span><h3>${esc(name)}</h3><p>${esc(profile.bio||'Build your profile, learn, and grow with the community.')}</p></div><div class="om-profile-card-rank"><b>Rank ${rank}</b><span>${esc(rankTitle(profile))}</span></div></div><div class="om-profile-xp"><div><strong>${xp.toLocaleString()}</strong><span>Total XP</span></div><div class="om-profile-progress"><i style="width:${Math.min(100,xp%1000/10)}%"></i></div><div><strong>${window.__omHomeFollowingCount||0}</strong><span>Following</span></div></div></section>
      <div class="om-home-builder-bar"><div><span class="om-home-kicker">YOUR HOME CANVAS</span><h3>Build your space</h3><p>Add, remove and arrange components below.</p></div><button type="button" class="om-add-component" id="omAddComponent">＋ Add Component</button></div>
      <section class="om-home-grid" id="omHomeGrid">${layout.map(renderWidget).join('')}</section>
      <button type="button" class="om-bottom-add" id="omBottomAdd">＋ Add a Component</button>
    </div>`;
    wireHome();
  }

  function wireHome(){
    $('omCustomizeHome')?.addEventListener('click',openBuilder);
    $('omAddComponent')?.addEventListener('click',openBuilder);
    $('omBottomAdd')?.addEventListener('click',openBuilder);
    $('omHomeEditProfile')?.addEventListener('click',()=>document.querySelector('[data-page="profile"]')?.click());
    document.querySelectorAll('[data-go-community]').forEach(b=>b.addEventListener('click',()=>document.querySelector('[data-page="feed"]')?.click()));
    document.querySelectorAll('[data-go-lessons]').forEach(b=>b.addEventListener('click',()=>document.querySelector('[data-page="lessons"]')?.click()));
    document.querySelectorAll('[data-go-notes]').forEach(b=>b.addEventListener('click',()=>document.querySelector('[data-page="notes"]')?.click()));
    document.querySelectorAll('[data-remove-home]').forEach(b=>b.addEventListener('click',()=>removeComponent(b.dataset.removeHome)));
    document.querySelectorAll('[data-edit-component]').forEach(b=>b.addEventListener('click',()=>openBuilder(b.dataset.editComponent)));
    const claim=$('homeDailyClaim'); if(claim) claim.addEventListener('click',async()=>{claim.disabled=true;claim.textContent='Claiming…';const r=await sb.rpc('claim_daily_home_xp');if(r.error){claim.disabled=false;claim.textContent='Try again';}else{claim.textContent='Claimed ✓';await load();}});
    document.querySelectorAll('[data-home-widget]').forEach(el=>{
      el.addEventListener('dragstart',e=>{dragged=Number(el.dataset.homeIndex);el.classList.add('om-dragging');e.dataTransfer.effectAllowed='move';});
      el.addEventListener('dragend',()=>{el.classList.remove('om-dragging');dragged=null;});
      el.addEventListener('dragover',e=>{e.preventDefault();el.classList.add('om-drag-over');});
      el.addEventListener('dragleave',()=>el.classList.remove('om-drag-over'));
      el.addEventListener('drop',async e=>{e.preventDefault();el.classList.remove('om-drag-over');const to=Number(el.dataset.homeIndex);if(dragged===null||dragged===to)return;const moved=layout.splice(dragged,1)[0];layout.splice(to,0,moved);await saveLayout();render();});
    });
  }

  function removeComponent(type){
    if(layout.length<=1){return;}
    layout=layout.filter(x=>x.type!==type);
    saveLayout();render();
  }

  function openBuilder(editType){
    document.querySelector('.om-home-builder-overlay')?.remove();
    const overlay=document.createElement('div');overlay.className='om-home-builder-overlay';
    const current=editType ? layout.find(x=>x.type===editType) : null;
    overlay.innerHTML=`<aside class="om-home-builder" role="dialog" aria-modal="true"><header><div><span class="om-home-kicker">MY HOME</span><h2>${current?'Configure component':'Add Component'}</h2><p>${current?'Choose how this component should appear on your home page.':'Choose a component and add it to your home page.'}</p></div><button type="button" class="om-builder-close" aria-label="Close">×</button></header><div class="om-builder-tabs"><button class="active" data-builder-filter="all">All</button><button data-builder-filter="social">Social</button><button data-builder-filter="learning">Learning</button><button data-builder-filter="personal">Personal</button></div><div class="om-component-options">${Object.entries(COMPONENTS).map(([type,c])=>`<button type="button" class="om-component-option ${current?.type===type?'selected':''}" data-builder-type="${type}" data-kind="${c.kind}"><span>${c.icon}</span><div><b>${esc(c.title)}</b><small>${esc(c.desc)}</small></div><strong>${current?.type===type?'✓':'Add'}</strong></button>`).join('')}</div><div class="om-builder-foot"><span>Drag components on your home page to reorder them.</span><button type="button" class="om-builder-done">Done</button></div></aside>`;
    document.body.appendChild(overlay);
    overlay.querySelector('.om-builder-close').onclick=()=>overlay.remove();
    overlay.addEventListener('click',e=>{if(e.target===overlay)overlay.remove();});
    overlay.querySelector('.om-builder-done').onclick=()=>overlay.remove();
    overlay.querySelectorAll('[data-builder-filter]').forEach(b=>b.onclick=()=>{overlay.querySelectorAll('[data-builder-filter]').forEach(x=>x.classList.remove('active'));b.classList.add('active');const f=b.dataset.builderFilter;overlay.querySelectorAll('[data-builder-type]').forEach(x=>x.hidden=f!=='all'&&x.dataset.kind!==f);});
    overlay.querySelectorAll('[data-builder-type]').forEach(b=>b.onclick=()=>{const type=b.dataset.builderType;if(current){current.type=type;current.config=current.config||{};}else if(!layout.some(x=>x.type===type)){layout.push({type,config:{}});}saveLayout();overlay.remove();render();if(type==='community_feed')setTimeout(()=>openCommunityConfig(),50);});
  }

  function openCommunityConfig(){
    const item=layout.find(x=>x.type==='community_feed');if(!item)return;
    document.querySelector('.om-home-builder-overlay')?.remove();
    const overlay=document.createElement('div');overlay.className='om-home-builder-overlay';
    overlay.innerHTML=`<aside class="om-home-builder om-config-panel"><header><div><span class="om-home-kicker">COMMUNITY COMPONENT</span><h2>Choose a community</h2><p>Select the community you want highlighted on your home page.</p></div><button type="button" class="om-builder-close">×</button></header><div class="om-config-form"><label>Community<select id="omHomeCommunity"><option value="">Choose a community</option>${communities.map(c=>`<option value="${esc(c.id)}" ${item.config?.communityId===c.id?'selected':''}>${esc(c.name)}</option>`).join('')}</select></label><p class="om-config-note">Your community tables currently do not attach a community ID to each post, so this component will show the selected community as a spotlight. The data model is ready for community-specific post feeds when that link is added.</p></div><div class="om-builder-foot"><span></span><button type="button" class="om-builder-done">Save</button></div></aside>`;
    document.body.appendChild(overlay);
    overlay.querySelector('.om-builder-close').onclick=()=>overlay.remove();
    overlay.querySelector('.om-builder-done').onclick=async()=>{const id=$('omHomeCommunity').value;item.config={...(item.config||{}),communityId:id,communityName:communities.find(c=>c.id===id)?.name||''};await saveLayout();overlay.remove();render();};
  }

  const style=document.createElement('style');style.id='om-myhome-styles';style.textContent=`
  #publicHomePage{padding:0!important;background:#fbf8f1!important}.om-myhome{min-height:100%;padding-bottom:40px;color:#20352c}.om-home-header{display:flex;align-items:center;justify-content:space-between;gap:18px;padding:24px 2px 18px}.om-home-header h2{margin:4px 0 0;font-size:30px;color:#183d70}.om-home-kicker{font-size:10px;letter-spacing:.16em;font-weight:900;color:#315db2}.om-customize-btn,.om-add-component{border:1px solid #315db2;background:#fff;color:#244b91;border-radius:12px;padding:11px 15px;font-weight:800;cursor:pointer}.om-profile-hero{position:relative;min-height:290px;border-radius:28px;overflow:hidden;border:1px solid rgba(70,73,63,.12);box-shadow:0 20px 55px rgba(35,48,42,.13)}.om-hero-glow{position:absolute;inset:0;background:radial-gradient(circle at 18% 10%,rgba(255,255,255,.72),transparent 33%),linear-gradient(90deg,rgba(10,37,29,.12),transparent 55%)}.om-hero-ornament{position:absolute;right:35px;top:18px;font-size:100px;color:rgba(255,255,255,.24);font-family:Georgia,serif}.om-hero-inner{position:relative;z-index:2;min-height:290px;display:flex;align-items:flex-end;gap:22px;padding:28px 34px}.om-hero-avatar{width:142px;height:142px;flex:0 0 142px;border-radius:50%;padding:7px;background:rgba(255,255,255,.86);box-shadow:0 15px 35px rgba(0,0,0,.18)}.om-hero-avatar img{width:100%;height:100%;border-radius:50%;object-fit:cover;object-position:center top;display:block}.om-hero-identity{color:#fff;text-shadow:0 2px 12px rgba(0,0,0,.38)}.om-private-chip{display:inline-flex;padding:6px 10px;border-radius:999px;background:rgba(255,255,255,.2);border:1px solid rgba(255,255,255,.35);font-size:10px;font-weight:800;letter-spacing:.08em}.om-hero-identity h1{margin:8px 0 2px;font-size:38px}.om-hero-identity p{margin:0;opacity:.86}.om-hero-pills{display:flex;gap:8px;flex-wrap:wrap;margin-top:13px}.om-hero-pills span{padding:7px 11px;border-radius:999px;background:rgba(8,32,25,.55);border:1px solid rgba(255,255,255,.18);font-size:11px;font-weight:800}.om-edit-profile{margin-left:auto;align-self:flex-end;border:1px solid rgba(255,255,255,.7);background:rgba(255,255,255,.92);color:#214d43;border-radius:12px;padding:11px 16px;font-weight:900;cursor:pointer}.om-home-profile-card{margin:-28px 34px 0;position:relative;z-index:4;background:#fff;border:1px solid #e5dfd3;border-radius:22px;padding:22px 24px;box-shadow:0 15px 35px rgba(31,53,44,.1)}.om-profile-card-top{display:flex;justify-content:space-between;gap:20px}.om-profile-card-top h3{font-size:24px;margin:4px 0 5px}.om-profile-card-top p{margin:0;color:#718078;max-width:650px}.om-profile-card-rank{display:grid;text-align:right;align-content:center}.om-profile-card-rank b{color:#c18e2f}.om-profile-card-rank span{font-size:11px;color:#718078}.om-profile-xp{display:grid;grid-template-columns:100px 1fr 100px;gap:16px;align-items:center;border-top:1px solid #eee8dd;margin-top:18px;padding-top:17px}.om-profile-xp>div{display:grid}.om-profile-xp strong{font-size:20px;color:#183d70}.om-profile-xp span{font-size:10px;color:#7a877f}.om-profile-progress{height:8px!important;background:#e9ece8;border-radius:99px;overflow:hidden}.om-profile-progress i{display:block;height:100%;background:linear-gradient(90deg,#246f57,#c89d3c);border-radius:99px}.om-home-builder-bar{display:flex;align-items:center;justify-content:space-between;gap:16px;margin:28px 2px 14px}.om-home-builder-bar h3{margin:3px 0;font-size:21px}.om-home-builder-bar p{margin:0;color:#7b877f;font-size:12px}.om-add-component{background:#183d70;color:#fff;border-color:#183d70}.om-home-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:16px}.om-home-widget{background:#fff;border:1px solid #e5dfd3;border-radius:19px;padding:18px;box-shadow:0 8px 25px rgba(31,53,44,.055);transition:.18s transform,.18s box-shadow}.om-home-widget:hover{box-shadow:0 12px 30px rgba(31,53,44,.09)}.om-home-widget.om-dragging{opacity:.45;transform:scale(.985)}.om-home-widget.om-drag-over{outline:2px dashed #315db2;outline-offset:3px}.om-widget-head{display:flex;align-items:center;justify-content:space-between;gap:12px;margin-bottom:14px}.om-widget-title{display:flex;align-items:center;gap:10px}.om-widget-icon{width:38px;height:38px;border-radius:12px;display:grid;place-items:center;background:#edf3ff;color:#315db2;font-weight:900}.om-widget-title h3{margin:0;font-size:16px}.om-widget-title small{color:#9a7625;font-size:8px;letter-spacing:.12em;font-weight:900}.om-widget-tools{display:flex;gap:4px}.om-widget-grip,.om-widget-remove{border:0;background:transparent;color:#8a958e;cursor:pointer}.om-widget-grip{font-size:15px;letter-spacing:-3px}.om-widget-remove{font-size:21px}.om-ai-badge{display:inline-flex;border-radius:999px;background:#eef5ff;color:#315db2;padding:6px 9px;font-size:9px;font-weight:900;letter-spacing:.08em}.om-ai-post p{font-size:16px;line-height:1.55;margin:11px 0;color:#293d34}.om-ai-post small,.om-widget-empty span{display:block;color:#829087;font-size:10px}.om-post-list{display:grid}.om-post-row,.om-lesson-row{display:grid;grid-template-columns:34px 1fr auto;gap:10px;text-align:left;align-items:center;border:0;border-top:1px solid #eee9df;background:transparent;padding:11px 0;cursor:pointer;width:100%;color:inherit}.om-row-avatar{width:34px;height:34px;border-radius:50%;display:grid;place-items:center;background:#edf3ff;color:#315db2;font-size:10px;font-weight:900}.om-post-row b,.om-post-row small,.om-lesson-row b,.om-lesson-row small{display:block}.om-post-row b,.om-lesson-row b{font-size:12px}.om-post-row small,.om-lesson-row small{color:#758279;font-size:10px;margin-top:3px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.om-post-row time{font-size:9px;color:#9aa39d}.om-widget-link{border:0;background:transparent;color:#315db2;font-weight:800;font-size:11px;padding:6px 0;cursor:pointer}.om-lesson-num{width:34px;height:34px;border-radius:11px;background:#fbf2d9;color:#a97d27;display:grid;place-items:center;font-weight:900}.om-lesson-row strong{color:#315db2}.om-community-feature,.om-notes-widget,.om-custom-widget{display:flex;gap:13px;align-items:flex-start}.om-community-mark{width:45px;height:45px;border-radius:14px;background:#eaf6ef;color:#246f57;display:grid;place-items:center;font-size:20px}.om-community-feature b{font-size:15px}.om-community-feature p,.om-notes-widget p,.om-custom-widget p{margin:5px 0 0;color:#738078;font-size:11px;line-height:1.5}.om-rank-widget{display:grid;grid-template-columns:58px 1fr auto;gap:13px;align-items:center}.om-rank-avatar{width:58px;height:58px;border-radius:50%;padding:3px;background:#f5ecd5}.om-rank-avatar img{width:100%;height:100%;border-radius:50%;object-fit:cover;object-position:center top}.om-rank-main>div:first-child{display:flex;gap:7px;align-items:baseline}.om-rank-main>div:first-child span{font-size:11px;color:#c18e2f;font-weight:900}.om-rank-main>div:first-child b{font-size:11px;color:#65746c}.om-rank-main>strong{display:block;font-size:20px;margin:3px 0}.om-rank-main>strong small{font-size:9px;color:#87928b}.om-rank-main>small{font-size:9px;color:#8a958e}.om-progress{height:6px;background:#e9eeea;border-radius:99px;overflow:hidden}.om-progress i{display:block;height:100%;background:linear-gradient(90deg,#246f57,#c89d3c)}.om-rank-stat{text-align:right}.om-rank-stat b{display:block;font-size:20px}.om-rank-stat small{font-size:9px;color:#89948d}.om-daily{display:flex;align-items:center;gap:12px}.om-daily-fire{font-size:30px}.om-daily p{margin:4px 0 0;font-size:10px;color:#7a877f}.om-action{margin-left:auto;border:0;border-radius:9px;padding:9px 12px;background:#183d70;color:#fff;font-weight:800;cursor:pointer}.om-bottom-add{width:100%;margin-top:16px;border:1px dashed #b8c6d9;background:#fff;border-radius:16px;padding:17px;color:#315db2;font-weight:900;cursor:pointer}.om-home-builder-overlay{position:fixed;inset:0;z-index:2147482000;background:rgba(11,27,21,.35);backdrop-filter:blur(5px);display:flex;justify-content:flex-end}.om-home-builder{width:min(460px,100vw);height:100%;background:#fffdf8;box-shadow:-20px 0 70px rgba(15,35,28,.2);display:flex;flex-direction:column}.om-home-builder header{padding:25px 23px 18px;border-bottom:1px solid #ebe5da;display:flex;justify-content:space-between;gap:12px}.om-home-builder header h2{margin:4px 0;font-size:24px;color:#183d70}.om-home-builder header p{margin:0;color:#758279;font-size:11px;line-height:1.5}.om-builder-close{border:0;background:transparent;font-size:27px;color:#7a837e;cursor:pointer}.om-builder-tabs{display:flex;gap:6px;padding:13px 18px;border-bottom:1px solid #eee9df}.om-builder-tabs button{border:1px solid #e1e3df;background:#fff;border-radius:999px;padding:7px 11px;font-size:10px;font-weight:800;color:#68756d;cursor:pointer}.om-builder-tabs button.active{background:#183d70;color:#fff;border-color:#183d70}.om-component-options{padding:13px 17px;overflow:auto;flex:1}.om-component-option{width:100%;display:grid;grid-template-columns:42px 1fr auto;gap:11px;align-items:center;text-align:left;border:1px solid #e6e1d7;background:#fff;border-radius:14px;padding:12px;margin-bottom:9px;cursor:pointer}.om-component-option:hover,.om-component-option.selected{border-color:#9bb0d4;background:#f7f9ff}.om-component-option>span{width:38px;height:38px;border-radius:11px;display:grid;place-items:center;background:#eef3ff;color:#315db2;font-size:18px}.om-component-option b,.om-component-option small{display:block}.om-component-option b{font-size:13px;color:#273b32}.om-component-option small{font-size:10px;color:#7a877f;margin-top:3px;line-height:1.35}.om-component-option>strong{color:#315db2;font-size:10px}.om-builder-foot{display:flex;align-items:center;justify-content:space-between;gap:12px;padding:15px 18px;border-top:1px solid #ebe5da;background:#fff}.om-builder-foot span{font-size:9px;color:#87928b}.om-builder-done{border:0;background:#183d70;color:#fff;border-radius:10px;padding:10px 16px;font-weight:900;cursor:pointer}.om-config-form{padding:20px;flex:1}.om-config-form label{display:grid;gap:7px;font-weight:800;font-size:11px;color:#34483e}.om-config-form select{border:1px solid #ddd8cd;border-radius:11px;padding:12px;background:#fff;font:inherit}.om-config-note{margin-top:16px;padding:13px;border-radius:12px;background:#f4f6f3;color:#6f7d75;font-size:10px;line-height:1.55}.om-widget-empty{padding:14px 0;color:#5d6d64}.om-widget-empty b{display:block;margin-bottom:5px}.om-custom-widget{display:block}.om-custom-widget h4{margin:0}.om-custom-widget a{display:inline-block;margin-top:8px;color:#315db2;font-weight:800;font-size:11px}
  @media(max-width:850px){.om-home-grid{grid-template-columns:1fr}.om-hero-inner{padding:24px;min-height:270px}.om-home-profile-card{margin:-22px 20px 0}.om-home-header{padding-left:0;padding-right:0}}
  @media(max-width:560px){.om-home-header{align-items:flex-start;flex-direction:column}.om-profile-hero{border-radius:20px}.om-hero-inner{align-items:center;flex-direction:column;text-align:center}.om-hero-identity h1{font-size:30px}.om-edit-profile{margin:0}.om-home-profile-card{margin:-16px 10px 0;padding:17px}.om-profile-card-top{flex-direction:column}.om-profile-card-rank{text-align:left}.om-profile-xp{grid-template-columns:80px 1fr 80px}.om-home-builder-bar{align-items:flex-start;flex-direction:column}}
  `;document.head.appendChild(style);

  function showHome(){
    if(!me || !profile){return;}
    document.querySelectorAll('#appView .page').forEach(p=>p.classList.add('hidden'));
    $('publicHomePage')?.classList.remove('hidden');
    document.querySelectorAll('.side').forEach(b=>b.classList.toggle('active',b.dataset.page==='public-home'));
    document.querySelectorAll('.app-nav-link[data-page]').forEach(b=>b.classList.toggle('active',b.dataset.page==='public-home'));
    if(!mounted) load(); else render();
  }

  function interceptHome(){
    document.addEventListener('click',e=>{
      const b=e.target.closest?.('[data-page="public-home"]');
      if(!b)return;
      e.preventDefault();e.stopImmediatePropagation();showHome();
    },true);
    const observer=new MutationObserver(()=>{
      const app=$('appView');
      if(app && !app.classList.contains('hidden') && me && profile && !mounted) showHome();
    });
    observer.observe(document.body,{attributes:true,subtree:true,attributeFilter:['class']});
  }

  sb.auth.onAuthStateChange((event,session)=>{
    if(session){me=session.user;setTimeout(()=>{if(!profile)load();},120);}
    else{me=null;profile=null;mounted=false;}
  });
  interceptHome();
  setTimeout(()=>{sb.auth.getSession().then(({data})=>{if(data.session){me=data.session.user;load();}});},250);
})();