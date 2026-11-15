/*! 🪟 창문 공방 — © 2026 티쳐무 · 모든 권리 보유
 *  가짜 창의 글꼴 — 글꼴 이름 풀기 · 글자 너비 · 줄 높이.
 *
 *  위젯의 크기는 「글자가 얼마나 넓고 높은가」 에서 정해진다. 그래서 진짜 tkinter(윈도 · Tk 8.6)가
 *  재어 준 값(tools/metrics.py → fontdata.json)으로 셈한다. 브라우저의 글자 너비를 쓰지 않는 까닭은
 *  ① 시험(node)에서도 같은 값이 나와야 하고 ② 진짜 Tk 의 크기와 가까워야 하기 때문이다.
 *  ⚠ node 로 불러다 시험한다. DOM 을 만들지 말 것.
 */
import DATA from './fontdata.json' with { type: 'json' };

const CHAR_AT = new Map([...DATA.chars].map((c, i) => [c, i]));

/** 진짜 Tk 가 이름만 보고 고르는 글꼴 (윈도) — 없는 이름은 굴림이 된다 */
const ALIAS = {
  helvetica: 'Arial', arial: 'Arial', courier: 'Courier New', 'courier new': 'Courier New',
  times: 'Times New Roman', 'times new roman': 'Times New Roman',
  '맑은 고딕': '맑은 고딕', 'malgun gothic': '맑은 고딕', '굴림': '굴림', gulim: '굴림',
};
/** 이름 붙은 글꼴(TkDefaultFont 등) — 윈도 Tk 8.6 의 실제 값 */
const NAMED = {
  TkDefaultFont: { family: '맑은 고딕', size: 9 }, TkTextFont: { family: '맑은 고딕', size: 9 },
  TkHeadingFont: { family: '맑은 고딕', size: 9, weight: 'bold' }, TkCaptionFont: { family: '맑은 고딕', size: 9 },
  TkMenuFont: { family: '맑은 고딕', size: 9 }, TkFixedFont: { family: 'Courier New', size: 10 },
};

/** 브라우저에서 그릴 때의 글꼴 이름 (윈도 이름 → CSS 이름) */
const CSS_NAME = { '맑은 고딕': '"Malgun Gothic", "맑은 고딕"', '굴림': 'Gulim, "굴림"', Arial: 'Arial', 'Courier New': '"Courier New", monospace', 'Times New Roman': '"Times New Roman", serif' };

export class FontError extends Error {}

/* Tcl 목록 쪼개기 — "{맑은 고딕} 20 bold" 처럼 중괄호로 묶은 낱말을 하나로 */
function tclList(s) {
  const out = [];
  let i = 0;
  while (i < s.length) {
    while (i < s.length && /\s/.test(s[i])) i++;
    if (i >= s.length) break;
    if (s[i] === '{') {
      let depth = 1, j = i + 1;
      while (j < s.length && depth) { if (s[j] === '{') depth++; else if (s[j] === '}') depth--; j++; }
      if (depth) throw new FontError('unmatched open brace in list');
      out.push(s.slice(i + 1, j - 1)); i = j;
    } else if (s[i] === '"') {
      const j = s.indexOf('"', i + 1);
      if (j < 0) throw new FontError('unmatched open quote in list');
      out.push(s.slice(i + 1, j)); i = j + 1;
    } else {
      let j = i;
      while (j < s.length && !/\s/.test(s[j])) j++;
      out.push(s.slice(i, j)); i = j;
    }
  }
  return out;
}

/**
 * 글꼴 지정 → 글꼴 정보.
 *   spec : null(기본) | 'helvetica 40' | ['맑은 고딕', 20] | ['Arial', 15, 'bold'] | 'TkDefaultFont'
 *   진짜 Tk 처럼 크기 자리에 숫자가 아니면 오류(FontError)를 던진다 — 예) "맑은 고딕 20" 은 「고딕」 이 크기 자리
 */
export function parseFont(spec, fallback = 'TkDefaultFont') {
  if (spec == null || spec === '') spec = fallback;
  let parts;
  if (typeof spec === 'string') {
    if (NAMED[spec]) return resolve({ ...NAMED[spec] });
    parts = tclList(spec);
  } else parts = spec.map((x) => String(x));
  if (!parts.length) return resolve({ ...NAMED[fallback] });
  const [family, size, ...styles] = parts;
  let n = 0;
  if (size !== undefined && size !== '') {
    if (!/^[-+]?\d+$/.test(String(size).trim())) throw new FontError(`expected integer but got "${size}"`);
    n = parseInt(size, 10);
  }
  const f = { family, size: n || 0, weight: 'normal', slant: 'roman', underline: false, overstrike: false };
  for (const st of styles.flatMap((s) => tclList(String(s)))) {
    if (st === 'bold') f.weight = 'bold';
    else if (st === 'normal') f.weight = 'normal';
    else if (st === 'italic') f.slant = 'italic';
    else if (st === 'roman') f.slant = 'roman';
    else if (st === 'underline') f.underline = true;
    else if (st === 'overstrike') f.overstrike = true;
    else throw new FontError(`unknown font style "${st}"`);
  }
  return resolve(f);
}

function resolve(f) {
  const want = String(f.family || '');
  const actual = ALIAS[want.toLowerCase()] || ALIAS[want] || (DATA.fonts[`${want}|normal`] ? want : '굴림');
  const pt = f.size === 0 ? (want === '' ? 9 : 12) : f.size;   // 크기를 비우면 진짜 Tk 는 12pt 로 잡는다
  const px = pt > 0 ? Math.round(pt * 96 / 72) : -pt;
  const key = `${actual}|${f.weight === 'bold' ? 'bold' : 'normal'}`;
  const d = DATA.fonts[key];
  const row = pt > 0 && d.pt[pt];
  const scale = (v) => Math.round(v * px / 120);
  const ascent = row ? row[0] : scale(d.asc);
  const descent = row ? row[1] : scale(d.desc);
  const linespace = row ? row[2] : scale(d.ls);
  const font = {
    family: want || '맑은 고딕', actual, size: f.size || pt, pt, px, weight: f.weight || 'normal', slant: f.slant || 'roman',
    underline: !!f.underline, overstrike: !!f.overstrike,
    ascent, descent, linespace, key,
  };
  font.zero = row ? row[3] : measure('0', font);
  font.css = cssFont(font);
  return font;
}

/** 글자 하나의 너비(120픽셀 표) — 표에 없는 넓은 글자(한글·한자)는 「가」, 나머지는 「0」 의 너비 */
const WIDE = (ch) => { const cp = ch.codePointAt(0); return cp >= 0x1100 && !(cp >= 0x2000 && cp < 0x2e80); };
function charW(ch, d) {
  const i = CHAR_AT.get(ch);
  if (i !== undefined) return d.w[i];
  return d.w[CHAR_AT.get(WIDE(ch) ? '가' : '0')];
}

/** 글자 너비(픽셀) — 여러 줄이면 가장 긴 줄.
 *  재어 둔 크기(pt)면 그 크기의 글자 너비를 그대로 더한다(진짜 윈도와 같다).
 *  아니면 120픽셀 표를 그 크기로 줄여 글자마다 반올림한다(몇 픽셀 어긋날 수 있다). */
export function measure(text, font) {
  const d = DATA.fonts[font.key];
  const row = font.pt > 0 ? d.pw[font.pt] : null;
  const one = row
    ? (ch) => { const i = CHAR_AT.get(ch); return row.charCodeAt(i !== undefined ? i : CHAR_AT.get(WIDE(ch) ? '가' : '0')) - 48; }
    : (ch) => Math.round(charW(ch, d) * font.px / 120);
  let best = 0;
  for (const line of String(text).split('\n')) {
    let w = 0;
    for (const ch of line) w += one(ch);
    best = Math.max(best, w);
  }
  return best;
}

/** 브라우저에서 그릴 CSS 글꼴 — 진짜 이름을 먼저, 없으면 비슷한 것으로 */
export function cssFont(font) {
  const fam = [`"${font.family}"`, CSS_NAME[font.actual] || '', '"Malgun Gothic"', 'sans-serif'].filter(Boolean).join(', ');
  return `${font.slant === 'italic' ? 'italic ' : ''}${font.weight === 'bold' ? 'bold ' : ''}${font.px}px ${fam}`;
}

/** font.actual( ) 처럼 보여 줄 값 */
export function describeFont(font) {
  return `${font.family} ${font.size}${font.weight === 'bold' ? ' bold' : ''}${font.slant === 'italic' ? ' italic' : ''}`;
}
