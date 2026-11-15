/*! 🪟 창문 공방 — © 2026 티쳐무 · 모든 권리 보유
 *  카드 차례 = 수업 흐름 (교재 13장).
 *    1차시(1~4절) — 시작(0·1) → 위젯(2·3) → 배치(4·5·6·7) → 의뢰 1(8) → 정리(9)
 *    2차시(5~8절) — 단추(10) → 꺼내기(11) → 온도 변환기 다섯 단계(12~16) → 색(17) → 고르기(18) → 의뢰 2(19) → 정리(20)
 *    3차시(9~12절) — 좌표 사격장(21) → 갤러리(22) → bind(23) → 그림판(24) → 키보드(25) → 클래스(26) → 숫자 맞추기(27) → 계산기(28) → 버그 병원(29) → 정리(30)
 */
import { introCard, firstCard } from './s1-start.js';
import { placeCard, optionCard } from './s1-widget.js';
import { packCard, gridCard, placeXYCard, mixCard } from './s1-layout.js';
import { orderCard, wrap1Card } from './s1-order.js';
import { cmdCard, getCard } from './s2-event.js';
import { temp1Card, temp2Card, temp3Card, temp4Card, temp5Card } from './s2-temp.js';
import { colorCard, chooseCard, order2Card, wrap2Card } from './s2-more.js';
import { aimCard, galleryCard, bindCard, paintCard, keyCard } from './s3-draw.js';
import { classCard, guessCard, calcCard, clinicCard, wrap3Card } from './s3-more.js';

export const CHAPTERS = [
  { id: 's1', label: '1차시 · 창과 위젯', short: '1차시', color: '#2f6fe4' },
  { id: 's2', label: '2차시 · 단추에 일 시키기', short: '2차시', color: '#e8590c' },
  { id: 's3', label: '3차시 · 그리고 움직이기', short: '3차시', color: '#1f9d55' },
];

export const CARDS = [
  introCard, firstCard,
  placeCard, optionCard,
  packCard, gridCard, placeXYCard, mixCard,
  orderCard, wrap1Card,
  cmdCard, getCard,
  temp1Card, temp2Card, temp3Card, temp4Card, temp5Card,
  colorCard, chooseCard, order2Card, wrap2Card,
  aimCard, galleryCard, bindCard, paintCard, keyCard,
  classCard, guessCard, calcCard, clinicCard, wrap3Card,
];
