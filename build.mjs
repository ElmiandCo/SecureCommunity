import fs from "node:fs";
import path from "node:path";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";
if (!url || !key) console.warn("Supabase environment variables are not configured for this Vercel build.");

fs.rmSync("dist", { recursive: true, force: true });
fs.mkdirSync("dist/assets/avatars", { recursive: true });
fs.mkdirSync("dist/assets/onemuslim", { recursive: true });

for (const f of ["index.html","styles.css","app.js","floating-profile-notes.js","home-dashboard.js","lesson-fix.js","profile-auth-fix.js","social-features.js","member-discovery.js","notes-post-search.js","islamic-tags-xp.js","notes-social-upgrade.js","profile-private-notes.js","profile-builder.js","profile-save-fix.js","profile-builder-v2.css","dashboard-theme.css","dashboard-theme.js","landing-enhancements.css","landing-enhancements.js","one-muslim-navigation.js","navigation.css","onemuslim-theme.css","onemuslim-home.css","homepage-navigation.css","ui-fixes.css","one-muslim-final-ui.css","ui-fixes.js","start-pack.js","guest-xp.js","auth-session-guard.js","coming-soon.html","coming-soon.css","coming-soon.js","landing.html","landing.css","landing-earth.css","landing-nature.css","landing.js","landing-clouds.svg","supabase-client.js"])
  fs.copyFileSync(f, path.join("dist", f));

fs.copyFileSync("assets/mascot.jpeg", "dist/assets/mascot.jpeg");
for (const f of ["emerald.svg","sapphire.svg","amber.svg","onyx.svg","ruby.svg","pearl.svg","platinum-male.PNG","platinum-female.PNG"])
  fs.copyFileSync(`assets/avatars/${f}`, path.join("dist/assets/avatars", f));
for (const f of ["pattern-light.svg","pattern-dark.svg","mosque-light.svg","mosque-dark.svg","crescent-gold.svg","divider-gold.svg","divider-green.svg","arch-gold.svg","corner-ornament.svg","hero-ornament.svg"])
  fs.copyFileSync(`assets/onemuslim/${f}`, path.join("dist/assets/onemuslim", f));

let html = fs.readFileSync("dist/index.html", "utf8");
for (const f of ["home-dashboard.js","lesson-fix.js","profile-auth-fix.js","social-features.js","member-discovery.js","notes-post-search.js","islamic-tags-xp.js","notes-social-upgrade.js","profile-private-notes.js","profile-builder.js","profile-save-fix.js","dashboard-theme.js","one-muslim-navigation.js","ui-fixes.js","auth-session-guard.js"])
  if (!html.includes(`src="${f}"`)) html = html.replace("</body>", `<script src="${f}"></script>\n</body>`);

let landing = fs.readFileSync("dist/landing.html", "utf8");
if (!landing.includes('landing-earth.css')) landing = landing.replace('</head>', '<link rel="stylesheet" href="landing-earth.css">\n</head>');
if (!landing.includes('landing-nature.css')) landing = landing.replace('</head>', '<link rel="stylesheet" href="landing-nature.css">\n</head>');
fs.writeFileSync("dist/landing.html", landing);
fs.writeFileSync("dist/index.html", html);
fs.writeFileSync("dist/config.js", `window.APP_CONFIG=${JSON.stringify({ SUPABASE_URL: url, SUPABASE_ANON_KEY: key })};\n`);
console.log(`Built OneMuslim into dist/ (Supabase config: ${url && key ? "configured" : "not configured"})`);