/*! 🪟 창문 공방 — © 2026 티쳐무 · 모든 권리 보유
 *  카드 넘기기 틀.
 *  ★ 화면은 언제나 1280×720 「무대」 하나다. 창 크기에 맞춰 통째로 키우거나 줄이므로
 *    교실 TV·노트북·태블릿 어디서나 스크롤이 생기지 않는다. 카드 안 내용도 이 크기에 맞게 쓴다.
 */
import { h, fill, beginScreen } from './dom.js';

export const W = 1280, H = 720;

/** 무대를 만들고 창 크기에 맞춰 늘이고 줄인다 */
export function createStage() {
  const stage = h('div', { class: 'stage' });
  const holder = h('div', { class: 'stage-holder' }, stage);
  const fit = () => {
    const s = Math.min(window.innerWidth / W, window.innerHeight / H);
    stage.style.transform = `scale(${s})`;
    holder.style.width = `${W * s}px`;
    holder.style.height = `${H * s}px`;
  };
  window.addEventListener('resize', fit);
  fit();
  return { holder, stage };
}

/**
 * 카드 넘기기.
 *   cards: [{ id, chapter, title, render(body, api) }]
 *   api.next( ) · api.go(i) · api.refreshHead( )
 *   isDone(id) 가 참이면 단원 단추에 ✔ 를 단다
 */
let keyHandler = null;
export function createDeck(stage, cards, { chapters, start = 0, onMove, chip, tools, isDone = () => false } = {}) {
  let i = Math.max(0, Math.min(cards.length - 1, start));
  const head = h('header', { class: 'card-head' });
  const body = h('main', { class: 'card-body' });
  const foot = h('footer', { class: 'card-foot' });
  fill(stage, head, body, foot);

  function paintHead() {
    const c = cards[i];
    const ch = chapters.find((x) => x.id === c.chapter);
    fill(head,
      h('div', { class: 'ch-tag', style: { '--c': ch.color } }, `${i}. ${ch.label}`),
      h('h1', {}, c.title),
      isDone(c.id) ? h('span', { class: 'done-chip' }, '✔ 해냈어요') : null,
      chip ? chip() : null,
      tools ? tools() : null);
  }
  function paintFoot() {
    const chIdx = chapters.findIndex((x) => x.id === cards[i].chapter);
    fill(foot,
      h('button', { class: 'nav prev', disabled: i === 0, onClick: () => go(i - 1), 'aria-label': '이전 카드' }, '◀ 이전'),
      h('nav', { class: 'chapters', 'aria-label': '카드' }, ...chapters.map((ch, k) => {
        const mine = cards.map((c, n) => ({ c, n })).filter(({ c }) => c.chapter === ch.id);
        return h('div', { class: 'ch-group' + (k === chIdx ? ' on' : ''), style: { '--c': ch.color } },
          h('span', { class: 'ch-name' }, ch.short),
          ...mine.map(({ c, n }) => h('button', {
            class: 'dot' + (n === i ? ' here' : '') + (isDone(c.id) ? ' done' : ''),
            title: `${n}. ${c.title}`, 'aria-label': `${n}번 카드 ${c.title}`, onClick: () => go(n),
          }, String(n))));
      })),
      h('button', { class: 'nav next', disabled: i === cards.length - 1, onClick: () => go(i + 1), 'aria-label': '다음 카드' }, '다음 ▶'));
  }
  function paint() {
    beginScreen();
    paintHead();
    paintFoot();
    fill(body);
    cards[i].render(body, api);
    if (onMove) onMove(i);
  }
  function go(k) {
    if (k < 0 || k >= cards.length) return;
    i = k; paint();
  }
  const api = {
    next: () => go(i + 1), go,
    /** 카드를 해냈을 때 — 머리·발 표시만 다시 그린다 (카드 안은 그대로) */
    refreshHead: () => { paintHead(); paintFoot(); },
    get index() { return i; },
  };

  if (keyHandler) window.removeEventListener('keydown', keyHandler);
  keyHandler = (e) => {
    // 글을 치는 칸에서는 화살표가 커서를 움직여야 한다
    const t = e.target;
    if (t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.isContentEditable)) return;
    if (document.querySelector('.overlay')) return;
    if (e.key === 'ArrowRight' || e.key === 'PageDown') { e.preventDefault(); go(i + 1); }
    if (e.key === 'ArrowLeft' || e.key === 'PageUp') { e.preventDefault(); go(i - 1); }
  };
  window.addEventListener('keydown', keyHandler);
  paint();
  return api;
}
