/*! 🪟 창문 공방 — © 2026 티쳐무 · 모든 권리 보유
 *  빌드 결과 점검 — `npm run build` 가 마지막에 부른다.
 *  ① dist/index.html 한 파일로 나왔나 ② 크기 ③ 저작권 표시(HTML 주석 · /*! 배너 둘째 줄까지 · 화면 문구)
 *  ④ 바깥 자원 — 글꼴(jsDelivr · Google Fonts) 말고는 없어야 한다 (인터넷 없는 교실에서도 열리게)
 *  ⑤ 해석기와 카드가 실제로 들어 있나 (개발용 껍데기가 나오면 흰 화면이다)
 */
import { readFileSync, statSync } from 'node:fs';

const bad = [];
const path = 'dist/index.html';
let html = '';
try { html = readFileSync(path, 'utf-8'); } catch (e) { console.error(`  ❌ ${path} 가 없습니다`); process.exit(1); }
const size = statSync(path).size;
if (size < 100_000) bad.push(`크기가 너무 작다 (${size}바이트) — 개발용 껍데기가 나온 것 아닌가?`);
if (!/<!--[\s\S]*?티쳐무[\s\S]*?-->/.test(html)) bad.push('HTML 주석에 저작권 표시가 없다');
// ⚠ 배너는 둘째 줄까지 함께 본다 — 첫 줄은 CSS 머리 주석과 겹쳐, Vite 8 이 스크립트 배너를 지워도 통과할 수 있다
const banner = '/*! 🪟 창문 공방 — © 2026 티쳐무 · 모든 권리 보유\n * 학교 수업 목적으로만 이용해 주세요. 무단 배포·상업적 이용을 금합니다. */';
if (!html.includes(banner)) bad.push('스크립트 /*! 배너가 지워졌다 — vite.config.js 의 output.postBanner 를 볼 것');
if (!html.includes('© 2026 티쳐무 · 모든 권리 보유 · 학교 수업 목적으로만')) bad.push('화면 문구(저작권 줄)가 없다');
const urls = [...html.matchAll(/(?:src|href)=["'](https?:[^"']+)["']/g)].map((m) => m[1]);
const allowed = ['https://cdn.jsdelivr.net', 'https://fonts.googleapis.com', 'https://fonts.gstatic.com'];
const foreign = urls.filter((u) => !allowed.some((a) => u.startsWith(a)));
if (foreign.length) bad.push(`글꼴 말고 바깥 자원이 있다: ${foreign.join(', ')}`);
if (/<script[^>]+src=/.test(html)) bad.push('스크립트가 한 파일에 들어가지 않았다 (src= 로 따로 부른다)');
for (const must of ['_tkinter.TclError', 'mainloop', '꿈누리 분식', '엑스레이', 'Exception in Tkinter callback']) {
  if (!html.includes(must)) bad.push(`빌드 안에 「${must}」 가 없다 — 해석기나 카드가 빠졌다`);
}
const marks = (html.match(/티쳐무/g) || []).length;

if (bad.length) {
  console.log(`\n  ❌ 빌드 결과 점검 — ${bad.length}가지 문제`);
  for (const b of bad) console.log('    · ' + b);
  process.exit(1);
}
console.log(`\n  ✅ 빌드 결과 점검 통과 — dist/index.html ${size.toLocaleString()}바이트 · 「티쳐무」 ${marks}번 · 바깥 자원은 글꼴뿐\n`);
