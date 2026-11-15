/*! 🪟 창문 공방 — © 2026 티쳐무 · 모든 권리 보유
 *  미션 — 카드의 편집기마다 처음 코드 · 모범 답 · 다른 정답 · 흔한 실수 · 검사.
 *
 *  ★ 검사는 「코드의 글자」 가 아니라 「실행해서 뜬 창」 을 본다(snapshot).
 *    그래서 학생이 교재와 다르게 써도 창이 맞으면 통과한다. 시험(test/missions.test.mjs)이
 *    모범 답 · 다른 정답은 통과하고, 처음 코드 · 흔한 실수는 떨어지는지 지킨다.
 *  모범 답 · 다른 정답은 test/golden-cases.mjs 가 진짜 tkinter 와도 대조한다.
 *  ⚠ node 로 불러다 시험한다. DOM 을 만들지 말 것.
 */
import { snapshotRoot } from '../tk/snapshot.js';

/** 지금 떠 있는 첫 창의 모습 (없으면 null) */
export function snapOf(p) {
  if (!p || p.state !== 'loop' || !p.app.liveRoots.length) return null;
  return snapshotRoot(p.app, p.app.liveRoots[0]);
}
const W = (snap, cls, text) => (snap ? snap.widgets.filter((w) => w.cls === cls && (text === undefined || w.text === text)) : []);

/* ── 교재 12절 (1) 숫자 맞추기 — 도입 카드에서 콘솔판과 견준다 ── */
export const GUESS_GUI = `from tkinter import *
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
export const GUESS_CONSOLE = `import random

answer = random.randint(1, 100)

while True:
    guess = int(input("1부터 100 사이의 숫자를 입력하시오: "))
    if guess > answer:
        print("더 작은 수입니다!")
    elif guess < answer:
        print("더 큰 수입니다!")
    else:
        print("정답입니다!")
        break
`;

export const MISSIONS = {
  /* 카드 1 — 첫 창 */
  first: {
    id: 'first',
    starter: `from tkinter import *

window = Tk()
window.title("나의 첫 창")
window.geometry("300x200")

window.mainloop()
`,
    model: `from tkinter import *

window = Tk()
window.title("창문 공방에 온 것을 환영해")
window.geometry("400x150")

window.mainloop()
`,
  },

  /* 카드 2 — 만들기와 놓기 */
  place3: {
    id: 'place3',
    starter: `from tkinter import *

window = Tk()
window.title("위젯 셋")

label = Label(window, text="이름을 쓰세요")
entry = Entry(window)
button = Button(window, text="확인")

label.pack()

window.mainloop()
`,
    model: `from tkinter import *

window = Tk()
window.title("위젯 셋")

label = Label(window, text="이름을 쓰세요")
entry = Entry(window)
button = Button(window, text="확인")

label.pack()
entry.pack()
button.pack()

window.mainloop()
`,
    alts: [`from tkinter import *

window = Tk()
window.title("위젯 셋")
Label(window, text="이름을 쓰세요").pack()
Entry(window).pack()
Button(window, text="확인").pack()
window.mainloop()
`],
    check(p) {
      const s = snapOf(p);
      const on = (cls) => s && s.widgets.some((w) => w.cls === cls && w.manager);
      return [
        { ok: !!s, label: '창을 띄운다' },
        { ok: on('Label'), label: '라벨(Label)이 창에 보인다' },
        { ok: on('Entry'), label: '입력 칸(Entry)이 창에 보인다' },
        { ok: on('Button'), label: '단추(Button)가 창에 보인다' },
      ];
    },
  },

  /* 카드 3 — 만든 뒤에 바꾸기 */
  later: {
    id: 'later',
    starter: `from tkinter import *

window = Tk()
label = Label(window, text="처음 글자", font=("맑은 고딕", 20))
label.pack()

# 아래 줄을 고쳐서 라벨의 글자를 "바뀐 글자" 로 바꾸세요
label.text = "바뀐 글자"

window.mainloop()
`,
    model: `from tkinter import *

window = Tk()
label = Label(window, text="처음 글자", font=("맑은 고딕", 20))
label.pack()

# 아래 줄을 고쳐서 라벨의 글자를 "바뀐 글자" 로 바꾸세요
label["text"] = "바뀐 글자"

window.mainloop()
`,
    alts: [`from tkinter import *

window = Tk()
label = Label(window, text="처음 글자", font=("맑은 고딕", 20))
label.pack()
label.config(text="바뀐 글자")
window.mainloop()
`, `from tkinter import *

window = Tk()
label = Label(window, text="처음 글자", font=("맑은 고딕", 20))
label.pack()
label.configure(text="바뀐 글자")
window.mainloop()
`],
    check(p) {
      const s = snapOf(p);
      const lab = W(s, 'Label')[0];
      return [
        { ok: !!lab, label: '라벨이 있는 창이 뜬다' },
        { ok: !!lab && lab.text === '바뀐 글자', label: '라벨의 글자가 「바뀐 글자」 로 바뀐다',
          why: lab && lab.text === '처음 글자' ? 'label.text = … 는 오류는 안 나지만 화면은 안 바뀌어요. 옵션은 label["text"] 나 label.config(text=…) 로 바꿔요.' : '' },
      ];
    },
  },

  /* 카드 5 — grid 빈칸 (교재 확인 문제 5) */
  gridform: {
    id: 'gridform',
    starter: `from tkinter import *

window = Tk()
Label(window, text="이름").grid(row=0, column=0)
Label(window, text="나이").grid(________)

e1 = Entry(window)
e2 = Entry(window)
e1.grid(row=0, column=1)
e2.grid(row=1, column=1)

window.mainloop()
`,
    model: `from tkinter import *

window = Tk()
Label(window, text="이름").grid(row=0, column=0)
Label(window, text="나이").grid(row=1, column=0)

e1 = Entry(window)
e2 = Entry(window)
e1.grid(row=0, column=1)
e2.grid(row=1, column=1)

window.mainloop()
`,
    alts: [`from tkinter import *

window = Tk()
Label(window, text="이름").grid(row=0, column=0)
Label(window, text="나이").grid(row=1)

e1 = Entry(window)
e2 = Entry(window)
e1.grid(row=0, column=1)
e2.grid(row=1, column=1)

window.mainloop()
`],
    mistakes: [`from tkinter import *

window = Tk()
Label(window, text="이름").grid(row=0, column=0)
Label(window, text="나이").grid(row=2, column=1)

e1 = Entry(window)
e2 = Entry(window)
e1.grid(row=0, column=1)
e2.grid(row=1, column=1)

window.mainloop()
`],
    check(p) {
      const s = snapOf(p);
      const age = W(s, 'Label', '나이')[0];
      const e2 = s && s.widgets.find((w) => w.path === '.!entry2');
      const same = age && e2 && Math.abs((age.y + age.h / 2) - (e2.y + e2.h / 2)) <= 2;
      const left = age && e2 && age.x + age.w <= e2.x + 1;
      return [
        { ok: !!s, label: '빈칸을 채우고 창을 띄운다', why: p && p.error && /_{3,}/.test(p.src) ? '빈칸 ________ 을 채워야 해요' : '' },
        { ok: !!same, label: '「나이」 가 둘째 입력 칸과 같은 줄에 있다' },
        { ok: !!(same && left), label: '「나이」 가 입력 칸의 왼쪽(첫째 칸)에 있다' },
      ];
    },
  },

  /* 카드 7 — 섞으면? → Frame 으로 고치기 */
  mixfix: {
    id: 'mixfix',
    starter: `from tkinter import *

window = Tk()
window.title("동아리 홍보")

Label(window, text="코딩 동아리 모집!", bg="skyblue").pack(fill=X)

Label(window, text="이름").grid(row=1, column=0)
Entry(window).grid(row=1, column=1)

window.mainloop()
`,
    model: `from tkinter import *

window = Tk()
window.title("동아리 홍보")

Label(window, text="코딩 동아리 모집!", bg="skyblue").pack(fill=X)

form = Frame(window)
form.pack()
Label(form, text="이름").grid(row=1, column=0)
Entry(form).grid(row=1, column=1)

window.mainloop()
`,
    alts: [`from tkinter import *

window = Tk()
window.title("동아리 홍보")

Label(window, text="코딩 동아리 모집!", bg="skyblue").grid(row=0, column=0, columnspan=2, sticky=EW)

Label(window, text="이름").grid(row=1, column=0)
Entry(window).grid(row=1, column=1)

window.mainloop()
`],
    check(p) {
      const s = snapOf(p);
      const mixErr = p && p.error && p.error.type === '_tkinter.TclError';
      return [
        { ok: !!s, label: '오류 없이 창이 뜬다', why: mixErr ? 'pack 과 grid 를 같은 창 안에서 섞었어요' : '' },
        { ok: W(s, 'Label', '코딩 동아리 모집!').length === 1, label: '「코딩 동아리 모집!」 이 보인다' },
        { ok: W(s, 'Label', '이름').length === 1 && W(s, 'Entry').length === 1, label: '「이름」 과 입력 칸이 보인다' },
      ];
    },
  },
};

/* ── 카드 4 — pack 예측 문제의 보기 셋 (둘째가 문제의 코드 · 정답) ── */
export const PACK_PREDICT = [
  `from tkinter import *
window = Tk()
window.geometry("170x100")
Button(window, text="A").pack(side=LEFT)
Button(window, text="B").pack(side=LEFT)
Button(window, text="C").pack(side=LEFT)
window.mainloop()
`,
  `from tkinter import *
window = Tk()
window.geometry("170x100")
Button(window, text="A").pack(side=LEFT)
Button(window, text="B").pack(side=TOP)
Button(window, text="C").pack(side=LEFT)
window.mainloop()
`,
  `from tkinter import *
window = Tk()
window.geometry("170x100")
Button(window, text="B").pack(side=TOP)
Button(window, text="A").pack(side=LEFT)
Button(window, text="C").pack(side=LEFT)
window.mainloop()
`,
];

/* ── 카드 6 — place 과녁 ── */
export const PLACE = {
  starter: `from tkinter import *

window = Tk()
window.title("자리 찾기")
window.geometry("320x220")

Label(window, text="별", bg="gold").place(x=0, y=0)
Label(window, text="달", bg="skyblue").place(x=0, y=0)
Label(window, text="해", bg="tomato").place(x=0, y=0)

window.mainloop()
`,
  model: `from tkinter import *

window = Tk()
window.title("자리 찾기")
window.geometry("320x220")

Label(window, text="별", bg="gold").place(x=40, y=30)
Label(window, text="달", bg="skyblue").place(x=220, y=150)
Label(window, text="해", bg="tomato").place(relx=0.5, rely=0.5, anchor=CENTER)

window.mainloop()
`,
  targets: { 별: { x: 40, y: 30 }, 달: { x: 220, y: 150 }, 해: { x: 150, y: 100 } },
  check(p) {
    const s = snapOf(p);
    const at = (t) => { const w = W(s, 'Label', t)[0]; return w ? { x: w.x, y: w.y } : null; };
    const near = (a, b) => a && Math.abs(a.x - b.x) <= 3 && Math.abs(a.y - b.y) <= 3;
    return [
      { ok: near(at('별'), PLACE.targets.별), label: '「별」 을 과녁 (40, 30) 에' },
      { ok: near(at('달'), PLACE.targets.달), label: '「달」 을 과녁 (220, 150) 에' },
      { ok: near(at('해'), PLACE.targets.해), label: '「해」 를 창 한가운데에', why: near(at('해'), PLACE.targets.해) ? '' : '가운데 자리는 relx=0.5, rely=0.5 — 위젯의 가운데를 맞추려면 anchor=CENTER' },
    ];
  },
};
MISSIONS.place = { id: 'place', starter: PLACE.starter, model: PLACE.model };

/* ── 카드 8 — 의뢰: 꿈누리 분식 주문서 ── */
export const ORDER1 = {
  target: `from tkinter import *

window = Tk()
window.title("꿈누리 분식")

Label(window, text="꿈누리 분식 주문서", bg="orange", fg="white", font=("맑은 고딕", 14)).grid(row=0, column=0, columnspan=2, sticky=EW)
Label(window, text="메뉴").grid(row=1, column=0)
Entry(window).grid(row=1, column=1)
Label(window, text="수량").grid(row=2, column=0)
Entry(window, width=5).grid(row=2, column=1, sticky=W)
Button(window, text="주문하기").grid(row=3, column=0, columnspan=2)

window.mainloop()
`,
  starter: `from tkinter import *

window = Tk()
window.title("꿈누리 분식")

# 의뢰서를 보고 위젯을 만들어 놓으세요


window.mainloop()
`,
};
MISSIONS.order1 = { id: 'order1', starter: ORDER1.starter, model: ORDER1.target };
