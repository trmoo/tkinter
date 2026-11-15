/*! 🪟 창문 공방 — © 2026 티쳐무 · 모든 권리 보유
 *  코드 보기 · 코드 고치기(편집기) · 실행 결과 창.
 */
import { koreanOf } from '../data/translate.js';
import { h, esc } from './dom.js';

/* ── 파이썬 색칠 (아주 간단한 것만) ─────────────────────────────── */
// ⚠ \b 는 한글을 낱말 글자로 보지 않으므로 앞뒤에 한글·영문·숫자가 붙어 있지 않을 때만 칠한다.
const W = '[A-Za-z0-9_가-힣]';
const TOKEN = new RegExp(
  `(?<!${W})(?:(try|except|else|finally|raise|as|if|elif|for|while|in|def|class|return|with|pass|and|or|not|True|False|None|import|from|del|lambda|global)`
  + '|(Exception|ValueError|IndexError|TypeError|NameError|TclError|UnboundLocalError|ZeroDivisionError)'
  + '|(print|int|str|float|len|range|repr|input|eval|type)(?=\\()'
  + '|(Tk|Label|Button|Entry|Frame|Canvas|Checkbutton|Radiobutton|Listbox|IntVar|StringVar|DoubleVar|BooleanVar)(?=\\()'
  + '|(mainloop|title|geometry|pack|grid|place|bind|bind_all|config|configure|cget|get|set|insert|delete|create_[a-z]+|move|coords|after|destroy|columnconfigure|curselection|focus_set|invoke)(?=\\()'
  + `|(\\d+))(?!${W})`, 'g');
export function colorLine(line) {
  // 주석·문자열을 먼저 떼어 두고 나머지만 색칠한다
  const parts = [];
  let rest = line, m;
  const re = /(#.*$)|("(?:[^"\\]|\\.)*"|'(?:[^'\\]|\\.)*')/;
  while ((m = re.exec(rest))) {
    parts.push({ t: 'code', s: rest.slice(0, m.index) });
    parts.push({ t: m[1] ? 'com' : 'str', s: m[0] });
    rest = rest.slice(m.index + m[0].length);
  }
  parts.push({ t: 'code', s: rest });
  return parts.map((p) => {
    if (p.t === 'com') return `<span class="tk-com">${esc(p.s)}</span>`;
    // 문자열 안의 \n 을 눈에 띄게 — 이 앱의 주인공이다
    if (p.t === 'str') return `<span class="tk-str">${esc(p.s).replace(/\\n/g, '<b class="tk-nl">\\n</b>')}</span>`;
    // 빈칸 ___ 은 노란 칸으로
    let out = '', last = 0, t;
    const s = p.s;
    TOKEN.lastIndex = 0;
    while ((t = TOKEN.exec(s))) {
      const c = t[1] ? 'tk-kw' : t[2] ? 'tk-exc' : t[3] ? 'tk-fn' : t[4] ? 'tk-cls' : t[5] ? 'tk-mt' : 'tk-num';
      out += esc(s.slice(last, t.index)) + `<span class="${c}">${esc(t[0])}</span>`;
      last = t.index + t[0].length;
    }
    return (out + esc(s.slice(last))).replace(/_{3,}/g, (b) => `<span class="tk-blank">${b}</span>`);
  }).join('');
}

/**
 * 읽기 전용 코드 보기.
 *   marks  { 줄번호: 'on' | 'crash' | 'dim' | 'tail' }  — 줄 색
 *   badges { 줄번호: '글자' }                            — 줄 끝에 붙는 이름표
 *   start  첫 줄 번호 (게임이 붙이는 꼬리 코드는 학생 코드 다음 번호부터)
 */
export function codeView(code, { marks = {}, badges = {}, start = 1, cls = '' } = {}) {
  const lines = code.replace(/\n$/, '').split('\n');
  return h('pre', { class: `code ${cls}` },
    ...lines.map((l, i) => {
      const n = start + i;
      return h('div', { class: `ln ${marks[n] || ''}`, 'data-ln': n },
        h('span', { class: 'gut' }, String(n)),
        h('span', { class: 'src', html: colorLine(l) || ' ' }),
        badges[n] ? h('span', { class: 'ln-badge' }, badges[n]) : null);
    }));
}

/* ── 실행 결과 창 ──────────────────────────────────────────────
 * 화면 출력은 빈 줄까지 그대로(readline 뒤의 빈 줄이 수업 내용이다).
 * 오류가 나면 Traceback 아래에 한국어 풀이와 고칠 실마리를 말풍선으로 붙인다. */
export function consoleView(r, { title = '실행 결과', empty = '(화면에 찍힌 것이 없어요)' } = {}) {
  const box = h('div', { class: 'console' }, h('div', { class: 'console-title' }, `▶ ${title}`));
  const pre = h('pre', {});
  if (!r) { pre.appendChild(h('div', { class: 'c-dim' }, '아직 실행하지 않았어요.')); box.appendChild(pre); return box; }
  const out = r.stdout || '';
  if (out !== '') for (const l of out.split('\n')) pre.appendChild(h('div', { class: 'c-out' }, l === '' ? h('span', { class: 'c-blank' }, '(빈 줄)') : l));
  else if (r.ok) pre.appendChild(h('div', { class: 'c-dim' }, empty));
  if (!r.ok && r.stderr) {
    const lines = r.stderr.split('\n');
    lines.forEach((l, i) => {
      const last = i === lines.length - 1;
      pre.appendChild(h('div', { class: last ? 'c-err' : 'c-tb' }, l || ' '));
    });
    const ko = koreanOf(lines[lines.length - 1]);
    if (ko) pre.appendChild(h('div', { class: 'c-ko' }, `💬 ${ko}`));
    else if (r.errorHint) pre.appendChild(h('div', { class: 'c-ko' }, `💬 ${r.errorHint}`));
  }
  box.appendChild(pre);
  return box;
}

/* ── 코드 고치기 (textarea + 줄 번호) ─────────────────────────────
 *   tail  편집기 아래에 붙는 「게임이 붙이는 코드」 (읽기 전용, 줄 번호가 이어진다) */
export function codeEditor(initial, { onChange, onRun, tail = '', rows = 8 } = {}) {
  const ta = h('textarea', { class: 'ed-text', spellcheck: 'false', autocapitalize: 'off', autocomplete: 'off', 'aria-label': '파이썬 코드', rows });
  ta.value = initial;
  const gut = h('div', { class: 'ed-gut', 'aria-hidden': 'true' });
  const tailBox = h('div', { class: 'ed-tail' });
  const wrap = h('div', { class: 'editor-wrap' }, h('div', { class: 'editor' }, gut, ta), tail ? tailBox : null);
  let marks = {};
  const count = () => ta.value.replace(/\n$/, '').split('\n').length;
  const paint = () => {
    const n = ta.value.split('\n').length;
    gut.replaceChildren(...Array.from({ length: n }, (_, i) => h('div', { class: marks[i + 1] ? `g ${marks[i + 1]}` : 'g' }, String(i + 1))));
    gut.scrollTop = ta.scrollTop;
    if (tail) tailBox.replaceChildren(codeView(tail, { start: count() + 1, cls: 'tail', marks }));
  };
  ta.addEventListener('scroll', () => { gut.scrollTop = ta.scrollTop; });
  ta.addEventListener('input', () => { marks = {}; paint(); if (onChange) onChange(ta.value); });
  ta.addEventListener('keydown', (e) => {
    const { selectionStart: a, selectionEnd: b, value: v } = ta;
    if (e.key === 'Tab') {
      e.preventDefault();
      const ls = v.lastIndexOf('\n', a - 1) + 1;
      if (e.shiftKey) {
        // 내어쓰기 — 줄 앞의 빈칸을 4칸까지 지운다
        const le = v.indexOf('\n', b); const end = le < 0 ? v.length : le;
        const block = v.slice(ls, end).split('\n').map((l) => l.replace(/^ {1,4}/, '')).join('\n');
        ta.setRangeText(block, ls, end, 'select');
      } else if (a !== b && v.slice(a, b).includes('\n')) {
        const le = v.indexOf('\n', b - 1); const end = le < 0 ? v.length : le;
        const block = v.slice(ls, end).split('\n').map((l) => '    ' + l).join('\n');
        ta.setRangeText(block, ls, end, 'select');
      } else ta.setRangeText('    ', a, b, 'end');
      ta.dispatchEvent(new Event('input'));
    } else if (e.key === 'Enter' && !e.ctrlKey) {
      // 줄을 바꾸면 위 줄의 들여쓰기를 이어 가고, 콜론 뒤면 4칸 더
      e.preventDefault();
      const ls = v.lastIndexOf('\n', a - 1) + 1;
      const cur = v.slice(ls, a);
      let ind = (cur.match(/^ */) || [''])[0];
      if (/:\s*$/.test(cur)) ind += '    ';
      ta.setRangeText('\n' + ind, a, b, 'end');
      ta.dispatchEvent(new Event('input'));
    } else if (e.key === 'Enter' && e.ctrlKey && onRun) {
      e.preventDefault();
      onRun();
    }
  });
  paint();
  return {
    el: wrap,
    get value() { return ta.value; },
    set value(s) { ta.value = s; marks = {}; paint(); },
    /** 줄 번호에 색 표시 — { 3: 'crash' } (꼬리 코드의 줄 번호도 이어서 센다) */
    mark(m) { marks = m || {}; paint(); },
    focus() { ta.focus(); },
  };
}

/** 실행 결과에서 줄 색 — 오류 난 줄은 빨강 */
export function marksOf(r) {
  if (!r || r.ok || !r.errorLine) return {};
  return { [r.errorLine]: 'crash' };
}
