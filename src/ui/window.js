/*! 🪟 창문 공방 — © 2026 티쳐무 · 모든 권리 보유
 *  가짜 바탕 화면 — 학생 코드가 만든 창을 윈도 창처럼 그리고, 누르기 · 치기 · 끌기를 가짜 Tk 에 전한다.
 *
 *  ★ 위젯 하나 = 창 안에 절대 자리로 놓인 요소 하나. 자리와 크기는 가짜 Tk 의 배치 셈(app.js)이 정한 값 그대로다.
 *    요소는 경로(.!label2)를 열쇠로 다시 쓰므로, 다시 그려도 입력 칸의 커서 · 포커스가 그대로 남는다.
 *  ★ 엑스레이 — 위젯마다 이름표(종류 · 배치 방식)와 점선 테두리, 그리고 「만들었지만 놓지 않은」 위젯이 앉는 대기실
 *  ★ 겹쳐 보기 — 목표 화면을 반투명으로 겹친다
 */
import { h, fill, onCleanup } from './dom.js';
import { css } from '../tk/render-model.js';
import { renderModel } from '../tk/render-model.js';

const SVG = 'http://www.w3.org/2000/svg';
const sv = (tag, attrs = {}) => {
  const el = document.createElementNS(SVG, tag);
  for (const [k, v] of Object.entries(attrs)) if (v != null) el.setAttribute(k, v);
  return el;
};
const TITLE_H = 31;

/** 테두리 모양 — Tk 의 relief 를 CSS 테두리 색으로 */
function reliefBorder(el, bd, relief, bg) {
  if (!bd) { el.style.border = '0'; return; }
  const light = '#ffffff', mid = '#a0a0a0', dark = '#696969';
  const set = (t, l, b, r, style = 'solid') => {
    el.style.borderStyle = style;
    el.style.borderWidth = `${bd}px`;
    el.style.borderColor = `${t} ${r} ${b} ${l}`;
  };
  switch (relief) {
    case 'raised': set(light, light, dark, dark); break;
    case 'sunken': set(mid, mid, light, light); break;
    case 'solid': set('#000', '#000', '#000', '#000'); break;
    case 'groove': set(mid, mid, light, light, 'groove'); break;
    case 'ridge': set(light, light, mid, mid, 'ridge'); break;
    default: set(bg, bg, bg, bg);
  }
}
/** anchor → flex 자리 */
function flexAnchor(el, anchor) {
  const a = anchor || 'center';
  el.style.justifyContent = a.includes('w') && a !== 'center' ? 'flex-start' : (a.includes('e') && a !== 'center' ? 'flex-end' : 'center');
  el.style.alignItems = (a === 'n' || a === 'ne' || a === 'nw') ? 'flex-start' : (a === 's' || a === 'se' || a === 'sw') ? 'flex-end' : 'center';
}
function applyFont(el, f) {
  if (!f) return;
  el.style.font = f.css;
  el.style.lineHeight = `${f.linespace}px`;
  el.style.textDecoration = f.underline ? 'underline' : '';
}

/** 윈도 키 이름 → Tk 의 keysym */
export function keysymOf(e) {
  const map = { ArrowRight: 'Right', ArrowLeft: 'Left', ArrowUp: 'Up', ArrowDown: 'Down', Enter: 'Return', ' ': 'space',
    Backspace: 'BackSpace', Escape: 'Escape', Tab: 'Tab', Delete: 'Delete', Home: 'Home', End: 'End', Shift: 'Shift_L',
    Control: 'Control_L', Alt: 'Alt_L', '+': 'plus', '-': 'minus', '=': 'equal', '.': 'period', ',': 'comma', '/': 'slash',
    '*': 'asterisk', '!': 'exclam', '?': 'question' };
  if (map[e.key]) return map[e.key];
  if (/^F\d+$/.test(e.key)) return e.key;
  return e.key.length === 1 ? e.key : e.key;
}

/* ════════════════════════ 창 하나 그리기 ════════════════════════ */
class WindowView {
  constructor(desk, model, { interactive = true, ghost = false } = {}) {
    this.desk = desk;
    this.interactive = interactive;
    this.ghost = ghost;
    this.els = new Map();          // 경로 → 요소
    this.client = h('div', { class: 'tkw-client' });
    this.xray = h('div', { class: 'tkw-xray' });
    this.titleText = h('span', { class: 'tkw-title-text' });
    this.closeBtn = h('button', { class: 'tkw-btn close', 'aria-label': '창 닫기', title: '창 닫기 (✕)' }, '✕');
    const bar = h('div', { class: 'tkw-title' },
      h('span', { class: 'tkw-icon', html: FEATHER }), this.titleText,
      h('span', { class: 'tkw-btns' }, h('span', { class: 'tkw-btn' }, '─'), h('span', { class: 'tkw-btn' }, '☐'), this.closeBtn));
    this.el = h('div', { class: 'tkw' + (ghost ? ' ghost' : '') }, bar, h('div', { class: 'tkw-body' }, this.client, this.xray));
    if (interactive) {
      this.closeBtn.addEventListener('click', (e) => { e.stopPropagation(); desk.close(this.model.ref); });
      this.client.addEventListener('pointerdown', (e) => this.onDown(e));
      this.client.addEventListener('pointermove', (e) => this.onMove(e));
      this.client.addEventListener('pointerup', (e) => this.onUp(e));
      this.client.addEventListener('contextmenu', (e) => e.preventDefault());
    }
    this.update(model);
  }

  update(model) {
    this.model = model;
    this.titleText.textContent = model.title + (model.hung ? ' (응답 없음)' : '');
    this.el.classList.toggle('hung', !!model.hung);
    this.client.style.width = `${model.w}px`;
    this.client.style.height = `${model.h}px`;
    // 창 너비는 안쪽(client) 너비 그대로 — 제목이 길면 제목이 잘린다(진짜 윈도와 같다)
    this.el.style.width = `${model.w + 2}px`;
    this.client.style.background = model.bg;
    const seen = new Set();
    model.widgets.forEach((m, i) => {
      seen.add(m.path);
      let el = this.els.get(m.path);
      if (!el || el.dataset.kind !== m.kind) {
        if (el) el.remove();
        el = this.make(m);
        this.els.set(m.path, el);
      }
      el.style.zIndex = String(i + 1);
      this.paint(el, m);
      if (el.parentNode !== this.client) this.client.appendChild(el);
    });
    for (const [p, el] of this.els) if (!seen.has(p)) { el.remove(); this.els.delete(p); }
    this.paintXray();
  }

  make(m) {
    const el = h('div', { class: `tkx tk-${m.kind.toLowerCase()}`, 'data-kind': m.kind, 'data-path': m.path });
    el._ref = () => this.model.widgets.find((x) => x.path === m.path);
    if (m.kind === 'Entry') {
      const input = h('input', { class: 'tk-input', spellcheck: 'false', autocomplete: 'off', 'aria-label': '입력 칸' });
      if (this.interactive) {
        input.addEventListener('input', () => this.desk.type(el._ref().ref, input.value));
        input.addEventListener('keydown', (e) => {
          e.stopPropagation();   // 카드 넘기기(← →)로 새지 않게
          this.desk.key(el._ref().ref, e, 'KeyPress');
        });
        input.addEventListener('keyup', (e) => e.stopPropagation());
      } else input.tabIndex = -1;
      el.appendChild(input);
    }
    if (m.kind === 'Canvas') {
      el._svg = sv('svg', { class: 'tk-svg' });
      el._items = new Map();
      el.appendChild(el._svg);
    }
    if (['Label', 'Button', 'Checkbutton', 'Radiobutton'].includes(m.kind)) {
      if (m.kind === 'Checkbutton' || m.kind === 'Radiobutton') el.appendChild(h('span', { class: 'tk-ind' }));
      el.appendChild(h('span', { class: 'tk-text' }));
    }
    if (m.kind === 'Listbox') el.appendChild(h('div', { class: 'tk-rows' }));
    return el;
  }

  paint(el, m) {
    const st = el.style;
    st.left = `${m.x}px`; st.top = `${m.y}px`; st.width = `${m.w}px`; st.height = `${m.h}px`;
    st.background = m.bg; st.color = m.fg;
    el.classList.toggle('dis', m.state === 'disabled');
    switch (m.kind) {
      case 'Label': case 'Frame':
        reliefBorder(el, m.bd, m.relief, m.bg);
        if (m.kind === 'Label') this.paintText(el, m);
        break;
      case 'Button': {
        // 바탕색을 정하지 않은 단추는 윈도 단추 모양, 정했으면 Tk 의 볼록 테두리
        el.classList.toggle('native', m.defaultBg);
        el.classList.toggle('pressed', m.pressed);
        if (!m.defaultBg) reliefBorder(el, m.bd, m.pressed ? 'sunken' : m.relief, m.bg); else { st.border = ''; st.background = ''; }
        this.paintText(el, m);
        break;
      }
      case 'Checkbutton': case 'Radiobutton': {
        reliefBorder(el, m.bd, m.relief === 'flat' ? 'flat' : m.relief, m.bg);
        const ind = el.querySelector('.tk-ind');
        ind.classList.toggle('on', !!m.selected);
        ind.style.display = m.indicator ? '' : 'none';
        this.paintText(el, m);
        break;
      }
      case 'Entry': {
        reliefBorder(el, m.bd, m.relief, m.bg);
        if (m.relief === 'sunken' && m.bd === 1) st.borderColor = '#7a7a7a';
        const input = el.firstChild;
        if (input.value !== m.text) input.value = m.text;
        input.type = m.show ? 'password' : 'text';
        input.readOnly = m.readonly || !this.interactive;
        applyFont(input, m.font);
        input.style.color = m.fg;
        input.style.textAlign = m.justify === 'center' ? 'center' : m.justify === 'right' ? 'right' : 'left';
        break;
      }
      case 'Listbox': {
        reliefBorder(el, m.bd, m.relief, m.bg);
        if (m.relief === 'sunken' && m.bd === 1) st.borderColor = '#828790';
        const rows = el.firstChild;
        applyFont(rows, m.font);
        fill(rows, ...m.items.map((t, i) => h('div', {
          class: 'tk-row' + (m.sel.includes(i) ? ' sel' : ''),
          style: { height: `${m.rowH}px`, lineHeight: `${m.rowH}px`, background: m.sel.includes(i) ? m.selbg : '', color: m.sel.includes(i) ? m.selfg : '' },
        }, t)));
        break;
      }
      case 'Canvas': this.paintCanvas(el, m); break;
      default: break;
    }
  }

  paintText(el, m) {
    const t = el.querySelector('.tk-text');
    t.textContent = m.text;
    applyFont(t, m.font);
    t.style.textAlign = m.justify;
    el.style.padding = `${m.pady}px ${m.padx}px`;
    flexAnchor(el, m.anchor);
  }

  paintCanvas(el, m) {
    reliefBorder(el, m.bd, m.relief, m.bg);
    const svg = el._svg;
    svg.setAttribute('width', m.w);
    svg.setAttribute('height', m.h);
    svg.setAttribute('viewBox', `0 0 ${m.w} ${m.h}`);
    const seen = new Set();
    for (const it of m.items) {
      seen.add(it.id);
      let node = el._items.get(it.id);
      const tag = { rectangle: 'rect', oval: 'ellipse', line: 'polyline', polygon: 'polygon', arc: 'path', text: 'text' }[it.type];
      if (!node || node.tagName !== tag) {
        if (node) node.remove();
        node = sv(tag);
        el._items.set(it.id, node);
      }
      drawItem(node, it);
      svg.appendChild(node);   // 다시 붙이면 만든 차례(겹치는 차례)가 지켜진다
    }
    for (const [id, node] of el._items) if (!seen.has(id)) { node.remove(); el._items.delete(id); }
  }

  /** 엑스레이 — 위젯마다 점선 테두리와 이름표 */
  paintXray() {
    const on = this.desk.xrayOn && !this.ghost;
    this.xray.style.display = on ? '' : 'none';
    if (!on) return;
    this.xray.style.width = `${this.model.w}px`;
    this.xray.style.height = `${this.model.h}px`;
    fill(this.xray, ...this.model.widgets.map((m) => {
      const how = m.manager === 'grid' ? `grid(${m.info.row},${m.info.column})` : m.manager === 'pack' ? `pack·${m.info.side}` : 'place';
      // 창의 맨 위에 붙은 위젯은 이름표를 테두리 안쪽에 (제목 줄을 가리지 않게)
      return h('div', { class: `xr-box xr-${m.manager}${m.y < 14 ? ' top' : ''}`, style: { left: `${m.x}px`, top: `${m.y}px`, width: `${m.w}px`, height: `${m.h}px` } },
        h('span', { class: 'xr-tag' }, `${m.kind} · ${how}`));
    }));
  }

  /* ── 마우스 ── */
  hit(e) {
    const el = e.target.closest('.tkx');
    const m = el ? el._ref() : null;
    const ref = m ? m.ref : this.model.ref;
    const box = (el || this.client).getBoundingClientRect();
    const w = m ? m.w : this.model.w;
    const k = box.width / w || 1;     // 무대 · 확대 배율을 걷어 내고 Tk 의 픽셀로
    return { ref, m, x: Math.round((e.clientX - box.left) / k), y: Math.round((e.clientY - box.top) / k), el };
  }
  onDown(e) {
    if (e.target.tagName === 'INPUT' && e.button === 0) {
      const t = this.hit(e);
      this.desk.mouse(t.ref, { type: 'ButtonPress', detail: '1', x: t.x, y: t.y });
      return;
    }
    e.preventDefault();
    this.desk.focusDesk();
    const t = this.hit(e);
    const now = Date.now();
    const same = this.lastDown && this.lastDown.ref === t.ref && now - this.lastDown.at < 450;
    this.lastDown = { ref: t.ref, at: now, count: same ? this.lastDown.count + 1 : 1 };
    this.drag = { ref: t.ref, el: t.el, button: e.button === 2 ? '3' : '1' };
    try { this.client.setPointerCapture(e.pointerId); } catch (err) { /* 무시 */ }
    const ev = { type: 'ButtonPress', detail: this.drag.button, x: t.x, y: t.y, count: this.lastDown.count };
    if (t.m && t.m.kind === 'Listbox') ev.index = Math.floor((t.y - t.m.bd - t.m.hl) / t.m.rowH);
    this.desk.mouse(t.ref, ev);
  }
  onMove(e) {
    if (this.drag) {
      const box = (this.drag.el || this.client).getBoundingClientRect();
      const m = this.drag.el ? this.drag.el._ref() : null;
      const k = box.width / (m ? m.w : this.model.w) || 1;
      const x = Math.round((e.clientX - box.left) / k), y = Math.round((e.clientY - box.top) / k);
      this.desk.mouse(this.drag.ref, { type: 'Motion', x, y, mods: [`B${this.drag.button}`] }, { motion: true });
    } else {
      const t = this.hit(e);
      this.desk.pointer(t.ref, t.x, t.y, e);
      this.desk.mouse(t.ref, { type: 'Motion', x: t.x, y: t.y, mods: [] }, { motion: true });
    }
  }
  onUp(e) {
    if (!this.drag) return;
    const d = this.drag;
    this.drag = null;
    const box = (d.el || this.client).getBoundingClientRect();
    const m = d.el ? d.el._ref() : null;
    const k = box.width / (m ? m.w : this.model.w) || 1;
    const x = Math.round((e.clientX - box.left) / k), y = Math.round((e.clientY - box.top) / k);
    const inside = x >= 0 && y >= 0 && x < (m ? m.w : this.model.w) && y < (m ? m.h : this.model.h);
    this.desk.mouse(d.ref, { type: 'ButtonRelease', detail: d.button, x, y, inside });
  }
}

/** 캔버스 도형 하나 그리기 (SVG) — Tk 의 좌표 그대로 */
function drawItem(node, it) {
  const c = it.coords;
  const fill = it.fill ? css(it.fill, 'none') : 'none';
  const outline = it.outline ? css(it.outline, 'none') : 'none';
  const sw = it.width == null ? 1 : it.width;
  const set = (a) => { for (const [k, v] of Object.entries(a)) node.setAttribute(k, v); };
  if (it.type === 'rectangle') {
    const x = Math.min(c[0], c[2]), y = Math.min(c[1], c[3]);
    set({ x, y, width: Math.abs(c[2] - c[0]), height: Math.abs(c[3] - c[1]), fill, stroke: outline, 'stroke-width': sw });
  } else if (it.type === 'oval') {
    set({ cx: (c[0] + c[2]) / 2, cy: (c[1] + c[3]) / 2, rx: Math.abs(c[2] - c[0]) / 2, ry: Math.abs(c[3] - c[1]) / 2, fill, stroke: outline, 'stroke-width': sw });
  } else if (it.type === 'line') {
    const pts = []; for (let i = 0; i < c.length; i += 2) pts.push(`${c[i]},${c[i + 1]}`);
    set({ points: pts.join(' '), fill: 'none', stroke: fill === 'none' ? 'none' : fill, 'stroke-width': sw, 'stroke-linecap': 'butt' });
    node.style.markerEnd = ''; node.style.markerStart = '';
    if (it.arrow && it.arrow !== 'none') node.setAttribute('data-arrow', it.arrow); else node.removeAttribute('data-arrow');
  } else if (it.type === 'polygon') {
    const pts = []; for (let i = 0; i < c.length; i += 2) pts.push(`${c[i]},${c[i + 1]}`);
    set({ points: pts.join(' '), fill, stroke: outline, 'stroke-width': sw });
  } else if (it.type === 'arc') {
    const cx = (c[0] + c[2]) / 2, cy = (c[1] + c[3]) / 2, rx = Math.abs(c[2] - c[0]) / 2, ry = Math.abs(c[3] - c[1]) / 2;
    const a0 = (it.start || 0) * Math.PI / 180, ext = it.extent == null ? 90 : it.extent;
    const a1 = ((it.start || 0) + ext) * Math.PI / 180;
    const p0 = [cx + rx * Math.cos(a0), cy - ry * Math.sin(a0)], p1 = [cx + rx * Math.cos(a1), cy - ry * Math.sin(a1)];
    const large = Math.abs(ext) > 180 ? 1 : 0, sweep = ext > 0 ? 0 : 1;
    let d = `M ${p0[0]} ${p0[1]} A ${rx} ${ry} 0 ${large} ${sweep} ${p1[0]} ${p1[1]}`;
    if (it.style === 'pieslice' || !it.style) d = `M ${cx} ${cy} L ${p0[0]} ${p0[1]} A ${rx} ${ry} 0 ${large} ${sweep} ${p1[0]} ${p1[1]} Z`;
    else if (it.style === 'chord') d += ' Z';
    set({ d, fill: it.style === 'arc' ? 'none' : fill, stroke: outline, 'stroke-width': sw });
  } else if (it.type === 'text') {
    const lines = String(it.text ?? '').split('\n');
    const f = it.font;
    const a = it.anchor || 'center';
    const total = lines.length * f.linespace;
    let top = c[1] - total / 2;
    if (a === 'n' || a === 'ne' || a === 'nw') top = c[1];
    if (a === 's' || a === 'se' || a === 'sw') top = c[1] - total;
    const anchor = (a === 'w' || a === 'nw' || a === 'sw') ? 'start' : (a === 'e' || a === 'ne' || a === 'se') ? 'end' : 'middle';
    while (node.firstChild) node.removeChild(node.firstChild);
    set({ x: c[0], y: top, fill: fill === 'none' ? '#000' : fill, 'text-anchor': anchor, 'dominant-baseline': 'text-before-edge' });
    node.style.font = f.css;
    lines.forEach((t, i) => { const sp = sv('tspan', { x: c[0], dy: i ? f.linespace : 0 }); sp.textContent = t; node.appendChild(sp); });
  }
}

/* ════════════════════════ 바탕 화면 ════════════════════════ */
/**
 * createDesktop({ zoom, xray })
 *   .show(program)   이 프로그램의 창을 보인다 (다시 그리기는 저절로)
 *   .setTarget(model) 목표 화면 겹쳐 보기 (null 이면 끈다)
 */
export function createDesktop({ zoom = 'fit', xray = false, height = null, emptyText = '▶ 실행을 누르면 여기에 창이 뜹니다', onPointer = null } = {}) {
  const area = h('div', { class: 'desk-area' });
  const waitBox = h('div', { class: 'desk-wait' });
  const coord = h('div', { class: 'desk-coord' });
  const el = h('div', { class: 'desk', tabIndex: 0, 'aria-label': '가짜 바탕 화면 — 학생이 만든 창이 여기에 뜹니다' }, area, coord, waitBox);
  if (height) el.style.height = `${height}px`;
  const desk = {
    el, program: null, views: [], targetView: null, xrayOn: xray, zoomMode: zoom, target: null, lastSize: null,
    show(program) {
      desk.program = program;
      if (desk.off) desk.off();
      desk.off = program ? program.on(() => desk.schedule()) : null;
      if (program) desk.offApp = program.app.on(() => desk.schedule());
      fill(area);
      desk.views = [];
      desk.flashing = false;
      desk.schedule();
    },
    setTarget(model) { desk.target = model; desk.render(); },
    setXray(on) { desk.xrayOn = on; desk.render(); },
    setZoom(z) { desk.zoomMode = z; desk.render(); },
    schedule() {
      if (desk.pending) return;
      desk.pending = true;
      // 화면이 가려져 있으면 requestAnimationFrame 이 멈추므로 setTimeout 도 함께 건다 (먼저 오는 쪽이 그린다)
      const go = () => { if (!desk.pending) return; desk.pending = false; desk.render(); };
      requestAnimationFrame(go);
      setTimeout(go, 80);
    },
    models() {
      const p = desk.program;
      if (!p) return [];
      if (p.state === 'loop') return p.app.liveRoots.filter((r) => !r.withdrawn).map((r) => ({ ...renderModel(p.app, r), hung: p.hung }));
      return [];
    },
    render() {
      const p = desk.program;
      const models = desk.models();
      // 번쩍 — mainloop 없이 끝난 프로그램의 창은 잠깐 나타났다가 사라진다
      if (p && p.flash && p.flashModels && !desk.flashDone) {
        desk.flashDone = true;
        desk.flashing = true;
        fill(area);
        desk.views = p.flashModels.map((mo) => new WindowView(desk, mo, { interactive: false }));
        desk.views.forEach((v) => { v.el.classList.add('flash'); area.appendChild(v.el); });
        desk.layout(p.flashModels);
        setTimeout(() => { desk.flashing = false; desk.render(); }, 900);
        return;
      }
      if (desk.flashing) return;
      // 창 맞추기
      while (desk.views.length > models.length) desk.views.pop().el.remove();
      models.forEach((mo, i) => {
        if (desk.views[i] && desk.views[i].model.ref === mo.ref) desk.views[i].update(mo);
        else {
          if (desk.views[i]) desk.views[i].el.remove();
          desk.views[i] = new WindowView(desk, mo, { interactive: true });
          area.appendChild(desk.views[i].el);
          desk.views[i].el.classList.add('pop');
        }
      });
      // 목표 화면 겹쳐 보기
      if (desk.target && models[0]) {
        if (!desk.targetView) desk.targetView = new WindowView(desk, desk.target, { interactive: false, ghost: true });
        else desk.targetView.update(desk.target);
        if (desk.targetView.el.parentNode !== area) area.appendChild(desk.targetView.el);
      } else if (desk.targetView) { desk.targetView.el.remove(); desk.targetView = null; }
      desk.layout(models);
      // 빈 바탕 화면의 말
      const msg = area.querySelector('.desk-msg');
      if (msg) msg.remove();
      if (!models.length) area.appendChild(h('div', { class: 'desk-msg' }, desk.emptyMessage()));
      desk.paintWaiting(models);
    },
    emptyMessage() {
      const p = desk.program;
      if (!p) return emptyText;
      if (p.flash) return '💨 창이 번쩍 나타났다가 사라졌어요!';
      if (p.state === 'crashed') return '💥 오류로 프로그램이 멈췄어요 — 아래 오류를 읽어 보세요';
      if (p.state === 'done') return p.everLooped ? '🪟 창을 닫아 프로그램이 끝났어요' : '프로그램이 끝났어요 (만든 창이 없어요)';
      return emptyText;
    },
    /** 창을 바탕 화면 안에 놓고 크기를 맞춘다 */
    layout(models) {
      const box = el.getBoundingClientRect();
      const stageK = box.width / (el.offsetWidth || box.width || 1) || 1;
      const W = (el.clientWidth || 600) - 24, H = (el.clientHeight || 400) - 24 - (waitBox.offsetHeight || 0);
      const first = models[0];
      let z = 1;
      if (first) {
        const ww = first.w + 2, wh = first.h + TITLE_H + 2;
        const fit = Math.min(W / ww, H / wh);
        // 맞춤 — 크게 볼 때는 0.25 단위, 바탕 화면보다 큰 창은 0.05 단위로 줄여 다 보이게
        const fitZ = fit >= 1 ? Math.floor(fit * 4) / 4 : Math.floor(fit * 20) / 20;
        z = desk.zoomMode === 'fit' ? Math.max(0.3, Math.min(2.2, fitZ)) : Math.min(Number(desk.zoomMode), fit);
      }
      desk.zoom = z;
      el.dataset.zoom = String(z);
      const place = (v, i) => {
        v.el.style.transform = `scale(${z})`;
        const ww = (v.model.w + 2) * z;
        v.el.style.left = `${Math.max(12, (W + 24 - ww) / 2) + i * 26 * z}px`;
        v.el.style.top = `${12 + i * 26 * z}px`;
      };
      desk.views.forEach(place);
      if (desk.targetView) place(desk.targetView, 0);
      return stageK;
    },
    paintWaiting(models) {
      const wait = desk.xrayOn ? models.flatMap((m) => m.waiting) : [];
      waitBox.style.display = wait.length ? '' : 'none';
      fill(waitBox, wait.length ? [
        h('b', {}, '🪑 대기실 — 만들었지만 화면에 놓지 않은 위젯'),
        ...wait.map((w) => h('span', { class: 'wait-chip' }, `${w.kind}${w.text ? ` 「${w.text}」` : ''} · ${w.line}번째 줄`)),
      ] : []);
    },
    /* ── 사용자 → 가짜 Tk ── */
    mouse(ref, ev, { motion = false } = {}) {
      const p = desk.program;
      if (!p || p.state !== 'loop') return;
      if (motion && !hasMotion(p, ref)) return;
      p.dispatch(ref, { count: 1, mods: [], ...ev });
    },
    pointer(ref, x, y) {
      if (onPointer) onPointer(ref, x, y);
      coord.textContent = desk.coordOn ? `${ref.kind === 'Tk' ? '창' : ref.kind} 안 (x=${x}, y=${y})` : '';
    },
    key(ref, e, type) {
      const p = desk.program;
      if (!p || p.state !== 'loop') return;
      const keysym = keysymOf(e);
      p.dispatch(ref, { type, detail: keysym, keysym, char: e.key.length === 1 ? e.key : '', keycode: e.keyCode || 0, mods: [], count: 1 });
    },
    type(ref, text) { if (desk.program) desk.program.typeInto(ref, text); },
    close(root) { if (desk.program) desk.program.closeWindow(root); },
    focusDesk() { if (document.activeElement && document.activeElement.tagName === 'INPUT') document.activeElement.blur(); el.focus({ preventScroll: true }); },
  };
  // 키보드 — 포커스를 가진 위젯(없으면 창)에. ← → 가 카드 넘기기로 새지 않게 막는다
  el.addEventListener('keydown', (e) => {
    const p = desk.program;
    if (!p || p.state !== 'loop' || e.target.tagName === 'INPUT') return;
    e.preventDefault();
    e.stopPropagation();
    const target = p.app.focus && p.app.focus.alive ? p.app.focus : p.app.liveRoots[0];
    if (target) desk.key(target, e, 'KeyPress');
  });
  // after( ) 를 위한 시계
  let last = performance.now();
  const tick = () => {
    const now = performance.now();
    const p = desk.program;
    if (p && p.state === 'loop' && p.timers.length) p.tick(Math.min(200, now - last));
    last = now;
    desk.raf = requestAnimationFrame(tick);
  };
  desk.raf = requestAnimationFrame(tick);
  onCleanup(() => { cancelAnimationFrame(desk.raf); if (desk.off) desk.off(); });
  return desk;
}

/** 그림 한 장 — 누를 수 없는 창 그림 (예측 문제의 보기 · 의뢰서의 목표 화면) */
export function windowPicture(model, { scale = 1 } = {}) {
  const v = new WindowView({ xrayOn: false }, model, { interactive: false });
  v.el.style.left = '0'; v.el.style.top = '0';
  v.el.style.transform = `scale(${scale})`;
  return h('div', { class: 'tkpic', style: { width: `${Math.ceil((model.w + 2) * scale)}px`, height: `${Math.ceil((model.h + TITLE_H + 2) * scale)}px` } }, v.el);
}

/** 마우스 움직임을 기다리는 연결이 있나 — 없으면 움직일 때마다 부르지 않는다 */
function hasMotion(p, ref) {
  const tables = [ref.bindings, ref.toplevel.bindings, p.app.allBindings];
  return tables.some((t) => t && [...t.values()].some((b) => b.seq.type === 'Motion'));
}

/* Tk 창의 깃털 아이콘 (직접 그린 것) */
const FEATHER = '<svg viewBox="0 0 16 16" width="16" height="16" aria-hidden="true"><path d="M13.5 1.5C8 2 4 6 3 12l-1 2.5 1.2.4L4.3 12c3.6.3 7.4-2.6 9.2-10.5z" fill="#2a6fdb"/><path d="M4.3 12c1.5-3.4 3.8-6.2 7-8.4" stroke="#fff" stroke-width=".9" fill="none"/></svg>';
