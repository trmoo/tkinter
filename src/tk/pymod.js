/*! 🪟 창문 공방 — © 2026 티쳐무 · 모든 권리 보유
 *  파이썬 쪽 tkinter — from tkinter import * 로 들어오는 이름들(Tk · Label · pack( ) …)을
 *  가짜 Tk(app.js)에 이어 붙인다.
 *
 *  ★ 진짜 tkinter 와 같게 하려고 애쓴 것
 *    · str(label) 은 '.!label' · repr 은 <tkinter.Label object .!label>
 *    · 옵션에 None 을 주면 그 옵션은 없는 것과 같다 — 그래서 command=process( ) 는 「명령 없는 단추」 가 된다
 *    · 틀린 옵션 · 색 이름 · pack/grid 섞기는 진짜와 같은 TclError 와 Traceback(tkinter 안쪽 칸까지)
 *    · 없는 메서드를 쓰면 진짜와 같은 「Did you mean」 (진짜 dir( ) 목록을 받아 두었다)
 *    · 창이 화면에 뜨기 전(mainloop · update 전)에 winfo_width( ) 를 물으면 1
 *  ⚠ node 로 불러다 시험한다. DOM 을 만들지 말 것.
 */
import { PY, PyError } from '../lib/pymini.js';
import { TclError, canvasCreate, canvasFind, canvasConfig, canvasCoords, itemBBox, parseSequence, seqKey } from './app.js';
import { optionNames, typeOf, canonical } from './options.js';
import { measure } from './fonts.js';
import TKF from './tkframes.json' with { type: 'json' };

const { INT, FLT, STR, BOOL, NONE, LIST, DICT, TUPLE } = PY;
const KINDS = ['Label', 'Button', 'Entry', 'Frame', 'Canvas', 'Checkbutton', 'Radiobutton', 'Listbox'];

/** 파이썬 값 → 자바스크립트 값 (옵션에 넣을 때) */
function js(v) {
  switch (v.k) {
    case 'str': return v.v;
    case 'int': return typeof v.v === 'bigint' ? Number(v.v) : v.v;
    case 'float': return v.v;
    case 'bool': return v.v;
    case 'none': return null;
    case 'list': case 'tuple': return v.v.map(js);
    case 'nobj': return v.tkvar || v.w || v;
    default: return v;   // 함수 · lambda — 파이썬 값 그대로 (나중에 부른다)
  }
}
const isCallable = (v) => v && ['func', 'bound', 'builtin', 'class'].includes(v.k);
const fnName = (v) => (v.k === 'bound' ? v.name : v.name || 'command');

/** tkinter 안쪽 칸(진짜 파이썬에서 받아 둔 것)을 단 TclError */
function tclErr(msg, site, line) {
  const e = new PyError('_tkinter.TclError', msg, line);
  const f = TKF.frames[site];
  if (f && f.frames.length) e.tb = [{ raw: f.frames.slice() }];
  return e;
}
/** 진짜 파이썬처럼 「몇 개를 받는데 몇 개를 주었다」 */
function arity(qual, args, min, max, names, line) {
  const n = args.length + 1, lo = min + 1, hi = max + 1;
  if (args.length > max) {
    const takes = lo === hi ? `${hi} positional argument${hi === 1 ? '' : 's'}` : `from ${lo} to ${hi} positional arguments`;
    throw new PyError('TypeError', `${qual}() takes ${takes} but ${n} ${n === 1 ? 'was' : 'were'} given`, line);
  }
  if (args.length < min) {
    const miss = names.slice(args.length, min).map((x) => `'${x}'`);
    const text = miss.length <= 2 ? miss.join(' and ') : `${miss.slice(0, -1).join(', ')}, and ${miss[miss.length - 1]}`;
    throw new PyError('TypeError', `${qual}() missing ${miss.length} required positional argument${miss.length > 1 ? 's' : ''}: ${text}`, line);
  }
}
/** kwargs(Map) → 옵션 객체. None 은 빼고(진짜 tkinter 의 _options 와 같다), cnf 딕셔너리도 합친다 */
function optsOf(kw, cnf) {
  const o = {};
  if (cnf && cnf.k === 'dict') for (const [k, v] of cnf.v) if (v.k !== 'none') o[String(k)] = js(v);
  if (kw) for (const [k, v] of kw) if (v.k !== 'none') o[k] = js(v);
  return o;
}

/** Tcl 목록 글자 — 글꼴 튜플 ('맑은 고딕', 20) 의 cget 은 '{맑은 고딕} 20' */
const tclListStr = (a) => a.map((x) => { const s = String(x); return /\s/.test(s) || s === '' ? `{${s}}` : s; }).join(' ');

/**
 * tkinter 모듈 만들기.
 *   host — 실행 세션(program.js)이 준다: app(가짜 Tk) · mainloop( ) · quit( ) · after( ) · callback( ) · dispatch( )
 */
export function makeTkinter(it, host) {
  const app = host.app;
  const wrap = new Map();       // 위젯 → 파이썬 값 (같은 위젯은 늘 같은 값)
  const varWrap = new Map();
  let cmdSeq = 0;
  const cmdName = new Map();    // 함수 → Tcl 이름 ('1835297811264process')
  const nameOfCmd = (f) => {
    if (!cmdName.has(f)) cmdName.set(f, `${1835297811264 + 64 * cmdSeq++}${fnName(f)}`);
    return cmdName.get(f);
  };
  const B = (name, f) => PY.fn(name, f);

  /** TclError 를 파이썬 오류로 — site 는 tkinter 안쪽 칸을 고르는 열쇠 */
  const guard = (site, ln, f) => {
    try { return f(); } catch (e) {
      if (e instanceof TclError) throw tclErr(e.message, site, ln);
      throw e;
    }
  };
  const defaultRoot = () => app.liveRoots[0] || app.roots[0] || null;

  /* ── cget 결과를 파이썬 값으로 ── */
  function optValue(w, name, raw) {
    const t = typeOf(w.kind, name);
    if (raw && typeof raw === 'object' && raw.name && raw.watch) return STR(raw.name);      // 변수
    if (isCallable(raw)) return STR(nameOfCmd(raw));
    if (name === 'font') return STR(Array.isArray(raw) ? tclListStr(raw) : String(raw));
    if (t === 'int' || t === 'pixels') return INT(Number(raw) || 0);
    if (t === 'bool') return INT(raw ? 1 : 0);
    if (raw == null) return STR('');
    return STR(String(raw));
  }

  /* ════════ 위젯 값 ════════ */
  function W(w) {
    if (wrap.has(w)) return wrap.get(w);
    const pyName = w.kind;
    const self = { k: 'nobj', type: pyName, w };
    self.str = () => w.path;
    self.repr = () => `<tkinter.${pyName} object ${w.path}>`;
    self.dir = () => (w.kind === 'Tk' ? TKF.dirs.tkapp : TKF.dirs[w.kind] || []);
    const methods = widgetMethods(w, self);
    self.getAttr = (attr, ln) => {
      if (methods[attr]) return methods[attr];
      if (attr === 'master') return w.parent ? W(w.parent) : NONE;
      if (attr === 'children') return DICT(new Map(w.children.filter((c) => c.alive).map((c) => [c.name, W(c)])));
      if (attr === 'widgetName') return STR(w.kind === 'Tk' ? '' : w.kind.toLowerCase());
      if (attr === '_w') return STR(w.path);
      if (w.kind === 'Tk') {
        // Tk 창에 없는 이름은 진짜 tkinter 가 안쪽의 tkapp 에서 다시 찾는다 — 그래서 문구가 '_tkinter.tkapp' 이다
        const e = new PyError('AttributeError', `'_tkinter.tkapp' object has no attribute '${attr}'`, ln);
        e.tb = [{ raw: TKF.frames.tkattr.frames.slice() }];
        e.wrongName = attr;
        e.candidates = TKF.dirs.tkapp;
        throw e;
      }
      return undefined;
    };
    self.getItem = (key, ln) => guard('getitem', ln, () => {
      const k = String(js(key));
      const real = guardName(w, k);
      return optValue(w, real, w.cget(k));
    });
    self.setItem = (key, value, ln) => guard('setitem', ln, () => {
      if (value.k === 'none') return;
      app.line = ln;
      w.configure({ [String(js(key))]: js(value) });
    });
    wrap.set(w, self);
    return self;
  }
  /** cget 의 이름 검사 — 줄임 이름(bg)·앞부분(backg)도 진짜 이름으로, 모르면 TclError */
  const guardName = (w, k) => canonical(w.kind, k);

  host.wrap = (w) => W(w);   // 이벤트의 event.widget 이 쓴다

  /* ── 위젯마다의 메서드 ── */
  function widgetMethods(w, self) {
    const q = (n) => `${w.kind === 'Tk' ? 'Wm' : w.kind}.${n}`;
    const m = {};
    const def = (names, f) => { for (const n of [].concat(names)) m[n] = B(n, (a, kw, ln) => { app.line = ln; return f(a, kw, ln, n); }); };

    /* 옵션 */
    def(['configure', 'config'], (a, kw, ln) => {
      if (!a.length && !(kw && kw.size)) {
        const d = new Map();
        for (const n of optionNames(w.kind)) {
          try { d.set(n, TUPLE([STR(n), STR(n), STR(n), STR(''), optValue(w, n, w.cget(n))])); } catch (e) { /* 줄임 이름 */ }
        }
        return DICT(d);
      }
      const o = optsOf(kw, a[0]);
      guard('configure', ln, () => (w.kind === 'Tk' ? configureRoot(w, o) : w.configure(o)));
      return NONE;
    });
    def('cget', (a, kw, ln) => {
      arity('Misc.cget', a, 1, 1, ['key'], ln);
      const k = String(js(a[0]));
      return guard('cget', ln, () => optValue(w, guardName(w, k), w.cget(k)));
    });
    def('keys', () => LIST(optionNames(w.kind).map(STR)));

    /* 배치 */
    if (w.kind !== 'Tk') {
      def(['pack', 'pack_configure'], (a, kw, ln) => { guard('pack', ln, () => app.manage(w, 'pack', optsOf(kw, a[0]))); return NONE; });
      def(['grid', 'grid_configure'], (a, kw, ln) => { guard('grid', ln, () => app.manage(w, 'grid', optsOf(kw, a[0]))); return NONE; });
      def(['place', 'place_configure'], (a, kw, ln) => { guard('place', ln, () => app.manage(w, 'place', optsOf(kw, a[0]))); return NONE; });
      def(['pack_forget', 'forget'], () => { app.forget(w, 'pack'); return NONE; });
      def('grid_forget', () => { app.forget(w, 'grid'); return NONE; });
      def('grid_remove', () => { app.forget(w, 'grid'); return NONE; });
      def('place_forget', () => { app.forget(w, 'place'); return NONE; });
      def(['pack_info', 'info'], () => infoDict(w, 'pack'));
      def('grid_info', () => infoDict(w, 'grid'));
      def('place_info', () => infoDict(w, 'place'));
    }
    def(['pack_propagate', 'propagate'], (a) => { if (a.length) { w.propagate = !!js(a[0]); app.changed('layout', w); return NONE; } return BOOL(w.propagate); });
    def('grid_propagate', (a) => { if (a.length) { w.propagate = !!js(a[0]); app.changed('layout', w); return NONE; } return BOOL(w.propagate); });
    def(['columnconfigure', 'grid_columnconfigure'], (a, kw) => { setCfg(w.colCfg, a, kw); return NONE; });
    def(['rowconfigure', 'grid_rowconfigure'], (a, kw) => { setCfg(w.rowCfg, a, kw); return NONE; });
    def(['pack_slaves', 'slaves'], () => LIST(w.slaves('pack').map(W)));
    def('grid_slaves', () => LIST(w.slaves('grid').reverse().map(W)));
    def('place_slaves', () => LIST(w.slaves('place').map(W)));

    /* 이벤트 */
    def('bind', (a, kw, ln) => {
      arity('Misc.bind', a, 0, 3, ['sequence', 'func', 'add'], ln);
      const seq = a[0] ? js(a[0]) : (kw && kw.get('sequence') ? js(kw.get('sequence')) : null);
      const f = a[1] || (kw && kw.get('func'));
      const add = a[2] || (kw && kw.get('add'));
      return guard('bind', ln, () => bindOn(w.bindings, seq, f, add, ln));
    });
    def('unbind', (a) => { const p = parseSequence(js(a[0])); w.bindings.delete(seqKey(p)); return NONE; });
    def('bind_all', (a, kw, ln) => guard('bind_all', ln, () => bindOn(app.allBindings, js(a[0]), a[1] || (kw && kw.get('func')), a[2], ln)));
    def('unbind_all', (a) => { app.allBindings.delete(seqKey(parseSequence(js(a[0])))); return NONE; });
    def('event_generate', (a, kw, ln) => {
      const seq = js(a[0]);
      const p = guard('bind', ln, () => parseSequence(seq));
      const o = optsOf(kw);
      host.dispatch(w, { type: p.type, detail: p.detail ?? (o.keysym || (p.type.startsWith('Button') ? '1' : null)), mods: p.mods, x: o.x ?? 0, y: o.y ?? 0, keysym: o.keysym || p.detail, char: o.keysym && o.keysym.length === 1 ? o.keysym : '', count: 1 }, { sync: true });
      return NONE;
    });
    def(['focus_set', 'focus', 'focus_force'], () => { app.focus = w; app.changed('focus', w); return NONE; });
    def('focus_get', () => (app.focus ? W(app.focus) : NONE));

    /* 시간 */
    def('after', (a, kw, ln) => {
      arity('Misc.after', a, 1, 99, ['ms'], ln);
      const ms = Math.max(0, Number(js(a[0])) || 0);
      if (a.length < 2 || a[1].k === 'none') return NONE;   // after(1000) 만 쓰면 기다리기 — 이 앱에서는 바로 넘어간다
      return STR(host.after(ms, a[1], a.slice(2)));
    });
    def('after_idle', (a) => STR(host.after(0, a[0], a.slice(1))));
    def('after_cancel', (a) => { host.afterCancel(js(a[0])); return NONE; });
    def(['update', 'update_idletasks'], () => { host.update(); return NONE; });

    /* 창 정보 — 화면에 뜨기 전에는 1 (진짜 Tk 와 같다) */
    const mapped = () => host.mapped && w.alive;
    def('winfo_width', () => INT(mapped() ? Math.max(1, (host.geomOf(w) || w.geom).w) : 1));
    def('winfo_height', () => INT(mapped() ? Math.max(1, (host.geomOf(w) || w.geom).h) : 1));
    // 창 · 틀(Frame)의 바라는 크기는 안에 든 위젯을 보고 「한가할 때」 셈한다 — 화면에 뜨기 전에는 아직 처음 값이다
    const own = () => (w.kind === 'Tk' ? { w: 200, h: 200 } : { w: Math.max(1, w.opts.width || 0), h: Math.max(1, w.opts.height || 0) });
    const req = () => ((w.kind === 'Tk' || w.kind === 'Frame') && !host.mapped ? own() : w.reqSize());
    def('winfo_reqwidth', () => INT(req().w));
    def('winfo_reqheight', () => INT(req().h));
    def('winfo_x', () => INT(mapped() ? w.geom.x : 0));
    def('winfo_y', () => INT(mapped() ? w.geom.y : 0));
    def('winfo_children', () => LIST(w.children.filter((c) => c.alive).map(W)));
    def('winfo_class', () => STR(w.kind));
    def('winfo_manager', () => STR(w.manager));
    def('winfo_exists', () => INT(w.alive ? 1 : 0));
    def('winfo_ismapped', () => INT(mapped() && (w.kind === 'Tk' || w.shown) ? 1 : 0));
    def('winfo_toplevel', () => W(w.toplevel));
    def('winfo_name', () => STR(w.kind === 'Tk' ? 'tk' : w.name));
    def(['lift', 'tkraise', 'lower'], () => NONE);
    def('bell', () => NONE);

    def('destroy', () => { host.destroy(w); return NONE; });
    def('mainloop', (a, kw, ln) => host.mainloop(w.toplevel, ln));
    def('quit', () => { host.quit(); return NONE; });

    if (w.kind === 'Tk') rootMethods(w, def, q);
    if (w.kind === 'Entry') entryMethods(w, def);
    if (w.kind === 'Button' || w.kind === 'Checkbutton' || w.kind === 'Radiobutton') {
      def('invoke', () => invoke(w));
      def('flash', () => NONE);
    }
    if (w.kind === 'Checkbutton') {
      def('select', () => { app.setVar(w.varName(), w.opts.onvalue); return NONE; });
      def('deselect', () => { app.setVar(w.varName(), w.opts.offvalue); return NONE; });
      def('toggle', () => { app.setVar(w.varName(), w.selected ? w.opts.offvalue : w.opts.onvalue); return NONE; });
    }
    if (w.kind === 'Radiobutton') {
      def('select', () => { app.setVar(w.varName(), w.opts.value); return NONE; });
      def('deselect', () => { if (w.selected) app.setVar(w.varName(), ''); return NONE; });
    }
    if (w.kind === 'Listbox') listboxMethods(w, def);
    if (w.kind === 'Canvas') canvasMethods(w, def);
    return m;
  }

  function configureRoot(w, o) {
    w.configure(o);
  }
  function setCfg(map, a, kw) {
    const idx = js(a[0]);
    for (const i of [].concat(idx)) {
      const cur = map.get(Number(i)) || {};
      const o = optsOf(kw, a[1]);
      if (o.weight != null) cur.weight = Number(o.weight);
      if (o.minsize != null) cur.minsize = Number(o.minsize);
      map.set(Number(i), cur);
    }
    app.changed('layout', null);
  }
  function infoDict(w, kind) {
    const d = new Map();
    if (w.manager !== kind || !w.info) return DICT(d);
    const i = w.info;
    d.set('in', W(w.master));
    if (kind === 'pack') {
      d.set('anchor', STR(i.anchor)); d.set('expand', INT(i.expand ? 1 : 0)); d.set('fill', STR(i.fill));
      d.set('ipadx', INT(i.ipadx)); d.set('ipady', INT(i.ipady));
      d.set('padx', i.padx[0] === i.padx[1] ? INT(i.padx[0]) : TUPLE(i.padx.map(INT)));
      d.set('pady', i.pady[0] === i.pady[1] ? INT(i.pady[0]) : TUPLE(i.pady.map(INT)));
      d.set('side', STR(i.side));
    } else if (kind === 'grid') {
      for (const k of ['column', 'row', 'columnspan', 'rowspan', 'ipadx', 'ipady']) d.set(k, INT(i[k]));
      d.set('padx', i.padx[0] === i.padx[1] ? INT(i.padx[0]) : TUPLE(i.padx.map(INT)));
      d.set('pady', i.pady[0] === i.pady[1] ? INT(i.pady[0]) : TUPLE(i.pady.map(INT)));
      d.set('sticky', STR(i.sticky));
    } else {
      d.set('x', STR(String(i.x))); d.set('relx', STR(String(i.relx))); d.set('y', STR(String(i.y))); d.set('rely', STR(String(i.rely)));
      d.set('width', STR(i.width == null ? '' : String(i.width))); d.set('height', STR(i.height == null ? '' : String(i.height)));
      d.set('anchor', STR(i.anchor));
    }
    // 진짜 grid_info( ) 의 차례: in, column, row, columnspan, rowspan, ipadx, ipady, padx, pady, sticky
    return DICT(d);
  }

  /** bind — 같은 이벤트에 다시 bind 하면 바꾸고, add='+' 면 덧붙인다. 돌려주는 값은 Tcl 이름 */
  function bindOn(table, seq, f, add, ln) {
    const p = parseSequence(seq);
    const key = seqKey(p);
    if (!f || f.k === 'none') return STR('');
    const list = add && js(add) === '+' && table.has(key) ? table.get(key).fns : [];
    list.push(f);
    table.set(key, { seq: p, fns: list });
    app.note('bind', { seq });
    return STR(nameOfCmd(f));
  }

  function invoke(w) {
    if (w.opts.state === 'disabled') return STR('');
    if (w.kind === 'Checkbutton') app.setVar(w.varName(), w.selected ? w.opts.offvalue : w.opts.onvalue);
    if (w.kind === 'Radiobutton') app.setVar(w.varName(), w.opts.value);
    const cmd = w.opts.command;
    if (isCallable(cmd)) {
      const r = host.callback(cmd, [], { from: w });
      return r === undefined ? STR('') : r;
    }
    return STR('');
  }

  /* ── Tk 창 ── */
  function rootMethods(w, def) {
    def(['title', 'wm_title'], (a, kw, ln) => {
      arity('Wm.wm_title', a, 0, 1, ['string'], ln);
      if (!a.length || a[0].k === 'none') return STR(w.title);
      w.title = it.str(a[0], ln); app.changed('title', w); return STR('');
    });
    def(['geometry', 'wm_geometry'], (a, kw, ln) => {
      if (!a.length || a[0].k === 'none') {
        const s = host.geomOf(w) || app.layout(w);
        return STR(`${s.w}x${s.h}+${w.pos ? w.pos.x : 0}+${w.pos ? w.pos.y : 0}`);
      }
      const s = String(js(a[0]));
      const g = /^(?:=?(\d+)x(\d+))?(?:([+-]-?\d+)([+-]-?\d+))?$/.exec(s);
      if (!g || s === '' || (g[1] == null && g[3] == null)) throw tclErr(`bad geometry specifier "${s}"`, 'geometry', ln);
      if (g[1] != null) w.geometry = { w: parseInt(g[1], 10), h: parseInt(g[2], 10) };
      if (g[3] != null) w.pos = { x: parseInt(g[3], 10), y: parseInt(g[4], 10) };
      app.note('geometry', { value: s });
      app.changed('geometry', w);
      return STR('');
    });
    def(['resizable', 'wm_resizable'], (a) => { if (a.length) w.resizable = [!!js(a[0]), !!js(a[a.length > 1 ? 1 : 0])]; return NONE; });
    def(['minsize', 'maxsize', 'wm_minsize', 'wm_maxsize', 'iconbitmap', 'wm_iconbitmap', 'iconphoto', 'attributes', 'wm_attributes', 'option_add', 'state', 'deiconify', 'iconify'], () => NONE);
    def(['protocol', 'wm_protocol'], (a) => { if (a.length > 1) w.protocols[js(a[0])] = a[1]; return NONE; });
    def('withdraw', () => { w.withdrawn = true; app.changed('root', w); return NONE; });
  }

  /* ── Entry ── */
  function entryIndex(w, v, ln, site) {
    const s = js(v);
    const len = w.text.length;
    if (typeof s === 'number') return Math.max(0, Math.min(len, Math.trunc(s)));
    const t = String(s);
    if (t === 'end') return len;
    if (t === 'insert') return w.cursor;
    if (/^-?\d+$/.test(t)) return Math.max(0, Math.min(len, parseInt(t, 10)));
    throw tclErr(`bad entry index "${t}"`, site, ln);
  }
  function setEntryText(w, text) {
    w.text = text;
    const tv = w.opts.textvariable;
    if (tv && typeof tv === 'object') tv.set(text);
    app.changed('entry', w);
  }
  function entryMethods(w, def) {
    def('get', (a, kw, ln) => { arity('Entry.get', a, 0, 0, [], ln); return STR(w.text); });
    def('insert', (a, kw, ln) => {
      arity('Entry.insert', a, 2, 2, ['index', 'string'], ln);
      if (w.opts.state !== 'normal') return NONE;
      const i = entryIndex(w, a[0], ln, 'entry.insert');
      const s = it.str(a[1], ln);
      setEntryText(w, w.text.slice(0, i) + s + w.text.slice(i));
      if (w.cursor >= i) w.cursor += s.length;
      return NONE;
    });
    def('delete', (a, kw, ln) => {
      arity('Entry.delete', a, 1, 2, ['first', 'last'], ln);
      if (w.opts.state !== 'normal') return NONE;
      const i = entryIndex(w, a[0], ln, 'entry.delete');
      const j = a.length > 1 && a[1].k !== 'none' ? entryIndex(w, a[1], ln, 'entry.delete') : i + 1;
      if (j > i) setEntryText(w, w.text.slice(0, i) + w.text.slice(j));
      w.cursor = Math.min(w.cursor, w.text.length);
      return NONE;
    });
    def('icursor', (a, kw, ln) => { w.cursor = entryIndex(w, a[0], ln, 'entry.insert'); return NONE; });
    def('index', (a, kw, ln) => INT(entryIndex(w, a[0], ln, 'entry.insert')));
    def(['select_range', 'selection_range', 'select_clear', 'selection_clear', 'select_from', 'select_to', 'xview'], () => NONE);
  }

  /* ── Listbox ── */
  function lbIndex(w, v, ln, site, forInsert = false) {
    const s = js(v);
    const n = w.items.length;
    if (typeof s === 'number') return Math.trunc(s);
    const t = String(s);
    if (t === 'end') return forInsert ? n : n - 1;
    if (t === 'active') return w.active;
    if (t === 'anchor') return 0;
    if (/^-?\d+$/.test(t)) return parseInt(t, 10);
    throw tclErr(`bad listbox index "${t}": must be active, anchor, end, @x,y, or a number`, site, ln);
  }
  function listboxMethods(w, def) {
    def('insert', (a, kw, ln) => {
      arity('Listbox.insert', a, 1, 999, ['index'], ln);
      let i = lbIndex(w, a[0], ln, 'listbox.insert', true);
      i = Math.max(0, Math.min(w.items.length, i));
      const add = a.slice(1).map((x) => it.str(x, ln));
      w.items.splice(i, 0, ...add);
      w.sel = new Set([...w.sel].map((k) => (k >= i ? k + add.length : k)));
      app.changed('listbox', w);
      return NONE;
    });
    def('delete', (a, kw, ln) => {
      arity('Listbox.delete', a, 1, 2, ['first', 'last'], ln);
      const i = lbIndex(w, a[0], ln, 'listbox.delete');
      const j = a.length > 1 && a[1].k !== 'none' ? lbIndex(w, a[1], ln, 'listbox.delete') : i;
      if (j >= i && i < w.items.length) {
        const lo = Math.max(0, i), hi = Math.min(w.items.length - 1, j);
        w.items.splice(lo, hi - lo + 1);
        w.sel = new Set([...w.sel].filter((k) => k < lo || k > hi).map((k) => (k > hi ? k - (hi - lo + 1) : k)));
      }
      app.changed('listbox', w);
      return NONE;
    });
    def('get', (a, kw, ln) => {
      arity('Listbox.get', a, 1, 2, ['first', 'last'], ln);
      const i = lbIndex(w, a[0], ln, 'listbox.get');
      if (a.length > 1 && a[1].k !== 'none') {
        const j = lbIndex(w, a[1], ln, 'listbox.get');
        return TUPLE(w.items.slice(Math.max(0, i), j + 1).map(STR));
      }
      return i >= 0 && i < w.items.length ? STR(w.items[i]) : STR('');
    });
    def('curselection', () => TUPLE([...w.sel].sort((x, y) => x - y).map(INT)));
    def('size', () => INT(w.items.length));
    def(['selection_set', 'select_set'], (a, kw, ln) => {
      const i = lbIndex(w, a[0], ln, 'listbox.get');
      const j = a.length > 1 ? lbIndex(w, a[1], ln, 'listbox.get') : i;
      for (let k = Math.max(0, i); k <= Math.min(j, w.items.length - 1); k++) w.sel.add(k);
      app.changed('listbox', w);
      return NONE;
    });
    def(['selection_clear', 'select_clear'], (a, kw, ln) => {
      const i = lbIndex(w, a[0], ln, 'listbox.get');
      const j = a.length > 1 ? lbIndex(w, a[1], ln, 'listbox.get') : i;
      for (let k = i; k <= j; k++) w.sel.delete(k);
      app.changed('listbox', w);
      return NONE;
    });
    def(['selection_includes', 'select_includes'], (a, kw, ln) => BOOL(w.sel.has(lbIndex(w, a[0], ln, 'listbox.get'))));
    def('activate', (a, kw, ln) => { w.active = lbIndex(w, a[0], ln, 'listbox.get'); return NONE; });
    def(['see', 'yview', 'xview'], () => NONE);
    def('nearest', (a) => {
      const f = w.font;
      return INT(Math.max(0, Math.min(w.items.length - 1, Math.floor((Number(js(a[0])) - 3) / (f.linespace + 1)))));
    });
    def('index', (a, kw, ln) => INT(lbIndex(w, a[0], ln, 'listbox.get')));
  }

  /* ── Canvas ── */
  const flatNums = (args, ln) => {
    const out = [];
    const walk = (v) => {
      if (v.k === 'list' || v.k === 'tuple') v.v.forEach(walk);
      else if (PY.isNum(v) || v.k === 'bool') out.push(Number(v.v));
      else if (v.k === 'str') {
        const s = v.v.trim();
        if (/^-?\d+(\.\d+)?$/.test(s)) out.push(parseFloat(s));
        else for (const p of s.split(/\s+/)) { if (!/^-?\d+(\.\d+)?$/.test(p)) throw new TclError(`bad screen distance "${p}"`); out.push(parseFloat(p)); }
      } else throw new TclError(`bad screen distance "${it.str(v, ln)}"`);
    };
    args.forEach(walk);
    return out;
  };
  const itemArg = (v) => (v.k === 'int' ? Number(v.v) : js(v));
  function canvasMethods(w, def) {
    for (const t of ['rectangle', 'oval', 'line', 'polygon', 'arc', 'text']) {
      def(`create_${t}`, (a, kw, ln) => guard(`create_${t}`, ln, () => INT(canvasCreate(w, t, flatNums(a, ln), optsOf(kw)))));
    }
    def('create_image', () => INT(w.nextItem++));
    def('create_window', () => INT(w.nextItem++));
    def('coords', (a, kw, ln) => guard('coords', ln, () => {
      const items = canvasFind(w, itemArg(a[0]));
      if (a.length === 1) return LIST(items.length ? items[0].coords.map((n) => FLT(n)) : []);
      const nums = flatNums(a.slice(1), ln);
      for (const x of items) canvasCoords(w, x, nums);
      return LIST([]);
    }));
    def('move', (a, kw, ln) => guard('move', ln, () => {
      arity('Canvas.move', a, 3, 3, ['tagOrId', 'xAmount', 'yAmount'], ln);
      const [dx, dy] = flatNums(a.slice(1), ln);
      for (const x of canvasFind(w, itemArg(a[0]))) {
        x.coords = x.coords.map((c, i) => c + (i % 2 ? dy : dx));
      }
      app.note('move', { path: w.path });
      app.changed('canvas', w);
      return NONE;
    }));
    def('moveto', (a, kw, ln) => guard('move', ln, () => {
      const [nx, ny] = flatNums(a.slice(1), ln);
      for (const x of canvasFind(w, itemArg(a[0]))) {
        const [x1, y1] = itemBBox(x);
        x.coords = x.coords.map((c, i) => c + (i % 2 ? ny - y1 : nx - x1));
      }
      app.changed('canvas', w);
      return NONE;
    }));
    def('delete', (a) => {
      for (const v of a) for (const x of canvasFind(w, itemArg(v))) w.items.delete(x.id);
      app.changed('canvas', w);
      return NONE;
    });
    def(['itemconfig', 'itemconfigure'], (a, kw, ln) => guard('itemconfigure', ln, () => {
      for (const x of canvasFind(w, itemArg(a[0]))) canvasConfig(w, x, optsOf(kw, a[1]));
      return NONE;
    }));
    def('itemcget', (a) => {
      const x = canvasFind(w, itemArg(a[0]))[0];
      if (!x) return STR('');
      const v = x.opts[js(a[1])];
      return typeof v === 'number' ? STR(String(v)) : STR(v == null ? '' : String(v));
    });
    def('type', (a) => { const x = canvasFind(w, itemArg(a[0]))[0]; return x ? STR(x.type) : NONE; });
    def('bbox', (a) => {
      const list = a.flatMap((v) => canvasFind(w, itemArg(v)));
      if (!list.length) return NONE;
      const bs = list.map(itemBBox);
      return TUPLE([Math.min(...bs.map((b) => b[0])), Math.min(...bs.map((b) => b[1])), Math.max(...bs.map((b) => b[2])), Math.max(...bs.map((b) => b[3]))].map(INT));
    });
    def('find_all', () => TUPLE([...w.items.keys()].map(INT)));
    def('find_withtag', (a) => TUPLE(canvasFind(w, itemArg(a[0])).map((x) => INT(x.id))));
    def('find_overlapping', (a, kw, ln) => {
      const [x1, y1, x2, y2] = flatNums(a, ln);
      return TUPLE([...w.items.values()].filter((x) => { const b = itemBBox(x); return b[0] <= x2 && b[2] >= x1 && b[1] <= y2 && b[3] >= y1; }).map((x) => INT(x.id)));
    });
    def('gettags', (a) => { const x = canvasFind(w, itemArg(a[0]))[0]; return TUPLE((x ? x.opts.tags || [] : []).map(STR)); });
    def('tag_bind', (a, kw, ln) => {
      const p = guard('bind', ln, () => parseSequence(js(a[1])));
      (w.tagBindings || (w.tagBindings = [])).push({ tag: itemArg(a[0]), seq: p, fn: a[2] });
      return STR(nameOfCmd(a[2]));
    });
    def(['tag_raise', 'tag_lower'], () => NONE);
  }

  /* ════════ 변수 ════════ */
  function makeVar(kind) {
    return { k: 'nobj', type: 'type', str: () => `<class 'tkinter.${kind}'>`, call: (a, kw, ln) => {
      if (!defaultRoot()) {
        const e = new PyError('RuntimeError', 'Too early to create variable: no default root window', ln,
          '변수(IntVar · StringVar)는 Tk( ) 로 창을 만든 다음에 만들어야 합니다.');
        e.tb = [{ raw: TKF.frames.early.frames.slice() }];
        throw e;
      }
      const o = optsOf(kw);
      const value = a.length > 1 ? js(a[1]) : o.value;
      const v = app.newVar(kind, value === undefined || value === null ? undefined : (kind === 'BooleanVar' ? (value ? '1' : '0') : value));
      return V(v, kind);
    } };
  }
  function V(v, kind) {
    if (varWrap.has(v)) return varWrap.get(v);
    const self = { k: 'nobj', type: kind, tkvar: v };
    self.str = () => v.name;
    self.repr = () => v.name;
    self.dir = () => TKF.dirs[kind] || [];
    const methods = {
      get: B('get', (a, kw, ln) => {
        const s = v.value;
        if (kind === 'StringVar') return STR(s);
        if (kind === 'BooleanVar') return BOOL(['1', 'true', 'yes', 'on'].includes(s.toLowerCase()));
        const num = s.trim() === '' ? NaN : Number(s);
        if (!Number.isFinite(num)) {
          const e = new PyError('_tkinter.TclError', `expected floating-point number but got "${s}"`, ln);
          e.tb = [{ raw: TKF.frames.intvar.frames.slice() }];
          throw e;
        }
        return kind === 'IntVar' ? INT(Math.trunc(num)) : FLT(num);
      }),
      set: B('set', (a, kw, ln) => {
        const x = a[0];
        const s = x.k === 'bool' ? (x.v ? (kind === 'BooleanVar' ? '1' : 'True') : (kind === 'BooleanVar' ? '0' : 'False')) : it.str(x, ln);
        app.line = ln;
        v.set(s);
        return NONE;
      }),
      trace_add: B('trace_add', (a) => { const cb = a[1]; v.watch(cb, () => host.callback(cb, [STR(v.name), STR(''), STR('write')], {})); return STR('trace'); }),
    };
    self.getAttr = (attr) => methods[attr];
    varWrap.set(v, self);
    return self;
  }

  /* ════════ 위젯 클래스 ════════ */
  function widgetClass(kind) {
    return { k: 'nobj', type: 'type', str: () => `<class 'tkinter.${kind}'>`, call: (a, kw, ln) => {
      app.line = ln;
      let master = a[0];
      let cnf = a[1];
      if (master && master.k === 'dict') { cnf = master; master = null; }
      if (!master || master.k === 'none') {
        master = defaultRoot() ? W(defaultRoot()) : W(host.newRoot(ln));   // 부모를 안 주면 처음 만든 창 (없으면 새로 만든다)
      }
      if (master.k !== 'nobj' || !master.w) {
        const e = new PyError('AttributeError', `'${it.typeName(master)}' object has no attribute 'tk'`, ln,
          '위젯을 만들 때 첫 번째 값은 그 위젯을 넣을 창(window)이어야 합니다. 예) Label(window, text="안녕")');
        e.tb = [{ raw: TKF.frames.master.frames.slice() }];
        throw e;
      }
      const o = optsOf(kw, cnf);
      const w = guard(`create:${kind}`, ln, () => app.create(kind, master.w, o));
      return W(w);
    } };
  }

  /* ════════ 모듈 ════════ */
  const members = new Map();
  members.set('__name__', STR('tkinter'));
  members.set('Tk', { k: 'nobj', type: 'type', str: () => "<class 'tkinter.Tk'>", call: (a, kw, ln) => {
    if (kw && kw.size) {
      const k = [...kw.keys()].find((x) => !['screenName', 'baseName', 'className', 'useTk', 'sync', 'use'].includes(x));
      if (k) throw new PyError('TypeError', `Tk.__init__() got an unexpected keyword argument '${k}'`, ln);
    }
    return W(host.newRoot(ln));
  } });
  for (const k of KINDS) members.set(k, widgetClass(k));
  for (const k of ['IntVar', 'StringVar', 'DoubleVar', 'BooleanVar']) members.set(k, makeVar(k));
  members.set('TclError', it.excTypes.get('_tkinter.TclError'));
  members.set('mainloop', B('mainloop', (a, kw, ln) => {
    const r = defaultRoot();
    if (!r) throw new PyError('RuntimeError', 'Too early to run the main loop: no default root window', ln);
    return host.mainloop(r, ln);
  }));
  const CONST = {
    END: 'end', INSERT: 'insert', ANCHOR: 'anchor', ACTIVE: 'active', ALL: 'all',
    LEFT: 'left', RIGHT: 'right', TOP: 'top', BOTTOM: 'bottom', BOTH: 'both', X: 'x', Y: 'y', NONE: 'none', CENTER: 'center',
    N: 'n', S: 's', E: 'e', W: 'w', NE: 'ne', NW: 'nw', SE: 'se', SW: 'sw', NS: 'ns', EW: 'ew', NSEW: 'nsew',
    RAISED: 'raised', SUNKEN: 'sunken', FLAT: 'flat', GROOVE: 'groove', RIDGE: 'ridge', SOLID: 'solid',
    NORMAL: 'normal', DISABLED: 'disabled', HIDDEN: 'hidden', READONLY: 'readonly',
    ARC: 'arc', CHORD: 'chord', PIESLICE: 'pieslice', FIRST: 'first', LAST: 'last', BUTT: 'butt', ROUND: 'round',
    SINGLE: 'single', BROWSE: 'browse', MULTIPLE: 'multiple', EXTENDED: 'extended',
    HORIZONTAL: 'horizontal', VERTICAL: 'vertical', WORD: 'word', CHAR: 'char',
  };
  for (const [k, v] of Object.entries(CONST)) members.set(k, STR(v));
  for (const [k, v] of Object.entries({ YES: 1, NO: 0, TRUE: 1, FALSE: 0, ON: 1, OFF: 0 })) members.set(k, INT(v));
  members.set('TkVersion', FLT(8.6));
  members.set('TclVersion', FLT(8.6));
  return { k: 'module', kind: 'std', name: 'tkinter', members, isPkg: true, path: null,
    disk: 'C:\\Python312\\Lib\\tkinter\\__init__.py', realDir: null };
}

/** 이벤트 값 — 함수에 넘어오는 event (event.x · event.y · event.keysym …) */
export function makeEvent(ev, widgetValue) {
  const fields = {
    x: INT(Math.round(ev.x ?? 0)), y: INT(Math.round(ev.y ?? 0)), x_root: INT(Math.round(ev.xRoot ?? ev.x ?? 0)), y_root: INT(Math.round(ev.yRoot ?? ev.y ?? 0)),
    char: STR(ev.char ?? ''), keysym: STR(ev.keysym ?? '??'), keycode: INT(ev.keycode ?? 0), num: ev.type.startsWith('Button') ? INT(Number(ev.detail) || 1) : STR('??'),
    widget: widgetValue || NONE, type: STR({ ButtonPress: '4', ButtonRelease: '5', Motion: '6', KeyPress: '2', KeyRelease: '3', Enter: '7', Leave: '8' }[ev.type] || '35'),
    delta: INT(ev.delta ?? 0), width: STR('??'), height: STR('??'), state: INT(ev.state ?? 0),
  };
  const self = { k: 'nobj', type: 'Event' };
  self.getAttr = (a) => fields[a];
  self.dir = () => Object.keys(fields);
  // 진짜 파이썬 3.12 의 repr 꼴 — <ButtonPress event num=1 x=5 y=7>
  self.str = self.repr = () => {
    const t = ev.type;
    if (t === 'ButtonPress' || t === 'ButtonRelease') return `<${t} event num=${Number(ev.detail) || 1} x=${fields.x.v} y=${fields.y.v}>`;
    if (t === 'KeyPress' || t === 'KeyRelease') {
      const ch = ev.char ? ` char=${ev.char === "'" ? '"\'"' : `'${ev.char}'`}` : '';
      return `<${t} event keysym=${ev.keysym} keycode=${ev.keycode ?? 0}${ch} x=${fields.x.v} y=${fields.y.v}>`;
    }
    if (t === 'Motion') return `<Motion event x=${fields.x.v} y=${fields.y.v}>`;
    return `<${t} event>`;
  };
  return self;
}

export { measure };
