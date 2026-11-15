/*! 🪟 창문 공방 — © 2026 티쳐무 · 모든 권리 보유
 *  자동 검사 — 학생 프로그램을 따로 하나 더 실행해, 사람 대신 글자를 넣고 단추를 누른 뒤 결과를 읽는다.
 *  (온도 변환기에 212 · 32 · 98.6 넣어 보기, 신청서에 이름 넣고 고르고 누르기 …)
 *  ⚠ node 로 불러다 시험한다. DOM 을 만들지 말 것.
 */
import { Program } from './program.js';

/** 살아 있는 위젯을 만든 차례대로 */
export function widgetsOf(p, kind) {
  return [...p.app.widgets.values()].filter((w) => w.alive && w.kind !== 'Tk' && (!kind || w.kind === kind)).sort((a, b) => a.order - b.order);
}
/** 종류 · 글자로 찾기 — text 를 안 주면 n 번째 */
export function find(p, kind, { text, n = 0, has } = {}) {
  const list = widgetsOf(p, kind);
  if (text !== undefined) return list.find((w) => w.shownText === text) || null;
  if (has !== undefined) return list.find((w) => w.shownText.includes(has)) || null;
  return list[n] || null;
}

/** 단추 누르기 — 진짜 마우스처럼 누르고 떼기 (체크 · 라디오도) */
export function click(p, w) {
  if (!w || !w.alive) return false;
  p.dispatch(w, { type: 'ButtonPress', detail: '1', x: 2, y: 2, mods: [], count: 1 });
  p.dispatch(w, { type: 'ButtonRelease', detail: '1', x: 2, y: 2, mods: [], count: 1, inside: true });
  return true;
}
/** 입력 칸에 글자 넣기 (원래 글자는 지우고) */
export function type(p, w, text) {
  if (!w || !w.alive) return false;
  p.typeInto(w, text);
  return true;
}
/** 목록에서 고르기 */
export function pick(p, w, index) {
  if (!w || !w.alive) return false;
  p.dispatch(w, { type: 'ButtonPress', detail: '1', index, x: 2, y: 2, mods: [], count: 1 });
  return true;
}

/** 이 단계 동안 새로 생긴 오류 (함수 안 오류 · 응답 없음) */
export function newErrors(p, since) { return p.cbErrors.slice(since); }

/** 프로그램을 띄운다 — 창이 떠서 기다리는 상태가 아니면 { ok: false, why } */
export function launch(src) {
  const p = new Program(src).start();
  if (p.state === 'loop' && p.app.liveRoots.length) return { ok: true, p };
  let why = '창이 떠서 기다리는 상태가 되지 않아요.';
  if (p.error) why = `실행하자마자 오류가 나요 — ${p.error.last}`;
  else if (p.flash) why = 'mainloop( ) 가 없어 창이 바로 사라져요.';
  return { ok: false, p, why };
}

/** 키 누르기 — 포커스를 가진 위젯(없으면 창)에. bind_all 로 건 연결은 어디서나 받는다 */
export function press(p, keysym, target = null) {
  const w = target || (p.app.focus && p.app.focus.alive ? p.app.focus : p.app.liveRoots[0]);
  if (!w) return false;
  p.dispatch(w, { type: 'KeyPress', detail: keysym, keysym, char: keysym.length === 1 ? keysym : '', mods: [], count: 1 });
  return true;
}
/** 마우스로 끌기 — 누르고 · 왼쪽 단추를 누른 채 점마다 움직이고 · 뗀다 */
export function drag(p, w, points) {
  if (!w || !w.alive || !points.length) return false;
  const [x0, y0] = points[0];
  p.dispatch(w, { type: 'ButtonPress', detail: '1', x: x0, y: y0, mods: [], count: 1 });
  for (const [x, y] of points) p.dispatch(w, { type: 'Motion', x, y, mods: ['B1'], count: 1 });
  const [xn, yn] = points[points.length - 1];
  p.dispatch(w, { type: 'ButtonRelease', detail: '1', x: xn, y: yn, mods: [], count: 1, inside: true });
  return true;
}
/** 마우스로 한 번 누르기(왼쪽 · 오른쪽 · 두 번) — 단추가 아닌 위젯(Frame · Canvas)에 */
export function mouse(p, w, x, y, { button = '1', count = 1 } = {}) {
  if (!w || !w.alive) return false;
  p.dispatch(w, { type: 'ButtonPress', detail: button, x, y, mods: [], count });
  p.dispatch(w, { type: 'ButtonRelease', detail: button, x, y, mods: [], count, inside: true });
  return true;
}
/** 캔버스의 도형들 — [{ type, coords, fill }] */
export function itemsOf(cv) {
  return cv ? [...cv.items.values()].map((it) => ({ id: it.id, type: it.type, coords: it.coords.slice(), fill: it.opts.fill, text: it.opts.text })) : [];
}
