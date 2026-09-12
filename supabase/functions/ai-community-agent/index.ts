import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || (() => {
  try { return JSON.parse(Deno.env.get("SUPABASE_SECRET_KEYS") || "{}")["default"]; }
  catch { return ""; }
})();
const supabaseAdmin = createClient(SUPABASE_URL, SERVICE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false, detectSessionInUrl: false }
});

const OPENAI_MODEL = Deno.env.get("OPENAI_MODEL") || "gpt-5.6-luna";
const AI_EMAIL = Deno.env.get("AI_AGENT_EMAIL") || "onemuslim-ai@ai.onemuslim.local";
const AI_USERNAME = "onemuslim_ai";
const AI_DISPLAY = "OneMuslim AI";
const AI_LABEL = "AI";
const EMOJIS = ["🔥", "❤️", "😂", "🤨", "😡"];

const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), {
  status,
  headers: { "Content-Type": "application/json" }
});

function parseJson(text: string) {
  const trimmed = String(text || "").trim();
  try { return JSON.parse(trimmed); } catch {}
  const fenced = trimmed.replace(/^```(?:json)?/i, "").replace(/```$/i, "").trim();
  try { return JSON.parse(fenced); } catch {}
  const start = fenced.indexOf("{");
  const end = fenced.lastIndexOf("}");
  if (start >= 0 && end > start) return JSON.parse(fenced.slice(start, end + 1));
  throw new Error("AI returned invalid JSON.");
}

async function getSecret(name: string) {
  const envName = name === "openai_api_key" ? "OPENAI_API_KEY" : "";
  const envValue = envName ? Deno.env.get(envName) : null;
  if (envValue) return envValue;
  const { data, error } = await supabaseAdmin.rpc("get_ai_agent_secret", { p_name: name });
  if (error) throw error;
  return data || null;
}

async function ensureAiAccount() {
  const { data: existing, error: lookupError } = await supabaseAdmin
    .from("profiles").select("id").eq("username", AI_USERNAME).maybeSingle();
  if (lookupError) throw lookupError;
  if (existing?.id) {
    await upsertAiProfile(existing.id);
    return existing.id;
  }

  const password = `${crypto.randomUUID()}-${crypto.randomUUID()}`;
  const { data: created, error: createError } = await supabaseAdmin.auth.admin.createUser({
    email: AI_EMAIL,
    password,
    email_confirm: true,
    user_metadata: {
      display_name: AI_DISPLAY, username: AI_USERNAME,
      first_name: "OneMuslim", last_name: "AI", is_ai: true
    },
    app_metadata: { role: "ai_agent", is_ai: true }
  });

  if (createError) {
    if (/already.*registered|already.*exists/i.test(createError.message)) {
      const { data: users, error: listError } = await supabaseAdmin.auth.admin.listUsers({ page: 1, perPage: 1000 });
      if (listError) throw listError;
      const match = users.users.find((u) => u.email === AI_EMAIL);
      if (match) { await upsertAiProfile(match.id); return match.id; }
    }
    throw createError;
  }

  const id = created.user!.id;
  await upsertAiProfile(id);
  return id;
}

async function upsertAiProfile(id: string) {
  const { error } = await supabaseAdmin.from("profiles").upsert({
    id,
    display_name: AI_DISPLAY,
    username: AI_USERNAME,
    first_name: "OneMuslim",
    last_name: "AI",
    bio: "A clearly labeled AI community participant. Posts and comments are generated automatically.",
    profile_title: "AI",
    is_ai: true,
    ai_label: AI_LABEL
  }, { onConflict: "id" });
  if (error) throw error;
}

function extractOutputText(payload: any) {
  if (typeof payload?.output_text === "string") return payload.output_text;
  const chunks: string[] = [];
  for (const item of payload?.output || []) {
    for (const part of item?.content || []) {
      if (typeof part?.text === "string") chunks.push(part.text);
    }
  }
  return chunks.join("\n");
}

async function callAi(prompt: string) {
  const key = await getSecret("openai_api_key");
  if (!key) throw new Error("Missing OPENAI_API_KEY. Add it as an Edge Function secret or as Supabase Vault secret 'openai_api_key'.");

  const response = await fetch("https://api.openai.com/v1/responses", {
    method: "POST",
    headers: { "Content-Type": "application/json", "Authorization": `Bearer ${key}` },
    body: JSON.stringify({
      model: OPENAI_MODEL,
      input: [
        { role: "system", content: [{ type: "input_text", text:
          "You are OneMuslim AI, a transparent AI participant on a Muslim social community. " +
          "Never pretend to be human. Be warm, concise, thoughtful, and respectful. " +
          "Do not fabricate Quran verses, hadith, quotations, dates, or scholarly claims. " +
          "If a religious claim cannot be stated confidently, avoid it rather than inventing a citation. " +
          "Do not issue legal, medical, or financial instructions. " +
          "Return only valid JSON with exactly: body, title, source_url. source_url must be null unless it is a stable HTTPS URL on quran.com or sunnah.com that you are confident is relevant."
        }] },
        { role: "user", content: [{ type: "input_text", text: prompt }] }
      ],
      text: { format: { type: "json_object" } },
      max_output_tokens: 500
    })
  });

  const payload = await response.json();
  if (!response.ok) throw new Error(payload?.error?.message || "OpenAI request failed.");
  return parseJson(extractOutputText(payload));
}

function createCardSvg(title: string, body: string) {
  const escSvg = (s: string) => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;")
    .replace(/>/g, "&gt;").replace(/\"/g, "&quot;").replace(/'/g, "&apos;");
  const short = body.length > 170 ? body.slice(0, 167).trimEnd() + "…" : body;
  const lines: string[] = [];
  let line = "";
  for (const word of short.split(/\s+/)) {
    const next = line ? `${line} ${word}` : word;
    if (next.length > 42) { if (line) lines.push(line); line = word; } else line = next;
  }
  if (line) lines.push(line);
  const bodyLines = lines.slice(0, 5);
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="675" viewBox="0 0 1200 675"><defs><linearGradient id="g" x1="0" x2="1" y1="0" y2="1"><stop offset="0" stop-color="#061a36"/><stop offset="0.55" stop-color="#0d4f86"/><stop offset="1" stop-color="#36a3d9"/></linearGradient></defs><rect width="1200" height="675" rx="42" fill="url(#g)"/><circle cx="1020" cy="120" r="150" fill="#fff" opacity=".08"/><circle cx="180" cy="590" r="190" fill="#fff" opacity=".06"/><text x="80" y="105" font-family="Arial,sans-serif" font-size="30" font-weight="700" fill="#d8efff">ONEMUSLIM AI · UPDATE</text><text x="80" y="180" font-family="Arial,sans-serif" font-size="52" font-weight="800" fill="#fff">${escSvg(title.slice(0, 54))}</text>${bodyLines.map((l,i)=>`<text x="80" y="${270+i*54}" font-family="Arial,sans-serif" font-size="31" fill="#fff" opacity=".94">${escSvg(l)}</text>`).join("")}<text x="80" y="610" font-family="Arial,sans-serif" font-size="24" fill="#d8efff">Generated automatically · AI account · @onemuslim_ai</text></svg>`;
  return new TextEncoder().encode(svg);
}

async function publishPost(agentId: string, content: any, includeImage: boolean, includeLink: boolean) {
  let body = String(content?.body || "").trim().slice(0, 900);
  const source = typeof content?.source_url === "string" ? content.source_url.trim() : "";
  const allowedSource = includeLink && /^https:\/\/(www\.)?(quran\.com|sunnah\.com)(\/|$)/i.test(source) ? source : "";
  if (allowedSource) body = `${body}\n\nSource: ${allowedSource}`.slice(0, 1000);

  const { data: post, error: postError } = await supabaseAdmin.from("posts")
    .insert({ user_id: agentId, body }).select("id").single();
  if (postError) throw postError;

  if (includeImage) {
    const bytes = createCardSvg(String(content?.title || "OneMuslim update"), body);
    const path = `${agentId}/ai/${post.id}.svg`;
    const { error: uploadError } = await supabaseAdmin.storage.from("community-media")
      .upload(path, bytes, { contentType: "image/svg+xml", upsert: false });
    if (uploadError) throw uploadError;
    const { error: mediaError } = await supabaseAdmin.from("post_media").insert({
      post_id: post.id, user_id: agentId, storage_path: path,
      file_name: `${post.id}.svg`, mime_type: "image/svg+xml"
    });
    if (mediaError) throw mediaError;
  }

  await supabaseAdmin.from("ai_agent_actions").insert({
    agent_user_id: agentId, action_type: "post", content: body,
    metadata: { title: content?.title || "", source_url: allowedSource || null, generated_image: includeImage }
  });
  return post.id;
}

async function reactAndComment(agentId: string, post: any) {
  const { data: existing } = await supabaseAdmin.from("ai_agent_actions")
    .select("action_type").eq("agent_user_id", agentId).eq("target_post_id", post.id)
    .in("action_type", ["comment", "reaction"]);
  const done = new Set((existing || []).map((x) => x.action_type));

  if (!done.has("reaction")) {
    const emoji = EMOJIS[Math.floor(Math.random() * EMOJIS.length)];
    const { error } = await supabaseAdmin.from("post_reactions").upsert(
      { post_id: post.id, user_id: agentId, emoji }, { onConflict: "post_id,user_id" });
    if (!error) await supabaseAdmin.from("ai_agent_actions").insert({
      agent_user_id: agentId, action_type: "reaction", target_post_id: post.id, emoji
    });
  }

  if (!done.has("comment")) {
    const content = await callAi(
      `Write one short, natural comment under 300 characters responding directly to this community post. ` +
      `Do not repeat it, do not praise it generically, and do not invent facts. If it asks a question, answer briefly or add a useful perspective. ` +
      `Return JSON with body, title, source_url; title and source_url can be empty/null. POST: ${post.body || "(media-only post)"}`
    );
    const body = String(content?.body || "").trim().slice(0, 1000);
    if (body) {
      const { data: comment, error } = await supabaseAdmin.from("comments")
        .insert({ post_id: post.id, user_id: agentId, body }).select("id").single();
      if (error) throw error;
      await supabaseAdmin.from("ai_agent_actions").insert({
        agent_user_id: agentId, action_type: "comment", target_post_id: post.id,
        target_comment_id: comment.id, content: body
      });
    }
  }
}

async function run(headerSecret: string) {
  if (!headerSecret) return json({ ok: false, error: "Unauthorized" }, 401);
  const { data: valid, error: verifyError } = await supabaseAdmin.rpc(
    "verify_ai_agent_cron_secret", { p_secret: headerSecret }
  );
  if (verifyError || !valid) return json({ ok: false, error: "Unauthorized" }, 401);

  const { data: config, error: configError } = await supabaseAdmin.from("ai_agent_config")
    .select("*").eq("id", "default").single();
  if (configError) throw configError;
  if (!config.enabled) return json({ ok: true, skipped: "disabled" });

  const agentId = config.agent_user_id || await ensureAiAccount();
  if (!config.agent_user_id) await supabaseAdmin.from("ai_agent_config")
    .update({ agent_user_id: agentId, updated_at: new Date().toISOString() }).eq("id", "default");

  const intervalMs = Number(config.interval_seconds) * 1000;
  const since = new Date(Date.now() - intervalMs).toISOString();
  const { count: recentPosts } = await supabaseAdmin.from("ai_agent_actions")
    .select("id", { count: "exact", head: true }).eq("agent_user_id", agentId)
    .eq("action_type", "post").gte("created_at", since);
  if ((recentPosts || 0) > 0) return json({ ok: true, skipped: "interval" });

  const dayStart = new Date(); dayStart.setUTCHours(0,0,0,0);
  const { count: todayPosts } = await supabaseAdmin.from("ai_agent_actions")
    .select("id", { count: "exact", head: true }).eq("agent_user_id", agentId)
    .eq("action_type", "post").gte("created_at", dayStart.toISOString());
  if ((todayPosts || 0) >= Number(config.max_posts_per_day)) return json({ ok: true, skipped: "post_limit" });

  const { data: recent } = await supabaseAdmin.from("posts")
    .select("id,user_id,body,created_at").neq("user_id", agentId)
    .order("created_at", { ascending: false }).limit(40);
  const { data: priorActions } = await supabaseAdmin.from("ai_agent_actions")
    .select("target_post_id,action_type").eq("agent_user_id", agentId)
    .in("action_type", ["comment", "reaction"]).not("target_post_id", "is", null);
  const seen = new Set((priorActions || []).map((a) => `${a.action_type}:${a.target_post_id}`));
  const target = (recent || []).find((p) => !seen.has(`comment:${p.id}`) || !seen.has(`reaction:${p.id}`));

  const context = (recent || []).slice(0, 8).map((p) => `- ${p.body || "(media-only post)"}`).join("\n");
  const generated = await callAi(
    `Create one original social post for a Muslim community. Keep it 1–3 sentences and under 500 characters. ` +
    `It may be a thoughtful reminder, practical reflection, community question, or response to a current theme. ` +
    `Do not manufacture Quran/hadith citations. If a source is useful, only use a stable Quran.com or Sunnah.com URL you are confident is relevant; otherwise source_url must be null. ` +
    `Return a concise title and body. Recent community themes:\n${context}`
  );
  const postId = await publishPost(agentId, generated, Boolean(config.include_images), Boolean(config.include_links));

  let engagedPost = null;
  if (target) { await reactAndComment(agentId, target); engagedPost = target.id; }
  return json({ ok: true, post_id: postId, engaged_post_id: engagedPost, agent_user_id: agentId });
}

Deno.serve(async (req) => {
  if (req.method !== "POST") return json({ ok: false, error: "POST required" }, 405);
  try { return await run(req.headers.get("x-ai-cron-secret") || ""); }
  catch (error) {
    console.error("ai-community-agent", error);
    return json({ ok: false, error: error instanceof Error ? error.message : String(error) }, 500);
  }
});
