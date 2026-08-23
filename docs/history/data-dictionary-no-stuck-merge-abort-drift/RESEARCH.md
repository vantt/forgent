# RESEARCH — tsk-22b: Data Dictionary #7/#7b missing `no-stuck-merge-abort`

## Round 1 — 2026-08-23

**Asked:** Verify the bug description's three claims and find the exact fix
target (item text is untrusted per RUL45, confirm directly).

**Checked:**
- `rg -n "no-stuck-merge-abort" src/setup/registrations.mjs`
- Read `src/setup/registrations.mjs:2405-2434` directly
- `rg -n "Today's registered checks|Today's registered fixes" docs/specs/distribution.md`
- Read `docs/specs/distribution.md:48-49` (Data Dictionary rows #7/#7b) directly
- `node --test test/setup/registrations.test.mjs`

**Found:**
1. `src/setup/registrations.mjs:2424-2428` registers a check `no-stuck-merge-abort`
   via `registerCheck` with description `'main checkout has no lingering
   MERGE_HEAD from an in-progress or stuck merge abort (tsk-40a)'`.
   `src/setup/registrations.mjs:2430-2433` registers a fix with the same id via
   `registerFix`. Both real, confirmed present. Claim 1 confirmed.
2. `docs/specs/distribution.md:48` (row #7, "Today's registered checks") lists
   34 check ids and does not include `no-stuck-merge-abort`. Row #7's list ends
   `..., agy-permissions-configured (tsk-1xm), main-checkout-guard-warnings
   (tsk-1vc-3)`.
   `docs/specs/distribution.md:49` (row #7b, "Today's registered fixes") lists
   9 fix ids and also does not include `no-stuck-merge-abort`. Row #7b's list
   ends `..., decision-index-stale (tsk-1lv-2/tsk-1lv), agy-permissions-configured
   (tsk-1xm)`. Claim 2 confirmed.
3. `node --test test/setup/registrations.test.mjs` → 26 pass, 2 fail. Both
   failures are `AssertionError [ERR_ASSERTION]` on `deepStrictEqual` in the
   "Data Dictionary #7 names exactly the registered doctor checks" and "...#7b
   names exactly the registered doctor fixes" tests, both showing
   `no-stuck-merge-abort` present in `actual` (the live registry) but absent
   from `expected` (the doc-derived list). Claim 3 confirmed exactly as
   described.

**Citation format** (from the two rows' own existing entries): each id is a
backtick-quoted bare name, optionally followed by a space and a parenthesized
task-id citation when one exists for that entry, e.g. `` `cli-version-visible`
(tsk-2ej) `` or `` `worker-slots-ceiling-usable` (tsk-1oz) ``. Not every entry
carries a citation (e.g. `node-version-and-git`, `shell-integration-sourced`
have none). The registry description itself already cites `(tsk-40a)`, so the
fix should append `` `no-stuck-merge-abort` (tsk-40a) `` to both rows.

**Still open:** none — all three claims verified against live repo state, and
the exact insertion text/position is determined (append at the end of each
row's list, matching the existing comma-separated, backtick+citation format).

## Verdict

`clear` — verify command: `node --test test/setup/registrations.test.mjs`
(currently 26 pass / 2 fail; expect 28 pass / 0 fail after the fix).
