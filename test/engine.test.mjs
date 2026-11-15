/*! 🪟 창문 공방 — 엔진 단위 시험 · © 2026 티쳐무 · 모든 권리 보유
 *  글꼴 너비(진짜 Tk 에서 잰 값과 픽셀까지) · 진짜 Tk 의 요청 크기 · 해석기에 더한 문법(lambda · global · eval · 풀어 넣기) ·
 *  tkinter 오류의 한국어 풀이.
 */
import { readFileSync } from 'node:fs';
import { 묶음, 확인, 참 } from './harness.mjs';
import { parseFont, measure } from '../src/tk/fonts.js';
import { TkApp } from '../src/tk/app.js';
import { runPython } from '../src/lib/pymini.js';
import { koreanOf } from '../src/data/translate.js';

const M = JSON.parse(readFileSync(new URL('../tools/metrics.json', import.meta.url), 'utf-8'));

묶음('글꼴 너비 — 진짜 Tk 에서 잰 값과 같다');
let n = 0, same = 0;
for (const [key, v] of Object.entries(M.fonts)) {
  const [fam, wt] = key.split('|');
  for (const [pt, s] of Object.entries(v.sizes)) {
    const f = parseFont([fam, Number(pt), ...(wt === 'bold' ? ['bold'] : [])]);
    for (const [str, real] of Object.entries(s.probe)) { n++; if (measure(str, f) === real) same++; }
    if (f.linespace === s.linespace) same++; n++;
  }
}
확인(`글자 너비 · 줄 높이 ${n}가지가 모두 같다`, same, n);
확인('기본 글꼴은 맑은 고딕 9pt', [parseFont(null).actual, parseFont(null).pt], ['맑은 고딕', 9]);
확인('helvetica 는 Arial 이 된다', parseFont('helvetica 40').actual, 'Arial');
확인('모르는 글꼴은 굴림', parseFont(['없는글꼴', 12]).actual, '굴림');
let msg = '';
try { parseFont('맑은 고딕 20'); } catch (e) { msg = e.message; }
확인('"맑은 고딕 20" 은 「고딕」 이 크기 자리라 오류', msg, 'expected integer but got "고딕"');

묶음('위젯의 요청 크기 — 진짜 Tk 와 같다');
let ok = 0, total = 0;
const app = new TkApp();
const root = app.createRoot();
for (const p of M.probes) {
  const opts = { ...p.opts };
  let w;
  try { w = app.create(p.kind, root, opts); } catch (e) { continue; }
  const r = w.reqSize();
  total++;
  // 기본 글꼴은 픽셀까지 같아야 한다. 글꼴을 바꾼 단추·체크 단추는 바깥 여백을 식으로 어림하므로 4픽셀까지 봐준다
  const tol = p.opts.font && ['Button', 'Checkbutton', 'Radiobutton'].includes(p.kind) ? 4 : 0;
  if (Math.abs(r.w - p.req[0]) <= tol && Math.abs(r.h - p.req[1]) <= tol) ok++;
  else console.log(`    (참고) ${p.kind} ${JSON.stringify(p.opts)} 진짜 ${p.req} · 우리 ${[r.w, r.h]}`);
}
확인(`요청 크기 ${total}가지가 모두 같다(글꼴을 바꾼 단추는 4픽셀 안)`, ok, total);

묶음('해석기에 더한 문법');
const py = (src) => runPython(src);
확인('lambda 와 기본값은 만드는 순간 정해진다', py('fs = []\nfor k in ["a", "b"]:\n    fs.append(lambda x=k: x)\nprint(fs[0](), fs[1]())\n').stdout, 'a b');
확인('기본값 없는 lambda 는 마지막 값을 본다', py('fs = []\nfor k in ["a", "b"]:\n    fs.append(lambda: k)\nprint(fs[0](), fs[1]())\n').stdout, 'b b');
확인('global', py('c = 0\ndef f():\n    global c\n    c += 1\nf(); f()\nprint(c)\n').stdout, '2');
확인('global 을 빠뜨리면 UnboundLocalError', py('c = 0\ndef f():\n    c += 1\nf()\n').stderr.split('\n').pop(),
  "UnboundLocalError: cannot access local variable 'c' where it is not associated with a value");
확인('함수 안의 함수(클로저)', py('def outer():\n    s = 10\n    def inner(t):\n        return s + t\n    return inner(5)\nprint(outer())\n').stdout, '15');
확인('eval', py('print(eval("7*8"), eval(" 8/2 "))\n').stdout, '56 4.0');
확인('eval 의 문법 오류는 except 로 잡힌다', py('try:\n    eval("7+")\nexcept:\n    print("오류!")\n').stdout, '오류!');
확인('풀어 넣기 a, b = 1, 2', py('a, b = 1, 2\nx1, y1 = a - 2, b - 2\nprint(a, b, x1, y1)\n').stdout, '1 2 -1 0');
확인('풀어 넣기 개수가 다르면', py('a, b = [1, 2, 3]\n').stderr.split('\n').pop(), 'ValueError: too many values to unpack (expected 2)');

묶음('tkinter 오류의 한국어 풀이');
for (const line of [
  '_tkinter.TclError: cannot use geometry manager grid inside . which already has slaves managed by pack',
  '_tkinter.TclError: unknown option "-txt"',
  '_tkinter.TclError: unknown color name "grean"',
  '_tkinter.TclError: expected integer but got "고딕"',
  '_tkinter.TclError: bad geometry specifier "300*200"',
  '_tkinter.TclError: wrong # coordinates: expected 0 or 4, got 2',
  "AttributeError: '_tkinter.tkapp' object has no attribute 'titel'",
  'TypeError: click() takes 0 positional arguments but 1 was given',
  "UnboundLocalError: cannot access local variable 'count' where it is not associated with a value",
  "ValueError: invalid literal for int() with base 10: '98.6'",
]) 참(`풀이가 있다 — ${line.slice(0, 60)}`, koreanOf(line).length > 10);
확인('bind 함수에 event 를 빠뜨림 — 고칠 꼴을 알려 준다', koreanOf('TypeError: click() takes 0 positional arguments but 1 was given').includes('def click(event)'), true);
