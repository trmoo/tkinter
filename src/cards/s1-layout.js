/*! 🪟 창문 공방 — © 2026 티쳐무 · 모든 권리 보유
 *  1차시 배치 — 카드 4 pack · 카드 5 grid · 카드 6 place · 카드 7 섞으면? (교재 4절)
 */
import { h, fill } from '../ui/dom.js';
import { windowPicture } from '../ui/window.js';
import { codeView } from '../ui/code.js';
import { story, tip, checklist, finish, runBox, pills, choose, picked } from './kit.js';
import { card, setCard } from '../store.js';
import { MISSIONS, PLACE, PACK_PREDICT as PREDICT } from '../data/missions.js';
import { previewOf } from '../tk/preview.js';

const COLORS = ['#ff9aa2', '#ffd27f', '#b5ead7', '#9ad0ff', '#c7b8ff', '#ffb3e6', '#d4f0a0', '#ffcf99'];
const flagOf = (cid, k) => !!((card(cid).flags || {})[k]);
const setFlag = (cid, k) => setCard(cid, { flags: { ...(card(cid).flags || {}), [k]: true } });

/* ════════ 카드 4 — pack ════════ */
function packCode(blocks) {
  const lines = blocks.map((b, i) => {
    const opt = [`side=${b.side.toUpperCase()}`];
    if (b.fill !== 'none') opt.push(`fill=${b.fill === 'both' ? 'BOTH' : b.fill.toUpperCase()}`);
    if (b.expand) opt.push('expand=True');
    return `Label(window, text="${i + 1}", bg="${COLORS[i % COLORS.length]}", width=4, height=2).pack(${opt.join(', ')})`;
  });
  return `from tkinter import *

window = Tk()
window.title("블록 쌓기")
window.geometry("300x200")

${lines.join('\n') || '# 아래 단추로 블록을 쌓아 보세요'}

window.mainloop()
`;
}

export const packCard = {
  id: 'pack', chapter: 's1', title: '📦 pack — 남은 자리에 차곡차곡',
  render(body, api) {
    const cid = 'pack';
    const blocks = card(cid).blocks || [];
    const checks = h('div');
    const box = runBox({ cid, key: 'code', starter: packCode(blocks), rows: 9, xray: true, onRun: () => paintChecks() });
    const save = () => { setCard(cid, { blocks }); paintBlocks(); box.run(packCode(blocks)); };
    const blockList = h('div', { class: 'blocks' });
    const paintBlocks = () => fill(blockList, ...blocks.map((b, i) => h('div', { class: 'blk' },
      h('span', { class: 'blk-no', style: { background: COLORS[i % COLORS.length] } }, String(i + 1)),
      h('select', { 'aria-label': 'side', onChange: (e) => { b.side = e.target.value; save(); } }, ...['top', 'bottom', 'left', 'right'].map((s) => h('option', { value: s, selected: b.side === s }, `side=${s.toUpperCase()}`))),
      h('select', { 'aria-label': 'fill', onChange: (e) => { b.fill = e.target.value; if (b.fill !== 'none') setFlag(cid, 'fill'); save(); } }, ...['none', 'x', 'y', 'both'].map((s) => h('option', { value: s, selected: b.fill === s }, `fill=${s}`))),
      h('label', { class: 'small' }, h('input', { type: 'checkbox', checked: b.expand, onChange: (e) => { b.expand = e.target.checked; if (b.expand) setFlag(cid, 'fill'); save(); } }), ' expand'),
      h('button', { class: 'btn small', style: { marginLeft: 'auto' }, onClick: () => { blocks.splice(i, 1); save(); } }, '✕'))));
    const add = (side) => h('button', { class: 'btn small', onClick: () => {
      if (blocks.length >= 8) return;
      blocks.push({ side, fill: 'none', expand: false });
      const used = new Set([...(card(cid).sides || []), side]);
      setCard(cid, { sides: [...used] });
      save();
    } }, `＋ ${{ top: '⬆ TOP', bottom: '⬇ BOTTOM', left: '⬅ LEFT', right: '➡ RIGHT' }[side]}`);

    // 예측 — 이 코드는 어떤 창이 될까? (보기 그림은 가짜 tkinter 가 진짜로 그린 것)
    const pics = PREDICT.map((src) => previewOf(src).model);
    const predBox = h('div');
    const paintPred = () => {
      const st = picked(cid, 'pred');
      fill(predBox,
        h('div', { class: 'mini-title' }, '🤔 이 코드의 창은? (차례대로 남은 자리를 잘라 준다는 것을 떠올려요)'),
        codeView(PREDICT[1].split('\n').slice(3, 6).join('\n'), { cls: 'small-code' }),
        h('div', { class: 'pics' }, ...pics.map((mo, i) => h('button', {
          class: 'pic-choice' + (st === undefined ? '' : i === 1 ? ' right' : st === i ? ' wrong' : ''), disabled: st === 1,
          onClick: () => { setCard(cid, { pred: { picks: [...((card(cid).pred || {}).picks || []), i] } }); paintPred(); paintChecks(); },
        }, windowPicture(mo, { scale: 0.62 }), h('span', { class: 'small' }, `보기 ${i + 1}`)))),
        st === undefined ? null : h('div', { class: `choose-why ${st === 1 ? 'right' : 'wrong'}`, html: st === 1
          ? '⭕ A 가 왼쪽 띠를 통째로 가져가요. 남은 자리의 위쪽을 B 가, 그 아래 남은 자리의 왼쪽을 C 가 가져가요.'
          : '❌ pack 은 <b>코드 차례대로</b> 남은 자리를 잘라 줘요. A 가 먼저 왼쪽 띠를 통째로 가져간다는 것에서 출발해 보세요.' }));
    };
    const paintChecks = () => {
      const sides = new Set(card(cid).sides || []);
      const items = [
        { ok: (sides.size === 4) || null, label: `네 방향(TOP · BOTTOM · LEFT · RIGHT)으로 모두 쌓아 보기 (${sides.size}/4)` },
        { ok: (flagOf(cid, 'fill')) || null, label: '<code>fill</code> 이나 <code>expand</code> 를 켜서 블록을 늘려 보기' },
        { ok: (picked(cid, 'pred') === 1) || null, label: '예측 문제 맞히기' },
      ];
      fill(checks, checklist(items));
      if (items.every((x) => x.ok)) finish(api, cid, 'pack 의 「남은 자리」 규칙을 찾았어요!');
    };
    paintBlocks();
    paintPred();
    paintChecks();
    fill(body, h('div', { class: 'lab l46' },
      h('div', { class: 'col tight' },
        story('<code>pack()</code> 은 위젯을 <b>남은 자리</b>의 한쪽 끝에 붙여요. 블록을 하나씩 쌓으며 「남은 자리」 가 어떻게 줄어드는지 보세요.', '🧱'),
        h('div', { class: 'add-row' }, add('top'), add('bottom'), add('left'), add('right'),
          h('button', { class: 'btn small', onClick: () => { blocks.length = 0; save(); } }, '↺ 비우기')),
        blockList, predBox, checks),
      h('div', { class: 'right' }, box.desk, box.tools, box.editor)));
    box.run(packCode(blocks));
  },
};

/* ════════ 카드 5 — grid ════════ */
const ROWS = 4, COLS = 3;
const KIND_KO = { Label: '라벨', Entry: '입력 칸', Button: '단추' };
function gridCode(cells) {
  const lines = cells.map((c) => {
    const span = c.span > 1 ? `, columnspan=${c.span}` : '';
    const make = c.kind === 'Entry' ? `Entry(window${c.span > 1 ? ', width=30' : ''})` : `${c.kind}(window, text="${c.text}")`;
    return `${make}.grid(row=${c.row}, column=${c.col}${span})`;
  });
  return `from tkinter import *

window = Tk()
window.title("칸 레고")

${lines.join('\n') || '# 왼쪽 판의 칸을 눌러 위젯을 놓아 보세요'}

window.mainloop()
`;
}
export const gridCard = {
  id: 'grid', chapter: 's1', title: '🗂 grid — 표처럼 줄과 칸에',
  render(body, api) {
    const cid = 'grid';
    const tab = card(cid).tab || 'lego';
    const maybeFinish = () => { if (flagOf(cid, 'lego3') && flagOf(cid, 'span') && flagOf(cid, 'form')) finish(api, cid, '줄과 칸으로 놓는 법을 익혔어요!'); };
    const head = pills([
      { id: 'lego', label: '🧩 칸 레고', done: flagOf(cid, 'lego3') && flagOf(cid, 'span') },
      { id: 'form', label: '✏️ 빈칸 채우기 (교재 확인 문제 5)', done: flagOf(cid, 'form') },
    ], tab, (id) => { setCard(cid, { tab: id }); api.go(api.index); });

    if (tab === 'lego') {
      const cells = card(cid).cells || [];
      let kind = card(cid).kind || 'Label';
      let sel = null;
      const checks = h('div');
      const box = runBox({ cid, key: 'legoCode', starter: gridCode(cells), rows: 9, xray: true });
      const textIn = h('input', { type: 'text', value: card(cid).text || '이름', 'aria-label': '위젯 글자', style: { width: '7em', font: 'inherit', padding: '2px 6px', borderRadius: '8px', border: '2px solid var(--line)' }, onKeydown: (e) => e.stopPropagation(), onChange: (e) => setCard(cid, { text: e.target.value }) });
      const board = h('div', { class: 'board', style: { gridTemplateColumns: `2.6em repeat(${COLS}, 1fr)` } });
      const kinds = h('div', { class: 'kinds' });
      const paintChecks = () => {
        const items = [
          { ok: cells.length >= 3, label: `위젯을 세 개 이상 놓기 (${cells.length}개)` },
          { ok: cells.some((c) => c.span > 1), label: '「↔ 넓히기」 로 두 칸에 걸쳐 놓기 — <code>columnspan</code>' },
        ];
        if (items[0].ok) setFlag(cid, 'lego3');
        if (items[1].ok) setFlag(cid, 'span');
        fill(checks, checklist(items));
        maybeFinish();
      };
      const owner = (r, c) => cells.find((x) => x.row === r && c >= x.col && c < x.col + x.span);
      const save = () => { setCard(cid, { cells }); paint(); box.run(gridCode(cells)); paintChecks(); };
      const paint = () => {
        fill(kinds, h('span', { class: 'mini-title' }, '놓을 것:'),
          ...['Label', 'Entry', 'Button'].map((k) => h('button', { class: 'pill' + (kind === k ? ' on' : ''), onClick: () => { kind = k; setCard(cid, { kind: k }); paint(); } }, KIND_KO[k])),
          kind === 'Entry' ? null : textIn);
        const items = [h('span', {}), ...Array.from({ length: COLS }, (_, c) => h('span', { class: 'hd' }, `column=${c}`))];
        for (let r = 0; r < ROWS; r++) {
          items.push(h('span', { class: 'hd' }, `row=${r}`));
          for (let c = 0; c < COLS; c++) {
            const o = owner(r, c);
            if (o && o.col !== c) continue;
            items.push(h('button', {
              class: 'cell' + (o ? ' full' : '') + (o && sel === o ? ' sel' : ''), style: o ? { gridColumn: `span ${o.span}` } : {},
              onClick: () => {
                if (o) { sel = sel === o ? null : o; paint(); return; }
                cells.push({ row: r, col: c, span: 1, kind, text: textIn.value || KIND_KO[kind] });
                save();
              },
            }, o ? `${KIND_KO[o.kind]}${o.kind === 'Entry' ? '' : ` 「${o.text}」`}` : '＋'));
          }
        }
        fill(board, ...items);
        if (sel) {
          board.appendChild(h('div', { style: { gridColumn: `1 / span ${COLS + 1}` }, class: 'row' },
            h('button', { class: 'btn small', disabled: sel.col + sel.span >= COLS || owner(sel.row, sel.col + sel.span), onClick: () => { sel.span++; save(); } }, '↔ 넓히기'),
            h('button', { class: 'btn small', disabled: sel.span <= 1, onClick: () => { sel.span--; save(); } }, '↤ 좁히기'),
            h('button', { class: 'btn small', onClick: () => { cells.splice(cells.indexOf(sel), 1); sel = null; save(); } }, '✕ 지우기')));
        }
      };
      paint();
      paintChecks();
      fill(body, head, h('div', { class: 'lab l46' },
        h('div', { class: 'col tight' },
          story('<code>grid(row=줄, column=칸)</code> — 표처럼 놓아요. 줄과 칸은 리스트의 인덱스처럼 <b>0 부터</b> 세요.', '🗂'),
          kinds, board, checks),
        h('div', { class: 'right' }, box.desk, box.tools, box.editor)));
      box.run(gridCode(cells));
      return;
    }
    const m = MISSIONS.gridform;
    const checks = h('div');
    const box = runBox({
      cid, key: 'formCode', starter: m.starter, model: m.model, rows: 13, xray: true,
      onRun: (p) => {
        const items = m.check(p);
        fill(checks, checklist(items));
        if (items.every((x) => x.ok)) { setFlag(cid, 'form'); maybeFinish(); }
      },
    });
    fill(body, head, h('div', { class: 'lab' },
      h('div', { class: 'col tight' },
        story('아래처럼 놓이도록 빈칸 <code>________</code> 을 채우세요.<br><code>이름  [입력 칸]</code><br><code>나이  [입력 칸]</code>', '✏️'),
        box.editor, checks,
        tip('<code>column</code> 을 안 쓰면 0 이에요. 그래서 <code>grid(row=1)</code> 만 써도 첫째 칸에 놓여요.', '💡')),
      h('div', { class: 'right' }, box.desk, box.tools, box.console)));
    box.run();
  },
};

/* ════════ 카드 6 — place ════════ */
export const placeXYCard = {
  id: 'placexy', chapter: 's1', title: '📍 place — 좌표를 정해 놓기',
  render(body, api) {
    const cid = 'placexy';
    const checks = h('div');
    const target = previewOf(PLACE.model).model;
    const box = runBox({
      cid, starter: PLACE.starter, model: PLACE.model, rows: 12, coord: true, tools: ['xray', 'coord'],
      onRun: (p) => {
        const items = PLACE.check(p);
        fill(checks, checklist(items, { title: '🎯 과녁 맞히기' }));
        if (items.every((x) => x.ok)) finish(api, cid, '좌표로 딱 맞게 놓았어요!');
      },
    });
    box.deskApi.setTarget(target);
    fill(body, h('div', { class: 'lab' },
      h('div', { class: 'col tight' },
        story('창 안에 <b>빨간 점선</b>으로 보이는 자리가 과녁이에요. <code>place(x=…, y=…)</code> 의 숫자를 바꿔 「별 · 달 · 해」 를 과녁에 맞혀 보세요. 📐 좌표 보기를 켜고 창 위에 마우스를 올리면 좌표가 보여요.', '🎯'),
        box.editor, checks,
        tip('좌표는 창 안쪽의 <b>왼쪽 위가 (0, 0)</b> 이고, x 는 오른쪽으로 · <b>y 는 아래로</b> 커져요. 수학 시간의 좌표와 위아래가 반대예요.', '📐')),
      h('div', { class: 'right' }, box.desk, box.tools,
        tip('<code>relx=0.5, rely=0.5</code> 는 창 너비·높이의 <b>절반</b> 자리예요. <code>anchor=CENTER</code> 를 함께 쓰면 위젯의 가운데가 그 자리에 와요.', '🧭'),
        box.console)));
    box.run();
  },
};

/* ════════ 카드 7 — 섞으면? ════════ */
export const mixCard = {
  id: 'mix', chapter: 's1', title: '💥 pack 과 grid 를 섞으면?',
  render(body, api) {
    const cid = 'mix';
    const m = MISSIONS.mixfix;
    const checks = h('div');
    const paintChecks = (p) => {
      const fixed = p ? m.check(p).every((x) => x.ok) : flagOf(cid, 'fixed');
      if (fixed) setFlag(cid, 'fixed');
      const items = [
        { ok: (picked(cid, 'guess') !== undefined) || null, label: '실행하기 전에 결과를 예상하기' },
        { ok: (flagOf(cid, 'saw')) || null, label: '▶ 실행해서 무슨 일이 일어나는지 보기' },
        { ok: (flagOf(cid, 'fixed')) || null, label: '<code>Frame</code> 으로 나누어(또는 한 가지 방식으로 통일해) 고치기' },
      ];
      fill(checks, checklist(items));
      if (items.every((x) => x.ok)) finish(api, cid, '배치 방식 섞기의 함정을 피했어요!');
    };
    const box = runBox({
      cid, starter: m.starter, model: m.model, rows: 12, xray: true,
      onRun: (p) => { if (p.error && /cannot use geometry manager/.test(p.error.last)) setFlag(cid, 'saw'); paintChecks(p); },
    });
    const guess = choose({
      q: '이 코드를 실행하면?', reveal: false,
      choices: ['두 라벨 · 입력 칸이 모두 잘 보인다', '창이 그대로 멈춘다(응답 없음)', '오류가 나며 프로그램이 멈춘다'],
      save: [cid, 'guess'], onPick: () => paintChecks(),
    });
    paintChecks();
    fill(body, h('div', { class: 'lab' },
      h('div', { class: 'col tight' },
        story('동아리 홍보 창을 만드는데, 제목은 <code>pack</code> 으로, 이름 칸은 <code>grid</code> 로 놓았어요.', '📣'),
        guess, box.editor, checks),
      h('div', { class: 'right' }, box.desk, box.tools, box.console,
        h('div', { class: 'warn-box', html: '📕 <b>교재와 다른 점</b> — 교재 확인 문제 4번 해설에는 「섞어 쓰면 프로그램이 멈춘다. 오류 메시지도 없다」 고 적혀 있지만, 파이썬 3.12 에서 실제로 실행하면 그 자리에서 <code>TclError</code> 가 나요(같은 교재 9번 문제의 설명이 맞아요).' }),
        tip('<b>한 창(부모) 안에서는 한 가지 방식만.</b> 꼭 섞고 싶으면 <code>Frame</code> 으로 칸막이를 만들고, 틀마다 다른 방식을 써요. 틀 안의 위젯은 <code>Label(form, …)</code> 처럼 틀을 부모로 만들어요.', '🧱'))));
    // ⚠ 여기서는 저절로 실행하지 않는다 — 예상을 먼저 고르게
  },
};
