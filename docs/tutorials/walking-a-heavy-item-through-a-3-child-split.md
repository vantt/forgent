---
type: tutorial
title: Walking a heavy fgOS item through exploring, a 3-child split, and done
tags: []
timestamp: 2026-07-29T03:44:15.000Z
source_capture_ids: [tsk-3wr]
---
# Walking a heavy fgOS item through exploring, a 3-child split, and done

A start-to-finish walkthrough of one real `heavy`-tier item (`tsk-3wr`,
"Test suite của fgOS ... vừa CHẬM/LÃNG PHÍ VỪA ILLEGIBLE") through the
whole fgOS lifecycle, using the real commands and real outcomes from that
run. Follow this if you've never taken a heavy item all the way from
`exploring` to `done` yourself.

## 1. Claim and orient

```
fgos pick tsk-3wr
```

`pick` claims the item AND stands up an isolated worktree/branch
(`fgw/tsk-3wr`) — the right choice for `exploring`/`planning` work, since
those stages write real decision docs you want isolated from the shared
main checkout. (`take`, used later for the split children, deliberately
skips that isolation — see step 5.)

## 2. Explore: lock decisions before shaping anything

At stage `exploring`, scout the real codebase for evidence, then lock
product decisions Socratically — never invent an answer, never skip
asking when the answer changes real scope. This item locked two:

- **D1 (verify method):** `node --experimental-test-coverage` diff
  before/after, plus a full green run — chosen because a number beats a
  reviewer's say-so.
- **D2 (dedup scope):** open-ended, duplication-driven, no floor/ceiling
  — chosen to avoid cutting tests just to hit an arbitrary target.

Write these into `docs/history/<feature>/CONTEXT.md`, run
`fgos decision <id> --text "<D-ID>: <summary>"` for each so they're also
machine-visible, then fire the real stage transition:

```
fgos discover tsk-3wr
```

This is the step that actually moves `exploring -> planning` — writing
`CONTEXT.md` alone never does; only the engine's own verb applies a
stage move.

## 3. Plan: shape the work, then let the engine's own judgment check it

At `planning`, `fgos-coding-planning` writes `plan.md`: the mode (this item
was `standard`, since 67% of the suite needed judgment-level review despite
a low mechanical flag count), the approach, and — crucially — checks
`fgos graph --json` before deciding on ordering or splitting. That graph
check surfaced real leverage: `tsk-3wr` was the top `topUnblock` item,
already blocking three other backlog items.

Calling `fgos plan tsk-3wr` here doesn't just rubber-stamp the plan — it
runs the engine's own split-work judgment, which can disagree. Here it
did: it proposed a 3-child split (rename / dedup / measure) where the
human-approved plan had assumed one batched item. That's a real
disagreement between session judgment and engine judgment, and per fgOS's
own precedence rule, the engine's verb decides the actual stage
transition — a person still gets to weigh in on *which* edge to take, but
never applies the move directly.

The real answer that resolved it, quoted verbatim from this item's own
settlement record:

> "Accept the 3-child split proposed by judgeDecompose: (1) rename test
> descriptions removing decision codes, (2) dedup real duplicate-invariant
> tests depending on (1), (3) remeasure + write evidence report depending
> on (1) and (2). Confirmed over the originally-planned single-item batch
> approach since parent-completion timing for dependents is unaffected
> either way, and per-phase risk isolation (medium/heavy/light) is a real
> gain."
> — real `work.settle` capture (kind `answer`, role `human`), id `tsk-3wr`

```
fgos answer tsk-3wr --text "..."
fgos plan tsk-3wr
```

The second call — `fgos plan` — is what actually writes the three children
(`tsk-3wr-1`, `tsk-3wr-2`, `tsk-3wr-3`, each with `parent: tsk-3wr` and
its own real, runnable `verify`) and releases the parent's claim back to
`todo`.

## 4. Validate: prove the plan against reality before executing

Before any child is worked, `fgos-coding-validating` scores a reality-gate
matrix — every claim needs a real command's real output as evidence, not
plausibility language. It is not a stage of its own: it runs as
`fgos-coding-planning`'s own second phase, still inside stage `planning`.
For this item that meant actually running the new
coverage-diff harness (`node --experimental-test-coverage`) once, for
real, to prove it produces a stable baseline number before trusting it as
D1's gate. `READY` here is a feasibility verdict, not permission to skip
the engine's own edge application — the session still has to pick the
edge, and the engine still validates it.

## 5. Execute each child: `take`, not `pick`

```
fgos take --role session --id tsk-3wr-1
```

Split children default to `take` (`source: "main"`), not `pick` — no
dedicated worktree, working directly in the shared main checkout. This
is a deliberate design choice (protected by the main-checkout-lock
mechanism against two writers racing `.git/index`), not an oversight —
but it does mean you'll periodically hit
`main checkout locked by pid <id>` from another live session. See
`docs/how-to/diagnose-a-blocked-return-from-an-unrelated-verify-failure.md`
for how to tell a stale lock from a live one, and don't force through it
either way — wait it out or retry.

For each child: implement the real change, run its own `verify` exactly
as recorded (never a substitute), then:

```
fgos return tsk-3wr-1
```

`return` re-verifies for real — a `blocked` outcome here is not
necessarily your bug. This item hit exactly that: `tsk-3wr-1`'s first
`return` came back `blocked` on a test file (`test/state/events.test.mjs`)
it never touched, later confirmed as a load-induced flake (already
tracked as `tsk-3ld` in the backlog) by re-running that file in isolation
three times clean. The fix was `fgos move <id> --to doing` (the recovery
path from `blocked`, since `take` only accepts `todo`) and `return` again
— no code change, because none was needed.

## 6. Merge, then synthesize at `retrospective`, before `done`

A coding-domain item cannot reach `done` straight from `delivered`. The
status chain is sequential and proven by a real FSM guard, not a
convention: `awaiting-approval -> delivered -> retrospective -> cleanup ->
done`. Synthesis is no longer a stage of its own — it happens while the
item sits at status `retrospective`, which is *after* the merge, not
before it.

So the merge goes first:

```
fgos approve <id>
```

For a `take`n (main-source) item, `approve` runs in `mode: "verify-only"`
— it re-verifies on `main` and moves the item to `delivered`, since the
work was already committed directly there; no branch merge step is needed
the way a `pick`ked item's would be.

Then the item is swept to `retrospective`, and the synthesis happens
there:

```
fgos retrospective                            # sweeps every delivered item to retrospective
fgos compound <id> --doc-type <quadrant> --doc-path docs/<quadrant>/<file>.md
fgos doc-sources docs/<quadrant>/<file>.md    # gather every linked capture first
# write/grow the doc from that real capture, quoted, never invented
fgos check <id>                               # confirm docType + doc both land
```

Finally, `cleanup` reclaims the branch/worktree and closes the item:

```
fgos cleanup <id>
```

## 7. Watch for your own doc changing what your own tests assume

`tsk-3wr-3`'s synthesis step wrote the very first real file into
`docs/reference/` — and that broke a pre-existing test
(`test/report/enduser-index.test.mjs`) that asserted `docs/reference`
would always be empty. This is not a hypothetical: it happened, live, in
this exact run. The fix was small and squarely in scope (update the
stale assumption, the same way a prior change had already done for the
`explanation` quadrant) — a real example of fgos-coding-implement's own rule:
when reality disagrees with what an item's tests assumed, fix it and say
so, don't redesign around it.

## 8. The parent closes itself once every child is resolved

Once all three children are resolved, the frontier's lineage filter
re-admits the parent (`tsk-3wr` was root-blocked by its own open children
until then — a root is included once every child has reached the resolved
tail of the status chain, `delivered` onward, checked independently of the
root's own `deps`). Claim it, run its own (corrected) `verify` as a final
capstone check, `return`, `approve`, synthesize this very tutorial at
`retrospective`, and `cleanup` — the same steps as any other item, just
run last.

## Related

- `docs/history/test-suite-legibility/CONTEXT.md` /`plan.md` — the real
  decisions and shape this walkthrough followed.
- `docs/explanation/judging-real-test-duplication.md` — the dedup
  discriminator from step 5's `tsk-3wr-2`.
- `docs/reference/test-suite-legibility-cleanup-numbers.md` — the real
  before/after numbers from step 5's `tsk-3wr-3`.
- `docs/how-to/diagnose-a-blocked-return-from-an-unrelated-verify-failure.md`
  — the recovery path used in step 5.
