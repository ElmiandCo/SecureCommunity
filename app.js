/* E-Secure Community v6: Supabase Auth + Postgres/RLS + comments + private media. */
const { createClient } = window.supabase;
const cfg = window.APP_CONFIG || {};
const sb = createClient(cfg.SUPABASE_URL, cfg.SUPABASE_ANON_KEY, {
  auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true }
});

const BUCKET = "community-media";
const MAX_MEDIA_FILES = 4;
const MAX_MEDIA_SIZE = 50 * 1024 * 1024;

const initials = n => (n || "E").split(" ").filter(Boolean).map(x => x[0]).join("").slice(0,2).toUpperCase();
const esc = s => String(s ?? "").replace(/[&<>"']/g, m => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"}[m]));
const fmt = t => new Date(t).toLocaleString([], {month:"short",day:"numeric",hour:"numeric",minute:"2-digit"});
const $ = id => document.getElementById(id);

let me = null;
let profile = null;
Object.defineProperty(window,"profile",{configurable:true,get:()=>profile,set:value=>{profile=value;}});
let posts = [];
let lessons = [];
let lessonCompletions = new Map();
let editingPostId = null;
let currentLesson = null;
let currentLessonAnswers = [];

function toast(msg){
  const x = $("toast");
  x.textContent = msg;
  x.classList.remove("hidden");
  clearTimeout(window.__toast);
  window.__toast = setTimeout(() => x.classList.add("hidden"), 2800);
}
function setScreen(id){
  document.querySelectorAll(".screen").forEach(x => x.classList.add("hidden"));
  $(id).classList.remove("hidden");
}
function isLoggedIn(){return !!me;}
function showAuth(mode="login"){
  setScreen("authView");
  const title=$("authTitle"), form=$("authForm"), msg=$("authMessage"), sw=$("authSwitch");
  msg.classList.add("hidden");
  title.textContent=mode==="login"?"Welcome back":"Create your account";
  form.innerHTML=`<label>Email<input id="authEmail" type="email" autocomplete="email" required></label><label>Password<input id="authPassword" type="password" autocomplete="current-password" required></label>${mode==="signup"?`<label>Display name<input id="authName" maxlength="80"></label>`:""}<button class="primary" type="submit">${mode==="login"?"Sign in":"Create account"}</button>`;
  sw.innerHTML=mode==="login"?`New here? <button type="button" id="authSwitchBtn">Create an account</button>`:`Already have an account? <button type="button" id="authSwitchBtn">Sign in</button>`;
  $("authSwitchBtn").onclick=()=>showAuth(mode==="login"?"signup":"login");
  form.onsubmit=async e=>{e.preventDefault();const email=$("authEmail").value.trim(),password=$("authPassword").value;try{if(mode==="login"){const {error}=await sb.auth.signInWithPassword({email,password});if(error)throw error;}else{const display=$("authName").value.trim();const {data,error}=await sb.auth.signUp({email,password,options:{data:{display_name:display}}});if(error)throw error;if(data?.user&&!data.session){msg.textContent="Check your email to confirm your account.";msg.classList.remove("hidden");return;}}}catch(err){msg.textContent=err.message||"Authentication failed.";msg.classList.remove("hidden");}};
}
function showPublic(){setScreen("publicView");}
async function ensureProfile(user, seed={}){
  if(!user) throw new Error("No authenticated user.");
  const username = seed.username || user.user_metadata?.username || null;
  const firstName = seed.firstName || user.user_metadata?.first_name || "";
  const lastName = seed.lastName || user.user_metadata?.last_name || "";
  const payload = {
    id:user.id,
    display_name:seed.displayName || user.user_metadata?.display_name || `${firstName} ${lastName}`.trim() || user.email?.split("@")[0] || "Member",
    username, first_name:firstName, last_name:lastName
  };
  const {data,error} = await sb.from("profiles").upsert(payload,{onConflict:"id"}).select().single();
  if(error) throw error;
  return data;
}
async function loadProfile(){
  if(!me) return;
  const {data,error} = await sb.from("profiles").select("*").eq("id",me.id).maybeSingle();
  if(error) throw error;
  const loaded = data || await ensureProfile(me);
  profile = window.OneMuslimProfileSystem?.normalize?.(loaded) || loaded;
  return profile;
}
async function loadLessons(){
  const {data,error}=await sb.from("lessons").select("id,slug,title,description,difficulty,points_per_question,sort_order").eq("active",true).order("sort_order");
  if(error)throw error;lessons=data||[];
}
async function loadPosts(){
  const {data,error}=await sb.from("posts").select(`id,user_id,body,created_at,media_urls,profiles(id,display_name,username,first_name,last_name,bio,location,website,avatar_url)`).order("created_at",{ascending:false}).limit(50);
  if(error){console.error(error);posts=[];return;}posts=data||[];renderFeed();
}
function renderFeed(){const feed=$("feed");if(!feed)return;feed.innerHTML=posts.map(post=>{const p=post.profiles||{},name=p.display_name||`${p.first_name||''} ${p.last_name||''}`.trim()||'Member';const pic=p.avatar_url||'';return `<article class="post"><header><div class="avatar">${pic?`<img src="${esc(pic)}" alt="${esc(name)} avatar">`:esc(initials(name))}</div><div><b>${esc(name)}</b><small>@${esc(p.username||'')}</small></div></header><div class="post-body">${esc(post.body||'')}</div></article>`}).join('');}
function renderApp(){
  setScreen("appView");
  $("sidebarXp").textContent=Number(profile?.xp_total??profile?.xp??0).toLocaleString();
  $("lessonsXp").textContent=Number(profile?.xp_total??profile?.xp??0).toLocaleString();
  const mini=$("miniProfile");if(mini){const name=profile?.display_name||"Member";const src=window.OneMuslimProfileSystem?.getAvatarAsset?.(profile)||profile?.avatar_url||'';mini.innerHTML=`<div class="mini-avatar">${src?`<img src="${esc(src)}" alt="${esc(name)} avatar">`:esc(initials(name))}</div><div><b>${esc(name)}</b><small>@${esc(profile?.username||'')}</small></div>`;}
}
async function boot(){
  const {data:{session}}=await sb.auth.getSession();
  me=session?.user||null;
  if(me){await loadProfile();await loadLessons();await loadPosts();renderApp();}else showPublic();
  sb.auth.onAuthStateChange(async (_event,session)=>{me=session?.user||null;if(me){try{await loadProfile();await loadLessons();await loadPosts();renderApp()}catch(e){console.error(e);showPublic()}}else{profile=null;posts=[];lessons=[];setScreen('publicView')}});
}
$("openLogin").onclick=()=>showAuth("login");
$("openSignup").onclick=()=>showAuth("signup");
$("backPublic").onclick=showPublic;
$("signOut").onclick=async()=>{await sb.auth.signOut();};
$("postText")?.addEventListener("input",()=>{$("charCount").textContent=`${$("postText").value.length}/500`});
$("publish")?.addEventListener("click",async()=>{const body=$("postText").value.trim();if(!body)return toast("Write something first.");const {error}=await sb.from("posts").insert({user_id:me.id,body});if(error)return toast(error.message);$("postText").value='';$("charCount").textContent='0/500';await loadPosts();});
boot();
