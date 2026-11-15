/*! 🪟 창문 공방 — © 2026 티쳐무 · 모든 권리 보유
 *  2차시 시작 — 카드 「단추를 눌렀을 때」(command 와 괄호 함정 · 실행 순서 띠) · 「입력 칸에서 꺼내기」(get( ) 은 글자) — 교재 5절
 */
import { h, fill } from '../ui/dom.js';
import { timelineView } from '../ui/timeline.js';
import { story, tip, checklist, finish, runBox } from './kit.js';
import { card, setCard } from '../store.js';
import { MISSIONS2 } from '../data/missions2.js';

const flags = (cid) => card(cid).flags || {};
const setFlag = (cid, k) => { if (!flags(cid)[k]) setCard(cid, { flags: { ...flags(cid), [k]: true } }); };

/** 실행 순서 띠 상자 — 프로그램이 바뀌거나 무슨 일이 생기면 다시 그린다 */
export function timelineBox() {
  const slot = h('div', {}, timelineView(null));
  const box = h('div', { class: 'tl-wrap' }, h('div', { class: 'mini-title' }, '🧵 실행 순서 띠 — 프로그램이 한 일을 차례대로'), slot);
  return { el: box, paint: (p) => fill(slot, timelineView(p)) };
}

/* ════════ 단추를 눌렀을 때 ════════ */
export const cmdCard = {
  id: 'cmd', chapter: 's2', title: '🔘 단추를 눌렀을 때 — command',
  render(body, api) {
    const cid = 'cmd';
    const m = MISSIONS2.cmd;
    const tl = timelineBox();
    const checks = h('div');
    const paintChecks = () => {
      const f = flags(cid);
      const items = [
        { ok: f.click || null, label: '단추를 눌러 라벨의 글자를 바꾼다 — 띠에 「📞 process( )」 가 생기는 때를 보세요' },
        { ok: f.early || null, label: '<code>command=process</code> 를 <code>command=process()</code> 로 바꿔 실행해 본다',
          why: f.early ? '창이 뜨자마자 라벨이 벌써 「단추가 눌렸습니다!」 — 단추를 누르기도 전에 함수가 실행됐어요. 그리고 단추를 눌러도 아무 일이 없어요.' : '' },
        { ok: f.fixed || null, label: '괄호를 다시 빼고, 단추를 눌러야 글자가 바뀌게 고친다' },
      ];
      fill(checks, checklist(items, { title: '🔬 실험 세 가지' }));
      if (items.every((x) => x.ok)) finish(api, cid, '「나중에 불러라」 는 괄호 없이!');
    };
    const look = (p) => {
      tl.paint(p);
      const early = p.timeline.some((t) => t.early);
      if (early) setFlag(cid, 'early');
      const clicked = p.calls.some((c) => c.phase === 'loop' && !c.direct);
      if (clicked) setFlag(cid, 'click');
      if (clicked && !early && flags(cid).early) setFlag(cid, 'fixed');
      paintChecks();
    };
    const box = runBox({ cid, starter: m.starter, model: m.model, rows: 13, onRun: look, onEvent: look });
    fill(body, h('div', { class: 'lab' },
      h('div', { class: 'col tight' },
        story('GUI 프로그램은 위에서 아래로 한 번 흐르고 끝나지 않아요. <b>사용자가 무엇을 할 때마다</b> 그에 맞는 함수가 실행돼요(<b>이벤트</b>). 단추에 함수를 이으려면 <code>command=함수이름</code>.', '🔘'),
        box.editor, checks),
      h('div', { class: 'right' }, box.desk, box.tools, tl.el,
        tip('<code>command=process</code> — 괄호 없이 <b>이름만</b>: 「이 함수를 <b>나중에</b> 불러라」. <code>command=process()</code> — 괄호를 붙이면 <b>지금 바로</b> 실행하고, 돌려준 값(<code>None</code>)이 command 에 들어가요.', '⚠️'),
        box.console)));
    paintChecks();
    box.run();
  },
};

/* ════════ 입력 칸에서 꺼내기 ════════ */
export const getCard = {
  id: 'getstr', chapter: 's2', title: '📥 입력 칸에서 꺼내기 — get( ) 은 글자',
  render(body, api) {
    const cid = 'getstr';
    const m = MISSIONS2.getstr;
    const checks = h('div');
    const paintChecks = (auto) => {
      const f = flags(cid);
      if (auto && auto.every((x) => x.ok)) setFlag(cid, 'pass');
      const items = [
        { ok: f.concat || null, label: '그대로 실행해 <code>17</code> 을 넣고 확인 — 「두 배」 가 얼마로 나오나요?',
          why: f.concat ? '「1717」 — 글자 "17" 을 두 번 이어 붙였어요. 문자열 * 2 는 곱하기가 아니라 반복이에요.' : '' },
        { ok: f.pass || (auto ? false : null), label: '코드를 고쳐 <code>17</code> → 「두 배: 34」 (🧪 자동 검사)', why: auto && !auto[0].ok ? auto[0].why : '' },
      ];
      fill(checks, checklist(items),
        h('div', { class: `chk ${f.float ? 'ok' : ''}`, style: { marginTop: '4px' } }, h('span', {}, f.float ? '🌟' : '⭐'),
          h('div', { html: '<b>도전</b> — <code>3.5</code> 를 넣으면? 오류가 나면 <code>int()</code> 대신 무엇을 써야 할까요? (「두 배: 7.0」)' })));
      if (items.every((x) => x.ok)) finish(api, cid, 'get( ) 으로 꺼낸 글자를 숫자로 바꿀 수 있어요!');
    };
    const look = (p) => {
      if (/두 배: 1717/.test(p.stdout)) setFlag(cid, 'concat');
      if (/두 배: 7\.0/.test(p.stdout)) setFlag(cid, 'float');
      paintChecks();
    };
    const box = runBox({
      cid, starter: m.starter, model: m.model, rows: 13, onRun: look, onEvent: look,
      extraBtns: [h('button', { class: 'btn small', onClick: () => paintChecks(m.check(box.ed.value)) }, '🧪 자동 검사')],
    });
    fill(body, h('div', { class: 'lab' },
      h('div', { class: 'col tight' },
        story('입력 칸(<code>Entry</code>)의 값은 <code>get()</code> 으로 꺼내요. 숫자를 넣으면 숫자가 나올까요? 입력 칸에 <code>17</code> 을 넣고 <b>확인</b>을 눌러 아래 콘솔을 보세요.', '📥'),
        box.editor, checks),
      h('div', { class: 'right' }, box.desk, box.tools,
        h('div', { class: 'note-box', html: '<code>get()</code> 은 <code>input()</code> 처럼 <b>언제나 글자(str)</b>를 돌려줘요. 계산하려면 <code>int()</code> · <code>float()</code> 로 바꿔요 — 5장에서 배운 그대로예요.' }),
        h('div', { class: 'out-slot tall' }, box.console))));
    paintChecks();
    box.run();
  },
};
