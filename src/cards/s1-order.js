/*! 🪟 창문 공방 — © 2026 티쳐무 · 모든 권리 보유
 *  1차시 마무리 — 카드 8 「의뢰 1 꿈누리 분식 주문서」(목표 화면 똑같이 만들기) · 카드 9 「확인 문제 · 오늘 배운 것」
 */
import { h, fill } from '../ui/dom.js';
import { windowPicture } from '../ui/window.js';
import { story, tip, finish, runBox, hints, choose, picked, pills } from './kit.js';
import { card, setCard } from '../store.js';
import { ORDER1, snapOf } from '../data/missions.js';
import { previewOf, compareWindows } from '../tk/preview.js';
import { QUIZ1, REFLECT1 } from '../data/quiz.js';

/* ════════ 카드 8 — 의뢰 1 ════════ */
export const orderCard = {
  id: 'order1', chapter: 's1', title: '📮 의뢰 1 — 꿈누리 분식 주문서',
  render(body, api) {
    const cid = 'order1';
    const goal = previewOf(ORDER1.target);
    const result = h('div', { class: 'order-card' });
    let ghost = false;
    const paint = (p) => {
      const r = compareWindows(snapOf(p), goal.snap);
      const s = r.stars;
      const best = Math.max(card(cid).best || 0, r.similarity);
      setCard(cid, { best });
      fill(result,
        h('div', { class: 'stars' },
          h('span', { class: 'star' + (s.widgets ? ' on' : '') }, `${s.widgets ? '★' : '☆'} 위젯`),
          h('span', { class: 'star' + (s.layout ? ' on' : '') }, `${s.layout ? '★' : '☆'} 배치`),
          h('span', { class: 'star' + (s.style ? ' on' : '') }, `${s.style ? '★' : '☆'} 꾸미기`),
          h('span', { style: { marginLeft: 'auto' }, class: 'small muted' }, '닮은 정도'),
          h('span', { class: 'sim' }, `${r.similarity}%`)),
        r.notes.length ? h('ul', { class: 'notes' }, ...r.notes.map((n) => h('li', {}, n))) : h('div', { class: 'small', style: { color: 'var(--good)', fontWeight: 800 } }, '🎉 의뢰서와 똑같아요! 아주머니가 기뻐하세요.'));
      if (s.widgets && s.layout && s.style) finish(api, cid, '첫 의뢰를 완벽하게 해냈어요!');
    };
    const box = runBox({
      cid, starter: ORDER1.starter, model: ORDER1.target, rows: 14, xray: false,
      onRun: (p) => paint(p),
      extraBtns: [h('button', { class: 'btn small', title: '목표 화면을 반투명으로 겹쳐 봅니다', onClick: (e) => {
        ghost = !ghost;
        box.deskApi.setTarget(ghost ? goal.model : null);
        e.currentTarget.classList.toggle('primary', ghost);
      } }, '👻 겹쳐 보기')],
    });
    fill(body, h('div', { class: 'lab l36' },
      h('div', { class: 'col tight' },
        story('「분식집에 둘 <b>주문 창</b>을 만들어 주세요. 이렇게요!」', '👵'),
        h('div', { class: 'row', style: { justifyContent: 'center' } }, windowPicture(goal.model, { scale: 1 })),
        h('ul', { class: 'req' },
          h('li', { html: '창 제목은 <b>꿈누리 분식</b>' }),
          h('li', { html: '맨 위 「꿈누리 분식 주문서」 — 주황 바탕 · 흰 글자 · 맑은 고딕 14, <b>두 칸에 걸쳐</b> 꽉' }),
          h('li', { html: '「메뉴」 와 입력 칸, 「수량」 과 <b>좁은</b>(width=5) 입력 칸 — 왼쪽에 붙여' }),
          h('li', { html: '맨 아래 「주문하기」 단추 — 두 칸의 가운데' })),
        hints([
          '표 모양이니 <code>grid</code> 가 편해요. 줄은 0~3, 칸은 0~1 이에요.',
          '두 칸에 걸치려면 <code>columnspan=2</code>, 칸을 꽉 채우려면 <code>sticky=EW</code>(동서로 늘이기), 왼쪽에 붙이려면 <code>sticky=W</code>.',
          '맨 위 라벨: <code>Label(window, text="꿈누리 분식 주문서", bg="orange", fg="white", font=("맑은 고딕", 14)).grid(row=0, column=0, columnspan=2, sticky=EW)</code>',
        ], { cid })),
      h('div', { class: 'right' },
        h('div', { class: 'lab l50', style: { flex: '1' } },
          h('div', { class: 'col tight' }, box.editor),
          h('div', { class: 'col tight' }, box.desk, box.tools)),
        result, box.console)));
    paint(null);
    box.run();
  },
};

/* ════════ 카드 9 — 확인 문제 · 오늘 배운 것 ════════ */
export const wrap1Card = {
  id: 'wrap1', chapter: 's1', title: '✅ 1차시 확인 문제 · 오늘 배운 것',
  render(body, api) {
    const cid = 'wrap1';
    const check = () => {
      const all = QUIZ1.every((q, i) => picked(cid, `q${i}`) === q.answer);
      if (all) finish(api, cid, '1차시를 마쳤어요! 다음 시간에는 단추가 일을 하게 만들어요.');
    };
    // 한 화면에 둘씩 — 풀이가 열려도 무대 밖으로 넘치지 않게 세 쪽으로 나눈다
    const page = card(cid).page || 0;
    const PAGES = [[0, 1], [2, 3], [4, 5]];
    const short = (q) => q.choices.every((c) => c.replace(/<[^>]+>/g, '').length <= 30);
    const solved = (i) => picked(cid, `q${i}`) === QUIZ1[i].answer;
    const tabs = pills(PAGES.map((list, k) => ({
      id: k, label: `문제 ${list[0] + 1}~${list[list.length - 1] + 1}`, done: list.every(solved),
    })), page, (k) => { setCard(cid, { page: k }); api.go(api.index); });
    const quiz = h('div', { class: 'quiz-grid' }, ...PAGES[page].map((i) => choose({
      q: `${i + 1}. ${QUIZ1[i].q}`, choices: QUIZ1[i].choices, answer: QUIZ1[i].answer, why: QUIZ1[i].why, save: [cid, `q${i}`],
      onPick: () => { check(); }, cls: short(QUIZ1[i]) ? 'compact' : '',
    })));
    const notes = card(cid).notes || {};
    const reflect = h('div', { class: 'reflect' },
      h('div', { class: 'mini-title' }, '📝 오늘 배운 것 — 내 말로 한 문장씩 (이 컴퓨터에만 남아요)'),
      ...REFLECT1.map((r, i) => h('div', {},
        h('div', { class: 'q' }, r.q),
        h('textarea', { 'aria-label': r.q, onKeydown: (e) => e.stopPropagation(), onInput: (e) => { notes[i] = e.target.value; setCard(cid, { notes }); } }, notes[i] || ''),
        h('div', { class: 'clue' }, `실마리 낱말: ${r.clue}`))));
    fill(body, h('div', { class: 'lab', style: { gridTemplateColumns: '62% 1fr' } },
      h('div', { class: 'col tight' }, tabs, quiz),
      h('div', { class: 'col tight' }, reflect,
        tip('다음 시간에는 <b>단추를 누르면 일이 일어나게</b> 해요 — 온도 변환기를 다섯 단계로 키워요.', '⏭'),
        h('p', { class: 'start-copy' }, '© 2026 티쳐무 · 모든 권리 보유 · 학교 수업 목적으로만 이용해 주세요'))));
    check();
  },
};
