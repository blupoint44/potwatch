// A working makefun-frontend-01 entry (Node 22, standard library only): the frontend is this directory's app/
// folder, plain static files a browser opens at app/index.html (ES modules, CSS, no build step), reading make.fun's
// public API at https://make.fun/api. The program hands it in: it copies app/ and screenshots/ from beside this file
// to /output and writes /output/dossier.json, the summary the judge reads (your screenshots, the first load's files
// and bytes, and your source), with the vendored make.fun library. Leave vendor/makefun-frontend.ts as it is: the
// scorer requires dossier.json to be byte for byte what its own copy writes.
//
// A starting point, not a winner: a plain board of open bounties and a page for each. Build your frontend in app/
// (a leaderboard, profiles, speed, ease of use), put 3 PNG or JPEG screenshots of it running on live data in
// screenshots/ (the first by name is the cover; shots.json says which views this starter's were taken of), and run it.
//
// Serve it locally with `node serve.ts`, then open http://localhost:8080.
// Outside the grader's container, MAKEFUN_OUTPUT_DIR stands in for /output:
//   mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts

import { cpSync, existsSync, mkdirSync, readdirSync, statSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildDossier } from './vendor/makefun-frontend.ts';

const here = fileURLToPath(new URL('.', import.meta.url));
const out = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';

// Refuse a hollow hand-in: the app and all three screenshots must sit beside
// this file before anything is copied, so a broken checkout fails loudly
// here instead of handing in an entry with a missing cover.
for (const needed of ['app/index.html', 'screenshots/1-board.jpg', 'screenshots/2-bounty.jpg', 'screenshots/3-leaderboard.jpg']) {
  if (!existsSync(join(here, needed))) throw new Error(`potwatch: missing ${needed} beside main.ts; nothing was handed in`);
}

mkdirSync(out, { recursive: true });
cpSync(join(here, 'app'), join(out, 'app'), { recursive: true });
mkdirSync(join(out, 'screenshots'), { recursive: true });
if (existsSync(join(here, 'screenshots'))) cpSync(join(here, 'screenshots'), join(out, 'screenshots'), { recursive: true });

// The scorer's own caps (reference/gate.json): only text_max_bytes shapes the bytes; the others refuse an entry the
// scorer would refuse (more than 3 screenshots or one over 256 KiB; more than 993 files and directories in app/ or
// 16 MiB of app files: app/ counts beside /output's own 1000-entry cap, its screenshots/ and dossier.json).
const dossier = buildDossier(out, { text_max_bytes: 163840, screenshots: { max: 3, max_bytes: 262144 }, app_max_files: 993, app_max_bytes: 16777216 });
writeFileSync(join(out, 'dossier.json'), dossier);

// A receipt for whoever runs this by hand: every handed-in file with its
// size, so the entry's footprint is visible at a glance.
const handedIn = [];
const walk = (dir, prefix) => {
  for (const name of readdirSync(dir).sort()) {
    const path = join(dir, name);
    if (statSync(path).isDirectory()) walk(path, `${prefix}${name}/`);
    else handedIn.push(`  ${prefix}${name}  ${statSync(path).size} bytes`);
  }
};
walk(join(out, 'app'), 'app/');
walk(join(out, 'screenshots'), 'screenshots/');
console.log(`potwatch: handed in to ${out}\n${handedIn.join('\n')}\n  dossier.json  ${Buffer.byteLength(dossier)} bytes`);
