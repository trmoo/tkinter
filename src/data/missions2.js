/*! 🪟 창문 공방 — © 2026 티쳐무 · 모든 권리 보유
 *  2차시 미션 — 단추에 일 시키기 · 입력 칸에서 꺼내기 · 온도 변환기 5단계 · 색 · 고르기 · 의뢰 2 (교재 5~8절)
 *
 *  ★ 검사는 「자동 검사」 — 학생 프로그램을 하나 더 띄워 사람 대신 글자를 넣고 단추를 누른 뒤 결과를 읽는다(scenario.js).
 *    그래서 변수 이름 · 줄 차례가 교재와 달라도 결과가 맞으면 통과한다.
 *  test/missions2.test.mjs 가 모범 답 · 다른 정답은 통과, 처음 코드 · 흔한 실수는 떨어지는지 지킨다.
 *  모범 답 · 흔한 실수는 test/golden-cases.mjs 가 진짜 tkinter 와도 대조한다(actions 의 동작까지).
 *  ⚠ node 로 불러다 시험한다. DOM 을 만들지 말 것.
 */
import { launch, find, click, type, widgetsOf, newErrors } from '../tk/scenario.js';
import { snapOf } from './missions.js';
import { previewOf, compareWindows } from '../tk/preview.js';

const NUM = (s) => { const t = String(s).trim(); return /^-?\d+(\.\d+)?$/.test(t) ? parseFloat(t) : NaN; };
const lastOut = (p) => { const outs = p.log.filter((l) => l.t === 'out'); return outs.length ? outs[outs.length - 1].s : ''; };

/* ── 카드 0 — 단추를 눌렀을 때 (교재 5절) ── */
const CMD = `from tkinter import *

def process():                      # 단추를 누르면 실행될 함수
    label["text"] = "단추가 눌렸습니다!"

window = Tk()
label = Label(window, text="아직 누르지 않았습니다.")
label.pack()

button = Button(window, text="클릭", command=process)
button.pack()

window.mainloop()
`;

/* ── 카드 1 — get( ) 은 글자 ── */
const GET = `from tkinter import *

def show():
    value = entry.get()
    print("입력한 값:", value, "/ 자료형:", type(value))
    print("두 배:", value * 2)

window = Tk()
entry = Entry(window)
entry.pack()
Button(window, text="확인", command=show).pack()

window.mainloop()
`;

/* ── 카드 2~6 — 온도 변환기 (교재 6절 1~5단계) ── */
const STEP1 = `from tkinter import *

window = Tk()

l1 = Label(window, text="화씨")
l2 = Label(window, text="섭씨")
l1.pack()
l2.pack()

e1 = Entry(window)
e2 = Entry(window)
e1.pack()
e2.pack()

b1 = Button(window, text="화씨 → 섭씨")
b1.pack()

window.mainloop()
`;
const STEP2 = `from tkinter import *

window = Tk()

Label(window, text="화씨").grid(row=0, column=0)
Label(window, text="섭씨").grid(row=1, column=0)

e1 = Entry(window)
e2 = Entry(window)
e1.grid(row=0, column=1)
e2.grid(row=1, column=1)

b1 = Button(window, text="화씨 → 섭씨")
b1.grid(row=2, column=0, columnspan=2)

window.mainloop()
`;
const STEP3_START = `from tkinter import *

def process():
    # e2 의 0번 자리에 "여기에 결과가 들어갑니다" 를 끼워 넣으세요 (insert)
    pass

window = Tk()

Label(window, text="화씨").grid(row=0, column=0)
Label(window, text="섭씨").grid(row=1, column=0)

e1 = Entry(window)
e2 = Entry(window)
e1.grid(row=0, column=1)
e2.grid(row=1, column=1)

b1 = Button(window, text="화씨 → 섭씨")
b1.grid(row=2, column=0, columnspan=2)

window.mainloop()
`;
const STEP3 = `from tkinter import *

def process():
    e2.insert(0, "여기에 결과가 들어갑니다")

window = Tk()

Label(window, text="화씨").grid(row=0, column=0)
Label(window, text="섭씨").grid(row=1, column=0)

e1 = Entry(window)
e2 = Entry(window)
e1.grid(row=0, column=1)
e2.grid(row=1, column=1)

b1 = Button(window, text="화씨 → 섭씨", command=process)
b1.grid(row=2, column=0, columnspan=2)

window.mainloop()
`;
const STEP4_START = `from tkinter import *

def process():
    fahrenheit = ________(e1.get())        # 문자열 → 숫자
    celsius = ________                     # 섭씨 = (화씨 − 32) × 5 ÷ 9
    e2.delete(0, END)                      # 이전 결과를 지우고
    e2.insert(0, f"{celsius:.2f}")         # 새 결과를 넣는다

window = Tk()

Label(window, text="화씨").grid(row=0, column=0)
Label(window, text="섭씨").grid(row=1, column=0)

e1 = Entry(window)
e2 = Entry(window)
e1.grid(row=0, column=1)
e2.grid(row=1, column=1)

b1 = Button(window, text="화씨 → 섭씨", command=process)
b1.grid(row=2, column=0, columnspan=2)

window.mainloop()
`;
const STEP4 = STEP4_START.replace('fahrenheit = ________(e1.get())        # 문자열 → 숫자', 'fahrenheit = float(e1.get())           # 문자열 → 숫자')
  .replace('celsius = ________                     # 섭씨 = (화씨 − 32) × 5 ÷ 9', 'celsius = (fahrenheit - 32) * 5 / 9     # 섭씨 = (화씨 − 32) × 5 ÷ 9');
const STEP5 = `from tkinter import *

def process():
    fahrenheit = float(e1.get())
    celsius = (fahrenheit - 32) * 5 / 9
    e2.delete(0, END)
    e2.insert(0, f"{celsius:.2f}")

window = Tk()
window.title("온도 변환기")

Label(window, text="화씨", font="helvetica 14 bold").grid(row=0, column=0)
Label(window, text="섭씨", font="helvetica 14 bold").grid(row=1, column=0)

e1 = Entry(window, bg="lightyellow")
e2 = Entry(window, bg="lightyellow")
e1.grid(row=0, column=1, padx=5, pady=5)
e2.grid(row=1, column=1, padx=5, pady=5)

b1 = Button(window, text="화씨 → 섭씨", bg="skyblue", command=process)
b1.grid(row=2, column=0, columnspan=2, pady=5)

window.mainloop()
`;

/** 온도 변환기 자동 검사 — 212 · 32 · 98.6 을 차례로 넣고 단추를 누른다(같은 창에서 — 지우기를 빠뜨리면 드러난다) */
export const TEMP_TESTS = [{ f: '212', c: 100 }, { f: '32', c: 0 }, { f: '98.6', c: 37 }];
export function tempCheck(src) {
  const L = launch(src);
  if (!L.ok) return TEMP_TESTS.map((t, i) => ({ ok: false, label: `화씨 ${t.f} → 섭씨 ${t.c.toFixed(2)}`, why: i === 0 ? L.why : '' }));
  const p = L.p;
  const entries = widgetsOf(p, 'Entry');
  const btn = find(p, 'Button');
  const [e1, e2] = entries;
  if (!e1 || !e2 || !btn) return TEMP_TESTS.map((t) => ({ ok: false, label: `화씨 ${t.f} → 섭씨 ${t.c.toFixed(2)}`, why: '입력 칸 두 개와 단추 하나가 있어야 해요' }));
  let prev = '';
  return TEMP_TESTS.map((t) => {
    const since = p.cbErrors.length;
    type(p, e1, t.f);
    click(p, btn);
    const got = e2.alive ? e2.text : '';
    const errs = newErrors(p, since);
    const ok = Math.abs(NUM(got) - t.c) < 0.006;
    let why = '';
    if (!ok) {
      const e = errs[errs.length - 1];
      if (e && /invalid literal for int/.test(e.last)) why = `${t.f} 처럼 소수가 든 글자는 int( ) 로 바꿀 수 없어요 — float( ) 를 쓰세요`;
      else if (e && /unsupported operand|can only concatenate/.test(e.last)) why = 'get( ) 으로 꺼낸 값은 글자예요 — float( ) 로 숫자로 바꾼 뒤 계산하세요';
      else if (e && /_{3,}/.test(e.last)) why = '빈칸 ________ 이 남아 있어요';
      else if (e) why = `단추를 누르자 오류 — ${e.last}`;
      else if (got === '') why = '섭씨 칸(e2)이 비어 있어요 — 결과를 insert 했나요? 단추에 command 를 연결했나요?';
      else if (prev && got.length > prev.length && (got.endsWith(prev) || got.startsWith(prev))) why = `결과가 앞의 결과에 덧붙었어요(「${got}」) — 넣기 전에 delete(0, END) 로 지우세요`;
      else if (Math.abs(NUM(got) - (Number(t.f) - 32 * 5 / 9)) < 0.01) why = `「${got}」 — 괄호가 빠졌어요. (fahrenheit - 32) 를 먼저 계산해야 해요`;
      else why = `섭씨 칸에 「${got}」 이 나왔어요`;
    }
    prev = got;
    return { ok, label: `화씨 <b>${t.f}</b> → 섭씨 <b>${t.c.toFixed(2)}</b>${ok ? ` (나온 값: ${got})` : ''}`, why };
  });
}

/** 2단계 — 목표 화면(교재 2단계)과 위젯 · 자리가 같은가 */
let step2Goal = null;
export function step2Check(p) {
  step2Goal = step2Goal || previewOf(STEP2).snap;
  const r = compareWindows(snapOf(p), step2Goal);
  return [
    { ok: !!snapOf(p), label: '창이 뜬다', why: p && p.error ? p.error.last : '' },
    { ok: r.stars.widgets, label: '라벨 둘 · 입력 칸 둘 · 단추 하나', why: r.stars.widgets ? '' : r.notes[0] || '' },
    { ok: r.stars.layout, label: '「화씨」 · 「섭씨」 가 입력 칸 왼쪽에, 단추는 맨 아래 두 칸 가운데', why: r.stars.layout ? '' : (r.notes.find((n) => n.startsWith('자리')) || 'grid(row=…, column=…) 를 확인하세요') },
  ];
}

export const MISSIONS2 = {
  cmd: { id: 'cmd', starter: CMD, model: CMD, mistakes: [CMD.replace('command=process)', 'command=process())')],
    actions: [{ do: 'invoke', path: '.!button' }] },
  getstr: {
    id: 'getstr', starter: GET,
    model: GET.replace('value = entry.get()', 'value = int(entry.get())'),
    alts: [GET.replace('value = entry.get()', 'value = float(entry.get())'), GET.replace('print("두 배:", value * 2)', 'print("두 배:", int(value) * 2)')],
    actions: [{ do: 'type', path: '.!entry', text: '17' }, { do: 'invoke', path: '.!button' }],
    /** 17 을 넣으면 「두 배: 34」 (34.0 도 맞다) */
    check(src) {
      const L = launch(src);
      if (!L.ok) return [{ ok: false, label: '17 을 넣고 확인 → 「두 배: 34」', why: L.why }];
      const { p } = L;
      type(p, find(p, 'Entry'), '17');
      const since = p.cbErrors.length;
      click(p, find(p, 'Button'));
      const out = lastOut(p);
      const e = newErrors(p, since).pop();
      const ok = /^두 배: 34(\.0)?$/.test(out);
      return [{ ok, label: '17 을 넣고 확인 → 「두 배: 34」', why: ok ? '' : e ? e.last : out === '두 배: 1717' ? '「1717」 — 글자 17 을 두 번 이어 붙였어요. int( ) 로 숫자로 바꾸세요' : `나온 것: 「${out}」` }];
    },
  },
  temp1: { id: 'temp1', starter: STEP1, model: STEP1 },
  temp2: { id: 'temp2', starter: STEP1, model: STEP2,
    alts: [STEP2.replace('b1.grid(row=2, column=0, columnspan=2)', 'b1.grid(row=2, columnspan=2)')] },
  temp3: { id: 'temp3', starter: STEP3_START, model: STEP3,
    actions: [{ do: 'invoke', path: '.!button' }, { do: 'invoke', path: '.!button' }],
    check(src) {
      const L = launch(src);
      if (!L.ok) return [{ ok: false, label: '단추를 누르면 섭씨 칸에 「여기에 결과가 들어갑니다」', why: L.why }];
      const { p } = L;
      const e2 = widgetsOf(p, 'Entry')[1];
      const since = p.cbErrors.length;
      click(p, find(p, 'Button'));
      const e = newErrors(p, since).pop();
      const ok = !!e2 && e2.text.includes('여기에 결과가 들어갑니다');
      return [{ ok, label: '단추를 누르면 섭씨 칸에 「여기에 결과가 들어갑니다」',
        why: ok ? '' : e ? e.last : 'Button(…, command=process) 로 단추와 함수를 이었나요? 함수 안에서 e2.insert(0, …) 를 했나요?' }];
    } },
  temp4: { id: 'temp4', starter: STEP4_START, model: STEP4,
    alts: [STEP4.replace('e2.insert(0, f"{celsius:.2f}")         # 새 결과를 넣는다', 'e2.insert(0, str(round(celsius, 2)))   # 새 결과를 넣는다')],
    mistakes: [
      STEP4.replace('fahrenheit = float(e1.get())', 'fahrenheit = int(e1.get())'),
      STEP4.replace('celsius = (fahrenheit - 32) * 5 / 9', 'celsius = fahrenheit - 32 * 5 / 9'),
      STEP4.replace('    e2.delete(0, END)                      # 이전 결과를 지우고\n', ''),
      STEP4.replace('fahrenheit = float(e1.get())', 'fahrenheit = e1.get()'),
    ],
    actions: [{ do: 'type', path: '.!entry', text: '212' }, { do: 'invoke', path: '.!button' }, { do: 'type', path: '.!entry', text: '98.6' }, { do: 'invoke', path: '.!button' }],
    check: tempCheck },
  temp5: { id: 'temp5', starter: STEP4, model: STEP5,
    actions: [{ do: 'type', path: '.!entry', text: '212' }, { do: 'invoke', path: '.!button' }],
    check(src) {
      const L = launch(src);
      if (!L.ok) return [{ ok: false, label: '창이 뜬다', why: L.why }];
      const { p } = L;
      const root = p.app.liveRoots[0];
      const labels = widgetsOf(p, 'Label');
      const entries = widgetsOf(p, 'Entry');
      const btn = find(p, 'Button');
      const fonted = labels.some((w) => w.opts.font !== 'TkDefaultFont');
      const coloredE = entries.some((w) => w.opts.background !== 'SystemWindow');
      const coloredB = !!btn && btn.opts.background !== 'SystemButtonFace';
      const calc = tempCheck(src).every((x) => x.ok);
      return [
        { ok: root.title !== 'tk', label: '창 제목 붙이기 — <code>window.title(…)</code>' },
        { ok: fonted, label: '라벨 글꼴 바꾸기 — <code>font=…</code>' },
        { ok: coloredE, label: '입력 칸 바탕색 — <code>Entry(…, bg=…)</code>' },
        { ok: coloredB, label: '단추 바탕색 — <code>Button(…, bg=…)</code>' },
        { ok: calc, label: '꾸며도 계산은 그대로 — 212 · 32 · 98.6 자동 검사', why: calc ? '' : '꾸미다가 계산 부분이 바뀌었어요. process( ) 를 확인하세요' },
      ];
    } },
};

/* ── 카드 7 — 16진수 색과 폰트 (교재 7절) ── */
export const RAINBOW = `from tkinter import *

window = Tk()
colors = ["red", "orange", "yellow", "green", "blue", "violet"]

for i in range(len(colors)):
    Label(window, text=colors[i], relief=RIDGE, width=15).grid(row=i, column=0)
    Button(window, bg=colors[i], width=10).grid(row=i, column=1)

window.mainloop()
`;
MISSIONS2.rainbow = {
  id: 'rainbow', starter: RAINBOW,
  model: RAINBOW.replace('"blue", "violet"]', '"blue", "violet", "#FF8800"]'),
  check(p) {
    const s = snapOf(p);
    const btns = s ? s.widgets.filter((w) => w.cls === 'Button') : [];
    const hex = btns.find((w) => /^#[0-9a-fA-F]{6}$|^#[0-9a-fA-F]{3}$/.test(w.background || ''));
    return [
      { ok: btns.length >= 7, label: `색 단추가 일곱 개 이상 (${btns.length}개)`, why: btns.length >= 7 ? '' : '리스트 colors 에 색을 하나 더 넣으세요 — 반복문이 단추를 저절로 하나 더 만들어요' },
      { ok: !!hex, label: '그 가운데 하나는 <code>"#RRGGBB"</code> 꼴 16진수 색', why: hex ? `찾았어요: ${hex.background}` : '' },
    ];
  },
};

/* ── 카드 8 — 고르기 (교재 8절) ── */
export const RADIO = `from tkinter import *

def show():
    label["text"] = "고른 번호: " + str(choice.get())

window = Tk()
choice = IntVar()          # 고른 값을 담을 변수

Label(window, text="가장 좋아하는 언어를 고르시오").pack()
Radiobutton(window, text="Python", variable=choice, value=1).pack(anchor=W)
Radiobutton(window, text="C",      variable=choice, value=2).pack(anchor=W)
Radiobutton(window, text="Java",   variable=choice, value=3).pack(anchor=W)

label = Label(window, text="아직 고르지 않았습니다.")
label.pack()
Button(window, text="확인", command=show).pack()

window.mainloop()
`;
export const CHECK = `from tkinter import *

window = Tk()
Label(window, text="좋아하는 언어를 모두 고르시오:").grid(row=0, sticky=W)

v1 = IntVar()
v2 = IntVar()
Checkbutton(window, text="Python", variable=v1).grid(row=1, sticky=W)
Checkbutton(window, text="C",      variable=v2).grid(row=2, sticky=W)

window.mainloop()
`;
export const LISTBOX = `from tkinter import *

window = Tk()
lb = Listbox(window, height=4)
lb.pack()

for name in ["Python", "C", "Java", "Swift"]:
    lb.insert(END, name)

window.mainloop()
`;
MISSIONS2.radio = { id: 'radio', starter: RADIO, model: RADIO,
  mistakes: [RADIO.replace('Radiobutton(window, text="C",      variable=choice, value=2)', 'Radiobutton(window, text="C",      variable=IntVar(), value=2)')],
  actions: [{ do: 'invoke', path: '.!radiobutton2' }, { do: 'invoke', path: '.!button' }] };
MISSIONS2.check = { id: 'check', starter: CHECK, model: CHECK,
  actions: [{ do: 'invoke', path: '.!checkbutton-1' }, { do: 'invoke', path: '.!checkbutton-2' }] };
MISSIONS2.listbox = { id: 'listbox', starter: LISTBOX,
  model: LISTBOX.replace('["Python", "C", "Java", "Swift"]', '["Python", "C", "Java", "Swift", "Kotlin"]'),
  alts: [LISTBOX.replace('    lb.insert(END, name)\n', '    lb.insert(END, name)\nlb.insert(END, "Kotlin")\n')],
  check(p) {
    const s = snapOf(p);
    const lb = s && s.widgets.find((w) => w.cls === 'Listbox');
    return [{ ok: !!lb && lb.items.includes('Kotlin') && lb.items.length === 5, label: '목록에 「Kotlin」 을 더해 다섯 개',
      why: lb && !lb.items.includes('Kotlin') ? '리스트에 "Kotlin" 을 넣거나 lb.insert(END, "Kotlin") 을 한 줄 더 쓰세요' : '' }];
  } };

/* ── 카드 9 — 의뢰 2: 코딩 동아리 신청서 ── */
export const ORDER2 = {
  target: `from tkinter import *

def apply():
    count = web.get() + game.get() + ai.get()
    result["text"] = name.get() + "님, " + str(grade.get()) + "학년 · 관심 분야 " + str(count) + "개 신청 완료!"

window = Tk()
window.title("코딩 동아리 신청")

Label(window, text="이름").grid(row=0, column=0)
name = Entry(window)
name.grid(row=0, column=1, columnspan=3)

grade = IntVar()
Label(window, text="학년").grid(row=1, column=0)
Radiobutton(window, text="1학년", variable=grade, value=1).grid(row=1, column=1)
Radiobutton(window, text="2학년", variable=grade, value=2).grid(row=1, column=2)
Radiobutton(window, text="3학년", variable=grade, value=3).grid(row=1, column=3)

web = IntVar()
game = IntVar()
ai = IntVar()
Label(window, text="관심 분야").grid(row=2, column=0)
Checkbutton(window, text="웹", variable=web).grid(row=2, column=1)
Checkbutton(window, text="게임", variable=game).grid(row=2, column=2)
Checkbutton(window, text="AI", variable=ai).grid(row=2, column=3)

Button(window, text="신청하기", command=apply).grid(row=3, column=0, columnspan=4)
result = Label(window, text="")
result.grid(row=4, column=0, columnspan=4)

window.mainloop()
`,
  starter: `from tkinter import *

def apply():
    # 「김여름님, 2학년 · 관심 분야 2개 신청 완료!」 처럼 result 라벨에 보이게 하세요
    pass

window = Tk()
window.title("코딩 동아리 신청")

# 의뢰서를 보고 위젯을 만들어 놓으세요


window.mainloop()
`,
  /** 신청서에 쓰고 · 고르고 · 누른 뒤 결과 라벨 — 사람 둘(가상)로 해 본다 */
  people: [
    { name: '김여름', grade: '2학년', likes: ['웹', 'AI'], want: '김여름님, 2학년 · 관심 분야 2개 신청 완료!' },
    { name: '박가을', grade: '3학년', likes: [], want: '박가을님, 3학년 · 관심 분야 0개 신청 완료!' },
  ],
};
/** 의뢰 2 동작 검사 — 사람마다 새 창을 띄워 글자 넣기 → 학년 고르기 → 관심 분야 켜기 → 신청하기 */
export function order2Run(src) {
  return ORDER2.people.map((who) => {
    const label = `${who.name} · ${who.grade} · 관심 ${who.likes.length ? who.likes.join('·') : '없음'} → 「${who.want}」`;
    const L = launch(src);
    if (!L.ok) return { ok: false, label, why: L.why };
    const { p } = L;
    const entry = find(p, 'Entry');
    const radio = find(p, 'Radiobutton', { text: who.grade });
    const btn = find(p, 'Button', { has: '신청' });
    if (!entry || !radio || !btn) return { ok: false, label, why: `없는 위젯: ${!entry ? '입력 칸' : !radio ? `「${who.grade}」 라디오 단추` : '「신청하기」 단추'}` };
    type(p, entry, who.name);
    click(p, radio);
    for (const t of who.likes) {
      const cb = find(p, 'Checkbutton', { text: t });
      if (!cb) return { ok: false, label, why: `없는 위젯: 「${t}」 체크 단추` };
      click(p, cb);
    }
    const since = p.cbErrors.length;
    click(p, btn);
    const e = newErrors(p, since).pop();
    const shown = widgetsOf(p, 'Label').map((w) => w.shownText);
    const ok = shown.includes(who.want);
    const near = shown.find((t) => t.includes('신청 완료') || t.includes(who.name));
    return { ok, label, why: ok ? '' : e ? e.last : near ? `라벨에 나온 것: 「${near}」` : '결과가 라벨에 보이지 않아요 — result["text"] = … 를 확인하세요' };
  });
}
MISSIONS2.order2 = { id: 'order2', starter: ORDER2.starter, model: ORDER2.target,
  actions: [{ do: 'type', path: '.!entry', text: '김여름' }, { do: 'invoke', path: '.!radiobutton2' },
    { do: 'invoke', path: '.!checkbutton-1' }, { do: 'invoke', path: '.!checkbutton-3' }, { do: 'invoke', path: '.!button' }] };
