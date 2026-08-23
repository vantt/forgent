# Generalize judge-executor.mjs's retry-then-escalate pattern — locked decisions

Item: `tsk-418`. Depends: `tsk-62v` (capacities/dispatch schema this extends).
Cluster siblings: `tsk-5l2` (submit-assist-classify wiring, stage `clarify`),
`tsk-g18` (scout-output persistence, stage `executing`).

Source request (title, untrusted per RUL45): "Generalize judge-executor.mjs's
existing retry-then-escalate pattern... into a reusable sanity-check any
dispatched capacity can opt into." Full scope (3 points) is in the item's own
`description` field (`fgos list --id tsk-418 --json`).

No prior `judgeDiscovery` verdicts exist for this item (`view.discovery`
empty) — this is the first clarify pass.

## Feature boundary

Extract `judge-executor.mjs`'s bounded-retry/stricter-suffix/JSON-parse-or-
retry shape (`runJudgeExecutor`, `src/intake/judge-executor.mjs:79-93`) into
a helper any capacity dispatch can call, with zero behavior change for
`judgeDiscovery`/`judgeDecompose` (its current two callers). Add an optional
escalation step on top: when a capacity declares a fallback executor/tier,
exhausting the base attempts falls back to it instead of only returning
failure. A capacity that declares no fallback keeps today's exact behavior
(fully additive).

## Why this clarify pass found no open questions

The item's own description (informed by the retrospective synthesis doc,
`plans/reports/agent-executor-design-260801-1159-synthesis-goal-constraints-gaps-report.md`
§4.4 and its "Câu hỏi mở" #2) already pre-resolves the optionality question
("optional, since not every capacity needs it — e.g. tsk-5l2's ... may
accept a plainer fail-and-fall-back-to-inline behavior") and the
consumer-proof question ("tsk-5l2 or a test double"). Reading the actual
code this item touches resolves the remaining candidate gray areas without
requiring a person's judgment call — see Locked decisions below, each cited
against real evidence, the same restatement pattern `tsk-62v`'s own
`CONTEXT.md` used.

## Locked decisions

| ID | Decision |
|----|----------|
| D1 | Escalation fires uniformly on any base-attempt failure `runJudgeExecutor` returns as `null` today — both the parse-exhausted-after-retry path (`src/intake/judge-executor.mjs:86-90`) and the immediate non-parse fail-fast path (spawn error / non-zero exit / timeout, `:82-84`, "never retries" by str68 D2/D3). The current `null` return carries no failure-type discriminant (`parseVerdict` returns `{parsed:false}` vs. the caller only ever seeing a bare `null`), so a wrapping escalation step built against "base attempt returned null" naturally covers both origins without restructuring the retry loop itself or needing a new failure-type field. This also satisfies design-doc §4.4's framing ("lỗi/timeout/trả rác" — errors/timeout/garbage — named together, not just the garbage-output case). |
| D2 | Escalation is declared per-capacity (mirrors the description's own wording: "a capacity MAY declare a fallback executor/tier to escalate to"), not a global default — a capacity that opts out sees zero change (D1's uniform trigger only ever fires when a fallback is actually configured). Exact schema field name/location is an implementation choice for planning (see Deferred below), not a product decision — the shape (a per-capacity optional pointer to another executor/tier) is already dictated by the description. |
| D3 | Wiring a real non-judge capacity (`tsk-5l2`'s submit-assist-classify) end-to-end is explicitly OUT of scope for `tsk-418` itself. Evidence: the description's own point 3 frames `tsk-5l2`/`tsk-g18` as consumers that wire this in "once available" (future tense — after this item ships, as their own work), and `tsk-5l2`'s own description (7b) already lists "no sanity-check/escalation path" as a known, explicitly-optional gap it may leave unaddressed. Acceptance's "(tsk-5l2 or a test double)" phrasing is the OR that lets this item satisfy its own acceptance via a test double alone. |
| D4 | This item's branch must integrate `tsk-62v`'s capacity-dispatch commit before extending `cfg.capacities.<id>` with an escalation field — `tsk-62v` is marked `done` in fgOS state but its commit (`1f1788a`, "generalize dispatch.mjs's executor resolution to be capacity-aware") is NOT yet on `main` (`git merge-base --is-ancestor 1f1788a main` → false; `main`/this branch's base both sit at `6a7d210`). Two sibling branches already did exactly this: `git branch --all --contains 1f1788a` shows `fgw/tsk-5l2` and `fgw/tsk-g18` both already carry it, merged directly from `tsk-62v`'s branch ahead of any `main` integration. This is an integration-mechanics fact for planning to act on, not a product decision — see Deferred below. |

Every D-ID above is either a restatement of an already-locked upstream
decision (D2/D3, from the item's own description and §4.4's already-answered
"Câu hỏi mở" #2) or a direct read of the existing code contract (D1) / repo
state (D4) — logged via `fgos decision` below for machine-readable
visibility (`view.decisions`).

## Pinned terms

- **capacity** — same meaning `tsk-62v`'s `CONTEXT.md` pins it as: an entry
  in `cfg.capacities.<capacityId>` (once that schema lands per D4), keyed by
  `capacityId = skillForStage(getDomain(work.domain), 'executing')`. Prior to
  D4's integration, judge calls' `tier: 'judge'` synthetic role
  (`src/intake/judge-executor.mjs:24-29`) is the only real "capacity-shaped"
  dispatch that exists on this branch.
- **escalate** — on exhausting the base attempts (D1), if the capacity
  declares a fallback executor/tier, make one attempt against that fallback
  before returning failure. Whether the fallback attempt itself gets its own
  bounded retry loop (mirroring `MAX_JUDGE_ATTEMPTS`) or is a single try is
  left to planning (Deferred below) — low-materiality implementation detail,
  not a product behavior change either way.

## Scout evidence cited

- `src/intake/judge-executor.mjs` (full file, read this session) —
  `runJudgeExecutor`, `parseVerdict`, `MAX_JUDGE_ATTEMPTS`,
  `JUDGE_STRICT_JSON_SUFFIX`, `spawnAttempt`.
- `src/intake/discovery.mjs:28,187-189` and `src/intake/plan.mjs:24,222-224`
  — the two existing callers of `runJudgeExecutor`/`JUDGE_STRICT_JSON_SUFFIX`,
  confirming "zero behavior change" is the full blast radius of the
  extraction (both call sites unchanged if the helper's exported signature
  stays compatible).
- `src/runner/dispatch.mjs` (full file, read this session) — confirms
  `cfg.capacities`, `capacityId`, and the 3-arg `resolveExecutorConfig`
  do NOT exist on this branch today; only the existing tier-keyed
  `cfg.executors.<tier>` (P41) and the global `cfg.executor` exist.
- `git show 1f1788a:docs/history/agent-executor-capacity-dispatch/CONTEXT.md`
  — `tsk-62v`'s own locked decisions D1-D9 for the `cfg.capacities` schema,
  `capacityId` identity, and `resolveExecutorConfig(cfg, tier, capacityId)`
  precedence this item will extend once D4's integration lands.
- `plans/reports/agent-executor-design-260801-1159-synthesis-goal-constraints-gaps-report.md`
  §4.4 and "Câu hỏi mở" #2 — the design gap this item exists to close, and
  its own framing that `tsk-5l2` may accept the non-authoritative low-risk
  path instead of a full escalation chain.
- `tsk-5l2`'s own `description` field, point 7(b) — independent confirmation
  that escalation wiring is explicitly optional for that consumer.
- `fgos tool query --capability impact-analysis --status present` → one
  provider, `gitnexus`, `status: "present"` — AGENTS.md's impact-analysis
  gate reads **full**: `impact()` MUST be run (and its risk level reported)
  before editing `judge-executor.mjs`'s exported functions or their two
  call sites, once this item reaches `fgos-coding-implement`.
- `git merge-base --is-ancestor 1f1788a main` (false) and
  `git branch --all --contains 1f1788a` (`fgw/tsk-5l2`, `fgw/tsk-g18`) — the
  base-branch integration gap and its existing in-repo precedent (D4).

## Deferred to planning

- Exact schema field name/location for a capacity's declared fallback (D2)
  — e.g. `cfg.capacities.<id>.escalateTo: "<tier-or-capacityId>"` — and
  whether it resolves through the same `resolveExecutorConfig` precedence
  `tsk-62v` built (`capacities.<capacityId>` > `executors.<tier>` >
  `executor`), or a dedicated lookup.
- Mechanics of D4's integration: whether `fgw/tsk-418` merges `tsk-62v`'s
  branch/commit directly (mirroring `fgw/tsk-5l2`/`fgw/tsk-g18`), rebases
  onto it, or waits for a `main` merge — a build-sequencing choice, not a
  product one.
- Whether the fallback attempt itself is single-shot or gets its own bounded
  retry loop (see "escalate" pinned term above).
- New-test placement/naming for the extracted helper and its escalation
  path, and for the "at least one non-judge capacity or test double" proof
  point (acceptance).

## Outstanding questions

None — every point in this item's own scope traces either to the item's own
already-answered description/acceptance wording, to §4.4's already-answered
"Câu hỏi mở" #2, or to a direct read of the existing code/repo state (D1/D4),
cited above with file:line/commit evidence.
