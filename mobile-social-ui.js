(() => {
  'use strict';

  const $ = id => document.getElementById(id);
  const esc = s => String(s ?? '').replace(/[&<>"']/g, m => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[m]));
  const toast = msg => typeof window.toast === 'function' ? window.toast(msg) : null;

  function addStyles() {
    if ($('mobileSocialStyles')) return;
    const style = document.createElement('style');
    style.id = 'mobileSocialStyles';
    style.textContent = `
      .om-mobile-bottom-nav{display:none}
      .om-create-overlay{display:none;position:fixed;inset:0;z-index:10000;background:rgba(5,15,31,.58);backdrop-filter:blur(12px);align-items:flex-end;justify-content:center}
      .om-create-sheet{width:min(680px,100%);max-height:92vh;overflow:auto;background:#fff;border-radius:26px 26px 0 0;box-shadow:0 -18px 50px rgba(0,0,0,.24);padding:20px;box-sizing:border-box}
      .om-create-top{display:flex;align-items:center;justify-content:space-between;margin-bottom:18px}
      .om-create-top h2{margin:0;color:#16233b;font-size:22px}
      .om-create-close{border:0;background:#eef3f9;border-radius:50%;width:38px;height:38px;font-size:22px;cursor:pointer;color:#16233b}
      .om-create-author{display:flex;align-items:center;gap:11px;margin-bottom:14px;color:#16233b}
      .om-create-author .avatar{width:42px;height:42px;min-width:42px}
      .om-create-visibility{border:1px solid #dce5f0;border-radius:10px;background:#fff;padding:7px 10px;color:#52627a;font-size:12px;margin-left:auto}
      .om-create-text{width:100%;min-height:150px;resize:vertical;box-sizing:border-box;border:1px solid #dce5f0;border-radius:16px;padding:15px;font:inherit;font-size:16px;color:#16233b;outline:none}
      .om-create-text:focus{border-color:#2474ff;box-shadow:0 0 0 3px rgba(36,116,255,.1)}
      .om-create-tools{display:grid;grid-template-columns:1fr 1fr 1fr;gap:9px;margin:13px 0}
      .om-create-media-btn{border:1px solid #dce5f0;background:#f7faff;border-radius:12px;padding:12px;cursor:pointer;font-weight:700;color:#243653;text-align:center}
      .om-create-media-btn:hover{border-color:#2474ff}
      .om-create-preview{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:9px;margin:8px 0 15px}
      .om-create-preview:empty{display:none}
      .om-create-preview img,.om-create-preview video{width:100%;height:150px;object-fit:cover;border-radius:13px;background:#edf2f8}
      .om-create-bottom{display:flex;align-items:center;gap:12px;justify-content:flex-end}
      .om-create-count{margin-right:auto;color:#7b8aa0;font-size:12px}
      .om-create-post{border:0;border-radius:12px;padding:12px 22px;background:#2474ff;color:#fff;font-weight:800;cursor:pointer}
      .om-create-post:disabled{opacity:.55;cursor:not-allowed}
      @media(max-width:700px){
        .om-mobile-bottom-nav{position:fixed;display:grid;grid-template-columns:1fr 1fr 1.15fr 1fr 1fr;left:0;right:0;bottom:0;height:72px;z-index:8000;background:rgba(8,24,46,.97);border-top:1px solid rgba(255,255,255,.12);padding:7px 8px calc(7px + env(safe-area-inset-bottom));box-sizing:border-box;box-shadow:0 -8px 25px rgba(0,0,0,.18)}
        .om-mobile-nav-item{border:0;background:transparent;color:#dbe7f7;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:3px;font-size:10px;font-weight:700;cursor:pointer;min-width:0}
        .om-mobile-nav-item .om-nav-icon{font-size:21px;line-height:21px}
        .om-mobile-nav-item.active{color:#fff}
        .om-mobile-create{position:relative;transform:translateY(-14px)}
        .om-mobile-create .om-nav-icon{width:54px;height:54px;border-radius:50%;display:flex;align-items:center;justify-content:center;background:#2474ff;border:3px solid #fff;box-shadow:0 6px 18px rgba(36,116,255,.42);font-size:31px;color:#fff}
        body{padding-bottom:76px}
        .om-create-overlay{align-items:flex-end}
        .om-create-sheet{padding:17px 16px calc(18px + env(safe-area-inset-bottom));max-height:94vh;border-radius:24px 24px 0 0}
        .om-create-tools{grid-template-columns:1fr 1fr 1fr}
        .om-create-media-btn{font-size:12px;padding:11px 6px}
        .om-create-preview img,.om-create-preview video{height:120px}
      }
      @media(min-width:701px){.om-create-overlay{display:none!important}}
    `;
    document.head.appendChild(style);
  }

  function currentDisplayName() {
    const mini = document.querySelector('#miniProfile b');
    return mini?.textContent?.trim() || 'Member';
  }

  function currentInitials() {
    const text = currentDisplayName();
    return text.split(/\s+/).filter(Boolean).map(x => x[0]).join('').slice(0,2).toUpperCase() || 'M';
  }

  function createOverlay() {
    if ($('omCreateOverlay')) return;
    document.body.insertAdjacentHTML('beforeend', `
      <div class="om-create-overlay" id="omCreateOverlay" role="dialog" aria-modal="true" aria-label="Create post">
        <div class="om-create-sheet">
          <div class="om-create-top"><h2>Create Post</h2><button type="button" class="om-create-close" id="omCreateClose" aria-label="Close">×</button></div>
          <div class="om-create-author"><span class="avatar" id="omCreateAvatar">M</span><div><b id="omCreateName">Member</b><div style="font-size:11px;color:#7b8aa0">Share with the OneMuslim community</div></div><span class="om-create-visibility">🌐 Public</span></div>
          <textarea id="omCreateText" class="om-create-text" maxlength="500" placeholder="Share something with the community…"></textarea>
          <div class="om-create-tools">
            <label class="om-create-media-btn">🖼️ Photo<input id="omCreatePhoto" type="file" accept="image/*" multiple hidden></label>
            <label class="om-create-media-btn">🎥 Video<input id="omCreateVideo" type="file" accept="video/*" multiple hidden></label>
            <button type="button" class="om-create-media-btn" id="omCreateFile">📎 Add media</button>
          </div>
          <input id="omCreateFileInput" type="file" accept="image/*,video/*" multiple hidden>
          <div id="omCreatePreview" class="om-create-preview"></div>
          <div class="om-create-bottom"><span id="omCreateCount" class="om-create-count">0/500</span><button type="button" class="om-create-post" id="omCreatePost">Post</button></div>
        </div>
      </div>
    `);

    $('omCreateClose').onclick = closeCreate;
    $('omCreateOverlay').addEventListener('click', e => { if (e.target.id === 'omCreateOverlay') closeCreate(); });
    $('omCreateText').oninput = () => updateCreateState();
    $('omCreatePhoto').onchange = e => adoptFiles(e.target.files);
    $('omCreateVideo').onchange = e => adoptFiles(e.target.files);
    $('omCreateFile').onclick = () => $('omCreateFileInput').click();
    $('omCreateFileInput').onchange = e => adoptFiles(e.target.files);
    $('omCreatePost').onclick = publishFromCreate;
  }

  let selectedFiles = [];

  function adoptFiles(files) {
    selectedFiles = [...files];
    if (selectedFiles.length > 4) {
      selectedFiles = selectedFiles.slice(0,4);
      toast('Choose up to 4 photos or videos.');
    }
    if (selectedFiles.some(f => f.size > 50 * 1024 * 1024)) {
      toast('Each photo or video must be 50 MB or smaller.');
      selectedFiles = selectedFiles.filter(f => f.size <= 50 * 1024 * 1024);
    }
    renderPreview();
    updateCreateState();
  }

  function renderPreview() {
    const box = $('omCreatePreview');
    if (!box) return;
    box.innerHTML = '';
    selectedFiles.forEach(file => {
      const url = URL.createObjectURL(file);
      const node = /^video\//.test(file.type) ? document.createElement('video') : document.createElement('img');
      node.src = url;
      node.controls = /^video\//.test(file.type);
      node.muted = true;
      node.playsInline = true;
      node.onload = node.onloadeddata = () => URL.revokeObjectURL(url);
      box.appendChild(node);
    });
  }

  function updateCreateState() {
    const text = $('omCreateText')?.value || '';
    if ($('omCreateCount')) $('omCreateCount').textContent = `${text.length}/500`;
    if ($('omCreatePost')) $('omCreatePost').disabled = !text.trim() && !selectedFiles.length;
  }

  function openCreate() {
    createOverlay();
    $('omCreateName').textContent = currentDisplayName();
    $('omCreateAvatar').textContent = currentInitials();
    $('omCreateText').value = '';
    selectedFiles = [];
    $('omCreatePreview').innerHTML = '';
    updateCreateState();
    $('omCreateOverlay').style.display = 'flex';
    setTimeout(() => $('omCreateText')?.focus(), 30);
  }

  function closeCreate() {
    if ($('omCreateOverlay')) $('omCreateOverlay').style.display = 'none';
    selectedFiles = [];
  }

  function copyFilesToExistingComposer() {
    const target = $('postMedia');
    if (!target || !selectedFiles.length) return false;
    try {
      const transfer = new DataTransfer();
      selectedFiles.forEach(file => transfer.items.add(file));
      target.files = transfer.files;
      target.dispatchEvent(new Event('change', { bubbles:true }));
      return true;
    } catch (e) {
      console.warn('Could not transfer selected media:', e);
      return false;
    }
  }

  function publishFromCreate() {
    const text = $('omCreateText')?.value.trim() || '';
    if (!text && !selectedFiles.length) return;
    if (text.length > 500) { toast('Keep posts to 500 characters or less.'); return; }
    const composer = $('postText');
    const publishButton = $('publish');
    if (!composer || !publishButton) { toast('The post composer is not ready yet.'); return; }
    composer.value = text;
    composer.dispatchEvent(new Event('input', { bubbles:true }));
    if (selectedFiles.length && !copyFilesToExistingComposer()) { toast('Could not attach the selected media. Please try again.'); return; }
    closeCreate();
    publishButton.click();
  }

  function navigate(page) {
    const side = document.querySelector(`.side[data-page="${page}"]`);
    if (side) { side.click(); return; }
    const top = document.querySelector(`.app-nav-link[data-page="${page}"]`);
    if (top) top.click();
  }

  function addBottomNav() {
    if (document.querySelector('.om-mobile-bottom-nav')) return;
    document.body.insertAdjacentHTML('beforeend', `
      <nav class="om-mobile-bottom-nav" aria-label="Mobile navigation">
        <button type="button" class="om-mobile-nav-item" data-mobile-page="public-home"><span class="om-nav-icon">⌂</span><span>Home</span></button>
        <button type="button" class="om-mobile-nav-item" data-mobile-page="profiles"><span class="om-nav-icon">♧</span><span>People</span></button>
        <button type="button" class="om-mobile-nav-item om-mobile-create" id="omMobileCreate"><span class="om-nav-icon">+</span><span>Create</span></button>
        <button type="button" class="om-mobile-nav-item" data-mobile-page="messages"><span class="om-nav-icon">▢</span><span>Messages</span></button>
        <button type="button" class="om-mobile-nav-item" data-mobile-page="profile"><span class="om-nav-icon">♙</span><span>Profile</span></button>
      </nav>
    `);
    document.querySelectorAll('[data-mobile-page]').forEach(button => {
      button.onclick = () => {
        const page = button.dataset.mobilePage;
        if (page === 'messages' && document.querySelector('[data-social-page="messages"]')) {
          document.querySelector('[data-social-page="messages"]').click();
        } else navigate(page);
        updateActiveNav(page);
      };
    });
    $('omMobileCreate').onclick = openCreate;
  }

  function updateActiveNav(page) {
    document.querySelectorAll('[data-mobile-page]').forEach(x => x.classList.toggle('active', x.dataset.mobilePage === page));
  }

  function watchPageChanges() {
    const observer = new MutationObserver(() => {
      const visible = [...document.querySelectorAll('.page')].find(p => !p.classList.contains('hidden'));
      if (!visible) return;
      const id = visible.id;
      const page = id.replace(/Page$/, '');
      if (page === 'feed') updateActiveNav('public-home');
      else if (page === 'profiles' || page === 'profile' || page === 'lessons') updateActiveNav(page === 'profile' ? 'profile' : page === 'profiles' ? 'profiles' : 'public-home');
      else if (page === 'messages') updateActiveNav('messages');
    });
    observer.observe(document.body, {childList:true, subtree:true, attributes:true, attributeFilter:['class']});
  }

  function init() {
    addStyles();
    createOverlay();
    addBottomNav();
    watchPageChanges();
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init, {once:true});
  else init();
})();
