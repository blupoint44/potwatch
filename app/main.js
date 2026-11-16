// Potwatch router: four surfaces on hash routes, each with its own URL.
//
//   #/                              the live bounty board
//   #/bounty/<slug>                 one bounty's page
//   #/bounty/<slug>/leaderboard     that bounty's standings
//   #/u/<handle>                    an account's public profile
//
// Only the board's code is in the first load; the other three surfaces are
// imported when their route is opened, so the board arrives in a handful of
// kilobytes. window.__shotReady is false while a route loads and true once
// its data is on screen (the error page counts as rendered), so screenshot
// tooling knows when to capture. Countdowns tick by updating only the
// elements that show them, never by re-rendering a page.

import { fetchBoard, fetchBounty, fetchLeaderboard, fetchProfile } from './api.js';
import { timeLeft } from './format.js';
import { boardList, boardView, errorView, filterBoard, loadingView } from './views.js';

const app = document.getElementById('app');

const boardFilters = { query: '', category: 'all', sort: 'ending' };
let boardItems = null; // last board payload, reused by the filter toolbar
let standings = null; // last leaderboard payload, reused by "show all"
let navigation = 0; // token so a slow route never overwrites a newer one

/** Split the current hash into route segments. */
function route() {
  return location.hash.replace(/^#\/?/, '').split('/').filter(Boolean).map(decodeURIComponent);
}

/** Render the route in the address bar, fetching what it needs. */
async function render() {
  const ticket = ++navigation;
  window.__shotReady = false;
  const [head, arg, tail] = route();
  try {
    if (head === 'bounty' && arg && tail === 'leaderboard') {
      app.innerHTML = loadingView('Loading the standings&hellip;');
      const [{ leaderboardView }, b, lb] = await Promise.all([
        import('./standings.js'), fetchBounty(arg), fetchLeaderboard(arg),
      ]);
      if (ticket !== navigation) return;
      standings = { bounty: b, board: lb, view: leaderboardView };
      document.title = `Leaderboard · ${b.title} · Potwatch`;
      app.innerHTML = leaderboardView(b, lb);
    } else if (head === 'bounty' && arg) {
      app.innerHTML = loadingView('Loading the bounty&hellip;');
      const [{ bountyView }, b] = await Promise.all([import('./bounty.js'), fetchBounty(arg)]);
      if (ticket !== navigation) return;
      document.title = `${b.title} · Potwatch`;
      app.innerHTML = bountyView(b);
    } else if (head === 'u' && arg) {
      app.innerHTML = loadingView('Loading the profile&hellip;');
      const [{ profileView }, p] = await Promise.all([import('./profile.js'), fetchProfile(arg)]);
      if (ticket !== navigation) return;
      document.title = `@${p.handle} · Potwatch`;
      app.innerHTML = profileView(p);
    } else {
      app.innerHTML = loadingView('Loading live bounties&hellip;');
      const data = await fetchBoard();
      if (ticket !== navigation) return;
      boardItems = data.items || [];
      document.title = 'Potwatch — live make.fun bounties';
      app.innerHTML = boardView(boardItems, boardFilters);
    }
  } catch (err) {
    if (ticket !== navigation) return;
    document.title = 'Potwatch — something did not load';
    app.innerHTML = errorView(`The make.fun API could not be reached (${err.message}). Check your connection and try again.`);
  }
  window.scrollTo(0, 0);
  window.__shotReady = true;
}

/** Re-render only the board's card grid when a filter changes (no refetch). */
function refreshBoardList() {
  const host = document.getElementById('board-list');
  if (host && boardItems) host.innerHTML = boardList(filterBoard(boardItems, boardFilters));
}

app.addEventListener('input', (event) => {
  if (event.target.id === 'q') {
    boardFilters.query = event.target.value;
    refreshBoardList();
  }
});

app.addEventListener('change', (event) => {
  if (event.target.id === 'cat') boardFilters.category = event.target.value;
  if (event.target.id === 'sort') boardFilters.sort = event.target.value;
  if (event.target.id === 'cat' || event.target.id === 'sort') refreshBoardList();
});

app.addEventListener('click', (event) => {
  const action = event.target.closest('[data-action]')?.dataset.action;
  if (action === 'retry') render();
  if (action === 'lb-all' && standings) {
    app.innerHTML = standings.view(standings.bounty, standings.board, Number.POSITIVE_INFINITY);
    window.__shotReady = true;
  }
});

// Avatars the API points at can fail; hide the broken image, keep the layout.
document.addEventListener('error', (event) => {
  if (event.target && event.target.tagName === 'IMG') event.target.classList.add('img-broken');
}, true);

// Tick every countdown in place: cheap text updates, no re-render, no fetch.
setInterval(() => {
  const now = Date.now();
  document.querySelectorAll('[data-countdown]').forEach((el) => {
    el.textContent = timeLeft(el.dataset.countdown, now);
  });
}, 20000);

window.addEventListener('hashchange', render);
render();
