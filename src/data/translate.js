/*! 🪟 창문 공방 — © 2026 티쳐무 · 모든 권리 보유
 *  파이썬 오류 마지막 줄을 한국어로 풀어 준다 — 실행 결과 창에서 오류 줄 아래 말풍선으로 보인다.
 *  영어 원문은 그대로 두고 옆에 덧붙이기만 한다. tkinter(TclError) 오류를 특히 자세히.
 *  ⚠ node 로 불러다 시험한다. DOM 을 만들지 말 것.
 */

// [예외 이름, 원문 꼴, 번역] — 위에서부터 맞는 것 하나를 쓴다. 원문 꼴의 괄호 묶음은 번역의 $1·$2 로 들어간다.
const RULES = [
  // ── tkinter ──
  ['_tkinter.TclError', /^cannot use geometry manager (\w+) inside (\S+) which already has slaves managed by (\w+)$/,
    '같은 창(부모) 안에서는 pack · grid 가운데 한 가지만 쓸 수 있어요 (지금 섞은 것: $3 · $1). 꼭 섞어야 하면 Frame 으로 영역을 나눈 뒤 Frame 마다 다른 방식을 쓰세요.'],
  ['_tkinter.TclError', /^unknown option "-(.+)"$/, "「$1」 이라는 옵션은 없어요. 철자를 확인해 보세요 (text · bg · fg · font · width · height · command …)."],
  ['_tkinter.TclError', /^unknown color name "(.*)"$/, "「$1」 이라는 색 이름은 없어요. red · blue · yellow 처럼 영어 색 이름이나 #FF0000 처럼 16진수로 쓰세요."],
  ['_tkinter.TclError', /^invalid color name "(.*)"$/, "「$1」 은 색으로 읽을 수 없어요. # 뒤에는 16진수 숫자 3·6자리를 써요 (#F80 · #FF8800)."],
  ['_tkinter.TclError', /^expected integer but got "(.*)"$/, "숫자(정수)가 와야 할 자리에 「$1」 이 왔어요. 글꼴을 \"맑은 고딕 20\" 처럼 썼다면 빈칸 때문에 「고딕」 이 크기 자리로 읽혀요 — (\"맑은 고딕\", 20) 처럼 괄호로 묶으세요."],
  ['_tkinter.TclError', /^bad side "(.*)": must be/, "side 에는 top · bottom · left · right 만 쓸 수 있어요 (지금: 「$1」). 상수 TOP · LEFT 를 써도 돼요."],
  ['_tkinter.TclError', /^bad fill style "(.*)"/, "fill 에는 x · y · both · none 만 쓸 수 있어요 (지금: 「$1」)."],
  ['_tkinter.TclError', /^bad anchor "(.*)"/, "anchor 에는 n · s · e · w · ne · nw · se · sw · center 만 쓸 수 있어요 (지금: 「$1」)."],
  ['_tkinter.TclError', /^(?:bad|ambiguous) relief "(.*)"/, "relief 에는 flat · raised · sunken · groove · ridge · solid 만 쓸 수 있어요 (지금: 「$1」)."],
  ['_tkinter.TclError', /^(?:bad|ambiguous) option "-(.+)": must be (.*)$/, "「$1」 이라는 배치 옵션은 없어요. 쓸 수 있는 것: $2"],
  ['_tkinter.TclError', /^bad (row|column) value "(.*)"/, "$1 에는 0 이상의 정수를 써요. 줄과 칸은 0 부터 셉니다 (지금: 「$2」)."],
  ['_tkinter.TclError', /^bad stickyness value "(.*)"/, "sticky 에는 n · s · e · w 를 이어 붙여 써요 (예: \"ew\" · \"nsew\"). 지금: 「$1」"],
  ['_tkinter.TclError', /^bad geometry specifier "(.*)"$/, "창 크기는 \"300x200\" 처럼 써요. 가운데는 영어 소문자 x 이고, 빈칸이나 * 를 쓰면 안 돼요 (지금: 「$1」)."],
  ['_tkinter.TclError', /^wrong # coordinates: expected (.+), got (\d+)$/, '좌표 숫자의 개수가 맞지 않아요 — $1 개가 필요한데 $2 개를 넣었어요. 사각형·원은 꼭짓점 두 개 (x1, y1, x2, y2) 를 넣어요.'],
  ['_tkinter.TclError', /^bad screen distance "(.*)"$/, "크기·좌표 자리에 숫자가 아닌 「$1」 이 왔어요."],
  ['_tkinter.TclError', /^bad event type or keysym "(.*)"$/, "「$1」 은 알 수 없는 이벤트 이름이에요. <Button-1> · <B1-Motion> · <Return> · <KeyPress-Right> 처럼 써요."],
  ['_tkinter.TclError', /^bad (entry|listbox) index "(.*)"/, "자리 번호로 「$2」 를 쓸 수 없어요. 0 · 1 · 2 … 나 END 를 써요."],
  ['_tkinter.TclError', /^can't invoke "(\w+)" command: application has been destroyed$/, '창을 이미 닫은(destroy) 뒤라 위젯을 만들 수 없어요. mainloop( ) 다음 줄은 창을 닫은 뒤에 실행돼요.'],
  ['_tkinter.TclError', /^expected floating-point number but got "(.*)"$/, '숫자가 와야 하는데 「$1」 이 왔어요.'],
  ['_tkinter.TclError', /^.*$/, 'tkinter 가 이해하지 못한 명령이에요. 옵션 이름과 값을 확인해 보세요.'],
  ['AttributeError', /^'_tkinter\.tkapp' object has no attribute '(.+?)'/, "창(Tk)에는 '$1' 이라는 기능이 없어요. 철자를 확인해 보세요 (title · geometry · mainloop …)."],
  ['AttributeError', /^'(Label|Button|Entry|Frame|Canvas|Checkbutton|Radiobutton|Listbox)' object has no attribute '(.+?)'/, "$1 에는 '$2' 라는 기능이 없어요. 철자를 확인해 보세요."],
  ['AttributeError', /^'(\w+)' object has no attribute 'tk'$/, '위젯을 만들 때 첫 번째 값은 위젯을 넣을 창(window)이어야 해요. 예) Label(window, text="안녕")'],
  ['TypeError', /^(\w+)\(\) takes 0 positional arguments but 1 was given$/, "bind 로 연결한 함수는 tkinter 가 넘겨주는 event 를 받아야 해요 — def $1(event): 처럼 괄호 안에 event 를 쓰세요."],
  ['UnboundLocalError', /^cannot access local variable '(.+?)'/, "함수 안에서 $1 에 값을 넣으므로 파이썬은 $1 를 「이 함수만의 변수」 로 봐요. 함수 밖의 $1 를 바꾸려면 함수 첫 줄에 global $1 를 쓰세요."],
  ['RuntimeError', /^Too early to create variable/, 'IntVar · StringVar 같은 변수는 Tk( ) 로 창을 만든 다음에 만들어야 해요.'],
  // ── 읽은 값을 쓸 때 ──
  ['ValueError', /^invalid literal for int\(\) with base 10: (.*)$/, '정수로 바꿀 수 없는 글자예요: $1 — 소수(98.6)는 float( ) 로 바꿔요.'],
  ['ValueError', /^could not convert string to float: (.*)$/, '숫자로 바꿀 수 없는 글자예요: $1'],
  ['ValueError', /^not enough values to unpack/, '= 왼쪽의 이름 수보다 오른쪽 값이 적어요.'],
  ['ValueError', /^too many values to unpack/, '= 왼쪽의 이름 수보다 오른쪽 값이 많아요.'],
  ['IndexError', /^.*$/, '그 번호의 칸이 없어요. 자리 번호는 0 부터 셉니다.'],
  ['TypeError', /^can only concatenate str \(not "(\w+)"\) to str$/, '글자에는 글자만 + 로 이어 붙일 수 있어요. (지금 붙인 것: $1) — str( ) 로 감싸 주세요.'],
  ['TypeError', /^unsupported operand type\(s\) for (.+): '(\w+)' and '(\w+)'$/, '자료형이 맞지 않아 계산할 수 없어요: $2 $1 $3 — get( ) 으로 꺼낸 값은 글자(str)예요. int( ) · float( ) 로 바꿔 보세요.'],
  ['TypeError', /^'(.+)' not supported between instances of '(\w+)' and '(\w+)'$/, '크기를 견줄 수 없는 짝이에요: $2 · $3 — get( ) 으로 꺼낸 값은 글자(str)예요.'],
  ['TypeError', /^'NoneType' object is not callable$/, '부를 수 없는 None 을 부르려 했어요.'],
  ['TypeError', /^(\S+)\(\) missing (\d+) required positional argument/, '$1( ) 에 넣을 값이 $2 개 모자라요.'],
  ['TypeError', /^.*$/, '자료형이 맞지 않는 연산이에요.'],
  ['NameError', /^name '(_{3,})' is not defined/, '빈칸 $1 이 남아 있어요. 알맞은 말로 채워 주세요.'],
  ['NameError', /^name '(Tk|Label|Button|Entry|Frame|Canvas|mainloop|END|LEFT|RIGHT|TOP|BOTTOM)' is not defined/, "'$1' 를 모른대요 — 맨 위에 from tkinter import * 를 썼는지 확인해 보세요."],
  ['NameError', /^name '(.+)' is not defined/, "없는 이름(변수)이에요: '$1' — 철자를 확인하고, 그 이름을 쓰기 전에 만들었는지 확인해 보세요."],
  ['ZeroDivisionError', /^.*$/, '0 으로 나눌 수 없어요.'],
  ['SyntaxError', /^unterminated string literal/, '따옴표를 닫지 않았어요. 여는 따옴표와 닫는 따옴표의 짝을 맞춰 보세요.'],
  ['SyntaxError', /^'\(' was never closed/, '여는 괄호 ( 를 닫지 않았어요.'],
  ['SyntaxError', /^expected ':'$/, '줄 끝에 콜론(:)이 빠졌어요.'],
  ['SyntaxError', /^.*$/, '파이썬 문법에 맞지 않아요. 괄호·따옴표·콜론(:)·쉼표를 확인해 보세요.'],
  ['IndentationError', /^.*$/, '들여쓰기가 맞지 않아요. 줄 앞의 빈칸(4칸)을 확인해 보세요.'],
  ['RecursionError', /^.*$/, '함수가 자기 자신을 끝없이 부르고 있어요.'],
];

// 자료형 이름 — 영어 그대로 두면 학생이 또 막힌다
const TYPE_KO = { int: 'int(정수)', str: 'str(글자)', float: 'float(실수)', list: 'list(리스트)', NoneType: 'None' };

/** 오류 줄 한 줄 → 한국어 풀이. 모르는 꼴이면 '' */
export function koreanOf(line) {
  const m = /^((?:_tkinter\.|io\.)?[A-Za-z_]+(?:Error|Exception|Operation)):?\s*(.*)$/.exec(String(line || '').trim());
  if (!m) return '';
  const [, kind, msg] = m;
  for (const [k, re, ko] of RULES) {
    if (k !== kind) continue;
    const g = re.exec(msg);
    if (!g) continue;
    return ko.replace(/\$(\d)/g, (_, i) => {
      const v = g[Number(i)] ?? '';
      return TYPE_KO[v] || v;
    });
  }
  return '';
}
