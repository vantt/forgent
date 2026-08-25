# plan.md — tsk-5x7: Dispatch semantic control plane + Herdr-ready orchestration

Mode: high-risk

**Lane derivation (mechanical, `fgos-routing`'s own Mode gate).** Flags that
actually apply, counted — 5, of which 2 are hard-gate:

| Flag | Applies? | Evidence |
|---|---|---|
| audit/security | **yes (hard-gate)** | governance egress declaration — repo/prompt content leaving to a third-party backend must become auditable |
| external systems | **yes (hard-gate)** | Herdr runtime as a spawn target; OpenRouter reached through `glm`'s env override |
| public contracts | **yes** | `decide` CLI output shape, executor config schema (new `egress` block, new `adapter` value) |
| existing covered behavior | **yes** | the `decide`/`resolve` paths being changed are covered by `test/runner/dispatch.test.mjs` (319 tests, green today) |
| data model · auth · authorization · cross-platform · weak proof · multi-domain | no | under D6's cut the schema-heavy work (AgentMessage, ArtifactRef, confidence payload) is deferred, so the data-model flag no longer applies |

4 flags AND two hard-gate flags ⇒ **high-risk**, unchanged by D6's narrower
scope: `standard` assumes no hard-gate flag, and both the egress-governance
piece and the external-runtime piece are exactly that. What D6 removed was
volume, not danger — the two riskiest surfaces are precisely the two that
stayed.

**Impact-analysis posture: DEGRADED — proof from the tool is weak, named
plainly.** `fgos tool query --capability impact-analysis --status present`
returns `gitnexus` as `present`, but its index is stale (session hook:
`last indexed: 7bb3231`; `tsk-1lg` tracks the same drift). Per `CLAUDE.md`'s
capability gate this is the Degraded branch: every other required check was
run, and blast radius was established by **grep cross-check instead of
trusting `impact()`** — this repo already has a confirmed false-negative
precedent for exactly this query shape (`EXECUTOR_ADAPTERS`, recorded in
`docs/explanation/why-capability-executor-and-capacity-are-three-separate-concepts.md`).

## Locked decisions

Already minted during `fgos-coding-shaping` and recorded as real
`fgos decision --id tsk-5x7` events (seq 4-8). Restated here — not
re-decided — because this is the file the engine's own
`readLockedContext`/`extractLockedDecisionIds` actually reads (it reads
`CONTEXT.md` + `plan.md`, never `DISCUSSION.md`). Full narrative and
evidence: `DISCUSSION.md` §4/§6.

| D-ID | Decision |
|---|---|
| D1 | `DispatchPlan.mechanism` is the canonical output of Native-First Dispatch Doctrine (D-ADR0026 rules 1-4, narrowed by 0033) — never a second decision layer. `launcher`/`driver` lives in `plan.caller` (T1, D17 of tsk-5td); `selector.type` uses `work` (0029 retired rootTask/subTask); `capacity` is not a field (D-ADR0034/tsk-225 renamed capacity→executor); `reasonCodes` carries which rule won. |
| D2 | ~~Scope is the 8-phase "Dispatch semantic control plane + Herdr-ready orchestration".~~ **SUPERSEDED BY D6** — the scope half only. Its **hard constraint survives unchanged and still binds**: Herdr never decides task/review/blocker/artifact state; only fgOS state transitions do. |
| D3 | Herdr-as-transport has a real consumer: the person watching an agent work on a real pane. Architecturally this means A no longer parents B, so the protocol may not assume "caller spawned the worker and reads its stdout". |
| D4 | Clean-break renames, justified by measured zero cost: `exec packet`→`DispatchAssignment`, `TASK`→`ASSIGN`, `<scope>#p<n>`→typed prefixes (`asgn_`/`msg_`/`run_`), `ArtifactRef` mandatory, prompt becomes a rendering *of* the assignment rather than the source contract. D18's six content slots keep their meaning, only their labels change. |
| D5 | structured-first + degradation-aware, never structured-only: three-tier ladder `reported` / `legacy-signal` / `inferred`, where the `inferred` tier reports `status:"UNKNOWN"` rather than pretending `SUCCESS`. Migration is gated on telemetry (accept all three → warn → per-provider enforcement → remove legacy). *Principle intact under D6; only its promotion into a telemetry migration waits for a real reader.* |
| D6 | **Supersedes D2's scope.** Two fused needs split apart: the immediate one (watch an agent in a Herdr pane) and the long-term protocol foundation. Implementation cut to **three dependency-free pieces** — fix `decide --for` + minimal `DispatchPlan`, dependency-free egress governance, and a `herdr-spawn` **adapter**. Binding distinction: `herdr-spawn adapter` (worker in a pane via the existing `executor.adapter` axis, protocol unchanged, ship now) is NOT `herdr transport/protocol` (real mailbox/message delivery, deferred). Four items deferred with named pull-in conditions; no `confidence ladder` child until a reader exists. |

## Approach

**Chosen path (D6, superseding D2): ship the thing that was actually asked
for, on the extension point that already exists — and let the protocol
foundation earn its way in with evidence.**

Two needs had been fused into one epic and did not belong together: the
**immediate** need (watch an agent work in a real Herdr pane) and the
**long-term** need (AgentMessage / mailbox / artifact store / structured
RESULT). Separating them collapses seven heavy children into three
dependency-free ones.

Three measurements drove the change, each recorded under D6:

1. **Herdr does not need the protocol registry.** `transport.mjs:148` reads
   `executor.adapter ?? DEFAULT_ADAPTER` — `adapter` is an axis *independent
   of* `via`. An executor declaring `via:"cli"` plus
   `adapter:"herdr-spawn"` passes `resolve.mjs:280`'s cli gate and then runs
   its own adapter. Precedent: `tsk-49o` proposes `sandboxed-cli-spawn` the
   same way; and `herdr` is already a registered executor
   (`via:"cli"`, `command:"herdr"`). The earlier plan's claim that protocol
   abstraction hard-blocks Herdr was true only of the full transport vision,
   never of the pane-spawn the consumer actually wants.
2. **AgentMessage was larger than its evidence.** D3 justifies exactly one
   thing — a result channel that does not require process parenthood. It
   does not justify `ACK`/`PROGRESS`/`QUESTION`/`ANSWER`/`REVIEW_REQUEST`/
   `REVIEW_RESULT`/`CANCEL`: 8 of 11 message types have no named consumer.
3. **A confidence field with no reader repeats a mistake already in the
   tree.** `outcome:'unsignaled'` is produced at `cli.mjs:546` and read by
   **no production consumer** (tests only). Writing `confidence` without
   building its reader would reproduce that exactly, and D5's own migration
   phases 2-4 are unreachable without one.

**The distinction D6 makes binding:**

| Concept | What it is | When |
|---|---|---|
| **herdr-spawn adapter** | run the worker inside a Herdr pane via the existing `executor.adapter` axis; protocol unchanged | **now** |
| **herdr transport/protocol** | real mailbox/message delivery, worker not a child process at all | deferred |

**Alternatives rejected:**

1. *Keep the seven-child scope.* Rejected by D6 on the three measurements
   above — it delivers the motivating feature last, behind the most work.
2. *A fresh `mechanism` decision layer inside the new planner.* Rejected by
   D1: two sources of truth, doctrine in `docs/specs` and planner in code.
3. *structured-only V1, no fallback.* Rejected by D5 on live evidence:
   workers are third-party CLI agents, so the prompt is a soft contract fgOS
   cannot enforce. **D5 is not reversed by D6** — its ladder and its "never
   pretend equal certainty" principle stand; only its promotion into a
   telemetry migration waits for a reader.
4. *Narrow-scope bug fixes only, no Herdr at all.* Rejected: the pane-spawn
   is the one consumer with a real person behind it (D3).

**Blast radius (grep-established, tool-degraded).** Every production file
mentioning the four dispatch entry points
(`decideExecutorCli`/`executeExecutorCli`/`spawnWorker`/`fanoutBatchExecutorCli`)
— 11 files, all inside one subsystem:

```
src/runner/dispatch/{cli,config,transport,resolve,prepare}.mjs
src/runner/{dispatch,loop,goal-check,prompt-templates,worktree}.mjs
scripts/dispatch-decide-hook.mjs
```

`buildPrompt` is confined to `dispatch/prepare.mjs` (5) and `dispatch/cli.mjs`
(9); `logExecutorDispatch` to `dispatch/cli.mjs` and the `dispatch.mjs`
barrel. Contained and single-subsystem — under D6's cut only four of those
eleven files are actually touched (`cli`, `resolve`, `config`, `transport`).

**Risk map.** Every medium/high entry carries a proof point for
`fgos-coding-validating`, never a reassurance here.

| Risk | Level | Proof point carried to validating |
|---|---|---|
| Routing an existing `decide` path through `resolveExecutorAndOverrides` silently changes an outcome | **high** | Characterization first: assert today's exact `decide` output for all four selector forms BEFORE the change, re-assert after |
| Egress gate change could refuse a currently-working executor | **high** | `glm` is the live specimen: assert refuse-without-declaration AND pass-with-declaration; every other registered executor stays dispatchable |
| `herdr-spawn` has no in-repo precedent as an adapter | medium | Its verify demands a real pane; `cli-spawn` must stay byte-identical and the adapter must be opt-in per executor |
| A Herdr pane's own lifecycle gets mistaken for task truth | medium | Explicit test: a runtime signal alone never changes task status / review outcome / blocker resolution (D2's surviving constraint) |
| Pieces 0 and 1 both edit `cli.mjs` | low-medium | Function-level disjoint (`decideExecutorCli` ~:685 vs `logExecutorDispatch` ~:298); declared so the gate can see it — see the overlap note below |

**Files, in landing order:** `dispatch/cli.mjs` (0a fix) →
`dispatch/plan.mjs` (new, 0b) → `dispatch/resolve.mjs` + `config.mjs` (piece
1) → `dispatch/transport.mjs` (piece 2). All three pieces are dependency-free
and may run in parallel; this order is only what a single worker would do.

**Ordering input, honestly reported.** `fgos graph tsk-5x7 --json` puts this
item on no critical path (`criticalPath` is a different 10-deep chain) and
returns an empty `topUnblock`, so there is no external unblock pressure to
optimize against — ordering below is driven purely by internal dependency.
`fgos graph --what-if` per candidate was **not** run: it compares existing
ids, and by design no child exists yet at this stage.

## Shape

**Three pieces, all dependency-free**, materialized by
`fgos-coding-validating` at its single gate — none created here. This is D6's
cut, superseding D2's eight-phase scope. §7.2 of `DISCUSSION.md` remains
absent: `tsk-fli` is already that exact work (its `refs` points at
`#task-execute-work`), honored as an existing sibling rather than duplicated.

### Coverage of the source note's seven Findings

| Finding (source note) | Where it lands | Note |
|---|---|---|
| #1 `decide --for` misses `capabilities.*.prefer` | **piece 0** | live-verified bug |
| #3 cross-provider governance inspects the wrong thing | **piece 1** | live-verified hole (`glm` reaches OpenRouter via `env`) |
| #6 two orchestration paths not unified | **piece 0**, partially | the minimal plan object is the seam; porting every caller is deferred |
| #2 adapter port not really open | **deferred** | no longer a blocker — the `adapter` axis (`transport.mjs:148`) is already open, which is what piece 2 uses |
| #5 protocol pinned to prompt/stdout | **deferred** | piece 2 deliberately keeps today's prompt/stdout contract |
| #4 MCP is a hand-back, not a peer dispatch target | **deferred** | the source note itself calls this "hợp lý cho V1" |
| #7 workflow speed | **deferred** | the note's own measurements put the bottleneck in subprocess/git/worktree/pick-return, not in the dispatch protocol |

`deps` are integer indices into this same array, pointing strictly backwards
(`src/intake/plan.mjs:293` enforces `d < index`). All three are `[]`.

```json
[
  {
    "title": "Fix decide --for reading capabilities.prefer, plus a minimal canonical DispatchPlan",
    "verify": "node src/runner/dispatch.mjs decide --for fgos-coding-implement --dir \"$PWD\" | grep -q '\"executorId\":\"agy\"' && node --test test/runner/dispatch.test.mjs",
    "action": "Per D1 and D6, two layers in this order so a green proof lands first. (0a) Fix the live behaviour: cli.mjs:685's decide --for calls resolveExecutorIdForPurpose and therefore never reads capabilities.<name>.prefer via resolveExecutorAndOverrides — route it through the latter so `decide --for fgos-coding-implement` returns executorId agy / out-of-process / configured:true, with characterization tests for all four selector forms written BEFORE the change. (0b) Then add a MINIMAL src/runner/dispatch/plan.mjs exposing compileDispatchPlan(), which CALLS the existing decideDispatchMechanism/decideExecutorDispatchMechanism (mechanism.mjs:42,82) rather than re-deriving any routing rule, and packages selector/caller/mechanism/executorId/capability/invocation/reasonCodes. Minimal per D6 means: do NOT port every caller in this piece — decideExecutorCli is enough to prove the seam; spawnWorker/fanoutBatchExecutorCli/the hook follow only when something needs them.",
    "footprint": ["src/runner/dispatch/plan.mjs", "src/runner/dispatch/cli.mjs", "test/runner/dispatch.test.mjs"],
    "kind": "feature",
    "risk": "heavy",
    "refs": ["docs/history/dispatch-plan-protocol-redesign/DISCUSSION.md#task-dispatch-plan"],
    "deps": []
  },
  {
    "title": "Governance: declared egress replaces the command!=claude test, dependency-free",
    "verify": "grep -q 'egress' src/runner/dispatch/resolve.mjs && node --test test/runner/egress-governance.test.mjs && node --test test/runner/dispatch.test.mjs",
    "action": "Per D2's governance intent (carried forward by D6) and D1, replace the resolve.mjs:322 gate — which inspects only executor.command against CLAUDE_CLI_COMMANDS and is blind to an env override — with a declared-egress check carrying providerFamily plus egress {kind, target, content}. DELIBERATELY DEPENDENCY-FREE: this is a live policy hole, not a vocabulary refactor, and must not sit behind a structural refactor. It needs only fields that exist today — executor.providerModel, invocations[].command, invocations[].env, allowCrossProvider, carries. Reuse the ALREADY-BUILT EXECUTOR_CARRIES enum (config.mjs:364, enforced resolve.mjs:243-258) as the egress content vocabulary instead of inventing a parallel one. Also record the effective egress target alongside the self-declared provider label in the dispatch audit event, honoring tsk-5td D9's provider-AND-command rule. Cross-provider stays first-class; only undeclared or self-contradicting egress fails. Live specimen: executor glm keeps command:\"claude\" while routing to OpenRouter via env. GATE DECISION (person, 2026-08-25): ship glm's own egress declaration IN THIS SAME CHANGE, so the gate lands fail-closed with zero breakage. Measured blast radius is exactly one executor — agy/codex/pi already declare allowCrossProvider:true (their commands were never \"claude\", so the old gate already caught them) and no executor declares carries today; glm is the only entry carrying an env override. Do not tighten the gate without that declaration in the same commit.",
    "footprint": ["src/runner/dispatch/resolve.mjs", "src/runner/dispatch/config.mjs", "src/runner/dispatch/cli.mjs", "test/runner/egress-governance.test.mjs"],
    "kind": "feature",
    "risk": "heavy",
    "refs": ["docs/history/dispatch-plan-protocol-redesign/DISCUSSION.md#task-governance-egress"],
    "deps": []
  },
  {
    "title": "herdr-spawn adapter: run the worker in a real Herdr pane, protocol untouched",
    "verify": "node --test test/runner/herdr-spawn-adapter.test.mjs && node --test test/runner/dispatch.test.mjs",
    "action": "Per D3 and D6, add a herdr-spawn entry to EXECUTOR_ADAPTERS (transport.mjs) that launches the worker inside a Herdr pane instead of a stdout-captured subprocess, so a person can watch the agent work. HARD CONSTRAINT from validating (tsk-1nih, live evidence): this adapter must ALWAYS create a fresh pane (`herdr pane split`) and must NEVER reuse an existing one, or verify the target pane's foreground process before sending anything. `herdr pane run`/`send-text` types into whatever process currently holds the pane, and since tsk-1zq dropped --autoClose a finished worker's pane keeps an idle interactive agent REPL alive — so reusing a pane delivers the next dispatch as a CHAT MESSAGE into someone else's live session, with an item parked at awaiting-human as the sharpest case. Prefer `herdr pane wait-output --regex` plus `herdr pane read` to observe completion rather than assuming a captured stdout stream exists. Selected purely by executor.adapter — the executor keeps invocations[].via:\"cli\", so resolve.mjs:280's cli gate passes unchanged and NO protocol work is required (transport.mjs:148 already reads executor.adapter ?? DEFAULT_ADAPTER; tsk-49o proposes sandboxed-cli-spawn by the same route). Results come back through the EXISTING ladder: structured if present, else the [DONE]/[BLOCKED] token, else headBefore/headAfter git inference — this piece introduces no new result protocol and no telemetry claim. Per D2's surviving hard constraint, assert in test that a Herdr runtime signal alone NEVER changes task status, review outcome, blocker resolution or artifact acceptance; only fgOS state transitions do. Keep cli-spawn byte-identical: this is additive and opt-in per executor.",
    "footprint": ["src/runner/dispatch/transport.mjs", "test/runner/herdr-spawn-adapter.test.mjs"],
    "kind": "feature",
    "risk": "heavy",
    "refs": ["docs/history/dispatch-plan-protocol-redesign/DISCUSSION.md#task-herdr-spawn-adapter"],
    "deps": []
  }
]
```

### Deferred — in the design doc, not in implementation

Kept as recorded design, explicitly NOT scheduled (D6). Each names the
condition that would pull it in, so "later" is measurable rather than vague —
the same discipline `tsk-2t6` D9 already applied to its own gated piece:

| Deferred | Pull-in condition |
|---|---|
| `StructuredDispatchResult` + **confidence reader** | a real consumer exists that reads structured result/confidence (`fgos dispatch stats`, an attestation warning/gate reading confidence, a provider-compliance report, or a CI dispatch health check) |
| Artifact store + `ArtifactRef` | dispatch payloads demonstrably outgrow what a ref-free result can carry |
| AgentMessage envelope (full 11 types) | a real need for async `QUESTION`/`BLOCKER`/`REVIEW` between agents appears |
| Mailbox / Herdr protocol transport | telemetry from `herdr-spawn` shows stdout + git inference genuinely insufficient |

**No `confidence ladder` child exists in this cut, on purpose.** D5's
principle is untouched and still governs how results are read; what is
deferred is turning it into a telemetry migration. Building the write side
with no reader would reproduce `outcome:'unsignaled'` — produced at
`cli.mjs:546`, read by no production consumer to this day.

### Blast radius, counted rather than estimated

Derived by walking every child footprint and testing each path against the
working tree — an earlier hand-count in this plan was wrong in both
directions, so it is produced by script, not by eye:

| | Count | Paths |
|---|---|---|
| **New source** | **1** | `src/runner/dispatch/plan.mjs` |
| **New test** | **2** | `test/runner/egress-governance.test.mjs` · `test/runner/herdr-spawn-adapter.test.mjs` |
| **Edited existing** | **5** | `dispatch/cli.mjs` · `dispatch/resolve.mjs` · `dispatch/config.mjs` · `dispatch/transport.mjs` · `test/runner/dispatch.test.mjs` |

**3 new files, 5 touched, 8 distinct paths** — down from 11 new / 8 touched
under the superseded seven-child scope.

**One declared sibling overlap.** Pieces 0 and 1 both list
`src/runner/dispatch/cli.mjs`: piece 0 changes `decideExecutorCli` (~:685),
piece 1 adds the effective-egress fields to `logExecutorDispatch` (~:298).
They are disjoint at function level, but the overlap is declared rather than
hidden — both pieces are dependency-free by intent, so the gate should see
the collision and let a person decide whether to sequence them. Hiding it by
trimming a footprint would make the action promise work the footprint never
declared, which is how an overlap gate goes blind.

## Validating — reality gate, matrix, verdict

Run 2026-08-25 by `fgos-coding-validating`. Every row cites a real artifact;
no row is carried by plausibility language.

### Reality gate

| Dimension | Result | Evidence |
|---|---|---|
| Mode fit | **PASS** | `high-risk` is mechanically forced: two hard-gate flags (audit/security, external systems) still apply after D6's cut, and `fgos-routing`'s own rule is "any hard-gate flag → high-risk" |
| Repo fit | **PASS** | every cited path read directly: `cli.mjs:685` (`resolveExecutorIdForPurpose`), `resolve.mjs:322` (gate) and `:280` (cli-only throw), `transport.mjs:148` (`executor.adapter ?? DEFAULT_ADAPTER`), `config.mjs:364` (`EXECUTOR_CARRIES`), `cli.mjs:298` (`logExecutorDispatch`) |
| Assumptions | **PASS** | the one unproven assumption (that a Herdr pane can host a worker at all) was proven this pass — see matrix row 3 — rather than left standing |
| Smaller path | **PASS** | a smaller path was already taken this session: D6 cut 7 pieces → 3 and deferred four. Piece 0's `0b` is explicitly scoped to `decideExecutorCli` only. Going smaller still would drop `DispatchPlan`, which D1 locks |
| Proof surface | **PASS** | all three verifies are real runnable commands; piece 0's was executed as written against a worktree path and returned valid JSON (`{"mechanism":"unavailable","configured":false}` — today's bug, which is exactly what the fix must flip) |
| Impact-analysis posture | **PASS** | plan records `degraded`; re-checked live at this gate — `fgos tool query --capability impact-analysis --status present` returns `gitnexus: present`, but the index is stale (`7bb3231`). Posture matches reality, and the gap is named rather than dropped |

### Feasibility matrix

| # | Assumption | Risk | Proof required | Evidence found | Result |
|---|---|---|---|---|---|
| 1 | Routing `decide --for` through `resolveExecutorAndOverrides` changes only the intended outcome | high | run the current command; confirm the config it must read | `decide --for fgos-coding-implement` returns `{"mechanism":"unavailable","configured":false}` today, while `.fgos/config.json` carries `capabilities.fgos-coding-implement.prefer:"agy"` | **ACCEPTED** |
| 2 | The egress gate can be tightened without breaking a working executor | high | confirm the blind spot is real and has a live specimen | `resolve.mjs:322` tests only `executor.command` against `CLAUDE_CLI_COMMANDS`; executor `glm` keeps `command:"claude"` and reaches OpenRouter through `env` — it passes the gate today | **ACCEPTED** |
| 3 | A Herdr pane can actually host a dispatched worker, and results can be read back | medium | run the real CLI; confirm the primitives exist | `herdr` is on PATH; `herdr pane split --cwd <PATH> --env <K=V>` creates a pane, `send-text`/`send-keys` drive it, **`herdr pane wait-output --match/--regex`** waits for terminal output, `herdr pane read` reads it back. The `[DONE]`/`[BLOCKED]` tier maps directly onto `wait-output --regex` | **ACCEPTED — with constraint C1** |
| 4 | A Herdr pane's lifecycle cannot be mistaken for task truth | medium | an explicit test asserting it | test is specified in piece 2's own verify + action (D2's surviving hard constraint) | **ACCEPTED (as a required test, not a claim)** |
| 5 | Pieces 0 and 1 can both edit `cli.mjs` without colliding | low-med | measure the overlap mechanically | `footprintOverlapAmong` reports exactly one conflict, `p0 ↔ p1` on `cli.mjs`; the edits are function-level disjoint (`decideExecutorCli` ~:685 vs `logExecutorDispatch` ~:298) and the overlap is declared, not trimmed away | **ACCEPTED** |
| 6 | Blast-radius evidence is trustworthy | med | posture check | `degraded` — GitNexus present but stale, so the radius was built by grep cross-check. **Gap named, not dropped**: per `CLAUDE.md`'s degraded branch this proof is weak, and the repo has a confirmed false-negative precedent for this exact query shape | **ACCEPTED (weak, named)** |

### Constraints carried forward

**C1 — `herdr-spawn` must never reuse a pane.** `tsk-1nih` (open) documents
the live failure: `herdr pane run` is `send-text` + Enter, so it types into
whatever process currently holds the pane; since `tsk-1zq` dropped
`--autoClose`, a finished worker's pane keeps an idle interactive agent REPL
alive. Reusing such a pane delivers the next dispatch as a **chat message
into someone else's live session** — sharpest case being an item parked at
`awaiting-human` while nobody is looking at that pane. Piece 2's `action`
carries this constraint so the implementer cannot miss it. `tsk-1nih` stays
its own item; piece 2 must not silently absorb it.

### Gate outcome

`fgos gate-check --gate validateApprove --cost REVERSIBLE` returned
`canAutoApprove: false`. The blocking axis was identified rather than
guessed: the **hard-gate keyword floor**, hit by the word `audit` inside
piece 1's `action` (the dispatch audit event). The open-items scan was clean
(`None.`) and the cost verdict was this skill's own `REVERSIBLE` — so the
floor, not the judgment, is what asked. Per this skill's own rule the floor
may never be argued down, so a person was asked.

**Asked, and answered (2026-08-25):** what happens to `glm` when the gate
starts inspecting `env`. Evidence brought to the question: exactly **one**
executor is affected — `agy`/`codex`/`pi` already declare
`allowCrossProvider: true` (their commands were never `claude`, so the old
gate caught them), `claude`/`gitnexus`/`herdr` carry no env override, and no
executor declares `carries` at all today. **Decision: ship `glm`'s egress
declaration in the same change**, so the gate lands fail-closed with zero
breakage. Folded into piece 1's `action` above.

### Verdict

**READY WITH CONSTRAINTS** — constraint C1 above, plus the gate decision on
`glm` now recorded in piece 1's `action`. No reality-gate dimension
failed; every medium-or-higher assumption has accepted evidence; the one
weak proof (blast radius) is named rather than hidden.

## Outstanding questions

None.
