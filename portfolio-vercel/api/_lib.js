// 공통 함수 (파일명이 _ 로 시작하면 Vercel이 주소로 노출하지 않습니다)
import crypto from 'node:crypto';

// 관리자 비밀번호 확인 — Vercel 환경변수 ADMIN_PASSWORD 와 비교
export function isAdmin(request) {
  const expected = process.env.ADMIN_PASSWORD || '';
  const given = request.headers.get('x-admin-password') || '';
  if (!expected) return false;
  const a = crypto.createHash('sha256').update(expected).digest();
  const b = crypto.createHash('sha256').update(given).digest();
  return crypto.timingSafeEqual(a, b);
}

export function json(data, status = 200, extraHeaders = {}) {
  return Response.json(data, {
    status,
    headers: { 'cache-control': 'no-store', ...extraHeaders },
  });
}
