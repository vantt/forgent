// capability-plan-lint.test.mjs — every check runs against plain text,
// writes nothing, and never touches Work/.fgos state.
import assert from 'node:assert/strict';
import { test } from 'node:test';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { lintPlanCapabilityAnnotations } from '../../src/report/capability-plan-lint.mjs';
import { DEFAULT_CAPABILITY_SLOTS } from '../../src/setup/registrations.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REGISTERED = [...Object.keys(DEFAULT_CAPABILITY_SLOTS), 'impact-analysis', 'pane-labeling'];

test('a plan with valid, registered, unpinned units passes clean', () => {
  const text = `# Plan

- unit: apply the fix to src/foo.mjs
  capability: code:implement
- unit: independent review of the fix
  capability: code:review
`;
  const result = lintPlanCapabilityAnnotations(text, REGISTERED);
  assert.equal(result.ok, true);
  assert.deepEqual(result.findings, []);
  assert.equal(result.units.length, 2);
  assert.equal(result.units[0].capability, 'code:implement');
  assert.equal(result.units[0].source, 'unit-block');
});

test('a unit with no capability line is flagged capability.missing, severity hard', () => {
  const text = `- unit: apply the fix to src/foo.mjs
  action: just do it
`;
  const result = lintPlanCapabilityAnnotations(text, REGISTERED);
  assert.equal(result.ok, false);
  assert.equal(result.findings.length, 1);
  assert.equal(result.findings[0].code, 'capability.missing');
  assert.equal(result.findings[0].severity, 'hard');
  assert.match(result.findings[0].message, /has no "capability:" line/);
});

test('an invalid capability shape (not generic, not domain:capability) is flagged capability.invalid-shape', () => {
  const text = `- unit: apply the fix
  capability: Code Implement
`;
  const result = lintPlanCapabilityAnnotations(text, REGISTERED);
  assert.equal(result.ok, false);
  assert.equal(result.findings[0].code, 'capability.invalid-shape');
  assert.equal(result.findings[0].severity, 'hard');
  assert.match(result.findings[0].message, /not a valid canonical shape/);
});

test('a syntactically valid but unregistered capability is flagged capability.unregistered, naming the register-first remedy', () => {
  const text = `- unit: apply the fix
  capability: code:teleport
`;
  const result = lintPlanCapabilityAnnotations(text, REGISTERED);
  assert.equal(result.ok, false);
  assert.equal(result.findings[0].code, 'capability.unregistered');
  assert.match(result.findings[0].message, /not registered/);
  assert.match(result.findings[0].message, /DEFAULT_CAPABILITY_SLOTS/);
});

test('a capability explicitly marked "unresolved" is warn-severity, never blocks ok', () => {
  const text = `- unit: apply the fix
  capability: unresolved (needs a new capability, not yet registered)
`;
  const result = lintPlanCapabilityAnnotations(text, REGISTERED);
  assert.equal(result.ok, true);
  assert.equal(result.findings.length, 1);
  assert.equal(result.findings[0].code, 'capability.unresolved');
  assert.equal(result.findings[0].severity, 'warn');
});

test('a hedged parenthetical on a NON-unresolved capability is flagged capability.hedged, hard severity', () => {
  const text = `- unit: apply the fix
  capability: code:implement (pretty sure this is right)
`;
  const result = lintPlanCapabilityAnnotations(text, REGISTERED);
  assert.equal(result.ok, false);
  const hedged = result.findings.find((f) => f.code === 'capability.hedged');
  assert.ok(hedged, 'expected a capability.hedged finding');
  assert.equal(hedged.severity, 'hard');
  // the paren-stripped bare capability is still a valid, registered shape,
  // so hedging is the ONLY finding -- it must not also fire invalid-shape.
  assert.equal(result.findings.length, 1);
});

test('two "capability:" lines in one unit are flagged capability.duplicate, first value wins', () => {
  const text = `- unit: apply the fix
  capability: code:implement
  capability: code:review
`;
  const result = lintPlanCapabilityAnnotations(text, REGISTERED);
  assert.equal(result.ok, false);
  assert.equal(result.units[0].capability, 'code:implement');
  const dup = result.findings.find((f) => f.code === 'capability.duplicate');
  assert.ok(dup, 'expected a capability.duplicate finding');
  assert.equal(dup.severity, 'hard');
  assert.equal(dup.line, 3);
});

test('pin keys cover executor/provider/model/tier/prefer/invocation/actors, one finding per pinned field', () => {
  const text = `- unit: apply the fix
  capability: code:implement
  executor: agy
  provider: openai
  model: sonnet
  tier: heavy
  prefer: xai
  invocation: cli
  actors: doer,reviewer
`;
  const result = lintPlanCapabilityAnnotations(text, REGISTERED);
  assert.equal(result.ok, false);
  const pinned = result.findings.filter((f) => f.code === 'capability.pinned');
  assert.equal(pinned.length, 7);
  assert.ok(pinned.every((f) => f.severity === 'hard'));
  assert.deepEqual(
    pinned.map((f) => f.message.match(/pins "(\w+)"/)[1]),
    ['executor', 'provider', 'model', 'tier', 'prefer', 'invocation', 'actors'],
  );
});

test('provider/executor/model prose OUTSIDE a unit block is never flagged (scoped to unit blocks only, not whole-file)', () => {
  const text = `# Plan

This plan discusses provider/model/executor selection as a concept, never
as a literal pin: execution-time decide chooses the provider and model.

- unit: apply the fix
  capability: code:implement
`;
  const result = lintPlanCapabilityAnnotations(text, REGISTERED);
  assert.equal(result.ok, true);
});

test('a real doctrine document (no "- unit:" lines at all) lints clean -- zero units, zero findings', () => {
  const text = `# Shared fragment

This fragment never uses the "- unit:" convention -- it is dispatch prose,
not a plan. provider, model, executor, tier are all discussed in prose.
`;
  const result = lintPlanCapabilityAnnotations(text, REGISTERED);
  assert.equal(result.ok, true);
  assert.deepEqual(result.units, []);
  assert.deepEqual(result.findings, []);
});

test('multiple units are each linted independently -- one bad unit does not swallow a good sibling', () => {
  const text = `- unit: first
  capability: code:implement
- unit: second
  capability: code:teleport
- unit: third
  capability: code:review
`;
  const result = lintPlanCapabilityAnnotations(text, REGISTERED);
  assert.equal(result.units.length, 3);
  assert.equal(result.findings.length, 1);
  assert.equal(result.findings[0].unit, 'second');
});

test('a Product Gates table row parses into a unit with source "product-gates"', () => {
  const text = `## Product Gates

| Phase | Cell | Capability | Exit |
|---|---|---|---|
| 00 | cell-a | code:implement | tests green |
| 01 | cell-b | code:review | reviewed. **Full-suite gate.** |
`;
  const result = lintPlanCapabilityAnnotations(text, REGISTERED);
  assert.equal(result.ok, true);
  assert.equal(result.units.length, 2);
  assert.equal(result.units[0].unit, 'cell-a');
  assert.equal(result.units[0].capability, 'code:implement');
  assert.equal(result.units[0].source, 'product-gates');
  assert.equal(result.units[1].unit, 'cell-b');
  assert.deepEqual(result.findings, []);
});

test('a Product Gates row with an unregistered capability is flagged the same as a unit block', () => {
  const text = `| Phase | Cell | Capability | Exit |
|---|---|---|---|
| 00 | cell-a | code:teleport | tests green |
`;
  const result = lintPlanCapabilityAnnotations(text, REGISTERED);
  assert.equal(result.ok, false);
  assert.equal(result.findings[0].code, 'capability.unregistered');
  assert.equal(result.findings[0].source, 'product-gates');
  assert.equal(result.findings[0].unit, 'cell-a');
});

test('a Product Gates row with an empty Capability cell is flagged capability.missing', () => {
  const text = `| Phase | Cell | Capability | Exit |
|---|---|---|---|
| 00 | cell-a |  | tests green |
`;
  const result = lintPlanCapabilityAnnotations(text, REGISTERED);
  assert.equal(result.ok, false);
  assert.equal(result.findings[0].code, 'capability.missing');
  assert.match(result.findings[0].message, /Product Gates row/);
});

test('a table that never matches the exact Phase|Cell|Capability|Exit header is never treated as Product Gates', () => {
  const text = `| A | B | C |
|---|---|---|
| 1 | 2 | 3 |
`;
  const result = lintPlanCapabilityAnnotations(text, REGISTERED);
  assert.deepEqual(result.units, []);
  assert.deepEqual(result.findings, []);
});

test('--cell scopes to the matching unit block only, by its leading id token', () => {
  const text = `- unit: I18 — plan lint hardening
  capability: code:implement
- unit: I19 — catalog serves schema
  capability: code:teleport
`;
  const result = lintPlanCapabilityAnnotations(text, REGISTERED, { cellId: 'I18' });
  assert.equal(result.ok, true);
  assert.equal(result.units.length, 1);
  assert.equal(result.units[0].unit, 'I18 — plan lint hardening');
  assert.deepEqual(result.findings, []);
});

test('--cell scopes to a matching Product Gates row by its exact Cell column value', () => {
  const text = `| Phase | Cell | Capability | Exit |
|---|---|---|---|
| 00 | cell-a | code:implement | ok |
| 01 | cell-b | code:teleport | ok |
`;
  const result = lintPlanCapabilityAnnotations(text, REGISTERED, { cellId: 'cell-a' });
  assert.equal(result.ok, true);
  assert.equal(result.units.length, 1);
  assert.equal(result.units[0].unit, 'cell-a');
});

test('--cell with no match anywhere returns capability.undeclared, severity hard, ok turns false', () => {
  const text = `- unit: I18 — plan lint hardening
  capability: code:implement
`;
  const result = lintPlanCapabilityAnnotations(text, REGISTERED, { cellId: 'I99' });
  assert.equal(result.ok, false);
  assert.deepEqual(result.units, []);
  assert.equal(result.findings.length, 1);
  assert.equal(result.findings[0].code, 'capability.undeclared');
  assert.equal(result.findings[0].severity, 'hard');
});

test('--cell still surfaces hard findings scoped to the matched unit', () => {
  const text = `- unit: I18 — plan lint hardening
  capability: code:teleport
- unit: I19 — catalog serves schema
  capability: code:implement
`;
  const result = lintPlanCapabilityAnnotations(text, REGISTERED, { cellId: 'I18' });
  assert.equal(result.ok, false);
  assert.equal(result.units.length, 1);
  assert.equal(result.findings.length, 1);
  assert.equal(result.findings[0].code, 'capability.unregistered');
});

test('a Product Gates Exit cell containing a literal "|" does not truncate the table -- every row after it still parses', () => {
  const text = `| Phase | Cell | Capability | Exit |
|---|---|---|---|
| 00 | cell-a | code:implement | stages a release from <dir|tar.gz> |
| 01 | cell-b | code:review | reviewed |
`;
  const result = lintPlanCapabilityAnnotations(text, REGISTERED);
  assert.equal(result.units.length, 2);
  assert.equal(result.units[0].unit, 'cell-a');
  assert.equal(result.units[0].capability, 'code:implement');
  assert.equal(result.units[1].unit, 'cell-b');
  assert.equal(result.units[1].capability, 'code:review');
  assert.deepEqual(result.findings, []);
});

test('a backticked Capability cell that IS registered is not flagged (backticks stripped before matching)', () => {
  const text = `| Phase | Cell | Capability | Exit |
|---|---|---|---|
| 00 | cell-a | \`code:implement\` | ok |
`;
  const result = lintPlanCapabilityAnnotations(text, REGISTERED);
  assert.equal(result.ok, true);
  assert.deepEqual(result.findings, []);
  assert.equal(result.units[0].capability, '`code:implement`');
});

test('a backticked Capability cell that is NOT registered is still flagged, with backticks stripped from the reported name', () => {
  const text = `| Phase | Cell | Capability | Exit |
|---|---|---|---|
| 00 | cell-a | \`code:teleport\` | ok |
`;
  const result = lintPlanCapabilityAnnotations(text, REGISTERED);
  assert.equal(result.ok, false);
  assert.equal(result.findings[0].code, 'capability.unregistered');
  assert.match(result.findings[0].message, /capability "code:teleport" is not registered/);
});

test('"unresolved-foo" is never treated as the exact "unresolved" hedge token', () => {
  const text = `- unit: apply the fix
  capability: unresolved-foo
`;
  const result = lintPlanCapabilityAnnotations(text, REGISTERED);
  assert.equal(result.ok, false);
  assert.equal(result.findings.length, 1);
  assert.equal(result.findings[0].code, 'capability.unregistered');
  assert.notEqual(result.findings[0].code, 'capability.unresolved');
});

test('a later markdown heading ends the unit block, so an indented key under it is never read as a pin on the stale unit', () => {
  const text = `- unit: apply the fix
  capability: code:implement

## Runtime notes

Example executor config:

  model: sonnet
`;
  const result = lintPlanCapabilityAnnotations(text, REGISTERED);
  assert.deepEqual(result.findings, [], JSON.stringify(result.findings));
  assert.equal(result.ok, true);
  assert.equal(result.units.length, 1);
  assert.equal(result.units[0].unit, 'apply the fix');
});

test('a Product-Gates-shaped table inside a fenced code block is never parsed as a real table (docs/how-to/author-a-plan-loop-track.md convention example)', () => {
  const text = `## Product Gates table

Mark each phase's proof obligation explicitly; do not leave it implicit.

\`\`\`text
## Product Gates

| Phase | Cell | Capability | Exit |
|---|---|---|---|
| 00 | <cell name> | code:implement | <exit condition> |
| 01 | <cell name> | code:implement | <exit condition>. **Full-suite gate.** |
\`\`\`

Real content after the fence.
`;
  const result = lintPlanCapabilityAnnotations(text, REGISTERED);
  assert.deepEqual(result.units, []);
  assert.deepEqual(result.findings, []);
});

test('the real docs/how-to/author-a-plan-loop-track.md fenced Product Gates example produces zero phantom units', () => {
  const docPath = path.resolve(__dirname, '../../docs/how-to/author-a-plan-loop-track.md');
  const text = fs.readFileSync(docPath, 'utf8');
  const result = lintPlanCapabilityAnnotations(text, REGISTERED);
  assert.deepEqual(result.units, []);
  assert.deepEqual(result.findings, []);
});

test('an inner fence-looking line with an info string (e.g. "```js") never closes an outer fence early -- a real unit after the true close still parses', () => {
  const text = `\`\`\`
outer fence content
\`\`\`js
inner odd line that looks like a nested fence open
\`\`\`

- unit: real unit after
  capability: code:implement
`;
  const result = lintPlanCapabilityAnnotations(text, REGISTERED);
  assert.deepEqual(result.findings, [], JSON.stringify(result.findings));
  assert.equal(result.units.length, 1);
  assert.equal(result.units[0].unit, 'real unit after');
});

test('a same-line backtick fence whose info string itself contains a backtick never opens a fence -- it never swallows the rest of the file', () => {
  const text = `\`\`\` not a fence \`\`\`

- unit: real unit after
  capability: code:implement
`;
  const result = lintPlanCapabilityAnnotations(text, REGISTERED);
  assert.deepEqual(result.findings, [], JSON.stringify(result.findings));
  assert.equal(result.units.length, 1);
  assert.equal(result.units[0].unit, 'real unit after');
});

test('a pin key is caught case-insensitively, tolerating whitespace around the colon and an optional leading bullet', () => {
  const text = `- unit: apply the fix
  capability: code:implement
  Model: sonnet
  provider : openai
  - tier: heavy
`;
  const result = lintPlanCapabilityAnnotations(text, REGISTERED);
  const pinned = result.findings.filter((f) => f.code === 'capability.pinned');
  assert.equal(pinned.length, 3, JSON.stringify(result.findings));
  assert.ok(pinned.every((f) => f.severity === 'hard'));
});
