/* OneMuslim Profile Experience v1 — polished personal profile, Ashab carousel, first-post CTA. */
(function(){
  'use strict';
  const client=()=>window.OneMuslimSupabaseClient?.getClient?.()||window.supabase?.createClient?.(window.APP_CONFIG?.SUPABASE_URL,window.APP_CONFIG?.SUPABASE_ANON_KEY);
  const esc=s=>String(s??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[m]));
  const display=p=>p?.display_name||[p?.first_name,p?.last_name].filter(Boolean).join(' ')||p?.username||'OneMuslim Member';
  const avatar=p=>{
    const g=(p?.avatar_gender||p?.avatar_config?.gender)==='female'?'female':'male';
    const platinum=(p?.avatar_package||p?.avatar_config?.package)==='platinum_package'&&Number(p?.xp_total||p?.xp||0)>=10000;
    return platinum?(g==='female'?'/assets/avatar/platinum/platinum-female.PNG':'/assets/avatar/platinum/platinum-male.PNG'):(g==='female'?'/assets/avatar/base/avatar-master-female.jpeg':'/assets/avatar/base/avatar-master-male.jpeg');
  };
  const initials=n=>String(n||'?').trim().split(/\s+/).map(x=>x[0]).join('').slice(0,2).toUpperCase();
  const ago=d=>{const s=Math.max(0,(Date.now()-new Date(d).getTime())/1000);return s<60?'just now':s<3600?Math.floor(s/60)+'m':s<86400?Math.floor(s/3600)+'h':s<604800?Math.floor(s/86400)+'d':new Date(d).toLocaleDateString();};

  function styles(){
    if(document.getElementById('om-profile-experience'))return;
    const s=document.createElement('style');s.id='om-profile-experience';s.textContent=`
      #profilePage.om-self-profile{background:transparent!important}
      .om-self-wrap{max-width:1080px;margin:0 auto;padding:22px 0 80px}
      .om-self-card{overflow:hidden;border:1px solid rgba(31,106,85,.18);border-radius:30px;background:linear-gradient(180deg,#fffefb,#f7faf7);box-shadow:0 20px 60px rgba(19,55,43,.10)}
      .om-self-cover{height:190px;position:relative;background:linear-gradient(135deg,#123d2b,#1f6a55 55%,#d4af37)}
      .om-self-cover:after{content:"";position:absolute;inset:0;background:radial-gradient(circle at 80% 20%,rgba(255,255,255,.28),transparent 28%),linear-gradient(120deg,transparent 30%,rgba(255,255,255,.07),transparent 70%)}
      .om-self-top-actions{position:absolute;right:18px;top:18px;z-index:3;display:flex;gap:8px}
      .om-self-top-actions button{border:1px solid rgba(255,255,255,.55);background:rgba(255,255,255,.88);color:#173b2c;border-radius:12px;padding:10px 14px;font-weight:850;cursor:pointer;backdrop-filter:blur(8px)}
      .om-self-body{padding:0 30px 32px}
      .om-self-avatar{width:128px;height:128px;margin-top:-64px;border:6px solid #fff;border-radius:50%;overflow:hidden;background:#e9f0eb;box-shadow:0 14px 35px rgba(0,0,0,.18);position:relative;z-index:2}
      .om-self-avatar img{width:100%;height:100%;object-fit:cover;object-position:center top}
      .om-self-main{display:flex;justify-content:space-between;align-items:flex-start;gap:24px;margin-top:15px}
      .om-self-kicker{font-size:10px;letter-spacing:.16em;font-weight:900;color:#1f6a55}
      .om-self-main h1{margin:5px 0 2px;font:700 clamp(30px,5vw,44px)/1.05 Georgia,serif;color:#18392f}
      .om-self-handle{color:#73827b;font-size:14px}
      .om-self-bio{max-width:700px;color:#53665e;line-height:1.65;margin:13px 0 0}
      .om-self-edit{border:0;background:#183f31;color:white;border-radius:13px;padding:12px 17px;font-weight:850;cursor:pointer}
      .om-self-chips{display:flex;flex-wrap:wrap;gap:8px;margin-top:18px}
      .om-self-chip{padding:8px 11px;border-radius:999px;background:#edf5f0;border:1px solid #dce9e1;color:#285641;font-size:12px;font-weight:800}
      .om-self-stats{display:grid;grid-template-columns:repeat(3,1fr);gap:10px;margin-top:22px}
      .om-self-stat{padding:15px;border-radius:17px;background:#fff;border:1px solid #e1e9e3}
      .om-self-stat b{display:block;font-size:22px;color:#18392f}.om-self-stat span{font-size:10px;text-transform:uppercase;letter-spacing:.08em;color:#7a8982;font-weight:800}
      .om-self-section{margin-top:28px}.om-self-section-head{display:flex;align-items:end;justify-content:space-between;gap:10px;margin-bottom:12px}.om-self-section h2{margin:0;color:#18392f;font-size:21px}.om-self-section p{margin:3px 0 0;color:#7b8882;font-size:12px}
      .om-ashab-carousel{display:flex;gap:12px;overflow-x:auto;padding:4px 2px 12px;scroll-snap-type:x mandatory;scrollbar-width:thin}
      .om-ashab-card{flex:0 0 190px;scroll-snap-align:start;padding:16px;border:1px solid #dfe9e3;border-radius:20px;background:rgba(255,255,255,.9);box-shadow:0 8px 24px rgba(25,62,48,.06)}
      .om-ashab-card img{width:58px;height:58px;border-radius:50%;object-fit:cover;object-position:center top;background:#edf4ef;border:3px solid #fff;box-shadow:0 5px 15px rgba(0,0,0,.12)}
      .om-ashab-card strong{display:block;margin-top:10px;color:#18392f;font-size:14px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.om-ashab-card small{color:#7b8982}.om-ashab-badge{display:inline-block;margin-top:9px;padding:5px 8px;border-radius:999px;background:#f5ead3;color:#765b19;font-size:9px;font-weight:900;letter-spacing:.08em}
      .om-profile-posts{display:grid;gap:12px}.om-profile-post{padding:18px;border:1px solid #e0e8e2;border-radius:18px;background:#fff}.om-profile-post-head{display:flex;gap:10px;align-items:center}.om-profile-post-avatar{width:40px;height:40px;border-radius:50%;overflow:hidden;background:#edf4ef}.om-profile-post-avatar img{width:100%;height:100%;object-fit:cover}.om-profile-post-head strong{display:block;color:#18392f}.om-profile-post-head small{color:#84918c}.om-profile-post-body{margin-top:12px;color:#394c44;line-height:1.65;white-space:pre-wrap;overflow-wrap:anywhere}
      .om-first-post{padding:24px;border-radius:22px;border:1px solid #dce9e1;background:linear-gradient(135deg,#f0f7f2,#fffaf0);display:flex;align-items:center;justify-content:space-between;gap:18px}.om-first-post h3{margin:0;color:#18392f;font-size:20px}.om-first-post p{margin:5px 0 0;color:#6c7b74;font-size:13px}.om-first-post button{flex:0 0 auto;border:0;border-radius:13px;background:#c89d3c;color:#fff;padding:12px 17px;font-weight:900;cursor:pointer}.om-profile-composer{display:none;margin-top:14px;padding:16px;border:1px solid #dce8e1;border-radius:18px;background:#fff}.om-profile-composer.open{display:block}.om-profile-composer textarea{width:100%;min-height:110px;box-sizing:border-box;border:1px solid #dce2dd;border-radius:14px;padding:12px;resize:vertical;font:500 14px/1.5 system-ui}.om-profile-composer-footer{display:flex;justify-content:space-between;align-items:center;gap:10px;margin-top:10px}.om-profile-composer button{border:0;border-radius:11px;padding:10px 15px;font-weight:850;cursor:pointer}.om-profile-cancel{background:#eef3ef;color:#285641}.om-profile-publish{background:#183f31;color:white}
      @media(max-width:700px){.om-self-wrap{padding:12px 0 60px}.om-self-cover{height:155px}.om-self-body{padding:0 16px 24px}.om-self-avatar{width:104px;height:104px;margin-top:-52px}.om-self-main{display:block}.om-self-edit{margin-top:14px;width:100%}.om-self-stats{grid-template-columns:1fr 1fr}.om-self-stat:last-child{grid-column:1/-1}.om-first-post{display:block}.om-first-post button{width:100%;margin-top:14px}.om-ashab-card{flex-basis:170px}}
    `;document.head.appendChild(s);
  }

  async function getAshab(id){
    const sb=client(); if(!sb)return[];
    const r=await sb.from('ashab_friendships').select('requester_id,addressee_id,status,updated_at').eq('status','accepted').or('requester_id.eq.'+id+',addressee_id.eq.'+id);
    if(r.error){console.warn('Ashab load:',r.error);return[]}
    const ids=(r.data||[]).map(x=>x.requester_id===id?x.addressee_id:x.requester_id).filter(Boolean);
    if(!ids.length)return[];
    const p=await sb.from('profiles').select('*').in('id',ids); return p.error?[]:(p.data||[]);
  }
  async function getPosts(id){
    const sb=client();if(!sb)return[];
    const r=await sb.from('posts').select('id,user_id,body,created_at').eq('user_id',id).order('created_at',{ascending:false}).limit(12);
    return r.error?[]:(r.data||[]);
  }

  async function render(){
    const page=document.getElementById('profilePage');const p=window.profile;const me=window.me||p?.id;
    if(!page||!p||!me)return;
    styles();page.classList.remove('hidden');page.classList.add('om-self-profile');page.dataset.profileMode='self';
    document.querySelectorAll('#appView .content > .page').forEach(x=>{if(x!==page)x.classList.add('hidden')});
    const [ashab,posts]=await Promise.all([getAshab(me),getPosts(me)]);
    const xp=Number(p.xp_total||p.xp||0);const title=p.profile_title||'Muslim';const loc=[p.city,p.state,p.country].filter(Boolean).join(', ')||p.location;
    page.innerHTML=`
      <div class="om-self-wrap"><article class="om-self-card">
        <div class="om-self-cover"><div class="om-self-top-actions"><button id="omSelfEdit">Edit profile</button></div></div>
        <div class="om-self-body"><div class="om-self-avatar"><img src="${esc(avatar(p))}" alt="${esc(display(p))}"></div>
          <div class="om-self-main"><div><span class="om-self-kicker">ONE MUSLIM · YOUR PROFILE</span><h1>${esc(display(p))}</h1><div class="om-self-handle">@${esc(p.username||'member')} · ${esc(title)}</div><p class="om-self-bio">${esc(p.bio||'Your profile is your space. Add a short bio so the community can get to know you.')}</p></div><button class="om-self-edit" id="omSelfEdit2">✦ Customize profile</button></div>
          <div class="om-self-chips">${loc?`<span class="om-self-chip">📍 ${esc(loc)}</span>`:''}<span class="om-self-chip">⭐ ${xp.toLocaleString()} XP</span>${xp>=10000?'<span class="om-self-chip">✦ Platinum</span>':''}</div>
          <div class="om-self-stats"><div class="om-self-stat"><b>${posts.length}</b><span>Posts</span></div><div class="om-self-stat"><b>${ashab.length}</b><span>Ashab</span></div><div class="om-self-stat"><b>${p.group_team||p.community?'1':'0'}</b><span>Community</span></div></div>

          <section class="om-self-section"><div class="om-self-section-head"><div><h2>Your Ashab</h2><p>People you’ve accepted as Ashab.</p></div></div>
            <div class="om-ashab-carousel">${ashab.length?ashab.map(a=>`<div class="om-ashab-card" data-ashab-id="${esc(a.id)}"><img src="${esc(avatar(a))}" alt="${esc(display(a))}"><strong>${esc(display(a))}</strong><small>@${esc(a.username||'member')}</small><span class="om-ashab-badge">ASHAB</span></div>`).join(''):'<div class="om-first-post" style="width:100%;box-sizing:border-box"><div><h3>Your Ashab circle starts here.</h3><p>Add people as Ashab and they’ll appear in this carousel.</p></div></div>'}</div>
          </section>

          <section class="om-self-section"><div class="om-self-section-head"><div><h2>Your posts</h2><p>${posts.length?'Your latest reflections and community posts.':'Your profile is ready for its first post.'}</p></div></div>
            ${posts.length?`<div class="om-profile-posts">${posts.map(q=>`<article class="om-profile-post"><div class="om-profile-post-head"><span class="om-profile-post-avatar"><img src="${esc(avatar(p))}" alt=""></span><span><strong>${esc(display(p))}</strong><small>@${esc(p.username||'member')} · ${esc(ago(q.created_at))}</small></span></div>${q.body?`<div class="om-profile-post-body">${esc(q.body)}</div>`:''}</article>`).join('')}</div>`:`
              <div class="om-first-post"><div><h3>Make your first post ✨</h3><p>Share a thought, lesson, reminder, or something useful with the community.</p></div><button id="omStartPost">Create post</button></div>
              <div class="om-profile-composer" id="omProfileComposer"><textarea id="omProfilePostText" maxlength="500" placeholder="What would you like to share?"></textarea><div class="om-profile-composer-footer"><span id="omProfileCount">0/500</span><div><button class="om-profile-cancel" id="omPostCancel">Cancel</button><button class="om-profile-publish" id="omPostPublish">Post</button></div></div></div>`}
          </section>
        </div>
      </article></div>`;
    const openEditor=()=>window.OneMuslimProfileEditorBridge?.open?.()||window.OneMuslimProfileBuilder?.open?.()||window.openProfileBuilder?.();
    page.querySelectorAll('#omSelfEdit,#omSelfEdit2').forEach(b=>b.onclick=openEditor);
    page.querySelectorAll('[data-ashab-id]').forEach(card=>card.onclick=()=>window.OneMuslimOpenProfile?.(card.dataset.ashabId));
    const start=page.querySelector('#omStartPost'),composer=page.querySelector('#omProfileComposer'),ta=page.querySelector('#omProfilePostText');
    start?.addEventListener('click',()=>{composer?.classList.add('open');ta?.focus()});
    ta?.addEventListener('input',()=>page.querySelector('#omProfileCount').textContent=(ta.value.length)+'/500');
    page.querySelector('#omPostCancel')?.addEventListener('click',()=>composer?.classList.remove('open'));
    page.querySelector('#omPostPublish')?.addEventListener('click',async()=>{
      const body=ta.value.trim();if(!body){window.toast?.('Write something first.');return}
      const b=page.querySelector('#omPostPublish');b.disabled=true;b.textContent='Posting…';
      try{const r=await client().from('posts').insert({user_id:me,body}).select('id').single();if(r.error)throw r.error;window.toast?.('Posted to the community ✨');await render();}catch(e){window.toast?.(e.message||'Unable to post.');}finally{b.disabled=false;b.textContent='Post'}
    });
  }

  function hook(){
    const original=window.renderApp;
    if(typeof original==='function'&&!original.__omWrapped){
      const wrapped=function(){const out=original.apply(this,arguments);setTimeout(()=>{if(window.profile&&!document.getElementById('profilePage')?.classList.contains('hidden'))render()},0);return out};
      wrapped.__omWrapped=true;window.renderApp=wrapped;
    }
    document.addEventListener('click',e=>{
      const nav=e.target.closest?.('[data-page="profile"]');if(nav)setTimeout(()=>{if(window.profile)render()},20);
    });
    window.addEventListener('profile:updated',()=>setTimeout(render,20));
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',hook,{once:true});else hook();
  window.OneMuslimProfileExperience={render};
})();