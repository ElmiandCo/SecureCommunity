/* OneMuslim Community Service v1 — live community discovery + join requests. */
(function(){
  'use strict';
  const cfg=window.APP_CONFIG||{};
  const supabase=window.supabase;
  if(!supabase||!cfg.SUPABASE_URL||!cfg.SUPABASE_ANON_KEY)return;
  const sb=supabase.createClient(cfg.SUPABASE_URL,cfg.SUPABASE_ANON_KEY);
  const esc=s=>String(s??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[m]));
  async function listCommunities(){const {data,error}=await sb.from('communities').select('id,name,slug,description').order('name',{ascending:true}).limit(100);if(error)throw error;return data||[];}
  async function refreshEditor(select){if(!select)return;try{const rows=await listCommunities();const current=select.value;const opts=['<option value="">Select a community</option>',...rows.map(c=>`<option value="${esc(c.id)}" data-community-name="${esc(c.name)}">${esc(c.name)}</option>`),'<option value="__create__">＋ Create a Community</option>'];select.innerHTML=opts.join('');if(rows.some(c=>c.id===current))select.value=current;}catch(e){console.warn('Community discovery unavailable',e);}}
  async function requestJoin(communityId,status){if(!communityId||communityId==='__create__')return;status.textContent='Sending membership request…';const {error}=await sb.rpc('request_community_membership',{p_community_id:communityId});if(error){status.textContent=error.message||'Unable to send request.';return;}status.textContent='Join request sent. The community creator will receive it.';}
  function wire(){const select=document.getElementById('pbGroup');if(!select||select.dataset.liveCommunity==='1')return;select.dataset.liveCommunity='1';refreshEditor(select);const parent=select.closest('.om-pb-card');if(!parent)return;let request=document.createElement('button');request.type='button';request.className='om-pb-btn';request.id='pbRequestJoin';request.textContent='Request to Join';const create=document.getElementById('pbCreateCommunity');if(create)create.insertAdjacentElement('afterend',request);const status=document.getElementById('pbCommunityStatus');request.onclick=()=>requestJoin(select.value,status);select.addEventListener('change',()=>{request.hidden=!select.value||select.value==='__create__';if(select.value==='__create__')request.hidden=true;});request.hidden=true;}
  function init(){wire();new MutationObserver(()=>wire()).observe(document.body,{childList:true,subtree:true});}
  window.OneMuslimCommunityService=Object.freeze({listCommunities,refreshEditor,requestJoin});
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();
})();
