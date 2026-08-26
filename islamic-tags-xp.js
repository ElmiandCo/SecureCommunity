(() => {
  const { createClient } = window.supabase || {};
  const cfg = window.APP_CONFIG || {};
  if (!createClient || !cfg.SUPABASE_URL || !cfg.SUPABASE_ANON_KEY) return;
  const db = createClient(cfg.SUPABASE_URL, cfg.SUPABASE_ANON_KEY, { auth:{persistSession:true,autoRefreshToken:true,detectSessionInUrl:true} });
  const $ = id => document.getElementById(id);
  const esc = s => String(s ?? '').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[m]));
  let tags = [], selected = new Set(), activeTag = '', decorating = false;

  function styles(){
    if($('islamicTagsStyles')) return;
    const s=document.createElement('style'); s.id='islamicTagsStyles';
    s.textContent=`
      .islamic-tag-panel{margin:8px 0 12px}.islamic-tag-label{font-size:11px;font-weight:800;color:#168746;display:block;margin-bottom:7px}.islamic-tags{display:flex;gap:7px;flex-wrap:wrap}.islamic-tag{border:1px solid #bfe5cb;background:#f5fff8;color:#168746;border-radius:999px;padding:7px 10px;font-size:11px;font-weight:800;cursor:pointer;transition:.15s}.islamic-tag:hover,.islamic-tag.selected{background:#20a85a;color:#fff;border-color:#20a85a}.post-tags{display:flex;gap:6px;flex-wrap:wrap;margin:10px 0}.post-tag{border:1px solid #bfe5cb;background:#f5fff8;color:#168746;border-radius:999px;padding:5px 9px;font-size:10px;font-weight:800;cursor:pointer}.post-tag:hover{background:#20a85a;color:#fff}.tag-filter-bar{display:flex;align-items:center;gap:8px;flex-wrap:wrap;margin:0 0 14px}.tag-filter-title{font-size:11px;font-weight:800;color:#587563}.tag-filter-clear{border:0;background:transparent;color:#168746;font-size:11px;font-weight:800;cursor:pointer}.xp-reward-note{font-size:10px;color:#71877a;margin-top:6px}
    `; document.head.appendChild(s);
  }
  async function loadTags(){const r=await db.from('islamic_tags').select('tag,label,emoji,sort_order').order('sort_order');if(!r.error)tags=r.data||[];}
  function renderTagChooser(){
    const composer=document.querySelector('.composer'); if(!composer || $('islamicTagPanel')) return;
    const body=composer.querySelector('.composer-body'); if(!body) return;
    const panel=document.createElement('div'); panel.id='islamicTagPanel'; panel.className='islamic-tag-panel';
    panel.innerHTML=`<span class="islamic-tag-label">🏷️ Add Islamic tags · +50 XP each</span><div class="islamic-tags">${tags.map(t=>`<button type="button" class="islamic-tag" data-select-tag="${esc(t.tag)}">${esc(t.emoji)} ${esc(t.label)}</button>`).join('')}</div><div class="xp-reward-note">Post: +100 XP · Image post: +100 bonus XP · Each unique tag: +50 XP</div>`;
    body.insertBefore(panel,body.querySelector('.composer-footer'));
    panel.querySelectorAll('[data-select-tag]').forEach(b=>b.onclick=()=>{const t=b.dataset.selectTag;if(selected.has(t)){selected.delete(t);b.classList.remove('selected')}else{selected.add(t);b.classList.add('selected')}});
  }
  async function attachTagsToNewestPost(){
    if(!selected.size) return;
    const {data:u}=await db.auth.getUser(); if(!u) return;
    const r=await db.from('posts').select('id').eq('user_id',u.user.id).order('created_at',{ascending:false}).limit(1).maybeSingle();
    if(r.error || !r.data?.id) return;
    const rows=[...selected].map(tag=>({post_id:r.data.id,tag}));
    const ins=await db.from('post_tags').upsert(rows,{onConflict:'post_id,tag'});
    if(ins.error) console.error('Tag save failed',ins.error);
    selected.clear(); document.querySelectorAll('[data-select-tag]').forEach(b=>b.classList.remove('selected'));
    await decoratePosts();
  }
  async function decoratePosts(){
    if(decorating)return; decorating=true;
    try{
      const feed=$('feed'); if(!feed) return;
      const cards=[...feed.querySelectorAll('[data-post]')]; if(!cards.length) return;
      const ids=cards.map(x=>x.dataset.post);
      const r=await db.from('post_tags').select('post_id,tag').in('post_id',ids); if(r.error)return;
      const by={}; (r.data||[]).forEach(x=>(by[x.post_id]??=[]).push(x.tag));
      cards.forEach(card=>{
        card.querySelector('.post-tags')?.remove(); const row=by[card.dataset.post]||[]; if(!row.length)return;
        const div=document.createElement('div'); div.className='post-tags';
        div.innerHTML=row.map(t=>{const meta=tags.find(x=>x.tag===t);return `<button type="button" class="post-tag" data-filter-tag="${esc(t)}">${esc(meta?.emoji||'🏷️')} ${esc(meta?.label||t)}</button>`}).join('');
        card.querySelector('.post-actions')?.before(div); div.querySelectorAll('[data-filter-tag]').forEach(b=>b.onclick=()=>filterTag(b.dataset.filterTag));
      });
    }finally{decorating=false;}
  }
  function ensureFilterBar(){
    const feed=$('feed'); if(!feed || $('tagFilterBar')) return;
    const bar=document.createElement('div'); bar.id='tagFilterBar'; bar.className='tag-filter-bar';
    bar.innerHTML=`<span class="tag-filter-title">Explore Islamic topics:</span><div class="islamic-tags" id="globalTagChoices"></div>`;
    feed.parentNode.insertBefore(bar,feed); renderGlobalTags();
  }
  function renderGlobalTags(){
    const box=$('globalTagChoices'); if(!box)return;
    box.innerHTML=tags.map(t=>`<button type="button" class="islamic-tag ${activeTag===t.tag?'selected':''}" data-global-tag="${esc(t.tag)}">${esc(t.emoji)} ${esc(t.label)}</button>`).join('')+(activeTag?`<button type="button" class="tag-filter-clear" id="clearTagFilter">Clear ×</button>`:'');
    box.querySelectorAll('[data-global-tag]').forEach(b=>b.onclick=()=>filterTag(b.dataset.globalTag)); $('clearTagFilter')?.addEventListener('click',()=>filterTag(''));
  }
  function filterTag(tag){activeTag=tag;renderGlobalTags();document.querySelectorAll('[data-post]').forEach(card=>{if(!tag){card.style.display='';return;}const has=[...card.querySelectorAll('[data-filter-tag]')].some(x=>x.dataset.filterTag===tag);card.style.display=has?'':'none';});}
  function hookPublish(){
    const btn=$('publish'); if(!btn || btn.dataset.tagsHooked)return; btn.dataset.tagsHooked='1'; const original=btn.onclick;
    btn.onclick=async e=>{await original?.(e);await new Promise(r=>setTimeout(r,300));await attachTagsToNewestPost();};
  }
  async function init(){
    styles();await loadTags();renderTagChooser();ensureFilterBar();hookPublish();await decoratePosts();
    const feed=$('feed'); if(feed&&!feed.dataset.tagObserver){feed.dataset.tagObserver='1';new MutationObserver(()=>{hookPublish();ensureFilterBar();decoratePosts();}).observe(feed,{childList:true,subtree:true});}
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();
  setInterval(()=>{renderTagChooser();hookPublish();ensureFilterBar();},1200);
})();
