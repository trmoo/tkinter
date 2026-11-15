/*! 🪟 창문 공방 — © 2026 티쳐무 · 모든 권리 보유
 *  카드에 실린 코드를 진짜 tkinter 대조 사례로 모은다 (test/golden-cases.mjs 가 부른다).
 *  모범 답 · 다른 정답 · 처음 코드 · 흔한 실수를 모두 — 미션에 적힌 동작(글자 넣기 · 단추 누르기)까지 진짜와 똑같이 해 본다.
 *  카드 코드를 고치면 `npm run golden` 을 다시 돌릴 것.
 *  ⚠ node 로 불러다 쓴다. DOM 을 만들지 말 것.
 */
import { MISSIONS, PACK_PREDICT, GUESS_GUI } from './missions.js';
import { MISSIONS2 } from './missions2.js';
import { AIM, GALLERY, BIND, PAINT, KEYS, COUNTER_G, COUNTER_C, GUESS, CALC, CLINIC } from './missions3.js';

/* 3차시 동작 — 진짜 쪽은 event_generate 로, 가짜 쪽은 test/golden.test.mjs 의 act( ) 로 똑같이 */
const ev = (path, seq, opts = {}, extra = {}) => ({ do: 'event', path, seq, opts, ...extra });
const inv = (path) => ({ do: 'invoke', path });
const key = (k) => ev('.!canvas', `<KeyPress-${k}>`, {}, { focus: true });
const strokes = (y) => [0, 1, 2, 3].map((i) => ev('.!canvas', '<B1-Motion>', { x: 40 + i * 10, y }));
const btn = (n) => (n === 1 ? '.!button' : `.!button${n}`);

function addMissions3(out) {
  const T = (name, src, actions = []) => out.push({ name: `3차시 ${name}`, src, actions });
  T('사격장 모범 답', AIM.model);
  T('사격장 처음 코드', AIM.starter);
  T('갤러리 모범 답', GALLERY.model);
  T('갤러리 처음 코드', GALLERY.starter);
  T('bind — 누른 자리', BIND, [ev('.!frame', '<Button-1>', { x: 30, y: 40 }), ev('.!frame', '<Button-1>', { x: 150, y: 90 })]);
  T('bind — event 빠뜨림', BIND.replace('def click(event):', 'def click():'), [ev('.!frame', '<Button-1>', { x: 30, y: 40 })]);
  const paint = [...strokes(60), inv(btn(1)), ...strokes(120)];
  T('그림판 처음 코드', PAINT.starter, paint);
  T('그림판 모범 답', PAINT.model, [...paint, inv(btn(2)), ...strokes(180)]);
  T('그림판 global 빠뜨림', PAINT.mistakes[0], paint);
  T('키보드 처음 코드', KEYS.starter, [key('Right'), key('Right'), key('Left'), key('Up')]);
  T('키보드 모범 답', KEYS.model, [key('Right'), key('Right'), key('Up'), key('Up'), key('Down'), key('Left')]);
  T('키보드 위아래 반대', KEYS.mistakes[0], [key('Up'), key('Up')]);
  const plus3reset1 = [inv(btn(1)), inv(btn(1)), inv(btn(1)), inv(btn(2)), inv(btn(1))];
  T('계수기 함수판 모범 답', COUNTER_G.model, plus3reset1);
  T('계수기 global 빠뜨림', COUNTER_G.starter, [inv(btn(1))]);
  T('계수기 reset 만 global 빠뜨림', COUNTER_G.mistakes[0], plus3reset1);
  T('계수기 클래스판 처음 코드', COUNTER_C.starter, plus3reset1);
  T('계수기 클래스판 모범 답', COUNTER_C.model, [inv(btn(1)), inv(btn(1)), inv(btn(2)), inv(btn(3)), inv(btn(2))]);
  T('숫자 맞추기 모범 답', GUESS.model, [{ do: 'type', path: '.!entry', text: '50' }, inv(btn(1))]);
  // 계산기 — 단추 차례: 7 8 9 / C · 4 5 6 * ␣ · 1 2 3 - ␣ · 0 . = + ␣
  const calc = (keys) => keys.map((k) => inv(btn(['7', '8', '9', '/', 'C', '4', '5', '6', '*', 'a', '1', '2', '3', '-', 'b', '0', '.', '=', '+', 'c'].indexOf(k) + 1)));
  T('계산기 교재 코드', CALC.model, calc(['7', '*', '8', '=', 'C', '1', '/', '0', '=', 'C', '2', '+', '3', '*', '4', '=']));
  T('계산기 lambda 의 k=key 빠뜨림', CALC.mistakes[0], calc(['7', '8', '=']));
  for (const c of CLINIC) {
    const actions = c.id === 'getstr' ? [{ do: 'type', path: '.!entry', text: '10' }, { do: 'type', path: '.!entry2', text: '20' }, inv(btn(1))]
      : c.id === 'event' ? [ev('.!frame', '<Button-1>', { x: 50, y: 50 })]
      : c.id === 'global' ? [inv(btn(1))]
      : c.id === 'mix' || c.id === 'noloop' ? [] : [inv(btn(1))];
    T(`버그 병원 ${c.title}`, c.src, actions);
  }
}

function fromMissions(list, tag, out) {
  for (const m of Object.values(list)) {
    const actions = m.actions || [];
    for (const [i, src] of [m.model, ...(m.alts || [])].entries()) {
      if (src) out.push({ name: `${tag} ${m.id} ${i ? `다른 정답 ${i}` : '모범 답'}`, src, actions });
    }
    // 처음 코드는 위젯이 덜 만들어져 있을 수 있어 동작 없이 — 창 모습 · 출력 · 오류만 견준다
    if (m.starter && !/_{3,}/.test(m.starter) && m.starter !== m.model) out.push({ name: `${tag} ${m.id} 처음 코드`, src: m.starter, actions: [] });
    for (const [i, src] of (m.mistakes || []).entries()) out.push({ name: `${tag} ${m.id} 흔한 실수 ${i + 1}`, src, actions });
  }
}

export function goldenFromCards() {
  const out = [];
  fromMissions(MISSIONS, '1차시', out);
  PACK_PREDICT.forEach((src, i) => out.push({ name: `pack 예측 보기 ${i + 1}`, src, actions: [] }));
  out.push({ name: '숫자 맞추기 창 프로그램', src: GUESS_GUI, actions: [{ do: 'type', path: '.!entry', text: '50' }, { do: 'invoke', path: '.!button' }] });
  fromMissions(MISSIONS2, '2차시', out);
  addMissions3(out);
  return out;
}
