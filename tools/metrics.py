# 🪟 창문 공방 — © 2026 티쳐무 · 모든 권리 보유
# 진짜 tkinter(이 PC 의 Tk 8.6)에서 「크기를 셈하는 데 필요한 값」 을 재어 src/tk/metrics.json 에 담는다.
#
#   npm run metrics
#
# 가짜 창은 위젯의 크기를 진짜 Tk 와 같은 식으로 셈한다. 그 식에 들어갈 값 —
#   ① 글꼴마다 글자 하나의 너비(120픽셀 크기에서) · 줄 높이
#   ② 위젯마다 기본 옵션 값(bd · padx · relief · 색 …)
#   ③ 확인용 — 여러 위젯의 진짜 요청 크기(reqwidth · reqheight). 시험이 우리 셈과 견준다.
import json, pathlib, sys
import tkinter as tk
import tkinter.font as tkfont

ROOT = pathlib.Path(__file__).resolve().parent.parent
root = tk.Tk()
root.withdraw()

FAMILIES = ['맑은 고딕', 'Arial', 'Courier New', 'Times New Roman', '굴림']
CHARS = ''.join(chr(c) for c in range(32, 127)) + '가·＋×÷°℃←→↑↓★☆♥●○■□…「」『』～'

SIZES = (8, 9, 10, 11, 12, 13, 14, 15, 16, 18, 20, 22, 24, 25, 28, 30, 32, 36, 40, 48, 50, 60)
fonts = {}
for fam in FAMILIES:
    for weight in ('normal', 'bold'):
        f = tkfont.Font(root=root, family=fam, size=-120, weight=weight)
        widths = {ch: f.measure(ch) for ch in CHARS}
        m = f.metrics()
        sizes = {}
        for pt in SIZES:
            g = tkfont.Font(root=root, family=fam, size=pt, weight=weight)
            mm = g.metrics()
            sizes[pt] = {'ascent': mm['ascent'], 'descent': mm['descent'], 'linespace': mm['linespace'],
                         'zero': g.measure('0'),
                         # 그 크기에서 글자 하나하나의 너비 (작은 글씨는 윈도가 모양을 다듬어 비례가 맞지 않는다)
                         'w': [g.measure(ch) for ch in CHARS],
                         'probe': {s: g.measure(s) for s in ('안녕하세요!', 'Hello, tkinter', '화씨를 섭씨로 바꾸기', '0123456789', 'ABCDEFGHIJ abcdefghij')}}
        fonts[f'{fam}|{weight}'] = {'w120': widths, 'ascent120': m['ascent'], 'descent120': m['descent'],
                                    'linespace120': m['linespace'], 'sizes': sizes,
                                    'actual': f.actual()['family']}

# 이름만 적은 글꼴(helvetica · courier · times · 모르는 이름)이 실제로 어느 글꼴이 되는지
aliases = {}
for name in ('helvetica', 'Helvetica', 'courier', 'times', 'arial', 'TkDefaultFont', '나눔고딕', 'Comic Sans MS', 'Consolas', 'xyz없는글꼴'):
    try:
        aliases[name] = tkfont.Font(root=root, font=(name, 12)).actual()['family']
    except Exception as e:
        aliases[name] = 'ERR ' + str(e)
default_font = tkfont.nametofont('TkDefaultFont').actual()
text_font = tkfont.nametofont('TkTextFont').actual()

# 색 이름 — 진짜 Tk 가 알아듣는 이름과 그 색 (모르는 이름은 TclError: unknown color name)
CSS = '''aliceblue antiquewhite aqua aquamarine azure beige bisque black blanchedalmond blue blueviolet brown burlywood
cadetblue chartreuse chocolate coral cornflowerblue cornsilk crimson cyan darkblue darkcyan darkgoldenrod darkgray darkgreen
darkgrey darkkhaki darkmagenta darkolivegreen darkorange darkorchid darkred darksalmon darkseagreen darkslateblue darkslategray
darkslategrey darkturquoise darkviolet deeppink deepskyblue dimgray dimgrey dodgerblue firebrick floralwhite forestgreen fuchsia
gainsboro ghostwhite gold goldenrod gray grey green greenyellow honeydew hotpink indianred indigo ivory khaki lavender
lavenderblush lawngreen lemonchiffon lightblue lightcoral lightcyan lightgoldenrodyellow lightgray lightgreen lightgrey lightpink
lightsalmon lightseagreen lightskyblue lightslategray lightslategrey lightsteelblue lightyellow lime limegreen linen magenta maroon
mediumaquamarine mediumblue mediumorchid mediumpurple mediumseagreen mediumslateblue mediumspringgreen mediumturquoise
mediumvioletred midnightblue mintcream mistyrose moccasin navajowhite navy navyblue oldlace olive olivedrab orange orangered orchid
palegoldenrod palegreen paleturquoise palevioletred papayawhip peachpuff peru pink plum powderblue purple rebeccapurple red
rosybrown royalblue saddlebrown salmon sandybrown seagreen seashell sienna silver skyblue slateblue slategray slategrey snow
springgreen steelblue tan teal thistle tomato turquoise violet wheat white whitesmoke yellow yellowgreen'''.split()
SYSTEM = '''SystemButtonFace SystemButtonText SystemWindow SystemWindowText SystemHighlight SystemHighlightText SystemDisabledText
SystemWindowFrame SystemButtonHighlight SystemButtonShadow SystemGrayText SystemMenu SystemMenuText SystemScrollbar
SystemActiveCaption SystemInfoBackground SystemInfoText SystemButtonDkShadow SystemButtonLight'''.split()
NUMBERED = [f'{b}{i}' for b in ('red', 'green', 'blue', 'yellow', 'orange', 'pink', 'purple', 'gold', 'skyblue', 'tomato',
                                'orchid', 'salmon', 'khaki', 'brown', 'cyan', 'magenta', 'sienna', 'coral', 'turquoise',
                                'seagreen', 'royalblue', 'steelblue', 'springgreen', 'chartreuse', 'firebrick', 'maroon',
                                'lightblue', 'lightpink', 'lightyellow', 'darkorange', 'deeppink', 'dodgerblue', 'hotpink')
            for i in range(1, 5)] + [f'{g}{i}' for g in ('gray', 'grey') for i in range(0, 101)]
SPACED = ['light blue', 'dark green', 'light yellow', 'sky blue', 'light gray', 'light grey', 'dark blue', 'dark red',
          'navy blue', 'forest green', 'light green', 'dark gray', 'hot pink', 'deep pink', 'lemon chiffon', 'alice blue',
          'misty rose', 'light coral', 'pale green', 'light pink', 'dark orange', 'light cyan', 'Light Blue', 'Red', 'RED']
colors = {}
for name in CSS + SYSTEM + NUMBERED + SPACED + ['lightred', 'grean', 'violetred', 'darkpurple', 'darkyellow']:
    try:
        r, g, b = root.winfo_rgb(name)
        colors[name] = '#%02x%02x%02x' % (r >> 8, g >> 8, b >> 8)
    except tk.TclError:
        colors[name] = None

# 위젯마다 기본 옵션
KINDS = ['Label', 'Button', 'Entry', 'Frame', 'Canvas', 'Checkbutton', 'Radiobutton', 'Listbox', 'Text', 'Scale', 'Spinbox']
defaults = {}
for kind in KINDS:
    w = getattr(tk, kind)(root)
    opts = {}
    for k in w.keys():
        try:
            opts[k] = str(w.cget(k))
        except Exception:
            pass
    defaults[kind] = opts
    w.destroy()
defaults['Tk'] = {k: str(root.cget(k)) for k in root.keys()}

# 확인용 — 진짜 요청 크기
probes = []
def probe(kind, **kw):
    w = getattr(tk, kind)(root, **kw)
    w.update_idletasks()
    probes.append({'kind': kind, 'opts': {k: (list(v) if isinstance(v, tuple) else v) for k, v in kw.items()},
                   'req': [w.winfo_reqwidth(), w.winfo_reqheight()]})
    w.destroy()

for t in ('', 'A', '안녕하세요!', '확인', '변환', '+1', '초기화', '이름을 입력하세요:', '1부터 100 사이의 숫자를 입력하시오.', 'Hello'):
    probe('Label', text=t)
    probe('Button', text=t)
for t in ('Python', '파이썬', '수학'):
    probe('Checkbutton', text=t)
    probe('Radiobutton', text=t)
# 글꼴 크기에 따라 단추·체크 단추의 바깥 여백이 함께 커진다 — 여러 크기로 재어 둔다
for fam in ('맑은 고딕', 'Arial'):
    for pt in (8, 10, 12, 15, 20, 30, 40):
        probe('Button', text='확인', font=(fam, pt))
        probe('Button', text='7', font=(fam, pt), width=4)
        probe('Checkbutton', text='수학', font=(fam, pt))
        probe('Label', text='Hello 안녕', font=(fam, pt))
probe('Label', text='큰 글자', font=('맑은 고딕', 20))
probe('Label', text='0', font='helvetica 40')
probe('Label', text='Arial', font=('Arial', 15, 'bold'))
probe('Label', text='넓게', width=10)
probe('Label', text='높게', height=3)
probe('Label', text='여백', padx=10, pady=5)
probe('Label', text='테두리', bd=5, relief='solid')
probe('Label', text='두 줄\n글자')
probe('Button', text='7', width=5)
probe('Button', text='넓게', width=10)
probe('Button', text='큰 버튼', font=('맑은 고딕', 15))
probe('Button', text='여백', padx=20, pady=10)
probe('Entry')
probe('Entry', width=10)
probe('Entry', width=33)
probe('Entry', font=('맑은 고딕', 15))
probe('Frame')
probe('Frame', width=200, height=150)
probe('Canvas')
probe('Canvas', width=400, height=300)
probe('Canvas', width=400, height=300, bd=0, highlightthickness=0)
probe('Listbox')
probe('Listbox', height=4)
probe('Checkbutton')
probe('Radiobutton')

out = {
    'python': sys.version.split()[0], 'tk': str(tk.TkVersion),
    'scaling': root.tk.call('tk', 'scaling'),
    'defaultFont': default_font, 'textFont': text_font, 'aliases': aliases,
    'fonts': fonts, 'defaults': defaults, 'probes': probes, 'colors': colors,
}
path = ROOT / 'tools' / 'metrics.json'
path.write_text(json.dumps(out, ensure_ascii=False, indent=1), encoding='utf-8')

# 앱이 싣는 작은 판 — 글자 너비(120픽셀 크기에서)와 크기별 줄 높이만
compact = {'chars': CHARS, 'aliases': aliases, 'fonts': {}}
# 색 — 진짜 Tk 가 아는 이름만 (대소문자를 가리지 않으므로 소문자로 모아 둔다)
(ROOT / 'src' / 'tk' / 'colordata.json').write_text(json.dumps(
    {k.lower(): v for k, v in colors.items() if v is not None}, ensure_ascii=False, separators=(',', ':')), encoding='utf-8')
for key, v in fonts.items():
    compact['fonts'][key] = {
        'w': [v['w120'][ch] for ch in CHARS],
        'asc': v['ascent120'], 'desc': v['descent120'], 'ls': v['linespace120'],
        # 크기(pt) → [ascent, descent, linespace, '0' 의 너비]
        'pt': {pt: [s['ascent'], s['descent'], s['linespace'], s['zero']] for pt, s in v['sizes'].items()},
        # 크기(pt) → 글자 너비를 글자 하나씩으로 적은 줄 (너비 w → chr(48 + w)) — 표를 작게 싣기 위해
        'pw': {pt: ''.join(chr(48 + x) for x in s['w']) for pt, s in v['sizes'].items()},
    }
(ROOT / 'src' / 'tk' / 'fontdata.json').write_text(json.dumps(compact, ensure_ascii=False, separators=(',', ':')), encoding='utf-8')
print(f'진짜 Tk {tk.TkVersion} 에서 글꼴 {len(fonts)}가지 · 위젯 {len(KINDS)}종 기본값 · 요청 크기 {len(probes)}가지를 재어 {path.name} 에 담았습니다.')
root.destroy()
