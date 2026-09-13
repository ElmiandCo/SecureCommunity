/* Legacy Communities route bridge: keep old community.html URLs inside the OneMuslim shell. */
(function(){
  'use strict';
  function init(){
    document.addEventListener('click',function(e){
      const result=e.target.closest?.('[data-search-kind="communities"]');
      if(result&&window.OneMuslimCommunities){e.preventDefault();e.stopImmediatePropagation();window.OneMuslimCommunities.show(result.dataset.searchId);return}
      const link=e.target.closest?.('a[href="community.html"],a[href^="community.html?"]');
      if(link&&window.OneMuslimCommunities){e.preventDefault();e.stopImmediatePropagation();const u=new URL(link.href,location.href);window.OneMuslimCommunities.show(u.searchParams.get('community')||null)}
    },true);
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
})();
