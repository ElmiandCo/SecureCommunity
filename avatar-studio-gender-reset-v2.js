/* OneMuslim AvatarStudio v3 — gender defaults, real identity avatars, finish persistence, and global avatar sync. */
(function(){
  'use strict';
  const REGULAR={male:'/assets/avatar/male/male-1-original.jpg',female:'/assets/avatar/base/master.png'};
  const PLATINUM={male:'/assets/avatars/platinum-male.PNG',female:'/assets/avatars/platinum-female.PNG'};
  const client=()=>window.OneMuslimSupabaseClient?.getClient?.()||window.supabase?.createClient?.(window.APP_CONFIG?.SUPABASE_URL,window.APP_CONFIG?.SUPABASE_ANON_KEY);
  const esc=s=>String(s??'').replace(/[&<>\"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;',"'":'&#039;'}[m]));
  const avatarSrc=(gender,finish)=>finish==='platinum_package'?PLATINUM[gender]:REGULAR[gender];
  const profileAvatar=()=>{const p=window.profile||{};const gender=p.avatar_gender==='female'?'female':'male';const platinum=p.avatar_package==='platinum_package'&&Number(p.xp_total??p.xp??p.rank_points??0)>=10000;return platinum?PLATINUM[gender]:REGULAR[gender];};

  function studioGender(overlay){return overlay?.querySelector('.pb-gender.selected')?.dataset.gender||overlay?.dataset.omGender||window.profile?.avatar_gender||'male';}
  function selectedFinish(overlay){const selected=overlay.querySelector('.pb-package.selected');return selected?.dataset.package==='platinum_package'?'platinum_package':'default';}
  function selectedBackground(overlay){
    const selected=overlay.querySelector('.om-pb-bg.selected');
    if(!selected)return (window.profile||{}).profile_background||'default';
    const index=[...overlay.querySelectorAll('.om-pb-bg')].indexOf(selected);
    const labels=['default','Mosque Silhouette','Islamic Arch','Crescent & Stars','Luxury Gold','Emerald','Dark Mosque','Minimal Cream'];
    return labels[index]||selected.dataset.bg||'default';
  }

  function styles(){
    if(document.getElementById('om-avatar-studio-v3-styles'))return;
    const s=document.createElement('style');s.id='om-avatar-studio-v3-styles';s.textContent=`
      .om-pb-choice.pb-gender{display:flex!important;flex-direction:column!important;align-items:center!important;justify-content:center!important;gap:8px!important;min-width:126px!important;min-height:150px!important;padding:12px!important;overflow:hidden!important}
      .om-pb-choice.pb-gender .om-identity-avatar{width:92px!important;height:92px!important;border-radius:50%!important;overflow:hidden!important;background:#edf4ef!important;border:3px solid #fff!important;box-shadow:0 6px 18px rgba(18,48,39,.14)!important;display:block!important;flex:0 0 auto!important}
      .om-pb-choice.pb-gender .om-identity-avatar img{width:100%!important;height:100%!important;object-fit:cover!important;object-position:center top!important;display:block!important}
      .om-pb-choice.pb-gender .om-identity-label{font-weight:800!important;font-size:15px!important;color:#294c40!important}
      .om-pb-avatar-photo,.om-pb-preview-avatar{aspect-ratio:1/1!important;border-radius:50%!important;overflow:hidden!important;box-sizing:border-box!important;flex:0 0 auto!important}
      .om-pb-avatar-photo{width:88px!important;height:88px!important;min-width:88px!important;min-height:88px!important}
      .om-pb-avatar-photo img,.om-pb-preview-avatar img,.om-personal-avatar img{width:100%!important;height:100%!important;object-fit:cover!important;object-position:center top!important;display:block!important}
      .om-avatar-sync-img{width:100%!important;height:100%!important;object-fit:cover!important;object-position:center top!important;border-radius:50%!important;display:block!important}
      .om-nav-mark.om-avatar-synced{overflow:hidden!important;padding:0!important}
      #composerAvatar.om-avatar-synced,#miniProfile .avatar.om-avatar-synced,#miniProfile .mini-avatar.om-avatar-synced,#miniProfile .profile-avatar.om-avatar-synced{overflow:hidden!important;padding:0!important}
      .om-pb-choice.pb-package .om-package-avatar{width:34px;height:34px;border-radius:50%;overflow:hidden;display:inline-block;vertical-align:middle;margin-right:7px}
      .om-pb-choice.pb-package .om-package-avatar img{width:100%;height:100%;object-fit:cover;object-position:center top;display:block}
    `;document.head.appendChild(s);
  }

  function decorateStudio(overlay){
    if(!overlay)return;
    const gender=studioGender(overlay);
    overlay.querySelectorAll('.pb-gender').forEach(btn=>{
      const g=btn.dataset.gender==='female'?'female':'male';
      btn.innerHTML=`<span class="om-identity-avatar"><img src="${REGULAR[g]}" alt="${g} Muslim avatar"></span><span class="om-identity-label">${g==='female'?'Female':'Male'}</span>`;
      btn.setAttribute('aria-pressed',btn.classList.contains('selected')?'true':'false');
    });
    const platinum=overlay.querySelector('.pb-package[data-package="platinum_package"]');
    if(platinum){const label=gender==='female'?'Platinum Female':'Platinum Male';const locked=platinum.disabled;platinum.innerHTML=`<span class="om-package-avatar"><img src="${PLATINUM[gender]}" alt="${label}"></span>${label}${locked?' 🔒':''}`;}
    const original=overlay.querySelector('.pb-package[data-package="default"]');
    if(original&&!original.querySelector('.om-package-avatar'))original.innerHTML=`<span class="om-package-avatar"><img src="${REGULAR[gender]}" alt="Original Muslim avatar"></span>Original`;
    const finish=selectedFinish(overlay);
    const src=finish==='platinum_package'&&!platinum?.disabled?PLATINUM[gender]:REGULAR[gender];
    [overlay.querySelector('#pbCurrentAvatar'),overlay.querySelector('#pbPreviewAvatar')].forEach(host=>{if(!host)return;host.innerHTML=`<img src="${src}" alt="Selected avatar">`;});
  }

  function setOwnAvatar(el,src){
    if(!el||!src)return;
    const existing=el.querySelector('img.om-avatar-sync-img');
    if(existing&&existing.getAttribute('src')===src)return;
    el.classList.add('om-avatar-synced');el.textContent='';
    const img=document.createElement('img');img.className='om-avatar-sync-img';img.src=src;img.alt='Profile photo';img.loading='eager';
    img.onerror=()=>{el.classList.remove('om-avatar-synced');};
    el.appendChild(img);
  }
  function syncOwnAvatar(){
    const src=profileAvatar();
    const nav=document.querySelector('#appView .om-nav-mark');if(nav)setOwnAvatar(nav,src);
    const composer=document.getElementById('composerAvatar');if(composer)setOwnAvatar(composer,src);
    document.querySelectorAll('#miniProfile .avatar,#miniProfile .mini-avatar,#miniProfile .profile-avatar,[data-profile-avatar="self"]').forEach(el=>setOwnAvatar(el,src));
    const personal=document.querySelector('.om-personal-avatar');if(personal){const img=personal.querySelector('img');if(!img||img.getAttribute('src')!==src)personal.innerHTML=`<img src="${src}" alt="Selected avatar">`;}
  }
  function scan(){styles();const overlay=document.querySelector('.om-pb-overlay');if(overlay)decorateStudio(overlay);syncOwnAvatar();}

  async function safeUpdate(sb,id,payload){
    let work={...payload};
    for(let i=0;i<20;i++){
      const r=await sb.from('profiles').update(work).eq('id',id).select().single();
      if(!r.error)return r.data;
      const m=String(r.error.message||'').match(/Could not find the ['\"]([^'\"]+)['\"] column of ['\"]profiles['\"] in the schema cache/i);
      if(!m||!(m[1] in work))throw r.error;
      delete work[m[1]];
    }
    throw new Error('Profile could not be saved because the database schema rejected the update.');
  }

  function resetToRegular(overlay,gender){
    overlay.dataset.omGender=gender;
    const finishButton=overlay.querySelector('.pb-package[data-package="default"]');
    overlay.querySelectorAll('.pb-package').forEach(x=>x.classList.toggle('selected',x===finishButton));
    const src=REGULAR[gender];
    [overlay.querySelector('#pbCurrentAvatar'),overlay.querySelector('#pbPreviewAvatar')].forEach(el=>{if(el)el.innerHTML=`<img src="${src}" alt="${gender} Muslim avatar">`;});
    overlay.querySelectorAll('.pb-gender').forEach(x=>x.classList.toggle('selected',x.dataset.gender===gender));
    decorateStudio(overlay);
  }

  function bind(){
    styles();
    document.addEventListener('click',async function(e){
      const genderButton=e.target.closest?.('.om-pb-overlay .pb-gender');
      if(genderButton){
        e.preventDefault();e.stopImmediatePropagation();
        const overlay=genderButton.closest('.om-pb-overlay');
        resetToRegular(overlay,genderButton.dataset.gender);
        return;
      }

      const save=e.target.closest?.('.om-pb-overlay #pbSave');
      if(!save)return;
      const overlay=save.closest('.om-pb-overlay');
      const gender=studioGender(overlay);
      e.preventDefault();e.stopImmediatePropagation();
      if(save.dataset.busy==='1')return;
      save.dataset.busy='1';save.textContent='Saving…';save.disabled=true;
      try{
        const sb=client();if(!sb)throw new Error('Secure profile service is unavailable.');
        const auth=await sb.auth.getUser();const user=auth?.data?.user;
        if(!user)throw new Error('Your session expired. Please sign in again.');
        const val=id=>overlay.querySelector(id)?.value?.trim?.()||'';
        const username=val('#pfUser').toLowerCase();
        if(!/^[a-z0-9_.-]{3,30}$/.test(username))throw new Error('Username must be 3–30 characters and use letters, numbers, dots, underscores, or hyphens.');
        const finish=selectedFinish(overlay);
        const avatar=avatarSrc(gender,finish);
        const payload={
          display_name:val('#pfDisplay'),username,first_name:val('#pfFirst'),last_name:val('#pfLast'),
          bio:val('#pfBio'),location:val('#pfLocation'),city:val('#pfCity'),state:val('#pfState'),country:val('#pfCountry'),
          gender:overlay.querySelector('#pfGender')?.value||'',website:val('#pfWebsite'),
          group_team:overlay.querySelector('#pbGroup')?.value||'',
          profile_visibility:overlay.querySelector('#pbPrivacy')?.value||'public',
          avatar_url:avatar,avatar_gender:gender,avatar_package:finish,avatar_config:null,
          profile_background:selectedBackground(overlay),
          profile_accent:overlay.querySelector('[data-accent].selected')?.dataset.accent||(window.profile||{}).profile_accent||'emerald'
        };
        const data=await safeUpdate(sb,user.id,payload);
        window.profile={...(window.profile||{}),...data,...payload};
        try{const st=JSON.parse(localStorage.getItem('onemuslim_platform_v1')||'{}');st.profile={...(st.profile||{}),...window.profile};localStorage.setItem('onemuslim_platform_v1',JSON.stringify(st));}catch{}
        syncOwnAvatar();
        window.OneMuslimPlatform?.refreshFloat?.();
        window.renderProfile?.();window.refreshProfile?.();
        window.renderHome?.();window.renderDashboard?.();
        window.OneMuslimAvatarStudioV3?.scan?.();
        window.dispatchEvent(new Event('profile:updated'));
        window.toast?.(finish==='platinum_package'?'Profile saved with your Platinum avatar.':'Profile saved with your regular Muslim avatar.');
        overlay.remove();
      }catch(err){
        save.dataset.busy='0';save.disabled=false;save.textContent='Save changes';
        window.toast?.(err.message||'Could not save profile.');
      }
    },true);
    scan();
    let queued=false;
    new MutationObserver(()=>{if(queued)return;queued=true;requestAnimationFrame(()=>{queued=false;scan()})}).observe(document.body,{childList:true,subtree:true});
    setInterval(scan,1500);
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',bind);else bind();
  window.OneMuslimAvatarStudioV3={avatarFor:profileAvatar,scan,syncOwnAvatar};
})();
