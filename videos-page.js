/* OneMuslim Videos page — TikTok profile integration. */
(function(){
  'use strict';
  const esc=s=>String(s??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[m]));
  function username(){
    const raw=String(window.profile?.tiktok_username||'').trim();
    if(!raw)return '';
    const m=raw.match(/tiktok\.com\/@?([A-Za-z0-9._-]+)/i);
    return (m?m[1]:raw.replace(/^@/,'').split(/[/?#]/)[0]).trim();
  }
  function profileUrl(){const u=username();return u?`https://www.tiktok.com/@${encodeURIComponent(u)}`:'';}
  function styles(){
    if(document.getElementById('om-videos-styles'))return;
    const s=document.createElement('style');s.id='om-videos-styles';s.textContent=`
      #omPage-videos .om-videos-wrap{max-width:1000px}
      #omPage-videos .om-videos-card{background:#fff;border:1px solid #e5e1d7;border-radius:22px;padding:26px;box-shadow:0 8px 30px rgba(40,60,50,.055)}
      #omPage-videos .om-videos-empty{text-align:center;padding:58px 24px}
      #omPage-videos .om-videos-icon{width:72px;height:72px;margin:0 auto 18px;border-radius:20px;display:grid;place-items:center;background:#182c25;color:#fff;font-size:30px;box-shadow:0 10px 24px rgba(24,44,37,.16)}
      #omPage-videos h3{margin:0 0 8px;color:#1f5b49;font-family:Georgia,'Times New Roman',serif;font-size:28px}
      #omPage-videos p{color:#718078;line-height:1.6}
      #omPage-videos .om-videos-btn{display:inline-flex;align-items:center;justify-content:center;border:0;border-radius:999px;padding:12px 20px;background:#1f5b49;color:#fff;font-weight:800;cursor:pointer;margin-top:12px}
      #omPage-videos .om-tiktok-head{display:flex;align-items:center;justify-content:space-between;gap:14px;margin-bottom:18px}
      #omPage-videos .om-tiktok-head a{color:#1f5b49;font-weight:800;text-decoration:none}
      #omPage-videos .om-tiktok-embed{display:flex;justify-content:center;min-height:260px}
      #omPage-videos .om-videos-note{margin-top:16px;padding:12px 14px;border-radius:14px;background:#f3f7f4;color:#496359;font-size:13px}
    `;document.head.appendChild(s);
  }
  function loadEmbed(){
    if(document.getElementById('tiktok-embed-script'))return;
    const s=document.createElement('script');s.id='tiktok-embed-script';s.src='https://www.tiktok.com/embed.js';s.async=true;document.body.appendChild(s);
  }
  function openEditor(){
    const open=window.OneMuslimOpenProfileEditor||window.openProfileBuilder||window.OneMuslimProfileBuilder?.open;
    if(!open){window.toast?.('Profile editor is unavailable right now.');return;}
    open();
    setTimeout(()=>document.querySelector('.om-pb-overlay .om-pb-tab[data-tab="social"]')?.click(),120);
  }
  function render(){
    styles();
    const app=document.getElementById('appView'),content=app?.querySelector('.content');if(!content)return;
    let page=document.getElementById('omPage-videos');
    if(!page){page=document.createElement('div');page.id='omPage-videos';page.className='page hidden';page.dataset.omPage='videos';content.appendChild(page)}
    const u=username();
    if(!u){
      page.innerHTML=`<div class="page-head"><div><span class="eyebrow">YOUR MEDIA</span><h2>Videos</h2></div></div><div class="om-videos-wrap"><div class="om-videos-card om-videos-empty"><div class="om-videos-icon">♪</div><h3>Connect your TikTok</h3><p>Your Videos page is ready. Add your TikTok profile in Edit My Profile to display your TikTok content here.</p><button class="om-videos-btn" id="omConnectTikTok">Connect TikTok</button></div></div>`;
      page.querySelector('#omConnectTikTok').onclick=openEditor;
      return;
    }
    const url=profileUrl();
    page.innerHTML=`<div class="page-head"><div><span class="eyebrow">YOUR MEDIA</span><h2>Videos</h2></div></div><div class="om-videos-wrap"><div class="om-videos-card"><div class="om-tiktok-head"><div><h3>@${esc(u)}</h3><p style="margin:0">TikTok videos</p></div><a href="${esc(url)}" target="_blank" rel="noopener noreferrer">Open TikTok ↗</a></div><div class="om-tiktok-embed"><blockquote class="tiktok-embed" cite="${esc(url)}" data-unique-id="${esc(u)}" data-embed-type="creator" style="max-width:780px;min-width:325px"><section><a href="${esc(url)}" target="_blank" rel="noopener noreferrer">@${esc(u)}</a></section></blockquote></div><div class="om-videos-note">TikTok controls the embedded content. Your TikTok profile remains the source of truth for your videos.</div></div></div>`;
    loadEmbed();
  }
  function show(page){
    const target=page==='videos'?document.getElementById('omPage-videos'):null;
    if(!target)return false;
    document.querySelectorAll('#appView .content > .page').forEach(p=>p.classList.add('hidden'));
    target.classList.remove('hidden');
    document.querySelectorAll('#appView .app-nav-link,#appView .side').forEach(b=>b.classList.toggle('active',b.dataset.page==='videos'));
    window.scrollTo({top:0,behavior:'smooth'});
    render();
    return true;
  }
  function init(){
    styles();render();
    window.OneMuslimVideos={render,show,openEditor};
    window.addEventListener('profile:updated',render);
    window.addEventListener('tiktok:updated',render);
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();
})();
