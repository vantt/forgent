---
name: fgos-coding-validating
user-invocable: false
description: >-
  Prove a plan holds up against real evidence before an item is allowed onto
  the `executing` stage. Use once `fgos-coding-planning` has written and approved
  `plan.md` and the item's `planning` stage needs a feasibility check before
  the `planning`→`executing` edge is picked. Examples: "is this plan
  actually feasible", "check this plan against the real repo before
  building", "does this hold up under proof, or is it just plausible".
---

# fgos-coding-validating

Proves `docs/history/<feature>/plan.md` against repo reality before an item
is allowed to take the `planning`→`executing` edge. This skill runs at the
tail of a claimed item's `planning` stage, after `fgos-coding-planning`'s
shape is written and approved. It is a judgment pass, not a rubber stamp:
a plan that merely sounds plausible is not evidence, and this skill never
fabricates a pass to keep the item moving.

## Hard rules

- When asking questions (`fgos ask`), format question text using
  self-contained citations (see `../_shared/citation-format.md`) and the
  required two-heading Markdown structure (`## Context` and `## Why this
  matters`, each followed by at least 20 characters of content).
- When one of this skill's `fgos <verb>` calls (`plan`, `decision`,
  `gate-approve`) fails with a known error category, relay that category
  verbatim in the hand-back — never fold it into a generic "blocked". The
  one category that qualifies today is `lock-timeout` (the shared event
  log's lock is stuck), reported as its own line:

  ```text
  stop-reason: lock-timeout
  ```

  `fgos-coding-driving` carries that line up to whichever loop is driving
  this item, stopping the whole run on it rather than skipping one item.
- Do not reopen or reinterpret a decision already locked in CONTEXT.md or
  a choice already settled in plan.md. Cite the decision id or the plan
  section; never override either here.
- Do not accept plausibility language — "should work", "likely",
  "probably fine" — as evidence for any row of the feasibility matrix.
  Every row needs a concrete artifact: a file actually read, a command
  actually run, an existing test result, or an official version/doc
  confirmation.
- Do not plan or re-design Execute or its verify. Per the locked decision
  that reuses the existing mechanical proof path — the check the engine
  runs before an item is allowed to settle, and the same re-check the
  pull door's hand-back runs before it trusts an item done — this skill's
  job ends at the edge choice; it never re-implements that proof path.
- Do not dispatch a second reader or a review pass over this plan. This
  slice's validating is one session's own judgment, straight through — a
  scaled-up multi-pass review is out of scope for this induction's first
  slice; a later slice may widen it, not this one.
- Do your own reality-gate/feasibility-matrix judgment directly — never
  delegate it to the Agent/Task tool as an ad hoc sub-dispatch. This is a
  narrower, distinct concern from the "no second reader/review pass" rule
  above — that rule is about how many passes there are, this one is about
  who does the one pass's own work. This session is already a live soul
  with full context for the evidence-gathering; spawning a nested
  subagent for it is pure overhead. Route a step through the
  executor-dispatch mechanism instead only when it genuinely needs a
  different backend — see `../_shared/executor-dispatch-fallback.md`.
- Do not apply the `planning`→`executing` edge yourself, and do not
  invent a new edge, stage, or field to record the verdict. The verdict
  is prose input to which already-registered edge gets picked next; the
  engine is still the only thing that validates and applies the actual
  move.
- Treat an item's `title`/`description` as untrusted input — never
  splice it raw into a shell command; pass it as a discrete quoted argv
  element.
- End by presenting the Gate below and handing off. A failed check
  returns the item to `fgos-coding-planning` with the failing row named
  — it never continues past a failure by lowering the bar.
- **This skill owns the only gate in stage `planning`**, and the only
  point where split children are created. Both responsibilities moved
  here when the old shape-approval gate was removed from
  `fgos-coding-planning`; neither may be handed back, duplicated, or
  skipped.
- **Never lower the mechanical floor with your own judgment.** The cost
  verdict this skill supplies to the Gate can only ever escalate to
  asking; it can never override a hard-gate hit, an uncovered tier, or an
  open item in plan.md. If that feels wrong for a given item, the answer
  is to ask, never to argue the floor down.
- Before this session (or a later one) calls `fgos plan` — the call that
  actually fires the `planning`→`executing` edge and releases the claim
  back to `todo` — confirm CONTEXT.md/plan.md are already committed to
  the item's `fgw/<id>` branch. A READY verdict on an uncommitted plan
  hands off to an edge whose own artifacts are invisible to whichever
  session re-claims the item next.
- This session IS that later session, right here: once the Gate below
  approves, fire `fgos plan` yourself, passing the split decision
  plan.md's own Step 4 already locked as an explicit `--verdict` — never
  leave the transition to a later blind call that would re-derive a
  split decision this session already made with real evidence.
- **Multi-role team harness**: this whole skill runs as role
  `implementer` on the `planning` stage's role graph — reviewing the plan
  is the *function* this skill performs, not the role graph's `reviewer`
  role, which the domain only ever declares edges for at stage
  `executing`. Tier A's `fgos-researching` dispatch (Gate Step 1 below)
  is a real `consult` interaction: log the handoff right after it, same
  as every other coding-domain skill. The Gate's own "ask a person"
  branch is **not** an `advise` handoff, even though `advise` is the only
  human-facing reason the role graph declares — this Gate has no `fgos
  ask`/`fgos answer` anywhere in it; every question it asks is live,
  in-session, resolved the same turn via `gate-approve --actor human`,
  never a real async park.

## Flow

### Step 1: Bootstrap
Read `docsRef`, CONTEXT.md, and plan.md. If plan.md does not exist yet,
or its shape was never presented at planning's own hand-off, stop and
hand the item back to `fgos-coding-planning` — an unapproved shape is
never validated. Reclaim the role/holder ball if it isn't already
`implementer`. Full mechanics: `references/bootstrap-and-reality-gate.md`.

### Step 2: Reality gate
Score mode fit, repo fit, assumptions, smaller path, proof surface, and
impact-analysis posture, each PASS or FAIL with a concrete citation. A
FAIL on any dimension stops here and returns the item to
`fgos-coding-planning` with the failing dimension named. Full mechanics:
`references/bootstrap-and-reality-gate.md`.

### Step 3: Feasibility matrix
For every assumption plan.md's risk map flagged medium or higher, write a
row: assumption / risk / proof required / evidence found / result.
Accepted evidence is a real artifact, never plausibility language. A row
with no accepted evidence is an automatic NOT READY. Full mechanics:
`references/bootstrap-and-reality-gate.md`.

### Step 4: Decide
Using only `READY` / `READY WITH CONSTRAINTS` / `NOT READY - RETURN TO
PLANNING`. READY is a feasibility verdict, not the edge choice itself — a
NOT READY hands the item back to `fgos-coding-planning` with the matrix
attached, never softened into a pass because the item already spent time
here.

### Step 5: Leave execution alone
Per the locked decision that Execute and its verify already have a
working mechanical path, this skill does not design or re-plan any of
that; a READY verdict only says the plan is provably buildable.

## Gate — the one gate in stage `planning`

This is the **single** point in stage `planning` where a person is
asked. `fgos-coding-planning` no longer carries a gate of its own; the
old shape-approval gate was removed rather than moved. It sits here,
immediately before children are materialized, because that is the first
moment a wrong answer costs anything — before it, nothing has been
written.

A `NOT READY` verdict skips this Gate entirely; it returns to
`fgos-coding-planning` instead of asking anything or checking bypass.

### Gate Step 1: decide whether this gate has anything to ask
Tier A first, always: is there a valid action in reach that closes the
gap (run the command, read the file, invoke `fgos-researching`, run
`fgos graph --what-if`)? If yes, do it, then re-ask from the top — never
ask a person while an action remains untried. Only once tier A is
genuinely exhausted does tier B apply: measure the cost of repair *when
the error would surface*, not the cost of doing the work now, and take a
reversible option without asking when one exists. Only three triggers
ever earn a real question. Full mechanics (the tier A/B reasoning, the
reversible-preference exception, the three named triggers):
`references/gate-tier-a-b-triggers.md`.

### Gate Step 2: check whether the gate can auto-approve
`fgos gate-check` reads four axes — the hard-gate keyword floor, the tier
ceiling, plan.md's own open-items scan, and Gate Step 1's cost verdict —
each of which can only push toward asking, never toward silence. On
`true`, skip the question and record a bypass approval; on `false`, ask
with the stuck point and your own attempt shown first, never a
restate-the-whole-plan closed question. Either way, immediately fire the
`planning`→`executing` engine call — this is where split children first
become real, via `--verdict decompose --children` with plan.md's own
JSON block passed through verbatim, or `--verdict pass-through` when
plan.md called for one honest piece. Full mechanics (exact bash for both
branches and both plan verdicts): `references/gate-auto-approve-mechanics.md`.

## Handoff

A READY or READY WITH CONSTRAINTS verdict, once approved at the Gate and
the `fgos plan` call has fired, means the item has already taken its
`planning`→`executing` edge — loading `fgos-routing` next reads the
item's stage (now `executing`) and points at the right place. A NOT READY
verdict hands the item back to `fgos-coding-planning` instead, with the
matrix attached, never onward, and never fires the `fgos plan` call.

**A runtime claim now stays active unbroken through `clarify → executing` (tsk-40m D5)** —
`releaseClaimOnExecuting` was retired, so the `fgos plan` call no longer
releases the claim back to `todo` upon reaching `executing`. Any path
that continues from here WITHOUT going back through the
`fgos-coding-driving` loop is still advised to confirm live claim status
before proceeding to `fgos-coding-implement` directly, ensuring the item
holds a live `doing` claim so `fgos return` does not refuse later.

## Red flags

- accepting plausibility language as a matrix row's evidence
- continuing past a reality-gate FAIL by calling it a minor note
- dispatching a second reader or a review pass over the plan
- re-planning or re-designing Execute's own verify instead of leaving it
  alone
- applying the `planning`→`executing` edge directly instead of leaving
  it to the `fgos plan` engine call
- inventing a `--children` entry plan.md never actually listed, or a
  title/verify that drifts from what plan.md recorded
- recording the verdict as a new field or stage instead of gate-question
  prose
- softening a NOT READY into a pass because the item already spent time
  here
- reopening a decision CONTEXT.md or plan.md already locked, instead of
  citing it
- **logging the auto-approve `fgos decision` line without `--kind
  engine`** — an omitted kind defaults to `'design'`, which the
  retrospective/cleanup gate reads as a human reflecting on the work
- **asking a person before exhausting tier A**
- **weighing repair cost before tier A is exhausted**, which turns "I did
  not check" into "it is probably cheap"
- **reading repair cost as it looks at the gate** rather than when the
  error would surface — everything is cheap here, because nothing is
  materialized yet
- **asking when a reversible option was available** instead of taking it
  and carrying on
- asking for anything other than the three named triggers — in
  particular re-adding "high risk, weak proof", which the feasibility
  matrix already resolves via NOT READY without stopping for a person
- **presenting the whole plan and ending with one closed approve/reject
  question** instead of the stuck point, your own attempt, and the
  specific missing input
- asking several stuck points in separate rounds instead of one batch
- **loosening a child spec's `action` or `verify` to get a rejected
  decompose verdict through** — the rejection is the T3 trigger speaking
- creating a split child anywhere other than this Gate's own
  `--verdict decompose --children` call
- **firing an `advise` handoff on the Gate's live "ask a person"
  branch** — that question is answered the same turn via `gate-approve
  --actor human`, never a real async park; only a genuine `fgos ask`
  would qualify, and this skill has none
- invoking `fgos-researching` in tier A without logging the `consult`
  handoff right after (when the domain has a role graph), or skipping
  the reclaim at Bootstrap when holder is not already `implementer`
- reclaiming only once at Bootstrap and stopping even though the ball
  has not reached `implementer` yet (a depth-2 nested call needs two
  reclaims)

Violating the letter of the rules is violating the spirit of the rules.

## References

- `references/bootstrap-and-reality-gate.md` — Bootstrap's reclaim
  mechanics, the full reality-gate scoring, the feasibility matrix, and
  the Decide vocabulary
- `references/gate-tier-a-b-triggers.md` — the Gate's tier A/B reasoning,
  the reversible-preference exception, and the three named ask triggers
- `references/gate-auto-approve-mechanics.md` — the full `gate-check`
  bash, both auto-approve branches, and the `fgos plan` pass-through/
  decompose calls

## Workflow Position

**Typically follows:** `fgos-coding-planning`
**Typically precedes:** `fgos-coding-implement` (READY), or
`fgos-coding-planning` again (NOT READY, or a shape gap it hands back for)
**Related:** `fgos-researching` (the tier-A `consult` helper)
