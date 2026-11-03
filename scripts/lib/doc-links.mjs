// Body-reader shared by doc-health's candidate checker. Grammar ported from
// fchain/links.py; source offsets survive masking so agreement can compare edges.
import path from 'node:path';
import { headerBlock } from '../check-doc-constitution.mjs';

export function prose(text) {
  const out = text.split('');
  const blank = (a, b) => { for (let i = a; i < b; i++) if (text[i] !== '\n') out[i] = ' '; };
  let fence = null, offset = 0;
  for (const line of text.match(/[^\n]*(?:\n|$)/g) || []) {
    const body = line.replace(/^(?: {0,3}> ?)*/, '');
    const marker = /^ {0,3}(`{3,}|~{3,})(.*)/.exec(body);
    if (fence) {
      blank(offset, offset + line.length);
      if (marker && marker[1][0] === fence[0] && marker[1].length >= fence.length && !marker[2].trim()) fence = null;
    } else if (marker && (marker[1][0] !== '`' || !marker[2].includes('`'))) {
      fence = marker[1]; blank(offset, offset + line.length);
    }
    offset += line.length;
  }
  for (const m of out.join('').matchAll(/<!--[\s\S]*?(?:-->|$)/g)) blank(m.index, m.index + m[0].length);
  const masked = out.join('');
  for (let i = 0; i < masked.length;) {
    if (masked[i] !== '`' || ((/\\*$/.exec(masked.slice(0, i))?.[0].length || 0) % 2)) { i++; continue; }
    const run = /^`+/.exec(masked.slice(i))[0];
    const end = new RegExp('(?<!`)`{' + run.length + '}(?!`)').exec(masked.slice(i + run.length));
    if (end) {
      const z = i + run.length + end.index + end[0].length;
      blank(i, z); i = z;
    } else i += run.length;
  }
  return out.join('');
}

const destination = String.raw`<([^<>\n]*)>|((?:\\.|[^\s()<>]|\((?:\\.|[^()])*\))+)`;
const referenceKey = (value) => value.trim().replace(/\s+/g, ' ').toLowerCase();

export function clickable(text) {
  const masked = prose(text), links = [], occupied = [], definitionSpans = [], definitions = new Map();
  const record = (m, group, extra = {}) => ({ start: m.index, end: m.index + m[0].length,
    targetStart: m.indices[group][0], targetEnd: m.indices[group][1],
    target: text.slice(...m.indices[group]), ...extra });
  for (const m of masked.matchAll(new RegExp('^ {0,3}\\[([^\\]\\n]+)\\]:\\s*(?:' + destination + ')', 'gmd'))) {
    const key = referenceKey(m[1]);
    if (!definitions.has(key)) definitions.set(key, [m, m[2] !== undefined ? 2 : 3]);
    definitionSpans.push([m.index, m.index + m[0].length]);
  }
  for (const m of masked.matchAll(new RegExp(String.raw`(?<!\\)\[(?:\\.|[^\]\\])*\]\(\s*(?:` + destination + String.raw`)(?:\s+["'][^\n]*?["'])?\s*\)`, 'gd'))) {
    occupied.push([m.index, m.index + m[0].length]);
    links.push(record(m, m[1] !== undefined ? 1 : 2));
  }
  const used = new Set();
  for (const m of masked.matchAll(/(?<!\\)\[([^\]\n]+)\](?:\[([^\]\n]*)\])?/g)) {
    if ([...occupied, ...definitionSpans].some(([a, b]) => a <= m.index && m.index < b)) continue;
    const key = referenceKey(m[2] || m[1]);
    if (definitions.has(key)) used.add(key);
  }
  for (const key of used) {
    const [m, group] = definitions.get(key);
    links.push(record(m, group, { reference: key }));
  }
  for (const m of masked.matchAll(/<[A-Za-z][\w:-]*\b[^>]*?\bhref\s*=\s*(["'])(.*?)\1[^>]*>|<((?:\.?\.?\/|\/|docs\/)[^<>\s]+)>/gid)) {
    if ([...occupied, ...definitionSpans].some(([a, b]) => a <= m.index && m.index < b) || /^<\/[A-Za-z][\w:-]*\s*>$/.test(m[0])) continue;
    links.push(record(m, m[2] !== undefined ? 2 : 3));
  }
  return links;
}

// Related is the sole structured header field containing link operands. A
// Historical source: `path` stays literal; a clickable Historical source is
// read normally, just like every other provenance or history link.
export function relatedLinks(text) {
  const block = headerBlock(text);
  if (block === null) return [];
  const blockStart = text.indexOf(block), links = [];
  let active = false, offset = blockStart;
  for (const line of block.split('\n')) {
    const value = active ? /^\s*-\s+(.+)/d.exec(line) : /^Related:\s*(.*)/d.exec(line);
    if (!value) { if (active) break; offset += line.length + 1; continue; }
    active = true;
    const token = /^`([^`]+)`|([^\s]+)/d.exec(value[1]);
    if (token) {
      const group = token[1] !== undefined ? 1 : 2;
      const target = token[group].replace(/[,;]+$/, '');
      if ((target.includes('/') || /\.md$/.test(target)) && !target.includes('*') && !/^[a-z][a-z0-9+.-]*:/i.test(target)) {
        const start = offset + value.indices[1][0] + token.indices[group][0];
        links.push({ start, end: start + target.length, targetStart: start, targetEnd: start + target.length, target, related: true });
      }
    }
    offset += line.length + 1;
  }
  return links;
}

function unescapeHtml(value) {
  return value.replace(/&(#x[0-9a-f]+|#\d+|amp|lt|gt|quot|apos);/gi, (whole, entity) => {
    if (entity[0] === '#') {
      const n = entity[1].toLowerCase() === 'x' ? parseInt(entity.slice(2), 16) : Number(entity.slice(1));
      return n > 0 && n <= 0x10ffff ? String.fromCodePoint(n) : '\ufffd';
    }
    return { amp: '&', lt: '<', gt: '>', quot: '"', apos: "'" }[entity.toLowerCase()] || whole;
  });
}

export function localDestination(file, target) {
  const value = unescapeHtml(target);
  if (/^[a-z][a-z0-9+.-]*:|^\/\//i.test(value)) return null;
  const hash = value.indexOf('#');
  const fragment = hash < 0 ? '' : decodeURIComponent(value.slice(hash + 1));
  let pathname = decodeURIComponent((hash < 0 ? value : value.slice(0, hash)).split('?')[0]
    .replace(/\\([!"#$%&'()*+,\-./:;<=>?@[\]\\^_`{|}~])/g, '$1'));
  if (!pathname) return fragment ? { path: file, fragment } : null;
  if (pathname.startsWith('repo/docs/')) pathname = pathname.slice(5);
  pathname = pathname.startsWith('docs/') || pathname.startsWith('/')
    ? path.posix.normalize(pathname.replace(/^\/+/, ''))
    : path.posix.normalize(path.posix.join(path.posix.dirname(file), pathname));
  return { path: pathname.replace(/\/$/, ''), fragment };
}
