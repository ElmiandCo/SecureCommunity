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
    if (document.getElementById('postReactionsStyles')) return;
    const s = document.createElement('style');
    s.id = 'postReactionsStyles';
    s.textContent = `
      .post-reactions{display:flex;align-items:center;gap:6px;flex-wrap:wrap;margin:8px 0 2px;padding:0 2px;min-height:0}
      .post-reaction-count{display:inline-flex;align-items:center;gap:4px;border:1px solid #dce8e0;background:#f7fbf8;color:#3d554b;border-radius:999px;padding:4px 8px;font-size:13px;line-height:1;cursor:pointer;transition:.15s ease}
      .post-reaction-count:hover{background:#edf6f0;border-color:#bfd7ca;transform:translateY(-1px)}
      .post-reaction-count.mine{border-color:#8eb6a3;background:#eaf5ee;box-shadow:0 0 0 2px rgba(31,91,73,.06)}
      .post-reaction-count .emoji{font-size:16px;line-height:1}
      .post-reaction-count .count{font-weight:800}
      .comment-reaction-picker{display:flex;align-items:center;gap:5px;flex-wrap:wrap;margin:7px 0 3px;padding:6px 8px;border:1px solid #e3ebe5;border-radius:12px;background:#fafcfb;width:max-content;max-width:100%}
      .comment-reaction-label{font-size:10px;color:#78907f;font-weight:800;text-transform:uppercase;letter-spacing:.04em;margin-right:2px}
      .comment-reaction-btn{width:31px;height:31px;border:0;background:transparent;border-radius:8px;font-size:19px;line-height:1;cursor:pointer;padding:0;transition:.15s ease}
      .comment-reaction-btn:hover{background:#edf5ef;transform:scale(1.1)}
      .comment-reaction-btn.selected{background:#e2f1e7;box-shadow:0 0 0 2px #9fc4ae}
      .post-reaction-hint{font-size:10px;color:#8a9d92;margin-left:2px}
      @media(max-width:600px){
        .comment-reaction-picker{width:100%;justify-content:center;padding:7px 5px}
        .comment-reaction-btn{width:34px;height:34px;font-size:20px}
        .post-reaction-count{padding:5px 8px}
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

  function postElements() {
    return [...document.querySelectorAll('#feed .post[data-post]')];
  }

  function addPicker(post) {
    const composer = post.querySelector('.comment-composer');
    if (!composer || composer.querySelector('.comment-reaction-picker')) return;

    const postId = post.dataset.post;
    const picker = document.createElement('div');
    picker.className = 'comment-reaction-picker';
    picker.setAttribute('aria-label', 'React to this post');
    picker.innerHTML = `<span class="comment-reaction-label">React</span>${EMOJIS.map(emoji =>
      `<button type="button" class="comment-reaction-btn" data-post-reaction="${postId}" data-emoji="${emoji}" aria-label="React ${emoji}">${emoji}</button>`
    ).join('')}<span class="post-reaction-hint">Choose one</span>`;

    const body = composer.querySelector('.comment-compose-body');
    const textarea = composer.querySelector('textarea');
    if (body && textarea) body.insertBefore(picker, textarea);
    else composer.appendChild(picker);

    picker.querySelectorAll('[data-post-reaction]').forEach(btn => {
      btn.addEventListener('click', async () => {
        await toggleReaction(postId, btn.dataset.emoji);
      });
    });
  }

  function ensureReactionRow(post) {
    let row = post.querySelector('.post-reactions');
    if (row) return row;

    row = document.createElement('div');
    row.className = 'post-reactions';
    const actions = post.querySelector('.post-actions');
    if (actions) actions.insertAdjacentElement('afterend', row);
    else post.appendChild(row);
    return row;
  }

  function renderReactionCounts(post, grouped, mine) {
    const row = ensureReactionRow(post);
    const postId = post.dataset.post;
    const parts = Object.entries(grouped)
      .filter(([, count]) => Number(count) > 0)
      .sort((a,b) => EMOJIS.indexOf(a[0]) - EMOJIS.indexOf(b[0]));

    row.innerHTML = parts.map(([emoji, count]) =>
      `<button type="button" class="post-reaction-count ${mine === emoji ? 'mine' : ''}" data-post-reaction="${esc(postId)}" data-emoji="${esc(emoji)}" title="${mine === emoji ? 'Remove reaction' : 'React with ' + emoji}"><span class="emoji">${emoji}</span><span class="count">${Number(count).toLocaleString()}</span></button>`
    ).join('');

    row.querySelectorAll('[data-post-reaction]').forEach(btn => {
      btn.addEventListener('click', () => toggleReaction(postId, btn.dataset.emoji));
    });

    const picker = post.querySelector('.comment-reaction-picker');
    if (picker) {
      picker.querySelectorAll('.comment-reaction-btn').forEach(btn => {
        btn.classList.toggle('selected', btn.dataset.emoji === mine);
      });
    }
  }

  async function refreshReactions() {
    const posts = postElements();
    if (!posts.length) return;
    const user = await getCurrentUser();
    if (!user) return;

    const ids = posts.map(p => p.dataset.post).filter(Boolean);
    const { data, error } = await db
      .from('post_reactions')
      .select('post_id,user_id,emoji')
      .in('post_id', ids);

    if (error) {
      console.warn('Post reactions unavailable:', error.message);
      return;
    }

    const groupedByPost = new Map();
    const mineByPost = new Map();
    (data || []).forEach(r => {
      if (!groupedByPost.has(r.post_id)) groupedByPost.set(r.post_id, {});
      const group = groupedByPost.get(r.post_id);
      group[r.emoji] = (group[r.emoji] || 0) + 1;
      if (r.user_id === user.id) mineByPost.set(r.post_id, r.emoji);
    });

    posts.forEach(post => {
      addPicker(post);
      renderReactionCounts(post, groupedByPost.get(post.dataset.post) || {}, mineByPost.get(post.dataset.post) || null);
    });
  }

  async function toggleReaction(postId, emoji) {
    const user = await getCurrentUser();
    if (!user || !postId || !EMOJIS.includes(emoji)) return;

    const { data: existing, error: findError } = await db
      .from('post_reactions')
      .select('post_id,user_id,emoji')
      .eq('post_id', postId)
      .eq('user_id', user.id)
      .maybeSingle();

    if (findError) {
      toast(findError.message || 'Unable to load reactions.');
      return;
    }

    let error = null;
    if (existing?.emoji === emoji) {
      ({ error } = await db.from('post_reactions').delete().eq('post_id', postId).eq('user_id', user.id));
    } else if (existing) {
      ({ error } = await db.from('post_reactions').update({ emoji }).eq('post_id', postId).eq('user_id', user.id));
    } else {
      ({ error } = await db.from('post_reactions').insert({ post_id: postId, user_id: user.id, emoji }));
    }

    if (error) {
      toast(error.message || 'Unable to save reaction.');
      return;
    }

    await refreshReactions();
  }

  function scheduleRefresh() {
    clearTimeout(refreshTimer);
    refreshTimer = setTimeout(() => refreshReactions(), 80);
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
