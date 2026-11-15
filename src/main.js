/*! 🪟 창문 공방 — © 2026 티쳐무 · 모든 권리 보유
 *  학교 수업 목적으로만 이용해 주세요. 자세한 내용은 LICENSE 를 보세요.
 *
 *  파이썬 tkinter(GUI 프로그래밍) 수업 — 교재 13장 「tkinter로 창이 있는 프로그램 만들기」.
 *  ★ 코랩에서는 창이 뜨지 않는다. 그래서 브라우저 안에 「가짜 tkinter」 를 만들어
 *    학생이 쓴 tkinter 코드가 그 자리에서 진짜처럼 창을 띄우고, 단추를 누르면 함수가 불린다.
 *  주소에 ?demo 를 붙이면 편집기마다 모범 답이 들어 있다(선생님 시연용).
 */
import './style.css';
import { h, modal } from './ui/dom.js';
import { createStage, createDeck } from './ui/deck.js';
import { CHAPTERS, CARDS } from './cards/index.js';
import { S, persist, resetAll } from './store.js';
import { DEMO } from './cards/kit.js';

const { holder, stage } = createStage();
document.body.append(holder);

async function askReset() {
  const ok = await modal('🧹 기록 지우기',
    '이 브라우저에 남은 것(카드 진행 · 편집기에 쓴 코드 · 고른 답 · 오늘 배운 것)을 모두 지우고 처음부터 시작할까요? 되돌릴 수 없어요.',
    { ok: '모두 지우기', cancel: '그만두기' });
  if (!ok) return;
  resetAll();
  location.reload();
}

createDeck(stage, CARDS, {
  chapters: CHAPTERS,
  start: Math.min(S.card || 0, CARDS.length - 1),
  isDone: (id) => !!S.done[id],
  onMove: (i) => { S.card = i; persist(); },
  chip: () => h('div', { class: 'me-chip' },
    DEMO ? h('span', { class: 'demo-tag' }, '👩‍🏫 시연') : null,
    `✔ ${Object.keys(S.done).filter((id) => CARDS.some((c) => c.id === id)).length} / ${CARDS.length}`),
  tools: () => h('button', { class: 'reset-btn', title: '이 브라우저의 기록을 모두 지웁니다', onClick: askReset }, '🧹 기록 지우기'),
});
