(() => {
  'use strict';
  const cfg=window.APP_CONFIG||{};
  const sb=window.OneMuslimSupabaseClient?.getClient?.()||window.supabase?.createClient?.(cfg.SUPABASE_URL,cfg.SUPABASE_ANON_KEY);
  if(!sb)return;
  const $=id=>document.getElementById(id);
  const esc=s=>String(s??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[m]));
  let user=null,editPostId=null,editDoxdId=null;

  function styles(){if($('creatorControlsStyles'))return;const s=document.createElement('style');s.id='creatorControlsStyles';s.textContent=`
  .om-edit-btn{border:1px solid #c9b98e;background:#fffaf0;color:#72591d;border-radius:999px;padding:7px 11px;font-weight:800;cursor:pointer}
  .om-creator-edit{display:flex;gap:8px;align-items:center;margin-top:12px;flex-wrap:wrap}
  .om-followed-feed{margin:28px 0;padding:22px;border:1px solid #e6e1d6;border-radius:20px;background:#fffdf8;box-shadow:0 8px 30px rgba(40,60,50,.04)}
  .om-followed-feed h2{margin:0 0 5px;font-family:Georgia,serif;color:#1f5b49}.om-followed-feed .muted{margin:0 0 16px}
  .om-feed-post{padding:15px 0;border-top:1px solid #eee8dc}.om-feed-post:first-of-type{border-top:0}.om-feed-post h3{margin:5px 0}.om-feed-post p{margin:5px 0;white-space:pre-wrap}
  .om-edit-modal{position:fixed;inset:0;background:rgba(20,25,22,.55);display:grid;place-items:center;z-index:9000;padding:18px}.om-edit-modal.hidden{display:none}.om-edit-card{width:min(680px,100%);max-height:90vh;overflow:auto;background:#fffdf8;border-radius:22px;padding:24px;box-shadow:0 25px 80px rgba(0,0,0,.28)}.om-edit-card h2{margin-top:0;font-family:Georgia,serif}.om-edit-card label{display:block;font-weight:800;margin:12px 0}.om-edit-card input,.om-edit-card textarea,.om-edit-card select{display:block;width:100%;box-sizing:border-box;margin-top:6px;border:1px solid #ddd5c7;border-radius:12px;padding:11px;background:#fff;font:inherit}.om-edit-card textarea{min-height:120px;resize:vertical}.om-edit-actions{display:flex;justify-content:flex-end;gap:8px;margin-top:18px}
  `;document.head.appendChild(s);}

  function modal(kind,data){
    const id=kind==='community'?'communityEditModal':kind==='community-post'?'communityPostEditModal':'doxdEditModal';
    $(id)?.remove();
    const m=document.createElement('div');m.id=id;m.className='om-edit-modal';
    if(kind==='community')m.innerHTML=`<div class="om-edit-card"><h2>Edit Community</h2><form id="omCommunityEditForm"><label>Name<input id="omCommunityName" maxlength="100" required value="${esc(data.name)}"></label><label>Category<select id="omCommunityCategory"><option ${data.category==='Mosque'?'selected':''}>Mosque</option><option ${data.category==='Dawah'?'selected':''}>Dawah</option><option ${data.category==='Community'?'selected':''}>Community</option><option ${data.category==='Non-Profit'?'selected':''}>Non-Profit</option><option ${data.category==='Event'?'selected':''}>Event</option><option ${data.category==='Other'?'selected':''}>Other</option></select></label><label>Short URL / slug<input id="omCommunitySlug" maxlength="80" pattern="[a-z0-9-]+" required value="${esc(data.slug)}"></label><label>Description<textarea id="omCommunityDescription" maxlength="1000">${esc(data.description||'')}</textarea></label><label>Replace community image<input id="omCommunityImage" type="file" accept="image/*"></label><label>Replace cover image<input id="omCommunityCover" type="file" accept="image/*"></label><div class="om-edit-actions"><button type="button" class="secondary" data-close-edit>Cancel</button><button class="primary" type="submit">Save Changes</button></div></form></div>`;
    else if(kind==='community-post')m.innerHTML=`<div class="om-edit-card"><h2>Edit Community Post</h2><form id="omCommunityPostEditForm"><label>Title<input id="omPostTitleEdit" maxlength="140" value="${esc(data.title||'')}"></label><label>Post<textarea id="omPostBodyEdit" maxlength="5000">${esc(data.body||'')}</textarea></label><div class="om-edit-actions"><button type="button" class="secondary" data-close-edit>Cancel</button><button class="primary" type="submit">Save Changes</button></div></form></div>`;
    else m.innerHTML=`<div class="om-edit-card"><h2>Edit DoX'd Post</h2><form id="omDoxdEditForm"><label>Subject Type<input id="omDoxdSubjectType" maxlength="80" value="${esc(data.subject_type||'')}"></label><label>Subject Name<input id="omDoxdSubjectName" maxlength="200" required value="${esc(data.subject_name||'')}"></label><label>Title<input id="omDoxdTitle" maxlength="200" required value="${esc(data.title||'')}"></label><label>Category<input id="omDoxdCategory" maxlength="100" required value="${esc(data.category||'')}"></label><label>Claim / Allegation<textarea id="omDoxdClaim" required>${esc(data.claim||'')}</textarea></label><label>Explanation / Context<textarea id="omDoxdContext">${esc(data.context||'')}</textarea></label><label>Evidence<textarea id="omDoxdEvidence">${esc(data.evidence||'')}</textarea></label><label>Source URL<input id="omDoxdSource" type="url" value="${esc(data.source_url||'')}"></label><div class="om-edit-actions"><button type="button" class="secondary" data-close-edit>Cancel</button><button class="primary" type="submit">Save Changes</button></div></form></div>`;
    document.body.appendChild(m);m.querySelector('[data-close-edit]').onclick=()=>m.remove();
    if(kind==='community')$('omCommunityEditForm').onsubmit=e=>saveCommunity(e,data);
    if(kind==='community-post')$('omCommunityPostEditForm').onsubmit=e=>saveCommunityPost(e,data);
    if(kind==='doxd')$('omDoxdEditForm').onsubmit=e=>saveDoxd(e,data);
  }

  async function upload(file,path,bucket){const {error}=await sb.storage.from(bucket).upload(path,file,{upsert:false,contentType:file.type});if(error)throw error;return path;}
  async function saveCommunity(e,data){e.preventDefault();if(!user||user.id!==data.creator_id)return alert('Only the community creator can edit this community.');const slug=$('omCommunitySlug').value.trim().toLowerCase();if(!/^[a-z0-9-]+$/.test(slug))return alert('Use lowercase letters, numbers, and hyphens for the slug.');const patch={name:$('omCommunityName').value.trim(),category:$('omCommunityCategory').value,slug,description:$('omCommunityDescription').value.trim()};try{const image=$('omCommunityImage').files[0],cover=$('omCommunityCover').files[0];if(image)patch.image_url=await upload(image,`${user.id}/communities/${data.id}/image-${crypto.randomUUID()}-${image.name}`,'community-media');if(cover)patch.cover_image_url=await upload(cover,`${user.id}/communities/${data.id}/cover-${crypto.randomUUID()}-${cover.name}`,'community-media');const {error}=await sb.from('communities').update(patch).eq('id',data.id).eq('creator_id',user.id);if(error)throw error;alert('Community updated.');location.href=`community.html?community=${encodeURIComponent(slug)}`;}catch(err){console.error(err);alert(err.message||'Unable to update community.');}}
  async function saveCommunityPost(e,data){e.preventDefault();if(!user||user.id!==data.author_id)return alert('Only the post creator can edit this post.');const title=$('omPostTitleEdit').value.trim(),body=$('omPostBodyEdit').value.trim();if(!body)return alert('Post body cannot be empty.');const {error}=await sb.from('community_posts').update({title,body}).eq('id',data.id).eq('author_id',user.id);if(error)return alert(error.message);alert('Community post updated.');location.reload();}
  async function saveDoxd(e,data){e.preventDefault();if(!user||user.id!==data.author_id)return alert("Only the DoX'd post creator can edit this post.");const source=$('omDoxdSource').value.trim();if(source&&!/^https?:\/\//i.test(source))return alert('Source URL must begin with http:// or https://');const patch={subject_type:$('omDoxdSubjectType').value.trim(),subject_name:$('omDoxdSubjectName').value.trim(),title:$('omDoxdTitle').value.trim(),category:$('omDoxdCategory').value.trim(),claim:$('omDoxdClaim').value.trim(),context:$('omDoxdContext').value.trim()||null,evidence:$('omDoxdEvidence').value.trim()||null,source_url:source||null};const {error}=await sb.from('doxd_posts').update(patch).eq('id',data.id).eq('author_id',user.id);if(error)return alert(error.message);alert("DoX'd post updated.");location.reload();}

  async function currentUser(){const {data}=await sb.auth.getUser();return data?.user||null;}
  async function addCommunityCreatorControls(){
    const c=window.location.search.match(/[?&]community=([^&]+)/)?.[1];if(!c||!user)return;
    const id=decodeURIComponent(c);let q=sb.from('communities').select('id,name,slug,description,creator_id,category,image_url,cover_image_url').limit(1);q=/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(id)?q.eq('id',id):q.eq('slug',id);const {data}=await q.maybeSingle();if(!data||data.creator_id!==user.id)return;
    const title=document.querySelector('.community-title-row');if(title&&!title.querySelector('.om-edit-community')){const b=document.createElement('button');b.className='om-edit-btn om-edit-community';b.textContent='Edit Community';b.onclick=()=>modal('community',data);title.querySelector('.community-actions')?.appendChild(b);}
    document.querySelectorAll('.community-post').forEach(card=>{if(card.querySelector('.om-edit-post'))return;const match=[...document.querySelectorAll('.community-post')].indexOf(card);const p=window.__oneMuslimCommunityPosts?.[match];if(!p||p.author_id!==user.id)return;const f=card.querySelector('.post-footer');if(f){const b=document.createElement('button');b.className='om-edit-btn om-edit-post';b.textContent='Edit';b.onclick=()=>modal('community-post',p);f.prepend(b);}});
  }

  async function followedFeed(){
    const home=$('communityHome');if(!home||!user)return;
    let box=$('followedCommunityFeed');if(!box){box=document.createElement('section');box.id='followedCommunityFeed';box.className='om-followed-feed';home.appendChild(box);}box.innerHTML='<h2>Community Updates</h2><p class="muted">Posts from communities you follow.</p><div>Loading…</div>';
    const {data:follows}=await sb.from('community_follows').select('community_id').eq('user_id',user.id);const ids=(follows||[]).map(x=>x.community_id);if(!ids.length){box.innerHTML='<h2>Community Updates</h2><p class="muted">Posts from communities you follow.</p><div class="empty">Follow a community to see its posts here.</div>';return;}
    const {data:rows,error}=await sb.from('community_posts').select('id,community_id,author_id,title,body,created_at,updated_at,communities:community_id(id,name,slug)').in('community_id',ids).order('created_at',{ascending:false}).limit(50);if(error){box.innerHTML='<h2>Community Updates</h2><p class="muted">Unable to load followed community posts.</p>';return;}
    box.innerHTML='<h2>Community Updates</h2><p class="muted">Posts from communities you follow.</p>'+(rows?.length?rows.map(p=>`<article class="om-feed-post"><div class="community-meta"><span class="pill">${esc(p.communities?.name||'Community')}</span><span>${new Date(p.created_at).toLocaleString()}</span></div>${p.title?`<h3>${esc(p.title)}</h3>`:''}<p>${esc(p.body)}</p></article>`).join(''):'<div class="empty">No posts from followed communities yet.</div>');
  }

  async function doxdControls(){
    if(!user||!location.pathname.toLowerCase().includes('doxd'))return;
    const id=new URLSearchParams(location.search).get('post');if(!id)return;
    const {data:p}=await sb.from('doxd_posts').select('id,author_id,subject_type,subject_name,title,category,claim,context,evidence,source_url,created_at,updated_at').eq('id',id).maybeSingle();if(!p||p.author_id!==user.id)return;
    const detail=document.querySelector('.detail');if(!detail||detail.querySelector('.om-edit-doxd'))return;const b=document.createElement('button');b.className='om-edit-btn om-edit-doxd';b.textContent="Edit DoX'd Post";b.style.marginTop='14px';b.onclick=()=>modal('doxd',p);const first=detail.querySelector('.meta');first?.after(b);
  }

  function boot(){styles();(async()=>{user=await currentUser();if(!user)return;await followedFeed();await doxdControls();await addCommunityCreatorControls();})();new MutationObserver(()=>{if(user){followedFeed();doxdControls();addCommunityCreatorControls();}}).observe(document.body,{childList:true,subtree:true});}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
})();
