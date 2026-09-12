(() => {
'use strict';
const cfg=window.APP_CONFIG||{};const sb=window.OneMuslimSupabaseClient?.getClient?.()||window.supabase?.createClient?.(cfg.SUPABASE_URL,cfg.SUPABASE_ANON_KEY);if(!sb)return;
const esc=s=>String(s??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[m]));
async function load(){
 const root=document.getElementById('requests');const {data:{user}}=await sb.auth.getUser();if(!user){root.innerHTML='<div class="empty">Please sign in to view Messages.</div>';return;}
 const {data:owned,error:ce}=await sb.from('communities').select('id,name,slug').eq('creator_id',user.id).order('name');if(ce){root.innerHTML='<div class="empty">Unable to load your communities.</div>';return;}
 if(!owned?.length){root.innerHTML='<div class="empty">You have no communities yet.</div>';return;}
 const {data:reqs,error}=await sb.from('community_join_requests').select('id,community_id,user_id,status,created_at').eq('status','pending').in('community_id',owned.map(c=>c.id)).order('created_at',{ascending:false});if(error){root.innerHTML='<div class="empty">Unable to load membership requests.</div>';return;}
 const users=[...new Set((reqs||[]).map(r=>r.user_id))];let profiles=[];if(users.length){const r=await sb.from('profiles').select('id,display_name,username,avatar_url').in('id',users);profiles=r.data||[];}
 const pm=new Map(profiles.map(p=>[p.id,p]));const cm=new Map(owned.map(c=>[c.id,c]));
 root.innerHTML=reqs?.length?reqs.map(r=>{const p=pm.get(r.user_id)||{},c=cm.get(r.community_id)||{};return `<article class="message-card"><div class="eyebrow">COMMUNITY JOIN REQUEST</div><h3>${esc(p.display_name||p.username||'Member')} ${p.username?`<span class="muted">@${esc(p.username)}</span>`:''}</h3><p class="muted">Requested to join <strong>${esc(c.name)}</strong>.</p><div class="message-actions"><button class="approve" data-decision="approve" data-community="${esc(r.community_id)}" data-user="${esc(r.user_id)}">Approve</button><button data-decision="reject" data-community="${esc(r.community_id)}" data-user="${esc(r.user_id)}">Reject</button></div></article>`}).join(''):'<div class="empty">No pending community requests. 🎉</div>';
}
document.getElementById('requests').addEventListener('click',async e=>{const b=e.target.closest('[data-decision]');if(!b)return;b.disabled=true;const {error}=await sb.rpc('respond_to_community_join_request',{p_community_id:b.dataset.community,p_user_id:b.dataset.user,p_approved:b.dataset.decision==='approve'});if(error){alert(error.message);b.disabled=false;return;}await load();});
load();
})();