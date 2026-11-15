/*! 🪟 창문 공방 — © 2026 티쳐무 · 모든 권리 보유
 *  1차시 시작 — 카드 0 「공방 문을 열며」(글자 프로그램 ↔ 창 프로그램) · 카드 1 「첫 창 띄우기」(교재 1·2절)
 */
import { h, fill, modal } from '../ui/dom.js';
import { createDesktop } from '../ui/window.js';
import { codeView } from '../ui/code.js';
import { story, tip, choose, checklist, finish, runBox, solvedQ } from './kit.js';
import { card, setCard } from '../store.js';
import { Program } from '../tk/program.js';
import { GUESS_GUI, GUESS_CONSOLE, MISSIONS } from '../data/missions.js';

/* ════════ 카드 0 — 공방 문을 열며 ════════ */
export const introCard = {
  id: 'intro', chapter: 's1', title: '🪟 공방 문을 열며 — 글자 프로그램과 창 프로그램',
  render(body, api) {
    const cid = 'intro';
    // ── 왼쪽: 콘솔(글자) 숫자 맞추기 — 교재 8장에서 만든 그 프로그램을 흉내 낸다 ──
    const con = h('div', { class: 'fake-con', 'aria-label': '콘솔 프로그램' });
    let answer, lines, over;
    const PROMPT = '1부터 100 사이의 숫자를 입력하시오: ';
    const input = h('input', { 'aria-label': '숫자 입력', inputmode: 'numeric' });
    const paintCon = () => {
      fill(con, ...lines.map((l) => h('div', { class: l.k || '' }, l.s)),
        over ? h('div', { class: 'c-dim' }, '(프로그램 끝 — 다시 하려면 아래 ↺)') : h('div', { class: 'row-in' }, h('span', {}, PROMPT), input));
      con.scrollTop = con.scrollHeight;
      if (!over) input.focus({ preventScroll: true });
    };
    const restart = () => {
      answer = 1 + Math.floor(Math.random() * 100);
      lines = [{ s: 'C:\\> python 숫자맞추기.py', k: 'c-dim' }];
      over = false;
      input.value = '';
      paintCon();
    };
    input.addEventListener('keydown', (e) => {
      e.stopPropagation();
      if (e.key !== 'Enter') return;
      const v = input.value.trim();
      input.value = '';
      lines.push({ s: PROMPT + v, k: 'c-in' });
      if (!/^-?\d+$/.test(v)) {
        lines.push({ s: `ValueError: invalid literal for int() with base 10: '${v}'`, k: 'c-err' });
        over = true;
      } else {
        const g = parseInt(v, 10);
        if (g > answer) lines.push({ s: '더 작은 수입니다!' });
        else if (g < answer) lines.push({ s: '더 큰 수입니다!' });
        else { lines.push({ s: '정답입니다!' }); over = true; }
      }
      const st = card(cid);
      setCard(cid, { conTries: (st.conTries || 0) + 1 });
      paintCon();
    });
    restart();

    // ── 오른쪽: 창(GUI) 숫자 맞추기 — 교재 12절 (1) 의 코드가 가짜 tkinter 에서 진짜로 돈다 ──
    const desk = createDesktop({});
    const startGui = () => { const p = new Program(GUESS_GUI).start(); desk.show(p); };
    startGui();

    const showCode = (title, code) => modal(title, h('div', { style: { maxHeight: '440px', overflow: 'auto' } }, codeView(code)), { wide: true });
    const left = h('div', { class: 'col tight' },
      h('div', { class: 'panel-t' }, '⌨️ 글자 프로그램', h('small', {}, '교재 8장 — 까만 화면에 묻고 답한다'),
        h('button', { class: 'btn small', style: { marginLeft: 'auto' }, onClick: () => showCode('글자 프로그램의 코드', GUESS_CONSOLE) }, '📜 코드'),
        h('button', { class: 'btn small', onClick: restart }, '↺')),
      con);
    const right = h('div', { class: 'col tight' },
      h('div', { class: 'panel-t' }, '🪟 창 프로그램', h('small', {}, '교재 13장 — 창 안에서 누르고 친다'),
        h('button', { class: 'btn small', style: { marginLeft: 'auto' }, onClick: () => showCode('창 프로그램의 코드', GUESS_GUI) }, '📜 코드'),
        h('button', { class: 'btn small', onClick: startGui }, '↺')),
      desk.el);

    const q = choose({
      q: '두 프로그램 모두 숫자를 몇 번이고 받아요. 그런데 <b>창 프로그램의 코드에는 <code>while True</code> 가 없어요.</b> 어떻게 계속 받을 수 있을까요?',
      choices: [
        '단추를 누를 때마다 프로그램이 처음부터 다시 실행된다',
        '<code>mainloop()</code> 가 창을 띄워 놓고, 사용자가 무엇을 할 때까지 기다리기를 되풀이한다',
        'tkinter 가 코드 안에 <code>while True</code> 를 몰래 넣어 준다',
      ],
      answer: 1,
      why: '창 프로그램은 위에서부터 실행되다가 <code>mainloop()</code> 에서 <b>기다리기</b>에 들어가요. 단추를 누르면 연결해 둔 함수(<code>guessing</code>)가 한 번 불리고, 다시 기다려요. 이렇게 「사건(이벤트)이 생길 때마다 그에 맞는 함수가 실행되는」 프로그램을 <b>이벤트 기반 프로그램</b>이라고 해요.',
      save: [cid, 'q'], onPick: (i, ok) => { if (ok) finish(api, cid, 'GUI 프로그램의 비밀을 찾았어요!'); },
      cls: 'inline',
    });
    fill(body,
      story('지금까지 만든 프로그램은 까만 화면에 글자로 묻고 답했어요(<b>CLI</b>). 오늘부터는 <b>창 · 단추 · 입력 칸</b>이 있는 프로그램(<b>GUI</b>)을 만들어요. 왼쪽과 오른쪽은 <b>같은 숫자 맞추기 게임</b>이에요. 둘 다 해 보세요!', '👋'),
      h('div', { class: 'pair' }, left, right),
      q,
      tip('이 앱의 창은 브라우저 안에서 그린 <b>가짜 창</b>이지만, 여러분이 쓴 tkinter 코드를 진짜 파이썬처럼 실행해요. 코랩에서는 창이 뜨지 않아서 이렇게 만들었어요. 진짜 창은 마지막에 <b>IDLE</b> 로 띄워 봐요.', '🧪'),
      h('p', { class: 'start-copy' }, '© 2026 티쳐무 · 모든 권리 보유 · 학교 수업 목적으로만 이용해 주세요'));
    if (solvedQ(cid, 'q', 1)) finish(api, cid);
  },
};

/* ════════ 카드 1 — 첫 창 띄우기 ════════ */
export const firstCard = {
  id: 'first', chapter: 's1', title: '🧱 첫 창 띄우기 — 세 줄의 뼈대',
  render(body, api) {
    const cid = 'first';
    const m = MISSIONS.first;
    const checks = h('div');
    const paintChecks = () => {
      const f = card(cid).flags || {};
      const items = [
        { ok: (!!f.loop) || null, label: '▶ 실행해서 창을 띄운다' },
        { ok: (!!f.title) || null, label: '<code>title(…)</code> 의 글자를 바꿔 창 제목을 바꾼다' },
        { ok: (!!f.geom) || null, label: '<code>geometry("가로x세로")</code> 를 바꿔 창 크기를 바꾼다' },
        { ok: (!!f.flash) || null, label: '<code>window.mainloop()</code> 줄을 지우고 실행해 본다 — 어떻게 되나요?',
          why: f.flash ? '창이 번쩍 나타났다가 사라졌죠? 프로그램이 마지막 줄까지 가서 끝나 버렸기 때문이에요. mainloop() 가 「창을 띄워 놓고 기다리기」 를 맡아요.' : '' },
      ];
      fill(checks, checklist(items, { title: '🔬 실험 네 가지' }));
      if (items.every((x) => x.ok)) finish(api, cid, '창을 띄우고 기다리게 하는 법을 알았어요!');
    };
    const box = runBox({
      cid, starter: m.starter, model: m.model, rows: 9,
      onRun: (p) => {
        const f = { ...(card(cid).flags || {}) };
        const root = p.app.roots[0];
        if (p.state === 'loop') {
          f.loop = true;
          if (root && root.title !== '나의 첫 창' && root.title !== 'tk') f.title = true;
          if (root && root.geometry && !(root.geometry.w === 300 && root.geometry.h === 200)) f.geom = true;
        }
        if (p.flash) f.flash = true;
        setCard(cid, { flags: f });
        paintChecks();
      },
    });
    paintChecks();
    fill(body, h('div', { class: 'lab' },
      h('div', { class: 'col tight' },
        story('tkinter 프로그램은 언제나 이 뼈대로 시작해요.<br><code>window = Tk()</code> — <b>창을 만든다</b> · <code>window.mainloop()</code> — <b>창을 띄우고 기다린다</b><br>그 사이에 창을 꾸미고 위젯을 놓아요.', '🦴'),
        box.editor, checks,
        tip('<b>IDLE</b> 에서는 <code>mainloop()</code> 가 없어도 창이 남아 있을 때가 있어요. IDLE 이 창을 대신 붙들어 주기 때문이에요. 명령 프롬프트나 VS Code 로 실행하면 창이 사라지니 <b>언제나 마지막 줄에 mainloop()</b> 를 써요.', '⚠️')),
      h('div', { class: 'right' }, box.desk, box.tools, box.console)));
    box.run();
  },
};
