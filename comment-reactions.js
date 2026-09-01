(() => {
  'use strict';

  const { createClient } = window.supabase || {};
  const cfg = window.APP_CONFIG || {};
  if (!createClient || !cfg.SUPABASE_URL || !cfg.SUPABASE_ANON_KEY) return;

  const db = createClient(cfg.SUPABASE_URL, cfg.SUPABASE_ANON_KEY, {
    auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true }
  });

  const EMOJIS = ['😂','😭','😅','😁','🥰','😳','😏','🥺'];
  const esc = s => String(s ?? '').replace(/[&<>"']/g, m => ({
    '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'
  }[m]));
  const toast = msg => typeof window.toast === 'function' ? window.toast(msg) : null;

  let currentUser = null;
  let refreshTimer = null;

  function addStyles() {
    if (document.getElementById('commentReactionsStyles')) return;
    const s = document.createElement('style');
    s.id = 'commentReactionsStyles';
    s.textContent = `
      .comment-reaction-tools{display:flex;flex-direction:column;gap:5px;margin:6px 0 2px}
      .comment-reaction-picker{display:flex;align-items:center;gap:4px;flex-wrap:wrap;padding:4px 6px;border:1px solid #e3ebe5;border-radius:12px;background:#fafcfb;width:max-content;max-width:100%}
      .comment-reaction-picker .comment-reaction-label{font-size:9px;color:#78907f;font-weight:800;text-transform:uppercase;letter-spacing:.04em;margin:0 2px 0 1px}
      .comment-reaction-picker .comment-reaction-btn{width:28px;height:28px;border:0;background:transparent;border-radius:8px;font-size:17px;line-height:1;cursor:pointer;padding:0;transition:.15s ease}
      .comment-reaction-picker .comment-reaction-btn:hover{background:#edf5ef;transform:scale(1.1)}
      .comment-reaction-picker .comment-reaction-btn.selected{background:#e2f1e7;box-shadow:0 0 0 2px #9fc4ae}
      .comment-reaction-counts{display:flex;align-items:center;gap:5px;flex-wrap:wrap;min-height:0}
      .comment-reaction-count{display:inline-flex;align-items:center;gap:3px;border:1px solid #dce8e0;background:#f7fbf8;color:#3d554b;border-radius:999px;padding:3px 7px;font-size:12px;line-height:1;cursor:pointer;transition:.15s ease}
      .comment-reaction-count:hover{background:#edf6f0;border-color:#bfd7ca;transform:translateY(-1px)}
      .comment-reaction-count.mine{border-color:#8eb6a3;background:#eaf5ee;box-shadow:0 0 0 2px rgba(31,91,73,.06)}
      .comment-reaction-count .emoji{font-size:14px;line-height:1}
      .comment-reaction-count .count{font-weight:800}
      @media(max-width:600px){
        .comment-reaction-picker{width:100%;justify-content:center;padding:5px 3px}
        .comment-reaction-picker .comment-reaction-btn{width:31px;height:31px;font-size:19px}
        .comment-reaction-count{padding:4px 7px}
      }
    `;
    document.head.appendChild(s);
  }

  async function getCurrentUser() {
    if (currentUser) return currentUser;
    const { data } = await db.auth.getUser();
    currentUser = data?.user || null;
    return currentUser;
  }

  function getCommentId(el) {
    const direct = el.dataset?.comment || el.dataset?.commentId || el.getAttribute('data-comment-id');
    if (direct) return direct;

    const id = el.getAttribute('id') || '';
    const match = id.match(/^comment[-_](.+)$/i);
    return match ? match[1] : null;
  }

  function commentElements() {
    const candidates = [...document.querySelectorAll(
      '#feed [data-comment], #feed [data-comment-id], #feed .comment, #feed .comment-item, #feed .post-comment'
    )];
    const seen = new Set();
    const result = [];

    for (const el of candidates) {
      if (el.closest('.comment-composer')) continue;
      let comment = el;
      let id = getCommentId(comment);

      if (!id) {
        const tagged = el.querySelector('[data-comment-id], [data-comment]');
        if (tagged) {
          id = getCommentId(tagged);
          if (id) comment = tagged.closest('.comment, .comment-item, .post-comment') || el;
        }
      }

      if (!id) continue;
      if (seen.has(id)) continue;
      seen.add(id);
      result.push({ el: comment, id });
    }

    return result;
  }

  function ensureTools(comment) {
    let tools = comment.el.querySelector(':scope > .comment-reaction-tools');
    if (!tools) {
      tools = document.createElement('div');
      tools.className = 'comment-reaction-tools';

      const picker = document.createElement('div');
      picker.className = 'comment-reaction-picker';
      picker.setAttribute('aria-label', 'React to this comment');
      picker.innerHTML = `<span class="comment-reaction-label">React</span>${EMOJIS.map(emoji =>
        `<button type="button" class="comment-reaction-btn" data-comment-reaction="${esc(comment.id)}" data-emoji="${esc(emoji)}" aria-label="React ${emoji}">${emoji}</button>`
      ).join('')}`;

      const counts = document.createElement('div');
      counts.className = 'comment-reaction-counts';

      tools.appendChild(picker);
      tools.appendChild(counts);

      const anchor = comment.el.querySelector('.comment-body, .comment-content, .comment-text') || comment.el.lastElementChild;
      if (anchor && anchor !== tools && anchor.parentElement === comment.el) anchor.insertAdjacentElement('afterend', tools);
      else comment.el.appendChild(tools);

      picker.querySelectorAll('[data-comment-reaction]').forEach(btn => {
        btn.addEventListener('click', () => toggleReaction(comment.id, btn.dataset.emoji));
      });
    }

    return tools;
  }

  function renderCounts(comment, grouped, mine) {
    const tools = ensureTools(comment);
    const row = tools.querySelector('.comment-reaction-counts');
    if (!row) return;

    const parts = Object.entries(grouped)
      .filter(([, count]) => Number(count) > 0)
      .sort((a,b) => EMOJIS.indexOf(a[0]) - EMOJIS.indexOf(b[0]));

    const html = parts.map(([emoji, count]) =>
      `<button type="button" class="comment-reaction-count ${mine === emoji ? 'mine' : ''}" data-comment-reaction="${esc(comment.id)}" data-emoji="${esc(emoji)}" title="${mine === emoji ? 'Remove reaction' : 'React with ' + emoji}"><span class="emoji">${emoji}</span><span class="count">${Number(count).toLocaleString()}</span></button>`
    ).join('');

    if (row.innerHTML !== html) row.innerHTML = html;
    row.querySelectorAll('[data-comment-reaction]').forEach(btn => {
      if (btn.dataset.bound === '1') return;
      btn.dataset.bound = '1';
      btn.addEventListener('click', () => toggleReaction(comment.id, btn.dataset.emoji));
    });

    tools.querySelectorAll('.comment-reaction-btn').forEach(btn => {
      btn.classList.toggle('selected', btn.dataset.emoji === mine);
    });
  }

  async function refreshReactions() {
    const comments = commentElements();
    if (!comments.length) return;
    const user = await getCurrentUser();
    if (!user) return;

    const ids = comments.map(c => c.id).filter(Boolean);
    const { data, error } = await db
      .from('comment_reactions')
      .select('comment_id,user_id,emoji')
      .in('comment_id', ids);

    if (error) {
      console.warn('Comment reactions unavailable:', error.message);
      return;
    }

    const groupedByComment = new Map();
    const mineByComment = new Map();
    (data || []).forEach(r => {
      if (!groupedByComment.has(r.comment_id)) groupedByComment.set(r.comment_id, {});
      const group = groupedByComment.get(r.comment_id);
      group[r.emoji] = (group[r.emoji] || 0) + 1;
      if (r.user_id === user.id) mineByComment.set(r.comment_id, r.emoji);
    });

    comments.forEach(comment => {
      ensureTools(comment);
      renderCounts(comment, groupedByComment.get(comment.id) || {}, mineByComment.get(comment.id) || null);
    });
  }

  async function toggleReaction(commentId, emoji) {
    const user = await getCurrentUser();
    if (!user || !commentId || !EMOJIS.includes(emoji)) return;

    const { data: existing, error: findError } = await db
      .from('comment_reactions')
      .select('comment_id,user_id,emoji')
      .eq('comment_id', commentId)
      .eq('user_id', user.id)
      .maybeSingle();

    if (findError) {
      toast(findError.message || 'Unable to load comment reactions.');
      return;
    }

    let error = null;
    if (existing?.emoji === emoji) {
      ({ error } = await db.from('comment_reactions').delete().eq('comment_id', commentId).eq('user_id', user.id));
    } else if (existing) {
      ({ error } = await db.from('comment_reactions').update({ emoji }).eq('comment_id', commentId).eq('user_id', user.id));
    } else {
      ({ error } = await db.from('comment_reactions').insert({ comment_id: commentId, user_id: user.id, emoji }));
    }

    if (error) {
      toast(error.message || 'Unable to save comment reaction.');
      return;
    }

    await refreshReactions();
  }

  function scheduleRefresh() {
    clearTimeout(refreshTimer);
    refreshTimer = setTimeout(() => refreshReactions(), 100);
  }

  function init() {
    addStyles();
    const feed = document.getElementById('feed');
    if (!feed) return;

    new MutationObserver(scheduleRefresh).observe(feed, { childList: true, subtree: true });
    scheduleRefresh();

    window.addEventListener('auth-state-changed', () => {
      currentUser = null;
      scheduleRefresh();
    });
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
