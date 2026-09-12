(() => {
  'use strict';
  const { createClient } = window.supabase || {};
  const cfg = window.APP_CONFIG || {};
  if (!createClient || !cfg.SUPABASE_URL || !cfg.SUPABASE_ANON_KEY) return;
  const db = createClient(cfg.SUPABASE_URL, cfg.SUPABASE_ANON_KEY,{auth:{persistSession:true,autoRefreshToken:true,detectSessionInUrl:true}});
  const EMOJIS=['🔥','❤️','😂','🤨','😡'];
  const esc=s=>String(s??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[m]));
  let me=null,timer=null;
  async function user(){if(me)return me;const {data}=await db.auth.getUser();me=data?.user||null;return me;}
  function styles(){if(document.getElementById('emojiReactionV2Styles'))return;const s=document.createElement('style');s.id='emojiReactionV2Styles';s.textContent=`
    #feed .like-btn,.comment-like-btn{display:none!important}
    #feed .post-reaction-picker,#feed .comment-reaction-picker{display:none!important}
    .om-emoji-reactions{display:flex;align-items:center;gap:6px;flex-wrap:wrap;margin:8px 0 3px}
    .om-emoji-count{display:inline-flex;align-items:center;gap:4px;border:1px solid #dce5ef;background:#f7faff;color:#16233b;border-radius:999px;padding:5px 9px;font-size:13px;line-height:1;cursor:pointer}
    .om-emoji-count.mine{border-color:#2474ff;background:#eaf2ff;box-shadow:0 0 0 2px rgba(36,116,255,.08)}
    .om-emoji-count .emoji{font-size:17px}.om-emoji-count b{font-size:12px}
    .om-emoji-picker{display:flex;align-items:center;gap:3px;padding:5px 7px;border:1px solid #e0e7f0;background:#fff;border-radius:12px;width:max-content;max-width:100%}
    .om-emoji-picker span{font-size:9px;color:#718096;font-weight:800;text-transform:uppercase;margin-right:2px}
    .om-emoji-picker button{width:31px;height:31px;border:0;background:transparent;border-radius:8px;font-size:19px;cursor:pointer;padding:0}
    .om-emoji-picker button:hover,.om-emoji-picker button.selected{background:#eaf2ff}
    .comment .om-emoji-reactions{margin-left:0}
    @media(max-width:600px){.om-emoji-picker{width:100%;justify-content:center}.om-emoji-picker button{width:34px;height:34px;font-size:20px}}
  `;document.head.appendChild(s);}
  function addUI(host,type,id){
    let wrap=host.querySelector(':scope > .om-emoji-reactions');
    if(wrap)return wrap;
    wrap=document.createElement('div');wrap.className='om-emoji-reactions';wrap.dataset.emojiReactionType=type;wrap.dataset.emojiReactionId=id;
    wrap.innerHTML=`<div class="om-emoji-counts"></div><div class="om-emoji-picker"><span>React</span>${EMOJIS.map(e=>`<button type="button" data-om-emoji="${esc(e)}">${e}</button>`).join('')}</div>`;
    if(type==='post'){const actions=host.querySelector('.post-actions');actions?actions.insertAdjacentElement('afterend',wrap):host.appendChild(wrap);}
    else (host.querySelector('.comment-body')||host).appendChild(wrap);
    wrap.querySelectorAll('[data-om-emoji]').forEach(b=>b.onclick=()=>toggle(type,id,b.dataset.omEmoji));
    return wrap;
  }
  async function tagComments(){
    const groups=[...document.querySelectorAll('#feed .comments[data-comments]')];
    await Promise.all(groups.map(async g=>{if(g.querySelector('.comment[data-emoji-id]'))return;const pid=g.dataset.comments;if(!pid)return;const nodes=[...g.querySelectorAll(':scope > .comment')];if(!nodes.length)return;const {data}=await db.from('comments').select('id,created_at').eq('post_id',pid).order('created_at',{ascending:true});(data||[]).slice(0,nodes.length).forEach((c,i)=>nodes[i].dataset.emojiId=c.id);}));
  }
  async function refresh(){
    const u=await user();if(!u)return;await tagComments();
    const ps=[...document.querySelectorAll('#feed .post[data-post]')],cs=[...document.querySelectorAll('#feed .comment[data-emoji-id]')];
    const pids=ps.map(x=>x.dataset.post),cids=cs.map(x=>x.dataset.emojiId);
    const [pr,cr]=await Promise.all([
      pids.length?db.from('post_reactions').select('post_id,user_id,emoji').in('post_id',pids):Promise.resolve({data:[],error:null}),
      cids.length?db.from('comment_reactions').select('comment_id,user_id,emoji').in('comment_id',cids):Promise.resolve({data:[],error:null})
    ]);
    if(pr.error||cr.error){console.warn('Emoji reactions unavailable:',pr.error?.message||cr.error?.message);return;}
    const render=(host,type,id,rows)=>{const wrap=addUI(host,type,id),counts=wrap.querySelector('.om-emoji-counts'),mine=rows.find(r=>r.user_id===u.id)?.emoji||null,map={};rows.forEach(r=>map[r.emoji]=(map[r.emoji]||0)+1);counts.innerHTML=Object.entries(map).filter(([,n])=>n>0).sort((a,b)=>EMOJIS.indexOf(a[0])-EMOJIS.indexOf(b[0])).map(([e,n])=>`<button type="button" class="om-emoji-count ${mine===e?'mine':''}" data-om-count="${esc(e)}">${e} <b>${n}</b></button>`).join('');counts.querySelectorAll('[data-om-count]').forEach(b=>b.onclick=()=>toggle(type,id,b.dataset.omCount));wrap.querySelectorAll('[data-om-emoji]').forEach(b=>b.classList.toggle('selected',b.dataset.omEmoji===mine));};
    ps.forEach(p=>render(p,'post',p.dataset.post,(pr.data||[]).filter(r=>r.post_id===p.dataset.post)));
    cs.forEach(c=>render(c,'comment',c.dataset.emojiId,(cr.data||[]).filter(r=>r.comment_id===c.dataset.emojiId)));
  }
  async function toggle(type,id,emoji){
    const u=await user();if(!u||!EMOJIS.includes(emoji))return;
    const table=type==='post'?'post_reactions':'comment_reactions',key=type==='post'?'post_id':'comment_id';
    const q=await db.from(table).select('*').eq(key,id).eq('user_id',u.id).maybeSingle();if(q.error)return;
    let r;if(q.data?.emoji===emoji)r=await db.from(table).delete().eq(key,id).eq('user_id',u.id);else if(q.data)r=await db.from(table).update({emoji}).eq(key,id).eq('user_id',u.id);else r=await db.from(table).insert({[key]:id,user_id:u.id,emoji});
    if(r.error){if(typeof window.toast==='function')window.toast(r.error.message);return;}refresh();
  }
  function schedule(){clearTimeout(timer);timer=setTimeout(refresh,150);}
  function init(){styles();const feed=document.getElementById('feed');if(!feed)return;new MutationObserver(schedule).observe(feed,{childList:true,subtree:true});schedule();}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
})();
