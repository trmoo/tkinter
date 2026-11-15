/*! 🪟 창문 공방 — © 2026 티쳐무 · 모든 권리 보유
 *  2차시 미션 · 자동 검사 — 모범 답 · 다른 정답은 통과, 처음 코드 · 흔한 실수는 떨어지고 까닭을 말해 준다.
 *  실행 순서 띠 — command=process( ) 는 「누르기 전!」 으로 잡힌다.
 */
import { 묶음, 확인, 참 } from './harness.mjs';
import { Program } from '../src/tk/program.js';
import { MISSIONS2, ORDER2, order2Run, tempCheck, step2Check } from '../src/data/missions2.js';
import { QUIZ2, REFLECT2 } from '../src/data/quiz.js';
import { launch, find, click, type } from '../src/tk/scenario.js';

const run = (src) => new Program(src).start();
const pass = (items) => items.length > 0 && items.every((x) => x.ok === true);
const whys = (items) => items.filter((x) => !x.ok).map((x) => x.why).join(' / ');

묶음('2차시 — 단추와 실행 순서 띠');
{
  const ok = run(MISSIONS2.cmd.model);
  확인('command=process — 시작할 때는 함수가 불리지 않는다', ok.timeline.some((t) => t.early), false);
  click(ok, find(ok, 'Button'));
  확인('단추를 누르면 그때 불리고 라벨이 바뀐다', [ok.calls.some((c) => c.phase === 'loop' && !c.direct), find(ok, 'Label').shownText], [true, '단추가 눌렸습니다!']);
  const bad = run(MISSIONS2.cmd.mistakes[0]);
  확인('command=process() — 「누르기 전」 으로 띠에 잡힌다', bad.timeline.some((t) => t.early && t.text.startsWith('process')), true);
  확인('창이 뜨자마자 라벨이 벌써 바뀌어 있다', find(bad, 'Label').shownText, '단추가 눌렸습니다!');
  const before = bad.calls.length;
  click(bad, find(bad, 'Button'));
  확인('그 단추를 눌러도 아무 함수도 불리지 않는다', bad.calls.length, before);
}

묶음('2차시 — 미션 자동 검사');
for (const id of ['getstr', 'temp3', 'temp4', 'temp5']) {
  const m = MISSIONS2[id];
  참(`${id} — 모범 답이 통과한다`, pass(m.check(m.model)));
  for (const [i, a] of (m.alts || []).entries()) {
    참(`${id} — 다른 정답 ${i + 1} 이 모범 답과 다르다`, a !== m.model);
    참(`${id} — 다른 정답 ${i + 1} 도 통과한다`, pass(m.check(a)));
  }
  참(`${id} — 처음 코드는 아직`, !pass(m.check(m.starter)));
  for (const [i, a] of (m.mistakes || []).entries()) {
    참(`${id} — 흔한 실수 ${i + 1} 은 모범 답과 다르다`, a !== m.model);
    const r = m.check(a);
    참(`${id} — 흔한 실수 ${i + 1} 은 떨어진다`, !pass(r));
    참(`${id} — 흔한 실수 ${i + 1} 은 까닭을 말해 준다`, whys(r).length > 5);
  }
}
{
  const [intM, paren, noDel, noFloat] = MISSIONS2.temp4.mistakes.map((s) => tempCheck(s));
  확인('int( ) — 212 · 32 는 맞고 98.6 에서 떨어진다', intM.map((x) => x.ok), [true, true, false]);
  참('int( ) — float( ) 를 쓰라고 한다', intM[2].why.includes('float'));
  참('괄호 빠뜨림 — 194.22 를 보고 괄호를 짚는다', paren[0].why.includes('194.22') && paren[0].why.includes('괄호'));
  확인('delete 빠뜨림 — 첫 번째는 맞고 두 번째부터 덧붙는다', noDel.map((x) => x.ok), [true, false, false]);
  참('delete 빠뜨림 — delete(0, END) 를 짚는다', noDel[1].why.includes('delete'));
  참('float 빠뜨림 — 글자로 계산했다고 짚는다', noFloat[0].why.includes('글자'));
  const s = MISSIONS2.getstr.check(MISSIONS2.getstr.starter);
  참('get( ) 그대로 — 「1717」 을 짚는다', s[0].why.includes('1717'));
}

묶음('2차시 — grid · 색 · 고르기');
참('2단계 — 모범 답 통과', pass(step2Check(run(MISSIONS2.temp2.model))));
참('2단계 — 다른 정답(column 생략) 통과', pass(step2Check(run(MISSIONS2.temp2.alts[0]))));
참('2단계 — 처음 코드(pack)는 자리가 다르다', !pass(step2Check(run(MISSIONS2.temp2.starter))));
참('색 — 모범 답(16진수 하나 더) 통과', pass(MISSIONS2.rainbow.check(run(MISSIONS2.rainbow.model))));
참('색 — 처음 코드는 아직', !pass(MISSIONS2.rainbow.check(run(MISSIONS2.rainbow.starter))));
참('목록 — Kotlin 더하기 두 가지 모두 통과', pass(MISSIONS2.listbox.check(run(MISSIONS2.listbox.model))) && pass(MISSIONS2.listbox.check(run(MISSIONS2.listbox.alts[0]))));
{
  const p = run(MISSIONS2.radio.model);
  const radios = [...p.app.widgets.values()].filter((w) => w.kind === 'Radiobutton');
  click(p, radios[1]); click(p, radios[2]);
  확인('같은 변수 — 하나만 켜진다', radios.map((w) => w.selected), [false, false, true]);
  const q = run(MISSIONS2.radio.mistakes[0]);
  const rq = [...q.app.widgets.values()].filter((w) => w.kind === 'Radiobutton');
  click(q, rq[0]); click(q, rq[1]);
  확인('C 만 다른 변수 — 둘이 함께 켜진다', rq.map((w) => w.selected), [true, true, false]);
  const c = run(MISSIONS2.check.model);
  const cbs = [...c.app.widgets.values()].filter((w) => w.kind === 'Checkbutton');
  cbs.forEach((w) => click(c, w));
  확인('체크 단추 — 둘 다 켜진다', cbs.map((w) => w.selected), [true, true]);
}

묶음('의뢰 2 — 동아리 신청서 동작 검사');
{
  확인('목표 코드 — 두 사람 모두 통과', order2Run(ORDER2.target).map((x) => x.ok), [true, true]);
  const start = order2Run(ORDER2.starter);
  참('처음 코드 — 떨어지고 무엇이 없는지 말한다', !start[0].ok && start[0].why.includes('없는 위젯'));
  // 답을 박아 둔 코드는 두 번째 사람에서 들킨다
  const fixed = ORDER2.target.replace('result["text"] = name.get() + "님, " + str(grade.get()) + "학년 · 관심 분야 " + str(count) + "개 신청 완료!"',
    'result["text"] = "김여름님, 2학년 · 관심 분야 2개 신청 완료!"');
  확인('답을 글자로 박아 두면 — 첫 사람만 통과', order2Run(fixed).map((x) => x.ok), [true, false]);
  // 체크 단추에 같은 변수를 쓰면 관심 분야 수가 틀린다
  const shared = ORDER2.target.replace('Checkbutton(window, text="AI", variable=ai)', 'Checkbutton(window, text="AI", variable=web)');
  확인('체크 단추가 변수를 함께 쓰면 — 떨어진다', order2Run(shared)[0].ok, false);
}

묶음('자동 검사 도구');
{
  const L = launch('from tkinter import *\nwindow = Tk()\n');
  확인('mainloop 없는 코드 — 창이 사라진다고 알려 준다', [L.ok, L.why.includes('mainloop')], [false, true]);
  const E = launch('from tkinter import *\nwindow = Tk()\nLabel(window, txt="a").pack()\nwindow.mainloop()\n');
  확인('시작하자마자 오류 — 오류를 알려 준다', [E.ok, E.why.includes('TclError')], [false, true]);
  const G = launch(MISSIONS2.getstr.model);
  type(G.p, find(G.p, 'Entry'), '21');
  click(G.p, find(G.p, 'Button'));
  확인('글자 넣고 누르기 — 콘솔에 찍힌다', G.p.stdout.split('\n').pop(), '두 배: 42');
}

묶음('2차시 확인 문제');
QUIZ2.forEach((q, i) => {
  참(`${i + 1}번 — 정답이 보기 안에 있다`, q.answer >= 0 && q.answer < q.choices.length);
  참(`${i + 1}번 — 풀이가 있다`, q.why.length > 10);
});
확인('오늘 배운 것 — 세 물음', REFLECT2.length, 3);
