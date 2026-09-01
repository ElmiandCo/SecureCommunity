/* OneMuslim XP Tier UI
 * Presentation-only layer. Unlock authority stays in profile-system.js.
 * This keeps tier thresholds centralized and the visual treatment reusable.
 */
(function () {
  "use strict";

  const loadProfileView = () => {
    if (!document.querySelector('link[href="profile-view.css"]')) {
      const link = document.createElement("link");
      link.rel = "stylesheet";
      link.href = "profile-view.css";
      document.head.appendChild(link);
    }
    if (!document.querySelector('script[src^="profile-view.js"]')) {
      const script = document.createElement("script");
      script.src = "profile-view.js?v=20260901-02";
      script.defer = true;
      document.body.appendChild(script);
    }
  };

  const boot = () => {
    const system = window.OneMuslimProfileSystem;
    if (!system || document.getElementById("om-tier-ui-styles")) return;

    loadProfileView();

    const style = document.createElement("style");
    style.id = "om-tier-ui-styles";
    style.textContent = `
      .om-xp-tier {
        display:inline-flex;
        align-items:center;
        gap:6px;
        padding:4px 9px;
        border-radius:999px;
        font-size:10px;
        font-weight:800;
        letter-spacing:.04em;
        border:1px solid currentColor;
        white-space:nowrap;
      }
      .om-xp-tier::before { content:"✦"; font-size:9px; }
      .om-xp-tier.tier-base { color:#1f6a55; background:#edf6f1; }
      .om-xp-tier.tier-platinum {
        color:#4f5963;
        background:linear-gradient(135deg,#f8f9fa,#d9dde2,#ffffff);
        border-color:#aeb5bd;
        box-shadow:0 0 14px rgba(191,197,204,.55), inset 0 1px rgba(255,255,255,.95);
      }
      .om-xp-tier.tier-gold {
        color:#6b4d05;
        background:linear-gradient(135deg,#fff8d9,#d4af37,#fff2b2);
        border-color:#c49a22;
        box-shadow:0 0 16px rgba(212,175,55,.5), inset 0 1px rgba(255,255,255,.95);
      }
      .om-xp-tier.tier-diamond {
        color:#15506f;
        background:linear-gradient(135deg,#effaff,#aee2ff,#ffffff);
        border-color:#76c5ed;
        box-shadow:0 0 16px rgba(143,211,255,.5), inset 0 1px rgba(255,255,255,.95);
      }
      .om-tier-card {
        margin-top:14px;
        padding:14px;
        border:1px solid #e5e1d7;
        border-radius:14px;
        background:linear-gradient(135deg,#fffaf0,#f5ead3);
      }
      .om-tier-card h4 { margin:0 0 5px; font-size:13px; }
      .om-tier-card p { margin:0 0 10px; font-size:11px; color:#65766f; }
      .om-tier-list { display:flex; flex-wrap:wrap; gap:7px; }
      .om-tier-item { font-size:10px; font-weight:700; color:#53635b; }
      .om-tier-item b { color:#24382f; }
      .om-pb-preview-tier { margin-top:7px; }
    `;
    document.head.appendChild(style);

    const getProfile = () => window.profile || {};

    const tierBadge = () => {
      const tier = system.getTier(getProfile());
      return `<span class="om-xp-tier ${tier.className}">${tier.label}</span>`;
    };

    const refreshPreview = () => {
      const preview = document.querySelector(".om-pb-preview-meta");
      if (!preview?.parentElement) return;
      let badge = preview.parentElement.querySelector(".om-pb-preview-tier");
      if (!badge) {
        badge = document.createElement("div");
        badge.className = "om-pb-preview-tier";
        preview.parentElement.appendChild(badge);
      }
      const html = tierBadge();
      if (badge.innerHTML !== html) badge.innerHTML = html;
    };

    const injectTierCard = () => {
      const panel = document.querySelector('.om-pb-panel[data-panel="style"]');
      if (!panel || panel.querySelector(".om-tier-card")) return;

      const progress = system.getTierProgress(getProfile());
      const next = progress.nextTier;
      const nextCopy = next
        ? `${progress.toNext.toLocaleString()} XP to ${next.label}`
        : "Highest visual tier reached";

      const card = document.createElement("div");
      card.className = "om-tier-card";
      card.innerHTML = `
        <h4>XP Prestige Tiers</h4>
        <p>${nextCopy}. Your tier is earned automatically from XP.</p>
        <div class="om-tier-list">
          <span class="om-tier-item"><b>10,000</b> Platinum</span>
          <span class="om-tier-item"><b>50,000</b> Gold</span>
          <span class="om-tier-item"><b>250,000</b> Diamond</span>
        </div>`;
      panel.appendChild(card);
    };

    let scheduled = false;
    const render = () => {
      scheduled = false;
      refreshPreview();
      injectTierCard();
    };

    const observer = new MutationObserver(() => {
      if (scheduled) return;
      scheduled = true;
      requestAnimationFrame(render);
    });
    observer.observe(document.body, { childList: true, subtree: true });
    render();
  };

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot, { once: true });
  } else {
    boot();
  }
})();
