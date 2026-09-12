/* OneMuslim People avatar positioning + crop cleanup.
   Intentionally isolated from member-discovery.js so concurrent People work is safer. */
(function(){
  'use strict';

  function install(){
    if(document.getElementById('oneMuslimPeopleAvatarCleanup')) return;
    const style=document.createElement('style');
    style.id='oneMuslimPeopleAvatarCleanup';
    style.textContent=`
      /* Give the selected profile background enough breathing room above the avatar. */
      body.dashboard-theme #profilesGrid .people-card-top{
        position:relative!important;
        height:120px!important;
        min-height:120px!important;
        align-items:stretch!important;
        overflow:visible!important;
      }

      /* Place the avatar deliberately lower instead of letting flex alignment pull it toward the top edge. */
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

      /* Contain the full avatar artwork so the kufi/head is never cut by object-fit:cover. */
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

      /* Keep the member content clear of the lower half of the avatar. */
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
