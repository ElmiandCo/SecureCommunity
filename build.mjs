import fs from "node:fs";
import path from "node:path";
const url=process.env.NEXT_PUBLIC_SUPABASE_URL||""; const key=process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY||"";
if(!url||!key)throw new Error("Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY in Vercel environment variables.");
fs.rmSync("dist",{recursive:true,force:true}); fs.mkdirSync("dist/assets/avatars",{recursive:true});
for(const f of ["index.html","styles.css","input-fix.css","app.js","lesson-fix.js","profile-auth-fix.js","social-features.js","member-discovery.js","notes-post-search.js","islamic-tags-xp.js","notes-social-upgrade.js","profile-private-notes.js","header-home-lock.js","community-posts-notes.js","avatar-profile-picker.js","green-override.css","interaction-fix.js"])if(fs.existsSync(f))fs.copyFileSync(f,path.join("dist",f));
if(fs.existsSync("home-dashboard-safe.js"))fs.copyFileSync("home-dashboard-safe.js","dist/home-dashboard.js");
const supabaseCandidates=["node_modules/@supabase/supabase-js/dist/umd/supabase.js","node_modules/@supabase/supabase-js/dist/main/index.js","node_modules/@supabase/supabase-js/dist/module/index.js"];
const supabaseSource=supabaseCandidates.find(fs.existsSync);
if(supabaseSource)fs.copyFileSync(supabaseSource,"dist/supabase.js");
for(const f of ["emerald.svg","sapphire.svg","amber.svg","onyx.svg","ruby.svg","pearl.svg"])if(fs.existsSync(`assets/avatars/${f}`))fs.copyFileSync(`assets/avatars/${f}`,path.join("dist/assets/avatars",f));
let html=fs.readFileSync("dist/index.html","utf8");
if(supabaseSource)html=html.replace(/<script src="https:\/\/cdn\.jsdelivr\.net\/npm\/@supabase\/supabase-js@2"><\/script>/g,`<script src="supabase.js" defer></script>`);
html=html.replace(/<script src="config\.js"><\/script>/g,`<script src="config.js" defer></script>`);
html=html.replace(/<script src="app\.js"><\/script>/g,`<script src="app.js" defer></script>`);
for(const f of ["home-dashboard.js","lesson-fix.js","profile-auth-fix.js","social-features.js","member-discovery.js","notes-post-search.js","islamic-tags-xp.js","notes-social-upgrade.js","profile-private-notes.js","header-home-lock.js","community-posts-notes.js","avatar-profile-picker.js","interaction-fix.js"]){if(fs.existsSync(f)&&!html.includes(`src="${f}"`))html=html.replace("</body>",`<script src="${f}" defer></script>\n</body>`);}
if(!html.includes('href="input-fix.css"')&&fs.existsSync("input-fix.css"))html=html.replace("</head>",`<link rel="stylesheet" href="input-fix.css">\n</head>`);
if(!html.includes('href="green-override.css"')&&fs.existsSync("green-override.css"))html=html.replace("</head>",`<link rel="stylesheet" href="green-override.css">\n</head>`);
fs.writeFileSync("dist/index.html",html);fs.writeFileSync("dist/config.js",`window.APP_CONFIG=${JSON.stringify({SUPABASE_URL:url,SUPABASE_ANON_KEY:key})};\n`);console.log("Built E Secure Community with resilient Supabase SDK resolution and optional feature-file copying.");
