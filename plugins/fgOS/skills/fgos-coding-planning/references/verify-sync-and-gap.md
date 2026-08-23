# Verify sync and the mid-planning gap — full mechanics

The full detail behind SKILL.md's Step 5 (Leave execution alone) and
Step 6 (Mid-planning CONTEXT.md gap).

## Leave execution alone

Per the locked decision that Execute and its verify already have a
working mechanical path (the goal-check the engine runs, and `return`'s
own re-verify of real progress), this skill does not design or re-plan
any of that — it only needs to name, for each piece it describes, the one
command that proves it done.

If a piece touches a skill-prose path (`.claude/skills/**/SKILL.md`,
`.agents/skills/**/SKILL.md`, `plugins/fgOS/skills/**/SKILL.md`), read
`docs/how-to/write-verify-for-a-skill-prose-change.md` before naming its
verify command — it documents the correct `npm test && POSITIVE &&
NEGATIVE` shape and the standing rebuttal for when the second-pass judge
demands proof of prose comprehension, a demand the doc says verify must
never be asked to satisfy.

## Sync a pass-through item's own `verify` field

For a *pass-through* (non-split — Step 4's "one piece is honestly
enough" branch) item only: once the one command above is named, check
the item's own current `verify` (`fgos list --id <item-id> --json`'s
`data.work[id].verify`) against the discovery-stage placeholder
constants. If it still reads one of those placeholders, sync that
command onto the item's own current `verify` field before handing off to
`fgos-coding-validating`:

```bash
fgos edit "<item-id>" --verify "<the designed proof-surface command>"
```

If the item already carries a real, distinct verify, do nothing — never
overwrite a value already set deliberately. Split children need no such
step: the normalizer already forces a real verify onto each one at
creation time. Without this sync, nothing in the standard flow ever
promotes this step's own designed command into `work.verify` —
`fgos-coding-validating`'s own gate-approve call only re-records whatever
`work.verify` already says, and the plan-approve fallback falls straight
through to that same still-placeholder value, which later gets executed
literally as a shell command by `fgos return`.

Whenever the verify command you are about to write with `fgos add
--verify`/`fgos edit --verify` (including the sync step immediately
above) contains a backslash-escaped backtick (or any other character an
outer shell layer could silently strip), read `docs/how-to/preserve-
shell-escapes-when-transcribing-a-verify-command.md` first — a lost
escape is usually still syntactically valid shell, so it fails much
later, at `return` time, with a confusing result instead of a clean
error.

## Sync a split root item's own `verify` field

For the **root** item of a real split (Step 4's "several independently
workable pieces" branch) only: once the split is decided, check the root
item's own current `verify` (`fgos list --id <item-id> --json`'s
`data.work[id].verify`) against the discovery-stage placeholder
constants, the same way the pass-through check above does. If it still
reads one of those placeholders, sync a whole-suite regression command
onto the item's own current `verify` field before handing off to
`fgos-coding-validating`:

```bash
fgos edit "<item-id>" --verify "npm test"
```

A root item has no single piece-specific proof surface of its own — its
correctness is "does everything merged still pass" — so a whole-suite
command is the honest choice here, unlike a pass-through item's own
narrower, piece-specific command above. If the item already carries a
real, distinct verify, do nothing — never overwrite a value already set
deliberately. Without this sync, a decompose root's `verify` stays
whatever placeholder `discovery` left behind, and `fgos sync-root`'s own
goal-check later executes that placeholder literally as a shell command
(the tsk-1vc incident this item's own description cites).

### Cases this needs to hold for

- A split root whose `verify` is still the discovery-stage placeholder
  (the reported failure mode, tsk-1vc) — gets synced to `npm test`.
- A split root whose `verify` is already real (e.g. `tsk-3ik`'s own
  informal `node --test 'test/**/*.test.mjs'`) — untouched, no redundant
  edit.
- A pass-through (non-split) item — untouched by this change; already
  covered by the existing pass-through section above it, which tsk-14a
  already fixed.
- A split **child** — untouched; already covered by the normalizer forcing
  a real verify at creation time (unchanged, not this item's gap).

## Mid-planning CONTEXT.md gap

If, at any step, CONTEXT.md's locked decisions turn out to be silent on
something this plan actually needs, apply the same material/grounded/
answerable filter `fgos-coding-exploring` already uses to its own
candidate questions:

- **Not material** — the answer would not change scope, behavior, data
  shape, or acceptance criteria; a genuine implementation-only detail
  CONTEXT.md correctly left unaddressed. Pin it as a labeled assumption
  in `plan.md`'s own Assumptions instead of asking anyone —
  `fgos-coding-validating`'s reality gate already checks every assumption
  the plan depends on is either proven or flagged as unproven, so this
  needs no new container.
- **Material** — the answer would change scope, behavior, data shape, or
  acceptance criteria. **Record the gap first, then hand back** — before
  this rule the hand-back wrote nothing at all, so a session that died
  mid-hand-back lost the gap entirely: the next session to claim the item
  read a CONTEXT.md that is silent by definition and had no trace that
  anyone had ever noticed:

  ```bash
  fgos decision --id "<item-id>" \
    --text "planning->exploring hand-back: <the gap, in one line>" \
    --rationale "material per fgos-coding-planning step 6; tier-A actions already tried: <what was run/read and why it did not close the gap>" \
    --relation none
  ```

  Name what tier A already tried and why it failed to close the gap —
  that is what stops the re-entry from re-running a scan this session
  already ran, and what a later session reads to pick up cold.

  Then hand back to `fgos-coding-exploring` directly, in this same
  session: invoke its flow (Socratic lock, the same three-test filter,
  appending a new decision id to CONTEXT.md) while `item.stage` stays
  `planning` the entire time — there is no `planning -> exploring` edge
  in the state machine, so never attempt to move the item's stage back.
  This is the same no-stage-move shape `fgos-coding-validating` already
  uses when it hands an item back to this skill directly (both stay in
  `planning`). Never reopen or reinterpret a decision CONTEXT.md already
  locked — this path exists only for a gap it never addressed, not a
  second chance to override one it did.
