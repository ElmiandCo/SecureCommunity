/* OneMuslim home release notes — small, non-blocking build checklist near the home avatar. */
(function(){
'use strict';
const VERSION='2026.09.02';
const CHANGES=[
'People cards: View Profile, Message, Follow',
'Profile card: Follow button in the top-right',
'Post emoji reactions: 😂 😭 😅 😁 🥰 😳 😏 🥺',
'Comment emoji reactions with independent counts',
'DM: New message / start a conversation',
'Follow + Following state saved to Supabase'
];
function styles(){if(document.getElementById('om-release-notes-css'))return;const s=document.createElement('style');s.id='om-release-notes-css';s.textContent=`.om-release-notes{width:min(270px,100%);margin-top:14px;background:rgba(255,255,255,.92);border:1px solid #d8e7dc;border-radius:15px;box-shadow:0 8px 24px rgba(24,49,36,.08);overflow:hidden;color:#183124;text-align:left}.om-release-toggle{width:100%;border:0;background:transparent;padding:11px 13px;display:flex;align-items:center;justify-content:space-between;gap:10px;color:#183124;font-weight:900;font-size:11px;cursor:pointer}.om-release-toggle span:last-child{font-size:13px;transition:transform .2s}.om-release-notes.open .om-release-toggle span:last-child{transform:rotate(180deg)}.om-release-body{display:none;padding:0 13px 13px}.om-release-notes.open .om-release-body{display:block}.om-release-version{font-size:9px;letter-spacing:1.2px;font-weight:900;color:#168746;margin-bottom:8px}.om-release-body ul{margin:0;padding-left:17px;display:grid;gap:6px}.om-release-body li{font-size:10px;line-height:1.35;color:#60756a}.om-release-hint{margin-top:9px;font-size:9px;color:#8a9a91}@media(max-width:900px){.om-release-notes{width:min(320px,100%)}}`;document.head.appendChild(s)}
function decorate(){const zone=document.querySelector('#homePage .welcome-avatar-zone');if(!zone||zone.querySelector('.om-release-notes'))return;const card=document.createElement('section');card.className='om-release-notes';card.innerHTML=`<button type="button" class="om-release-toggle" aria-expanded="false"><span>✦ What's in this version?</span><span>⌄</span></button><div class="om-release-body"><div class="om-release-version">BUILD ${VERSION}</div><ul>${CHANGES.map(x=>`<li>${x}</li>`).join('')}</ul><div class="om-release-hint">Use this checklist to verify the build you opened.</div></div>`;zone.appendChild(card);const b=card.querySelector('.om-release-toggle');b.onclick=()=>{const open=card.classList.toggle('open');b.setAttribute('aria-expanded',String(open))}}
function init(){styles();decorate();const obs=new MutationObserver(decorate);obs.observe(document.body,{childList:true,subtree:true})}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();
})();
