// A small safe Markdown renderer for bounty descriptions and rules: the
// input is treated as plain text and escaped first, so only the tags the
// renderer itself emits can appear in the output. Loaded on demand by the
// bounty page, never by the board.

import { esc } from './format.js';

/** Inline Markdown on already-escaped text: code, bold, strike, italic, links, bare URLs. */
function inline(text) {
  return text
    .replace(/`([^`]+)`/g, '<code>$1</code>')
    .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
    .replace(/~~([^~]+)~~/g, '<del>$1</del>')
    .replace(/(^|[^*])\*([^*\n]+)\*/g, '$1<em>$2</em>')
    .replace(/\[([^\]]+)\]\((https?:[^)\s]+)\)/g, '<a href="$2" rel="noopener">$1</a>')
    .replace(/(?<![=">])\b(https?:\/\/[^\s<]+)/g, '<a href="$1" rel="noopener">$1</a>');
}

/** Render one pipe table from its raw lines (header, separator, body rows). */
function table(lines) {
  const cells = (line) => line.replace(/^\||\|$/g, '').split('|').map((c) => inline(esc(c.trim())));
  const head = cells(lines[0]).map((c) => `<th>${c}</th>`).join('');
  const body = lines.slice(2).map((line) => `<tr>${cells(line).map((c) => `<td>${c}</td>`).join('')}</tr>`).join('');
  return `<div class="table-scroll"><table class="md-table"><thead><tr>${head}</tr></thead><tbody>${body}</tbody></table></div>`;
}

/**
 * Render the Markdown subset bounty texts use: headings, paragraphs, lists,
 * quotes, rules, fenced code, pipe tables, strikethrough and bare-URL
 * autolinks. Input is treated as plain text and escaped before any tag is
 * emitted, so API text can never inject HTML.
 */
export function markdown(source) {
  const lines = String(source ?? '').replace(/\r\n?/g, '\n').split('\n');
  const out = [];
  let i = 0;
  while (i < lines.length) {
    const line = lines[i];
    if (/^```/.test(line)) {
      const buf = [];
      i++;
      while (i < lines.length && !/^```/.test(lines[i])) buf.push(lines[i++]);
      i++;
      out.push(`<pre>${esc(buf.join('\n'))}</pre>`);
    } else if (/^\|.*\|$/.test(line.trim()) && i + 1 < lines.length && /^\|[\s:|-]+\|$/.test(lines[i + 1].trim())) {
      const buf = [line, lines[i + 1]];
      i += 2;
      while (i < lines.length && /^\|.*\|$/.test(lines[i].trim())) buf.push(lines[i++]);
      out.push(table(buf));
    } else if (/^(#{1,4})\s+/.test(line)) {
      const level = Math.min(line.match(/^#+/)[0].length + 1, 4);
      out.push(`<h${level}>${inline(esc(line.replace(/^#+\s+/, '')))}</h${level}>`);
      i++;
    } else if (/^\s*(-{3,}|\*{3,})\s*$/.test(line)) {
      out.push('<hr>');
      i++;
    } else if (/^\s*([-*]|\d+\.)\s+/.test(line)) {
      const ordered = /^\s*\d+\.\s+/.test(line);
      const items = [];
      while (i < lines.length && /^\s*([-*]|\d+\.)\s+/.test(lines[i])) {
        items.push(`<li>${inline(esc(lines[i].replace(/^\s*([-*]|\d+\.)\s+/, '')))}</li>`);
        i++;
      }
      out.push(ordered ? `<ol>${items.join('')}</ol>` : `<ul>${items.join('')}</ul>`);
    } else if (/^>\s?/.test(line)) {
      const buf = [];
      while (i < lines.length && /^>\s?/.test(lines[i])) buf.push(lines[i++].replace(/^>\s?/, ''));
      out.push(`<blockquote>${buf.map((b) => inline(esc(b))).join('<br>')}</blockquote>`);
    } else if (line.trim() === '') {
      i++;
    } else {
      const buf = [line];
      i++;
      while (i < lines.length && lines[i].trim() !== '' && !/^(#{1,4}\s|```|\s*([-*]|\d+\.)\s|>\s?|\|)/.test(lines[i])) buf.push(lines[i++]);
      out.push(`<p>${inline(esc(buf.join(' ')))}</p>`);
    }
  }
  return out.join('\n');
}
