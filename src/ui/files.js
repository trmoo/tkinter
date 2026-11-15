/*! 🪟 창문 공방 — © 2026 티쳐무 · 모든 권리 보유
 *  파일로 내려받기 — 학생이 만든 코드를 .py 로 받아 IDLE 에서 F5 로 진짜 창을 띄워 보게 한다.
 */
import { h, toast } from './dom.js';

/** 코드 하나를 .py 로 (윈도 메모장·IDLE 에서 잘 열리게 줄바꿈을 CRLF 로) */
export function downloadPy(code, name = 'main.py') {
  const blob = new Blob([code.replace(/\r?\n/g, '\r\n')], { type: 'text/x-python;charset=utf-8' });
  const a = h('a', { href: URL.createObjectURL(blob), download: name });
  document.body.appendChild(a);
  a.click();
  setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 1000);
  toast('⬇ 내려받았어요 — IDLE 에서 열고 F5 를 눌러 보세요');
}
