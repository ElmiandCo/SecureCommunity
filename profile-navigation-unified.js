/* OneMuslim unified profile navigation. Keep member profile clicks inside the authenticated app. */
(() => {
  'use strict';
  const cfg = window.APP_CONFIG || {};
  const createClient = window.supabase?.createClient;
  if (!createClient || !cfg.SUPABASE_URL || !cfg.SUPABASE_ANON_KEY) return;
  const db = createClient(cfg.SUPABASE_URL, cfg.SUPABASE_ANON_KEY, { auth: { persistSession:true, autoRefreshToken:true, detectSessionInUrl:true } });

  const escapeHtml = value => String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const initials = name => String(name || '?').trim().split(/\s+/).map(x => x[0]).join('').slice(0,2).toUpperCase() || '?';
  const bgMap = { forest:'#123D2B', ocean:'#123B5D', night:'#111827', sand:'#D9C7A5', rose:'#6B2638', slate:'#334155' };
  const accentMap = { gold:'#D4AF37', green:'#2F855A', blue:'#2563EB', purple:'#7C3AED', rose:'#E11D48', white:'#F8FAFC' };

  const avatarFor = p => {
    const packageName = String(p?.avatar_package || '').toLowerCase();
    const gender = String(p?.avatar_gender || p?.gender || 'male').toLowerCase();
    if (packageName === 'platinum' || Number(p?.xp || p?.rank_points || 0) >= 10000) {
      return gender === 'female' ? '/assets/avatar/platinum/platinum-female.PNG' : '/assets/avatar/platinum/platinum-male.PNG';
    }
    return gender === 'female' ? '/assets/avatar/base/avatar-master-female.jpeg' : '/assets/avatar/base/avatar-master-male.jpeg';
  };

  const closeModal = () => {
    const modal = document.getElementById('omProfileModal');
    if (modal) modal.remove();
    document.removeEventListener('keydown', onKeyDown);
  };
  const onKeyDown = e => { if (e.key === 'Escape') closeModal(); };

  const openProfileModal = async id => {
    if (!id) return;
    closeModal();
    const { data:p, error } = await db.from('profiles').select('*').eq('id', id).maybeSingle();
    if (error || !p) { console.error('Profile popup lookup:', error); return; }

    const xp = Number(p.xp || p.rank_points || 0);
    const displayName = p.display_name || p.full_name || [p.first_name,p.last_name].filter(Boolean).join(' ') || p.username || 'OneMuslim Member';
    const username = p.username ? '@' + p.username.replace(/^@/,'') : '';
    const bg = bgMap[p.profile_background] || p.profile_background || '#123D2B';
    const accent = accentMap[p.profile_accent] || p.profile_accent || '#D4AF37';
    const currentUser = window.profile?.id || (await db.auth.getUser()).data?.user?.id;
    let following = false;
    if (currentUser && currentUser !== id) {
      const r = await db.from('profile_follows').select('follower_id').eq('follower_id', currentUser).eq('following_id', id).maybeSingle();
      following = !!r.data;
    }

    const modal = document.createElement('div');
    modal.id = 'omProfileModal';
    modal.innerHTML = `
      <div class="om-pm-backdrop" data-close-profile></div>
      <section class="om-pm-card" role="dialog" aria-modal="true" aria-label="Member profile">
        <button class="om-pm-close" type="button" aria-label="Close profile" data-close-profile>×</button>
        <div class="om-pm-cover" style="background:${escapeHtml(bg)};--om-accent:${escapeHtml(accent)}"></div>
        <div class="om-pm-body">
          <div class="om-pm-avatar-wrap">
            <img class="om-pm-avatar" src="${escapeHtml(avatarFor(p))}" alt="${escapeHtml(displayName)}" onerror="this.style.display='none';this.nextElementSibling.style.display='grid'">
            <div class="om-pm-fallback" style="display:none">${escapeHtml(initials(displayName))}</div>
            ${xp >= 10000 ? '<span class="om-pm-platinum">✦ PLATINUM</span>' : ''}
          </div>
          <div class="om-pm-main">
            <h2>${escapeHtml(displayName)}</h2>
            ${username ? `<div class="om-pm-username">${escapeHtml(username)}</div>` : ''}
            ${p.title ? `<div class="om-pm-title">${escapeHtml(p.title)}</div>` : ''}
            <div class="om-pm-stats"><span>⭐ ${xp.toLocaleString()} XP</span>${p.location ? `<span>📍 ${escapeHtml(p.location)}</span>` : ''}</div>
            ${p.bio ? `<p class="om-pm-bio">${escapeHtml(p.bio)}</p>` : '<p class="om-pm-bio om-pm-muted">No bio added yet.</p>'}
            ${p.group_team ? `<div class="om-pm-team">Community: ${escapeHtml(p.group_team)}</div>` : ''}
            <div class="om-pm-actions">
              ${currentUser && currentUser !== id ? `<button type="button" class="om-pm-follow ${following ? 'is-following':''}" data-follow-profile="${escapeHtml(id)}">${following ? 'Following' : 'Follow'}</button>` : ''}
              <button type="button" class="om-pm-full" data-full-profile="${escapeHtml(id)}">View Full Profile</button>
            </div>
          </div>
        </div>
      </section>`;
    document.body.appendChild(modal);

    modal.addEventListener('click', async e => {
      if (e.target.closest('[data-close-profile]')) { closeModal(); return; }
      const full = e.target.closest('[data-full-profile]');
      if (full) {
        closeModal();
        const page = document.getElementById('profilePage');
        const app = document.getElementById('appView');
        if (app && page && !app.classList.contains('hidden')) {
          history.pushState({profile:id},'',`index.html?profile=${encodeURIComponent(id)}`);
          page.dataset.omViewedRendered='';
          window.dispatchEvent(new CustomEvent('oneMuslim:open-profile',{detail:{id}}));
        } else window.location.href=`index.html?profile=${encodeURIComponent(id)}`;
        return;
      }
      const follow = e.target.closest('[data-follow-profile]');
      if (!follow) return;
      const me = currentUser;
      if (!me) return;
      follow.disabled = true;
      try {
        if (follow.classList.contains('is-following')) {
          const r = await db.from('profile_follows').delete().eq('follower_id',me).eq('following_id',id);
          if (r.error) throw r.error;
          follow.classList.remove('is-following'); follow.textContent='Follow';
        } else {
          const r = await db.from('profile_follows').insert({follower_id:me,following_id:id});
          if (r.error && !String(r.error.message||'').toLowerCase().includes('duplicate')) throw r.error;
          follow.classList.add('is-following'); follow.textContent='Following';
        }
      } catch(err) { console.error('Profile follow:',err); }
      finally { follow.disabled=false; }
    });
    document.addEventListener('keydown', onKeyDown);
  };

  window.OneMuslimOpenProfileModal = openProfileModal;

  const openProfile = id => {
    if (!id) return;
    const peoplePage=document.getElementById('profilesPage');
    const peopleVisible=peoplePage && !peoplePage.classList.contains('hidden');
    if(peopleVisible){ openProfileModal(id); return; }
    const app=document.getElementById('appView');
    const page=document.getElementById('profilePage');
    if(app && page && !app.classList.contains('hidden')){
      history.pushState({profile:id},'',`index.html?profile=${encodeURIComponent(id)}`);
      page.dataset.omViewedRendered='';
      window.dispatchEvent(new CustomEvent('oneMuslim:open-profile',{detail:{id}}));
      return;
    }
    window.location.href=`index.html?profile=${encodeURIComponent(id)}`;
  };

  window.OneMuslimOpenProfile=openProfile;
  window.openUserProfile=openProfile;

  const findProfileId = async username => {
    const clean=String(username||'').replace(/^@/,'').trim(); if(!clean)return null;
    const {data,error}=await db.from('profiles').select('id').eq('username',clean).maybeSingle();
    if(error){console.error('Profile navigation lookup:',error);return null} return data?.id||null;
  };
  const usernameFromSmall=el=>{const m=(el?.textContent||'').match(/@([A-Za-z0-9_.-]+)/);return m?.[1]||''};

  const init=()=>{
    if(document.documentElement.dataset.profileNavigationUnified==='1')return;
    document.documentElement.dataset.profileNavigationUnified='1';
    const style=document.createElement('style');style.id='profileNavigationUnifiedStyles';style.textContent=`
      .post-head .post-author,.post-head .post-author b,.post-head .avatar,.comment-head b,.comment > .avatar{cursor:pointer}.post-head .post-author:hover b,.comment-head b:hover{text-decoration:underline}
      #omProfileModal{position:fixed;inset:0;z-index:100000;display:grid;place-items:center;padding:24px;font-family:Inter,system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif}
      .om-pm-backdrop{position:absolute;inset:0;background:rgba(4,12,20,.68);backdrop-filter:blur(6px)}
      .om-pm-card{position:relative;width:min(720px,100%);max-height:min(760px,calc(100vh - 48px));overflow:auto;border-radius:26px;background:#fffdf7;box-shadow:0 30px 90px rgba(0,0,0,.35);border:1px solid rgba(18,61,43,.15);animation:omPmIn .18s ease-out}
      @keyframes omPmIn{from{opacity:0;transform:translateY(10px) scale(.985)}to{opacity:1;transform:none}}
      .om-pm-close{position:absolute;right:16px;top:14px;z-index:3;width:40px;height:40px;border:0;border-radius:50%;background:rgba(255,255,255,.9);font-size:28px;line-height:1;cursor:pointer;color:#173b2c;box-shadow:0 5px 18px rgba(0,0,0,.15)}
      .om-pm-cover{height:150px;border-radius:26px 26px 0 0;position:relative}
      .om-pm-cover:after{content:"";position:absolute;inset:auto 0 0;height:55%;background:linear-gradient(transparent,rgba(0,0,0,.16))}
      .om-pm-body{display:flex;gap:26px;padding:0 30px 30px;position:relative}
      .om-pm-avatar-wrap{width:190px;flex:0 0 190px;margin-top:-74px;position:relative;z-index:2}
      .om-pm-avatar,.om-pm-fallback{width:170px;height:170px;border-radius:50%;object-fit:cover;display:grid;place-items:center;background:#eef2ef;border:7px solid #fffdf7;box-shadow:0 15px 35px rgba(0,0,0,.22)}
      .om-pm-fallback{font-size:44px;font-weight:800;color:#173b2c}
      .om-pm-platinum{display:block;width:max-content;margin:-12px auto 0;padding:5px 10px;border-radius:999px;background:#111827;color:#f4d97b;font-size:10px;font-weight:900;letter-spacing:.08em;box-shadow:0 4px 14px rgba(0,0,0,.2)}
      .om-pm-main{padding-top:24px;min-width:0;flex:1}
      .om-pm-main h2{margin:0;color:#123d2b;font-size:30px;line-height:1.1}
      .om-pm-username{margin-top:5px;color:#718096;font-weight:700}.om-pm-title{margin-top:10px;color:#38594b;font-weight:700}
      .om-pm-stats{display:flex;flex-wrap:wrap;gap:10px;margin-top:14px}.om-pm-stats span,.om-pm-team{padding:7px 11px;border-radius:999px;background:#eef5f0;color:#28533e;font-size:13px;font-weight:700}
      .om-pm-bio{margin:18px 0 0;color:#334155;font-size:15px;line-height:1.65;white-space:pre-wrap}.om-pm-muted{color:#94a3b8}
      .om-pm-actions{display:flex;flex-wrap:wrap;gap:10px;margin-top:22px}.om-pm-actions button{border:0;border-radius:12px;padding:11px 16px;font-weight:800;cursor:pointer}.om-pm-follow{background:#173f2d;color:white}.om-pm-follow.is-following{background:#e6efe9;color:#173f2d}.om-pm-full{background:#d9c7a5;color:#173f2d}
      @media(max-width:620px){#omProfileModal{padding:12px}.om-pm-card{max-height:calc(100vh - 24px);border-radius:20px}.om-pm-cover{height:120px;border-radius:20px 20px 0 0}.om-pm-body{display:block;padding:0 20px 24px}.om-pm-avatar-wrap{width:auto;margin-top:-66px}.om-pm-avatar,.om-pm-fallback{width:135px;height:135px}.om-pm-main{padding-top:16px}.om-pm-main h2{font-size:26px}}
    `;document.head.appendChild(style);
    document.addEventListener('click',async event=>{
      const view=event.target.closest?.('[data-view-profile]');
      if(view){event.preventDefault();event.stopImmediatePropagation();openProfile(view.dataset.viewProfile);return}
      const card=event.target.closest?.('.people-theme-card[data-profile-id]');
      if(card&&!event.target.closest('button,a,input,select,textarea,label')){event.preventDefault();event.stopImmediatePropagation();openProfile(card.dataset.profileId);return}
      const post=event.target.closest?.('.post[data-post]');
      if(post){
        const author=event.target.closest?.('.post-head .post-author,.post-head .post-author b,.post-head > .avatar');
        if(author&&!event.target.closest('button,a')){const username=usernameFromSmall(post.querySelector('.post-author small'));if(username){event.preventDefault();event.stopImmediatePropagation();const id=await findProfileId(username);if(id)openProfile(id)}return}
        const comment=event.target.closest?.('.comment');
        if(comment&&(event.target.closest('.comment-head b')||event.target.closest('.comment > .avatar'))){const username=usernameFromSmall(comment.querySelector('.comment-head small'));if(username){event.preventDefault();event.stopImmediatePropagation();const id=await findProfileId(username);if(id)openProfile(id)}}
      }
    },true);
  };
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
})();