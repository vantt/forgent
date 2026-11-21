# Phase 10: Door guard by primitive and aliases, counted, no debt

## Inputs
- `test/architecture.test.mjs` `checkDoors` (formerly :1794-1853) and its synthetic tests (:1856 onward).
- `scripts/git-one-door-scan.mjs` (primitive matching).
- The knowledge note on why the `orchestrator` word guard was retired (decision 0031,
  `docs/knowledge/why-the-launcher-vocabulary-word-guard-was-retired-right-aft*/`).
- `packages/component-authority/model/doors/*.json` after phases 2-9, and `contracts/model.v1.json`.

## Files it may write
test/architecture.test.mjs, packages/component-authority/model/doors/, packages/component-authority/contracts/model.v1.json, docs/platform/component-authority/spec.md

## Steps
1. Schema:
   - remove `debt` from the door definition;
   - add `primitives[]` (calls or imports that do the job, e.g. `renameSync`+`fsyncSync` for atomic write,
     `process.kill`, `/proc/`, `spawn`/`Command::new`);
   - add `names[]` (canonical plus aliases);
   - make each `allowed` entry `{path, count, reason}`. `patterns` stays only where a row really needs a literal
     path pattern.
2. Fill `primitives` and `names` for every door row from what the row's job does. Set `count` to today's match count
   in each allowed file.
3. `checkDoors`:
   - match on code tokens only, using the existing lexers (`scripts/lib/js-source-lexer.mjs`,
     `scripts/lib/rust-source.mjs`), so comments and strings never match;
   - match by primitive, and by declared names as identifiers, never by a bare word in prose;
   - in an allowed file, more matches than `count` fails;
   - outside allowed files, any match fails;
   - a door row with `debt` fails the schema.
4. Synthetic tests, in the same file:
   - a new-named `rename`+`fsync` helper outside `durable-file` fails;
   - one extra match in an allowed file fails;
   - the same text in a comment passes;
   - a declared alias used as a new function name fails.
5. Update the spec's door section to match.

## Verify
`node --test test/architecture.test.mjs` is green, the four synthetic cases behave as stated, and
`rg -c '"debt"' packages/component-authority/model/doors` prints nothing.

## Rollback
Revert the phase commit. The previous guard and schema come back. No debt comes back, because the
retirements are separate commits.
