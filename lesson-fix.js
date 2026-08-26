(() => {
  const $ = id => document.getElementById(id);
  const esc = s => String(s ?? '').replace(/[&<>"']/g, m => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[m]));
  const sb = window.supabase.createClient(window.APP_CONFIG.SUPABASE_URL, window.APP_CONFIG.SUPABASE_ANON_KEY, { auth:{persistSession:true,autoRefreshToken:true,detectSessionInUrl:true} });
  let lessonState = null;

  // Keep completed lessons in the database for history, but remove them from the active Lessons list.
  const originalRenderLessons = window.renderLessons;
  window.renderLessons = function renderLessonsFixed() {
    if (typeof originalRenderLessons === 'function') originalRenderLessons();
    const grid = $('lessonsGrid');
    if (!grid) return;
    grid.querySelectorAll('.lesson-card.completed').forEach(card => card.remove());
    document.querySelectorAll('#lessonsGrid [data-lesson]').forEach(b => b.onclick = () => window.startLesson(b.dataset.lesson));
    if (!grid.querySelector('.lesson-card') && grid.classList.contains('hidden') === false) {
      grid.innerHTML = `<div class="lesson-card" style="grid-column:1/-1;text-align:center;padding:42px"><div class="lesson-number">✓</div><div class="lesson-content"><span class="lesson-difficulty">PATH COMPLETE</span><h3>You've completed every lesson.</h3><p>Your completed lessons are safely recorded. New lessons will appear here when they're added.</p></div></div>`;
    }
  };

  // Replace the lesson player so question count is dynamic and the learner sees exactly what was right/wrong.
  window.startLesson = async function startLessonFixed(id) {
    const { data: lesson, error: lessonError } = await sb.from('lessons').select('id,slug,title,description,difficulty,points_per_question,sort_order').eq('id', id).maybeSingle();
    if (lessonError || !lesson) { if (typeof window.toast === 'function') window.toast(lessonError?.message || 'Lesson not found.'); return; }

    const { data: questions, error } = await sb.from('lesson_questions').select('id,question_number,question_text,options,points,is_lock_in').eq('lesson_id', id).order('question_number');
    if (error) { if (typeof window.toast === 'function') window.toast(error.message); return; }

    lessonState = { lesson, questions: questions || [], answers: new Array((questions || []).length).fill(null) };
    $('lessonsGrid').classList.add('hidden');
    $('lessonPlayer').classList.remove('hidden');
    renderQuestion(0);
  };

  function renderQuestion(index) {
    const state = lessonState;
    const q = state?.questions?.[index];
    if (!q) return;
    const total = state.questions.length;
    const answered = state.answers[index];

    $('lessonPlayer').innerHTML = `<div class="lesson-top"><button class="back" id="closeLesson">← Back to lessons</button><span>Question ${index + 1} of ${total}</span></div><div class="lesson-progress"><i style="width:${((index + 1) / total) * 100}%"></i></div><div class="lesson-question ${q.is_lock_in ? 'lock-in' : ''}"><span class="lesson-difficulty">${q.is_lock_in ? '🔒 LOCK IN' : 'QUESTION'} · ${Number(q.points).toLocaleString()} XP</span><h2>${esc(q.question_text)}</h2><div class="answer-list">${(q.options || []).map((opt, i) => `<button class="answer-option ${answered === String(i) ? 'selected' : ''}" data-answer="${i}"><span>${String.fromCharCode(65 + i)}</span>${esc(opt)}</button>`).join('')}</div><button class="primary lesson-next" id="lessonNext" ${answered === null ? 'disabled' : ''}>${index === total - 1 ? 'SUBMIT ANSWERS' : 'Continue'}</button></div>`;

    $('closeLesson').onclick = () => { lessonState = null; $('lessonPlayer').classList.add('hidden'); $('lessonsGrid').classList.remove('hidden'); };
    document.querySelectorAll('[data-answer]').forEach(b => b.onclick = () => {
      state.answers[index] = b.dataset.answer;
      document.querySelectorAll('[data-answer]').forEach(x => x.classList.remove('selected'));
      b.classList.add('selected');
      $('lessonNext').disabled = false;
    });
    $('lessonNext').onclick = async () => {
      if (state.answers[index] === null) return;
      if (index < total - 1) renderQuestion(index + 1);
      else await finishLessonFixed();
    };
  }

  async function finishLessonFixed() {
    const state = lessonState;
    if (!state) return;

    const { data, error } = await sb.rpc('grade_lesson', {
      p_lesson_id: state.lesson.id,
      p_answers: state.answers
    });
    if (error) { if (typeof window.toast === 'function') window.toast(error.message || 'We could not grade this lesson.'); return; }

    const results = Array.isArray(data?.results) ? data.results : [];
    const total = Number(data?.total_questions || results.length || state.questions.length);
    const correct = Number(data?.correct_count || 0);
    const wrong = Number(data?.wrong_count || 0);
    const passed = data?.passed === true && correct === total && wrong === 0;

    const breakdown = results.map((r, i) => `<div style="display:flex;align-items:center;justify-content:space-between;gap:12px;padding:11px 13px;border:1px solid ${r.correct ? '#c8ead3' : '#f0d0d0'};background:${r.correct ? '#f5fcf7' : '#fff7f7'};border-radius:12px;margin-top:8px"><span style="font-weight:800;color:#294035">Question ${Number(r.question_number || i + 1)}</span><span style="font-weight:900;color:${r.correct ? '#168746' : '#c94d5d'}">${r.correct ? `✓ Correct · +${Number(r.points || 0).toLocaleString()} XP` : '✕ Incorrect'}</span></div>`).join('');

    $('lessonPlayer').innerHTML = `<div class="lesson-result ${passed ? 'success' : 'failed'}" style="max-width:720px;margin:0 auto"><div class="result-icon">${passed ? '🏆' : '📊'}</div><h2>${passed ? 'Lesson passed!' : 'Good attempt — review and try again.'}</h2><p><strong>${correct} of ${total} correct</strong> · ${wrong} ${wrong === 1 ? 'answer was' : 'answers were'} incorrect.</p>${passed ? `<p>You got <b>every answer correct</b>. This lesson is complete, has been removed from your active lesson list, and awarded <b>${Number(data.awarded_points || 0).toLocaleString()} XP</b>.</p>` : `<p>You keep all XP you already earned elsewhere. This attempt awards <b>0 XP</b> until every answer is correct. Review the questions marked incorrect and try again.</p>`}<div style="text-align:left;margin:20px auto;max-width:560px"><h3 style="margin:0 0 8px;color:#294035">Your answers</h3>${breakdown}</div><button class="primary" id="lessonDone">${passed ? 'Back to lessons' : 'Review lesson'}</button></div>`;

    $('lessonDone').onclick = async () => {
      await window.loadProfile();
      await window.loadLessons();
      window.updateXpUi();
      window.renderLessons();
      $('lessonPlayer').classList.add('hidden');
      $('lessonsGrid').classList.remove('hidden');
      lessonState = null;
    };

    if (passed) {
      if (typeof window.celebrateXp === 'function') window.celebrateXp(Number(data.awarded_points || 0), `Lesson complete! +${Number(data.awarded_points || 0).toLocaleString()} XP 🎉`);
    } else if (typeof window.toast === 'function') {
      window.toast(`${correct} of ${total} correct. You can try the lesson again.`);
    }
  }

  // Also remove completed path items from Welcome Home without deleting their history.
  function cleanHomePath() {
    document.querySelectorAll('#homePage .path-item.done').forEach(item => item.remove());
  }
  const observer = new MutationObserver(cleanHomePath);
  document.addEventListener('DOMContentLoaded', () => {
    const home = $('homePage');
    if (home) observer.observe(home, {childList:true,subtree:true});
    cleanHomePath();
  });
})();