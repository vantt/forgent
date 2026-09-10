# Confinement Authority Implementation Plan

Status: READY FOR PLAN-LOOP EXECUTION | Created: 2026-09-10 | Owner: Lead session

Execution track: `confinement-authority-implementation`

This is a Work-independent implementation track. Do not create, claim, move,
approve, or route any Work item for this plan. Every coding cell runs through
CoordinationSession / group-thinking plan-loop mechanics, with the Lead
coordinating cells, review, red-team, dispositions, fix rounds, merges, and
proof collection outside the Work component.

## Authority Entering The Plan

Read these before opening any cell:

- `docs/specs/reading-map.md`
- `docs/specs/confinement-authority.md`
- `docs/specs/runner.md`
- `docs/specs/distribution.md`
- `docs/distribution-vision.md`
- `docs/routing-handoff-contract.md`
- `docs/architect/agent-coordination/architecture/group-thinking-trigger-surface.md`
- `docs/how-to/use-fgos-group-thinking.md`
- `docs/architect/agent-coordination/contracts/coordination-session.md`
- `docs/architect/agent-coordination/contracts/flow-definition.md`
- `docs/architect/agent-coordination/playbooks/prompts/master-coordinator.md`
- `core/coordination-protocols/standalone-master-coordination-loop.yaml`
- `.agents/skills/fgos-plan-loop/SKILL.md`
- `.agents/skills/_shared/planning-capability-awareness.md`
- `.agents/skills/_shared/capability-catalog.md`

## Goal

Ship the Agent Confinement Authority described by
`docs/specs/confinement-authority.md` far enough that group-thinking and
coding coordination can run across providers smoothly and honestly:

1. every external agent dispatch goes through one runtime Authority door before
   any adapter can spawn or deliver work;
2. `required` confinement fails closed before an agent starts;
3. `preferred` confinement degrades only with explicit attestation;
4. `unconfined` is an explicit audited opt-out, never omission;
5. `claude-bwrap`, `agy-bwrap`, and `codex-bwrap` stop hardcoding bwrap argv as
   their security story and instead run through the Authority plus backend
   registry;
6. group-thinking declared-protocol sessions can dispatch Doer, Reviewer,
   Red-Team, and Fixer across different providers with confinement evidence and
   no Work lifecycle coupling;
7. setup/doctor exposes every new config, backend, probe, and strict-readiness
   requirement.

## Non-Negotiable Boundaries

- No Work item, Work claim, Work status, Work approval, `fgos pick`, `fgos cook`,
  `fgos submit`, or `fgos-runner` loop for this plan.
- No direct production call site may call an executor adapter execute function
  outside Agent Confinement Authority after the one-door cells close.
- No backend fallback. One dispatch resolves one executor, and that executor
  references at most one backend instance.
- No project-local definition or override of machine backend instance config.
- No overclaim: default bwrap v1 may claim host filesystem write denial for the
  launched process tree and named channels only; it must not claim host read,
  network, process namespace, daemon/socket, or secret isolation it has not
  proven.
- No provider-specific branch inside the bwrap backend driver. Provider quirks
  become resource needs/bindings before the Authority door.
- No strict-mode flip until every committed capability anchor has explicit
  policy or explicit `unconfined`, and doctor can explain readiness.

## Product Gates

| Phase | Cell | Capability | Exit |
|---|---|---|---|
| 00 | [Contract freeze and repo map](phase-00-contract-freeze-and-repo-map.md) | `code:review` | The spec, architecture map, leases, and exact call-site inventory are frozen for implementation; no code behavior changes. |
| 01 | [Config, policy, and machine registry](phase-01-config-policy-and-machine-registry.md) | `code:implement` | Config schemas, setup defaults, doctor checks, machine backend registry loader, and policy normalization exist without enforcing dispatch yet. |
| 02 | [One-door authority observe mode](phase-02-one-door-authority-observe-mode.md) | `code:implement` | `spawnWorker` and `executeExecutorCli` both call `executeThroughConfinement`; production callers can no longer call adapters directly. |
| 03 | [Local bwrap backend, probes, and attestation store](phase-03-local-bwrap-backend-probes-attestation.md) | `code:implement` | bwrap backend can assess/prepare/cleanup, run falsification probes, and persist plan/attestation evidence outside agent write grants. |
| 04 | [Required enforcement and executor migration](phase-04-required-enforcement-and-executor-migration.md) | `code:implement` | Required policies fail closed; three bwrap executors migrate to backend references; fail-open paths F-a through F-d are closed and tested. |
| 05 | [Herdr and legacy confinement convergence](phase-05-herdr-and-legacy-convergence.md) | `code:implement` | Existing herdr session/home/worktree confinement normalizes through the Authority, or the remaining partial maturity is explicitly bounded and tested. |
| 06 | [Group-thinking coding dogfood proof](phase-06-group-thinking-coding-dogfood-proof.md) | `code:test` | A real Work-independent plan-loop run proves cross-provider Doer/Reviewer/Red-Team/Fixer dispatch with confinement attestation and at least one fix round. |
| 07 | [Strict readiness, docs, and closeout](phase-07-strict-readiness-docs-closeout.md) | `code:implement` | Strict mode can be enabled safely; docs/specs/changelog/tests are complete; full suite and live proof evidence close the track. |

## Parallel Execution Map

Run phases sequentially unless the Lead explicitly proves the current leases have
zero file overlap. Default schedule:

| Wave | Cells | Why |
|---|---|---|
| 1 | P00 | Freezes contract, inventory, and lease boundaries before mutating shared dispatch code. |
| 2 | P01 | Adds config/setup/doctor/machine state before runtime code depends on it. |
| 3 | P02 | Installs the one-door observe path across both dispatch entry points. |
| 4 | P03 | Adds the first backend, probes, and evidence persistence behind the door. |
| 5 | P04 | Turns required enforcement on for supported routes and migrates bwrap executors. |
| 6 | P05 | Converges herdr/legacy behavior after the default local backend is proven. |
| 7 | P06 | Dogfoods group-thinking with real provider diversity after enforcement exists. |
| 8 | P07 | Final strict-readiness, docs, changelog, and full-suite closeout. |

P01 and P02 may look parallelizable, but the default is sequential because both
touch dispatch config vocabulary and tests. The Lead may split a later subcell
only after naming exact files and proving no shared lease.

## Shared-File Lease Rule

Each phase file owns its own detailed lease. Plan-level shared leases:

```text
config-registry =
  src/runner/dispatch/config.mjs,
  src/setup/registrations.mjs,
  docs/specs/distribution.md,
  docs/distribution-vision.md,
  test/setup/**,
  test/runner/dispatch-executor-profile.test.mjs

dispatch-door =
  src/runner/dispatch/cli.mjs,
  src/runner/dispatch/transport.mjs,
  src/runner/dispatch.mjs,
  src/runner/dispatch/result-ladder.mjs,
  test/runner/dispatch*.test.mjs,
  test/runner/dispatch-production-call-sites.test.mjs

confinement-core =
  src/runner/dispatch/confinement/**,
  test/runner/dispatch-confinement*.test.mjs,
  test/architecture.test.mjs

coordination-consumers =
  src/runner/dispatch/assignment-runner.mjs,
  src/runner/coordination/**,
  src/verbs/coordination/**,
  test/runner/coordination*.test.mjs,
  test/verbs/coordination*.test.mjs

docs-closeout =
  docs/specs/confinement-authority.md,
  docs/specs/runner.md,
  docs/specs/distribution.md,
  docs/architecture-map.md,
  docs/reference/dispatch-module-boundaries.md,
  docs/how-to/**,
  CHANGELOG.md
```

`CHANGELOG.md` may be touched by multiple phases. The Lead resolves that as a
trivial integration conflict, never as permission to overlap broader leases.

## Group-Thinking Execution Contract

For each coding cell:

1. The Lead creates a linked worktree for the cell branch outside any
   coordination request.
2. The Lead opens one CoordinationSession with
   `core.coordination-protocol.standalone-master-coordination-loop`.
3. Every request uses explicit `actors[]` and `targetActorId` so provider/tier
   diversity is real, not inert config prose.
4. Doer/Fixer operations may be `mutation: "mutating"` only in the linked
   worktree and only for work-product operations.
5. Reviewer and Red-Team operations stay advisory/read-only.
6. Findings are dispositioned before any fix round is authorized.
7. A cell closes only after Reviewer and Red-Team approve or their remaining
   findings are explicitly dispositioned as deferred with rationale.
8. The Lead merges the cell branch into the track branch outside the
   coordination session. The session never merges.
9. Replay/status is read with `fgos coordination chain <track> --json` and
   `fgos coordination show <coordinationId> --json`, never by trusting worker
   narration.

## Plan-Level Acceptance

- Static/import tests prove no production call path bypasses
  `executeThroughConfinement` for external agent dispatch.
- `spawnWorker` and `executeExecutorCli` share the same Authority facade and
  adapter lookup path.
- All config/default additions are registered through setup config merge and
  doctor check/fix registries where applicable.
- Project config cannot define or override machine backend instance deployment
  config.
- Required policy with missing backend, stale proof, bad grant, unknown control,
  or prepared-plan mismatch refuses before spawn.
- Preferred policy never falls back to the original invocation after prepare
  failure.
- Bwrap probes prove allowed writes and denied writes with independent
  assertions, not by echoing backend claims.
- Group-thinking examples or live proof demonstrate at least two distinct
  providers in one declared-protocol session and preserve per-actor
  confinement attestation.
- `npm test` passes, plus focused commands named in each phase.
- User-visible behavior is recorded in `CHANGELOG.md`.

## Execution Inputs

```text
REPO_ROOT: /home/vantt/projects/forgentX
PLAN_DIR: /home/vantt/projects/forgentX/plans/260910-1243-confinement-authority-implementation
TRACK: confinement-authority-implementation
TRACK_BRANCH: confinement-authority-implementation
BASE_REF: capture current main HEAD when execution begins
MAX_PARALLEL_CELLS: 1 by default
FULL_TEST: FGOS_DISABLE_OPPORTUNISTIC_CHECKS=1 node --test 'test/**/*.test.mjs'
FOCUSED_DISPATCH_TEST: FGOS_DISABLE_OPPORTUNISTIC_CHECKS=1 node --test \
  'test/runner/dispatch*.test.mjs' \
  'test/runner/assignment-*.test.mjs' \
  'test/runner/coordination*.test.mjs' \
  'test/verbs/coordination*.test.mjs' \
  'test/setup/*.test.mjs' \
  'test/architecture.test.mjs'
SMOKE_DECIDE: node src/runner/dispatch.mjs decide --for code:implement --has-live-task-access
```

Each phase may narrow the focused command. P04/P06/P07 must run the full suite
unless the Lead records a concrete, reproducible environment blocker.


## Roster (every request repeats this `actors[]` verbatim)

Proven live through the coordination door on 2026-09-10 (session
`herdr-smoke--cell-01`, see
`plans/reports/group-thinking-readiness-260910-1235-confinement-authority-code-track.md`):

```json
"actors": [
  { "id": "doer",     "executor": "agy-herdr",             "tier": "standard",   "persona": "focused-code-implementer" },
  { "id": "reviewer", "executor": "claude-reviewer-herdr", "tier": "analytical", "persona": "code-quality-reviewer" },
  { "id": "red-team", "executor": "codex-herdr",           "tier": "analytical", "persona": "edge-case-and-security-attacker" },
  { "id": "fixer",    "executor": "agy-herdr",             "tier": "standard",   "persona": "surgical-fixer" }
]
```

Resolved models: doer/fixer gemini-3.8-flash-medium, reviewer opus,
red-team gpt-5.6-terra. Every codex executor runs on `CODEX_HOME=~/.codex-fgovn`.

Unattended run policy: `fgos-plan-loop` SKILL.md section 5. Full-suite
gates: P04, P06, P07. Known pre-existing red tests (not regressions):
`cohort-planner` "buildCandidateInventory against the real committed",
`check-decision-citation-drift`.

## Cell status (appended by the Lead as cells merge)

**Known `fgos coordination chain` quirk (P00):** `chain` will report
`activeCell: "p00"` forever — that session opened without `partialPolicy`
and can never quorum-close (see `docs/architect/.../verification/confinement-authority-implementation/P00.md`),
so it stays the only strictly `active`-status session `chain` can pick,
even though P00 itself is done and merged (row below). Ignore it; P00 is
closed. Do not resume `confinement-authority-implementation--p00` through
sections 2-4. Any future review-only cell (no Doer/Fixer in its `actors[]`)
must declare `partialPolicy: {allowedOmissions: ["doer","fixer"]}` in its
very first `open.json` to avoid repeating this.

| Cell | Merge commit | Review / red-team | Deferred findings |
|---|---|---|---|
| P00 | `ce886620` | 3 sessions (`--p00` dead/no partialPolicy, `--p00b`/`--p00c` real rounds); reviewer 2 HIGH + several MEDIUM/LOW across rounds, red-team 1 HIGH (session-engine.mjs), all applied; final pass clean | `http`/`httpAdapter` scope (P02 open); `dispatch.mjs` adapter-symbol re-export (P02 open); `src/runner/loop.mjs` lease gap (P02 open); two lease-glob overlaps (inert under MAX_PARALLEL_CELLS:1); phase-00 file's own Verification grep (5 terms, misses 2 symbols); spec §2's stale 0/17 denominator (P07); `codex-readonly`'s retired sandbox (P04) — full detail: `docs/architect/agent-coordination/verification/confinement-authority-implementation/P00.md` |
| P01 | `9939e0ef` | 6 sessions across 2 fix rounds (`--p01` maxRounds-exhausted, `--p01c`/`--p01d`/`--p01e`/`--p01f` real/dead-end mix); round 1: 5 HIGH+7 MEDIUM+6 LOW applied; round 2 recheck found 2 NEW HIGH regressions the round-1 fix itself introduced, both fixed; final: 0 HIGH/MEDIUM, 6 LOW deferred. Session could never formally quorum-close — 3 separate rounds hit a herdr pane-reuse bug writing into the shared main checkout, twice colliding with another active session's real uncommitted work (left untouched). Content-verified independently by the Lead (1777/1777 tests, do-not-touch clean, N1/N2 live-reproduced) and merged on that evidence per explicit user decision, not a closed session | M7-residual/M7-cache (bwrap smoke-test dedup key mismatch, module-level memo never invalidated); N2-residual (`runFixes` still has no structural try/catch, only fixed per-callsite; CLI-level behavior untested); L4-residual/L4-mutation (IPv6 CIDR not canonicalized; validator mutates mutable input, throws on frozen); N3-residual (override destination match is exact-string, narrower CIDR wrongly refused, unreachable today — no production call site) — full detail: `docs/architect/agent-coordination/verification/confinement-authority-implementation/P01.md`. Structural gaps found for future Leads: `authorize` steps need `grantedContextRefs` (SKILL.md template omits it); re-authorizing a poisoned (actor,operation,node) slot under a new `authorizationId` in the same session does not take effect, needs a fresh `coordinationId`; herdr pane cwd reuse is a real platform gap, unresolved. |
| P02 | `bb58eb4a` | 4 sessions, 3 fix rounds (the cap): round 1 found 1 HIGH (adapter lookup bypass risk) + real overclaim; round 1 recheck found 1 NEW HIGH (spec §6.9 status/contract tokens clobbered) + real "No overclaim" violation (name-heuristic bwrap attestation) + 5 MEDIUM; round 2 (fresh session, extended wall-time budget, zero workspace collisions) fixed both HIGHs and the headline overclaim, found the SAME overclaim shape one layer deeper (2 residual MEDIUM); round 3 (scoped, cap) fixed that layer too — verified against a REAL bwrap 0.6.1 invocation, not just argv parsing — and found the shape yet one more layer deeper (2 more residual MEDIUM + 3 LOW). Round cap reached; diminishing severity each round (never regressed to HIGH). 1820/1820 tests, independently re-run by the Lead | MED-B (capability identity captured by an unrelated capability sharing an executor — fail-closed, latent until P04 strict mode); MED-1/MED-2 (round 3: inherited-fd channel still claims 'covered' from an unrelated flag; "scoped" writable exception isn't actually scoped by destination); LOW-1/2/3 (writable-exception grant dropped on basename collision; argv without `--` separator trusts payload tokens as options; `--tmpfs`/`--dev`/`--proc` writable mounts not recorded as grants); R8 static-scan gaps carried from P00/P01 (src/** only, naive comment-stripping, hardcoded site count) — full detail: `docs/architect/agent-coordination/verification/confinement-authority-implementation/P02.md`. New structural finding: `aggregateBounds.wallTimeMs` defaults to 1hr, not enough for a 3-4-dispatch fix round — set it explicitly (e.g. 7200000) in future multi-dispatch fix-round requests. Suggestive (not proven) that driving dispatch from a Lead session moved into its own worktree via `EnterWorktree` reduces the workspace-collision class documented in P01: zero collisions across P02's 5 dispatches once adopted, vs. 3 before. |
| P03 | `435ff58a` | Most consequential cell to date, 3 fix rounds (the cap). Round 1 found+fixed 3 HIGH: a dispatched agent could forge its own attestation record from inside the sandbox (live-proven); `assess` accepted unknown/missing required controls and still executed; the prepared bwrap sandbox was silently discarded by `herdr-spawn` for every roster executor while Authority still claimed it satisfied. Round 2 found the round-1 fix introduced 2 new HIGH (the `http` adapter inherited the same silent-discard gap; an over-correction made both built-in policies refuse unconditionally in required mode on any machine with no credentials file — broke the phase's own headline capability) — fixed both, red-team's first clean pass (0 findings). Round 3 (cap) found the deepest layer of the same overclaim pattern: the execute/refuse decision ignored `unverified` coverage on non-optional controls, and `enforced` was stamped from structural observation alone rather than a real-time probe run — fixed both, verified live. 0 HIGH remaining. 1851/1851 tests, independently re-run by the Lead. Real infra friction this cell: `agy-herdr` failed its own handshake 5 consecutive times (fixed by swapping the fixer role to `codex-herdr`, not by retrying); `--p03` hit its `maxRounds:10` default cap from the retries (same class as P01); one dispatch's orchestrating CLI was killed by real system memory pressure from unrelated concurrent sessions on this machine, but its herdr pane kept running detached and finished — its output was read directly from `outbox/result-1.json` rather than redispatched | NEW-1b/NEW-1c (MEDIUM: `enforced` attestation body still thin/unverified against the actual executed invocation; prepared claims never compared to what ran); M-1/M-2 (MEDIUM: probe gate has no cache/single-flight/timeout per spec §6.6, ~180ms/9-spawn cost per required dispatch; probe binary can diverge from spawn binary when a registry entry omits `executable`); M-3/M-4 (MEDIUM: neither round 2 nor round 3's fix shipped a regression test; round 1 deleted a pre-existing test rather than updating it); L-1 through L-4 (LOW: probe error code missing from spec's taxonomy; `verifyRequiredProbe` hardcodes `bwrap`, no gate for a future driver; probe fingerprint is a fixed profile not bound to the specific policy; CHANGELOG filed under the wrong heading); R4 carried over (MEDIUM: success-path temp-dir leak still growing, reaper still has no production caller); R6/NEW-2 residuals (LOW: test-only store-path override not in the request's own context whitelist, no retention; the store-overlap refusal's own error path skips the normal refused-attestation contract) — full detail: `docs/architect/agent-coordination/verification/confinement-authority-implementation/P03.md`. Two new structural findings: an executor can fail its own herdr handshake persistently and independent of system load — swap it for a different roster executor rather than retrying the same one repeatedly; a detached herdr pane can finish real work after its orchestrating CLI dies — check `herdr pane list` and read `outbox/result-1.json` directly before redispatching. |
