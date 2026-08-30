/* OneMuslim Profile Editor bridge — folds legacy profile fields into the new builder. */
(function(){
  'use strict';
  const esc = s => String(s ?? '').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[m]));
  const sbClient = () => window.supabase && window.APP_CONFIG?.SUPABASE_URL ? window.supabase.createClient(window.APP_CONFIG.SUPABASE_URL,window.APP_CONFIG.SUPABASE_ANON_KEY) : null;
  let busy=false;
  function profile(){return window.profile||{};}
  function avatarSrc(p){
    if(p.avatar_url) return String(p.avatar_url).startsWith('/') ? p.avatar_url : '/'+String(p.avatar_url).replace(/^\//,'');
    if(p.avatar_asset) return String(p.avatar_asset).startsWith('/') ? p.avatar_asset : '/'+String(p.avatar_asset).replace(/^\//,'');
    const base = p.avatar_base || p.avatar_variant || p.avatar_id || '';
    const map={amber:'/assets/avatars/amber.svg',emerald:'/assets/avatars/emerald.svg',onyx:'/assets/avatars/onyx.svg',pearl:'/assets/avatars/pearl.svg',ruby:'/assets/avatars/ruby.svg',sapphire:'/assets/avatars/sapphire.svg'};
    return map[base] || null;
  }
  function ensureAvatarPreview(){
    const wrap=document.querySelector('.om-pb-overlay #pbPreviewAvatar'); if(!wrap)return;
    const src=avatarSrc(profile());
    if(src){wrap.innerHTML=`<img src="${esc(src)}" alt="Selected avatar">`;wrap.classList.add('om-selected-avatar');}
  }
  function addStyles(){if(document.getElementById('om-profile-fields-bridge-css'))return;const s=document.createElement('style');s.id='om-profile-fields-bridge-css';s.textContent=`
    .om-pb-legacy-fields{margin-top:14px}.om-pb-field{display:block;margin:0 0 13px}.om-pb-field>span{display:block;font-size:12px;font-weight:700;letter-spacing:.04em;margin-bottom:6px}.om-pb-field input,.om-pb-field textarea,.om-pb-field select{width:100%;border:1px solid rgba(31,106,85,.18);border-radius:12px;padding:12px 13px;background:#fff;color:#20352c;font:inherit;box-sizing:border-box}.om-pb-field textarea{min-height:92px;resize:vertical}.om-selected-avatar img{width:100%;height:100%;object-fit:contain;border-radius:50%}
  `;document.head.appendChild(s)}
  function inject(){
    const panel=document.querySelector('.om-pb-overlay [data-panel="profile"]'); if(!panel || panel.dataset.legacyFields==='1') return;
    panel.dataset.legacyFields='1'; addStyles(); const p=profile();
    const heading=panel.querySelector('.om-pb-heading');
    const card=document.createElement('div'); card.className='om-pb-card om-pb-legacy-fields';
    card.innerHTML=`<label>Profile details</label>
      <label class="om-pb-field"><span>Display name</span><input id="omPfDisplay" maxlength="80" value="${esc(p.display_name||'')}"></label>
      <label class="om-pb-field"><span>First name</span><input id="omPfFirst" maxlength="50" value="${esc(p.first_name||'')}"></label>
      <label class="om-pb-field"><span>Last name</span><input id="omPfLast" maxlength="50" value="${esc(p.last_name||'')}"></label>
      <label class="om-pb-field"><span>Username</span><input id="omPfUser" maxlength="30" value="${esc(p.username||'')}"></label>
      <label class="om-pb-field"><span>Bio</span><textarea id="omPfBio" maxlength="280" placeholder="Tell the community about yourself.">${esc(p.bio||'')}</textarea></label>
      <label class="om-pb-field"><span>Location</span><input id="omPfLocation" maxlength="100" value="${esc(p.location||'')}"></label>
      <div class="om-pb-note">Complete these fields to earn XP</div>
      <label class="om-pb-field"><span>City · +100 XP</span><input id="omPfCity" maxlength="80" value="${esc(p.city||'')}" placeholder="Minneapolis"></label>
      <label class="om-pb-field"><span>State · +100 XP</span><input id="omPfState" maxlength="80" value="${esc(p.state||'')}" placeholder="Minnesota"></label>
      <label class="om-pb-field"><span>Country · +100 XP</span><input id="omPfCountry" maxlength="80" value="${esc(p.country||'')}" placeholder="United States"></label>
      <label class="om-pb-field"><span>Gender · +100 XP</span><select id="omPfGender"><option value="">Select</option><option value="Male" ${p.gender==='Male'?'selected':''}>Male</option><option value="Female" ${p.gender==='Female'?'selected':''}>Female</option><option value="Non-binary" ${p.gender==='Non-binary'?'selected':''}>Non-binary</option><option value="Prefer not to say" ${p.gender==='Prefer not to say'?'selected':''}>Prefer not to say</option></select></label>
      <label class="om-pb-field"><span>Website</span><input id="omPfWebsite" maxlength="200" type="url" value="${esc(p.website||'')}"></label>`;
    heading?.insertAdjacentElement('afterend',card);
    ensureAvatarPreview();
  }
  async function saveLegacy(e){
    const btn=e.target.closest('#pbSave'); if(!btn || busy)return;
    const ids=['omPfDisplay','omPfFirst','omPfLast','omPfUser','omPfBio','omPfLocation','omPfCity','omPfState','omPfCountry','omPfGender','omPfWebsite'];
    if(!ids.every(id=>document.getElementById(id)))return;
    const username=document.getElementById('omPfUser').value.trim().toLowerCase();
    if(!/^[a-z0-9_.-]{3,30}$/.test(username)){e.preventDefault();e.stopImmediatePropagation();window.toast?.('Username must be 3–30 characters and use letters, numbers, dots, underscores, or hyphens.');return;}
    busy=true;
    try{
      const sb=sbClient(); if(!sb)return;
      const p=profile();
      const q=await sb.from('profiles').select('id').eq('username',username).neq('id',p.id).limit(1).maybeSingle();
      if(q.error)throw q.error;if(q.data){e.preventDefault();e.stopImmediatePropagation();window.toast?.('That username is already taken.');return;}
      const payload={display_name:document.getElementById('omPfDisplay').value.trim(),first_name:document.getElementById('omPfFirst').value.trim(),last_name:document.getElementById('omPfLast').value.trim(),username,bio:document.getElementById('omPfBio').value.trim(),location:document.getElementById('omPfLocation').value.trim(),city:document.getElementById('omPfCity').value.trim(),state:document.getElementById('omPfState').value.trim(),country:document.getElementById('omPfCountry').value.trim(),gender:document.getElementById('omPfGender').value,website:document.getElementById('omPfWebsite').value.trim()};
      const r=await sb.from('profiles').update(payload).eq('id',p.id); if(r.error)throw r.error;
      window.profile={...p,...payload};
      localStorage.setItem('onemuslim_platform_v1',JSON.stringify({...JSON.parse(localStorage.getItem('onemuslim_platform_v1')||'{}'),profile:window.profile}));
    }catch(err){e.preventDefault();e.stopImmediatePropagation();console.error(err);window.toast?.(err?.message||'Unable to save profile fields.');}finally{busy=false;}
  }
  function wire(){
    inject(); ensureAvatarPreview();
    const save=document.querySelector('.om-pb-overlay #pbSave'); if(save && !save.dataset.legacyBridge){save.dataset.legacyBridge='1';save.addEventListener('click',saveLegacy,true)}
  }
  new MutationObserver(wire).observe(document.body,{childList:true,subtree:true});
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',wire);else wire();
})();
