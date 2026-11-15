/*! 🪟 창문 공방 — © 2026 티쳐무 · 모든 권리 보유
 *  확인 문제 · 오늘 배운 것 — 교재 13장 확인 문제를 고르기 꼴로 옮겼다.
 *  ★ 교재 4번 해설의 「섞으면 멈춘다」 는 실제 동작(TclError)과 달라서 그 보기는 실제대로 고쳐 실었다.
 *  ⚠ node 로 불러다 시험한다. DOM 을 만들지 말 것.
 */
export const QUIZ1 = [
  {
    q: 'GUI 와 tkinter 에 대한 설명으로 옳지 <b>않은</b> 것은?',
    choices: [
      'tkinter 는 파이썬에 기본으로 들어 있어 따로 설치하지 않아도 된다.',
      'GUI 프로그램은 사용자가 무엇을 할 때마다 그에 맞는 코드가 실행된다.',
      'tkinter 로 만든 창은 구글 코랩에서도 잘 열린다.',
      'tkinter 는 Tcl/Tk 라는 도구를 파이썬에서 쓸 수 있게 감싼 것이다.',
    ],
    answer: 2,
    why: '코랩은 코드를 구글의 서버에서 실행하므로 창이 뜰 화면이 없어요. tkinter 실습은 IDLE 처럼 내 컴퓨터의 파이썬으로 해요.',
  },
  {
    q: 'tkinter 프로그램의 뼈대 <code>window = ㉠</code> … <code>window.㉡</code> — ㉠, ㉡ 의 짝은?',
    choices: ['㉠ <code>Tk()</code> · ㉡ <code>mainloop()</code>', '㉠ <code>Tk</code> · ㉡ <code>pack()</code>', '㉠ <code>Window()</code> · ㉡ <code>show()</code>', '㉠ <code>Tk()</code> · ㉡ <code>loop()</code>'],
    answer: 0,
    why: '<code>Tk()</code> 로 창을 만들고, <code>mainloop()</code> 로 창을 띄운 뒤 기다려요. mainloop() 를 빠뜨리면 창이 번쩍 나타났다 사라져요.',
  },
  {
    q: '<code>label = Label(window, text="안녕하세요!")</code> 만 쓰고 실행했더니 창은 뜨는데 <b>아무것도 보이지 않는다.</b> 까닭은?',
    choices: ['글자색이 바탕색과 같아서', '위젯을 만들기만 하고 배치(pack · grid · place)하지 않아서', 'mainloop() 를 빠뜨려서', '한글을 쓸 수 없어서'],
    answer: 1,
    why: '위젯을 <b>만드는 것</b>과 화면에 <b>놓는 것</b>은 따로예요. <code>label.pack()</code> 을 넣어야 보여요. 오류가 없어 찾기 어려운 실수예요.',
  },
  {
    q: '배치 관리자에 대한 설명으로 옳은 것은?',
    choices: [
      '<code>pack()</code> 은 행과 열을 지정해 표처럼 배치한다.',
      '<code>grid()</code> 는 <code>row</code> 와 <code>column</code> 을 1부터 센다.',
      '<code>place()</code> 는 좌표를 직접 지정해 배치한다.',
      '한 창 안에서 <code>pack()</code> 과 <code>grid()</code> 를 섞어 쓰면 편리하다.',
    ],
    answer: 2,
    why: '표처럼 놓는 것은 grid, 줄·칸은 0 부터 세요. 한 창에서 pack 과 grid 를 섞으면 <code>TclError</code> 가 나요(교재 해설의 「멈춘다」 는 실제와 달라요).',
  },
  {
    q: '「이름」 은 <code>grid(row=0, column=0)</code> 에 있다. 「나이」 를 그 바로 아래에 놓으려면 <code>grid(________)</code> 의 빈칸은?',
    choices: ['<code>row=2, column=1</code>', '<code>row=1, column=1</code>', '<code>row=1, column=0</code>', '<code>row=0, column=1</code>'],
    answer: 2,
    why: '둘째 줄의 첫째 칸이에요. 0 부터 세므로 <code>row=1, column=0</code>. column 의 기본값이 0 이라 <code>grid(row=1)</code> 만 써도 같아요.',
  },
  {
    q: '<code>label.text = "바뀜"</code> 을 실행하면?',
    choices: ['라벨의 글자가 「바뀜」 으로 바뀐다', 'TclError 가 난다', '오류도 없고 화면도 바뀌지 않는다', '라벨이 사라진다'],
    answer: 2,
    why: '파이썬 이름표가 하나 붙을 뿐 화면의 옵션은 그대로예요. <code>label["text"] = "바뀜"</code> 이나 <code>label.config(text="바뀜")</code> 을 써요.',
  },
];

export const REFLECT1 = [
  { q: '창이 있는 프로그램은 어떤 차례로 만드나요?', clue: '창 만들기 · 위젯 · 배치 · mainloop' },
  { q: '위젯을 「만들기」 와 「놓기」 는 어떻게 다른가요?', clue: 'Label( ) · pack( ) · 대기실' },
  { q: 'pack · grid · place 는 각각 언제 쓰면 좋을까요?', clue: '차곡차곡 · 표 · 좌표' },
];

/* ── 2차시 — 교재 확인 문제 6~11 꼴 ── */
export const QUIZ2 = [
  {
    q: '<code>Button(window, text="클릭", command=process())</code> 로 만들면? (<code>process</code> 는 「눌렸습니다」 를 출력하는 함수)',
    choices: ['단추를 누를 때마다 「눌렸습니다」 가 찍힌다', '프로그램이 시작될 때 한 번 찍히고, 단추를 눌러도 아무 일이 없다', 'TypeError 가 나며 창이 뜨지 않는다', '단추가 창에 보이지 않는다'],
    answer: 1,
    why: '괄호를 붙이면 그 자리에서 함수가 실행되고, 돌려준 값 <code>None</code> 이 command 에 들어가요. command 에는 <b>나중에 부를 함수의 이름</b>만 괄호 없이 줘요.',
  },
  {
    q: '입력 칸에 <code>17</code> 을 넣고 확인을 눌렀다. <code>value = entry.get()</code> · <code>print(value, type(value))</code> 의 결과는?',
    choices: ["<code>17 &lt;class 'int'&gt;</code>", "<code>17 &lt;class 'str'&gt;</code>", "<code>'17' &lt;class 'str'&gt;</code>", "<code>17.0 &lt;class 'float'&gt;</code>"],
    answer: 1,
    why: '<code>get()</code> 은 <code>input()</code> 처럼 언제나 <b>글자(str)</b>를 돌려줘요. print 는 글자를 따옴표 없이 찍어요. 계산하려면 <code>int()</code> · <code>float()</code> 로 바꿔요.',
  },
  {
    q: '온도 변환기 <code>fahrenheit = ㉠(e1.get())</code> · <code>celsius = ㉡</code> — 알맞은 짝은?',
    choices: ['㉠ <code>int</code> · ㉡ <code>fahrenheit - 32 * 5 / 9</code>', '㉠ <code>float</code> · ㉡ <code>(fahrenheit - 32) * 5 / 9</code>', '㉠ <code>str</code> · ㉡ <code>(fahrenheit - 32) * 5 / 9</code>', '㉠ <code>float</code> · ㉡ <code>fahrenheit - 32 * 5 / 9</code>'],
    answer: 1,
    why: '온도는 98.6 처럼 소수일 수 있어 <code>float()</code>. 괄호가 없으면 <code>32 * 5 / 9</code> 를 먼저 계산해 값이 달라져요.',
  },
  {
    q: '온도 변환기에서 <code>e2.delete(0, END)</code> 줄을 빼고 단추를 두 번 누르면?',
    choices: ['아무 차이가 없다', '두 번째부터 오류가 난다', '새 결과가 앞의 결과에 덧붙어 「0.00100.00」 처럼 된다', '섭씨 칸이 비어 버린다'],
    answer: 2,
    why: '<code>insert</code> 는 지우지 않고 끼워 넣어요. 그래서 「새로 넣기 전에 먼저 지운다」 — GUI 에서 아주 자주 쓰는 요령이에요.',
  },
  {
    q: '단추의 바탕을 초록, 글자를 흰색으로 — <code>Button(window, text="확인", ㉠="green", ㉡="white")</code>',
    choices: ['㉠ <code>fg</code> · ㉡ <code>bg</code>', '㉠ <code>bg</code> · ㉡ <code>fg</code>', '㉠ <code>color</code> · ㉡ <code>text</code>', '㉠ <code>background</code> · ㉡ <code>font</code>'],
    answer: 1,
    why: '<code>bg</code> 는 background(바탕), <code>fg</code> 는 foreground(글자). 색은 이름이나 <code>"#00AA00"</code> 같은 16진수로 줘요.',
  },
  {
    q: '라디오 단추 셋 가운데 <b>하나만</b> 골라지게 하려면?',
    choices: ['셋 모두 같은 변수(<code>variable=choice</code>)를 가리키게 한다', '셋 모두 같은 <code>value</code> 를 준다', '셋 모두 다른 IntVar 를 준다', '<code>pack</code> 대신 <code>grid</code> 로 놓는다'],
    answer: 0,
    why: '같은 변수를 함께 쓰면 하나를 고를 때 그 변수의 값이 바뀌며 나머지가 저절로 풀려요. 체크 단추는 반대로 <b>각각 다른 변수</b>를 써요.',
  },
];

export const REFLECT2 = [
  { q: 'command=process 와 command=process( ) 는 무엇이 다른가요?', clue: '나중에 부르기 · 지금 바로 · None' },
  { q: 'get( ) 으로 꺼낸 값을 계산하려면 어떻게 하나요?', clue: '글자 · int( ) · float( )' },
  { q: '라디오 단추와 체크 단추는 변수를 어떻게 다르게 쓰나요?', clue: '같은 변수 · 다른 변수 · IntVar' },
];

/* ── 3차시 — 교재 확인 문제 12~18 꼴 ── */
export const QUIZ3 = [
  {
    q: '캔버스 좌표에 대한 설명으로 옳은 것은?',
    choices: ['왼쪽 아래 꼭짓점이 (0, 0) 이고 y 는 위로 갈수록 커진다', '왼쪽 위 꼭짓점이 (0, 0) 이고 y 는 아래로 갈수록 커진다', '캔버스의 한가운데가 (0, 0) 이다', '좌표는 0 이상 100 이하만 쓸 수 있다'],
    answer: 1,
    why: '캔버스는 <b>왼쪽 위가 원점</b>이고 y 가 아래로 커져요. 수학 시간의 좌표와 위아래가 반대라, 도형이 엉뚱한 곳에 그려지면 대개 이 때문이에요.',
  },
  {
    q: '왼쪽 위가 (50, 30), 너비 120, 높이 80 인 사각형 — <code>create_rectangle(50, 30, ㉠, ㉡)</code>',
    choices: ['㉠ 120 · ㉡ 80', '㉠ 170 · ㉡ 110', '㉠ 70 · ㉡ 50', '㉠ 110 · ㉡ 170'],
    answer: 1,
    why: '<code>create_rectangle</code> 은 너비·높이가 아니라 <b>두 꼭짓점</b>을 받아요. 오른쪽 아래 = (50 + 120, 30 + 80) = (170, 110).',
  },
  {
    q: '<code>def click():</code> 을 <code>frame.bind("&lt;Button-1&gt;", click)</code> 로 이었다. 회색 판을 누르면?',
    choices: ['창이 뜨지 않는다', '누를 때마다 TypeError 가 콘솔에 찍히지만 창은 계속 돌아간다', '처음 한 번만 함수가 실행된다', '아무 일도 일어나지 않고 오류도 없다'],
    answer: 1,
    why: 'bind 로 이은 함수에는 tkinter 가 <code>event</code> 를 넘겨줘요. 받을 자리가 없으면 <b>누를 때</b> TypeError — 그래도 tkinter 가 오류를 받아 내서 창은 멈추지 않아요. <code>def click(event):</code> 로 고쳐요.',
  },
  {
    q: '마우스 왼쪽 단추를 <b>누른 채로 움직일 때</b>의 이벤트 이름은?',
    choices: ['<code>&lt;Button-1&gt;</code>', '<code>&lt;Motion&gt;</code>', '<code>&lt;B1-Motion&gt;</code>', '<code>&lt;Return&gt;</code>'],
    answer: 2,
    why: '<code>B1</code> 은 「왼쪽 단추를 누른 상태」. 그림판을 만들 때 써요. <code>&lt;Button-1&gt;</code> 은 누르는 순간, <code>&lt;Motion&gt;</code> 은 그냥 움직일 때예요.',
  },
  {
    q: '중심이 (200, 150), 지름이 100 인 원을 그리는 코드는?',
    choices: ['<code>create_oval(200, 150, 100, 100)</code>', '<code>create_oval(200, 150, 50)</code>', '<code>create_oval(150, 100, 250, 200)</code>', '<code>create_oval(100, 50, 300, 250)</code>'],
    answer: 2,
    why: '원은 <b>감싸는 사각형</b>의 두 꼭짓점으로 그려요. 중심에서 반지름 50 을 빼고 더하면 (150, 100) 과 (250, 200).',
  },
  {
    q: '계수기의 <code>plus()</code> 안에 <code>count += 1</code> 만 쓰고 <code>global count</code> 를 빠뜨렸다. [+1] 을 누르면?',
    choices: ['숫자가 1 씩 잘 늘어난다', 'UnboundLocalError 가 난다', '숫자가 2 씩 늘어난다', '창이 닫힌다'],
    answer: 1,
    why: '함수 안에서 값을 넣는 이름은 「그 함수만의 변수」 로 보는데, 아직 값이 없는데 더하려 해서 UnboundLocalError. <code>global count</code> 를 쓰거나 클래스로 만들어 <code>self.count</code> 를 써요.',
  },
];

export const REFLECT3 = [
  { q: '캔버스의 좌표와 수학 시간의 좌표는 무엇이 다른가요?', clue: '왼쪽 위 · y 는 아래로 · 감싸는 사각형' },
  { q: 'command 와 bind 는 어떻게 다른가요?', clue: '단추 · 마우스 · 키 · event' },
  { q: '함수 안에서 바깥 변수를 바꾸는 두 가지 방법은?', clue: 'global · 클래스 · self' },
];
