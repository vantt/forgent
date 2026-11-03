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
import { extractMarkdownConservationUnits } from './generate-doc-inventory.mjs';

/** GitHub's own slug of a heading, which differs from the extractor's for headings with punctuation. */
export function githubSlug(title) {
  return title.trim().toLowerCase().replace(/[^\p{L}\p{N}\- _]/gu, '').replace(/ /g, '-');
}

export function listAnchors(content) {
  return extractMarkdownConservationUnits(content).map((u) => ({
    anchor: u.anchor,
    githubSlug: u.unitKind === 'heading' ? githubSlug(u.title) : null,
    kind: u.unitKind,
    startLine: u.startLine,
    endLine: u.endLine,
    sample: String(u.sample || '').replace(/\s+/g, ' ').slice(0, 70),
  }));
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
