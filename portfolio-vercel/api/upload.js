// /api/upload — 이미지 업로드 (관리자만)
// 관리자 페이지가 브라우저에서 이미지를 줄인 뒤(최대 1600px) 보내므로 용량 제한(4.5MB)에 걸리지 않습니다.
import { put } from '@vercel/blob';
import { isAdmin, json } from './_lib.js';

const ALLOWED = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
const MAX_BYTES = 4 * 1024 * 1024;

export async function POST(request) {
  if (!isAdmin(request)) return json({ error: '비밀번호가 올바르지 않습니다.' }, 401);
  try {
    const { filename = 'image', dataUrl = '' } = await request.json();
    const match = /^data:([^;]+);base64,(.+)$/.exec(dataUrl);
    if (!match || !ALLOWED.includes(match[1])) {
      return json({ error: 'jpg, png, webp, gif 이미지만 올릴 수 있습니다.' }, 400);
    }
    const buffer = Buffer.from(match[2], 'base64');
    if (buffer.length > MAX_BYTES) return json({ error: '이미지가 너무 큽니다 (4MB 이하).' }, 400);

    const ext = match[1].split('/')[1].replace('jpeg', 'jpg');
    const base = String(filename).replace(/\.[^.]+$/, '').replace(/[^a-zA-Z0-9_-]/g, '').slice(0, 40) || 'image';
    const blob = await put(`images/${base}.${ext}`, buffer, {
      access: 'public',
      contentType: match[1],
      addRandomSuffix: true,
    });
    return json({ url: blob.url });
  } catch (e) {
    return json({ error: e.message }, 500);
  }
}
