/* OneMuslim People actions + filter layout fix. */
(function(){
  'use strict';
  const cfg=window.APP_CONFIG||{};
  const createClient=window.supabase?.createClient;
  if(!createClient||!cfg.SUPABASE_URL||!cfg.SUPABASE_ANON_KEY)return;
  const db=createClient(cfg.SUPABASE_URL,cfg.SUPABASE_ANON_KEY,{auth:{persistSession:true,autoRefreshToken:true,detectSessionInUrl:true}});
  const esc=s=>String(s??'').replace(/[&<>\"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;',"'":'&#039;'}[m]));
  const displayName=p=>p?.display_name||`${p?.first_name||''} ${p?.last_name||''}`.trim()||'Member';
  const xp=p=>Number(p?.xp_total??p?.xp??p?.rank_points??0)||0;
  const gender=p=>((p?.avatar_gender||p?.avatar_config?.gender||'male')==='female'?'female':'male');
  const avatar=p=>{
    const g=gender(p), platinum=xp(p)>=10000;
    return platinum?`/assets/avatar/platinum/platinum-${g}.PNG`:`/assets/avatar/base/avatar-master-${g}.jpeg`;
  };
  const toast=m=>window.toast?.(m);

  function styles(){
    if(document.getElementById('peopleActionsFixStyles'))return;
    const s=document.createElement('style');s.id='peopleActionsFixStyles';s.textContent=`
      /* Filters are intentionally separate from the member-category tabs. */
      body.dashboard-theme #profilesPage .people-controls{display:block!important;padding:12px 14px!important}
      body.dashboard-theme #profilesPage .people-tabs{display:flex!important;flex-wrap:wrap!important;overflow:visible!important;width:100%!important;gap:6px!important}
      body.dashboard-theme #profilesPage .people-tab{flex:0 0 auto!important}
      body.dashboard-theme #profilesPage .people-search{display:flex!important;width:100%!important;justify-content:flex-start!important;flex-wrap:wrap!important;gap:9px!important;margin-top:12px!important;padding-top:12px!important;border-top:1px solid #e7edf4!important}
      body.dashboard-theme #profilesPage .people-search input{width:min(280px,100%)!important;flex:1 1 220px!important}
      body.dashboard-theme #profilesPage .people-search select{width:auto!important;max-width:none!important;min-width:145px!important;flex:0 1 auto!important}
      @media(max-width:900px){body.dashboard-theme #profilesPage .people-search{display:grid!important;grid-template-columns:1fr 1fr!important}.people-search input{grid-column:1/-1!important;width:100%!important}.people-search select{width:100%!important;min-width:0!important}}
      @media(max-width:560px){body.dashboard-theme #profilesPage .people-tabs{display:grid!important;grid-template-columns:repeat(2,minmax(0,1fr))!important}.people-tabs .people-tab{width:100%!important}.people-tabs .people-tab:first-child{grid-column:1/-1!important}.people-search{grid-template-columns:1fr!important}.people-search input{grid-column:auto!important}}
      .om-people-action-modal{position:fixed;inset:0;z-index:100000;display:grid;place-items:center;padding:20px;background:rgba(7,18,34,.48);backdrop-filter:blur(6px)}
      .om-people-action-card{width:min(500px,100%);max-height:min(760px,88vh);overflow:auto;background:#fff;border:1px solid #dfe7ef;border-radius:22px;box-shadow:0 24px 80px rgba(5,20,40,.25);padding:24px;color:#16233b}
      .om-people-action-head{display:flex;align-items:flex-start;gap:15px}.om-people-action-avatar{width:76px;height:76px;flex:0 0 76px;border-radius:50%;object-fit:cover;border:4px solid #fff;box-shadow:0 8px 22px rgba(21,35,59,.16);background:#edf2f7}.om-people-action-copy{min-width:0;flex:1}.om-people-action-copy h2{margin:3px 0 2px;font-size:24px;line-height:1.15}.om-people-action-copy .handle{color:#6b7b93;font-size:12px}.om-people-action-close{border:0;background:#f1f5f9;color:#53647c;width:34px;height:34px;border-radius:10px;font-size:22px;cursor:pointer}.om-people-action-bio{margin:18px 0 10px;color:#52657f;line-height:1.55}.om-people-action-meta{display:flex;flex-wrap:wrap;gap:8px;margin:12px 0}.om-people-chip{display:inline-flex;padding:7px 10px;border-radius:999px;background:#f1f5f8;border:1px solid #dfe7ef;color:#53647c;font-size:11px;font-weight:750}.om-people-action-stats{display:flex;gap:26px;padding:15px 0;border-top:1px solid #e4eaf1;border-bottom:1px solid #e4eaf1}.om-people-action-stats button{border:0;background:none;padding:0;display:grid;gap:2px;text-align:left;cursor:pointer;color:#16233b}.om-people-action-stats b{font-size:20px}.om-people-action-stats span{font-size:11px;color:#6b7b93}.om-people-action-buttons{display:flex;gap:10px;margin-top:18px}.om-people-action-buttons button{flex:1;height:42px;border-radius:12px;border:1px solid #d8e2e7;font-weight:800;cursor:pointer}.om-people-action-buttons .follow{background:#185f55;color:#fff;border-color:#185f55}.om-people-action-buttons .following{background:#eef4ef;color:#185f55;border-color:#cbded4}.om-people-action-buttons .message{background:#f1f5f8;color:#185f55}.om-people-message textarea{width:100%;min-height:140px;resize:vertical;box-sizing:border-box;border:1px solid #dbe3ee;border-radius:13px;padding:13px;font:inherit;outline:none}.om-people-message textarea:focus{border-color:#76a6ff;box-shadow:0 0 0 3px rgba(36,116,255,.1)}.om-people-message-actions{display:flex;gap:9px;justify-content:flex-end;margin-top:12px}.om-people-message-actions button{border:0;border-radius:11px;padding:10px 16px;font-weight:800;cursor:pointer}.om-people-message-actions .send{background:#185f55;color:#fff}.om-people-message-actions .cancel{background:#eef2f6;color:#53647c}
    `;document.head.appendChild(s);
  }

  async function currentUser(){const r=await db.auth.getUser();return r?.data?.user||null;}
  async function getProfile(id){const r=await db.from('profiles').select('*').eq('id',id).maybeSingle();if(r.error)throw r.error;return r.data||null;}
  async function followState(id){const me=await currentUser();if(!me||me.id===id)return false;const r=await db.from('profile_follows').select('follower_id').eq('follower_id',me.id).eq('following_id',id).maybeSingle();if(r.error)throw r.error;return !!r.data;}
  async function counts(id){const [a,b]=await Promise.all([db.from('profile_follows').select('follower_id',{count:'exact',head:true}).eq('following_id',id),db.from('profile_follows').select('following_id',{count:'exact',head:true}).eq('follower_id',id)]);return {followers:a.count||0,following:b.count||0};}

  async function setFollow(id){
    const me=await currentUser();if(!me||me.id===id)return false;
    const existing=await db.from('profile_follows').select('follower_id').eq('follower_id',me.id).eq('following_id',id).maybeSingle();
    if(existing.error)throw existing.error;
    if(existing.data){const r=await db.from('profile_follows').delete().eq('follower_id',me.id).eq('following_id',id);if(r.error)throw r.error;return false;}
    const r=await db.from('profile_follows').insert({follower_id:me.id,following_id:id});if(r.error)throw r.error;return true;
  }

  function closeModal(){document.querySelectorAll('.om-people-action-modal').forEach(x=>x.remove());}
  function modal(html){closeModal();const m=document.createElement('div');m.className='om-people-action-modal';m.innerHTML=`<div class="om-people-action-card">${html}</div>`;document.body.appendChild(m);m.addEventListener('click',e=>{if(e.target===m)closeModal()});m.querySelector('.om-people-action-close')?.addEventListener('click',closeModal);return m;}

  async function renderProfile(id){
    const p=await getProfile(id);if(!p){toast?.('That member could not be found.');return;}
    const [me,following,c]=await Promise.all([currentUser(),followState(id),counts(id)]);
    const loc=[p.city,p.state,p.country].filter(Boolean).join(', ');
    const m=modal(`<div class="om-people-action-head"><img class="om-people-action-avatar" src="${esc(avatar(p))}" alt="${esc(displayName(p))} avatar"><div class="om-people-action-copy"><h2>${esc(displayName(p))}</h2><span class="handle">@${esc(p.username||'member')}</span></div><button class="om-people-action-close" type="button">×</button></div><p class="om-people-action-bio">${esc(p.bio||'Member of the OneMuslim community.')}</p><div class="om-people-action-meta">${loc?`<span class="om-people-chip">📍 ${esc(loc)}</span>`:''}<span class="om-people-chip">⭐ ${xp(p).toLocaleString()} XP</span>${xp(p)>=10000?'<span class="om-people-chip">✦ Platinum</span>':''}</div><div class="om-people-action-stats"><button type="button" data-modal-list="followers"><b>${c.followers}</b><span>Followers</span></button><button type="button" data-modal-list="following"><b>${c.following}</b><span>Following</span></button></div>${me&&me.id!==id?`<div class="om-people-action-buttons"><button class="follow ${following?'following':''}" type="button" data-modal-follow="${esc(id)}">${following?'Following':'Follow'}</button><button class="message" type="button" data-modal-message="${esc(id)}">Message</button></div>`:''}`);
    m.querySelector('[data-modal-follow]')?.addEventListener('click',async e=>{const b=e.currentTarget;b.disabled=true;try{const now=await setFollow(id);b.textContent=now?'Following':'Follow';b.classList.toggle('following',now);const nc=await counts(id);m.querySelector('[data-modal-list="followers"] b').textContent=nc.followers;document.querySelectorAll(`[data-follow-target="${CSS.escape(id)}"]`).forEach(x=>x.classList.toggle('is-following',now));window.dispatchEvent(new CustomEvent('profile:follow-changed',{detail:{profileId:id,following:now}}));}catch(err){toast?.(err.message||'Unable to update follow.');}finally{b.disabled=false;}});
    m.querySelector('[data-modal-message]')?.addEventListener('click',()=>openMessage(id,p));
    m.querySelectorAll('[data-modal-list]').forEach(b=>b.addEventListener('click',()=>openFollowList(id,b.dataset.modalList)));
  }

  async function openFollowList(id,type){
    const source=type==='followers'?'following_id':'follower_id';const col=type==='followers'?'follower_id':'following_id';
    const r=await db.from('profile_follows').select(col).eq(source,id);if(r.error){toast?.(r.error.message);return;}
    const ids=(r.data||[]).map(x=>x[col]).filter(Boolean);let people=[];
    if(ids.length){const p=await db.from('profiles').select('id,display_name,username,first_name,last_name,avatar_gender,avatar_config,xp_total,bio').in('id',ids);if(p.error){toast?.(p.error.message);return;}const map=new Map((p.data||[]).map(x=>[String(x.id),x]));people=ids.map(x=>map.get(String(x))).filter(Boolean);}
    const m=modal(`<button class="om-people-action-close" type="button">×</button><h2 style="margin:0 0 16px">${type==='followers'?'Followers':'Following'}</h2><div style="display:grid;gap:8px">${people.length?people.map(p=>`<button type="button" data-person="${esc(p.id)}" style="display:flex;align-items:center;gap:11px;border:1px solid #dfe7ef;background:#f8fafc;border-radius:13px;padding:10px;text-align:left;cursor:pointer"><img src="${esc(avatar(p))}" style="width:42px;height:42px;border-radius:50%;object-fit:cover;border:2px solid #fff"><span><b>${esc(displayName(p))}</b><small style="display:block;color:#6b7b93">@${esc(p.username||'member')}</small></span></button>`).join(''):'<div style="padding:25px;text-align:center;color:#6b7b93">No one here yet.</div>'}</div>`);
    m.querySelectorAll('[data-person]').forEach(b=>b.addEventListener('click',()=>renderProfile(b.dataset.person)));
  }

  async function ensureConversation(me,other){
    const pair=[me.id,other].sort();let r=await db.from('conversations').select('*').eq('participant_a',pair[0]).eq('participant_b',pair[1]).maybeSingle();if(r.error)throw r.error;if(r.data)return r.data;r=await db.from('conversations').insert({participant_a:pair[0],participant_b:pair[1]}).select().single();if(r.error&&/duplicate|unique/i.test(r.error.message)){r=await db.from('conversations').select('*').eq('participant_a',pair[0]).eq('participant_b',pair[1]).single()}if(r.error)throw r.error;return r.data;
  }
  async function openMessage(id,p){
    const me=await currentUser();if(!me||me.id===id)return;
    const m=modal(`<button class="om-people-action-close" type="button">×</button><h2 style="margin:0 0 5px">Message ${esc(displayName(p))}</h2><p style="margin:0 0 16px;color:#6b7b93">@${esc(p.username||'member')}</p><div class="om-people-message"><textarea id="omPeopleMessageText" maxlength="2000" placeholder="Write a private message…"></textarea><div class="om-people-message-actions"><button class="cancel" type="button" id="omPeopleCancel">Cancel</button><button class="send" type="button" id="omPeopleSend">Send</button></div></div>`);
    m.querySelector('#omPeopleCancel').onclick=closeModal;m.querySelector('#omPeopleMessageText').focus();m.querySelector('#omPeopleSend').onclick=async()=>{const text=m.querySelector('#omPeopleMessageText').value.trim();if(!text)return;const b=m.querySelector('#omPeopleSend');b.disabled=true;try{const c=await ensureConversation(me,id);const r=await db.from('messages').insert({conversation_id:c.id,sender_id:me.id,body:text});if(r.error)throw r.error;await db.from('conversations').update({updated_at:new Date().toISOString()}).eq('id',c.id);closeModal();toast?.('Message sent. 💬');}catch(err){toast?.(err.message||'Unable to send message.');}finally{b.disabled=false;}};
  }

  function wire(){
    document.addEventListener('click',async e=>{
      const view=e.target.closest?.('[data-view-profile]');
      if(view){e.preventDefault();e.stopImmediatePropagation();try{await renderProfile(view.dataset.viewProfile)}catch(err){console.error(err);toast?.(err.message||'Unable to open profile.')}return;}
      const msg=e.target.closest?.('[data-message-user]');
      if(msg){e.preventDefault();e.stopImmediatePropagation();try{const p=await getProfile(msg.dataset.messageUser);if(p)openMessage(msg.dataset.messageUser,p)}catch(err){console.error(err);toast?.(err.message||'Unable to open message composer.')}return;}
      const follow=e.target.closest?.('[data-follow-target]');
      if(follow){e.preventDefault();e.stopImmediatePropagation();const id=follow.dataset.followTarget;follow.disabled=true;try{const now=await setFollow(id);document.querySelectorAll(`[data-follow-target="${CSS.escape(id)}"]`).forEach(b=>{b.classList.toggle('is-following',now);b.setAttribute('aria-pressed',now?'true':'false');b.setAttribute('aria-label',now?'Unfollow member':'Follow member');b.setAttribute('title',now?'Unfollow':'Follow');});window.dispatchEvent(new CustomEvent('profile:follow-changed',{detail:{profileId:id,following:now}}));}catch(err){console.error(err);toast?.(err.message||'Unable to update follow.')}finally{follow.disabled=false;}return;}
    },true);
  }

  styles();wire();
  window.OneMuslimPeopleActions={openProfile:renderProfile,openMessage,follow:setFollow};
})();
