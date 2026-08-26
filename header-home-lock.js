(() => {
  const { createClient } = window.supabase || {};
  const cfg = window.APP_CONFIG || {};
  if (!createClient || !cfg.SUPABASE_URL || !cfg.SUPABASE_ANON_KEY) return;
  const sb = createClient(cfg.SUPABASE_URL, cfg.SUPABASE_ANON_KEY, {auth:{persistSession:true,autoRefreshToken:true,detectSessionInUrl:true}});
  const brand = document.querySelector('.brand');
  const badge = document.getElementById('sessionBadge');
  if (brand) {
    brand.setAttribute('role','button');
    brand.setAttribute('tabindex','0');
    brand.title='Go to Home';
    const goHome=()=>{
      document.querySelectorAll('.page').forEach(p=>p.classList.add('hidden'));
      document.getElementById('feedPage')?.classList.remove('hidden');
      document.querySelectorAll('.side').forEach(b=>b.classList.remove('active'));
      document.querySelector('.side[data-page="feed"]')?.classList.add('active');
      document.getElementById('publicView')?.classList.add('hidden');
      document.getElementById('authView')?.classList.add('hidden');
      document.getElementById('appView')?.classList.remove('hidden');
      window.scrollTo({top:0,behavior:'smooth'});
    };
    brand.addEventListener('click',goHome);
    brand.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' ')goHome()});
  }
  const update=async()=>{
    const {data}=await sb.auth.getSession();
    const loggedIn=!!data?.session;
    if(badge){
      badge.textContent=loggedIn?'UNLOCKED':'LOCKED';
      badge.classList.toggle('unlocked',loggedIn);
      badge.setAttribute('aria-label',loggedIn?'Authenticated secure session':'Locked — sign in required');
    }
  };
  update();
  sb.auth.onAuthStateChange(()=>update());
})();
