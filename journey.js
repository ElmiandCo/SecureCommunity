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
async function getRemainingQuestionIds(lessonId){
 const uid=(await sb.auth.getUser()).data?.user?.id;
 if(!uid)return new Set();
 const r=await sb.from('lesson_question_progress').select('question_id').eq('user_id',uid).eq('lesson_id',lessonId);
 if(r.error){console.warn('Could not load lesson question progress:',r.error);return new Set()}
 return new Set((r.data||[]).map(x=>String(x.question_id)));
}
async function start(id){
 const l=lessons.find(x=>String(x.id)===String(id));if(!l)return;
 const r=await sb.from('lesson_questions').select('id,question_number,question_text,options,points,is_lock_in').eq('lesson_id',id).order('question_number');
 if(r.error){showError(r.error.message);return}if(!r.data?.length){showError('This lesson does not have questions yet.');return}
 const mastered=await getRemainingQuestionIds(id);
 const remaining=r.data.filter(q=>!mastered.has(String(q.id)));
 if(!remaining.length){showMastered(l);return}
 state={lesson:l,questions:remaining,answers:Array(remaining.length).fill(null),index:0};
 $('catalog').style.display='none';renderQuestion();
}
function showMastered(l){
 $('catalog').style.display='none';$('player').innerHTML=`<div class="result"><div style="font-size:48px">🏆</div><h2>Lesson mastered!</h2><p>You have already answered every question in <b>${esc(l.title)}</b> correctly.</p><p>Your correct answers are saved, so you will not be asked those questions again.</p><button class="btn" id="masteredBack">Back to Journey</button></div>`;
 $('masteredBack').onclick=()=>{$('player').innerHTML='';$('catalog').style.display='block';state=null;renderCatalog()};
}
function renderQuestion(){
 const q=state.questions[state.index],n=state.index+1,total=state.questions.length,options=q.options||[];
 $('player').innerHTML=`<div class="question"><div class="kicker">${q.is_lock_in?'🔒 LOCK IN':'QUESTION'} · ${Number(q.points||0).toLocaleString()} XP</div><p class="question-count">Remaining question ${n} of ${total}</p><h2 class="question-text">${esc(q.question_text)}</h2><div class="answers">${options.map((x,i)=>`<button class="answer ${state.answers[state.index]===String(x)?'selected':''}" data-a="${i}"><span class="answer-letter">${String.fromCharCode(65+i)}</span><span>${esc(x)}</span></button>`).join('')}</div><div class="actions"><button class="btn secondary" id="quit">Exit</button><button class="btn" id="next" ${state.answers[state.index]===null?'disabled':''}>${n===total?'Submit':'Continue'}</button></div></div>`;
 document.querySelectorAll('[data-a]').forEach(b=>b.onclick=()=>{const i=Number(b.dataset.a);state.answers[state.index]=String(options[i]);renderQuestion()});
 $('quit').onclick=()=>{$('catalog').style.display='block';$('player').innerHTML='';state=null};
 $('next').onclick=()=>{if(state.answers[state.index]===null)return;if(state.index<state.questions.length-1){state.index++;renderQuestion()}else finish()}
}
async function finish(){
 const submitted={};
 state.questions.forEach((q,i)=>{if(state.answers[i]!==null)submitted[String(q.id)]=state.answers[i]});
 const r=await sb.rpc('grade_lesson',{p_lesson_id:state.lesson.id,p_answers:submitted});
 if(r.error){showError(r.error.message||'We could not grade this lesson.');return}
 const d=r.data||{};const passed=d.passed===true&&Number(d.remaining_count||0)===0;const awarded=Number(d.awarded_points||0);const correct=Number(d.correct_count||0);const wrong=Number(d.wrong_count||0);const remaining=Number(d.remaining_count||0);
 $('player').innerHTML=`<div class="result"><div style="font-size:48px">${passed?'🏆':'📚'}</div><h2>${passed?'Lesson complete!':'Good work — keep going.'}</h2><p>${correct} correct${wrong?` · ${wrong} to review`:''}.</p><p>${passed?`You mastered all ${Number(d.total_questions||0)} questions and earned <b>${awarded.toLocaleString()} XP</b>. Your correct answers are permanently recorded.`:`${remaining} question${remaining===1?'':'s'} remain. The questions you already answered correctly are saved and will not be shown again. No XP is removed.`}</p><button class="btn" id="again">${passed?'Continue Journey':'Continue with Remaining Questions'}</button><button class="btn secondary" id="account">Create Account & Keep My Progress</button></div>`;
 $('again').onclick=()=>{if(passed){$('player').innerHTML='';$('catalog').style.display='block';state=null;renderCatalog()}else start(state.lesson.id)};$('account').onclick=convert;
}
function convert(){sessionStorage.setItem('onemuslim_journey_convert','1');location.href='index.html?journey=convert'}
function showError(msg){$('player').innerHTML=`<div class="result"><h2>Journey temporarily unavailable</h2><p class="error">${esc(msg)}</p><button class="btn secondary" onclick="location.href='index.html'">Return Home</button></div>`}
boot().catch(e=>showError(e.message||'Journey unavailable.'));
})();