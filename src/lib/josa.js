/*! 🪟 창문 공방 — © 2026 티쳐무 · 모든 권리 보유
 *  한국어 조사 — 펫 이름을 학생이 지으므로 「비트가 / 별이」 처럼 이름에 따라 조사가 바뀐다.
 *  ⚠ node 로 불러다 시험한다. DOM 을 만들지 말 것.
 */

// 숫자·알파벳은 읽는 소리로 받침을 정한다 (0 영 · 1 일 · 3 삼 · 6 육 · 7 칠 · 8 팔 → 받침 있음)
const DIGIT_BATCHIM = { 0: true, 1: true, 2: false, 3: true, 4: false, 5: false, 6: true, 7: true, 8: true, 9: false };
const LATIN_BATCHIM = new Set(['l', 'm', 'n', 'r']); // 엘 · 엠 · 엔 · 알

/** 마지막 글자에 받침이 있나 (ㄹ 받침인지도 함께 — 「으로/로」 를 고를 때 쓴다) */
export function batchim(word) {
  const s = String(word || '').replace(/[\s)\]'"」』.!?]+$/, '');
  const ch = s[s.length - 1];
  if (!ch) return { has: false, rieul: false };
  const code = ch.charCodeAt(0);
  if (code >= 0xac00 && code <= 0xd7a3) {
    const jong = (code - 0xac00) % 28;
    return { has: jong !== 0, rieul: jong === 8 };
  }
  if (/\d/.test(ch)) return { has: DIGIT_BATCHIM[ch], rieul: ch === '1' || ch === '7' || ch === '8' };
  if (/[a-z]/i.test(ch)) return { has: LATIN_BATCHIM.has(ch.toLowerCase()), rieul: ch.toLowerCase() === 'l' };
  return { has: false, rieul: false };
}

const PAIRS = { 이: ['이', '가'], 은: ['은', '는'], 을: ['을', '를'], 과: ['과', '와'], 아: ['아', '야'], 이에요: ['이에요', '예요'] };

/** 이름 + 조사. 예) j('비트', '이') → '비트가' · j('별', '이') → '별이' · j('비트', '과') → '비트와' */
export function j(word, kind) {
  if (kind === '으로') {
    const b = batchim(word);
    return word + (b.has && !b.rieul ? '으로' : '로');
  }
  const pair = PAIRS[kind];
  if (!pair) return word + kind;
  return word + (batchim(word).has ? pair[0] : pair[1]);
}
