/*! 🪟 창문 공방 — © 2026 티쳐무 · 모든 권리 보유
 *  미션 검사 — 모범 답 · 다른 정답은 통과하고, 처음 코드 · 흔한 실수는 떨어져야 한다.
 *  의뢰 채점 — 목표와 똑같으면 별 셋 · 100%, 비어 있으면 0%.
 *  확인 문제 — 정답 번호가 보기 안에 있고, 풀이가 비어 있지 않다.
 */
import { 묶음, 확인, 참 } from './harness.mjs';
import { Program } from '../src/tk/program.js';
import { MISSIONS, PLACE, ORDER1, GUESS_GUI, snapOf } from '../src/data/missions.js';
import { previewOf, compareWindows } from '../src/tk/preview.js';
import { QUIZ1, REFLECT1 } from '../src/data/quiz.js';
import { koreanOf } from '../src/data/translate.js';

const run = (src) => new Program(src).start();
const pass = (items) => items.length > 0 && items.every((x) => x.ok === true);

묶음('미션 — 모범 답은 통과, 처음 코드는 아직');
for (const m of Object.values(MISSIONS)) {
  if (!m.check) continue;
  참(`${m.id} — 모범 답이 통과한다`, pass(m.check(run(m.model))));
  for (const [i, a] of (m.alts || []).entries()) 참(`${m.id} — 다른 정답 ${i + 1} 도 통과한다`, pass(m.check(run(a))));
  참(`${m.id} — 처음 코드는 아직 통과하지 않는다`, !pass(m.check(run(m.starter))));
  for (const [i, a] of (m.mistakes || []).entries()) 참(`${m.id} — 흔한 실수 ${i + 1} 은 떨어진다`, !pass(m.check(run(a))));
  // 떨어진 칸에는 까닭이 있어야 학생이 고칠 수 있다 — 적어도 칸 이름(label)은 비어 있지 않다
  for (const it of m.check(run(m.starter))) 참(`${m.id} — 칸마다 이름이 있다`, !!it.label);
}
참('place — 모범 답이 과녁 셋을 모두 맞힌다', pass(PLACE.check(run(PLACE.model))));
참('place — 처음 코드는 과녁을 맞히지 못한다', !pass(PLACE.check(run(PLACE.starter))));

묶음('미션 — 흔한 실수의 모습');
{
  const p = run(MISSIONS.later.starter);
  const lab = snapOf(p).widgets.find((w) => w.cls === 'Label');
  확인('label.text = … 는 오류 없이 화면이 그대로다', [p.state, lab.text], ['loop', '처음 글자']);
  const mix = run(MISSIONS.mixfix.starter);
  확인('pack 과 grid 를 섞으면 TclError 로 멈춘다', [mix.state, mix.error && mix.error.type], ['crashed', '_tkinter.TclError']);
  const blank = run(MISSIONS.gridform.starter);
  확인('빈칸을 그대로 두면 NameError (빈칸 풀이가 나온다)', [blank.error && blank.error.type, koreanOf(blank.error.last).includes('빈칸')], ['NameError', true]);
  const noLoop = run(MISSIONS.first.starter.replace('window.mainloop()', ''));
  확인('mainloop 를 지우면 창이 번쩍 — flash', [noLoop.state, noLoop.flash, !!noLoop.flashModels], ['done', true, true]);
  const gui = run(GUESS_GUI);
  확인('숫자 맞추기 창 프로그램은 mainloop 에서 기다린다', gui.state, 'loop');
}

묶음('의뢰 채점');
{
  const goal = previewOf(ORDER1.target);
  const same = compareWindows(snapOf(run(ORDER1.target)), goal.snap);
  확인('목표와 같은 코드 — 별 셋', same.stars, { widgets: true, layout: true, style: true });
  확인('목표와 같은 코드 — 닮은 정도 100', same.similarity, 100);
  const empty = compareWindows(snapOf(run(ORDER1.starter)), goal.snap);
  확인('처음 코드 — 별 없음 · 0%', [empty.stars.widgets, empty.similarity], [false, 0]);
  const noTitle = compareWindows(snapOf(run(ORDER1.target.replace('window.title("꿈누리 분식")', ''))), goal.snap);
  확인('제목만 빠뜨리면 — 위젯 · 배치는 ★, 꾸미기는 ☆', noTitle.stars, { widgets: true, layout: true, style: false });
  참('제목이 다르다고 알려 준다', noTitle.notes.some((n) => n.includes('제목')));
  const color = compareWindows(snapOf(run(ORDER1.target.replace('bg="orange"', 'bg="yellow"'))), goal.snap);
  참('바탕색이 다르면 알려 준다', !color.stars.style && color.notes.some((n) => n.includes('바탕색')));
  확인('창이 없으면 — 0%', compareWindows(null, goal.snap).similarity, 0);
}

묶음('확인 문제 · 오늘 배운 것');
QUIZ1.forEach((q, i) => {
  참(`${i + 1}번 — 정답이 보기 안에 있다`, q.answer >= 0 && q.answer < q.choices.length);
  참(`${i + 1}번 — 풀이가 있다`, q.why.length > 10);
});
참('4번 — 섞으면 「멈춘다」 가 아니라 TclError 라고 풀이한다', QUIZ1[3].why.includes('TclError'));
확인('오늘 배운 것 — 세 물음', REFLECT1.length, 3);
