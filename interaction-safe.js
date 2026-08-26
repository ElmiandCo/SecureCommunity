/* Safety auth bridge. It only takes over if the main app did not bind the public auth buttons. */
(function(){
  const $=id=>document.getElementById(id);
  const show=(id)=>document.querySelectorAll('.screen').forEach(x=>x.classList.toggle('hidden',x.id!==id));
  function fallbackAuth(mode){
    const auth=$('authView'), form=$('authForm'), title=$('authTitle'), sw=$('authSwitch');
    if(!auth||!form) return;
    show('authView');
    const reset=mode==='reset';
    if(mode==='signup'){
      title.innerHTML='<h2>Create your account</h2><p>A few details make your member profile yours.</p>';
      form.innerHTML='<div class="field"><label>Email</label><input id="email" type="email" required autocomplete="email" placeholder="you@example.com"></div><div class="field"><label>Password</label><input id="password" type="password" minlength="8" required autocomplete="new-password" placeholder="At least 8 characters"></div><button class="primary" type="submit">Create account</button>';
      sw.innerHTML='Already have an account? <button type="button" id="fallbackLogin">Sign in</button>';
    }else{
      title.innerHTML='<h2>Welcome back</h2><p>Your private space is waiting.</p>';
      form.innerHTML='<div class="field"><label>Email</label><input id="email" type="email" required autocomplete="email" placeholder="you@example.com"></div><div class="field"><label>Password</label><input id="password" type="password" required autocomplete="current-password" placeholder="Your password"></div><button class="primary" type="submit">Sign in</button>';
      sw.innerHTML='New here? <button type="button" id="fallbackSignup">Create an account</button>';
    }
    $('fallbackLogin')?.addEventListener('click',()=>fallbackAuth('login'));
    $('fallbackSignup')?.addEventListener('click',()=>fallbackAuth('signup'));
    form.onsubmit=async e=>{
      e.preventDefault();
      const msg=$('authMessage');
      const email=$('email')?.value.trim().toLowerCase();
      const password=$('password')?.value||'';
      if(password.length<8){if(msg){msg.textContent='Password must be at least 8 characters.';msg.classList.remove('hidden')}return;}
      try{
        if(!window.supabase){await new Promise((resolve,reject)=>{const s=document.createElement('script');s.src='supabase.js';s.onload=resolve;s.onerror=reject;document.head.appendChild(s)})}
        const cfg=window.APP_CONFIG||{};
        const client=window.supabase.createClient(cfg.SUPABASE_URL,cfg.SUPABASE_ANON_KEY,{auth:{persistSession:true,autoRefreshToken:true,detectSessionInUrl:true}});
        const result=mode==='signup'?await client.auth.signUp({email,password}):await client.auth.signInWithPassword({email,password});
        if(result.error) throw result.error;
        window.location.reload();
      }catch(err){if(msg){msg.textContent=err?.message||'Unable to sign in right now. Please try again.';msg.classList.remove('hidden')}}
    };
  }
  window.setTimeout(function(){
    const login=$('openLogin'), signup=$('openSignup');
    if(login && !login.__bound){login.addEventListener('click',()=>typeof window.showAuth==='function'?window.showAuth('login'):fallbackAuth('login'));login.__bound=true}
    if(signup && !signup.__bound){signup.addEventListener('click',()=>typeof window.showAuth==='function'?window.showAuth('signup'):fallbackAuth('signup'));signup.__bound=true}
  },0);
})();
