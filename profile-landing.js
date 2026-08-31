/* OneMuslim Profile Landing — compact profile actions + OneReport. */
(function(){
'use strict';
let syncing=false;
let rendering=false;
function client(){return window.OneMuslimSupabaseClient?.getClient?.()||window.supabase?.createClient?.(window.APP_CONFIG?.SUPABASE_URL,window.APP_CONFIG?.SUPABASE_ANON_KEY)}
async function syncProfile(){if(syncing)return window.profile||null;const sb=client();if(!sb)return null;syncing=true;try{const {data:{user}}=await sb.auth.getUser();if(!user)return null;const {data,error}=await sb.from('profiles').select('*').eq('id',user.id).maybeSingle();if(error)throw error;if(data)window.profile=data;return data||null}catch(e){console.error('Profile sync failed:',e);return window.profile||null}finally{syncing=false}}
function openEditor(){const open=window.OneMuslimProfileBuilder?.open||window.openProfileBuilder||window.OneMuslimOpenProfileEditor;if(typeof open!=='function'){window.toast?.('Profile editor is still loading. Please try again.');return false}return open()}
function styles(){if(document.getElementById('om-profile-card-styles'))return;const s=document.createElement('style');s.id='om-profile-card-styles';s.textContent=`
.om-profile-actions-bar{display:flex;align-items:center;justify-content:flex-end;gap:10px;margin:0 0 18px}
.om-profile-actions-bar button{border:1px solid #cbded4;background:#fff;color:#1f5b49;border-radius:14px;padding:11px 16px;font-weight:800;cursor:pointer}
.om-profile-actions-bar button.primary{background:#1f5b49;color:#fff;border-color:#1f5b49}
.om-report-panel{margin-top:14px}
@media(max-width:620px){.om-profile-actions-bar{justify-content:stretch}.om-profile-actions-bar button{flex:1}}
`;document.head.appendChild(s)}
function render(){const panel=document.getElementById('profilePanel');if(!panel||rendering)return;styles();rendering=true;try{const oldReport=document.getElementById('oneReportPanel');if(oldReport)oldReport.remove();panel.innerHTML='';const bar=document.createElement('div');bar.className='om-profile-actions-bar';bar.innerHTML='<button class="primary" id="openProfileEditor" type="button">Edit profile</button><button id="openOneReport" type="button">📊 OneReport</button>';panel.appendChild(bar);bar.querySelector('#openProfileEditor').onclick=()=>openEditor();bar.querySelector('#openOneReport').onclick=async()=>{let host=document.getElementById('oneReportPanel');if(!host){host=document.createElement('div');host.id='oneReportPanel';host.className='om-report-panel';panel.appendChild(host)}host.classList.toggle('hidden');if(!host.classList.contains('hidden'))await window.OneMuslimOneReport?.render()}}finally{rendering=false}}
function observePanel(){const panel=document.getElementById('profilePanel');if(!panel||panel.dataset.omProfileObserver)return;panel.dataset.omProfileObserver='1';const observer=new MutationObserver(()=>{if(rendering)return;const first=panel.firstElementChild;if(!first||!first.classList.contains('om-profile-actions-bar'))render()});observer.observe(panel,{childList:true})}
function init(){observePanel();syncProfile().then(()=>{render()})}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();
window.OneMuslimProfileLanding={render,syncProfile};
})();
