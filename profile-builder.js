/* OneMuslim Unified Profile Builder v5 — single authoritative profile editor. */
(function(){
  'use strict';
  const groups=['Islamic Society','Apologetics','Da’wah','Qur’an Study','Tafsir Circle','Hadith Study','Tajweed','The Belt Boys','Torah Boys'];
  const backgrounds=[['Islamic Geometry','linear-gradient(135deg,#fbf5e8,#f1e6cf)'],['Mosque Silhouette','linear-gradient(135deg,#f7ecd6,#ead8b5)'],['Islamic Arch','linear-gradient(135deg,#f8f2e5,#e9dfcc)'],['Crescent & Stars','linear-gradient(135deg,#0e2d27,#193f35)'],['Luxury Gold','linear-gradient(135deg,#fff8e8,#d8b66a)'],['Emerald','linear-gradient(135deg,#0d4b3d,#1f6b57)'],['Dark Mosque','linear-gradient(135deg,#061e1a,#173a31)'],['Minimal Cream','linear-gradient(135deg,#fffdf8,#f4f0e7)']];
  const accents=[['emerald','#1f6a55'],['gold','#c89d3c'],['navy','#243b62'],['plum','#70536f'],['ruby','#a34d52']];
  const esc=s=>String(s??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[m]));
  const client=()=>window.OneMuslimSupabaseClient?.getClient?.()||window.supabase?.createClient?.(window.APP_CONFIG?.SUPABASE_URL,window.APP_CONFIG?.SUPABASE_ANON_KEY);
  const p0=()=>window.profile||{};
  const xp=()=>Number(p0().xp_total??p0().xp??0)||0;
  const platinum=()=>xp()>=10000;

  function inject(){
    if(document.getElementById('om-pb-v5-styles'))return;
    const s=document.createElement('style');s.id='om-pb-v5-styles';s.textContent=`
      .om-pb-tabs{gap:8px}.om-pb-tab{min-width:62px;min-height:62px;font-size:24px;display:flex;align-items:center;justify-content:center;flex-direction:column;gap:3px}.om-pb-tab small{font-size:11px}.om-pb-profile-fields{display:grid;gap:14px}.om-pb-profile-fields label{display:grid;gap:6px}.om-pb-field-row{display:grid;grid-template-columns:1fr 1fr;gap:12px}.om-pb-profile-fields input,.om-pb-profile-fields textarea,.om-pb-profile-fields select{width:100%;box-sizing:border-box}.om-pb-field-xp{font-size:12px;color:#2d705b;font-weight:700}.om-pb-legacy-note{padding:13px 15px;border:1px solid #cbded4;border-radius:14px;background:#f3f7f4;color:#1f5b49}.om-pb-current-avatar{display:flex;align-items:center;gap:12px;margin-bottom:14px}.om-pb-avatar-photo{width:88px;height:88px;border-radius:50%;overflow:hidden;border:3px solid #fff;box-shadow:0 8px 25px #0002;background:#edf4ef;display:flex;align-items:center;justify-content:center;font-size:28px;font-weight:800}.om-pb-avatar-photo img{width:100%;height:100%;object-fit:contain}.pb-platinum-thumb{width:56px;height:56px;object-fit:contain}.om-pb-note{line-height:1.45}.om-pb-community-actions{display:flex;gap:10px;align-items:center;flex-wrap:wrap}.om-pb-create-community{display:none}.om-pb-create-community.visible{display:block}@media(max-width:620px){.om-pb-field-row{grid-template-columns:1fr}}
    `;document.head.appendChild(s);
  }

  function open(){
    inject();
    if(document.querySelector('.om-pb-overlay'))return;
    const p={...p0()};
    const o=document.createElement('div');o.className='om-pb-overlay';o.setAttribute('role','dialog');o.setAttribute('aria-modal','true');
    const unlocked=platinum();
    const selectedAvatar=p.avatar_url||p.avatar_asset||'';
    o.innerHTML=`<section class="om-pb-shell">
      <header class="om-pb-top"><div><span class="om-pb-kicker">ONE MUSLIM · PROFILE</span><h2>Edit your profile</h2></div><button class="om-pb-close" aria-label="Close">×</button></header>
      <nav class="om-pb-tabs" aria-label="Profile editor sections"><button class="om-pb-tab active" data-tab="avatar">◉<small>Avatar</small></button><button class="om-pb-tab" data-tab="background">▧<small>Background</small></button><button class="om-pb-tab" data-tab="style">✦<small>Personalize</small></button><button class="om-pb-tab" data-tab="profile">◎<small>Profile</small></button><button class="om-pb-tab" data-tab="privacy">⌁<small>Privacy</small></button></nav>
      <main class="om-pb-main">
        <div class="om-pb-preview"><div class="om-pb-preview-banner" id="pbPreviewBanner"></div><div class="om-pb-preview-body"><div class="om-pb-preview-avatar" id="pbPreviewAvatar"></div><div class="om-pb-preview-name" id="pbPreviewName">${esc(p.display_name||`${p.first_name||''} ${p.last_name||''}`.trim()||'Your Name')}</div><div class="om-pb-preview-meta">@${esc(p.username||'username')} · ${esc(p.profile_title||'Muslim')}</div><div class="om-pb-preview-stats"><span><b>${xp().toLocaleString()}</b> XP</span><span><b id="pbPreviewGroup">${esc(p.group_team||'—')}</b> Group</span></div></div></div>

        <section class="om-pb-panel active" data-panel="avatar"><div class="om-pb-heading"><span class="om-pb-kicker">IDENTITY</span><h3>Your selected avatar</h3><p>This avatar is your profile photo throughout OneMuslim.</p></div><div class="om-pb-card"><div class="om-pb-current-avatar"><div class="om-pb-avatar-photo" id="pbCurrentAvatar"></div><div><b>Profile photo</b><span>Your saved avatar is used on your profile, community posts and member surfaces.</span></div></div><label>Avatar identity</label><div class="om-pb-choices"><button class="om-pb-choice pb-gender ${p.avatar_gender!=='female'?'selected':''}" data-gender="male"><span class="fake-avatar">M</span>Male</button><button class="om-pb-choice pb-gender ${p.avatar_gender==='female'?'selected':''}" data-gender="female"><span class="fake-avatar">F</span>Female</button></div></div></section>

        <section class="om-pb-panel" data-panel="background"><div class="om-pb-heading"><span class="om-pb-kicker">ATMOSPHERE</span><h3>Set your background</h3><p>Choose the atmosphere behind your profile.</p></div><div class="om-pb-grid">${backgrounds.map((b,i)=>`<button class="om-pb-card om-pb-bg ${p.profile_background===(i===0?'default':b[0])?'selected':''}" data-bg="${esc(i===0?'default':b[0])}" style="background:${b[1]}"><strong>${b[0]}</strong></button>`).join('')}</div></section>

        <section class="om-pb-panel" data-panel="style"><div class="om-pb-heading"><span class="om-pb-kicker">PERSONALIZE</span><h3>Make it yours</h3><p>Premium avatar styling unlocks at 10,000 XP.</p></div><div class="om-pb-card"><label>Avatar finish</label><div class="om-pb-choices"><button class="om-pb-choice pb-package ${p.avatar_package!=='platinum_package'?'selected':''}" data-package="default"><span class="fake-avatar">◉</span>Original</button><button class="om-pb-choice pb-package ${p.avatar_package==='platinum_package'?'selected':''} ${unlocked?'':'locked'}" data-package="platinum_package" ${unlocked?'':'disabled'}><img class="pb-platinum-thumb" src="assets/avatars/${p.avatar_gender==='female'?'platinum-female.PNG':'platinum-male.PNG'}" alt="Platinum avatar">Platinum${unlocked?'':' 🔒'}</button></div><div class="om-pb-note">${unlocked?'Platinum unlocked.':'Platinum unlocks at 10,000 XP. '+Math.max(0,10000-xp()).toLocaleString()+' XP remaining.'}</div></div><div class="om-pb-card" style="margin-top:14px"><label>Accent color</label><div class="om-pb-swatches">${accents.map(a=>`<button class="om-pb-swatch ${p.profile_accent===a[0]?'selected':''}" data-accent="${a[0]}" style="background:${a[1]}" aria-label="${a[0]}"></button>`).join('')}</div></div></section>

        <section class="om-pb-panel" data-panel="profile"><div class="om-pb-heading"><span class="om-pb-kicker">PROFILE</span><h3>Your profile information</h3><p>All fields from the original profile editor live here.</p></div><div class="om-pb-profile-fields">
          <div class="om-pb-field-row"><label>Display name<input id="pfDisplay" maxlength="80" value="${esc(p.display_name||'')}"></label><label>Username<input id="pfUser" maxlength="30" value="${esc(p.username||'')}"></label></div>
          <div class="om-pb-field-row"><label>First name<input id="pfFirst" maxlength="50" value="${esc(p.first_name||'')}"></label><label>Last name<input id="pfLast" maxlength="50" value="${esc(p.last_name||'')}"></label></div>
          <label>Bio<textarea id="pfBio" maxlength="280" rows="4">${esc(p.bio||'')}</textarea></label>
          <label>Location<input id="pfLocation" maxlength="100" value="${esc(p.location||'')}"></label>
          <div class="om-pb-legacy-note"><b>Complete these fields to earn XP</b><br><span>+100 XP each · awarded once per field</span></div>
          <div class="om-pb-field-row"><label>City <span class="om-pb-field-xp">+100 XP</span><input id="pfCity" maxlength="80" value="${esc(p.city||'')}" placeholder="Minneapolis"></label><label>State <span class="om-pb-field-xp">+100 XP</span><input id="pfState" maxlength="80" value="${esc(p.state||'')}" placeholder="Minnesota"></label></div>
          <div class="om-pb-field-row"><label>Country <span class="om-pb-field-xp">+100 XP</span><input id="pfCountry" maxlength="80" value="${esc(p.country||'')}" placeholder="United States"></label><label>Gender <span class="om-pb-field-xp">+100 XP</span><select id="pfGender"><option value="">Select</option><option value="Male" ${p.gender==='Male'?'selected':''}>Male</option><option value="Female" ${p.gender==='Female'?'selected':''}>Female</option><option value="Non-binary" ${p.gender==='Non-binary'?'selected':''}>Non-binary</option><option value="Prefer not to say" ${p.gender==='Prefer not to say'?'selected':''}>Prefer not to say</option></select></label></div>
          <label>Website<input id="pfWebsite" maxlength="200" type="url" value="${esc(p.website||'')}" placeholder="https://"></label>
          <div class="om-pb-card"><label for="pbGroup">Community</label><div class="om-pb-community-actions"><select class="om-pb-select" id="pbGroup"><option value="">Select a community</option>${groups.map(g=>`<option value="${esc(g)}" ${p.group_team===g?'selected':''}>${esc(g)}</option>`).join('')}</select><button type="button" class="om-pb-btn om-pb-create-community" id="pbCreateCommunity">Create</button></div><div class="om-pb-note" id="pbCommunityStatus">${esc(p.group_team||'No community selected.')}</div></div>
        </div></section>

        <section class="om-pb-panel" data-panel="privacy"><div class="om-pb-heading"><span class="om-pb-kicker">CONTROL</span><h3>Privacy & visibility</h3></div><div class="om-pb-card"><label>Profile visibility</label><select class="om-pb-select" id="pbPrivacy"><option value="public" ${p.profile_visibility!=='private'?'selected':''}>Public — discoverable</option><option value="private" ${p.profile_visibility==='private'?'selected':''}>Private — hidden from People/Group filters</option></select></div></section>

        <div class="om-pb-actions"><button class="om-pb-btn" id="pbCancel">Cancel</button><button class="om-pb-btn primary" id="pbSave">Save changes</button></div>
      </main></section>`;
    document.body.appendChild(o);
    let draft={...p};

    const renderAvatar=()=>{
      const hosts=[o.querySelector('#pbCurrentAvatar'),o.querySelector('#pbPreviewAvatar')];
      let src=draft.avatar_url||draft.avatar_asset||'';
      if(draft.avatar_package==='platinum_package'&&unlocked)src=`assets/avatars/${draft.avatar_gender==='female'?'platinum-female.PNG':'platinum-male.PNG'}`;
      const html=src?`<img src="${esc(src)}" alt="Selected avatar">`:draft.avatar_gender==='female'?'F':'M';
      hosts.forEach(h=>{if(h)h.innerHTML=html;});
    };
    const preview=()=>{const b=backgrounds.find(x=>x[0]===draft.profile_background);const banner=o.querySelector('#pbPreviewBanner');if(banner)banner.style.background=b?b[1]:'linear-gradient(135deg,#f5ead3,#dcebe3)';const n=o.querySelector('#pbPreviewName');if(n)n.textContent=draft.display_name||`${draft.first_name||''} ${draft.last_name||''}`.trim()||'Your Name';const g=o.querySelector('#pbPreviewGroup');if(g)g.textContent=draft.group_team||'—';renderAvatar();};
    const close=()=>o.remove();
    o.querySelector('.om-pb-close').onclick=close;o.querySelector('#pbCancel').onclick=close;o.addEventListener('click',e=>{if(e.target===o)close()});
    o.querySelectorAll('.om-pb-tab').forEach(t=>t.onclick=()=>{o.querySelectorAll('.om-pb-tab').forEach(x=>x.classList.toggle('active',x===t));o.querySelectorAll('.om-pb-panel').forEach(x=>x.classList.toggle('active',x.dataset.panel===t.dataset.tab));});
    o.querySelectorAll('.pb-gender').forEach(b=>b.onclick=()=>{draft.avatar_gender=b.dataset.gender;o.querySelectorAll('.pb-gender').forEach(x=>x.classList.toggle('selected',x===b));if(draft.avatar_package==='platinum_package'&&unlocked)draft.avatar_url=`assets/avatars/${draft.avatar_gender==='female'?'platinum-female.PNG':'platinum-male.PNG'}`;preview();});
    o.querySelectorAll('.pb-package').forEach(b=>b.onclick=()=>{if(b.disabled)return;draft.avatar_package=b.dataset.package;if(b.dataset.package==='platinum_package')draft.avatar_url=`assets/avatars/${draft.avatar_gender==='female'?'platinum-female.PNG':'platinum-male.PNG'}`;else if(p.avatar_package==='platinum_package'&&/platinum-/i.test(p.avatar_url||''))draft.avatar_url=null;o.querySelectorAll('.pb-package').forEach(x=>x.classList.toggle('selected',x===b));preview();});
    o.querySelectorAll('.om-pb-bg').forEach(b=>b.onclick=()=>{draft.profile_background=b.dataset.bg;o.querySelectorAll('.om-pb-bg').forEach(x=>x.classList.toggle('selected',x===b));preview();});
    o.querySelectorAll('.om-pb-swatch[data-accent]').forEach(b=>b.onclick=()=>{draft.profile_accent=b.dataset.accent;o.querySelectorAll('[data-accent]').forEach(x=>x.classList.toggle('selected',x===b));});
    const community=o.querySelector('#pbGroup'),create=o.querySelector('#pbCreateCommunity'),status=o.querySelector('#pbCommunityStatus');community.onchange=()=>{draft.group_team=community.value;status.textContent=community.value||'No community selected.';create.classList.toggle('visible',community.value==='__create__');};create.onclick=()=>{if(typeof window.openCommunityCreator==='function')window.openCommunityCreator();else status.textContent='Community creation will open from the Community Hub.';};

    o.querySelector('#pbSave').onclick=async()=>{
      const username=o.querySelector('#pfUser').value.trim().toLowerCase();
      if(!/^[a-z0-9_.-]{3,30}$/.test(username)){window.toast?.('Username must be 3–30 characters and use letters, numbers, dots, underscores, or hyphens.');return;}
      const sb=client();if(!sb){window.toast?.('Secure profile service is unavailable.');return;}
      const user=(await sb.auth.getUser()).data.user;if(!user){window.toast?.('Your session expired. Please sign in again.');return;}
      const taken=await sb.from('profiles').select('id').eq('username',username).neq('id',user.id).limit(1).maybeSingle();
      if(taken.error){window.toast?.('We could not validate the username. Please try again.');return;}
      if(taken.data){window.toast?.('That username is already taken.');return;}
      draft={...draft,display_name:o.querySelector('#pfDisplay').value.trim(),username,first_name:o.querySelector('#pfFirst').value.trim(),last_name:o.querySelector('#pfLast').value.trim(),bio:o.querySelector('#pfBio').value.trim(),location:o.querySelector('#pfLocation').value.trim(),city:o.querySelector('#pfCity').value.trim(),state:o.querySelector('#pfState').value.trim(),country:o.querySelector('#pfCountry').value.trim(),gender:o.querySelector('#pfGender').value,website:o.querySelector('#pfWebsite').value.trim(),group_team:community.value==='__create__'?'':community.value,profile_visibility:o.querySelector('#pbPrivacy').value};
      if(draft.avatar_package==='platinum_package'&&!unlocked){window.toast?.('Platinum requires 10,000 XP.');return;}
      const payload={display_name:draft.display_name,username:draft.username,first_name:draft.first_name,last_name:draft.last_name,bio:draft.bio,location:draft.location,city:draft.city,state:draft.state,country:draft.country,gender:draft.gender,website:draft.website,group_team:draft.group_team,profile_visibility:draft.profile_visibility,avatar_url:draft.avatar_url||null,avatar_asset:draft.avatar_asset||null,avatar_gender:draft.avatar_gender||null,avatar_package:draft.avatar_package||'default',profile_background:draft.profile_background||'default',profile_accent:draft.profile_accent||'emerald'};
      const {data,error}=await sb.from('profiles').update(payload).eq('id',user.id).select().single();
      if(error){window.toast?.(error.message||'Unable to save your profile.');return;}
      window.profile=data;
      close();
      window.OneMuslimPlatform?.refreshFloat?.();
      window.toast?.('Profile saved successfully.');
      document.getElementById('editProfile')?.focus();
    };
    preview();
  }

  function wire(){
    const b=document.getElementById('editProfile');
    if(b&&!b.dataset.pbv5){b.dataset.pbv5='1';b.onclick=e=>{e.preventDefault();e.stopPropagation();e.stopImmediatePropagation();open();};}
  }
  window.OneMuslimOpenProfileEditor=open;
  function init(){wire();new MutationObserver(wire).observe(document.body,{childList:true,subtree:true});}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();
})();
