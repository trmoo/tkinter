/*! 🪟 창문 공방 — © 2026 티쳐무 · 모든 권리 보유
 *  진짜 tkinter 와 견줄 사례들 — tools/golden.py 가 진짜 파이썬으로 돌려 test/golden.json 을 만든다.
 *  (교재 13장의 tkinter 코드는 golden.py 가 교재 원본에서 따로 가져온다)
 *
 *  사례 = { name, src, actions? }
 *    actions — mainloop 에 들어간 뒤 하는 일
 *      { do:'invoke', path:'.!button' }                  단추 누르기
 *      { do:'type', path:'.!entry', text:'212' }         입력 칸에 글자 넣기
 *      { do:'event', path:'.!frame', seq:'<Button-1>', opts:{x:5,y:5}, focus:true }
 *      { do:'select', path:'.!listbox', index:1 }        목록에서 고르기
 *  ⚠ node 로 불러다 쓴다. DOM 을 만들지 말 것.
 */
import { goldenFromCards } from '../src/data/golden-from-cards.js';

const T = (name, src, actions = [], extra = {}) => ({ name, src, actions, ...extra });

const BASE = [
  T('세 줄 뼈대', `from tkinter import *
window = Tk()
Label(window, text="안녕하세요!").pack()
window.mainloop()
`),
  T('배치를 빠뜨림 — 빈 창', `from tkinter import *
window = Tk()
label = Label(window, text="안녕하세요!")
window.mainloop()
`),
  T('mainloop 를 빠뜨림', `from tkinter import *
window = Tk()
Label(window, text="안녕").pack()
print("끝")
`),
  T('제목과 크기', `from tkinter import *
window = Tk()
window.title("나의 첫 창")
window.geometry("300x200")
Label(window, text="반가워요").pack()
window.mainloop()
`),
  T('기본 제목은 tk', `from tkinter import *
window = Tk()
print(window.title())
window.mainloop()
`),
  T('옵션 꾸미기', `from tkinter import *
window = Tk()
Label(window, text="노란 바탕", bg="yellow", fg="blue").pack()
Label(window, text="크게", font=("맑은 고딕", 20)).pack()
Label(window, text="넓게", width=15, relief="solid", bd=1).pack()
Label(window, text="여백", padx=20, pady=10, bg="lightgreen").pack()
Button(window, text="눌러 보세요", font="helvetica 15").pack()
window.mainloop()
`),
  T('만든 뒤 옵션 바꾸기', `from tkinter import *
window = Tk()
label = Label(window, text="처음")
label.pack()
label["text"] = "바꿨다"
label.config(bg="pink")
print(label["text"], label.cget("bg"))
label.text = "이건 안 바뀐다"
print(label["text"])
window.mainloop()
`),
  T('pack side', `from tkinter import *
window = Tk()
Button(window, text="위").pack(side=TOP)
Button(window, text="왼쪽").pack(side=LEFT)
Button(window, text="오른쪽").pack(side=RIGHT)
Button(window, text="아래").pack(side=BOTTOM)
window.mainloop()
`),
  T('pack fill · expand', `from tkinter import *
window = Tk()
window.geometry("300x200")
Label(window, text="가로로 꽉", bg="skyblue").pack(fill=X)
Label(window, text="남는 자리 모두", bg="pink").pack(fill=BOTH, expand=True)
Label(window, text="왼쪽 아래", bg="gold").pack(side=LEFT, anchor=S, padx=10, pady=5)
window.mainloop()
`),
  T('grid 로그인 양식', `from tkinter import *
window = Tk()
Label(window, text="아이디").grid(row=0, column=0)
Entry(window).grid(row=0, column=1)
Label(window, text="별명").grid(row=1, column=0, sticky=E)
Entry(window, width=10).grid(row=1, column=1, sticky=W)
Button(window, text="로그인").grid(row=2, column=0, columnspan=2, sticky=EW, padx=5, pady=5)
window.mainloop()
`),
  T('grid 비운 칸', `from tkinter import *
window = Tk()
Label(window, text="(0,0)", bg="pink").grid(row=0, column=0)
Label(window, text="(2,3)", bg="skyblue").grid(row=2, column=3)
Label(window, text="(1,1)", bg="gold").grid(row=1, column=1)
window.mainloop()
`),
  T('place 좌표', `from tkinter import *
window = Tk()
window.geometry("300x200")
Label(window, text="(10, 20)", bg="pink").place(x=10, y=20)
Label(window, text="가운데", bg="gold").place(relx=0.5, rely=0.5, anchor=CENTER)
Button(window, text="큰 단추").place(x=150, y=120, width=120, height=50)
window.mainloop()
`),
  T('pack 과 grid 섞기', `from tkinter import *
window = Tk()
Label(window, text="첫째").pack()
Label(window, text="둘째").grid(row=1, column=0)
window.mainloop()
`),
  T('Frame 으로 나누면 섞어도 된다', `from tkinter import *
window = Tk()
top = Frame(window, bg="lightblue")
top.pack(fill=X)
Label(top, text="제목", bg="lightblue").pack()
bottom = Frame(window)
bottom.pack()
Label(bottom, text="이름").grid(row=0, column=0)
Entry(bottom).grid(row=0, column=1)
window.mainloop()
`),
  T('모르는 옵션', `from tkinter import *
window = Tk()
Label(window, txt="안녕").pack()
window.mainloop()
`),
  T('없는 색 이름', `from tkinter import *
window = Tk()
Label(window, text="안녕", bg="grean").pack()
window.mainloop()
`),
  T('글꼴 이름에 빈칸', `from tkinter import *
window = Tk()
Label(window, text="안녕", font="맑은 고딕 20").pack()
window.mainloop()
`),
  T('pack 옵션 틀림', `from tkinter import *
window = Tk()
Label(window, text="안녕").pack(side="up")
window.mainloop()
`),
  T('창 이름 오타', `from tkinter import *
window = Tk()
window.titel("오타")
window.mainloop()
`),
  T('위젯 메서드 오타', `from tkinter import *
window = Tk()
Label(window, text="안녕").pak()
window.mainloop()
`),
  T('괄호 함정 command=process()', `from tkinter import *

def process():
    print("눌렸습니다")

window = Tk()
button = Button(window, text="클릭", command=process())
button.pack()
window.mainloop()
`, [{ do: 'invoke', path: '.!button' }, { do: 'invoke', path: '.!button' }]),
  T('괄호 없이 command=process', `from tkinter import *

def process():
    print("눌렸습니다")

window = Tk()
button = Button(window, text="클릭", command=process)
button.pack()
window.mainloop()
`, [{ do: 'invoke', path: '.!button' }, { do: 'invoke', path: '.!button' }]),
  T('get() 은 문자열', `from tkinter import *

def show():
    value = entry.get()
    print(value, type(value))
    print(value + value)

window = Tk()
entry = Entry(window)
entry.pack()
Button(window, text="확인", command=show).pack()
window.mainloop()
`, [{ do: 'type', path: '.!entry', text: '17' }, { do: 'invoke', path: '.!button' }]),
  T('온도 변환기 int 함정', `from tkinter import *

def process():
    fahrenheit = int(e1.get())
    celsius = (fahrenheit - 32) * 5 / 9
    e2.delete(0, END)
    e2.insert(0, f"{celsius:.2f}")

window = Tk()
Label(window, text="화씨").grid(row=0, column=0)
Label(window, text="섭씨").grid(row=1, column=0)
e1 = Entry(window)
e2 = Entry(window)
e1.grid(row=0, column=1)
e2.grid(row=1, column=1)
Button(window, text="화씨->섭씨", command=process).grid(row=2, column=1)
window.mainloop()
`, [{ do: 'type', path: '.!entry', text: '212' }, { do: 'invoke', path: '.!button' },
    { do: 'type', path: '.!entry', text: '98.6' }, { do: 'invoke', path: '.!button' }]),
  T('mainloop 다음 줄은 창을 닫아야', `from tkinter import *
window = Tk()
print("창을 만들었다")
Label(window, text="안녕").pack()
window.mainloop()
print("창을 닫았다")
`),
  T('창이 뜨기 전의 크기', `from tkinter import *
window = Tk()
Label(window, text="안녕하세요!").pack()
print(window.winfo_width(), window.winfo_height())
print(window.winfo_reqwidth(), window.winfo_reqheight())
window.update()
print(window.winfo_width(), window.winfo_height())
window.mainloop()
`),
  T('str 과 repr', `from tkinter import *
window = Tk()
a = Label(window)
b = Label(window)
f = Frame(window)
c = Button(f)
print(window, a, b, c)
print(repr(b))
print(f.winfo_children())
window.mainloop()
`),
  T('bind event 빠뜨림', `from tkinter import *

def click():
    print("눌렸습니다")

window = Tk()
frame = Frame(window, width=200, height=150, bg="gray")
frame.bind("<Button-1>", click)
frame.pack()
window.mainloop()
`, [{ do: 'event', path: '.!frame', seq: '<Button-1>', opts: { x: 10, y: 20 } }]),
  T('bind event 좌표', `from tkinter import *

def click(event):
    print("눌렸습니다", event.x, event.y)

window = Tk()
frame = Frame(window, width=200, height=150, bg="gray")
frame.bind("<Button-1>", click)
frame.pack()
window.mainloop()
`, [{ do: 'event', path: '.!frame', seq: '<Button-1>', opts: { x: 10, y: 20 } }, { do: 'event', path: '.!frame', seq: '<Button-1>', opts: { x: 150, y: 3 } }]),
  T('계수기 global 빠뜨림', `from tkinter import *

def plus():
    count += 1
    label["text"] = str(count)

count = 0
window = Tk()
label = Label(window, text="0", font="helvetica 40")
label.pack()
Button(window, text="+1", command=plus).pack(side=LEFT)
window.mainloop()
`, [{ do: 'invoke', path: '.!button' }]),
  T('계수기 global', `from tkinter import *

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
print(count)
`, [{ do: 'invoke', path: '.!button' }, { do: 'invoke', path: '.!button' }, { do: 'invoke', path: '.!button' }]),
  T('라디오와 체크', `from tkinter import *

def show():
    print(choice.get(), a.get(), b.get())

window = Tk()
choice = IntVar()
Radiobutton(window, text="Python", variable=choice, value=1, command=show).pack(anchor=W)
Radiobutton(window, text="C", variable=choice, value=2, command=show).pack(anchor=W)
a = IntVar()
b = IntVar()
Checkbutton(window, text="수학", variable=a, command=show).pack(anchor=W)
Checkbutton(window, text="과학", variable=b, command=show).pack(anchor=W)
window.mainloop()
`, [{ do: 'invoke', path: '.!radiobutton2' }, { do: 'invoke', path: '.!checkbutton-1' }, { do: 'invoke', path: '.!radiobutton' }]),
  T('라디오 변수를 따로', `from tkinter import *
window = Tk()
Radiobutton(window, text="A", variable=IntVar(), value=1).pack()
Radiobutton(window, text="B", variable=IntVar(), value=2).pack()
window.mainloop()
`, [{ do: 'invoke', path: '.!radiobutton' }, { do: 'invoke', path: '.!radiobutton2' }]),
  T('리스트박스', `from tkinter import *

def pick(event):
    i = box.curselection()
    print(i, box.get(i[0]))

window = Tk()
box = Listbox(window, height=4)
for f in ["사과", "바나나", "포도"]:
    box.insert(END, f)
box.bind("<<ListboxSelect>>", pick)
box.pack()
window.mainloop()
`, [{ do: 'select', path: '.!listbox', index: 1 }]),
  T('캔버스 도형', `from tkinter import *
window = Tk()
canvas = Canvas(window, width=300, height=200, bg="white")
canvas.pack()
r = canvas.create_rectangle(50, 30, 170, 110, fill="blue")
o = canvas.create_oval(150, 100, 250, 200, fill="red")
canvas.create_line(0, 0, 300, 200, width=3)
canvas.create_text(150, 20, text="그림")
print(r, o, canvas.coords(r), canvas.bbox(o))
window.mainloop()
`),
  T('캔버스 좌표 틀림', `from tkinter import *
window = Tk()
canvas = Canvas(window, width=300, height=200)
canvas.pack()
canvas.create_rectangle(50, 30, fill="blue")
window.mainloop()
`),
  T('키보드로 움직이기', `from tkinter import *

def move_right(event):
    canvas.move(ball, 10, 0)

def move_down(event):
    canvas.move(ball, 0, 10)

window = Tk()
canvas = Canvas(window, width=300, height=200)
canvas.pack()
ball = canvas.create_oval(10, 10, 50, 50, fill="green")
canvas.bind_all("<KeyPress-Right>", move_right)
canvas.bind_all("<KeyPress-Down>", move_down)
window.mainloop()
`, [{ do: 'event', path: '.!canvas', seq: '<KeyPress-Right>', focus: true }, { do: 'event', path: '.!canvas', seq: '<KeyPress-Right>', focus: true },
    { do: 'event', path: '.!canvas', seq: '<KeyPress-Down>', focus: true }]),
  T('계산기 lambda', `from tkinter import *

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
`, [{ do: 'invoke', path: '.!button' }, { do: 'invoke', path: '.!button9' }, { do: 'invoke', path: '.!button2' },
    { do: 'invoke', path: '.!button18' }, { do: 'invoke', path: '.!button4' }, { do: 'invoke', path: '.!button18' }]),
  T('계산기 k=key 빠뜨림', `from tkinter import *

def click(key):
    display.insert(END, key)

window = Tk()
display = Entry(window, width=20)
display.grid(row=0, column=0, columnspan=3)
buttons = ["7", "8", "9"]
for i in range(len(buttons)):
    key = buttons[i]
    Button(window, text=key, width=5, command=lambda: click(key)).grid(row=1, column=i)
window.mainloop()
`, [{ do: 'invoke', path: '.!button' }, { do: 'invoke', path: '.!button2' }]),
  T('클래스 계수기', `from tkinter import *

class CounterApp:
    def __init__(self):
        self.count = 0
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
print("끝")
`, [{ do: 'invoke', path: '.!button' }, { do: 'invoke', path: '.!button' }]),
  T('textvariable', `from tkinter import *

def up():
    n.set(n.get() + 1)

window = Tk()
n = IntVar(value=5)
Label(window, textvariable=n, font=("맑은 고딕", 30)).pack()
Button(window, text="올리기", command=up).pack()
window.mainloop()
print(n.get())
`, [{ do: 'invoke', path: '.!button' }]),
];

export function cases() {
  return [...BASE, ...goldenFromCards()];
}
