// Presentation helpers the board itself needs: HTML escaping, money, pots,
// fees and countdowns. The formatting only the other surfaces use (dates,
// win rates, places, avatars) lives in extras.js and loads with them, and
// the Markdown renderer lives in md.js, likewise loaded on demand.

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
