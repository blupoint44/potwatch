// Data layer over make.fun's public API: read-only GET requests, open to any
// origin. Answers carry ETags bound to the minute, so repeat reads revalidate
// with If-None-Match: a 304 costs a header round-trip and reuses the parsed
// body already in memory, and identical in-flight reads share one request.

const API_BASE = 'https://make.fun/api';
export const SITE_BASE = 'https://make.fun';

const etagCache = new Map(); // url -> { etag, body }
const inflight = new Map(); // url -> Promise<body>

async function request(url) {
  const hit = etagCache.get(url);
  const headers = hit && hit.etag ? { 'If-None-Match': hit.etag } : {};
  const res = await fetch(url, { headers });
  if (res.status === 304 && hit) return hit.body;
  if (!res.ok) throw new Error(`make.fun API answered ${res.status}`);
  const body = await res.json();
  const etag = res.headers.get('etag');
  if (etag) etagCache.set(url, { etag, body });
  return body;
}

/** GET one API path, deduplicated while in flight and ETag-cached after. */
export function apiGet(path) {
  const url = API_BASE + path;
  if (!inflight.has(url)) {
    inflight.set(url, request(url).finally(() => inflight.delete(url)));
  }
  return inflight.get(url);
}

/** The bounty board: every competition the API lists as open. */
export const fetchBoard = () => apiGet('/competitions?status=open&activity=times');

/** One bounty's full record: summary, description, rules and live rewards. */
export const fetchBounty = (slug) => apiGet(`/competitions/${encodeURIComponent(slug)}`);

/** One bounty's standings: columns, phase and ranked entries. */
export const fetchLeaderboard = (slug) => apiGet(`/competitions/${encodeURIComponent(slug)}/leaderboard`);

/** One account's public profile: record, socials and entered solutions. */
export const fetchProfile = (handle) => apiGet(`/profiles/${encodeURIComponent(handle)}`);

/** Absolute URL for an API-relative media path (avatars, profile pictures). */
export function mediaUrl(path) {
  if (!path) return null;
  return /^https?:\/\//.test(path) ? path : SITE_BASE + path;
}
