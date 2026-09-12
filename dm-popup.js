(() => {
  'use strict';

  const cfg = window.APP_CONFIG || {};
  const createClient = window.supabase?.createClient;
  if (!createClient || !cfg.SUPABASE_URL || !cfg.SUPABASE_ANON_KEY) return;

  const db = createClient(cfg.SUPABASE_URL, cfg.SUPABASE_ANON_KEY, {
    auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true }
  });

  const esc = s => String(s ?? '').replace(/[&<>"']/g, m => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#039;' }[m]));
  const initials = n => (n || 'M').split(' ').filter(Boolean).map(x => x[0]).join('').slice(0, 2).toUpperCase();
  const nameOf = u => u?.display_name || `${u?.first_name || ''} ${u?.last_name || ''}`.trim() || 'Member';
  const toast = msg => typeof window.toast === 'function' ? window.toast(msg) : null;

  let me = null;
  let other = null;
  let conversation = null;

  async function currentUser() {
    if (me) return me;
    const { data } = await db.auth.getUser();
    me = data?.user || null;
    return me;
  }

  async function getPerson(id) {
    const { data, error } = await db.from('profiles')
      .select('id,display_name,username,first_name,last_name,avatar_url')
      .eq('id', id).maybeSingle();
    if (error) throw error;
    return data;
  }

  async function ensureConversation(otherId) {
    const user = await currentUser();
    if (!user || !otherId || user.id === otherId) return null;
    const pair = [user.id, otherId].sort();
    const existing = await db.from('conversations').select('*')
      .eq('participant_a', pair[0]).eq('participant_b', pair[1]).maybeSingle();
    if (existing.error) throw existing.error;
    if (existing.data) return existing.data;

    const created = await db.from('conversations')
      .insert({ participant_a: pair[0], participant_b: pair[1] })
      .select().single();
    if (created.error && /duplicate|unique/i.test(created.error.message)) {
      const retry = await db.from('conversations').select('*')
        .eq('participant_a', pair[0]).eq('participant_b', pair[1]).single();
      if (retry.error) throw retry.error;
      return retry.data;
    }
    if (created.error) throw created.error;
    return created.data;
  }

  function addStyles() {
    if (document.getElementById('dmPopupStyles')) return;
    const s = document.createElement('style');
    s.id = 'dmPopupStyles';
    s.textContent = `
      .om-dm-overlay{position:fixed;inset:0;z-index:10050;background:rgba(5,14,28,.48);backdrop-filter:blur(3px);display:flex;align-items:flex-end;justify-content:flex-end;padding:24px;box-sizing:border-box}
      .om-dm-popup{width:min(420px,calc(100vw - 28px));height:min(620px,calc(100vh - 44px));background:#fff;border:1px solid #dce6f1;border-radius:20px;box-shadow:0 24px 70px rgba(5,20,45,.28);display:flex;flex-direction:column;overflow:hidden}
      .om-dm-head{display:flex;align-items:center;gap:11px;padding:14px 15px;background:linear-gradient(135deg,#0b2344,#1765c5);color:#fff}
      .om-dm-head-copy{min-width:0;flex:1}.om-dm-head-copy b,.om-dm-head-copy small{display:block;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.om-dm-head-copy small{opacity:.76;margin-top:2px}
      .om-dm-close{border:0;background:rgba(255,255,255,.13);color:#fff;width:34px;height:34px;border-radius:50%;font-size:20px;cursor:pointer}
      .om-dm-body{flex:1;overflow:auto;padding:16px;background:#f6f9fd;display:flex;flex-direction:column;gap:9px}
      .om-dm-empty{margin:auto;text-align:center;color:#718096;padding:25px}.om-dm-empty b{display:block;color:#24364f;margin-bottom:5px}
      .om-dm-msg{max-width:82%;padding:10px 12px;border-radius:15px;line-height:1.4;word-break:break-word}.om-dm-msg.mine{align-self:flex-end;background:#1765c5;color:#fff;border-bottom-right-radius:5px}.om-dm-msg.theirs{align-self:flex-start;background:#fff;color:#24364f;border:1px solid #e2e9f2;border-bottom-left-radius:5px}.om-dm-msg small{display:block;font-size:10px;opacity:.68;margin-top:4px}
      .om-dm-compose{display:flex;gap:8px;padding:11px;border-top:1px solid #e2e9f2;background:#fff}.om-dm-compose textarea{flex:1;resize:none;min-height:42px;max-height:110px;border:1px solid #d7e1ed;border-radius:12px;padding:10px 11px;font:inherit;outline:none}.om-dm-compose textarea:focus{border-color:#4a8cf7}.om-dm-send{border:0;border-radius:12px;padding:0 16px;background:#1765c5;color:#fff;font-weight:700;cursor:pointer}.om-dm-send:disabled{opacity:.55;cursor:wait}
      .om-dm-avatar{width:38px;height:38px;flex:0 0 38px;border-radius:50%;display:grid;place-items:center;background:rgba(255,255,255,.18);font-weight:800;color:#fff}
      @media(max-width:700px){.om-dm-overlay{padding:0;align-items:stretch}.om-dm-popup{width:100%;height:100%;max-height:none;border-radius:0}.om-dm-head{padding-top:max(14px,env(safe-area-inset-top))}.om-dm-compose{padding-bottom:max(11px,env(safe-area-inset-bottom))}}
    `;
    document.head.appendChild(s);
  }

  function close() {
    document.getElementById('omDmOverlay')?.remove();
    other = null;
    conversation = null;
  }

  async function renderMessages(body) {
    const user = await currentUser();
    const { data, error } = await db.from('messages').select('id,sender_id,body,created_at')
      .eq('conversation_id', conversation.id).order('created_at', { ascending:true }).limit(200);
    if (error) throw error;
    body.innerHTML = data?.length ? data.map(m => `<div class="om-dm-msg ${m.sender_id === user.id ? 'mine' : 'theirs'}"><div>${esc(m.body)}</div><small>${new Date(m.created_at).toLocaleString([], {month:'short',day:'numeric',hour:'numeric',minute:'2-digit'})}</small></div>`).join('') : `<div class="om-dm-empty"><b>Start the conversation</b><span>Send a private message to ${esc(nameOf(other))}.</span></div>`;
    body.scrollTop = body.scrollHeight;
    await db.from('messages').update({ read_at:new Date().toISOString() })
      .eq('conversation_id', conversation.id).neq('sender_id', user.id).is('read_at', null);
  }

  async function open(id) {
    try {
      const user = await currentUser();
      if (!user || user.id === id) return;
      other = await getPerson(id);
      if (!other) throw new Error('That member could not be found.');
      conversation = await ensureConversation(id);
      if (!conversation) return;

      addStyles();
      document.getElementById('omDmOverlay')?.remove();
      const name = nameOf(other);
      const overlay = document.createElement('div');
      overlay.id = 'omDmOverlay';
      overlay.className = 'om-dm-overlay';
      overlay.innerHTML = `<section class="om-dm-popup" role="dialog" aria-modal="true" aria-label="Message ${esc(name)}"><header class="om-dm-head"><div class="om-dm-avatar">${initials(name)}</div><div class="om-dm-head-copy"><b>${esc(name)}</b><small>@${esc(other.username || '')}</small></div><button type="button" class="om-dm-close" aria-label="Close">×</button></header><div class="om-dm-body" id="omDmBody"><div class="om-dm-empty">Loading…</div></div><form class="om-dm-compose" id="omDmCompose"><textarea maxlength="2000" required placeholder="Write a private message…"></textarea><button class="om-dm-send" type="submit">Send</button></form></section>`;
      document.body.appendChild(overlay);
      const body = overlay.querySelector('#omDmBody');
      overlay.querySelector('.om-dm-close').onclick = close;
      overlay.addEventListener('click', e => { if (e.target === overlay) close(); });
      await renderMessages(body);

      const form = overlay.querySelector('#omDmCompose');
      const textarea = form.querySelector('textarea');
      form.onsubmit = async e => {
        e.preventDefault();
        const text = textarea.value.trim();
        if (!text) return;
        const send = form.querySelector('button');
        send.disabled = true;
        const result = await db.from('messages').insert({ conversation_id:conversation.id, sender_id:user.id, body:text }).select().single();
        if (result.error) {
          send.disabled = false;
          toast(result.error.message || 'Unable to send message.');
          return;
        }
        await db.from('conversations').update({ updated_at:new Date().toISOString() }).eq('id',conversation.id);
        textarea.value = '';
        await renderMessages(body);
        send.disabled = false;
        textarea.focus();
      };
      textarea.focus();
    } catch (e) {
      toast(e.message || 'Unable to open messaging.');
    }
  }

  window.openDmWith = open;
  window.OneMuslimDM = { open, close };

  function init() {
    addStyles();
    document.addEventListener('click', e => {
      const button = e.target.closest('[data-message-user]');
      if (!button) return;
      const id = button.dataset.messageUser;
      if (!id) return;
      e.preventDefault();
      e.stopImmediatePropagation();
      open(id);
    }, true);
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init, { once:true });
  else init();
})();
