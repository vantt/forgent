# Why `/fgOS:retro-loop` restores the `compound` verb instead of inventing a new one

`tsk-3o3` set out to build the retrospective half of the
`delivered -> retrospective -> cleanup -> done` chain — a `/fgOS:retro-loop`
skill mirroring the already-shipped `/fgOS:cleanup-loop` (`tsk-dvc`). What
it actually shipped is a little different from that starting brief, and
the difference is worth explaining.

## The item started as something else entirely

`tsk-3o3` originally read "design a batch-trigger threshold (N item / T
time) for when compound-learn synthesis runs" — a child of `tsk-4op`,
parked `awaiting-human` on the question "per-domain or global threshold?"

That question turned out to be moot. The real answer, recorded when the
item was retargeted (2026-08-02):

> Moot — không có daemon tự kích hoạt compound-learn, fgos retrospective
> (D9, tsk-3wo) đã sweep TOÀN BỘ delivered->retrospective mỗi lần gọi,
> không có tham số N/T nào cả. Batch-trigger threshold không cần thiết
> khi trigger luôn là người/loop chủ động gọi.

`fgos retrospective` (the mechanical sweep verb) already moves *every*
`delivered` item to `retrospective` in one call — there was never a
threshold to design, because there is no daemon deciding when to fire it.
A person or a loop always triggers it explicitly. So the item was
retargeted to build the loop that actually drives synthesis on the
items the sweep surfaces: `/fgOS:retro-loop`.

## The synthesis step it was supposed to wrap didn't actually work

Planning for the retargeted item assumed `fgos-coding-compounding` (the skill
that classifies a Diataxis quadrant and writes the end-user document)
already worked, and only needed a stale trigger-description fixed — it
still said "runs while stage reads `compound-learn`", a stage retired
weeks earlier.

`fgos-coding-validating`'s reality gate caught something bigger: `fgos-
compounding`'s own producer step —
`fgos compound <id> --doc-type <quadrant> --doc-path <path>` — called a
CLI verb that no longer existed. `git log -S"case 'compound'" --
bin/fgos.mjs` traced it to a real, deliberate commit:

```
fcfbae5 feat(tsk-1zi): retire compound-learn stage and the compound verb
```

That commit's own message explained the intended replacement: "Rewrites
every test... to use `addOutcome` directly for docType/docPath capture."
But `addOutcome` (`src/state/store.mjs`) is a plain JS function, reachable
from test code via a direct import — no CLI verb ever exposed it to a
real session. So the one thing `fgos-coding-compounding` needs to do to finish
its job had no command a session could actually run. Confirmed live: 24
items sat at `delivered` and 5 at `retrospective` with nothing sweeping
or synthesizing them, because the tooling to do the second half was gone.

## Restoring the removed code, not inventing a replacement

Rather than design a new mechanism, the fix restores the removed verb —
`git show fcfbae5` recovered its exact original implementation. The old
version bundled two things: a stage move into the now-retired
`compound-learn`, and the Diataxis tag write. Only the tag write still
makes sense; the restored verb keeps the same name and flags
(`fgos compound <id> --doc-type <quadrant> --doc-path <path>`) but gates
on `item.status === 'retrospective'` instead of moving any stage, and
never moves the item itself — that's `retro-next`'s job (see below).

Keeping the same verb name mattered: `docs/specs/work-state.md` (RUL51-53),
several tutorials, and multiple how-to docs already documented this exact
command as canonical. Restoring it under the same name kept every one of
those references correct with zero further doc edits, instead of
orphaning them under an invented name.

## The shape: mirrors `cleanup-loop`, but with `discover-loop`'s stop rules

`src/state/retro-pool.mjs` (a FIFO picker over `status: 'retrospective'`)
and the `retro-next`/`retro-loop` skill pair mirror `cleanup-loop`'s file
shape closely. One deliberate difference: `cleanup-next`'s own per-item
step is a purely mechanical TTL/content/merge check, so `cleanup-loop`
never needed an iteration cap. `retro-next`'s own per-item step runs
`fgos-coding-compounding` — real LLM judgment, the same cost profile
`discover-loop`'s cap-of-15 exists to bound. `retro-loop` follows that
shape instead: pool-empty, lock-timeout, or a 15-iteration cap, whichever
comes first.

`retro-next` also self-sweeps: it calls `fgos retrospective` every
iteration before picking, rather than assuming someone already ran the
sweep separately. This is safe specifically because the sweep is cheap
and each item's `delivered -> retrospective` move is its own durably
committed event — an interruption mid-sweep leaves already-swept items
safely at `retrospective` and the rest untouched at `delivered`, nothing
to lose by calling it often.

## Proof it actually works

This document is itself the proof: `tsk-3o3` was the first real item
carried through the restored verb, via `/fgOS:retro-next`'s underlying
steps run directly against `tsk-3o3` itself — `fgos check tsk-3o3`
gathered its real capture (a `standard`-tier item, `awaiting-approval`
outcome, `passed: true`, settlement entries for its own clarify-pass and
the batch-trigger answer above), `fgos compound tsk-3o3 --doc-type
explanation --doc-path docs/explanation/fgos-retro-loop-and-the-restored-compound-verb.md`
tagged it, and this file is the document that call pointed at.
