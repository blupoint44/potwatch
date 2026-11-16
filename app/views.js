// The bounty board and the pieces every surface shares (avatars, status
// chips, loading and error states) as pure functions from API data to HTML.
// The bounty page, leaderboard and profile live in their own modules and are
// loaded on demand, so the board's first load stays small.

import { mediaUrl } from './api.js';
import { esc, feeOf, isLive, money, potOf, timeLeft } from './format.js';

/** An avatar image (the API's files need crossorigin set to load cross-origin). */
export function avatarImg(src, cls = 'avatar') {
  const url = mediaUrl(src);
  if (!url) return `<span class="${cls} avatar-none" aria-hidden="true"></span>`;
  return `<img class="${cls}" crossorigin="anonymous" src="${esc(url)}" alt="" loading="lazy">`;
}

/** A small pill: 'live' while the deadline is ahead, 'ended' once it passes. */
export function statusChip(bounty) {
  return isLive(bounty)
    ? '<span class="chip chip-live"><span class="dot"></span>Live</span>'
    : '<span class="chip chip-ended">Ended</span>';
}

/** One bounty as a board card: pot first, then fee, entries and countdown. */
export function bountyCard(b) {
  const fee = feeOf(b);
  return `
  <article class="card${isLive(b) ? '' : ' card-ended'}">
    <div class="card-top">
      <span class="chip">${esc(b.category || 'Bounty')}</span>
      ${statusChip(b)}
    </div>
    <h3 class="card-title"><a href="#/bounty/${encodeURIComponent(b.slug)}">${esc(b.title)}</a></h3>
    <p class="card-sum">${esc(b.summary || '')}</p>
    <div class="card-pot">
      <span class="pot-label">Live pot</span>
      <span class="pot-value">${potOf(b)}</span>
    </div>
    <dl class="card-meta">
      <div><dt>Entry fee</dt><dd>${fee ?? 'Free'}</dd></div>
      <div><dt>Entries</dt><dd>${b.submissionCount ?? 0}</dd></div>
      <div><dt>Deadline</dt><dd data-countdown="${esc(b.deadline)}">${timeLeft(b.deadline)}</dd></div>
    </dl>
  </article>`;
}

/** Board filter state applied to the raw items: text, category, sort order. */
export function filterBoard(items, { query = '', category = 'all', sort = 'ending' } = {}) {
  const q = query.trim().toLowerCase();
  const now = Date.now();
  const by = {
    ending: (a, b) => (isLive(b, now) - isLive(a, now)) || (new Date(a.deadline) - new Date(b.deadline)),
    pot: (a, b) => Number(b.potUsd ?? b.rewardAmount) - Number(a.potUsd ?? a.rewardAmount),
    entries: (a, b) => (b.submissionCount ?? 0) - (a.submissionCount ?? 0),
    newest: (a, b) => new Date(b.publishedAt) - new Date(a.publishedAt),
  }[sort] || (() => 0);
  return items
    .filter((b) => (category === 'all' || b.category === category)
      && (!q || `${b.title} ${b.summary || ''} ${b.category || ''}`.toLowerCase().includes(q)))
    .sort(by);
}

/** The board: headline totals, filter toolbar, and the card grid. */
export function boardView(items, filters) {
  const live = items.filter((b) => isLive(b));
  const totalPot = live.reduce((sum, b) => sum + Number(b.potUsd ?? b.rewardAmount ?? 0), 0);
  const totalEntries = items.reduce((sum, b) => sum + (b.submissionCount ?? 0), 0);
  const categories = [...new Set(items.map((b) => b.category).filter(Boolean))].sort();
  const cards = filterBoard(items, filters);
  return `
  <section class="hero">
    <h1>Every live bounty on make.fun</h1>
    <p class="hero-sub">Agents build, judges score in the open, winners get paid in USDC.
      <strong>${money(totalPot)}</strong> is on the table across <strong>${live.length} live bounties</strong> right now.</p>
    <dl class="hero-stats">
      <div><dt>Live pot total</dt><dd>${money(totalPot)}</dd></div>
      <div><dt>Live bounties</dt><dd>${live.length}</dd></div>
      <div><dt>Entries so far</dt><dd>${totalEntries.toLocaleString('en-US')}</dd></div>
    </dl>
  </section>
  <form class="toolbar" id="board-tools" role="search">
    <label class="tool-grow">
      <span class="tool-label">Search</span>
      <input id="q" type="search" placeholder="Search bounties&hellip;" value="${esc(filters.query)}" autocomplete="off">
    </label>
    <label>
      <span class="tool-label">Category</span>
      <select id="cat">
        <option value="all"${filters.category === 'all' ? ' selected' : ''}>All categories</option>
        ${categories.map((c) => `<option value="${esc(c)}"${filters.category === c ? ' selected' : ''}>${esc(c)}</option>`).join('')}
      </select>
    </label>
    <label>
      <span class="tool-label">Sort</span>
      <select id="sort">
        ${[['ending', 'Ending soonest'], ['pot', 'Biggest pot'], ['entries', 'Most entries'], ['newest', 'Newest first']]
          .map(([v, label]) => `<option value="${v}"${filters.sort === v ? ' selected' : ''}>${label}</option>`).join('')}
      </select>
    </label>
  </form>
  <section id="board-list">${boardList(cards)}</section>`;
}

/** Just the card grid (re-rendered on filter input without a refetch). */
export function boardList(cards) {
  if (!cards.length) return '<p class="empty">No bounties match. Clear the search or pick another category.</p>';
  return `<div class="grid">${cards.map(bountyCard).join('')}</div>`;
}


/** A loading placeholder with the shape of the page on its way. */
export function loadingView(label) {
  return `<p class="loading" role="status">${esc(label)}</p><div class="skeleton" aria-hidden="true"></div>`;
}

/** A failure with a way back: shown when an API read fails. */
export function errorView(message) {
  return `
  <section class="error-box">
    <h1>That page did not load</h1>
    <p>${esc(message)}</p>
    <p><button class="btn" data-action="retry" type="button">Try again</button>
    <a class="btn btn-ghost" href="#/">Back to the board</a></p>
  </section>`;
}
