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
let posts = [];
let editingPostId = null;

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
function message(msg){
  const x = $("authMessage");
  x.textContent = msg;
  x.classList.remove("hidden");
}
function clearMessage(){ $("authMessage").classList.add("hidden"); }
function errText(error){ return error?.message || "Something went wrong. Please try again."; }
function displayName(u){
  return u?.display_name || `${u?.first_name || ""} ${u?.last_name || ""}`.trim() || "Member";
}
function isMediaFile(file){
  return /^image\/|^video\//.test(file.type);
}
function validateMedia(files){
  const list = [...files];
  if(list.length > MAX_MEDIA_FILES) return `Choose up to ${MAX_MEDIA_FILES} photos or videos.`;
  for(const file of list){
    if(!isMediaFile(file)) return `${file.name} is not a supported photo/video.`;
    if(file.size > MAX_MEDIA_SIZE) return `${file.name} is larger than 50 MB.`;
  }
  return "";
}
function renderFileSummary(inputId, targetId){
  const input = $(inputId), target = $(targetId);
  if(!input || !target) return;
  const files = [...(input.files || [])];
  target.textContent = files.length ? files.map(f => `${f.name} (${Math.round(f.size/1024/1024*10)/10} MB)`).join(" · ") : "";
}
async function signMedia(rows){
  return Promise.all((rows || []).map(async m => {
    const { data, error } = await sb.storage.from(BUCKET).createSignedUrl(m.storage_path, 3600);
    return {...m, signedUrl: error ? "" : data?.signedUrl || ""};
  }));
}
function mediaHtml(media, cls=""){
  if(!media?.length) return "";
  return `<div class="media-grid ${cls}">${media.map(m => {
    if(!m.signedUrl) return "";
    const safeUrl = esc(m.signedUrl);
    return /^video\//.test(m.mime_type)
      ? `<video class="media-item" src="${safeUrl}" controls playsinline preload="metadata"></video>`
      : `<img class="media-item" src="${safeUrl}" alt="${esc(m.file_name)}" loading="lazy">`;
  }).join("")}</div>`;
}

function showAuth(mode="login"){
  setScreen("authView"); clearMessage();
  const title = $("authTitle"), form = $("authForm"), sw = $("authSwitch");
  const divider = document.querySelector(".divider");
  const socials = document.querySelector(".socials");
  if(divider) divider.style.display = mode === "reset" ? "none" : "flex";
  if(socials) socials.style.display = mode === "reset" ? "none" : "grid";
  if(mode === "signup"){
    title.innerHTML = "<h2>Create your account</h2><p>A few details make your member profile yours.</p>";
    form.innerHTML = `
      <div class="field"><label>First name</label><input id="firstName" required maxlength="50" placeholder="First name"></div>
      <div class="field"><label>Last name</label><input id="lastName" required maxlength="50" placeholder="Last name"></div>
      <div class="field"><label>Username</label><input id="username" required maxlength="30" pattern="[A-Za-z0-9_.-]+" placeholder="yourusername"></div>
      <div class="field"><label>Email</label><input id="email" type="email" required autocomplete="email" placeholder="you@example.com"></div>
      <div class="field"><label>Password</label><input id="password" type="password" minlength="8" required autocomplete="new-password" placeholder="At least 8 characters"></div>
      <button class="primary" type="submit">Create account</button>`;
    sw.innerHTML = `Already have an account? <button type="button" id="switchLogin">Sign in</button>`;
  } else if(mode === "reset"){
    title.innerHTML = "<h2>Set a new password</h2><p>Choose a new password for your E-Secure account.</p>";
    form.innerHTML = `
      <div class="field"><label>New password</label><input id="newPassword" type="password" minlength="8" required autocomplete="new-password" placeholder="At least 8 characters"></div>
      <div class="field"><label>Confirm new password</label><input id="confirmPassword" type="password" minlength="8" required autocomplete="new-password" placeholder="Repeat your password"></div>
      <button class="primary" type="submit">Update password</button>`;
    sw.innerHTML = `Remembered it? <button type="button" id="switchLogin">Sign in</button>`;
  } else {
    title.innerHTML = "<h2>Welcome back</h2><p>Your private space is waiting.</p>";
    form.innerHTML = `
      <div class="field"><label>Email</label><input id="email" type="email" required autocomplete="email" placeholder="you@example.com"></div>
      <div class="field"><label>Password</label><input id="password" type="password" required autocomplete="current-password" placeholder="Your password"></div>
      <button type="button" class="forgot" id="forgot">Forgot password?</button>
      <button class="primary" type="submit">Sign in</button>`;
    sw.innerHTML = `New here? <button type="button" id="switchSignup">Create an account</button>`;
  }

  form.onsubmit = e => {
    e.preventDefault();
    if(mode === "signup") signup();
    else if(mode === "reset") resetPassword();
    else login();
  };
  $("switchLogin")?.addEventListener("click", () => showAuth("login"));
  $("switchSignup")?.addEventListener("click", () => showAuth("signup"));
  $("forgot")?.addEventListener("click", forgot);
  document.querySelectorAll(".social").forEach(b => b.onclick = () => social(b.dataset.provider));
}

async function usernameAvailable(username, excludeId=null){
  let q = sb.from("profiles").select("id").eq("username", username).limit(1);
  if(excludeId) q = q.neq("id", excludeId);
  const {data,error} = await q.maybeSingle();
  if(error) throw error;
  return !data;
}

async function signup(){
  clearMessage();
  const firstName = $("firstName").value.trim();
  const lastName = $("lastName").value.trim();
  const username = $("username").value.trim().toLowerCase();
  const email = $("email").value.trim().toLowerCase();
  const password = $("password").value;

  if(!/^[a-z0-9_.-]{3,30}$/.test(username)){
    message("Username must be 3–30 characters and use letters, numbers, dots, underscores, or hyphens.");
    return;
  }
  if(password.length < 8){ message("Password must be at least 8 characters."); return; }

  try{
    if(!(await usernameAvailable(username))){
      message("That username is already taken. Choose another one.");
      return;
    }
  }catch(e){
    message("We couldn't check that username right now. Please try again.");
    return;
  }

  const {data,error} = await sb.auth.signUp({
    email,password,
    options:{data:{display_name:`${firstName} ${lastName}`.trim(),first_name:firstName,last_name:lastName,username}}
  });

  if(error){
    if(/already registered|already been registered|user already|already exists/i.test(error.message))
      message("Sorry — that email already has an account. Sign in instead.");
    else if(/duplicate|unique/i.test(error.message))
      message("That username is already taken. Choose another one.");
    else message(errText(error));
    return;
  }
  if(!data.user){ message("We couldn't create the account. Please try again."); return; }

  if(data.session){
    try{
      await ensureProfile(data.user,{firstName,lastName,username});
      await enterApp();
      toast("Account created. Welcome! 🎉");
    }catch(e){
      console.error("Profile setup failed:",e);
      message("Your account was created, but we couldn't finish your profile. Please sign in again.");
    }
    return;
  }

  const loginResult = await sb.auth.signInWithPassword({email,password});
  if(!loginResult.error && loginResult.data?.session){
    try{
      await ensureProfile(loginResult.data.user,{firstName,lastName,username});
      await enterApp();
      toast("Account created. Welcome! 🎉");
    }catch(e){
      console.error("Profile setup failed:",e);
      message("Account created, but profile setup failed. Please sign in again.");
    }
    return;
  }

  if(/email not confirmed/i.test(loginResult.error?.message || ""))
    message("Your account was created, but email confirmation is required before you can sign in.");
  else
    message("Your account was created. Sign in with your new email and password.");
}

async function login(){
  clearMessage();
  const email = $("email").value.trim().toLowerCase();
  const password = $("password").value;
  const {data,error} = await sb.auth.signInWithPassword({email,password});
  if(error){
    if(/email not confirmed/i.test(error.message)) message("Please confirm your email address before signing in.");
    else message("Email or password is incorrect. If you forgot it, use the reset link below.");
    return;
  }
  await enterApp();
  toast("Signed in securely. 🔐");
}

async function forgot(){
  const email = $("email")?.value.trim().toLowerCase();
  if(!email){ message("Enter your email first."); return; }
  const {error} = await sb.auth.resetPasswordForEmail(email,{redirectTo:`${window.location.origin}/?reset=1`});
  if(error){ message(errText(error)); return; }
  message("If that email belongs to an account, a password-reset link has been sent.");
}

async function resetPassword(){
  clearMessage();
  const p = $("newPassword").value;
  const c = $("confirmPassword").value;
  if(p.length < 8){ message("Password must be at least 8 characters."); return; }
  if(p !== c){ message("The passwords do not match."); return; }
  const {error} = await sb.auth.updateUser({password:p});
  if(error){ message(errText(error)); return; }
  toast("Password updated. You're signed in. 🔐");
  await enterApp();
}

async function social(provider){
  clearMessage();
  const redirectTo = `${window.location.origin}/`;
  const {error} = await sb.auth.signInWithOAuth({
    provider,
    options:{redirectTo,queryParams:{access_type:"offline",prompt:"select_account"}}
  });
  if(error) message(errText(error));
}

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
  profile = data || await ensureProfile(me);
  return profile;
}

async function loadPosts(){
  const {data,error} = await sb.from("posts").select(`
    id,user_id,body,created_at,updated_at,
    profiles!posts_user_id_fkey(id,display_name,username,first_name,last_name,bio,location,website,avatar_url),
    post_likes(user_id),
    post_media!post_media_post_id_fkey(id,storage_path,file_name,mime_type),
    comments!comments_post_id_fkey(
      id,user_id,body,created_at,updated_at,
      profiles!comments_user_id_fkey(id,display_name,username,first_name,last_name),
      comment_media!comment_media_comment_id_fkey(id,storage_path,file_name,mime_type)
    )
  `).order("created_at",{ascending:false});
  if(error) throw error;

  posts = await Promise.all((data || []).map(async p => {
    const comments = await Promise.all((p.comments || []).map(async c => ({
      ...c,
      media:await signMedia(c.comment_media || [])
    })));
    return {
      ...p,
      likeCount:(p.post_likes || []).length,
      liked:(p.post_likes || []).some(l => l.user_id === me?.id),
      media:await signMedia(p.post_media || []),
      comments
    };
  }));
}

async function enterApp(){
  setScreen("appView");
  $("sessionBadge").textContent = "SECURE SESSION";
  try{
    await loadProfile();
    await loadPosts();
    renderApp();
  }catch(e){
    console.error(e);
    setScreen("publicView");
    toast(errText(e));
  }
}

async function logout(){
  const {error} = await sb.auth.signOut();
  if(error){ toast(errText(error)); return; }
  me=null; profile=null; posts=[];
  setScreen("publicView");
  $("sessionBadge").textContent="LOCKED";
  toast("Signed out. Private information is hidden.");
}

function renderApp(){
  if(!me || !profile){ setScreen("publicView"); return; }
  const display = displayName(profile);
  $("miniProfile").innerHTML = `<div class="avatar">${initials(display)}</div><b>${esc(display)}</b><small>@${esc(profile.username||"")} · ${esc(me.email||"")}</small>`;
  $("composerAvatar").textContent = initials(display);
  $("profilePanel").innerHTML = `
    <div class="profile-hero"><div class="avatar">${initials(display)}</div><div><h2>${esc(display)}</h2><p>@${esc(profile.username||"")} · ${esc(me.email||"")}</p></div></div>
    <span class="private-tag">🔐 PRIVATE PROFILE</span>
    <p style="margin-top:20px;color:#aaa0b2">${esc(profile.bio||"Tell the community a little about yourself.")}</p>
    <div class="profile-meta"><span>${esc(profile.location||"Location not set")}</span>${profile.website?`<a href="${esc(profile.website)}" target="_blank" rel="noopener">${esc(profile.website)}</a>`:""}</div>
    <button class="outline" id="editProfile">Edit profile</button>`;
  $("editProfile").onclick = editProfile;
  renderFeed(); renderProfiles();
}

function renderFeed(){
  const html = posts.map(p => {
    const u = p.profiles || {};
    const display = displayName(u);
    const own = p.user_id === me?.id;
    const comments = p.comments || [];
    return `<article class="post" data-post="${p.id}">
      <div class="post-head">
        <div class="avatar">${initials(display)}</div>
        <div class="post-author"><b>${esc(display)}</b><small>@${esc(u.username||"")} · ${fmt(p.created_at)}${p.updated_at&&p.updated_at!==p.created_at?" · edited":""}</small></div>
        <div class="post-menu">${own?`<button class="tiny" data-edit="${p.id}">Edit</button><button class="tiny danger-text" data-delete="${p.id}">Delete</button>`:""}</div>
      </div>
      ${p.body ? `<p>${esc(p.body)}</p>` : ""}
      ${mediaHtml(p.media)}
      <div class="post-actions">
        <button class="like-btn ${p.liked?"liked":""}" data-like="${p.id}">${p.liked?"♥":"♡"} <span>${p.likeCount}</span></button>
        <button class="comment-toggle" data-comment-toggle="${p.id}">💬 <span>${comments.length}</span> Comment${comments.length===1?"":"s"}</button>
      </div>
      <div class="comments" data-comments="${p.id}">
        ${comments.map(c => renderComment(c)).join("")}
        <div class="comment-composer">
          <div class="avatar small-avatar">${initials(displayName(profile))}</div>
          <div class="comment-compose-body">
            <textarea data-comment-input="${p.id}" maxlength="1000" placeholder="Write a comment..."></textarea>
            <div class="comment-tools">
              <label class="attach-btn">📎 Photo/video<input type="file" data-comment-media="${p.id}" accept="image/*,video/*" multiple hidden></label>
              <span class="file-summary" data-comment-files="${p.id}"></span>
              <button class="primary tiny-primary" data-comment-submit="${p.id}">Comment</button>
            </div>
          </div>
        </div>
      </div>
    </article>`;
  }).join("");
  $("feed").innerHTML = html || "<div class='post'><p>No posts yet. Be the first.</p></div>";

  document.querySelectorAll("[data-like]").forEach(b => b.onclick = () => toggleLike(b.dataset.like));
  document.querySelectorAll("[data-edit]").forEach(b => b.onclick = () => editPost(b.dataset.edit));
  document.querySelectorAll("[data-delete]").forEach(b => b.onclick = () => deletePost(b.dataset.delete));
  document.querySelectorAll("[data-comment-toggle]").forEach(b => b.onclick = () => {
    const box = document.querySelector(`[data-comments="${b.dataset.commentToggle}"]`);
    box?.classList.toggle("collapsed");
  });
  document.querySelectorAll("[data-comment-submit]").forEach(b => b.onclick = () => publishComment(b.dataset.commentSubmit));
  document.querySelectorAll("[data-comment-media]").forEach(input => input.onchange = () => {
    const err = validateMedia(input.files);
    if(err){ toast(err); input.value=""; }
    else renderFileSummary(input.id || `comment-${input.dataset.commentMedia}`, `comment-files-${input.dataset.commentMedia}`);
  });
  document.querySelectorAll("[data-comment-delete]").forEach(b => b.onclick = () => deleteComment(b.dataset.commentDelete));
}

function renderComment(c){
  const u = c.profiles || {};
  const own = c.user_id === me?.id;
  return `<div class="comment">
    <div class="avatar small-avatar">${initials(displayName(u))}</div>
    <div class="comment-body">
      <div class="comment-head"><b>${esc(displayName(u))}</b><small>@${esc(u.username||"")} · ${fmt(c.created_at)}${c.updated_at&&c.updated_at!==c.created_at?" · edited":""}</small>${own?`<button class="tiny danger-text comment-delete" data-comment-delete="${c.id}">Delete</button>`:""}</div>
      <div class="comment-text">${esc(c.body)}</div>
      ${mediaHtml(c.media,"comment-media-grid")}
    </div>
  </div>`;
}

function renderProfiles(){
  const seen = new Map();
  posts.forEach(p => {
    if(p.profiles && !seen.has(p.user_id)) seen.set(p.user_id,p.profiles);
    (p.comments || []).forEach(c => { if(c.profiles && !seen.has(c.user_id)) seen.set(c.user_id,c.profiles); });
  });
  if(profile && !seen.has(me.id)) seen.set(me.id,profile);
  $("profilesGrid").innerHTML = [...seen.values()].map(u => {
    const d = displayName(u);
    return `<div class="profile-card"><div class="avatar">${initials(d)}</div><h3>${esc(d)}</h3><p>@${esc(u.username||"")}</p><p>${esc(u.bio||"")}</p><span class="private-tag">MEMBER</span></div>`;
  }).join("") || "<div class='profile-card'><p>No members yet.</p></div>";
}

async function uploadMediaFiles(files){
  const list = [...files];
  const validation = validateMedia(list);
  if(validation) throw new Error(validation);
  const uploaded = [];
  try{
    for(const file of list){
      const ext = (file.name.split(".").pop() || "bin").toLowerCase().replace(/[^a-z0-9]/g,"");
      const path = `${me.id}/${crypto.randomUUID()}.${ext}`;
      const {error} = await sb.storage.from(BUCKET).upload(path,file,{upsert:false,contentType:file.type});
      if(error) throw error;
      uploaded.push({storage_path:path,file_name:file.name,mime_type:file.type});
    }
    return uploaded;
  }catch(e){
    if(uploaded.length) await sb.storage.from(BUCKET).remove(uploaded.map(x=>x.storage_path));
    throw e;
  }
}

async function publish(){
  const body = $("postText").value.trim();
  const input = $("postMedia");
  const files = [...(input?.files || [])];
  if(!body && !files.length){ toast("Write something or attach a photo/video."); return; }
  if(body.length > 500){ toast("Keep posts to 500 characters or less."); return; }

  const {data,error} = await sb.from("posts").insert({user_id:me.id,body:body || ""}).select("id").single();
  if(error){ toast(errText(error)); return; }

  try{
    if(files.length){
      const media = await uploadMediaFiles(files);
      const {error:mediaError} = await sb.from("post_media").insert(media.map(m => ({...m,post_id:data.id,user_id:me.id})));
      if(mediaError) throw mediaError;
    }
  }catch(e){
    await sb.from("posts").delete().eq("id",data.id).eq("user_id",me.id);
    toast(`Post upload failed: ${errText(e)}`);
    return;
  }

  $("postText").value="";
  $("charCount").textContent="0/500";
  if(input) input.value="";
  renderFileSummary("postMedia","postFiles");
  await loadPosts(); renderFeed(); toast("Posted to the community.");
}

async function publishComment(postId){
  const input = document.querySelector(`[data-comment-input="${postId}"]`);
  const mediaInput = document.querySelector(`[data-comment-media="${postId}"]`);
  const body = input?.value.trim() || "";
  const files = [...(mediaInput?.files || [])];
  if(!body && !files.length){ toast("Write a comment or attach a photo/video."); return; }
  if(body.length > 1000){ toast("Keep comments to 1,000 characters or less."); return; }

  const {data,error} = await sb.from("comments").insert({post_id:postId,user_id:me.id,body:body || ""}).select("id").single();
  if(error){ toast(errText(error)); return; }

  try{
    if(files.length){
      const media = await uploadMediaFiles(files);
      const {error:mediaError} = await sb.from("comment_media").insert(media.map(m => ({...m,comment_id:data.id,user_id:me.id})));
      if(mediaError) throw mediaError;
    }
  }catch(e){
    await sb.from("comments").delete().eq("id",data.id).eq("user_id",me.id);
    toast(`Comment upload failed: ${errText(e)}`);
    return;
  }

  await loadPosts(); renderFeed(); toast("Comment added.");
}

async function toggleLike(postId){
  const p = posts.find(x => x.id === postId); if(!p) return;
  if(p.liked){
    const {error} = await sb.from("post_likes").delete().eq("post_id",postId).eq("user_id",me.id);
    if(error){ toast(errText(error)); return; }
  }else{
    const {error} = await sb.from("post_likes").insert({post_id:postId,user_id:me.id});
    if(error && !/duplicate|unique/i.test(error.message)){ toast(errText(error)); return; }
  }
  await loadPosts(); renderFeed();
}

function editPost(id){
  const p = posts.find(x => x.id === id);
  if(!p || p.user_id !== me.id) return;
  editingPostId=id;
  $("postText").value=p.body;
  $("charCount").textContent=`${p.body.length}/500`;
  $("publish").textContent="Save edit";
  $("postText").focus();
}
async function saveEditedPost(){
  const body=$("postText").value.trim();
  if(!editingPostId || !body) return;
  const {error} = await sb.from("posts").update({body,updated_at:new Date().toISOString()}).eq("id",editingPostId).eq("user_id",me.id);
  if(error){ toast(errText(error)); return; }
  editingPostId=null;
  $("postText").value="";
  $("charCount").textContent="0/500";
  $("publish").textContent="Post";
  await loadPosts(); renderFeed(); toast("Post updated.");
}
async function deletePost(id){
  const p=posts.find(x=>x.id===id);
  if(!p || p.user_id!==me.id) return;
  if(!confirm("Delete this post? This cannot be undone.")) return;
  const paths=(p.media||[]).map(m=>m.storage_path);
  const {error}=await sb.from("posts").delete().eq("id",id).eq("user_id",me.id);
  if(error){ toast(errText(error)); return; }
  if(paths.length) await sb.storage.from(BUCKET).remove(paths);
  await loadPosts(); renderFeed(); toast("Post deleted.");
}
async function deleteComment(id){
  const post = posts.find(p => (p.comments||[]).some(c=>c.id===id));
  const comment = post?.comments?.find(c=>c.id===id);
  if(!comment || comment.user_id!==me.id) return;
  if(!confirm("Delete this comment?")) return;
  const paths=(comment.media||[]).map(m=>m.storage_path);
  const {error}=await sb.from("comments").delete().eq("id",id).eq("user_id",me.id);
  if(error){ toast(errText(error)); return; }
  if(paths.length) await sb.storage.from(BUCKET).remove(paths);
  await loadPosts(); renderFeed(); toast("Comment deleted.");
}

function editProfile(){
  const d=profile||{};
  $("profilePanel").innerHTML = `
    <h2>Edit profile</h2>
    <div class="profile-form">
      <label>Display name<input id="pfDisplay" maxlength="80" value="${esc(d.display_name||"")}"></label>
      <label>First name<input id="pfFirst" maxlength="50" value="${esc(d.first_name||"")}"></label>
      <label>Last name<input id="pfLast" maxlength="50" value="${esc(d.last_name||"")}"></label>
      <label>Username<input id="pfUser" maxlength="30" value="${esc(d.username||"")}"></label>
      <label>Bio<textarea id="pfBio" maxlength="280">${esc(d.bio||"")}</textarea></label>
      <label>Location<input id="pfLocation" maxlength="100" value="${esc(d.location||"")}"></label>
      <label>Website<input id="pfWebsite" maxlength="200" type="url" value="${esc(d.website||"")}"></label>
      <div class="actions"><button class="primary" id="saveProfile">Save profile</button><button class="outline" id="cancelProfile">Cancel</button></div>
    </div>`;
  $("saveProfile").onclick=saveProfile;
  $("cancelProfile").onclick=renderApp;
}
async function saveProfile(){
  const username=$("pfUser").value.trim().toLowerCase();
  if(!/^[a-z0-9_.-]{3,30}$/.test(username)){
    toast("Username must be 3–30 characters and use letters, numbers, dots, underscores, or hyphens.");
    return;
  }
  try{
    if(!(await usernameAvailable(username,me.id))){ toast("That username is already taken."); return; }
  }catch(e){ toast("We couldn't check that username. Please try again."); return; }

  const payload={
    display_name:$("pfDisplay").value.trim(),
    first_name:$("pfFirst").value.trim(),
    last_name:$("pfLast").value.trim(),
    username,bio:$("pfBio").value.trim(),
    location:$("pfLocation").value.trim(),
    website:$("pfWebsite").value.trim()
  };
  const {data,error}=await sb.from("profiles").update(payload).eq("id",me.id).select().single();
  if(error){ toast(/duplicate|unique/i.test(error.message)?"That username is already taken.":errText(error)); return; }
  profile=data; await loadPosts(); renderApp(); toast("Profile updated.");
}

$("openLogin").onclick=()=>showAuth("login");
$("openSignup").onclick=()=>showAuth("signup");
$("backPublic").onclick=()=>setScreen("publicView");
$("signOut").onclick=logout;
$("publish").onclick=()=>editingPostId?saveEditedPost():publish();
$("postText").oninput=e=>$("charCount").textContent=`${e.target.value.length}/500`;
$("postMedia").onchange=()=>{
  const input=$("postMedia");
  const err=validateMedia(input.files);
  if(err){ toast(err); input.value=""; }
  else renderFileSummary("postMedia","postFiles");
};
document.querySelectorAll(".side").forEach(b=>b.onclick=()=>{
  document.querySelectorAll(".side").forEach(x=>x.classList.remove("active"));
  b.classList.add("active");
  document.querySelectorAll(".page").forEach(x=>x.classList.add("hidden"));
  $(b.dataset.page+"Page").classList.remove("hidden");
});

sb.auth.onAuthStateChange(async (event,session)=>{
  if(event==="PASSWORD_RECOVERY"){
    me=session?.user || me;
    showAuth("reset");
    return;
  }
  if(session){
    me=session.user;
    try{
      await loadProfile();
      await loadPosts();
      renderApp();
    }catch(e){
      console.error("Auth/profile load failed:",e);
      setScreen("publicView");
      toast("We signed you in, but couldn't load your profile yet.");
    }
  }else if(event==="SIGNED_OUT" || event==="INITIAL_SESSION"){
    me=null; profile=null; posts=[];
    setScreen("publicView");
    $("sessionBadge").textContent="LOCKED";
  }
});

(async()=>{
  const {data}=await sb.auth.getSession();
  if(data.session){
    me=data.session.user;
    if(new URLSearchParams(window.location.search).get("reset")==="1"){
      showAuth("reset");
      return;
    }
    try{ await loadProfile(); await loadPosts(); renderApp(); }
    catch(e){ console.error(e); setScreen("publicView"); }
  }else{
    setScreen("publicView");
  }
})();
