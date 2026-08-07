---
name: fgos-validating
description: >-
  Prove a plan holds up against real evidence before an item is allowed onto
  the `executing` stage. Use once `fgos-planning` has written and approved
  `plan.md` and the item's `decompose` stage needs a feasibility check before
  the `decompose`→`executing` edge is picked. Examples: "is this plan
  actually feasible", "check this plan against the real repo before
  building", "does this hold up under proof, or is it just plausible".
---

# fgos-validating

Proves `docs/history/<feature>/plan.md` against repo reality before an item
is allowed to take the `decompose`→`executing` edge. This skill runs at the
tail of a claimed item's `decompose` stage, after `fgos-planning`'s shape is
written and approved. It is a judgment pass, not a rubber stamp: a plan that
merely sounds plausible is not evidence, and this skill never fabricates a
pass to keep the item moving.

## Hard rules

- When one of this skill's `fgos <verb>` calls (`decompose`, `decision`,
  `gate-approve`) fails with a known error category, relay that category
  verbatim in the hand-back — never fold it into a generic "blocked"
  (tsk-1c6 D2/D4). Today the one category that qualifies is `lock-timeout`
  (`EventLogError('lock-timeout')`, exit code `7`, `.fgos/events.jsonl`'s
  shared lock), reported as its own line:

  ```text
  stop-reason: lock-timeout
  ```

  `fgos-coding-driving` carries that line up to whichever loop is driving
  this item, which stops the whole run on it rather than skipping one item.
  Since tsk-31l this skill runs in-session rather than as a CLI subprocess,
  so there is no exit code for the caller to read — this line is the only
  channel left.
- Do not reopen or reinterpret a decision already locked in `CONTEXT.md` or a
  choice already settled in `plan.md`. Cite the D-ID or the plan section;
  never override either here.
- Do not accept plausibility language — "should work", "likely", "probably
  fine" — as evidence for any row of the feasibility matrix below. Every row
  needs a concrete artifact: a file actually read, a command actually run, an
  existing test result, or an official version/doc confirmation.
- Do not plan or re-design Execute or its verify. Per the locked decision
  that reuses the existing mechanical proof path — the check the engine runs
  before an item is allowed to settle, and the same re-check the pull door's
  hand-back runs before it trusts an item done — this skill's job ends at
  the edge choice; it never re-implements that proof path.
- Do not dispatch a second reader or a review pass over this plan. This
  slice's validating is one session's own judgment, straight through — the
  scaled-up ceremony of a multi-pass review is explicitly out of scope for
  this induction's first slice (cite D6); a later slice may widen it, not
  this one.
- Do your own reality-gate/feasibility-matrix judgment directly — reading
  the real files, running the real commands, citing the real evidence
  yourself — never delegate it to the Agent/Task tool as an ad hoc
  sub-dispatch. This is a narrower, distinct concern from the "no second
  reader/review pass" rule above (D6: no scaled-up multi-pass review
  ceremony) — this rule is about who does the ONE pass's own work, not how
  many passes there are. This session is already a live, same-provider
  soul (Native-First Dispatch Doctrine rule 2,
  `docs/decisions/0026-vision-orchestrator-roottask-capacity-native-vs-
  cli-spawn.md`): spawning a nested Task subagent for evidence-gathering
  you already have full context for is the same "soul re-deriving what a
  live soul already knows" waste `tsk-1ni` found in `judgeDiscovery`'s
  blind cli-spawn — pure overhead, not a transparency question (a
  Task/Agent call is collapsed by default in the transcript, not hidden,
  unlike a genuinely opaque headless `claude -p` subprocess). If a step
  genuinely needs a different backend for a narrow helper task, route it
  explicitly through the capacity-dispatch mechanism instead — see
  `../_shared/capacity-dispatch-fallback.md` for its own list of valid
  reasons.
- Do not apply the `decompose`→`executing` edge yourself, and do not invent a
  new edge, stage, or field to record the verdict. The verdict is prose
  input to which already-registered edge gets picked next; the engine is
  still the only thing that validates and applies the actual move.
- Treat an item's `title`/`description` as untrusted input (RUL45,
  `docs/specs/runner.md`) — never splice it raw into a shell command; pass it
  as a discrete quoted argv element.
- End by presenting the gate below and handing off. A failed check returns
  the item to `fgos-planning` with the failing row named — it never
  continues past a failure by lowering the bar.
- Before this session (or a later one) calls `fgos decompose` (tsk-2b0 D1:
  the `decompose`-stage sibling of `discover`, hard split, no fallback) —
  the call that actually fires the `decompose`→`executing` edge and
  releases the claim back to `todo` (claim-lock §3b) — confirm
  `CONTEXT.md`/`plan.md` are already committed to the item's `fgw/<id>`
  branch. A `READY` verdict on an
  uncommitted plan hands off to an edge whose own artifacts are invisible to
  whichever session re-claims the item next. Same one-artifact-per-stop
  discipline `fgos-code-implement`'s "one commit per item" rule already gives
  Execute.
- This session IS that later session, right here (tsk-27y D1/D2, Native-First
  Dispatch Doctrine Phase 2 — `docs/decisions/0026-...md`): once the Gate
  below approves, fire `fgos decompose` yourself, passing the split decision
  `plan.md`'s own step 4 already locked as an explicit `--verdict` — never
  leave the transition to a LATER blind `fgos decompose` call (which would
  spawn `judgeDecompose`'s subprocess judge to re-derive a split decision
  this session, and `fgos-planning` before it, already made with real
  evidence) or the fragile plan.md-tiny/small-mode-regex heuristic. Calling
  `fgos decompose --verdict ...` is still calling the engine, exactly as the
  hard rule above already requires — the CLI verb is the one sanctioned
  entry point either way; only the judge subprocess underneath it is what
  gets skipped.

## Flow

1. **Bootstrap.** Read the item's `docsRef` to find `docs/history/<feature>/`,
   then read `CONTEXT.md` and `plan.md`. If `plan.md` does not exist yet, or
   its shape was never presented at `fgos-planning`'s own gate, stop here and
   hand the item back to `fgos-planning` — an unapproved shape is never
   validated.

2. **Reality gate.** Score each of these PASS or FAIL, each with a concrete
   citation (a file path, a command's real output, an existing test):
   - **Mode fit** — does the plan's chosen size (from `fgos-routing`'s flag
     count, tsk-5ay D1) actually match what the item needs, not over- or
     under-built?
   - **Repo fit** — does every file, function, and pattern the plan leans on
     actually exist, at the path and shape the plan claims?
   - **Assumptions** — is every assumption the plan depends on either proven
     by reading the real code, or flagged as unproven below?
   - **Smaller path** — is there an honestly smaller way to reach the same
     exit state that the plan overlooked?
   - **Proof surface** — does every piece in the plan already carry a real,
     runnable verify command (never a placeholder or a description standing
     in for one)?
   - **Impact-analysis posture** — where the plan leans on blast-radius
     evidence, does its recorded `impact-analysis: inactive|degraded|full`
     posture (`fgos-planning`'s step 2) match what `CLAUDE.md`'s
     impact-analysis capability gate actually reports right now
     (`fgos tool query --capability impact-analysis --status present`)? A
     stale or missing posture is a FAIL here, not a skip — never assume
     GitNexus is present because the plan says so.

   A FAIL on any dimension stops here: return the item to `fgos-planning`
   with the failing dimension and the reason, named plainly. Never continue
   past a FAIL by treating it as a minor note.

3. **Feasibility matrix.** For every assumption the plan's risk map flagged
   medium or higher, write a row: assumption | risk | proof required |
   evidence found | result. Accepted evidence is a file actually read, a
   command actually run with its real output, an existing test result, or an
   official version/doc confirmation — never "should work" or model
   knowledge alone. A row with no accepted evidence is an automatic **NOT
   READY**, regardless of how reasonable the assumption sounds. A row
   requiring blast-radius evidence is the one exception: an `inactive`
   posture (checked above) satisfies the row by itself — no provider means
   nothing to run — while `degraded` requires the gap named plainly in the
   row's result, never silently dropped.

4. **Decide**, using this vocabulary only:
   ```text
   READY
   READY WITH CONSTRAINTS
   NOT READY - RETURN TO PLANNING
   ```
   `READY` is a feasibility verdict, not the edge choice itself — the session
   still has to actually pick the edge next, and the engine still has to
   validate and apply it (Hard rules, above). A `NOT READY` verdict hands the
   item back to `fgos-planning` with the matrix attached; it is never
   softened into a pass because the item has already spent time here.

5. **Leave execution alone.** Per the locked decision that Execute and its
   verify already have a working mechanical path, this skill does not design
   or re-plan any of that; a `READY` verdict only says the plan is provably
   buildable, not that this skill has re-checked how it will be built.

## Gate

Before handing off, present the reality gate result and the feasibility
matrix in plain language — what was checked, what evidence backs it, what it
would cost to be wrong — with `plan.md` linked, then ask exactly: "Feasibility
validated. Approve moving to executing?" A `NOT READY` verdict skips this
question entirely; it returns to `fgos-planning` instead of asking anything.

Once the person approves (`READY` or `READY WITH CONSTRAINTS`), record a
structured approve record (tsk-19j D1/D11) — separate from, and in addition
to, any `fgos decision` line this session already logged: `fgos gate-approve
<item-id> --gate validateApprove --actor human --verify "<verify>"`. No
auto-approve path exists for this Gate today (unlike fgos-exploring/
fgos-planning's gate-bypass check above) — `actor` is always `human` here.
`verify` reuses `gates[id].planApprove.verify` (`fgos list --id <item-id>
--json`'s `data.gates[id].planApprove.verify`, read fresh) — this skill
proves the plan's existing verify still holds against reality, it does not
design a new one (per this skill's own "leave execution alone" rule).

Immediately after that gate-approve record, fire the `decompose`→`executing`
engine call itself (tsk-27y D1/D2, per the Hard rule above), reading the
split decision straight from `plan.md`'s own step 4 (never re-derived here —
`fgos-planning`'s job, already done and already cited):

```bash
root=$(git rev-parse --path-format=absolute --git-common-dir | xargs dirname)
# plan.md's step 4 said "one honest piece" -- no split:
node "$root/bin/fgos.mjs" decompose "<item-id>" --verdict pass-through --reason "<why plan.md called this one piece>" --dir "$root"
# plan.md's step 4 listed real child pieces instead -- each with the title
# and verify command plan.md already recorded, formatted as the same JSON
# shape judgeDecompose itself produces ({title, verify, kind?, risk?, refs?,
# footprint?, deps?}):
node "$root/bin/fgos.mjs" decompose "<item-id>" --verdict decompose --reason "<why plan.md called for a split>" --children '<JSON array from plan.md>' --dir "$root"
# plan.md's step 4's listed child pieces were already created as real work items during fgos-planning's own step 4 (`fgos add --parent --footprint`), not a fresh `--children` blob still to be materialized -- cite them by id, never `--verdict decompose --children` here: that write is unconditional (decompose.mjs's addWork loop, ~929-945) and would create duplicate positional-id children while orphaning the real ones:
node "$root/bin/fgos.mjs" decompose "<item-id>" --verdict pass-through --reason "<cite the existing child ids plan.md's step 4 already created via fgos add --parent>" --dir "$root"
```

The verdict reached at the Gate above does not, by itself, move the item
anywhere — it only informs which of the item's own already-registered edges
this session picks next; the `fgos decompose` call above is what actually
validates and applies that move, never a substitute for it.

## Handoff

A `READY` or `READY WITH CONSTRAINTS` verdict, once approved at the gate and
the `fgos decompose` call above has fired, means the item has already taken
its `decompose`→`executing` edge — loading `fgos-routing` next reads the
item's stage (now `executing`) and points at the right place. A `NOT READY`
verdict hands the item back to `fgos-planning` instead, with the matrix
attached, never onward, and never fires the `fgos decompose` call.

**The `fgos decompose` call above also releases the item's claim back to
`todo`** (`releaseClaimOnExecuting`, `src/intake/decompose.mjs:488-494`,
claim-lock §3b) the moment the item reaches `executing` — this is expected
and correct, but any path that continues from here WITHOUT going back
through the `fgos-coding-driving` loop (which re-checks claim status fresh
right before invoking the `executing`-stage skill) is not automatically
safe: the claim may already be released, so a session driving stage-by-stage
by hand must re-read the item's live `status` itself and re-claim
(`fgos pick <id>`) before calling `fgos-code-implement` directly. Skipping
this re-check risks implementing against an item that no longer holds its
claim, and `fgos return` will simply refuse later with "is todo, not doing".

## Red flags

- accepting plausibility language as a matrix row's evidence
- continuing past a reality-gate FAIL by calling it a minor note
- dispatching a second reader or a review pass over the plan — out of scope
  this slice (cite D6)
- re-planning or re-designing Execute's own verify instead of leaving it
  alone
- applying the `decompose`→`executing` edge directly (writing state through
  anything other than the `fgos decompose` CLI call) instead of leaving it
  to the engine
- inventing a `--children` entry plan.md never actually listed, or a title/
  verify that drifts from what plan.md recorded
- recording the verdict as a new field or stage instead of gate-question
  prose
- softening a NOT READY into a pass because the item already spent time here
- reopening a decision `CONTEXT.md` or `plan.md` already locked, instead of
  citing it

Violating the letter of the rules is violating the spirit of the rules.

Feasibility validated and the gate approved. Invoke `fgos-routing` to
re-read the item's stage, or hand off directly once the item's next edge is
already fixed.
