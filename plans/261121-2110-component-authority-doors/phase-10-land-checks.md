# Phase 10: Door guard by primitive and aliases, counted, no debt but the named debt

## Inputs
- `test/architecture.test.mjs` `checkDoors` (formerly :1794-1853) and its synthetic tests (:1856 onward).
- `scripts/git-one-door-scan.mjs` (primitive matching).
- The knowledge note on why the `orchestrator` word guard was retired (decision 0031,
  `docs/knowledge/why-the-launcher-vocabulary-word-guard-was-retired-right-aft*/`).
- `packages/component-authority/model/doors/*.yaml` after phases 2-9, and `contracts/model.v1.json`.
- Owner answer B to q-aanvfxaopa (2026-11-24), which widens D6: the named list is every door row that still has
  `debt` when this phase starts, so the component guards from the release on; phase 12 retires them all right after
  the release. Each named row keeps a `retiredBy`: the row's existing plan, program step or backlog item where it
  names one, otherwise `261121-2110-component-authority-doors#phase-12`. The D6 rows below keep theirs.
- Owner decision D6 (discussion `ds-wham5txfkv`, 2026-11-23): the named debt. Row `doctor-readiness-registry` keeps its `debt`, `retiredBy` the Workflow/Work port (S6b/S7 of `261114-2051-rust-verb-migration-program`). Row `installation-shim-location` keeps its `debt`, `retiredBy: p-rypvkc3kai`, while that backlog item is open; if it is done, phase 2g has removed the debt and the row is not named. No warn-only switch exists or is added (O6 closed).

## Files it may write
test/architecture.test.mjs, packages/component-authority/model/doors/, packages/component-authority/contracts/model.v1.json, docs/platform/component-authority/spec.md

## Execution
Every writing unit runs with `--provider claude` (owner order, D6 step 0). If claude is unavailable the unit parks and reports. It never falls back to another provider.

## Steps
1. Schema:
   - keep `debt` in the door definition only together with a required `retiredBy` (a plan dir, program step or
     backlog id), and allow it only on the rows named in a fixed list in `checkDoors` (the D6 named debt);
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
   - a door row with `debt` fails unless it is on the named list and carries `retiredBy`;
   - a named-debt entry whose file no longer exists fails, so the list cannot go stale.
4. Synthetic tests, in the same file:
   - a new-named `rename`+`fsync` helper outside `durable-file` fails;
   - one extra match in an allowed file fails;
   - the same text in a comment passes;
   - a declared alias used as a new function name fails;
   - `debt` on a row outside the named list fails, and so does a named row without `retiredBy`.
5. Update the spec's door section to match, naming the two debt rows and what retires them.

## Verify
`node --test test/architecture.test.mjs` is green, the five synthetic cases behave as stated, and
every file `rg -l '^debt:' packages/component-authority/model/doors` lists is on the named list in `checkDoors`
and carries `retiredBy`, and the list names no row without `debt`.

## Rollback
Revert the phase commit. The previous guard and schema come back. No debt comes back, because the
retirements are separate commits.
