import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const USERNAME = "onemuslim_ai";
const EMOJIS = ["🔥", "❤️", "😂", "🤨", "😡"];
const MODEL = Deno.env.get("OPENAI_MODEL") || "gpt-5.6-luna";
let db: any = null;

const out = (x: unknown, status = 200) => new Response(JSON.stringify(x), { status, headers: { "Content-Type": "application/json" } });

function admin() {
  if (db) return db;
  const url = Deno.env.get("SUPABASE_URL") || "";
  let key = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
  if (!key) { try { key = JSON.parse(Deno.env.get("SUPABASE_SECRET_KEYS") || "{}").default || ""; } catch {} }
  if (!url || !key) throw new Error("Supabase server credentials are not available.");
  db = createClient(url, key, { auth: { autoRefreshToken:false, persistSession:false, detectSessionInUrl:false } });
  return db;
}

async function secret(name: string) {
  const env = name === "openai_api_key" ? Deno.env.get("OPENAI_API_KEY") : null;
  if (env) return env;
  const { data, error } = await admin().rpc("get_ai_agent_secret", { p_name:name });
  if (error) throw error;
  return data || null;
}

function parseJson(s: string) {
  const t = String(s || "").trim().replace(/^```json/i,"").replace(/```$/i,"").trim();
  try { return JSON.parse(t); } catch {}
  const a=t.indexOf("{"), b=t.lastIndexOf("}");
  if(a>=0 && b>a) return JSON.parse(t.slice(a,b+1));
  throw new Error("AI returned invalid JSON.");
}

async function ai(prompt:string) {
  const key=await secret("openai_api_key");
  if(!key) throw new Error("Missing OPENAI_API_KEY. Add it as an Edge Function secret or Supabase Vault secret 'openai_api_key'.");
  const r=await fetch("https://api.openai.com/v1/responses",{method:"POST",headers:{"Content-Type":"application/json","Authorization":`Bearer ${key}`},body:JSON.stringify({
    model:MODEL,
    input:[
      {role:"system",content:[{type:"input_text",text:"You are OneMuslim AI, a clearly labeled AI participant. Never pretend to be human. Be concise, warm and respectful. Never invent Quran verses, hadith, quotations, dates or scholarly claims. Avoid religious claims you cannot confidently support. Return JSON with body, title, source_url."}]},
      {role:"user",content:[{type:"input_text",text:prompt}]}
    ],
    text:{format:{type:"json_object"}},max_output_tokens:500
  })});
  const p=await r.json();
  if(!r.ok) throw new Error(p?.error?.message || "OpenAI request failed.");
  const text=typeof p.output_text==="string" ? p.output_text : (p.output||[]).flatMap((x:any)=>x.content||[]).map((x:any)=>x.text||"").join("\n");
  return parseJson(text);
}

function card(title:string, body:string) {
  const e=(s:string)=>String(s).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;");
  const lines:string[]=[]; let line="";
  for(const w of body.slice(0,170).split(/\s+/)){const n=line?`${line} ${w}`:w;if(n.length>44){if(line)lines.push(line);line=w;}else line=n;}
  if(line)lines.push(line);
  const svg=`<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="675"><defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop stop-color="#061a36"/><stop offset=".55" stop-color="#0d4f86"/><stop offset="1" stop-color="#36a3d9"/></linearGradient></defs><rect width="1200" height="675" rx="42" fill="url(#g)"/><text x="70" y="100" fill="#d8efff" font-family="Arial" font-size="30" font-weight="700">ONEMUSLIM AI · UPDATE</text><text x="70" y="175" fill="white" font-family="Arial" font-size="50" font-weight="800">${e(title.slice(0,55))}</text>${lines.slice(0,5).map((x,i)=>`<text x="70" y="${260+i*55}" fill="white" font-family="Arial" font-size="31">${e(x)}</text>`).join("")}<text x="70" y="615" fill="#d8efff" font-family="Arial" font-size="23">Generated automatically · AI account · @onemuslim_ai</text></svg>`;
  return new TextEncoder().encode(svg);
}

async function agentId() {
  const {data,error}=await admin().from("profiles").select("id").eq("username",USERNAME).maybeSingle();
  if(error)throw error;
  if(!data?.id)throw new Error("OneMuslim AI account is not initialized.");
  return data.id;
}

async function makePost(id:string,c:any,cfg:any) {
  const db=admin(); let body=String(c?.body||"").trim().slice(0,900);
  const u=typeof c?.source_url==="string"?c.source_url.trim():"";
  const source=cfg.include_links && /^https:\/\/(www\.)?(quran\.com|sunnah\.com)(\/|$)/i.test(u)?u:"";
  if(source)body=`${body}\n\nSource: ${source}`.slice(0,1000);
  const {data:p,error}=await db.from("posts").insert({user_id:id,body}).select("id").single(); if(error)throw error;
  if(cfg.include_images){
    const path=`${id}/ai/${p.id}.svg`;
    const up=await db.storage.from("community-media").upload(path,card(String(c?.title||"OneMuslim update"),body),{contentType:"image/svg+xml",upsert:false});
    if(up.error)throw up.error;
    const m=await db.from("post_media").insert({post_id:p.id,user_id:id,storage_path:path,file_name:`${p.id}.svg`,mime_type:"image/svg+xml"});
    if(m.error)throw m.error;
  }
  const a=await db.from("ai_agent_actions").insert({agent_user_id:id,action_type:"post",content:body,metadata:{title:c?.title||"",source_url:source||null,generated_image:!!cfg.include_images}}); if(a.error)throw a.error;
  return p.id;
}

async function engage(id:string,post:any) {
  const db=admin();
  const {data:actions}=await db.from("ai_agent_actions").select("action_type").eq("agent_user_id",id).eq("target_post_id",post.id).in("action_type",["comment","reaction"]);
  const done=new Set((actions||[]).map((x:any)=>x.action_type));
  if(!done.has("reaction")){const emoji=EMOJIS[Math.floor(Math.random()*EMOJIS.length)];const r=await db.from("post_reactions").upsert({post_id:post.id,user_id:id,emoji},{onConflict:"post_id,user_id"});if(!r.error)await db.from("ai_agent_actions").insert({agent_user_id:id,action_type:"reaction",target_post_id:post.id,emoji});}
  if(!done.has("comment")){
    const c=await ai(`Write one natural comment under 300 characters responding directly to this post. Do not repeat it, flatter generically, or invent facts. If it asks a question, answer briefly. POST: ${post.body||"(media-only post)"}`);
    const body=String(c?.body||"").trim().slice(0,1000);
    if(body){const {data:comment,error}=await db.from("comments").insert({post_id:post.id,user_id:id,body}).select("id").single();if(error)throw error;await db.from("ai_agent_actions").insert({agent_user_id:id,action_type:"comment",target_post_id:post.id,target_comment_id:comment.id,content:body});}
  }
}

async function run(header:string){
  if(!header)return out({ok:false,error:"Unauthorized"},401);
  const db=admin(); const v=await db.rpc("verify_ai_agent_cron_secret",{p_secret:header}); if(v.error||!v.data)return out({ok:false,error:"Unauthorized"},401);
  const {data:cfg,error}=await db.from("ai_agent_config").select("*").eq("id","default").single(); if(error)throw error; if(!cfg.enabled)return out({ok:true,skipped:"disabled"});
  const id=cfg.agent_user_id||await agentId();
  const since=new Date(Date.now()-Number(cfg.interval_seconds)*1000).toISOString();
  const rc=await db.from("ai_agent_actions").select("id",{count:"exact",head:true}).eq("agent_user_id",id).eq("action_type","post").gte("created_at",since); if((rc.count||0)>0)return out({ok:true,skipped:"interval"});
  const day=new Date();day.setUTCHours(0,0,0,0); const tc=await db.from("ai_agent_actions").select("id",{count:"exact",head:true}).eq("agent_user_id",id).eq("action_type","post").gte("created_at",day.toISOString()); if((tc.count||0)>=Number(cfg.max_posts_per_day))return out({ok:true,skipped:"post_limit"});
  const posts=await db.from("posts").select("id,user_id,body,created_at").neq("user_id",id).order("created_at",{ascending:false}).limit(40); if(posts.error)throw posts.error;
  const acts=await db.from("ai_agent_actions").select("target_post_id,action_type").eq("agent_user_id",id).in("action_type",["comment","reaction"]).not("target_post_id","is",null); if(acts.error)throw acts.error;
  const seen=new Set((acts.data||[]).map((x:any)=>`${x.action_type}:${x.target_post_id}`)); const target=(posts.data||[]).find((p:any)=>!seen.has(`comment:${p.id}`)||!seen.has(`reaction:${p.id}`));
  const context=(posts.data||[]).slice(0,8).map((p:any)=>`- ${p.body||"(media-only post)"}`).join("\n");
  const c=await ai(`Create one original Muslim-community post, 1–3 sentences and under 500 characters. It may be a thoughtful reminder, practical reflection, community question, or response to a theme. Do not manufacture Quran/hadith citations. If a source is useful, only use a stable Quran.com or Sunnah.com URL you are confident is relevant; otherwise source_url=null. Recent themes:\n${context}`);
  const postId=await makePost(id,c,cfg); if(target)await engage(id,target); return out({ok:true,post_id:postId,engaged_post_id:target?.id||null});
}

Deno.serve(async(req)=>{if(req.method!=="POST")return out({ok:false,error:"POST required"},405);try{return await run(req.headers.get("x-ai-cron-secret")||"");}catch(e){console.error(e);return out({ok:false,error:e instanceof Error?e.message:String(e)},500);}});
