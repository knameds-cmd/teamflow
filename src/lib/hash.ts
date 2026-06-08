// PIN을 평문으로 저장하지 않기 위한 단방향 해시.
// 브라우저 기본 제공 Web Crypto(SubtleCrypto)의 SHA-256을 사용한다(외부 라이브러리 0).
// userKey(이름)를 함께 섞어(salt) 같은 PIN이라도 사용자마다 다른 해시가 되게 한다.
//
// 한계(수업용): 보안 규칙이 열려 있으면 이 해시를 읽어 4자리 PIN(1만 가지)을
// 무차별 대입할 수 있다. "이름만 치면 사칭" 수준의 캐주얼한 사칭을 막는 경량 보호이며,
// 운영 서비스라면 Firebase Auth로 대체해야 한다.
export async function hashPin(userKey: string, pin: string): Promise<string> {
  const data = new TextEncoder().encode(`${userKey}:${pin}`);
  const digest = await crypto.subtle.digest('SHA-256', data);
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}
