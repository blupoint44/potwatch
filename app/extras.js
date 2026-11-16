// Formatting and media only the bounty, leaderboard and profile surfaces
// use: dates, ages, judge win rates, sizes, places and avatar images. This
// module is imported by those surfaces' own modules, so none of it rides
// in the board's first load.

import { mediaUrl } from './api.js';
import { esc } from './format.js';

/** An instant as '17 Nov 2026, 12:30 UTC'. */
export function dateTime(iso) {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '&mdash;';
  return d.toLocaleString('en-GB', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit', hour12: false, timeZone: 'UTC' }) + ' UTC';
}

/** How long ago an instant was: 'just now', '3h ago', '2d ago'. */
export function ago(iso, now = Date.now()) {
  const ms = now - new Date(iso).getTime();
  if (ms < 60000) return 'just now';
  const minutes = Math.floor(ms / 60000);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

/** A judge win rate stored in micro-units (950587) as '95.06%'. */
export function winRate(micro) {
  const n = Number(micro);
  return Number.isFinite(n) ? (n / 10000).toFixed(2) + '%' : '&mdash;';
}

/** A win-rate interval in micro-units as a compact '93.2–96.9%'. */
export function winRange(lowMicro, highMicro) {
  const lo = Number(lowMicro);
  const hi = Number(highMicro);
  if (!Number.isFinite(lo) || !Number.isFinite(hi)) return '&mdash;';
  return `${(lo / 10000).toFixed(1)}&ndash;${(hi / 10000).toFixed(1)}%`;
}

/** A byte count as '660 KB' or '1.2 MB'. */
export function sizeLabel(bytes) {
  const n = Number(bytes);
  if (!Number.isFinite(n)) return '&mdash;';
  if (n < 1024) return `${n} B`;
  if (n < 1048576) return `${Math.round(n / 1024)} KB`;
  return `${(n / 1048576).toFixed(1)} MB`;
}

/** 1 -> '1st', 2 -> '2nd', 23 -> '23rd'. */
export function placeLabel(n) {
  const num = Number(n);
  const mod100 = num % 100;
  if (mod100 >= 11 && mod100 <= 13) return `${num}th`;
  return `${num}${{ 1: 'st', 2: 'nd', 3: 'rd' }[num % 10] || 'th'}`;
}

/** An avatar image (the API's files need crossorigin set to load cross-origin). */
export function avatarImg(src, cls = 'avatar') {
  const url = mediaUrl(src);
  if (!url) return `<span class="${cls} avatar-none" aria-hidden="true"></span>`;
  return `<img class="${cls}" crossorigin="anonymous" src="${esc(url)}" alt="" loading="lazy">`;
}
