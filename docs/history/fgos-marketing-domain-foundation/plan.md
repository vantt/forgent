# fgos-marketing-domain-foundation — plan

Mode: high-risk — 4 flags (data model: work item gains a `role/holder`
axis and new event verbs; existing covered behavior: stage-fsm/frontier/
dispatch are test-covered and change; public contracts: fgos verb surface
and event schema extend; multi-domain: the change is the domain mechanism
itself). No hard-gate flag (no auth, no data loss, no audit/security, no
external provider, no validation removed). Lane derived via
`fgos-routing`'s Mode-gate table under `fgos-coding-planning`'s
direct-entry fallback — no lane was handed off (entry came from
`fgos-coding-shaping` → exploring, not through routing's Orient).

## Approach

Build the multi-role harness in three sequential-capable pieces on the
`coding` domain first (D2), leaving marketing absorption to follow-on
items submitted after the harness proves out. Chosen order (design deps;
`fgos graph --json` shows tsk-2t9c on no shared critical path —
`criticalPath` runs through the tsk-4vo…tsk-19y-1 chain, unrelated — so
ordering is internal to this feature):

1. **Role axis + handoff verb** — the engine change everything else
   builds on (D1, D3, D4, D8). Adds `role/holder` to the work item,
   a `handoff` verb (call/pass, guard by per-domain `roleGraph`,
   callstack cap for nested calls), `call-summary` events for sync
   in-session calls, and soft-gate cross-back reasons (D5). Coding's
   roleGraph names the four existing implicit interactions:
   Researcher (consult), Reviewer (review), Helper (assist),
   Human-advisor (advise) around Implementer.

   Draft roleGraph for coding (reviewed with the user post-convergence;
   implementation refines shape, not edges):

   ```js
   roleGraph: {
     roles: ['implementer', 'researcher', 'reviewer', 'helper', 'human-advisor'],
     defaultRole: 'implementer',
     callstackCap: 3, // config-overridable
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
         { from: 'reviewer',    to: 'researcher',    reason: 'consult', mode: 'sync'  }, // legal nested call
         { from: 'reviewer',    to: 'human-advisor', reason: 'advise',  mode: 'async' },
       ],
     },
   }
   ```

   Anchor: the current coding flow maps 1-1 onto this graph
   (return→awaiting-approval = async review call; ask/answer = async
   advise; fgos-researching = sync consult; fanout = sync assist) — this
   piece names and records what already runs; it does not change
   behavior. `discovery` deliberately has no edges (machine-only pass).
2. **Workflow multiplicity** — un-merge coding's single stage graph into
   `feature` (current graph, default) / `bugfix` / `lightweight`,
   selected by `kind` via `workflowFor` with a default fold (D7).
   Separate piece because it reshapes stage-fsm lookups and frontier
   Execute-stage resolution — reviewable on its own.
3. **Task-spec A-lite convention** — contract files per domain, read-first
   via refs, no enforcement (D6). Docs-only; can run parallel to 1–2
   (footprint disjoint from both except none). Every task-spec MUST carry
   a `## Collaboration` section (D9): a trigger-prose table per available
   call edge for that (workflow, stage) — when to call, which reason, to
   which role, what the returning ball carries — migrated from where the
   prose already lives implicitly (exploring's material/grounded/
   answerable filter = the advise trigger; fgos-researching's own
   description = the consult trigger). Division of labor: prose teaches,
   soul decides, guard blocks.

Rejected alternatives (each traced to the locked record):
- Marketing-first sequencing — rejected by user decision D2.
- Child-item-per-review-round and status-FSM-loop encodings of ping-pong
  — rejected in DISCUSSION.md round 3 analysis behind D1 (item-count
  explosion / role×status state blow-up).
- A runtime workflow entity — rejected by D7's workflow-vs-template
  split; templates (`fgos expand`) stay a later, separate piece.
- Building the signal bus now — deferred by DISCUSSION.md §7
  (`{#task-signal-bus}`, YAGNI until a real fan-out use case).

## Risk map

| Component | Risk | Proof point for validating |
|---|---|---|
| Event schema: new `handoff`/`call-summary` verbs in `.fgos/events.jsonl` | High — replay-from-zero (L3) must stay true for old logs | Replay an existing production-shaped log through the new code: `npm test` (state suite includes replay); prove old events without `role` fields still fold cleanly |
| stage-fsm/frontier changes for workflow lookup (piece 2) | High — every existing item resolves stages through these | `npm test` green + explicit case: legacy item with no workflow folds to domain default, mirroring DEFAULT_DOMAIN fold |
| Guard refusal UX (off-graph handoff REFUSED + legal-edge list) | Medium — wrong refusal text misleads souls | Unit case: off-graph handoff returns refusal naming legal edges |
| Callstack cap for nested calls | Low — bounded counter | Unit case: call at cap is REFUSED |
| Task-spec convention (piece 3) | Low — docs only | Files exist and parse; no engine claim to prove |

impact-analysis: degraded — GitNexus registered and `present` (`fgos tool
query`, run this session) but its index is stale relative to HEAD, so
blast-radius claims above are backed by the test suite and rg
cross-checks, not the graph. Per CLAUDE.md this keeps the proof points
but marks graph-derived evidence weak.

## Files touched (by piece, in order)

Piece 1: `src/state/workflow-stage-graphs.mjs` (roleGraph declaration),
`src/state/work.mjs` (role field validation), new `src/state/handoff.mjs`
(guard + callstack), `src/state/events.mjs` (verbs),
`src/cli/command-registry.mjs` + `bin/fgos.mjs` (CLI surface), matching
`test/state/`/`test/cli/` files.
Piece 2: `src/state/workflow-stage-graphs.mjs` (workflows + workflowFor),
`src/state/stage-fsm.mjs`, `src/state/frontier.mjs`,
`src/intake/discovery.mjs`, `src/intake/plan.mjs`, matching tests.
Piece 3: `docs/task-specs/coding/` (new), `docs/how-to/` entry.

Pieces 1 and 2 both touch `workflow-stage-graphs.mjs` — a real, accepted
sequential overlap (1 lands before 2 starts), declared honestly in the
child footprints below rather than hidden.

## Concrete cases worth proving

- Empty/boundary: item with no `role` field (every existing item) behaves
  exactly as today; domain without `roleGraph` (synthetic/triage
  fixtures) never sees a handoff edge.
- Regression: full `npm test` (state + cli + runner + e2e) green after
  each piece — L5 DoD.
- Concurrency: two sessions handing off the same item — second append
  hits the event-log exclusive lock; no double-holder state (replay
  resolves holder deterministically by seq).
- Partial failure: session dies between handoff event and worktree
  commit — resume from last handoff checkpoint reads the event log as
  truth (D8's invariant makes the event the authoritative holder record).

## Split

Three pieces per the Approach; specs below in `normalizeChild` shape.
Marketing follow-ons (DISCUSSION.md §7 `{#task-marketing-domain-registry}`,
`{#task-marketing-skill-port}`, `{#task-expand-template-verb}`,
`{#task-gate-runner}`, `{#task-signal-bus}`) are deliberately NOT child
specs here: their real shape depends on how the harness lands (registry
details, judge-gate question #7 still deferred), so specs written today
would be guesses — they get submitted as new items after this feature
proves out, per D2's own sequencing.

```json
[
  {
    "title": "Trục role/holder + verb handoff có guard roleGraph cho domain coding",
    "verify": "npm test",
    "action": "D1: thêm trục role/holder với verb handoff bị guard bởi roleGraph khai báo per-domain, route ngoài graph bị REFUSED kèm danh sách edge hợp lệ; D4: handoff hai loại call/pass với 4 reason advise/assist/review/consult; D8: async handoff đổi holder, sync call ghi call-summary không đổi holder, call lồng có trần callstack; D5: soft-gate cross-back bắt buộc ghi reason",
    "footprint": ["src/state/workflow-stage-graphs.mjs", "src/state/work.mjs", "src/state/handoff.mjs", "src/state/events.mjs", "src/cli/command-registry.mjs", "bin/fgos.mjs", "test/state/handoff.test.mjs"],
    "kind": "feature",
    "risk": "heavy"
  },
  {
    "title": "Un-gộp coding thành nhiều workflow: feature/bugfix/lightweight, selector kind qua workflowFor",
    "verify": "npm test",
    "action": "D7: hierarchy domain → N workflow → item; selector tái dùng kind qua map workflowFor có default; coding un-gộp thành feature (graph hiện tại, default) / bugfix / lightweight; item cũ fold về default không migration",
    "footprint": ["src/state/workflow-stage-graphs.mjs", "src/state/stage-fsm.mjs", "src/state/frontier.mjs", "src/intake/discovery.mjs", "src/intake/plan.mjs", "test/state/stage-fsm.test.mjs"],
    "kind": "feature",
    "risk": "heavy"
  },
  {
    "title": "Convention task-spec A-lite cho coding: tách contract khỏi know-how",
    "verify": "test -d docs/task-specs/coding && ls docs/task-specs/coding/*.md >/dev/null",
    "action": "D6: task-spec (contract: input/output/gate/verify-template) tách khỏi skill (know-how), file khai báo per-domain theo mô hình cockpit .fgOS/tasks/, read-first qua refs, chưa engine enforcement; D9: mỗi task-spec bắt buộc có section Collaboration — bảng trigger-prose per call-edge per (workflow, stage)",
    "footprint": ["docs/task-specs/", "docs/how-to/write-a-task-spec.md"],
    "kind": "docs",
    "risk": "light"
  }
]
```

## Execution note

Each child's verify is the one command proving it done (piece 1–2:
`npm test`, the repo's own L5 DoD gate; piece 3: file-existence check —
docs-only, no behavior claim). No re-plan of Execute mechanics.

## Assumptions

- The callstack cap value: **default 3, config-overridable** — pinned as
  a labeled assumption (D8 locks the cap's existence; the number is
  implementation-only, delegated by the user to planning; 3 covers the
  deepest real chain seen in the discussion — implementer → reviewer →
  researcher — with one spare level).
- `role/holder` is stored as an optional field on the work item and in
  handoff events; absence means "domain declares no roleGraph" and is the
  compatibility path for every existing item.

## Outstanding questions

None
