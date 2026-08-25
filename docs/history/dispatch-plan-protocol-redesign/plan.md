# plan.md — tsk-5x7: Dispatch semantic control plane + Herdr-ready orchestration

Mode: high-risk

**Lane derivation (mechanical, `fgos-routing`'s own Mode gate).** Flags that
actually apply, counted — 5, of which 2 are hard-gate:

| Flag | Applies? | Evidence |
|---|---|---|
| data model | **yes** | AgentMessage envelope, DispatchAssignment payload, `ArtifactRef`, `{status, confidence, evidence}`, extended `executor.dispatch` payload |
| audit/security | **yes (hard-gate)** | governance egress declaration — repo/prompt content leaving to a third-party backend must become auditable (D2 phase 8) |
| external systems | **yes (hard-gate)** | Herdr runtime, OpenRouter/agy/codex providers, MCP |
| public contracts | **yes** | `decide`/`execute` CLI output shape, `_shared/coding-worker-contract.md`, executor config schema |
| existing covered behavior | **yes** | D4 renames + D5 result semantics change behavior covered by `test/runner/dispatch.test.mjs` (319 tests green today) |
| auth · authorization · cross-platform · weak proof · multi-domain | no | no evidence in the item or the scouted code |

4+ flags AND two hard-gate flags ⇒ **high-risk**. A smaller lane would not
honestly cover this: `standard` assumes no hard-gate flag, and both the
egress-governance and external-runtime pieces are exactly that.

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
| D2 | Scope is the 8-phase "Dispatch semantic control plane + Herdr-ready orchestration". Hard constraint: Herdr never decides task/review/blocker/artifact state — only AgentMessage plus fgOS state transitions do. |
| D3 | Herdr-as-transport has a real consumer: the person watching an agent work on a real pane. Architecturally this means A no longer parents B, so the protocol may not assume "caller spawned the worker and reads its stdout". |
| D4 | Clean-break renames, justified by measured zero cost: `exec packet`→`DispatchAssignment`, `TASK`→`ASSIGN`, `<scope>#p<n>`→typed prefixes (`asgn_`/`msg_`/`run_`), `ArtifactRef` mandatory, prompt becomes a rendering *of* the assignment rather than the source contract. D18's six content slots keep their meaning, only their labels change. |
| D5 | structured-first + degradation-aware, never structured-only: three-tier ladder `reported` / `legacy-signal` / `inferred`, where the `inferred` tier reports `status:"UNKNOWN"` rather than pretending `SUCCESS`. Migration is gated on telemetry (accept all three → warn → per-provider enforcement → remove legacy). |

## Approach

**Chosen path: thread one plan object through the existing seams, then layer
protocol on top of it — never rewrite the mechanism.**

The decisive scout finding is that `mechanism.mjs` already implements exactly
D-ADR0026 rules 1-4 as narrowed by 0033
(`decideDispatchMechanism`, `mechanism.mjs:42`; `decideExecutorDispatchMechanism`,
`mechanism.mjs:82`). D1 therefore costs almost nothing to honor: the work is
to *wrap and explain* a decision that is already correct, not to re-derive
it. Everything else in the epic layers on top of that one object.

**Alternatives rejected:**

1. *Narrow-scope fix only (the two verified bugs, nothing else).* Rejected by
   D2 — and it would leave the real consumer (D3) unserved.
2. *A fresh `mechanism` decision layer inside the new planner.* Rejected by D1:
   it would create two sources of truth, doctrine in `docs/specs` and planner
   in code.
3. *structured-only V1, no fallback.* Rejected by D5 on live evidence: workers
   are third-party CLI agents, so the prompt is a soft contract fgOS cannot
   enforce.
4. *Herdr first, since it is the original motivation.* Rejected on dependency
   grounds — without AgentMessage plus the confidence ladder there is nothing
   to deliver over Herdr and no way to read a result back, which would force
   exactly the terminal-scraping D2/D3 exist to avoid.

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
barrel. Contained, single-subsystem — which is what makes a 6-way split safe.

**Risk map.** Every medium/high entry carries a proof point for
`fgos-coding-validating`, never a reassurance here.

| Risk | Level | Proof point carried to validating |
|---|---|---|
| Porting the four callers onto one plan object silently changes a routing outcome | **high** | Characterization first: assert today's exact `decide` output for all four selector forms BEFORE the port, then re-assert after |
| Sibling footprint overlap (measured, not guessed — see below) | medium | Both conflicts are already serialized by declared `deps`, which is the gate's own `sequence` suggestion |
| Removing/renaming the stdout token breaks a real worker mid-flight | medium | D5 forbids removal in V1; the legacy tier stays and is asserted by test |
| `attestation-guard.mjs` reads `executor.dispatch`; extending that payload could break it | medium | Its own tests must stay green while the payload gains `confidence` (additive only) |
| Herdr transport has no in-repo precedent | medium | Deliberately last; its verify demands a real pane plus a state-authority assertion |
| Egress gate change could refuse a currently-working executor | medium | `glm` is the live specimen: assert refuse-without-declaration AND pass-with-declaration |

**Files, in landing order:** `dispatch/plan.mjs` (new) → `dispatch/cli.mjs` →
`dispatch/resolve.mjs` + `config.mjs` → `dispatch/agent-message.mjs` (new) +
`prepare.mjs` → `dispatch/cli.mjs` (result normalization) → artifact store
(new) → Herdr transport (new) + `transport.mjs`.

**Ordering input, honestly reported.** `fgos graph tsk-5x7 --json` puts this
item on no critical path (`criticalPath` is a different 10-deep chain) and
returns an empty `topUnblock`, so there is no external unblock pressure to
optimize against — ordering below is driven purely by internal dependency.
`fgos graph --what-if` per candidate was **not** run: it compares existing
ids, and by design no child exists yet at this stage.

## Shape

Seven pieces, materialized by `fgos-coding-validating` at its single gate,
none created here. §7.2 of `DISCUSSION.md` is deliberately absent from the
specs below: `tsk-fli` is already that exact work (its `refs` was pointed at
`#task-execute-work` this session), so it is honored as an existing sibling
instead of duplicated as a child.

### Coverage of the source note's seven Findings

Written out explicitly because the first draft of this plan silently dropped
three of them — the omission originated in `DISCUSSION.md` §7, which mapped
onto D2's phases 1,1,2,4,5,6+7,8 and skipped **phase 3** without saying so.
Corrected 2026-08-25; `§7.8`/`§7.9` were added there for the same reason.

| Finding (source note) | Where it lands | Note |
|---|---|---|
| #1 `decide --for` misses `capabilities.*.prefer` | piece 0 | live-verified bug |
| #2 adapter port not really open (`via:"api"` test-level only) | **piece 3** | was dropped in the first draft; it is a **hard blocker** for piece 6 |
| #3 cross-provider governance inspects the wrong thing | piece 1 | live-verified gap (`glm`) |
| #4 MCP is a hand-back, not a peer dispatch target | **deferred**, §7.9 | the source note itself calls this "hợp lý cho V1" |
| #5 protocol pinned to prompt/stdout | pieces 2 + 3 | piece 2 makes the prompt a renderer; piece 3 opens the protocol layer |
| #6 two orchestration paths not unified | piece 0 | all four callers port onto one plan object |
| #7 workflow speed | **deferred**, §7.9 | the note's own measurements put the bottleneck in subprocess/git/worktree/pick-return, not in the dispatch protocol — mixing it in would blend two unrelated kinds of work |

**Why #2 is a blocker and not a nicety.** `resolveExecutorConfig`
(`resolve.mjs:280-286`) throws outright when an executor declares
`invocations` with no `via:"cli"` entry: *"executor ... declares
'invocations' but none is dispatchable via 'cli' ... resolveExecutorConfig
only ever spawns a cli invocation"*. A `via:"herdr"` executor is therefore
structurally undispatchable today, so the Herdr piece cannot function until
piece 3 lands — which is why piece 6 now declares `deps: [2,3,4]`.

`deps` are integer indices into this same array, pointing strictly backwards
(`src/intake/plan.mjs:293` enforces `d < index`), so array order is the
dependency order:

```json
[
  {
    "title": "DispatchPlan canonical object + fix decide --for reading capabilities.prefer",
    "verify": "node src/runner/dispatch.mjs decide --for fgos-coding-implement --dir \"$PWD\" | grep -q '\"executorId\":\"agy\"' && node --test test/runner/dispatch.test.mjs",
    "action": "Per D1, TWO ACCEPTANCE LAYERS, done in this order so a green proof lands early instead of riding on the whole refactor. (0a) Fix the live behaviour first: cli.mjs:685's decide --for calls resolveExecutorIdForPurpose and therefore never reads capabilities.<name>.prefer via resolveExecutorAndOverrides — route it through the latter so `decide --for fgos-coding-implement` returns executorId agy / out-of-process / configured:true. Land that with characterization tests pinning today's output for all four selector forms, written BEFORE the change. (0b) Only then add src/runner/dispatch/plan.mjs exposing compileDispatchPlan(), which CALLS the existing decideDispatchMechanism/decideExecutorDispatchMechanism (mechanism.mjs:42,82) rather than re-deriving any routing rule, and packages selector/caller/mechanism/executorId/capability/invocation/model/governance(placeholder, filled by piece 1's own work)/reasonCodes into one object; then port decideExecutorCli, executeExecutorCli, spawnWorker, fanoutBatchExecutorCli and scripts/dispatch-decide-hook.mjs onto it. 0a is a behaviour fix at low risk; 0b is the structural port at high risk — keeping them separable means a rollback of 0b never re-breaks 0a.",
    "footprint": ["src/runner/dispatch/plan.mjs", "src/runner/dispatch/cli.mjs", "src/runner/dispatch/mechanism.mjs", "scripts/dispatch-decide-hook.mjs", "test/runner/dispatch.test.mjs"],
    "kind": "feature",
    "risk": "heavy",
    "refs": ["docs/history/dispatch-plan-protocol-redesign/DISCUSSION.md#task-dispatch-plan"],
    "deps": []
  },
  {
    "title": "Governance: replace command!=claude test with declared egress metadata",
    "verify": "grep -q 'egress' src/runner/dispatch/resolve.mjs && node --test test/runner/egress-governance.test.mjs && node --test test/runner/dispatch.test.mjs",
    "action": "Per D2 phase 8, replace the resolve.mjs:322 gate — which inspects only executor.command against CLAUDE_CLI_COMMANDS and is therefore blind to an env override — with a declared-egress check carrying providerFamily plus egress {kind, target, content}. DELIBERATELY DEPENDENCY-FREE: this is a live policy hole, not a vocabulary refactor, so it must not sit behind the DispatchPlan port. It needs only fields that already exist today — executor.providerModel, invocations[].command, invocations[].env, allowCrossProvider, carries — and piece 0 folds its result into plan.governance afterwards rather than the other way round. Reuse the ALREADY-BUILT EXECUTOR_CARRIES enum (config.mjs:364, enforced at resolve.mjs:243-258) as the vocabulary for egress content instead of inventing a parallel enum, and record the real spawned command alongside the self-declared provider label. Cross-provider stays first-class and permitted; only undeclared or self-contradicting egress fails. Live specimen is executor glm, which keeps command:\"claude\" while routing to OpenRouter via env. Assertions land in their OWN test file, not in dispatch.test.mjs, so this piece shares no footprint with piece 0 and is genuinely parallel-safe.",
    "footprint": ["src/runner/dispatch/resolve.mjs", "src/runner/dispatch/config.mjs", "test/runner/egress-governance.test.mjs"],
    "kind": "feature",
    "risk": "heavy",
    "refs": ["docs/history/dispatch-plan-protocol-redesign/DISCUSSION.md#task-governance-egress"],
    "deps": []
  },
  {
    "title": "AgentMessage V1 envelope + DispatchAssignment payload, prompt becomes a renderer",
    "verify": "node --test test/runner/dispatch.test.mjs && node --test test/runner/agent-message.test.mjs",
    "action": "Per D4, add the AgentMessage V1 envelope (finite message types ASSIGN/ACK/PROGRESS/QUESTION/ANSWER/BLOCKER/RESULT/REVIEW_REQUEST/REVIEW_RESULT/CANCEL/ERROR) with a DispatchAssignment payload carrying assignment_id/origin/objective/inputs/scope/constraints/deliverable/return_contract, and typed id prefixes (asgn_/msg_/run_) replacing the never-built <scope>#p<n> shape. Keep the six content slots D18 of tsk-2t6 locked, relabelled only. Demote the existing worker prompt to a renderer over the assignment so buildPrompt output stays byte-identical for the legacy path, and add a validator that refuses an assignment missing assignment_id or return_contract.",
    "footprint": ["src/runner/dispatch/agent-message.mjs", "src/runner/dispatch/prepare.mjs", "test/runner/agent-message.test.mjs"],
    "kind": "feature",
    "risk": "heavy",
    "refs": ["docs/history/dispatch-plan-protocol-redesign/DISCUSSION.md#task-agent-message"],
    "deps": []
  },
  {
    "title": "Protocol abstraction: invocation.protocol field + handler registry, open resolve to non-cli invocations",
    "verify": "node --test test/runner/protocol-registry.test.mjs && node --test test/runner/dispatch.test.mjs",
    "action": "Per D2's phase 3 and D4's demotion of the prompt to a renderer, add a `protocol` field to invocations[] plus a handler registry in a new src/runner/dispatch/protocol.mjs, so prompt-stdout-v1 becomes ONE protocol rather than the only one. Critically, this piece also opens resolveExecutorConfig, which today THROWS at resolve.mjs:280-286 whenever an executor declares invocations with no via:\"cli\" entry — that throw is what makes a via:\"herdr\" executor structurally undispatchable and therefore hard-blocks the Herdr piece. This closes Finding #2 of the source note (via:\"api\" and httpAdapter exist but production resolve only ever selects via:\"cli\"). SCOPE IS DELIBERATELY THIN, and staying thin is part of the acceptance: ship exactly the protocol field, the registry, a prompt-stdout-v1 handler that keeps today's cli path byte-identical, and REGISTERED-BUT-EMPTY slots for the mailbox/herdr protocols. Do NOT build a transport ecosystem here — json-stdout-v1, http-json-v1 and mcp-tool-v1 handlers get real bodies only when a consumer actually needs them. Herdr needs a protocol floor, not a framework.",
    "footprint": ["src/runner/dispatch/protocol.mjs", "src/runner/dispatch/resolve.mjs", "src/runner/dispatch/transport.mjs", "src/runner/dispatch/config.mjs", "test/runner/protocol-registry.test.mjs"],
    "kind": "feature",
    "risk": "heavy",
    "refs": ["docs/history/dispatch-plan-protocol-redesign/DISCUSSION.md#task-protocol-abstraction"],
    "deps": [0, 1, 2]
  },
  {
    "title": "Three-tier confidence ladder on every dispatch result",
    "verify": "node --test test/runner/dispatch.test.mjs && node --test test/runner/confidence-ladder.test.mjs",
    "action": "Per D5, normalize every executor result into {status, confidence, evidence} across three tiers: a structured RESULT/BLOCKER gives confidence \"reported\"; the existing stdout token path (cli.mjs:541-542) gives \"legacy-signal\"; and git-state/exit-code inference gives \"inferred\" WITH status UNKNOWN rather than a pretended SUCCESS. Do not remove the legacy token in this piece — D5 gates removal on telemetry. Extend logExecutorDispatch's executor.dispatch payload (cli.mjs:298-301) additively with confidence, keeping attestation-guard.mjs — a real live consumer of that event — green. Follow the posture attestation-guard already proves correct: halt on contradiction, skip on absence.",
    "footprint": ["src/runner/dispatch/cli.mjs", "test/runner/confidence-ladder.test.mjs"],
    "kind": "feature",
    "risk": "heavy",
    "refs": ["docs/history/dispatch-plan-protocol-redesign/DISCUSSION.md#task-confidence-ladder"],
    "deps": [0, 2]
  },

  {
    "title": "Artifact store V1 under .fgos/artifacts with ArtifactRef",
    "verify": "node --test test/runner/artifact-store.test.mjs && node --test test/runner/dispatch.test.mjs",
    "action": "Per D4's mandatory ArtifactRef and D2 phase 5, add a filesystem-backed artifact store at .fgos/artifacts/<id>/ so a message carries a ref rather than heavy content, and dispatch inputs/results/logs/test reports become referenceable artifacts. Greenfield: artifact://, ArtifactRef and runId currently have zero hits in src/. The state store stays the sole authority on work status — an artifact never implies a status change.",
    "footprint": ["src/runner/artifact-store.mjs", "test/runner/artifact-store.test.mjs"],
    "kind": "feature",
    "risk": "standard",
    "refs": ["docs/history/dispatch-plan-protocol-redesign/DISCUSSION.md#task-artifact-store"],
    "deps": [2]
  },
  {
    "title": "Herdr transport + filesystem mailbox, with Herdr barred from deciding state",
    "verify": "node --test test/runner/herdr-transport.test.mjs && node --test test/runner/dispatch.test.mjs",
    "action": "Per D3 and D2 phase 6-7, add a Herdr transport adapter delivering an AgentMessage into a Herdr-managed pane/session and reading the result back through a .fgos/messages/{inbox,outbox,dead-letter} mailbox, so the caller no longer has to parent the worker process. Per D2's hard constraint, assert in test that a Herdr runtime signal alone NEVER changes task status, review outcome, blocker resolution or artifact acceptance — only an AgentMessage plus an fgOS state transition does. Deliberately last despite being the motivating use case, because it needs both the envelope and the confidence ladder to exist first.",
    "footprint": ["src/runner/dispatch/transport-herdr.mjs", "src/runner/dispatch/transport.mjs", "test/runner/herdr-transport.test.mjs"],
    "kind": "feature",
    "risk": "heavy",
    "refs": ["docs/history/dispatch-plan-protocol-redesign/DISCUSSION.md#task-herdr-transport"],
    "deps": [2, 3, 4]
  }
]
```

### Blast radius, counted rather than estimated

Derived by walking every child footprint and testing each path against the
working tree — an earlier hand-count in this plan's own review was wrong in
both directions, so it is now produced by script, not by eye:

| | Count | Paths |
|---|---|---|
| **New source** | **5** | `dispatch/plan.mjs` · `dispatch/agent-message.mjs` · `dispatch/protocol.mjs` · `dispatch/transport-herdr.mjs` · `runner/artifact-store.mjs` |
| **New test** | **6** | `agent-message` · `protocol-registry` · `confidence-ladder` · `artifact-store` · `egress-governance` · `herdr-transport` |
| **Edited existing** | **8** | `dispatch/{cli,config,mechanism,prepare,resolve,transport}.mjs` · `scripts/dispatch-decide-hook.mjs` · `test/runner/dispatch.test.mjs` |

**11 new files, 8 touched, 19 distinct paths** — every one inside
`src/runner/dispatch/`, `src/runner/`, `scripts/` or `test/runner/`, matching
the grep-established boundary above. No file outside that boundary is
touched by any piece.

**Pre-flight, run against the real engine rather than assumed.** The block
above was fed through the engine's own `resolveCallerPlanVerdict`/
`normalizeChild` (`src/intake/plan.mjs`) before this plan was committed:
verdict resolves to `decompose`, all six children normalize, and `deps`
resolve to `[] / [0] / [0] / [2] / [2] / [2,3]`. The D-ID citations validate
because `readLockedContext` reads `CONTEXT.md` **and `plan.md`** — which is
why the "## Locked decisions" table above lives in this file (there is no
`CONTEXT.md`; discovery returned `clear` and skipped `exploring`).

`footprintOverlapAmong` was likewise run ahead of the gate. Two real
conflicts exist, both already serialized by the declared `deps` above —
which is exactly the `sequence` resolution the gate itself suggests:

| Pair | Shared path | Handled by |
|---|---|---|
| piece 0 ↔ piece 4 | `src/runner/dispatch/cli.mjs` | piece 4 `deps: [0,2]` — `[0]` added specifically because making piece 2 dep-free removed the old transitive ordering |
| piece 1 ↔ piece 3 | `src/runner/dispatch/resolve.mjs`, `config.mjs` | piece 3 `deps: [0,1,2]` — the probe caught this one unserialized on its first run |
| piece 3 ↔ piece 6 | `src/runner/dispatch/transport.mjs` | piece 6 `deps: [2,3,4]` |

The former `piece 0 ↔ piece 1` conflict on `test/runner/dispatch.test.mjs` is
**gone**, not merely sequenced: piece 1's assertions moved into their own
`test/runner/egress-governance.test.mjs`. That is what makes piece 1
genuinely dependency-free rather than dependency-free on paper while still
colliding at the gate.

### Three dep-free foundation branches

Pieces **0, 1 and 2 all carry `deps: []`** and can run in parallel. Piece 1
is dep-free by deliberate policy choice, not convenience: the egress hole is
a live security/policy defect (executor `glm` reaches OpenRouter through
`env` while the gate inspects `command`), and parking a live defect behind a
large structural refactor is the wrong trade. It needs only fields that
already exist — `providerModel`, `invocations[].command`,
`invocations[].env`, `allowCrossProvider`, `carries` — and piece 0 folds its
outcome into `plan.governance` afterwards, not the reverse.

**Existing sibling, not a child:** `tsk-fli` covers `execute --work <id>`
(§7.2). It is not blocked by this split and can land independently; the only
coupling is that whichever of `tsk-fli` and piece 0 lands second should read
the other's shape first.

**Two open items this plan touches, reported rather than silently worked
around:**

- `tsk-4wo` asserts `test/runner/dispatch.test.mjs` is red on main and that
  this blocks 18 open items and every `sync-root`. Measured this session:
  **319 pass, 0 fail**, and the stale test it names no longer exists in the
  file. Its premise is dead; it is a close/supersede candidate, not work.
- `tsk-492` asserts nothing reads the `executor.dispatch` event. Measured:
  `attestation-guard.mjs` reads it. Piece 3 extends exactly that payload, so
  whoever picks up `tsk-492` needs the corrected premise.

## Outstanding questions

None.
