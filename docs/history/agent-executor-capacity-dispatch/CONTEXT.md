# agent-executor capacity-aware dispatch (domain 1) — locked decisions

Item: `tsk-62v`. Cluster: `tsk-64p` (agent-executor: capacity-aware backend
dispatch, design + proof-of-concept). Siblings `tsk-5l2` and `tsk-g18` both
`depends: [tsk-62v]`; `tsk-slq` (agent-type root) is independent.

Source request (title, untrusted per RUL45): "Generalize dispatch.mjs's
executor resolution to be capacity-aware, not just tier-aware, and add a
dispatch announce/audit trail." Full scope (9 points) is in the item's own
`description` field (`fgos list --id tsk-62v --json`).

No prior `judgeDiscovery` verdicts exist for this item (`view.discovery`
empty) — this is the first clarify pass.

## Feature boundary

Generalize `src/runner/dispatch.mjs`'s executor resolution
(`resolveExecutorConfig`/`resolveExecutorCommand`/`spawnWorker`) from
tier-only to capacity-aware, and add a one-line dispatch announce +
`.fgos/events.jsonl` audit entry. **Domain 1 (headless runner) only** —
in-session Agent/Task tool dispatch (domain 2) is a separate item (`tsk-5l2`),
deliberately out of scope here.

## Why this clarify pass has no open questions

Unlike a typical fuzzy request, this item's design was already fully worked
through upstream, before submission, across two prior sessions:

- `plans/reports/distill-consult-260731-1733-agent-executor-backend-dispatch-report.md`
  — prior-art consult.
- `plans/reports/agent-executor-design-260731-1758-capacity-backend-dispatch-proposal-report.md`
  (**the design doc** — sections 3, 4.0, 4.1, 8, 9 are tsk-62v's scope) —
  ends with an explicit "Đã chốt" (locked) list stating no design questions
  remain for the domain-1 generalize work.
- `plans/reports/agent-executor-design-260801-1159-synthesis-goal-constraints-gaps-report.md`
  — retrospective synthesis; §5 explicitly says the 4 existing cluster items
  (including `tsk-62v`) can build with their scope as already locked; its §4
  open questions (governance/escalation/agentic-capability/latency/real-$
  measurement) are scoped to *future* cluster growth, not this item.

The item's own `description` (9 numbered points) is a faithful restatement
of the design doc's locked scope for tsk-62v — verified line-by-line below.
No new gray area was found that the design doc left unaddressed within this
item's boundary.

## Locked decisions

| ID | Decision |
|----|----------|
| D1 | `.fgos-runner.json` gains an optional `cfg.capacities.<capacityId>` map, additive-only — same style as the existing `cfg.executors.<tier>` P41 addition. Absent must keep today's behavior byte-identical; this is a test-pinned invariant, not just a description. |
| D2 | The reachability-class field on each `capacities.<id>` entry is named `kind` (not `invocation`) and reuses `src/state/tool-registry.mjs`'s `KINDS = ['cli','binary','mcp','skill','http']` verbatim, plus one new value `task` (in-session Agent/Task dispatch — the one kind `fgos tool` has no reason to know, since it's never a presence-on-this-machine question). No parallel vocabulary. |
| D3 | `capacityId` for a work item is exactly `skillForStage(getDomain(work.domain), 'executing')` — the same resolution `buildPrompt` (`dispatch.mjs:121-124`) already computes today (just to build `skillPath` for the prompt, not yet to pick a backend). Reuse that single resolution; never recompute it a second way. |
| D4 | `resolveExecutorConfig(cfg, tier, capacityId)` gains `capacityId` as an optional 3rd argument (backward-compatible — every existing call site that doesn't know about capacities keeps working). Precedence: `capacities.<capacityId>` > `executors.<tier>` > `executor` (global). |
| D5 | `tool-registry.mjs`'s `commandExistsOnPath()` (`tool-registry.mjs:112`) and `dispatch.mjs`'s `detectAssistantCli()` (`dispatch.mjs:184-200`) are the same PATH-scan-for-executable-bit logic, written twice. Fold into one shared helper; which module owns/exports it is an implementation choice, not a design decision (design doc says so explicitly). |
| D6 | For `capacities.<id>.kind === "cli"`, `resolveExecutorConfig` consults `fgos tool query --capability <capacityId> --status present` (the existing discovery layer, `tsk-1dj`) instead of re-probing PATH independently. This only works if the capacity's CLI was registered via `fgos tool register` first — that registration step (and its docs) is this item's own responsibility, not left as an assumption for callers. This also satisfies AGENTS.md's install/setup/doctor gate for free: `checkToolRegistryConfigured` (`src/setup/checks.mjs:182,227`) is already generic over every registered tool — confirmed by reading the function; no new doctor check is needed, but only because the registration actually happens as part of this item. |
| D7 | `spawnWorker`'s returned object (`dispatch.mjs:616-657`, currently `{status,signal,stdout,stderr,tier,model,templateName,templateHash}`) gains two additive fields: `capacityId` and `provider` (the resolved executor's `command`, or an explicit `provider` alias field on the executor block when present, defaulting to `command`). No existing field renamed or removed. |
| D8 | The runner loop (caller of `spawnWorker`, not `dispatch.mjs` itself) logs one announce line at dispatch time, format `<capacityId> — <provider> — <model>` (e.g. `coding — agy — flash-3.5`), to stderr/logs, and appends one audit entry to the existing `.fgos/events.jsonl` one-door-write log — reusing it, not opening a second audit file. |
| D9 | Scope floor: domain-1 (headless runner) only. Two adjacent design-doc concerns are explicitly **not** this item: (a) tool-scope/`allowedTools` per capacity (design §9's third axis) is a separate work item, `depends: [tsk-62v]`, in the same `tsk-64p` cluster; (b) `sandboxed-cli-spawn` (design §9.1) is a genuinely open design question in the design doc itself (not yet resolved even upstream) and is explicitly deferred past this item. |

Every D-ID above is a restatement of an already-locked upstream decision,
not a new judgment made in this clarify pass — logged via `fgos decision`
below for machine-readable visibility (`view.decisions`).

## Pinned terms

- **capacityId** — for this item's own scope (domain 1, `executing` stage),
  always `skillForStage(getDomain(work.domain), 'executing')` — e.g.
  `"fgos-coding-implement"` for the default `coding` domain today. The design
  doc's more general "skill name or `domain:stage`" identity (design §3)
  exists for the config schema broadly; tsk-62v's own resolve call site
  only ever needs this one instantiation of it.
- **provider** — display alias for the resolved executor's `command` field;
  defaults to `command` verbatim unless the executor block declares its own
  `provider` field.

## Scout evidence cited

- `src/runner/dispatch.mjs:396-438` (`resolveExecutorConfig`/
  `resolveExecutorCommand`, current tier-only signature) and `:616-657`
  (`spawnWorker`, current return shape) — read in full this session.
- `src/state/tool-registry.mjs:34` (`KINDS`), `:112` (`commandExistsOnPath`)
  — read this session.
- `src/state/workflow-stage-graphs.mjs:143-145` (`skillForStage`), `:44-101`
  (`DOMAINS.coding.skillMap`, `executing` → `fgos-coding-implement`) — read this
  session; confirms D3's identity is already a real, existing call, not a
  hypothetical.
- `src/state/store.mjs:1-24` — `.fgos/events.jsonl` is normally the
  one-door-write FSM truth log, gated behind typed mutation functions
  (`addWork`/`moveWork`/etc.), each producing an event `replay.mjs` folds
  into `state.json`. D8's audit entry is a *different* kind of append (an
  observation, not an FSM transition) — whether it needs its own event
  `type` that `replay.mjs` safely ignores, or some other shape, is **not**
  decided here; it is real evidence for `fgos-coding-planning`/`fgos-coding-validating`
  to prove safe before building, not an assumption to carry forward
  silently.
- `.fgos-runner.json` (current, read this session) — already has
  `executors.judge` using `tier` as a "synthetic role key" for
  `allowedTools` scoping (design §9's cited evidence) — confirms D9's
  boundary (that concern is real and already live, but is the separate
  follow-up item, not this one).
- `fgos tool query --capability impact-analysis --status present` → one
  provider, `gitnexus`, `status: "present"` — AGENTS.md's impact-analysis
  gate reads **full**: `impact()` MUST be run (and its risk level reported)
  before editing any of `resolveExecutorConfig`, `resolveExecutorCommand`,
  `spawnWorker`, `buildPrompt`, `commandExistsOnPath`, `detectAssistantCli`
  once this item reaches `fgos-coding-implement`.

## Deferred to planning

- Exact ownership/module location of the deduped PATH-scan helper (D5).
- The `.fgos/events.jsonl` audit-entry shape (event `type`, and proof that
  `replay.mjs`/`rebuildView` tolerate it without corrupting `state.json`) —
  flagged above as real open evidence, not a decision.
- Which capacity (if any) needs a real `fgos tool register --kind cli ...`
  entry for tsk-62v's own acceptance tests to exercise D6's `fgos tool
  query` integration end-to-end, vs. a mocked registry in unit tests.
- New-test placement/naming for the capacity-keyed precedence invariant
  (D1/D4), mirroring how the `executors` block's byte-identical-when-absent
  invariant was pinned at P41.

## Outstanding questions

None — every point in this item's own scope traces to an already-locked
upstream design decision (D1-D9), cited above with file:line evidence. The
one substantive open item found during scouting (the `events.jsonl`
audit-entry shape, under "Deferred to planning") is evidence for planning
to prove against, not a product decision requiring a person's judgment call.
