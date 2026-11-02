// /api/versions — 저장 기록 목록 (관리자만)
import { list } from '@vercel/blob';
import { isAdmin, send } from './_lib.js';

export default async function handler(req, res) {
  if (!isAdmin(req)) return send(res, 401, { error: 'unauthorized' });
  try {
    const { blobs } = await list({ prefix: 'data/', limit: 1000 });
    const versions = blobs
      .sort((a, b) => b.pathname.localeCompare(a.pathname))
      .map((b) => ({ version: b.pathname, savedAt: b.uploadedAt, size: b.size }));
    return send(res, 200, { versions });
  } catch (e) {
    return send(res, 500, { error: e.message });
  }
}
