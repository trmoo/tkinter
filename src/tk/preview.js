/*! 🪟 창문 공방 — © 2026 티쳐무 · 모든 권리 보유
 *  코드 → 창 모습 — 의뢰의 목표 화면 · 예측 문제의 보기 그림을 만들 때 쓴다.
 *  ⚠ node 로 불러다 시험한다. DOM 을 만들지 말 것.
 */
import { Program } from './program.js';
import { renderModel } from './render-model.js';
import { snapshotRoot } from './snapshot.js';

/** 코드를 돌려 mainloop 에서 기다리는 첫 창의 그릴 거리 · 모습. 창이 안 뜨면 null */
export function previewOf(src) {
  const p = new Program(src).start();
  if (p.state !== 'loop' || !p.app.liveRoots.length) return { program: p, model: null, snap: null };
  const root = p.app.liveRoots[0];
  return { program: p, model: renderModel(p.app, root), snap: snapshotRoot(p.app, root) };
}

/* ── 두 창 견주기 (의뢰 채점) ───────────────────────────────── */
const area = (b) => Math.max(0, b.w) * Math.max(0, b.h);
function iou(a, b) {
  const x1 = Math.max(a.x, b.x), y1 = Math.max(a.y, b.y);
  const x2 = Math.min(a.x + a.w, b.x + b.w), y2 = Math.min(a.y + a.h, b.y + b.h);
  const inter = Math.max(0, x2 - x1) * Math.max(0, y2 - y1);
  const uni = area(a) + area(b) - inter;
  return uni > 0 ? inter / uni : 0;
}
/** 창 안쪽 왼쪽 위에서 잰 자리 (스냅숏의 x·y 는 부모 안의 자리라 틀(Frame) 안이면 더해 준다) */
function absBoxes(snap) {
  const byPath = new Map(snap.widgets.map((w) => [w.path, w]));
  return snap.widgets.filter((w) => w.manager).map((w) => {
    let x = w.x, y = w.y;
    let p = w.path.slice(0, w.path.lastIndexOf('.'));
    while (p && p !== '' && byPath.has(p)) { const q = byPath.get(p); x += q.x || 0; y += q.y || 0; p = p.slice(0, p.lastIndexOf('.')); }
    return { ...w, x, y };
  });
}

/**
 * 학생 창 ↔ 목표 창.
 *   stars.widgets — 같은 종류 · 같은 글자의 위젯이 모두 있나
 *   stars.layout  — 짝지은 위젯들이 거의 같은 자리에 있나 (겹침 비율 평균 0.7 이상)
 *   stars.style   — 제목 · 색 · 창 크기가 같은가
 *   similarity    — 닮은 정도 (0~100)
 *   notes         — 무엇이 다른지 (학생에게 보일 말)
 */
export function compareWindows(mine, target) {
  const notes = [];
  if (!mine) return { stars: { widgets: false, layout: false, style: false }, similarity: 0, notes: ['창이 떠 있지 않아요. ▶ 실행을 눌러 창을 띄워 보세요.'] };
  const A = absBoxes(mine), B = absBoxes(target);
  const key = (w) => `${w.cls}|${w.text ?? ''}`;
  const left = [...A];
  const pairs = [];
  const missing = [];
  for (const t of B) {
    let i = left.findIndex((m) => key(m) === key(t));
    if (i < 0) i = left.findIndex((m) => m.cls === t.cls && t.text === undefined);
    if (i < 0) { missing.push(t); continue; }
    pairs.push([left[i], t]);
    left.splice(i, 1);
  }
  const kindKo = { Label: '라벨', Button: '단추', Entry: '입력 칸', Frame: '틀', Canvas: '캔버스', Checkbutton: '체크 단추', Radiobutton: '라디오 단추', Listbox: '목록' };
  for (const t of missing) notes.push(`없는 위젯: ${kindKo[t.cls] || t.cls}${t.text ? ` 「${t.text}」` : ''}`);
  for (const m of left) notes.push(`목표에 없는 위젯: ${kindKo[m.cls] || m.cls}${m.text ? ` 「${m.text}」` : ''}`);
  const widgets = missing.length === 0 && left.length === 0;
  const ious = pairs.map(([m, t]) => iou(m, t));
  const total = B.length + left.length;
  const similarity = total ? Math.round(100 * ious.reduce((a, b) => a + b, 0) / total) : 0;
  const avg = ious.length ? ious.reduce((a, b) => a + b, 0) / ious.length : 0;
  const layout = widgets && avg >= 0.7;
  pairs.forEach(([m, t], i) => {
    if (ious[i] < 0.5) notes.push(`자리가 달라요: ${kindKo[t.cls] || t.cls}${t.text ? ` 「${t.text}」` : ''}`);
  });
  let style = mine.title === target.title;
  if (!style) notes.push(`창 제목이 달라요 (목표: 「${target.title}」)`);
  for (const [m, t] of pairs) {
    for (const k of ['background', 'foreground']) {
      if (t[k] !== undefined && m[k] !== t[k]) {
        style = false;
        notes.push(`${kindKo[t.cls] || t.cls}${t.text ? ` 「${t.text}」` : ''} 의 ${k === 'background' ? '바탕색(bg)' : '글자색(fg)'}이 달라요`);
      }
    }
    if (Math.abs(m.h - t.h) > 4 && ['Label', 'Button'].includes(t.cls) && ious[pairs.indexOf(pairs.find((p) => p[0] === m))] < 0.9) {
      style = false;
      notes.push(`${kindKo[t.cls] || t.cls}${t.text ? ` 「${t.text}」` : ''} 의 글자 크기(font)가 달라 보여요`);
    }
  }
  return { stars: { widgets, layout, style: style && widgets }, similarity, notes: [...new Set(notes)].slice(0, 6) };
}
