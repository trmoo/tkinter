/*! 🪟 창문 공방 — © 2026 티쳐무 · 모든 권리 보유
 *  3차시 — 그리고 움직이기 (교재 9 · 10절)
 *    좌표 사격장 · 도형 갤러리 · bind(마우스) · 그림판(B1-Motion) · 키보드로 별 찾기
 */
import { h, fill } from '../ui/dom.js';
import { story, tip, checklist, finish, runBox, choose, picked } from './kit.js';
import { card, setCard } from '../store.js';
import { AIM, GALLERY, BIND, PAINT, KEYS, reachedStar } from '../data/missions3.js';
import { previewOf } from '../tk/preview.js';

const flags = (cid) => card(cid).flags || {};
const setFlag = (cid, k) => { if (!flags(cid)[k]) setCard(cid, { flags: { ...flags(cid), [k]: true } }); };
const autoBtn = (fn, label = '🧪 자동 검사') => h('button', { class: 'btn small primary', onClick: fn }, label);

/* ════════ 좌표 사격장 ════════ */
export const aimCard = {
  id: 'aim', chapter: 's3', title: '🎯 좌표 사격장 — 캔버스의 좌표',
  render(body, api) {
    const cid = 'aim';
    const checks = h('div');
    const paint = (p) => {
      const items = AIM.check(p).map((x) => (p ? x : { ...x, ok: null }));
      fill(checks, checklist(items, { title: '🎯 과녁 셋 — 빨간 점선에 딱 맞게' }));
      if (items.every((x) => x.ok)) finish(api, cid, '캔버스 좌표의 함정 셋을 모두 피했어요!');
    };
    const box = runBox({ cid, starter: AIM.starter, model: AIM.model, rows: 17, coord: true, tools: ['xray', 'coord'], onRun: paint });
    box.deskApi.setTarget(previewOf(AIM.model).model);
    fill(body, h('div', { class: 'lab' },
      h('div', { class: 'col tight' },
        story('창 위의 <b>빨간 점선</b>이 과녁이에요. 코드의 숫자가 모두 조금씩 틀렸어요 — 주석의 설명대로 고쳐서 세 과녁을 맞혀 보세요. 📐 좌표 보기를 켜고 캔버스 위에 마우스를 올리면 좌표가 보여요.', '🎯'),
        box.editor, checks),
      h('div', { class: 'right' }, box.desk, box.tools,
        h('table', { class: 'mini-table' },
          h('tr', {}, h('th', {}, '메서드'), h('th', {}, '좌표의 뜻')),
          h('tr', {}, h('td', {}, h('code', {}, 'create_rectangle(x1, y1, x2, y2)')), h('td', { html: '<b>왼쪽 위</b>와 <b>오른쪽 아래</b> 꼭짓점' })),
          h('tr', {}, h('td', {}, h('code', {}, 'create_oval(x1, y1, x2, y2)')), h('td', { html: '그 원을 <b>감싸는 사각형</b>' })),
          h('tr', {}, h('td', {}, h('code', {}, 'create_line(x1, y1, x2, y2)')), h('td', {}, '시작점과 끝점'))),
        tip('캔버스는 <b>왼쪽 위가 (0, 0)</b>, x 는 오른쪽으로, <b>y 는 아래로</b> 커져요. 수학 시간의 좌표와 위아래가 반대예요.', '📐'),
        box.console)));
    paint(null);
    box.run();
  },
};

/* ════════ 도형 갤러리 ════════ */
export const galleryCard = {
  id: 'gallery', chapter: 's3', title: '🖼 도형 갤러리 — 반복문으로 여러 개',
  render(body, api) {
    const cid = 'gallery';
    const checks = h('div');
    let last = null;
    const paint = () => {
      const items = [...GALLERY.check(last).map((x) => (last ? x : { ...x, ok: null })),
        { ok: picked(cid, 'trap') === 1 || null, label: '「x + w」 문제를 맞힌다' }];
      fill(checks, checklist(items));
      if (items.every((x) => x.ok)) finish(api, cid, '나만의 도형 갤러리 완성!');
    };
    const box = runBox({ cid, starter: GALLERY.starter, model: GALLERY.model, rows: 17, onRun: (p) => { last = p; paint(); } });
    const trap = choose({
      q: '반복문 안에서 <code>create_rectangle(x, y, w, h)</code> 라고 쓰면?',
      choices: ['너비 w, 높이 h 인 사각형이 (x, y) 에 그려진다', '(x, y) 와 (w, h) 를 두 꼭짓점으로 삼아 크기가 뒤죽박죽인 사각형이 그려진다', '오류가 난다'],
      answer: 1, why: '두 꼭짓점을 받으므로 오른쪽 아래는 <code>(x + w, y + h)</code> 로 셈해 넣어야 해요.', save: [cid, 'trap'], onPick: () => paint(),
    });
    fill(body, h('div', { class: 'lab' },
      h('div', { class: 'col tight' },
        story('8장의 <code>random</code> 과 반복문으로 도형을 여러 개 그려요. ▶ 실행할 때마다 그림이 바뀌어요! 사각형 말고 <b>다른 도형도 더해</b> 네 가지 이상으로 나만의 갤러리를 만들어 보세요.', '🖼'),
        box.editor, checks),
      h('div', { class: 'right' }, box.desk, box.tools,
        h('div', { class: 'note-box', html: '원 <code>create_oval(x1, y1, x2, y2)</code> · 선 <code>create_line(x1, y1, x2, y2, width=3)</code> · 다각형 <code>create_polygon(x1, y1, x2, y2, x3, y3)</code> · 호 <code>create_arc(…, extent=90)</code> · 글자 <code>create_text(x, y, text="안녕")</code>' }),
        trap)));
    paint();
    box.run();
  },
};

/* ════════ bind — 마우스 ════════ */
export const bindCard = {
  id: 'bind', chapter: 's3', title: '🖱 bind — 어디를 눌렀을까?',
  render(body, api) {
    const cid = 'bind';
    const checks = h('div');
    const evBox = h('div', { class: 'note-box' }, '아직 이벤트가 없어요.');
    const paint = () => {
      const f = flags(cid);
      const items = [
        { ok: f.printed || null, label: '회색 판을 여기저기 눌러 콘솔에 좌표를 찍는다' },
        { ok: f.noEvent || null, label: '<code>def click(event):</code> 의 <code>event</code> 를 지우고 실행해 눌러 본다',
          why: f.noEvent ? '창은 멀쩡한데 누를 때마다 콘솔에 빨간 줄만 쌓여요 — 그래서 찾기 어려운 실수예요.' : '' },
        { ok: f.other || null, label: '<code>event</code> 를 되돌리고, <code>"&lt;Button-1&gt;"</code> 을 다른 이벤트로 바꿔 본다 — 오른쪽 단추 · 두 번 · 움직임' },
      ];
      fill(checks, checklist(items, { title: '🔬 실험 세 가지' }));
      if (items.every((x) => x.ok)) finish(api, cid, 'bind 와 event 를 손에 넣었어요!');
    };
    const look = (p) => {
      if (/에서 눌렸습니다/.test(p.stdout)) setFlag(cid, 'printed');
      if (p.cbErrors.some((e) => /takes 0 positional/.test(e.last))) setFlag(cid, 'noEvent');
      const evs = p.calls.filter((c) => c.ev);
      if (evs.some((c) => !/^ButtonPress-1$/.test(c.ev) && !/^ButtonRelease/.test(c.ev))) setFlag(cid, 'other');
      const lastEv = evs[evs.length - 1];
      fill(evBox, lastEv ? h('span', { html: `📨 마지막 이벤트 — <b>${lastEv.ev.replace('ButtonPress', '단추 누름').replace('+B1', ' (왼쪽 단추를 누른 채)').replace('+Double', ' (두 번)').replace('Motion', '마우스 움직임')}</b> → <code>${lastEv.name}( )</code>` }) : '아직 이벤트가 없어요.');
      paint();
    };
    const box = runBox({ cid, starter: BIND, model: BIND, rows: 11, onRun: look, onEvent: look });
    fill(body, h('div', { class: 'lab' },
      h('div', { class: 'col tight' },
        story('단추는 <code>command</code> 로 충분하지만, <b>마우스를 어디서 눌렀는지</b>나 <b>어떤 키를 눌렀는지</b> 알려면 <code>위젯.bind("&lt;이벤트&gt;", 함수)</code>. 이렇게 이은 함수는 <code>event</code> 를 받아요 — <code>event.x</code> · <code>event.y</code> 가 누른 자리예요.', '🖱'),
        box.editor, checks,
        h('table', { class: 'mini-table' },
          h('tr', {}, h('th', {}, '이벤트'), h('th', {}, '언제')),
          h('tr', {}, h('td', {}, h('code', {}, '<Button-1>')), h('td', {}, '왼쪽 단추를 누를 때')),
          h('tr', {}, h('td', {}, h('code', {}, '<Button-3>')), h('td', {}, '오른쪽 단추를 누를 때')),
          h('tr', {}, h('td', {}, h('code', {}, '<Double-Button-1>')), h('td', {}, '두 번 빨리 누를 때')),
          h('tr', {}, h('td', {}, h('code', {}, '<Motion>')), h('td', {}, '마우스를 움직일 때')))),
      h('div', { class: 'right' }, box.desk, box.tools, evBox, h('div', { class: 'out-slot tall' }, box.console))));
    paint();
    box.run();
  },
};

/* ════════ 그림판 ════════ */
export const paintCard = {
  id: 'paint', chapter: 's3', title: '🖍 그림판 — 누른 채로 끌기',
  render(body, api) {
    const cid = 'paint';
    const checks = h('div');
    const show = (items) => {
      if (items && items.every((x) => x.ok)) setFlag(cid, 'pass');
      fill(checks, checklist(items || [{ ok: flags(cid).pass || null, label: '「파랑색으로」 단추를 더하고 🧪 자동 검사' }]));
      if (flags(cid).pass) finish(api, cid, '나만의 그림판 완성!');
    };
    const box = runBox({ cid, starter: PAINT.starter, model: PAINT.model, rows: 17, extraBtns: [autoBtn(() => show(PAINT.check(box.ed.value)))] });
    fill(body, h('div', { class: 'lab' },
      h('div', { class: 'col tight' },
        story('<code>&lt;B1-Motion&gt;</code> — 왼쪽 단추를 <b>누른 채로 움직이는 동안</b> 계속 함수가 불려요. 그때마다 작은 원을 찍으면 그림판! 캔버스 위에서 끌어 보세요. 그다음 <b>「파랑색으로」 단추</b>를 더해 보세요.', '🖍'),
        box.editor, checks),
      h('div', { class: 'right' }, box.desk, box.tools,
        h('div', { class: 'note-box', html: '<b>global 이 왜 필요할까?</b> — <code>change_color()</code> 안에서 그냥 <code>mycolor = "red"</code> 라고 쓰면 <b>함수 안에만 있는 새 변수</b>가 생기고 바깥의 <code>mycolor</code> 는 그대로예요(오류도 없어요!). <code>global mycolor</code> 는 「바깥의 그 변수를 쓰겠다」 는 선언이에요.' }),
        box.console)));
    show(null);
    box.run();
  },
};

/* ════════ 키보드로 별 찾기 ════════ */
export const keyCard = {
  id: 'keygame', chapter: 's3', title: '🕹 키보드로 별 찾기 — move 와 bind_all',
  render(body, api) {
    const cid = 'keygame';
    const checks = h('div');
    let auto = null;
    const paint = () => {
      if (auto && auto.every((x) => x.ok)) setFlag(cid, 'pass');
      const items = [
        ...(auto || [{ ok: flags(cid).pass || null, label: '↑ ↓ 함수를 더하고 🧪 자동 검사 (네 방향)' }]),
        { ok: flags(cid).star || null, label: '화살표로 초록 공을 ★ 까지 옮긴다' },
      ];
      fill(checks, checklist(items));
      if (flags(cid).pass && flags(cid).star) finish(api, cid, '별을 찾았어요!');
    };
    const look = (p) => { if (reachedStar(p)) setFlag(cid, 'star'); paint(); };
    const box = runBox({ cid, starter: KEYS.starter, model: KEYS.model, rows: 19, onRun: look, onEvent: look,
      extraBtns: [autoBtn(() => { auto = KEYS.check(box.ed.value); paint(); })] });
    fill(body, h('div', { class: 'lab' },
      h('div', { class: 'col tight' },
        story('<code>create_oval()</code> 은 그린 도형의 <b>번호</b>를 돌려줘요. 그 번호를 <code>canvas.move(번호, 가로, 세로)</code> 에 주면 그 도형만 움직여요. 지금은 ← → 만 돼요 — <b>↑ ↓ 를 더해</b> 공을 ★ 까지 옮겨 보세요!', '🕹'),
        box.editor, checks),
      h('div', { class: 'right' }, box.desk, box.tools,
        tip('창(바탕 화면)을 <b>한 번 누른 뒤</b> 화살표 키를 누르세요. <code>bind_all</code> 은 「창 어디에서든 이 키를 받겠다」 는 뜻이에요. 위로 갈 때 y 는 <b>줄어요</b>!', '⌨️'),
        box.console)));
    paint();
    box.run();
  },
};
