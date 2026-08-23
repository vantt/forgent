# plan.md — tsk-62v: capacity-aware dispatch generalization (domain 1)

Status: shaped, awaiting approval. Decisions: `CONTEXT.md` D1-D9 (this dir).

## Mode

**high-risk.** Flags counted against the mode-gate checklist:

| Flag | Applies? | Why |
|---|---|---|
| auth | no | — |
| authorization | no | tool-scope/`allowedTools` axis is explicitly out of scope (D9) |
| data model | **yes** | `.fgos-runner.json` gains a new `capacities` schema block + `kind` vocabulary |
| audit/security | **yes** | this item's whole purpose is a dispatch audit trail; touches the security-annotated `dispatch.mjs` |
| external systems | no | reuses existing PATH-scan/tool-registry presence detection, no new external call |
| public contracts | **yes** | `resolveExecutorConfig`'s signature and `spawnWorker`'s return shape are both extended — every existing caller/test must keep working byte-identical |
| cross-platform | no | — |
| existing covered behavior | **yes** | `dispatch.mjs` has a real test suite (`test/runner/dispatch.test.mjs`) pinning today's exact tier-only behavior; a regression here breaks the runner's only working headless dispatch path |
| weak proof around the area | **yes** | the `.fgos/events.jsonl` audit-entry shape was a genuinely open question in `CONTEXT.md`'s Deferred section — resolved below with real evidence, but it started weak |
| multi-domain | no | domain-1 only (D9) |

5 flags → **high-risk**, matching the item's own `tier: heavy` classification.
A smaller mode (`standard`) would not honestly cover this: two of the five
flags (public contracts, existing covered behavior) mean a mistake here
breaks the one dispatch path the runner already depends on in production.

## Impact-analysis posture

`fgos tool query --capability impact-analysis --status present` → one
provider, `gitnexus`, `status: present` → **impact-analysis: full**. Per
AGENTS.md's gate, every proof point below that touches a named symbol
requires `impact({target, direction: "upstream"})` on that symbol before
editing it, at `fgos-coding-implement` time — not before (this skill does not edit
code). Symbols this plan touches: `resolveExecutorConfig`,
`resolveExecutorCommand`, `spawnWorker`, `buildPrompt`,
`validateRunnerConfigShape`, `commandExistsOnPath`, `detectAssistantCli`.

## Approach

Generalize `dispatch.mjs`'s executor resolution to accept an optional
`capacityId`, resolved once (reusing `buildPrompt`'s existing
`skillForStage` call, D3) and threaded through to `resolveExecutorConfig`
(D4's precedence). Add the `capacities` schema block to
`validateRunnerConfigShape` (D1/D2), dedupe the PATH-scan helper (D5), wire
`kind: "cli"` presence through `fgos tool query` (D6), extend
`spawnWorker`'s return shape additively (D7), and add the announce line +
audit event at the one call site in `loop.mjs` that already logs a
dispatch summary (D8). No alternative approach was seriously considered —
`CONTEXT.md`'s D1-D9 already picked the shape; this is the concrete
build-out of that shape, not a fresh design.

### Reality-gate finding: `resolveExecutorConfig` needs `.fgos/` dir access for D6

Found at `fgos-coding-validating` time (repo-fit check), not a `CONTEXT.md` reopen:
`resolveExecutorConfig(cfg, tier)` (`dispatch.mjs:404`), `resolveExecutorCommand`
(`:423`), and `spawnWorker(work, cfg, cwd, opts)` (`:616`) have no `.fgos/`
directory parameter today — `cwd` there is the dispatch **worktree** checkout
(`wt.path` in `loop.mjs`), a different path entirely. D6's "consult `fgos
tool query`" therefore needs one more thing named explicitly: `spawnWorker`
gains an optional `opts.fgosDir` (loop.mjs already resolves this as `dir`,
`loop.mjs:909` / passed to every other write at the `spawnWorker` call site
already, e.g. `listWork(dir)` at `loop.mjs:665`) and threads it through to
`resolveExecutorConfig` only for the `kind: "cli"` branch. The presence
check itself reuses the exact same three functions `bin/fgos.mjs`'s own
`query` sub-verb already calls in-process (`bin/fgos.mjs:2671-2682`:
`listWork(fgosDir).tools`, `readLocalStatus(fgosDir)`,
`resolvedStatus(name, localStatus)`) — no CLI shell-out, no new function,
just the same in-process read `bin/fgos.mjs` already does. When
`opts.fgosDir` is omitted (any call site that doesn't know about capacities,
or a capacity with no `kind: "cli"` entry), this branch is simply never
reached — backward-compatible with every existing call.

### Resolving CONTEXT.md's one open item: the events.jsonl audit-entry shape

`CONTEXT.md` correctly left open *how* D8's audit entry lands in
`.fgos/events.jsonl` without corrupting the FSM view. Read during this
planning pass:

- `src/state/replay.mjs:16-21` (doc comment) + `:39` (`applyEvent`'s
  `switch (event.type)`): **"Unknown event types are ignored rather than
  rejected, so the log can grow new event types over time without breaking
  replay of older logs."** This is an explicit, already-relied-upon
  contract, not an assumption.
- `src/state/events.mjs:390-392` (`appendEvent`) /`:346-388`
  (`appendEventCore`): a generic, already lock-safe (`withEventsLock`,
  `:331-338`) primitive taking any non-empty `type` string + `payload` —
  `store.mjs` is the *path-resolving* facade around it, not a validation
  gate `appendEvent` itself enforces.
- `src/state/store.mjs:19-23` (doc comment): precedent already exists for a
  narrow, non-`store.mjs` facade writing into `.fgos/` for a concern
  outside the FSM (`worker-log.mjs` owns `.fgos/logs/`) — this item's audit
  entry is the same shape of concern (observability, not an FSM
  transition), just landing in `events.jsonl` per D8's explicit reuse
  choice instead of a new file.

**Resolved approach (pinned here, not a new CONTEXT.md decision — this is
implementation detail CONTEXT.md correctly left to planning):** the runner
loop calls `appendEvent(logPath, { type: 'capacity.dispatch', payload:
{ workId, capacityId, provider, model } })` directly at the existing
dispatch-log call site (`loop.mjs:678`, right after `spawnWorker`
resolves — the same point that already logs `tier -> model` today),
queued through the same `write-queue.mjs` `queue.enqueue()` wrapper already
used for every other write at that call site (`loop.mjs:699-701`,
`:705-...`) — this closes the synthesis report's concurrent-session
write-race concern (§3) for this specific append, the same way it's
already closed for `moveWork`/`addOutcome`. `replay.mjs` needs **no new
`case`** — the unknown-type-ignored contract already covers it, and adding
a case would mean this audit-only event starts participating in the FSM
view, which is not what D8 wants.

## Risk map

| Component | Risk | Proof point (for `fgos-coding-validating`) |
|---|---|---|
| `resolveExecutorConfig`/`resolveExecutorCommand` signature change | **high** — every existing call site and the whole `dispatch.test.mjs` suite depends on today's exact tier-only behavior | existing test suite green, unchanged; new tests pin capacity > tier > global precedence and the "capacity absent → byte-identical to today" invariant, mirroring the P41 `executors` block's own pinned test (`dispatch.test.mjs:659`) |
| `capacities` schema validation (`validateRunnerConfigShape`) | medium — malformed `kind` or missing `command`/`args` on a capacity entry could silently no-op instead of failing loud | new tests mirroring the existing `executors.<tier>` shape tests (`dispatch.test.mjs:322` pattern) for `capacities.<id>` |
| PATH-scan dedup (`commandExistsOnPath`/`detectAssistantCli` → one helper) | medium — both `ensureRunnerConfig`'s bootstrap flow and `fgos tool query`'s presence check depend on this working exactly as before | `impact()` on both symbols before editing (full posture); existing tests for both stay green unchanged |
| `kind: "cli"` → `fgos tool query` integration, incl. `opts.fgosDir` threading | medium — new cross-module call from `dispatch.mjs` into `tool-registry.mjs`'s query path; only works if the capacity was registered first (D6), and requires `spawnWorker` to accept an optional `opts.fgosDir` it doesn't have today (reality-gate finding, see Approach above) | new test registering a fixture tool via `tool-registry.mjs`'s own API/`fgos tool register`, then asserting `resolveExecutorConfig` consults it (via `opts.fgosDir` passed through from `loop.mjs`'s already-resolved `dir`) instead of re-probing PATH; a call with `opts.fgosDir` omitted stays on today's PATH-probe path unchanged |
| `spawnWorker` return shape | low — additive only | new test asserts `capacityId`/`provider` present alongside every existing field, existing return-shape assertions unchanged |
| `events.jsonl` audit entry | was weak, now medium-low (see resolved approach above) | new test: append a `capacity.dispatch` event via `appendEvent`, then `rebuildView()` the log and assert `view.work`/`view.decisions` are byte-identical to before the append — proves the "ignored, not rejected" contract holds for this concrete new type |
| Announce line format/placement | low | `loop.test.mjs` assertion on the exact `<capacityId> — <provider> — <model>` format at the `loop.mjs:678` call site |
| D6's registration requirement left implicit for a real operator | medium (docs risk, not code risk) | this item's own build adds a short doc note (see below) showing `fgos tool register --kind cli ...` for a `kind: "cli"` capacity — not left as an unstated assumption |

## Work-graph check

`fgos graph --what-if tsk-62v --json`: `unblocksTransitive: 6`,
`newlyReady: [tsk-5l2, tsk-64p, tsk-g18, tsk-49o, tsk-32n, tsk-418]`. High
leverage, single candidate (no other piece competes for "do this first" —
`tsk-5l2`/`tsk-g18` both `depends: [tsk-62v]` already, per the design
doc's own dependency ordering). No ordering decision to make among
alternatives.

## Files touched (order reflects natural build dependency, not `fgos graph`
tie-breaking — there was only one candidate order here)

1. `src/state/tool-registry.mjs` — export the deduped PATH-scan helper
   (D5); no behavior change to existing exports.
2. `src/runner/dispatch.mjs` — `validateRunnerConfigShape` gains the
   `capacities` block (D1/D2); `resolveExecutorConfig` gains `capacityId`
   (D4); `resolveExecutorCommand`/`spawnWorker` thread `capacityId`
   through and add `provider` (D3/D7); `spawnWorker` also gains an
   optional `opts.fgosDir`, threaded into `resolveExecutorConfig` only for
   the `kind: "cli"` presence-check branch (reality-gate finding, see
   Approach above); `detectAssistantCli` calls the shared helper instead of
   its own copy (D5); `kind: "cli"` resolution calls the same in-process
   functions `bin/fgos.mjs`'s `query` sub-verb already uses (D6).
3. `src/runner/loop.mjs` — pass the already-resolved `dir` as `spawnWorker`'s
   new `opts.fgosDir` at the existing call site (`loop.mjs:666`); announce
   line + `appendEvent('capacity.dispatch', ...)` at the existing dispatch-log
   call site (`loop.mjs:678`), queued via `queue.enqueue()` (D8).
4. `docs/reference/forgentx-tool-registry-configuration.md` (or a short
   how-to alongside it) — the D6 registration step, so a real operator
   wiring a `kind: "cli"` capacity has a documented path, not an assumption.
5. Tests: `test/runner/dispatch.test.mjs` (precedence, schema, PATH-scan
   dedup, `fgos tool query` integration, additive return fields),
   `test/runner/loop.test.mjs` (announce format + audit event),
   `test/state/replay.test.mjs` (unknown-type-ignored assertion, only if
   not already covered by an existing generic test — check before adding a
   duplicate).

## Assumptions (pinned, not asked — implementation-only, per fgos-coding-planning's
own material/grounded/answerable filter)

- No new `capacities.<id>` entries need to be added to the *live*,
  committed `.fgos-runner.json` for this item's own acceptance — the
  resolution logic is proven with synthetic `cfg` objects in unit tests,
  the same way the `executors` block itself was originally proven at P41
  before any real repo config used it.
- `CAPACITY_KINDS` (capacities' own `kind` field's valid values = D2's
  `tool-registry.mjs` `KINDS` + `'task'`) is a new constant local to
  `dispatch.mjs` (or wherever the shared PATH-scan helper lands) — it does
  **not** mean `tool-registry.mjs`'s own `KINDS` constant gains `'task'`,
  since `fgos tool register --kind` must never accept `task` (D2: "the one
  kind `fgos tool` has no reason to know").
- The dedup in D5 keeps `tool-registry.mjs` as the owner (it already
  exports `KINDS`, the more natural home) and has `dispatch.mjs` import
  from it — but this is genuinely free to flip during `fgos-coding-implement` if
  a cleaner shape turns up; D5 itself says ownership is not a design
  decision.

## Split decision

No split. This is one honest, atomic piece of work — `CONTEXT.md` D9 and
the design doc's own "Đã chốt" #9 already carved the adjacent concerns
(tool-scope/`allowedTools`, `sandboxed-cli-spawn`) into separate items
(`tsk-g18`-adjacent follow-up, `depends: [tsk-62v]`); folding them in here
would re-open a boundary the upstream design already deliberately drew.

## Verify (unchanged mechanical path, per fgos-coding-planning's own scope limit)

Execute's existing goal-check/`fgos return` re-verify path is untouched by
this plan. The concrete command this item's own acceptance proves against:

```
npm test
```

(state + cli + runner + e2e suite green, including the new tests listed
above — this item does not narrow or replace that existing gate).
