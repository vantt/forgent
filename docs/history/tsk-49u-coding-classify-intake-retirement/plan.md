# Plan: retire the orphaned coding-classify-intake config entry

Item: `tsk-49u`. Mode: **tiny** — one honest fact-finding pass (already
done, see `CONTEXT.md`) plus a two-line mechanical cleanup once the verdict
was in. No design question, no split.

## Approach

`CONTEXT.md` D0-D3 already did the real work of this item: tracing
`coding-classify-intake` from `.fgos/config.json` through
`src/runner/dispatch.mjs` to its one real consumer, and discovering that
consumer (`fgos-submit-assist`) had its dispatch to this capacity already
stripped by a sibling item (`tsk-4ns`, merged mid-session via `fgw/tsk-5wz`).
D4 executed the resulting cleanup:

1. `.fgos/config.json`: removed `runner.capacities.coding-classify-intake`
   (16 lines) — direct main-checkout commit (`d7ab98b`), per ADR0020: this
   path never rides `fgw/tsk-49u`, and this worktree's own `.fgos/` is
   stripped by design (`src/runner/worktree.mjs:409-416`) so it could not
   have been edited here even by mistake.
2. `test/runner/dispatch.test.mjs:646-656`: the test that pinned the
   entry's *existence* (added when `tsk-3fj` renamed it) now pins its
   *absence* instead — committed on `fgw/tsk-49u` (`44c5d4c`).

Ordering matches the precedent `tsk-3fj`'s own plan.md already used
(`docs/history/coding-classify-intake-capacity-rename/plan.md:91-102`):
step 1 has to land on `main` before this item's `fgos return` re-verifies,
since `committedRunnerConfig()` always reads the real main-checkout file,
never this branch's stripped-`.fgos/` view.

**Known, accepted exposure:** between step 1 landing and this item's own
merge, `main`'s `npm test` is red on the *old* assertion (any other session
running `npm test` against the main checkout in that window sees a false
failure). Same exposure `tsk-3fj`/`tsk-4fk` already hit for the same
structural reason (ADR0020 splits an atomic change into two non-atomic
commits) — not a new risk class, and minimized by merging this item
promptly.

## Risk map

| Component | Risk | Proof |
|---|---|---|
| `.fgos/config.json` entry removal | low — config-only, zero remaining production consumers (verified: `grep -rn coding-classify-intake src bin docs .claude/skills test` outside this entry and its own test → 0 hits) | `d7ab98b` on main; re-grep post-commit |
| Test rewrite (existence → absence) | low — same file, same helper, inverted one assertion | `node --test test/runner/dispatch.test.mjs` → 179/179 pass on `fgw/tsk-49u` against live main config |
| Brief main-red window before merge | low, temporary, precedented (see above) | none needed — same accepted tradeoff `tsk-3fj` documented |

Impact-analysis posture: `degraded` — `fgos tool query --capability
impact-analysis --status present` returns GitNexus as `present` (not
`inactive`), but its own hook output this session reports its index stale
at `4ce7a96`, well behind current HEAD. Not a blocker here regardless:
neither change touches a code symbol (a JSON config key deletion, and a
self-contained `test()` callback with no upstream callers), so no row in
this plan's risk map leans on call-graph blast-radius evidence in the
first place — the posture is recorded honestly rather than assumed
`inactive`, but nothing in this plan needed it to be `full`.

## Outstanding questions

None
