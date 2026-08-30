/* OneMuslim unified Profile Editor — single source of truth.
 * Replaces the legacy inline editor. All legacy profile fields live in the Profile tab.
 */
(function(){
  'use strict';
  const groups=['Islamic Society','Apologetics','Da’wah','Qur’an Study','Tafsir Circle','Hadith Study','Tajweed','The Belt Boys','Torah Boys'];
  const backgrounds=[['Islamic Geometry','linear-gradient(135deg,#fbf5e8,#f1e6cf)'],['Mosque Silhouette','linear-gradient(135deg,#f7ecd6,#ead8b5)'],['Islamic Arch','linear-gradient(135deg,#f8f2e5,#e9dfcc)'],['Crescent & Stars','linear-gradient(135deg,#0e2d27,#193f35)'],['Luxury Gold','linear-gradient(135deg,#fff8e8,#d8b66a)'],['Emerald','linear-gradient(135deg,#0d4b3d,#1f6b57)'],['Dark Mosque','linear-gradient(135deg,#061e1a,#173a31)'],['Minimal Cream','linear-gradient(135deg,#fffdf8,#f4f0e7)']];
  const accents=[['emerald','#1f6a55'],['gold','#c89d3c'],['navy','#243b62'],['plum','#70536f'],['ruby','#a34d52']];
  const esc=s=>String(s??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[m]));
  const client=()=>window.OneMuslimSupabaseClient?.getClient?.()||window.supabase?.createClient?.(window.APP_CONFIG?.SUPABASE_URL,window.APP_CONFIG?.SUPABASE_ANON_KEY);
  const profile=()=>window.profile||{};
  const xp=()=>Number(profile().xp_total??profile().xp??0)||0;
  const avatar=()=>profile().avatar_url||profile().avatar_asset||'';
  const platinum=()=>xp()>=10000;
  const fallbackAvatar=()=>profile().avatar_gender==='female'?'F':'M';

  function inject(){
    if(document.getElementById('om-unified-editor-css'))return;
    const s=document.createElement('style');s.id='om-unified-editor-css';s.textContent=`
      .om-pb-profile-fields{display:grid;gap:14px}.om-pb-profile-fields label{display:grid;gap:6px}.om-pb-profile-fields input,.om-pb-profile-fields textarea,.om-pb-profile-fields select{width:100%;box-sizing:border-box}.om-pb-field-row{display:grid;grid-template-columns:1fr 1fr;gap:12px}.om-pb-legacy-note{padding:13px 15px;border:1px solid #cbded4;border-radius:14px;background:#f3f7f4;color:#1f5b49}.om-pb-avatar-photo{width:88px;height:88px;border-radius:50%;overflow:hidden;border:3px solid #fff;box-shadow:0 8px 25px #0002;background:#edf4ef;display:flex;align-items:center;justify-content:center;font-size:28px;font-weight:800}.om-pb-avatar-photo img{width:100%;height:100%;object-fit:contain}.om-pb-avatar-photo.small{width:54px;height:54px;border-width:2px}.om-pb-current-avatar{display:flex;align-items:center;gap:12px;margin-bottom:14px}.om-pb-current-avatar span{font-size:12px;color:#728078}.om-pb-tabs{overflow-x:auto}.om-pb-tab{flex:1}.om-pb-bg.selected{outline:3px solid #c89d3c;outline-offset:2px}.om-pb-choice.selected{outline:2px solid #1f6a55}.om-pb-swatch.selected{box-shadow:0 0 0 3px #fff,0 0 0 5px #1f6a55}.om-pb-profile-fields .field-xp{font-size:12px;color:#2d705b;font-weight:700}.om-pb-profile-fields .full{grid-column:1/-1}@media(max-width:620px){.om-pb-field-row{grid-template-columns:1fr}}
    `;document.head.appendChild(s);
  }

  function open(){
    if(document.querySelector('.om-pb-overlay'))return;
    inject();
    const p={...profile()};
    const o=document.createElement('div');o.className='om-pb-overlay';o.setAttribute('role','dialog');o.setAttribute('aria-modal','true');
    const current=avatar();
    o.innerHTML=`<section class="om-pb-shell">
      <header class="om-pb-top"><div><span class="om-pb-kicker">ONE MUSLIM · PROFILE</span><h2>Edit your profile</h2></div><button class="om-pb-close" aria-label="Close">×</button></header>
      <nav class="om-pb-tabs" aria-label="Profile editor sections">
        <button class="om-pb-tab active" data-tab="avatar">◉<small>Avatar</small></button><button class="om-pb-tab" data-tab="background">▧<small>Background</small></button><button class="om-pb-tab" data-tab="style">✦<small>Personalize</small></button><button class="om-pb-tab" data-tab="profile">◎<small>Profile</small></button><button class="om-pb-tab" data-tab="privacy">⌁<small>Privacy</small></button>
      </nav>
      <main class="om-pb-main">
        <div class="om-pb-preview"><div class="om-pb-preview-banner" id="pbPreviewBanner"></div><div class="om-pb-preview-body"><div class="om-pb-preview-avatar" id="pbPreviewAvatar"></div><div class="om-pb-preview-name" id="pbPreviewName">${esc(p.display_name||`${p.first_name||''} ${p.last_name||''}`.trim()||'Your Name')}</div><div class="om-pb-preview-meta">@${esc(p.username||'username')} · ${esc(p.profile_title||'Muslim')}</div><div class="om-pb-preview-stats"><span><b>${xp().toLocaleString()}</b> XP</span><span><b>${esc(p.group_team||'—')}</b> Group</span></div></div></div>
        <section class="om-pb-panel active" data-panel="avatar"><div class="om-pb-heading"><span class="om-pb-kicker">IDENTITY</span><h3>Choose your avatar</h3><p>Your selected avatar is also your profile photo throughout OneMuslim.</p></div><div class="om-pb-card"><div class="om-pb-current-avatar"><div class="om-pb-avatar-photo" id="pbCurrentAvatar">${current?`<img src="${esc(current)}" alt="Selected avatar">`:fallbackAvatar()}</div><div><b>Selected profile photo</b><span>Saved avatar used on your profile and community surfaces.</span></div></div><label>Identity</label><div class="om-pb-choices"><button class="om-pb-choice pb-gender ${p.avatar_gender!=='female'?'selected':''}" data-gender="male">Male</button><button class="om-pb-choice pb-gender ${p.avatar_gender==='female'?'selected':''}" data-gender="female">Female</button></div></div></section>
        <section class="om-pb-panel" data-panel="background"><div class="om-pb-heading"><span class="om-pb-kicker">ATMOSPHERE</span><h3>Set your background</h3></div><div class="om-pb-grid">${backgrounds.map((b,i)=>`<button class="om-pb-card om-pb-bg ${((p.profile_background||'default')===(i===0?'default':b[0]))?'selected':''}" data-bg="${esc(i===0?'default':b[0])}" style="background:${b[1]}"><strong>${b[0]}</strong></button>`).join('')}</div></section>
        <section class="om-pb-panel" data-panel="style"><div class="om-pb-heading"><span class="om-pb-kicker">PERSONALIZE</span><h3>Make it yours</h3></div><div class="om-pb-card"><label>Avatar finish</label><div class="om-pb-choices"><button class="om-pb-choice pb-package ${p.avatar_package==='default'?'selected':''}" data-package="default">Original</button><button class="om-pb-choice pb-package ${p.avatar_package==='platinum_package'?'selected':''} ${platinum()?'':'locked'}" data-package="platinum_package" ${platinum()?'':'disabled'}>Platinum${platinum()?'':' 🔒'}</button></div><div class="om-pb-note">Platinum unlocks at 10,000 XP. ${platinum()?'Unlocked.':Math.max(0,10000-xp()).toLocaleString()+' XP remaining.'}</div></div><div class="om-pb-card" style="margin-top:14px"><label>Accent color</label><div class="om-pb-swatches">${accents.map(a=>`<button class="om-pb-swatch ${p.profile_accent===a[0]?'selected':''}" data-accent="${a[0]}" style="background:${a[1]}" aria-label="${a[0]}"></button>`).join('')}</div></div></section>
        <section class="om-pb-panel" data-panel="profile"><div class="om-pb-heading"><span class="om-pb-kicker">PROFILE</span><h3>Your profile information</h3><p>The fields from the previous editor are all here. Nothing is lost.</p></div><div class="om-pb-profile-fields">
          <div class="om-pb-field-row"><label>Display name<input id="pfDisplay" maxlength="80" value="${esc(p.display_name||'')}"></label><label>Username<input id="pfUser" maxlength="30" value="${esc(p.username||'')}"></label></div>
          <div class="om-pb-field-row"><label>First name<input id="pfFirst" maxlength="50" value="${esc(p.first_name||'')}"></label><label>Last name<input id="pfLast" maxlength="50" value="${esc(p.last_name||'')}"></label></div>
          <label class="full">Bio<textarea id="pfBio" maxlength="280" rows="4">${esc(p.bio||'')}</textarea></label>
          <label class="full">Location<input id="pfLocation" maxlength="100" value="${esc(p.location||'')}"></label>
          <div class="om-pb-legacy-note full"><b>Complete these fields to earn XP</b><br><span>+100 XP each · awarded once per field</span></div>
          <div class="om-pb-field-row"><label>City <span class="field-xp">+100 XP</span><input id="pfCity" maxlength="80" value="${esc(p.city||'')}" placeholder="Minneapolis"></label><label>State <span class="field-xp">+100 XP</span><input id="pfState" maxlength="80" value="${esc(p.state||'')}" placeholder="Minnesota"></label></div>
          <div class="om-pb-field-row"><label>Country <span class="field-xp">+100 XP</span><input id="pfCountry" maxlength="80" value="${esc(p.country||'')}" placeholder="United States"></label><label>Gender <span class="field-xp">+100 XP</span><select id="pfGender"><option value="">Select</option><option value="Male" ${p.gender==='Male'?'selected':''}>Male</option><option value="Female" ${p.gender==='Female'?'selected':''}>Female</option><option value="Non-binary" ${p.gender==='Non-binary'?'selected':''}>Non-binary</option><option value="Prefer not to say" ${p.gender==='Prefer not to say'?'selected':''}>Prefer not to say</option></select></label></div>
          <label class="full">Website<input id="pfWebsite" maxlength="200" type="url" value="${esc(p.website||'')}" placeholder="https://"></label>
          <div class="om-pb-card full"><label for="pbGroup">Community</label><select class="om-pb-select" id="pbGroup"><option value="">Select a community</option>${groups.map(g=>`<option value="${esc(g)}" ${p.group_team===g?'selected':''}>${esc(g)}</option>`).join('')}</select></div>
        </div></section>
        <section class="om-pb-panel" data-panel="privacy"><div class="om-pb-heading"><span class="om-pb-kicker">CONTROL</span><h3>Privacy & visibility</h3></div><div class="om-pb-card"><label>Profile visibility</label><select class="om-pb-select" id="pbPrivacy"><option value="public" ${p.profile_visibility!=='private'?'selected':''}>Public — discoverable</option><option value="private" ${p.profile_visibility==='private'?'selected':''}>Private — hidden from People/Group filters</option></select></div></section>
        <div class="om-pb-actions"><button class="om-pb-btn" id="pbCancel">Cancel</button><button class="om-pb-btn primary" id="pbSave">Save changes</button></div>
      </main></section>`;
    document.body.appendChild(o);
    let draft={...p};
    const renderAvatar=()=>{const host=o.querySelector('#pbCurrentAvatar'),preview=o.querySelector('#pbPreviewAvatar');const src=draft.avatar_url||draft.avatar_asset||((draft.avatar_package==='platinum_package'&&platinum())?`/assets/avatars/${draft.avatar_gender==='female'?'platinum-female.PNG':'platinum-male.PNG'}`:'');const html=src?`<img src="${esc(src)}" alt="Selected avatar">`:fallbackAvatar();host.innerHTML=html;preview.innerHTML=html};
    const preview=()=>{const b=backgrounds.find(x=>x[0]===draft.profile_background);o.querySelector('#pbPreviewBanner').style.background=b?b[1]:'linear-gradient(135deg,#f5ead3,#dcebe3)';o.querySelector('#pbPreviewName').textContent=draft.display_name||`${draft.first_name||''} ${draft.last_name||''}`.trim()||'Your Name';renderAvatar()};
    const close=()=>o.remove();o.querySelector('.om-pb-close').onclick=close;o.querySelector('#pbCancel').onclick=close;o.addEventListener('click',e=>{if(e.target===o)close()});
    o.querySelectorAll('.om-pb-tab').forEach(t=>t.onclick=()=>{o.querySelectorAll('.om-pb-tab').forEach(x=>x.classList.toggle('active',x===t));o.querySelectorAll('.om-pb-panel').forEach(x=>x.classList.toggle('active',x.dataset.panel===t.dataset.tab))});
    o.querySelectorAll('.pb-gender').forEach(b=>b.onclick=()=>{draft.avatar_gender=b.dataset.gender;o.querySelectorAll('.pb-gender').forEach(x=>x.classList.toggle('selected',x===b));if(draft.avatar_package==='platinum_package'&&platinum())draft.avatar_url=`/assets/avatars/${draft.avatar_gender==='female'?'platinum-female.PNG':'platinum-male.PNG'}`;renderAvatar()});
    o.querySelectorAll('.pb-package').forEach(b=>b.onclick=()=>{if(b.disabled)return;draft.avatar_package=b.dataset.package;if(draft.avatar_package==='platinum_package')draft.avatar_url=`/assets/avatars/${draft.avatar_gender==='female'?'platinum-female.PNG':'platinum-male.PNG'}`;else if(!p.avatar_url||/platinum-/i.test(p.avatar_url))draft.avatar_url=null;o.querySelectorAll('.pb-package').forEach(x=>x.classList.toggle('selected',x===b));renderAvatar()});
    o.querySelectorAll('.om-pb-bg').forEach(b=>b.onclick=()=>{draft.profile_background=b.dataset.bg;o.querySelectorAll('.om-pb-bg').forEach(x=>x.classList.toggle('selected',x===b));preview()});
    o.querySelectorAll('.om-pb-swatch').forEach(b=>b.onclick=()=>{draft.profile_accent=b.dataset.accent;o.querySelectorAll('.om-pb-swatch').forEach(x=>x.classList.toggle('selected',x===b))});
    o.querySelector('#pbSave').onclick=async()=>{
      const username=o.querySelector('#pfUser').value.trim().toLowerCase();if(!/^[a-z0-9_.-]{3,30}$/.test(username)){window.toast?.('Username must be 3–30 characters and use letters, numbers, dots, underscores, or hyphens.');return}
      const sb=client();if(!sb){window.toast?.('Secure profile service is unavailable.');return}
      const user=(await sb.auth.getUser()).data.user;if(!user){window.toast?.('Your session expired. Please sign in again.');return}
      if(!(await (async()=>{const {data,error}=await sb.from('profiles').select('id').eq('username',username).neq('id',user.id).limit(1).maybeSingle();return !error&&!data})())){window.toast?.('That username is already taken.');return}
      draft={...draft,display_name:o.querySelector('#pfDisplay').value.trim(),first_name:o.querySelector('#pfFirst').value.trim(),last_name:o.querySelector('#pfLast').value.trim(),username,bio:o.querySelector('#pfBio').value.trim(),location:o.querySelector('#pfLocation').value.trim(),city:o.querySelector('#pfCity').value.trim(),state:o.querySelector('#pfState').value.trim(),country:o.querySelector('#pfCountry').value.trim(),gender:o.querySelector('#pfGender').value,website:o.querySelector('#pfWebsite').value.trim(),group_team:o.querySelector('#pbGroup').value,profile_visibility:o.querySelector('#pbPrivacy').value};
      if(draft.avatar_package==='platinum_package'&&!platinum()){window.toast?.('Platinum requires 10,000 XP.');return}
      const payload={display_name:draft.display_name,first_name:draft.first_name,last_name:draft.last_name,username:draft.username,bio:draft.bio,location:draft.location,city:draft.city,state:draft.state,country:draft.country,gender:draft.gender||draft.avatar_gender||'Male',website:draft.website,group_team:draft.group_team||null,profile_visibility:draft.profile_visibility,avatar_url:draft.avatar_url||null,avatar_gender:draft.avatar_gender||'male',avatar_package:draft.avatar_package||'default',profile_background:draft.profile_background||'default',profile_accent:draft.profile_accent||'emerald',avatar_config:{...(draft.avatar_config||{}),package:draft.avatar_package||'default',gender:draft.avatar_gender||'male',background:draft.profile_background||'default',accent:draft.profile_accent||'emerald'}};
      const save=o.querySelector('#pbSave');save.disabled=true;save.textContent='Saving…';
      const {data,error}=await sb.from('profiles').update(payload).eq('id',user.id).select().single();if(error){save.disabled=false;save.textContent='Save changes';window.toast?.(error.message||'Unable to save profile.');return}
      window.profile=data;if(typeof window.loadProfile==='function')await window.loadProfile();if(typeof window.renderApp==='function')window.renderApp();window.OneMuslimPlatform?.refreshFloat?.();close();window.toast?.('Profile saved successfully. ✓');
    };
    preview();
  }

  function wire(){
    const b=document.getElementById('editProfile');if(!b)return;
    b.onclick=(e)=>{e.preventDefault();e.stopImmediatePropagation();open();};
  }
  function init(){inject();wire();new MutationObserver(wire).observe(document.body,{childList:true,subtree:true});}
  window.OneMuslimOpenProfileEditor=open;
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();
})();
