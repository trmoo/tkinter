/*! 🪟 창문 공방 — © 2026 티쳐무 · 모든 권리 보유
 *  3차시 미션 · 자동 검사 — 모범 답은 통과, 처음 코드 · 흔한 실수는 떨어지고 까닭을 말해 준다.
 *  버그 병원 — 환자 코드는 모두 「아직 아픔」, 고친 코드는 「나았음」 이어야 한다.
 */
import { 묶음, 확인, 참 } from './harness.mjs';
import { Program } from '../src/tk/program.js';
import {
  AIM, GALLERY, BIND, PAINT, KEYS, ballAt, reachedStar,
  COUNTER_G, COUNTER_C, counterCheck, COUNTER_STEPS,
  GUESS, playGuess, CALC, calcMap, calcPress, CLINIC,
} from '../src/data/missions3.js';
import { QUIZ3, REFLECT3 } from '../src/data/quiz.js';
import { launch, find, press, mouse } from '../src/tk/scenario.js';

const run = (src) => new Program(src).start();
const pass = (items) => items.length > 0 && items.every((x) => x.ok === true);
const whys = (items) => items.filter((x) => !x.ok).map((x) => x.why).join(' / ');

묶음('3차시 — 좌표 사격장 · 도형 갤러리');
{
  참('사격장 — 모범 답은 과녁 셋 모두 명중', pass(AIM.check(run(AIM.model))));
  const s = AIM.check(run(AIM.starter));
  확인('사격장 — 처음 코드는 셋 다 빗나간다', s.map((x) => x.ok), [false, false, false]);
  참('과녁 1 — 너비 · 높이가 아니라 오른쪽 아래 꼭짓점', s[0].why.includes('오른쪽 아래'));
  참('과녁 2 — 원은 감싸는 사각형', s[1].why.includes('감싸는 사각형'));
  참('과녁 3 — y 는 아래로 커진다', s[2].why.includes('아래로 커져요'));
  // 선은 어느 쪽 끝에서 그어도 같은 선
  참('과녁 3 — 반대쪽 끝에서 그어도 명중', AIM.check(run(AIM.model.replace('create_line(0, 200, 300, 0', 'create_line(300, 0, 0, 200')))[2].ok);
  참('사격장 — mainloop 없이 사라지면 명중이 아니다', !pass(AIM.check(run(AIM.model.replace('window.mainloop()', '')))));
  for (let i = 0; i < 3; i++) 참(`갤러리 — 모범 답 통과 (무작위 ${i + 1}번째)`, pass(GALLERY.check(run(GALLERY.model))));
  const g = GALLERY.check(run(GALLERY.starter));
  확인('갤러리 — 처음 코드는 열 개지만 한 종류', g.map((x) => x.ok), [true, false]);
  참('갤러리 — 더할 도형을 알려 준다', g[1].why.includes('create_oval'));
}

묶음('3차시 — bind 와 event');
{
  const p = run(BIND);
  mouse(p, find(p, 'Frame'), 30, 40);
  확인('Frame 을 누르면 event.x · event.y 가 찍힌다', p.stdout.trim().split('\n').pop(), '30 40 에서 눌렸습니다');
  const q = run(BIND.replace('def click(event):', 'def click():'));
  mouse(q, find(q, 'Frame'), 30, 40);
  확인('event 를 빠뜨리면 — 누를 때 TypeError, 창은 산다', [q.cbErrors.length, q.cbErrors[0].last.startsWith('TypeError'), q.state], [1, true, 'loop']);
}

묶음('3차시 — 그림판 · 키보드');
{
  참('그림판 — 모범 답(파랑 단추 더함) 통과', pass(PAINT.check(PAINT.model)));
  const s = PAINT.check(PAINT.starter);
  확인('그림판 — 처음 코드는 검정 · 빨강만', s.map((x) => x.ok), [true, true, false]);
  참('그림판 — 파랑 단추가 없다고 알려 준다', s[2].why.includes('파랑색으로'));
  const m = PAINT.check(PAINT.mistakes[0]);
  확인('global 을 빠뜨리면 — 빨강 단추를 눌러도 검정', m[1].ok, false);
  참('global 을 빠뜨리면 — global mycolor 를 짚는다', m[1].why.includes('global mycolor'));

  참('키보드 — 모범 답 통과', pass(KEYS.check(KEYS.model)));
  const k = KEYS.check(KEYS.starter);
  확인('키보드 — 처음 코드는 ← → 만', k.map((x) => x.ok), [true, true, false, false]);
  참('키보드 — 이어지지 않은 키를 짚는다', k[2].why.includes('bind_all'));
  const km = KEYS.check(KEYS.mistakes[0]);
  참('키보드 — 위로 가는데 +10 이면 「반대로」', !km[2].ok && km[2].why.includes('반대로'));

  const L = launch(KEYS.model);
  확인('공은 (10, 230) 에서 출발한다', ballAt(L.p), [10, 230]);
  참('출발할 때는 별에 닿지 않았다', !reachedStar(L.p));
  for (let i = 0; i < 30; i++) press(L.p, 'Right');
  for (let i = 0; i < 18; i++) press(L.p, 'Up');
  확인('→ 30번 · ↑ 18번 뒤 공의 자리', ballAt(L.p), [310, 50]);
  참('그러면 별에 닿는다', reachedStar(L.p));
}

묶음('3차시 — 클래스 계수기 · 숫자 맞추기');
{
  참('함수판 계수기 — 모범 답 통과', pass(counterCheck(COUNTER_G.model, COUNTER_STEPS.g)));
  const s = counterCheck(COUNTER_G.starter, COUNTER_STEPS.g);
  참('global 이 없으면 — 첫 단추에서 UnboundLocalError', !s[0].ok && s[0].why.includes('UnboundLocalError'));
  const m = counterCheck(COUNTER_G.mistakes[0], COUNTER_STEPS.g);
  // 초기화를 누르면 화면엔 0 이 뜨지만 바깥 count 는 3 그대로 — 다음 +1 에서 4 가 되어 들킨다
  확인('reset 에만 global 을 빠뜨리면 — 화면은 0 이 되지만 다음 +1 에서', m.map((x) => x.ok), [true, true, true, true, false]);
  참('reset 에만 global 을 빠뜨리면 — 「4」 를 보여 준다', m[4].why.includes('「4」'));
  참('클래스판 계수기 — 모범 답(−1 더함) 통과', pass(counterCheck(COUNTER_C.model, COUNTER_STEPS.c)));
  const c = counterCheck(COUNTER_C.starter, COUNTER_STEPS.c);
  참('클래스판 처음 코드 — −1 단추가 없다', !c[2].ok && c[2].why.includes('없어요'));

  for (let i = 0; i < 3; i++) 참(`숫자 맞추기 — 모범 답 통과 (무작위 ${i + 1}번째)`, pass(GUESS.check(GUESS.model)));
  const gs = GUESS.check(GUESS.starter);
  참('숫자 맞추기 — 처음 코드는 「N번 만에」 가 없다', !gs[0].ok);
  const gm = GUESS.check(GUESS.mistakes[0]);
  확인('reset 에서 횟수를 안 지우면 — 첫 판만 맞다', gm.map((x) => x.ok), [true, true, false]);
  참('숫자 맞추기 — 새 문제의 횟수를 짚는다', gm[2].why.includes('0 으로'));
  const L = launch(GUESS.model);
  const r = playGuess(L.p);
  참('반으로 나누어 찾으면 일곱 번 안에 맞힌다', r.done && r.tries <= 7);
}

묶음('3차시 — 계산기와 lambda');
{
  참('계산기 — 교재 코드 통과', pass(CALC.check(CALC.model)));
  const m = CALC.check(CALC.mistakes[0]);
  확인('lambda: click(key) — 셋 다 떨어진다', m.map((x) => x.ok), [false, false, false]);
  참('lambda: click(key) — k=key 를 짚는다', m[0].why.includes('k=key'));
  const good = calcMap(CALC.model);
  const bad = calcMap(CALC.mistakes[0]);
  확인('단추 지도 — 20개', [good.length, bad.length], [20, 20]);
  확인('바른 코드 — 7 단추는 7 을 넣는다', good[0], { label: '7', got: '7' });
  참('k=key 를 빠뜨리면 — 모든 단추가 마지막 글자(빈칸)', bad.every((x) => x.got === ' '));
  const L = launch(CALC.model);
  확인('2 + 3 * 4 = → 14 (곱셈 먼저)', calcPress(L.p, ['2', '+', '3', '*', '4', '=']), '14');
}

묶음('3차시 — 버그 병원');
{
  // 환자마다 고친 코드 (정답 갈래가 여럿인 곳은 둘 다)
  const cures = {
    noloop: [(s) => s + 'window.mainloop()\n'],
    nopack: [(s) => s.replace('command=hello)\n', 'command=hello)\nbutton.pack()\n')],
    paren: [(s) => s.replace('command=hello())', 'command=hello)')],
    mix: [(s) => s.replace('button.grid(row=1, column=0)', 'button.pack()'),
      (s) => s.replace('label.pack()', 'label.grid(row=0, column=0)')],
    getstr: [(s) => s.replace('e1.get() + e2.get()', 'int(e1.get()) + int(e2.get())'),
      (s) => s.replace('e1.get() + e2.get()', 'float(e1.get()) + float(e2.get())')],
    event: [(s) => s.replace('def click():', 'def click(event):')],
    global: [() => COUNTER_G.model],
  };
  확인('환자는 일곱', CLINIC.map((c) => c.id), ['noloop', 'nopack', 'paren', 'mix', 'getstr', 'event', 'global']);
  for (const c of CLINIC) {
    참(`${c.title} — 정답이 보기 안에 있다`, c.answer >= 0 && c.answer < c.choices.length);
    참(`${c.title} — 환자 코드는 아직 아프다`, !c.fix(c.src).ok);
    for (const [i, cure] of cures[c.id].entries()) {
      const fixed = cure(c.src);
      참(`${c.title} — 고친 코드 ${i + 1} 은 환자와 다르다`, fixed !== c.src);
      const r = c.fix(fixed);
      참(`${c.title} — 고친 코드 ${i + 1} 은 나았다`, r.ok);
      if (!r.ok) console.log('     ', c.id, i, r.why);
    }
  }
  // 증상이 정말 그렇게 나타나는가
  const noloop = run(CLINIC[0].src);
  참('사라지는 창 — 번쩍', noloop.flash && noloop.state !== 'loop');
  const nopack = run(CLINIC[1].src);
  참('보이지 않는 단추 — 오류 없이 대기실에', !nopack.error && !find(nopack, 'Button').manager);
  const mix = run(CLINIC[3].src);
  참('켜지지 않는 창 — TclError', !!mix.error && mix.error.last.includes('TclError'));
  // 반만 고친 코드는 떨어진다 — 덧셈기에서 하나만 int( )
  const half = CLINIC[4].fix(CLINIC[4].src.replace('e1.get() + e2.get()', 'int(e1.get()) + e2.get()'));
  참('덧셈기 — 하나만 int( ) 면 TypeError 로 떨어진다', !half.ok && half.why.includes('TypeError'));
}

묶음('3차시 확인 문제');
QUIZ3.forEach((q, i) => {
  참(`${i + 1}번 — 정답이 보기 안에 있다`, q.answer >= 0 && q.answer < q.choices.length);
  참(`${i + 1}번 — 풀이가 있다`, q.why.length > 10);
});
확인('확인 문제 — 여섯 문항', QUIZ3.length, 6);
확인('오늘 배운 것 — 세 물음', REFLECT3.length, 3);
참('모든 확인 문제의 보기가 서로 다르다', QUIZ3.every((q) => new Set(q.choices).size === q.choices.length));
