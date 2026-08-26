(() => {
  const $ = id => document.getElementById(id);
  const esc = s => String(s ?? '').replace(/[&<>"']/g, m => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[m]));

  function activeLessons() {
    return (window.lessons || []).filter(l => !(window.lessonCompletions instanceof Map && window.lessonCompletions.get(l.id)?.passed));
  }

  // The original UI showed every lesson, including completed lessons.
  // Keep completed lessons in the database for history/XP integrity, but remove them from the active list.
  window.renderLessons = function renderLessonsFixed() {
    const grid = $('lessonsGrid');
    if (!grid) return;
    const list = activeLessons();
    const xp = Number(window.profile?.xp_total || 0);
    if ($('lessonsXp')) $('lessonsXp').textContent = xp.toLocaleString();

    if (!list.length) {
      grid.innerHTML = `
        <div class="lesson-card completed" style="grid-column:1/-1;text-align:center;padding:42px">
          <div class="lesson-number">✓</div>
          <div class="lesson-content">
            <span class="lesson-difficulty">PATH COMPLETE</span>
            <h3>You've completed every lesson.</h3>
            <p>Your completed lessons are safely recorded. New lessons can appear here as they are added.</p>
          </div>
        </div>`;
      return;
    }

    grid.innerHTML = list.map((l, i) => {
      const total = Number(l.points_per_question) * 4;
      return `<article class="lesson-card">
        <div class="lesson-number">${String(i + 1).padStart(2,'0')}</div>
        <div class="lesson-content">
          <span class="lesson-difficulty">${esc(l.difficulty)} · ${Number(l.points_per_question).toLocaleString()} XP / question</span>
          <h3>${esc(l.title)}</h3>
          <p>${esc(l.description)}</p>
          <div class="lesson-bottom">
            <span>4 questions · up to ${total.toLocaleString()} XP</span>
            <button class="primary lesson-start" data-lesson="${l.id}">Start lesson</button>
          </div>
        </div>
      </article>`;
    }).join('');

    document.querySelectorAll('[data-lesson]').forEach(b => b.onclick = () => window.startLesson(b.dataset.lesson));
  };

  // Replace the result screen so learners see exactly how they did.
  window.finishLesson = async function finishLessonFixed() {
    const lesson = window.currentLesson;
    const answers = window.currentLessonAnswers;
    if (!lesson) return;

    const sbClient = window.sb;
    if (!sbClient) return;

    const { data, error } = await sbClient.rpc('grade_lesson', {
      p_lesson_id: lesson.id,
      p_answers: answers
    });

    if (error) {
      if (typeof window.toast === 'function') window.toast(error.message || 'We could not grade this lesson.');
      return;
    }

    const results = Array.isArray(data?.results) ? data.results : [];
    const correct = Number(data?.correct_count || 0);
    const wrong = Number(data?.wrong_count || 0);
    const total = Number(data?.total_questions || results.length || 0);
    const passed = data?.passed === true && wrong === 0 && correct === total;

    const breakdown = results.map((r, i) => `
      <div style="display:flex;align-items:center;justify-content:space-between;gap:12px;padding:11px 13px;border:1px solid ${r.correct ? '#c8ead3' : '#f0d0d0'};background:${r.correct ? '#f5fcf7' : '#fff7f7'};border-radius:12px;margin-top:8px">
        <span style="font-weight:800;color:#294035">Question ${Number(r.question_number || i + 1)}</span>
        <span style="font-weight:900;color:${r.correct ? '#168746' : '#c94d5d'}">${r.correct ? `✓ Correct · +${Number(r.points || 0).toLocaleString()} XP` : '✕ Incorrect'}</span>
      </div>`).join('');

    const summary = total
      ? `<strong>${correct} of ${total} correct</strong> · ${wrong} ${wrong === 1 ? 'answer' : 'answers'} ${wrong === 1 ? 'was' : 'were'} incorrect.`
      : 'No questions were available to grade.';

    const player = $('lessonPlayer');
    player.innerHTML = `<div class="lesson-result ${passed ? 'success' : 'failed'}" style="max-width:720px;margin:0 auto">
      <div class="result-icon">${passed ? '🏆' : '📊'}</div>
      <h2>${passed ? 'Lesson passed!' : 'Good attempt — review and try again.'}</h2>
      <p>${summary}</p>
      ${passed
        ? `<p>You got every answer correct, so this lesson is now complete and has been removed from your active lesson list. You earned <b>${Number(data.awarded_points || 0).toLocaleString()} XP</b>.</p>`
        : `<p>You do <b>not</b> lose XP for a failed attempt. Fix the questions marked incorrect and try again. The lesson stays available until you get every answer right.</p>`}
      <div style="text-align:left;margin:20px auto;max-width:560px">${breakdown}</div>
      <button class="primary" id="lessonDone">${passed ? 'Back to lessons' : 'Review lesson'}</button>
    </div>`;

    $('lessonDone').onclick = async () => {
      await window.loadProfile();
      await window.loadLessons();
      window.updateXpUi();
      window.renderLessons();
      player.classList.add('hidden');
      $('lessonsGrid').classList.remove('hidden');
    };

    if (passed) {
      if (typeof window.celebrateXp === 'function') window.celebrateXp(Number(data.awarded_points || 0), `Lesson complete! +${Number(data.awarded_points || 0).toLocaleString()} XP 🎉`);
    } else if (typeof window.toast === 'function') {
      window.toast(`${correct} of ${total} correct. Review the incorrect answers and try again.`);
    }
  };

  // Remove completed lessons from the Welcome Home path too, while keeping progress/history intact.
  function cleanHomePath() {
    const path = document.querySelector('#homePage .path-list');
    if (!path) return;
    path.querySelectorAll('.path-item.done').forEach(item => item.remove());
  }

  const observer = new MutationObserver(() => cleanHomePath());
  document.addEventListener('DOMContentLoaded', () => {
    const home = $('homePage');
    if (home) observer.observe(home, {childList:true,subtree:true});
    cleanHomePath();
  });
})();