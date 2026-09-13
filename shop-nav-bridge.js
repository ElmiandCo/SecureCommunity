/* OneMuslim Shop bridge: keeps the Shop available even when the legacy navigation bundle is absent or cached. */
(() => {
  'use strict';
  const load = () => {
    if (!document.getElementById('oneMuslimShopScript')) {
      const s=document.createElement('script');
      s.id='oneMuslimShopScript'; s.src='shop-page.js?v=20260913-01'; s.defer=true;
      document.body.appendChild(s);
    }
  };
  const add = () => {
    load();
    const top=document.querySelector('#appView .app-nav-links');
    const side=document.querySelector('#appView .sidebar nav');
    const make=(cls,text)=>{const b=document.createElement('button');b.type='button';b.className=cls;b.dataset.page='shop';b.textContent=text;b.addEventListener('click',e=>{e.preventDefault();window.OneMuslimShop?.show()});return b};
    if(top&&!top.querySelector('[data-page="shop"]')){const b=make('app-nav-link','Shop');const before=top.querySelector('.om-coming-soon-nav');before?top.insertBefore(b,before):top.appendChild(b)}
    if(side&&!side.querySelector('[data-page="shop"]')){const b=make('side','🛍 Shop');const before=side.querySelector('.om-coming-soon-nav');before?side.insertBefore(b,before):side.appendChild(b)}
  };
  const init=()=>{add();setTimeout(add,300);setTimeout(add,900);new MutationObserver(add).observe(document.body,{childList:true,subtree:true})};
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
})();