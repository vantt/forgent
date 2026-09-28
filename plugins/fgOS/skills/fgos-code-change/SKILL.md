---
name: fgos-code-change
user-invocable: false
description: >-
  Drive any mutating coding change -- a single ad-hoc fix or a full plan/track --
  through the real `fgos coordination` CLI doors with independent review and
  red-team, in one merged lifecycle. Triggered only when declared `DemandFacts`
  indicate `outputKind: change`, `domain: code`, `mutates: true`, and
  `needsIndependentReview: true` -- never by keyword spotting on
  "implement"/"fix"/"change". `fgos capability match --demand`'s returned `form`
  selects the path: `facade` (a run/resume/execute verb targets a plan/phase
  path or a uniquely resolvable track) opens plan mode; `protocol` (everything
  else) opens single-cell mode; `inline` means no cell opens at all. Replaces
  `fgos-plan-loop` and `fgos-code-panel` (both deprecated stubs pending the
  Phase 7 compatibility window). Advisory-only coding design or architecture
  discussion routes through `fgos-panel`'s `coding-design-panel`, never here.
---

# fgos-code-change

A single change is a plan with one cell: this facade covers a standalone
mutating coding change and a full multi-cell plan/track through the same
open/fix/close/worktree lifecycle, never two parallel implementations of it.

This facade builds directly on two shared doctrine layers:
- **Generic Driver Discipline:** [`../_shared/coordination-driver.md`](../_shared/coordination-driver.md) defines the domain-neutral cycle (`observe -> choose legal action -> dispatch -> verify evidence -> disposition -> adapt -> explicit close -> continuity artifact`).
- **Coding-Cell Policy:** [`../_shared/coding-cell-policy.md`](../_shared/coding-cell-policy.md) defines isolated worktree execution, proof tiers, the Test-Selection Block, independent verification, post-merge verification, and tested/integrated identity.
*(Link convention: fragment paths resolve to canonical source trees in core/domains and project to sibling `_shared/` in `.agents/` and `plugins/fgOS/`.)*

All protocol execution lowers into the registered `core/coordination-protocols/standalone-master-coordination-loop.yaml` FlowDefinition (`doer -> reviewer/red-team -> fixer -> rechecks`; cited as a repo-root-anchored path, not a relative markdown link -- a domain skill's mirrors sit at a different depth from its canonical `domains/<domain>/skills/` source, the same convention `fgos-code-panel` already uses for this identical reference). Every operation there already declares its own `policy.capability` (`code:implement` for doer/fixer, `code:review` for reviewer/red-team) -- per-node executor binding resolves from that automatically (Unit I21); this facade supplies no default roster. A hand roster (`--executor <id>`/`--tier <tier>` on a later step; only `start` accepts `--actors`) is an explicit override, and its rationale is recorded in the dispatch objective.

---

## Non-Goals

- **No fgOS Work Lifecycle Involvement:** Never `fgos pick/cook/submit`, claims, or a fgos-runner loop drives a cell this skill opens.
- **No Git Merge Authority Inside Sessions, No Secondary Track Ledger:** Owned by the coding-cell-policy fragment (§4) and this skill's own `plan.md`/session-log continuity artifact -- never restated here.
- **No Design-Doc Ceremony:** `objective` names the exact file(s)/behavior to change directly, in plain text. A change big enough to need its own design discussion first belongs in `fgos-panel`'s `coding-design-panel` route, or a plan authored before this skill opens a cell.

---

## Mode Selection

One rule, replacing every former named sub-rule (`fgos-code-panel`'s M1/A1/A2/CE1-5): **plan mode only when an imperative run/resume/execute/implement verb targets a plan/phase path (`plans/**/plan.md`, `plans/**/phase-NN-*.md`) or a uniquely resolvable track name, or the entire request is nothing but a bare plan/phase path with no other text (M1's carried-forward exception -- a bare path alone is an implicit "execute this," no verb required); otherwise single-cell mode.** A question, conditional, or past-tense description directed at a plan/track is never guessed -- ask one clarifying question. A negation directed at a plan/track is only resolved when it names an explicit, itself-non-negated alternate target; a negated alternate too (e.g. "don't run plan.md, and don't fix src/bar.mjs either") is a second unresolved negation, never silently resolved -- ask one clarifying question there as well. A plan/phase path cited only as an edit target, context, or in passing (never as the verb's own object) stays single-cell mode.

**Recursive-dispatch guard (R2, survives unchanged):** when invoked from inside an already-active cell dispatch (`options.inPlanLoop`, a `coordinationId`/`workRef` matching the `<track>--<cell-id>` shape, or an active worktree branch matching that shape), never re-enter plan mode or open a nested track -- route to single-cell mode for cell-internal work, or refuse recursion outright if asked to open an inner track.

The heuristic above is a first guess only. Step 0 below confirms it against the real doors (`fgos plan-lint`'s `ok` in plan mode, `fgos capability match`'s `form` in single-cell mode) before any cell opens.

---

## Facade Hook Values

| Hook Slot | Value |
|---|---|
| `unit of iteration` | One cell: the single change (single-cell mode) or the next unmerged phase of a track (plan mode, `<track>--<cell-id>`). |
| `open inputs` | Plan mode: `plans/<track>/phase-NN-<name>.md`'s objective, `## Verification` block, and Product Gates capability, gated by a passing `fgos plan-lint` run (Step 0). Single-cell mode: the objective's own named file(s)/behavior, gated by a `protocol`-form `fgos capability match` result (Step 0). Either way: any actor binding override the Lead supplies. |
| `evidence verification` | Coding-cell policy: independently verify the git commit in the worktree and execute the cell's own declared Test-Selection Block tier(s). |
| `disposition criteria` | Proof-gap findings (judging the declared tier insufficient) cannot be deferred; must be `accepted` (escalating proof tier) or evidence-backed `rejected`. |
| `adaptation bounds` | Maximum 3 fix rounds per cell (uniform across both modes). Past the cap, remaining non-proof-gap findings are `deferred` and named in the trace; proof-gap findings force `accepted -> Proof: escalated-to-full` (full proof must pass before close). |
| `human-escalation triggers` | Unresolvable spec ambiguity with divergent readings, identical failure across two distinct approaches, an unresolvable merge conflict, or genuine plan/single-cell mode ambiguity (Mode Selection above). Batch questions, non-blocking. |
| `close criteria` | All required operations settled, all rechecks clean, no node carries an active `sharedCwdCaveat` with `status: 'recheck-required'`, checkpoint identity tuple recorded. |
| `after-close action` | Coding-cell policy: merge `--no-ff` into the target branch, run post-merge verification, clean the worktree; plan mode also appends a row to `plan.md`'s cell-status table (`references/plan-mode.md`). |
| `continuity artifact` | Single-cell mode: the cell trace (`plans/<...>/reports/` or an equivalent report path the Lead names). Plan mode: `plan.md`'s cell-status table plus the same cell trace (`references/plan-mode.md`). |

---

## Step 0: Determine Mode and Resume

**Cold resume, either mode:** query `fgos coordination status <coordinationId> --detail` (single-cell) or `fgos coordination chain <track> --json` (plan mode, see `references/plan-mode.md` for track-level cell selection). A fresh process with zero prior chat context must be able to resume from these doors and Git evidence alone.

**Refused-vs-pending ambiguity:** a live-refused node in a still-active session and a genuinely never-attempted node can both project as `schedulerOutcome: 'pending'` in `show`'s reconstruction. It is SAFE to retry a `'pending'`-shaped node after a fresh-process resume regardless of which case it actually is -- a genuinely-settled node is caught by the engine's own `resumed: true`/`'result-linked'` idempotency and never re-dispatched twice; a previously-refused node either succeeds on retry or resurfaces its own typed error. `'pending'` means "safe to (re)attempt," never "definitely fresh, unattempted work."

**Known projection gaps (accepted, not silently hidden):** `dag.counts.deferred` never assigns `schedulerOutcome: 'deferred'` in a cold reconstruction (only `settled`/`recheck-required`/`refused`/`blocked`/`pending`/`materialized`) -- a live DAG run can defer a node; a cold `show` still reports `0`. `chain`'s `nextAction` can say "all N node(s) settled" while a node with `schedulerOutcome: 'materialized'` (no pending/blocked/caveated status) means work is still running -- inspect per-node `schedulerOutcome` before treating either as a close signal.

**Plan mode gate:** resolve the track's `plan.md` (never the phase file -- `fgos plan-lint` only understands `plan.md`'s own `- unit: ... / capability:` blocks and `## Product Gates` table, per `src/report/capability-plan-lint.mjs`), then run `fgos plan-lint plans/<track>/plan.md --cell <id> --json`. Refuse to open on `ok: false` -- report every `severity: "hard"` finding and stop. Also refuse when any finding carries `code: "capability.undeclared"`, even though it is `severity: "warn"` and `ok` alone can still read `true`: that code means `--cell <id>` matched no unit block or Product Gates row at all, never a genuine clean pass. Any other `severity: "warn"` finding alone does not block. Then load [`references/plan-mode.md`](references/plan-mode.md) for track-level cell selection, cold-resume classification across a track's cells, the cell-status table, and closeout.

**Single-cell mode gate:** declare `DemandFacts` (`../_shared/capability-matching.md`) and run `fgos capability match --demand '<json>'`.
- `form: "inline"` -- no cell opens; the request returns to the live session. This facade must never capture work the match sends back inline.
- `form: "facade"` -- the request was actually plan/track-scoped and got misclassified as single-change. Check the R2 recursive-dispatch guard above FIRST: if this gate is itself running inside an already-active cell dispatch, refuse the recursion outright -- never re-route to plan mode from inside R2. Outside R2, re-route to the plan-mode gate above; never force-open a single cell.
- `form: "protocol"` -- proceed only when the resolved `capability` is `code:implement` or `code:refactor` (this facade's own mutating-coding capabilities). Any other resolved capability (e.g. `code:review`/`code:debug`/`code:test`) is advisory or non-mutating and must never be captured into a cell -- return the result to the live session unopened. When the capability check passes, proceed to Step 1.

---

## Step 1: Open a Cell

1. **Setup Worktree** per [`../_shared/coding-cell-policy.md`](../_shared/coding-cell-policy.md) §1. Single-cell mode uses its own distinct prefix (never a bare `<track>--<cell-id>` scheme, which `fgos coordination chain` would otherwise conflate with a real track):
   ```sh
   main=$(git rev-parse --show-toplevel)
   base=$(git -C "$main" rev-parse --abbrev-ref HEAD)
   wt="$main/../code-change-<slug>"
   git -C "$main" worktree add "$wt" -b code-change--<slug> "$base"
   ```
   Plan mode instead uses `<track>--<cell-id>` (`references/plan-mode.md`), matching the track's own existing cells.
2. **Compose the Test-Selection Block** (`../_shared/coding-cell-policy.md` §2) before dispatching -- single-cell mode from the objective's own named behavior; plan mode from the phase's `## Verification` block plus repo evidence (`references/plan-mode.md`).
3. **Start Session (runs entry node):** `coordination start` on `standalone-master-coordination-loop` resolves and executes the entry node (`produce-candidate`, actor: `doer`, mutating) at session initialization. Because it mutates code, `start` MUST pass `--cwd`:
   ```sh
   fgos coordination start \
     --kind declared-protocol \
     --protocol core.coordination-protocol.standalone-master-coordination-loop \
     --coordination-id "<code-change--slug | track--cell-id>" \
     --writer-id "<driver-id>" \
     --cwd "$wt" \
     --objective "<exact file(s)/behavior to change, plus the Test-Selection Block's FOCUSED_TESTS command>"
   ```
4. **Dispatch Evaluation Pass:** query `fgos coordination status <coordinationId>`. `produce-candidate` has already executed; the projected legal actions are the parallel primary evaluations `review-candidate` (reviewer) and `red-team-candidate` (red-team). Dispatch each:
   ```sh
   fgos coordination operation \
     --id "<coordinationId>" \
     --action-key "<actionKey>" \
     --writer-id "<driver-id>" \
     --objective "Review candidate diff against requirements; judge whether FOCUSED_TESTS actually exercises the changed contract or a wider tier is needed." \
     --expected-outputs "agent-result.json"
   ```

### Optional: Concurrent Read-Only Fan-Out (Two-Request DAG Mode)

The legacy template above stays the default path, since DAG mode admits read-only steps only and cannot contain the mutating `produce` step. When a concurrent read-only fan-out is wanted (e.g. two independent inspections) *after* the mutating work has already landed, use a **second, separate request**:

1. **Request 1:** The exact template above, containing the mutating step. Let it settle.
2. **Request 2:** A separate `dag: true` request with a **NEW** `coordinationId` that must NOT start with the literal `<track>--` prefix (e.g. `inspect--<coordinationId>`, never `<coordinationId>-inspections`) -- `fgos coordination chain <track>` (`src/verbs/coordination/chain.mjs`) groups any session id starting with that exact prefix as a member of `<track>`, so a plan-mode `coordinationId` of `<track>--<cell-id>` would get its own auxiliary inspection session silently misfiled as a fake extra cell of the track if the auxiliary id merely appended a suffix. `contextRefs` cannot cross sessions, so each step's objective names the exact commit SHA and worktree path directly (never a moving branch name):
   ```json
   {
     "kind": "declared-protocol", "dag": true,
     "coordinationId": "inspect--<coordinationId>",
     "protocolRef": { "id": "core.coordination-protocol.standalone-master-coordination-loop" },
     "steps": [
       { "type": "operation", "as": "review", "operationId": "review-candidate", "targetActorId": "reviewer",
         "objective": "Inspect the landed commit <testedSha> at worktree path <wt> (pin the SHA, not the moving branch). Read `git show <testedSha>` there.",
         "expectedOutputs": ["agent-result.json"] }
     ]
   }
   ```
   Two concurrent read-only peers sharing one `--cwd` receive a `sharedCwdCaveat` with `status: 'recheck-required'` -- this example is intentionally single-peer-safe / expected to self-caveat, a fine teaching case: either recheck with two genuinely distinct `--cwd` values, or treat the caveat as blocking close per Step 4.

---

## Step 2: Read Results and Disposition Findings

Inspect session status: `fgos coordination status <coordinationId> --detail`.

**Caveat blocks close, always (Architecture Invariant 7):** a result carrying a `sharedCwdCaveat` field with `status: 'recheck-required'` (`verdict: 'non-attributable'`) must NEVER be treated as valid accept/reject/close evidence -- `status`'s own aggregate counts can fold a caveated node into "settled." Inspect each node's own `sharedCwdCaveat` field directly and force an explicit uncaveated recheck before dispositioning a caveated finding.

Independently verify the doer's commit and run the declared tier per coding-cell policy §3, then record a disposition for each reported finding:
```sh
fgos coordination disposition \
  --id "<coordinationId>" --action-key "<actionKey>" --writer-id "<driver-id>" \
  --disposition "accepted" --rationale "Reviewer HIGH-1 accepted; scheduled for fix round 1."
```

---

## Step 3: Authorize and Dispatch Fix Rounds

When findings are accepted, execute a fix round (capped at 3 per cell, uniform across both modes -- past the cap, remaining non-proof-gap findings are `deferred` and named in the trace):
```sh
fgos coordination authorize-and-dispatch \
  --id "<coordinationId>" --action-key "<actionKey>" --writer-id "<driver-id>" --cwd "$wt" \
  --objective "Apply accepted finding to candidate; re-run FOCUSED_TESTS for the changed region plus a regression test for the specific finding." \
  --reason "Apply accepted Reviewer HIGH-1 finding." --granted-context-refs "<failedAssignmentId>" \
  --expected-outputs "agent-result.json"

fgos coordination authorize-and-dispatch \
  --id "<coordinationId>" --action-key "<actionKey>" --writer-id "<driver-id>" \
  --objective "Recheck revised candidate against the previously accepted finding; read the fixer's own commit/test output as evidence first." \
  --reason "Recheck revised candidate." --granted-context-refs "<reviseAssignmentId>" \
  --expected-outputs "agent-result.json"
```
`authorize-and-dispatch`/`operation` accept no `--actors`; `--executor <id>`/`--tier <tier>` is the only per-step override past the entry node.

---

## Step 4: Close a Cell

1. **Verify Quorum and Prerequisites:** all required operations and rechecks satisfied, no open proof gaps, no node carries an active `sharedCwdCaveat` with `status: 'recheck-required'` (Step 2). Never issue close while one does.
2. **Record Checkpoint Identity:** `testedSha`, `integratedSha`, `treeIdentical`, `outcome` per coding-cell policy §5.
3. **Execute Explicit Close:**
   ```sh
   fgos coordination close --id "<coordinationId>" --action-key "<actionKey>" --writer-id "<driver-id>"
   ```
4. **Post-Close Integration:** outside the session, the full sequence -- merge `--no-ff` into the target branch, the mandatory `--allow-empty` record commit naming `testedSha`/`integratedSha`, the pre-cleanup `HEAD` re-assertion, then worktree removal -- is owned entirely by coding-cell policy §4/§5; this facade does not restate or abbreviate it. Plan mode additionally appends a row to `plan.md`'s cell-status table (`references/plan-mode.md`).

---

For a full multi-cell track run to completion unattended (crash/resume, cell-status table, closeout report), see [`references/plan-mode.md`](references/plan-mode.md).
