/*! 🪟 창문 공방 — © 2026 티쳐무 · 모든 권리 보유
 *  1차시 위젯 — 카드 2 「만들기와 놓기」(교재 3절) · 카드 3 「옵션 바꾸기」(교재 3절 · 7절)
 */
import { h, fill } from '../ui/dom.js';
import { story, tip, checklist, finish, runBox, pills } from './kit.js';
import { card, setCard } from '../store.js';
import { MISSIONS } from '../data/missions.js';

/* ════════ 카드 2 — 위젯 놓기 ════════ */
export const placeCard = {
  id: 'place3', chapter: 's1', title: '🏷 위젯 놓기 — 만들기 ≠ 놓기',
  render(body, api) {
    const cid = 'place3';
    const m = MISSIONS.place3;
    const checks = h('div');
    let last = null;
    const paintChecks = () => {
      const f = card(cid).flags || {};
      const items = [{ ok: (!!f.xray) || null, label: '🔍 엑스레이를 켜서 <b>대기실</b>에 앉은 위젯을 찾는다' },
        ...m.check(last).map((x) => (last ? x : { ...x, ok: null }))];
      fill(checks, checklist(items));
      if (items.every((x) => x.ok)) finish(api, cid, '만들고 놓기 — 두 단계를 기억해요!');
    };
    const box = runBox({
      cid, starter: m.starter, model: m.model, rows: 13,
      onRun: (p) => { last = p; paintChecks(); },
      onXray: (on, p) => {
        if (on && p && p.state === 'loop' && p.app.widgets.size && [...p.app.widgets.values()].some((w) => w.kind !== 'Tk' && !w.manager)) {
          setCard(cid, { flags: { ...(card(cid).flags || {}), xray: true } });
        }
        paintChecks();
      },
    });
    fill(body, h('div', { class: 'lab' },
      h('div', { class: 'col tight' },
        story('위젯을 셋 <b>만들었는데</b> 창에는 하나만 보여요. 오류도 나지 않았어요! 🔍 <b>엑스레이</b>를 켜 보세요.', '🕵️'),
        h('table', { class: 'mini-table' },
          h('tr', {}, h('th', {}, '위젯'), h('th', {}, '하는 일'), h('th', {}, '만드는 코드')),
          h('tr', {}, h('td', {}, 'Label'), h('td', {}, '글자 보이기'), h('td', {}, h('code', {}, 'Label(window, text="안녕")'))),
          h('tr', {}, h('td', {}, 'Button'), h('td', {}, '누르는 단추'), h('td', {}, h('code', {}, 'Button(window, text="확인")'))),
          h('tr', {}, h('td', {}, 'Entry'), h('td', {}, '한 줄 입력 칸'), h('td', {}, h('code', {}, 'Entry(window)')))),
        box.editor, checks),
      h('div', { class: 'right' }, box.desk, box.tools,
        tip('위젯은 <b>만드는 것</b>(<code>Label(…)</code>)과 화면에 <b>놓는 것</b>(<code>.pack()</code>)이 따로예요. 놓지 않은 위젯은 오류 없이 그냥 안 보여요 — 그래서 찾기 어려운 실수예요.', '📦'),
        box.console)));
    paintChecks();
    box.run();
  },
};

/* ════════ 카드 3 — 옵션 바꾸기 ════════ */
const BG = [['', '기본'], ['yellow', 'yellow 노랑'], ['skyblue', 'skyblue 하늘'], ['pink', 'pink 분홍'], ['lightgreen', 'lightgreen 연두'], ['black', 'black 검정'], ['grean', 'grean (오타!)']];
const FG = [['', '기본'], ['red', 'red'], ['blue', 'blue'], ['white', 'white'], ['green', 'green']];
const RELIEF = ['flat', 'raised', 'sunken', 'solid', 'groove', 'ridge'];

function optionCode(o) {
  const parts = [`text="${o.text.replace(/"/g, '')}"`];
  if (o.bg) parts.push(`bg="${o.bg}"`);
  if (o.fg) parts.push(`fg="${o.fg}"`);
  if (o.size !== 9 || o.bold) parts.push(`font=("맑은 고딕", ${o.size}${o.bold ? ', "bold"' : ''})`);
  if (o.width) parts.push(`width=${o.width}`);
  if (o.relief !== 'flat') parts.push(`relief="${o.relief}"`);
  if (o.bd !== 2) parts.push(`bd=${o.bd}`);
  if (o.padx !== 1) parts.push(`padx=${o.padx}`);
  return `from tkinter import *

window = Tk()
window.title("옵션 실험대")

Label(window, ${parts.join(', ')}).pack()

window.mainloop()
`;
}

export const optionCard = {
  id: 'options', chapter: 's1', title: '🎨 옵션 바꾸기 — 색 · 글꼴 · 크기',
  render(body, api) {
    const cid = 'options';
    const tab = card(cid).tab || 'lab';
    const done = () => {
      const f = card(cid).flags || {};
      return { lab: !!(f.bg && f.font && f.relief && f.colorErr), later: !!f.later };
    };
    const head = () => pills([
      { id: 'lab', label: '🧪 옵션 실험대', done: done().lab },
      { id: 'later', label: '✏️ 만든 뒤에 바꾸기', done: done().later },
    ], tab, (id) => { setCard(cid, { tab: id }); api.go(api.index); });
    const flag = (k) => setCard(cid, { flags: { ...(card(cid).flags || {}), [k]: true } });
    const maybeFinish = () => { const d = done(); if (d.lab && d.later) finish(api, cid, '위젯을 마음대로 꾸밀 수 있어요!'); };

    if (tab === 'lab') {
      const o = { text: '안녕하세요', bg: '', fg: '', size: 9, bold: false, width: 0, relief: 'flat', bd: 2, padx: 1, ...(card(cid).opts || {}) };
      const checks = h('div');
      const paintChecks = () => {
        const f = card(cid).flags || {};
        fill(checks, checklist([
          { ok: (!!f.bg) || null, label: '<code>bg</code> 로 바탕색 바꾸기' },
          { ok: (!!f.font) || null, label: '<code>font</code> 로 글자 크기 바꾸기' },
          { ok: (!!f.relief) || null, label: '<code>relief</code> 와 <code>bd</code> 로 테두리 만들기' },
          { ok: (!!f.colorErr) || null, label: '없는 색 이름(<code>grean</code>)을 넣으면 어떻게 되는지 보기' },
        ], { title: '🔬 실험' }));
        maybeFinish();
      };
      const box = runBox({
        cid, key: 'labCode', starter: optionCode(o), rows: 8,
        onRun: (p) => {
          const lab = [...p.app.widgets.values()].find((w) => w.kind === 'Label');
          if (lab) {
            if (lab.opts.background !== 'SystemButtonFace') flag('bg');
            if (lab.font.size !== 9) flag('font');
            if (lab.opts.relief !== 'flat' && lab.opts.borderwidth > 0) flag('relief');
          }
          if (p.error && /unknown color name/.test(p.error.last)) flag('colorErr');
          paintChecks();
        },
      });
      const apply = () => { setCard(cid, { opts: o }); box.run(optionCode(o)); };
      const sel = (list, key) => h('select', { onChange: (e) => { o[key] = e.target.value; apply(); } },
        ...list.map(([v, t]) => h('option', { value: v, selected: o[key] === v }, t)));
      const range = (key, min, max) => {
        const out = h('output', {}, String(o[key]));
        const take = (e) => { o[key] = Number(e.target.value); out.textContent = String(o[key]); };
        return [h('input', { type: 'range', min, max, value: o[key], onInput: take, onChange: (e) => { take(e); apply(); } }), out];
      };
      const bar = h('div', { class: 'optbar' },
        h('label', {}, h('span', {}, 'text'), h('input', { type: 'text', value: o.text, onChange: (e) => { o.text = e.target.value; apply(); }, onKeydown: (e) => e.stopPropagation() })),
        h('label', {}, h('span', {}, 'bg'), sel(BG, 'bg')),
        h('label', {}, h('span', {}, 'fg'), sel(FG, 'fg')),
        h('label', {}, h('span', {}, 'font 크기'), ...range('size', 9, 30)),
        h('label', {}, h('span', {}, 'bold'), h('input', { type: 'checkbox', checked: o.bold, onChange: (e) => { o.bold = e.target.checked; apply(); } }), h('span', { class: 'small muted' }, '굵게')),
        h('label', {}, h('span', {}, 'width'), ...range('width', 0, 20)),
        h('label', {}, h('span', {}, 'relief'), h('select', { onChange: (e) => { o.relief = e.target.value; apply(); } }, ...RELIEF.map((r) => h('option', { value: r, selected: o.relief === r }, r)))),
        h('label', {}, h('span', {}, 'bd'), ...range('bd', 0, 8)),
        h('label', {}, h('span', {}, 'padx'), ...range('padx', 0, 30)));
      fill(body, head(), h('div', { class: 'lab l46' },
        h('div', { class: 'col tight' }, bar, box.editor, checks),
        h('div', { class: 'right' }, box.desk, box.tools,
          tip('<code>bg</code> 는 background(바탕), <code>fg</code> 는 foreground(글자)의 줄임말이에요. 색은 <code>"yellow"</code> 같은 이름이나 <code>"#FFCC00"</code> 같은 16진수로 줘요. <code>width</code> 는 픽셀이 아니라 <b>글자 몇 개</b> 너비예요.', '🎨'),
          box.console)));
      paintChecks();
      box.run();
      return;
    }

    // ── 만든 뒤에 바꾸기 ──
    const m = MISSIONS.later;
    const checks = h('div');
    const box = runBox({
      cid, key: 'laterCode', starter: m.starter, model: m.model, rows: 11,
      onRun: (p) => {
        const items = m.check(p);
        fill(checks, checklist(items));
        if (items.every((x) => x.ok)) { flag('later'); maybeFinish(); }
      },
    });
    fill(body, head(), h('div', { class: 'lab' },
      h('div', { class: 'col tight' },
        story('라벨을 만든 <b>뒤에</b> 글자를 바꾸고 싶어요. <code>label.text = "바뀐 글자"</code> 라고 썼는데… 실행해 보세요. 오류는 안 나는데 글자가 그대로예요!', '🤔'),
        box.editor, checks,
        h('div', { class: 'note-box', html: '옵션을 바꾸는 두 가지 방법<br><code>label["text"] = "바뀐 글자"</code> — 딕셔너리처럼<br><code>label.config(text="바뀐 글자")</code> — 여러 개를 한꺼번에' })),
      h('div', { class: 'right' }, box.desk, box.tools,
        tip('<code>label.text = …</code> 는 라벨에 <b>파이썬 이름표</b>를 하나 붙일 뿐, 화면의 옵션은 건드리지 않아요. 그래서 오류도 없고 변화도 없어요.', '🏷'),
        box.console)));
    box.run();
  },
};
