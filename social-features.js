(() => {
  const { createClient } = window.supabase || {};
  const cfg = window.APP_CONFIG || {};
  if (!createClient || !cfg.SUPABASE_URL || !cfg.SUPABASE_ANON_KEY) return;

  const db = createClient(cfg.SUPABASE_URL, cfg.SUPABASE_ANON_KEY, {
    auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true }
  });
  const $ = id => document.getElementById(id);
  const esc = s => String(s ?? '').replace(/[&<>"']/g, m => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[m]));
  const initials = n => (n || 'E').split(' ').filter(Boolean).map(x => x[0]).join('').slice(0,2).toUpperCase();
  const displayName = u => u?.display_name || `${u?.first_name || ''} ${u?.last_name || ''}`.trim() || 'Member';
  const toast = msg => typeof window.toast === 'function' ? window.toast(msg) : null;
  let currentUser = null;
  let viewedProfile = null;
  let activeConversation = null;
  let dmPoll = null;

  function ensureSocialPages(){
    const content = document.querySelector('.content');
    if (!content || $('messagesPage')) return;
    content.insertAdjacentHTML('beforeend', `
      <div id="visitProfilePage" class="page hidden">
        <div class="page-head"><div><span class="eyebrow">MEMBER PROFILE</span><h2>Profile</h2></div><button class="back" id="profileBack">← Back to People</button></div>
        <div id="visitedProfilePanel"></div>
      </div>
      <div id="messagesPage" class="page hidden">
        <div class="page-head"><div><span class="eyebrow">PRIVATE MESSAGES</span><h2>Messages</h2></div></div>
        <div class="dm-layout">
          <aside class="dm-list" id="dmList"><div class="dm-empty">Loading conversations…</div></aside>
          <section class="dm-chat" id="dmChat"><div class="dm-empty"><b>Start a conversation</b><span>Open a member profile and choose Message.</span></div></section>
        </div>
      </div>`);

    $('profileBack').onclick = () => showSocialPage('profiles');
  }

  function addMessagesNav(){
    const nav = document.querySelector('.sidebar nav');
    if (!nav || nav.querySelector('[data-social-page="messages"]')) return;
    const button = document.createElement('button');
    button.className = 'side';
    button.dataset.socialPage = 'messages';
    button.innerHTML = '✉ Messages';
    button.onclick = () => { showSocialPage('messages'); loadConversations(); };
    nav.insertBefore(button, nav.lastElementChild);
  }

  function showSocialPage(page){
    document.querySelectorAll('.page').forEach(p => p.classList.add('hidden'));
    const target = page === 'profile' ? $('visitProfilePage') : page === 'messages' ? $('messagesPage') : $(`${page}Page`);
    if (!target) return;
    target.classList.remove('hidden');
    document.querySelectorAll('.side').forEach(x => x.classList.remove('active'));
    const side = page === 'messages' ? document.querySelector('[data-social-page="messages"]') : document.querySelector(`[data-page="${page}"]`);
    side?.classList.add('active');
  }

  async function getCurrentUser(){
    if (currentUser) return currentUser;
    const { data } = await db.auth.getUser();
    currentUser = data?.user || null;
    return currentUser;
  }

  async function recordVisit(profileId){
    const user = await getCurrentUser();
    if (!user || user.id === profileId) return;
    await db.from('profile_visits').upsert({visitor_id:user.id, profile_id:profileId, visited_at:new Date().toISOString()},{onConflict:'visitor_id,profile_id'});
  }

  async function openUserProfile(profileId, push=true){
    const user = await getCurrentUser();
    if (!user || !profileId || profileId === user.id) { showSocialPage('profile'); return; }
    const { data, error } = await db.from('profiles').select('*').eq('id',profileId).maybeSingle();
    if (error || !data) { toast(error?.message || 'That profile could not be found.'); return; }
    viewedProfile = data;
    await recordVisit(profileId);
    if (push) history.pushState({profileId},'',`?profile=${encodeURIComponent(profileId)}`);
    await renderVisitedProfile(data);
    showSocialPage('profile');
  }

  async function renderVisitedProfile(user){
    const { data: postRows, error } = await db.from('posts').select('id,body,created_at,updated_at').eq('user_id',user.id).order('created_at',{ascending:false}).limit(30);
    if (error) { toast(error.message); return; }
    const name = displayName(user);
    const location = [user.city,user.state,user.country].filter(Boolean).join(', ');
    const socials = [
      user.instagram_username ? `Instagram · @${user.instagram_username}` : '',
      user.tiktok_username ? `TikTok · @${user.tiktok_username}` : '',
      user.x_username ? `X · @${user.x_username}` : ''
    ].filter(Boolean);
    const posts = (postRows || []).map(p => `<article class="post profile-post"><small class="profile-post-date">${new Date(p.created_at).toLocaleString()}</small>${p.body ? `<p>${esc(p.body)}</p>` : ''}</article>`).join('');
    $('visitedProfilePanel').innerHTML = `
      <div class="profile-panel visited-profile-card">
        <div class="profile-hero">
          <div class="avatar profile-big-avatar">${initials(name)}</div>
          <div><span class="eyebrow">MEMBER</span><h2>${esc(name)}</h2><p>@${esc(user.username || '')}</p></div>
          <div class="profile-xp"><span>XP</span><b>${Number(user.xp_total || 0).toLocaleString()}</b></div>
        </div>
        <div class="visited-actions"><button class="primary" id="profileMessageBtn">✉ Message</button><button class="outline" id="profilePeopleBtn">← People</button></div>
        <span class="private-tag">🔐 MEMBER PROFILE</span>
        <p class="visited-bio">${esc(user.bio || 'This member has not added a bio yet.')}</p>
        <div class="profile-meta">
          ${location ? `<span>📍 ${esc(location)}</span>` : ''}
          ${user.gender ? `<span>◉ ${esc(user.gender)}</span>` : ''}
          ${user.website ? `<a href="${esc(user.website)}" target="_blank" rel="noopener">${esc(user.website)}</a>` : ''}
          ${socials.map(x => `<span>${esc(x)}</span>`).join('')}
        </div>
      </div>
      <div class="profile-posts-head"><span class="eyebrow">COMMUNITY ACTIVITY</span><h3>${esc(name)}'s posts</h3></div>
      <div class="profile-posts">${posts || `<div class="post"><p>${esc(name)} hasn't posted anything yet.</p></div>`}</div>`;
    $('profileMessageBtn').onclick = () => openDmWith(user.id);
    $('profilePeopleBtn').onclick = () => showSocialPage('profiles');
  }

  window.renderProfiles = function renderProfilesSocial(){
    const seen = new Map();
    const basePosts = window.posts || [];
    basePosts.forEach(p => {
      if (p.profiles && !seen.has(p.user_id)) seen.set(p.user_id,p.profiles);
      (p.comments || []).forEach(c => { if(c.profiles && !seen.has(c.user_id)) seen.set(c.user_id,c.profiles); });
    });
    if (window.profile && window.me && !seen.has(window.me.id)) seen.set(window.me.id,window.profile);
    const rows = [...seen.values()].filter(u => u.id !== window.me?.id);
    $('profilesGrid').innerHTML = rows.map(u => {
      const name = displayName(u);
      return `<div class="profile-card member-card">
        <div class="avatar">${initials(name)}</div><h3>${esc(name)}</h3><p>@${esc(u.username || '')}</p><p>${esc(u.bio || 'Member of the community.')}</p>
        <div class="member-card-actions"><button class="outline" data-view-profile="${u.id}">View profile</button><button class="primary" data-message-user="${u.id}">Message</button></div>
      </div>`;
    }).join('') || `<div class="profile-card"><p>No other members are available yet.</p></div>`;
    document.querySelectorAll('[data-view-profile]').forEach(b => b.onclick = () => openUserProfile(b.dataset.viewProfile));
    document.querySelectorAll('[data-message-user]').forEach(b => b.onclick = () => openDmWith(b.dataset.messageUser));
  };

  async function ensureConversation(otherId){
    const user = await getCurrentUser();
    if (!user || user.id === otherId) return null;
    const pair = [user.id,otherId].sort();
    let { data, error } = await db.from('conversations').select('*').eq('participant_a',pair[0]).eq('participant_b',pair[1]).maybeSingle();
    if (error) throw error;
    if (data) return data;
    const result = await db.from('conversations').insert({participant_a:pair[0],participant_b:pair[1]}).select().single();
    if (result.error && /duplicate|unique/i.test(result.error.message)) {
      const retry = await db.from('conversations').select('*').eq('participant_a',pair[0]).eq('participant_b',pair[1]).single();
      if (retry.error) throw retry.error;
      return retry.data;
    }
    if (result.error) throw result.error;
    return result.data;
  }

  async function openDmWith(otherId){
    try{
      const conversation = await ensureConversation(otherId);
      if (!conversation) return;
      activeConversation = conversation;
      showSocialPage('messages');
      await loadConversations();
      await loadMessages(conversation.id,otherId);
      $('dmComposer')?.querySelector('textarea')?.focus();
    }catch(e){ toast(e.message || 'Could not open messages.'); }
  }

  async function loadConversations(){
    const user = await getCurrentUser();
    if (!user || !$('dmList')) return;
    const { data: rows, error } = await db.from('conversations').select('*').or(`participant_a.eq.${user.id},participant_b.eq.${user.id}`).order('updated_at',{ascending:false});
    if (error) { toast(error.message); return; }
    const ids = [...new Set((rows || []).flatMap(c => [c.participant_a,c.participant_b].filter(id => id !== user.id)))];
    let profiles = [];
    if (ids.length) {
      const r = await db.from('profiles').select('id,display_name,username,first_name,last_name,avatar_url').in('id',ids);
      profiles = r.data || [];
    }
    const map = new Map(profiles.map(p => [p.id,p]));
    $('dmList').innerHTML = (rows || []).map(c => {
      const otherId = c.participant_a === user.id ? c.participant_b : c.participant_a;
      const p = map.get(otherId) || {display_name:'Member'};
      const active = activeConversation?.id === c.id ? 'active' : '';
      return `<button class="dm-thread ${active}" data-conversation="${c.id}" data-other="${otherId}"><span class="avatar small-avatar">${initials(displayName(p))}</span><span><b>${esc(displayName(p))}</b><small>@${esc(p.username || '')}</small></span></button>`;
    }).join('') || `<div class="dm-empty"><b>No messages yet.</b><span>Visit a member profile and tap Message.</span></div>`;
    document.querySelectorAll('[data-conversation]').forEach(b => b.onclick = async () => { activeConversation = (rows || []).find(c => c.id === b.dataset.conversation) || activeConversation; await loadMessages(b.dataset.conversation,b.dataset.other); loadConversations(); });
  }

  async function loadMessages(conversationId,otherId){
    const user = await getCurrentUser();
    const { data: rows, error } = await db.from('messages').select('id,sender_id,body,created_at,read_at').eq('conversation_id',conversationId).order('created_at',{ascending:true}).limit(200);
    if (error) { toast(error.message); return; }
    const { data: other } = await db.from('profiles').select('id,display_name,username').eq('id',otherId).maybeSingle();
    const name = displayName(other || {display_name:'Member'});
    $('dmChat').innerHTML = `
      <div class="dm-chat-head"><div class="avatar small-avatar">${initials(name)}</div><div><b>${esc(name)}</b><small>@${esc(other?.username || '')}</small></div><button class="outline" id="dmViewProfile">View profile</button></div>
      <div class="dm-messages" id="dmMessages">${(rows || []).map(m => `<div class="dm-message ${m.sender_id === user.id ? 'mine' : 'theirs'}"><div>${esc(m.body)}</div><small>${new Date(m.created_at).toLocaleString()}</small></div>`).join('') || `<div class="dm-empty"><b>Start the conversation.</b><span>Only you and ${esc(name)} can see these messages.</span></div>`}</div>
      <form class="dm-composer" id="dmComposer"><textarea maxlength="2000" required placeholder="Write a private message…"></textarea><button class="primary" type="submit">Send</button></form>`;
    $('dmViewProfile').onclick = () => openUserProfile(otherId);
    $('dmComposer').onsubmit = async e => { e.preventDefault(); const box=e.currentTarget.querySelector('textarea'); const body=box.value.trim(); if(!body)return; const result=await db.from('messages').insert({conversation_id:conversationId,sender_id:user.id,body}).select().single(); if(result.error){toast(result.error.message);return;} await db.from('conversations').update({updated_at:new Date().toISOString()}).eq('id',conversationId); box.value=''; await loadMessages(conversationId,otherId); await loadConversations(); };
    const sc = $('dmMessages'); if(sc) sc.scrollTop=sc.scrollHeight;
    await db.from('messages').update({read_at:new Date().toISOString()}).eq('conversation_id',conversationId).neq('sender_id',user.id).is('read_at',null);
    if(dmPoll) clearInterval(dmPoll);
    dmPoll = setInterval(async () => { if(activeConversation?.id === conversationId && $('messagesPage') && !$('messagesPage').classList.contains('hidden')) await loadMessages(conversationId,otherId); },5000);
  }

  function socialInit(){
    ensureSocialPages();
    addMessagesNav();
    window.addEventListener('popstate', async () => {
      const id = new URLSearchParams(location.search).get('profile');
      if(id) await openUserProfile(id,false); else showSocialPage('profiles');
    });
    const id = new URLSearchParams(location.search).get('profile');
    if(id) setTimeout(() => openUserProfile(id,false),700);
  }

  db.auth.onAuthStateChange((event,session) => {
    currentUser = session?.user || null;
    if(!session && dmPoll){ clearInterval(dmPoll); dmPoll=null; }
  });
  document.addEventListener('DOMContentLoaded',socialInit);
  socialInit();
})();