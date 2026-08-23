---
item: tsk-pdg
---

# plan.md — tsk-pdg

Mode: **high-risk**

Flags (decided directly here — `clear` discovery skipped `exploring`, no
`CONTEXT.md`; grounded in `docs/history/tsk-pdg/RESEARCH.md`):

- **audit/security** (hard-gate) — narrows the brake that previously kept
  a live, same-provider soul from routing content to a non-Claude backend
  just because a capacity happened to be configured.
- **external systems** (hard-gate) — changes exactly when dispatch goes
  external.
- **existing covered behavior** — reverses part of a locked decision
  (`docs/decisions/0026` rule 2), a real, cited, tested contract.
- **public contracts** (internal-platform) — `decideCapacityDispatchMechanism`'s
  behavior is documented in `0026` and relied on by name in
  `fgos-fanout`'s own decision table.

## Approach

Real user decision (2026-08-16, this session): a capacity `kind:agent`
that is genuinely **cli-spawn-shaped** (declares its own `command` or a
`invocations[].via === 'cli'` entry) must dispatch out-of-process whenever
it is configured for the job — regardless of the caller's own
`hasLiveTaskAccess`. A capacity that is **agentType-shaped** (only
`agentType`, no command of its own) keeps today's behavior unchanged:
`hasLiveTaskAccess` still decides, because honoring it in-process already
means honoring the configuration (Task tool with that `agentType` IS the
configured target).

RESEARCH.md Round 1 confirmed this split already exists structurally
(`resolveExecutorConfig`'s `resolvedViaAgentType` flag, the two shapes are
mutually exclusive by construction) and that **zero existing tests**
assert the old behavior for the cli-spawn-shaped case + live Task access —
this is the smallest change that honors the user's decision without
touching the (still-correct) agentType-shaped half of rule 2.

1. **Code change — `decideCapacityDispatchMechanism`
   (`src/runner/dispatch.mjs`, around line 1173).** Compute whether the
   resolved capacity is cli-spawn-shaped (`capacity.command` truthy, or
   `Array.isArray(capacity.invocations) && capacity.invocations.some(inv
   => inv.via === 'cli')`) — the exact same shape test
   `resolveExecutorConfig`'s own `resolvedViaAgentType`/`cliInvocation`
   logic already uses, not a new heuristic. When true, return
   `'out-of-process'` directly (bypassing `decideDispatchMechanism`
   entirely for this shape — no live-task-access gate, no force-flag
   needed since it is now unconditional for this shape). When false
   (agentType-shaped, `kind:'tool'`, or unconfigured), fall through to
   today's unchanged `decideDispatchMechanism` call.
   `decideDispatchMechanism` itself (the pure-boolean base function) is
   NOT touched — its own unit tests (`dispatch.test.mjs:1844-1858`) stay
   exactly as they are; only its *caller*'s own shape-detection changes.
   No other function needs editing: `resolveExecutorConfig`/`spawnWorker`/
   `executeCapacityCli` already run the real spawn correctly once
   `decideCapacityDispatchMechanism` reports `out-of-process` — that path
   already exists and is already tested (tsk-1m8's own live run proved it
   end to end against the real `agy` binary).

2. **New decision doc — `docs/decisions/0033-...md`**, `extends: [0026]`,
   recording: the split (agentType-shaped stays gated, cli-spawn-shaped no
   longer gated), the real user decision and date, and the concrete
   reasoning (0026's own stated rationale for rule 2 — "avoid a blind soul
   re-deriving what a live soul already knows" — never applied to the
   cli-spawn-shaped case in the first place; that case is "spawn a
   genuinely different, explicitly configured backend", not
   re-derivation). Add this item's own id to `0026`'s frontmatter
   `superseded_by` list (append, do not remove `0028`/`0029`) and add one
   short paragraph under `0026`'s own rule 2 pointing at `0033` for the
   narrowed case — **cite, never rewrite, 0026's own body** (its historical
   content stays intact; only the pointer is added).

3. **Skill-prose citations — read, do not blindly edit.** RESEARCH.md
   already checked all 6 citing files
   (`fgos-coding-exploring`/`fgos-coding-planning`/`fgos-coding-validating`/
   `fgos-coding-implement`/`fgos-fanout`/`_shared/capacity-dispatch-fallback.md`):
   every one of them cites rule 2 to justify "don't spawn an ad hoc Task
   subagent for work you already understand" — a claim this change does
   not contradict (it only changes what happens when a *named, configured*
   capacity is consulted, never "should a live soul make up its own
   sub-dispatch"). No skill-prose edit is planned; if Implement finds one
   that specifically asserts "hasLiveTaskAccess always wins" as its own
   reasoning (none found in RESEARCH.md's read), fix that file's own
   citation to point at `0033` instead of leaving it stale.

4. **Verify.** `npm test` (regression — expect the same pass count as
   `tsk-1m8`'s own baseline, 3459 pass / 0 fail, since RESEARCH.md found
   zero tests need changing) plus a direct, real assertion that both
   shapes now resolve correctly (item's own `verify` field, already set at
   discovery time).

5. **Iron Law.** This diff touches `src/runner/dispatch.mjs` directly —
   unlike `tsk-1m8`, `classifyIronLaw` is very likely to come back
   `required:true` here (a self-modifying diff to the dispatch mechanism
   itself). Implement must compute this for real after committing (per
   `fgos-coding-implement`'s own step 4 ordering) and write
   `docs/history/tsk-pdg/iron-law-evidence.md` with a real
   failing-before/passing-after transcript if so — never assume either
   way before the real classifier runs against the real committed diff.

No split: one honest piece — one function's shape-detection, one new
decision doc, one pointer added to 0026. `tsk-pdg` proceeds as itself.

## Risk map

| Component | How risky | Proof point |
|---|---|---|
| Regression on existing dispatch behavior | Real, but fully scoped: RESEARCH.md's exhaustive scan of every `hasLiveTaskAccess:true` test (28 sites) found none exercising the cli-spawn-shaped+live-access combination | `npm test` full suite, expect 0 unexpected failures |
| Cross-provider content now reaching `agy` more often for live sessions with a configured capacity | Real, intended — this is the literal user decision being implemented | New decision doc `0033` records the explicit approval and reasoning; `allowCrossProvider` gate (unrelated, untouched) still applies independently on top |
| Reversing a locked decision (0026 rule 2) without leaving a trace | Process risk, not code risk | `0033` written, cross-linked both directions (extends/superseded_by), before this item returns |
| Iron Law gate on a self-modifying dispatch-mechanism diff | Expected to trip — not a risk to route around, a real proof requirement | Compute `classifyIronLaw` for real post-commit (step 5 above); write real evidence if required |

## Outstanding questions

None
