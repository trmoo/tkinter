/*! 🪟 창문 공방 — © 2026 티쳐무 · 모든 권리 보유
 *  2차시 — 온도 변환기 다섯 단계 (교재 6절). 과학 선생님의 의뢰를 한 단계씩 키운다.
 *    1 위젯만 놓기(pack 의 한계) → 2 grid 로 정리 → 3 단추와 함수 잇기 → 4 실제로 계산(212 · 32 · 98.6 자동 검사) → 5 꾸미기
 */
import { h, fill, toast } from '../ui/dom.js';
import { story, tip, checklist, finish, runBox, choose, picked, hints } from './kit.js';
import { card, setCard } from '../store.js';
import { MISSIONS2, step2Check } from '../data/missions2.js';
import { previewOf } from '../tk/preview.js';

const STEPS = ['위젯 놓기', 'grid 정리', '단추 잇기', '계산하기', '꾸미기'];
const flags = (cid) => card(cid).flags || {};
const setFlag = (cid, k) => { if (!flags(cid)[k]) setCard(cid, { flags: { ...flags(cid), [k]: true } }); };

/** 단계 막대 — 지금 단계를 가운데에, 누르면 그 단계 카드로 */
function stepBar(api, now) {
  return h('div', { class: 'steps5' }, ...STEPS.map((s, i) => h('button', {
    class: 'st5' + (i + 1 === now ? ' on' : '') + (card(`temp${i + 1}`) && flags(`temp${i + 1}`).done ? ' done' : ''),
    onClick: () => api.go(api.index + (i + 1 - now)),
  }, h('b', {}, `${i + 1}단계`), ` ${s}`)));
}
/** 앞 단계에서 내가 쓴 코드 가져오기 */
function importBtn(box, now) {
  const prev = card(`temp${now - 1}`).code;
  return h('button', { class: 'btn small', title: '앞 단계 카드의 편집기에 쓴 코드를 그대로 가져옵니다', onClick: () => {
    if (!prev) { toast(`${now - 1}단계 카드에서 쓴 코드가 아직 없어요`); return; }
    box.run(prev);
    toast(`⤵ ${now - 1}단계의 내 코드를 가져왔어요`);
  } }, `⤵ ${now - 1}단계 코드 가져오기`);
}
const client = (html) => story(html, '👩‍🔬');
const done = (api, cid, msg) => { setFlag(cid, 'done'); finish(api, cid, msg); };

/* ── 1단계 ── */
export const temp1Card = {
  id: 'temp1', chapter: 's2', title: '🌡 온도 변환기 1 — 위젯만 놓아 보기',
  render(body, api) {
    const cid = 'temp1';
    const checks = h('div');
    const paint = (p) => {
      if (p && p.state === 'loop') setFlag(cid, 'ran');
      const items = [
        { ok: flags(cid).ran || null, label: '▶ 실행해서 창을 띄운다' },
        { ok: picked(cid, 'q') === 0 || null, label: '무엇이 불편한지 고른다' },
      ];
      fill(checks, checklist(items));
      if (items.every((x) => x.ok)) done(api, cid, '1단계 — pack 의 한계를 찾았어요!');
    };
    const box = runBox({ cid, starter: MISSIONS2.temp1.starter, model: MISSIONS2.temp1.model, rows: 16, onRun: paint });
    const q = choose({
      q: '실행해 보니 무엇이 불편한가요?',
      choices: ['어느 입력 칸이 화씨이고 어느 칸이 섭씨인지 알기 어렵다', '단추가 창에 보이지 않는다', '오류가 나서 창이 뜨지 않는다'],
      answer: 0, why: '<code>pack()</code> 은 위젯을 한 줄로 차곡차곡 쌓기만 해서, 이름표와 입력 칸이 짝지어 보이지 않아요. 2단계에서 <code>grid</code> 로 정리해요.',
      save: [cid, 'q'], onPick: () => paint(box.program),
    });
    fill(body, stepBar(api, 1), h('div', { class: 'lab' },
      h('div', { class: 'col tight' },
        client('「5장에서 콘솔로 만든 온도 변환기를 <b>창이 있는 프로그램</b>으로 만들어 주세요. 한꺼번에 말고 다섯 단계로요!」'),
        box.editor),
      h('div', { class: 'right' }, box.desk, box.tools, q, checks)));
    paint(null);
    box.run();
  },
};

/* ── 2단계 ── */
export const temp2Card = {
  id: 'temp2', chapter: 's2', title: '🌡 온도 변환기 2 — grid 로 표처럼',
  render(body, api) {
    const cid = 'temp2';
    const m = MISSIONS2.temp2;
    const goal = previewOf(m.model).model;
    const checks = h('div');
    let ghost = false;
    const paint = (p) => {
      const items = step2Check(p);
      fill(checks, checklist(items));
      if (items.every((x) => x.ok)) done(api, cid, '2단계 — 칸이 있는 화면에는 grid!');
    };
    const box = runBox({
      cid, starter: m.starter, model: m.model, rows: 15, onRun: paint, xray: true,
      extraBtns: [h('button', { class: 'btn small', onClick: (e) => { ghost = !ghost; box.deskApi.setTarget(ghost ? goal : null); e.currentTarget.classList.toggle('primary', ghost); } }, '👻 목표 겹쳐 보기')],
    });
    fill(body, stepBar(api, 2), h('div', { class: 'lab' },
      h('div', { class: 'col tight' },
        client('「이름표와 입력 칸이 <b>나란히</b> 있으면 좋겠어요. 단추는 맨 아래 가운데에요.」 — <code>pack()</code> 을 <code>grid(row=…, column=…)</code> 로 바꿔 보세요.'),
        box.editor, checks),
      h('div', { class: 'right' }, box.desk, box.tools,
        hints([
          '「화씨」 는 0번 줄 0번 칸, 입력 칸 e1 은 0번 줄 1번 칸이에요.',
          '<code>Label(window, text="화씨").grid(row=0, column=0)</code> — 만들면서 바로 놓을 수도 있어요.',
          '단추는 2번 줄에서 두 칸에 걸쳐 — <code>b1.grid(row=2, column=0, columnspan=2)</code>',
        ], { cid }),
        box.console)));
    paint(null);
    box.run();
  },
};

/* ── 3단계 ── */
export const temp3Card = {
  id: 'temp3', chapter: 's2', title: '🌡 온도 변환기 3 — 단추와 함수 잇기',
  render(body, api) {
    const cid = 'temp3';
    const m = MISSIONS2.temp3;
    const checks = h('div');
    let auto = null;
    const paint = () => {
      const items = [
        auto ? auto[0] : { ok: flags(cid).pass || null, label: '단추를 누르면 섭씨 칸에 「여기에 결과가 들어갑니다」 (🧪 자동 검사)' },
        { ok: flags(cid).dup || null, label: '단추를 <b>세 번</b> 눌러 본다 — 섭씨 칸이 어떻게 되나요?',
          why: flags(cid).dup ? '글자가 계속 앞에 덧붙어요! insert 는 지우지 않고 끼워 넣기만 해요. 4단계에서 고쳐요.' : '' },
      ];
      if (auto && auto[0].ok) setFlag(cid, 'pass');
      if (flags(cid).pass) items[0] = { ...items[0], ok: true };
      fill(checks, checklist(items));
      if (items.every((x) => x.ok)) done(api, cid, '3단계 — 단추와 함수가 이어졌어요!');
    };
    const look = (p) => {
      const e2 = [...p.app.widgets.values()].filter((w) => w.kind === 'Entry' && w.alive)[1];
      if (e2 && (e2.text.match(/여기에 결과가 들어갑니다/g) || []).length >= 3) setFlag(cid, 'dup');
      paint();
    };
    const imp = h('span');   // 「앞 단계 코드 가져오기」 단추는 실행 상자가 만들어진 뒤에 채운다
    const box = runBox({
      cid, starter: m.starter, model: m.model, rows: 17, onRun: look, onEvent: look,
      extraBtns: [h('button', { class: 'btn small primary', onClick: () => { auto = m.check(box.ed.value); paint(); } }, '🧪 자동 검사'), imp],
    });
    fill(imp, importBtn(box, 3));
    fill(body, stepBar(api, 3), h('div', { class: 'lab' },
      h('div', { class: 'col tight' },
        client('「단추를 누르면 무슨 일이 일어나야겠죠? 아직 계산은 말고, 단추와 함수가 <b>이어졌는지</b>만 확인해요.」'),
        box.editor, checks),
      h('div', { class: 'right' }, box.desk, box.tools,
        tip('할 일 둘 — 1. 함수 안에서 <code>e2.insert(0, "여기에 결과가 들어갑니다")</code> 2. 단추에 <code>command=process</code>. <code>insert(0, 글자)</code> 는 입력 칸의 0번 자리에 글자를 끼워 넣어요.', '🔗'),
        box.console)));
    paint();
    box.run();
  },
};

/* ── 4단계 ── */
export const temp4Card = {
  id: 'temp4', chapter: 's2', title: '🌡 온도 변환기 4 — 진짜로 계산하기',
  render(body, api) {
    const cid = 'temp4';
    const m = MISSIONS2.temp4;
    const checks = h('div');
    const paint = (auto) => {
      const items = auto || [{ ok: flags(cid).pass || null, label: '🧪 자동 검사 — 212 · 32 · 98.6 을 차례로 넣고 단추를 눌러 봐요' }];
      if (auto && auto.every((x) => x.ok)) setFlag(cid, 'pass');
      fill(checks, checklist(items, { title: '🧪 자동 검사 — 같은 창에서 셋을 차례로' }));
      if (flags(cid).pass) done(api, cid, '4단계 — 진짜 온도 변환기가 됐어요!');
    };
    const box = runBox({
      cid, starter: m.starter, model: m.model, rows: 17,
      extraBtns: [h('button', { class: 'btn small primary', onClick: () => paint(m.check(box.ed.value)) }, '🧪 자동 검사')],
    });
    fill(body, stepBar(api, 4), h('div', { class: 'lab' },
      h('div', { class: 'col tight' },
        client('「이제 진짜로 계산해 주세요. <b>섭씨 = (화씨 − 32) × 5 ÷ 9</b> — 98.6 도는 꼭 37 도가 나와야 해요!」 빈칸 두 곳을 채우세요.'),
        box.editor, checks),
      h('div', { class: 'right' }, box.desk, box.tools,
        hints([
          '<code>e1.get()</code> 은 글자예요. 98.6 처럼 소수일 수 있으니 <code>float( )</code> 로 바꿔요.',
          '괄호가 중요해요 — <code>(fahrenheit - 32) * 5 / 9</code>. 괄호가 없으면 <code>32 * 5 / 9</code> 를 먼저 계산해요.',
          '<code>e2.delete(0, END)</code> 를 지우면 어떻게 될까요? 3단계에서 본 「덧붙기」 가 다시 나타나요.',
        ], { cid }),
        box.console)));
    paint();
    box.run();
  },
};

/* ── 5단계 ── */
export const temp5Card = {
  id: 'temp5', chapter: 's2', title: '🌡 온도 변환기 5 — 색과 폰트로 꾸미기',
  render(body, api) {
    const cid = 'temp5';
    const m = MISSIONS2.temp5;
    const checks = h('div');
    let ghost = false;
    const goal = previewOf(m.model).model;
    const paint = (auto) => {
      if (auto && auto.every((x) => x.ok)) setFlag(cid, 'pass');
      fill(checks, checklist(auto || [{ ok: flags(cid).pass || null, label: '꾸미고 나서 🧪 자동 검사' }]));
      if (flags(cid).pass) done(api, cid, '온도 변환기 완성! 과학 선생님이 기뻐하세요.');
    };
    const imp = h('span');
    const box = runBox({
      cid, starter: m.starter, model: m.model, rows: 17,
      extraBtns: [h('button', { class: 'btn small primary', onClick: () => paint(m.check(box.ed.value)) }, '🧪 자동 검사'),
        h('button', { class: 'btn small', onClick: (e) => { ghost = !ghost; box.deskApi.setTarget(ghost ? goal : null); e.currentTarget.classList.toggle('primary', ghost); } }, '👻 교재 모양'), imp],
    });
    fill(imp, importBtn(box, 5));
    fill(body, stepBar(api, 5), h('div', { class: 'lab' },
      h('div', { class: 'col tight' },
        client('「마지막이에요! 제목을 붙이고 색과 폰트로 꾸며 주세요. 단, <b>계산은 그대로</b>여야 해요.」 — 교재 모양을 따라 해도, 내 마음대로 꾸며도 좋아요.'),
        box.editor, checks),
      h('div', { class: 'right' }, box.desk, box.tools,
        h('div', { class: 'note-box', html: '<b>콘솔 버전과 무엇이 달라졌나</b> — 계산하는 줄 <code>(fahrenheit - 32) * 5 / 9</code> 는 똑같아요. 달라진 것은 값을 <b>받고 보여 주는 방법</b>뿐 — <code>input()</code> · <code>print()</code> 대신 <code>get()</code> · <code>insert()</code>. 계산과 보여 주기를 나누어 생각하면 어떤 프로그램이든 GUI 로 바꿀 수 있어요.' }),
        box.console)));
    paint();
    box.run();
  },
};
