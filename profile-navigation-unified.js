/* OneMuslim unified profile navigation.
 * Every member identity surface should resolve to index.html?profile=USER_ID.
 * Action buttons remain independent so Follow/Message do not navigate.
 */
(() => {
  'use strict';
  const cfg = window.APP_CONFIG || {};
  const createClient = window.supabase?.createClient;
  if (!createClient || !cfg.SUPABASE_URL || !cfg.SUPABASE_ANON_KEY) return;
  const db = createClient(cfg.SUPABASE_URL, cfg.SUPABASE_ANON_KEY, {
    auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true }
  });

  const go = id => {
    if (!id) return;
    window.location.href = `index.html?profile=${encodeURIComponent(id)}`;
  };

  const findProfileId = async username => {
    const clean = String(username || '').replace(/^@/, '').trim();
    if (!clean) return null;
    const { data, error } = await db.from('profiles').select('id').eq('username', clean).maybeSingle();
    if (error) {
      console.error('Profile navigation lookup:', error);
      return null;
    }
    return data?.id || null;
  };

  const usernameFromSmall = el => {
    const text = el?.textContent || '';
    const match = text.match(/@([A-Za-z0-9_.-]+)/);
    return match?.[1] || '';
  };

  const init = () => {
    if (document.documentElement.dataset.profileNavigationUnified === '1') return;
    document.documentElement.dataset.profileNavigationUnified = '1';

    const style = document.createElement('style');
    style.id = 'profileNavigationUnifiedStyles';
    style.textContent = `
      .post-head .post-author,
      .post-head .post-author b,
      .post-head .avatar,
      .comment-head b,
      .comment > .avatar { cursor:pointer; }
      .post-head .post-author:hover b,
      .comment-head b:hover { text-decoration:underline; }
    `;
    document.head.appendChild(style);

    document.addEventListener('click', async event => {
      /* People: card and explicit View Profile button. */
      const view = event.target.closest?.('[data-view-profile]');
      if (view) {
        event.preventDefault();
        event.stopPropagation();
        go(view.dataset.viewProfile);
        return;
      }

      const card = event.target.closest?.('.people-theme-card[data-profile-id]');
      if (card && !event.target.closest('button,a,input,select,textarea,label')) {
        event.preventDefault();
        go(card.dataset.profileId);
        return;
      }

      /* Feed post author/avatar. Never intercept post action buttons or menus. */
      const post = event.target.closest?.('.post[data-post]');
      if (post) {
        const author = event.target.closest?.('.post-head .post-author, .post-head .post-author b, .post-head > .avatar');
        if (author && !event.target.closest('button,a')) {
          const username = usernameFromSmall(post.querySelector('.post-author small'));
          if (username) {
            event.preventDefault();
            const id = await findProfileId(username);
            if (id) go(id);
          }
          return;
        }

        /* Comments inside this post. */
        const comment = event.target.closest?.('.comment');
        if (comment && (event.target.closest('.comment-head b') || event.target.closest('.comment > .avatar'))) {
          const username = usernameFromSmall(comment.querySelector('.comment-head small'));
          if (username) {
            event.preventDefault();
            const id = await findProfileId(username);
            if (id) go(id);
          }
        }
      }
    }, true);
  };

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init, { once: true });
  else init();
})();
