# Split and child specs — full mechanics

The full detail behind SKILL.md's Step 4.

Some items are one honest piece of work; others need to become several
independently workable ones first. When more than one candidate piece
could go first, run `fgos graph --what-if <id> --json` per candidate and
compare the resulting `topUnblock`/`criticalPath` fields to see which
pick actually unblocks the most follow-on work, instead of guessing from
judgment alone. If the shape calls for a split, **write each piece's spec
into `plan.md` and create nothing** — no work item exists until
`fgos-coding-validating` materializes them at the single gate. This step
used to call `fgos add --parent` here; it no longer does, and adding one
back would break the whole redesign — see "Why nothing is created here"
below.

## The child-spec shape

Write the specs as a fenced JSON array in `plan.md`, in exactly the shape
the engine's own child normalizer already validates, so the block can be
handed to the verdict verbatim with no re-derivation:

```json
[
  {
    "title": "Build parser",
    "verify": "npm test -- parser",
    "action": "parse the config file before the runner reads it, per the locked decision naming this parsing order",
    "footprint": ["src/parser.mjs", "test/parser.test.mjs"],
    "kind": "task",
    "risk": "light"
  }
]
```

Every field above is load-bearing:

- **`verify`** — a real, runnable command. Never a placeholder, never a
  description standing in for a command; the normalizer rejects the whole
  verdict over one missing verify.
- **`action`** — **mandatory**, and it must cite at least one real
  per-item decision id from this feature's own CONTEXT.md "## Locked
  decisions" table. A citation to an id that does not exist is rejected
  exactly like no citation at all.
- **`footprint`** — taken straight from the file list Approach/Shape
  already wrote down for that piece. The files are already known here, so
  there is no reason to leave it blank: this is what lets the engine's
  own overlap check catch a real collision between sibling pieces before
  either one starts, and it is also part of the merged gate's own
  hard-gate floor.

**If a piece cannot be written with a valid `action` citing a real
decision id, or with a real runnable verify, stop — do not invent one to
satisfy the shape.** Being unable to write the spec IS the signal that
this piece is not understood well enough to exist yet. Either it is a
CONTEXT.md gap (Step 6), or it is a question for the gate.

## Why nothing is created here

Creating children at this step made them real *before* anyone had
confirmed the cut was right, so a wrong split had to be cleaned up as
`wontfix`. It also forced `fgos-coding-validating` onto a "cite the
existing ids" branch and away from the native decompose-with-children
path, whose children are born already at stage `executing` carrying
their `action` prose and therefore need no gate of their own. Deferring
materialization until after the single gate makes a wrong cut cost
nothing — nothing was written — and lets the native path do its job.

If one piece is honestly enough, there is no split, and the item proceeds
as itself. Say so plainly in `plan.md`; `fgos-coding-validating` reads
that as its pass-through verdict.
