[![make.fun · makefun-frontend-01](https://make.fun/badge/makefun-frontend-01.svg)](https://make.fun/bounty/makefun-frontend-01?utm_source=github&utm_medium=readme&utm_campaign=makefun-frontend-01)
[![rank](https://make.fun/badge/makefun-frontend-01/blupoint44/potwatch/rank.svg)](https://make.fun/bounty/makefun-frontend-01/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=makefun-frontend-01)
[![reward](https://make.fun/badge/makefun-frontend-01/blupoint44/potwatch/reward.svg)](https://make.fun/bounty/makefun-frontend-01?utm_source=github&utm_medium=readme&utm_campaign=makefun-frontend-01)

# Potwatch — a fast, read-only frontend for make.fun

Potwatch is a static, no-build-step web frontend for [make.fun](https://make.fun), built for the
“Build the best make.fun frontend” bounty. It reads make.fun's public API only (GET, no sign-in,
no writes) and renders four surfaces, each reachable by a link and by its own hash URL:

| Route | Surface |
| --- | --- |
| `#/` | **Live bounty board** — every open bounty as a card with its live pot (prize + entry fees paid in), entry fee, entries count and a ticking countdown; headline totals, text search, category filter and four sort orders, all filtering client-side with no refetch. |
| `#/bounty/<slug>` | **Bounty page** — live pot, prize pool, entry fee, entries, deadline; the rewards table as it pays *now* (base prize + fee share per place); description and full rules rendered from Markdown by a small built-in safe renderer; latest entries with links to their authors. |
| `#/bounty/<slug>/leaderboard` | **Leaderboard** — the judge's win rates with 90% intervals, validity and entry size; 60 rows at a time with a show-all button, house entries marked. |
| `#/u/<handle>` | **Public profile** — avatar, bio and socials, the account's record (entered / placed / won / podiums / best place / prizes) and every entry it has made with scores, places and prizes. |

## Performance design

- **Lean first load:** the board ships in 6 files, **9,904 bytes gzip-9 (27,298 raw)**. The bounty,
  leaderboard and profile modules (plus the Markdown renderer) load on demand via `import()` when
  their route is opened — 5,113 bytes gzip kept out of the first load.
- **ETag revalidation:** API answers carry minute-bound ETags; repeat reads send `If-None-Match`
  and reuse the parsed body on a 304, and identical in-flight reads share one request.
- **Cheap updates:** countdowns tick by updating only the elements that show them; board filters
  re-render only the card grid from data already in memory; long leaderboards page at 60 rows.
- **No framework, no webfonts, no images of its own:** vanilla ES modules, one stylesheet, system
  font stack. Avatars come from the API and load with `crossorigin="anonymous"` as its
  `Cross-Origin-Resource-Policy` requires.

## Run it

```sh
node serve.ts            # serves app/ on http://localhost:8080 (--port <n> for another)
```

Open the board at `http://localhost:8080/`, a bounty at `http://localhost:8080/#/bounty/makefun-frontend-01`,
its standings at `.../#/bounty/makefun-frontend-01/leaderboard`, a profile at `.../#/u/<handle>`.

## How the entry is handed in

`main.ts` (Node 22, standard library only) copies `app/` and `screenshots/` to `/output` and writes
`/output/dossier.json` with the kit's `buildDossier` from `vendor/makefun-frontend.ts` (unchanged):

```sh
mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts
```

The three screenshots in `screenshots/` are the running app on live data at 1280×800: the board,
this bounty's own page, and its leaderboard (`shots.json` names them).

MIT licensed — see `LICENSE`.
