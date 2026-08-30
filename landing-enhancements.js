/* OneMuslim landing enhancements + cinematic journey loader. */
(function(){
  'use strict';
  const ORNAMENT='/assets/onemuslim/hero-ornament.svg';
  const COMING_SOON='/coming-soon.html';
  function enhance(root){
    if(!root)return;
    const landing=root.querySelector?.('#oneMuslimLanding')||root;
    const about=landing.querySelector?.('#about');
    if(about&&!about.querySelector('.om-approved-ornament')){
      const ornament=document.createElement('div');ornament.className='om-approved-ornament';ornament.setAttribute('aria-hidden','true');
      ornament.innerHTML=`<img src="${ORNAMENT}" alt="">`;about.prepend(ornament);
    }
    if(about&&!about.querySelector('.om-coming-soon-link')){
      const cards=about.querySelector('.om-three');
      if(cards){const wrap=document.createElement('div');wrap.className='om-coming-soon-wrap';wrap.innerHTML=`<a class="om-btn primary om-coming-soon-link" href="${COMING_SOON}">Coming Soon <span aria-hidden="true">→</span></a>`;cards.insertAdjacentElement('afterend',wrap)}
    }
  }
  function loadJourney(){
    if(document.getElementById('omParallaxJourneyCss'))return;
    const css=document.createElement('link');css.id='omParallaxJourneyCss';css.rel='stylesheet';css.href='parallax-journey.css';document.head.appendChild(css);
    const script=document.createElement('script');script.src='parallax-journey.js';script.defer=false;document.body.appendChild(script);
  }
  function run(){
    enhance(document.getElementById('publicView'));enhance(document.getElementById('appView'));enhance(document);
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',run);else run();
  new MutationObserver(run).observe(document.documentElement,{childList:true,subtree:true});
  // Wait until the existing Supabase/app bootstrap has run. The journey then becomes
  // the public entry experience without touching app.js, auth, profile, feed, or lessons.
  window.addEventListener('load',()=>setTimeout(loadJourney,120));
})();
