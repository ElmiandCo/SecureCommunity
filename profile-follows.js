/* OneMuslim Profile Follows v2 — real follow/unfollow, live counts, and follower/following lists. */
(function(){
'use strict';
const client=()=>window.OneMuslimSupabaseClient?.getClient?.()||window.supabase?.createClient?.(window.APP_CONFIG?.SUPABASE_URL,window.APP_CONFIG?.SUPABASE_ANON_KEY);
const esc=s=>String(s??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[m]));
const displayName=p=>p?.display_name||`${p?.first_name||''} ${p?.last_name||''}`.trim()||'Member';
async function getUser(){const sb=client();if(!sb)return null;const r=await sb.auth.getUser();return r?.data?.user||null;}
async function counts(sb,id){
  const [followers,following]=await Promise.all([
    sb.from('profile_follows').select('follower_id',{count:'exact',head:true}).eq('following_id',id),
    sb.from('profile_follows').select('following_id',{count:'exact',head:true}).eq('follower_id',id)
  ]);
  return {followers:followers.count||0,following:following.count||0};
}
async function isFollowing(sb,me,id){
  if(!me||me===id)return false;
  const r=await sb.from('profile_follows').select('follower_id').eq('follower_id',me).eq('following_id',id).maybeSingle();
  return !!r.data;
}
function profileRoot(){return document.querySelector('#visitedProfilePanel .visited-profile-card')||document.querySelector('#profilePanel [data-profile-id]');}
async function render(root,id){
  const sb=client();if(!sb||!id||!root)return;
  root.dataset.profileId=id;
  const me=await getUser();
  const [c,following]=await Promise.all([counts(sb,id),isFollowing(sb,me?.id,id)]);
  let box=root.querySelector(':scope > .om-follow-box');
  if(!box){
    box=document.createElement('div');
    box.className='om-follow-box';
    const hero=root.querySelector(':scope > .profile-hero');
    const actions=root.querySelector(':scope > .visited-actions');
    if(actions) actions.insertAdjacentElement('beforebegin',box);
    else if(hero) hero.insertAdjacentElement('afterend',box);
    else root.prepend(box);
  }
  box.innerHTML=`<div class="om-follow-stats"><button type="button" data-follow-list="followers"><b>${c.followers}</b><span>Followers</span></button><button type="button" data-follow-list="following"><b>${c.following}</b><span>Following</span></button></div>${me&&me.id!==id?`<button type="button" class="om-follow-btn ${following?'is-following':''}" data-follow-target="${esc(id)}" aria-pressed="${following?'true':'false'}">${following?'Following':'Follow'}</button>`:''}`;
}
async function refreshTarget(id){
  const root=profileRoot();
  if(root&&root.dataset.profileId===id)await render(root,id);
}
async function decorateCards(){
  const sb=client(),me=await getUser();if(!sb||!me)return;
  const cards=[...document.querySelectorAll('#profilesGrid [data-profile-id]')];if(!cards.length)return;
  const ids=[...new Set(cards.map(c=>c.dataset.profileId).filter(Boolean))];
  const r=await sb.from('profile_follows').select('following_id').eq('follower_id',me.id).in('following_id',ids);
  if(r.error)return;
  const followed=new Set((r.data||[]).map(x=>String(x.following_id)));
  cards.forEach(card=>{
    const btn=card.querySelector('[data-follow-target]');if(!btn)return;
    const yes=followed.has(String(card.dataset.profileId));
    btn.classList.toggle('is-following',yes);
    btn.setAttribute('aria-pressed',yes?'true':'false');
    btn.setAttribute('aria-label',yes?'Unfollow member':'Follow member');
    btn.setAttribute('title',yes?'Unfollow':'Follow');
  });
}
async function toggle(btn){
  const sb=client(),me=await getUser(),id=btn.dataset.followTarget;
  if(!sb||!me||!id||me.id===id)return;
  btn.disabled=true;
  try{
    const existing=await sb.from('profile_follows').select('follower_id').eq('follower_id',me.id).eq('following_id',id).maybeSingle();
    if(existing.error)throw existing.error;
    if(existing.data){
      const r=await sb.from('profile_follows').delete().eq('follower_id',me.id).eq('following_id',id);if(r.error)throw r.error;
    }else{
      const r=await sb.from('profile_follows').insert({follower_id:me.id,following_id:id});if(r.error)throw r.error;
    }
    const nowFollowing=!existing.data;
    document.querySelectorAll(`[data-follow-target="${CSS.escape(id)}"]`).forEach(b=>{
      b.classList.toggle('is-following',nowFollowing);
      b.setAttribute('aria-pressed',nowFollowing?'true':'false');
      b.setAttribute('aria-label',nowFollowing?'Unfollow member':'Follow member');
      b.setAttribute('title',nowFollowing?'Unfollow':'Follow');
      if(b.classList.contains('om-follow-btn'))b.textContent=nowFollowing?'Following':'Follow';
    });
    await refreshTarget(id);
    await decorateCards();
    window.dispatchEvent(new CustomEvent('profile:follow-changed',{detail:{profileId:id,following:nowFollowing}}));
  }catch(e){console.error('[OneMuslim] follow failed',e);window.toast?.(e?.message||'Unable to update follow.');}
  finally{btn.disabled=false;}
}
async function openList(root,id,type){
  const sb=client();if(!sb||!id)return;
  const sourceColumn=type==='followers'?'following_id':'follower_id';
  const idColumn=type==='followers'?'follower_id':'following_id';
  const r=await sb.from('profile_follows').select(`${idColumn},created_at`).eq(sourceColumn,id).order('created_at',{ascending:false});
  if(r.error){window.toast?.(r.error.message||'Unable to load this list.');return;}
  const ids=(r.data||[]).map(x=>x[idColumn]).filter(Boolean);
  let profiles=[];
  if(ids.length){
    const p=await sb.from('profiles').select('id,username,display_name,first_name,last_name,avatar_config,avatar_gender,xp_total').in('id',ids);
    if(p.error){window.toast?.(p.error.message||'Unable to load profiles.');return;}
    const byId=new Map((p.data||[]).map(x=>[String(x.id),x]));
    profiles=ids.map(x=>byId.get(String(x))).filter(Boolean);
  }
  const modal=document.createElement('div');
  modal.className='om-follow-modal';
  modal.innerHTML=`<div class="om-follow-modal-card" role="dialog" aria-modal="true" aria-label="${type==='followers'?'Followers':'Following'}"><button class="om-follow-close" type="button" aria-label="Close">×</button><h3>${type==='followers'?'Followers':'Following'}</h3><div class="om-follow-list">${profiles.length?profiles.map(p=>`<button type="button" class="om-follow-person" data-profile-id="${esc(p.id)}"><span class="om-follow-avatar">${esc(displayName(p).charAt(0).toUpperCase())}</span><span><b>${esc(displayName(p))}</b><small>@${esc(p.username||'member')}</small></span></button>`).join(''):'<div class="om-follow-empty">No one here yet.</div>'}</div></div>`;
  document.body.appendChild(modal);
  modal.querySelector('.om-follow-close').onclick=()=>modal.remove();
  modal.addEventListener('click',e=>{if(e.target===modal)modal.remove()});
  modal.querySelectorAll('.om-follow-person').forEach(b=>b.onclick=()=>{modal.remove();window.openUserProfile?.(b.dataset.profileId);});
}
function styles(){
  if(document.getElementById('om-follow-css-v2'))return;
  const s=document.createElement('style');s.id='om-follow-css-v2';s.textContent=`
    .om-follow-box{display:flex;align-items:center;gap:20px;margin:14px 0 18px;padding:14px 0;border-top:1px solid #e4ece7;border-bottom:1px solid #e4ece7}
    .om-follow-stats{display:flex;gap:22px;flex:1}.om-follow-stats button{border:0;background:none;display:grid;gap:2px;cursor:pointer;color:#20352c;text-align:left;padding:0}.om-follow-stats b{font-size:20px;line-height:1}.om-follow-stats span{font-size:12px;opacity:.7}
    .om-follow-btn{border:1px solid #1f6a55;border-radius:10px;padding:9px 18px;background:#1f6a55;color:#fff;font-weight:800;cursor:pointer;white-space:nowrap}.om-follow-btn.is-following{background:#eef4ef;color:#1f6a55;border-color:#cbded4}
    .member-card-actions .om-card-follow.is-following{background:#eef4ef!important;color:#1f6a55!important;border-color:#cbded4!important}
    .om-follow-modal{position:fixed;inset:0;background:rgba(7,28,22,.42);display:grid;place-items:center;z-index:99999;padding:20px}.om-follow-modal-card{width:min(420px,100%);max-height:75vh;overflow:auto;background:#fffdf8;border-radius:20px;padding:22px;position:relative;box-shadow:0 20px 60px rgba(0,0,0,.18)}.om-follow-close{position:absolute;right:14px;top:10px;border:0;background:none;font-size:28px;cursor:pointer}.om-follow-list{display:grid;gap:8px;margin-top:15px}.om-follow-person{display:flex;align-items:center;gap:11px;padding:10px;border:0;border-radius:12px;background:#f3f7f4;text-align:left;cursor:pointer}.om-follow-avatar{width:38px;height:38px;border-radius:50%;display:grid;place-items:center;background:#1f6a55;color:#fff;font-weight:700}.om-follow-person span:nth-child(2){display:grid;gap:2px}.om-follow-person small{opacity:.65}.om-follow-empty{padding:20px;text-align:center;opacity:.65}
    @media(max-width:640px){.om-follow-box{gap:12px}.om-follow-stats{gap:14px}.om-follow-btn{padding:8px 13px}}
  `;document.head.appendChild(s);
}
function init(){
  styles();
  document.addEventListener('click',e=>{
    const f=e.target.closest?.('[data-follow-target]');if(f){e.preventDefault();toggle(f);return;}
    const l=e.target.closest?.('[data-follow-list]');if(l){const root=l.closest('[data-profile-id]')||profileRoot();const id=root?.dataset?.profileId;if(id)openList(root,id,l.dataset.followList);}
  });
  decorateCards();
  const observe=()=>{const panel=document.getElementById('visitedProfilePanel');if(!panel||panel.dataset.omFollowObserver)return;panel.dataset.omFollowObserver='1';new MutationObserver(()=>{const card=panel.querySelector('.visited-profile-card');if(!card)return;const id=new URLSearchParams(location.search).get('profile');if(id&&!card.querySelector('.om-follow-box'))render(card,id)}).observe(panel,{childList:true,subtree:true});};
  observe();
  window.addEventListener('profile:follow-changed',e=>refreshTarget(e.detail?.profileId));
}
function mountProfile(id){const panel=document.getElementById('profilePanel');if(!panel)return;panel.dataset.profileId=id;render(panel,id)}
async function showProfile(id){const sb=client();if(!sb||!id)return;const r=await sb.from('profiles').select('*').eq('id',id).maybeSingle();if(!r.data)return;window.profile=r.data;mountProfile(id);window.OneMuslimProfileFollows.lastProfile=r.data}
window.OneMuslimProfileFollows={render,mountProfile,showProfile,counts,decorateCards};
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();
})();