// /api/data
//  GET  : 가장 최근에 저장된 포트폴리오 데이터 (누구나)
//         ?version=data/xxx.json 으로 특정 버전 조회
//  POST : 새 버전으로 저장 (관리자만)
import { put, list, del } from '@vercel/blob';
import { isAdmin, send, getBody } from './_lib.js';

const PREFIX = 'data/';
const KEEP_VERSIONS = 30; // 보관할 저장 기록 개수

async function getVersions() {
  const { blobs } = await list({ prefix: PREFIX, limit: 1000 });
  // 파일명이 저장 시각이라 이름 역순 = 최신순
  return blobs.sort((a, b) => b.pathname.localeCompare(a.pathname));
}

export default async function handler(req, res) {
  try {
    if (req.method === 'GET') {
      const version = req.query.version;
      const fresh = req.query.fresh !== undefined;

      const versions = await getVersions();
      const target = version ? versions.find((b) => b.pathname === version) : versions[0];
      if (!target) return send(res, 404, { error: 'no-data' });

      const r = await fetch(target.url);
      const data = await r.json();
      // 방문자용 응답은 30초간 캐시(비용 절약), 관리자 화면은 항상 최신
      const cache = fresh || version ? 'no-store' : 'public, s-maxage=30, stale-while-revalidate=300';
      return send(res, 200, { data, version: target.pathname, savedAt: target.uploadedAt }, cache);
    }

    if (req.method === 'POST') {
      if (!isAdmin(req)) return send(res, 401, { error: '비밀번호가 올바르지 않습니다.' });
      const body = getBody(req);
      if (!body || typeof body !== 'object' || !body.profile) {
        return send(res, 400, { error: '데이터 형식이 올바르지 않습니다.' });
      }

      // 매번 새 파일로 저장 → 캐시 문제 없이 즉시 반영 + 저장 기록이 쌓임
      const stamp = new Date().toISOString().replace(/[:.]/g, '-');
      const pathname = `${PREFIX}${stamp}.json`;
      await put(pathname, JSON.stringify(body), {
        access: 'public',
        contentType: 'application/json',
        addRandomSuffix: false,
      });

      // 오래된 기록 정리
      const versions = await getVersions();
      const old = versions.slice(KEEP_VERSIONS);
      if (old.length) await del(old.map((b) => b.url));

      return send(res, 200, { ok: true, version: pathname, savedAt: new Date().toISOString() });
    }

    return send(res, 405, { error: 'method not allowed' });
  } catch (e) {
    return send(res, 500, { error: e.message });
  }
}
