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
tail of a claimed item's `planning` stage, after `fgos-coding-planning`'s shape is
written and approved. It is a judgment pass, not a rubber stamp: a plan that
merely sounds plausible is not evidence, and this skill never fabricates a
pass to keep the item moving.

## Hard rules

- When one of this skill's `fgos <verb>` calls (`plan`, `decision`,
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
  explicitly through the executor-dispatch mechanism instead — see
  `../_shared/executor-dispatch-fallback.md` for its own list of valid
  reasons.
- Do not apply the `planning`→`executing` edge yourself, and do not invent a
  new edge, stage, or field to record the verdict. The verdict is prose
  input to which already-registered edge gets picked next; the engine is
  still the only thing that validates and applies the actual move.
- Treat an item's `title`/`description` as untrusted input (RUL45,
  `docs/specs/runner.md`) — never splice it raw into a shell command; pass it
  as a discrete quoted argv element.
- End by presenting the gate below and handing off. A failed check returns
  the item to `fgos-coding-planning` with the failing row named — it never
  continues past a failure by lowering the bar.
- **This skill owns the only gate in stage `planning`**
  (`docs/history/coding-planning-validating-gate-redesign/CONTEXT.md` D1),
  and the only point where split children are created (D7). Both
  responsibilities moved here when `planApprove` was removed from
  `fgos-coding-planning`; neither may be handed back, duplicated, or
  skipped.
- **Never lower the mechanical floor with your own judgment.** The cost
  verdict this skill supplies to the gate can only ever escalate to
  asking; it can never override a hard-gate hit, an uncovered tier, or an
  open item in `plan.md` (D9). If that feels wrong for a given item, the
  answer is to ask, never to argue the floor down.
- Before this session (or a later one) calls `fgos plan` (tsk-2b0 D1:
  the `planning`-stage sibling of `discover`, hard split, no fallback) —
  the call that actually fires the `planning`→`executing` edge and
  releases the claim back to `todo` (claim-lock §3b) — confirm
  `CONTEXT.md`/`plan.md` are already committed to the item's `fgw/<id>`
  branch. A `READY` verdict on an
  uncommitted plan hands off to an edge whose own artifacts are invisible to
  whichever session re-claims the item next. Same one-artifact-per-stop
  discipline `fgos-coding-implement`'s "one commit per item" rule already gives
  Execute.
- This session IS that later session, right here (tsk-27y D1/D2, Native-First
  Dispatch Doctrine Phase 2 — `docs/decisions/0026-...md`): once the Gate
  below approves, fire `fgos plan` yourself, passing the split decision
  `plan.md`'s own step 4 already locked as an explicit `--verdict` — never
  leave the transition to a LATER blind `fgos plan` call (which would
  spawn the retired subprocess judge to re-derive a split decision
  this session, and `fgos-coding-planning` before it, already made with real
  evidence) or the fragile plan.md-tiny/small-mode-regex heuristic. Calling
  `fgos plan --verdict ...` is still calling the engine, exactly as the
  hard rule above already requires — the CLI verb is the one sanctioned
  entry point either way; only the judge subprocess underneath it is what
  gets skipped.
- **Multi-role team harness** (tsk-2t9c D14/D15): this whole skill runs as
  role `implementer` on the `planning` stage's `roleGraph` — the task-spec's
  own header (`position: reviewer`) names the *function* this task performs
  (reviewing the plan), not the roleGraph's `reviewer` role, which the
  domain only ever declares edges for at stage `executing`. Tier A's
  `fgos-researching` dispatch (Step 1 below) is a real `consult`
  interaction: log `handoff --reason consult` right after it, same as
  every other coding-domain skill. The Gate's own "ask a person" branch
  (Step 2, `false` case) is **not** an `advise` handoff, even though
  `advise` is the only human-facing reason the roleGraph declares — this
  Gate has no `fgos ask`/`fgos answer` anywhere in it; every question it
  asks is live, in-session, resolved the same turn via `gate-approve
  --actor human`, never a real async park. Firing `handoff --reason
  advise` on a live question that never parks would misrecord `holder`
  for a hand-off that never actually happened (found correcting
  `docs/task-specs/coding/validate-plan.md`'s Collaboration table, which
  had wrongly marked this as `advise (async)`).

## Flow

1. **Bootstrap.** Read the item's `docsRef` to find `docs/history/<feature>/`,
   then read `CONTEXT.md` and `plan.md`. If `plan.md` does not exist yet, or
   its shape was never presented at `fgos-coding-planning`'s own gate, stop here and
   hand the item back to `fgos-coding-planning` — an unapproved shape is never
   validated.

   If the domain declares a `roleGraph` and the item's current
   `data.work[id].holder` (`fgos list --id <id> --json`) is not already
   `implementer`, reclaim it before anything else:

   ```bash
   root=$(git rev-parse --path-format=absolute --git-common-dir | xargs dirname)
   ```

   ```bash
   node "$root/bin/fgos.mjs" handoff-return "<item-id>" --note "reclaiming at Bootstrap -- holder was <role>" --dir "$root"
   ```

   **Repeat, re-reading `holder` fresh each time, until it reads
   `implementer`** (tsk-2t9c D16 — a nested call can sit two deep). Stop
   when a call refuses with "no open call" — the ordinary end state.

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
     posture (`fgos-coding-planning`'s step 2) match what `CLAUDE.md`'s
     impact-analysis capability gate actually reports right now
     (`fgos tool query --capability impact-analysis --status present`)? A
     stale or missing posture is a FAIL here, not a skip — never assume
     GitNexus is present because the plan says so.

   A FAIL on any dimension stops here: return the item to `fgos-coding-planning`
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
   item back to `fgos-coding-planning` with the matrix attached; it is never
   softened into a pass because the item has already spent time here.

5. **Leave execution alone.** Per the locked decision that Execute and its
   verify already have a working mechanical path, this skill does not design
   or re-plan any of that; a `READY` verdict only says the plan is provably
   buildable, not that this skill has re-checked how it will be built.

## Gate — the one gate in stage `planning`

This is the **single** point in stage `planning` where a person is asked
(`docs/history/coding-planning-validating-gate-redesign/CONTEXT.md` D1).
`fgos-coding-planning` no longer carries a gate of its own; the old
`planApprove` was removed rather than moved. It sits here, immediately
before children are materialized, because that is the first moment a wrong
answer costs anything — before it, nothing has been written.

A `NOT READY` verdict skips this Gate entirely; it returns to
`fgos-coding-planning` instead of asking anything or checking bypass.

### Step 1 — decide whether this gate has anything to ask

Before checking bypass, decide honestly whether a person is needed at all,
using the two-tier criterion (D3), in this order — **tier A first, always**:

**Tier A — is there a valid action in reach that closes the gap?** Run the
command, read the file, invoke `fgos-researching`, run `fgos graph
--what-if`. If yes: **do it, then re-ask this question from the top.** Do
not ask a person. When the action taken was invoking `fgos-researching`
and the domain declares a `roleGraph`, log the dispatch right after it
returns — whether it found something or came up empty (tsk-2t9c D16, same
"returns" moment `fgos-coding-discovering`/`fgos-coding-exploring` log at):

```bash
node "$root/bin/fgos.mjs" handoff "<item-id>" --to researcher --reason consult --outcome "<the finding, one line>" --dir "$root"
```

You leave tier A only when the action does not exist,
was tried and failed, **or is forbidden by a rule** (the locked-decision
case: this skill may not reopen `CONTEXT.md`, so it structurally cannot
resolve that one alone).

Tier A runs first for a reason that is not stylistic: tier B weighs the
cost of *guessing*, and until tier A is exhausted, guessing is a false
option — the answer was available. Weighing cost before exhausting action
is how a session rationalizes not running the check it should have run.

**Tier B — for whatever survives tier A: if this turns out wrong, what does
the repair cost?** (D4) Measure the cost of **repair when the error
surfaces** — mid- or post-execute — not the cost of doing the work, and not
the cost as it looks right now at this gate (right now everything is cheap,
because nothing is materialized yet; reading it here would make every
answer "reversible" and the gate would never ask). Repair cost includes
damage already done in the window before anyone noticed, not just the diff
that fixes it. It is a property of the **decision**, not of each option.

- **Reversible** → pin it as a labeled assumption in `plan.md` and carry on.
- **Expensive** → it is a candidate question.

**D5, the exception worth reaching for:** when the surviving options differ
in how reversible they are, **take the reversible one and carry on — do not
ask.** Only ask when every live option is hard to undo, or when the
reversible one is plainly wrong.

**The three triggers that earn a question** (D6) — nothing else does:

- **T1** — two or more options are still standing after a real comparison.
- **T2** — the plan needs something a locked `CONTEXT.md` decision
  contradicts, and citing cannot resolve it.
- **T3** — a child spec cannot be written with a real runnable `verify`, or
  with an `action` citing a real D-ID. The engine enforces this anyway
  (`src/intake/plan.mjs:175-201`); being unable to write it IS the signal,
  never a reason to invent one that passes.

Deliberately **not** a trigger: "high risk with insufficient proof". The
feasibility matrix above already handles that — a row with no accepted
evidence is `NOT READY`, which returns to `fgos-coding-planning` rather
than stopping for a person. Adding it here would turn a self-correcting
loop into a wait.

Record the outcome as a two-value cost verdict for the check below:
`REVERSIBLE` when no trigger fired, anything else when one did.

### Step 2 — check whether the gate can auto-approve

Run the `root=$(...)` line and the `node "$root/bin/fgos.mjs" gate-check
...` call below as two SEPARATE tool calls, never pasted together as one
script — a worktree-isolated session's own isolation guard refuses a
single call combining a `git`-rooted command with a following `node`
invocation, even though each command is safe alone (tsk-3rg). Resolve
`root` alone first, read its printed value, then substitute that literal
path into the second, separate call — never `$root`, which does not
survive across separate tool calls anyway.

```bash
root=$(git rev-parse --path-format=absolute --git-common-dir | xargs dirname)
```

```bash
node "$root/bin/fgos.mjs" gate-check "<item-id>" --gate validateApprove --plan "docs/history/<feature>/plan.md" --children '<the child-spec JSON array from plan.md, or []>' --cost "<REVERSIBLE|EXPENSIVE>" --dir "$root"
```

Four axes, and every one of them can only push toward **asking**, never
toward silence (D9). That monotone direction is what makes the
self-reported cost verdict safe where `gate-bypass` D2 refused one: this
skill's own judgment can raise the bar, and can never talk the mechanical
floor below it down.

- the hard-gate keyword floor, over the item's text **plus the plan's
  structured fields** — footprint paths and child `title`/`verify`/`action`
  (D10). Narrative prose is deliberately excluded: it would trip on 266 of
  this repo's 318 real `plan.md` files, on words like `audit`/`auth`/
  `security` that are everyday vocabulary here rather than a danger signal.
- the tier ceiling (D11) — which measures **how much the person has
  delegated**, not how risky the work is. Size and reversibility are
  different things; do not read a covered tier as "this is safe".
- the mechanical open-items scan of `plan.md`.
- the cost verdict from step 1.

`gate-check` (tsk-65q) wraps `canAutoApproveMergedGate`
(`src/state/gate-bypass.mjs`) behind the CLI's own static imports —
`bin/fgos.mjs` imports `gate-bypass.mjs` with a plain relative specifier,
which Node resolves against `bin/fgos.mjs`'s own file location, never the
caller's cwd or repo root. That is what lets it resolve correctly from any
install shape (dev checkout, global npm install, npx) with zero
special-casing — unlike the two-tier cwd-relative/`$root`-relative
resolver this Gate section used to embed inline, which had no path back to
the package's own install location and crashed unconditionally for a pure
global-install consumer whose own repo carries no `src/state/*.mjs` at all
(`docs/history/tsk-65q-gate-bypass-global-install-resolution/RESEARCH.md`).

The cost verdict is this skill's own, computed in step 1 and passed
directly — never re-derived or re-read from a file. Read the verb's
`data.canAutoApprove` field (`true`/`false`) from its JSON output; treat
anything else — `false`, a non-zero exit, a malformed response — as
`false`: fail closed, never skip the question on a check that couldn't run
cleanly.

Either branch below records a structured approve record (tsk-19j D1/D11) —
separate from, and in addition to, any `fgos decision` line this session
already logged: `fgos gate-approve <item-id> --gate validateApprove --actor
<human|bypass> --verify "<verify>"`. The gate keeps the record name
`validateApprove` even though it now covers both retired gates, so items
already carrying gate history need no migration. `verify` is the item's own
current `verify` field (`fgos list --id <item-id> --json`'s
`data.work[id].verify`, read fresh) — this skill proves the plan's existing
verify still holds against reality, it does not design a new one (per this
skill's own "leave execution alone" rule).

- **`true`** — skip the question. Post the non-question line
  `auto-approved: validateApprove (gate-bypass level <level>)`, log it
  (`fgos decision --text "auto-approved validateApprove gate for
  <item-id> at level <level>" --rationale "gate-bypass level <level>
  permits auto-approval per docs/history/gate-bypass/CONTEXT.md D1-D5 as
  superseded by tsk-224" --relation supersedes:tsk-224`
  — the text names a real supersession, so the relation flag must say so
  too (tsk-1lv-1 D2) — the same audit trail `gate-bypass` D3
  requires), record it (`fgos gate-approve <item-id> --gate
  validateApprove --actor bypass --verify "..."`, per above), then
  continue straight to the `planning`→`executing` engine call below.

- **`false`** — ask. **Ask to adjust the plan together, never for
  permission** (D12). The shape of that question is the point of this
  whole gate, so it is prescribed, not left to taste:

  - Present **only the thing you are stuck on**. Do not restate the whole
    plan and end with one closed question — that is precisely the
    empty-gate failure this redesign exists to remove.
  - Show **your own attempt first**: which options you compared, what
    evidence you gathered, what tier A already ruled out. The person
    should be editing your reasoning, not starting from nothing.
  - Ask for **the specific input you are missing** — not "approve?".
  - If several things are stuck, **batch them into one round**, so one
    visit answers as much as possible (AGENTS.md priority #2).
  - When the reality gate produced constraints but no trigger fired, name
    the constraints plainly in the same message — they are context for the
    question, not a question of their own.

  Once the person answers, fold their answer into `plan.md`, record it
  (`fgos gate-approve <item-id> --gate validateApprove --actor human
  --verify "..."`, per above), then continue to the `planning`→`executing`
  engine call below.

Immediately after that gate-approve record, fire the `planning`→`executing`
engine call itself (tsk-27y D1/D2, per the Hard rule above), reading the
split decision straight from `plan.md`'s own step 4 (never re-derived here —
`fgos-coding-planning`'s job, already done and already cited). **This is
where split children first become real** — nothing created them earlier
(`coding-planning-validating-gate-redesign/CONTEXT.md` D7):

```bash
root=$(git rev-parse --path-format=absolute --git-common-dir | xargs dirname)
# plan.md's step 4 said "one honest piece" -- no split:
node "$root/bin/fgos.mjs" plan "<item-id>" --verdict pass-through --reason "<why plan.md called this one piece>" --dir "$root"
# plan.md's step 4 wrote child specs instead -- hand that same JSON block
# through verbatim ({title, verify, action, kind?, risk?, refs?, footprint?,
# deps?}), never a re-derived or re-worded version of it:
node "$root/bin/fgos.mjs" plan "<item-id>" --verdict decompose --reason "<why plan.md called for a split>" --children '<the JSON array plan.md already carries>' --dir "$root"
```

`--verdict decompose --children` is now the **only** way a split child is
created, and it is the right one: `normalizeChild` re-validates every spec
(rejecting the whole verdict over a missing `verify` or an `action` that
cites no real D-ID), and `addWork` then creates each child at
`stage: executing` carrying its `action` prose (`src/intake/plan.mjs:845-871`)
— so children arrive ready to be built and never repeat a gate of their
own. If the verdict is rejected, that is trigger T3 speaking: fix the spec
in `plan.md` or take the question back to the person; never loosen the
spec to get the write through.

The verdict reached at the Gate above does not, by itself, move the item
anywhere — it only informs which of the item's own already-registered edges
this session picks next; the `fgos plan` call above is what actually
validates and applies that move, never a substitute for it.

## Handoff

A `READY` or `READY WITH CONSTRAINTS` verdict, once approved at the gate and
the `fgos plan` call above has fired, means the item has already taken
its `planning`→`executing` edge — loading `fgos-routing` next reads the
item's stage (now `executing`) and points at the right place. A `NOT READY`
verdict hands the item back to `fgos-coding-planning` instead, with the matrix
attached, never onward, and never fires the `fgos plan` call.

**The `fgos plan` call above also releases the item's claim back to
`todo`** (`releaseClaimOnExecuting`, `src/intake/plan.mjs:488-494`,
claim-lock §3b) the moment the item reaches `executing` — this is expected
and correct, but any path that continues from here WITHOUT going back
through the `fgos-coding-driving` loop (which re-checks claim status fresh
right before invoking the `executing`-stage skill) is not automatically
safe: the claim may already be released, so a session driving stage-by-stage
by hand must re-read the item's live `status` itself and re-claim
(`fgos pick <id>`) before calling `fgos-coding-implement` directly. Skipping
this re-check risks implementing against an item that no longer holds its
claim, and `fgos return` will simply refuse later with "is todo, not doing".

## Red flags

- accepting plausibility language as a matrix row's evidence
- continuing past a reality-gate FAIL by calling it a minor note
- dispatching a second reader or a review pass over the plan — out of scope
  this slice (cite D6)
- re-planning or re-designing Execute's own verify instead of leaving it
  alone
- applying the `planning`→`executing` edge directly (writing state through
  anything other than the `fgos plan` CLI call) instead of leaving it
  to the engine
- inventing a `--children` entry plan.md never actually listed, or a title/
  verify that drifts from what plan.md recorded
- recording the verdict as a new field or stage instead of gate-question
  prose
- softening a NOT READY into a pass because the item already spent time here
- reopening a decision `CONTEXT.md` or `plan.md` already locked, instead of
  citing it
- **asking a person before exhausting tier A** — running the command,
  reading the file, or calling `fgos-researching` was the answer, and a
  question was asked instead
- **weighing repair cost before tier A is exhausted**, which turns "I did
  not check" into "it is probably cheap"
- **reading repair cost as it looks at the gate** rather than when the
  error would surface — everything is cheap here, because nothing is
  materialized yet
- **asking when a reversible option was available** instead of taking it
  and carrying on (D5)
- asking for anything other than T1/T2/T3 — in particular re-adding "high
  risk, weak proof" as a trigger, which the feasibility matrix already
  resolves via NOT READY without stopping for a person
- **presenting the whole plan and ending with one closed approve/reject
  question** instead of the stuck point, your own attempt, and the
  specific missing input
- asking several stuck points in separate rounds instead of one batch
- **loosening a child spec's `action` or `verify` to get a rejected
  `decompose` verdict through** — the rejection is trigger T3 speaking
- creating a split child anywhere other than this gate's own
  `--verdict decompose --children` call
- **firing `handoff --reason advise` on the Gate's live "ask a person"
  branch** — that question is answered the same turn via `gate-approve
  --actor human`, never a real async park; only a genuine `fgos ask` would
  qualify, and this skill has none
- invoking `fgos-researching` in tier A without logging `handoff --reason
  consult` right after (when the domain has a `roleGraph`), or skipping
  the reclaim at Bootstrap when holder is not already `implementer`
- reclaiming only once at Bootstrap and stopping even though `holder` has
  not reached `implementer` yet (tsk-2t9c D16 — a depth-2 nested call
  needs two reclaims)

Violating the letter of the rules is violating the spirit of the rules.

Feasibility validated and the gate approved. Invoke `fgos-routing` to
re-read the item's stage, or hand off directly once the item's next edge is
already fixed.
