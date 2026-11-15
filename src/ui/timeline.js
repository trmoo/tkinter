/*! 🪟 창문 공방 — © 2026 티쳐무 · 모든 권리 보유
 *  실행 순서 띠 — 프로그램이 「언제」 무엇을 했는지 칩으로 늘어놓는다.
 *  시작할 때(위에서부터 실행) → mainloop( ) → 기다리는 동안(단추 · 키 · 마우스) → 창을 닫은 뒤.
 *  command=process( ) 처럼 단추를 누르기도 전에 불린 함수는 빨간 테두리(early)로 보인다.
 */
import { h, fill } from './dom.js';

const KO = { start: '▶ 시작', root: '🪟 창 만들기', mainloop: '⏳ mainloop — 기다리기', closed: '✕ 창 닫힘', end: '■ 끝', hung: '🧊 응답 없음' };

export function timelineView(p, { max = 16 } = {}) {
  const box = h('div', { class: 'timeline', 'aria-label': '실행 순서' });
  if (!p) { box.appendChild(h('span', { class: 'muted small' }, '실행하면 프로그램이 한 일이 차례대로 여기에 보여요.')); return box; }
  const list = p.timeline.slice(-max);
  const items = [];
  if (p.timeline.length > max) items.push(h('span', { class: 'tl' }, '…'));
  list.forEach((t, i) => {
    if (i) items.push(h('span', { class: 'tl-arrow' }, '→'));
    let text = KO[t.kind] || t.text;
    if (t.kind === 'call') text = `📞 ${t.text}`;
    if (t.kind === 'print') text = `🖨 ${t.text.length > 14 ? `${t.text.slice(0, 14)}…` : t.text}`;
    if (t.kind === 'error' || t.kind === 'cberror') text = `💥 ${t.text.split(':')[0]}`;
    items.push(h('span', { class: `tl ${t.kind}${t.early ? ' early' : ''}`, title: t.early ? '단추를 누르기도 전에 불렸어요!' : t.text || '' },
      text, t.early ? h('b', { class: 'tl-early' }, ' 누르기 전!') : null));
  });
  fill(box, ...items);
  return box;
}
