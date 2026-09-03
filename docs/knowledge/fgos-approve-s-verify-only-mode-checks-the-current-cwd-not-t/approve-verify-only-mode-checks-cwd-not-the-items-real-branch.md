---
framework: diataxis
mode: explanation
---
# `fgos approve`'s "verify-only" mode checks the current cwd, not the item's real branch

`tsk-2qz` was decomposed into `tsk-2qz-1`/`tsk-2qz-2`. Neither child got its
own `fgw/<child-id>` branch — `fgos take --role session --id tsk-2qz-1`
reported `"source": "main"`, meaning the child's real work happened
directly on the *parent's* branch (`fgw/tsk-2qz`), which this session was
already checked into.

Both children were `return`ed successfully from inside that worktree, with
their own real test output — `tsk-2qz-1`'s `return` genuinely ran 92 tests
from `fgw/tsk-2qz`'s real content. But `fgos approve tsk-2qz-1`, run
afterward **from the main checkout** (`approve` refuses to run from a
worktree at all), reported:

```json
{ "id": "tsk-2qz-1", "mode": "verify-only", "to": "done", ... }
```

with an `output` field showing only **88 tests** — missing every test this
item's own commits had just added (`registerFix`, `runFixes`,
`gate-bypass-configured`, the new `readGateBypassLevel` shared-file-read
tests). The main checkout's `git log` confirmed why: `fgw/tsk-2qz`'s
commits were never merged into `main` by this call —
`git merge-base --is-ancestor <commit> main` returned false for every one
of them, while `git branch -a --contains <commit>` showed them present on
`fgw/tsk-2qz` only.

## Why this isn't data loss (but is easy to misread as a bug)

This is the intended design, once you know the topology
(`docs/how-to/close-out-a-decomposed-root-item-after-all-children-are-done.md`
already documents it): a child merges into its **root's branch**, not
`main`. Since `tsk-2qz-1`/`tsk-2qz-2` never had their own branch to merge
(they committed directly onto `fgw/tsk-2qz`), there was nothing for
`approve` to merge — hence `"mode": "verify-only"`. Only the root item's
own `fgos approve tsk-2qz`, at the very end, actually merges
`fgw/tsk-2qz` into `main`.

## The real gap: "verify-only" verifies against whatever `main`'s cwd
## currently contains, not the item's own real branch content

The problem is narrower than "nothing merged" — it's that the *verify
step itself* ran against stale code and still returned `passed`. Since
`fgw/tsk-2qz` was not yet merged into `main` at the time `approve
tsk-2qz-1` ran, and `approve` runs from the main checkout's own cwd
(unable to run from the worktree at all), the 88 tests it actually
executed were `main`'s **old** `test/setup/checks.test.mjs`, not
`fgw/tsk-2qz`'s real one. The item was still marked `done` on that basis.

This did not produce a wrong *conclusion* here — the real proof already
happened at each child's own `return` (run correctly, inside the worktree,
against the real branch content) before `approve` ever ran. But
`approve`'s own "verify-only" re-verification for a branch-less child is
not actually re-proving anything true to its own name; it silently
verifies the wrong code and reports success regardless. Trust the child's
own `return` output as the real proof for this topology, not `approve`'s
`verify-only` step's test count.

## A second, unrelated real finding along the way: `discover`'s ask path races under concurrent sessions

While recovering from an unrelated stuck state on this same item, direct
event-log inspection (`.fgos/events.jsonl`) turned up a genuine
concurrent-write bug, worth recording verbatim from the real settlement
capture:

> Concurrent-write race (event log seq 3327-3329): a second session ran
> `fgos discover` on this item mid-flow and appended an ask event whose
> `statusAtAsk` field (`awaiting-human`) contradicted its own `from` field
> (`doing`) -- a TOCTOU bug in discover/ask internal ask-path.
> `answerAwaiting` derives its resume target purely from that single-slot
> `statusAtAsk` (`src/state/store.mjs:615`), so `fgos answer`/`move` could
> not recover this item through any exposed CLI flag. Recovering via
> `moveWork` directly (same `store.mjs` door, same locked FSM transition,
> same answer-required contract on leaving `awaiting-human`) since `move`'s
> CLI wrapper never forwards `--answer`.

Two sessions calling `fgos discover` on the same item within ~9 seconds of
each other produced an event whose own two fields disagreed with each
other — a real race, not a one-off fluke, and currently unrecoverable
through any documented CLI verb once it happens (`fgos move --to <status>`
never forwards `--answer` to `moveWork`, even though the underlying
function accepts it).
