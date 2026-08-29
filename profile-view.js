/* OneMuslim Profile View v1
 * Presentation-only layer for the authenticated user's My Profile page.
 * Reads the saved profile settings and keeps the editor as the source of truth.
 */
(function () {
  'use strict';

  const BG = Object.freeze({
    default: 'linear-gradient(135deg,#f7efdd 0%,#e9d9b5 48%,#dce9e1 100%)',
    'Islamic Geometry': 'linear-gradient(135deg,#fbf5e8 0%,#f1e6cf 52%,#dfe9e2 100%)',
    'Mosque Silhouette': 'linear-gradient(135deg,#f7ecd6 0%,#ead8b5 55%,#d6e5de 100%)',
    'Islamic Arch': 'linear-gradient(135deg,#f8f2e5 0%,#e9dfcc 55%,#dbe7e0 100%)',
    'Crescent & Stars': 'linear-gradient(135deg,#0b2a24 0%,#123e34 55%,#1f5c4b 100%)',
    'Luxury Gold': 'linear-gradient(135deg,#fff8e8 0%,#e6c96f 48%,#b98924 100%)',
    Emerald: 'linear-gradient(135deg,#0b4034 0%,#145f4d 55%,#1f8065 100%)',
    'Dark Mosque': 'linear-gradient(135deg,#061c18 0%,#0e3028 55%,#19483b 100%)',
    'Minimal Cream': 'linear-gradient(135deg,#fffdf8 0%,#f4f0e7 100%)'
  });

  const DARK = new Set(['Crescent & Stars', 'Emerald', 'Dark Mosque']);
  const esc = s => String(s ?? '').replace(/[&<>"']/g, m => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#039;' }[m]));
  const initials = name => (String(name || 'M').trim().split(/\s+/).map(x => x[0]).join('').slice(0,2) || 'M').toUpperCase();

  function getProfile() {
    return window.OneMuslimProfileSystem?.normalize(window.profile || {}) || { ...(window.profile || {}) };
  }

  function backgroundFor(p) {
    return BG[p.profile_background] || BG.default;
  }

  function render() {
    const host = document.getElementById('profilePanel');
    if (!host) return;
    const p = getProfile();
    const bgName = p.profile_background || 'default';
    const dark = DARK.has(bgName);
    const text = dark ? '#fff' : '#183128';
    const muted = dark ? 'rgba(255,255,255,.78)' : '#64756d';
    const accent = p.profile_accent === 'gold' ? '#c89d3c' : p.profile_accent === 'navy' ? '#243b62' : p.profile_accent === 'plum' ? '#70536f' : p.profile_accent === 'ruby' ? '#a34d52' : '#1f6a55';
    const tier = window.OneMuslimProfileSystem?.getTier?.(p) || { label: 'Muslim', minXP: 0, accent: '#1f6a55' };
    const xp = window.OneMuslimProfileSystem?.xpOf?.(p) || 0;
    const avatarSrc = window.OneMuslimProfileSystem?.getAvatarAsset?.(p) || p.avatar_asset || '';
    const name = p.display_name || p.full_name || 'Your Name';
    const username = p.username || 'username';
    const title = p.profile_title || 'Muslim';
    const bio = p.bio || 'Tell the community a little about yourself.';
    const location = p.location || 'Location not set';
    const group = p.group_team || 'No community selected';

    host.innerHTML = `<article class="om-my-profile-card" style="--om-accent:${accent};--om-text:${text};--om-muted:${muted};--om-bg:${backgroundFor(p)}">
      <div class="om-my-profile-banner"><span class="om-my-profile-style">${esc(bgName === 'default' ? 'YOUR PROFILE' : bgName.toUpperCase())}</span><span class="om-my-profile-tier">${esc(tier.label)} · ${xp.toLocaleString()} XP</span></div>
      <div class="om-my-profile-body">
        <div class="om-my-profile-avatar">${avatarSrc ? `<img src="/${esc(String(avatarSrc).replace(/^\//,''))}" alt="${esc(name)} avatar">` : `<span>${esc(initials(name))}</span>`}</div>
        <div class="om-my-profile-identity"><h3>${esc(name)}</h3><p>@${esc(username)} · ${esc(title)}</p></div>
        <div class="om-my-profile-bio">${esc(bio)}</div>
        <div class="om-my-profile-meta"><span>📍 ${esc(location)}</span><span>◉ ${esc(group)}</span></div>
        <div class="om-my-profile-stats"><div><strong>${xp.toLocaleString()}</strong><small>XP</small></div><div><strong>${esc(tier.label)}</strong><small>Tier</small></div><div><strong>${esc(p.profile_visibility === 'private' ? 'Private' : 'Public')}</strong><small>Visibility</small></div></div>
        <button class="om-my-profile-edit" type="button" id="omMyProfileEdit">Edit profile</button>
      </div>
    </article>`;
    host.querySelector('#omMyProfileEdit')?.addEventListener('click', () => document.getElementById('editProfile')?.click());
  }

  function observe() {
    const page = document.getElementById('profilePage');
    if (!page) return;
    let lastSignature = '';
    const tick = () => {
      const p = getProfile();
      const sig = JSON.stringify([p.id,p.profile_background,p.profile_accent,p.avatar_package,p.avatar_asset,p.display_name,p.username,p.bio,p.location,p.group_team,p.profile_visibility,window.OneMuslimProfileSystem?.xpOf?.(p)]);
      const visible = !page.classList.contains('hidden');
      if (visible && sig !== lastSignature) { lastSignature = sig; render(); }
    };
    tick();
    new MutationObserver(tick).observe(page, { attributes:true, childList:true, subtree:true });
    window.setInterval(tick, 1500);
    window.renderMyProfileView = render;
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', observe); else observe();
})();
