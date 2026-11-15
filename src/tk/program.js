/*! 🪟 창문 공방 — © 2026 티쳐무 · 모든 권리 보유
 *  tkinter 프로그램 한 번 — 위에서부터 실행하다 mainloop( ) 에서 멈춰 「기다리기」 에 들어가고,
 *  단추를 누르거나 키를 칠 때마다 연결해 둔 함수를 부른다. 창을 닫으면 mainloop( ) 다음 줄로 이어 간다.
 *
 *  ★ 진짜 tkinter 의 흐름을 그대로 —
 *    · mainloop( ) 를 빠뜨리면 프로그램이 끝나며 창이 번쩍 나타났다 사라진다 (flash)
 *      (python 파일.py 로 실행했을 때. IDLE 에서는 IDLE 이 창을 붙잡아 주어 남아 있기도 하다)
 *    · 함수 안에서 난 오류는 「Exception in Tkinter callback」 으로 찍히고 창은 그대로 산다
 *    · 함수가 끝나지 않으면(무한 반복) 창이 「응답 없음」 이 된다 (hung)
 *  ⚠ node 로 불러다 시험한다. DOM 을 만들지 말 것.
 */
import { Interp, parse, prepareMain, PyError, formatTraceback, frameLines, fileOnDisk, lastLine, PY } from '../lib/pymini.js';
import { TkApp, matchScore } from './app.js';
import { makeTkinter, makeEvent } from './pymod.js';
import { renderModel } from './render-model.js';

/** mainloop( ) 가 던지는 신호 — 프로그램을 여기서 멈추고 「기다리기」 로 들어간다 (오류가 아니다) */
export class MainLoopSignal { }

const ROOT = 'C:\\project';
const TK_CALL = [
  '  File "C:\\Python312\\Lib\\tkinter\\__init__.py", line 1967, in __call__',
  '    return self.func(*args)',
  '           ^^^^^^^^^^^^^^^^',
];

export class Program {
  /**
   * src     학생 코드 (main.py)
   * opts.maxSteps  한 번에 실행할 수 있는 걸음 수 (넘으면 무한 반복으로 본다)
   */
  constructor(src, { maxSteps = 300000, entry = 'main.py' } = {}) {
    this.src = src;
    this.entry = entry;
    this.files = { [entry]: src };
    this.maxSteps = maxSteps;
    this.app = new TkApp();
    this.log = [];            // 콘솔 — {t:'out'|'err'|'note', s, phase}
    this.timeline = [];       // 실행 순서 띠 — {kind, line, text, phase}
    this.state = 'new';       // new → loop → done · crashed
    this.phase = 'start';     // start(mainloop 전) · loop(기다리는 중) · end(창을 닫은 뒤)
    this.flash = false;       // mainloop 없이 끝나 창이 번쩍하고 사라졌다
    this.hung = false;        // 함수가 끝나지 않아 「응답 없음」
    this.mapped = false;      // 창이 화면에 떴나 (winfo_width 가 1 이 아니게 되는 때)
    this.loopRoot = null;
    this.clock = 0;           // after( ) 를 위한 가짜 시계(밀리초)
    this.timers = [];
    this.timerSeq = 0;
    this.error = null;        // 프로그램을 멈춘 오류 { type, line, last }
    this.cbErrors = [];       // 함수 안에서 난 오류들 (창은 산다)
    this.calls = [];          // 불린 함수 — {name, phase, from}
    this.listeners = new Set();

    const host = this.host = {
      app: this.app,
      get mapped() { return self.mapped; },
      newRoot: (ln) => { this.app.line = ln; const r = this.app.createRoot(); this.mark('root', ln, 'Tk( ) — 창을 만들었다'); return r; },
      mainloop: (root, ln) => this.enterLoop(root, ln),
      quit: () => { if (this.state === 'loop') this.endLoop('quit'); },
      destroy: (w) => this.destroy(w),
      after: (ms, fn, args) => this.addTimer(ms, fn, args),
      afterCancel: (id) => { this.timers = this.timers.filter((t) => t.id !== id); },
      update: () => { this.mapped = true; this.emit('update'); },
      callback: (fn, args, opt) => this.callback(fn, args, opt),
      dispatch: (w, ev, opt) => this.dispatch(w, ev, opt),
      geomOf: (w) => (w.kind === 'Tk' ? this.app.layout(w) : (this.app.layout(w.toplevel), w.geom)),
    };
    const self = this;
    this.it = new Interp({ files: { ...this.files }, natives: { tkinter: (it) => makeTkinter(it, host) }, root: ROOT, maxSteps });
    prepareMain(this.it, entry, ROOT);
    // 내가 만든 함수가 「맨 위 코드에서 바로」 불리면 실행 순서 띠에 적는다 — command=process( ) 처럼
    // 단추를 누르기도 전에 불린 함수를 눈에 보이게 하려고 (단추·bind 로 불린 것은 callback( ) 이 적는다)
    this.inCallback = 0;
    this.it.onCall = (fn, depth) => {
      if (this.inCallback || depth !== 1 || fn.name === '<lambda>') return;
      this.flushOut();
      this.mark('call', fn.line || null, `${fn.name}( )`);
      this.timeline[this.timeline.length - 1].early = this.phase === 'start';
      if (this.calls.length < 1000) this.calls.push({ name: fn.name, phase: this.phase, what: '', direct: true });
    };
  }

  on(f) { this.listeners.add(f); return () => this.listeners.delete(f); }
  emit(what) { for (const f of this.listeners) f(what, this); }
  mark(kind, line, text) { if (this.timeline.length < 500) this.timeline.push({ kind, line, text, phase: this.phase }); }

  /* ── 출력 모으기 ── */
  flushOut() {
    this.it.flush();
    const lines = this.it.out.splice(0);
    for (const s of lines) {
      this.log.push({ t: 'out', s, phase: this.phase });
      this.mark('print', null, s);
    }
  }
  pushErr(text) {
    this.log.push({ t: 'err', s: text, phase: this.phase });
  }

  /* ── 실행 ── */
  /** 처음부터 실행한다 — mainloop( ) 에서 멈추거나 끝까지 간다 */
  start() {
    let ast;
    try {
      ast = parse(this.src);
    } catch (e) {
      this.crash(e);
      return this;
    }
    this.ast = ast;
    this.state = 'run';
    this.mark('start', null, '프로그램 시작');
    this.runTop(0);
    return this;
  }

  /** 맨 위 문장들을 from 번째부터 차례로 */
  runTop(from) {
    const it = this.it;
    it.steps = 0;
    const body = this.ast.body;
    for (let i = from; i < body.length; i++) {
      try {
        it.exec(body[i], it.globals, null);
      } catch (e) {
        if (e instanceof MainLoopSignal) {
          this.flushOut();
          this.resumeAt = i + 1;
          this.state = 'loop';
          this.phase = 'loop';
          this.mapped = true;
          this.emit('loop');
          return;
        }
        this.crash(e);
        return;
      }
    }
    this.flushOut();
    this.finish();
  }

  /** 프로그램이 끝났다 — 남은 창은 모두 사라진다. mainloop 없이 끝났으면 「번쩍」 */
  finish() {
    if (this.state === 'crashed') return;
    const alive = this.app.liveRoots;
    if (alive.length && !this.everLooped) this.flashOut(alive);
    this.state = 'done';
    this.mark('end', null, '프로그램 끝');
    for (const r of alive) this.app.destroy(r);
    this.emit('done');
  }

  crash(e) {
    this.flushOut();
    if (e instanceof PyError) {
      if (e.fatal) {
        this.pushErr(`${e.type}: ${e.message}`);
        this.error = { type: e.type, line: e.line, last: `${e.type}: ${e.message}`, hint: e.hint, fatal: true };
      } else {
        const tb = formatTraceback(e, this.files, this.entry, ROOT);
        this.pushErr(tb);
        const userFrames = [{ line: e.cur, file: this.entry }, ...e.tb.filter((f) => !f.raw && f.file === this.entry)];
        const syn = ['SyntaxError', 'IndentationError'].includes(e.type) && !e.runtime;
        this.error = { type: e.type, line: syn ? e.line : userFrames[userFrames.length - 1].line, last: lastLine(e), hint: e.hint };
      }
    } else if (e instanceof RangeError) {
      this.pushErr('RecursionError: 실행이 너무 깊어져 멈췄습니다');
      this.error = { type: 'RecursionError', line: 0, last: 'RecursionError' };
    } else {
      this.pushErr(`(앱 안의 오류) ${e && e.message}`);
      this.error = { type: 'InternalError', line: 0, last: String(e && e.message) };
      if (typeof console !== 'undefined' && console.error) console.error(e);
    }
    this.mark('error', this.error.line, this.error.last);
    const alive = this.app.liveRoots;
    if (alive.length && !this.everLooped) this.flashOut(alive);
    this.state = 'crashed';
    for (const r of alive) this.app.destroy(r);
    this.emit('crashed');
  }

  /** mainloop 없이 끝났다 — 창은 아주 잠깐 나타났다 사라진다. 사라지기 전 모습을 남겨 두어 화면이 「번쩍」 을 그린다 */
  flashOut(roots) {
    this.flash = true;
    this.flashModels = roots.map((r) => renderModel(this.app, r));
  }

  /* ── mainloop ── */
  enterLoop(root, ln) {
    if (this.state === 'loop' || !this.app.liveRoots.length) return PY.NONE;   // 이미 기다리는 중 · 창이 없으면 바로 돌아온다
    this.loopRoot = root;
    this.everLooped = true;
    this.mark('mainloop', ln, 'mainloop( ) — 이제부터 기다린다');
    throw new MainLoopSignal();
  }
  /** 기다리기가 끝났다(창을 모두 닫음 · quit) — mainloop( ) 다음 줄로 이어 간다 */
  endLoop(why) {
    if (this.state !== 'loop') return;
    this.state = 'run';
    this.phase = 'end';
    this.mark('closed', null, why === 'quit' ? 'quit( ) — 기다리기를 멈췄다' : '창을 닫았다 — mainloop( ) 가 끝났다');
    this.pendingResume = true;
  }
  /** 함수가 끝난 뒤(또는 사용자가 창을 닫은 뒤) — 미뤄 둔 「이어 가기」 를 한다 */
  settle() {
    if (this.pendingResume) {
      this.pendingResume = false;
      this.runTop(this.resumeAt);
    }
  }

  destroy(w) {
    this.app.destroy(w);
    if (this.state === 'loop' && !this.app.liveRoots.length) this.endLoop('destroy');
  }

  /** 사용자가 창의 ✕ 를 눌렀다 */
  closeWindow(root) {
    if (this.hung || this.state !== 'loop') return;
    const handler = root.protocols && root.protocols.WM_DELETE_WINDOW;
    if (handler) this.callback(handler, [], { what: '창 닫기 ✕' });
    else this.destroy(root);
    this.settle();
    this.emit('event');
  }

  /* ── 함수 부르기 (단추 · bind · after) ── */
  callback(fn, args, { from = null, what = '', ev = null } = {}) {
    if (this.hung) return undefined;
    const it = this.it;
    const savedSteps = it.steps;
    it.steps = 0;
    const name = fn.k === 'bound' ? fn.name : fn.name || '?';
    if (this.calls.length < 1000) this.calls.push({ name, phase: this.phase, what, ev });
    this.mark('call', fn.line || null, `${what ? what + ' → ' : ''}${name}( )`);
    let result;
    this.inCallback++;
    try {
      result = it.callValue(fn, args, new Map(), 0, null);
    } catch (e) {
      if (e instanceof MainLoopSignal) { result = PY.NONE; }
      else if (e instanceof PyError && e.fatal) {
        // 함수가 끝나지 않는다 — 진짜 창이라면 「응답 없음」 이 되어 아무것도 누를 수 없다
        this.flushOut();
        this.hung = true;
        this.pushErr(`(창이 응답하지 않습니다) ${e.message}`);
        this.cbErrors.push({ type: 'Hung', line: e.line, last: e.message, hint: e.hint });
        this.mark('hung', e.line, '응답 없음');
        this.emit('hung');
        return undefined;
      } else if (e instanceof PyError) {
        this.flushOut();
        const text = this.formatCallbackError(e);
        this.pushErr(text);
        const user = e.tb.filter((f) => !f.raw && f.file === this.entry);
        const info = { type: e.type, line: user.length ? user[user.length - 1].line : (fn.line || 0), last: lastLine(e), hint: e.hint };
        this.cbErrors.push(info);
        this.mark('cberror', info.line, info.last);
      } else throw e;
    } finally {
      this.inCallback--;
      this.flushOut();
      it.steps = savedSteps;
    }
    return result;
  }
  /** 「Exception in Tkinter callback」 — 진짜 파이썬과 같은 꼴 */
  formatCallbackError(e) {
    const lines = ['Exception in Tkinter callback', 'Traceback (most recent call last):', ...TK_CALL];
    const src = this.src.replace(/\r\n?/g, '\n').split('\n');
    for (const f of e.tb) {
      if (f.raw) { lines.push(...f.raw); continue; }
      const text = f.file === '<string>' ? null : src[f.line - 1];
      lines.push(...frameLines(fileOnDisk(ROOT, f.file), f.line, f.where, text, f.pos));
    }
    lines.push(lastLine(e));
    return lines.join('\n');
  }

  /* ── 이벤트 ── */
  /**
   * 이벤트 하나를 위젯에 — bindtags 차례(위젯 → 위젯 종류 → 그 창 → all)로 맞는 연결을 부른다.
   *   ev: { type:'ButtonPress'|'ButtonRelease'|'Motion'|'KeyPress'…, detail, x, y, keysym, char, mods:[], count }
   */
  dispatch(w, ev, { sync = false, what = '' } = {}) {
    if (this.hung || !w.alive) return;
    const app = this.app;
    const tags = [w.bindings, 'class', w.toplevel !== w ? w.toplevel.bindings : null, app.allBindings];
    let stop = false;
    const evValue = () => makeEvent(ev, this.wrapOf(w));
    for (const tag of tags) {
      if (stop || !w.alive) break;
      if (tag === 'class') { this.classBehavior(w, ev); continue; }
      if (!tag) continue;
      let best = null, bestScore = -1;
      for (const b of tag.values()) {
        const s = matchScore(b.seq, ev);
        if (s > bestScore) { best = b; bestScore = s; }
      }
      if (!best) continue;
      // 어떤 이벤트로 불렸는지 — 'ButtonPress-1' · 'Motion+B1' · 'KeyPress-Right' (카드가 「다른 이벤트로도 해 봤나」 를 본다)
      const evName = `${ev.type}${ev.detail != null && ev.type !== 'Motion' ? `-${ev.detail}` : ''}${(ev.mods || []).length ? `+${ev.mods.join('+')}` : ''}${ev.count > 1 ? '+Double' : ''}`;
      for (const fn of best.fns) {
        const r = this.callback(fn, [evValue()], { what: what || describe(ev, w), ev: evName });
        if (r && r.k === 'str' && r.v === 'break') stop = true;
      }
    }
    // 캔버스 도형에 단 연결 (tag_bind)
    if (w.kind === 'Canvas' && w.tagBindings && ev.x != null) {
      for (const tb of w.tagBindings) {
        if (matchScore(tb.seq, ev) < 0) continue;
        this.callback(tb.fn, [evValue()], { what: what || describe(ev, w) });
      }
    }
    if (!sync) { this.settle(); this.emit('event'); }
  }
  /** 위젯의 파이썬 값 (event.widget) — tkinter 모듈이 만들어 준 것 */
  wrapOf(w) { return this.host.wrap ? this.host.wrap(w) : null; }

  /** 위젯 종류마다 정해진 동작 — 단추는 「눌렀다 떼면」 command 를 부른다 */
  classBehavior(w, ev) {
    const app = this.app;
    const btnish = ['Button', 'Checkbutton', 'Radiobutton'].includes(w.kind);
    if (btnish && ev.type === 'ButtonPress' && String(ev.detail) === '1') { w.pressed = true; app.changed('press', w); }
    if (btnish && ev.type === 'ButtonRelease' && String(ev.detail) === '1') {
      const was = w.pressed;
      w.pressed = false;
      app.changed('press', w);
      if (was && ev.inside !== false && w.opts.state !== 'disabled') {
        if (w.kind === 'Checkbutton') app.setVar(w.varName(), w.selected ? w.opts.offvalue : w.opts.onvalue);
        if (w.kind === 'Radiobutton') app.setVar(w.varName(), w.opts.value);
        const cmd = w.opts.command;
        if (cmd && typeof cmd === 'object' && cmd.k) this.callback(cmd, [], { what: `「${w.shownText || w.kind}」 단추`, from: w });
      }
    }
    if (w.kind === 'Listbox' && ev.type === 'ButtonPress' && String(ev.detail) === '1' && ev.index != null && w.opts.state !== 'disabled') {
      if (ev.index >= 0 && ev.index < w.items.length) {
        if (w.opts.selectmode === 'multiple') { if (w.sel.has(ev.index)) w.sel.delete(ev.index); else w.sel.add(ev.index); }
        else w.sel = new Set([ev.index]);
        w.active = ev.index;
        app.changed('listbox', w);
        this.dispatch(w, { type: 'Virtual', detail: 'ListboxSelect' }, { sync: true });
      }
    }
    if ((w.kind === 'Entry' || w.kind === 'Canvas' || w.kind === 'Listbox') && ev.type === 'ButtonPress') { app.focus = w; }
  }

  /** 사용자가 입력 칸에 글자를 쳤다 — 화면의 입력 칸 내용을 가짜 Tk 에 옮긴다 */
  typeInto(w, text) {
    if (this.hung || !w.alive || w.opts.state !== 'normal') return;
    w.text = text;
    w.cursor = text.length;
    const tv = w.opts.textvariable;
    if (tv && typeof tv === 'object') tv.set(text);
    this.app.changed('entry', w);
  }

  /* ── after( ) ── */
  addTimer(ms, fn, args) {
    const id = `after#${this.timerSeq++}`;
    this.timers.push({ id, at: this.clock + ms, fn, args });
    return id;
  }
  /** 시간이 ms 만큼 흘렀다 — 때가 된 after( ) 를 부른다 */
  tick(ms) {
    if (this.state !== 'loop' || this.hung) return;
    this.clock += ms;
    let guard = 0;
    for (;;) {
      const due = this.timers.filter((t) => t.at <= this.clock).sort((a, b) => a.at - b.at)[0];
      if (!due || ++guard > 200) break;
      this.timers = this.timers.filter((t) => t !== due);
      this.callback(due.fn, due.args, { what: 'after( )' });
    }
    this.settle();
    if (guard) this.emit('event');
  }

  /** 콘솔에 보일 글자 전체 */
  get consoleText() { return this.log.map((l) => l.s).join('\n'); }
  get stdout() { return this.log.filter((l) => l.t === 'out').map((l) => l.s).join('\n'); }
  get stderr() { return this.log.filter((l) => l.t === 'err').map((l) => l.s).join('\n'); }
}

/** 실행 순서 띠에 적을 말 */
function describe(ev, w) {
  const who = w.kind === 'Tk' ? '창' : `${w.kind}${w.shownText ? `(${w.shownText})` : ''}`;
  if (ev.type === 'ButtonPress') return `${who} 클릭`;
  if (ev.type === 'ButtonRelease') return `${who} 떼기`;
  if (ev.type === 'Motion') return `${who} 위 마우스`;
  if (ev.type === 'KeyPress') return `키 ${ev.keysym}`;
  return ev.type;
}

/** 시험·끝판왕 검사용 — 코드를 돌려 mainloop 까지 가 본다 */
export function runGui(src, opts) {
  return new Program(src, opts).start();
}
