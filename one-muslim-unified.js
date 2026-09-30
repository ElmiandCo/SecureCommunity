/* One Muslim unified redesign — intentionally loaded last. */
(()=>{'use strict';
const $=(s,r=document)=>r.querySelector(s);
function auth(mode){if(typeof window.__omOpenAuth==='function')window.__omOpenAuth(mode);else document.getElementById(mode==='signup'?'openSignup':'openLogin')?.click();}
function publicHome(){
 const pv=$('#publicView'); if(!pv)return;
 if($('#appView')&&!$('#appView').classList.contains('hidden'))return;
 pv.innerHTML=`
 <div class="om-unified-landing" id="omUnifiedHome">
  <nav class="om-unified-nav">
   <a class="om-unified-brand" href="index.html"><img src="assets/won-muslim-logo.svg" alt="One Muslim"><span>ONE MUSLIM</span></a>
   <div class="om-unified-navlinks"><a href="#om-platform">Platform</a><a href="#om-community">Community</a><a href="#om-learn">Knowledge</a><a href="#om-live">LIVE</a><a href="hudhud-ai.html">HudHud AI</a></div>
   <div class="om-unified-actions"><button class="om-btn" data-auth="login">Sign in</button><button class="om-btn primary" data-auth="signup">Get started</button></div>
  </nav>
  <section class="om-unified-hero">
   <div class="om-unified-hero-copy">
    <span class="om-kicker">THE MUSLIM DIGITAL HOME</span>
    <h1>Faith.<br><em>Knowledge.</em><br>Community.</h1>
    <p>One Muslim brings your community, Islamic learning, personal growth, profiles, conversations and LIVE experiences into one calm, beautiful space.</p>
    <div class="om-hero-actions"><button class="om-btn primary" data-auth="signup">Enter One Muslim →</button><button class="om-btn" data-auth="login">I already have an account</button></div>
    <div class="om-hero-proof"><span><i></i>Community</span><span><i></i>Learning</span><span><i></i>LIVE</span><span><i></i>Personal growth</span></div>
   </div>
   <div class="om-hero-art"><div class="om-arch"><div class="om-arch-moon"></div><div class="om-arch-mosque"></div><div class="om-arch-word">ONE MUSLIM</div><div class="om-arch-sub">FAITH · KNOWLEDGE · COMMUNITY</div></div><div class="om-float a"><b>✦ Learning</b><small>Continue your journey</small></div><div class="om-float b"><b>🔴 LIVE</b><small>Join the community</small></div><div class="om-float c"><b>1,240 XP</b><small>Your progress matters</small></div></div>
  </section>
  <section class="om-unified-section" id="om-platform"><div class="om-section-center"><span class="om-kicker">ONE PLATFORM</span><h2>Everything you need.<br><em>Nothing you don't.</em></h2><p>A focused digital home designed around the Muslim experience instead of a generic social network with Islamic content added afterward.</p></div>
   <div class="om-feature-grid">
    <article class="om-feature featured"><div class="om-feature-icon">◉</div><h3>Community that feels intentional.</h3><p>Follow people, discover communities, share posts, react, comment and build real connections without losing the purpose of the space.</p><div class="om-feature-meta">PEOPLE · COMMUNITIES · FEED</div></article>
    <article class="om-feature"><div class="om-feature-icon">▣</div><h3>Learn</h3><p>Lessons, learning paths, Qur'an-focused content and visible progress.</p><div class="om-feature-meta">KNOWLEDGE</div></article>
    <article class="om-feature"><div class="om-feature-icon">♛</div><h3>Grow</h3><p>XP, achievements and a personal home that shows your journey.</p><div class="om-feature-meta">PROGRESS</div></article>
    <article class="om-feature"><div class="om-feature-icon">◎</div><h3>Your profile</h3><p>Build your identity, interests, avatar, posts and social connections.</p><div class="om-feature-meta">IDENTITY</div></article>
    <article class="om-feature"><div class="om-feature-icon">✦</div><h3>HudHud AI</h3><p>An intelligent companion alongside the One Muslim experience.</p><div class="om-feature-meta">AI COMPANION</div></article>
   </div>
  </section>
  <section class="om-unified-split" id="om-community"><div class="om-split-card"><div class="om-mini-window"><span class="pill">YOUR COMMUNITY</span><div class="line"></div><div class="line short"></div><div class="line"></div><div class="line short"></div><div class="line"></div></div></div><div><span class="om-kicker">COMMUNITY</span><h2>Your people.<br><em>Your space.</em></h2><p>One Muslim is built so your social experience and your faith-centered experience don't have to live in separate places.</p><ul><li><span>✓</span> People and profiles</li><li><span>✓</span> Communities and discovery</li><li><span>✓</span> Posts, reactions and comments</li><li><span>✓</span> Messaging and social features</li></ul><button class="om-btn primary" data-auth="signup">Join the community →</button></div></section>
  <section class="om-unified-section" id="om-learn"><div class="om-section-center"><span class="om-kicker">KNOWLEDGE</span><h2>Learn something.<br><em>Carry it with you.</em></h2><p>Your lessons, progress and study experience belong in the same place as your community.</p></div></section>
  <section class="om-live-banner" id="om-live"><div class="om-live-banner-inner"><div><span class="om-kicker" style="color:#d8b96b">NEW EXPERIENCE</span><h3>One Muslim LIVE.</h3><p>Watch live conversations and eventually broadcast your own room directly inside the community.</p></div><button class="om-btn gold" data-auth="signup">Get ready for LIVE →</button></div></section>
  <footer class="om-unified-footer"><strong>ONE MUSLIM</strong><span>Faith · Knowledge · Community</span><span>© 2026 One Muslim</span></footer>
 </div>`;
 pv.querySelectorAll('[data-auth]').forEach(b=>b.addEventListener('click',()=>auth(b.dataset.auth)));
}
function appEnhance(){
 document.body.classList.add('onemuslim-theme');
 let bg=$('#omUnifiedBackdrop');if(!bg){bg=document.createElement('div');bg.id='omUnifiedBackdrop';document.body.prepend(bg)}
 const app=$('#appView');if(!app)return;
 app.querySelectorAll('[data-page="live"]').forEach(x=>x.textContent=x.classList.contains('app-nav-link')?'🔴 LIVE':'🔴 Live');
}
function boot(){publicHome();appEnhance();setTimeout(appEnhance,500);setTimeout(publicHome,1200)}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot);else boot();
window.addEventListener('load',()=>{setTimeout(appEnhance,100);});
})();