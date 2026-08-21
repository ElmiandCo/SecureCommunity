/* Production client: Supabase Auth + Postgres/RLS. */
const { createClient } = window.supabase;
const cfg = window.APP_CONFIG || {};
const sb = createClient(cfg.SUPABASE_URL, cfg.SUPABASE_ANON_KEY, {
  auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true }
});

const initials=n=>(n||"E").split(" ").filter(Boolean).map(x=>x[0]).join("").slice(0,2).toUpperCase();
const esc=s=>String(s??"").replace(/[&<>"']/g,m=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;", "'":"&#039;"}[m]));
const fmt=t=>new Date(t).toLocaleString([], {month:"short",day:"numeric",hour:"numeric",minute:"2-digit"});
const $=id=>document.getElementById(id);
let me=null;
let profile=null;
let posts=[];
let editingPostId=null;

function toast(msg){const x=$("toast");x.textContent=msg;x.classList.remove("hidden");clearTimeout(window.__toast);window.__toast=setTimeout(()=>x.classList.add("hidden"),2800)}
function setScreen(id){document.querySelectorAll(".screen").forEach(x=>x.classList.add("hidden"));$(id).classList.remove("hidden")}
function message(msg){const x=$("authMessage");x.textContent=msg;x.classList.remove("hidden")}
function clearMessage(){$("authMessage").classList.add("hidden")}
function errText(error){return error?.message || "Something went wrong. Please try again."}

function showAuth(mode="login"){
 setScreen("authView"); clearMessage();
 const title=$("authTitle"),form=$("authForm"),sw=$("authSwitch");
 if(mode==="signup"){
  title.innerHTML="<h2>Create your account</h2><p>A few details make your member profile yours.</p>";
  form.innerHTML=`
   <div class="field"><label>First name</label><input id="firstName" required maxlength="50" placeholder="First name"></div>
   <div class="field"><label>Last name</label><input id="lastName" required maxlength="50" placeholder="Last name"></div>
   <div class="field"><label>Username</label><input id="username" required maxlength="30" pattern="[A-Za-z0-9_.-]+" placeholder="yourusername"></div>
   <div class="field"><label>Email</label><input id="email" type="email" required autocomplete="email" placeholder="you@example.com"></div>
   <div class="field"><label>Password</label><input id="password" type="password" minlength="8" required autocomplete="new-password" placeholder="At least 8 characters"></div>
   <button class="primary" type="submit">Create account</button>`;
  sw.innerHTML=`Already have an account? <button type="button" id="switchLogin">Sign in</button>`;
 } else {
  title.innerHTML="<h2>Welcome back</h2><p>Your private space is waiting.</p>";
  form.innerHTML=`
   <div class="field"><label>Email</label><input id="email" type="email" required autocomplete="email" placeholder="you@example.com"></div>
   <div class="field"><label>Password</label><input id="password" type="password" required autocomplete="current-password" placeholder="Your password"></div>
   <button type="button" class="forgot" id="forgot">Forgot password?</button>
   <button class="primary" type="submit">Sign in</button>`;
  sw.innerHTML=`New here? <button type="button" id="switchSignup">Create an account</button>`;
 }
 form.onsubmit=e=>{e.preventDefault();mode==="signup"?signup():login()};
 $("switchLogin")?.addEventListener("click",()=>showAuth("login"));
 $("switchSignup")?.addEventListener("click",()=>showAuth("signup"));
 $("forgot")?.addEventListener("click",forgot);
 document.querySelectorAll(".social").forEach(b=>b.onclick=()=>social(b.dataset.provider));
}

async function signup(){
 clearMessage();
 const firstName=$("firstName").value.trim(),lastName=$("lastName").value.trim(),username=$("username").value.trim().toLowerCase(),email=$("email").value.trim().toLowerCase(),password=$("password").value;
 if(!/^[a-z0-9_.-]{3,30}$/.test(username)){message("Username must be 3–30 characters and use letters, numbers, dots, underscores, or hyphens.");return}
 if(password.length<8){message("Password must be at least 8 characters.");return}
 const {data,error}=await sb.auth.signUp({email,password,options:{data:{display_name:`${firstName} ${lastName}`.trim(),first_name:firstName,last_name:lastName,username}}});
 if(error){
   if(/already registered|already been registered|user already/i.test(error.message)) message("Sorry — that email already has an account.");
   else if(/username/i.test(error.message)) message("That username may already be in use. Try another one.");
   else message(errText(error));
   return;
 }
 if(!data.user){message("We couldn't create the account. Please try again.");return}
 // If email confirmation is enabled, session will be null until verified.
 if(data.session){
   try{await ensureProfile(data.user,{firstName,lastName,username});}catch(e){console.error(e)}
   await enterApp(); toast("Account created. Welcome! 🎉");
 }else{
   message("Account created. Check your email to confirm your address, then sign in.");
 }
}

async function login(){
 clearMessage();
 const email=$("email").value.trim().toLowerCase(),password=$("password").value;
 const {data,error}=await sb.auth.signInWithPassword({email,password});
 if(error){
   // Supabase Auth performs server-side password/rate-limit protection. We do not store passwords or implement client-only security.
   if(/email not confirmed/i.test(error.message)) message("Please confirm your email address before signing in.");
   else message("Email or password is incorrect. If you forgot it, use the reset link below.");
   return;
 }
 await enterApp(); toast("Signed in securely. 🔐");
}

async function forgot(){
 const email=$("email")?.value.trim().toLowerCase();
 if(!email){message("Enter your email first.");return}
 const {error}=await sb.auth.resetPasswordForEmail(email,{redirectTo:window.location.origin});
 if(error){message(errText(error));return}
 message("If that email belongs to an account, a password-reset link has been sent.");
}

async function social(provider){
 clearMessage();
 const redirectTo = `${window.location.origin}/`;
 const {error}=await sb.auth.signInWithOAuth({
   provider,
   options:{redirectTo, queryParams:{access_type:"offline",prompt:"select_account"}}
 });
 if(error) message(errText(error));
}

async function ensureProfile(user, hints={}){
 const metadata = user.user_metadata || {};
 const firstName = hints.firstName || metadata.first_name || "";
 const lastName = hints.lastName || metadata.last_name || "";
 const displayName =
   hints.display_name ||
   (firstName || lastName ? `${firstName} ${lastName}`.trim() : "") ||
   metadata.display_name ||
   metadata.full_name ||
   user.email?.split("@")[0] ||
   "Member";

 let username = (hints.username || metadata.username || `member_${user.id.slice(0,8)}`)
   .toLowerCase().replace(/[^a-z0-9_.-]/g,"-").slice(0,30);

 if(username.length < 3) username = `member_${user.id.slice(0,8)}`;

 const payload={
   id:user.id,
   display_name:displayName,
   first_name:firstName,
   last_name:lastName,
   username
 };

 // The database trigger normally creates this row at auth-user creation.
 // This upsert is a safe second line of defense for OAuth users and older accounts.
 const {data,error}=await sb.from("profiles").upsert(payload,{onConflict:"id"}).select().single();
 if(error) throw error;
 profile=data;
 return data;
}

async function ensureProfile(user, hints={}){
 const payload={
  id:user.id,
  display_name:hints.display_name || hints.firstName && hints.lastName ? `${hints.firstName} ${hints.lastName}`.trim() : user.user_metadata?.display_name || user.email?.split("@")[0] || "Member",
  first_name:hints.firstName || user.user_metadata?.first_name || "",
  last_name:hints.lastName || user.user_metadata?.last_name || "",
  username:(hints.username || user.user_metadata?.username || `member_${user.id.slice(0,8)}`).toLowerCase()
 };
 const {data,error}=await sb.from("profiles").upsert(payload,{onConflict:"id"}).select().single();
 if(error) throw error;
 profile=data;return data;
}

async function loadProfile(){
 if(!me)return;
 const {data,error}=await sb.from("profiles").select("*").eq("id",me.id).maybeSingle();
 if(error) throw error;
 if(!data) profile=await ensureProfile(me);
 else profile=data;
 return profile;
}

async function loadPosts(){
 const {data,error}=await sb.from("posts").select("id,user_id,body,created_at,updated_at,profiles!posts_user_id_fkey(id,display_name,username,first_name,last_name,bio,location,website,avatar_url),post_likes(user_id)").order("created_at",{ascending:false});
 if(error) throw error;
 posts=(data||[]).map(p=>({...p,likeCount:(p.post_likes||[]).length,liked:(p.post_likes||[]).some(l=>l.user_id===me?.id)}));
}

async function enterApp(){
 setScreen("appView"); $("sessionBadge").textContent="SECURE SESSION";
 try{await loadProfile();await loadPosts();renderApp();}catch(e){console.error(e);message(errText(e));}
}

async function logout(){
 const {error}=await sb.auth.signOut();
 if(error){toast(errText(error));return}
 me=null;profile=null;posts=[];setScreen("publicView");$("sessionBadge").textContent="LOCKED";toast("Signed out. Private information is hidden.");
}

function renderApp(){
 if(!me||!profile){setScreen("publicView");return}
 const display=profile.display_name || `${profile.first_name||""} ${profile.last_name||""}`.trim() || me.email?.split("@")[0] || "Member";
 $("miniProfile").innerHTML=`<div class="avatar">${initials(display)}</div><b>${esc(display)}</b><small>@${esc(profile.username||"")} · ${esc(me.email||"")}</small>`;
 $("composerAvatar").textContent=initials(display);
 $("profilePanel").innerHTML=`<div class="profile-hero"><div class="avatar">${initials(display)}</div><div><h2>${esc(display)}</h2><p>@${esc(profile.username||"")} · ${esc(me.email||"")}</p></div></div><span class="private-tag">🔐 PRIVATE PROFILE</span><p style="margin-top:20px;color:#aaa0b2">${esc(profile.bio||"Tell the community a little about yourself.")}</p><div class="profile-meta"><span>${esc(profile.location||"Location not set")}</span>${profile.website?`<a href="${esc(profile.website)}" target="_blank" rel="noopener">${esc(profile.website)}</a>`:""}</div><button class="outline" id="editProfile">Edit profile</button>`;
 $("editProfile").onclick=editProfile;
 renderFeed();renderProfiles();
}

function renderFeed(){
 const html=posts.map(p=>{
  const u=p.profiles||{};const display=u.display_name||`${u.first_name||""} ${u.last_name||""}`.trim()||"Member";
  const own=p.user_id===me?.id;
  return `<article class="post" data-post="${p.id}"><div class="post-head"><div class="avatar">${initials(display)}</div><div class="post-author"><b>${esc(display)}</b><small>@${esc(u.username||"")} · ${fmt(p.created_at)}${p.updated_at&&p.updated_at!==p.created_at?" · edited":""}</small></div><div class="post-menu">${own?`<button class="tiny" data-edit="${p.id}">Edit</button><button class="tiny danger-text" data-delete="${p.id}">Delete</button>`:""}</div></div><p>${esc(p.body)}</p><div class="post-actions"><button class="like-btn ${p.liked?"liked":""}" data-like="${p.id}">${p.liked?"♥":"♡"} <span>${p.likeCount}</span></button></div></article>`;
 }).join("");
 $("feed").innerHTML=html||"<div class='post'><p>No posts yet. Be the first.</p></div>";
 document.querySelectorAll("[data-like]").forEach(b=>b.onclick=()=>toggleLike(b.dataset.like));
 document.querySelectorAll("[data-edit]").forEach(b=>b.onclick=()=>editPost(b.dataset.edit));
 document.querySelectorAll("[data-delete]").forEach(b=>b.onclick=()=>deletePost(b.dataset.delete));
}

function renderProfiles(){
 const seen=new Map();posts.forEach(p=>{if(p.profiles&&!seen.has(p.user_id))seen.set(p.user_id,p.profiles)});
 if(profile&&!seen.has(me.id))seen.set(me.id,profile);
 $("profilesGrid").innerHTML=[...seen.values()].map(u=>{const d=u.display_name||`${u.first_name||""} ${u.last_name||""}`.trim()||"Member";return `<div class="profile-card"><div class="avatar">${initials(d)}</div><h3>${esc(d)}</h3><p>@${esc(u.username||"")}</p><p>${esc(u.bio||"")}</p><span class="private-tag">MEMBER</span></div>`}).join("")||"<div class='profile-card'><p>No members yet.</p></div>";
}

async function publish(){
 const body=$("postText").value.trim();if(!body)return;
 if(body.length>500){toast("Keep posts to 500 characters or less.");return}
 const {error}=await sb.from("posts").insert({user_id:me.id,body});
 if(error){toast(errText(error));return}
 $("postText").value="";$("charCount").textContent="0/500";await loadPosts();renderFeed();toast("Posted to the community.");
}

async function toggleLike(postId){
 const p=posts.find(x=>x.id===postId);if(!p)return;
 if(p.liked){
  const {error}=await sb.from("post_likes").delete().eq("post_id",postId).eq("user_id",me.id);if(error){toast(errText(error));return}
 }else{
  const {error}=await sb.from("post_likes").insert({post_id:postId,user_id:me.id});if(error&&!/duplicate|unique/i.test(error.message)){toast(errText(error));return}
 }
 await loadPosts();renderFeed();
}

function editPost(id){
 const p=posts.find(x=>x.id===id);if(!p||p.user_id!==me.id)return;
 editingPostId=id;
 $("postText").value=p.body;$("charCount").textContent=`${p.body.length}/500`;$("publish");
 $("publish").textContent="Save edit";$("postText").focus();
}

async function saveEditedPost(){
 const body=$("postText").value.trim();if(!editingPostId||!body)return;
 const {error}=await sb.from("posts").update({body,updated_at:new Date().toISOString()}).eq("id",editingPostId).eq("user_id",me.id);
 if(error){toast(errText(error));return}
 editingPostId=null;$("postText").value="";$("charCount").textContent="0/500";$("publish").textContent="Post";await loadPosts();renderFeed();toast("Post updated.");
}

async function deletePost(id){
 const p=posts.find(x=>x.id===id);if(!p||p.user_id!==me.id)return;
 if(!confirm("Delete this post? This cannot be undone."))return;
 const {error}=await sb.from("posts").delete().eq("id",id).eq("user_id",me.id);
 if(error){toast(errText(error));return}
 await loadPosts();renderFeed();toast("Post deleted.");
}

function editProfile(){
 const d=profile||{};
 const currentDisplay=d.display_name||"";
 const panel=$("profilePanel");
 panel.innerHTML=`<h2>Edit profile</h2><div class="profile-form"><label>Display name<input id="pfDisplay" maxlength="80" value="${esc(currentDisplay)}"></label><label>First name<input id="pfFirst" maxlength="50" value="${esc(d.first_name||"")}"></label><label>Last name<input id="pfLast" maxlength="50" value="${esc(d.last_name||"")}"></label><label>Username<input id="pfUser" maxlength="30" value="${esc(d.username||"")}"></label><label>Bio<textarea id="pfBio" maxlength="280">${esc(d.bio||"")}</textarea></label><label>Location<input id="pfLocation" maxlength="100" value="${esc(d.location||"")}"></label><label>Website<input id="pfWebsite" maxlength="200" type="url" value="${esc(d.website||"")}"></label><div class="actions"><button class="primary" id="saveProfile">Save profile</button><button class="outline" id="cancelProfile">Cancel</button></div></div>`;
 $("saveProfile").onclick=saveProfile;$("cancelProfile").onclick=renderApp;
}

async function saveProfile(){
 const username=$("pfUser").value.trim().toLowerCase();
 if(!/^[a-z0-9_.-]{3,30}$/.test(username)){toast("Username must be 3–30 characters and use letters, numbers, dots, underscores, or hyphens.");return}
 const payload={display_name:$("pfDisplay").value.trim(),first_name:$("pfFirst").value.trim(),last_name:$("pfLast").value.trim(),username,bio:$("pfBio").value.trim(),location:$("pfLocation").value.trim(),website:$("pfWebsite").value.trim()};
 const {data,error}=await sb.from("profiles").update(payload).eq("id",me.id).select().single();
 if(error){toast(/duplicate|unique/i.test(error.message)?"That username is already taken.":errText(error));return}
 profile=data;await loadPosts();renderApp();toast("Profile updated.");
}

$("openLogin").onclick=()=>showAuth("login");
$("openSignup").onclick=()=>showAuth("signup");
$("backPublic").onclick=()=>setScreen("publicView");
$("signOut").onclick=logout;
$("publish").onclick=()=>editingPostId?saveEditedPost():publish();
$("postText").oninput=e=>$("charCount").textContent=`${e.target.value.length}/500`;
document.querySelectorAll(".side").forEach(b=>b.onclick=()=>{document.querySelectorAll(".side").forEach(x=>x.classList.remove("active"));b.classList.add("active");document.querySelectorAll(".page").forEach(x=>x.classList.add("hidden"));$(b.dataset.page+"Page").classList.remove("hidden")});

sb.auth.onAuthStateChange(async (_event,session)=>{
 if(session){
   me=session.user;
   try{await loadProfile();await loadPosts();renderApp();}catch(e){console.error(e)}
 } else {
   me=null;profile=null;posts=[];setScreen("publicView");$("sessionBadge").textContent="LOCKED";
 }
});

(async()=>{
 const {data}=await sb.auth.getSession();
 if(data.session){me=data.session.user;try{await loadProfile();await loadPosts();renderApp()}catch(e){console.error(e);setScreen("publicView")}}
 else setScreen("publicView");
})();
