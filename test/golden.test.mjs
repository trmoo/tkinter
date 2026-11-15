/*! 🪟 창문 공방 — © 2026 티쳐무 · 모든 권리 보유
 *  가짜 tkinter ↔ 진짜 tkinter (파이썬 3.12 · Tk 8.6).
 *  화면 출력 · 오류 문구(Traceback 의 tkinter 안쪽 칸까지) · 창의 모습(위젯 자리·크기·글자·값)이 같아야 한다.
 *  사례에 적힌 동작(단추 누르기 · 글자 치기 · 이벤트)도 똑같이 해 보고 그 뒤 모습까지 견준다.
 */
import { readFileSync } from 'node:fs';
import { 묶음, 확인 } from './harness.mjs';
import { Program } from '../src/tk/program.js';
import { snapshotRoot } from '../src/tk/snapshot.js';
import { parseSequence } from '../src/tk/app.js';

const golden = JSON.parse(readFileSync(new URL('./golden.json', import.meta.url), 'utf-8'));

/** 진짜 쪽과 같은 동작을 가짜 창에 */
export function act(p, a) {
  const w = a.path && a.path !== '.' ? p.app.widgets.get(a.path) : p.app.liveRoots[0];
  if (!w) return;
  if (a.do === 'invoke') {
    p.dispatch(w, { type: 'ButtonPress', detail: '1', x: 2, y: 2 });
    p.dispatch(w, { type: 'ButtonRelease', detail: '1', x: 2, y: 2 });
  } else if (a.do === 'type') p.typeInto(w, a.text);
  else if (a.do === 'event') {
    const s = parseSequence(a.seq);
    const o = a.opts || {};
    if (a.focus) p.app.focus = w;
    p.dispatch(w, { type: s.type, detail: s.detail ?? (s.type.startsWith('Button') ? '1' : null), mods: s.mods, x: o.x ?? 0, y: o.y ?? 0,
      keysym: o.keysym || s.detail, char: '', count: 1 });
  } else if (a.do === 'select') {
    p.dispatch(w, { type: 'ButtonPress', detail: '1', index: a.index, x: 2, y: 2 });
  }
}

/** 견주기 전에 — 진짜 쪽 자리·크기는 허용 범위(tol) 안이면 같은 것으로 */
function near(real, mine, tol) {
  if (!real || !mine) return { real, mine };
  const fix = (r, m) => {
    for (const k of ['w', 'h', 'x', 'y']) if (typeof r[k] === 'number' && typeof m[k] === 'number' && Math.abs(r[k] - m[k]) <= tol) m[k] = r[k];
  };
  const m = JSON.parse(JSON.stringify(mine));
  fix(real, m);
  real.widgets.forEach((rw, i) => { if (m.widgets[i]) fix(rw, m.widgets[i]); });
  return { real, mine: m };
}

묶음('진짜 tkinter 와 대조');
for (const g of golden.cases) {
  const p = new Program(g.src).start();
  let before = null, after = null;
  if (p.state === 'loop') {
    before = snapshotRoot(p.app, p.app.liveRoots[0]);
    for (const a of g.actions) { if (p.state !== 'loop') break; act(p, a); }
    after = p.state === 'loop' && p.app.liveRoots.length ? snapshotRoot(p.app, p.app.liveRoots[0]) : null;
    if (p.state === 'loop') { for (const r of p.app.liveRoots) p.destroy(r); p.settle(); }
  }
  확인(`${g.name} — 화면 출력`, p.stdout.replace(/\n+$/, ''), g.stdout);
  확인(`${g.name} — 오류 문구`, p.stderr.replace(/\n+$/, ''), g.stderr);
  const tol = g.tol || 0;
  if (g.snap && g.random) {
    // 무작위 수가 진짜 파이썬과 달라 도형 좌표·색은 견주지 않는다 — 위젯 나무와 도형 수만
    const strip = (s) => s && { ...s, widgets: s.widgets.map((w) => (w.items && w.cls === 'Canvas' ? { ...w, items: w.items.length } : w)) };
    확인(`${g.name} — 창의 모습(무작위 · 도형 수만)`, strip(before), strip(g.snap.before));
  } else if (g.snap) {
    const b = near(g.snap.before, before, tol);
    확인(`${g.name} — 창의 모습(처음)`, b.mine, b.real);
    if (g.actions.length) {
      const a = near(g.snap.after, after, tol);
      확인(`${g.name} — 창의 모습(동작 뒤)`, a.mine, a.real);
    }
  } else 확인(`${g.name} — 창이 뜨지 않는다`, before, null);
}
