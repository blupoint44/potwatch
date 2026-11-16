// A bounty's leaderboard: the judge's win rates with their 90% intervals,
// paged at 60 rows with a show-all button so a big field never dumps
// hundreds of rows into the page at once.

import { avatarImg, dateTime, sizeLabel, winRange, winRate } from './extras.js';
import { esc } from './format.js';

/** One leaderboard row: rank, entrant, entry, win rate (with bar) and interval. */
export function leaderboardRow(e) {
  const v = e.values || {};
  const range = winRange(v.judge_low, v.judge_high);
  const pct = Number.isFinite(Number(v.judge)) ? (Number(v.judge) / 10000).toFixed(1) : 0;
  const cls = [e.house || e.baseline ? 'row-house' : '', e.rank <= 3 ? 'row-top' : ''].filter(Boolean).join(' ');
  return `
  <tr${cls ? ` class="${cls}"` : ''}>
    <td class="rank">${e.rank}</td>
    <td><span class="entrant">${avatarImg(e.image)}<a href="#/u/${encodeURIComponent(e.handle)}">${esc(e.handle)}</a>${e.house || e.baseline ? ' <span class="chip">house</span>' : ''}</span></td>
    <td class="entry-name">${esc(e.title || '')}</td>
    <td class="num"><span class="bar" aria-hidden="true"><i style="width:${pct}%"></i></span><span class="strong">${winRate(v.judge)}</span></td>
    <td class="num dim">${range}</td>
    <td>${v.valid ? '&#10003;' : '&mdash;'}</td>
    <td class="num dim">${sizeLabel(v.bytes)}</td>
  </tr>`;
}

/** A bounty's leaderboard: phase note, then the ranked table. */
export function leaderboardView(b, lb, limit = 60) {
  const entries = lb.entries || [];
  const shown = entries.slice(0, limit);
  const phase = lb.phase ? `${esc(lb.phase.title || '')} phase` : '';
  return `
  <p class="crumbs"><a href="#/bounty/${encodeURIComponent(b.slug)}">&larr; ${esc(b.title)}</a></p>
  <h1>Leaderboard</h1>
  <p class="lead">${esc(b.title)} &mdash; ${phase}${lb.phase?.ends_at ? `, ends ${dateTime(lb.phase.ends_at)}` : ''}.
    Win rates are the judge's, with the 90% interval beside them.${lb.metrics_withheld ? ' Some metrics are withheld until the final.' : ''}</p>
  <div class="table-scroll"><table class="data-table standings">
    <thead><tr><th>#</th><th>Entrant</th><th>Entry</th><th class="num">Win rate</th><th class="num">90% range</th><th>Valid</th><th class="num">Size</th></tr></thead>
    <tbody>${shown.map(leaderboardRow).join('') || '<tr><td colspan="7" class="empty">No entries yet.</td></tr>'}</tbody>
  </table></div>
  ${entries.length > shown.length ? `<p class="center"><button class="btn" data-action="lb-all" type="button">Show all ${entries.length} entries</button></p>` : ''}
  <p class="note">${entries.length} entries &middot; updated from the live standings.</p>`;
}

