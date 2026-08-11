# tsk-1u7 — plan

**Supersedes the prior revision of this file** (small mode, exclude-the-test
approach) — that revision was built on D1/D2, which `CONTEXT.md` D3/D4 now
reverse: `fgos-coding-validating` found `session.mjs`'s lock still carries a real,
precedent-confirmed race. This plan implements the fix instead.

## Mode gate

Flags: auth (no), authorization (no), data model (no), audit/security (no),
external systems (no), public contracts (no), cross-platform (no),
**existing covered behavior (yes** — `tryAcquireOnce`/`acquireSessionsLock`
is the lock every `createSession` call funnels through; `session.test.mjs`'s
existing suite already exercises it**)**, **weak proof around the area
(yes** — concurrency correctness is inherently hard to prove with
certainty; that is exactly what made D1's first-pass conclusion wrong**)**,
multi-domain (no). 2 flags.

Chosen mode: **standard**. Unlike the prior (now-superseded) "small" pick,
this change touches production concurrency-control code with a real
regression risk to every session-lifecycle call — the table's own 2-flag
threshold applies honestly here, not overcounted.

Not **spike**: `tsk-3ld` chose spike because its single yes/no question
(does a real race exist?) was still open and needed fresh ablation evidence
to answer. That question is already answered for `tsk-1u7` by direct
precedent — same vulnerable code shape, same root cause, already proven and
fixed in the sibling `events.mjs` lock (`CONTEXT.md` D3). What's left is
implementing the known fix and proving it holds for `session.mjs`
specifically, which is standard implementation-plus-proof work, not an
open question.

`fgos graph --id tsk-1u7 --json`: still its own size-1 component — no
cross-item ordering applies.

Impact-analysis: GitNexus `present` → `impact-analysis: full`. Not
exercised further — the change is scoped to one internal module
(`session.mjs`) with a known, already-enumerated caller surface
(`createSession`, `endSession`, `listSessions`, `reclaimOrphanedSessions`,
all in the same file) rather than needing a blast-radius trace across the
wider codebase.

## Approach

Port `events.mjs`'s already-proven fix (`events.mjs:205-243`,
`tryAcquireEventsLockOnce`) into `session.mjs`'s `tryAcquireOnce`
(`session.mjs:131-185`), mirroring it exactly:

- Replace the fast-path create (`fs.openSync(lockPath, 'wx')` +
  `fs.writeSync(fd, String(pid))`, `session.mjs:139-141`) with: write the
  pid to a per-attempt temp file (`fs.writeFileSync`), then
  `fs.linkSync(tmpPath, lockPath)`. `link()` only ever exposes the
  destination fully-written or not-yet-existing — the file-exists-but-empty
  window closes structurally, the same reasoning `events.mjs:222-224`
  already documents.
- Clean up the temp file in a `finally` (mirroring `events.mjs:236-241`),
  regardless of whether the link succeeded (already linked, source no
  longer needed) or hit `EEXIST` (link failed, orphaned temp file).
- Everything past the create attempt (`EEXIST` handling, PID-liveness
  check, stale re-read-before-unlink) is untouched — `CONTEXT.md`'s
  original scout already confirmed that part is sound (D1's evidence there
  still holds; only the fast-path create was ever wrong).

Risk map:

| Component | Risk | Proof point |
|---|---|---|
| `session.mjs`'s `tryAcquireOnce` fast-path create | Medium — every `createSession`/`endSession`/`listSessions`/`reclaimOrphanedSessions` call funnels through this lock; a botched port could deadlock (never releasing) or leave orphaned temp files | **DONE at `fgos-coding-validating`, real evidence**: `N=20` with no synchronization barrier reproduced 0/10 unpatched (the plan's original assumption — wrong, named below). Adding a shared `startAt` barrier (mirroring `events.test.mjs`'s own technique — a plain `Promise.all` spreads real spawn/import jitter too wide to hit the microsecond create-vs-write window) and raising to `N=50`: unpatched reproduced 8/30 (~27%, matching `tsk-3ld`'s own ~30%) — including one direct hit, `sessions.json ... is corrupt (not valid JSON): Unexpected end of JSON input`, the exact concurrent-writer signature the hypothesis predicted. Patched: 0/30 at the same `N=50`+barrier. Fix applied (`session.mjs:131-166`, ported `events.mjs`'s `linkSync` technique). |
| `session.test.mjs`'s other 5 tests in the same file (nesting guard, refuse-to-nest, lock-reclaim, etc.) | Low — none touch the fast-path create directly | **DONE**: full file run after the fix — 15/15 pass, no regression. |

## Files touched

- `src/runner/session.mjs` — rewrite `tryAcquireOnce`'s create branch
  (`session.mjs:137-145`) to the `linkSync` technique.
- `test/runner/session.test.mjs` — raise the concurrent-createSession
  test's process count from 5 toward `tsk-3ld`'s own `N ≥ 20` headroom
  target, as permanent regression coverage at the scale that actually
  catches this (mirrors `tsk-3ld`'s `N_PROC` 6→20 bump, `CONTEXT.md` D4).
  Exact `N` decided at execution time, informed by the ablation's own
  result (lowest `N` that reliably reproduces unpatched, same sizing logic
  `tsk-3ld` used).

## Shape (standard)

One phase, one item, no split — the fix is a single localized function
rewrite plus a test-parameter bump, both in the same feature area
`CONTEXT.md` already scoped:

1. Rewrite `tryAcquireOnce`'s create branch per the Approach above.
2. Run the ablation (risk-map proof point) to confirm the fix actually
   closes the window at the concurrency level that reproduces it —
   deferred to `fgos-coding-validating`, not guessed here.
3. Once the ablation confirms, raise the test's process count to the
   value the ablation showed is needed, as permanent coverage.
4. Run the full verify command.

Concrete cases already covered by `session.test.mjs`'s existing suite and
worth re-confirming, not re-designing: nesting guard (refuses starting a
session inside an existing session worktree), stale-lock reclaim
(dead-pid), lock exclusion between a live and a stale holder — none of
these change shape from this fix, only the create branch does.

## Proof surface

Verify (unchanged from what `discover` locked — still accurate, no code
identity changed in the command itself):
```
node --test test/runner/session.test.mjs && for i in 1 2 3; do npm test; done
```
Proves: the file's own tests (including the now-higher-concurrency
regression case) pass directly, and the default full-suite glob passes
cleanly 3 times in a row — both the fix and its test coverage hold.

## Assumptions

- `fs.linkSync` behaves identically across the OSes this repo's CI/dev
  runs on (Linux — confirmed, this is the same primitive `events.mjs`
  already relies on in this same repo, no new platform surface). Not
  material — an already-proven primitive, not a new one.
- ~~The concurrency level needed to reliably reproduce `session.mjs`'s
  version of this race may differ from `events.mjs`'s `N=20`~~ — **proven
  wrong, corrected at `fgos-coding-validating`**: the deciding factor was not `N`
  alone but the missing synchronization barrier (`session.test.mjs`'s
  original `Promise.all` never guaranteed simultaneity the way
  `events.test.mjs`'s `Atomics.wait` barrier does). `N=50` + a shared
  `startAt` barrier reproduces reliably (~27%/run); `N=20` with no barrier
  did not reproduce in 10 tries. Final test shape: `N=50` with the barrier,
  committed as permanent regression coverage.
