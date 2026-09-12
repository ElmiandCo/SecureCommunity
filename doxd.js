(() => {
  'use strict';

  const cfg = window.APP_CONFIG || {};
  const createClient = window.supabase?.createClient;
  if (!createClient || !cfg.SUPABASE_URL || !cfg.SUPABASE_ANON_KEY) {
    console.error("DoX'd: Supabase configuration is missing.");
    return;
  }

  const sb = window.OneMuslimSupabaseClient?.getClient?.() || createClient(
    cfg.SUPABASE_URL,
    cfg.SUPABASE_ANON_KEY,
    { auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true } }
  );

  const $ = id => document.getElementById(id);
  const esc = s => String(s ?? '').replace(/[&<>"']/g, m => ({
    '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'
  }[m]));
  const fmt = t => new Date(t).toLocaleString([], {
    month:'short', day:'numeric', year:'numeric', hour:'numeric', minute:'2-digit'
  });
  const params = new URLSearchParams(location.search);
  let activeFilter = 'all';
  let allPosts = [];
  let currentUser = null;
  let searchTimer = null;

  function setModal(show){
    $('composerModal').classList.toggle('hidden', !show);
    $('composerModal').setAttribute('aria-hidden', String(!show));
  }

  function goProfile(id){
    if (!id) return;
    location.href = `index.html?profile=${encodeURIComponent(id)}`;
  }

  function goCommunity(id, slug){
    if (!id) return;
    location.href = `communities.html?community=${encodeURIComponent(slug || id)}`;
  }

  function goPost(id){
    if (!id) return;
    history.pushState({}, '', `doxd.html?post=${encodeURIComponent(id)}`);
    openDetail(id);
  }

  function postSummary(p){
    return String(p.claim || p.context || p.evidence || '').slice(0, 240);
  }

  function postCard(p){
    const author = p.profiles || {};
    return `<article class="doxd-card" data-kind="post" data-id="${esc(p.id)}">
      <div class="doxd-thumb">🕵️</div>
      <div>
        <div class="meta">
          <span class="pill">${esc(p.category)}</span>
          <span>POST</span><span>·</span><span>${esc(fmt(p.created_at))}</span>
        </div>
        <h3>${esc(p.title)}</h3>
        <p>${esc(postSummary(p))}</p>
        <div class="meta" style="margin-top:10px">
          <span>Subject: ${esc(p.subject_name)}</span>
          <span>·</span>
          <span>By ${esc(author.display_name || 'Member')}</span>
        </div>
      </div>
    </article>`;
  }

  function personCard(p){
    const name = p.display_name || `${p.first_name || ''} ${p.last_name || ''}`.trim() || 'Member';
    const username = p.username ? `@${p.username}` : '';
    return `<article class="doxd-card doxd-search-entity" data-kind="person" data-id="${esc(p.id)}">
      <div class="doxd-entity-avatar">${p.avatar_url ? `<img src="${esc(p.avatar_url)}" alt="">` : '👤'}</div>
      <div>
        <div class="meta"><span class="pill">PERSON</span>${username ? `<span>${esc(username)}</span>` : ''}</div>
        <h3>${esc(name)}</h3>
        <p>${esc(p.bio || 'OneMuslim member')}</p>
        <div class="meta" style="margin-top:10px"><span>View profile →</span></div>
      </div>
    </article>`;
  }

  function communityCard(c){
    return `<article class="doxd-card doxd-search-entity" data-kind="community" data-id="${esc(c.id)}" data-slug="${esc(c.slug || '')}">
      <div class="doxd-entity-avatar">🏘️</div>
      <div>
        <div class="meta"><span class="pill">COMMUNITY</span><span>${esc(c.slug ? `/${c.slug}` : '')}</span></div>
        <h3>${esc(c.name)}</h3>
        <p>${esc(c.description || 'OneMuslim community')}</p>
        <div class="meta" style="margin-top:10px"><span>Open community →</span></div>
      </div>
    </article>`;
  }

  function categoryCard(category, count){
    return `<article class="doxd-card category-card doxd-search-entity" data-kind="category" data-category="${esc(category)}">
      <div class="doxd-thumb">#</div>
      <div>
        <div class="meta"><span class="pill">CATEGORY</span></div>
        <h3>${esc(category)}</h3>
        <p>${count} DoX'd post${count === 1 ? '' : 's'} in this category.</p>
        <div class="meta" style="margin-top:10px"><span>View category →</span></div>
      </div>
    </article>`;
  }

  async function loadPosts(){
    const { data, error } = await sb
      .from('doxd_posts')
      .select('id,author_id,subject_type,subject_name,title,category,claim,context,evidence,source_url,created_at,updated_at,profiles:author_id(id,display_name,username,avatar_url)')
      .order('created_at', { ascending:false })
      .limit(100);

    if(error){
      $('results').innerHTML = `<div class="empty">Unable to load DoX'd posts right now.</div>`;
      console.error(error);
      return;
    }

    allPosts = data || [];
    renderResults();

    if(params.get('post')) openDetail(params.get('post'));
  }

  async function searchPeople(q){
    if(!q) return [];
    const { data, error } = await sb
      .from('profiles')
      .select('id,display_name,username,first_name,last_name,bio,avatar_url')
      .or(`display_name.ilike.%${q}%,username.ilike.%${q}%,first_name.ilike.%${q}%,last_name.ilike.%${q}%`)
      .limit(20);
    if(error){ console.warn('People search failed', error); return []; }
    return data || [];
  }

  async function searchCommunities(q){
    if(!q) return [];
    const { data, error } = await sb
      .from('communities')
      .select('id,name,slug,description,creator_id,created_at')
      .or(`name.ilike.%${q}%,slug.ilike.%${q}%,description.ilike.%${q}%`)
      .limit(20);
    if(error){ console.warn('Community search failed', error); return []; }
    return data || [];
  }

  async function renderGlobalSearch(q){
    $('resultsTitle').textContent = `Search Results`;
    $('results').innerHTML = `<div class="empty">Searching people, communities, and DoX'd posts…</div>`;

    const [people, communities] = await Promise.all([
      searchPeople(q),
      searchCommunities(q)
    ]);

    let posts = allPosts.filter(p => [
      p.title,p.subject_name,p.subject_type,p.category,p.claim,p.context,p.evidence
    ].some(v => String(v || '').toLowerCase().includes(q)));

    if(activeFilter === 'people'){
      $('results').innerHTML = people.length ? people.map(personCard).join('') : '<div class="empty">No people found.</div>';
      $('resultsTitle').textContent = `People (${people.length})`;
      return;
    }

    if(activeFilter === 'communities'){
      $('results').innerHTML = communities.length ? communities.map(communityCard).join('') : '<div class="empty">No communities found.</div>';
      $('resultsTitle').textContent = `Communities (${communities.length})`;
      return;
    }

    if(activeFilter === 'posts'){
      $('results').innerHTML = posts.length ? posts.map(postCard).join('') : '<div class="empty">No DoX\'d posts found.</div>';
      $('resultsTitle').textContent = `DoX'd Posts (${posts.length})`;
      return;
    }

    const sections = [];
    if(people.length) sections.push(`<section class="doxd-search-section"><div class="doxd-search-section-head"><h3>People</h3><button type="button" data-filter-jump="people">View all</button></div>${people.slice(0,4).map(personCard).join('')}</section>`);
    if(communities.length) sections.push(`<section class="doxd-search-section"><div class="doxd-search-section-head"><h3>Communities</h3><button type="button" data-filter-jump="communities">View all</button></div>${communities.slice(0,4).map(communityCard).join('')}</section>`);
    if(posts.length) sections.push(`<section class="doxd-search-section"><div class="doxd-search-section-head"><h3>DoX'd Posts</h3><button type="button" data-filter-jump="posts">View all</button></div>${posts.slice(0,6).map(postCard).join('')}</section>`);

    $('results').innerHTML = sections.length ? sections.join('') : '<div class="empty">No people, communities, or DoX\'d posts matched your search.</div>';
    $('resultsTitle').textContent = `Search Results (${people.length + communities.length + posts.length})`;
  }

  async function renderResults(){
    const q = ($('doxdSearch').value || '').trim().toLowerCase();

    if(q){
      clearTimeout(searchTimer);
      searchTimer = setTimeout(() => renderGlobalSearch(q), 120);
      return;
    }

    if(activeFilter === 'people' || activeFilter === 'communities'){
      $('resultsTitle').textContent = activeFilter === 'people' ? 'People' : 'Communities';
      $('results').innerHTML = '<div class="empty">Search above to find people and communities.</div>';
      return;
    }

    if(activeFilter === 'categories'){
      const counts = {};
      allPosts.forEach(p => { counts[p.category] = (counts[p.category] || 0) + 1; });
      const cats = Object.keys(counts).sort((a,b) => a.localeCompare(b));
      $('resultsTitle').textContent = 'Categories';
      $('results').innerHTML = cats.length
        ? cats.map(c => categoryCard(c, counts[c])).join('')
        : '<div class="empty">No categories yet.</div>';
      return;
    }

    let rows = allPosts.slice();
    if(activeFilter === 'posts' || activeFilter === 'all') rows = rows;

    const sort = $('sortSelect').value;
    rows.sort((a,b) => sort === 'oldest'
      ? new Date(a.created_at) - new Date(b.created_at)
      : new Date(b.created_at) - new Date(a.created_at));

    $('resultsTitle').textContent = activeFilter === 'posts' ? `DoX'd Posts (${rows.length})` : "Recent DoX'd Posts";
    $('results').innerHTML = rows.length
      ? rows.map(postCard).join('')
      : '<div class="empty">No DoX\'d posts found.</div>';
  }

  async function openDetail(id){
    const { data:p, error } = await sb
      .from('doxd_posts')
      .select('id,author_id,subject_type,subject_name,title,category,claim,context,evidence,source_url,created_at,updated_at,profiles:author_id(id,display_name,username,avatar_url,bio)')
      .eq('id', id)
      .maybeSingle();

    if(error || !p){
      $('results').innerHTML = `<div class="empty">That DoX'd post could not be found.</div>`;
      return;
    }

    const [commentsRes, reactionsRes] = await Promise.all([
      sb.from('doxd_comments').select('id,user_id,body,created_at,profiles:user_id(id,display_name,username,avatar_url)').eq('post_id',id).order('created_at',{ascending:true}),
      sb.from('doxd_reactions').select('user_id,emoji').eq('post_id',id)
    ]);

    const comments = commentsRes.data || [];
    const reactions = reactionsRes.data || [];
    const counts = Object.fromEntries(['🔥','❤️','😂','🤨','😡'].map(e => [e, reactions.filter(r => r.emoji === e).length]));
    const mine = reactions.find(r => r.user_id === currentUser?.id)?.emoji || '';

    $('resultsTitle').textContent = "DoX'd Post Details";
    $('results').innerHTML = `<article class="detail">
      <button class="back" id="backToDoxd">← Back to DoX'd</button>
      <div class="meta" style="margin-top:20px">
        <span class="pill">${esc(p.category)}</span><span>${esc(p.subject_type)}</span><span>·</span><span>${esc(fmt(p.created_at))}</span>
      </div>
      <h1>${esc(p.title)}</h1>
      <div class="doxd-detail-subject">
        <strong>Subject:</strong> ${esc(p.subject_name)}
        <span>·</span>
        <button type="button" class="inline-link" data-profile-id="${esc(p.author_id)}">Posted by ${esc(p.profiles?.display_name || 'Member')}</button>
      </div>
      <div class="body-block"><h3>CLAIM / ALLEGATION</h3><p>${esc(p.claim)}</p></div>
      ${p.context ? `<div class="body-block"><h3>EXPLANATION / CONTEXT</h3><p>${esc(p.context)}</p></div>` : ''}
      ${p.evidence ? `<div class="body-block"><h3>EVIDENCE</h3><p>${esc(p.evidence)}</p></div>` : ''}
      ${p.source_url ? `<div class="body-block"><h3>SOURCE</h3><a class="source" href="${esc(p.source_url)}" target="_blank" rel="noopener noreferrer">${esc(p.source_url)}</a></div>` : ''}
      <div class="doxd-reactions">${['🔥','❤️','😂','🤨','😡'].map(e => `<button class="filter reaction-btn ${mine===e?'active':''}" data-emoji="${e}">${e} ${counts[e]}</button>`).join('')}</div>
      <div class="comments"><h3>Comments (${comments.length})</h3>
        <form id="commentForm" class="doxd-comment-form"><input id="commentInput" required maxlength="2000" placeholder="Add a comment…"><button class="primary-btn" type="submit">Post</button></form>
        <div>${comments.length ? comments.map(c => `<div class="comment"><strong>${esc(c.profiles?.display_name || 'Member')}</strong> <span class="meta">${esc(fmt(c.created_at))}</span><div>${esc(c.body)}</div></div>`).join('') : '<div class="empty">No comments yet. Start the discussion.</div>'}</div>
      </div>
    </article>`;

    $('backToDoxd').onclick = () => {
      history.pushState({}, '', 'doxd.html');
      renderResults();
    };

    document.querySelectorAll('.reaction-btn').forEach(btn => {
      btn.onclick = () => toggleReaction(id, btn.dataset.emoji);
    });

    document.querySelectorAll('[data-profile-id]').forEach(btn => {
      btn.onclick = () => goProfile(btn.dataset.profileId);
    });

    $('commentForm').onsubmit = async e => {
      e.preventDefault();
      await addComment(id);
    };
  }

  async function toggleReaction(postId, emoji){
    if(!currentUser){ alert('Please sign in to react.'); return; }
    const { data:mine } = await sb.from('doxd_reactions').select('emoji').eq('post_id',postId).eq('user_id',currentUser.id).maybeSingle();
    if(mine?.emoji === emoji){
      await sb.from('doxd_reactions').delete().eq('post_id',postId).eq('user_id',currentUser.id);
    } else {
      await sb.from('doxd_reactions').upsert({post_id:postId,user_id:currentUser.id,emoji},{onConflict:'post_id,user_id'});
    }
    await openDetail(postId);
  }

  async function addComment(postId){
    if(!currentUser){ alert('Please sign in to comment.'); return; }
    const body = $('commentInput').value.trim();
    if(!body) return;
    const {error} = await sb.from('doxd_comments').insert({post_id:postId,user_id:currentUser.id,body});
    if(error){ alert(error.message); return; }
    await openDetail(postId);
  }

  async function createPost(e){
    e.preventDefault();
    if(!currentUser){ alert("Please sign in to create a DoX'd post."); return; }

    const source = $('sourceUrl').value.trim();
    if(source && !/^https?:\/\//i.test(source)){
      alert('Source URL must begin with http:// or https://');
      return;
    }

    const payload = {
      author_id:currentUser.id,
      subject_type:$('subjectType').value,
      subject_name:$('subjectName').value.trim(),
      title:$('postTitle').value.trim(),
      category:$('category').value,
      claim:$('claim').value.trim(),
      context:$('context').value.trim() || null,
      evidence:$('evidence').value.trim() || null,
      source_url:source || null
    };

    const {data,error} = await sb.from('doxd_posts').insert(payload).select('id').single();
    if(error){ alert(error.message); return; }

    $('doxdForm').reset();
    setModal(false);
    await loadPosts();
    history.pushState({},'',`doxd.html?post=${data.id}`);
    openDetail(data.id);
  }

  function wireResults(){
    $('results').addEventListener('click', e => {
      const jump = e.target.closest('[data-filter-jump]');
      if(jump){
        activeFilter = jump.dataset.filterJump;
        document.querySelectorAll('.filter').forEach(x => x.classList.toggle('active', x.dataset.filter === activeFilter));
        renderResults();
        return;
      }

      const entity = e.target.closest('.doxd-search-entity');
      if(entity){
        const kind = entity.dataset.kind;
        if(kind === 'person') goProfile(entity.dataset.id);
        else if(kind === 'community') goCommunity(entity.dataset.id, entity.dataset.slug);
        else if(kind === 'category'){
          const category = entity.dataset.category;
          $('doxdSearch').value = category;
          activeFilter = 'posts';
          document.querySelectorAll('.filter').forEach(x => x.classList.toggle('active', x.dataset.filter === 'posts'));
          renderGlobalSearch(category.toLowerCase());
        }
        return;
      }

      const post = e.target.closest('.doxd-card[data-kind="post"]');
      if(post) goPost(post.dataset.id);
    });
  }

  async function init(){
    const {data} = await sb.auth.getUser();
    currentUser = data?.user || null;

    $('createDoxd').onclick = () => setModal(true);
    $('closeComposer').onclick = () => setModal(false);
    $('composerModal').addEventListener('click', e => {
      if(e.target.id === 'composerModal') setModal(false);
    });
    $('doxdForm').onsubmit = createPost;

    $('doxdSearch').oninput = () => {
      $('clearSearch').hidden = !$('doxdSearch').value;
      renderResults();
    };

    $('clearSearch').onclick = () => {
      $('doxdSearch').value = '';
      $('clearSearch').hidden = true;
      renderResults();
    };

    $('sortSelect').onchange = renderResults;

    document.querySelectorAll('.filter').forEach(btn => {
      btn.onclick = () => {
        activeFilter = btn.dataset.filter;
        document.querySelectorAll('.filter').forEach(x => x.classList.toggle('active', x === btn));
        renderResults();
      };
    });

    wireResults();
    await loadPosts();
  }

  window.addEventListener('popstate', () => {
    const id = new URLSearchParams(location.search).get('post');
    id ? openDetail(id) : renderResults();
  });

  init();
})();
