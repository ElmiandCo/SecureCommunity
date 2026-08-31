/* OneMuslim Profile Landing — remove only the highlighted duplicate profile card. */
(function(){
'use strict';
let syncing=false;
function client(){return window.OneMuslimSupabaseClient?.getClient?.()||window.supabase?.createClient?.(window.APP_CONFIG?.SUPABASE_URL,window.APP_CONFIG?.SUPABASE_ANON_KEY)}
async function syncProfile(){if(syncing)return window.profile||null;const sb=client();if(!sb)return null;syncing=true;try{const {data:{user}}=await sb.auth.getUser();if(!user)return null;const {data,error}=await sb.from('profiles').select('*').eq('id',user.id).maybeSingle();if(error)throw error;if(data)window.profile=data;return data||null}catch(e){console.error('Profile sync failed:',e);return window.profile||null}finally{syncing=false}}
function removeHighlightedCard(){const cards=document.querySelectorAll('#profilePanel .om-personal-card');cards.forEach(card=>card.remove())}
function init(){removeHighlightedCard();const panel=document.getElementById('profilePanel');if(panel&&!panel.dataset.omProfileCleanupObserver){panel.dataset.omProfileCleanupObserver='1';new MutationObserver(removeHighlightedCard).observe(panel,{childList:true,subtree:true})}syncProfile()}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();
window.OneMuslimProfileLanding={render:removeHighlightedCard,syncProfile};
})();
