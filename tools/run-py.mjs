/*! 🪟 창문 공방 — © 2026 티쳐무 · 모든 권리 보유
 *  파이썬 도구를 UTF-8 모드로 돌린다 — node tools/run-py.mjs <파일.py>
 *  (윈도 명령 창에서 PYTHONUTF8=1 을 앞에 붙이는 문법이 셸마다 달라서 node 로 감쌌다)
 */
import { spawnSync } from 'node:child_process';
const py = process.platform === 'win32' ? 'python' : 'python3';
const r = spawnSync(py, [process.argv[2] || 'tools/golden.py'], { stdio: 'inherit', env: { ...process.env, PYTHONUTF8: '1' } });
process.exit(r.status ?? 1);
