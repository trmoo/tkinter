/*! 🪟 창문 공방 — © 2026 티쳐무 · 모든 권리 보유
 *  가짜 Tk — 위젯 나무 · 옵션 · 변수 · 크기 셈 · 배치(pack · grid · place) · 캔버스 · 이벤트 연결.
 *
 *  진짜 tkinter 는 파이썬 → Tcl/Tk 로 명령을 보내 창을 만든다. 이 파일이 그 Tcl/Tk 의 역할을 한다.
 *  파이썬 쪽 이름(Label · pack( ) …)은 pymod.js 가 이 파일의 기능에 이어 붙인다.
 *
 *  크기·자리 셈은 진짜 Tk 의 소스(tkPack.c · tkGrid.c · tkPlace.c)와 같은 순서로 했고,
 *  윈도에서 잰 값(tools/metrics.py)으로 맞춰 보았다. 그래서 위젯의 자리와 크기가 진짜 창과 거의 같다.
 *  (글꼴 · 테두리 모양 같은 「그림」 은 브라우저가 그리므로 똑같지는 않다.)
 *  ⚠ node 로 불러다 시험한다. DOM 을 만들지 말 것.
 */
import { parseFont, measure } from './fonts.js';
import { TclError, mustBe, canonical, defaults, check, typeOf, colorOf } from './options.js';

/** pack · grid 의 옵션 이름 — 앞부분만 써도 하나로 정해지면 받는다(sid= → side). 여럿이면 ambiguous, 없으면 bad */
function optName(name, list, unknownStyle = false) {
  if (list.includes(name)) return name;
  const hits = name === '' ? [] : list.filter((o) => o.startsWith(name));
  if (hits.length === 1) return hits[0];
  if (unknownStyle) throw new TclError(`unknown option "-${name}"`);
  return (() => { throw new TclError(`${hits.length > 1 ? 'ambiguous' : 'bad'} option "-${name}": must be ${mustBe(list.map((o) => `-${o}`))}`); })();
}

export { TclError };

const MIN_W = 120;        // 윈도는 창의 너비를 이보다 좁게 만들지 않는다(제목 줄의 단추 자리) — 진짜 Tk 에서 잰 값
const EMPTY_SIZE = 200;   // 아무것도 놓지 않은 창의 크기 (200×200)

/* ════════════════════════ 위젯 ════════════════════════ */
export class Widget {
  constructor(app, kind, parent, opts = {}) {
    this.app = app;
    this.kind = kind;                 // 'Tk' 'Label' 'Button' …
    this.parent = parent;
    this.children = [];
    this.opts = defaults(kind);
    this.manager = '';                // '' · 'pack' · 'grid' · 'place'
    this.info = null;                 // 배치 옵션
    this.bindings = new Map();        // 이벤트 → [함수…]
    this.geom = { x: 0, y: 0, w: 0, h: 0 }; // 배치가 정한 자리(부모 안에서)
    this.alive = true;
    this.propagate = true;            // pack_propagate( ) · grid_propagate( )
    this.colCfg = new Map();          // grid columnconfigure
    this.rowCfg = new Map();
    this.line = app.line;             // 만든 줄 (엑스레이에서 「몇 번째 줄에서 만들었나」)
    this.order = app.seq++;
    if (parent) {
      // 이름 — 진짜 tkinter 와 같다: !label, !label2, … (부모마다 종류마다 센다)
      const base = kind.toLowerCase();
      if (kind === 'Checkbutton') {
        // 체크 단추만은 이름이 「!checkbutton-1」 처럼 앱 전체에서 센 번호다 — 이름이 곧 기본 변수 이름이라
        // 서로 다른 창의 체크 단추끼리 변수를 함께 쓰지 않게 하려고 (파이썬 3.12 의 tkinter)
        app.checkCount = (app.checkCount || 0) + 1;
        this.name = `!checkbutton-${app.checkCount}`;
      } else {
        const n = (parent.childCount[base] || 0) + 1;
        parent.childCount[base] = n;
        this.name = n === 1 ? `!${base}` : `!${base}${n}`;
      }
      this.path = parent.path === '.' ? `.${this.name}` : `${parent.path}.${this.name}`;
      parent.children.push(this);
    } else {
      this.name = '';
      this.path = '.';
    }
    this.childCount = {};
    // 종류마다 따로 가진 것
    if (kind === 'Entry') { this.text = ''; this.cursor = 0; }
    if (kind === 'Listbox') { this.items = []; this.sel = new Set(); this.active = 0; }
    if (kind === 'Canvas') { this.items = new Map(); this.nextItem = 1; }
    if (kind === 'Radiobutton') this.opts.value = this.name;          // 진짜 Tk: value 를 안 주면 위젯 이름
    if (kind === 'Checkbutton') this.opts.variable = this.name;       // 진짜 Tk: variable 을 안 주면 위젯 이름의 변수
    if (kind === 'Radiobutton') this.opts.variable = 'selectedButton'; // 진짜 Tk: 모든 라디오 단추가 함께 쓰는 변수
    this.configure(opts);
    app.widgets.set(this.path, this);
  }

  get toplevel() { let w = this; while (w.parent) w = w.parent; return w; }

  /** 옵션 바꾸기 — 모르는 옵션 · 틀린 값이면 TclError (아무것도 바꾸지 않고) */
  configure(opts) {
    const staged = [];
    for (const [k, v] of Object.entries(opts)) {
      const name = canonical(this.kind, k);
      let val = v;
      if (['variable', 'textvariable', 'command', 'validatecommand', 'listvariable', 'xscrollcommand', 'yscrollcommand'].includes(name)) val = v;
      else val = check(this.kind, name, v);
      staged.push([name, val]);
    }
    for (const [name, val] of staged) {
      this.opts[name] = val;
      if (name === 'textvariable' && val && typeof val === 'object') {
        // textvariable — 변수와 글자가 함께 간다
        val.watch(this, () => this.app.changed('var', this));
        if (this.kind === 'Entry') { this.text = val.value; this.cursor = this.text.length; }
      }
      if ((name === 'variable') && val && typeof val === 'object') val.watch(this, () => this.app.changed('var', this));
    }
    if (staged.length) this.app.changed('config', this);
  }
  cget(k) {
    const name = canonical(this.kind, k);
    if (name === 'text' && this.opts.textvariable && typeof this.opts.textvariable === 'object') return this.opts.textvariable.value;
    return this.opts[name];
  }

  /** 지금 보이는 글자 (textvariable 이 있으면 그 값) */
  get shownText() {
    const tv = this.opts.textvariable;
    if (tv && typeof tv === 'object') return tv.value;
    return String(this.opts.text ?? '');
  }
  get font() { return parseFont(this.opts.font, this.kind === 'Entry' ? 'TkTextFont' : 'TkDefaultFont'); }

  /* ── 변수 (체크 · 라디오) ── */
  varName() { const v = this.opts.variable; return v && typeof v === 'object' ? v.name : String(v); }
  varValue() { return this.app.getVar(this.varName()); }
  get selected() {
    if (this.kind === 'Checkbutton') return this.varValue() === String(this.opts.onvalue);
    if (this.kind === 'Radiobutton') return this.varValue() === String(this.opts.value);
    return false;
  }

  /* ── 요청 크기 — 이 위젯이 「이만큼 있으면 좋겠다」 고 하는 크기 ── */
  reqSize() {
    const o = this.opts;
    const bd = o.borderwidth || 0, hl = o.highlightthickness || 0;
    switch (this.kind) {
      case 'Label': case 'Button': case 'Checkbutton': case 'Radiobutton': {
        const f = this.font;
        const text = this.shownText;
        const lines = text === '' ? 1 : text.split('\n').length;
        let tw = o.width > 0 ? o.width * f.zero : measure(text, f);
        let th = o.height > 0 ? o.height * f.linespace : lines * f.linespace;
        if (this.kind === 'Label') return { w: tw + 2 * o.padx + 2 * bd + 2 * hl, h: th + 2 * o.pady + 2 * bd + 2 * hl };
        if (this.kind === 'Button') {
          // 윈도 단추는 글꼴이 클수록 바깥 여백도 커진다 (진짜 Tk 에서 잰 값으로 맞춘 식)
          const exW = o.width > 0 ? (f.zero >= 22 ? 12 : 8) : Math.max(8, Math.round(1.55 * f.zero)) - 2;
          const exH = Math.round(0.75 * f.linespace + 1e-9) - 2;
          return { w: tw + 2 * o.padx + exW, h: th + 2 * o.pady + exH };
        }
        // 체크 · 라디오 — 네모(동그라미) 자리가 더해진다
        // 네모 자리 — 기본 글꼴(9pt)에서는 진짜 Tk 와 픽셀까지 같고, 큰 글꼴에서는 1~2픽셀 어림이다
        const exW = Math.round(28 + 0.32 * (f.linespace - 15)), exH = Math.floor(6.5 + 0.25 * f.linespace);
        return { w: tw + exW + 2 * (o.padx - 1), h: th + exH + 2 * (o.pady - 1) };
      }
      case 'Entry': {
        const f = this.font;
        return { w: o.width * f.zero + 2 * bd + 2 * hl + 2, h: f.linespace + 2 * bd + 2 * hl + 2 };
      }
      case 'Listbox': {
        const f = this.font;
        return { w: o.width * f.zero + 2 * bd + 2 * hl, h: o.height * (f.linespace + 1) + 2 * bd + 2 * hl };
      }
      case 'Canvas':
        return { w: o.width + 2 * bd + 2 * hl, h: o.height + 2 * bd + 2 * hl };
      case 'Frame': case 'Tk': {
        const own = { w: Math.max(1, o.width || 0), h: Math.max(1, o.height || 0) };
        const managed = this.slaves();
        if (!this.propagate || !managed.length) return own;
        const inner = this.slaveReq(managed);
        if (!inner) return own;
        const pad = 2 * (bd + hl);
        return { w: inner.w + pad + 2 * (o.padx || 0), h: inner.h + pad + 2 * (o.pady || 0) };
      }
      default: return { w: 1, h: 1 };
    }
  }

  /** 이 위젯 안에 배치된 위젯들 (배치한 차례대로) */
  slaves(kind) {
    return this.app.managedOrder.filter((w) => w.alive && w.master === this && (kind ? w.manager === kind : w.manager !== ''));
  }
  /** 안에 놓인 위젯들이 바라는 크기 — pack · grid 만 창 크기를 정한다(place 는 아니다) */
  slaveReq(list) {
    const packs = list.filter((w) => w.manager === 'pack');
    const grids = list.filter((w) => w.manager === 'grid');
    if (packs.length) return packReq(packs);
    if (grids.length) return gridLayout(this, grids, null).req;
    return null;
  }
}

/* ════════════════════════ 변수 (IntVar · StringVar …) ════════════════════════ */
export class TkVar {
  constructor(app, name, value) {
    this.app = app;
    this.name = name;
    this.watchers = new Map();
    app.vars.set(name, this);
    this.value = String(value);
  }
  set(v) {
    this.value = String(v);
    for (const f of this.watchers.values()) f();
    this.app.changed('var', this);
  }
  watch(who, f) { this.watchers.set(who, f); }
}

/* ════════════════════════ 앱 (Tk 하나) ════════════════════════ */
export class TkApp {
  constructor() {
    this.widgets = new Map();       // 경로 → 위젯
    this.roots = [];                // Tk( ) 로 만든 창들
    this.vars = new Map();          // 변수 이름 → TkVar
    this.varSeq = 0;
    this.seq = 0;
    this.managedOrder = [];         // 배치한 차례 (pack 의 차례가 곧 쌓는 차례)
    this.line = 0;                  // 지금 실행 중인 파이썬 줄 (해석기가 알려 준다)
    this.listeners = new Set();
    this.allBindings = new Map();   // bind_all
    this.focus = null;
    this.timers = [];               // after( )
    this.timerSeq = 0;
    this.history = [];              // 일어난 일 — 엑스레이 · 실행 순서 띠가 쓴다
  }
  on(f) { this.listeners.add(f); return () => this.listeners.delete(f); }
  changed(what, who) { for (const f of this.listeners) f(what, who); }
  note(kind, detail) { if (this.history.length < 2000) this.history.push({ kind, line: this.line, ...detail }); }

  createRoot(opts = {}) {
    const w = new Widget(this, 'Tk', null, {});
    w.title = 'tk';
    w.geometry = null;              // '300x200' 처럼 정한 크기
    w.resizable = [true, true];
    w.protocols = {};
    w.configure(opts);
    this.roots.push(w);
    // 두 번째 Tk( ) — 진짜 Tk 는 이름이 같은 「.」 창이 따로 생긴다. 이 앱은 따로 셈하려고 경로에 번호를 붙인다
    if (this.roots.length > 1) { this.widgets.delete('.'); w.path = '.'; }
    this.note('root', { path: w.path });
    this.changed('root', w);
    return w;
  }
  create(kind, parent, opts) {
    if (!parent.alive) throw new TclError(`can't invoke "${kind.toLowerCase()}" command: application has been destroyed`);
    const w = new Widget(this, kind, parent, opts);
    this.note('create', { path: w.path, kind });
    this.changed('create', w);
    return w;
  }

  /* ── 변수 ── */
  newVar(kind, value) {
    const name = `PY_VAR${this.varSeq++}`;
    const dflt = { IntVar: 0, DoubleVar: 0.0, StringVar: '', BooleanVar: false }[kind];
    return new TkVar(this, name, value === undefined ? (kind === 'BooleanVar' ? '0' : dflt) : value);
  }
  getVar(name) { const v = this.vars.get(name); return v ? v.value : ''; }
  setVar(name, value) {
    let v = this.vars.get(name);
    if (!v) v = new TkVar(this, name, '');
    v.set(value);
  }

  /* ── 배치 ── */
  manage(w, kind, opts) {
    if (!w.alive) throw new TclError(`bad window path name "${w.path}"`);
    if (w.kind === 'Tk') throw new TclError(`can't ${kind} "${w.path}": it's a top-level window`);
    const master = w.parent;
    // ★ 같은 부모 안에서 pack 과 grid 를 섞으면 진짜 Tk 는 그 자리에서 오류를 낸다 (창이 멈추는 것이 아니다)
    if (kind === 'pack' || kind === 'grid') {
      const other = kind === 'pack' ? 'grid' : 'pack';
      if (master.slaves(other).some((s) => s !== w)) {
        throw new TclError(`cannot use geometry manager ${kind} inside ${master.path} which already has slaves managed by ${other}`);
      }
    }
    const info = kind === 'pack' ? packInfo(w, opts) : kind === 'grid' ? gridInfo(w, opts) : placeInfo(w, opts);
    if (w.manager !== kind) {
      this.managedOrder = this.managedOrder.filter((x) => x !== w);
      if (kind !== 'grid' || !w.info || w.manager !== 'grid') this.managedOrder.push(w);
    } else if (kind === 'pack' && !opts.before && !opts.after) {
      // 다시 pack( ) 해도 차례는 그대로다 (진짜 Tk)
    }
    w.manager = kind;
    w.master = master;
    w.info = info;
    this.note('manage', { path: w.path, how: kind });
    this.changed('layout', w);
  }
  forget(w, kind) {
    if (kind && w.manager !== kind) return;
    w.manager = '';
    w.info = null;
    this.managedOrder = this.managedOrder.filter((x) => x !== w);
    this.changed('layout', w);
  }
  destroy(w) {
    if (!w.alive) return;
    for (const c of [...w.children]) this.destroy(c);
    w.alive = false;
    this.managedOrder = this.managedOrder.filter((x) => x !== w);
    if (w.parent) w.parent.children = w.parent.children.filter((c) => c !== w);
    this.widgets.delete(w.path);
    if (this.focus === w) this.focus = null;
    this.note('destroy', { path: w.path });
    this.changed('destroy', w);
  }
  get liveRoots() { return this.roots.filter((r) => r.alive); }

  /* ── 창 하나의 크기와 모든 위젯의 자리 셈 ── */
  layout(root) {
    let size;
    const req = root.reqSize();
    if (root.geometry && root.geometry.w != null) size = { w: root.geometry.w, h: root.geometry.h };
    else if (!root.slaves().some((x) => x.manager !== 'place') && !(root.opts.width > 0 || root.opts.height > 0)) size = { w: EMPTY_SIZE, h: EMPTY_SIZE };   // place 는 창 크기를 정하지 않는다
    else size = { w: Math.max(req.w, MIN_W), h: req.h };
    root.geom = { x: 0, y: 0, w: size.w, h: size.h };
    arrange(root);
    return size;
  }
}

/* ════════════════════════ pack ════════════════════════ */
const SIDES = ['top', 'bottom', 'left', 'right'];
const FILLS = ['none', 'x', 'y', 'both'];
const PACK_OPTS = ['after', 'anchor', 'before', 'expand', 'fill', 'in', 'ipadx', 'ipady', 'padx', 'pady', 'side'];
const GRID_OPTS = ['column', 'columnspan', 'in', 'ipadx', 'ipady', 'padx', 'pady', 'row', 'rowspan', 'sticky'];
const PLACE_OPTS = ['anchor', 'bordermode', 'height', 'in', 'relheight', 'relwidth', 'relx', 'rely', 'width', 'x', 'y'];

/** padx=10 · padx=(5, 15) → [왼쪽, 오른쪽] */
function pad2(v) {
  if (Array.isArray(v)) {
    if (v.length !== 2 && v.length !== 1) throw new TclError(`wrong number of parts to pad specification "${v.join(' ')}"`);
    const a = padNum(v[0]); return [a, v.length === 2 ? padNum(v[1]) : a];
  }
  const n = padNum(v); return [n, n];
}
function padNum(v) {
  const s = String(v).trim();
  if (!/^\d+(\.\d+)?$/.test(s)) throw new TclError(`bad pad value "${s}": must be positive screen distance`);
  return Math.round(parseFloat(s));
}
function ipadNum(v, what) {
  const s = String(v).trim();
  if (!/^\d+(\.\d+)?$/.test(s)) throw new TclError(`bad ${what} value "${s}": must be positive screen distance`);
  return Math.round(parseFloat(s));
}
function boolOpt(v) {
  if (typeof v === 'boolean') return v;
  if (typeof v === 'number') return v !== 0;
  const s = String(v).toLowerCase();
  if (['1', 'true', 'yes', 'on'].includes(s)) return true;
  if (['0', 'false', 'no', 'off'].includes(s)) return false;
  throw new TclError(`expected boolean value but got "${v}"`);
}

function packInfo(w, opts) {
  const old = w.manager === 'pack' && w.info ? w.info : null;
  const i = old ? { ...old } : { side: 'top', fill: 'none', expand: false, anchor: 'center', padx: [0, 0], pady: [0, 0], ipadx: 0, ipady: 0 };
  for (const [k0, v] of Object.entries(opts)) {
    const k = optName(k0, PACK_OPTS);
    if (k === 'side') { const s = String(v); if (!SIDES.includes(s)) throw new TclError(`bad side "${s}": must be ${mustBe(SIDES)}`); i.side = s; }
    else if (k === 'fill') { const s = String(v); if (!FILLS.includes(s)) throw new TclError(`bad fill style "${s}": must be ${mustBe(FILLS)}`); i.fill = s; }
    else if (k === 'expand') i.expand = boolOpt(v);
    else if (k === 'anchor') { const s = String(v); if (!['n', 'ne', 'e', 'se', 's', 'sw', 'w', 'nw', 'center'].includes(s)) throw new TclError(`bad anchor "${s}": must be n, ne, e, se, s, sw, w, nw, or center`); i.anchor = s; }
    else if (k === 'padx') i.padx = pad2(v);
    else if (k === 'pady') i.pady = pad2(v);
    else if (k === 'ipadx') i.ipadx = ipadNum(v, 'ipadx');
    else if (k === 'ipady') i.ipady = ipadNum(v, 'ipady');
  }
  return i;
}

/** pack 이 바라는 바깥 크기 — tkPack.c 의 ComputeFrameGeometry 와 같은 차례 */
function packReq(list) {
  let width = 0, height = 0, maxW = 0, maxH = 0;
  for (const s of list) {
    const r = s.reqSize(), i = s.info;
    const px = i.padx[0] + i.padx[1] + 2 * i.ipadx, py = i.pady[0] + i.pady[1] + 2 * i.ipady;
    if (i.side === 'top' || i.side === 'bottom') {
      maxW = Math.max(maxW, r.w + px + width);
      height += r.h + py;
    } else {
      maxH = Math.max(maxH, r.h + py + height);
      width += r.w + px;
    }
  }
  return { w: Math.max(maxW, width), h: Math.max(maxH, height) };
}

/** 넓히기(expand)로 더 받을 너비 — tkPack.c 의 XExpansion 과 같다 */
function xExpansion(list, k, cavityW) {
  let minExpand = cavityW, num = 0;
  for (let j = k; j < list.length; j++) {
    const s = list[j], i = s.info;
    const cw = s.reqSize().w + i.padx[0] + i.padx[1] + 2 * i.ipadx;
    if (i.side === 'top' || i.side === 'bottom') {
      if (num) { const cur = Math.trunc((cavityW - cw) / num); if (cur < minExpand) minExpand = cur; }
    } else {
      cavityW -= cw;
      if (i.expand) num++;
    }
  }
  if (num) { const cur = Math.trunc(cavityW / num); if (cur < minExpand) minExpand = cur; }
  return minExpand < 0 ? 0 : minExpand;
}
function yExpansion(list, k, cavityH) {
  let minExpand = cavityH, num = 0;
  for (let j = k; j < list.length; j++) {
    const s = list[j], i = s.info;
    const ch = s.reqSize().h + i.pady[0] + i.pady[1] + 2 * i.ipady;
    if (i.side === 'left' || i.side === 'right') {
      if (num) { const cur = Math.trunc((cavityH - ch) / num); if (cur < minExpand) minExpand = cur; }
    } else {
      cavityH -= ch;
      if (i.expand) num++;
    }
  }
  if (num) { const cur = Math.trunc(cavityH / num); if (cur < minExpand) minExpand = cur; }
  return minExpand < 0 ? 0 : minExpand;
}

/** 빈 공간(cavity) 을 위·아래·왼쪽·오른쪽에서 잘라 주며 놓는다 — tkPack.c 의 ArrangePacking */
function packArrange(master, list, inner) {
  let cx = inner.x, cy = inner.y, cw = inner.w, ch = inner.h;
  list.forEach((s, k) => {
    const i = s.info, r = s.reqSize();
    const padX = i.padx[0] + i.padx[1], padY = i.pady[0] + i.pady[1];
    let fx, fy, fw, fh;
    if (i.side === 'top' || i.side === 'bottom') {
      fw = cw;
      fh = r.h + padY + 2 * i.ipady;
      if (i.expand) fh += yExpansion(list, k, ch);
      ch -= fh;
      if (ch < 0) { fh += ch; ch = 0; }
      fx = cx;
      if (i.side === 'top') { fy = cy; cy += fh; } else fy = cy + ch;
    } else {
      fh = ch;
      fw = r.w + padX + 2 * i.ipadx;
      if (i.expand) fw += xExpansion(list, k, cw);
      cw -= fw;
      if (cw < 0) { fw += cw; cw = 0; }
      fy = cy;
      if (i.side === 'left') { fx = cx; cx += fw; } else fx = cx + cw;
    }
    // 받은 칸(frame) 안에서 위젯의 크기와 자리
    let w = r.w + 2 * i.ipadx, h = r.h + 2 * i.ipady;
    if (i.fill === 'x' || i.fill === 'both' || w > fw - padX) w = fw - padX;
    if (i.fill === 'y' || i.fill === 'both' || h > fh - padY) h = fh - padY;
    const a = i.anchor;
    let x, y;
    const ex = fw - padX - w, ey = fh - padY - h;
    x = fx + i.padx[0] + (a.includes('w') ? 0 : a.includes('e') ? ex : Math.trunc(ex / 2));
    y = fy + i.pady[0] + (a.includes('n') ? 0 : a.includes('s') ? ey : Math.trunc(ey / 2));
    if (a === 'center') { x = fx + i.padx[0] + Math.trunc(ex / 2); y = fy + i.pady[0] + Math.trunc(ey / 2); }
    s.geom = { x, y, w: Math.max(0, w), h: Math.max(0, h) };
    s.shown = w > 0 && h > 0;
  });
}

/* ════════════════════════ grid ════════════════════════ */
function gridInfo(w, opts) {
  const old = w.manager === 'grid' && w.info ? w.info : null;
  const sameMaster = w.parent;
  const i = old ? { ...old } : { row: null, column: null, rowspan: 1, columnspan: 1, sticky: '', padx: [0, 0], pady: [0, 0], ipadx: 0, ipady: 0 };
  for (const [k0, v] of Object.entries(opts)) {
    const k = optName(k0, GRID_OPTS);
    if (k === 'row' || k === 'column') {
      const s = String(v).trim();
      if (!/^\d+$/.test(s)) throw new TclError(`bad ${k} value "${s}": must be a non-negative integer`);
      i[k] = parseInt(s, 10);
    } else if (k === 'rowspan' || k === 'columnspan') {
      const s = String(v).trim();
      if (!/^\d+$/.test(s) || parseInt(s, 10) < 1) throw new TclError(`bad ${k} value "${s}": must be a positive integer`);
      i[k] = parseInt(s, 10);
    } else if (k === 'sticky') {
      const s = String(v).replace(/[\s,]/g, '').toLowerCase();
      if (!/^[nsew]*$/.test(s)) throw new TclError(`bad stickyness value "${v}": must be a string containing n, e, s, and/or w`);
      i.sticky = s;
    } else if (k === 'padx') i.padx = pad2(v);
    else if (k === 'pady') i.pady = pad2(v);
    else if (k === 'ipadx') i.ipadx = ipadNum(v, 'ipadx');
    else if (k === 'ipady') i.ipady = ipadNum(v, 'ipady');
  }
  // 줄·칸을 안 적으면 — column 은 0, row 는 「지금까지 쓴 마지막 줄 다음」 (진짜 Tk)
  if (i.column == null) i.column = 0;
  if (i.row == null) {
    const used = sameMaster.slaves('grid').filter((s) => s !== w).map((s) => s.info.row + s.info.rowspan);
    i.row = used.length ? Math.max(...used) : 0;
  }
  return i;
}

/** grid 셈 — 칸마다 너비, 줄마다 높이. size 를 주면 그 크기에 맞춰 남는 자리를 weight 대로 나눈다 */
function gridLayout(master, list, size) {
  const nCol = Math.max(0, ...list.map((s) => s.info.column + s.info.columnspan));
  const nRow = Math.max(0, ...list.map((s) => s.info.row + s.info.rowspan));
  const colW = Array(nCol).fill(0), rowH = Array(nRow).fill(0);
  const weightC = Array.from({ length: nCol }, (_, c) => (master.colCfg.get(c) || {}).weight || 0);
  const weightR = Array.from({ length: nRow }, (_, r) => (master.rowCfg.get(r) || {}).weight || 0);
  const minC = Array.from({ length: nCol }, (_, c) => (master.colCfg.get(c) || {}).minsize || 0);
  const minR = Array.from({ length: nRow }, (_, r) => (master.rowCfg.get(r) || {}).minsize || 0);
  for (let c = 0; c < nCol; c++) colW[c] = minC[c];
  for (let r = 0; r < nRow; r++) rowH[r] = minR[r];
  const need = (s) => {
    const r = s.reqSize(), i = s.info;
    return { w: r.w + 2 * i.ipadx + i.padx[0] + i.padx[1], h: r.h + 2 * i.ipady + i.pady[0] + i.pady[1] };
  };
  // ① 한 칸짜리부터
  for (const s of list) {
    const n = need(s), i = s.info;
    if (i.columnspan === 1) colW[i.column] = Math.max(colW[i.column], n.w);
    if (i.rowspan === 1) rowH[i.row] = Math.max(rowH[i.row], n.h);
  }
  // ② 여러 칸에 걸친 것 — 모자라는 만큼 weight 가 있는 칸에, 없으면 고르게.
  //    나누어떨어지지 않는 픽셀은 「앞에서부터 누적해 내림」 — 넷에 2픽셀이면 둘째 · 넷째 칸이 1픽셀씩 (진짜 Tk 에서 잰 대로)
  const spread = (sizes, weights, start, span, want) => {
    const have = sizes.slice(start, start + span).reduce((a, b) => a + b, 0);
    const extra = want - have;
    if (extra <= 0) return;
    const idx = Array.from({ length: span }, (_, k) => start + k);
    const wsum = idx.reduce((a, k) => a + weights[k], 0);
    const share = wsum > 0 ? idx.map((k) => weights[k]) : idx.map(() => 1);
    const total = wsum > 0 ? wsum : span;
    let acc = 0, given = 0;
    idx.forEach((k, n) => {
      acc += share[n];
      const upto = Math.floor(extra * acc / total);
      sizes[k] += upto - given;
      given = upto;
    });
  };
  for (const s of list) {
    const n = need(s), i = s.info;
    if (i.columnspan > 1) spread(colW, weightC, i.column, i.columnspan, n.w);
    if (i.rowspan > 1) spread(rowH, weightR, i.row, i.rowspan, n.h);
  }
  const req = { w: colW.reduce((a, b) => a + b, 0), h: rowH.reduce((a, b) => a + b, 0) };
  if (size) {
    // 창이 더 크면 — weight 가 있는 칸·줄이 나눠 갖는다. 없으면 왼쪽 위(nw)에 붙어 있다
    const grow = (sizes, weights, total) => {
      let extra = total - sizes.reduce((a, b) => a + b, 0);
      const wsum = weights.reduce((a, b) => a + b, 0);
      if (extra === 0 || wsum === 0) return;
      let given = 0;
      const last = weights.map((w, k) => (w > 0 ? k : -1)).filter((k) => k >= 0).pop();
      weights.forEach((w, k) => {
        if (!w) return;
        const add = k === last ? extra - given : Math.trunc(extra * w / wsum);
        sizes[k] = Math.max(0, sizes[k] + add); given += add;
      });
    };
    grow(colW, weightC, size.w);
    grow(rowH, weightR, size.h);
  }
  return { colW, rowH, req };
}

function gridArrange(master, list, inner) {
  const { colW, rowH } = gridLayout(master, list, { w: inner.w, h: inner.h });
  const colX = [], rowY = [];
  let acc = inner.x;
  colW.forEach((w, c) => { colX[c] = acc; acc += w; });
  acc = inner.y;
  rowH.forEach((h, r) => { rowY[r] = acc; acc += h; });
  for (const s of list) {
    const i = s.info, r = s.reqSize();
    const cellX = colX[i.column], cellY = rowY[i.row];
    const cellW = colW.slice(i.column, i.column + i.columnspan).reduce((a, b) => a + b, 0);
    const cellH = rowH.slice(i.row, i.row + i.rowspan).reduce((a, b) => a + b, 0);
    const availW = cellW - i.padx[0] - i.padx[1], availH = cellH - i.pady[0] - i.pady[1];
    let w = r.w + 2 * i.ipadx, h = r.h + 2 * i.ipady;
    const st = i.sticky;
    if (st.includes('e') && st.includes('w')) w = availW; else w = Math.min(w, availW);
    if (st.includes('n') && st.includes('s')) h = availH; else h = Math.min(h, availH);
    const x = cellX + i.padx[0] + (st.includes('w') ? 0 : st.includes('e') ? availW - w : Math.trunc((availW - w) / 2));
    const y = cellY + i.pady[0] + (st.includes('n') ? 0 : st.includes('s') ? availH - h : Math.trunc((availH - h) / 2));
    s.geom = { x, y, w: Math.max(0, w), h: Math.max(0, h) };
    s.shown = w > 0 && h > 0;
  }
}

/* ════════════════════════ place ════════════════════════ */
function placeInfo(w, opts) {
  const old = w.manager === 'place' && w.info ? w.info : null;
  const i = old ? { ...old } : { x: 0, y: 0, relx: 0, rely: 0, anchor: 'nw', width: null, height: null, relwidth: null, relheight: null };
  for (const [k0, v] of Object.entries(opts)) {
    const k = optName(k0, PLACE_OPTS, true);
    if (k === 'x' || k === 'y' || k === 'width' || k === 'height') {
      const s = String(v).trim();
      if (!/^-?\d+(\.\d+)?$/.test(s)) throw new TclError(`bad screen distance "${s}"`);
      i[k] = Math.round(parseFloat(s));
    } else if (k.startsWith('rel')) {
      const s = String(v).trim();
      if (!/^-?\d+(\.\d+)?$/.test(s)) throw new TclError(`expected floating-point number but got "${s}"`);
      i[k] = parseFloat(s);
    } else if (k === 'anchor') {
      const s = String(v);
      if (!['n', 'ne', 'e', 'se', 's', 'sw', 'w', 'nw', 'center'].includes(s)) throw new TclError(`bad anchor "${s}": must be n, ne, e, se, s, sw, w, nw, or center`);
      i.anchor = s;
    }
  }
  return i;
}
function placeArrange(master, list, inner) {
  for (const s of list) {
    const i = s.info, r = s.reqSize();
    let w = i.width != null ? i.width : r.w, h = i.height != null ? i.height : r.h;
    if (i.relwidth != null) w = (i.width || 0) + Math.trunc(i.relwidth * master.geom.w);
    if (i.relheight != null) h = (i.height || 0) + Math.trunc(i.relheight * master.geom.h);
    let x = Math.trunc(i.relx * master.geom.w + 0.5) + i.x;
    let y = Math.trunc(i.rely * master.geom.h + 0.5) + i.y;
    const a = i.anchor;   // ⚠ 'center' 안에도 e · n 이 들어 있다 — 글자를 찾지 말고 하나씩 견준다
    if (a === 'center' || a === 'n' || a === 's') x -= Math.trunc(w / 2);
    if (a === 'ne' || a === 'e' || a === 'se') x -= w;
    if (a === 'center' || a === 'e' || a === 'w') y -= Math.trunc(h / 2);
    if (a === 'sw' || a === 's' || a === 'se') y -= h;
    s.geom = { x, y, w, h };
    s.shown = w > 0 && h > 0;
  }
}

/** 위젯 안의 자리를 정한다 — 그리고 그 안의 위젯들로 내려간다 */
function arrange(master) {
  const bd = (master.opts.borderwidth || 0) + (master.opts.highlightthickness || 0);
  const inner = { x: bd + (master.opts.padx || 0), y: bd + (master.opts.pady || 0) };
  inner.w = Math.max(0, master.geom.w - 2 * inner.x);
  inner.h = Math.max(0, master.geom.h - 2 * inner.y);
  const packs = master.slaves('pack'), grids = master.slaves('grid'), places = master.slaves('place');
  if (packs.length) packArrange(master, packs, inner);
  if (grids.length) gridArrange(master, grids, inner);
  if (places.length) placeArrange(master, places, { x: 0, y: 0, w: master.geom.w, h: master.geom.h });
  for (const c of master.children) {
    if (!c.manager) { c.shown = false; continue; }
    if (c.kind === 'Frame') arrange(c);
  }
}

/* ════════════════════════ 캔버스 도형 ════════════════════════ */
const ITEM_OPTS = {
  rectangle: ['activefill', 'dash', 'fill', 'outline', 'state', 'stipple', 'tags', 'width'],
  oval: ['activefill', 'dash', 'fill', 'outline', 'state', 'stipple', 'tags', 'width'],
  arc: ['activefill', 'dash', 'extent', 'fill', 'outline', 'start', 'state', 'style', 'tags', 'width'],
  line: ['activefill', 'arrow', 'arrowshape', 'capstyle', 'dash', 'fill', 'joinstyle', 'smooth', 'state', 'tags', 'width'],
  polygon: ['activefill', 'dash', 'fill', 'joinstyle', 'outline', 'smooth', 'state', 'tags', 'width'],
  text: ['activefill', 'anchor', 'angle', 'fill', 'font', 'justify', 'state', 'tags', 'text', 'width'],
};
const ITEM_DEFAULT = {
  // 기본 색은 윈도의 「글자색」(SystemButtonText = 검정) — 진짜 Tk 에서 itemcget 으로 확인
  rectangle: { fill: '', outline: 'SystemButtonText', width: 1 }, oval: { fill: '', outline: 'SystemButtonText', width: 1 },
  arc: { fill: '', outline: 'SystemButtonText', width: 1, start: 0, extent: 90, style: 'pieslice' },
  line: { fill: 'SystemButtonText', width: 1, arrow: 'none', smooth: false }, polygon: { fill: 'SystemButtonText', outline: '', width: 1, smooth: false },
  text: { fill: 'SystemButtonText', anchor: 'center', text: '', font: 'TkDefaultFont', justify: 'left' },
};
/** 도형마다 필요한 좌표 수 — 틀리면 진짜 Tk 와 같은 오류 */
function checkCoords(type, n) {
  if (type === 'rectangle' || type === 'oval' || type === 'arc') {
    if (n !== 4) throw new TclError(n % 2 ? `wrong # coordinates: expected 0 or 4, got ${n}` : `wrong # coordinates: expected 0 or 4, got ${n}`);
  } else if (type === 'line') {
    if (n % 2) throw new TclError(`wrong # coordinates: expected an even number, got ${n}`);
    if (n < 4) throw new TclError(`wrong # coordinates: expected at least 4, got ${n}`);
  } else if (type === 'polygon') {
    if (n % 2) throw new TclError(`wrong # coordinates: expected an even number, got ${n}`);
    if (n < 6) throw new TclError(`wrong # coordinates: expected at least 6, got ${n}`);
  } else if (type === 'text') {
    if (n !== 2) throw new TclError(`wrong # coordinates: expected 2, got ${n}`);
  }
}
function itemOpt(type, k0, v) {
  const k = optName(k0, ITEM_OPTS[type], true);
  if (k === 'fill' || k === 'outline' || k === 'activefill') { if (v !== '') colorOf(v); return String(v); }
  if (k === 'width') { const s = String(v); if (!/^\d+(\.\d+)?$/.test(s)) throw new TclError(`bad screen distance "${s}"`); return parseFloat(s); }
  if (k === 'start' || k === 'extent') { const s = String(v); if (!/^-?\d+(\.\d+)?$/.test(s)) throw new TclError(`expected floating-point number but got "${s}"`); return parseFloat(s); }
  if (k === 'anchor') { if (!['n', 'ne', 'e', 'se', 's', 'sw', 'w', 'nw', 'center'].includes(String(v))) throw new TclError(`bad anchor position "${v}": must be n, ne, e, se, s, sw, w, nw, or center`); return String(v); }
  if (k === 'style') { if (!['pieslice', 'chord', 'arc'].includes(String(v))) throw new TclError(`bad style "${v}": must be pieslice, chord, or arc`); return String(v); }
  if (k === 'arrow') { if (!['none', 'first', 'last', 'both'].includes(String(v))) throw new TclError(`bad arrow spec "${v}": must be none, first, last, or both`); return String(v); }
  if (k === 'smooth') return !!v && v !== '0' && v !== 'false';
  if (k === 'tags') return Array.isArray(v) ? v.map(String) : String(v).split(/\s+/).filter(Boolean);
  return v;
}

/** 사각형 · 원 · 호는 진짜 Tk 처럼 (작은 x, 작은 y, 큰 x, 큰 y) 로 고쳐 둔다 — create_oval(220, 60, 30, 30) → coords 30 30 220 60 */
function normBox(type, coords) {
  if (!['rectangle', 'oval', 'arc'].includes(type) || coords.length !== 4) return coords.slice();
  const [a, b, c, d] = coords;
  return [Math.min(a, c), Math.min(b, d), Math.max(a, c), Math.max(b, d)];
}
export function canvasCreate(cv, type, coords, opts) {
  checkCoords(type, coords.length);
  const it = { id: cv.nextItem, type, coords: normBox(type, coords), opts: { ...ITEM_DEFAULT[type] }, line: cv.app.line };
  for (const [k, v] of Object.entries(opts)) it.opts[optName(k, ITEM_OPTS[type], true)] = itemOpt(type, k, v);
  cv.nextItem++;
  if (type === 'text') parseFont(it.opts.font);
  cv.items.set(it.id, it);
  cv.app.note('draw', { path: cv.path, id: it.id, type });
  cv.app.changed('canvas', cv);
  return it.id;
}
/** 도형 찾기 — 번호 · 'all' · 태그 */
export function canvasFind(cv, tagOrId) {
  if (tagOrId === 'all') return [...cv.items.values()];
  const n = typeof tagOrId === 'number' ? tagOrId : (/^\d+$/.test(String(tagOrId)) ? parseInt(tagOrId, 10) : null);
  if (n != null) return cv.items.has(n) ? [cv.items.get(n)] : [];
  return [...cv.items.values()].filter((it) => (it.opts.tags || []).includes(String(tagOrId)));
}
export function canvasConfig(cv, it, opts) {
  const staged = Object.entries(opts).map(([k, v]) => [optName(k, ITEM_OPTS[it.type], true), itemOpt(it.type, k, v)]);
  for (const [k, v] of staged) it.opts[k] = v;
  cv.app.changed('canvas', cv);
}
export function canvasCoords(cv, it, coords) {
  checkCoords(it.type, coords.length);
  it.coords = normBox(it.type, coords);
  cv.app.changed('canvas', cv);
}
/** 도형을 감싸는 네모 (bbox) — 선 두께만큼 넓힌다(진짜 Tk 처럼 1픽셀 더) */
export function itemBBox(it) {
  const xs = it.coords.filter((_, i) => i % 2 === 0), ys = it.coords.filter((_, i) => i % 2 === 1);
  let x1 = Math.min(...xs), y1 = Math.min(...ys), x2 = Math.max(...xs), y2 = Math.max(...ys);
  if (it.type === 'text') {
    const f = parseFont(it.opts.font);
    const w = measure(it.opts.text, f), h = String(it.opts.text).split('\n').length * f.linespace;
    const a = it.opts.anchor;
    let x = x1 - (a.includes('w') ? 0 : a.includes('e') ? w : w / 2), y = y1 - (a.includes('n') ? 0 : a.includes('s') ? h : h / 2);
    if (a === 'center') { x = x1 - w / 2; y = y1 - h / 2; }
    return [Math.floor(x), Math.floor(y), Math.ceil(x + w), Math.ceil(y + h)];
  }
  const half = Math.ceil((it.opts.width || 1) / 2);
  return [Math.floor(x1) - half, Math.floor(y1) - half, Math.ceil(x2) + half, Math.ceil(y2) + half];
}

/* ════════════════════════ 이벤트 ════════════════════════ */
const KEYSYMS = new Set(['Return', 'space', 'Left', 'Right', 'Up', 'Down', 'Escape', 'BackSpace', 'Tab', 'Delete', 'Home', 'End',
  'Prior', 'Next', 'Shift_L', 'Shift_R', 'Control_L', 'Control_R', 'Alt_L', 'Alt_R', 'Insert', 'F1', 'F2', 'F3', 'F4', 'F5',
  'F6', 'F7', 'F8', 'F9', 'F10', 'F11', 'F12', 'plus', 'minus', 'equal', 'comma', 'period', 'slash', 'KP_Enter',
  'exclam', 'question', 'asterisk', 'Caps_Lock', 'Num_Lock']);
const TYPES = { Button: 'ButtonPress', ButtonPress: 'ButtonPress', ButtonRelease: 'ButtonRelease', Motion: 'Motion', Key: 'KeyPress',
  KeyPress: 'KeyPress', KeyRelease: 'KeyRelease', Enter: 'Enter', Leave: 'Leave', FocusIn: 'FocusIn', FocusOut: 'FocusOut',
  Configure: 'Configure', Destroy: 'Destroy', MouseWheel: 'MouseWheel' };
const MODS = ['Double', 'Triple', 'Shift', 'Control', 'Alt', 'B1', 'B2', 'B3', 'Button1', 'Button2', 'Button3', 'Lock', 'Any'];

/** '<Button-1>' · '<B1-Motion>' · '<Return>' · 'a' · '<<ListboxSelect>>' → { type, detail, mods } (틀리면 TclError) */
export function parseSequence(seq) {
  const s = String(seq);
  if (/^<<.+>>$/.test(s)) return { type: 'Virtual', detail: s.slice(2, -2), mods: [] };
  if (!s.startsWith('<')) {
    if ([...s].length === 1) return { type: 'KeyPress', detail: s, mods: [] };
    throw new TclError(`bad event type or keysym "${s}"`);
  }
  if (!s.endsWith('>')) throw new TclError(`missing ">" in binding`);
  const parts = s.slice(1, -1).split('-').filter((p) => p !== '');
  const mods = [];
  let type = null, detail = null;
  for (const p of parts) {
    if (!type && MODS.includes(p)) { mods.push(p.replace(/^Button(\d)$/, 'B$1')); continue; }
    if (!type && TYPES[p]) { type = TYPES[p]; continue; }
    if (!type && /^[1-5]$/.test(p)) { type = 'ButtonPress'; detail = p; continue; }
    if (detail === null) {
      if (type === 'ButtonPress' || type === 'ButtonRelease') {
        if (!/^[1-5]$/.test(p)) throw new TclError(`bad event type or keysym "${p}"`);
        detail = p; continue;
      }
      if (!type || type === 'KeyPress' || type === 'KeyRelease') {
        if ([...p].length === 1 || KEYSYMS.has(p)) { type = type || 'KeyPress'; detail = p; continue; }
      }
    }
    throw new TclError(`bad event type or keysym "${p}"`);
  }
  if (!type) throw new TclError(`no event type or button # or keysym`);
  return { type, detail, mods };
}
export const seqKey = (p) => `${p.mods.slice().sort().join('+')}|${p.type}|${p.detail ?? ''}`;

/** 이벤트가 이 연결(binding)에 맞나 · 얼마나 꼭 맞나(점수가 높을수록 구체적) */
export function matchScore(p, ev) {
  if (p.type !== ev.type) return -1;
  if (p.type === 'Virtual') return p.detail === ev.detail ? 1 : -1;
  if (p.detail != null && String(p.detail) !== String(ev.detail)) return -1;
  for (const m of p.mods) {
    if (m === 'Double' ? ev.count < 2 : m === 'Triple' ? ev.count < 3 : !(ev.mods || []).includes(m)) return -1;
  }
  return (p.detail != null ? 10 : 0) + p.mods.length;
}
