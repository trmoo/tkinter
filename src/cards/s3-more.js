/*! 🪟 창문 공방 — © 2026 티쳐무 · 모든 권리 보유
 *  3차시 — 정리하고 완성하기 (교재 11 · 12절)
 *    클래스로 정리(계수기) · 숫자 맞추기 GUI · 계산기(lambda k=key · eval) · 버그 병원 · 확인 문제 · 오늘 만든 코드 모아 받기
 */
import { h, fill, toast } from '../ui/dom.js';
import { story, tip, checklist, finish, runBox, choose, picked, pills, solvedQ } from './kit.js';
import { card, setCard, S } from '../store.js';
import { COUNTER_G, COUNTER_C, COUNTER_STEPS, counterCheck, GUESS, CALC, calcMap, CLINIC } from '../data/missions3.js';
import { QUIZ3, REFLECT3 } from '../data/quiz.js';
import { makeZip } from '../ui/zip.js';

const flags = (cid) => card(cid).flags || {};
const setFlag = (cid, k) => { if (!flags(cid)[k]) setCard(cid, { flags: { ...flags(cid), [k]: true } }); };
const autoBtn = (fn, label = '🧪 자동 검사') => h('button', { class: 'btn small primary', onClick: fn }, label);

/* ════════ 클래스로 정리 — 계수기 ════════ */
export const classCard = {
  id: 'classgui', chapter: 's3', title: '🧩 클래스로 정리 — 계수기',
  render(body, api) {
    const cid = 'classgui';
    const tab = card(cid).tab || 'g';
    const done = { g: () => flags(cid).saw && flags(cid).gpass, c: () => flags(cid).cpass };
    const head = pills([{ id: 'g', label: '🌐 global 판', done: done.g() }, { id: 'c', label: '🧩 클래스 판', done: done.c() }],
      tab, (id) => { setCard(cid, { tab: id }); api.go(api.index); });
    const checks = h('div');
    let auto = null;
    const paint = () => {
      if (auto && auto.every((x) => x.ok)) setFlag(cid, tab === 'g' ? 'gpass' : 'cpass');
      const items = tab === 'g'
        ? [{ ok: flags(cid).saw || null, label: '그대로 실행해 [+1] 을 눌러 본다 — 무엇이 나오나요?', why: flags(cid).saw ? 'UnboundLocalError — 함수 안에서 count 에 값을 넣으니 파이썬이 「함수만의 변수」 로 봤어요.' : '' },
          ...(auto || [{ ok: flags(cid).gpass || null, label: '두 함수에 <code>global count</code> 를 넣고 🧪 자동 검사 (+1 셋 → 초기화 → +1)' }])]
        : (auto || [{ ok: flags(cid).cpass || null, label: '<code>minus</code> 메서드와 [-1] 단추를 더하고 🧪 자동 검사' }]);
      fill(checks, checklist(items));
      if (done.g() && done.c()) finish(api, cid, 'global 없이 클래스로 정리했어요!');
    };
    const look = (p) => { if (p.cbErrors.some((e) => /UnboundLocalError/.test(e.last))) setFlag(cid, 'saw'); paint(); };
    const m = tab === 'g' ? COUNTER_G : COUNTER_C;
    const steps = tab === 'g' ? COUNTER_STEPS.g : COUNTER_STEPS.c;
    const box = runBox({ cid, key: `code_${tab}`, starter: m.starter, model: m.model, rows: tab === 'g' ? 19 : 22, onRun: look, onEvent: look,
      extraBtns: [autoBtn(() => { auto = counterCheck(box.ed.value, steps); paint(); })] });
    fill(body, head, h('div', { class: 'lab' },
      h('div', { class: 'col tight' },
        story(tab === 'g'
          ? '교재 확인 문제 18번의 계수기예요. 그런데 <code>global count</code> 가 빠졌어요. 실행해서 [+1] 을 눌러 보세요.'
          : '같은 계수기를 <b>클래스</b>로 묶었어요(교재 11절). 상태는 <code>self.count</code> 라는 속성으로 들고 있어서 <code>global</code> 이 하나도 없어요. [-1] 단추를 더해 보세요.', tab === 'g' ? '🌐' : '🧩'),
        box.editor),
      h('div', { class: 'right' }, box.desk, box.tools, checks,
        tab === 'g'
          ? tip('⚠ <b>초기화의 함정</b> — <code>reset()</code> 에만 global 을 빠뜨리면 오류가 안 나요! 라벨은 0 이 되지만 바깥의 count 는 그대로라, 다시 [+1] 을 누르면 4 가 나와요.', '🕳')
          : h('div', { class: 'note-box', html: '<b>클래스로 쓰면 좋은 점</b> — 상태는 <code>self.count</code> 처럼 객체의 속성, 위젯도 <code>self.label</code> 로 두어 어느 메서드에서나 써요. <code>command=self.plus</code> — 메서드도 괄호 없이 이름만!' }),
        box.console)));
    paint();
    box.run();
  },
};

/* ════════ 숫자 맞추기 GUI ════════ */
export const guessCard = {
  id: 'guessgui', chapter: 's3', title: '🎲 숫자 맞추기 GUI — 몇 번 만에?',
  render(body, api) {
    const cid = 'guessgui';
    const checks = h('div');
    let auto = null;
    const paint = () => {
      if (auto && auto.every((x) => x.ok)) setFlag(cid, 'pass');
      const items = [
        { ok: flags(cid).won || null, label: '창에서 게임을 해서 정답을 맞힌다' },
        { ok: solvedQ(cid, 'q', 1) || null, label: '콘솔판과 견주는 문제를 맞힌다' },
        ...(auto || [{ ok: flags(cid).pass || null, label: '시도 횟수를 세어 「정답입니다! N번 만에 맞혔어요」 — 🧪 자동 검사(컴퓨터가 반씩 나눠 찾아 끝까지 해 봐요)' }]),
      ];
      fill(checks, checklist(items));
      if (flags(cid).won && solvedQ(cid, 'q', 1) && flags(cid).pass) finish(api, cid, '게임에 점수판을 달았어요!');
    };
    const look = (p) => {
      if ([...p.app.widgets.values()].some((w) => w.alive && w.kind === 'Label' && w.shownText.startsWith('정답'))) setFlag(cid, 'won');
      paint();
    };
    const box = runBox({ cid, starter: GUESS.starter, model: GUESS.model, rows: 14, onRun: look, onEvent: look,
      extraBtns: [autoBtn(() => { auto = GUESS.check(box.ed.value); paint(); })] });
    const q = choose({
      q: '8장의 콘솔판은 <code>while True</code> 로 되풀이했어요. 창판에는 반복문이 없는데 어떻게 계속 받을까요?',
      choices: ['guessing( ) 이 자기 자신을 다시 부른다', 'mainloop( ) 가 기다리다가, [시도] 를 누를 때마다 guessing( ) 을 한 번씩 부른다', 'Entry 가 숫자를 저절로 되풀이해 읽는다'],
      answer: 1, why: '<code>mainloop()</code> 가 반복을 대신해요. 공방 문을 열 때(첫 카드) 본 그 비밀이에요.', save: [cid, 'q'], onPick: () => paint(),
    });
    fill(body, h('div', { class: 'lab' },
      h('div', { class: 'col tight' },
        story('교재 12절의 숫자 맞추기 GUI 예요. 먼저 한 판 해 보고, 몇 번 만에 맞혔는지 알려 주도록 바꿔 보세요. 시도 횟수 <code>tries</code> 를 세려면 — 함수 밖 변수이니 무엇이 필요할까요?', '🎲'),
        box.editor, q),
      h('div', { class: 'right' }, box.desk, box.tools, checks, box.console)));
    paint();
    box.run();
  },
};

/* ════════ 계산기 ════════ */
export const calcCard = {
  id: 'calc', chapter: 's3', title: '🧮 계산기 — 단추 20개와 lambda',
  render(body, api) {
    const cid = 'calc';
    const checks = h('div');
    const map = h('div', { class: 'keymap' }, h('span', { class: 'small muted' }, '「🔍 단추 엑스레이」 를 누르면 단추마다 무엇이 들어가는지 보여요.'));
    let auto = null;
    const paint = () => {
      if (auto && auto.every((x) => x.ok) && flags(cid).same) setFlag(cid, 'fixed');
      const items = [
        { ok: flags(cid).used || null, label: '창에서 계산해 본다 — <code>7 * 8 =</code>' },
        { ok: flags(cid).same || null, label: '<code>lambda k=key: click(k)</code> 를 <code>lambda: click(key)</code> 로 바꿔 🔍 단추 엑스레이',
          why: flags(cid).same ? '단추 20개가 모두 마지막 글자 「 」(빈칸)를 넣어요! lambda 는 key 를 「나중에」 찾아보는데, 그때 key 는 반복문이 끝난 마지막 값이에요.' : '' },
        ...(auto || [{ ok: flags(cid).fixed || null, label: '다시 <code>k=key</code> 로 되돌리고 🧪 자동 검사 (7*8 · 1/0 · 9−4)' }]),
      ];
      fill(checks, checklist(items));
      if (flags(cid).used && flags(cid).same && flags(cid).fixed) finish(api, cid, '계산기를 손에 넣었어요!');
    };
    const look = (p) => {
      const d = [...p.app.widgets.values()].find((w) => w.alive && w.kind === 'Entry');
      if (d && d.text === '56') setFlag(cid, 'used');
      paint();
    };
    const box = runBox({ cid, starter: CALC.starter, model: CALC.model, rows: 22, onRun: look, onEvent: look, extraBtns: [
      autoBtn(() => { auto = CALC.check(box.ed.value); paint(); }),
      h('button', { class: 'btn small', onClick: () => {
        const r = calcMap(box.ed.value);
        if (!r) { fill(map, h('span', { class: 'small', style: { color: 'var(--bad)' } }, '창이 뜨지 않아 볼 수 없어요')); return; }
        const same = r.every((x) => x.got === r[0].got);
        if (same) setFlag(cid, 'same');
        fill(map, ...r.map((x) => h('span', { class: 'km' + (x.got === x.label || x.label === 'C' || x.label === '=' ? '' : ' bad') },
          h('b', {}, x.label === ' ' ? '␣' : x.label), '→', h('code', {}, x.got === '' ? '(비움)' : x.got.replace(/ /g, '␣')))));
        paint();
      } }, '🔍 단추 엑스레이')] });
    fill(body, h('div', { class: 'lab' },
      h('div', { class: 'col tight' },
        story('리스트와 반복문으로 단추 20개를 한꺼번에 만들어요. <code>command</code> 에는 괄호 없는 이름만 줄 수 있어서, 값을 함께 넘기려면 <code>lambda k=key: click(k)</code> — 「눌리면 click(k) 를 실행하는 짧은 함수」 를 그 자리에서 만들어요.', '🧮'),
        box.editor),
      h('div', { class: 'right' }, box.desk, box.tools, map, checks,
        h('div', { class: 'warn-box', html: '⚠ <code>eval()</code> 은 글자를 <b>파이썬 코드로 그대로 실행</b>해요. 몇 줄로 계산기를 만들 수 있지만, 사용자가 아무 코드나 넣을 수 있다는 뜻이라 실제 프로그램에서는 쓰지 않는 것이 원칙이에요. 여기서는 원리를 보는 공부용!' }),
        box.console)));
    paint();
    box.run();
  },
};

/* ════════ 버그 병원 ════════ */
export const clinicCard = {
  id: 'clinic', chapter: 's3', title: '🏥 버그 병원 — 증상을 보고 고치기',
  render(body, api) {
    const cid = 'clinic';
    const cured = () => card(cid).cured || {};
    const now = card(cid).now || CLINIC[0].id;
    const pat = CLINIC.find((x) => x.id === now) || CLINIC[0];
    const head = pills(CLINIC.map((x, i) => ({ id: x.id, label: `${i + 1}. ${x.title}`, done: !!cured()[x.id] })), pat.id,
      (id) => { setCard(cid, { now: id }); api.go(api.index); });
    const checks = h('div');
    let fixed = null;
    const paint = () => {
      const diag = picked(cid, `d_${pat.id}`) === pat.answer;
      const ok = fixed ? fixed.ok : !!cured()[pat.id];
      if (diag && ok && !cured()[pat.id]) setCard(cid, { cured: { ...cured(), [pat.id]: true } });
      fill(checks, checklist([
        { ok: diag || null, label: '진찰 — 원인을 고른다' },
        { ok: ok || (fixed ? false : null), label: '치료 — 코드를 고치고 🩺 다 나았나 확인', why: fixed && !fixed.ok ? fixed.why : '' },
      ], { title: `🏥 ${Object.keys(cured()).length} / ${CLINIC.length} 명 나았어요` }));
      if (CLINIC.every((x) => cured()[x.id])) finish(api, cid, '버그 병원의 환자를 모두 고쳤어요!');
    };
    const box = runBox({ cid, key: `code_${pat.id}`, starter: pat.src, rows: 13,
      extraBtns: [autoBtn(() => { fixed = pat.fix(box.ed.value); paint(); }, '🩺 다 나았나 확인')] });
    const diag = choose({ q: '🩺 진찰 — 무엇이 원인일까요?', choices: pat.choices, answer: pat.answer, why: '맞아요! 이제 코드를 고쳐 보세요.',
      save: [cid, `d_${pat.id}`], onPick: () => paint() });
    fill(body, head, h('div', { class: 'lab' },
      h('div', { class: 'col tight' },
        story(`<b>증상</b> — ${pat.symptom} ▶ 실행해서 직접 증상을 확인해 보세요.`, '🤒'),
        box.editor, diag),
      h('div', { class: 'right' }, box.desk, box.tools, checks, box.console)));
    paint();
  },
};

/* ════════ 확인 문제 · 오늘 만든 코드 모아 받기 ════════ */
async function downloadAll() {
  const { CARDS } = await import('./index.js');
  const files = [];
  CARDS.forEach((c, i) => {
    const rec = S.cards[c.id] || {};
    const base = `${String(i).padStart(2, '0')}_${c.title.replace(/^[^가-힣A-Za-z0-9]+/, '').split(' — ')[0].replace(/[\\/:*?"<>|]/g, '').trim().replace(/\s+/g, '_')}`;
    const codes = Object.entries(rec).filter(([, v]) => typeof v === 'string' && /from tkinter import|import tkinter/.test(v));
    codes.forEach(([k, v], n) => files.push({ name: `${base}${codes.length > 1 ? `_${n + 1}` : ''}.py`, text: v.replace(/\r?\n/g, '\r\n') }));
  });
  if (!files.length) { toast('아직 이 컴퓨터에 쓴 코드가 없어요'); return; }
  const a = h('a', { href: URL.createObjectURL(makeZip(files)), download: '창문공방_내코드.zip' });
  document.body.appendChild(a);
  a.click();
  a.remove();
  toast(`🎁 ${files.length}개 파일을 묶어 내려받았어요 — 풀어서 IDLE 로 열고 F5`);
}

export const wrap3Card = {
  id: 'wrap3', chapter: 's3', title: '✅ 3차시 확인 문제 · 오늘 만든 창 모아 받기',
  render(body, api) {
    const cid = 'wrap3';
    const check = () => { if (QUIZ3.every((q, i) => picked(cid, `q${i}`) === q.answer)) finish(api, cid, '창문 공방을 모두 마쳤어요! 이제 진짜 창은 IDLE 에서 — 수고했어요.'); };
    const page = card(cid).page || 0;
    const PAGES = [[0, 1], [2, 3], [4, 5]];
    const short = (q) => q.choices.every((c) => c.replace(/<[^>]+>/g, '').length <= 30);
    const solved = (i) => picked(cid, `q${i}`) === QUIZ3[i].answer;
    const tabs = pills(PAGES.map((list, k) => ({ id: k, label: `문제 ${list[0] + 1}~${list[list.length - 1] + 1}`, done: list.every(solved) })),
      page, (k) => { setCard(cid, { page: k }); api.go(api.index); });
    const quiz = h('div', { class: 'quiz-grid' }, ...PAGES[page].map((i) => choose({
      q: `${i + 1}. ${QUIZ3[i].q}`, choices: QUIZ3[i].choices, answer: QUIZ3[i].answer, why: QUIZ3[i].why, save: [cid, `q${i}`],
      onPick: check, cls: short(QUIZ3[i]) ? 'compact' : '',
    })));
    const notes = card(cid).notes || {};
    const reflect = h('div', { class: 'reflect' },
      h('div', { class: 'mini-title' }, '📝 오늘 배운 것 — 내 말로 한 문장씩 (이 컴퓨터에만 남아요)'),
      ...REFLECT3.map((r, i) => h('div', {},
        h('div', { class: 'q' }, r.q),
        h('textarea', { 'aria-label': r.q, onKeydown: (e) => e.stopPropagation(), onInput: (e) => { notes[i] = e.target.value; setCard(cid, { notes }); } }, notes[i] || ''),
        h('div', { class: 'clue' }, `실마리 낱말: ${r.clue}`))));
    fill(body, h('div', { class: 'lab', style: { gridTemplateColumns: '58% 1fr' } },
      h('div', { class: 'col tight' }, tabs, quiz),
      h('div', { class: 'col tight' }, reflect,
        h('div', { class: 'gift' },
          h('div', { class: 'mini-title' }, '🎁 오늘 만든 창 — 진짜로 띄워 보기'),
          h('div', { class: 'small', html: '공방에서 쓴 코드를 <code>.py</code> 파일로 묶어 받아요. 풀어서 <b>IDLE</b> 로 열고 <b>F5</b> — 이번에는 진짜 윈도 창이 떠요!' }),
          h('button', { class: 'btn primary', onClick: downloadAll }, '🎁 내 코드 모두 받기 (.zip)')),
        h('p', { class: 'start-copy' }, '© 2026 티쳐무 · 모든 권리 보유 · 학교 수업 목적으로만 이용해 주세요'))));
    check();
  },
};
