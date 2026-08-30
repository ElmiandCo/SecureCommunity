/* OneMuslim Profile System v8
 * Central source of truth for ranks, XP tiers, avatar packages, and profile defaults.
 * Persisted profile fields are kept aligned with the live profiles table.
 */
(function () {
  "use strict";
  const RANKS = Object.freeze(["Muslim","Mu'min","Expert","Da'wah Expert","Elite Sheikh","Platinum Muhsin"]);
  const XP_TIERS = Object.freeze([
    Object.freeze({id:"base",label:"Muslim",minXP:0,className:"tier-base",accent:"#1f6a55",text:"#20352c"}),
    Object.freeze({id:"platinum",label:"Platinum",minXP:10000,className:"tier-platinum",accent:"#bfc5cc",text:"#26313a"}),
    Object.freeze({id:"gold",label:"Gold",minXP:50000,className:"tier-gold",accent:"#d4af37",text:"#4a3810"}),
    Object.freeze({id:"diamond",label:"Diamond",minXP:250000,className:"tier-diamond",accent:"#8fd3ff",text:"#17364a"})
  ]);
  const PLATINUM_XP=10000,GOLD_XP=50000,DIAMOND_XP=250000;
  const ASSET_ROOT="/assets/avatars/";
  const AVATAR_ASSETS=Object.freeze({male:`${ASSET_ROOT}platinum-male.PNG`,female:`${ASSET_ROOT}platinum-female.PNG`});
  // avatar_asset is intentionally NOT a persisted profile column. The asset is derived from avatar_package + avatar_gender.
  const PROFILE_DEFAULTS=Object.freeze({avatar_gender:"male",avatar_base:"default",avatar_package:"default",avatar_accessory:"none",avatar_ring:"default",profile_banner:"default",profile_background:"default",profile_accent:"emerald",profile_title:"Muslim",custom_photo:null,unlocked_packages:["default"]});
  const UNLOCK_RULES=Object.freeze({default:{type:"everyone"},basic_backgrounds:{type:"everyone"},basic_customization:{type:"everyone"},platinum_package:{type:"xp",minXP:PLATINUM_XP},platinum_background:{type:"xp",minXP:PLATINUM_XP},gold_package:{type:"xp",minXP:GOLD_XP},gold_background:{type:"xp",minXP:GOLD_XP},diamond_package:{type:"xp",minXP:DIAMOND_XP},diamond_background:{type:"xp",minXP:DIAMOND_XP},elite_package:{type:"rank",minRank:"Elite Sheikh"},custom_photo:{type:"rank",minRank:"Platinum Muhsin"}});
  function rankIndex(title){const i=RANKS.indexOf(title);return i<0?0:i;}
  function xpOf(p){return Number(p?.xp_total??p?.xp??p?.rank_points??p?.points??0)||0;}
  function normalize(source){const p=Object.assign({},PROFILE_DEFAULTS,source||{});p.xp=xpOf(source||{});p.unlocked_packages=Array.from(new Set(["default",...(Array.isArray(source?.unlocked_packages)?source.unlocked_packages:[])]));return p;}
  function getTier(p){const xp=xpOf(p);let tier=XP_TIERS[0];for(const candidate of XP_TIERS)if(xp>=candidate.minXP)tier=candidate;return tier;}
  function getTierProgress(p){const xp=xpOf(p),tier=getTier(p),next=XP_TIERS[XP_TIERS.indexOf(tier)+1]||null;return Object.freeze({tier,nextTier:next,xp,toNext:next?Math.max(0,next.minXP-xp):0,percent:next?Math.min(100,Math.max(0,((xp-tier.minXP)/(next.minXP-tier.minXP))*100)):100});}
  function isUnlocked(feature,p){const rule=UNLOCK_RULES[feature];if(!rule)return false;const n=normalize(p);if(n.unlocked_packages.includes(feature))return true;if(rule.type==="everyone")return true;if(rule.type==="xp")return xpOf(n)>=rule.minXP;return rankIndex(n.profile_title)>=rankIndex(rule.minRank);}
  function isPlatinumUnlocked(p){return xpOf(p)>=PLATINUM_XP;}
  function isGoldUnlocked(p){return xpOf(p)>=GOLD_XP;}
  function isDiamondUnlocked(p){return xpOf(p)>=DIAMOND_XP;}
  function getAvatarAsset(p){const n=normalize(p);return n.avatar_package==="platinum_package"&&isPlatinumUnlocked(n)?(AVATAR_ASSETS[n.avatar_gender]||null):null;}
  function getNewlyUnlocked(p){return Object.keys(UNLOCK_RULES).filter(f=>isUnlocked(f,p));}
  function applyUnlocks(p){const n=normalize(p);n.unlocked_packages=Array.from(new Set([...n.unlocked_packages,...getNewlyUnlocked(n)]));return n;}
  window.OneMuslimProfileSystem=Object.freeze({RANKS,XP_TIERS,PLATINUM_XP,GOLD_XP,DIAMOND_XP,AVATAR_ASSETS,PROFILE_DEFAULTS,UNLOCK_RULES,normalize,rankIndex,xpOf,getTier,getTierProgress,isPlatinumUnlocked,isGoldUnlocked,isDiamondUnlocked,isUnlocked,getAvatarAsset,getNewlyUnlocked,applyUnlocks});
})();
