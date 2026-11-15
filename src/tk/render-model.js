/*! 🪟 창문 공방 — © 2026 티쳐무 · 모든 권리 보유
 *  그릴 거리 — 창 하나를 「그림 그리기에 필요한 값만 담은 나무」 로 바꾼다.
 *  화면(ui/window.js)은 이 나무만 보고 그린다. 그래서 창이 사라진 뒤에도(번쩍!) 마지막 모습을 그릴 수 있고,
 *  의뢰의 「목표 화면」 도 같은 방법으로 그린다.
 *  ⚠ node 로 불러다 시험한다. DOM 을 만들지 말 것.
 */
import { parseFont } from './fonts.js';
import { colorOf } from './options.js';

/** 색 이름 → 화면 색. 윈도 시스템 색(SystemButtonFace 등)도 */
export function css(c, fallback = 'transparent') {
  if (c == null || c === '') return fallback;
  try { return colorOf(c) || fallback; } catch (e) { return fallback; }
}

/**
 * 창(루트) 하나 → 그릴 거리.
 *   { title, w, h, bg, widgets: [ { ref, kind, path, x, y, w, h, manager, …그릴 값 } ], waiting: [만들었지만 놓지 않은 위젯] }
 *   x · y 는 창 안쪽(제목 줄 아래) 왼쪽 위에서 잰 자리
 */
export function renderModel(app, root) {
  const size = app.layout(root);
  const out = {
    title: root.title, w: size.w, h: size.h, bg: css(root.opts.background, '#f0f0f0'),
    ref: root, widgets: [], waiting: [], hung: false,
  };
  const walk = (w, ox, oy, visible) => {
    for (const c of w.children) {
      if (!c.alive) continue;
      const placed = !!c.manager && visible && c.shown !== false;
      if (!c.manager) out.waiting.push({ ref: c, kind: c.kind, path: c.path, line: c.line, text: c.shownText, inside: w.kind === 'Tk' ? '' : w.path });
      const x = ox + c.geom.x, y = oy + c.geom.y;
      if (placed) out.widgets.push(itemOf(c, x, y));
      walk(c, x, y, placed);
    }
  };
  walk(root, 0, 0, true);
  return out;
}

function itemOf(c, x, y) {
  const o = c.opts;
  const m = {
    ref: c, kind: c.kind, path: c.path, x, y, w: c.geom.w, h: c.geom.h, manager: c.manager, info: c.info, line: c.line,
    bg: css(o.background, '#f0f0f0'), fg: css(o.foreground, '#000'), bd: o.borderwidth || 0, relief: o.relief || 'flat',
    hl: o.highlightthickness || 0, state: o.state || 'normal', defaultBg: o.background === 'SystemButtonFace' || o.background === 'SystemWindow',
  };
  if (o.font !== undefined) {
    const f = c.font;
    m.font = { css: f.css, px: f.px, weight: f.weight, slant: f.slant, underline: f.underline, linespace: f.linespace };
  }
  if (['Label', 'Button', 'Checkbutton', 'Radiobutton'].includes(c.kind)) {
    m.text = c.shownText; m.anchor = o.anchor; m.justify = o.justify; m.padx = o.padx; m.pady = o.pady;
    m.pressed = !!c.pressed;
  }
  if (c.kind === 'Checkbutton' || c.kind === 'Radiobutton') { m.selected = c.selected; m.indicator = o.indicatoron !== false; m.selectcolor = css(o.selectcolor, '#fff'); }
  if (c.kind === 'Entry') { m.text = c.text; m.show = o.show || ''; m.justify = o.justify; m.readonly = o.state !== 'normal'; m.dis = o.state === 'disabled'; }
  if (c.kind === 'Listbox') {
    m.items = c.items.slice(); m.sel = [...c.sel]; m.selbg = css(o.selectbackground, '#0078d7'); m.selfg = css(o.selectforeground, '#fff');
    m.rowH = c.font.linespace + 1;
  }
  if (c.kind === 'Canvas') {
    m.items = [...c.items.values()].map((it) => {
      const r = { id: it.id, type: it.type, coords: it.coords.slice(), line: it.line, fill: it.opts.fill, outline: it.opts.outline,
        width: it.opts.width, text: it.opts.text, anchor: it.opts.anchor, start: it.opts.start, extent: it.opts.extent,
        style: it.opts.style, arrow: it.opts.arrow, justify: it.opts.justify, dash: it.opts.dash };
      if (it.type === 'text') { const f = parseFont(it.opts.font); r.font = { css: f.css, px: f.px, linespace: f.linespace }; }
      return r;
    });
  }
  return m;
}
