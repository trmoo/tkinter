# 🪟 창문 공방 — © 2026 티쳐무 · 모든 권리 보유
# tkinter 가 오류를 낼 때 Traceback 에 찍히는 「tkinter 안쪽」 칸들을 진짜 파이썬에서 받아 src/tk/tkframes.json 에 담는다.
#
#   node tools/run-py.mjs tools/tkframes.py
#
# 학생 코드에서 Label(window, txt="a") 처럼 틀리면 진짜 파이썬은
#   File "...\tkinter\__init__.py", line 3237, in __init__ … 처럼 tkinter 안쪽 칸을 두세 개 더 보여 준다.
# 가짜 창도 같은 Traceback 을 보여 주려고 그 칸들을 그대로 받아 둔다(줄 번호는 파이썬 3.12.3 기준).
# 함께 「옵션 이름 앞부분만 써도 되나」(tex= → text=) 같은 Tk 의 규칙도 재어 둔다.
import json, os, pathlib, subprocess, sys, tempfile

ROOT = pathlib.Path(__file__).resolve().parent.parent
KINDS = ['Label', 'Button', 'Entry', 'Frame', 'Canvas', 'Checkbutton', 'Radiobutton', 'Listbox']
CASES = {}
for k in KINDS:
    CASES[f'create:{k}'] = f'{k}(w, xyz=1)'
CASES.update({
    'create:Tk': 'Tk(xyz=1)',
    'configure': 'l = Label(w)\nl.configure(xyz=1)',
    'setitem': 'l = Label(w)\nl["xyz"] = 1',
    'cget': 'l = Label(w)\nl.cget("xyz")',
    'getitem': 'l = Label(w)\nl["xyz"]',
    'pack': 'Label(w).pack(side="up")',
    'grid': 'Label(w).grid(row=-1)',
    'place': 'Label(w).place(xyz=1)',
    'geometry': 'w.geometry("300*200")',
    'itemconfigure': 'c = Canvas(w)\nr = c.create_line(1, 2, 3, 4)\nc.itemconfigure(r, xyz=1)',
    'itemconfig': 'c = Canvas(w)\nr = c.create_line(1, 2, 3, 4)\nc.itemconfig(r, xyz=1)',
    'coords': 'c = Canvas(w)\nr = c.create_line(1, 2, 3, 4)\nc.coords(r, 1)',
    'move': 'c = Canvas(w)\nc.move(1, "a", 2)',
    'bind': 'Label(w).bind("<Xyz>", print)',
    'bind_all': 'w.bind_all("<Xyz>", print)',
    'entry.insert': 'e = Entry(w)\ne.insert("x", "a")',
    'entry.delete': 'e = Entry(w)\ne.delete("x")',
    'entry.get': 'e = Entry(w)\ne.get(1)',
    'listbox.insert': 'b = Listbox(w)\nb.insert("x", "a")',
    'listbox.get': 'b = Listbox(w)\nb.get("x")',
    'listbox.delete': 'b = Listbox(w)\nb.delete("x")',
    'title': 'w.title(1, 2)',
    'master': 'Label("hi")',
    'tkattr': 'w.titel("x")',
    'intvar': 'v = IntVar()\nv.set("abc")\nv.get()',
    'early': 'Tk.destroy(w)\nimport tkinter\ntkinter._default_root = None\nIntVar()',
})
for t in ('rectangle', 'oval', 'line', 'polygon', 'arc', 'text'):
    CASES[f'create_{t}'] = f'c = Canvas(w)\nc.create_{t}(1, xyz=1)'

# 옵션 이름 앞부분만 쓰면? — 진짜 Tk 의 규칙을 확인해 둔다
PROBES = {
    'label_tex': 'Label(w, tex="a")', 'label_t': 'Label(w, t="a")', 'label_backg': 'Label(w, backg="red")',
    'pack_sid': 'Label(w).pack(sid="left")', 'pack_p': 'Label(w).pack(p=1)', 'pack_xyz': 'Label(w).pack(xyz=1)',
    'grid_colum': 'Label(w).grid(colum=1)', 'grid_r': 'Label(w).grid(r=1)', 'grid_xyz': 'Label(w).grid(xyz=1)',
    'grid_sti': 'Label(w).grid(row=0, sti="w")', 'place_rel': 'Label(w).place(rel=1)',
    'side_l': 'Label(w).pack(side="l")', 'fill_xx': 'Label(w).pack(fill="xx")', 'anchor_x': 'Label(w).pack(anchor="x")',
    'relief_s': 'Label(w, relief="s")', 'relief_su': 'Label(w, relief="su")',
    'item_fil': 'c = Canvas(w)\nc.create_oval(1,2,3,4, fil="red")', 'item_f': 'c = Canvas(w)\nc.create_oval(1,2,3,4, f="red")',
    'state_dis': 'Button(w, state="dis")',
}

def run(body):
    src = 'from tkinter import *\nw = Tk()\n' + body + '\n'
    with tempfile.TemporaryDirectory(ignore_cleanup_errors=True) as tmp:
        p = pathlib.Path(tmp, 'main.py')
        p.write_text(src, encoding='utf-8')
        r = subprocess.run([sys.executable, 'main.py'], cwd=tmp, capture_output=True, text=True, encoding='utf-8',
                           env={**os.environ, 'PYTHONUTF8': '1'})
        err = r.stderr.replace(sys.base_prefix, 'C:\\Python312').replace('\r\n', '\n')
        err = '\n'.join(l for l in err.split('\n') if 'ThemeChanged' not in l)
        return err.strip('\n')

frames = {}
for key, body in CASES.items():
    err = run(body).split('\n')
    # main.py 칸(두 줄 + 밑줄) 다음부터 마지막 오류 줄 앞까지가 「tkinter 안쪽」 칸들
    i = max(n for n, l in enumerate(err) if l.startswith('  File "') and 'main.py' in l)
    j = i + 2
    while j < len(err) and err[j].strip() and set(err[j].strip()) <= set('^~'):
        j += 1
    frames[key] = {'frames': err[j:-1], 'last': err[-1]}

probes = {k: (run(b).split('\n')[-1] if run(b) else 'OK') for k, b in PROBES.items()}

# dir( ) — 「Did you mean」 이 후보로 쓰는 이름 목록 (AttributeError 가 진짜 파이썬과 같은 이름을 권하도록)
import tkinter as tk
root = tk.Tk()
dirs = {k: dir(getattr(tk, k)(root)) for k in KINDS}
dirs['tkapp'] = dir(root.tk)
dirs['Tk'] = dir(root)
for v in ('IntVar', 'StringVar', 'DoubleVar', 'BooleanVar'):
    dirs[v] = dir(getattr(tk, v)())
seen = {}
f = tk.Frame(root, width=50, height=50)
f.pack()
f.bind('<Button-1>', lambda e: seen.setdefault('click', repr(e)))
f.bind('<Key>', lambda e: seen.setdefault('key', repr(e)))
f.bind('<Motion>', lambda e: seen.setdefault('motion', repr(e)))
root.update()
f.event_generate('<Button-1>', x=5, y=7)
f.event_generate('<Motion>', x=8, y=9)
f.focus_force()
root.update()
f.event_generate('<Key>', keysym='a')
f.event_generate('<Key>', keysym='Return')
root.update()
seen['dir_Event'] = [n for n in dir(tk.Event()) if not n.startswith('__')]
root.destroy()
out = {'python': sys.version.split()[0], 'frames': frames, 'probes': probes, 'dirs': dirs, 'events': seen}
(ROOT / 'src' / 'tk' / 'tkframes.json').write_text(json.dumps(out, ensure_ascii=False, indent=1), encoding='utf-8')
print(f'tkinter 안쪽 칸 {len(frames)}가지 · 규칙 확인 {len(probes)}가지를 src/tk/tkframes.json 에 담았습니다.')
