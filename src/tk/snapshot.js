/*! 🪟 창문 공방 — © 2026 티쳐무 · 모든 권리 보유
 *  창의 「지금 모습」 을 글자로 — 위젯마다 경로 · 종류 · 배치 방식 · 자리와 크기 · 글자 · 값.
 *
 *  쓰는 곳 ① 시험 — 진짜 tkinter 가 만든 같은 모습(tools/golden.py)과 견준다
 *          ② 의뢰 채점 — 학생 창과 목표 창을 견준다
 *  ⚠ node 로 불러다 시험한다. DOM 을 만들지 말 것.
 */

/** 창 하나(Tk 루트)의 모습 */
export function snapshotRoot(app, root) {
  const size = app.layout(root);
  const out = { title: root.title, w: size.w, h: size.h, widgets: [] };
  const walk = (w) => {
    for (const c of w.children) {
      if (!c.alive) continue;
      const s = { path: c.path, cls: c.kind, manager: c.manager };
      if (c.manager) Object.assign(s, { x: c.geom.x, y: c.geom.y, w: c.geom.w, h: c.geom.h });
      if (['Label', 'Button', 'Checkbutton', 'Radiobutton'].includes(c.kind)) s.text = c.shownText;
      if (c.kind === 'Entry') s.value = c.text;
      if (c.kind === 'Checkbutton' || c.kind === 'Radiobutton') s.selected = c.selected;
      if (c.kind === 'Listbox') { s.items = c.items.slice(); s.sel = [...c.sel].sort((a, b) => a - b); }
      if (c.kind === 'Canvas') s.items = [...c.items.values()].map((it) => [it.type, it.coords.map((n) => Math.round(n * 100) / 100), it.opts.fill ?? '']);
      for (const k of ['background', 'foreground']) if (c.opts[k] !== undefined) s[k] = String(c.opts[k]);
      out.widgets.push(s);
      walk(c);
    }
  };
  walk(root);
  return out;
}

/** 프로그램의 모든 창 */
export function snapshot(program) {
  return program.app.roots.filter((r) => r.alive).map((r) => snapshotRoot(program.app, r));
}
