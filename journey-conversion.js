/* OneMuslim Journey -> account conversion. The anonymous Supabase user keeps the same id, so lesson XP/history stays attached. */
(function(){
'use strict';
const $=id=>document.getElementById(id);
const active=()=>new URLSearchParams(location.search).get('journey')==='convert';
const client=()=>window.OneMuslimSupabaseClient?.getClient?.()||null;
async function boot(){
 if(!active())return;
 const sb=client();if(!sb)return setTimeout(boot,250);
 const s=(await sb.auth.getSession()).data?.session;
 if(!s?.user?.is_anonymous)return;
 window.__OMJourneyAnonymousUser=s.user;
 setTimeout(()=>{if(typeof window.showAuth==='function')window.showAuth('signup');const v=$('authView');v?.classList.remove('hidden');v?.classList.add('om-auth-overlay');document.body.classList.add('om-auth-modal-open');},250);
}
async function submit(e){
 if(!active()||e.target.id!=='authForm')return;
 const sb=client();if(!sb)return;const s=(await sb.auth.getSession()).data?.session;if(!s?.user?.is_anonymous)return;
 e.preventDefault();e.stopImmediatePropagation();
 const first=$('firstName')?.value.trim()||'',last=$('lastName')?.value.trim()||'',username=$('username')?.value.trim().toLowerCase()||'',email=$('email')?.value.trim().toLowerCase()||'',password=$('password')?.value||'';
 const msg=$('authMessage');const fail=x=>{if(msg){msg.textContent=x;msg.classList.remove('hidden')}};
 if(!/^[a-z0-9_.-]{3,30}$/.test(username))return fail('Username must be 3–30 characters and use letters, numbers, dots, underscores, or hyphens.');
 if(password.length<8)return fail('Password must be at least 8 characters.');
 const uq=await sb.from('profiles').select('id').eq('username',username).neq('id',s.user.id).limit(1).maybeSingle();if(uq.data)return fail('That username is already taken. Choose another one.');
 const u=await sb.auth.updateUser({email,password,data:{display_name:`${first} ${last}`.trim(),first_name:first,last_name:last,username}});if(u.error)return fail(u.error.message);
 const d=JSON.parse(localStorage.getItem('onemuslim_onboarding_v1')||'{}');const p={id:s.user.id,display_name:`${first} ${last}`.trim(),username,first_name:first,last_name:last,gender:d.gender,avatar_gender:d.gender,avatar_package:'base',avatar_url:d.gender==='female'?'/assets/avatar/base/avatar-master-female.jpeg':'/assets/avatar/base/avatar-master-male.jpeg'};if(d.religion==='Just Took Shahada'){p.religion='Muslim';p.shahada_status='Just Took Shahada'}else if(d.religion)p.religion=d.religion;const up=await sb.from('profiles').upsert(p,{onConflict:'id'}).select().single();if(up.error)console.warn('Journey profile sync:',up.error);try{localStorage.setItem('oneMuslimProfile',JSON.stringify(up.data||p))}catch(_){ }sessionStorage.removeItem('onemuslim_journey_convert');localStorage.removeItem('onemuslim_onboarding_v1');location.href='index.html';
}
document.addEventListener('submit',submit,true);boot();
})();