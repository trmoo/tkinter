/*! 🪟 창문 공방 — © 2026 티쳐무 · 모든 권리 보유
 *  3차시 미션 — 좌표 사격장 · 도형 갤러리 · bind · 그림판 · 키보드 · 클래스 계수기 · 숫자 맞추기 · 계산기 · 버그 병원 (교재 9~12절)
 *  검사는 「실행해서 뜬 창」 과 「자동 검사(누르기 · 끌기 · 키)」 로 — 코드 글자를 보지 않는다.
 *  ⚠ node 로 불러다 시험한다. DOM 을 만들지 말 것.
 */
import { launch, find, click, type, press, drag, mouse, widgetsOf, itemsOf, newErrors } from '../tk/scenario.js';
import { itemBBox } from '../tk/app.js';

const near = (a, b, tol = 2) => a.length === b.length && a.every((v, i) => Math.abs(v - b[i]) <= tol);
const canvasOf = (p) => find(p, 'Canvas');
const labelText = (p) => widgetsOf(p, 'Label').map((w) => w.shownText);

/* ════════ 좌표 사격장 (교재 9절 · 확인 문제 12·13) ════════ */
export const AIM = {
  starter: `from tkinter import *

window = Tk()
window.title("좌표 사격장")
canvas = Canvas(window, width=300, height=200, bg="white")
canvas.pack()

# 과녁 1 — 왼쪽 위가 (50, 30), 너비 120, 높이 80 인 파란 사각형
canvas.create_rectangle(50, 30, 120, 80, fill="blue")

# 과녁 2 — 중심이 (220, 60), 반지름이 30 인 빨간 원
canvas.create_oval(220, 60, 30, 30, fill="red")

# 과녁 3 — 왼쪽 아래 모서리에서 오른쪽 위 모서리로 가는 초록 선
canvas.create_line(0, 0, 300, 200, fill="green", width=3)

window.mainloop()
`,
  model: `from tkinter import *

window = Tk()
window.title("좌표 사격장")
canvas = Canvas(window, width=300, height=200, bg="white")
canvas.pack()

# 과녁 1 — 왼쪽 위가 (50, 30), 너비 120, 높이 80 인 파란 사각형
canvas.create_rectangle(50, 30, 50 + 120, 30 + 80, fill="blue")

# 과녁 2 — 중심이 (220, 60), 반지름이 30 인 빨간 원
canvas.create_oval(220 - 30, 60 - 30, 220 + 30, 60 + 30, fill="red")

# 과녁 3 — 왼쪽 아래 모서리에서 오른쪽 위 모서리로 가는 초록 선
canvas.create_line(0, 200, 300, 0, fill="green", width=3)

window.mainloop()
`,
  check(p) {
    const cv = p && p.state === 'loop' ? canvasOf(p) : null;
    const items = itemsOf(cv);
    const rect = items.find((it) => it.type === 'rectangle');
    const oval = items.find((it) => it.type === 'oval');
    const line = items.find((it) => it.type === 'line');
    const r1 = !!rect && near(rect.coords, [50, 30, 170, 110]);
    const r2 = !!oval && near(oval.coords, [190, 30, 250, 90]);
    const r3 = !!line && (near(line.coords, [0, 200, 300, 0]) || near(line.coords, [300, 0, 0, 200]));
    return [
      { ok: r1, label: '과녁 1 — 파란 사각형', why: r1 ? '' : rect && near(rect.coords, [50, 30, 120, 80]) ? '너비 · 높이가 아니라 <b>오른쪽 아래 꼭짓점</b>을 넣어요 — (50 + 120, 30 + 80)' : '' },
      { ok: r2, label: '과녁 2 — 빨간 원', why: r2 ? '' : oval && near(oval.coords, [30, 30, 220, 60]) ? '원은 중심 · 반지름이 아니라 <b>감싸는 사각형</b>의 두 꼭짓점 — (220 − 30, 60 − 30) 과 (220 + 30, 60 + 30)' : '' },
      { ok: r3, label: '과녁 3 — 초록 선', why: r3 ? '' : line && near(line.coords, [0, 0, 300, 200]) ? '<b>y 는 아래로 커져요.</b> 왼쪽 아래 모서리는 (0, 0) 이 아니라 (0, 200)' : '' },
    ];
  },
};

/* ════════ 도형 갤러리 (교재 9절 반복문으로 여러 개) ════════ */
export const GALLERY = {
  starter: `import random
from tkinter import *

window = Tk()
canvas = Canvas(window, width=500, height=400)
canvas.pack()

colors = ["red", "orange", "yellow", "green", "blue", "violet"]

for i in range(10):
    x = random.randint(0, 400)
    y = random.randint(0, 300)
    w = random.randint(20, 100)
    h = random.randint(20, 100)
    canvas.create_rectangle(x, y, x + w, y + h, fill=random.choice(colors))

window.mainloop()
`,
};
GALLERY.model = GALLERY.starter.replace(`    canvas.create_rectangle(x, y, x + w, y + h, fill=random.choice(colors))
`, `    canvas.create_rectangle(x, y, x + w, y + h, fill=random.choice(colors))
    canvas.create_oval(x, y, x + w, y + h, fill=random.choice(colors))

canvas.create_line(0, 0, 500, 400, width=3)
canvas.create_text(250, 20, text="나의 갤러리", font=("맑은 고딕", 16))
`);
GALLERY.check = (p) => {
  const items = itemsOf(p && p.state === 'loop' ? canvasOf(p) : null);
  const kinds = new Set(items.map((it) => it.type));
  return [
    { ok: items.length >= 10, label: `도형이 열 개 이상 (${items.length}개)` },
    { ok: kinds.size >= 4, label: `도형 종류가 네 가지 이상 (${[...kinds].join(' · ') || '없음'})`, why: kinds.size >= 4 ? '' : 'create_oval · create_line · create_polygon · create_arc · create_text 가운데 골라 더해 보세요' },
  ];
};

/* ════════ bind — 마우스 (교재 10절) ════════ */
export const BIND = `from tkinter import *

def click(event):                       # 매개변수 event 를 반드시 받는다
    print(event.x, event.y, "에서 눌렸습니다")

window = Tk()
frame = Frame(window, width=200, height=150, bg="lightgray")
frame.bind("<Button-1>", click)
frame.pack()

window.mainloop()
`;

/* ════════ 그림판 (교재 10절) ════════ */
export const PAINT = {
  starter: `from tkinter import *

def draw_dot(event):
    x1, y1 = event.x - 2, event.y - 2
    x2, y2 = event.x + 2, event.y + 2
    canvas.create_oval(x1, y1, x2, y2, fill=mycolor, outline=mycolor)

def change_color():
    global mycolor
    mycolor = "red"

mycolor = "black"

window = Tk()
window.title("나의 그림판")

canvas = Canvas(window, width=500, height=300, bg="white")
canvas.pack()
canvas.bind("<B1-Motion>", draw_dot)

Button(window, text="빨강색으로", command=change_color).pack()
Label(window, text="마우스를 끌면 점이 그려집니다.").pack()

window.mainloop()
`,
};
PAINT.model = PAINT.starter.replace(`mycolor = "black"
`, `def change_blue():
    global mycolor
    mycolor = "blue"

mycolor = "black"
`).replace(`Button(window, text="빨강색으로", command=change_color).pack()
`, `Button(window, text="빨강색으로", command=change_color).pack()
Button(window, text="파랑색으로", command=change_blue).pack()
`);
PAINT.mistakes = [PAINT.model.replace(`def change_color():
    global mycolor
    mycolor = "red"`, `def change_color():
    mycolor = "red"`)];
/** 그림판 자동 검사 — 끌어서 그리고 · 빨강 단추 · 파랑 단추를 누른 뒤 다시 그린다 */
PAINT.check = (src) => {
  const L = launch(src);
  const labels = ['끌면 점이 찍힌다 (검정)', '「빨강색으로」 를 누르고 끌면 빨간 점', '「파랑색으로」 단추를 더해 — 누르고 끌면 파란 점'];
  if (!L.ok) return labels.map((label, i) => ({ ok: false, label, why: i ? '' : L.why }));
  const { p } = L;
  const cv = canvasOf(p);
  const line = (y) => Array.from({ length: 6 }, (_, i) => [40 + i * 8, y]);
  const colorAfter = (fn) => { const before = cv ? cv.items.size : 0; fn(); return itemsOf(cv).slice(before).map((it) => it.fill); };
  const since = p.cbErrors.length;
  const black = colorAfter(() => drag(p, cv, line(60)));
  const red = colorAfter(() => { click(p, find(p, 'Button', { has: '빨강' })); drag(p, cv, line(120)); });
  const blueBtn = find(p, 'Button', { has: '파랑' });
  const blue = blueBtn ? colorAfter(() => { click(p, blueBtn); drag(p, cv, line(180)); }) : [];
  const e = newErrors(p, since).pop();
  const all = (list, c) => list.length >= 3 && list.every((f) => f === c);
  return [
    { ok: all(black, 'black'), label: labels[0], why: e ? e.last : black.length ? '' : '끌어도 점이 찍히지 않아요 — canvas.bind("&lt;B1-Motion&gt;", draw_dot) 를 확인하세요' },
    { ok: all(red, 'red'), label: labels[1], why: all(red, 'red') ? '' : red.length && red[0] === 'black' ? '단추를 눌러도 검정 그대로 — change_color( ) 안의 global mycolor 를 확인하세요' : '' },
    { ok: all(blue, 'blue'), label: labels[2], why: !blueBtn ? '「파랑색으로」 단추가 아직 없어요' : all(blue, 'blue') ? '' : '파랑 단추를 눌러도 색이 바뀌지 않아요 — 새 함수에도 global mycolor' },
  ];
};

/* ════════ 키보드로 움직이기 (교재 10절) ════════ */
export const KEYS = {
  starter: `from tkinter import *

def move_right(event):
    canvas.move(ball, 10, 0)      # 오른쪽으로 10픽셀

def move_left(event):
    canvas.move(ball, -10, 0)

window = Tk()
window.title("별을 찾아라")
canvas = Canvas(window, width=400, height=300, bg="white")
canvas.pack()

star = canvas.create_text(340, 50, text="★", font=("맑은 고딕", 30), fill="gold")
ball = canvas.create_oval(10, 230, 50, 270, fill="green")

canvas.bind_all("<KeyPress-Right>", move_right)
canvas.bind_all("<KeyPress-Left>", move_left)

window.mainloop()
`,
};
KEYS.model = KEYS.starter.replace(`window = Tk()`, `def move_up(event):
    canvas.move(ball, 0, -10)     # y 는 아래로 커지므로 위로 가려면 빼기

def move_down(event):
    canvas.move(ball, 0, 10)

window = Tk()`).replace(`canvas.bind_all("<KeyPress-Left>", move_left)
`, `canvas.bind_all("<KeyPress-Left>", move_left)
canvas.bind_all("<KeyPress-Up>", move_up)
canvas.bind_all("<KeyPress-Down>", move_down)
`);
KEYS.mistakes = [KEYS.model.replace('canvas.move(ball, 0, -10)     # y 는 아래로 커지므로 위로 가려면 빼기', 'canvas.move(ball, 0, 10)')];
/** 공(초록 원)의 왼쪽 위 */
export function ballAt(p) {
  const cv = canvasOf(p);
  const ball = itemsOf(cv).find((it) => it.type === 'oval');
  return ball ? [ball.coords[0], ball.coords[1]] : null;
}
/** 공이 별에 닿았나 */
export function reachedStar(p) {
  const cv = canvasOf(p);
  if (!cv) return false;
  const star = [...cv.items.values()].find((it) => it.type === 'text');
  const ball = [...cv.items.values()].find((it) => it.type === 'oval');
  if (!star || !ball) return false;
  const a = itemBBox(star), b = itemBBox(ball);
  return a[0] < b[2] && b[0] < a[2] && a[1] < b[3] && b[1] < a[3];
}
KEYS.check = (src) => {
  const L = launch(src);
  const labels = ['→ 오른쪽으로 10', '← 왼쪽으로 10', '↑ 위로 10', '↓ 아래로 10'];
  if (!L.ok) return labels.map((label, i) => ({ ok: false, label, why: i ? '' : L.why }));
  const { p } = L;
  const step = (key, dx, dy, label) => {
    const a = ballAt(p);
    press(p, key);
    const b = ballAt(p);
    const ok = !!a && !!b && b[0] - a[0] === dx && b[1] - a[1] === dy;
    let why = '';
    if (!ok && a && b) {
      if (b[0] === a[0] && b[1] === a[1]) why = `${key} 키에 아무 일도 없어요 — canvas.bind_all("&lt;KeyPress-${key}&gt;", …) 를 이었나요?`;
      else if (b[1] - a[1] === -dy && dy !== 0) why = `반대로 움직여요 — <b>y 는 아래로 커지므로</b> 위로 가려면 0, -10`;
      else why = `(${b[0] - a[0]}, ${b[1] - a[1]}) 만큼 움직였어요`;
    }
    return { ok, label, why };
  };
  return [step('Right', 10, 0, labels[0]), step('Left', -10, 0, labels[1]), step('Up', 0, -10, labels[2]), step('Down', 0, 10, labels[3])];
};

/* ════════ 클래스로 정리 — 계수기 (교재 11절 · 확인 문제 18) ════════ */
const COUNTER = `from tkinter import *

def plus():
    global count
    count += 1
    label["text"] = str(count)

def reset():
    global count
    count = 0
    label["text"] = "0"

count = 0

window = Tk()
window.title("계수기")

label = Label(window, text="0", font="helvetica 40")
label.pack()

Button(window, text="+1", command=plus).pack(side=LEFT)
Button(window, text="초기화", command=reset).pack(side=LEFT)

window.mainloop()
`;
export const COUNTER_G = {
  starter: COUNTER.replace('def plus():\n    global count\n', 'def plus():\n').replace('def reset():\n    global count\n', 'def reset():\n'),
  model: COUNTER,
  mistakes: [COUNTER.replace('def reset():\n    global count\n', 'def reset():\n')],
};
const COUNTER_CLASS = `from tkinter import *

class CounterApp:
    def __init__(self):
        self.count = 0                       # 속성으로 상태를 갖는다

        self.window = Tk()
        self.window.title("계수기")

        self.label = Label(self.window, text="0", font="helvetica 40")
        self.label.pack()

        Button(self.window, text="+1", command=self.plus).pack(side=LEFT)
        Button(self.window, text="초기화", command=self.reset).pack(side=LEFT)

        self.window.mainloop()

    def plus(self):
        self.count += 1
        self.label["text"] = str(self.count)

    def reset(self):
        self.count = 0
        self.label["text"] = "0"

CounterApp()
`;
export const COUNTER_C = {
  starter: COUNTER_CLASS,
  model: COUNTER_CLASS.replace(`        Button(self.window, text="초기화", command=self.reset).pack(side=LEFT)
`, `        Button(self.window, text="-1", command=self.minus).pack(side=LEFT)
        Button(self.window, text="초기화", command=self.reset).pack(side=LEFT)
`).replace(`    def reset(self):`, `    def minus(self):
        self.count -= 1
        self.label["text"] = str(self.count)

    def reset(self):`),
};
/** 계수기 자동 검사 — 차례대로 눌러 보고 라벨을 읽는다. steps: [[단추 글자, 기대 라벨], …] */
export function counterCheck(src, steps) {
  const L = launch(src);
  if (!L.ok) return steps.map(([b, want], i) => ({ ok: false, label: `「${b}」 → ${want}`, why: i ? '' : L.why }));
  const { p } = L;
  const big = () => widgetsOf(p, 'Label')[0];
  let broken = false;
  return steps.map(([b, want]) => {
    const btn = find(p, 'Button', { text: b }) || (b === '-1' ? find(p, 'Button', { text: '−1' }) : null);
    if (broken || !btn) return { ok: false, label: `「${b}」 → ${want}`, why: !btn ? `「${b}」 단추가 없어요` : '' };
    const since = p.cbErrors.length;
    click(p, btn);
    const e = newErrors(p, since).pop();
    const got = big() ? big().shownText : '';
    const ok = !e && got === want;
    if (!ok) broken = true;
    return { ok, label: `「${b}」 → ${want}`, why: ok ? '' : e ? e.last : `라벨이 「${got}」 — 함수 밖의 count 가 바뀌었나요?` };
  });
}
export const COUNTER_STEPS = { g: [['+1', '1'], ['+1', '2'], ['+1', '3'], ['초기화', '0'], ['+1', '1']], c: [['+1', '1'], ['+1', '2'], ['-1', '1'], ['초기화', '0'], ['-1', '-1']] };

/* ════════ 숫자 맞추기 GUI — 시도 횟수 더하기 (교재 12절 (1)) ════════ */
export const GUESS = { };
GUESS.starter = `from tkinter import *
import random

def guessing():
    guess = int(entry.get())
    if guess > answer:
        result["text"] = "더 작은 수입니다!"
    elif guess < answer:
        result["text"] = "더 큰 수입니다!"
    else:
        result["text"] = "정답입니다!"
    entry.delete(0, END)

def reset():
    global answer
    answer = random.randint(1, 100)
    result["text"] = "새 문제를 냈습니다. 다시 맞혀 보세요!"

answer = random.randint(1, 100)

window = Tk()
window.title("숫자를 맞춰 보세요!")

Label(window, text="1부터 100 사이의 숫자를 입력하시오.").pack()

entry = Entry(window)
entry.pack()

Button(window, text="시도", fg="green", command=guessing).pack(side=LEFT)
Button(window, text="새 문제", fg="red", command=reset).pack(side=LEFT)

result = Label(window, text="")
result.pack(side=LEFT)

window.mainloop()
`;
GUESS.model = GUESS.starter
  .replace('def guessing():\n    guess = int(entry.get())', 'def guessing():\n    global tries\n    tries += 1\n    guess = int(entry.get())')
  .replace('result["text"] = "정답입니다!"', 'result["text"] = "정답입니다! " + str(tries) + "번 만에 맞혔어요"')
  .replace('def reset():\n    global answer\n    answer = random.randint(1, 100)', 'def reset():\n    global answer, tries\n    answer = random.randint(1, 100)\n    tries = 0')
  .replace('answer = random.randint(1, 100)\n\nwindow', 'answer = random.randint(1, 100)\ntries = 0\n\nwindow');
GUESS.mistakes = [GUESS.model.replace('    global answer, tries\n    answer = random.randint(1, 100)\n    tries = 0', '    global answer\n    answer = random.randint(1, 100)')];
/** 반으로 나누어 찾기(이진 탐색)로 게임을 끝까지 — 결과 라벨의 「N번 만에」 가 실제로 시도한 수와 같은가 */
export function playGuess(p) {
  let lo = 1, hi = 100, tries = 0, last = '';
  const entry = find(p, 'Entry'), go = find(p, 'Button', { has: '시도' });
  const result = () => { const ls = widgetsOf(p, 'Label'); return ls.length ? ls[ls.length - 1].shownText : ''; };
  if (!entry || !go) return { done: false, tries, last: '' };
  while (tries < 12) {
    const g = Math.floor((lo + hi) / 2);
    type(p, entry, String(g));
    click(p, go);
    tries++;
    last = result();
    if (last.includes('작은')) hi = g - 1;
    else if (last.includes('큰')) lo = g + 1;
    else break;
  }
  return { done: last.includes('정답'), tries, last };
}
GUESS.check = (src) => {
  const L = launch(src);
  const labels = ['게임을 끝까지 하면 「정답입니다! N번 만에 맞혔어요」', '「N」 이 실제로 시도한 수와 같다', '「새 문제」 를 누르면 횟수도 처음부터'];
  if (!L.ok) return labels.map((label, i) => ({ ok: false, label, why: i ? '' : L.why }));
  const { p } = L;
  const r1 = playGuess(p);
  const n1 = Number((/(\d+)번/.exec(r1.last) || [])[1]);
  click(p, find(p, 'Button', { has: '새 문제' }));
  const r2 = playGuess(p);
  const n2 = Number((/(\d+)번/.exec(r2.last) || [])[1]);
  const e = p.cbErrors[p.cbErrors.length - 1];
  return [
    { ok: r1.done && /정답입니다!\s*\d+번 만에 맞혔어요/.test(r1.last), label: labels[0], why: /정답입니다!\s*\d+번 만에 맞혔어요/.test(r1.last) ? '' : e ? e.last : r1.done ? `나온 것: 「${r1.last}」` : '' },
    { ok: n1 === r1.tries, label: labels[1], why: n1 === r1.tries ? '' : Number.isNaN(n1) ? '' : `${r1.tries}번 시도했는데 「${n1}번」 이라고 나와요` },
    { ok: n2 === r2.tries, label: labels[2], why: n2 === r2.tries ? '' : Number.isNaN(n2) ? '' : `새 문제에서 ${r2.tries}번 만에 맞혔는데 「${n2}번」 — reset( ) 에서 횟수를 0 으로 (global 도)` },
  ];
};

/* ════════ 계산기 (교재 12절 (2)) ════════ */
export const CALC = {
  starter: `from tkinter import *

def click(key):
    if key == "=":
        try:
            result = eval(display.get())
            display.delete(0, END)
            display.insert(END, str(result))
        except:
            display.delete(0, END)
            display.insert(END, "오류!")
    elif key == "C":
        display.delete(0, END)
    else:
        display.insert(END, key)

window = Tk()
window.title("간단한 계산기")

display = Entry(window, width=33, bg="lightyellow")
display.grid(row=0, column=0, columnspan=5)

buttons = ["7", "8", "9", "/", "C",
           "4", "5", "6", "*", " ",
           "1", "2", "3", "-", " ",
           "0", ".", "=", "+", " "]

for i in range(len(buttons)):
    key = buttons[i]
    Button(window, text=key, width=5,
           command=lambda k=key: click(k)).grid(row=i // 5 + 1, column=i % 5)

window.mainloop()
`,
};
CALC.model = CALC.starter;
CALC.mistakes = [CALC.starter.replace('command=lambda k=key: click(k)', 'command=lambda: click(key)')];
/** 단추를 차례로 누르고 표시 칸 읽기 */
export function calcPress(p, keys) {
  const display = find(p, 'Entry');
  for (const k of keys) { const b = find(p, 'Button', { text: k }); if (b) click(p, b); }
  return display ? display.text : '';
}
/** 단추마다 「한 번 누르면 표시 칸에 무엇이 들어가나」 — 새 창에서 하나씩 */
export function calcMap(src) {
  const L = launch(src);
  if (!L.ok) return null;
  const texts = widgetsOf(L.p, 'Button').map((b) => b.shownText);
  return texts.map((t, i) => {
    const { p } = launch(src);
    const b = widgetsOf(p, 'Button')[i];
    click(p, b);
    const d = find(p, 'Entry');
    return { label: t, got: d ? d.text : '' };
  });
}
CALC.check = (src) => {
  const cases = [[['7', '*', '8', '='], '56', '7 * 8 = → 56'], [['C', '1', '/', '0', '='], '오류!', 'C 1 / 0 = → 오류! (0 으로 나누기)'], [['C', '9', '-', '4', '='], '5', 'C 9 − 4 = → 5']];
  const L = launch(src);
  if (!L.ok) return cases.map(([, , label], i) => ({ ok: false, label, why: i ? '' : L.why }));
  return cases.map(([keys, want, label]) => {
    const got = calcPress(L.p, keys);
    const ok = got === want;
    return { ok, label, why: ok ? '' : `표시 칸: 「${got}」${/^\s+$/.test(got) ? ' — 어느 단추를 눌러도 빈칸만 들어가요. lambda 의 k=key 를 빠뜨리지 않았나요?' : ''}` };
  });
};

/* ════════ 버그 병원 — 증상을 보고 원인을 고른 뒤 고친다 ════════ */
const HELLO = `from tkinter import *

def hello():
    label["text"] = "안녕하세요!"

window = Tk()
window.title("인사 단추")
label = Label(window, text="단추를 눌러 보세요")
label.pack()
button = Button(window, text="인사", command=hello)
button.pack()

window.mainloop()
`;
/** 인사 단추가 고쳐졌나 — 처음엔 「단추를 눌러 보세요」, 누르면 「안녕하세요!」 */
function helloWorks(src) {
  const L = launch(src);
  if (!L.ok) return { ok: false, why: L.why };
  const { p } = L;
  const before = labelText(p)[0];
  const btn = find(p, 'Button');
  if (!btn || !btn.manager) return { ok: false, why: '「인사」 단추가 창에 보이지 않아요' };
  click(p, btn);
  const after = labelText(p)[0];
  if (before !== '단추를 눌러 보세요') return { ok: false, why: '창이 뜨자마자 이미 「안녕하세요!」 — 단추를 누르기도 전에 함수가 실행됐어요' };
  return { ok: after === '안녕하세요!', why: after === '안녕하세요!' ? '' : '단추를 눌러도 라벨이 그대로예요' };
}
const ADDER = `from tkinter import *

def add():
    total = e1.get() + e2.get()
    result["text"] = "합: " + str(total)

window = Tk()
window.title("덧셈기")
e1 = Entry(window, width=8)
e2 = Entry(window, width=8)
e1.grid(row=0, column=0)
e2.grid(row=0, column=1)
Button(window, text="더하기", command=add).grid(row=1, column=0, columnspan=2)
result = Label(window, text="합: ")
result.grid(row=2, column=0, columnspan=2)

window.mainloop()
`;
const FRAMECLICK = `from tkinter import *

def click():
    label["text"] = "눌렸어요!"

window = Tk()
window.title("눌러 보는 판")
frame = Frame(window, width=200, height=100, bg="lightgray")
frame.bind("<Button-1>", click)
frame.pack()
label = Label(window, text="회색 판을 눌러 보세요")
label.pack()

window.mainloop()
`;
export const CLINIC = [
  { id: 'noloop', title: '사라지는 창', symptom: '실행하면 창이 번쩍 나타났다가 바로 사라져요. 오류는 없어요.',
    src: HELLO.replace('\nwindow.mainloop()\n', '\n'),
    choices: ['창 크기를 정하지 않았다', 'mainloop( ) 가 없어 프로그램이 끝나 버렸다', 'Label 을 pack 하지 않았다'], answer: 1,
    fix: (src) => helloWorks(src) },
  { id: 'nopack', title: '보이지 않는 단추', symptom: '창은 뜨는데 「인사」 단추가 보이지 않아요. 오류도 없어요.',
    src: HELLO.replace('button.pack()\n', ''),
    choices: ['단추를 만들기만 하고 놓지(pack) 않았다', 'command 를 빠뜨렸다', '단추 글자가 너무 길다'], answer: 0,
    fix: (src) => helloWorks(src) },
  { id: 'paren', title: '혼자 눌리는 단추', symptom: '창이 뜨자마자 라벨이 벌써 「안녕하세요!」 예요. 그리고 단추를 눌러도 아무 일이 없어요.',
    src: HELLO.replace('command=hello)', 'command=hello())'),
    choices: ['label 을 함수보다 먼저 만들었다', 'command=hello( ) — 괄호 때문에 시작할 때 바로 실행되고 command 에는 None 이 들어갔다', 'hello 함수에 return 이 없다'], answer: 1,
    fix: (src) => helloWorks(src) },
  { id: 'mix', title: '켜지지 않는 창', symptom: '실행하자마자 TclError 가 나고 창이 뜨지 않아요.',
    src: HELLO.replace('button.pack()', 'button.grid(row=1, column=0)'),
    choices: ['grid 의 row 는 1 부터 세야 한다', '같은 창 안에서 pack 과 grid 를 섞었다', 'Button 은 grid 로 놓을 수 없다'], answer: 1,
    fix: (src) => helloWorks(src) },
  { id: 'getstr', title: '이상한 덧셈', symptom: '10 과 20 을 넣고 「더하기」 를 누르면 「합: 1020」 이 나와요.',
    src: ADDER,
    choices: ['get( ) 이 글자를 돌려줘서 글자끼리 이어 붙였다', '+ 대신 , 를 써야 한다', 'Entry 의 width 가 좁다'], answer: 0,
    fix: (src) => {
      const L = launch(src);
      if (!L.ok) return { ok: false, why: L.why };
      const { p } = L;
      const [a, b] = widgetsOf(p, 'Entry');
      type(p, a, '10'); type(p, b, '20');
      const since = p.cbErrors.length;
      click(p, find(p, 'Button'));
      const e = newErrors(p, since).pop();
      const got = labelText(p).find((t) => t.startsWith('합')) || '';
      return { ok: /^합: 30(\.0)?$/.test(got), why: e ? e.last : `라벨: 「${got}」` };
    } },
  { id: 'event', title: '빨간 줄만 쌓이는 판', symptom: '창은 멀쩡한데, 회색 판을 누를 때마다 라벨은 그대로이고 콘솔에 빨간 줄만 쌓여요.',
    src: FRAMECLICK,
    choices: ['bind 로 이은 함수가 event 를 받지 않는다', 'Frame 은 누를 수 없다', '<Button-1> 은 오른쪽 단추다'], answer: 0,
    fix: (src) => {
      const L = launch(src);
      if (!L.ok) return { ok: false, why: L.why };
      const { p } = L;
      const since = p.cbErrors.length;
      mouse(p, find(p, 'Frame'), 50, 50);
      const e = newErrors(p, since).pop();
      return { ok: !e && labelText(p).includes('눌렸어요!'), why: e ? e.last : '' };
    } },
  { id: 'global', title: '오류 나는 계수기', symptom: '「+1」 을 누르면 숫자는 그대로이고 콘솔에 UnboundLocalError 가 나와요.',
    src: COUNTER_G.starter,
    choices: ['count 를 str( ) 로 감싸지 않았다', '함수 안에서 바깥 변수 count 를 바꾸려면 global count 가 필요하다', 'Label 의 font 가 틀렸다'], answer: 1,
    fix: (src) => { const r = counterCheck(src, COUNTER_STEPS.g); return { ok: r.every((x) => x.ok), why: (r.find((x) => !x.ok) || {}).why || '' }; } },
];
