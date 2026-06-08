// 헷갈리는 문자(O, 0, I, 1) 제외한 6자리 공유 코드
const CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

export function generateCode(len = 6): string {
  return Array.from({ length: len }, () => CHARS[Math.floor(Math.random() * CHARS.length)]).join('');
}

// 입력 정규화: 대문자 변환 + 허용 문자만 남김
export function normalizeCode(raw: string): string {
  return raw
    .toUpperCase()
    .split('')
    .filter((c) => CHARS.includes(c))
    .join('');
}

export function isValidCode(code: string): boolean {
  return code.length === 6 && [...code].every((c) => CHARS.includes(c));
}
