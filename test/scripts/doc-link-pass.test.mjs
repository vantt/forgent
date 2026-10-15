import test from 'node:test';
import assert from 'node:assert/strict';
import { planLinkPass, specificTarget } from '../../scripts/doc-link-pass.mjs';
const file = 'docs/platform/a/spec.md';
const aliases = [
 { fromPath: 'docs/specs/a.md', toOwner: file },
 { fromPath: 'docs/architect/a/design.md', toOwner: 'docs/platform/a/README.md' },
 { fromPath: 'docs/architect/a/design.md#details', toOwner: 'docs/platform/a/architecture/design.md', toAnchor: 'details' },
];
const candidates = ['docs/platform/a/architecture/design.md'];
const run = (text, extra = {}) => planLinkPass({ file, text, aliases, candidates, ...extra });
test('never repoints a source relationship or a link to its own file', () => {
 for (const text of ['Source relationship: [original source](../../specs/a.md)',
  'The legacy documents stay canonical: [source](../../specs/a.md)',
  '[a spec](../../specs/a.md)',
  '| Source protocol §3 | [design](../../architect/a/design.md) |']) {
  const r = run(text); assert.equal(r.text, text); assert.equal(r.edits.length, 0); assert.equal(r.classified.length, 1);
 }
});
test('source column header protects subsequent table rows', () => {
 const text = '| Area | Current source during migration |\n|---|---|\n| A | [design](../../architect/a/design.md) |';
 assert.equal(run(text).text, text);
});
test('chooses a restored same-named candidate before a portal', () => {
 const r = run('[Design](../../architect/a/design.md)');
 assert.equal(r.text, '[Design](architecture/design.md)');
 assert.equal(r.edits[0].reason, 'specific-candidate');
});
test('chooses the unique per-anchor target when no same-named candidate exists', () => {
 assert.equal(specificTarget('docs/architect/a/old.md', [
  { fromPath: 'docs/architect/a/old.md#one', toOwner: 'docs/platform/a/spec.md', toAnchor: 'one' },
 ], []), 'docs/platform/a/spec.md');
});
test('restores and classifies a portal alias with no specific target', () => {
 const r = run('[Specific design](../../architect/a/design.md)', { candidates: [], aliases: aliases.slice(0, 2) });
 assert.equal(r.edits.length, 0); assert.equal(r.classified[0].reason, 'portal-without-specific-target');
});
test('wrapped labels are repointed and labels preserved', () => {
 assert.equal(run('[Dispatch & Execution\nplane](../../architect/a/design.md)').text,
 '[Dispatch & Execution\nplane](architecture/design.md)');
});
test('fences and historical referents are retained', () => {
 const text = '```md\n[design](../../architect/a/design.md)\n```';
 assert.equal(run(text).text, text);
 assert.equal(run('[design](../../architect/a/design.md)', { file: 'docs/platform/a/history/old.md' }).edits.length, 0);
});
test('anchored destinations preserve the explicit alias anchor', () => {
 assert.equal(run('[details](../../architect/a/design.md#details)').text, '[details](architecture/design.md#details)');
});
test('ambiguous specific targets fail closed', () => {
 assert.equal(specificTarget('docs/architect/a/old.md', [
 {fromPath:'docs/architect/a/old.md#x',toOwner:'docs/platform/a/x.md'},
 {fromPath:'docs/architect/a/old.md#y',toOwner:'docs/platform/a/y.md'},
 ], []), null);
});
test('uses the source heading alias for a split document without guessing among sections', () => {
 assert.equal(specificTarget('docs/architect/a/old.md', [
 {fromPath:'docs/architect/a/old.md#old',toOwner:'docs/platform/a/new.md'},
 {fromPath:'docs/architect/a/old.md#decision',toOwner:'docs/platform/a/decisions/x.md'},
 ], [], 'old'), 'docs/platform/a/new.md');
});
test('a canonical data cell does not protect unrelated following table rows', () => {
 const text='| Need | Read |\n|---|---|\n| Canonical source | [a](../../specs/a.md) |\n| Design | [design](../../architect/a/design.md) |';
 assert.match(run(text).text, /\[design\]\(architecture\/design.md\)/);
});
test('restored same-named document takes precedence over an archived heading alias', () => {
 assert.equal(specificTarget('docs/architect/a/design.md', [
 {fromPath:'docs/architect/a/design.md#design',toOwner:'docs/platform/a/history/design.md'},
 ], ['docs/platform/a/architecture/design.md','docs/platform/a/history/design.md'], 'design'), 'docs/platform/a/architecture/design.md');
});
