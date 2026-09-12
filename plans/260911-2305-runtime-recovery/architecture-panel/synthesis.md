Role: Synthesizer
Author: claude-bwrap / claude / opus / critical
Dispatch: prompts/synthesizer.md -> runs/asgn_..._op_011/01
Reads (in order): interpretation.md, scout-report.md, proposals/{system-shaper,
alternative-shaper,specialist-long-horizon,constraint-advocate-phase5}.md,
critiques/architecture-critic.md, proposals/constraint-advocate-phase6.md.
Not read, by charter: prior review reports, any source file — every claim
cites the ledger at the revision it was written against.
Revision: v1
Written: 2026-09-12

Full advisor output (primary record):
`.fgos/assignments/asgn_runtime_recovery_panel_coordinator_op_011/runs/01/agent-report.md`

**Coordinator correction, per red-team verdict REVISE
(`redteam.md` §6, required revision).** §3.5, §4 branch 6, §5/§6
confidence table, and Unresolved below all treat "whether `generation`/
`incarnation` are among the 15 locked decisions" as an open, unresolved
question. **It is not open.** `design-panel-prompt.md`'s own baseline
decision 4 states, verbatim: "`generation` dùng để fencing control
ownership; `incarnation` phân biệt worker resource sau gateway restart."
This is a real defect in this synthesis, root-caused by the coordinator
(this session): the synthesizer's own reading list never included
`intake.md`/`design-panel-prompt.md`, only `interpretation.md`'s
paraphrase — the synthesizer had no way to check this against the actual
source text, and correctly said so ("not read source files"). **The
corrected reading**: system-shaper's S1' (drops `generation` from
admission, moves `incarnation` to S2's `handle.json`) IS a
baseline-departure request, not a hypothetical branch. Per the
architecture-decision-lock's own rule ("chỉ bác khi có bằng chứng mâu
thuẫn trực tiếp"), this must go to the person with the evidence on both
sides (system-shaper's: `attempt` + `supersedesRunId` already carry the
fact; baseline decision 4's own text: both fields are explicitly locked)
— **never adopted or rejected in-panel.** This is now the single
concrete product decision this whole panel session surfaces for the
person; see the Final Recommendation's Open Questions.

The synthesizer's own text below is preserved unedited as the primary
record of what it actually reasoned from the ledger it was given; treat
every reference to this branch as "unresolved" below as corrected by this
note, not as still-open.

---

## 1. Recommendation

**Adopt the baseline-conservative candidate (system-shaper's S1'/S2'/S3'/S4',
with D-std) as the runtime-recovery shape for P00-P04.** Not gateway-change.
Not a merged architecture. Long-horizon is not a competing S1-S4 mechanism —
it is reserved fields layered over whichever mechanism wins, and whether to
carry those fields now is a values choice for the person (§4), not decided
here.

Why: baseline is the only candidate whose own text commits to closing the
top-ranked shared HIGH risk (standalone Team-Dispatch admission), and whose
load-bearing precondition for that closure (C1: `executeAssignment` is the
sole launch site) was actually checked by the critic and held — F1 and F5
both verified, not stated. No other candidate has both a commitment and a
verified precondition.

## 2. Why baseline over the others

### 2.1 Against gateway-change — designated loser

- **Does not close the shared gap.** Moves fencing to Herdr, leaves Node
  "dispatch[ing] with `workId` and a non-deterministic name." Constraint
  advocate Phase 6: it "does not specify a Node admission migration and
  leaves a local duplicate-admission race even if Herdr fences starts." The
  proposal's own text never answers this — a real gap in the candidate's
  own claim, not a footnote. [confidence: high]
- **Unresolved HIGH: Herdr as stateful authority, no split-brain repair.**
  Constraint advocate: "neither repair authority is defined." Unrebutted.
  [high]
- **Contradicts a locked baseline decision without contradicting evidence.**
  Interpretation records: "authority/write door (CoordinationSession + Run
  only; Herdr/name/timestamp/PID are evidence, never authority)." Making
  Herdr "the single source of truth for process fencing" overturns this.
  Baselines overturn only with direct contradicting evidence, surfaced to
  the person — never in-panel. Alternative-shaper offers none; only that
  Node-side plumbing "doesn't exist," which system-shaper's C2 reduced to a
  one-expression change (unverified but unattacked). [high on the conflict;
  medium-high on plumbing size]
- **Zero checked falsifiers.** Criterion 1 unverifiable from this session
  (critic Attack 2, landed); criterion 2 (speculative concurrent attempts)
  never checked, same shared assumption found in both shapers. [high]
- **Its one genuine contribution** (a lookup preventing a leaked worker on
  crash) is already absorbed by baseline S2' — same protection without
  making Herdr authoritative. [medium-high]

### 2.2 Against long-horizon as the *primary* candidate

- Explicitly bounded — its own text: does NOT implement P06/P07, does not
  change the other two candidates' conclusions. Cannot be the S1-S4
  mechanism alone. [high]
- Its central deferral claim (what P06/P07 must reopen if deferred) is
  **asserted, not checked** by anyone. System-shaper's prior 1 states the
  opposing fact: no scout evidence of pain for continuation/writable/health
  scoring. Neither side verified — a values question about when to pay
  schema debt (§4). [high that it's unverified]
- States **no falsification criteria at all** — the only role output in
  the ledger without them. [high]
- Constraint advocate ranks its own risk lowest — not dangerous, just not
  the decision the person asked for.

### 2.3 What baseline gets right that survived critique

| Baseline claim | Status in ledger |
|---|---|
| C1: one launch path, `executeAssignment` sole site | **Verified** (critic checked F1+F5, both held) |
| D-std: retrofit standalone path at `executeAssignment` | Follows from C1; matches constraint advocate's cheapest-mitigation |
| S2' parks on lookup miss; no automatic replacement launch shipped | Consistent with both constraint-advocate passes |
| S3' park for blocked/paused-limit | Grounded in scout evidence |
| Zero new ports in P01-P03; drops 14 named ports | Not attacked; matches near-zero new-abstraction appetite |
| C2: `runId` derivable from `ctx.runDir` | Not attacked, not verified |

## 3. Five required questions, answered plainly

### 3.1 Does baseline close the standalone admission gap?

**Yes, by its own text, conditionally on C1 — and C1 is verified.** D-std
makes `executeAssignment` the one owner of attempt admission for both
callers, fences inside `withEventsLock` scoped per-Assignment, replaces
recursive `mkdirSync` with non-recursive (EEXIST -> typed
`admission-conflict`). Remaining carve-out baseline names itself: the
Work-runner path is out of scope, named not silently ignored. [confidence
gap closed for Assignment-scoped launches: high; confidence Work-runner
exclusion is safe: medium — rests on the critic's F5 sweep, method
(static read vs. grep) unstated]

Gateway-change does not close it. Long-horizon closes it only as a stated
prerequisite — names the need, does not supply the mechanism.

### 3.2 Does baseline inherit the shared unexamined assumption (one legitimate attempt per Assignment)?

**Yes.** S1' defines current Run = highest attempt with no
`supersededBy`/`settlement`; a caller with no `supersedesRunId` against an
un-settled Run gets idempotent `already-admitted` — a design-level
prohibition of concurrent speculative attempts. Nobody checked whether any
repo feature launches parallel attempts for ONE Assignment by design
(fanout runs different children, not the same thing). Two observations:
(a) the person's near-zero duplicate-spawn tolerance reads as *wanting*
this invariant — likely alignment, not defect; (b) if speculative
same-Assignment attempts are a real requirement, BOTH shapers fail and the
ledger has no surviving candidate — a new position this synthesis does not
author. [assumption inherited: high; harmless: medium]

### 3.3 Was F7 checked?

**No. Unresolved.** Critic checked F1/F5, called F3 theatrical, called F6
checkable-but-unchecked, never mentioned F7. Constraint advocate says F7 is
"load-bearing, not cosmetic," escalates to HIGH if field absence controls
settlement/admission authority — precisely what S1' does (selects current
Run by absence of `supersededBy`/`settlement`). The recommendation carries
F7 as a real open falsifier. Baseline's own text pre-commits the remedy
(revert to `assignment-run.v2`); cheap check, not done. [unchecked: high;
matters: high]

### 3.4 Falsification criteria checked vs. merely stated

| Criterion | Owner | Checked? | Result |
|---|---|---|---|
| F1 (`runExecutorAttempt` self-allocates) | system-shaper | **Yes** (critic) | did not occur — C1 holds |
| F5 (other Assignment-`runDir` callers) | system-shaper | **Yes** (critic) | none found |
| F2 (`withEventsLock` mis-scopes) | system-shaper | No | — |
| F3 (Herdr duplicate-name reuse) | system-shaper | No, needs live probe | unresolved; "material operational gate" |
| F4 (concurrent calls already distinct) | system-shaper | No, needs S0 fixture | — |
| F6 (`coordination run` can't address parked Assignment) | system-shaper | No, statically checkable | unresolved; decides P03/P04 order |
| F7 (reader branches on field absence) | system-shaper | **No** | unresolved, load-bearing |
| F8 (`paneClose` destroys gateway record) | system-shaper | No | — |
| Crit 1 (Herdr can't index workId) | alternative-shaper | Unverifiable | theatre |
| Crit 2 (speculative concurrent attempts) | alternative-shaper | No | same as §3.2 |
| (none stated) | specialist | — | gap in that role's output |

Two of eight system-shaper criteria checked — and those two decide whether
the shared HIGH risk closes. Strongest evidentiary position in the ledger,
and still thin.

### 3.5 Values vs. facts

**Fact-level, resolved:** C1; `runId` absent from `herdr-round.mjs:654`;
`blocked`/`paused-limit` -> `worker-timeout` today; unlocked attempt
allocation at `assignment-runner.mjs:810-827`.

**Fact-level, unresolved:** F2/F3/F4/F6/F7/F8; Herdr `agentGet` on
never-created vs. raced name; **whether `generation`/`incarnation` are
among the 15 locked decisions** — baseline S1' drops `generation` from
admission and moves `incarnation` to S2's `handle.json`; the ledger does
not say whether that touches a ratified decision — if it does, it must go
to the person with evidence, never adopted in-panel.

**Values-level, goes to the person:** long-horizon's reserved fields now
vs. later (§4). Whether a parked-forever Run without gateway
`absent-proven` is acceptable residual (baseline says yes; the person's
stated asymmetry agrees).

## 4. Conditional branches

1. If F7 falsifies: recommendation stands; P01 ships as `assignment-run.v2`
   bump instead of v1 field-add (baseline's own pre-committed revert).
2. If F3 shows `herdr agent start <existing>` reuses/replaces:
   recommendation stands; P02 needs pre-start `agentGet` on every launch,
   not only resumes.
3. If F6 shows `coordination run` cannot address a parked Assignment:
   recommendation stands; P04's `recover` moves ahead of P03.
4. If the S0 fixture (F4) shows concurrent calls already land in distinct
   `runs/NN/`: P01 shrinks; recommendation stands.
5. **If same-Assignment speculative attempts are a real requirement:
   recommendation does NOT stand, neither does gateway-change.** No
   surviving candidate in the ledger; a `runId`-keyed admission would be a
   new position no advisor proposed. Escalate, do not synthesize.
6. **If `generation`/`incarnation` in S1 are among the 15 locked
   decisions: baseline's S1' departure is a baseline-overturn request and
   must go to the person** with the system-shaper's evidence (`attempt` +
   `supersedesRunId` already carry the fact). Do not adopt S1' silently;
   adopt with the package's `generation` field retained if the person
   declines.
7. **Values branch — long-horizon reserved fields.** If the person prefers
   paying reversible schema debt now: layer the specialist's S1 envelope
   fields on top of baseline, descriptive-only, with the fossilization
   guard (write doors refuse capabilities the fields reference). If the
   person prefers "no abstraction for absent capability": do not. Default
   if the person gives no answer: **do not add** — baseline's `run.json`/
   `handle.json` already carry `runId`, `supersedesRunId`, `agentSession`,
   the lineage a later P06/P07 would key on; nothing in baseline forecloses
   adding the rest at a version bump. [confidence: medium — nobody checked
   the reopen claim]

Baseline vs. long-horizon on S1 cannot be separated by evidence in the
ledger; the one observation that would: does any S2/S4 consumer need a fact
that `attempt` + `supersedesRunId` cannot carry (the S0 fixture plus a read
of `handle.json`'s consumers answers it). Until then, values choice.

## 5. True regardless of which candidate is chosen

1. **The standalone admission gap is real, top-ranked, and unrebutted.**
   Corrected weight: one finding (scout) plus one independent re-derivation
   of its consequences (constraint advocate Phase 6) — not four sources
   (see the coordinator's corrected note in `proposals/specialist-long-horizon.md`).
   No reader disputed it. Any accepted design must state D-std explicitly.
   [high]
2. **`runId` is not wired into the Herdr agent name today.** Must be fixed
   under any candidate. Size disputed (scout: new plumbing; system-shaper's
   C2: one expression) — C2 unverified but unattacked. [high on defect;
   medium-high on C2's sizing]
3. **`blocked`/`paused-limit` -> `worker-timeout` is real current
   behavior**; park-instead-of-retry needs the S0 freeze first. [high]
4. **Migration/profile gate for legacy records is HIGH and no candidate's
   text owns it.** Critic recalibrated this from MEDIUM to HIGH. Baseline's
   v1 field-add makes this worse in one dimension; long-horizon's broad
   envelope in another; gateway-change is silent. Cheapest mitigation
   stands as written: new-profile-only first rollout, fail closed on
   legacy recovery, fixtures proving legacy records read under old
   semantics — a gap in EVERY candidate's own claim. [high]
5. **No candidate ships automatic replacement launch.** All park without
   gateway `absent-proven`; only gateway-change claims to provide it, and
   that claim is unverifiable from this session. READY labels for P02 must
   be READY WITH EXTERNAL DEPENDENCY at best, never unqualified READY.
   [high]
6. **F3 needs a live probe under any candidate** deriving a Herdr name
   from anything durable. [high]
7. **Herdr-as-authority conflicts with a ratified baseline decision** —
   not a taste finding, the person's own locked rule. [high]
8. **The scout's `legalNext` absence** means S4's "extraction" is
   synthesis under the package and under long-horizon; baseline drops it.
   Not raised as blocker by the constraint advocate. [medium]

## 6. Per-claim confidence (summary)

| Claim | Confidence |
|---|---|
| Baseline is the only candidate with both a commitment to close the shared gap and a verified precondition | high |
| Gateway-change does not close the shared gap and carries an unresolved HIGH authority finding | high |
| Gateway-change overturns a locked baseline decision without contradicting evidence | high |
| Long-horizon is additive, not competing; its deferral-cost claim is unverified | high |
| F7 was not checked and is load-bearing for baseline S1' | high |
| Recommendation inherits the one-attempt-per-Assignment assumption | high (inherited) / medium (harmless) |
| C2 (`runId` from `ctx.runDir`, one expression) | medium-high — unattacked, unverified |
| Work-runner path exclusion is safe | medium — rests on critic's F5 sweep, method unstated |
| Baseline does not foreclose later P06/P07 lineage | medium — nobody checked the reopen claim |
| Migration gate is HIGH and unowned by any candidate | high |

## Unresolved (preserved as such, not smoothed)

- **F7** — unchecked; load-bearing; baseline's own revert pre-committed.
- **F3** — needs live probe; gates P02 step 1's shape.
- **F6** — statically checkable, unchecked; decides P03/P04 order.
- **Speculative same-Assignment attempts** — unexamined by both shapers;
  if real, no candidate survives.
- **`generation`/`incarnation` vs. the 15 locked decisions** — ledger does
  not say whether baseline S1' touches a ratified decision.
- **Long-horizon reserved fields now vs. later** — values choice, to the
  person.
- **Migration/profile classification for legacy records** — HIGH, owned
  by nobody's text.
