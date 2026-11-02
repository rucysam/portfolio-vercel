// /api/auth — 관리자 로그인 확인
import { isAdmin, json } from './_lib.js';

export async function POST(request) {
  if (!process.env.ADMIN_PASSWORD) {
    return json({ error: 'Vercel 환경변수 ADMIN_PASSWORD 가 설정되지 않았습니다.' }, 500);
  }
  return isAdmin(request) ? json({ ok: true }) : json({ error: '비밀번호가 올바르지 않습니다.' }, 401);
}
