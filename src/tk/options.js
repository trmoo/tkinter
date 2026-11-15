/*! 🪟 창문 공방 — © 2026 티쳐무 · 모든 권리 보유
 *  위젯 옵션 — 위젯마다 어떤 옵션이 있고 기본값이 무엇인지, 값이 맞는지 검사하는 규칙.
 *
 *  기본값은 진짜 윈도 tkinter(Tk 8.6)에서 cget( ) 으로 꺼낸 값이다 (tools/metrics.py).
 *  ★ 모르는 옵션 · 없는 색 이름 · 크기 자리에 글자 … 는 진짜 tkinter 와 똑같은 TclError 를 낸다.
 *    학생이 가장 자주 만나는 tkinter 오류가 여기서 나온다.
 *  ⚠ node 로 불러다 시험한다. DOM 을 만들지 말 것.
 */
import COLORS from './colordata.json' with { type: 'json' };
import { parseFont, FontError } from './fonts.js';

/** 가짜 Tk 안에서 난 오류 — 파이썬 쪽에서 _tkinter.TclError 가 된다 */
export class TclError extends Error {}

export const RELIEFS = ['flat', 'groove', 'raised', 'ridge', 'solid', 'sunken'];
export const ANCHORS = ['n', 'ne', 'e', 'se', 's', 'sw', 'w', 'nw', 'center'];

/** Tk 의 「must be a, b, or c」 꼴 */
export function mustBe(list) {
  return list.length <= 2 ? list.join(' or ') : `${list.slice(0, -1).join(', ')}, or ${list[list.length - 1]}`;
}

/* ── 색 ──────────────────────────────────────────────────────── */
/** 색 이름·#코드 → '#rrggbb'. 모르면 TclError (진짜 Tk 와 같은 문구) */
export function colorOf(v) {
  const s = String(v);
  if (s === '') return '';
  if (s[0] === '#') {
    const hex = s.slice(1);
    if (/^[0-9a-fA-F]+$/.test(hex) && hex.length % 3 === 0 && hex.length >= 3 && hex.length <= 12) {
      const n = hex.length / 3;
      const part = (i) => {
        const p = hex.slice(i * n, (i + 1) * n);
        // 한 자리 #f80 은 #ff8800, 네 자리 #ffff… 은 앞의 두 자리만
        return (n === 1 ? p + p : p.slice(0, 2)).toLowerCase();
      };
      return `#${part(0)}${part(1)}${part(2)}`;
    }
    throw new TclError(`invalid color name "${s}"`);
  }
  const hit = COLORS[s.toLowerCase()];
  if (hit) return hit;
  throw new TclError(`unknown color name "${s}"`);
}

/* ── 값 검사 ─────────────────────────────────────────────────── */
const toStr = (v) => (v === true ? '1' : v === false ? '0' : String(v));
function pixels(v) {
  if (typeof v === 'number') return Math.round(v);
  const s = String(v).trim();
  const m = /^(-?\d+(?:\.\d+)?)([cimp]?)$/.exec(s);
  if (!m) throw new TclError(`bad screen distance "${s}"`);
  const n = parseFloat(m[1]);
  const mul = { '': 1, c: 96 / 2.54, i: 96, m: 96 / 25.4, p: 96 / 72 }[m[2]];
  return Math.round(n * mul);
}
function integer(v) {
  if (typeof v === 'number' && Number.isInteger(v)) return v;
  const s = String(v).trim();
  if (!/^[-+]?\d+$/.test(s)) throw new TclError(`expected integer but got "${s}"`);
  return parseInt(s, 10);
}
function boolean(v) {
  if (typeof v === 'boolean') return v;
  if (typeof v === 'number') return v !== 0;
  const s = String(v).trim().toLowerCase();
  if (['1', 'true', 'yes', 'on'].includes(s)) return true;
  if (['0', 'false', 'no', 'off'].includes(s)) return false;
  throw new TclError(`expected boolean value but got "${v}"`);
}
/** 정해진 낱말 가운데 하나 — Tk 는 앞부분만 써도 하나로 정해지면 알아듣는다 (relief="su" → sunken).
 *  둘 이상에 걸리면 ambiguous, 하나도 없으면 bad (진짜 Tk 에서 확인한 문구) */
export function prefixOf(kind, list, s, { strict = false } = {}) {
  if (list.includes(s)) return s;
  const hits = strict || s === '' ? [] : list.filter((x) => x.startsWith(s));
  if (hits.length === 1) return hits[0];
  throw new TclError(`${hits.length > 1 ? 'ambiguous' : 'bad'} ${kind} "${s}": must be ${mustBe(list)}`);
}
function oneOf(kind, list, opts) {
  return (v) => prefixOf(kind, list, toStr(v), opts);
}

/** 옵션 종류 → [검사 함수, 기본값 꼴] */
const TYPES = {
  color: (v) => { colorOf(v); return toStr(v); },
  pixels: (v) => pixels(v),
  int: (v) => integer(v),
  bool: (v) => boolean(v),
  relief: oneOf('relief', RELIEFS),
  anchor: oneOf('anchor', ANCHORS, { strict: true }),
  justify: oneOf('justification', ['left', 'right', 'center']),
  state: oneOf('state', ['normal', 'disabled', 'active']),
  estate: oneOf('state', ['disabled', 'normal', 'readonly']),
  selectmode: (v) => toStr(v), // browse · single · multiple · extended — Tk 는 무엇이든 받는다
  font: (v) => {
    try { parseFont(Array.isArray(v) ? v : toStr(v)); } catch (e) { if (e instanceof FontError) throw new TclError(e.message); throw e; }
    return v;
  },
  str: (v) => toStr(v),
  any: (v) => v,
};

/* 공통 옵션 묶음 — [이름, 종류, 기본값] */
const HL = [['highlightbackground', 'color', 'SystemButtonFace'], ['highlightcolor', 'color', 'SystemWindowFrame']];
const LABELISH = (bd, relief, hl, fg = 'SystemButtonText') => [
  ['activebackground', 'color', 'SystemButtonFace'], ['activeforeground', 'color', 'SystemButtonText'],
  ['anchor', 'anchor', 'center'], ['background', 'color', 'SystemButtonFace'], ['bitmap', 'str', ''],
  ['borderwidth', 'pixels', bd], ['compound', 'str', 'none'], ['cursor', 'str', ''],
  ['disabledforeground', 'color', 'SystemDisabledText'], ['font', 'font', 'TkDefaultFont'], ['foreground', 'color', fg],
  ['height', 'int', 0], ...HL, ['highlightthickness', 'pixels', hl], ['image', 'str', ''],
  ['justify', 'justify', 'center'], ['padx', 'pixels', 1], ['pady', 'pixels', 1], ['relief', 'relief', relief],
  ['state', 'state', 'normal'], ['takefocus', 'str', ''], ['text', 'str', ''], ['textvariable', 'any', ''],
  ['underline', 'int', -1], ['width', 'int', 0], ['wraplength', 'pixels', 0],
];

export const SPEC = {
  Tk: [['background', 'color', 'SystemButtonFace'], ['borderwidth', 'pixels', 0], ['class', 'str', 'Tk'], ['cursor', 'str', ''],
    ['height', 'pixels', 0], ...HL, ['highlightthickness', 'pixels', 0], ['menu', 'str', ''], ['padx', 'pixels', 0],
    ['pady', 'pixels', 0], ['relief', 'relief', 'flat'], ['takefocus', 'str', '0'], ['width', 'pixels', 0]],
  Frame: [['background', 'color', 'SystemButtonFace'], ['borderwidth', 'pixels', 0], ['class', 'str', 'Frame'], ['cursor', 'str', ''],
    ['height', 'pixels', 0], ...HL, ['highlightthickness', 'pixels', 0], ['padx', 'pixels', 0], ['pady', 'pixels', 0],
    ['relief', 'relief', 'flat'], ['takefocus', 'str', '0'], ['width', 'pixels', 0]],
  Label: LABELISH(2, 'flat', 0),
  Button: [...LABELISH(2, 'raised', 1), ['command', 'any', ''], ['default', 'str', 'disabled'], ['overrelief', 'str', ''],
    ['repeatdelay', 'int', 0], ['repeatinterval', 'int', 0]],
  Checkbutton: [...LABELISH(2, 'flat', 1, 'SystemWindowText'), ['command', 'any', ''], ['indicatoron', 'bool', true],
    ['offrelief', 'relief', 'raised'], ['offvalue', 'str', '0'], ['onvalue', 'str', '1'], ['overrelief', 'str', ''],
    ['selectcolor', 'color', 'SystemWindow'], ['selectimage', 'str', ''], ['tristateimage', 'str', ''], ['tristatevalue', 'str', ''],
    ['variable', 'any', null]],
  Radiobutton: [...LABELISH(2, 'flat', 1, 'SystemWindowText'), ['command', 'any', ''], ['indicatoron', 'bool', true],
    ['offrelief', 'relief', 'raised'], ['overrelief', 'str', ''], ['selectcolor', 'color', 'SystemWindow'], ['selectimage', 'str', ''],
    ['tristateimage', 'str', ''], ['tristatevalue', 'str', ''], ['value', 'str', null], ['variable', 'any', null]],
  Entry: [['background', 'color', 'SystemWindow'], ['borderwidth', 'pixels', 1], ['cursor', 'str', 'xterm'],
    ['disabledbackground', 'color', 'SystemButtonFace'], ['disabledforeground', 'color', 'SystemDisabledText'],
    ['exportselection', 'bool', true], ['font', 'font', 'TkTextFont'], ['foreground', 'color', 'SystemWindowText'], ...HL,
    ['highlightthickness', 'pixels', 0], ['insertbackground', 'color', 'SystemWindowText'], ['insertwidth', 'pixels', 2],
    ['justify', 'justify', 'left'], ['readonlybackground', 'color', 'SystemButtonFace'], ['relief', 'relief', 'sunken'],
    ['selectbackground', 'color', 'SystemHighlight'], ['selectforeground', 'color', 'SystemHighlightText'], ['show', 'str', ''],
    ['state', 'estate', 'normal'], ['takefocus', 'str', ''], ['textvariable', 'any', ''], ['validate', 'str', 'none'],
    ['validatecommand', 'any', ''], ['width', 'int', 20], ['xscrollcommand', 'any', '']],
  Canvas: [['background', 'color', 'SystemButtonFace'], ['borderwidth', 'pixels', 0], ['closeenough', 'str', '1.0'],
    ['confine', 'bool', true], ['cursor', 'str', ''], ['height', 'pixels', 265], ...HL, ['highlightthickness', 'pixels', 2],
    ['relief', 'relief', 'flat'], ['scrollregion', 'str', ''], ['selectbackground', 'color', 'SystemHighlight'],
    ['state', 'state', 'normal'], ['takefocus', 'str', ''], ['width', 'pixels', 378],
    ['xscrollcommand', 'any', ''], ['yscrollcommand', 'any', '']],
  Listbox: [['activestyle', 'str', 'underline'], ['background', 'color', 'SystemWindow'], ['borderwidth', 'pixels', 1],
    ['cursor', 'str', ''], ['disabledforeground', 'color', 'SystemDisabledText'], ['exportselection', 'bool', true],
    ['font', 'font', 'TkDefaultFont'], ['foreground', 'color', 'SystemButtonText'], ['height', 'int', 10], ...HL,
    ['highlightthickness', 'pixels', 1], ['justify', 'justify', 'left'], ['listvariable', 'any', ''], ['relief', 'relief', 'sunken'],
    ['selectbackground', 'color', 'SystemHighlight'], ['selectforeground', 'color', 'SystemHighlightText'],
    ['selectmode', 'selectmode', 'browse'], ['state', 'state', 'normal'], ['takefocus', 'str', ''], ['width', 'int', 20],
    ['xscrollcommand', 'any', ''], ['yscrollcommand', 'any', '']],
};

/** 줄임 이름 — bg → background · fg → foreground · bd → borderwidth */
export const ALIAS = { bg: 'background', fg: 'foreground', bd: 'borderwidth' };

const SPEC_MAP = Object.fromEntries(Object.entries(SPEC).map(([k, list]) => [k, new Map(list.map(([n, t, d]) => [n, { type: t, def: d }]))]));

/** 위젯 종류의 옵션 이름들 (keys( ) 의 차례) */
export function optionNames(kind) {
  const names = [...SPEC_MAP[kind].keys()];
  const out = [];
  for (const n of names) {
    out.push(n);
    for (const [a, full] of Object.entries(ALIAS)) if (full === n && SPEC_MAP[kind].has(n)) out.push(a);
  }
  return out.sort();
}

/** 옵션 이름 → 진짜 이름 (bg → background). 없는 이름이면 TclError: unknown option "-txt"
 *  ★ 진짜 Tk 는 앞부분만 써도 하나로 정해지면 받아 준다 — backg= 는 background 가 된다.
 *    tex= 는 text · textvariable 둘에 걸려서 「unknown option "-tex"」 다 (진짜 Tk 에서 확인) */
export function canonical(kind, name) {
  const full = ALIAS[name] || name;
  const spec = SPEC_MAP[kind];
  if (spec.has(full)) return full;
  const hits = [...spec.keys()].filter((n) => n.startsWith(name));
  if (hits.length === 1 && name !== '') return hits[0];
  throw new TclError(`unknown option "-${name}"`);
}

export function defaults(kind) {
  const o = {};
  for (const [n, s] of SPEC_MAP[kind]) o[n] = s.def;
  return o;
}

/** 값 검사 — 맞으면 저장할 값을, 틀리면 TclError */
export function check(kind, name, value) {
  const s = SPEC_MAP[kind].get(name);
  return TYPES[s.type](value);
}
export const typeOf = (kind, name) => SPEC_MAP[kind].get(name).type;
