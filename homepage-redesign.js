(() => {
  'use strict';

  function boot(){
    const pv=document.getElementById('publicView');
    if(!pv) return;
    const landing=document.getElementById('oneMuslimLanding');
    if(!landing) return;

    landing.classList.add('won-modern-landing');
    landing.innerHTML = `
      <div class="won-bg" aria-hidden="true">
        <div class="won-orb won-orb-a"></div>
        <div class="won-orb won-orb-b"></div>
        <div class="won-grid"></div>
        <div class="won-stars"></div>
      </div>

      <header class="won-nav">
        <a class="won-brand" href="#won-top" aria-label="Won Muslim home">
          <img src="assets/won-muslim-logo.svg" alt="Won Muslim">
          <span><b>Won Muslim</b><small>Faith · Community · Growth</small></span>
        </a>
        <nav aria-label="Landing page navigation">
          <a href="#won-features">Features</a>
          <a href="#won-community">Community</a>
          <a href="#won-learn">Learn</a>
          <a href="#won-hudhud">HudHud AI</a>
        </nav>
        <div class="won-nav-actions">
          <button type="button" class="won-login" data-won-auth="login">Sign in</button>
          <button type="button" class="won-signup" data-won-auth="signup">Get Started</button>
        </div>
      </header>

      <main id="won-top">
        <section class="won-hero">
          <div class="won-hero-copy">
            <div class="won-eyebrow"><span></span> A MODERN HOME FOR MUSLIMS <span></span></div>
            <h1>One place to<br><em>connect, learn & grow.</em></h1>
            <p>Won Muslim brings community, Islamic learning, profiles, progress, and meaningful connection into one beautiful space — built around the Muslim experience.</p>
            <div class="won-hero-actions">
              <button type="button" class="won-primary won-big" data-won-auth="signup">Create your account <b>→</b></button>
              <a class="won-secondary won-big" href="#won-features">Explore Won Muslim <b>↓</b></a>
            </div>
            <div class="won-trust"><span>FREE TO GET STARTED</span><i></i><span>BUILT FOR COMMUNITY</span><i></i><span>YOUR JOURNEY, YOUR SPACE</span></div>
          </div>
          <div class="won-hero-visual" aria-hidden="true">
            <div class="won-logo-ring"><div class="won-logo-glow"></div><img src="assets/won-muslim-logo.svg" alt=""></div>
            <div class="won-floating-card won-card-community"><span>◉</span><b>Community</b><small>Find your people.</small></div>
            <div class="won-floating-card won-card-learn"><span>★</span><b>Learn</b><small>Build your knowledge.</small></div>
            <div class="won-floating-card won-card-xp"><span>✦</span><b>1,240 XP</b><small>Your progress matters.</small></div>
          </div>
        </section>

        <section class="won-intro">
          <div class="won-section-label">WHY WON MUSLIM</div>
          <h2>A digital home that feels like <em>yours.</em></h2>
          <p>No noise for the sake of noise. Just the people, knowledge, tools and experiences that help you stay connected to your Deen and your community.</p>
        </section>

        <section id="won-features" class="won-feature-section">
          <div class="won-feature-grid">
            <article class="won-feature-card won-feature-large">
              <div class="won-feature-number">01</div>
              <div class="won-feature-icon">◉</div>
              <h3>Community Feed</h3>
              <p>Share thoughts, photos and moments with a community designed for meaningful interaction.</p>
              <div class="won-mini-feed"><div><span>✦</span><b>People you follow</b><small>New conversations & posts</small></div><div><span>♡</span><b>React & respond</b><small>Keep the conversation moving</small></div></div>
            </article>
            <article class="won-feature-card">
              <div class="won-feature-number">02</div><div class="won-feature-icon">◇</div>
              <h3>Communities</h3><p>Find focused spaces around shared interests, learning and connection.</p><div class="won-feature-line">Discover your circle <b>→</b></div>
            </article>
            <article class="won-feature-card">
              <div class="won-feature-number">03</div><div class="won-feature-icon">◎</div>
              <h3>Your Profile</h3><p>Build a profile that reflects who you are, your interests and your journey.</p><div class="won-feature-line">Make it yours <b>→</b></div>
            </article>
            <article class="won-feature-card">
              <div class="won-feature-number">04</div><div class="won-feature-icon">★</div>
              <h3>XP & Progress</h3><p>Learn, participate and build momentum with visible progress and achievements.</p><div class="won-progress-demo"><span><i style="width:68%"></i></span><b>1,240 XP</b></div>
            </article>
            <article id="won-learn" class="won-feature-card won-feature-wide">
              <div class="won-feature-number">05</div>
              <div class="won-learn-copy"><div class="won-feature-icon">▣</div><h3>Lessons & Islamic Knowledge</h3><p>Explore lessons and learning experiences across Qur'an, Seerah, Aqidah and more. Learn at your pace and keep your progress with you.</p><button type="button" class="won-text-cta" data-won-auth="signup">Start learning <b>→</b></button></div>
              <div class="won-learning-stack"><div><span>01</span><b>The Meaning of Taqwa</b><small>Continue lesson</small></div><div><span>02</span><b>Surah Al-Fatiha</b><small>8 lessons</small></div><div><span>03</span><b>Names of Allah</b><small>Build your knowledge</small></div></div>
            </article>
          </div>
        </section>

        <section id="won-community" class="won-split-section">
          <div class="won-split-art">
            <div class="won-art-window"><div class="won-art-top"><span>WON MUSLIM</span><i>•••</i></div><div class="won-art-post"><div class="won-art-avatar">M</div><div><b>Your community</b><small>Share something meaningful.</small></div></div><div class="won-art-bars"><i></i><i></i><i></i></div><div class="won-art-pill">Community · Connection · Growth</div></div>
          </div>
          <div class="won-split-copy"><div class="won-section-label">COMMUNITY, WITHOUT THE CHAOS</div><h2>Bring your people<br><em>closer together.</em></h2><p>Follow people, discover communities, share posts, react, comment and build relationships — all from one consistent experience.</p><ul><li><span>✓</span> People & profiles</li><li><span>✓</span> Community spaces</li><li><span>✓</span> Posts, reactions & comments</li><li><span>✓</span> Messaging and social features</li></ul><button type="button" class="won-primary" data-won-auth="signup">Join the community <b>→</b></button></div>
        </section>

        <section id="won-hudhud" class="won-ai-section">
          <div class="won-ai-glow"></div>
          <div class="won-ai-badge">INTELLIGENT COMPANION</div>
          <div class="won-ai-content">
            <div><img class="won-hudhud-logo" src="assets/won-muslim-logo.svg" alt="Won Muslim"><div class="won-ai-feather">✦</div></div>
            <div class="won-ai-copy"><div class="won-section-label">MEET HUDHUD AI</div><h2>Your journey can have<br><em>an intelligent companion.</em></h2><p>HudHud AI is designed to sit alongside your Won Muslim experience — helping you explore, organize, learn and make more of the platform.</p><div class="won-ai-chips"><span>Learn</span><span>Explore</span><span>Organize</span><span>Grow</span></div></div>
          </div>
        </section>

        <section class="won-journey">
          <div class="won-section-label">YOUR NEXT STEP</div>
          <h2>Start with one account.<br><em>Build from there.</em></h2>
          <p>Join Won Muslim and discover a home for your community, your learning and your journey.</p>
          <button type="button" class="won-primary won-big" data-won-auth="signup">Get Started — It's Free <b>→</b></button>
          <span class="won-login-note">Already a member? <button type="button" data-won-auth="login">Sign in</button></span>
        </section>
      </main>

      <footer class="won-footer">
        <div class="won-brand won-footer-brand"><img src="assets/won-muslim-logo.svg" alt="Won Muslim"><span><b>Won Muslim</b><small>Faith · Community · Growth</small></span></div>
        <div><a href="#won-features">Features</a><a href="#won-community">Community</a><a href="#won-learn">Learn</a><a href="#won-hudhud">HudHud AI</a></div>
        <small>© 2026 Won Muslim</small>
      </footer>
    `;

    const styleId='won-modern-landing-css';
    if(!document.getElementById(styleId)){
      const s=document.createElement('style');
      s.id=styleId;
      s.textContent=`
        #oneMuslimLanding.won-modern-landing{position:relative;min-height:100svh;overflow:hidden;background:#05060a;color:#f7f7fb;font-family:Inter,ui-sans-serif,system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif}
        #oneMuslimLanding.won-modern-landing *{box-sizing:border-box}
        #oneMuslimLanding.won-modern-landing .won-bg{position:absolute;inset:0;pointer-events:none;overflow:hidden;background:radial-gradient(circle at 76% 10%,rgba(94,38,178,.24),transparent 30%),radial-gradient(circle at 16% 45%,rgba(31,101,255,.13),transparent 34%),linear-gradient(180deg,#07070c 0%,#06060b 48%,#030408 100%)}
        .won-orb{position:absolute;border-radius:50%;filter:blur(50px);opacity:.5}.won-orb-a{width:420px;height:420px;right:5%;top:8%;background:#6125cf}.won-orb-b{width:380px;height:380px;left:-10%;top:46%;background:#164fbd}
        .won-grid{position:absolute;inset:0;opacity:.12;background-image:linear-gradient(rgba(157,112,255,.22) 1px,transparent 1px),linear-gradient(90deg,rgba(74,131,255,.22) 1px,transparent 1px);background-size:80px 80px;mask-image:linear-gradient(to bottom,black,transparent 70%)}
        .won-stars{position:absolute;inset:0;opacity:.38;background-image:radial-gradient(circle,#fff 0 1px,transparent 1.5px);background-size:149px 181px}
        .won-nav{position:sticky;top:0;z-index:30;height:78px;padding:0 clamp(18px,5vw,72px);display:flex;align-items:center;justify-content:space-between;border-bottom:1px solid rgba(148,117,220,.15);background:rgba(5,6,10,.72);backdrop-filter:blur(18px)}
        .won-brand{display:flex;align-items:center;gap:11px;color:#fff;text-decoration:none}.won-brand img{width:43px;height:43px;border-radius:11px;object-fit:cover;box-shadow:0 0 22px rgba(119,65,255,.24)}.won-brand span{display:flex;flex-direction:column}.won-brand b{font-size:14px;letter-spacing:.06em}.won-brand small{font-size:8px;color:#77758a;margin-top:4px;letter-spacing:.12em;text-transform:uppercase}
        .won-nav nav{display:flex;gap:30px}.won-nav nav a,.won-footer a{color:#9c9aaa;text-decoration:none;font-size:12px}.won-nav nav a:hover,.won-footer a:hover{color:#fff}
        .won-nav-actions{display:flex;gap:9px}.won-nav button,.won-primary,.won-secondary{font:inherit}.won-login,.won-signup,.won-primary,.won-secondary{border-radius:999px;padding:11px 18px;cursor:pointer}.won-login{border:1px solid #302b3e;background:rgba(15,13,22,.65);color:#c8c1d3}.won-signup,.won-primary{border:1px solid #8255db;background:linear-gradient(135deg,#7444c7,#5b8cff);color:#fff;box-shadow:0 10px 30px rgba(89,70,190,.24)}.won-login:hover,.won-signup:hover,.won-primary:hover{transform:translateY(-2px)}
        .won-hero{position:relative;z-index:2;min-height:calc(100svh - 78px);padding:80px clamp(20px,6vw,90px) 70px;display:grid;grid-template-columns:1.05fr .95fr;align-items:center;gap:40px;max-width:1500px;margin:auto}.won-hero-copy{max-width:760px}.won-eyebrow,.won-section-label{font-size:9px;font-weight:800;letter-spacing:.25em;color:#9f8bd2}.won-eyebrow{display:flex;align-items:center;gap:10px;margin-bottom:22px}.won-eyebrow span{width:28px;height:1px;background:linear-gradient(90deg,#7a4bdf,#51a4ff)}.won-hero h1{font-size:clamp(54px,7vw,104px);line-height:.93;letter-spacing:-.065em;margin:0;font-weight:850}.won-hero h1 em,.won-intro em,.won-split-copy em,.won-ai-copy em,.won-journey em{font-style:normal;background:linear-gradient(90deg,#9b64ff,#5d9bff,#e85bff);-webkit-background-clip:text;background-clip:text;color:transparent}.won-hero-copy>p{max-width:650px;color:#aaa8b7;font-size:17px;line-height:1.7;margin:25px 0}.won-hero-actions{display:flex;gap:11px;flex-wrap:wrap}.won-big{padding:15px 24px;font-size:14px}.won-primary b,.won-secondary b{margin-left:8px}.won-secondary{border:1px solid #2e2a3c;background:rgba(15,14,22,.55);color:#c9c5d0;text-decoration:none;display:inline-flex;align-items:center}.won-trust{display:flex;gap:12px;align-items:center;flex-wrap:wrap;margin-top:26px;color:#696777;font-size:7px;letter-spacing:.16em}.won-trust i{width:3px;height:3px;border-radius:50%;background:#6e56a5}
        .won-hero-visual{height:550px;position:relative;display:grid;place-items:center}.won-logo-ring{width:min(430px,70vw);aspect-ratio:1;border-radius:50%;position:relative;display:grid;place-items:center;background:radial-gradient(circle,rgba(107,64,202,.2),rgba(22,70,145,.06) 50%,transparent 69%);border:1px solid rgba(124,85,211,.3);box-shadow:0 0 100px rgba(78,54,166,.22)}.won-logo-ring:before,.won-logo-ring:after{content:"";position:absolute;border:1px solid rgba(92,137,255,.22);border-radius:50%}.won-logo-ring:before{inset:9%;transform:rotate(28deg) scaleX(1.18)}.won-logo-ring:after{inset:17%;transform:rotate(-25deg) scaleY(.72)}.won-logo-ring img{width:54%;border-radius:28px;box-shadow:0 0 50px rgba(130,68,255,.28)}.won-logo-glow{position:absolute;inset:28%;border-radius:50%;background:radial-gradient(circle,rgba(111,57,232,.28),transparent 70%);filter:blur(25px)}
        .won-floating-card{position:absolute;padding:12px 15px;border:1px solid rgba(142,105,212,.28);background:rgba(10,9,16,.72);backdrop-filter:blur(15px);border-radius:14px;box-shadow:0 18px 45px rgba(0,0,0,.28);min-width:150px}.won-floating-card span{display:inline-grid;place-items:center;width:27px;height:27px;border-radius:8px;background:#171128;color:#a875ff;margin-right:8px}.won-floating-card b{font-size:11px}.won-floating-card small{display:block;color:#716d7e;font-size:8px;margin:5px 0 0 36px}.won-card-community{left:0;top:20%}.won-card-learn{right:0;top:35%}.won-card-xp{left:12%;bottom:11%}
        .won-intro{position:relative;z-index:2;text-align:center;max-width:820px;margin:0 auto;padding:100px 20px 75px}.won-intro h2,.won-split-copy h2,.won-ai-copy h2,.won-journey h2{font-size:clamp(38px,5vw,68px);line-height:.98;letter-spacing:-.05em;margin:12px 0}.won-intro p{max-width:650px;margin:auto;color:#858392;line-height:1.75;font-size:15px}
        .won-feature-section{position:relative;z-index:2;padding:20px clamp(16px,5vw,70px) 100px}.won-feature-grid{max-width:1320px;margin:auto;display:grid;grid-template-columns:1.25fr .75fr .75fr;gap:14px}.won-feature-card{position:relative;min-height:270px;padding:25px;border:1px solid #211d2c;border-radius:22px;background:linear-gradient(145deg,rgba(16,13,25,.9),rgba(7,8,13,.88));overflow:hidden}.won-feature-card:after{content:"";position:absolute;width:180px;height:180px;right:-90px;top:-90px;border-radius:50%;background:radial-gradient(circle,rgba(123,74,214,.18),transparent 70%)}.won-feature-large{grid-row:span 2;min-height:554px}.won-feature-wide{grid-column:span 2;display:grid;grid-template-columns:1fr 1fr;gap:30px;min-height:290px}.won-feature-number{color:#605a6d;font-size:9px;letter-spacing:.15em}.won-feature-icon{width:40px;height:40px;margin:24px 0 17px;border-radius:12px;display:grid;place-items:center;background:linear-gradient(135deg,rgba(117,64,210,.25),rgba(66,130,255,.12));border:1px solid #3a2b58;color:#a879ff;font-size:17px}.won-feature-card h3{font-size:23px;margin:0 0 9px}.won-feature-card p{color:#858292;line-height:1.65;font-size:12px;max-width:450px}.won-mini-feed{position:absolute;left:25px;right:25px;bottom:25px;border:1px solid #262132;border-radius:15px;background:#0b0a11;padding:9px}.won-mini-feed div{display:grid;grid-template-columns:30px 1fr;column-gap:8px;padding:10px 5px;border-bottom:1px solid #211d29}.won-mini-feed div:last-child{border:0}.won-mini-feed span{grid-row:span 2;width:28px;height:28px;border-radius:9px;background:#171127;display:grid;place-items:center;color:#9f73ff}.won-mini-feed b{font-size:9px}.won-mini-feed small{font-size:8px;color:#696576}.won-feature-line{position:absolute;bottom:25px;left:25px;right:25px;color:#9b94a5;font-size:9px;border-top:1px solid #25202e;padding-top:12px}.won-feature-line b{float:right;color:#9d6fff}.won-progress-demo{position:absolute;left:25px;right:25px;bottom:25px}.won-progress-demo span{display:block;height:7px;border-radius:10px;background:#181522;overflow:hidden}.won-progress-demo i{display:block;height:100%;background:linear-gradient(90deg,#7548cf,#5b9bff);border-radius:10px}.won-progress-demo b{display:block;font-size:9px;color:#918b9c;margin-top:8px}.won-learn-copy .won-feature-icon{margin-top:10px}.won-text-cta{border:0;background:none;color:#a876ff;font-weight:700;padding:0;cursor:pointer}.won-learning-stack{display:grid;gap:8px;align-content:center}.won-learning-stack div{padding:12px;border:1px solid #282231;border-radius:12px;background:#0b0a11}.won-learning-stack span{color:#7054a2;font-size:8px;margin-right:10px}.won-learning-stack b{font-size:9px}.won-learning-stack small{display:block;color:#6d6877;font-size:7px;margin:5px 0 0 26px}
        .won-split-section{position:relative;z-index:2;max-width:1280px;margin:0 auto;padding:80px clamp(20px,5vw,60px);display:grid;grid-template-columns:1fr 1fr;gap:80px;align-items:center}.won-split-art{display:grid;place-items:center}.won-art-window{width:min(500px,100%);aspect-ratio:1/1.05;border:1px solid #2b2637;border-radius:28px;background:linear-gradient(145deg,#100d19,#07080d);padding:22px;box-shadow:0 30px 80px rgba(0,0,0,.35);transform:rotate(-2deg)}.won-art-top{display:flex;justify-content:space-between;color:#797384;font-size:8px;letter-spacing:.15em;padding-bottom:17px;border-bottom:1px solid #24202c}.won-art-post{display:flex;gap:12px;align-items:center;margin-top:35px;padding:18px;border:1px solid #282231;border-radius:16px;background:#0c0b12}.won-art-avatar{width:43px;height:43px;border-radius:50%;display:grid;place-items:center;background:linear-gradient(135deg,#5b31a8,#2378d9);font-weight:800}.won-art-post b,.won-art-post small{display:block}.won-art-post b{font-size:12px}.won-art-post small{font-size:8px;color:#777281;margin-top:4px}.won-art-bars{display:grid;gap:12px;margin-top:25px}.won-art-bars i{height:9px;border-radius:8px;background:#171521;display:block}.won-art-bars i:nth-child(1){width:88%}.won-art-bars i:nth-child(2){width:72%}.won-art-bars i:nth-child(3){width:54%}.won-art-pill{display:inline-block;margin-top:30px;padding:8px 12px;border:1px solid #3a2a55;border-radius:999px;color:#9c76dc;font-size:8px}.won-split-copy p{color:#888594;line-height:1.75;max-width:540px}.won-split-copy ul{list-style:none;padding:0;display:grid;gap:10px;margin:25px 0}.won-split-copy li{font-size:11px;color:#aaa5b1}.won-split-copy li span{display:inline-grid;place-items:center;width:20px;height:20px;margin-right:8px;border-radius:50%;background:#161126;color:#9d70ff}
        .won-ai-section{position:relative;z-index:2;margin:40px clamp(16px,5vw,70px);padding:75px clamp(25px,5vw,80px);border:1px solid #30244a;border-radius:30px;background:radial-gradient(circle at 85% 50%,rgba(104,51,203,.22),transparent 35%),linear-gradient(145deg,#0e0a18,#080910);overflow:hidden}.won-ai-glow{position:absolute;width:420px;height:420px;right:-80px;top:-110px;border-radius:50%;background:radial-gradient(circle,rgba(95,64,222,.3),transparent 70%);filter:blur(20px)}.won-ai-badge{position:absolute;right:25px;top:25px;color:#8c75b3;font-size:7px;letter-spacing:.2em}.won-ai-content{position:relative;z-index:2;display:grid;grid-template-columns:220px 1fr;gap:55px;align-items:center;max-width:1050px;margin:auto}.won-hudhud-logo{width:170px;border-radius:28px;box-shadow:0 0 45px rgba(104,61,210,.24)}.won-ai-feather{color:#a574ff;font-size:28px;margin-top:10px;text-align:center}.won-ai-copy p{color:#8e8998;line-height:1.7;max-width:600px}.won-ai-chips{display:flex;gap:8px;flex-wrap:wrap}.won-ai-chips span{border:1px solid #33274a;border-radius:999px;padding:7px 11px;color:#a98bd3;font-size:8px;background:#0e0b17}
        .won-journey{position:relative;z-index:2;text-align:center;padding:130px 20px 120px;max-width:900px;margin:auto}.won-journey p{color:#878291;max-width:580px;margin:0 auto 28px;line-height:1.7}.won-login-note{display:block;color:#666273;font-size:10px;margin-top:16px}.won-login-note button{border:0;background:none;color:#9e70ff;cursor:pointer}.won-footer{position:relative;z-index:2;border-top:1px solid #191721;padding:35px clamp(18px,5vw,70px);display:flex;justify-content:space-between;align-items:center;gap:20px;color:#5f5b68}.won-footer>div:not(.won-brand){display:flex;gap:22px}.won-footer small{font-size:8px}.won-footer-brand img{width:34px;height:34px}
        @media(max-width:1000px){.won-nav nav{display:none}.won-hero{grid-template-columns:1fr}.won-hero-visual{position:absolute;right:0;top:120px;width:52%;opacity:.42;z-index:-1}.won-feature-grid{grid-template-columns:1fr 1fr}.won-feature-large{grid-row:span 1;min-height:420px}.won-feature-wide{grid-column:span 2}}
        @media(max-width:700px){.won-nav{height:68px;padding:0 13px}.won-brand img{width:38px;height:38px}.won-brand small{display:none}.won-nav-actions{gap:5px}.won-login{display:none}.won-signup{padding:9px 13px;font-size:11px}.won-hero{min-height:calc(100svh - 68px);padding:70px 18px 55px}.won-hero h1{font-size:52px}.won-hero-copy>p{font-size:14px}.won-hero-visual{width:95%;right:-24%;top:120px;opacity:.22}.won-trust{font-size:6px}.won-feature-section{padding-left:13px;padding-right:13px}.won-feature-grid{grid-template-columns:1fr}.won-feature-large,.won-feature-wide{grid-column:auto;grid-row:auto;min-height:330px}.won-feature-wide{display:block}.won-learning-stack{margin-top:25px}.won-split-section{grid-template-columns:1fr;gap:45px;padding-left:20px;padding-right:20px}.won-art-window{transform:none}.won-ai-content{grid-template-columns:1fr;gap:25px;text-align:center}.won-ai-section{padding:55px 22px}.won-hudhud-logo{width:130px}.won-ai-chips{justify-content:center}.won-footer{flex-direction:column;align-items:flex-start}.won-footer>div:not(.won-brand){flex-wrap:wrap;gap:14px}.won-intro{padding-top:80px}}
        @media(prefers-reduced-motion:reduce){.won-login,.won-signup,.won-primary{transition:none}}
      `;
      document.head.appendChild(s);
    }

    function auth(mode){
      const id=mode==='signup'?'openSignup':'openLogin';
      const button=document.getElementById(id);
      if(button){button.click();return;}
      const authView=document.getElementById('authView');
      const authTitle=document.getElementById('authTitle');
      if(authView){authView.classList.remove('hidden');}
      if(authTitle)authTitle.textContent=mode==='signup'?'Create your Won Muslim account':'Welcome back';
    }

    landing.querySelectorAll('[data-won-auth]').forEach(b=>b.addEventListener('click',()=>auth(b.dataset.wonAuth)));
    landing.querySelectorAll('a[href^="#"]').forEach(a=>a.addEventListener('click',e=>{
      const target=document.querySelector(a.getAttribute('href'));
      if(target){e.preventDefault();target.scrollIntoView({behavior:'smooth',block:'start'});}
    }));
  }

  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',boot); else boot();
})();