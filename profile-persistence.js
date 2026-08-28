/* OneMuslim Profile Persistence v1
 * Mr. Elmi note: the Profile Builder was already rendering the right choices, but its
 * save path only wrote a few legacy columns and swallowed database errors. This bridge
 * keeps the existing one-app architecture intact while making the builder authoritative:
 * Supabase stores the presentation state; localStorage is only a convenience cache.
 */
(function(){
  'use strict';
  const backgrounds={
    default:'linear-gradient(135deg,#fbf5e8,#f1e6cf)',
    'Mosque Silhouette':'linear-gradient(135deg,#f7ecd6,#ead8b5)',
    'Islamic Arch':'linear-gradient(135deg,#f8f2e5,#e9dfcc)',
    'Crescent & Stars':'linear-gradient(135deg,#0e2d27,#193f35)',
    'Luxury Gold':'linear-gradient(135deg,#fff8e8,#d8b66a)',
    Emerald:'linear-gradient(135deg,#0d4b3d,#1f6b57)',
    'Dark Mosque':'linear-gradient(135deg,#061e1a,#173a31)',
    'Minimal Cream':'linear-gradient(135deg,#fffdf8,#f4f0e7)'
  };
  const accents={emerald:'#1f6a55',gold:'#c89d3c',navy:'#243b62',plum:'#70536f',ruby:'#a34d52'};
  const esc=s=>String(s??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[m]));
  const client=()=>window.OneMuslimSupabaseClient?.getClient?.()||null;
  const sys=()=>window.OneMuslimProfileSystem;
  const xp=p=>Number(p?.xp_total??p?.xp??0)||0;
  const avatarSrc=p=>p?.avatar_url||((p?.avatar_package==='platinum_package'&&xp(p)>=10000)?sys()?.AVATAR_ASSETS?.[p.avatar_gender]:'');

  function presentation(p){
    const bg=backgrounds[p?.profile_background]||backgrounds.default;
    const accent=accents[p?.profile_accent]||accents.emerald;
    return {bg,accent,avatar:avatarSrc(p)};
  }

  function applyCurrentProfile(){
    const p=window.profile;if(!p)return;
    const panel=document.getElementById('profilePanel');if(!panel)return;
    const v=presentation(p);
    panel.style.setProperty('--om-profile-bg',v.bg);
    panel.style.setProperty('--om-profile-accent',v.accent);
    panel.dataset.profileBackground=p.profile_background||'default';
    panel.dataset.profileAccent=p.profile_accent||'emerald';
    const hero=panel.querySelector('.profile-hero');
    if(hero){hero.style.background=v.bg;hero.style.borderColor=v.accent;hero.style.color='#fff';}
    const avatar=panel.querySelector('.profile-hero .avatar');
    if(avatar&&v.avatar)avatar.innerHTML=`<img src="${esc(v.avatar)}" alt="Profile avatar">`;
  }

  async function saveFromEditor(o){
    const sb=client();
    if(!sb)throw new Error('Secure profile service is unavailable.');
    const user=(await sb.auth.getUser()).data.user;
    if(!user)throw new Error('Your session expired. Please sign in again.');
    const p={...(window.profile||{})};
    const current=o.querySelector('#pbGroup')?.value||p.group_team||'';
    const draft={...p,
      group_team:current==='__create__'?'':current,
      bio:(o.querySelector('#pbBio')?.value||'').trim(),
      profile_visibility:o.querySelector('#pbPrivacy')?.value||p.profile_visibility||'public'
    };
    const platinum=Number(draft.xp_total||draft.xp||0)>=10000;
    if(draft.avatar_package==='platinum_package'&&!platinum)throw new Error('Platinum requires 10,000 XP.');
    const applied=sys()?.applyUnlocks?sys().applyUnlocks(draft):draft;
    const payload={
      gender:applied.avatar_gender||'male',
      profile_visibility:applied.profile_visibility||'public',
      bio:applied.bio||'',
      avatar_url:applied.avatar_asset||applied.avatar_url||null,
      avatar_preset:applied.avatar_preset||null,
      avatar_gender:applied.avatar_gender||'male',
      avatar_package:applied.avatar_package||'default',
      profile_background:applied.profile_background||'default',
      profile_accent:applied.profile_accent||'emerald',
      profile_title:applied.profile_title||'Muslim',
      unlocked_packages:applied.unlocked_packages||['default'],
      avatar_config:{...(applied.avatar_config||{}),package:applied.avatar_package||'default',gender:applied.avatar_gender||'male',background:applied.profile_background||'default',accent:applied.profile_accent||'emerald'}
    };
    const {data,error}=await sb.from('profiles').update(payload).eq('id',user.id).select().single();
    if(error)throw error;
    window.profile=data;
    try{const s=JSON.parse(localStorage.getItem('onemuslim_platform_v1')||'{}');s.profile={...(s.profile||{}),...data};localStorage.setItem('onemuslim_platform_v1',JSON.stringify(s))}catch(_){/* cache is non-authoritative */}
    return data;
  }

  function patchEditor(){
    const o=document.querySelector('.om-pb-overlay');if(!o||o.dataset.persistencePatched==='1')return;
    const save=o.querySelector('#pbSave');if(!save)return;
    o.dataset.persistencePatched='1';
    save.onclick=async()=>{
      save.disabled=true;save.textContent='Saving…';
      try{
        await saveFromEditor(o);
        if(typeof window.loadProfile==='function')await window.loadProfile();
        applyCurrentProfile();
        window.OneMuslimPlatform?.refreshFloat?.();
        window.toast?.('Profile saved successfully. ✓');
        o.remove();
      }catch(e){
        console.error('Profile persistence failed:',e);
        save.disabled=false;save.textContent='Save changes';
        window.toast?.(e.message||'Profile could not be saved.');
      }
    };
  }

  async function openUserProfile(id){
    const sb=client();if(!sb)return;
    const {data:u,error}=await sb.from('profiles').select('*').eq('id',id).maybeSingle();
    if(error||!u)return;
    const panel=document.getElementById('profilePanel');if(!panel)return;
    const v=presentation(u),display=u.display_name||`${u.first_name||''} ${u.last_name||''}`.trim()||'Member';
    const avatar=v.avatar?`<img src="${esc(v.avatar)}" alt="${esc(display)}">`:`${esc(display.split(/\s+/).map(x=>x[0]).join('').slice(0,2).toUpperCase())}`;
    panel.innerHTML=`<div class="om-member-profile" style="--member-bg:${v.bg};--member-accent:${v.accent}">
      <div class="om-member-hero" style="background:${v.bg};border-color:${v.accent}"><button class="outline" id="omMemberBack">← People</button><div class="om-member-kicker">MEMBER PROFILE</div><div class="om-member-avatar">${avatar}</div><h2>${esc(display)}</h2><p>@${esc(u.username||'')}</p><div class="om-member-actions"><button class="primary" id="omMemberMessage">✉ Message</button><button class="outline" id="omMemberNote">📝 Private Note</button></div></div>
      <div class="om-member-body"><span class="private-tag">🔐 MEMBER PROFILE</span><p class="om-member-bio">${esc(u.bio||'This member has not added a bio yet.')}</p><div class="om-member-meta"><span>${Number(u.xp_total||0).toLocaleString()} XP</span><span>${esc(u.profile_title||'Muslim')}</span>${u.group_team?`<span>${esc(u.group_team)}</span>`:''}</div><div class="om-member-posts"><div class="eyebrow">COMMUNITY ACTIVITY</div><h3>${esc(display)}'s posts</h3><div id="omMemberPosts">Loading…</div></div></div></div>`;
    document.getElementById('omMemberBack').onclick=()=>document.querySelector('[data-page="profiles"]')?.click();
    document.getElementById('omMemberMessage').onclick=()=>window.openDmWith?.(id);
    document.getElementById('omMemberNote').onclick=()=>window.openPrivateNote?.(id);
    const {data:posts}=await sb.from('posts').select('id,body,created_at,updated_at').eq('user_id',id).order('created_at',{ascending:false}).limit(20);
    const host=document.getElementById('omMemberPosts');host.innerHTML=(posts||[]).map(p=>`<article class="om-member-post"><small>${new Date(p.created_at).toLocaleString()}</small><p>${esc(p.body||'')}</p></article>`).join('')||'<div class="om-member-post">No posts yet.</div>';
    document.querySelector('[data-page="profile"]')?.click();
  }

  function injectStyles(){if(document.getElementById('om-profile-persistence-css'))return;const s=document.createElement('style');s.id='om-profile-persistence-css';s.textContent=`
    #profilePanel{--om-profile-accent:#1f6a55}.profile-hero{position:relative;overflow:hidden;background:var(--om-profile-bg,linear-gradient(135deg,#fbf5e8,#f1e6cf))!important;border:1px solid var(--om-profile-accent)!important;border-radius:24px!important;color:#fff!important}.profile-hero .avatar img,.om-member-avatar img{width:100%;height:100%;object-fit:contain}.om-member-profile{border:1px solid #e5e1d7;border-radius:24px;overflow:hidden;background:#fffdf8;box-shadow:0 16px 50px rgba(18,48,39,.1)}.om-member-hero{padding:22px 22px 30px;border-bottom:1px solid;position:relative;color:#fff;text-shadow:0 1px 12px rgba(0,0,0,.22)}.om-member-hero .outline{background:#ffffffdd;color:#1f5b49;border-color:#fff}.om-member-kicker{letter-spacing:.16em;font-size:11px;font-weight:800;margin:24px 0 10px}.om-member-avatar{width:88px;height:88px;border-radius:50%;background:#fff4;border:3px solid #fff;display:flex;align-items:center;justify-content:center;font-size:28px;font-weight:800;overflow:hidden;box-shadow:0 8px 25px #0003}.om-member-hero h2{margin:12px 0 2px;font-size:30px}.om-member-hero p{margin:0}.om-member-actions{display:flex;gap:10px;margin-top:18px;flex-wrap:wrap}.om-member-body{padding:22px}.om-member-bio{font-size:18px;line-height:1.55;color:#53665b}.om-member-meta{display:flex;gap:8px;flex-wrap:wrap}.om-member-meta span{padding:7px 10px;border-radius:999px;background:#edf4ef;color:#1f5b49;font-weight:700;font-size:12px}.om-member-posts{margin-top:28px}.om-member-posts h3{margin:5px 0 12px;color:#1f5b49;font-family:Georgia,serif}.om-member-post{background:#fff;border:1px solid #e5e1d7;border-radius:16px;padding:16px;margin:10px 0}.om-member-post small{color:#84968b}.om-member-post p{margin:8px 0 0;color:#294035}.member-card{overflow:hidden}.member-card[data-view-profile]{cursor:pointer}
  `;document.head.appendChild(s)}

  function init(){
    injectStyles();
    window.openUserProfile=openUserProfile;
    new MutationObserver(()=>{patchEditor();applyCurrentProfile()}).observe(document.body,{childList:true,subtree:true});
    patchEditor();applyCurrentProfile();
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();
})();