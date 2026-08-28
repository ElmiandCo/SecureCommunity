/* OneMuslim Profile System v2
 * Avatar packages + explicit XP unlock rules.
 */
(function () {
  "use strict";
  const RANKS = Object.freeze(["Muslim","Mu'min","Expert","Da'wah Expert","Elite Sheikh","Platinum Muhsin"]);
  const PLATINUM_XP = 10000;
  const AVATAR_ASSETS = Object.freeze({
    male: "assets/avatars/platinum-male.PNG",
    female: "assets/avatars/platinum-female.PNG"
  });
  const PROFILE_DEFAULTS = Object.freeze({
    avatar_gender:"male", avatar_base:"default", avatar_package:"default", avatar_accessory:"none", avatar_ring:"default",
    avatar_asset:null, profile_banner:"default", profile_background:"default", profile_accent:"emerald", profile_title:"Muslim",
    custom_photo:null, unlocked_packages:["default"]
  });
  const UNLOCK_RULES = Object.freeze({
    default:{type:"everyone"}, basic_backgrounds:{type:"everyone"}, basic_customization:{type:"everyone"},
    gold_package:{type:"rank",minRank:"Expert"}, elite_package:{type:"rank",minRank:"Elite Sheikh"},
    platinum_package:{type:"xp",minXP:PLATINUM_XP}, custom_photo:{type:"xp",minXP:PLATINUM_XP}
  });
  function rankIndex(title){const i=RANKS.indexOf(title);return i<0?0:i;}
  function xpOf(profile){return Number(profile?.xp ?? profile?.rank_points ?? profile?.points ?? 0)||0;}
  function normalize(profile){const p=Object.assign({},PROFILE_DEFAULTS,profile||{});p.xp=xpOf(p);p.unlocked_packages=Array.from(new Set(["default",...(profile?.unlocked_packages||[])]));if(p.avatar_package==="platinum_package")p.avatar_asset=AVATAR_ASSETS[p.avatar_gender]||null;return p;}
  function isPlatinumUnlocked(profile){return xpOf(profile)>=PLATINUM_XP;}
  function isUnlocked(feature,profile){const rule=UNLOCK_RULES[feature];if(!rule)return false;if(rule.type==="everyone")return true;const p=normalize(profile);if(p.unlocked_packages.includes(feature))return true;if(rule.type==="xp")return xpOf(p)>=rule.minXP;return rankIndex(p.profile_title)>=rankIndex(rule.minRank);}
  function getAvatarAsset(profile){const p=normalize(profile);return p.avatar_package==="platinum_package"&&isPlatinumUnlocked(p)?AVATAR_ASSETS[p.avatar_gender]||null:null;}
  function getNewlyUnlocked(profile){const p=normalize(profile);return Object.keys(UNLOCK_RULES).filter(feature=>isUnlocked(feature,p));}
  function applyUnlocks(profile){const p=normalize(profile);p.unlocked_packages=Array.from(new Set([...p.unlocked_packages,...getNewlyUnlocked(p)]));return p;}
  window.OneMuslimProfileSystem=Object.freeze({RANKS,PLATINUM_XP,AVATAR_ASSETS,PROFILE_DEFAULTS,UNLOCK_RULES,normalize,rankIndex,xpOf,isPlatinumUnlocked,isUnlocked,getAvatarAsset,getNewlyUnlocked,applyUnlocks});
})();
