// /api/auth — 관리자 로그인 확인
import { isAdmin, send } from './_lib.js';

export default function handler(req, res) {
  if (!process.env.ADMIN_PASSWORD) {
    return send(res, 500, { error: 'Vercel 환경변수 ADMIN_PASSWORD 가 설정되지 않았습니다. 설정 후 Redeploy 하세요.' });
  }
  if (!isAdmin(req)) return send(res, 401, { error: '비밀번호가 올바르지 않습니다.' });
  return send(res, 200, { ok: true });
}
