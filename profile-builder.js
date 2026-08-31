/* OneMuslim Unified Profile Builder v8 — uses the real DB-backed avatar source of truth. */
(function(){
  'use strict';
  const groups=['Islamic Society','Apologetics','Da’wah','Qur’an Study','Tafsir Circle','Hadith Study','Tajweed','The Belt Boys','Torah Boys'];
  const backgrounds=[['Islamic Geometry','linear-gradient(135deg,#fbf5e8,#f1e6cf)'],['Mosque Silhouette','linear-gradient(135deg,#f7ecd6,#ead8b5)'],['Islamic Arch','linear-gradient(135deg,#f8f2e5,#e9dfcc)'],['Crescent & Stars','linear-gradient(135deg,#0e2d27,#193f35)'],['Luxury Gold','linear-gradient(135deg,#fff8e8,#d8b66a)'],['Emerald','linear-gradient(135deg,#0d4b3d,#1f6b57)'],['Dark Mosque','linear-gradient(135deg,#061e1a,#173a31)'],['Minimal Cream','linear-gradient(135deg,#fffdf8,#f4f0e7)']];
  const accents=[['emerald','#1f6a55'],['gold','#c89d3c'],['navy','#243b62'],['plum','#70536f'],['ruby','#a34d52']];
  const REGULAR={male:'/assets/avatar/base/avatar-master-male.jpeg',female:'/assets/avatar/base/avatar-master-female.jpeg'};
  const PLATINUM={male:'/assets/avatar/platinum/platinum-male.PNG',female:'/assets/avatar/platinum/platinum-female.PNG'};
  const esc=s=>String(s??'').replace(/[&<>\\"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','\\"':'&quot;',"'":'&#039;'}[m]));
  const client=()=>window.OneMuslimSupabaseClient?.getClient?.()||window.supabase?.createClient?.(window.APP_CONFIG?.SUPABASE_URL,window.APP_CONFIG?.SUPABASE_ANON_KEY);
  const profile=()=>{const p=window.profile||{};const cfg=p.avatar_config&&typeof p.avatar_config==='object'?p.avatar_config:{};return {...p,avatar_gender:p.avatar_gender||cfg.gender||'male',avatar_package:p.avatar_package||cfg.package||'default'};};
  const xp=()=>Number(profile().xp_total??profile().xp??0)||0;
  const toast=m=>window.toast?window.toast(m):alert(m);

  function styles(){if(document.getElementById('om-pb-v8-styles'))return;const s=document.createElement('style');s.id='om-pb-v8-styles';s.textContent=`
  .om-pb-tabs{gap:8px}.om-pb-tab{min-width:62px;min-height:62px;font-size:24px;display:flex;align-items:center;justify-content:center;flex-direction:column;gap:3px}.om-pb-tab small{font-size:11px}.om-pb-profile-fields{display:grid;gap:14px}.om-pb-profile-fields label{display:grid;gap:6px}.om-pb-field-row{display:grid;grid-template-columns:1fr 1fr;gap:12px}.om-pb-profile-fields input,.om-pb-profile-fields textarea,.om-pb-profile-fields select{width:100%;box-sizing:border-box}.om-pb-current-avatar{display:flex;align-items:center;gap:12px;margin-bottom:14px}.om-pb-avatar-photo{width:88px;height:88px;border-radius:50%;overflow:hidden;border:3px solid #fff;box-shadow:0 8px 25px #0002;background:#edf4ef;display:flex;align-items:center;justify-content:center;font-size:28px;font-weight:800}.om-pb-avatar-photo img{width:100%;height:100%;object-fit:cover;object-position:center top}.om-pb-legacy-note{padding:13px 15px;border:1px solid #cbded4;border-radius:14px;background:#f3f7f4;color:#1f5b49}.om-pb-field-xp{font-size:12px;color:#2d705b;font-weight:700}
  .om-pb-choice.pb-gender{display:flex!important;flex-direction:column!important;align-items:center!important;justify-content:center!important;gap:8px!important;min-width:126px!important;min-height:150px!important;padding:12px!important;overflow:hidden!important}.om-pb-choice.pb-gender .om-identity-avatar{width:92px!important;height:92px!important;border-radius:50%!important;overflow:hidden!important;background:#edf4ef!important;border:3px solid #fff!important;box-shadow:0 6px 18px rgba(18,48,39,.14)!important;display:block!important;flex:0 0 auto!important}.om-pb-choice.pb-gender .om-identity-avatar img{width:100%!important;height:100%!important;object-fit:cover!important;object-position:center top!important;display:block!important}.om-pb-choice.pb-gender .om-identity-label{font-weight:800!important;font-size:15px!important;color:#294c40!important}.om-pb-choice.pb-package{display:inline-flex!important;align-items:center!important;justify-content:center!important;gap:4px!important}.om-pb-choice.pb-package .om-package-avatar{width:34px;height:34px;border-radius:50%;overflow:hidden;display:inline-block;vertical-align:middle;margin-right:5px}.om-pb-choice.pb-package .om-package-avatar img{width:100%;height:100%;object-fit:cover;object-position:center top;display:block}
  .om-avatar-sync-img{width:100%!important;height:100%!important;object-fit:cover!important;object-position:center top!important;border-radius:50%!important;display:block!important}.om-nav-mark.om-avatar-synced,#composerAvatar.om-avatar-synced,#miniProfile .avatar.om-avatar-synced,#miniProfile .mini-avatar.om-avatar-synced,#miniProfile .profile-avatar.om-avatar-synced{overflow:hidden!important;padding:0!important}
  @media(max-width:620px){.om-pb-field-row{grid-template-columns:1fr}}
  `;document.head.appendChild(s)}

  function avatarSrc(p){
    const gender=p?.avatar_gender==='female'?'female':'male';
    if(p?.avatar_package==='platinum_package' && xp()>=10000)return PLATINUM[gender];
    return REGULAR[gender];
  }

  function setOwnAvatar(el,src){
    if(!el||!src)return;
    const existing=el.querySelector('img.om-avatar-sync-img');
    if(existing&&existing.getAttribute('src')===src)return;
    el.classList.add('om-avatar-synced');el.textContent='';
    const img=document.createElement('img');img.className='om-avatar-sync-img';img.src=src;img.alt='Profile photo';img.loading='eager';
    img.onerror=()=>{el.classList.remove('om-avatar-synced');};
    el.appendChild(img);
  }
  function syncGlobalAvatars(){
    const p=profile(),src=avatarSrc(p);if(!src)return;
    const nav=document.querySelector('#appView .om-nav-mark');if(nav)setOwnAvatar(nav,src);
    const composer=document.getElementById('composerAvatar');if(composer)setOwnAvatar(composer,src);
    document.querySelectorAll('#miniProfile .avatar,#miniProfile .mini-avatar,#miniProfile .profile-avatar,[data-profile-avatar="self"]').forEach(el=>setOwnAvatar(el,src));
    const personal=document.querySelector('.om-personal-avatar');if(personal){const img=personal.querySelector('img');if(!img||img.getAttribute('src')!==src)personal.innerHTML=`<img src="${src}" alt="Selected avatar">`;}
  }

  async function safeUpdate(sb,id,payload){
    let work={...payload};
    for(let i=0;i<20;i++){
      const r=await sb.from('profiles').update(work).eq('id',id).select().single();
      if(!r.error)return r.data;
      const msg=String(r.error.message||'');
      const m=msg.match(/Could not find the ['\"]([^'\"]+)['\"] column of ['\"]profiles['\"] in the schema cache/i);
      if(!m)throw r.error;
      const bad=m[1];
      if(!(bad in work))throw r.error;
      delete work[bad];
    }
    throw new Error('Profile could not be saved because the database schema rejected the update.');
  }

  function open(){
    styles();
    const old=document.querySelector('.om-pb-overlay');if(old)old.remove();
    const p={...profile()};
    const o=document.createElement('div');o.className='om-pb-overlay';o.setAttribute('role','dialog');o.setAttribute('aria-modal','true');
    const unlocked=xp()>=10000;
    const gender=p.avatar_gender==='female'?'female':'male';
    const finish=p.avatar_package==='platinum_package'&&unlocked?'platinum_package':'default';
    o.innerHTML=`<section class="om-pb-shell">
      <header class="om-pb-top"><div><span class="om-pb-kicker">ONE MUSLIM · PROFILE</span><h2>Edit your profile</h2></div><button class="om-pb-close" aria-label="Close">×</button></header>
      <nav class="om-pb-tabs"><button class="om-pb-tab active" data-tab="avatar">◉<small>Avatar</small></button><button class="om-pb-tab" data-tab="background">▧<small>Background</small></button><button class="om-pb-tab" data-tab="style">✦<small>Personalize</small></button><button class="om-pb-tab" data-tab="profile">◎<small>Profile</small></button><button class="om-pb-tab" data-tab="privacy">⌁<small>Privacy</small></button></nav>
      <main class="om-pb-main">
      <div class="om-pb-preview"><div class="om-pb-preview-banner" id="pbPreviewBanner"></div><div class="om-pb-preview-body"><div class="om-pb-preview-avatar" id="pbPreviewAvatar"></div><div class="om-pb-preview-name" id="pbPreviewName">${esc(p.display_name||`${p.first_name||''} ${p.last_name||''}`.trim()||'Your Name')}</div><div class="om-pb-preview-meta">@${esc(p.username||'username')} · ${esc(p.profile_title||'Muslim')}</div><div class="om-pb-preview-stats"><span><b>${xp().toLocaleString()}</b> XP</span><span><b id="pbPreviewGroup">${esc(p.group_team||'—')}</b> Group</span></div></div></div>
      <section class="om-pb-panel active" data-panel="avatar"><div class="om-pb-heading"><span class="om-pb-kicker">IDENTITY</span><h3>Your selected avatar</h3><p>This avatar is your profile photo throughout OneMuslim.</p></div><div class="om-pb-card"><div class="om-pb-current-avatar"><div class="om-pb-avatar-photo" id="pbCurrentAvatar"></div><div><b>Profile photo</b><span>Your saved avatar is used on your profile, community posts and member surfaces.</span></div></div><label>Avatar identity</label><div class="om-pb-choices"><button type="button" class="om-pb-choice pb-gender ${gender==='male'?'selected':''}" data-gender="male"><span class="om-identity-avatar"><img src="${REGULAR.male}" alt="Male Muslim avatar"></span><span class="om-identity-label">Male</span></button><button type="button" class="om-pb-choice pb-gender ${gender==='female'?'selected':''}" data-gender="female"><span class="om-identity-avatar"><img src="${REGULAR.female}" alt="Female Muslim avatar"></span><span class="om-identity-label">Female</span></button></div></div></section>
      <section class="om-pb-panel" data-panel="background"><div class="om-pb-heading"><span class="om-pb-kicker">ATMOSPHERE</span><h3>Set your background</h3><p>Choose the atmosphere behind your profile.</p></div><div class="om-pb-grid">${backgrounds.map((b,i)=>`<button type="button" class="om-pb-card om-pb-bg" data-bg="${esc(i?'':'default')}" style="background:${b[1]}"><strong>${b[0]}</strong></button>`).join('')}</div></section>
      <section class="om-pb-panel" data-panel="style"><div class="om-pb-heading"><span class="om-pb-kicker">PERSONALIZE</span><h3>Make it yours</h3><p>Premium avatar styling unlocks at 10,000 XP.</p></div><div class="om-pb-card"><label>Avatar finish</label><div class="om-pb-choices"><button type="button" class="om-pb-choice pb-package ${finish==='default'?'selected':''}" data-package="default"><span class="om-package-avatar"><img src="${REGULAR[gender]}" alt="Original Muslim avatar"></span>Original</button><button type="button" class="om-pb-choice pb-package ${finish==='platinum_package'?'selected':''}" data-package="platinum_package" ${unlocked?'':'disabled'}><span class="om-package-avatar"><img src="${PLATINUM[gender]}" alt="Platinum ${gender} avatar"></span>Platinum ${gender==='female'?'Female':'Male'}${unlocked?'':' 🔒'}</button></div><div class="om-pb-note">${unlocked?'Platinum unlocked.':'Platinum unlocks at 10,000 XP. '+Math.max(0,10000-xp()).toLocaleString()+' XP remaining.'}</div></div><div class="om-pb-card" style="margin-top:14px"><label>Accent color</label><div class="om-pb-swatches">${accents.map(a=>`<button type="button" class="om-pb-swatch ${p.profile_accent===a[0]?'selected':''}" data-accent="${a[0]}" style="background:${a[1]}" aria-label="${a[0]}"></button>`).join('')}</div></div></section>
      <section class="om-pb-panel" data-panel="profile"><div class="om-pb-heading"><span class="om-pb-kicker">PROFILE</span><h3>Your profile information</h3><p>All fields from the original profile editor live here.</p></div><div class="om-pb-profile-fields">
      <div class="om-pb-field-row"><label>Display name<input id="pfDisplay" maxlength="80" value="${esc(p.display_name||'')}"></label><label>Username<input id="pfUser" maxlength="30" value="${esc(p.username||'')}"></label></div>
      <div class="om-pb-field-row"><label>First name<input id="pfFirst" maxlength="50" value="${esc(p.first_name||'')}"></label><label>Last name<input id="pfLast" maxlength="50" value="${esc(p.last_name||'')}"></label></div>
      <label>Bio<textarea id="pfBio" maxlength="280" rows="4">${esc(p.bio||'')}</textarea></label><label>Location<input id="pfLocation" maxlength="100" value="${esc(p.location||'')}"></label>
      <div class="om-pb-legacy-note"><b>Complete these fields to earn XP</b><br><span>+100 XP each · awarded once per field</span></div>
      <div class="om-pb-field-row"><label>City <span class="om-pb-field-xp">+100 XP</span><input id="pfCity" maxlength="80" value="${esc(p.city||'')}"></label><label>State <span class="om-pb-field-xp">+100 XP</span><input id="pfState" maxlength="80" value="${esc(p.state||'')}"></label></div>
      <div class="om-pb-field-row"><label>Country <span class="om-pb-field-xp">+100 XP</span><input id="pfCountry" maxlength="80" value="${esc(p.country||'')}"></label><label>Gender <span class="om-pb-field-xp">+100 XP</span><select id="pfGender"><option value="">Select</option><option ${p.gender==='Male'?'selected':''}>Male</option><option ${p.gender==='Female'?'selected':''}>Female</option><option ${p.gender==='Non-binary'?'selected':''}>Non-binary</option><option ${p.gender==='Prefer not to say'?'selected':''}>Prefer not to say</option></select></label></div>
      <label>Website<input id="pfWebsite" maxlength="200" type="url" value="${esc(p.website||'')}" placeholder="https://"></label>
      <div class="om-pb-card"><label>Community</label><select class="om-pb-select" id="pbGroup"><option value="">Select a community</option>${groups.map(g=>`<option ${p.group_team===g?'selected':''}>${esc(g)}</option>`).join('')}</select></div>
      </div></section>
      <section class="om-pb-panel" data-panel="privacy"><div class="om-pb-heading"><span class="om-pb-kicker">CONTROL</span><h3>Privacy & visibility</h3></div><div class="om-pb-card"><label>Profile visibility</label><select class="om-pb-select" id="pbPrivacy"><option value="public" ${p.profile_visibility!=='private'?'selected':''}>Public — discoverable</option><option value="private" ${p.profile_visibility==='private'?'selected':''}>Private — hidden from People/Group filters</option></select></div></section>
      <div class="om-pb-actions"><button type="button" class="om-pb-btn" id="pbCancel">Cancel</button><button type="button" class="om-pb-btn primary" id="pbSave">Save changes</button></div>
      </main></section>`;
    document.body.appendChild(o);
    let draft={...p,avatar_gender:gender,avatar_package:finish};
    const setAvatar=()=>{const src=avatarSrc(draft);const html=src?`<img src="${esc(src)}" alt="Selected avatar">`:(draft.avatar_gender==='female'?'F':'M');[o.querySelector('#pbCurrentAvatar'),o.querySelector('#pbPreviewAvatar')].forEach(h=>{if(h)h.innerHTML=html})};
    const preview=()=>{const idx=backgrounds.findIndex(x=>x[0]===draft.profile_background);const b=backgrounds[idx<0?0:idx];o.querySelector('#pbPreviewBanner').style.background=b[1];o.querySelector('#pbPreviewName').textContent=draft.display_name||`${draft.first_name||''} ${draft.last_name||''}`.trim()||'Your Name';o.querySelector('#pbPreviewGroup').textContent=draft.group_team||'—';o.querySelectorAll('.pb-gender').forEach(x=>x.classList.toggle('selected',x.dataset.gender===draft.avatar_gender));setAvatar();
      const original=o.querySelector('.pb-package[data-package="default"]');const platinum=o.querySelector('.pb-package[data-package="platinum_package"]');o.querySelectorAll('.pb-package').forEach(x=>x.classList.toggle('selected',x.dataset.package===draft.avatar_package));if(original){const img=original.querySelector('img');if(img)img.src=REGULAR[draft.avatar_gender]}if(platinum){const img=platinum.querySelector('img');if(img)img.src=PLATINUM[draft.avatar_gender];platinum.childNodes[platinum.childNodes.length-1].textContent=`Platinum ${draft.avatar_gender==='female'?'Female':'Male'}${platinum.disabled?' 🔒':''}`;}};
    const close=()=>o.remove();
    o.querySelector('.om-pb-close').onclick=close;o.querySelector('#pbCancel').onclick=close;
    o.querySelectorAll('.om-pb-tab').forEach(t=>t.onclick=()=>{o.querySelectorAll('.om-pb-tab').forEach(x=>x.classList.toggle('active',x===t));o.querySelectorAll('.om-pb-panel').forEach(x=>x.classList.toggle('active',x.dataset.panel===t.dataset.tab))});
    o.querySelectorAll('.pb-gender').forEach(b=>b.onclick=()=>{draft.avatar_gender=b.dataset.gender;draft.avatar_package='default';draft.avatar_url=REGULAR[draft.avatar_gender];draft.avatar_config={gender:draft.avatar_gender,package:draft.avatar_package};preview()});
    o.querySelectorAll('.pb-package').forEach(b=>b.onclick=()=>{if(b.disabled)return;draft.avatar_package=b.dataset.package;draft.avatar_url=avatarSrc(draft);draft.avatar_config={gender:draft.avatar_gender,package:draft.avatar_package};preview()});
    o.querySelectorAll('.om-pb-bg').forEach((b,i)=>b.onclick=()=>{draft.profile_background=i?backgrounds[i][0]:'default';o.querySelectorAll('.om-pb-bg').forEach(x=>x.classList.remove('selected'));b.classList.add('selected');preview()});
    o.querySelectorAll('[data-accent]').forEach(b=>b.onclick=()=>{draft.profile_accent=b.dataset.accent;o.querySelectorAll('[data-accent]').forEach(x=>x.classList.toggle('selected',x===b))});
    o.querySelector('#pbGroup').onchange=e=>draft.group_team=e.target.value;

    o.querySelector('#pbSave').onclick=async()=>{
      const btn=o.querySelector('#pbSave');if(btn.disabled)return;btn.disabled=true;btn.textContent='Saving…';
      try{
        const sb=client();if(!sb)throw new Error('Secure profile service is unavailable.');
        const auth=await sb.auth.getUser();const user=auth?.data?.user;if(!user)throw new Error('Your session expired. Please sign in again.');
        const username=o.querySelector('#pfUser').value.trim().toLowerCase();
        if(!/^[a-z0-9_.-]{3,30}$/.test(username))throw new Error('Username must be 3–30 characters and use letters, numbers, dots, underscores, or hyphens.');
        if(draft.avatar_package==='platinum_package'&&!unlocked)draft.avatar_package='default';
        const selectedAvatar=avatarSrc(draft);
        const payload={display_name:o.querySelector('#pfDisplay').value.trim(),username,first_name:o.querySelector('#pfFirst').value.trim(),last_name:o.querySelector('#pfLast').value.trim(),bio:o.querySelector('#pfBio').value.trim(),location:o.querySelector('#pfLocation').value.trim(),city:o.querySelector('#pfCity').value.trim(),state:o.querySelector('#pfState').value.trim(),country:o.querySelector('#pfCountry').value.trim(),gender:o.querySelector('#pfGender').value,website:o.querySelector('#pfWebsite').value.trim(),group_team:o.querySelector('#pbGroup').value,profile_visibility:o.querySelector('#pbPrivacy').value,avatar_url:selectedAvatar,avatar_gender:draft.avatar_gender,avatar_package:draft.avatar_package,avatar_config:{gender:draft.avatar_gender,package:draft.avatar_package},avatar_updated_at:new Date().toISOString(),profile_background:draft.profile_background||'default',profile_accent:draft.profile_accent||'emerald'};
        const data=await safeUpdate(sb,user.id,payload);
        window.profile={...p,...data,...payload};
        try{const st=JSON.parse(localStorage.getItem('onemuslim_platform_v1')||'{}');st.profile={...(st.profile||{}),...window.profile};localStorage.setItem('onemuslim_platform_v1',JSON.stringify(st))}catch{}
        syncGlobalAvatars();window.OneMuslimPlatform?.refreshFloat?.();window.renderProfile?.();window.refreshProfile?.();window.dispatchEvent(new Event('profile:updated'));
        toast(draft.avatar_package==='platinum_package'?'Profile saved with your Platinum avatar.':'Profile saved with your regular Muslim avatar.');close();
      }catch(e){console.error('[OneMuslim] profile save failed',e);toast(e?.message||'Unable to save your profile.');}
      finally{btn.disabled=false;btn.textContent='Save changes'}
    };
    preview();syncGlobalAvatars();
  }

  window.OneMuslimProfileBuilder={open};
  window.OneMuslimOpenProfileEditor=open;
  window.openProfileBuilder=open;
  window.openProfileEditor=open;
  window.renderProfileBuilder=open;
  window.OneMuslimAvatarStudio={regular:REGULAR,platinum:PLATINUM,avatarSrc,syncGlobalAvatars};
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>{styles();syncGlobalAvatars()});else{styles();syncGlobalAvatars()}
  setInterval(syncGlobalAvatars,1500);
})();
