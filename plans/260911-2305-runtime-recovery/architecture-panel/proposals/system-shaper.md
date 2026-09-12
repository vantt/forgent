Role: System Shaper — category "baseline conservative"
Author: claude-bwrap / claude / opus / analytical
Dispatch: prompts/system-shaper.md -> runs/asgn_..._op_005/01
Reads: interpretation.md, scout-report.md, reading-map.md, runtime-recovery-design.md,
run-handle.md, coordination-continuation-recovery.md, executor-health-and-fallback.md,
coordination-session.md (full, incl. Mutation Rule + Recovery Rule + Proposed
Runtime Recovery Extension), assignment-run-runresult.md, flow-definition.md
(root/profile sections), architecture-decision-lock.md, detailed-design.md,
phase-designs/README.md + all 7 phase files, simplicity-and-complexity-budget.md.
Own source reads (not scout hearsay): `src/runner/dispatch/assignment-runner.mjs:760-1018`,
`src/runner/dispatch/herdr-round.mjs:40-80,590-700`, `src/state/events.mjs:270-470`,
`src/runner/dispatch/herdr-agent.mjs:230-340`. Bash/grep/GitNexus unavailable
in this headless run — every citation is from direct Read.
Not seen, by design: sibling proposals, `plans/reports/design-review-*.md`,
`design-audit-final.md`, `detailed-design-review.md`.
Revision: v1
Written: 2026-09-11 (Run settled; transcribed by coordinator 2026-09-12)

Full advisor output (primary record):
`.fgos/assignments/asgn_runtime_recovery_panel_coordinator_op_005/runs/01/agent-report.md`

---

## 0. Two corrections to the scout's framing (made before anything else)

**C1 — There are not two peer Run/Assignment paths; there is ONE launch
path with an optional session ledger above it.** `runExecutorAttempt`
(session-engine.mjs) is the ONLY code path allowed to pass
`isReadOnlyMode: false` into `executeAssignment` (coordination-session.md
§Mutation Rule) — session-owned dispatch *funnels into*
`assignment-runner.mjs`'s `executeAssignment`. The session lock genuinely
protects `run-retried`/`result-linked` (the ledger); the unlocked
`readdirSync -> max+1 -> mkdirSync({recursive:true})` attempt allocation
(`assignment-runner.mjs:811-827`) runs *below* that lock, on **both**
paths. `mkdirSync(..., {recursive:true})` does not fail on EEXIST, so two
concurrent callers computing the same `maxAttempt+1` both "succeed" into
the same `runs/NN/`. Consequence: fencing admission **inside
`executeAssignment`** fixes both paths with one change; fencing it in
`session-engine.mjs` would fix one path and leave the live gap.

**C2 — The `runId`-to-Herdr-name plumbing gap is smaller than reported.**
`runHerdrRound` already receives `ctx.runDir`; `runId` is a pure function
of that path. The name at `herdr-round.mjs:654` ignores what it already
holds — a one-expression change, not new plumbing through `dispatch/
cli.mjs`. The real hidden dependency is different and worse: **nobody has
proven what `herdr agent start <name>` does when `<name>` already
exists**. If Herdr silently reuses/replaces the existing agent,
deterministic naming makes a duplicate launch *hijack* the live worker's
pane instead of merely duplicating it (falsification F3).

## 1. Priors

1. Size to the four confirmed defects with file:line only: (a) unlocked
   attempt allocation; (b) timestamp Herdr naming, no `runId`; (c)
   blocked/paused-limit both retried as worker-timeout; (d) no locator
   persisted before prompt delivery. Nothing evidences pain for
   continuation transfer, plan tokens, writable takeover, or health
   scoring — the conservative alternative builds against (a)-(d) only.
2. Reuse primitives in the shape they exist — `withEventsLock` is
   synchronous (physically cannot span provider I/O), reclaim is
   dead-pid-only (AD-10 verbatim), no new lock implementation.
3. `attempt` is already the generation — a second `generation` integer in
   S1 is a new identity with no essential fact behind it that `attempt` +
   `supersedesRunId` don't already carry. `incarnation` is a gateway fact,
   belongs to S2's handle, not S1's admission.
4. A port only where a dependency crosses a boundary with no named seam
   already. The Herdr client object IS the runtime port today. Zero new
   port interfaces in the first three phases.
5. A parked Run a person must clear is acceptable residual; a duplicate
   spawn is not — same asymmetry the person stated.
6. Never leave a live gap unnamed — the standalone path's fate is decided
   explicitly (D-std below), not left silent.

## 2. The proposal

**D-std (standalone Team-Dispatch-V1 path):** retrofit, at
`executeAssignment`, as the primary and only fencing site — not replaced,
not left alone, not fenced a second time in `session-engine.mjs`. The
session ledger keeps owning supersession intent and result publication;
`executeAssignment` becomes the one owner of attempt admission for
session-owned and standalone callers alike. The Work-runner path
(`loop.mjs`/`dispatch.mjs`) is explicitly out of scope (different
claim/lock story) — named, not silently ignored (falsification F5 if it
also reaches `runHerdrRound` with a timestamp name).

**P00/S0** — as designed, plus one fixture the package doesn't name: two
concurrent `executeAssignment` calls for one `assignmentId`, stub
executor, asserting one `runs/NN/` or two. First reversible step.

**P01/S1' (replaces S1)** — owner `executeAssignment`
(`admitRunAttempt` inner function). New ports: none. New identities: none
(`attempt` already exists; two fields added to existing `run.json`).
Algorithm inside `withEventsLock` scoped to `assignments/<id>/`: void dirs
(no `run.json`) skipped forever, never reused; current Run = highest
attempt with no `supersededBy`/`settlement`; caller-supplied
`supersedesRunId` mismatch -> `admission-conflict`; no
`supersedesRunId` + existing un-settled Run -> idempotent
`already-admitted`; `mkdirSync` without `recursive` (EEXIST now a real
`admission-conflict`). Settlement re-takes the same lock, refuses to write
over a `supersededBy` Run (typed `stale-run-result`), raw files stay on
disk. Full crash matrix in the primary record (5 rows, each independently
testable). Deliberately NOT built: generation-directory lock,
`ControlLock`/`Clock`/`ProcessEvidence`/`EventLog`/`RunStore` ports,
`run-admitted.v2` event family, `retryId`/`admissionKey` new names (the
idempotency tuple is `(assignmentId, supersedesRunId)`, already carried by
`run-retried.previousRunId`). `run.json` gains two fields under
`contract: 'assignment-run.v1'` rather than a v2 bump — a deliberate,
named departure, reverted if F7 falsifies it (an existing reader branches
on field absence).

**P02/S2' (replaces S2)** — owner `runHerdrRound`/`driveRound`. No new
port interface (one new client method only if Herdr exposes a lookup not
yet wrapped). New file `runDir/handle.json`
(`{agentName, agentSession, paneId, boundAt}`), runner-written only.
`agentName` derived from `runId` (C2); legacy `workId`+timestamp kept only
for callers with no `runDir`. Before `agentStart` on a resume: `agentGet`
lookup — found + matching `handle.json` -> reattach (skip start+prompt);
absent/mismatched `handle.json` -> park `launch-unknown`/
`incarnation-mismatch`; lookup miss -> park `launch-unknown` (miss is not
absence). First launch skips the lookup. `phase: launching` set before
`agentStart`; `handle.json` written + `phase: bound` after `agentStart`,
before `agentPrompt`; delivery tri-state (`sent`/`unknown`, never
"not-sent" after an attempt). Gateway dependency stated exactly as the
package states it: `absent-proven` doesn't exist, so **automatic
replacement launch is not shipped by P02**. What ships: no duplicate spawn
on retry (P01), no duplicate spawn on resume (parks instead), observe/
reattach on coordinator death, a durable locator. Residual: a parked Run
during the `agentStart`->`handle.json` window (seconds), named and
measured by the S0 fixture — the cost accepted instead of a gateway
registry.

**P03/S3'** — owner `recovery.mjs`'s `RECOVERY` table +
`ERROR_CLASS_FOR_OUTCOME`. No new ports. `EffectGuaranteePort` replaced by
a pure function `assessRepeat({repeatMode, delivery, providerModel,
confinement})` reading values already present in `run.json`/
`dispatch-plan.json`/the operation YAML, returning `eligible | park`.
`blocked`/`paused-limit` -> park, not `worker-timeout` (the S0-frozen
behavior change). Fallback only when `delivery: not-sent` OR
`repeatMode: read-only`, within existing `maxAttempts=2`.

**P04/S4' (no plan tokens)** — owner `run.mjs`/`show.mjs`. `show --json`
gains a `runs[]` projection, pure read. One new `recover` intent on the
existing `coordination run` door: result-scan -> reattach/observe/park,
and (when eligible) `run-retried` + P01 admission. No
`PlanTokenStore`/snapshot hash/`plan-stale` — every action re-reads under
lock and P01 admission is already idempotent. The `legalNext` evaluator
extraction is **not** in this alternative — the scout found no existing
`legalNext` to lift, so building one is synthesis, not conservation.

**P05-P08** — as the package, minus what P04 no longer needs. Terminal
transfer refused. Writable profile disabled/unbuilt. `driver-replaced`
door unbuilt — fresh controller supplies the session's own `writerId` or
gets the existing foreign-writer refusal.

## 3. Why it follows from the evidence

Every phase maps to exactly one confirmed defect: P01<-(a), P02<-(b)+(d),
P03<-(c), P04<-the stated need for a public recovery door. Every port the
package proposed with no defect behind it (`ControlLock`, `Clock`,
`ProcessEvidence`, `EventLog`, `RunStore`, `LaunchRegistry`,
`LocatorStore`, `IncarnationProbe`, `PlanTokenStore`, `SessionReadModel`,
`AuthorizationFacts`, `VisibilityFacts`, `WorkspacePort`,
`EffectGuaranteePort`) is either an existing seam under a new name or a
solution to a problem the scout didn't find — the simplicity budget's own
"no port wrapping pure functions" rule removes them, not taste.

## 4. Load-bearing constraint

`executeAssignment` is the single site through which every
Assignment-scoped Herdr launch passes. If false (F1), per-Assignment
fencing there doesn't cover the whole surface and this alternative either
grows a second fencing site or moves allocation into a shared function.

## 5. What it makes harder

Rust writer port (S7) must re-derive the writer boundary from fixtures +
`run.json`'s shape, not an interface — a real cost, deferred to a phase
the package itself calls "after parity proof". Coarse lock shares
`withEventsLock`'s backoff/timeout constants with the work-state log
(cosmetic misattribution risk). Parked-forever window without gateway
`absent-proven` — same residual the full design also has, just without
machinery that would later narrow it. Stale `show` advice (no plan token
— correctness holds, UX promise doesn't). Two binding files during
transition (`handle.json` beside `visibility.json`, not read this pass) —
`handle.json` is stated as authority. `run.json` field-add instead of
`assignment-run.v2` forfeits "old reader refuses new state" for this one
file (reverted if F7 falsifies it).

## 6. First reversible step

The S0 concurrency fixture: two `executeAssignment` calls, one
`assignmentId`, stub executor, two processes, records `runs/*` after. No
production line changes. Its outcome decides P01's size (F4). Second
reversible step: the Herdr duplicate-name probe (F3) as a recorded fixture
— no production change until read.

## 7. Half-adopted state

P00+P01 only: admission fenced/idempotent; Herdr names still
timestamp-based; blocked/paused still retry as timeout; a coordinator
crash still loses the locator. Duplicate *attempt* closed, duplicate
*pane* not. P00-P02, P03 absent: the important half — no duplicate
attempt, no duplicate pane on resume, locator survives crashes, reattach
works; a parked Run is visible only by inspecting the filesystem (no
`show` projection). Livable for this repo's dogfood volume, not
unattended. P04 never lands: `recover` doesn't exist; whether the existing
resume path can reach a parked Assignment at all is could-not-determine
(F6) — if not, the half-adopted state requires the exact "manual state
fix" X11 forbids, which ranks P04 ahead of P03.

## 8. Evidence vs. assumption

Full table in the primary record — 13 rows. Load-bearing assumptions
(not yet verified): session-owned dispatch funnels through
`executeAssignment` (contract text, not re-read at the symbol this pass);
no Assignment-scoped Herdr launch bypasses `executeAssignment`
(inference, Work-runner path explicitly excluded but not verified);
`herdr agent start` on an existing name errors rather than reuses
(unverified, load-bearing for P02 step 1).

## 9. Falsification criteria (written before any critique)

F1 — a Read of `runExecutorAttempt` shows it allocates the attempt dir
itself before calling `executeAssignment` -> C1 wrong, allocation must
move to a shared function. F2 — `withEventsLock` mis-scopes under
`.fgos/assignments/<id>/` -> needs a `lockDir` parameter. F3 — live probe
shows `herdr agent start <existing-name>` reuses/replaces -> P02 step 1
needs pre-start `agentGet` on every launch, not just resumes. F4 — the S0
fixture shows two concurrent calls already land in distinct `runs/NN/`
-> defect (a) is smaller, P01 shrinks. F5 — any file other than
`assignment-runner.mjs` calls `executeExecutorCli`/`runHerdrRound` with an
Assignment-shaped `runDir` -> P02's owned-symbol list incomplete, §4 false
for that caller. F6 — the existing `coordination run` vocabulary cannot
address an already-admitted, un-settled Assignment -> P04's `recover`
pulled ahead of P03 in the minimum set. F7 — a current `run.json` reader
branches on field absence -> field-add becomes a version bump. F8 —
`paneClose` destroys the gateway record so a settled Run's `agentGet`
returns a miss identical to never-created -> P02 needs `settlement`
checked before the gateway lookup.

## Unresolved questions (for the driver/later phases, not the person)

Does anything besides `executeAssignment` launch Herdr rounds for an
Assignment (F5, one grep, unavailable this run)? What does Herdr do on a
duplicate agent name (F3, needs one live probe)? Can the current
`coordination run` resume path address a parked Assignment (F6)? What is
in `visibility.json` today and who writes it (decides whether
`handle.json` is additive or a rename)?
