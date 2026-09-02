(() => {
  'use strict';
  const { createClient } = window.supabase || {};
  const cfg = window.APP_CONFIG || {};
  if (!createClient || !cfg.SUPABASE_URL || !cfg.SUPABASE_ANON_KEY) return;
  const db=createClient(cfg.SUPABASE_URL,cfg.SUPABASE_ANON_KEY,{auth:{persistSession:true,autoRefreshToken:true,detectSessionInUrl:true}});
  const EMOJIS=['😂','😭','😅','😁','🥰','😳','😏','🥺'];
  const esc=s=>String(s??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[m]));
  const toast=msg=>typeof window.toast==='function'?window.toast(msg):null;
  let currentUser=null,refreshTimer=null;
  async function user(){if(currentUser)return currentUser;const {data}=await db.auth.getUser();currentUser=data?.user||null;return currentUser;}
  function styles(){if(document.getElementById('commentReactionsStyles'))return;const s=document.createElement('style');s.id='commentReactionsStyles';s.textContent=`
    .comment-text{color:#000!important}
    .comment-reaction-tools{display:flex;flex-direction:column;gap:5px;margin:7px 0 2px}
    .comment-reaction-row{display:flex;align-items:center;gap:6px;flex-wrap:wrap}
    .comment-like-btn,.comment-reaction-count{display:inline-flex;align-items:center;gap:4px;border:1px solid #e5e7eb;background:#fff;color:#111827;border-radius:999px;padding:4px 8px;font-size:12px;cursor:pointer}
    .comment-like-btn.liked,.comment-reaction-count.mine{border-color:#f3b4c2;background:#fff5f7;color:#b4234d}
    .comment-reaction-counts{display:flex;align-items:center;gap:5px;flex-wrap:wrap}
    .comment-reaction-picker{display:flex;align-items:center;gap:4px;flex-wrap:wrap;padding:5px 7px;border:1px solid #e3ebe5;border-radius:12px;background:#fafcfb;width:max-content;max-width:100%}
    .comment-reaction-picker .comment-reaction-label{font-size:9px;color:#78907f;font-weight:800;text-transform:uppercase;letter-spacing:.04em;margin-right:2px}
    .comment-reaction-picker .comment-reaction-btn{width:29px;height:29px;border:0;background:transparent;border-radius:8px;font-size:18px;line-height:1;cursor:pointer;padding:0}
    .comment-reaction-picker .comment-reaction-btn:hover,.comment-reaction-picker .comment-reaction-btn.selected{background:#e2f1e7}
    @media(max-width:600px){.comment-reaction-picker{width:100%;justify-content:center}.comment-reaction-picker .comment-reaction-btn{width:32px;height:32px;font-size:19px}}
  `;document.head.appendChild(s);}
  async function tagComments(){
    const groups=[...document.querySelectorAll('#feed .comments[data-comments]')];
    await Promise.all(groups.map(async group=>{
      if(group.querySelector('.comment[data-comment]'))return;
      const postId=group.dataset.comments;if(!postId)return;
      const nodes=[...group.querySelectorAll(':scope > .comment')];if(!nodes.length)return;
      const {data,error}=await db.from('comments').select('id,created_at').eq('post_id',postId).order('created_at',{ascending:true});
      if(error)return;
      data?.slice(0,nodes.length).forEach((c,i)=>nodes[i].dataset.comment=c.id);
    }));
  }
  function comments(){return [...document.querySelectorAll('#feed .comment[data-comment]')];}
  function ensureTools(c){let tools=c.querySelector('.comment-reaction-tools');if(tools)return tools;tools=document.createElement('div');tools.className='comment-reaction-tools';const row=document.createElement('div');row.className='comment-reaction-row';row.innerHTML=`<button type="button" class="comment-like-btn">❤️ <span data-like-count>0</span> Like</button>`;const picker=document.createElement('div');picker.className='comment-reaction-picker';picker.innerHTML=`<span class="comment-reaction-label">React</span>${EMOJIS.map(e=>`<button type="button" class="comment-reaction-btn" data-emoji="${esc(e)}">${e}</button>`).join('')}`;const counts=document.createElement('div');counts.className='comment-reaction-counts';tools.append(row,picker,counts);(c.querySelector('.comment-body')||c).appendChild(tools);row.querySelector('.comment-like-btn').onclick=()=>toggleLike(c.dataset.comment);picker.querySelectorAll('[data-emoji]').forEach(b=>b.onclick=()=>toggleReaction(c.dataset.comment,b.dataset.emoji));return tools;}
  async function refresh(){await tagComments();const list=comments();if(!list.length)return;const u=await user();if(!u)return;const ids=list.map(c=>c.dataset.comment);const [likes,reactions]=await Promise.all([
      db.from('comment_likes').select('comment_id,user_id').in('comment_id',ids),
      db.from('comment_reactions').select('comment_id,user_id,emoji').in('comment_id',ids)
    ]);if(likes.error){console.warn('Comment likes unavailable:',likes.error.message);return;}if(reactions.error){console.warn('Comment reactions unavailable:',reactions.error.message);return;}
    const likeMap=new Map(),mineLike=new Set(),reactionMap=new Map(),mineReaction=new Map();
    (likes.data||[]).forEach(x=>{likeMap.set(x.comment_id,(likeMap.get(x.comment_id)||0)+1);if(x.user_id===u.id)mineLike.add(x.comment_id);});
    (reactions.data||[]).forEach(x=>{if(!reactionMap.has(x.comment_id))reactionMap.set(x.comment_id,{});const g=reactionMap.get(x.comment_id);g[x.emoji]=(g[x.emoji]||0)+1;if(x.user_id===u.id)mineReaction.set(x.comment_id,x.emoji);});
    list.forEach(c=>{const t=ensureTools(c),like=t.querySelector('.comment-like-btn');like.classList.toggle('liked',mineLike.has(c.dataset.comment));like.querySelector('[data-like-count]').textContent=likeMap.get(c.dataset.comment)||0;const counts=t.querySelector('.comment-reaction-counts');const g=reactionMap.get(c.dataset.comment)||{};counts.innerHTML=Object.entries(g).filter(([,n])=>n>0).sort((a,b)=>EMOJIS.indexOf(a[0])-EMOJIS.indexOf(b[0])).map(([e,n])=>`<button type="button" class="comment-reaction-count ${mineReaction.get(c.dataset.comment)===e?'mine':''}" data-emoji="${esc(e)}">${e} <b>${n}</b></button>`).join('');counts.querySelectorAll('[data-emoji]').forEach(b=>b.onclick=()=>toggleReaction(c.dataset.comment,b.dataset.emoji));t.querySelectorAll('.comment-reaction-btn').forEach(b=>b.classList.toggle('selected',b.dataset.emoji===mineReaction.get(c.dataset.comment)));});
  }
  async function toggleLike(commentId){const u=await user();if(!u||!commentId)return;const q=await db.from('comment_likes').select('comment_id').eq('comment_id',commentId).eq('user_id',u.id).maybeSingle();if(q.error){toast(q.error.message);return;}const r=q.data?await db.from('comment_likes').delete().eq('comment_id',commentId).eq('user_id',u.id):await db.from('comment_likes').insert({comment_id:commentId,user_id:u.id});if(r.error){toast(r.error.message);return;}refresh();}
  async function toggleReaction(commentId,emoji){const u=await user();if(!u||!commentId||!EMOJIS.includes(emoji))return;const q=await db.from('comment_reactions').select('comment_id,user_id,emoji').eq('comment_id',commentId).eq('user_id',u.id).maybeSingle();if(q.error){toast(q.error.message);return;}let r;if(q.data?.emoji===emoji)r=await db.from('comment_reactions').delete().eq('comment_id',commentId).eq('user_id',u.id);else if(q.data)r=await db.from('comment_reactions').update({emoji}).eq('comment_id',commentId).eq('user_id',u.id);else r=await db.from('comment_reactions').insert({comment_id:commentId,user_id:u.id,emoji});if(r.error){toast(r.error.message);return;}refresh();}
  function schedule(){clearTimeout(refreshTimer);refreshTimer=setTimeout(refresh,120);}
  function init(){styles();const feed=document.getElementById('feed');if(!feed)return;new MutationObserver(schedule).observe(feed,{childList:true,subtree:true});schedule();window.addEventListener('auth-state-changed',()=>{currentUser=null;schedule();});}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();
})();
