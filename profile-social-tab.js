/* OneMuslim Profile Editor — TikTok social tab. */
(function(){
  'use strict';
  const esc=s=>String(s??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[m]));
  const client=()=>window.OneMuslimSupabaseClient?.getClient?.()||window.supabase?.createClient?.(window.APP_CONFIG?.SUPABASE_URL,window.APP_CONFIG?.SUPABASE_ANON_KEY);
  let pending=null;
  function normalize(value){
    let raw=String(value||'').trim();
    if(!raw)return '';
    raw=raw.replace(/^https?:\/\//i,'').replace(/^www\./i,'');
    const m=raw.match(/^tiktok\.com\/@?([A-Za-z0-9._-]+)/i);
    if(m)return m[1];
    return raw.replace(/^@/,'').split(/[/?#]/)[0];
  }
  function styles(){
    if(document.getElementById('om-profile-social-css'))return;
    const s=document.createElement('style');s.id='om-profile-social-css';s.textContent=`
      .om-pb-social-fields{display:grid;gap:14px}.om-pb-social-fields label{display:grid;gap:7px}.om-pb-social-fields input{width:100%;box-sizing:border-box;border:1px solid rgba(31,106,85,.18);border-radius:12px;padding:12px 13px;background:#fff;color:#20352c;font:inherit}.om-pb-social-help{padding:13px 15px;border:1px solid #cbded4;border-radius:14px;background:#f3f7f4;color:#496359;font-size:13px;line-height:1.55}
    `;document.head.appendChild(s);
  }
  function inject(){
    const overlay=document.querySelector('.om-pb-overlay');if(!overlay)return;
    const tabs=overlay.querySelector('.om-pb-tabs'),main=overlay.querySelector('.om-pb-main');if(!tabs||!main)return;
    if(!tabs.querySelector('[data-tab="social"]')){
      const privacy=tabs.querySelector('[data-tab="privacy"]');
      const b=document.createElement('button');b.type='button';b.className='om-pb-tab';b.dataset.tab='social';b.innerHTML='♪<small>Social</small>';
      privacy?privacy.insertAdjacentElement('beforebegin',b):tabs.appendChild(b);
    }
    if(!main.querySelector('[data-panel="social"]')){
      const p=window.profile||{};
      const existing=String(p.tiktok_username||'').replace(/^@/,'');
      const panel=document.createElement('section');panel.className='om-pb-panel';panel.dataset.panel='social';
      panel.innerHTML=`<div class="om-pb-heading"><span class="om-pb-kicker">SOCIAL</span><h3>Connect your TikTok</h3><p>Your TikTok profile powers the Videos page.</p></div><div class="om-pb-social-fields"><label>TikTok profile URL<input id="pfTikTok" maxlength="200" type="url" value="${esc(existing?`https://www.tiktok.com/@${existing}`:'')}" placeholder="https://www.tiktok.com/@yourusername"></label><div class="om-pb-social-help">Add your TikTok profile URL here. Once saved, your Videos page will use this account for the TikTok content display.</div></div>`;
      main.appendChild(panel);
    }
    wireTabs(overlay);
    if(!document.documentElement.dataset.omTikTokSaveCapture){
      document.documentElement.dataset.omTikTokSaveCapture='1';
      document.addEventListener('click',e=>{
        const save=e.target.closest?.('.om-pb-overlay #pbSave');
        if(!save)return;
        pending=normalize(document.querySelector('.om-pb-overlay #pfTikTok')?.value||'');
        window.__oneMuslimPendingTikTok=pending;
      },true);
    }
  }
  function wireTabs(overlay){
    overlay.querySelectorAll('.om-pb-tab').forEach(b=>{if(b.dataset.socialTabWired)return;b.dataset.socialTabWired='1';b.addEventListener('click',()=>{
      const name=b.dataset.tab;
      overlay.querySelectorAll('.om-pb-tab').forEach(x=>x.classList.toggle('active',x===b));
      overlay.querySelectorAll('.om-pb-panel').forEach(x=>x.classList.toggle('active',x.dataset.panel===name));
    })});
  }
  async function persist(){
    if(pending===null)return;
    const value=pending;pending=null;window.__oneMuslimPendingTikTok=null;
    const c=client();if(!c)return;
    try{
      const u=await c.auth.getUser();const user=u?.data?.user;if(!user)return;
      const r=await c.from('profiles').update({tiktok_username:value||null}).eq('id',user.id);
      if(r.error)throw r.error;
      window.profile={...(window.profile||{}),tiktok_username:value||null};
      window.dispatchEvent(new Event('tiktok:updated'));
      window.OneMuslimVideos?.render?.();
    }catch(e){console.error('[OneMuslim] TikTok save failed',e);window.toast?.(e?.message||'Unable to save TikTok.');}
  }
  function wire(){styles();inject();}
  window.addEventListener('profile:updated',persist);
  new MutationObserver(wire).observe(document.body,{childList:true,subtree:true});
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',wire);else wire();
  window.OneMuslimProfileSocial={normalize,persist,inject};
})();
