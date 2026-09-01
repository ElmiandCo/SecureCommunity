(() => {
  'use strict';

  const cfg = window.APP_CONFIG || {};
  const createClient = window.supabase?.createClient;
  if (!createClient || !cfg.SUPABASE_URL || !cfg.SUPABASE_ANON_KEY) return;

  const db = createClient(cfg.SUPABASE_URL, cfg.SUPABASE_ANON_KEY, {
    auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true }
  });

  const $ = id => document.getElementById(id);
  const esc = s => String(s ?? '').replace(/[&<>"']/g, m => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[m]));
  const initials = n => (n || 'M').split(' ').filter(Boolean).map(x => x[0]).join('').slice(0, 2).toUpperCase();
  const displayName = u => u?.display_name || `${u?.first_name || ''} ${u?.last_name || ''}`.trim() || 'Member';
  const toast = msg => typeof window.toast === 'function' ? window.toast(msg) : null;

  let me = null;
  let selectedUser = null;
  let selectedConversation = null;

  function addStyles() {
    if ($('dmComposeStyles')) return;
    const s = document.createElement('style');
    s.id = 'dmComposeStyles';
    s.textContent = `
      .dm-new-message-btn{margin-left:auto!important;white-space:nowrap!important}
      .dm-new-panel{padding:22px;min-height:420px;background:#fbfefc}
      .dm-new-panel h3{margin:0 0 6px;color:#294035;font-size:22px}
      .dm-new-panel p{margin:0 0 16px;color:#78907f}
      .dm-member-search{width:100%;box-sizing:border-box;border:1px solid #d8e6dc;border-radius:12px;padding:12px 13px;background:#fff;color:#243129;outline:none;margin-bottom:12px}
      .dm-member-search:focus{border-color:#20a85a}
      .dm-member-results{display:grid;gap:7px;max-height:330px;overflow:auto}
      .dm-member-choice{display:flex;align-items:center;gap:11px;width:100%;border:1px solid #e1ebe4;background:#fff;border-radius:13px;padding:11px;text-align:left;cursor:pointer;color:#294035}
      .dm-member-choice:hover{border-color:#a8cdb8;background:#f7fcf8}
      .dm-member-choice .dm-member-copy{min-width:0}
      .dm-member-choice b,.dm-member-choice small{display:block;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
      .dm-member-choice small{color:#78907f;margin-top:3px}
      .dm-new-cancel{margin-top:14px}
      .dm-chat-head .dm-new-inline{margin-left:auto}
      @media(max-width:700px){.dm-new-panel{padding:17px;min-height:340px}.dm-new-message-btn{font-size:12px!important;padding:9px 12px!important}.dm-member-results{max-height:260px}}
    `;
    document.head.appendChild(s);
  }

  async function currentUser() {
    if (me) return me;
    const { data } = await db.auth.getUser();
    me = data?.user || null;
    return me;
  }

  function messagesPageReady() {
    return $('messagesPage') && $('dmChat') && $('dmList');
  }

  function enterMessagesPage() {
    const existing = document.querySelector('[data-social-page="messages"]');
    if (existing) {
      existing.click();
      return;
    }
    document.querySelectorAll('.page').forEach(p => p.classList.add('hidden'));
    $('messagesPage')?.classList.remove('hidden');
  }

  async function listMembers(term='') {
    const user = await currentUser();
    if (!user) return [];
    let q = db.from('profiles').select('id,display_name,username,first_name,last_name,avatar_url').neq('id', user.id).order('display_name').limit(100);
    const { data, error } = await q;
    if (error) throw error;
    const rows = data || [];
    const needle = term.trim().toLowerCase();
    if (!needle) return rows;
    return rows.filter(p => `${displayName(p)} ${p.username || ''}`.toLowerCase().includes(needle));
  }

  function renderMemberResults(rows) {
    const box = $('dmMemberResults');
    if (!box) return;
    box.innerHTML = rows.length
      ? rows.map(p => `<button type="button" class="dm-member-choice" data-new-dm-user="${esc(p.id)}"><span class="avatar small-avatar">${initials(displayName(p))}</span><span class="dm-member-copy"><b>${esc(displayName(p))}</b><small>@${esc(p.username || '')}</small></span></button>`).join('')
      : `<div class="dm-empty"><b>No members found.</b><span>Try a different name or username.</span></div>`;
    document.querySelectorAll('[data-new-dm-user]').forEach(b => b.onclick = () => startConversation(b.dataset.newDmUser));
  }

  async function showNewMessage() {
    try {
      enterMessagesPage();
      await new Promise(resolve => setTimeout(resolve, 0));
      if (!messagesPageReady()) return;
      $('dmChat').innerHTML = `<div class="dm-new-panel"><h3>New message</h3><p>Choose a member to start a private conversation.</p><input id="dmMemberSearch" class="dm-member-search" type="search" placeholder="Search members…" autocomplete="off"><div id="dmMemberResults" class="dm-member-results"><div class="dm-empty"><span>Loading members…</span></div></div></div>`;
      const input = $('dmMemberSearch');
      const refresh = async () => {
        try { renderMemberResults(await listMembers(input.value)); }
        catch (e) { toast(e.message || 'Unable to load members.'); }
      };
      input.oninput = refresh;
      await refresh();
      input.focus();
    } catch (e) {
      toast(e.message || 'Unable to start a new message.');
    }
  }

  async function ensureConversation(otherId) {
    const user = await currentUser();
    if (!user || !otherId || user.id === otherId) return null;
    const pair = [user.id, otherId].sort();
    const existing = await db.from('conversations').select('*').eq('participant_a', pair[0]).eq('participant_b', pair[1]).maybeSingle();
    if (existing.error) throw existing.error;
    if (existing.data) return existing.data;
    const created = await db.from('conversations').insert({participant_a:pair[0],participant_b:pair[1]}).select().single();
    if (created.error && /duplicate|unique/i.test(created.error.message)) {
      const retry = await db.from('conversations').select('*').eq('participant_a', pair[0]).eq('participant_b', pair[1]).single();
      if (retry.error) throw retry.error;
      return retry.data;
    }
    if (created.error) throw created.error;
    return created.data;
  }

  async function startConversation(otherId) {
    try {
      const user = await currentUser();
      if (!user) return;
      const { data: person, error: personError } = await db.from('profiles').select('id,display_name,username,first_name,last_name').eq('id', otherId).maybeSingle();
      if (personError) throw personError;
      if (!person) throw new Error('That member could not be found.');
      selectedUser = person;
      selectedConversation = await ensureConversation(otherId);
      await renderChat();
    } catch (e) {
      toast(e.message || 'Could not open that conversation.');
    }
  }

  async function renderChat() {
    const user = await currentUser();
    if (!user || !selectedConversation || !selectedUser || !messagesPageReady()) return;
    const { data: rows, error } = await db.from('messages').select('id,sender_id,body,created_at,read_at').eq('conversation_id', selectedConversation.id).order('created_at', {ascending:true}).limit(200);
    if (error) throw error;
    const name = displayName(selectedUser);
    $('dmChat').innerHTML = `<div class="dm-chat-head"><div class="avatar small-avatar">${initials(name)}</div><div><b>${esc(name)}</b><small>@${esc(selectedUser.username || '')}</small></div><button type="button" class="outline dm-new-inline" id="dmNewAgain">New message</button></div><div class="dm-messages" id="dmNewMessages">${(rows || []).map(m => `<div class="dm-message ${m.sender_id === user.id ? 'mine' : 'theirs'}"><div>${esc(m.body)}</div><small>${new Date(m.created_at).toLocaleString()}</small></div>`).join('') || `<div class="dm-empty"><b>Start the conversation.</b><span>Only you and ${esc(name)} can see these messages.</span></div>`}</div><form class="dm-composer" id="dmNewComposer"><textarea maxlength="2000" required placeholder="Write a private message…"></textarea><button class="primary" type="submit">Send</button></form>`;
    $('dmNewAgain').onclick = showNewMessage;
    $('dmNewComposer').onsubmit = async e => {
      e.preventDefault();
      const box = e.currentTarget.querySelector('textarea');
      const body = box.value.trim();
      if (!body) return;
      const result = await db.from('messages').insert({conversation_id:selectedConversation.id,sender_id:user.id,body}).select().single();
      if (result.error) { toast(result.error.message); return; }
      await db.from('conversations').update({updated_at:new Date().toISOString()}).eq('id',selectedConversation.id);
      box.value = '';
      await renderChat();
      const sc = $('dmNewMessages');
      if (sc) sc.scrollTop = sc.scrollHeight;
      document.querySelector('[data-social-page="messages"]')?.click();
    };
    const sc = $('dmNewMessages');
    if (sc) sc.scrollTop = sc.scrollHeight;
    await db.from('messages').update({read_at:new Date().toISOString()}).eq('conversation_id',selectedConversation.id).neq('sender_id',user.id).is('read_at',null);
  }

  function addNewButton() {
    const page = $('messagesPage');
    const head = page?.querySelector('.page-head');
    if (!head || head.querySelector('#dmNewMessageButton')) return;
    const b = document.createElement('button');
    b.type = 'button';
    b.id = 'dmNewMessageButton';
    b.className = 'primary dm-new-message-btn';
    b.textContent = '+ New message';
    b.onclick = showNewMessage;
    head.appendChild(b);
  }

  function init() {
    addStyles();
    addNewButton();
    new MutationObserver(() => addNewButton()).observe(document.body, {childList:true, subtree:true});
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
})();
