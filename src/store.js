/*! 🪟 창문 공방 — © 2026 티쳐무 · 모든 권리 보유
 *  앱이 기억하는 것 — 이 브라우저의 localStorage 에만 남는다(서버로 보내지 않는다).
 *  기억하는 것: 카드별 진행 · 편집기 내용 · 고른 답 · 오늘 배운 것. 개인정보(이름·학번)는 받지 않는다.
 */
const KEY = 'tk-window-workshop:v1';

const blank = () => ({ done: {}, cards: {}, card: 0, session: 'all' });

function read() {
  try {
    const t = localStorage.getItem(KEY);
    return t ? { ...blank(), ...JSON.parse(t) } : null;
  } catch (e) { return null; }
}

export const S = read() || blank();

export function persist() {
  try { localStorage.setItem(KEY, JSON.stringify(S)); } catch (e) { /* 저장 공간이 막혀 있어도 앱은 돈다 */ }
}

/** 카드 하나의 기록 */
export function card(id) { return S.cards[id] || (S.cards[id] = {}); }
export function setCard(id, patch) { Object.assign(card(id), patch); persist(); }
export function markDone(id) { if (!S.done[id]) { S.done[id] = true; persist(); return true; } return false; }

export function resetAll() {
  try { localStorage.removeItem(KEY); } catch (e) { /* 무시 */ }
  Object.assign(S, blank());
}
