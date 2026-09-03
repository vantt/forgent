# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added

- `fgos coordination run --file <request>` / `fgos coordination show <id> --json` (Step 08 Phase 07 R1) — the first public CLI onto the CoordinationSession runtime. `run` reads a JSON request file (`src/verbs/coordination/schema.mjs` enforces a strict portable-protocol/trusted-operator-policy boundary — unknown fields, inline protocol content, actor-role rewrites, undeclared actor multiplicity, non-read-only mutation, Work-lifecycle authority, path-escaping ids, and a request-file `executor`/`model`/`tier` field that would conflict with the CLI's own reserved `--executor`/`--model`/`--tier` flags are all rejected), opens an agent-led or declared-protocol session, dispatches every declared step synchronously through the existing `session-engine.mjs` exports only, attempts a quorum close, and reports the result as an `fgos.v1` envelope. `show` is a read-only status read (manifest, phase, quorum, event count) with no mutation or external effect. A headless adapter (`src/runner/coordination/headless-adapter.mjs`, `runCoordinationHeadless`) calls the exact same `runCoordinationUseCase` the CLI calls, accepting an in-memory request object instead of a file and returning the result directly instead of printing an envelope — the only permitted difference (R4). Registered in the command manifest, `fgos doctor` (a new `coordination-example-requests-valid` check), and `docs/how-to/run-a-coordination-session.md`, with four published example request files under `docs/how-to/coordination-examples/` (agent-led, declared consult, independent research fan-out, and the full 6-phase Group Cognition framework). **Resume (Step 09 Phase 04, MVP5 R4):** a request naming a `coordinationId` that already has an open session on disk now continues that session's own dispatch/authorize/disposition doors instead of refusing at open with `"already exists"` — a second (or later) real `fgos coordination run --file <request>` invocation against the same id picks the loop back up mid-flight (no `$ref:` label survives across separate invocations; a resuming request names an earlier invocation's own Assignment ids literally, per `resolveRef`'s own documented "advanced/resume use case" path). Reaches the SAME `dispatchDeclaredOperation`/`authorizeDeclaredOperation`/`recordDriverDisposition` doors every request already used — no duplicated Assignment, no reconsumed `invocationKey`, no lost disposition — and a session already closed to a terminal status stays absorbing across this door too (further invocations are refused as "not active").
- `fgos coordination launch-master-loop --plan <path> --objective <text> --writer-id <id>` (Step 09 Phase 02, MVP4) — a thin composer for the shipped `standalone-master-coordination-loop` fixture: builds a declared-protocol request covering only the fixture's required first pass (produce/review/red-team) and runs it through the same `runCoordinationUseCase` door as `run`, never authorizing or dispositioning the fixture's driver-authorized revision/recheck operations itself. Its result always carries a `nextAction` message naming the coordination id and what to do next — including a plain-terms explanation of why the session did not close yet when a driver-authorized step (e.g. `revise-candidate`) is still pending, without implying any resume/continue command exists (none does yet). `fgos coordination show` now also renders, sourced from the session's own replayed event log: authorizations issued (operation, actor, consumed or not), neutralized post-terminal authorizations, dispositions recorded (target, disposition, rationale — each marked `postTerminal` if recorded after the session already closed, and each ref marked whether it resolves to this same session's own membership), and which declared driver-authorized operations are still awaiting authorization.

### Changed

- Reframed `docs/architect/component-boundary/` as a whole-system fgOS
  component-boundary advisory set, with a component authority register linking
  each boundary to its owning/reference documents instead of centering the
  structure on Agent Coordination.
- Added `docs/architect/domainization/` as the dedicated architecture deep dive
  for core-vs-domain authoring, resolver, workflow, task-spec, skill, knowledge,
  doctrine, agent, and enforcement boundaries; removed the temporary
  component-boundary draft files after distilling them.
- Added `src/runner/coordination/{schema,store,replay}.mjs` — a versioned, fail-closed CoordinationSession manifest/event store rooted at `.fgos/coordination/sessions/<id>/` (gitignored, same posture as `.fgos/assignments/`), reusing `state/events.mjs`'s atomic event-log lock and `dispatch/assignment.mjs`'s `buildAssignment()`/`claimAssignmentId()` for every Assignment it creates. Directly replaces the unreleased `mission-lite.mjs` prototype (deleted, along with its `.fgos/missions/` storage shape and `dispatch.mjs`'s `createMission`/`getMission`/`listMissions`/`appendThreadMessage`/`readThreadMessages`/`createMissionAssignment`/`runMissionAssignment`/`synthesizeMission` exports) — no migration or compatibility path, per ADR-008. `buildAssignment()`/`createAssignmentId()` no longer accept or stamp a `missionId` field on any Assignment; `executeAssignment()`'s mission-lite read-only-enforcement flag is renamed `isReadOnlyMode` (was `isMissionLite`), same enforcement behavior.
- CoordinationSession runtime (`src/runner/coordination/session-engine.mjs`, Phase 06 R1-R4) gained quorum/partial-completion policy, retry/actor-replacement, and cancellation: `STATUS_VALUES` gained `cancelled` (alongside `active|completed|partial|failed`) and every terminal status is now absorbing (no further transition ever legal once a session leaves `active`); the manifest gained an optional `partialPolicy` field (`{minimumActors?, allowedOmissions?}`, declared at session-open time, immutable), consumed by new `evaluateSessionQuorum`/`closeSessionByQuorum` exports — default completion still requires every required SessionActor, and a partial close is refused unless `partialPolicy` explicitly names every missing/failed/late actor. `retrySessionTask` dispatches a NEW Run for an EXISTING Assignment (never a new Assignment) under a caller-declared `maxRetries` policy, superseding the session's linked view (`store.mjs`'s `linkResult({allowSupersede: true})`, authorized only by a preceding `run-retried` event — enforced identically at write time and at `replay.mjs` read time) while leaving every prior RunResult and `result-linked` event on disk, untouched. `replaceSessionActor` binds a replacement SessionActor under the replaced actor's own unchanged role, records old/new actor + optional allocation provenance (`actor-replaced` event), and never opens a second dispatch path — the replacement's actual work still materializes only through the existing `dispatchDeclaredOperation`/`dispatchPrimaryTask`/`proposeConsult` functions, so governance re-runs by construction. `cancelSession` transitions to the new terminal `cancelled` status, snapshotting in-flight Assignments at the moment of cancellation without deleting or mutating any persisted evidence. Every new multi-step write (retry declaration, actor replacement) is resume-safe/idempotent on crash via its own on-disk claim file, keyed per-attempt for retry and per-`(oldActorId, newActorId)`-pair for `replaceSessionActor` — the latter is what lets a genuine crash-resume of `replaceSessionActor`'s own `bindActor` step be told apart from an unrelated actor that merely happens to already be bound for its own independent reason (e.g. a required actor declared at session-open time but not yet dispatched), so one actor's real result can never get silently double-counted to cover a different actor's required slot. An irreducibly ambiguous mid-dispatch crash (a stale claim file with no settled result and no matching resume evidence) fails closed with a named, actionable error instead of guessing. New export `deriveSessionPhase` reports the phase file's own `planned|running|partially-complete|completed|failed|cancelled` vocabulary, inferred from the persisted manifest.
- CoordinationSession hard-budget/security hardening (Phase 06 R5-R7, cell P06.2): `aggregateBounds` (`wallTimeMs`/`maxAssignments`/`maxConcurrency`/`maxRounds`/`maxTaskDepth`) enforcement is now UNIFORM across every dispatch entry point — `dispatchPrimaryTask`/`proposeConsult` (the agent-led, undeclared-protocol path) previously forwarded none of the 3 session-wide concurrency-sensitive caps and ran neither the wall-time nor task-depth check at all, so a session opened via `openStandaloneSession` had no working hard budget whatsoever (confirmed empirically: a second Assignment could be created past a declared `maxAssignments: 1` with no error); `retrySessionTask` (shared by both dispatch paths) now also refuses to dispatch a new retry Run once the session's wall-time budget has elapsed (never blocking its own self-heal/resume-linking path, which launches nothing). `store.mjs`'s `resolveSessionPaths`/`openSession` now reject a `coordinationId` containing characters outside a safe filesystem charset (letters/digits/underscore/hyphen only) — before this fix, a `coordinationId` containing `../` traversal segments could make `openSession` create a real session directory OUTSIDE `.fgos/coordination/sessions/` entirely (confirmed empirically). `linkResult` now rejects a `runId` whose full shape does not exactly match its own `assignmentId`'s naming convention (`run_<assignmentId>_<digits>`, not merely a prefix match) at write time, closing a foreign-evidence gap where a genuine sibling Assignment's own runId — or a same-prefix, malicious-suffix runId — could be linked to a different assignmentId with no complaint (it never produced a false quorum SUCCESS — a later read already failed closed — but the corrupted linkage was writable at all); `readLinkedRunResultFromDisk` enforces the identical full-shape check at read time, closing the same gap for a hand-crafted/corrupt event log. New static tests assert the coordination module's own exported public API surface carries no branch/worktree/merge/approve/Work-transition-shaped operation name (R7), alongside the pre-existing import-only static check.
- `fgos knowledge attest` now requires `--capture-id` — a call that only names `--doc-path` used to return `{attested: true}` while recording no linkage at all; now it either records the capture id or returns `{attested: false, reason: ...}` when `docRegistry.enforce` is off, never a misleading unconditional success (tsk-3uc).
- `herdr-spawn` executor adapter now requires `interactiveMode` on every invocation — the plain sh-wrapper path and the `liveOutput` streaming mechanism (and their `live-renderers/*.mjs` helpers) were removed; a caller lacking `interactiveMode` now gets a clear `invalid-config` error instead of a silent fallback.
- Extended `fgos main-checkout-reset` safety guard (`assertSafeMainCheckoutReset`, `src/runner/main-checkout-reset-guard.mjs`) to detect when `--sha` is behind current `HEAD` by committed commits and refuse unconfirmed resets, formatting the list of commits about to be discarded (author, message, files touched).
- Moved 5 diagnostic/telemetry logs (`approve-post-success-faults.jsonl`, `main-checkout-guard-warnings.jsonl`, `changelog-nag-history.jsonl`, `entropy-history.jsonl`, `invocation-faults.jsonl`) from `.fgos/` root into the already-gitignored `.fgos/logs/` bucket — none of these is the event log, so they never needed to be git-tracked; they were only kept dirty/committed by omission. Removed their now-dead `.gitattributes` `merge=union` entries.
- Moved `tool-status.local.json` and `events-jsonl.truncation-guard.json` (both already gitignored) into `.fgos/runtime/`, matching the same per-machine/local-only bucket convention as `.fgos/logs/`.
- Added `src/state/fgos-file-registry.mjs` (kernel layer) as the single source of truth for well-known `.fgos/` file paths (`resolveFgosFile`/`FGOS_FILE`), replacing independent path-building in every module and test that touched them. Moved `state.json` into `.fgos/cache/` (already gitignored) on top of it — the first attempt at this move broke 51 tests across 21 files with hardcoded copies of the old path; this shared resolver closes that gap for good.
- Retired eager periodic event log checkpointing (interval 900s / threshold 50 events) in favor of sweeping dirty `.fgos/events/` shards into staged merge commits, with a 3600s fallback interval (`checkpoint.fallbackIntervalSec`).
- Retired the `.fgos/events.jsonl` seq-contiguity band-aid: removed `.gitattributes`'s `merge=union` entry for it, `src/state/events-jsonl-contiguity.mjs`, `scripts/events-jsonl-contiguity.mjs`, `scripts/check-events-seq-contiguity.mjs` (and its `npm run check:events-seq` script), and the `fgos doctor` `events-jsonl-contiguous` check/fix pair. `seq` stopped being cross-writer identity once every writer got its own per-writer file under `.fgos/events/` (content-hash `h` is the real identity now), and baseline-0 no longer receives new appends, so the union-merge failure shape this surface existed to repair can no longer happen.
- `.gitattributes` now applies `merge=union` to `.fgos/events/*.jsonl` (the per-writer sharded event-log files introduced by the event-log sharding migration), matching the existing rule for the old single-file `.fgos/events.jsonl` and the diagnostic logs — every session's own live shard was hitting the same git append-conflict problem those earlier rules already solved.
- Worktree-dispatch identity attestation upgraded to level 2 enforcement halt (`tsk-34o5`): `startupReap`, `fgos return`, and `fgos approve` now validate recorded `baseCommit`/`headRef` attestation against actual git branch state, halting with typed reason `attestation-mismatch` on identity divergence.
- `scripts/fgos-shell-integration.sh`'s `fgos()` shell function now automatically appends `--dir "$root"` to `bin/fgos.mjs` invocations when the caller omits `--dir`, preserving any explicit `--dir` passed by the caller. Rewrote all CLI examples across skill documents (`core/skills/` and `domains/coding/skills/`) into flat, single-line `fgos <verb>` subcommands, eliminating multi-statement `root=$(git rev-parse...)` compounds that trip worktree-isolation guards.
- Updated `resolveAgentTypeForTaskSpec` (`src/runner/dispatch/cli.mjs`) to fail closed (returning `null`) across all four unvalidated/mismatched eligibility fallback points (missing taskSpec header, pinned agent missing from roster, empty `requires-skill`, and no roster agent matching required skills) instead of falling open to an unvalidated agent name.
- `fgos return` now accepts `--worker-verified-sha <sha>` to skip re-running verify when an out-of-process worker already verified the exact same branch tip commit; `executeExecutorCli` now returns `verifiedSha` on `[DONE]` results and `fanoutBatchExecutorCli` threads it into return.
- `src/setup/skill-wrappers.mjs`'s `assembleSkills`/`generateAllSkillWrappers` now prune orphaned entries under `.agents/skills`/`.claude/skills` whose source skill was deleted (marker-gated for `.claude/skills`, so a hand-authored/plugin skill never generated by this module is never touched), and throw on a same-named skill declared in more than one of `core/skills`/`domains/*/skills` instead of silently overwriting.
- `scripts/project-agents.mjs`'s D33 agent-name-uniqueness check now deprioritizes a legacy `agents/` entry (logs a warning, skips it) instead of hard-throwing when it collides with a single `core/agents`/`domains/*/agents` entry; a collision between two non-legacy sources still throws as before.
- `.fgos/events.jsonl` is now the frozen baseline of a multi-file event log: new events land in per-writer files under `.fgos/events/<writer-id>-<openTs>.jsonl`, each event carries a content-hash `h` and writer `src` identity, and cold per-writer files are periodically compacted into a verified `baseline-<ts>.jsonl` (originals archived under `.fgos/events/archive/`, never deleted). `fgos doctor` gained `events-compaction-verified` to re-check a past compaction's integrity.
- Added a config-driven `herdr-spawn` dispatch adapter that lets any agent CLI dispatch through a real, visible herdr pane instead of an invisible `cli-spawn` subprocess, controlled purely by `.fgos/config.json` (`tsk-5jl`); renamed the `agy` `cli-spawn` executor to `agy-cli` and added a new `agy-herdr` executor (`tsk-2ii`); redesigned `agy-herdr` to use `agy`'s real `-i` interactive mode instead of headless `-p`, for genuine TTY visibility (`tsk-10j`); and fixed a false-idle race in the herdr `agent_status` polling that could make the `interactiveMode` adapter report success without the dispatched agent ever actually finishing its work (`tsk-2rr`).

### Added

- `fgos doc demote` — the mirror of `fgos doc promote` (`active` -> `provisional`), the door `scripts/knowledge-migration.mjs` needs to satisfy the registry redesign's "leaves every migrated document provisional unless explicitly promoted" rule (tsk-3uc).
- Doctor checks `doc-current-path-missing` (a live doc's `currentPath` not committed at `HEAD`) and `doc-source-unreachable` (a path-shaped `sourceCaptureIds` entry not reachable through its own current/alias paths); `doc-source-conservation` extended from a single outcome-reachability check to also catch a target document with no source, a duplicate migration-inventory source assignment, and a source lost mid-migration (tsk-3uc).
- Extensible multi-audience artifact-producer registry for knowledge management (`fgos topic *`, `fgos doc *`, `fgos knowledge *`, `fgos doc-registry`) (tsk-28x).
- `glm` (OpenRouter GLM 5.2 model) registered as a new runner executor in `.fgos/config.json` via a new per-executor `env` override schema with `${VAR}` substitution against `process.env` in `dispatch/transport.mjs`.
- Opt-in `--fields <comma,separated,list>` flag on `fgos list --id <id> --json` to filter `work[id]` fields down to a validated live-pointer set (`stage`, `status`, `holder`, `title`, `docsRef`, `verify`, `parent`, `id`, `domain`, `kind`, `risk`, `tier`) and omit history side-log sections from the response.
- `fgos faults [--limit N]` — read surface for `.fgos/invocation-faults.jsonl`, the malformed-invocation log `fgos`'s own failure handler writes (unknown verb, missing store, a bad `--dir`, an arg-parse fault). Resolves the log the same worktree-safe way it is written, so a linked worktree with no `--dir` still reads the main checkout's real records instead of an empty view.
- Split `agents/*.yaml` into `core/agents/` and `domains/<name>/agents/` (D24) and added global unique agent-type name doctor check `agent-type-names-unique` (D33).
- Explicit task-spec contracts (`core/task-specs/`) for 7 domain-agnostic skills (`fgos-routing`, `fgos-clarifying`, `fgos-researching`, `fgos-unlock`, `fgos-fanout`, `fgos-indexing`, `distill`), with doctor `task-specs-resolve` validation.
- D20/D22 agent-type eligibility resolution (`resolveAgentTypeForTaskSpec`, `src/runner/dispatch/cli.mjs`) is now wired into the real out-of-process dispatch path (`spawnWorker`, `executeExecutorCli`), via a new `src/runner/agent-roster.mjs`. Only has an observable effect on a command-less/adapter-less executor entry with no static `agentType` of its own — no executor this repo configures today (agy/claude/codex/pi) is affected.
- D28's nested-sync-call cap (`openSyncDepth`) is now reachable: `recordCall`/`fgos handoff --open-sync-depth <n>` accept a caller-supplied depth (never derived from the event log — a sync call's own record commits atomically, so nesting can only be known by a caller tracking its own recursion).
- `scripts/write-wrapper-script.mjs` — reusable helper CLI script to write executable wrapper shell scripts for multi-statement commands that trip worktree isolation guards.
- Dispatch-execute reliability pass (`src/runner/dispatch/transport.mjs`,
  `src/runner/recovery.mjs`): the `cli-spawn` adapter now caps nested
  out-of-process dispatch at 3 levels deep (an executor that itself
  dispatches another executor, e.g. `agy` fanning out further, is refused
  past the cap via `FGOS_DISPATCH_DEPTH`) and supports an optional
  `runner.idleTimeoutMs` config field — when set, kills a worker that has
  gone completely silent for that long, resetting on every stdout/stderr
  chunk, distinct from `timeoutMs`'s unconditional absolute ceiling. Both
  new failure classes (`dispatch-in-flight`, `dispatch-depth-exceeded`) are
  now registered in the recovery matrix (`dispatch-in-flight` retries,
  `dispatch-depth-exceeded` parks) instead of falling through to the
  matrix's fail-safe halt. `node dispatch.mjs execute`'s failure output
  also gains a structured `{error, errorClass}` JSON line on stdout
  alongside the existing human-readable stderr message, so a calling skill
  can branch on the failure class instead of only ever seeing a bare exit
  code.
- `node dispatch.mjs execute --contract <file>` — a CLI door that builds and
  runs an inline Assignment straight from a caller-authored execution
  contract file (ADR-006 §4's field set, flat JSON; an optional top-level
  `caller` key overrides the auto-resolved writer identity), with no Work
  item, Stage, or `decide --for` involved. Mutually exclusive with `--for`
  and `--assignment`. Accepts `--work <id>` to attach the contract to a real
  Work at a declared Stage, firing that domain's harness seam (ADR-007 §1)
  when one exists.

### Fixed

- `glm-cli` executor (`.fgos/config.json`) was missing `allowCrossProvider: true`, so every dispatch to it was rejected by the cross-provider egress governance gate before ever spawning ("resolves to cross-provider egress target ... would leave the Claude ecosystem") -- the executor genuinely does route to OpenRouter by design (its own config description says so), so this was a missing declaration, not an intentional block. Confirmed fixed live: a real self-identification dispatch now returns `MODEL=z-ai/glm-5.2`.
- Closed a series of real gaps in the knowledge registry's lifecycle/migration/bootstrap enforcement (tsk-3uc, follow-on to tsk-28x): `doc.register` could silently move an existing doc's lifecycle (demoting `active` back to `provisional` on a bare re-register, or resurrecting a `retired`/`superseded` doc); `doc.attest`/`doc-current-path-missing`/`doc-source-unreachable`/`doc-source-conservation` treated a `superseded` doc as still live; `topic.merge`/`topic.split` accepted a non-`active` target/source; `topic.retire` on a nonexistent topic was a silent no-op; `doc.supersede` accepted an unvalidated `supersededBy` pointer; `doc.mark-rendered` silently no-oped on a non-`reserved` doc; `scripts/knowledge-migration.mjs` could partially apply (file moved before the registry write, which could then fail), never validated conservation against the full inventory (only the still-pending subset), used shell-interpolated `git mv`/`git add`, and its "already migrated" shortcut accepted a dead doc or an unreachable file as success; `scripts/knowledge-bootstrap.mjs` could partially write across rows in one inventory (an earlier row durably created before a later row's own drift/validation failure) and treated a `retired`/`superseded` doc or `purposeSlug`/`framework`/`mode` drift as idempotent success.
- `settleClaim` (`src/state/store.mjs`) no longer refuses `fgos return`/
  `fgos plan`/`putInAwaiting` on a durable revision drift caused entirely
  by the SAME writer that holds the claim — the routine mid-lifecycle
  `fgos edit` calls `fgos-coding-planning`/`fgos-coding-discovering` make
  by design. It now reconciles when every event touching the item since
  claim time is positively attributed to the claiming writer, and still
  refuses exactly as before when any event carries a different (or
  missing) writer id — a genuine concurrent conflict is unaffected.
- `mergeRunnerItem` now performs an ownership-checked lock renewal synchronously
  after verify/invariant checks and before `git commit`, so a lost merge lock
  is caught deterministically as `lock-lost-mid-merge` instead of depending on
  a background heartbeat timer firing in time.
- `fgos pick`/`fgos take` (`claimWork`, `src/runner/claim-port.mjs`) now
  self-heal an `AMBIGUOUS` `.fgos/main-checkout.lock` (unparseable content)
  inline: it calls the same `forceReclaimAmbiguousLock` the `unlock` verb
  already used and retries the claim once before falling back to the same
  `lock-ambiguous` error — a transiently-corrupt lock no longer requires a
  separate manual `fgos unlock`/`/fgOS:unlock` call to clear it.
- `mergeRunnerItemLocked` (`src/runner/merge.mjs`) no longer refuses a
  successful merge just because it left a `merge=union`-attributed
  `.fgos/*.jsonl` path staged (e.g. `.fgos/events.jsonl`, its sharded
  `.fgos/events/*.jsonl` files, or the diagnostic logs) — it now restores
  that specific path to the target's own pre-merge committed content and
  re-checks before deciding, instead of rejecting the merge outright. Any
  other `.fgos/` path (not `merge=union`-attributed, or newly introduced
  with no target-side version to restore to) still trips
  `fgos-write-rejected` exactly as before; this closes the gap tsk-2xg
  left open (its own `.gitattributes` `merge=union` half already
  shipped, but the "restore-then-recheck after a clean auto-merge" half
  never landed), which had been tripping `approve` on nearly every
  long-lived branch under concurrent write load on `.fgos/*.jsonl`.
- `performCatchUp` and `mergeRunnerItemLocked` (`src/runner/merge.mjs`)
  no longer report a real `conflict` outcome for a git-merge conflict
  confined entirely to `.fgos/` paths declared `merge=union` — a worker
  branch that at some point recorded a DELETION of a shard (e.g. an
  earlier manual `git rm --cached` recovery from an unrelated conflict)
  raised a real modify/delete conflict the moment the calling session's
  own subsequent event-append grew that same shard elsewhere, which the
  `merge=union` driver never auto-resolves (deletion is never handled
  by a content-merge driver, regardless of attribute). New helper
  `resolveFgosOnlyConflict` restores every such conflicted path to the
  trusted side's own committed version (`HEAD`/main for `approve`,
  `target` for `catchup`) instead of aborting — neither merge direction
  has any legitimate claim over the other's `.fgos/` state (ADR0020),
  so this was always a false conflict, not a real content dispute.
- The `cli-spawn` dispatch adapter (`src/runner/dispatch/transport.mjs`)
  now spawns every executor `detached: true` and kills its whole process
  GROUP on timeout/maxBuffer (`process.kill(-pid, ...)`), not just the
  directly-spawned pid — an executor CLI that shells out further (a
  grandchild process) no longer survives its own parent being killed.
- **Breaking (store schema):** the coding `roleGraph`'s `human-advisor`
  role was renamed to `advisor` (D16). Replay now normalizes the retired
  literal for any pre-rename `work.handoff` event already committed to an
  existing `events.jsonl` — without this, an item still parked with
  `holder: "human-advisor"` from before the rename would be permanently
  stuck (any further write to it throws `WorkValidationError`, since the
  current roleGraph vocabulary no longer accepts the old name). Run
  `fgos rebuild` after upgrading if any item was parked at the old role —
  `state.json`'s own incremental-snapshot fast path does not re-apply a
  code-only fix to already-replayed history on its own.
- `agents/*.yaml`'s eligibility field was inverted from `claims` to
  `skills` (D20) with no migration note — any existing `agents/*.yaml`
  still carrying `claims:` now has it silently ignored at projection
  time. Update `agents/*.yaml` (and `core/agents/`, `domains/<name>/agents/`)
  to declare `skills:` instead.
- `materializeSkillsIntoProject` (`fgos setup`'s external-project
  materialize path) no longer crashes when `packageRoot` (a real global
  npm install can be root-owned or read-only) can't be written to during
  its `assembleSkills` re-render step — degrades to using the
  already-shipped, committed `.agents/skills` instead.
- `package.json`'s `files` array now includes `core/` — a packed/published
  install was missing `core/task-specs/`, `core/skills/`, and
  `core/agents/` entirely, contradicting the new `core/` vs `domains/`
  authoring split the moment fgOS is installed rather than checked out.

### Added

- `runner.executors.claude` in `.fgos/config.json` — claude is now
  addressable by name in dispatch (`decide claude`, `executors.claude`)
  the same way `agy`/`codex`/`pi` already are, instead of only being
  reachable through the anonymous top-level `runner.executor` default.
  Same command/args as that default; no behavior change for existing
  callers.
- Three new read-only verbs: `fgos decision-index [--check]` generates
  `docs/decisions/index.md`, a projection of every platform/repo-wide
  decision (`fgos decision --scope <area>`) from `state.decisions`;
  `fgos context-render <id>` renders an item's `CONTEXT.md` "## Locked
  decisions" table from `state.decisions` in place, so the table is never
  hand-typed; `fgos authoritative-match --quadrant <docs/quadrant-dir>
  --topic "..."` (or `--check-duplicates`) skeleton-matches a topic
  against docs' own `authoritative_for` frontmatter, so a growing skill
  finds an existing doc to update instead of guessing a second path.
- `fgos decision --relation none|supersedes:<id>|touches:<id>` — every
  decision write now declares its relation to prior decisions explicitly;
  a `supersedes` relation runs a write-time sweep across `docs/`, `src/`,
  `plugins/` for citations of the superseded id that don't also
  acknowledge the new one, surfaced as `danglingCitations` on the write's
  own response.
- `fgos decision --scope <area>` — a platform/repo-wide decision (no
  `--id`) that shows up in the generated `docs/decisions/index.md`.
- `fgos doctor`/`fgos doctor --fix` gained a `decision-index-stale`
  check+fix pair: reports and repairs drift between `docs/decisions/
  index.md` and `state.decisions`.
- The hand-authored `docs/decisions/000N-*.md` ADR corpus (34 files) has
  been retired: `state.decisions` (via `fgos decision --scope`) is now the
  source of truth for platform decisions, with full narrative migrated
  verbatim into the relevant `docs/specs/<area>.md`'s own "Lịch sử quyết
  định" section. `docs/decisions/index.md` (generated) replaces the old
  hand-written `0000-index.md`.
- `runner.capabilities` — a curated catalog of capability names, shared
  between the tool-registry's own `capability` field and
  `capacities.<id>.for`. Each entry is `{description?, aliases?}`. This
  repo's own `.fgos/config.json` declares `impact-analysis`/`pane-labeling`.
- A one-line `fgos: dispatch capability=... capacity=... via=... provider=...
  model=... tier=...` diagnostic prints to stderr at every real dispatch
  chokepoint — `spawnWorker` (the runner's own worker dispatch) and both
  branches of `executeCapacityCli` (`execute`/`execute --for`'s in-process
  hand-back and out-of-process real spawn) — right before the capacity is
  actually invoked, so a human watching the terminal can see which
  capability was requested, which capacity answered it, through which
  mechanism/provider/model/tier. Diagnostic-only, never read back by any
  caller.
- Multi-role team harness, first slice (coding domain): work items gain an
  optional third axis, `holder` — orthogonal to `status` and `stage`, opt-in
  per-domain via a new `roleGraph` declaration that names the legal
  role-handoff edges for a domain/stage. Two new verbs, `fgos handoff <id>
  --to <role> --reason <advise|assist|review|consult>` and `fgos
  handoff-return <id>`, let a session make a guarded role-to-role call
  between an implementer and a researcher/helper/reviewer/human-advisor
  (consult a researcher, get something reviewed, ask a human, hand off a
  scoped subtask) and record it in the event log — a call outside the
  domain's declared graph is refused with the legal edges named in the
  error, and a call outside a domain that declares no `roleGraph` at all is
  refused just as cleanly. Every existing item and every existing log
  replays byte-for-byte unaffected — `holder` and the two new event kinds
  are both fully optional/lazy, never present unless actually used.
- `runner.executors.pi` — `pi` (`@earendil-works/pi-coding-agent`)
  registered as a second `agent`-kind executor alongside `agy`, via
  `fgos setup`'s existing config-default merge (no manual `.fgos/
  config.json` edit needed). Invocation shape: `pi --provider openai-codex
  --model gpt-5.5 --tools <allowlist> --mode json --approve -p <prompt>`,
  confirmed live against the coding-domain worker contract (a genuinely
  disposable work item, both a correct cold-pickup refusal and a correct
  commit-and-`[DONE]` completion) — see
  `docs/history/pi-executor-runtime-capacity/RESEARCH.md`.

- `codex` (OpenAI Codex CLI) wired as a new out-of-process dispatch
  executor (`.fgos/config.json`'s `runner.executors.codex`), using
  `codex exec --dangerously-bypass-approvals-and-sandbox` — an
  unconditional bypass, deliberately no OS sandbox boundary. Unlike
  `agy`'s own entry, this is not a lesser-but-real boundary: research
  (`docs/history/codex-permission-capability-boundary/RESEARCH.md`,
  branch `fgw/tsk-4kh`) proved `codex`'s real sandbox
  (`-s workspace-write`) blocks the worker contract's own `git commit`
  step outright, because this repo's `.githooks/pre-commit` spawns a
  nested `git` subprocess the sandbox refuses with `EPERM` — a decision,
  not an oversight, accepted explicitly after reviewing that trade-off
  (`docs/history/codex-bypass-executor/`).

### Changed

- Explicit verify cadence rule added to `.agents/skills/_shared/coding-worker-contract.md` Layer 2 rule 2: out-of-process workers are now instructed to run the item's `verify` command once, near the end, when they believe the work is actually done — never as a per-edit habit.

### Fixed

- The `cli-spawn` dispatch adapter (`src/runner/dispatch/transport.mjs`)
  now spawns every executor with `stdin: 'ignore'` instead of the
  default open pipe. `codex` (unlike `agy`) checks for piped stdin on
  startup ("Reading additional input from stdin...") and blocks
  indefinitely on a pipe nothing ever writes to or closes — found live
  wiring `codex` as an executor (`docs/history/codex-bypass-executor/`).
- The same stdin-pipe hang also affected `runCommand`
  (`src/runner/goal-check.mjs`), the shared verify runner behind `fgos
  return`/`approve`/merge/dispatch's own re-verify — a `codex`-based
  `verify` command timed out there too until the same `stdin: 'ignore'`
  fix was applied.
- `fgos decision` now requires `--text` explicitly. Before this, a call
  with no `--text` silently fell back to joining whatever positional
  arguments were left over (e.g. `fgos decision write "..."` stored
  "write ..." as the decision text) instead of refusing — the CLI now
  refuses cleanly (exit 4) rather than storing corrupted decision text.
- The `agy` (Antigravity Cli) executor no longer dispatches with
  `--dangerously-skip-permissions` (`.fgos/config.json`'s
  `runner.executors.agy`, now `--mode accept-edits`). `fgos doctor`/`fgos
  setup` provision a real command-permission boundary in agy's own
  settings.json instead (`agy-permissions-configured` check,
  `src/setup/agy-permissions.mjs`): `toolPermission: "always-proceed"`
  plus a `permissions.deny` list blocking destructive/exfiltration-prone
  commands (`rm -rf`, `sudo`, force-push, `git reset --hard`, `git stash`,
  raw `curl`/`wget`). This is a denylist (default-allow, explicit-deny),
  not a true default-deny allowlist — `agy`'s headless (`-p`) mode was
  live-proven (`docs/history/agy-permission-capability-allowlist/
  RESEARCH.md` Round 4) to blanket-deny every command-type tool call under
  its `strict`/`request-review` modes regardless of `permissions.allow`
  content, so a real allowlist is not reachable there today — still
  strictly narrower than the unconditional bypass it replaces.
- `fgos decision` gains an optional `--kind` flag. Before this, every
  write through the CLI verb defaulted to `addDecision`'s own `'design'`
  kind — including `fgos-coding-validating`'s own audit line for an
  auto-approved gate — which the retrospective/cleanup gate
  (`checkRetrospectiveContent`) read as a human reflecting on the work,
  letting an item satisfy that gate with no retrospective document behind
  it. `fgos-coding-validating` now passes `--kind engine` on that line.

### Changed

- `capacities.<id>.kind` is now the `agent`/`tool` axis (WHAT a capacity
  is — a live persona, potentially native-dispatchable, vs a mechanical,
  presence-only tool), separate from `invocations[].via` (HOW it's
  invoked — `cli`/`task`/`mcp`, widened from `cli`-only). `capacities.<id>.for`
  is now a non-empty array (was a single value) — one executor can serve
  multiple capabilities at once, each validated against the
  `runner.capabilities` catalog above (replaces the old, narrower
  `CAPACITY_PURPOSES` enum). Cross-provider governance
  (`allowCrossProvider`) now applies regardless of `kind` — only an
  `agentType`-resolved capacity is exempt (previously any `kind:"task"`
  capacity was, even one with its own real, non-Claude command).
  **Not yet applied to this repo's own live `.fgos/config.json`** — this
  is a breaking `kind`-vocabulary change (unlike the two entries above),
  so it lands together with the code that reads it, not as a separate
  advance commit. (`docs/specs/runner.md` RUL65,
  `docs/reference/forgentx-tool-registry-configuration.md`)
- `EXECUTOR_ADAPTERS`' adapter function signature is generalized from
  `(command, args, cwd, opts)` to `(invocation, opts)` — each adapter now
  reads whatever fields its own invocation shape needs (`cliSpawnAdapter`
  reads `command`/`args`; the new `httpAdapter` reads
  `method`/`url`/`headers`/`body`) instead of every adapter being forced
  through a CLI-argv-shaped call. A real second adapter is now registered:
  `EXECUTOR_ADAPTERS.http`, making a real HTTP request via `fetch` (timeout
  aborts the request; a non-2xx status is a normal result, never a thrown
  error, matching `cli-spawn`'s own "non-zero exit is not an error"
  stance). `INVOCATION_VIA` gets `'api'` back (dropped earlier for 0
  historical producers; now backed by this real adapter) —
  `capacities.<id>.invocations[]` may declare `{via: "api", url: "..."}`.
  `resolveExecutorConfig` still only ever selects/spawns a `via:"cli"`
  invocation — this is a pluggability precedent, not a new production
  dispatch path; 0 capacities register `via:"api"` today.
  (`docs/specs/runner.md` RUL66,
  `docs/reference/forgentx-tool-registry-configuration.md`)
- A `capacities.<id>` capacity that is **cli-spawn-shaped** (declares its
  own `command`/`adapter`, or an `invocations[].via === "cli"` entry —
  e.g. an `agy`-backed capacity) now dispatches out-of-process whenever it
  is configured, even when the caller already has live Task-tool access.
  Previously a live/interactive session with Task access always won
  in-process, silently never invoking the configured command at all. A
  capacity that is **agentType-shaped** (only `agentType`, no command of
  its own) is unaffected — `hasLiveTaskAccess` still decides there, since
  resolving it in-process already means honoring the configured target.
  (`docs/decisions/0033-cli-spawn-shaped-capacity-thang-hasLiveTaskAccess.md`,
  narrows `docs/decisions/0026` rule 2)
- The per-tier `runner.executors.<tier>` config override is retired (0
  live entries; had already caused a real bug — a non-tier key silently
  fell through to the global executor with no error). A `capacities.<id>`
  entry naming no `command`/`adapter`/`agentType` of its own now resolves
  straight to the global `runner.executor`, with no intermediate stop.
  (`docs/specs/runner.md` RUL41/RUL63)
- `fgos tool register`/`fgos tool remove` are retired. A tool provider
  (e.g. `gitnexus`, `herdr`) is now declared directly in
  `runner.capacities.<id>` in `.fgos/config.json` — a `capability` field
  on the entry, config-edited like every other capacity, no longer through
  the event log. `fgos tool check`/`fgos tool query` are unchanged in
  shape and behavior, now sourced from config instead of `view.tools`.
  `.fgos/tool-status.local.json` (the local, gitignored presence overlay)
  is unaffected. (`docs/reference/forgentx-tool-registry-configuration.md`)
- The Iron Law gate now asks only where the answer can still matter: at the
  **trunk boundary**. A leaf merging into `fgw/<root>`, and a root
  `sync-root`-ing into its parent branch, go straight through — the gate
  fires only when the merge actually lands on trunk. Nothing about the
  classification itself changed (same `classifyIronLaw`, same
  matched-flags/matched-modules evidence); what changed is where it runs.
  Merge sweeps also no longer stall on a held item: an item the gate holds
  is recorded, walked past, and reported once at the end of the run, while
  it stays at `awaiting-approval`.
  (`docs/decisions/0032-cong-iron-law-chi-hoi-o-ranh-gioi-trunk-them-muc-warn.md`,
  which supersedes the always-hard-refuse clause of `D16/D17
  self-improve-loop`; `docs/specs/runner.md` RUL34/RUL37/RUL64.)
- The fgOS plugin ships as `1.2.0`. `resolveWriterIdentity` moved from
  `src/runner/session-identity.mjs` to `src/util/session-identity.mjs`, and
  the plugin's `terminal/rename.sh` follows it there — a cached copy of the
  plugin at `1.1.0` would otherwise keep loading the old path and silently
  stop resolving the fgOS session id in pane labels. Nothing else about the
  command surface changes: this is an internal boundary cleanup that cuts
  every `src/state/` → `src/runner/` import, collapses three copies of the
  Iron Law check into one `src/runner/iron-law-gate.mjs`, and moves
  `detectTrunk`/`isMainWorktree` to `src/runner/worktree.mjs`.
  (`docs/history/state-runner-merge-boundary/CONTEXT.md` D1/D2)
- Stage `planning` now asks a person **once**, not twice. The
  `planApprove` gate is gone from `fgos-coding-planning`; the single
  remaining gate lives in `fgos-coding-validating`, immediately before
  split children are created. It also asks a different kind of question:
  the agent first exhausts every action within reach, then weighs what a
  wrong answer would cost to repair, and only stops when one of three
  concrete triggers fires — presenting the specific thing it is stuck on
  and its own attempt so far, rather than the whole plan plus
  "approve?". When nothing is stuck it proceeds and posts a non-blocking
  note. Split children are no longer created during planning: their specs
  are written into `plan.md` and materialized in one step at that gate via
  `fgos plan --verdict decompose --children`, so a cut that turns out
  wrong costs nothing to change, and children arrive at `executing` with
  no gate of their own. A mid-planning hand-back to `fgos-coding-exploring`
  now records the gap it found, so the re-entry closes only that gap
  instead of re-running a full exploring pass.
  (`docs/history/coding-planning-validating-gate-redesign/CONTEXT.md`;
  supersedes `docs/history/gate-bypass/CONTEXT.md` D6, D4, and D2's
  never-self-report clause, and replaces the `canAutoApproveValidate`
  export with `canAutoApproveMergedGate`.)

### Added

- New config key `ironLaw.level` in `.fgos/config.json`, with two values:
  `ask` (the default — the gate refuses until a person acknowledges) and
  `warn` (opt-in — the gate prints what it matched, records one engine
  decision entry, and lets the merge through). Anything that is not exactly
  `warn` reads as `ask`, including a missing key or a malformed config, so
  the permissive level is never reached by accident. `fgos doctor` reports a
  missing or unrecognized level and `fgos doctor --fix` writes the `ask`
  default. Deliberately its own key, never folded into `gateBypass`, whose
  floor is documented as never touching the Iron Law.
- New `/fgOS:approve <id>` skill: one command covers both `fgos approve` and
  `fgos sync-root`, inferring which verb the id actually needs, and always
  showing the blast radius — which verb, which target branch, how many items
  ride along — before asking anything. When the Iron Law gate holds an item,
  it shows `docs/history/<id>/iron-law-evidence.md` verbatim, asks once, and
  runs the command itself on a real yes instead of handing over a line to
  type. It never adds `--acknowledge-iron-law` on its own authority.
- `README.md`'s `## Install` now recommends installing a tagged release
  (`npm install -g github:vantt/forgent#vX.Y.Z`) instead of always
  resolving to whatever commit is currently on `main` — the bare `main`
  command is kept as a documented bleeding-edge option. New how-to:
  `docs/how-to/cut-a-fgos-release-tag.md`, the manual (repo-owner-judgment)
  procedure for cutting a release.
- `fgos submit --backlog` creates an item directly at the `backlog` status —
  an idea not yet committed to — instead of the default `todo`, so marking
  something as not-yet-ready no longer means submitting it and then moving
  it. A `backlog` item carries its own `backlog` status category, so it is
  excluded from the ready frontier until a person promotes it to `todo`.
  The default is unchanged: a flagless `fgos submit`, and `fgos add` in all
  cases, still create items at `todo`.
- herdr TUI: a `BACKLOG` tab, first in the Work Items tab strip, showing
  items at the new `backlog` status. It is its own tab rather than a marker
  inside `TODO`, so nothing reads a backlog item as ready, and the strip
  renders the label even while the bucket is empty — promoting `backlog` to
  `todo` is a person's own call, and an invisible bucket never gets one. The
  landing tab is still `TODO`; unattended auto-discover continues to skip
  backlog items.
- Delivered-event merge provenance: `fgos approve`'s real merge paths (local
  root-into-main, local leaf-into-root, GitHub PR merge) now record
  `mergedSha`/`mergedInto` on the `work.move → delivered` event and the
  item's own folded view — the sha and branch a change actually landed on,
  readable straight through `fgos show`/`fgos list` instead of inferred
  from git after the fact. `fgos move --to delivered` now refuses when
  `fgw/<id>` exists and is not yet reachable from trunk (no merge evidence
  to record), unless `--override-reason "<why>"` is given — the override is
  logged to the item's decision log before the move proceeds. A verify-only
  pull-door delivery, or an item with no `fgw/<id>` branch at all, is
  unaffected either way.

- Worker slots: a ceiling on how many work items may run at once. `fgos
  slots` reports execution-lane occupancy, whether there is room, and the
  admin lane's fixed reservation — it is the door launchers (herdr-plugin,
  fgos-fanout) pre-check before standing a worker up. The same ceiling is
  enforced inside every claim path (`take`, `pick`, and the runner alike),
  which refuses with `worker-slot ceiling reached` once the lane is full.
  Occupancy is derived from work items already at `doing`; nothing new is
  recorded to get it. The ceiling ships UNARMED and stays that way until a
  person sets it: `fgos setup` writes `workerSlots.ceiling: null`, which
  refuses nothing, and a project is capped only once someone replaces that
  with a real count. It is deliberately not armed on your behalf — `fgos
  doctor` asks every project to run `fgos setup` as routine maintenance, so
  a number written there would cap a repo that never asked to be capped, and
  freeze its backlog if it was already running more items than the cap.
- `fgos doctor` gained a `worker-slots-ceiling-usable` check. A
  `workerSlots.ceiling` that is not a positive integer — `"8"` as a string,
  `8.5`, `0`, `-1` — enforces nothing at all, so a project could believe it
  was capped while running uncapped. The check names that, and reports the
  deliberate `null` as "unarmed" rather than as a problem.
- `fgos report <id> --text "..." [--stop-reason ...]` records a driver's
  closing report on the item, so a result can be read with `fgos show <id>`
  instead of by watching a terminal pane. `fgos-coding-driving` now records
  one at every stop, which is what makes a finished worker pane safe for the
  cockpit to reuse: the result no longer lives only on a screen somebody has
  to guard.

### Fixed

- The Claude Code plugin (`plugins/fgOS/`) now ships all 14 coding-domain
  dev-skills (`fgos-coding-driving`, `fgos-routing`, `fgos-clarifying`,
  and the rest) alongside its existing CLI-wrapper skills. Previously
  they existed only in this repo's own `.claude/skills/`, so any project
  that installed fgOS solely as a plugin (no forgent checkout anywhere)
  got "Unknown skill" the moment `/fgOS:cook`/`/fgOS:discover`/
  `/fgOS:plan`/`/fgOS:pick` tried to dispatch into one — even though the
  `fgos` CLI itself was fully reachable the whole time. A new
  `fgos doctor` check, `plugin-dev-skills-packaged`, catches a maintainer
  who forgets to keep the plugin's copies in sync before a release ships.

### Changed

- `fgos-runner` and `fgos-fanout` now ask for a worker slot before standing
  a worker up, instead of each enforcing a ceiling of its own. The runner's
  `runner.parallel.maxRoots`/`maxLeavesPerRoot` and fan-out's cap of 5 keep
  their values but change role: they bound how large a batch that launcher
  may propose, while the shared ceiling decides whether the batch runs at
  all — so the real limit on a machine is one number rather than the sum of
  three. A batch is trimmed to the number of free slots: the ceiling is hard,
  and anything fired past it would be refused at the claim door anyway, so a
  launcher stands up only what the engine granted and defers the rest to the
  next wave. With no `workerSlots.ceiling` configured, both behave exactly
  as before. A runner that finds the lane full now ends its run cleanly
  (`idle`, exit 0) rather than halting with a non-zero exit, and an item
  refused for lack of room is simply left for a later poll.
- The runner's discovery sweep now asks for a worker slot too. It stands a
  real research worker up but never claims the item, so that process was
  invisible to the ceiling and ran even when the lane was full — the machine
  could carry more workers than the configured total while `fgos slots`
  reported fewer.
- A runner that dispatched nothing now says which of the two happened.
  "Frontier empty — nothing to do" and "the lane is full, work is waiting"
  previously printed the same line and returned the same envelope; the idle
  result now carries `reason` (`frontier-empty` or `worker-slot-ceiling`),
  and a refusal names the item ids currently holding the slots, so a lane
  wedged by an abandoned claim is visible instead of looking like an empty
  backlog.
- `fgos doctor` gained a `delivered-not-on-trunk` check: it names any item
  whose status says its work was handed over (`delivered`, `retrospective`,
  `cleanup`, `done`) while its own `fgw/<id>` branch is still not reachable
  from the trunk. `delivered` is reachable through a bare `fgos move`, which
  merges nothing and asks for no proof that anything merged, so real tested
  work could sit outside `main` with nothing reporting it — `root-drift`
  only walks root items, and `fgos stale` waits a three-day TTL and then
  says "forgotten", not "unmerged". The check separates the two causes: a
  branch that merged nowhere needs its content landed, while one that landed
  on a root branch that has not synced needs `fgos sync-root` on the root
  instead.
- `fgos discover` and `fgos plan` no longer send the reader to each other
  when neither serves the item's stage. Each gate now checks whether its
  sibling would actually accept the item; when neither does, both say so
  plainly and point at `fgos doctor`'s stage-vocabulary check, instead of
  forming a closed referral loop with no way out.

- The `decompose` stage/verb/launcher family is renamed to `plan`: the CLI
  verb `fgos decompose` is now `fgos plan`, the slash command
  `/fgOS:decompose` is now `/fgOS:plan`, and the stage a coding-domain item
  sits at while being shaped is now called `planning`. The verdict values
  (`pass-through` / `need-human` / `decompose`) are unchanged — they name
  an outcome, not a stage. `decompose` itself survives as a legacy,
  drain-only stage alias so items already parked there before this change
  keep advancing through their existing edges; no new item can land on it.
  Five stage skills gain a `coding-` prefix to match the domain-prefix
  convention every other stage skill already follows:
  `fgos-exploring`→`fgos-coding-exploring`, `fgos-planning`→
  `fgos-coding-planning`, `fgos-validating`→`fgos-coding-validating`,
  `fgos-compounding`→`fgos-coding-compounding`, `fgos-code-implement`→
  `fgos-coding-implement`.
- The `clarify` stage is retired entirely — it is no longer a stage at
  all. The understand-the-ask pass it used to run moved to an Init-time
  helper (`fgos-clarifying`) that `/fgOS:submit` calls BEFORE the item is
  created, so an item is now born with the cleaned-up title/description
  and its domain already settled. Unlike `decompose`, no drain-only alias
  is kept: every item still open on `clarify` was migrated onto a real
  stage first, so nothing is stranded. `discovery` is now the coding
  domain's first stage, and no item can be created at, or moved to,
  `clarify` anymore.
- A `discovery` verdict now picks WHICH EDGE the item takes, instead of
  every item walking one fixed chain. `clear` skips `exploring` entirely
  and lands the item straight on `planning`; `unclear` advances it to
  `exploring` and parks it there for a person, so whoever answers resumes
  already sitting at the stage where the Socratic pass happens instead of
  looping back through discovery on the same unresolved question.
  Previously an unclear verdict parked the item in place, at whatever
  stage it was already on.
- `tier`/`kind`/`risk` are no longer judged from the raw submit text. The
  `fgos submit` verb still stamps its mechanical keyword-derived values,
  but those are now explicitly a temporary placeholder: stage
  `discovery`'s own skill (`fgos-coding-discovering`) makes the real call
  once, on the research evidence it just gathered, reading each domain's
  declared `kind`/`risk` vocabulary rather than a hardcoded list. No
  caller re-judges them at intake anymore — a wrong placeholder is
  corrected later by discovery's own judgment, not earlier by guessing
  harder at the ask. The `submit-assist-classify` capacity is retired
  outright, with no migration: it only ever described how to call a
  helper, never held a judgment that needed handing over.
- `/fgOS:retro-next` is now a launcher in the strict sense: it sweeps,
  picks one item, and hands it to `fgos-coding-driving` with an explicit
  `ceiling: status:cleanup`, relaying whatever the driver reports. It no
  longer resolves the synthesis skill, invokes it, moves the item, or reads
  a subprocess exit code itself. Observable behavior is unchanged —
  synthesis runs, the item lands at `cleanup`, the run stops there — but it
  now inherits the driver's park/anchor handling and its
  `stop-reason: lock-timeout` relay instead of duplicating thinner versions.
- `fgos-coding-driving` now resolves each iteration's next step from the
  item's **position** rather than always from `stage`: `stage` while it is
  live, `status` once it freezes at `awaiting-approval`. This makes the
  driver able to carry an item through the post-merge chain
  (`retrospective` → `cleanup`) that previously needed hand-rolled
  sequencing in each launcher. No registry or code change was required —
  `skillMap` has mixed stage and status keys since decision `0027` D5.
- `/fgOS:cleanup-next` now reports a stuck shared lock with the same
  `stop-reason: lock-timeout` marker line every other launcher and the
  driver already use, instead of describing that condition only in prose —
  so `/fgOS:cleanup-loop` reads the one loop-stopping category off a line
  rather than inferring it. Its exit-code classification is unchanged and
  documented as deliberate: unlike `/fgOS:retro-next`, it runs a real CLI
  subprocess, so an exit code genuinely exists to read.
- `awaiting-approval` changes from an unconditional stop into the driver's
  **default, overridable ceiling**. A caller that supplies no ceiling stops
  there exactly as before, so existing behavior is unchanged; a caller that
  deliberately passes a further `status:*` ceiling can drive past it. The
  merge gate stays a human decision, now protected by a named launcher
  convention (no launcher ships a default ceiling past `awaiting-approval`)
  rather than by the driver refusing structurally.

### Fixed

- An item whose root branch was ever synced (`fgos sync-root`), or that was
  converged into a component (`fgos promote-to-component`), could reach
  `done` without a retrospective ever having produced anything. Both verbs
  recorded their merge on the item as a decision but never said it was
  machine-written, and an untagged decision defaults to `design` — so the
  cleanup gate read a routine branch merge as someone's reflection on the
  work and passed the item through. Both records are now tagged as engine
  bookkeeping. They remain fully visible in `fgos show`; they simply no
  longer stand in for a retrospective document. Items that were relying on
  this to pass will now be held at `cleanup` until real synthesis happens.

- Parallel fan-out no longer refuses to dispatch anything when the
  worker-slot ceiling is unarmed — which is how every project starts, since
  `fgos setup` writes `workerSlots.ceiling: null` on purpose. In that state
  `fgos slots` reports room available but no numeric limit
  (`free: null`), and the fan-out launcher trimmed its batch against that
  number anyway, reading "no limit" as "no slots" and firing nothing while
  the machine was completely idle. It now fires the whole batch when no
  ceiling is armed, and trims only against a real one.
- `fgos check`'s entropy report no longer under-counts the backlog waiting
  at the front of the lifecycle. The signal filtered on the literal stage
  name `clarify`, which the coding domain retired entirely, so it reported
  0 forever while every open item genuinely parked at the domain's real
  entry stage (`discovery`) went uncounted. It now resolves each item's own
  domain entry stage, and the row is labelled `stage-entry` instead of
  `stage-clarify` to match what it actually counts.

### Removed

- `npm run check:decision-supersession` — the `docs/decisions/NNNN-*.md` +
  `0000-index.md` pointer-pair format it validated is retired for good
  along with the hand-authored ADR corpus (see Added, ADR retirement).
  `scripts/check-decision-supersession.mjs`'s pure functions stay real and
  unit-tested against synthetic fixtures; only the real-repo CLI mode had
  nothing left to run against.
- The `orchestrator` word ban (`test/docs/launcher-vocabulary-guard.test.mjs`
  and its 28-entry allowlist) is retired, per decision `0031`. Decision
  `0028` banned the term while it carried no meaning; decision `0029` D17
  then assigned it one — the T0 aggregate layer (N units, stays engaged),
  the role `/fgOS:*-loop` and `fgos-fanout` actually play. The guard was
  left blocking fgOS's own current vocabulary, and a word-level grep cannot
  tell the retired sense from the assigned one. Writing `orchestrator` in
  that assigned sense no longer fails the suite. `launcher` remains the only
  correct name for the one-unit, fire-and-forget role — that half of `0028`
  stands.

### Added

- New `fgos version` verb: reports this build's own `package.json` version,
  git commit (when resolvable), and its full dispatched verb set — a
  hook-safe, scriptable way to tell an old globally-installed `fgos` apart
  from a current checkout without reading `node_modules` directly. `fgos
  doctor` gained a matching `cli-version-visible` check that surfaces the
  same info in its own report.

- `fgos discover` accepts `--tier`, `--kind`, and `--risk` alongside
  `--verdict clear`, so an interactive session can record the classification
  it just judged in the same call that resolves discovery, instead of
  remembering a separate `fgos edit`. This is the same data contract a
  headless worker already had through its `fgos-verdict` block, and both
  paths now run it through one shared guard: nothing is applied unless the
  discovery outcome actually resolves clear, so an unclear verdict or a
  parked verify dispute still changes no classification. A value outside the
  item's own domain vocabulary is refused as a validation error (exit 4)
  before the item moves at all, and omitting a flag leaves that field
  untouched.
- Repo-invariant checks now run alongside an item's own `verify`, at both
  `fgos return` and the post-merge gate of `fgos approve`. The commands are
  declared per project in `.fgos/config.json` under `invariantChecks.commands`
  (this repo's default: `node --test test/architecture.test.mjs`), registered
  into `fgos setup`'s config-merge and visible to `fgos doctor` as the new
  `invariant-checks-configured` check. They are a hard gate: a red invariant
  blocks the return and aborts the merge, naming the command that failed.
  A project with no `invariantChecks` section behaves exactly as before —
  nothing runs, nothing changes. This closes the gap where a repo-wide
  invariant broken by one item could land on main and stay red across later
  merges, because no item's own narrow `verify` happened to touch it.

- `fgos doctor` gained a `work-stage-vocabulary` check: it names any open
  item sitting at a stage its own domain no longer registers. Until now
  only `risk`/`kind` drift was surfaced this way, so an item stranded on a
  retired stage — which no `fgos edit` can correct, since `stage` has no
  editable door — stayed invisible until some other command tripped over
  it. The `discover` pool now derives its candidate stages from the same
  source the `fgos discover` verb checks against, so it can no longer offer
  an item that the verb would then refuse.

- `fgos promote-to-component` gained an opt-in `--trust-dir` flag: with an
  explicit `--dir` also passed, it can now run from inside a linked
  worktree instead of refusing outright. Default behavior (no flag) is
  unchanged. See `docs/how-to/recover-approve-sync-root-from-inside-a-
  worktree-with-trust-dir.md`'s new `promote-to-component` section.

### Changed

- `fgos approve` no longer re-runs an item's checks when the tree it is about
  to merge is provably the exact tree `return` already verified green (main
  has not advanced past the fork, and the branch tip still matches the SHA
  recorded at return). In that case both the item's `verify` and the
  invariant checks are skipped, and the merge report says so explicitly.
  Whenever main HAS advanced, the merged tree is genuinely different and
  every check runs as before.

- `fgos doctor` gained a new check, `events-jsonl-contiguous`: the shared
  `.fgos/events.jsonl` is now checked for seq breaks/duplicates that an
  ordinary git merge can leave behind (a new `.gitattributes` entry routes
  it through git's built-in `union` merge driver, closing the underlying
  merge-conflict-hand-resolution class of event loss). `fgos doctor --fix`
  repairs a found break by deduping exact-duplicate lines and renumbering
  `seq` contiguously — no event is ever dropped by the fix.

- Work-item `kind` and `risk` now have a per-domain vocabulary, declared by
  the domain itself (`DOMAINS.<domain>.classification`) and enforced at the
  write door alongside the existing `tier` enum. Coding declares
  `kind: bug|chore|design|docs|feature|task` and
  `risk: light|standard|heavy`. A domain that declares no vocabulary is
  unaffected — any non-empty string still passes, exactly as before.

- `pick`/`take` now transparently reclaim a `doing` item whose `human`/
  `session` claim has genuinely gone quiet — no new verb or flag. When a
  claim conflict would otherwise refuse unconditionally, the existing
  claim's worktree/branch activity (real commit + file-edit signal, not
  session/process identity) is checked first; past a conservative
  threshold (same `agentMs`/`humanMs` split `/fgOS:stale` already uses),
  the stale claim is released and the new claim reattaches to the
  existing branch (never force-removed). Runner claims stay untouched
  (`startupReap`'s own domain), and only a live `pick` attempt (never
  `take`, never a `runner` caller) can trigger it. Every other case —
  recent activity, or unreadable evidence — refuses exactly as before.

- The shared config file gains a `herdrOrchestrator: {autoDiscover,
  autoMerge, autoRetro, autoCleanup}` section (all off by default,
  fail-closed on a missing or malformed value) for the herdr-plugin
  dashboard's future auto-launch toggles. Surfaced by `fgos doctor`'s new
  `herdr-launcher-configured` check and merged in by `fgos setup`, same
  as every other registered config default.

- The herdr-plugin dashboard auto-launches a guarded agent pane running
  `/fgOS:discover <id>` for the first `discovery`-stage, `todo`-status
  item it finds, once per poll tick, when `herdrOrchestrator.autoDiscover` is
  on (off by default). Guarded against double-launching the same item via
  a dedicated pane label, kept separate from the dashboard's existing
  In-Process pane tracking so it never shows up there as a phantom task.

- The herdr-plugin dashboard also auto-launches into the fixed
  `fg:operation` tab when `herdrOrchestrator.autoMerge`/`autoRetro`/
  `autoCleanup` are on (all off by default): the left pane runs
  `/fgOS:merge-loop`, the right pane runs `/fgOS:retro-loop` or
  `/fgOS:cleanup-loop`, alternating by priority. Guarded against
  double-launching via a dedicated fixed pane title per toggle, same as
  auto-discover.

### Changed

- `/fgOS:submit` run from a live session now clarifies the ask before the
  item is created: `fgos-clarifying` reads the raw text and hands back the
  cleaned-up title/description and the domain, and `fgos submit` is called
  with those. It never judges `tier`/`kind`/`risk` itself — stage
  `discovery` does that, once, on real evidence. Any question it needs to
  ask is asked while you are still in the conversation, rather than days
  later at a discovery sweep. The `fgos submit` verb itself is unchanged — still mechanical,
  still no model call — so a bare shell, cron, another agent, or the
  dogfood fixture replay all behave exactly as before.

### Fixed

- An item parked for a person after being judged NOT clear at `discovery`
  was still recorded in the settlement channel as having passed, because
  the settlement record keyed only on the item leaving `discovery` — which
  an unclear verdict now also does. Where the item had no real verify yet,
  the record's detail read as the literal "chưa xác định — bổ sung thủ
  công" placeholder. A settlement is now recorded only when the verdict
  that drove the move was clear. Records already written for real clear
  passes are unaffected; nothing is re-derived or silenced retroactively.
- Items could be stored with a `risk` value nothing in the system reads
  (`low`/`medium`/`high`), which silently disabled two behaviors rather
  than failing: the human-confirmation gate that fires before a
  `risk: heavy` root is split, and the risk discount in the priority
  formula (which fell back to its `standard` weighting). Such a value is
  now rejected when written. Items already stored with one keep replaying
  and stay editable; only a write that actually touches the field is held
  to the vocabulary.

- Merging could fail for reasons that had nothing to do with the work being
  merged. The event-log concurrency test queued 800 serialized lock
  acquisitions against a 2s per-acquisition budget, so under the load of a
  full test run it could exceed that budget and fail — and because that run
  is what `fgos approve`/`fgos return` use to verify a merge, the merge was
  rolled back and an innocent item was parked in `blocked`. Observed three
  times in one day on two unrelated items. The test now queues an amount
  the budget was actually documented for, and still fails loudly if the
  append lock itself regresses.

### Removed

- The standalone `fgos-submit-assist` skill. Its own steps had no reason
  left to exist on their own: title derivation always lived in the
  `submit` verb itself, and its tier/kind/risk classification now happens
  once at stage `discovery`, on real research evidence, for every item
  regardless of which caller created it. Use `/fgOS:submit` directly; it
  now does strictly more than this skill did.
- The `resolve` CLI subcommand (`node src/runner/dispatch.mjs resolve`)
  and `resolveCapacityCli`. 0 production consumers (confirmed via impact
  analysis); `execute` already covers everything `resolve` did, and
  actually runs the command instead of handing back `{command,args}` for
  the caller to run itself through Bash.

### Added

- `decide` gains a `--needs-soul` flag: the caller's own self-declaration
  that it is about to fire its own Agent/Task tool with no capacity or
  work item to name. When every other lookup (capacity id, `--for`,
  `--work`) comes up empty, `--needs-soul` defaults the answer to native
  dispatch instead of `"unavailable"` — the same default `--work` already
  applied for a work item with no registered capacity override, now
  available to a bare Agent/Task call too.
- Every `decide` result now carries `configured: true|false` — `false`
  means nothing is registered under that name/purpose (the answer came
  from the default); `true` means a real `capacities.<id>` entry was
  found, whatever mechanism it resolves to. Lets a caller tell "typo'd or
  never configured" apart from "configured, and it happens to run
  out-of-process" — today both silently read the same
  `mechanism: "out-of-process"`.
- A `PreToolUse` hook (`scripts/dispatch-decide-hook.mjs`) now enforces
  that every Agent/Task tool call goes through `decide` first: it runs
  `decide --for <subagent_type> --needs-soul --has-live-task-access` on
  the caller's behalf and refuses the call when the answer is anything
  other than `in-process`, pointing at `execute` instead. Wired into
  `.claude/settings.json` by `fgos setup` (fill-only — a pre-existing
  `hooks.SessionStart` entry, or any other content, is left untouched);
  reported by a new `dispatch-decide-hook-wired` `fgos doctor` check. Fails
  open on any internal error (empty/malformed stdin, `decide` itself
  erroring) — never a second point of failure on top of a working dispatch
  surface.
- `capacities.<id>.capability` (the tool-registry's own free-text field) is
  now catalog-validated the same way `for` already was — a typo'd or
  undeclared value used to silently make a tool invisible to `fgos tool
  query --capability ...` with no error anywhere; it now fails config load
  with a clear message naming the missing catalog entry.
- `decide` hands back `mcpTool` (mutually exclusive with `agentType`) for a
  `kind:"tool"` capacity whose `mcp` invocation declares a `tools` map
  (`capability -> MCP tool identifier`) covering the requested purpose —
  `mechanism` is upgraded from `out-of-process` to `in-process` in that
  case, since dispatch has no MCP client of its own and hands the call back
  to the caller's own live one, the same reasoning `agentType` hand-back
  already uses for a live Agent/Task tool. Fixes a real gap: `decide --for
  impact-analysis` used to answer `unavailable` even though `gitnexus` was
  fully registered, because `toolsFromCapacities` (`fgos tool query`) and
  `resolveCapacityIdForPurpose` (`decide`) read two different fields.

### Changed

- `toolsFromCapacities` now prefers `capacities.<id>.for[0]` over
  `capacities.<id>.capability` when both are present, folding the two
  previously-separate capability fields into one read path — `capability`
  stays accepted as a tolerant fallback for a not-yet-migrated capacity,
  never removed by this change alone.

## [0.1.0]

Baseline snapshot of the public surface as of this entry.

### Added

- `fgos` CLI with 49 verbs covering the work-item lifecycle (submit,
  clarify/decompose/execute, review/merge, and maintenance operations).
- `fgos-runner` bin entry for the automated runner loop.
- Install/setup/doctor/uninstall story: `fgos setup` (global/project config
  merge), `fgos doctor` (check registry), and their uninstall counterpart.
