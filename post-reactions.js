(() => {
  'use strict';
  const { createClient } = window.supabase || {};
  const cfg = window.APP_CONFIG || {};
  if (!createClient || !cfg.SUPABASE_URL || !cfg.SUPABASE_ANON_KEY) return;
  const db = createClient(cfg.SUPABASE_URL, cfg.SUPABASE_ANON_KEY,{auth:{persistSession:true,autoRefreshToken:true,detectSessionInUrl:true}});
  const EMOJIS=['😂','😭','😅','😁','🥰','😳','😏','🥺'];
  const esc=s=>String(s??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[m]));
  const toast=msg=>typeof window.toast==='function'?window.toast(msg):null;
  let currentUser=null,refreshTimer=null;
  async function getCurrentUser(){if(currentUser)return currentUser;const {data}=await db.auth.getUser();currentUser=data?.user||null;return currentUser;}
  function addStyles(){if(document.getElementById('postReactionsStyles'))return;const s=document.createElement('style');s.id='postReactionsStyles';s.textContent=`
    .post-reaction-area{display:flex;flex-direction:column;gap:6px;margin:8px 0 2px;padding:0 2px}
    .post-reaction-counts{display:flex;align-items:center;gap:6px;flex-wrap:wrap}
    .post-reaction-count{display:inline-flex;align-items:center;gap:4px;border:1px solid #dce8e0;background:#f7fbf8;color:#26382f;border-radius:999px;padding:4px 8px;font-size:13px;line-height:1;cursor:pointer}
    .post-reaction-count.mine{border-color:#8eb6a3;background:#eaf5ee}
    .post-reaction-count .emoji{font-size:16px}.post-reaction-count .count{font-weight:800}
    .post-reaction-picker{display:flex;align-items:center;gap:5px;flex-wrap:wrap;padding:6px 8px;border:1px solid #e3ebe5;border-radius:12px;background:#fafcfb;width:max-content;max-width:100%}
    .post-reaction-picker button{width:31px;height:31px;border:0;background:transparent;border-radius:8px;font-size:19px;line-height:1;cursor:pointer;padding:0}
    .post-reaction-picker button:hover,.post-reaction-picker button.selected{background:#e2f1e7}
    .post-reaction-label{font-size:10px;color:#78907f;font-weight:800;text-transform:uppercase;letter-spacing:.04em}
    @media(max-width:600px){.post-reaction-picker{width:100%;justify-content:center}.post-reaction-picker button{width:34px;height:34px;font-size:20px}}
  `;document.head.appendChild(s);}
  function posts(){return [...document.querySelectorAll('#feed .post[data-post]')];}
  function ensureArea(post){let area=post.querySelector('.post-reaction-area');if(area)return area;area=document.createElement('div');area.className='post-reaction-area';const actions=post.querySelector('.post-actions');if(actions)actions.insertAdjacentElement('afterend',area);else post.appendChild(area);return area;}
  function render(post,grouped,mine){const area=ensureArea(post);const counts=area.querySelector('.post-reaction-counts')||document.createElement('div');counts.className='post-reaction-counts';const parts=Object.entries(grouped).filter(([,n])=>n>0).sort((a,b)=>EMOJIS.indexOf(a[0])-EMOJIS.indexOf(b[0]));counts.innerHTML=parts.map(([e,n])=>`<button type="button" class="post-reaction-count ${mine===e?'mine':''}" data-post-reaction="${esc(post.dataset.post)}" data-emoji="${esc(e)}"><span class="emoji">${e}</span><span class="count">${n}</span></button>`).join('');if(!counts.parentElement)area.appendChild(counts);counts.querySelectorAll('[data-post-reaction]').forEach(b=>b.onclick=()=>toggleReaction(post.dataset.post,b.dataset.emoji));let picker=area.querySelector('.post-reaction-picker');if(!picker){picker=document.createElement('div');picker.className='post-reaction-picker';picker.innerHTML=`<span class="post-reaction-label">React</span>${EMOJIS.map(e=>`<button type="button" data-emoji="${e}">${e}</button>`).join('')}`;area.appendChild(picker);picker.querySelectorAll('[data-emoji]').forEach(b=>b.onclick=()=>toggleReaction(post.dataset.post,b.dataset.emoji));}picker.querySelectorAll('[data-emoji]').forEach(b=>b.classList.toggle('selected',b.dataset.emoji===mine));}
  async function refresh(){const list=posts();if(!list.length)return;const user=await getCurrentUser();if(!user)return;const ids=list.map(p=>p.dataset.post).filter(Boolean);const {data,error}=await db.from('post_reactions').select('post_id,user_id,emoji').in('post_id',ids);if(error){console.warn('Post reactions unavailable:',error.message);return;}const grouped=new Map(),mine=new Map();(data||[]).forEach(r=>{if(!grouped.has(r.post_id))grouped.set(r.post_id,{});const g=grouped.get(r.post_id);g[r.emoji]=(g[r.emoji]||0)+1;if(r.user_id===user.id)mine.set(r.post_id,r.emoji);});list.forEach(p=>render(p,grouped.get(p.dataset.post)||{},mine.get(p.dataset.post)||null));}
  async function toggleReaction(postId,emoji){const user=await getCurrentUser();if(!user||!postId||!EMOJIS.includes(emoji))return;const {data:existing,error:findError}=await db.from('post_reactions').select('post_id,user_id,emoji').eq('post_id',postId).eq('user_id',user.id).maybeSingle();if(findError){toast(findError.message||'Unable to load reactions.');return;}let error=null;if(existing?.emoji===emoji)({error}=await db.from('post_reactions').delete().eq('post_id',postId).eq('user_id',user.id));else if(existing)({error}=await db.from('post_reactions').update({emoji}).eq('post_id',postId).eq('user_id',user.id));else({error}=await db.from('post_reactions').insert({post_id:postId,user_id:user.id,emoji}));if(error){toast(error.message||'Unable to save reaction.');return;}await refresh();}
  function schedule(){clearTimeout(refreshTimer);refreshTimer=setTimeout(refresh,100);}
  function init(){addStyles();const feed=document.getElementById('feed');if(!feed)return;new MutationObserver(schedule).observe(feed,{childList:true,subtree:true});schedule();window.addEventListener('auth-state-changed',()=>{currentUser=null;schedule();});}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();
})();
