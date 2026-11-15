/*! 🪟 창문 공방 — © 2026 티쳐무 · 모든 권리 보유
 *  소스 전수 검사 — `npm run check:syntax`
 *
 *  ⚠ 이것이 왜 필요한가 —
 *    `npm test` 는 카드 파일(src/cards · src/ui — DOM 을 만지는 곳)을 부르지 않는다.
 *    그래서 카드 파일에 괄호 하나가 빠져도 시험은 멀쩡히 통과하고 빌드에서야 터진다
 *    (이 앱을 만들 때도 modes.js 에서 괄호 하나가 남아 실제로 겪었다).
 */
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { join, relative } from 'node:path';

const ROOT = process.cwd();
const bad = [];
const collect = (dir, acc = []) => {
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    if (statSync(p).isDirectory()) collect(p, acc);
    else if (/\.(js|mjs)$/.test(name)) acc.push(p);
  }
  return acc;
};
const files = [...collect(join(ROOT, 'src')), ...collect(join(ROOT, 'test')), ...collect(join(ROOT, 'tools')), join(ROOT, 'vite.config.js')];
const noComments = (s) => s.replace(/\/\*[\s\S]*?\*\/|\/\/.*$/gm, '');
console.log(`\n  소스 ${files.length}개를 검사합니다.\n`);

for (const p of files) {
  const name = relative(ROOT, p).replace(/\\/g, '/');
  const src = readFileSync(p, 'utf-8');
  // ① 문법 — .js 는 ES 모듈이므로 모듈로 검사한다
  try {
    execFileSync(process.execPath, ['--input-type=module', '--check'], { input: src, stdio: ['pipe', 'pipe', 'pipe'] });
  } catch (e) {
    bad.push(`${name} — 문법 오류\n      ${String(e.stderr || e).split('\n').slice(0, 5).join('\n      ')}`);
    continue;
  }
  // ② 저작권 머리 주석
  if (!src.startsWith('/*!')) bad.push(`${name} — 머리에 /*! 저작권 주석이 없다`);
  if (!src.slice(0, 300).includes('티쳐무')) bad.push(`${name} — 머리 주석에 「티쳐무」 가 없다`);
  // ③ 원문자는 자바스크립트 이름이 될 수 없다
  const circled = src.match(/(?:function|const|let|var)\s+[^\s(=]*[①-⓿][^\s(=]*/);
  if (circled) bad.push(`${name} — 이름에 원문자를 썼다: ${circled[0]}`);

  if (name.startsWith('src/')) {
    const code = noComments(src);
    // ④ 브라우저 기본 대화상자 — 크롬이 주소를 함께 보여 준다. ui/dom.js 의 modal( ) 을 쓴다
    if (/(^|[^.\w])(alert|confirm|prompt)\s*\(/m.test(code)) bad.push(`${name} — alert·confirm·prompt 를 썼다`);
    // ⑤ 바깥 주소 — 인터넷 없는 교실에서 깨진다
    const urls = (src.match(/https?:\/\/[^\s'"`)<>]+/g) || []).filter((u) => !u.startsWith('http://www.w3.org/'));   // SVG 이름공간은 주소가 아니다
    if (urls.length) bad.push(`${name} — 바깥 주소가 있다: ${urls.join(', ')}`);
    // ⑥ 화면 글자에 원문자(①②③) — 학교 PC 글꼴에 따라 작은 동그라미로만 보였다(실제로 겪었다). 「1.」 로 쓴다
    const shown = code.match(/['"`][^'"`\n]*[①-⑳][^'"`\n]*['"`]/);
    if (shown) bad.push(`${name} — 화면 글자에 원문자를 썼다: ${shown[0].slice(0, 40)}`);
  }
  if (name.startsWith('src/cards/')) {
    // ⑦ 화면 수명 — 카드를 오가도 쌓이지 않게 ui/dom.js 를 거친다
    if (/window\.addEventListener\(/.test(src)) bad.push(`${name} — window 에 직접 리스너를 걸었다. onWindow( ) 를 쓸 것`);
    if (/(^|[^.\w])set(Interval|Timeout)\(/m.test(noComments(src))) bad.push(`${name} — setInterval·setTimeout 을 직접 썼다. screenInterval( )·screenTimeout( ) 을 쓸 것`);
    // ⑧ replaceChildren(null) 은 화면에 「null」 글자를 넣는다 — fill( ) 을 쓴다
    if (/\.replaceChildren\(/.test(src)) bad.push(`${name} — replaceChildren 을 직접 썼다. fill( ) 을 쓸 것`);
  }
  if (/^src\/(data|lib|tk)\//.test(name)) {
    // ⑨ node 로 불러다 시험하는 파일 — DOM 을 만지면 시험이 죽는다
    // ⚠ 데이터 파일의 파이썬 코드에는 window.title( ) 같은 글자가 있으므로 「브라우저의 window」 만 찾는다
    if (/document\.|localStorage|(?<![\w"'`.])window\.(addEventListener|location|innerWidth|innerHeight|requestAnimationFrame|setTimeout)/.test(noComments(src))) bad.push(`${name} — 시험이 node 로 부르는 파일인데 DOM·저장소를 만진다`);
  }
}

// ⑩ 학생 개인정보를 받는 칸이 없어야 한다 (이름·학번 칸을 만들지 않는다 — 펫 이름만)
for (const p of collect(join(ROOT, 'src'))) {
  const s = readFileSync(p, 'utf-8');
  if (/학번|placeholder:\s*'이름/.test(noComments(s))) bad.push(`${relative(ROOT, p)} — 학번·이름을 받는 칸이 있다(개인정보를 받지 않는다)`);
}

if (bad.length) {
  console.log(`  ❌ ${bad.length}가지 문제\n`);
  for (const b of bad) console.log('    ' + b + '\n');
  process.exit(1);
}
console.log('  ✅ 문법 · 저작권 · 원문자 · 기본 대화상자 · 바깥 주소 · 화면 수명 · DOM 규칙 · 개인정보 칸 모두 통과\n');
