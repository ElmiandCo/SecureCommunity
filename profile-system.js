/* OneMuslim Profile System v11 — avatar builder is the PFP source of truth. */
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
  const REGULAR_AVATAR_ASSETS=Object.freeze({male:"/assets/avatar/base/avatar-master-male.jpeg",female:"/assets/avatar/base/avatar-master-female.jpeg"});
  const PLATINUM_AVATAR_ASSETS=Object.freeze({male:"/assets/avatars/platinum-male.PNG",female:"/assets/avatars/platinum-female.PNG"});
  const AVATAR_ASSETS=REGULAR_AVATAR_ASSETS;
  const PROFILE_DEFAULTS=Object.freeze({avatar_gender:"male",avatar_base:"default",avatar_package:"default",avatar_accessory:"none",avatar_ring:"default",profile_banner:"default",profile_background:"default",profile_accent:"emerald",profile_title:"Muslim",custom_photo:null,unlocked_packages:["default"]});
  const UNLOCK_RULES=Object.freeze({default:{type:"everyone"},basic_backgrounds:{type:"everyone"},basic_customization:{type:"everyone"},platinum_package:{type:"xp",minXP:PLATINUM_XP},platinum_background:{type:"xp",minXP:PLATINUM_XP},gold_package:{type:"xp",minXP:GOLD_XP},gold_background:{type:"xp",minXP:GOLD_XP},diamond_package:{type:"xp",minXP:DIAMOND_XP},diamond_background:{type:"xp",minXP:DIAMOND_XP},elite_package:{type:"rank",minRank:"Elite Sheikh"},custom_photo:{type:"rank",minRank:"Platinum Muhsin"}});
  function rankIndex(title){const i=RANKS.indexOf(title);return i<0?0:i;}
  function xpOf(p){return Number(p?.xp_total??p?.xp??p?.rank_points??p?.points??0)||0;}
  function normalize(source){
    const raw=source||{};
    const cfg=raw.avatar_config&&typeof raw.avatar_config==='object'?raw.avatar_config:{};
    const p=Object.assign({},PROFILE_DEFAULTS,raw);
    p.avatar_gender=raw.avatar_gender||cfg.gender||'male';
    p.avatar_gender=p.avatar_gender==='female'?'female':'male';
    p.avatar_package=raw.avatar_package||cfg.package||'default';
    p.avatar_package=p.avatar_package==='platinum_package'?'platinum_package':'default';
    p.xp=xpOf(raw);
    p.unlocked_packages=Array.from(new Set(["default",...(Array.isArray(raw.unlocked_packages)?raw.unlocked_packages:[])]));
    return p;
  }
  function getTier(p){const xp=xpOf(p);let tier=XP_TIERS[0];for(const candidate of XP_TIERS)if(xp>=candidate.minXP)tier=candidate;return tier;}
  function getTierProgress(p){const xp=xpOf(p),tier=getTier(p),next=XP_TIERS[XP_TIERS.indexOf(tier)+1]||null;return Object.freeze({tier,nextTier:next,xp,toNext:next?Math.max(0,next.minXP-xp):0,percent:next?Math.min(100,Math.max(0,((xp-tier.minXP)/(next.minXP-tier.minXP))*100)):100});}
  function isUnlocked(feature,p){const rule=UNLOCK_RULES[feature];if(!rule)return false;const n=normalize(p);if(n.unlocked_packages.includes(feature))return true;if(rule.type==="everyone")return true;if(rule.type==="xp")return xpOf(n)>=rule.minXP;return rankIndex(n.profile_title)>=rankIndex(rule.minRank);}
  function isPlatinumUnlocked(p){return xpOf(p)>=PLATINUM_XP;}
  function isGoldUnlocked(p){return xpOf(p)>=GOLD_XP;}
  function isDiamondUnlocked(p){return xpOf(p)>=DIAMOND_XP;}
  function getAvatarAsset(p){
    const n=normalize(p);
    // The avatar builder controls the PFP. Ignore stale legacy avatar_url values.
    if(n.custom_photo && isUnlocked("custom_photo",n))return n.custom_photo;
    const gender=n.avatar_gender;
    return n.avatar_package==="platinum_package"&&isPlatinumUnlocked(n)?PLATINUM_AVATAR_ASSETS[gender]:REGULAR_AVATAR_ASSETS[gender];
  }
  function getRegularAvatarAsset(gender){return REGULAR_AVATAR_ASSETS[gender==='female'?'female':'male'];}
  function getPlatinumAvatarAsset(gender){return PLATINUM_AVATAR_ASSETS[gender==='female'?'female':'male'];}
  function getNewlyUnlocked(p){return Object.keys(UNLOCK_RULES).filter(f=>isUnlocked(f,p));}
  function applyUnlocks(p){const n=normalize(p);n.unlocked_packages=Array.from(new Set([...n.unlocked_packages,...getNewlyUnlocked(n)]));return n;}
  window.OneMuslimProfileSystem=Object.freeze({RANKS,XP_TIERS,PLATINUM_XP,GOLD_XP,DIAMOND_XP,REGULAR_AVATAR_ASSETS,PLATINUM_AVATAR_ASSETS,AVATAR_ASSETS,PROFILE_DEFAULTS,UNLOCK_RULES,normalize,rankIndex,xpOf,getTier,getTierProgress,isPlatinumUnlocked,isGoldUnlocked,isDiamondUnlocked,isUnlocked,getAvatarAsset,getRegularAvatarAsset,getPlatinumAvatarAsset,getNewlyUnlocked,applyUnlocks});
})();
