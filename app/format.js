// Presentation helpers: HTML escaping, money, pots, fees and countdowns.
// The Markdown renderer for bounty texts lives in md.js, loaded on demand.

const ESCAPES = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };

/** Text made safe to place inside HTML. */
export function esc(value) {
  return String(value ?? '').replace(/[&<>"']/g, (c) => ESCAPES[c]);
}

/** A dollar amount ('666.00' or 0.5) as '$666' or '$0.50'. */
export function money(value) {
  const n = Number(value);
  if (!Number.isFinite(n)) return '&mdash;';
  const digits = Number.isInteger(n) ? 0 : 2;
  return '$' + n.toLocaleString('en-US', { minimumFractionDigits: digits, maximumFractionDigits: digits });
}

/** The reward as it stands now: the prize plus every entry fee paid into it. */
export function potOf(bounty) {
  return money(bounty.potUsd ?? bounty.rewardAmount);
}

/** The entry fee as money, or null when the bounty is free to enter. */
export function feeOf(bounty) {
  const fee = Number(bounty.entryFeeUsd);
  return Number.isFinite(fee) && fee > 0 ? money(fee) : null;
}

/** A bounty takes entries until its deadline, whatever its status says. */
export function isLive(bounty, now = Date.now()) {
  return new Date(bounty.deadline).getTime() > now;
}

/** The time until a deadline: '2d 4h left', '35m left', 'closing', or 'ended'. */
export function timeLeft(iso, now = Date.now()) {
  const ms = new Date(iso).getTime() - now;
  if (ms <= 0) return 'ended';
  const minutes = Math.floor(ms / 60000);
  if (minutes < 1) return 'closing';
  const days = Math.floor(minutes / 1440);
  const hours = Math.floor((minutes % 1440) / 60);
  if (days > 0) return `${days}d ${hours}h left`;
  if (hours > 0) return `${hours}h ${minutes % 60}m left`;
  return `${minutes}m left`;
}

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
