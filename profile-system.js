/* OneMuslim Profile System v4 — Platinum 50k / Gold 20k. */
(function () {
  "use strict";
  const RANKS = Object.freeze(["Muslim","Mu'min","Expert","Da'wah Expert","Elite Sheikh","Platinum Muhsin"]);
  const PLATINUM_XP = 50000;
  const GOLD_XP = 20000;
  const AVATAR_ASSETS = Object.freeze({male:"assets/avatars/platinum-male.PNG",female:"assets/avatars/platinum-female.PNG"});
  const PROFILE_DEFAULTS = Object.freeze({avatar_gender:"male",avatar_base:"default",avatar_package:"default",avatar_asset:null,avatar_accessory:"none",avatar_ring:"default",profile_banner:"default",profile_background:"default",profile_accent:"emerald",profile_title:"Muslim",custom_photo:null,unlocked_packages:["default"]});
  const UNLOCK_RULES = Object.freeze({default:{type:"everyone"},basic_backgrounds:{type:"everyone"},basic_customization:{type:"everyone"},platinum_package:{type:"xp",minXP:PLATINUM_XP},platinum_background:{type:"xp",minXP:PLATINUM_XP},gold_package:{type:"xp",minXP:GOLD_XP},gold_background:{type:"xp",minXP:GOLD_XP},elite_package:{type:"rank",minRank:"Elite Sheikh"},custom_photo:{type:"rank",minRank:"Platinum Muhsin"}});
  function rankIndex(title){const i=RANKS.indexOf(title);return i<0?0:i;}
  function xpOf(profile){return Number(profile?.xp??profile?.rank_points??profile?.points??0)||0;}
  function normalize(profile){const p=Object.assign({},PROFILE_DEFAULTS,profile||{});p.xp=xpOf(p);p.unlocked_packages=Array.from(new Set(["default",...(profile?.unlocked_packages||[])]));if(p.avatar_package==="platinum_package")p.avatar_asset=AVATAR_ASSETS[p.avatar_gender]||null;return p;}
  function isUnlocked(feature,profile){const r=UNLOCK_RULES[feature];if(!r)return false;if(r.type==="everyone")return true;const p=normalize(profile);if(p.unlocked_packages.includes(feature))return true;if(r.type==="xp")return xpOf(p)>=r.minXP;return rankIndex(p.profile_title)>=rankIndex(r.minRank);}
  function isPlatinumUnlocked(profile){return xpOf(profile)>=PLATINUM_XP;}
  function isGoldUnlocked(profile){return xpOf(profile)>=GOLD_XP;}
  function getAvatarAsset(profile){const p=normalize(profile);return p.avatar_package==="platinum_package"&&isPlatinumUnlocked(p)?AVATAR_ASSETS[p.avatar_gender]||null:null;}
  function getNewlyUnlocked(profile){const p=normalize(profile);return Object.keys(UNLOCK_RULES).filter(f=>isUnlocked(f,p));}
  function applyUnlocks(profile){const p=normalize(profile);p.unlocked_packages=Array.from(new Set([...p.unlocked_packages,...getNewlyUnlocked(p)]));return p;}
  window.OneMuslimProfileSystem=Object.freeze({RANKS,PLATINUM_XP,GOLD_XP,AVATAR_ASSETS,PROFILE_DEFAULTS,UNLOCK_RULES,normalize,rankIndex,xpOf,isPlatinumUnlocked,isGoldUnlocked,isUnlocked,getAvatarAsset,getNewlyUnlocked,applyUnlocks});
})();
