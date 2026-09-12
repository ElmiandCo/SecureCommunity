(() => {
  const { createClient } = window.supabase || {};
  const cfg = window.APP_CONFIG || {};
  if (!createClient || !cfg.SUPABASE_URL || !cfg.SUPABASE_ANON_KEY) {
    console.error('DoX\'d: Supabase configuration is missing.');
    return;
  }
  const sb = createClient(cfg.SUPABASE_URL, cfg.SUPABASE_ANON_KEY, { auth:{persistSession:true,autoRefreshToken:true,detectSessionInUrl:true} });
  const $ = id => document.getElementById(id);
  const esc = s => String(s ?? '').replace(/[&<>"']/g, m => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[m]));
  const fmt = t => new Date(t).toLocaleString([], {month:'short',day:'numeric',year:'numeric',hour:'numeric',minute:'2-digit'});
  const params = new URLSearchParams(location.search);
  let activeFilter = 'all';
  let allPosts = [];
  let currentUser = null;

  function setModal(show){ $('composerModal').classList.toggle('hidden',!show); $('composerModal').setAttribute('aria-hidden',String(!show)); }
  function summary(p){ return String(p.claim || p.context || '').slice(0,220); }
  function card(p){
    return `<article class="doxd-card" data-id="${p.id}">
      <div class="doxd-thumb">🕵️</div>
      <div>
        <div class="meta"><span class="pill">${esc(p.category)}</span><span>${esc(p.subject_type)}</span><span>·</span><span>${esc(fmt(p.created_at))}</span></div>
        <h3>${esc(p.title)}</h3>
        <p>${esc(summary(p))}</p>
        <div class="meta" style="margin-top:10px"><span>Subject: ${esc(p.subject_name)}</span></div>
      </div>
    </article>`;
  }

  async function loadPosts(){
    const {data,error} = await sb.from('doxd_posts').select('id,author_id,subject_type,subject_name,title,category,claim,context,evidence,source_url,created_at,updated_at,profiles:author_id(id,display_name,username,avatar_url)').order('created_at',{ascending:false}).limit(100);
    if(error){ $('results').innerHTML=`<div class="empty">Unable to load DoX'd posts right now.</div>`; console.error(error); return; }
    allPosts = data || [];
    renderResults();
    if(params.get('post')) openDetail(params.get('post'));
  }

  function renderResults(){
    const q = ($('doxdSearch').value || '').trim().toLowerCase();
    let rows = allPosts.filter(p => {
      if(activeFilter === 'people' && p.subject_type !== 'Person') return false;
      if(activeFilter === 'communities' && p.subject_type !== 'Community') return false;
      if(activeFilter === 'categories') return false;
      if(activeFilter === 'posts' || activeFilter === 'all') return true;
      return true;
    });
    if(activeFilter === 'categories'){
      const cats = [...new Set(allPosts.map(p=>p.category))];
      $('resultsTitle').textContent = 'Categories';
      $('results').innerHTML = cats.length ? cats.map(c=>`<article class="doxd-card category-card" data-category="${esc(c)}"><div class="doxd-thumb">#</div><div><div class="meta"><span class="pill">CATEGORY</span></div><h3>${esc(c)}</h3><p>${allPosts.filter(p=>p.category===c).length} DoX'd post${allPosts.filter(p=>p.category===c).length===1?'':'s'} in this category.</p></div></article>`).join('') : '<div class="empty">No categories yet.</div>';
      return;
    }
    if(q){ rows = rows.filter(p => [p.title,p.subject_name,p.subject_type,p.category,p.claim,p.context,p.evidence].some(v=>String(v||'').toLowerCase().includes(q))); }
    const sort = $('sortSelect').value;
    rows.sort((a,b)=> sort==='oldest' ? new Date(a.created_at)-new Date(b.created_at) : new Date(b.created_at)-new Date(a.created_at));
    $('resultsTitle').textContent = q ? `Search Results (${rows.length})` : activeFilter==='all' ? "Recent DoX'd Posts" : `${activeFilter[0].toUpperCase()+activeFilter.slice(1)} (${rows.length})`;
    $('results').innerHTML = rows.length ? rows.map(card).join('') : '<div class="empty">No matching DoX\'d posts found.</div>';
  }

  async function openDetail(id){
    const {data:p,error} = await sb.from('doxd_posts').select('id,author_id,subject_type,subject_name,title,category,claim,context,evidence,source_url,created_at,updated_at,profiles:author_id(id,display_name,username,avatar_url)').eq('id',id).maybeSingle();
    if(error || !p){ $('results').innerHTML='<div class="empty">That DoX\'d post could not be found.</div>'; return; }
    const [commentsRes,reactionsRes] = await Promise.all([
      sb.from('doxd_comments').select('id,user_id,body,created_at,profiles:user_id(display_name,username)').eq('post_id',id).order('created_at',{ascending:true}),
      sb.from('doxd_reactions').select('user_id,emoji').eq('post_id',id)
    ]);
    const comments = commentsRes.data || [], reactions = reactionsRes.data || [];
    const counts = Object.fromEntries(['🔥','❤️','😂','🤨','😡'].map(e=>[e,reactions.filter(r=>r.emoji===e).length]));
    const mine = reactions.find(r=>r.user_id===currentUser?.id)?.emoji || '';
    $('resultsTitle').textContent = "DoX'd Post Details";
    $('results').innerHTML = `<article class="detail">
      <button class="back" id="backToDoxd">← Back to DoX'd</button>
      <div class="meta" style="margin-top:20px"><span class="pill">${esc(p.category)}</span><span>${esc(p.subject_type)}</span><span>·</span><span>${esc(fmt(p.created_at))}</span></div>
      <h1>${esc(p.title)}</h1>
      <div class="meta">Subject: ${esc(p.subject_name)} · Posted by ${esc(p.profiles?.display_name || 'Member')}</div>
      <div class="body-block"><h3>CLAIM / ALLEGATION</h3><p>${esc(p.claim)}</p></div>
      ${p.context?`<div class="body-block"><h3>EXPLANATION / CONTEXT</h3><p>${esc(p.context)}</p></div>`:''}
      ${p.evidence?`<div class="body-block"><h3>EVIDENCE</h3><p>${esc(p.evidence)}</p></div>`:''}
      ${p.source_url?`<div class="body-block"><h3>SOURCE</h3><a class="source" href="${esc(p.source_url)}" target="_blank" rel="noopener noreferrer">${esc(p.source_url)}</a></div>`:''}
      <div class="doxd-reactions" style="display:flex;gap:8px;flex-wrap:wrap;margin-top:24px">${['🔥','❤️','😂','🤨','😡'].map(e=>`<button class="filter reaction-btn ${mine===e?'active':''}" data-emoji="${e}">${e} ${counts[e]}</button>`).join('')}</div>
      <div class="comments"><h3>Comments (${comments.length})</h3>
        <form id="commentForm" style="display:flex;gap:8px;margin:12px 0"><input id="commentInput" required maxlength="2000" placeholder="Add a comment…"><button class="primary-btn" type="submit">Post</button></form>
        <div>${comments.length?comments.map(c=>`<div class="comment"><strong>${esc(c.profiles?.display_name||'Member')}</strong> <span class="meta">${esc(fmt(c.created_at))}</span><div>${esc(c.body)}</div></div>`).join(''):'<div class="empty">No comments yet. Start the discussion.</div>'}</div>
      </div>
    </article>`;
    $('backToDoxd').onclick=()=>{ history.pushState({},'', 'doxd.html'); renderResults(); };
    document.querySelectorAll('.reaction-btn').forEach(btn=>btn.onclick=()=>toggleReaction(id,btn.dataset.emoji));
    $('commentForm').onsubmit=async e=>{e.preventDefault();await addComment(id);};
  }

  async function toggleReaction(postId,emoji){
    if(!currentUser){alert('Please sign in to react.');return;}
    const {data:mine} = await sb.from('doxd_reactions').select('emoji').eq('post_id',postId).eq('user_id',currentUser.id).maybeSingle();
    if(mine?.emoji===emoji) await sb.from('doxd_reactions').delete().eq('post_id',postId).eq('user_id',currentUser.id);
    else await sb.from('doxd_reactions').upsert({post_id:postId,user_id:currentUser.id,emoji},{onConflict:'post_id,user_id'});
    await openDetail(postId);
  }

  async function addComment(postId){
    if(!currentUser){alert('Please sign in to comment.');return;}
    const body=$('commentInput').value.trim(); if(!body)return;
    const {error}=await sb.from('doxd_comments').insert({post_id:postId,user_id:currentUser.id,body});
    if(error){alert(error.message);return;}
    await openDetail(postId);
  }

  async function createPost(e){
    e.preventDefault();
    if(!currentUser){alert('Please sign in to create a DoX\'d post.');return;}
    const source=$('sourceUrl').value.trim();
    if(source && !/^https?:\/\//i.test(source)){alert('Source URL must begin with http:// or https://');return;}
    const payload={author_id:currentUser.id,subject_type:$('subjectType').value,subject_name:$('subjectName').value.trim(),title:$('postTitle').value.trim(),category:$('category').value,claim:$('claim').value.trim(),context:$('context').value.trim()||null,evidence:$('evidence').value.trim()||null,source_url:source||null};
    const {data,error}=await sb.from('doxd_posts').insert(payload).select('id').single();
    if(error){alert(error.message);return;}
    $('doxdForm').reset(); setModal(false); await loadPosts(); history.pushState({},'',`doxd.html?post=${data.id}`); openDetail(data.id);
  }

  async function init(){
    const {data}=await sb.auth.getUser(); currentUser=data?.user||null;
    $('createDoxd').onclick=()=>setModal(true); $('closeComposer').onclick=()=>setModal(false); $('composerModal').addEventListener('click',e=>{if(e.target.id==='composerModal')setModal(false)});
    $('doxdForm').onsubmit=createPost;
    $('doxdSearch').oninput=()=>{$('clearSearch').hidden=!$('doxdSearch').value;renderResults();};
    $('clearSearch').onclick=()=>{$('doxdSearch').value='';$('clearSearch').hidden=true;renderResults();};
    $('sortSelect').onchange=renderResults;
    document.querySelectorAll('.filter').forEach(btn=>btn.onclick=()=>{activeFilter=btn.dataset.filter;document.querySelectorAll('.filter').forEach(x=>x.classList.toggle('active',x===btn));renderResults();});
    await loadPosts();
  }
  window.addEventListener('popstate',()=>{const id=new URLSearchParams(location.search).get('post');id?openDetail(id):renderResults();});
  init();
})();
