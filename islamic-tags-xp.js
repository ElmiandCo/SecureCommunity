/* Community feed cleanup + compact media viewer.
 * Mr. Elmi note: Islamic topic tags are intentionally removed from the visible composer/feed UI.
 * Existing tag data remains in Supabase; this is a presentation change, not a destructive migration.
 */
(() => {
  'use strict';
  const $ = id => document.getElementById(id);

  function injectStyles(){
    if($('communityFeedCleanupStyles')) return;
    const s=document.createElement('style'); s.id='communityFeedCleanupStyles';
    s.textContent=`
      #islamicTagPanel,#tagFilterBar,.islamic-tag-panel,.tag-filter-bar,.post-tags{display:none!important}
      .media-grid.community-media-compact{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:8px;margin:12px 0}
      .community-media-thumb{width:100%;height:150px;display:block;object-fit:cover;border-radius:14px;border:1px solid #e5e1d7;cursor:zoom-in;background:#f4f0e7;transition:transform .16s ease,box-shadow .16s ease}
      .community-media-thumb:hover{transform:translateY(-1px);box-shadow:0 8px 24px rgba(18,48,39,.12)}
      .community-media-thumb.single{height:210px}.community-media-video{cursor:zoom-in}
      .community-media-more{position:relative;overflow:hidden;border-radius:14px;cursor:zoom-in}
      .community-media-more::after{content:attr(data-more);position:absolute;inset:0;display:grid;place-items:center;background:rgba(10,31,25,.46);color:#fff;font-size:18px;font-weight:800;pointer-events:none}
      .community-media-lightbox{position:fixed;inset:0;z-index:99999;display:flex;align-items:center;justify-content:center;padding:24px;background:rgba(5,18,14,.88);backdrop-filter:blur(8px)}
      .community-media-lightbox[hidden]{display:none}.community-media-viewer{position:relative;width:min(1100px,96vw);height:min(88vh,900px);display:flex;align-items:center;justify-content:center}
      .community-media-viewer img,.community-media-viewer video{max-width:100%;max-height:100%;object-fit:contain;border-radius:14px;box-shadow:0 20px 80px rgba(0,0,0,.35)}
      .community-media-close,.community-media-nav{border:1px solid rgba(255,255,255,.4);background:rgba(255,255,255,.12);color:#fff;cursor:pointer}
      .community-media-close{position:absolute;top:-8px;right:-8px;width:42px;height:42px;border-radius:50%;font-size:26px;line-height:1;z-index:2}
      .community-media-nav{position:absolute;top:50%;transform:translateY(-50%);width:44px;height:44px;border-radius:50%;font-size:24px}.community-media-prev{left:-58px}.community-media-next{right:-58px}
      .community-media-counter{position:absolute;bottom:-28px;left:50%;transform:translateX(-50%);color:rgba(255,255,255,.82);font-size:12px}
      @media(max-width:700px){.media-grid.community-media-compact{gap:6px}.community-media-thumb{height:105px;border-radius:11px}.community-media-thumb.single{height:180px}.community-media-lightbox{padding:12px}.community-media-viewer{width:100%;height:82vh}.community-media-prev{left:4px}.community-media-next{right:4px}.community-media-close{top:4px;right:4px}}
    `; document.head.appendChild(s);
  }

  function removeTagUi(){
    document.querySelectorAll('#islamicTagPanel,#tagFilterBar,.islamic-tag-panel,.tag-filter-bar,.post-tags').forEach(el=>el.remove());
  }

  function collectMedia(card){return [...card.querySelectorAll('.media-item')].filter(el=>el.tagName==='IMG'||el.tagName==='VIDEO');}
  let viewer=null,stage=null,counter=null,prev=null,next=null,currentItems=[],currentIndex=0;

  function ensureViewer(){
    if(viewer)return;
    viewer=document.createElement('div'); viewer.className='community-media-lightbox'; viewer.hidden=true;
    viewer.innerHTML='<div class="community-media-viewer" role="dialog" aria-modal="true" aria-label="Media viewer"><button type="button" class="community-media-close" aria-label="Close">×</button><button type="button" class="community-media-nav community-media-prev" aria-label="Previous">‹</button><div class="community-media-stage"></div><button type="button" class="community-media-nav community-media-next" aria-label="Next">›</button><div class="community-media-counter"></div></div>';
    document.body.appendChild(viewer); stage=viewer.querySelector('.community-media-stage'); counter=viewer.querySelector('.community-media-counter'); prev=viewer.querySelector('.community-media-prev'); next=viewer.querySelector('.community-media-next');
    viewer.querySelector('.community-media-close').onclick=closeViewer;
    viewer.onclick=e=>{if(e.target===viewer)closeViewer()};
    prev.onclick=e=>{e.stopPropagation();showViewer(currentIndex-1)}; next.onclick=e=>{e.stopPropagation();showViewer(currentIndex+1)};
    document.addEventListener('keydown',e=>{if(!viewer||viewer.hidden)return;if(e.key==='Escape')closeViewer();if(e.key==='ArrowLeft')showViewer(currentIndex-1);if(e.key==='ArrowRight')showViewer(currentIndex+1)});
  }

  function showViewer(index){
    if(!currentItems.length)return;
    currentIndex=(index+currentItems.length)%currentItems.length;
    const source=currentItems[currentIndex],src=source.currentSrc||source.src;
    stage.innerHTML=''; if(!src)return;
    let media;
    if(source.tagName==='VIDEO'){media=document.createElement('video');media.controls=true;media.autoplay=true;media.playsInline=true}else{media=document.createElement('img');media.alt=source.alt||'Post media'}
    media.src=src; stage.appendChild(media); counter.textContent=`${currentIndex+1} / ${currentItems.length}`;
    prev.style.display=next.style.display=currentItems.length>1?'':'none';
  }

  function openViewer(card,index){ensureViewer();currentItems=collectMedia(card);if(!currentItems.length)return;viewer.hidden=false;document.body.style.overflow='hidden';showViewer(Number(index)||0)}
  function closeViewer(){if(!viewer)return;viewer.hidden=true;stage.innerHTML='';document.body.style.overflow=''}

  function compactMedia(card){
    const grid=card.querySelector('.media-grid'); if(!grid||grid.dataset.compactMedia==='1')return;
    const items=collectMedia(card); if(!items.length)return;
    grid.dataset.compactMedia='1';grid.classList.add('community-media-compact');
    items.forEach((item,index)=>{item.classList.add('community-media-thumb');if(items.length===1)item.classList.add('single');item.dataset.mediaIndex=String(index);item.setAttribute('role','button');item.setAttribute('aria-label','Open media');if(item.tagName==='VIDEO'){item.controls=false;item.preload='metadata'}});
    if(items.length>4){items.slice(4).forEach(item=>item.style.display='none');const more=document.createElement('div');more.className='community-media-more';more.dataset.more=`+${items.length-4}`;more.dataset.mediaIndex='4';const clone=items[4].cloneNode(true);clone.style.display='';more.appendChild(clone);grid.appendChild(more)}
  }

  function wireMedia(){
    document.querySelectorAll('[data-post]').forEach(card=>{compactMedia(card);card.querySelectorAll('.community-media-thumb,.community-media-more').forEach(item=>{if(item.dataset.mediaWired==='1')return;item.dataset.mediaWired='1';item.onclick=e=>{e.preventDefault();e.stopPropagation();openViewer(card,item.dataset.mediaIndex||0)}})});
  }

  function init(){
    injectStyles();removeTagUi();wireMedia();
    const feed=$('feed');
    if(feed&&!feed.dataset.communityCleanupObserver){
      feed.dataset.communityCleanupObserver='1';
      new MutationObserver(()=>{removeTagUi();wireMedia()}).observe(feed,{childList:true,subtree:true});
    }
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();
  setInterval(()=>{removeTagUi();wireMedia()},1500);
})();
