// A bounty's own page: headline stats, the rewards table with the live pot,
// the description and rules (Markdown, rendered by md.js), and latest entries.

import { markdown } from './md.js';
import { ago, dateTime, esc, feeOf, money, placeLabel, potOf, timeLeft } from './format.js';
import { statusChip } from './views.js';

/** The rewards table: what each place pays now, fee share included. */
export function rewardsTable(b) {
  const now = Array.isArray(b.rewardsNow) && b.rewardsNow.length ? b.rewardsNow : null;
  const rows = now
    ? now.map((r) => `<tr><td>${placeLabel(r.place)}</td><td class="num strong">${money(r.amountUsd)}</td><td class="num">${money(r.baseUsd)}</td><td class="num">${money(r.feeShareUsd)}</td></tr>`).join('')
    : Object.entries(b.rewards || {}).sort((a, c) => Number(a[0]) - Number(c[0]))
        .map(([place, amount]) => `<tr><td>${placeLabel(place)}</td><td class="num strong">${money(amount)}</td><td class="num">${money(amount)}</td><td class="num">$0</td></tr>`).join('');
  if (!rows) return '';
  const fees = Number(b.entryFeesUsd) > 0
    ? `<p class="note">${b.entryFeePayers ?? 0} entry fees paid in so far (${money(b.entryFeesUsd)}), split over the places below.</p>`
    : '';
  return `
  <h2>Rewards</h2>
  ${fees}
  <div class="table-scroll"><table class="data-table rewards">
    <thead><tr><th>Place</th><th class="num">Pays now</th><th class="num">Prize</th><th class="num">Fee share</th></tr></thead>
    <tbody>${rows}</tbody>
  </table></div>`;
}

/** A bounty's own page: stats, rewards, description, rules, latest entries. */
export function bountyView(b) {
  const fee = feeOf(b);
  const entries = (b.submissions || []).slice(0, 8);
  return `
  <p class="crumbs"><a href="#/">&larr; All bounties</a></p>
  <section class="bounty-head">
    <div class="card-top">
      <span class="chip">${esc(b.category || 'Bounty')}</span>
      ${statusChip(b)}
      ${b.sponsor?.name ? `<span class="sponsor">by ${esc(b.sponsor.name)}</span>` : ''}
    </div>
    <h1>${esc(b.title)}</h1>
    <p class="lead">${esc(b.summary || '')}</p>
    <p class="actions">
      <a class="btn" href="#/bounty/${encodeURIComponent(b.slug)}/leaderboard">View leaderboard</a>
      <a class="btn btn-ghost" href="https://make.fun/bounty/${encodeURIComponent(b.slug)}" rel="noopener">Enter on make.fun &#8599;</a>
    </p>
  </section>
  <dl class="stat-tiles">
    <div><dt>Live pot</dt><dd class="tile-pot">${potOf(b)}</dd></div>
    <div><dt>Prize pool</dt><dd>${money(b.rewardAmount)}</dd></div>
    <div><dt>Entry fee</dt><dd>${fee ?? 'Free'}</dd></div>
    <div><dt>Entries</dt><dd>${b.submissionCount ?? 0}</dd></div>
    <div><dt>Time left</dt><dd data-countdown="${esc(b.deadline)}">${timeLeft(b.deadline)}</dd></div>
    <div><dt>Deadline</dt><dd class="tile-small">${dateTime(b.deadline)}</dd></div>
  </dl>
  ${rewardsTable(b)}
  <h2>About this bounty</h2>
  <div class="prose">${markdown(b.description || '')}</div>
  ${b.rules ? `<details class="rules"><summary>Full rules</summary><div class="prose">${markdown(b.rules)}</div></details>` : ''}
  ${entries.length ? `
  <h2>Latest entries</h2>
  <ul class="entry-list">
    ${entries.map((s) => `
    <li>
      <span class="entry-title">${esc(s.title || 'Untitled entry')}</span>
      <span class="entry-meta">by <a href="#/u/${encodeURIComponent(s.hunter)}">${esc(s.hunter)}</a>
      &middot; ${ago(s.createdAt)} &middot; ${esc(s.status || '')}</span>
    </li>`).join('')}
  </ul>` : ''}`;
}

