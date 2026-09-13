/* OneMuslim pre-account Journey: anonymous Supabase identity keeps lesson XP attached to the future account. */
(function(){
'use strict';
const cfg=window.APP_CONFIG||{};let sb=null,lessons=[],state=null;
const $=id=>document.getElementById(id);const esc=s=>String(s??'').replace(/[&<>\"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;',"'":'&#039;'}[m]));
async function boot(){
 sb=window.supabase.createClient(cfg.SUPABASE_URL,cfg.SUPABASE_ANON_KEY,{auth:{persistSession:true,autoRefreshToken:true,detectSessionInUrl:false}});
 let session=(await sb.auth.getSession()).data?.session;
 if(!session){const r=await sb.auth.signInAnonymously({options:{data:{journey_guest:true}}});if(r.error){showError('The learning journey needs Anonymous Sign-Ins enabled in the OneMuslim Supabase Auth settings. Your existing account flow is unchanged.');return}session=r.data.session}
 sessionStorage.setItem('onemuslim_journey_active','1');
 await loadLessons();$('back').onclick=()=>location.href='index.html';
}
async function loadLessons(){
 const r=await sb.from('lessons').select('id,slug,title,description,difficulty,points_per_question,sort_order').eq('active',true).order('sort_order');
 if(r.error){showError(r.error.message);return}lessons=r.data||[];renderCatalog();
}
async function renderCatalog(){
 const uid=(await sb.auth.getUser()).data?.user?.id;let done=new Map();
 if(uid){const r=await sb.from('lesson_completions').select('lesson_id,passed,awarded_points').eq('user_id',uid);(r.data||[]).forEach(x=>done.set(x.lesson_id,x))}
 let total=0;done.forEach(x=>{if(x.passed)total+=Number(x.awarded_points||0)});
 $('xp').textContent=total.toLocaleString();$('completed').textContent=[...done.values()].filter(x=>x.passed).length;const next=lessons.find(l=>!done.get(l.id)?.passed);$('next').textContent=next?next.sort_order:'Complete';
 $('lessons').innerHTML=lessons.slice(0,20).map(l=>{const d=done.get(l.id)?.passed;return `<article class="lesson ${d?'done':''}"><div class="kicker">LESSON ${Number(l.sort_order||0)}</div><h3>${esc(l.title)}</h3><p>${esc(l.description||'Continue your path of knowledge.')}</p><p><b>${d?'✓ Completed':'Available'}</b></p><button class="btn ${d?'secondary':''}" data-id="${esc(l.id)}">${d?'Review':'Begin'}</button></article>`}).join('');
 document.querySelectorAll('[data-id]').forEach(b=>b.onclick=()=>start(b.dataset.id));
}
async function start(id){
 const l=lessons.find(x=>String(x.id)===String(id));if(!l)return;const r=await sb.from('lesson_questions').select('id,question_number,question_text,options,points,is_lock_in').eq('lesson_id',id).order('question_number');if(r.error){showError(r.error.message);return}if(!r.data?.length){showError('This lesson does not have questions yet.');return}
 state={lesson:l,questions:r.data,answers:Array(r.data.length).fill(null),index:0};$('catalog').style.display='none';renderQuestion();
}
function renderQuestion(){const q=state.questions[state.index],n=state.index+1,total=state.questions.length,options=q.options||[];$('player').innerHTML=`<div class="question"><div class="kicker">${q.is_lock_in?'🔒 LOCK IN':'QUESTION'} · ${Number(q.points||0).toLocaleString()} XP</div><p>Question ${n} of ${total}</p><h2>${esc(q.question_text)}</h2><div class="answers">${options.map((x,i)=>`<button class="answer ${state.answers[state.index]===String(x)?'selected':''}" data-a="${i}">${String.fromCharCode(65+i)} · ${esc(x)}</button>`).join('')}</div><div class="actions"><button class="btn secondary" id="quit">Exit</button><button class="btn" id="next" ${state.answers[state.index]===null?'disabled':''}>${n===total?'Submit':'Continue'}</button></div></div>`;document.querySelectorAll('[data-a]').forEach(b=>b.onclick=()=>{const i=Number(b.dataset.a);state.answers[state.index]=String(options[i]);renderQuestion()});$('quit').onclick=()=>{$('catalog').style.display='block';$('player').innerHTML='';state=null};$('next').onclick=()=>{if(state.answers[state.index]===null)return;if(state.index<state.questions.length-1){state.index++;renderQuestion()}else finish()}}
async function finish(){const r=await sb.rpc('grade_lesson',{p_lesson_id:state.lesson.id,p_answers:state.answers});if(r.error){showError(r.error.message||'We could not grade this lesson.');return}const d=r.data||{};const passed=d.passed===true&&Number(d.wrong_count||0)===0;const awarded=Number(d.awarded_points||0);$('player').innerHTML=`<div class="result"><div style="font-size:48px">${passed?'🏆':'📚'}</div><h2>${passed?'Lesson complete!':'Keep going.'}</h2><p>${Number(d.correct_count||0)} of ${Number(d.total_questions||state.questions.length)} correct.</p><p>${passed?`You earned <b>${awarded.toLocaleString()} XP</b>. This progress is already attached to your temporary Journey identity.`:'No XP is removed. Review the incorrect answers and try again.'}</p><button class="btn" id="again">${passed?'Continue Journey':'Try Again'}</button><button class="btn secondary" id="account">Create Account & Keep My Progress</button></div>`;$('again').onclick=()=>{if(passed){$('player').innerHTML='';$('catalog').style.display='block';state=null;renderCatalog()}else start(state.lesson.id)};$('account').onclick=convert}
function convert(){sessionStorage.setItem('onemuslim_journey_convert','1');location.href='index.html?journey=convert'}
function showError(msg){$('player').innerHTML=`<div class="result"><h2>Journey temporarily unavailable</h2><p class="error">${esc(msg)}</p><button class="btn secondary" onclick="location.href='index.html'">Return Home</button></div>`}
boot().catch(e=>showError(e.message||'Journey unavailable.'));
})();