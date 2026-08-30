/* OneMuslim cinematic parallax onboarding.
 * This is deliberately isolated from app.js/profile code: it owns only the public journey.
 * Auth remains Supabase/app.js territory; CTA buttons bridge to the existing hidden auth controls.
 */
(function(){
  'use strict';
  const reduceMotion=window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
  const $=(s,r=document)=>r.querySelector(s);
  const escapeHtml=s=>String(s??'').replace(/[&<>\"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;',"'":'&#039;'}[m]));
  const params=new URLSearchParams(location.search);
  const rawFlow=(params.get('flow')||params.get('journey')||params.get('ref')||location.hash||'').toLowerCase();
  const isRevert=/revert|shahada|new[-_ ]?muslim|new[-_ ]?revert/.test(rawFlow);
  let sceneIndex=0, activeScene=0, firstVisitChoice=null, learningChoice=null, revertName='';
  let journey=null, copyHost=null, progressHost=null;

  const scenes=[
    {id:'cosmic',title:'The beginning'},
    {id:'earth',title:'The first question'},
    {id:'paradise',title:'Welcome'},
    {id:'community',title:'One Muslim'},
    {id:'notes',title:'My Notes'},
    {id:'university',title:'One University'},
    {id:'final',title:'The journey'}
  ];

  function authBridge(mode){
    const btn=document.getElementById(mode==='signup'?'openSignup':'openLogin');
    if(btn){btn.click();return}
    window.showAuth?.(mode);
  }
  function enterApp(){
    journey?.classList.add('hidden');
    document.getElementById('publicView')?.classList.add('hidden');
    const app=document.getElementById('appView');
    if(app){app.classList.remove('hidden');app.querySelector('[data-page="public-home"]')?.click()}
  }
  function getSession(){return window.OneMuslimSupabaseClient?.getClient?.()?.auth.getSession().catch(()=>({data:{session:null}}))}

  function shell(){
    if($('#omJourney'))return;
    journey=document.createElement('div');journey.id='omJourney';journey.setAttribute('aria-label','OneMuslim interactive journey');
    journey.innerHTML=`
      <div class="omj-topbar"><div class="omj-brand"><span class="omj-brand-mark">1</span><span>ONE MUSLIM</span></div><div class="omj-status" id="omjStatus">WELCOME</div></div>
      <div class="omj-progress" id="omjProgress" aria-label="Journey progress"></div>
      <div class="omj-stage" id="omjStage"></div>
      <div class="omj-footer-hint" id="omjHint">Tap to continue · Scroll to move between worlds</div>
      <div id="omjPanelHost"></div>`;
    document.body.appendChild(journey);
    progressHost=$('#omjProgress',journey);copyHost=$('#omjPanelHost',journey);
    scenes.forEach((s,i)=>{
      const dot=document.createElement('button');dot.type='button';dot.setAttribute('aria-label',`${i+1}. ${s.title}`);dot.onclick=()=>goScene(i);progressHost.appendChild(dot);
    });
    renderScenes();wirePointer();
  }

  function renderScenes(){
    const stage=$('#omjStage',journey);
    stage.innerHTML=`
      <section class="omj-scene omj-space active" data-scene="0"><div class="omj-layer omj-nebula" data-depth=".10"></div><div class="omj-layer omj-stars" data-depth=".18"></div><div class="omj-layer omj-galaxy" data-depth=".24"></div><div class="omj-layer omj-orbit" data-depth=".35"></div><div class="omj-crescent" data-depth=".55"></div><div class="omj-copy" id="omjCosmicCopy"></div></section>
      <section class="omj-scene omj-earth" data-scene="1"><div class="omj-layer omj-earth-glow" data-depth=".18"></div><div class="omj-layer omj-earth-ball" data-depth=".34"></div><div class="omj-layer omj-atmosphere" data-depth=".48"></div><div class="omj-copy" id="omjEarthCopy"></div></section>
      <section class="omj-scene omj-paradise" data-scene="2"><div class="omj-layer omj-sun" data-depth=".10"></div><div class="omj-layer omj-hills" data-depth=".25"></div><div class="omj-layer omj-cloud-back" data-depth=".38"></div><div class="omj-copy" id="omjParadiseCopy"></div><div class="omj-layer omj-cloud-front" data-depth=".62"></div></section>
      <section class="omj-scene omj-feature" data-scene="3"><div class="omj-copy" id="omjCommunityCopy"></div></section>
      <section class="omj-scene omj-feature" data-scene="4"><div class="omj-copy" id="omjNotesCopy"></div></section>
      <section class="omj-scene omj-feature" data-scene="5"><div class="omj-copy" id="omjUniversityCopy"></div></section>
      <section class="omj-scene omj-final" data-scene="6"><div class="omj-layer omj-final-glow" data-depth=".15"></div><div class="omj-copy" id="omjFinalCopy"></div></section>`;
    renderSceneContent();
  }

  function setScene(i){
    sceneIndex=Math.max(0,Math.min(scenes.length-1,i));
    document.querySelectorAll('#omjStage .omj-scene').forEach((s,n)=>s.classList.toggle('active',n===sceneIndex));
    document.querySelectorAll('#omjProgress button').forEach((b,n)=>b.classList.toggle('active',n===sceneIndex));
    const hint=$('#omjHint'); if(hint)hint.textContent=sceneIndex===scenes.length-1?'Enter OneMuslim when you are ready':'Tap to continue · Scroll to move between worlds';
    $('#omjStatus').textContent=sceneIndex===scenes.length-1?'READY TO ENTER':`JOURNEY ${String(sceneIndex+1).padStart(2,'0')} / 07`;
    if(sceneIndex!==2)document.body.classList.remove('omj-cloud-scene');
    renderSceneContent();
  }
  function goScene(i){if(i<=sceneIndex+1)setScene(i)}

  function swapHtml(host,html,callback){
    if(!host)return;
    const old=host.querySelector(':scope > .omj-view');
    if(old){old.classList.add('is-leaving');setTimeout(()=>{old.remove();mount()},reduceMotion?0:280)}else mount();
    function mount(){const wrap=document.createElement('div');wrap.className='omj-view';wrap.innerHTML=html;host.appendChild(wrap);requestAnimationFrame(()=>wrap.classList.add('is-entering'));wireHost(wrap);callback?.(wrap)}
  }
  function wireHost(root){
    root.querySelectorAll('[data-next]').forEach(b=>b.addEventListener('click',()=>advance(Number(b.dataset.next||1))));
    root.querySelectorAll('[data-choice]').forEach(b=>b.addEventListener('click',()=>choice(b.dataset.choice)));
    root.querySelectorAll('[data-auth]').forEach(b=>b.addEventListener('click',()=>authBridge(b.dataset.auth)));
    root.querySelectorAll('[data-enter]').forEach(b=>b.addEventListener('click',enterApp));
    root.querySelectorAll('[data-name-submit]').forEach(b=>b.addEventListener('click',submitName));
    root.querySelectorAll('input[data-name]').forEach(i=>i.addEventListener('keydown',e=>{if(e.key==='Enter')submitName()}));
  }
  function advance(n=1){
    if(n>0)setScene(sceneIndex+1);else setScene(sceneIndex-1);
  }
  function choice(value){
    if(sceneIndex===0){
      firstVisitChoice=value;
      if(isRevert){
        if(value==='yes'){renderRevertName();return}
        renderCosmicNormal('welcome');return;
      }
      if(value==='yes'){renderLearningQuestion();return}
      renderCosmicNormal('returning');return;
    }
    if(sceneIndex===1){
      if(value==='yes'){renderEarthReassurance();return}
      renderEarthReassurance('no');return;
    }
  }
  function renderSceneContent(){
    if(sceneIndex===0)renderCosmicInitial();
    if(sceneIndex===1)renderEarthInitial();
    if(sceneIndex===2)renderParadise();
    if(sceneIndex===3)renderCommunity();
    if(sceneIndex===4)renderNotes();
    if(sceneIndex===5)renderUniversity();
    if(sceneIndex===6)renderFinal();
  }

  function renderCosmicInitial(){
    const host=$('#omjCosmicCopy');
    const question=isRevert?'Did you just take your Shahada?':'Is this your first time here?';
    const sub=isRevert?'If yes, we want to welcome you properly.':'Take your time. This is a journey, not a race.';
    swapHtml(host,`<div class="omj-view"><span class="omj-step">01</span><span class="omj-kicker">${isRevert?'A NEW BEGINNING':'THE BEGINNING'}</span><h1>One Muslim<br><em>One God</em></h1><p>${sub}</p><div class="omj-feature-card" style="text-align:center"><strong>${question}</strong><span>Choose what feels true for you.</span><div class="omj-choice-grid"><button class="omj-choice" data-choice="yes">Yes</button><button class="omj-choice" data-choice="no">No</button></div></div></div>`);
  }
  function renderCosmicNormal(mode){
    const host=$('#omjCosmicCopy');
    const title=mode==='returning'?'Welcome back.':'Welcome.';
    const body=mode==='returning'?'Your journey continues from here.':'You are in the right place.';
    swapHtml(host,`<div class="omj-view"><span class="omj-step">01</span><span class="omj-kicker">ONE MUSLIM</span><h2>${title}</h2><p>${body}<br>Knowledge, reflection, community — all in one place.</p><div class="omj-actions"><button class="omj-btn primary" data-next="1">Continue <span>→</span></button></div></div>`);
  }
  function renderRevertName(){
    const host=$('#omjCosmicCopy');
    swapHtml(host,`<div class="omj-view"><span class="omj-step">01</span><span class="omj-kicker">WELCOME, NEW MUSLIM</span><h2>What is your name?</h2><p>We will use it to make this moment personal.</p><input class="omj-name" data-name aria-label="Your name" placeholder="Your name" maxlength="60" autocomplete="name"><div class="omj-actions"><button class="omj-btn primary" data-name-submit>Continue <span>→</span></button></div>`);
  }
  function submitName(){
    const input=$('[data-name]');revertName=(input?.value||'').trim();if(!revertName){input?.focus();return}
    const host=$('#omjCosmicCopy');
    swapHtml(host,`<div class="omj-view"><span class="omj-step">01</span><span class="omj-kicker">WELCOME HOME</span><div class="omj-final-mark" style="font-size:clamp(54px,9vw,108px)">${escapeHtml(revertName)}</div><h2 style="font-size:clamp(32px,5vw,62px);margin-top:16px">Welcome. Congratulations.</h2><p>You have taken a beautiful step. May Allah make your path clear, steady, and full of peace.</p><div class="omj-actions"><button class="omj-btn primary" data-next="1">Continue <span>→</span></button></div></div>`);
  }
  function renderLearningQuestion(){
    const host=$('#omjCosmicCopy');
    swapHtml(host,`<div class="omj-view"><span class="omj-step">01</span><span class="omj-kicker">YOUR JOURNEY, YOUR WAY</span><h2>Want to learn<br><em>in a fun way?</em></h2><p>We can keep it interactive, visual, serious, or a mix of everything.</p><div class="omj-choice-grid"><button class="omj-choice" data-choice="fun">Yes — make it fun</button><button class="omj-choice" data-choice="serious">Serious only</button></div>`);
  }
  function renderEarthInitial(){
    const host=$('#omjEarthCopy');
    if(learningChoice==='serious'){
      swapHtml(host,`<div class="omj-view"><span class="omj-step">02</span><span class="omj-kicker">SERIOUS MODE</span><h2>Before we begin,<br><em>do we agree?</em></h2><p>Learn with sincerity. Ask difficult questions. Pursue truth. Treat people with respect.</p><div class="omj-actions"><button class="omj-btn primary" data-next="1">I agree <span>→</span></button></div></div>`);return;
    }
    swapHtml(host,`<div class="omj-view"><span class="omj-step">02</span><span class="omj-kicker">THE NEXT STEP</span><h2>Let's get<br><em>started.</em></h2><p>The world around you is part of the story. So is the knowledge you are about to explore.</p><div class="omj-actions"><button class="omj-btn primary" data-next="1">Let's get started <span>→</span></button></div></div>`);
  }
  function renderEarthReassurance(){
    const host=$('#omjEarthCopy');
    swapHtml(host,`<div class="omj-view"><span class="omj-step">02</span><span class="omj-kicker">A MOMENT TO BREATHE</span><h2>You don't have to<br><em>know everything.</em></h2><p>Start where you are. Learn at your pace. Keep asking. Keep seeking.</p><div class="omj-actions"><button class="omj-btn primary" data-next="1">Continue <span>→</span></button></div></div>`);
  }
  function renderParadise(){
    const host=$('#omjParadiseCopy');
    swapHtml(host,`<div class="omj-view"><span class="omj-step">03</span><span class="omj-kicker">THE JOURNEY OPENS</span><h2>Beautiful things<br><em>are ahead.</em></h2><p>Imagine moving through knowledge the way you move through a landscape — one layer at a time.</p><div class="omj-actions"><button class="omj-btn dark" data-next="1">Show me more <span>→</span></button></div></div>`);
  }
  function renderCommunity(){
    const host=$('#omjCommunityCopy');
    swapHtml(host,`<div class="omj-view"><span class="omj-step">04</span><span class="omj-kicker">ONE MUSLIM</span><h2>You are part of<br><em>a big community.</em></h2><p>Learn with people. Share ideas. Find Muslims who are asking the same questions and walking the same road.</p><div class="omj-feature-card"><strong>Community</strong><span>Profiles · conversations · people · posts · shared knowledge</span></div><div class="omj-actions"><button class="omj-btn primary" data-next="1">Next <span>→</span></button></div></div>`);
  }
  function renderNotes(){
    const host=$('#omjNotesCopy');
    swapHtml(host,`<div class="omj-view"><span class="omj-step">05</span><span class="omj-kicker">KEEP WHAT YOU LEARN</span><h2>Meet <em>My Notes.</em></h2><p>A private place to keep the ideas, questions, verses, lessons, and thoughts you want beside you while you learn.</p><div class="omj-note-demo"><b>My Notes</b><p>“Write down what you want to remember. Come back to it when you need it.”</p></div><div class="omj-actions"><button class="omj-btn primary" data-next="1">Next <span>→</span></button></div></div>`);
  }
  function renderUniversity(){
    const host=$('#omjUniversityCopy');
    swapHtml(host,`<div class="omj-view"><span class="omj-step">06</span><span class="omj-kicker">ONE UNIVERSITY</span><h2>Learn deeper.<br><em>Build your foundation.</em></h2><p>Courses are where the journey becomes structured — lessons, questions, progress, and knowledge you can return to.</p><div class="omj-feature-card"><strong>One University</strong><span>Foundations · Qur'an · Sunnah · theology · history · apologetics · more</span></div><div class="omj-actions"><button class="omj-btn primary" data-next="1">Get started <span>→</span></button></div></div>`);
  }
  function renderFinal(){
    const host=$('#omjFinalCopy');
    const client=window.OneMuslimSupabaseClient?.getClient?.();
    client?.auth.getUser?.().then(({data})=>{const name=data?.user?.user_metadata?.display_name||data?.user?.email?.split('@')[0]||'';const greeting=name?`Welcome back, ${escapeHtml(name)}.`:'Welcome to One Muslim.';swapHtml(host,`<div class="omj-view"><span class="omj-final-mark">1</span><span class="omj-kicker">ONE MUSLIM</span><h2>${greeting}</h2><p>This is where the journey becomes yours.</p><div class="omj-actions"><button class="omj-btn primary" data-enter>ENTER ONE MUSLIM <span>→</span></button><button class="omj-btn" data-auth="signup">Create account</button></div></div>`)}).catch(()=>{});
  }

  function choiceForLearning(v){learningChoice=v; if(v==='serious'){const host=$('#omjCosmicCopy');swapHtml(host,`<div class="omj-view"><span class="omj-step">01</span><span class="omj-kicker">SERIOUS MODE</span><h2>One promise:<br><em>take truth seriously.</em></h2><p>No gimmicks required. Learn carefully, question honestly, and move forward with sincerity.</p><div class="omj-actions"><button class="omj-btn primary" data-next="1">I agree <span>→</span></button></div></div>`);}}
  // Keep the generic choice handler small; learning choices are handled separately.
  const originalChoice=choice;
  choice=function(value){
    if(sceneIndex===0 && !isRevert && firstVisitChoice==='yes' && (value==='fun'||value==='serious')){choiceForLearning(value);return}
    originalChoice(value);
  };

  function parallax(){
    let px=0,py=0,targetX=0,targetY=0;
    const move=e=>{targetX=(e.clientX/innerWidth-.5)*2;targetY=(e.clientY/innerHeight-.5)*2};
    window.addEventListener('pointermove',move,{passive:true});
    function frame(){
      if(!journey?.isConnected)return;
      px+=(targetX-px)*.045;py+=(targetY-py)*.045;
      document.querySelectorAll('#omjStage .omj-layer').forEach(el=>{const d=Number(el.dataset.depth||0);el.style.transform=`translate3d(${px*d*-28}px,${py*d*-20}px,0)`});
      if(!reduceMotion)requestAnimationFrame(frame);
    }
    requestAnimationFrame(frame);
  }
  function wirePointer(){parallax()}

  function scrollWheel(e){
    if(!journey||journey.classList.contains('hidden'))return;
    if(Math.abs(e.deltaY)<20)return;
    if(e.deltaY>0 && sceneIndex<scenes.length-1 && sceneIndex>0)goScene(sceneIndex+1);
    if(e.deltaY<0 && sceneIndex>0)goScene(sceneIndex-1);
  }
  window.addEventListener('wheel',scrollWheel,{passive:true});
  let touchY=0;
  window.addEventListener('touchstart',e=>{touchY=e.touches[0]?.clientY||0},{passive:true});
  window.addEventListener('touchend',e=>{const y=e.changedTouches[0]?.clientY||0;if(Math.abs(y-touchY)>50)goScene(y<touchY?sceneIndex+1:sceneIndex-1)},{passive:true});

  function boot(){
    if(!document.getElementById('publicView'))return;
    shell();
    const app=document.getElementById('appView');
    const publicView=document.getElementById('publicView');
    const sync=async()=>{
      const result=await getSession();const session=result?.data?.session;
      if(session){
        $('#omjStatus').textContent='SECURE SESSION';
      }
      // The app owns the authenticated screen. Only mount the public journey when logged out.
      if(!session && app?.classList.contains('hidden')){publicView.classList.remove('hidden');journey.classList.remove('hidden');}
      if(session){
        journey.classList.remove('hidden');publicView.classList.add('hidden');
      }
    };
    sync();
    const client=window.OneMuslimSupabaseClient?.getClient?.();
    client?.auth.onAuthStateChange((event,session)=>{if(session){$('#omjStatus').textContent='SECURE SESSION';}else if(event==='SIGNED_OUT'){location.reload()}});
    const observer=new MutationObserver(()=>{
      if(app&&!app.classList.contains('hidden')&&!journey.classList.contains('hidden')){
        // Keep the journey available as an intentional "home" experience, but let the app remain the secure shell.
      }
    });
    observer.observe(document.body,{subtree:true,childList:true,attributes:true,attributeFilter:['class']});
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot);else setTimeout(boot,0);
})();
