// 공통 함수 (파일명이 _ 로 시작하면 Vercel이 주소로 노출하지 않습니다)
import crypto from 'node:crypto';

// 관리자 비밀번호 확인 — Vercel 환경변수 ADMIN_PASSWORD 와 비교
// (한글 비밀번호도 쓸 수 있도록 브라우저에서 인코딩해서 보냄)
export function isAdmin(req) {
  const expected = process.env.ADMIN_PASSWORD || '';
  let given = req.headers['x-admin-password'] || '';
  try { given = decodeURIComponent(given); } catch (e) { /* 그대로 사용 */ }
  if (!expected) return false;
  const a = crypto.createHash('sha256').update(expected).digest();
  const b = crypto.createHash('sha256').update(String(given)).digest();
  return crypto.timingSafeEqual(a, b);
}

// 응답 보내기
export function send(res, status, data, cache = 'no-store') {
  res.setHeader('Cache-Control', cache);
  res.status(status).json(data);
}

// 요청 본문(JSON) 읽기
export function getBody(req) {
  if (req.body && typeof req.body === 'object') return req.body;
  try { return JSON.parse(req.body || '{}'); } catch (e) { return {}; }
}
