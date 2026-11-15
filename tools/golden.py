# 🪟 창문 공방 — © 2026 티쳐무 · 모든 권리 보유
# 진짜 tkinter 로 사례들을 돌려 test/golden.json 을 만든다.     npm run golden
#
# 사례 = ① 교재 13장(pro_practice/tools/content_d.py)에 실린 tkinter 코드 전부
#        ② test/golden-cases.mjs 의 사례(카드에 실린 코드 · 일부러 틀린 코드 · 누르기·치기 같은 동작 포함)
#
# 사례마다 임시 폴더에서 `python main.py` 를 진짜로 실행한다. 다만 mainloop( ) 를 바꿔치기해 두어(sitecustomize.py)
#   창을 한 번 그린 뒤 → 「창의 모습」 을 적고 → 사례에 적힌 동작(단추 누르기 · 글자 치기 · 이벤트)을 하고 →
#   다시 모습을 적은 다음 → 창을 닫는다(그러면 mainloop( ) 다음 줄이 실행된다).
# 화면 출력(stdout) · 오류(stderr, Traceback 까지) · 창의 모습(위젯 자리·크기·글자·값)을 받아 둔다.
import json, os, pathlib, subprocess, sys, tempfile

ROOT = pathlib.Path(__file__).resolve().parent.parent
TEXTBOOK = ROOT.parent / 'tools'

PATCH = r'''
import json, os, tkinter
_ACTIONS = json.loads(os.environ.get('TK_ACTIONS', '[]'))
_SNAP = os.environ['TK_SNAP']
_state = {'done': False}

def _text(c):
    tv = str(c.cget('textvariable'))
    if tv:
        try:
            return str(c.getvar(tv))
        except tkinter.TclError:
            return ''
    return str(c.cget('text'))

def _var(c, name):
    try:
        return str(c.getvar(str(c.cget(name))))
    except tkinter.TclError:
        return ''

def _snapshot(root):
    root.update()
    out = {'title': root.title(), 'w': root.winfo_width(), 'h': root.winfo_height(), 'widgets': []}
    def walk(w):
        for c in w.winfo_children():
            s = {'path': str(c), 'cls': c.winfo_class(), 'manager': c.winfo_manager()}
            if s['manager']:
                s.update(x=c.winfo_x(), y=c.winfo_y(), w=c.winfo_width(), h=c.winfo_height())
            cls = s['cls']
            if cls in ('Label', 'Button', 'Checkbutton', 'Radiobutton'):
                s['text'] = _text(c)
            if cls == 'Entry':
                s['value'] = c.get()
            if cls == 'Checkbutton':
                s['selected'] = _var(c, 'variable') == str(c.cget('onvalue'))
            if cls == 'Radiobutton':
                s['selected'] = _var(c, 'variable') == str(c.cget('value'))
            if cls == 'Listbox':
                s['items'] = [str(x) for x in c.get(0, 'end')]
                s['sel'] = list(c.curselection())
            if cls == 'Canvas':
                s['items'] = [[c.type(i), [round(v, 2) for v in c.coords(i)], str(c.itemcget(i, 'fill'))] for i in c.find_all()]
            for k in ('background', 'foreground'):
                if k in c.keys():
                    s[k] = str(c.cget(k))
            out['widgets'].append(s)
            walk(c)
    walk(root)
    return out

def _act(root, a):
    p = a.get('path', '.')
    w = root if p == '.' else root.nametowidget(p)
    d = a['do']
    if d == 'invoke':
        w.invoke()
    elif d == 'type':
        w.delete(0, 'end')
        w.insert(0, a['text'])
    elif d == 'event':
        if a.get('focus'):
            w.focus_force()
            root.update()
        w.event_generate(a['seq'], **a.get('opts', {}))
    elif d == 'select':
        w.selection_clear(0, 'end')
        w.selection_set(a['index'])
        w.event_generate('<<ListboxSelect>>')
    root.update()

def _mainloop(self, n=0):
    root = self._root() if hasattr(self, '_root') else tkinter._default_root
    if _state['done'] or root is None or not root.winfo_exists():
        return
    _state['done'] = True
    snaps = {'before': _snapshot(root)}
    for a in _ACTIONS:
        if not root.winfo_exists():
            break
        _act(root, a)
    snaps['after'] = _snapshot(root) if root.winfo_exists() else None
    with open(_SNAP, 'w', encoding='utf-8') as f:
        json.dump(snaps, f, ensure_ascii=False)
    if root.winfo_exists():
        root.destroy()

tkinter.Misc.mainloop = _mainloop
tkinter.mainloop = lambda n=0: _mainloop(tkinter._default_root)
'''


def textbook_cases():
    """교재 13장의 tkinter 코드 — 본문 예제와 확인 문제의 코드·풀이"""
    sys.path.insert(0, str(TEXTBOOK))
    import content_d
    out = []
    n = 0
    for b in content_d.CH13['blocks']:
        if b[0] == 'code' and 'tkinter' in b[1] and 'mainloop' in b[1]:
            n += 1
            out.append({'name': f'교재 예제 {n}', 'src': b[1], 'actions': [], 'from': 'textbook'})
    for i, p in enumerate(content_d.CH13['problems'], 1):
        for key in ('code', 'solution'):
            src = p.get(key)
            if src and 'tkinter' in src and 'mainloop' in src and '㉠' not in src and '____' not in src:
                out.append({'name': f'교재 확인 문제 {i} {key}', 'src': src, 'actions': [], 'from': 'textbook'})
    return out


def js_cases():
    dump = subprocess.run(['node', '-e', "import('./test/golden-cases.mjs').then(m => process.stdout.write(JSON.stringify(m.cases())))"],
                          cwd=ROOT, capture_output=True, text=True, encoding='utf-8', check=True)
    return json.loads(dump.stdout)


PREFIX = sys.base_prefix


def run_case(c):
    with tempfile.TemporaryDirectory(ignore_cleanup_errors=True) as tmp:
        pathlib.Path(tmp, 'main.py').write_bytes(c['src'].encode('utf-8'))
        pathlib.Path(tmp, 'sitecustomize.py').write_text(PATCH, encoding='utf-8')
        snap = pathlib.Path(tmp, 'snap.json')
        env = {**os.environ, 'PYTHONUTF8': '1', 'PYTHONDONTWRITEBYTECODE': '1', 'PYTHONPATH': tmp,
               'TK_ACTIONS': json.dumps(c.get('actions') or [], ensure_ascii=False), 'TK_SNAP': str(snap)}
        try:
            r = subprocess.run([sys.executable, 'main.py'], cwd=tmp, capture_output=True, text=True, encoding='utf-8',
                               input='\n'.join(c.get('inputs') or []), env=env, timeout=20)
            stdout, stderr, code = r.stdout, r.stderr, r.returncode
        except subprocess.TimeoutExpired:
            stdout, stderr, code = '', 'TIMEOUT', -1
        real = str(pathlib.Path(tmp).resolve())
        fix = lambda s: ('\n'.join(l for l in (s.replace(real, 'C:\\project').replace(PREFIX, 'C:\\Python312')
                                               .replace('\r\n', '\n')).split('\n')
                                   if 'ThemeChanged' not in l and l.strip() not in ('while executing', '"event generate $w <<ThemeChanged>>"',
                                                                                   '(procedure "ttk::ThemeChanged" line 6)', 'invoked from within', '"ttk::ThemeChanged"'))
                         .rstrip('\n'))
        snaps = json.loads(snap.read_text(encoding='utf-8')) if snap.exists() else None
        # 견줄 때 봐줄 것 — ① 기울인 글꼴(italic)은 글자 너비를 재어 두지 않아 몇 픽셀 다를 수 있다
        #                  ② random 을 쓰면 진짜 파이썬과 이 앱의 무작위 수가 달라 도형 좌표는 견주지 않는다
        tol = c.get('tol', 6 if 'italic' in c['src'] else 0)
        return {'name': c['name'], 'src': c['src'], 'actions': c.get('actions') or [], 'stdout': fix(stdout),
                'stderr': fix(stderr), 'code': code, 'snap': snaps, 'tol': tol, 'random': 'random' in c['src']}


def main():
    cases = textbook_cases() + js_cases()
    out = [run_case(c) for c in cases]
    (ROOT / 'test' / 'golden.json').write_text(
        json.dumps({'python': sys.version.split()[0], 'cases': out}, ensure_ascii=False, indent=1), encoding='utf-8')
    print(f'{len(out)}개 사례(교재 {sum(1 for c in cases if c.get("from") == "textbook")} · 앱 {len(cases) - sum(1 for c in cases if c.get("from") == "textbook")})를 '
          f'진짜 파이썬 {sys.version.split()[0]} · Tk 로 돌려 test/golden.json 에 담았습니다.')


if __name__ == '__main__':
    main()
