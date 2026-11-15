/*! 🪟 창문 공방 — © 2026 티쳐무 · 모든 권리 보유
 *  변수 상자 — IntVar · StringVar 에 지금 무엇이 담겼는지 (파이썬 이름과 함께) 실시간으로 보여 준다.
 *  라디오 단추를 누르면 그 변수의 값이 바뀌는 것을 눈으로 보게 하려고.
 */
import { h, fill } from './dom.js';

/** 파이썬 전역 이름 → 그 이름이 가리키는 tkinter 변수 */
export function tkVarsOf(p) {
  if (!p) return [];
  const out = [];
  for (const [name, v] of p.it.globals) {
    if (v && v.k === 'nobj' && v.tkvar) out.push({ name, kind: v.type, value: v.tkvar.value, tkname: v.tkvar.name });
  }
  return out;
}

export function varBox(p) {
  const list = tkVarsOf(p);
  return h('div', { class: 'varbox' },
    h('div', { class: 'varbox-t' }, '📦 변수 상자 — 지금 담긴 값'),
    list.length ? fill(h('div', { class: 'varbox-list' }), ...list.map((v) => h('div', { class: 'vb' },
      h('code', { class: 'vb-name' }, v.name), h('span', { class: 'vb-kind' }, v.kind),
      h('span', { class: 'vb-eq' }, '='), h('b', { class: 'vb-val' }, v.kind === 'StringVar' ? `"${v.value}"` : (v.value === '' ? '""' : v.value)))))
      : h('div', { class: 'muted small' }, '아직 IntVar · StringVar 가 없어요.'));
}
