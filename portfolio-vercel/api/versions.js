// /api/versions — 저장 기록 목록 (관리자만)
import { list } from '@vercel/blob';
import { isAdmin, json } from './_lib.js';

export async function GET(request) {
  if (!isAdmin(request)) return json({ error: 'unauthorized' }, 401);
  try {
    const { blobs } = await list({ prefix: 'data/', limit: 1000 });
    const versions = blobs
      .sort((a, b) => b.pathname.localeCompare(a.pathname))
      .map((b) => ({ version: b.pathname, savedAt: b.uploadedAt, size: b.size }));
    return json({ versions });
  } catch (e) {
    return json({ error: e.message }, 500);
  }
}
