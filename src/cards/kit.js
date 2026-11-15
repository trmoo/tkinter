/*! 🪟 창문 공방 — © 2026 티쳐무 · 모든 권리 보유
 *  카드들이 함께 쓰는 조각 — 이야기 상자 · 체크리스트 · 고르기 · 힌트 · 실행 상자(편집기 + 가짜 바탕 화면 + 콘솔).
 */
import { h, fill, toast } from '../ui/dom.js';
import { codeEditor, codeView } from '../ui/code.js';
import { createDesktop } from '../ui/window.js';
import { koreanOf } from '../data/translate.js';
import { card, setCard, markDone } from '../store.js';
import { Program } from '../tk/program.js';
import { downloadPy } from '../ui/files.js';

/** 주소에 ?demo 를 붙이면 편집기마다 모범 답이 들어 있다 (선생님 시연용) */
export const DEMO = typeof location !== 'undefined' && /[?&]demo\b/.test(location.search);

/** 이야기 상자 — html 은 우리가 쓴 글만 넣는다(학생 글은 넣지 않는다) */
export function story(html, icon = '📖', cls = '') {
  return h('div', { class: `story ${cls}` }, h('span', { class: 'story-ico' }, icon), h('div', { class: 'story-text', html }));
}
export function tip(html, icon = '💡', cls = '') {
  return h('div', { class: `tip ${cls}` }, h('span', {}, icon), h('div', { html }));
}

/** 체크리스트 — items: [{ ok: true|false|null|'warn', label, why }] */
export function checklist(items, { title = '✅ 해내야 할 것' } = {}) {
  const pass = items.length && items.every((it) => it.ok === true);
  return h('div', { class: 'checks' + (pass ? ' pass' : '') },
    h('div', { class: 'checks-title' }, title, pass ? h('span', { class: 'pass-chip' }, '🎉 통과!') : null),
    ...items.map((it) => h('div', { class: `chk ${it.ok === true ? 'ok' : it.ok === 'warn' ? 'warn' : it.ok === false ? 'no' : ''}` },
      h('span', { class: 'chk-ico' }, it.ok === true ? '✅' : it.ok === 'warn' ? '⚠️' : it.ok === false ? '❌' : '⬜'),
      h('div', {}, h('div', { class: 'chk-label', html: it.label }), it.why ? h('div', { class: 'chk-why', html: it.why }) : null))));
}

/**
 * 고르기 — 예상(정답을 바로 알려 주지 않음) 또는 문제(맞았는지 바로 알려 줌).
 *   save   [카드 id, 열쇠] · reveal  true 면 고르자마자 정답·풀이 · retry 틀리면 다시 고를 수 있나
 */
export function choose({ q, choices, answer = null, why = '', save, reveal = true, retry = true, onPick = () => {}, cls = '', note = true }) {
  const [cid, key] = save;
  const box = h('div', { class: `choose ${cls}` });
  const paint = () => {
    const st = card(cid)[key] || { picks: [] };
    const last = st.picks[st.picks.length - 1];
    const solved = reveal && answer !== null && last === answer;
    const locked = reveal ? (solved || (!retry && last !== undefined)) : last !== undefined;
    fill(box,
      q ? h('div', { class: 'choose-q', html: q }) : null,
      h('div', { class: 'choose-list' }, ...choices.map((c, i) => {
        const tried = st.picks.includes(i);
        let state = '';
        if (reveal && tried) state = i === answer ? 'right' : 'wrong';
        if (!reveal && last === i) state = 'picked';
        if (reveal && locked && i === answer) state = 'right';
        return h('button', { class: `choice ${state}`, disabled: locked || (reveal && tried), onClick: () => {
          setCard(cid, { [key]: { picks: [...st.picks, i] } });
          paint();
          onPick(i, i === answer);
        } }, h('span', { class: 'choice-no' }, String(i + 1)), h('span', { html: c }));
      })),
      reveal && last !== undefined ? h('div', { class: `choose-why ${last === answer ? 'right' : 'wrong'}` },
        last === answer ? '⭕ 맞아요! ' : retry ? '❌ 다시 골라 보세요. ' : '❌ ', last === answer || !retry ? h('span', { html: why }) : null) : null,
      !reveal && note && last !== undefined ? h('div', { class: 'choose-why picked' }, '✍️ 예상을 골랐어요. 이제 직접 확인해 보세요!') : null);
  };
  paint();
  return box;
}
export const picked = (cid, key) => {
  const st = card(cid)[key];
  return st && st.picks.length ? st.picks[st.picks.length - 1] : undefined;
};
export const solvedQ = (cid, key, answer) => picked(cid, key) === answer;

/** 💡 힌트 — 누를 때마다 하나씩 열린다 */
export function hints(list, { cid, key = 'hint' } = {}) {
  const box = h('div', { class: 'hints' });
  const paint = () => {
    const n = (cid && card(cid)[key]) || 0;
    fill(box,
      ...list.slice(0, n).map((t, i) => h('div', { class: 'hint' }, h('b', {}, `힌트 ${i + 1}`), h('span', { html: t }))),
      n < list.length ? h('button', { class: 'btn small hint-btn', onClick: () => { if (cid) setCard(cid, { [key]: n + 1 }); paint(); } }, `💡 힌트 ${n + 1} / ${list.length}`) : null);
  };
  paint();
  return box;
}

/** 카드를 해냈을 때 — 처음 한 번만 축하 */
export function finish(api, cid, msg = '해냈어요!') {
  if (markDone(cid)) {
    toast(`🎉 ${msg}`, 'gold big');
    api.refreshHead();
  }
}

export function pills(items, current, onPick) {
  return h('div', { class: 'pills' }, ...items.map((it) => h('button', {
    class: 'pill' + (it.id === current ? ' on' : '') + (it.done ? ' done' : ''), onClick: () => onPick(it.id),
  }, it.done ? '✔ ' : '', it.label)));
}

/* ════════════════════ 콘솔 — 프로그램의 화면 출력과 오류 ════════════════════ */
export function programConsole(p, { title = '실행 결과 (콘솔)', empty = '(print 로 찍은 것이 없어요)' } = {}) {
  const box = h('div', { class: 'console' }, h('div', { class: 'console-title' }, `▶ ${title}`));
  const pre = h('pre', {});
  if (!p) pre.appendChild(h('div', { class: 'c-dim' }, '아직 실행하지 않았어요.'));
  else {
    if (!p.log.length) pre.appendChild(h('div', { class: 'c-dim' }, p.state === 'loop' ? `${empty} — 창이 떠서 기다리는 중` : empty));
    for (const l of p.log) {
      if (l.t === 'out') { pre.appendChild(h('div', { class: 'c-out' }, l.s === '' ? h('span', { class: 'c-blank' }, '(빈 줄)') : l.s)); continue; }
      const lines = l.s.split('\n');
      lines.forEach((s, i) => {
        const last = i === lines.length - 1;
        pre.appendChild(h('div', { class: s === 'Exception in Tkinter callback' ? 'c-cb' : last ? 'c-err' : 'c-tb' }, s || ' '));
      });
      const ko = koreanOf(lines[lines.length - 1]);
      if (ko) pre.appendChild(h('div', { class: 'c-ko' }, `💬 ${ko}`));
    }
  }
  box.appendChild(pre);
  requestAnimationFrame(() => { pre.scrollTop = pre.scrollHeight; });
  return box;
}

/** 오류가 난 줄 (편집기에 빨갛게) — 프로그램을 멈춘 오류, 없으면 마지막 함수 안 오류 */
export function errorLine(p) {
  if (!p) return null;
  if (p.error) return p.error.line;
  const e = p.cbErrors[p.cbErrors.length - 1];
  return e ? e.line : null;
}

/* ════════════════════ 실행 상자 ════════════════════ */
/**
 * 편집기 + [▶ 실행] + 가짜 바탕 화면 + 콘솔.
 *   cid · key       편집기 내용을 기억할 자리
 *   starter · model 처음 코드 · 모범 답(?demo)
 *   onRun(program)  실행할 때마다 (검사 · 체크리스트를 다시 그릴 때)
 *   onEvent(program) 창에서 무엇을 할 때마다 (단추 누르기 등)
 *   tools           ['xray', 'coord'] — 바탕 화면 아래 도구 단추
 * 돌려주는 것: { editor, desk, console, tools, run, get program }
 */
export function runBox({ cid, key = 'code', starter, model = null, rows = 10, onRun = () => {}, onEvent = () => {}, tools = ['xray'],
  xray = false, runLabel = '▶ 실행', deskHeight = null, emptyText, extraBtns = [], readOnly = false, onXray = () => {}, coord = false }) {
  const saved = card(cid)[key];
  const initial = DEMO && model ? model : (typeof saved === 'string' ? saved : starter);
  const consoleSlot = h('div', { class: 'out-slot' }, programConsole(null));
  const desk = createDesktop({ xray, height: deskHeight, emptyText });
  let program = null;
  let offProg = null;
  const ed = codeEditor(initial, {
    rows,
    onChange: (v) => setCard(cid, { [key]: v }),
    onRun: () => run(),
  });
  if (readOnly) ed.el.querySelector('textarea').readOnly = true;

  const refresh = () => {
    fill(consoleSlot, programConsole(program));
    const ln = errorLine(program);
    ed.mark(ln ? { [ln]: 'crash' } : {});
  };
  function run(src) {
    if (src != null) { ed.value = src; setCard(cid, { [key]: src }); }
    setCard(cid, { [key]: ed.value });
    if (offProg) offProg();
    program = new Program(ed.value);
    offProg = program.on((what) => { if (what !== 'update') { refresh(); onEvent(program, what); } });
    program.start();
    desk.show(program);
    refresh();
    onRun(program);
    return program;
  }
  const xrBtn = h('button', { class: 'tool xr' + (xray ? ' on' : ''), title: '위젯의 테두리와 배치 방식, 놓지 않은 위젯을 보여 줍니다', onClick: () => {
    desk.setXray(!desk.xrayOn); xrBtn.classList.toggle('on', desk.xrayOn);
    onXray(desk.xrayOn, program);
  } }, '🔍 엑스레이');
  desk.coordOn = coord;
  const coordBtn = h('button', { class: 'tool' + (coord ? ' on' : ''), title: '창 위에서 마우스의 좌표를 보여 줍니다', onClick: () => {
    desk.coordOn = !desk.coordOn; coordBtn.classList.toggle('on', desk.coordOn);
  } }, '📐 좌표 보기');
  const zoomSel = h('select', { class: 'tool', 'aria-label': '창 확대', onChange: (e) => desk.setZoom(e.target.value) },
    h('option', { value: 'fit' }, '🔎 맞춤'), h('option', { value: '1' }, '1× 실제 크기'), h('option', { value: '1.5' }, '1.5×'), h('option', { value: '2' }, '2×'));
  const dl = h('button', { class: 'tool', title: '이 코드를 .py 파일로 내려받아 IDLE 에서 F5 로 실행해 보세요', onClick: () => downloadPy(ed.value, `${cid}.py`) }, '⬇ .py');
  const toolBar = h('div', { class: 'desk-tools' },
    tools.includes('xray') ? xrBtn : null, tools.includes('coord') ? coordBtn : null, zoomSel, dl,
    h('span', { class: 'zoom-note' }, '창의 글자는 실제로는 1× 크기예요'));
  const bar = h('div', { class: 'ed-bar' },
    h('button', { class: 'btn primary run', onClick: () => run(), title: 'Ctrl+Enter 로도 실행돼요' }, runLabel),
    ...extraBtns,
    h('button', { class: 'btn small', title: '처음 코드로 되돌리기', onClick: () => { ed.value = starter; setCard(cid, { [key]: starter }); } }, '↺ 처음으로'));
  return {
    editor: h('div', { class: 'ed-block' }, ed.el, bar),
    desk: desk.el, deskApi: desk, console: consoleSlot, tools: toolBar, ed, run,
    get program() { return program; },
  };
}

/** 읽기 전용 코드 상자 */
export const showCode = (code, opts) => codeView(code, opts);
