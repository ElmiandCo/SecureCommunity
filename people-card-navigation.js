(() => {
  const init = () => {
    const grid = document.getElementById('profilesGrid');
    if (!grid || grid.dataset.cardNavigationReady === '1') return;
    grid.dataset.cardNavigationReady = '1';

    grid.addEventListener('click', (event) => {
      const card = event.target.closest('.people-theme-card[data-profile-id]');
      if (!card || !grid.contains(card)) return;

      // Action controls keep their own behavior; they must not open the profile.
      if (event.target.closest('button, a, input, select, textarea, label')) return;

      const profileId = card.dataset.profileId;
      if (!profileId) return;

      // people-actions-fix owns the actual member-profile modal. Bridge the
      // card click into its existing data-view-profile handler so we do not
      // create a second profile implementation or change profile functionality.
      const bridge = document.createElement('button');
      bridge.type = 'button';
      bridge.setAttribute('data-view-profile', profileId);
      bridge.setAttribute('aria-hidden', 'true');
      bridge.tabIndex = -1;
      bridge.style.cssText = 'position:absolute;width:1px;height:1px;opacity:0;pointer-events:none;';
      card.appendChild(bridge);
      bridge.click();
      bridge.remove();
    });

    const style = document.createElement('style');
    style.id = 'peopleCardNavigationStyles';
    style.textContent = `
      #profilesGrid .people-theme-card[data-profile-id] { cursor: pointer; }
      #profilesGrid .people-theme-card[data-profile-id] .member-card-actions,
      #profilesGrid .people-theme-card[data-profile-id] button { cursor: default; }
    `;
    document.head.appendChild(style);
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init, { once: true });
  } else {
    init();
  }

  // People cards can be rebuilt after filters/search, but the delegated listener
  // stays attached to #profilesGrid, so no per-card rebinding is required.
})();

/* OneMuslim People avatar positioning + crop cleanup.
   Kept here so the visual correction loads with the existing People card script. */
(function(){
  'use strict';

  function install(){
    if(document.getElementById('oneMuslimPeopleAvatarCleanup')) return;
    const style=document.createElement('style');
    style.id='oneMuslimPeopleAvatarCleanup';
    style.textContent=`
      body.dashboard-theme #profilesGrid .people-card-top{
        position:relative!important;
        height:120px!important;
        min-height:120px!important;
        align-items:stretch!important;
        overflow:visible!important;
      }

      body.dashboard-theme #profilesGrid .people-card-avatar-wrap{
        position:absolute!important;
        z-index:6!important;
        left:50%!important;
        top:46px!important;
        transform:translateX(-50%)!important;
        width:92px!important;
        height:92px!important;
        margin:0!important;
      }

      /* Show the complete avatar artwork instead of cutting the head with cover-cropping. */
      body.dashboard-theme #profilesGrid .people-card-avatar{
        width:92px!important;
        height:92px!important;
        box-sizing:border-box!important;
        object-fit:contain!important;
        object-position:center center!important;
        border:5px solid #fff!important;
        border-radius:50%!important;
        background:#fff!important;
      }

      body.dashboard-theme #profilesGrid .people-card-avatar-wrap .status-dot{
        right:1px!important;
        bottom:2px!important;
        z-index:8!important;
      }

      body.dashboard-theme #profilesGrid .people-card-body{
        padding-top:50px!important;
      }

      @media(max-width:560px){
        body.dashboard-theme #profilesGrid .people-card-top{
          height:116px!important;
          min-height:116px!important;
        }
        body.dashboard-theme #profilesGrid .people-card-avatar-wrap{
          top:44px!important;
          width:88px!important;
          height:88px!important;
        }
        body.dashboard-theme #profilesGrid .people-card-avatar{
          width:88px!important;
          height:88px!important;
        }
        body.dashboard-theme #profilesGrid .people-card-body{
          padding-top:48px!important;
        }
      }
    `;
    document.head.appendChild(style);
  }

  install();
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',install,{once:true});
})();
