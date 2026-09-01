/* OneMuslim Profile Landing — keep only the profile card when My Profile is selected. */
(function(){
'use strict';
let syncing=false;
function client(){return window.OneMuslimSupabaseClient?.getClient?.()||window.supabase?.createClient?.(window.APP_CONFIG?.SUPABASE_URL,window.APP_CONFIG?.SUPABASE_ANON_KEY)}
async function syncProfile(){if(syncing)return window.profile||null;const sb=client();if(!sb)return null;syncing=true;try{const {data:{user}}=await sb.auth.getUser();if(!user)return null;const {data,error}=await sb.from('profiles').select('*').eq('id',user.id).maybeSingle();if(error)throw error;if(data)window.profile=data;return data||null}catch(e){console.error('Profile sync failed:',e);return window.profile||null}finally{syncing=false}}
function removeProfileHeader(){const header=document.querySelector('#profilePage .page-head');if(header)header.remove()}
function removeHighlightedCard(){const cards=document.querySelectorAll('#profilePanel .om-personal-card');cards.forEach(card=>card.remove())}
function cleanup(){removeProfileHeader();removeHighlightedCard()}
function init(){cleanup();const panel=document.getElementById('profilePanel');if(panel&&!panel.dataset.omProfileCleanupObserver){panel.dataset.omProfileCleanupObserver='1';new MutationObserver(cleanup).observe(panel,{childList:true,subtree:true})}const page=document.getElementById('profilePage');if(page&&!page.dataset.omProfileHeaderObserver){page.dataset.omProfileHeaderObserver='1';new MutationObserver(cleanup).observe(page,{childList:true,subtree:true})}syncProfile()}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();
window.OneMuslimProfileLanding={render:cleanup,syncProfile};
})();
