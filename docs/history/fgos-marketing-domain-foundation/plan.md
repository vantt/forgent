# fgos-marketing-domain-foundation — plan

Mode: high-risk — 4 flags (data model: work item gains a `holder` axis and
new event verbs; existing covered behavior: stage-fsm/frontier/replay are
test-covered and change; public contracts: fgos verb surface + event schema
extend; multi-domain: the change is the domain mechanism itself). No
hard-gate flag (no auth, no data loss, no audit/security, no external
provider, no validation removed). Lane derived via `fgos-routing`'s
Mode-gate table under this skill's direct-entry fallback — no lane was
handed off (entry came from `fgos-coding-shaping` → exploring).

Decisions this plan honors: **D1–D12**, `CONTEXT.md`. Design narrative:
`DISCUSSION.md` §6; quick reference: `design-distill.md`.

impact-analysis: **degraded** — GitNexus registered and `present`
(`fgos tool query --capability impact-analysis --status present`, run this
session) but its index is behind HEAD (analyze hook reports stale). Every
blast-radius claim below is backed by direct reads (file:line cited) and
`rg`, never the graph.

---

## Approach

Three pieces on the `coding` domain first (D2); marketing follow-ons are
submitted as new items after the harness proves out. Order is a design
dependency, not a guess: piece 1 introduces the `holder` axis that piece 2's
workflow lookup must not conflict with, and both touch
`workflow-stage-graphs.mjs`.

1. **Role axis + `handoff` verb** (D1, D3, D4, D5, D8) — the engine change.
2. **Workflow multiplicity, mechanism-first** (D7 as amended by D7a) —
   land the hierarchy and selector with `feature` alone registered.
3. **Task-spec A-lite** (D6, D9, D10, D12) — contract files + `claims` on
   agent definitions. Docs/config-shaped; can run parallel to 1–2.

Rejected alternatives, each traceable:
- Marketing-first — rejected by D2 (user decision).
- Child-item-per-review-round / status-FSM-loop encodings of ping-pong —
  rejected in the round-3 analysis behind D1 (item-count explosion;
  role×status product blow-up).
- **`holder` on `domainFields.coding` instead of a top-level field** —
  rejected: `domainFields` (`work.mjs:698` `validateDomainFields`, schema
  declared per domain as `fieldSchema`) is deliberately *domain-opaque
  payload the engine never interprets*; `holder` must be read by the guard,
  the frontier and the router, exactly like `stage`. Top-level field,
  lazy-default, same shape `domain` itself uses (`work.mjs:190-200`).
- A runtime workflow entity — rejected by D7's workflow-vs-template split.
- Building the signal bus now — deferred (`{#task-signal-bus}`, YAGNI).

### Draft roleGraph for coding (D1, reviewed with the user)

```js
roleGraph: {
  roles: ['implementer', 'researcher', 'reviewer', 'helper', 'human-advisor'],
  defaultRole: 'implementer',
  callstackCap: 3,
  edges: {
    exploring: [
      { from: 'implementer', to: 'human-advisor', reason: 'advise',  mode: 'async' }, // = fgos ask/answer
      { from: 'implementer', to: 'researcher',    reason: 'consult', mode: 'sync'  }, // = fgos-researching
    ],
    planning: [
      { from: 'implementer', to: 'researcher',    reason: 'consult', mode: 'sync'  },
      { from: 'implementer', to: 'human-advisor', reason: 'advise',  mode: 'async' },
    ],
    executing: [
      { from: 'implementer', to: 'researcher',    reason: 'consult', mode: 'sync'  },
      { from: 'implementer', to: 'helper',        reason: 'assist',  mode: 'sync'  }, // = subagent fanout
      { from: 'implementer', to: 'reviewer',      reason: 'review',  mode: 'async' }, // = return→awaiting-approval
      { from: 'implementer', to: 'human-advisor', reason: 'advise',  mode: 'async' },
      { from: 'reviewer',    to: 'researcher',    reason: 'consult', mode: 'sync'  },
      { from: 'reviewer',    to: 'human-advisor', reason: 'advise',  mode: 'async' },
    ],
  },
}
```

Anchor: today's coding flow maps 1-1 onto this graph — this piece names and
records what already runs; it changes no existing behavior. `discovery`
carries no edges (machine-only pass), matching its own `skillMap` owner
`fgos-coding-discovering`.

---

## Setup / config / doctor gate (AGENTS.md) — analysis per piece

Asked of every piece: *does this add a config default, env var, or infra
dependency (a file it expects to exist, a tool it shells out to, a directory
it assumes writable)?*

**Piece 1 — no config, no doctor entry.** The `callstackCap` lives in the
`DOMAINS` registry (frozen code, per-domain), NOT in `.fgos/config.json`.
Rationale: the shared-config route would ship a present-but-unarmed value,
the exact misconfiguration class `checkWorkerSlotCeilingUsable`
(`registrations.mjs`, workerSlots entry ~line 975) was written to catch
after `"8"`/`8.5`/`0` all silently disabled the cap. A per-domain code
constant has no such failure mode and needs no operator knob until someone
asks for one (YAGNI). Nothing else in this piece touches a file, tool or
directory that must pre-exist. A malformed `roleGraph` is a programming
error caught by unit tests, not a runtime environment condition —
deliberately NOT a doctor check (doctor diagnoses environments, never code).

**Piece 2 — no config, no doctor entry.** Workflows are registry data, same
as `stages`/`transitions` today. `checkConfigNotStale`
(`registrations.mjs:377`) is registry-driven over
`CONFIG_DEFAULT_REGISTRATIONS`; adding no registration means no stale-config
noise for existing installs.

**Piece 3 — YES, this is where the gate bites (two new doctor checks).**
Task-spec files are a genuine new infra dependency: stage-skills will read
`docs/task-specs/<domain>/<spec>.md` as read-first material at runtime, so a
missing file degrades a skill silently. Register, per AGENTS.md:

- `registerCheck({ id: 'task-specs-resolve', ... })` — for every
  `skillMap` entry that names a task-spec, assert the file exists; report
  the missing paths. Read-only (RUL9: doctor never writes).
- `registerCheck({ id: 'agent-claims-resolve', ... })` — for every
  `agents/*.yaml` carrying `claims:`, assert each named task-spec exists.
  Catches a typo'd claim, which would otherwise make an agent-type
  permanently ineligible for work with no error anywhere.

Both are `passed: false`-style actionable checks (same class as
`config-not-stale`), NOT informational-posture checks. Still **no
`registerConfigDefault`** in any piece — no new key in `.fgos/config.json`,
so `fgos setup` behavior and every existing install are untouched.

A third candidate — a `registerFix` that scaffolds missing task-spec stubs
— is deliberately **not** in scope: `--fix` writes, and a stub contract is
worse than an absent one (it looks authoritative while saying nothing).

**Why these two checks are the right size (D13).** They are the
*declaration-schema* family — validating static declarations a person
wrote, cheap to fix by hand. The *artifact-schema* family (cockpit ships
~33: brief/slot/calendar/persona/brand-profile, JSON-Schema draft-07,
`_meta.version` + ADR refs, enforced by `validate-dispatch-brief.py` at
the pre-dispatch chokepoint) is deliberately out of scope here: coding's
artifacts are prose (`CONTEXT.md`, `plan.md` — the engine anchors on two
regexes), not structured data, so schema value is low; that family lands
with the marketing port. When it does, D13 fixes its shape in advance:
harness supplies validator + chokepoint (validate BEFORE dispatch so no
orphan child work is created, machine-readable structured errors so an
agent can self-repair, always a soft path recording a reason rather than a
hard block); the schemas themselves stay domain data beside the
task-specs.

---

## Piece 1 — Role axis + `handoff` verb

### Files and exact changes

| File | Layer | Change |
|---|---|---|
| `src/state/workflow-stage-graphs.mjs` | kernel | Add frozen `roleGraph` to `DOMAINS.coding` (shape above). Add exported helpers `roleGraphFor(domain)`, `legalCallEdges(domain, stage, fromRole)` next to `skillForStage`(:566) — same null-safe "never throws, returns null/[] when the domain declares none" shape every sibling helper uses. |
| `src/state/handoff.mjs` | **domain** (NEW) | Pure guard: `evaluateHandoff({ domain, stage, fromRole, toRole, reason, openCallDepth, cap })` → `{ ok: true }` or `{ ok: false, refusal, legalEdges }`. **No fs, no config read** — `cap`/`openCallDepth` are injected by the caller, the same purity contract `worker-slots.mjs`'s `hasWorkerSlotRoom({ ceiling })` already keeps (:150). Layer `domain` matches its closest sibling `stage-fsm.mjs`; it may import kernel (`workflow-stage-graphs.mjs`) legally. |
| `docs/architecture-manifest.json` | — | **Add the row** `"src/state/handoff.mjs": "domain"`. Without it `test/architecture.test.mjs` fails on "đủ sổ" (one-to-one file↔row) — a hard, easily-missed gate. |
| `src/state/work.mjs` | kernel | `holder` as optional top-level field, lazy default = `roleGraph.defaultRole` when the domain declares one, else absent. Validate in `validateDomainFields`' neighborhood (new `validateHolder(work, domain)`): value must be one of `roleGraph.roles`; a domain with no `roleGraph` must carry no `holder`. **No `SCHEMA_VERSION` bump** — optional-additive, same treatment `domain` itself got (:190-200); confirm against RUL11 at validating. |
| `src/state/events.mjs` / `src/state/replay.mjs` | kernel / domain | Two new event verbs folded in `foldEvent`: `work.handoff` (async — sets `item.holder`, appends to a lazy `view.callThreads[id]`) and `work.call-summary` (sync — appends to the same lazy structure, **never touches `holder`**). Both keys LAZY (never present until first such event), the exact pattern `view.outcomes` uses (`replay.mjs:383-393`) so any log without them replays byte-identical. |
| `src/state/store.mjs` | infra | `recordHandoff(dir, {...})` / `recordCallSummary(dir, {...})` — same held-lock critical section as `moveWork`/`moveStage` (:816-824): fresh lookup → guard decision (`handoff.mjs`, pure) → append inside one `withEventsLock`. **`holder` must NOT be added to `EDITABLE_FIELDS`** (:275) — it moves only through the handoff door, exactly as `stage`/`status`/`domain` do today. |
| `src/cli/command-registry.mjs` + `bin/fgos.mjs` | entry | `fgos handoff <id> --to <role> --reason <advise\|assist\|review\|consult> [--mode async\|sync] [--note ...]`; `touchesState: true`, `requiresExistingStore: true`, modeled on the `ask` entry (:320-340). A refused handoff exits non-zero and prints the legal edges. |
| `docs/specs/work-state.md` | — | New rules (next free ids: **RUL64+**, current max RUL63): the holder axis, the call/pass taxonomy, the async-changes-holder invariant, the soft-gate reason requirement. |
| `CHANGELOG.md` | — | `## [Unreleased]` entry — user-visible new verb. |

### Soft-gate reason (D5), scoped honestly

Only the reason *requirement* on an intra-item backward stage move is in
this piece. Enumerating and enforcing every hard gate is NOT: `approve`/
`merge`/terminal-status one-way behavior already exists (CTR005 and the
status FSM), so this piece adds the missing half (record the reason) and
leaves the existing half untouched.

### Tests (new file `test/state/handoff.test.mjs` unless noted)

1. legal call `implementer --review--> reviewer` at `executing` → ok; event
   folds; `holder` becomes `reviewer`.
2. **off-graph refusal**: `helper --review--> reviewer` → refused, and the
   refusal payload *lists the legal edges for helper* (the "chặn và dạy"
   contract, not merely a boolean).
3. **wrong-stage refusal**: `review` attempted at `exploring` → refused with
   exploring's own legal edges.
4. nested call at depth 2 → ok; at cap 3 → refused (cap injected, proving
   purity).
5. sync `call-summary` → holder unchanged; event present. **The D8
   invariant test**: assert no code path other than an async handoff can
   change `holder`.
6. round-trip: async call → return → holder back to caller.
7. domain with no `roleGraph` (`synthetic` fixture) → handoff refused as
   "domain declares no roleGraph", never a crash; `holder` absent stays
   valid (`test/state/work.test.mjs`).
8. **`test/state/backward-compat.test.mjs`** — the committed immutable
   `phase1-events.jsonl` fixture replays byte-identically (no `callThreads`
   key, no `holder`) after the new fold cases exist. This is the
   replay-from-zero (L3) proof.
9. `test/cli/fgos-handoff.test.mjs` — CLI surface: success JSON envelope,
   refusal exit code + legal-edge output, `--dir` behavior from a worktree.
10. `test/architecture.test.mjs` — passes with the new manifest row (proves
    the row was not forgotten).

---

## Piece 2 — Workflow multiplicity, mechanism-first (D7, D7a)

**Scope, as amended (D7a).** Only ONE workflow is registered: `feature`,
carrying today's graph byte-for-byte, with every `kind` mapping to it. The
piece therefore proves the *mechanism* (domain → N workflow → item,
selected by `kind`) while changing zero behavior for zero items — no new
graph shape exists to be wrong about, so the migration risk that made this
the gate question is structurally absent, not merely mitigated.

Why the shapes wait (evidence gathered at the gate): `bug` is 363 of 768
real items (47%), so a wrong `bugfix` shape would strand nearly half the
backlog on stage edges that do not exist — and this repo already carries
the price tag of that mistake (`decompose` survives as a drain-only alias;
`scripts/migrate-clarify-split.mjs` migrated 90 items when `clarify` was
retired). Shapes get their own item once the mechanism is live and real
traffic shows which kinds actually strain.

### Files and exact changes

| File | Change |
|---|---|
| `src/state/workflow-stage-graphs.mjs` | `DOMAINS.coding` gains `workflows: { feature }`, `defaultWorkflow: 'feature'`, `workflowFor: {}` (empty: every kind folds to the default). New helper `resolveWorkflow(domain, kind)` → the workflow object, folding an unknown/absent kind to `defaultWorkflow`, mirroring `resolveDomainName`'s never-throw fold. |
| `docs/specs/work-state.md` | RUL65: the hierarchy + selector + default fold, and why the hot path is untouched (below). |

**Deviation from the plan as originally written (recorded here, not
silently): `workflows.feature.{stages,stepMap,transitions}` are
implemented as the EXACT SAME object references as
`domain.stages`/`stepMap`/`transitions` (`coding.workflows.feature.stages
=== coding.stages`, checked with `===`, not merely `deepEqual`) — achieved
by restructuring `DOMAINS.coding` from an inline frozen literal into a
named `codingDomain` built in two steps (fields, then `workflows`
pointing at the same fields, then frozen) rather than duplicating ~130
lines of heavily-commented array/object literals verbatim.**

Because of that reference identity, `src/state/stage-fsm.mjs`,
`frontier.mjs`, `intake/discovery.mjs`, and `intake/plan.mjs` are
**deliberately left unwired** — the plan's original table called for
routing their reads through `resolveWorkflow`, but with exactly one
workflow registered, `domain.transitions` and
`resolveWorkflow(domain, kind).transitions` are the identical object, so
rewiring today changes zero behavior and only adds edit risk to modules
this repo already tests heavily (`stage-fsm.mjs` and `work.mjs`'s
`validateWorkShape` sit on every single `add`/`edit`/`move`). Wiring the
hot path is real, warranted work — it becomes necessary, and only then
safe to do with something to actually route between, once a second
workflow (`bugfix`/`lightweight`, D7a's own deferred follow-on) exists.
This is the same "reversible option, take it and carry on" discipline
`fgos-coding-validating`'s own D5 already applies to a gate question — here
applied to an implementation choice instead.

### Tests (`test/state/workflow-multiplicity.test.mjs`, 7 tests)

1. **Identity proof (the whole point of this piece)**: `===`, not merely
   `deepEqual` — `coding.workflows.feature.stages === coding.stages`, same
   for `stepMap`/`transitions`.
2. `coding.workflows` has exactly one key (`feature`); `workflowFor` is
   `{}`.
3. `resolveWorkflow(coding, 'bug')` resolves to `feature` — the selector
   runs for real today, it simply has one destination.
4. Unrecognized/absent `kind` folds to the default, never throws.
5. A domain with no `workflows` declared (`synthetic`) returns `undefined`
   from `resolveWorkflow`, never throws.
6. `resolveWorkflow` never throws on a null/undefined domain.
7. The whole `coding` domain, `workflows` included, stays deeply frozen.

Full `npm test` (3364 → still 3364+7, all green) is the proof that leaving
`stage-fsm.mjs`/`frontier.mjs`/`discovery.mjs`/`plan.mjs` untouched broke
nothing — the existing suites for all four already assert current coding
behavior end to end.

---

## Piece 3 — Task-spec A-lite (D6, D9, D10, D12)

### Files and exact changes

- `docs/task-specs/coding/*.md` — ~13 specs. **Priority order** (write the
  first group first; the rest may follow in a later item if scope pressure
  appears): (a) ≥2 real executors — `review-item`, `approve-merge`;
  (b) engine-parsed contracts — `shape-plan` (the literal `Mode:` line
  `passThroughModeMatch` regexes, `src/intake/plan.mjs`), `lock-decisions`
  (the `## Outstanding questions` heading `hasOpenItems` regexes,
  `src/state/gate-bypass.mjs`); (c) the remainder —
  `judge-ambiguity`, `implement-item`, `fix-verify-red`, `compound-learn`,
  `validate-plan`, `audit-security`, `resolve-question`,
  `scout-blast-radius`, `scoped-subtask`, `answer-question`.
- Each spec: Input / Output / Gates / Verify-template / **`## Collaboration`
  (D9, mandatory)** — the trigger table (khi nào gọi, reason, tới position,
  bóng về mang gì). Content is *migrated* from where it already lives
  implicitly (e.g. the material/grounded/answerable filter in
  `fgos-coding-exploring`, `fgos-researching`'s own trigger sentence), not
  invented.
- `agents/<name>.yaml` — **`claims: [<task-spec>...]`** goes in fgOS's own
  platform-agnostic definition (`agents/`, projected to `.claude/agents/`
  by `scripts/project-agents.mjs`), never hand-written into the projected
  adapter file. Note: that schema already carries `role:` and
  `decision_boundary.can_decide/must_escalate` — `claims` is the machine-
  checkable narrowing of the same idea, so the projection script must learn
  to pass it through.
- `src/setup/registrations.mjs` — the two `registerCheck` entries from the
  gate analysis above.
- `docs/how-to/write-a-task-spec.md` — authoring guide.
- Skills stay unchanged in this piece except a one-line "Contract: read
  `docs/task-specs/...`" pointer; **moving contract text out of skill prose
  is deliberately deferred** — that is a behavior-risky edit to files the
  engine regexes (the tsk-59a class of breakage), and it earns its own item.

Not in scope (D12, explicit): no roster file, no humans registry, no
agent-pools. Worker-slots, runner/dispatch and the pull-door verbs already
cover concurrency, spawn and human authority.

### Tests

1. `test/setup/checks.test.mjs` — the two new checks: pass when every
   referenced spec exists; fail with the missing paths listed when one is
   removed (run against a temp fixture tree, never the real repo).
2. A projection test that `claims` survives `agents/*.yaml` →
   `.claude/agents/*.md` (extend the existing agent-definition test).
3. Skill-prose verify shape: any skill file touched follows
   `docs/how-to/write-verify-for-a-skill-prose-change.md`
   (`npm test && POSITIVE && NEGATIVE`).

---

## Risk map

| # | Component | Risk | Proof at validating/implement |
|---|---|---|---|
| R1 | Event-schema extension vs replay-from-zero (L3) | **High** | `backward-compat.test.mjs` immutable fixture replays byte-identical; lazy-key pattern asserted |
| R2 | Workflow lookup in stage-fsm/frontier | **High → Medium after D7a** (only one workflow registered, so no new graph can be wrong) | Identity proof: pre-change frozen arrays deep-equal the resolved `feature` arrays; full `npm test` |
| R3 | `holder` leaking into `EDITABLE_FIELDS` / bypass paths | Medium | Test 5 of piece 1 (invariant: only async handoff changes holder) |
| R4 | Missing manifest row for the new file | Medium | `test/architecture.test.mjs` (already exists — just must be run) |
| R5 | Doctor checks reading the real repo instead of a fixture | Medium | Temp-tree fixture in the check tests; RUL9 read-only |
| R6 | Guard refusal text unhelpful | Low | Refusal asserts the legal-edge list, not just `false` |
| R7 | Callstack cap counting stale open calls | Medium | Depth derived by replay over the call-thread, not a counter field |

---

## Concrete cases worth proving

- **Empty/boundary**: item with no `holder` (every existing item) behaves
  exactly as today; domain with no `roleGraph` (`synthetic`, `triage`) never
  sees a handoff edge; unknown `kind` folds to the default workflow.
- **Regression**: full `npm test` green after each piece (L5 DoD).
- **Concurrency**: two sessions handing off the same item — the second
  append meets the events-lock; replay resolves holder deterministically by
  `seq`, no double-holder state.
- **Partial failure**: session dies between the handoff event and the
  worktree commit — resume reads the event log as truth (D8's invariant is
  what makes the event authoritative, not the commit).

---

## Split

Pieces 1 and 2 share `src/state/workflow-stage-graphs.mjs` and
`docs/specs/work-state.md` — a real, accepted sequential overlap (1 lands
before 2 starts). It is declared **mechanically**, as `"deps": [0]` on
child 2, not merely in prose: the engine's own footprint-conflict check
(`src/intake/plan.mjs`:884-908) parks the whole verdict on an undeclared
overlap and exempts exactly the pair joined by a `deps` edge — the
`sequence` resolution its own suggestion list names. It parked this very
verdict on the first attempt, when the ordering existed only as prose;
that refusal was correct and is recorded here rather than worked around.
Child `deps` are integer indices into earlier siblings (`plan.mjs`:252).

```json
[
  {
    "title": "Trục role/holder + verb handoff có guard roleGraph cho domain coding",
    "verify": "npm test",
    "action": "D1: trục role/holder + verb handoff guard bởi roleGraph per-domain, route ngoài graph REFUSED kèm danh sách edge hợp lệ; D4: call/pass với 4 reason advise/assist/review/consult; D8: async đổi holder, sync ghi call-summary không đổi holder, call lồng có trần callstack; D5: soft-gate cross-back bắt buộc ghi reason; D3: guard chỉ gác legality, không phán đoán",
    "footprint": ["src/state/workflow-stage-graphs.mjs", "src/state/work.mjs", "src/state/handoff.mjs", "src/state/events.mjs", "src/state/replay.mjs", "src/state/store.mjs", "src/cli/command-registry.mjs", "bin/fgos.mjs", "docs/architecture-manifest.json", "docs/specs/work-state.md", "CHANGELOG.md", "test/state/handoff.test.mjs", "test/cli/fgos-handoff.test.mjs"],
    "kind": "feature",
    "risk": "heavy"
  },
  {
    "title": "Hierarchy domain → N workflow + selector kind, đăng ký feature only (mechanism-first)",
    "verify": "npm test",
    "action": "D7: hierarchy domain → N workflow → item, selector tái dùng kind qua map workflowFor có default, workflow (shape 1 item) tách bạch với template (fgos expand) — bản sửa mechanism-first: CHỈ đăng ký workflow feature giữ graph hiện tại byte-for-byte, mọi kind fold về nó, rủi ro migration bằng không; hai graph bugfix/lightweight tách thành item riêng làm sau khi có dữ liệu vận hành",
    "footprint": ["src/state/workflow-stage-graphs.mjs", "src/state/stage-fsm.mjs", "src/state/frontier.mjs", "src/intake/discovery.mjs", "src/intake/plan.mjs", "docs/specs/work-state.md", "test/state/workflow-stage-graphs.test.mjs", "test/state/stage.test.mjs"],
    "deps": [0],
    "kind": "feature",
    "risk": "heavy"
  },
  {
    "title": "Task-spec A-lite cho coding + claims trên agent definition + 2 doctor check",
    "verify": "npm test",
    "action": "D6: tách contract (task-spec) khỏi know-how (skill), file khai báo per-domain, read-first qua refs, chưa engine enforcement; D9: mỗi task-spec bắt buộc có section Collaboration (bảng trigger per call-edge); D10: ~13 phiếu cho 5 position, ưu tiên phiếu ≥2 executor hoặc engine đang parse; D12: eligibility khai bằng field claims trên agents/*.yaml, không roster/humans/pools; D13: chỉ họ declaration-schema (2 doctor check), họ artifact-schema để dành cho port marketing; AGENTS.md install-setup-doctor gate: đăng ký task-specs-resolve + agent-claims-resolve vào doctor check registry",
    "footprint": ["docs/task-specs/", "docs/how-to/write-a-task-spec.md", "agents/", "scripts/project-agents.mjs", "src/setup/registrations.mjs", "test/setup/checks.test.mjs"],
    "kind": "docs",
    "risk": "standard"
  }
]
```

---

## Execution note

Every child's verify is `npm test` — the repo's own L5 DoD gate (piece 3
included: its doctor checks and projection change are real code with real
tests, so a file-existence check would be weaker than the suite). No
re-planning of Execute mechanics.

## Assumptions

- **Callstack cap = 3**, per-domain in the registry, no config knob
  (rationale in the gate section). D8 locks the cap's existence; the value
  and its home were delegated to planning.
- `holder` is optional on the work item and in handoff events; absence means
  "domain declares no roleGraph" and is the compatibility path for every
  existing item.
- Piece 2 registers `feature` only (D7a). `feature` staying byte-identical
  is the hard constraint; the `bugfix`/`lightweight` shapes are deferred to
  their own item and are explicitly NOT assumed here.
- Task-spec bodies are migrated prose, not new policy — if writing one
  requires inventing a rule nobody has agreed to, that is a signal to stop
  and raise it, not to author policy inside a contract file.
- **A-lite stays lite until a symptom says otherwise.** The ladder above
  lite (engine injects the spec; verify must match the spec's template;
  output-schema enforced; gates data-driven; input presence enforced;
  `claims` enforced at claim time, not just diagnosed by doctor) is
  deliberately unbuilt. Climb one rung only on its own signal, each
  readable from the event log being built: enforce output-schema after ≥2
  items cross a stage with an artifact missing a required part unnoticed;
  enforce verify-template after an item merges carrying an empty or fake
  verify (the `"chưa xác định — P15 bổ sung"` class `tsk-2t9c` itself
  still carries); inject specs when compound-learn shows souls skipping
  them; enforce `claims` when a real multi-agent-type team mis-claims.

## Validating record (2026-08-15, `fgos-coding-validating`)

### Reality gate

| Dimension | Verdict | Evidence |
|---|---|---|
| Mode fit | PASS | 4 flags counted against `fgos-routing`'s own table (data model / covered behavior / public contracts / multi-domain); 4+ → high-risk. No hard-gate flag present, so not over-built either. |
| Repo fit | PASS | Every path/function the plan leans on read directly this session: `registrations.mjs` `registerCheck`:80 / `registerConfigDefault`:101 / `checkConfigNotStale`:377 / workerSlots entry ~:975; `workflow-stage-graphs.mjs` DOMAINS.coding :52–237, `skillForStage`:566, `resolveDomainName`:503; `work.mjs` `validateDomainFields`:698, `SCHEMA_VERSION`:210, `STAGES`:190; `replay.mjs` lazy `view.outcomes` fold :383–393; `store.mjs` `EDITABLE_FIELDS`:275, `moveStage` held-lock :816–824; `command-registry.mjs` `ask` entry :320–340; `worker-slots.mjs` `hasWorkerSlotRoom({ceiling})`:150 (purity precedent); `architecture.test.mjs` one-to-one manifest check; `agents/fgos-placeholder.yaml` + `scripts/project-agents.mjs`; `test/fixtures/phase1-events.jsonl` present (1.1K, committed). |
| Assumptions | PASS | All four assumptions in the plan are either read-proven (holder-vs-domainFields, manifest row, purity precedent) or explicitly labeled unproven (bugfix/lightweight shapes — surfaced as the gate question below). |
| Smaller path | PASS with finding | A genuinely smaller path exists for piece 2 (register the hierarchy with `feature` only, add the other two graphs later). It does NOT reach the same exit state — D7's exit state is three workflows — so it is a D7 amendment question for the person, not a planning defect. Raised at the gate. |
| Proof surface | PASS | All three child specs carry `npm test`, a real runnable command; `normalizeChild` (`src/intake/plan.mjs`:175–219) would reject a placeholder outright. |
| Impact-analysis posture | PASS | Plan records `degraded`; re-checked this session — `fgos tool query --capability impact-analysis --status present` returns gitnexus `present`, and the analyze hook reports the index behind HEAD (last indexed `7bb3231`). Recorded posture matches reality; every blast-radius claim in the plan is backed by direct reads instead. |

### Feasibility matrix (every medium+ risk)

| Assumption | Risk | Proof required | Evidence found | Result |
|---|---|---|---|---|
| R1 New event verbs do not break replay-from-zero (L3) | High | A committed pre-change log that must replay identically | `test/fixtures/phase1-events.jsonl` exists and is immutable by its own header contract; the lazy-key fold pattern it must survive is already proven in-tree by `view.outcomes` (`replay.mjs`:383–393) | PASS |
| R2 Workflow lookup does not shift current coding behavior | High | The current arrays must be reproducible byte-for-byte | `DOMAINS.coding.stages`/`transitions`/`stepMap` read in full (:90–157); plan pins `feature` to those exact frozen arrays with a deep-equal test | PASS |
| R3 `holder` cannot move outside the handoff door | Medium | The edit surface must exclude it | `EDITABLE_FIELDS` (`store.mjs`:275) enumerates editable keys; `stage`/`status`/`domain` are absent — the same exclusion `holder` gets | PASS |
| R4 New file breaks the architecture test if unregistered | Medium | The check must exist and be enforcing | `test/architecture.test.mjs` asserts `deepEqual(onDisk, inManifest)`; layers `['entry','use-case','infra','domain','kernel']` confirmed; `handoff` has no row today | PASS (plan carries the row as an explicit step) |
| R5 Doctor checks must not read the real repo | Medium | Precedent for fixture-scoped checks | `checkConfigNotStale`/`checkMainCheckoutHookWired` all take `cwd`; `test/setup/checks.test.mjs` exists as the fixture harness | PASS |
| R7 Callstack depth must not use a stale counter | Medium | Depth must be derivable from the log | `replay.mjs` folds per-item state from events; the plan derives depth over the call-thread rather than a stored counter | PASS |
| Blast radius via code graph | — | GitNexus | Posture `degraded` (index behind HEAD) — **gap named, not dropped**: no claim in this plan rests on graph output; each rests on a direct read cited above | ACCEPTED (degraded) |

### Verdict

**READY WITH CONSTRAINTS** — constraints: (1) piece 2's `bugfix`/
`lightweight` graph shapes were unproven and touch 47% of the backlog —
**resolved at the gate by D7a**: they are deferred to their own item and
piece 2 registers `feature` only; (2) blast-radius evidence is `degraded`
throughout, named in every row rather than dropped; (3) the parent item's
own `verify` was the discovery placeholder — **resolved**: set to
`npm test`, which is what the parent's completion actually means (all
three pieces landed, suite green).

### Gate outcome

`gate-check --gate validateApprove --cost EXPENSIVE` → `canAutoApprove:
false`. Hard-gate keyword floor tripped on `schema` and `migration` inside
the child specs (`HEAVY_KEYWORDS`, `src/intake/risk-keywords.mjs`:18–26) —
arguably a true positive: piece 1 does evolve the event schema of an
event-sourced store. Per D9 the floor may not be argued down; asked the
person instead, in one batched round shaped per D12 (the stuck point, the
attempt already made, the specific missing input).

**Answered**: the person chose the mechanism-first option → **D7a**
(seq 18248). Folded into piece 2 above, into its child spec, and into the
risk map (R2 drops High → Medium: with one workflow registered, no new
graph exists to be wrong). Recorded via `fgos gate-approve --gate
validateApprove --actor human`.

## Outstanding questions

None
