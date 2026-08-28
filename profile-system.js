/* OneMuslim Profile System v7
 * Central source of truth for ranks, XP tiers, avatar packages, and profile defaults.
 * Keep this module dependency-free and backwards-compatible with existing callers.
 */
(function () {
  "use strict";

  const RANKS = Object.freeze([
    "Muslim",
    "Mu'min",
    "Expert",
    "Da'wah Expert",
    "Elite Sheikh",
    "Platinum Muhsin"
  ]);

  // XP progression: Platinum is 10K, Gold is the next major tier at 50K.
  const XP_TIERS = Object.freeze([
    Object.freeze({
      id: "base",
      label: "Muslim",
      minXP: 0,
      className: "tier-base",
      accent: "#1f6a55",
      text: "#20352c"
    }),
    Object.freeze({
      id: "platinum",
      label: "Platinum",
      minXP: 10000,
      className: "tier-platinum",
      accent: "#bfc5cc",
      text: "#26313a"
    }),
    Object.freeze({
      id: "gold",
      label: "Gold",
      minXP: 50000,
      className: "tier-gold",
      accent: "#d4af37",
      text: "#4a3810"
    }),
    Object.freeze({
      id: "diamond",
      label: "Diamond",
      minXP: 250000,
      className: "tier-diamond",
      accent: "#8fd3ff",
      text: "#17364a"
    })
  ]);

  const PLATINUM_XP = XP_TIERS[1].minXP;
  const GOLD_XP = XP_TIERS[2].minXP;
  const DIAMOND_XP = XP_TIERS[3].minXP;

  const ASSET_ROOT = "/assets/avatars/";
  const AVATAR_ASSETS = Object.freeze({
    male: `${ASSET_ROOT}platinum-male.PNG`,
    female: `${ASSET_ROOT}platinum-female.PNG`
  });

  const PROFILE_DEFAULTS = Object.freeze({
    avatar_gender: "male",
    avatar_base: "default",
    avatar_package: "default",
    avatar_asset: null,
    avatar_accessory: "none",
    avatar_ring: "default",
    profile_banner: "default",
    profile_background: "default",
    profile_accent: "emerald",
    profile_title: "Muslim",
    custom_photo: null,
    unlocked_packages: ["default"]
  });

  const UNLOCK_RULES = Object.freeze({
    default: { type: "everyone" },
    basic_backgrounds: { type: "everyone" },
    basic_customization: { type: "everyone" },
    platinum_package: { type: "xp", minXP: PLATINUM_XP },
    platinum_background: { type: "xp", minXP: PLATINUM_XP },
    gold_package: { type: "xp", minXP: GOLD_XP },
    gold_background: { type: "xp", minXP: GOLD_XP },
    diamond_package: { type: "xp", minXP: DIAMOND_XP },
    diamond_background: { type: "xp", minXP: DIAMOND_XP },
    elite_package: { type: "rank", minRank: "Elite Sheikh" },
    custom_photo: { type: "rank", minRank: "Platinum Muhsin" }
  });

  function rankIndex(title) {
    const index = RANKS.indexOf(title);
    return index < 0 ? 0 : index;
  }

  function xpOf(profile) {
    return Number(
      profile?.xp_total ??
      profile?.xp ??
      profile?.rank_points ??
      profile?.points ??
      0
    ) || 0;
  }

  function normalize(profile) {
    const source = profile || {};
    const p = Object.assign({}, PROFILE_DEFAULTS, source);
    p.xp = xpOf(source);
    p.unlocked_packages = Array.from(new Set([
      "default",
      ...(Array.isArray(source.unlocked_packages) ? source.unlocked_packages : [])
    ]));
    if (p.avatar_package === "platinum_package") {
      p.avatar_asset = AVATAR_ASSETS[p.avatar_gender] || null;
    }
    return p;
  }

  function getTier(profile) {
    const xp = xpOf(profile);
    let tier = XP_TIERS[0];
    for (const candidate of XP_TIERS) {
      if (xp >= candidate.minXP) tier = candidate;
    }
    return tier;
  }

  function getTierProgress(profile) {
    const xp = xpOf(profile);
    const tier = getTier(profile);
    const next = XP_TIERS[XP_TIERS.indexOf(tier) + 1] || null;
    return Object.freeze({
      tier,
      nextTier: next,
      xp,
      toNext: next ? Math.max(0, next.minXP - xp) : 0,
      percent: next
        ? Math.min(100, Math.max(0, ((xp - tier.minXP) / (next.minXP - tier.minXP)) * 100))
        : 100
    });
  }

  function isUnlocked(feature, profile) {
    const rule = UNLOCK_RULES[feature];
    if (!rule) return false;
    const p = normalize(profile);
    if (p.unlocked_packages.includes(feature)) return true;
    if (rule.type === "everyone") return true;
    if (rule.type === "xp") return xpOf(p) >= rule.minXP;
    return rankIndex(p.profile_title) >= rankIndex(rule.minRank);
  }

  function isPlatinumUnlocked(profile) {
    return xpOf(profile) >= PLATINUM_XP;
  }

  function isGoldUnlocked(profile) {
    return xpOf(profile) >= GOLD_XP;
  }

  function isDiamondUnlocked(profile) {
    return xpOf(profile) >= DIAMOND_XP;
  }

  function getAvatarAsset(profile) {
    const p = normalize(profile);
    if (p.avatar_package === "platinum_package" && isPlatinumUnlocked(p)) {
      return AVATAR_ASSETS[p.avatar_gender] || null;
    }
    return null;
  }

  function getNewlyUnlocked(profile) {
    const p = normalize(profile);
    return Object.keys(UNLOCK_RULES).filter(feature => isUnlocked(feature, p));
  }

  function applyUnlocks(profile) {
    const p = normalize(profile);
    p.unlocked_packages = Array.from(new Set([
      ...p.unlocked_packages,
      ...getNewlyUnlocked(p)
    ]));
    return p;
  }

  window.OneMuslimProfileSystem = Object.freeze({
    RANKS,
    XP_TIERS,
    PLATINUM_XP,
    GOLD_XP,
    DIAMOND_XP,
    AVATAR_ASSETS,
    PROFILE_DEFAULTS,
    UNLOCK_RULES,
    normalize,
    rankIndex,
    xpOf,
    getTier,
    getTierProgress,
    isPlatinumUnlocked,
    isGoldUnlocked,
    isDiamondUnlocked,
    isUnlocked,
    getAvatarAsset,
    getNewlyUnlocked,
    applyUnlocks
  });
})();
