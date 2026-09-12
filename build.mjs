import fs from "node:fs";
import path from "node:path";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";
if (!url || !key) console.warn("Supabase environment variables are not configured for this Vercel build.");

fs.rmSync("dist", { recursive: true, force: true });
fs.mkdirSync("dist/assets/avatars", { recursive: true });
fs.mkdirSync("dist/assets/onemuslim", { recursive: true });
fs.mkdirSync("dist/assets/avatar", { recursive: true });

for (const f of ["index.html","styles.css","app.js","floating-profile-notes.js","home-dashboard.js","lesson-fix.js","profile-auth-fix.js","social-features.js","member-discovery.js","people-theme.css","people-profile-layer.js","profile-system.js","notes-post-search.js","islamic-tags-xp.js","notes-social-upgrade.js","profile-private-notes.js","profile-builder.js","profile-save-fix.js","profile-builder-v2.css","profile-avatar-fix.css","dashboard-theme.css","dashboard-theme.js","global-parallax.css","landing-enhancements.css","landing-enhancements.js","parallax-journey.css","parallax-journey.js","one-muslim-navigation.js","navigation.css","onemuslim-theme.css","onemuslim-home.css","homepage-navigation.css","ui-fixes.css","one-muslim-final-ui.css","ui-fixes.js","start-pack.js","guest-xp.js","auth-session-guard.js","auth-session-loader-v2.js","coming-soon.html","coming-soon.css","coming-soon.js","landing.html","landing.css","landing-earth.css","landing-nature.css","landing.js","landing-clouds.svg","supabase-client.js","video-master.html","doxd.html","doxd.css","doxd.js","doxd-media.js","community.html","community.css","community-page.js","messages.html","community-messages.js"])
  if (fs.existsSync(f)) fs.copyFileSync(f, path.join("dist", f));

if (fs.existsSync("assets/avatar")) fs.cpSync("assets/avatar", "dist/assets/avatar", { recursive: true });
if (fs.existsSync("assets/mascot.jpeg")) fs.copyFileSync("assets/mascot.jpeg", "dist/assets/mascot.jpeg");
for (const f of ["emerald.svg","sapphire.svg","amber.svg","onyx.svg","ruby.svg","pearl.svg","platinum-male.PNG","platinum-female.PNG"])
  if (fs.existsSync(`assets/avatars/${f}`)) fs.copyFileSync(`assets/avatars/${f}`, path.join("dist/assets/avatars", f));
for (const f of ["pattern-light.svg","pattern-dark.svg","mosque-light.svg","mosque-dark.svg","crescent-gold.svg","divider-gold.svg","divider-green.svg","arch-gold.svg","corner-ornament.svg","hero-ornament.svg","celestial-sunrise.svg","golden-blue-cosmic-particles.svg","cinematic-golden-clouds.svg"])
  if (fs.existsSync(`assets/onemuslim/${f}`)) fs.copyFileSync(`assets/onemuslim/${f}`, path.join("dist/assets/onemuslim", f));

let html = fs.readFileSync("dist/index.html", "utf8");
for (const f of ["home-dashboard.js","lesson-fix.js","profile-auth-fix.js","social-features.js","member-discovery.js","notes-post-search.js","islamic-tags-xp.js","notes-social-upgrade.js","profile-private-notes.js","profile-builder.js","profile-save-fix.js","dashboard-theme.js","one-muslim-navigation.js","ui-fixes.js","auth-session-loader-v2.js"])
  if (fs.existsSync(f) && !html.includes(`src="${f}`)) html = html.replace("</body>", `<script src="${f}"></script>\n</body>`);

if (fs.existsSync("dist/landing.html")) {
  let landing = fs.readFileSync("dist/landing.html", "utf8");
  if (!landing.includes('landing-earth.css') && fs.existsSync("dist/landing-earth.css")) landing = landing.replace('</head>', '<link rel="stylesheet" href="landing-earth.css">\n</head>');
  if (!landing.includes('landing-nature.css') && fs.existsSync("dist/landing-nature.css")) landing = landing.replace('</head>', '<link rel="stylesheet" href="landing-nature.css">\n</head>');
  fs.writeFileSync("dist/landing.html", landing);
}
fs.writeFileSync("dist/index.html", html);
fs.writeFileSync("dist/config.js", `window.APP_CONFIG=${JSON.stringify({ SUPABASE_URL: url, SUPABASE_ANON_KEY: key })};\n`);
console.log(`Built OneMuslim into dist/ (Supabase config: ${url && key ? "configured" : "not configured"})`);