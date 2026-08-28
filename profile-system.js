/* OneMuslim Profile System v1
 * Foundation only: data model + unlock rules.
 * UI and storage integrations can consume this without changing existing screens.
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

  const PROFILE_DEFAULTS = Object.freeze({
    avatar_gender: "male",
    avatar_base: "default",
    avatar_package: "default",
    avatar_accessory: "none",
    avatar_ring: "default",
    profile_banner: "default",
    profile_background: "default",
    profile_accent: "emerald",
    profile_title: "Muslim",
    custom_photo: null,
    unlocked_packages: ["default"]
  });

  // Package access is rank-based for now. Exact XP thresholds can be added later
  // without changing the profile data model.
  const UNLOCK_RULES = Object.freeze({
    default: { type: "everyone" },
    basic_backgrounds: { type: "everyone" },
    basic_customization: { type: "everyone" },
    gold_package: { type: "rank", minRank: "Expert" },
    elite_package: { type: "rank", minRank: "Elite Sheikh" },
    platinum_package: { type: "rank", minRank: "Platinum Muhsin" },
    custom_photo: { type: "rank", minRank: "Platinum Muhsin" }
  });

  function rankIndex(title) {
    const i = RANKS.indexOf(title);
    return i < 0 ? 0 : i;
  }

  function normalize(profile) {
    return Object.assign({}, PROFILE_DEFAULTS, profile || {}, {
      unlocked_packages: Array.from(new Set([
        "default",
        ...((profile && profile.unlocked_packages) || [])
      ]))
    });
  }

  function isUnlocked(feature, profile) {
    const rule = UNLOCK_RULES[feature];
    if (!rule) return false;
    if (rule.type === "everyone") return true;

    const p = normalize(profile);
    if (p.unlocked_packages.includes(feature)) return true;
    return rankIndex(p.profile_title) >= rankIndex(rule.minRank);
  }

  // Returns the features that should be permanently recorded as unlocked.
  function getNewlyUnlocked(profile) {
    const p = normalize(profile);
    return Object.keys(UNLOCK_RULES).filter(feature => isUnlocked(feature, p));
  }

  // Once a feature is unlocked it stays in unlocked_packages. This intentionally
  // does not remove anything when a profile is edited or migrated.
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
    PROFILE_DEFAULTS,
    UNLOCK_RULES,
    normalize,
    rankIndex,
    isUnlocked,
    getNewlyUnlocked,
    applyUnlocks
  });
})();
