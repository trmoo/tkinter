/*! 🪟 창문 공방 — © 2026 티쳐무 · 모든 권리 보유
 *  2차시 — 「16진수 색과 폰트」(교재 7절) · 「여러 개 중에서 고르기」(교재 8절) · 「의뢰 2 코딩 동아리 신청서」 · 「확인 문제」
 */
import { h, fill } from '../ui/dom.js';
import { windowPicture } from '../ui/window.js';
import { varBox } from '../ui/varbox.js';
import { story, tip, checklist, finish, runBox, choose, picked, pills, hints } from './kit.js';
import { card, setCard } from '../store.js';
import { MISSIONS2, ORDER2, order2Run } from '../data/missions2.js';
import { snapOf } from '../data/missions.js';
import { previewOf, compareWindows } from '../tk/preview.js';
import { QUIZ2, REFLECT2 } from '../data/quiz.js';

const flags = (cid) => card(cid).flags || {};
const setFlag = (cid, k) => { if (!flags(cid)[k]) setCard(cid, { flags: { ...flags(cid), [k]: true } }); };
const hex2 = (n) => n.toString(16).padStart(2, '0').toUpperCase();

/* ════════ 16진수 색과 폰트 ════════ */
export const colorCard = {
  id: 'color', chapter: 's2', title: '🎨 16진수 색과 폰트',
  render(body, api) {
    const cid = 'color';
    const m = MISSIONS2.rainbow;
    const checks = h('div');
    let last = null;
    const rgb = card(cid).rgb || [255, 136, 0];
    const hexOf = () => `#${rgb.map(hex2).join('')}`;
    const paint = () => {
      const items = [
        { ok: flags(cid).mixed || null, label: '색 섞기 판으로 내 색을 만든다' },
        ...m.check(last).map((x) => (last ? x : { ...x, ok: null })),
        { ok: picked(cid, 'font') === 2 || null, label: '폰트 문제를 맞힌다' },
      ];
      fill(checks, checklist(items));
      if (items.every((x) => x.ok)) finish(api, cid, '색을 16진수로 섞어 쓸 수 있어요!');
    };
    const box = runBox({ cid, starter: m.starter, model: m.model, rows: 10, onRun: (p) => { last = p; paint(); } });
    const swatch = h('div', { class: 'swatch' });
    const paintSwatch = () => {
      const c = hexOf();
      swatch.style.background = c;
      const light = rgb[0] * 0.3 + rgb[1] * 0.59 + rgb[2] * 0.11 > 150;
      swatch.style.color = light ? '#000' : '#fff';
      swatch.textContent = c;
    };
    const slider = (i, name, color) => {
      const out = h('output', {}, String(rgb[i]));
      return h('label', {}, h('span', { style: { color, width: '1.2em' } }, name),
        h('input', { type: 'range', min: 0, max: 255, value: rgb[i], 'aria-label': name, onInput: (e) => {
          rgb[i] = Number(e.target.value); out.textContent = String(rgb[i]); paintSwatch(); setCard(cid, { rgb }); setFlag(cid, 'mixed');
        } }), out);
    };
    const addBtn = h('button', { class: 'btn small primary', onClick: () => {
      // 편집기의 colors 리스트 맨 끝에 지금 색을 넣고 다시 실행한다
      const code = box.ed.value;
      const next = code.replace(/(colors\s*=\s*\[[^\]]*?)(\s*\])/, (all, a, b) => `${a}, "${hexOf()}"${b}`);
      setFlag(cid, 'mixed');
      box.run(next);
      paint();
    } }, '➕ 이 색을 colors 리스트에 넣기');
    paintSwatch();
    const fontQ = choose({
      q: '폰트를 <b>잘못</b> 준 것은?',
      choices: ['<code>font="helvetica 16 bold"</code>', '<code>font=("helvetica", 16, "bold")</code>', '<code>font="맑은 고딕 16 bold"</code>', '<code>font=("맑은 고딕", 16, "bold")</code>'],
      answer: 2, why: '글자로 줄 때는 빈칸으로 낱말을 나눠요. 「맑은 고딕」 은 빈칸이 있어서 「고딕」 이 크기 자리로 읽혀 <code>TclError: expected integer but got "고딕"</code>. 이름에 빈칸이 있으면 <b>튜플</b>로 줘요.',
      save: [cid, 'font'], onPick: () => paint(),
    });
    fill(body, h('div', { class: 'lab l46' },
      h('div', { class: 'col tight' },
        story('색은 이름(<code>"orange"</code>)뿐 아니라 <b>빛의 세 가지 색 — 빨강(R) · 초록(G) · 파랑(B)</b> 을 섞어 <code>"#FF8800"</code> 처럼 16진수로도 줄 수 있어요. 두 자리씩 R · G · B, 00(없음) ~ FF(가장 밝게).', '🎨'),
        h('div', { class: 'mixer' }, h('div', { class: 'col tight' }, slider(0, 'R', '#e5484d'), slider(1, 'G', '#1f9d55'), slider(2, 'B', '#2f6fe4')), swatch),
        h('div', { class: 'row' }, addBtn, h('span', { class: 'small muted' }, '리스트에 한 낱말만 더하면 반복문이 단추를 하나 더 만들어요')),
        fontQ, checks),
      h('div', { class: 'right' }, box.desk, box.tools, box.editor)));
    paint();
    box.run();
  },
};

/* ════════ 여러 개 중에서 고르기 ════════ */
export const chooseCard = {
  id: 'choose', chapter: 's2', title: '☑ 여러 개 중에서 고르기 — 라디오 · 체크 · 목록',
  render(body, api) {
    const cid = 'choose';
    const tab = card(cid).tab || 'radio';
    const f = () => flags(cid);
    const tabDone = { radio: () => f().radioShow && f().radioMulti, check: () => f().checkBoth, list: () => f().list };
    const maybe = () => { if (Object.values(tabDone).every((g) => g())) finish(api, cid, '고르는 위젯 셋을 모두 써 봤어요!'); };
    const head = pills([
      { id: 'radio', label: '🔘 라디오 — 하나만', done: tabDone.radio() },
      { id: 'check', label: '☑ 체크 — 여러 개', done: tabDone.check() },
      { id: 'list', label: '📋 목록(Listbox)', done: tabDone.list() },
    ], tab, (id) => { setCard(cid, { tab: id }); api.go(api.index); });
    const checks = h('div');
    const vars = h('div', {}, varBox(null));
    const SET = {
      radio: { m: MISSIONS2.radio, story: '라디오 단추를 하나 고르고 <b>확인</b>을 눌러 보세요. 고를 때마다 📦 변수 상자의 <code>choice</code> 가 어떻게 바뀌나요?',
        tip: '세 단추가 <b>같은 변수</b>(<code>variable=choice</code>)를 가리키므로 하나를 고르면 나머지는 저절로 풀려요. <code>value=1</code> 은 그 단추를 고르면 변수에 들어갈 값이에요.',
        items: () => [
          { ok: f().radioShow || null, label: '하나를 고르고 확인 → 「고른 번호: …」' },
          { ok: f().radioMulti || null, label: '「C」 의 <code>variable=choice</code> 를 <code>variable=IntVar()</code> 로 바꿔 실행 — 두 개가 함께 켜지나요?',
            why: f().radioMulti ? '변수가 따로라서 서로를 풀어 주지 못해요. 라디오 단추는 꼭 같은 변수를!' : '' },
        ] },
      check: { m: MISSIONS2.check, story: '체크 단추는 <b>각각 다른 변수</b>를 써요. 둘 다 켜 보고 📦 변수 상자의 <code>v1</code> · <code>v2</code> 를 보세요.',
        tip: '켜면 1, 끄면 0 (<code>onvalue</code> · <code>offvalue</code> 의 기본값). 라디오 단추와 반대로, 변수가 따로라서 여러 개를 함께 켤 수 있어요.',
        items: () => [{ ok: f().checkBoth || null, label: '「Python」 과 「C」 를 둘 다 켠다 — 변수 상자에서 둘 다 1' }] },
      list: { m: MISSIONS2.listbox, story: '<code>Listbox</code> 는 여러 줄 목록이에요. <code>insert(END, 글자)</code> 는 리스트의 <code>append()</code> 처럼 맨 끝에 넣어요. 목록에 「Kotlin」 을 더해 보세요.',
        tip: '<code>END</code> 는 「맨 끝에」. <code>lb.get(0)</code> 은 0번 줄의 글자, <code>lb.curselection()</code> 은 고른 줄의 번호들이에요.',
        items: (p) => MISSIONS2.listbox.check(p) },
    }[tab];
    let last = null;
    const paint = () => {
      const items = SET.items(last).map((x) => (tab === 'list' && !last ? { ...x, ok: null } : x));
      fill(checks, checklist(items));
      fill(vars, varBox(last));
      maybe();
    };
    const look = (p) => {
      last = p;
      if (tab === 'radio') {
        const shown = [...p.app.widgets.values()].some((w) => w.alive && w.kind === 'Label' && /^고른 번호: [1-9]/.test(w.shownText));
        if (shown) setFlag(cid, 'radioShow');
        const on = [...p.app.widgets.values()].filter((w) => w.alive && w.kind === 'Radiobutton' && w.selected).length;
        if (on >= 2) setFlag(cid, 'radioMulti');
      }
      if (tab === 'check') {
        const on = [...p.app.widgets.values()].filter((w) => w.alive && w.kind === 'Checkbutton' && w.selected).length;
        if (on >= 2) setFlag(cid, 'checkBoth');
      }
      if (tab === 'list' && MISSIONS2.listbox.check(p).every((x) => x.ok)) setFlag(cid, 'list');
      paint();
    };
    const box = runBox({ cid, key: `code_${tab}`, starter: SET.m.starter, model: SET.m.model, rows: 13, onRun: look, onEvent: look });
    fill(body, head, h('div', { class: 'lab' },
      h('div', { class: 'col tight' }, story(SET.story, '☑'), box.editor, tip(SET.tip, '📦')),
      h('div', { class: 'right' }, box.desk, box.tools, vars, checks, box.console)));
    paint();
    box.run();
  },
};

/* ════════ 의뢰 2 — 코딩 동아리 신청서 ════════ */
export const order2Card = {
  id: 'order2', chapter: 's2', title: '📮 의뢰 2 — 코딩 동아리 신청서',
  render(body, api) {
    const cid = 'order2';
    const goal = previewOf(ORDER2.target);
    const result = h('div', { class: 'order-card' });
    let ghost = false;
    let runs = null;
    const paint = (p) => {
      const r = compareWindows(snapOf(p), goal.snap);
      const behave = runs ? runs.every((x) => x.ok) : !!flags(cid).behave;
      if (runs && behave) setFlag(cid, 'behave');
      fill(result,
        h('div', { class: 'stars' },
          h('span', { class: 'star' + (r.stars.widgets ? ' on' : '') }, `${r.stars.widgets ? '★' : '☆'} 위젯`),
          h('span', { class: 'star' + (r.stars.layout ? ' on' : '') }, `${r.stars.layout ? '★' : '☆'} 배치`),
          h('span', { class: 'star' + (behave ? ' on' : '') }, `${behave ? '★' : '☆'} 동작`),
          h('span', { style: { marginLeft: 'auto' }, class: 'small muted' }, '닮은 정도'),
          h('span', { class: 'sim' }, `${r.similarity}%`)),
        r.notes.length ? h('ul', { class: 'notes' }, ...r.notes.slice(0, 3).map((n) => h('li', {}, n))) : null,
        runs ? checklist(runs, { title: '🧪 동작 검사 — 쓰고 · 고르고 · 누르기' }) : h('div', { class: 'small muted' }, '위젯을 다 놓았으면 🧪 동작 검사를 눌러 보세요.'));
      if (r.stars.widgets && r.stars.layout && behave) finish(api, cid, '동아리 회장이 신청서를 받아 갔어요!');
    };
    const box = runBox({
      cid, starter: ORDER2.starter, model: ORDER2.target, rows: 20, onRun: (p) => { runs = null; paint(p); },
      extraBtns: [
        h('button', { class: 'btn small primary', onClick: () => { runs = order2Run(box.ed.value); paint(box.program); } }, '🧪 동작 검사'),
        h('button', { class: 'btn small', onClick: (e) => { ghost = !ghost; box.deskApi.setTarget(ghost ? goal.model : null); e.currentTarget.classList.toggle('primary', ghost); } }, '👻 겹쳐 보기'),
      ],
    });
    fill(body, h('div', { class: 'lab l36' },
      h('div', { class: 'col tight' },
        story('「동아리 신청을 받는 창을 만들어 주세요. 이름을 쓰고, 학년을 하나 고르고, 관심 분야는 여러 개 골라요. <b>신청하기</b>를 누르면 아래에 결과가 나와야 해요.」', '🧑‍💻'),
        h('div', { class: 'row', style: { justifyContent: 'center' } }, windowPicture(goal.model, { scale: 0.92 })),
        h('ul', { class: 'req' },
          h('li', { html: '학년은 라디오 단추 셋 — <b>같은 IntVar</b>, value 는 1 · 2 · 3' }),
          h('li', { html: '관심 분야는 체크 단추 셋 — <b>각각 다른 IntVar</b>' }),
          h('li', { html: '신청하기 → <code>김여름님, 2학년 · 관심 분야 2개 신청 완료!</code>' })),
        hints([
          '줄 0~4, 칸 0~3 의 grid 예요. 이름 칸 · 단추 · 결과 라벨은 <code>columnspan=4</code>.',
          '켠 체크 단추의 수 = <code>web.get() + game.get() + ai.get()</code> (켜면 1, 끄면 0).',
          '<code>result["text"] = name.get() + "님, " + str(grade.get()) + "학년 · 관심 분야 " + str(count) + "개 신청 완료!"</code>',
        ], { cid })),
      h('div', { class: 'right' },
        h('div', { class: 'lab l50', style: { flex: '1' } },
          h('div', { class: 'col tight' }, box.editor),
          h('div', { class: 'col tight' }, box.desk, box.tools)),
        result, box.console)));
    paint(null);
    box.run();
  },
};

/* ════════ 확인 문제 · 오늘 배운 것 ════════ */
export const wrap2Card = {
  id: 'wrap2', chapter: 's2', title: '✅ 2차시 확인 문제 · 오늘 배운 것',
  render(body, api) {
    const cid = 'wrap2';
    const check = () => {
      if (QUIZ2.every((q, i) => picked(cid, `q${i}`) === q.answer)) finish(api, cid, '2차시를 마쳤어요! 다음 시간에는 그림을 그리고 마우스·키보드로 움직여요.');
    };
    const page = card(cid).page || 0;
    const PAGES = [[0, 1], [2, 3], [4, 5]];
    const short = (q) => q.choices.every((c) => c.replace(/<[^>]+>/g, '').length <= 30);
    const solved = (i) => picked(cid, `q${i}`) === QUIZ2[i].answer;
    const tabs = pills(PAGES.map((list, k) => ({ id: k, label: `문제 ${list[0] + 1}~${list[list.length - 1] + 1}`, done: list.every(solved) })),
      page, (k) => { setCard(cid, { page: k }); api.go(api.index); });
    const quiz = h('div', { class: 'quiz-grid' }, ...PAGES[page].map((i) => choose({
      q: `${i + 1}. ${QUIZ2[i].q}`, choices: QUIZ2[i].choices, answer: QUIZ2[i].answer, why: QUIZ2[i].why, save: [cid, `q${i}`],
      onPick: check, cls: short(QUIZ2[i]) ? 'compact' : '',
    })));
    const notes = card(cid).notes || {};
    const reflect = h('div', { class: 'reflect' },
      h('div', { class: 'mini-title' }, '📝 오늘 배운 것 — 내 말로 한 문장씩 (이 컴퓨터에만 남아요)'),
      ...REFLECT2.map((r, i) => h('div', {},
        h('div', { class: 'q' }, r.q),
        h('textarea', { 'aria-label': r.q, onKeydown: (e) => e.stopPropagation(), onInput: (e) => { notes[i] = e.target.value; setCard(cid, { notes }); } }, notes[i] || ''),
        h('div', { class: 'clue' }, `실마리 낱말: ${r.clue}`))));
    fill(body, h('div', { class: 'lab', style: { gridTemplateColumns: '62% 1fr' } },
      h('div', { class: 'col tight' }, tabs, quiz),
      h('div', { class: 'col tight' }, reflect,
        tip('다음 시간에는 <b>캔버스에 그림을 그리고</b> 마우스 · 키보드로 움직여요 — 그림판과 미니게임을 만들어요.', '⏭'),
        h('p', { class: 'start-copy' }, '© 2026 티쳐무 · 모든 권리 보유 · 학교 수업 목적으로만 이용해 주세요'))));
    check();
  },
};
