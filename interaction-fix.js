(()=>{
'use strict';
function boot(){
  const $=id=>document.getElementById(id);
  const auth=(mode)=>{if(typeof window.showAuth==='function'){window.showAuth(mode);return false;}return true;};
  document.addEventListener('click',async e=>{
    const el=e.target.closest('button,[data-page]');
    if(!el) return;
    const id=el.id;
    if(id==='openLogin'||id==='openSignup'){
      e.preventDefault();e.stopImmediatePropagation();
      if(auth(id==='openSignup'?'signup':'login')){
        $('publicView')?.classList.add('hidden');$('authView')?.classList.remove('hidden');
      }
      return;
    }
    if(id==='backPublic'){
      e.preventDefault();e.stopImmediatePropagation();$('authView')?.classList.add('hidden');$('publicView')?.classList.remove('hidden');return;
    }
    const page=el.getAttribute('data-page');
    if(page){
      e.preventDefault();e.stopImmediatePropagation();
      document.querySelectorAll('.page').forEach(p=>p.classList.add('hidden'));
      $(page+'Page')?.classList.remove('hidden');
      document.querySelectorAll('.side').forEach(b=>b.classList.toggle('active',b===el));
      if(page==='feed' && typeof window.renderApp==='function') window.renderApp();
    }
  },true);
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot);else boot();
})();
