#!/usr/bin/env node
// list-doc-anchors.mjs -- lists the real anchors of a markdown document, or checks one citation.
//
//   node scripts/list-doc-anchors.mjs <path>              one line per unit: anchor, kind, lines, start of the text
//   node scripts/list-doc-anchors.mjs --check <path#anchor> exit 0 when the anchor exists in the file, 1 otherwise
//
// A citation of the form `path#anchor` must use an anchor printed by this tool; deriving one
// from the heading text by hand drops numbering prefixes and punctuation rules.

import fs from 'node:fs';
import path from 'node:path';
import { isMainModule } from './lib/is-main-module.mjs';

/** GitHub's own slug of a heading, which differs from the extractor's for headings with punctuation. */
export function githubSlug(title) {
  return title.trim().toLowerCase().replace(/[^\p{L}\p{N}\- _]/gu, '').replace(/ /g, '-');
}

/** GitHub's heading slug as the platform links spell it (markup stripped, duplicates numbered). */
function headingAnchor(title) {
  return String(title || '').trim().toLowerCase()
    .replace(/<[^>]*>/g, '').replace(/[`*~]/g, '')
    .replace(/[^\p{L}\p{N}_\s -]/gu, '').trim().replace(/\s+/g, '-') || 'section';
}

/** Every heading outside a fenced block, with the numbering prefix kept. */
export function listAnchors(content) {
  const anchors = [];
  const seen = new Map();
  let fence = null;
  content.split(/\r?\n/).forEach((line, index) => {
    const fenceMatch = line.match(/^\s{0,3}(`{3,}|~{3,})/);
    if (fenceMatch) {
      if (!fence) fence = fenceMatch[1];
      else if (fenceMatch[1][0] === fence[0] && fenceMatch[1].length >= fence.length) fence = null;
      return;
    }
    if (fence) return;
    const heading = line.match(/^(#{1,6})\s+(.+?)\s*#*\s*$/);
    if (!heading) return;
    const title = heading[2].trim();
    const base = headingAnchor(title);
    const count = seen.get(base) || 0;
    seen.set(base, count + 1);
    anchors.push({
      anchor: count > 0 ? `${base}-${count}` : base,
      githubSlug: githubSlug(title),
      kind: 'heading',
      startLine: index + 1,
      endLine: index + 1,
      sample: title.replace(/\s+/g, ' ').slice(0, 70),
    });
  });
  return anchors;
}

export function anchorExists(content, anchor) {
  return listAnchors(content).some((a) => a.anchor === anchor || a.githubSlug === anchor);
}

export function runCli(argv, cwd = process.cwd()) {
  const checkIdx = argv.indexOf('--check');
  try {
    if (checkIdx >= 0) {
      const ref = argv[checkIdx + 1] || '';
      const at = ref.indexOf('#');
      if (at < 0) { console.error('list-doc-anchors: --check needs path#anchor'); return 1; }
      const ok = anchorExists(fs.readFileSync(path.resolve(cwd, ref.slice(0, at)), 'utf8'), ref.slice(at + 1));
      console.log(ok ? `ok: ${ref}` : `missing: ${ref} (list the real anchors with: node scripts/list-doc-anchors.mjs ${ref.slice(0, at)})`);
      return ok ? 0 : 1;
    }
    const file = argv.find((a) => !a.startsWith('--'));
    if (!file) { console.error('usage: list-doc-anchors.mjs <path> | --check <path#anchor>'); return 1; }
    for (const a of listAnchors(fs.readFileSync(path.resolve(cwd, file), 'utf8'))) console.log([a.anchor, a.kind, `${a.startLine}-${a.endLine}`, a.sample].join('\t'));
    return 0;
  } catch (err) {
    console.error(`list-doc-anchors: ${err.message}`);
    return 1;
  }
}

if (isMainModule(import.meta.url)) process.exitCode = runCli(process.argv.slice(2));
