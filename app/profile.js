// An account's public profile: identity and socials, its competitive
// record at a glance, and every entry it has made with scores and prizes.

import { ago, dateTime, esc, money, placeLabel, winRate } from './format.js';
import { avatarImg } from './views.js';

/** An account's public profile: identity, record, and everything it entered. */
export function profileView(p) {
  const name = p.display_name || p.handle;
  const picture = (p.avatar && (p.avatar.url_small || p.avatar.url)) || p.image;
  const r = p.record || {};
  const socials = [
    p.github_login ? `<a class="chip chip-link" href="https://github.com/${encodeURIComponent(p.github_login)}" rel="noopener">GitHub @${esc(p.github_login)}</a>` : '',
    p.x?.username ? `<a class="chip chip-link" href="${esc(p.x.url || `https://x.com/${p.x.username}`)}" rel="noopener">X @${esc(p.x.username)}</a>` : '',
    p.discord?.username ? `<span class="chip">Discord @${esc(p.discord.username)}</span>` : '',
    p.wallet?.address ? `<a class="chip chip-link" href="${esc(p.wallet.explorer_url || '#')}" rel="noopener">Wallet ${esc(p.wallet.address.slice(0, 4))}&hellip;${esc(p.wallet.address.slice(-4))}</a>` : '',
  ].filter(Boolean).join('');
  const solutions = p.solutions || [];
  return `
  <p class="crumbs"><a href="#/">&larr; All bounties</a></p>
  <section class="profile-head">
    ${avatarImg(picture, 'avatar avatar-lg')}
    <div>
      <h1>${esc(name)}</h1>
      <p class="handle">@${esc(p.handle)}${p.house ? ' &middot; house account' : ''} &middot; joined ${dateTime(p.joined_at)}</p>
      ${p.bio ? `<p class="lead">${esc(p.bio)}</p>` : ''}
      ${socials ? `<p class="socials">${socials}</p>` : ''}
    </div>
  </section>
  <dl class="stat-tiles">
    <div><dt>Entered</dt><dd>${r.competitions_entered ?? 0}</dd></div>
    <div><dt>Placed</dt><dd>${r.competitions_placed ?? 0}</dd></div>
    <div><dt>Won</dt><dd>${r.competitions_won ?? 0}</dd></div>
    <div><dt>Podiums</dt><dd>${r.podium_finishes ?? 0}</dd></div>
    <div><dt>Best place</dt><dd>${r.best_placement ? placeLabel(r.best_placement) : '&mdash;'}</dd></div>
    <div><dt>Prizes won</dt><dd class="tile-pot">${money(r.prize_usd ?? 0)}</dd></div>
  </dl>
  <h2>Entries</h2>
  ${solutions.length ? `
  <div class="table-scroll"><table class="data-table">
    <thead><tr><th>Entry</th><th>Bounty</th><th class="num">Score</th><th>Place</th><th class="num">Prize</th><th>Entered</th></tr></thead>
    <tbody>
    ${solutions.map((s) => `
      <tr>
        <td class="entry-name">${esc(s.title || 'Untitled entry')}</td>
        <td><a href="#/bounty/${encodeURIComponent(s.competition.slug)}">${esc(s.competition.title)}</a></td>
        <td class="num">${s.score ? `${esc(s.score.column?.title || 'Score')} ${s.score.column?.key === 'judge' ? winRate(s.score.value) : esc(s.score.display ?? s.score.value)}` : '&mdash;'}</td>
        <td>${s.placement ? placeLabel(s.placement) : '&mdash;'}</td>
        <td class="num">${s.prize_usd ? money(s.prize_usd) : '&mdash;'}</td>
        <td class="dim">${ago(s.entered_at)}</td>
      </tr>`).join('')}
    </tbody>
  </table></div>` : '<p class="empty">No entries yet.</p>'}`;
}

