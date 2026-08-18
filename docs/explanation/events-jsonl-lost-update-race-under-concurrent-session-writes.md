---
type: explanation
title: Why .fgos/events.jsonl can silently lose lines under concurrent session writes
tags: []
source_capture_ids: [tsk-2xt, tsk-1q5, tsk-3wq]
---
# Why `.fgos/events.jsonl` can silently lose lines under concurrent session writes

`.fgos/events.jsonl` is fgOS's own append-only audit log — every mutating
verb funnels through it. Under investigation (`tsk-1q5`) as a real
lost-update bug: raw log lines can go missing entirely, not just a
derived cache going stale, when multiple sessions write against the same
shared main checkout at once.

## A real, observed instance (`tsk-2xt`)

While redoing bookkeeping for `tsk-2xt` (the herdr-orchestrator root
item), a `goal-check` run against its branch failed:

> `{"id":"tsk-2xt","disposition":"blocked","errorClass":"verify-miss","layer":"verification","attempts":1,"detail":"goal-check failed on branch \"fgw/tsk-2xt\" (exit 127)","ts":"2026-08-10T08:00:42.789Z"}`
> — real `work.friction` capture, id `tsk-2xt`

Exit `127` is a shell "command not found" — the item's own `verify` field
had reverted from a real test command back to a placeholder string
(`"chưa xác định"`, Vietnamese for "not yet determined"), which
`goal-check` then tried to execute literally as a shell command
(`/bin/sh: chưa: not found`). The recorded settlement for this friction
is the same placeholder, unresolved at capture time:

> `{"kind":"clarify-pass","role":"session","detail":"chưa xác định — bổ sung thủ công","id":"tsk-2xt"}`
> — real `work.settlement` capture, id `tsk-2xt`

This was not a fresh bug in `tsk-2xt`'s own work — it was a second event
type going missing from the log for the same item, alongside a whole
transition chain (`validateApprove`, `decompose`→`executing`,
`delivered`) that had vanished from `.fgos/events.jsonl` even though the
underlying code stayed intact on git:

> "while redoing bookkeeping for tsk-2xt, two distinct event types were
> confirmed missing from `.fgos/events.jsonl` for the same item — (a) the
> entire post-`planApprove` transition chain ... vanished from the log
> though the real code stayed intact on git; (b) a `work.edit` that set
> `verify` to a real test command was also lost, so `verify` reverted to
> the placeholder string, which a later `return` then tried to execute as
> a shell command (`/bin/sh: chưa: not found`)."
> — real addendum, `docs/history/tsk-1q5-events-jsonl-lost-update-race/plan.md`

## Why this points at the log itself, not a cache

`tsk-1q5`'s own investigation names two candidate causes: (A) `state.json`
being rebuilt outside the same lock its own append uses (a derived-cache
race), and (B) `events.jsonl` being git-tracked in the one shared main
checkout, where a `git checkout`/`reset --hard`/merge from *any other*
concurrent session can silently discard uncommitted appends. `tsk-2xt`'s
instance is raw log lines disappearing, not a stale rebuild — the same
signature as candidate B, and the plan's own addendum treats it as
strengthening B as the more likely dominant cause.

## Two candidate causes, and why the investigation started with the wrong one

`tsk-1q5`'s own starting hypothesis was that `withEventsLock`/
`appendEvent` (`src/state/events.mjs`) is a fake in-process JS mutex,
useless across separate node processes. Reading the code disproved this:
`acquireEventsLock` is a real cross-process OS lock (write-to-tempfile +
atomic `fs.linkSync`, with stale-pid reclaim) — the same primitive
`loop.mjs` and `session.mjs` already used, and a prior investigation
(`docs/history/events-lock-concurrency-race/CONTEXT.md`) had already
proven by fork-based ablation test that it genuinely serializes the
append itself. That closed a *different*, already-fixed race
(duplicate/out-of-order `seq`), not the one this item was chasing.

Two real candidate causes turned up instead:

- **Root cause A — `refreshView`/`writeView` run outside
  `withEventsLock`.** Every write door in `src/state/store.mjs`
  (`addWork`, `editWork`, `moveWork`, `moveStage`, and ~10 others) appends
  under the lock, then calls `refreshView(dir)` — a full replay of
  `events.jsonl` into `state.json` — *after* releasing it. Two processes
  finishing their own correctly-locked appends close together can race at
  this derived-cache layer: whichever process's unlocked replay-and-write
  finishes last wins, even if its read of the log was captured before the
  other process's append landed. `src/state/porting-store.mjs` carries the
  identical shape.
- **Root cause B — `.fgos/events.jsonl` itself is git-tracked in the one
  shared main checkout** (confirmed via `git ls-files .fgos/`; unlike
  `state.json`, which is gitignored). A `git checkout`/`reset --hard`/
  merge from *any other* session sharing that checkout can silently
  discard whatever uncommitted appends are sitting in the file — raw log
  lines disappearing, not a stale rebuild. This matches the `tsk-2x9k`
  evidence above (only 3 of the expected lines surviving) more directly
  than root cause A does on its own, and is the same class of hazard
  `AGENTS.md` already names for the wider tree (tsk-3au/tsk-4hk).

## What actually got fixed, and what stayed deferred

`fgos-coding-validating`'s own scope decision, confirmed by a human at the
`decompose` gate: fix root cause A only as this item's one honest piece —
"widen `withEventsLock` scope in `store.mjs`/`porting-store.mjs` to
include `refreshView`, closing the lost-update race on `state.json`" —
and defer root cause B, "logged as a lead on `tsk-3wq`", since B has no
test-provable fix the way A does (a git-operational hazard, not a code
bug). The item's own accepted answer states this split directly:

> "Confirm: no split, pass-through. Fix root cause A (refreshView-outside-
> lock race in store.mjs/porting-store.mjs) as one piece; root cause B
> (events.jsonl git-tracked-in-shared-checkout hazard) stays deferred,
> logged as a lead on tsk-3wq."
> — real `work.settlement` (`answer`/`human`), id `tsk-1q5`

The fix moves each mutation function's existing `refreshView(dir)` call
inside the same `withEventsLock` scope its own append already uses,
closing the window structurally rather than adding a second, independent
lock — passed verify on the first attempt
(`node --test test/state/events.test.mjs test/state/store.test.mjs
test/state/porting-store.test.mjs`). Root cause B remains open, tracked
as a lead against `tsk-3wq` rather than folded silently into this fix.

## How root cause B was actually closed (`tsk-3wq`)

Root cause B — `.fgos/events.jsonl` git-tracked in the one shared main
checkout, where an ad hoc `git merge`/hand-resolution can silently
discard uncommitted appends — stayed open after the section above,
deferred as a lead against `tsk-3wq`. That item confirmed the same
mechanism by direct repro, then closed it.

Confirming the mechanism, without any fix in place:

```
$ git merge --no-ff branch-b -m "merge branch-b"
Auto-merging .fgos/events.jsonl
CONFLICT (content): Merge conflict in .fgos/events.jsonl
Automatic merge failed; fix conflicts and then commit the result.
```

— two branches independently appending real events since a common
ancestor, each numbering its own new lines from the same last-known
`seq`, produce a real, on-demand `CONFLICT (content)` with raw
`<<<<<<<`/`=======`/`>>>>>>>` markers straddling two different sets of
events. Whoever resolves that conflict can trivially pick one side and
silently discard the other's real events — no error, no warning. This is
the exact shape `docs/history/live-events-seq-corruption/CONTEXT.md`
(`tsk-n4i`) first identified and left unresolved, and the same shape that
recurred three more times (`tsk-4vo`'s children, `tsk-5td`, `tsk-2x9k`)
before `tsk-3wq` closed it.

The fix (`tsk-3wq` D1): a `.gitattributes` entry —
`.fgos/events.jsonl merge=union` — routing every `git merge` touching
that path (including ad hoc ones run directly by a session, not only
`fgos merge`) through git's own built-in `union` merge driver, which
takes lines from both sides instead of leaving conflict markers. Because
`.gitattributes` is itself a versioned file, every checkout picks it up
automatically; no per-machine git config or `fgos setup` wiring is
needed. The same divergent-branch scenario, with the fix in place:

```
$ git merge --no-ff branch-b -m "merge branch-b into main"
Auto-merging .fgos/events.jsonl
Merge made by the 'ort' strategy.
 .fgos/events.jsonl | 2 ++
 1 file changed, 2 insertions(+)
```

Exit `0`, no conflict, no hand-resolution — all 6 real events from both
sides survive. The one documented residue of `union` ("tends to leave the
added lines... in random order," and here, duplicate `seq` values since
each side numbered its own new lines independently) is exactly what a
second, new `scripts/events-jsonl-contiguity.mjs` script closes:
`--check` reports any `seq` gap or duplicate; `--fix` dedupes exact
duplicates and renumbers `seq` 1..N contiguously in original relative
(`ts`) order, reusing `src/state/events.mjs`'s own line parsing rather
than reimplementing it. Run against the merged, duplicate-`seq` result
above:

```
$ node scripts/events-jsonl-contiguity.mjs --check .fgos/events.jsonl
{"ok": false, "totalLines": 6, "duplicates": [{"seq":3,...},{"seq":4,...}], "gaps": [...]}

$ node scripts/events-jsonl-contiguity.mjs --fix .fgos/events.jsonl
{"fixed": true, "totalLines": 6, "dedupedCount": 0, "resequencedCount": 2, "backupPath": "..."}
```

— fully contiguous afterward, all 6 real events intact. That script is
registered into `fgos doctor`'s existing check registry (mirroring the
already-tested `checkRootDrift` pattern) so this class of residue is
caught proactively going forward, on any git operation, not only when
some later script happens to trip over it.

`tsk-3wq` closed one more, independently-real gap in the same pass
(D2): `repairTruncatedLastLine` (`src/state/events.mjs:141-184`) did its
own read-modify-write of the log without holding `events.lock`, so a
concurrent `appendEvent` landing mid-repair was silently overwritten. A
failing-before/passing-after regression test proves the fix
discriminates the two states directly — pre-fix, the function ignores a
lock another process holds and returns in 0ms:

```
✖ repairTruncatedLastLine now blocks on a lock another process holds — the actual old-vs-new discriminator (29.513682ms)
  AssertionError [ERR_ASSERTION]: repairTruncatedLastLine must block until the held lock releases (~500ms) — only took 0ms, meaning it did not actually wait for the lock
```

— post-fix, the same test against the same scenario correctly blocks for
the lock's full hold duration before starting its own read:

```
✔ repairTruncatedLastLine now blocks on a lock another process holds — the actual old-vs-new discriminator (534.567774ms)
```

`src/runner/merge.mjs` was deliberately left untouched: it already
aborts outright the moment any `.fgos/` path is staged
(`fgos-write-rejected`, added the same day as `tsk-n4i`'s own corrupting
merges), so a fixup wired there would never run for `fgos merge` and
would do nothing for the actual live vector — a raw `git merge` run
directly by a session outside any fgOS verb, which is what all three new
repros this item chased turned out to be
(`grep -rn "'merge'\]" src bin scripts` finds `merge.mjs` is the only
place fgOS code itself ever runs `git merge`). A `.gitattributes` entry
is git-level and path-scoped, so it applies uniformly regardless of who
invokes the merge — which is why that was the right fix and no
`merge.mjs` change was.

Full verify: `node --test test/state/events.test.mjs
test/state/store.test.mjs test/setup/checks.test.mjs
test/scripts/events-jsonl-contiguity.test.mjs` — 166 tests, 0 fail.

## Related

- `docs/history/tsk-1q5-events-jsonl-lost-update-race/plan.md` — the full
  root-cause investigation (two candidate causes, proof points, and this
  addendum) this instance corroborates.
- `AGENTS.md`'s own documented main-checkout hazard (tsk-3au/tsk-4hk) —
  the same class of danger candidate B names: any session sharing the
  main checkout can discard another session's uncommitted work.
- `docs/history/events-jsonl-merge-driver-recurring-write-loss/` —
  `tsk-3wq`'s own CONTEXT.md/plan.md/repro-notes.md/iron-law-evidence.md,
  the full decision record and evidence trail behind root cause B's fix.
