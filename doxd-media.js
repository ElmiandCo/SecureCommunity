(() => {
'use strict';
const cfg=window.APP_CONFIG||{};const sb=window.OneMuslimSupabaseClient?.getClient?.()||window.supabase?.createClient?.(cfg.SUPABASE_URL,cfg.SUPABASE_ANON_KEY);if(!sb)return;
const $=id=>document.getElementById(id);const esc=s=>String(s??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[m]));
let user=null,handledSubmit=false;
async function signed(path){const {data}=await sb.storage.from('doxd-media').createSignedUrl(path,3600);return data?.signedUrl||null;}
async function addGallery(postId){
 const detail=document.querySelector('.detail');if(!detail||detail.dataset.mediaReady==='1')return;detail.dataset.mediaReady='1';
 const {data}=await sb.from('doxd_media').select('id,storage_path,file_name,mime_type').eq('post_id',postId).order('created_at');if(!data?.length)return;
 const urls=await Promise.all(data.map(async m=>({...m,url:await signed(m.storage_path)})));const block=document.createElement('div');block.className='doxd-media-gallery';block.innerHTML=urls.filter(m=>m.url).map(m=>`<div class="doxd-media-item">${m.mime_type.startsWith('video/')?`<video controls src="${esc(m.url)}"></video>`:`<img src="${esc(m.url)}" alt="${esc(m.file_name)}" loading="lazy">`}</div>`).join('');
 const first=detail.querySelector('.body-block');if(first)first.before(block);else detail.appendChild(block);
}
async function addCardMedia(){
 const cards=[...document.querySelectorAll('.doxd-card[data-kind="post"]')];if(!cards.length)return;const ids=cards.map(c=>c.dataset.id);const {data}=await sb.from('doxd_media').select('post_id,storage_path,file_name,mime_type').in('post_id',ids).order('created_at');if(!data?.length)return;
 const firstBy={};for(const m of data)if(!firstBy[m.post_id])firstBy[m.post_id]=m;for(const card of cards){const m=firstBy[card.dataset.id];if(!m)continue;const url=await signed(m.storage_path);if(!url)continue;const thumb=card.querySelector('.doxd-thumb');if(thumb)thumb.innerHTML=m.mime_type.startsWith('video/')?`<video muted playsinline src="${esc(url)}"></video>`:`<img src="${esc(url)}" alt="" loading="lazy">`;}}
async function createWithMedia(e){
 if(handledSubmit)return;handledSubmit=true;e.preventDefault();e.stopImmediatePropagation();
 if(!user){alert("Please sign in to create a DoX'd post.");handledSubmit=false;return;}
 const source=$('sourceUrl').value.trim();if(source&&!/^https?:\/\//i.test(source)){alert('Source URL must begin with http:// or https://');handledSubmit=false;return;}
 const files=[...($('doxdMediaFiles')?.files||[])];if(files.length>6){alert('Choose up to 6 images.');handledSubmit=false;return;}
 const payload={author_id:user.id,subject_type:$('subjectType').value,subject_name:$('subjectName').value.trim(),title:$('postTitle').value.trim(),category:$('category').value,claim:$('claim').value.trim(),context:$('context').value.trim()||null,evidence:$('evidence').value.trim()||null,source_url:source||null};
 const {data:p,error}=await sb.from('doxd_posts').insert(payload).select('id').single();if(error){alert(error.message);handledSubmit=false;return;}
 try{for(const f of files){if(!f.type.startsWith('image/'))throw new Error('Only image files are allowed for DoX\'d posts.');const path=`${user.id}/${p.id}/${crypto.randomUUID()}-${f.name}`;const up=await sb.storage.from('doxd-media').upload(path,f,{upsert:false,contentType:f.type});if(up.error)throw up.error;const ins=await sb.from('doxd_media').insert({post_id:p.id,user_id:user.id,storage_path:path,file_name:f.name,mime_type:f.type});if(ins.error)throw ins.error;}}
 catch(err){console.error(err);alert('The DoX\'d post was created, but one or more images failed to upload.');}
 $('doxdForm').reset();document.getElementById('composerModal').classList.add('hidden');document.getElementById('composerModal').setAttribute('aria-hidden','true');history.pushState({},'',`doxd.html?post=${p.id}`);window.dispatchEvent(new PopStateEvent('popstate'));handledSubmit=false;
}
function install(){
 const form=$('doxdForm');if(form&&!form.dataset.mediaEnhanced){form.dataset.mediaEnhanced='1';const label=document.createElement('label');label.innerHTML='Images <span class="optional">up to 6 · JPG, PNG, GIF, WebP</span><input id="doxdMediaFiles" type="file" accept="image/jpeg,image/png,image/gif,image/webp,image/heic,image/heif" multiple>';const source=$('sourceUrl');source?.closest('label')?.before(label);form.addEventListener('submit',createWithMedia,true);}
 const id=new URLSearchParams(location.search).get('post');if(id)addGallery(id);else addCardMedia();
}
(async()=>{const {data}=await sb.auth.getUser();user=data?.user||null;install();new MutationObserver(install).observe(document.body,{childList:true,subtree:true});window.addEventListener('popstate',install);})();
})();