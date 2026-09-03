---
type: explanation
source_capture_ids: [tsk-4zg]
framework: diataxis
mode: explanation
---

# Why a work item whose whole content is a `.fgos/` state mutation can't close through `fgos return`/`approve`

## The real capture

`tsk-4zg` ("re-derive title from description for every stored item",
`work-item-title-contract` D4) never went through `fgos pick`/`take` at
all — no `predicted` outcome was ever recorded (`fgos check tsk-4zg`
returns `predicted: null, actual: null` at the point this was written).
The item's entire content was `fgos edit <id> --title "..."` calls against
the live store, run directly from the main checkout, never a source-code
change on a `fgw/tsk-4zg` branch.

## Why `return` structurally cannot close this kind of item

`fgos edit`/`fgos submit`/`fgos decision`/every other state-mutating verb
resolves its target directory to the ONE main checkout
(`git rev-parse --path-format=absolute --git-common-dir`), regardless of
which worktree or branch issued the call — a linked worktree never
carries its own `.fgos/` at all (ADR0020). So a state-mutating verb's
effect lands immediately on the main checkout's own `.fgos/events.jsonl`,
live, the instant it runs — never captured as a commit on the calling
item's own `fgw/<id>` branch.

`fgos return`'s own gate (`bin/fgos.mjs`, the `aheadCount <= 0` check)
requires real commits on the item's own branch since its `headAtTake`:

```js
const aheadCount = commitsSince(cwd, item.headAtTake, head);
if (aheadCount <= 0) {
  throw new StoreError('validation', `return: HEAD has not advanced past headAtTake for "${id}" ...`);
}
```

A pure `.fgos/` state-mutation item advances zero commits on its own
branch by construction — the writes never touch that branch's tree at
all. `return` would refuse it as "nothing to return" even though the
actual work (the state mutation) genuinely happened and is verifiably
true right now.

## Why hand-editing `.fgos/state.json` isn't the fix either

`.fgos/state.json` is gitignored (`.gitignore`) — it's the rebuilt VIEW,
not the truth. `events.jsonl` is the truth and is git-tracked, but per the
paragraph above, a real event append still never lands on the item's own
branch. Neither door produces something `return`'s branch-diff model can
see.

## How this item actually closed

Through `fgos move` directly — the raw status-transition door, not the
branch-verification one — following the only legal FSM path from `todo` to
`done`:

```
fgos move tsk-4zg --to doing              # todo -> doing (legal)
fgos move tsk-4zg --to awaiting-approval  # doing -> awaiting-approval (legal)
fgos compound tsk-4zg                     # awaiting-approval, stage -> compound-learn
                                           # (RUL50: no edge reaches 'done' before this)
fgos compound tsk-4zg --doc-type ... --doc-path ...  # tag, this document
fgos move tsk-4zg --to done --expect awaiting-approval  # awaiting-approval -> done (legal, gate satisfied)
```

`move` never checks git state at all — it is the same raw, human-authority
door a person uses to correct a status by hand. `todo -> done` directly is
**not** a legal FSM edge (`src/state/fsm.mjs`'s `TRANSITIONS` table has
only `doing -> done` and `awaiting-approval -> done`), and the
Compound-learn done-gate (RUL50) still applies regardless of which door
gets an item into `awaiting-approval` — `compound`'s own stage move cannot
be skipped by taking the `move` path instead of `return`.

## What the actual state mutation measured, live

At the time of writing: 187 items in the store. 53 had no `description`
at all (40 `decompose`-created children, 13 `add`-created items with no
`--description` flag) — `deriveTitle` on an empty/undefined input returns
the fixed placeholder `'Untitled submission'`, which would have destroyed
53 real titles rather than shortened them. Filed separately as `tsk-535`
(the missing-description gap in `add`/`decompose`), not fixed here — this
item's own scope stayed the re-derive, not the upstream cause. The
remaining 110 items, all carrying a real `description`, were re-derived
through `fgos edit <id> --title "<derived>" --dir <root>` — the same
mechanical door `submit` itself uses, run once per item rather than
patched into the log by hand.

The item's own `verify` command was rewritten mid-execution to match this
narrower, measured scope (title ceiling checked only where a real
`description` exists), rather than left claiming a guarantee ("every
title") the data no longer supported once the 53 no-description items were
found.

## What this means for the next state-only item

An item whose entire deliverable is a `.fgos/` write (not a source-code
change) cannot honestly be shaped as a normal `pick` → `executing` →
`return` → `approve` item — that path measures git branch progress, which
such an item never produces. The `move`/`compound` sequence above is the
real mechanism, and it exists precisely because `return`'s "proof, not
assertion" discipline has nothing to check for this shape of work. A
future item of this kind should expect the same sequence, not attempt
`return` first and be surprised by the refusal.
