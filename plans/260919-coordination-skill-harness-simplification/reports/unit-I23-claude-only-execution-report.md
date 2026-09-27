# Unit I23 — Claude-only parallel execution report

Runbook: `runbook-claude-only-parallel-execution.md`. Branch `unit/I23`,
worktree `.claude/worktrees/coordination-skill-harness-i23-pack-cli`, base
`main@81e1340ce` (post-I21), integrated `main@94c2aaf49`.

Adds `fgos coordination pack list|show-protocol|run` as a subverb under the
existing `coordination` verb (per Lead's locked decision revising the
earlier "new top-level `fgos group-thinking` verb" call), replacing the
inline `node -e` scripts `fgos-group-thinking`'s SKILL.md used to instruct.

## Implementer (sonnet, fullstack-developer)

Routed `list`/`show-protocol`/`run` to `loadProtocolPack`/
`loadCoordinationProtocol`/`runGroupThinkingRequest` unmodified — no
membership/dispatch logic duplicated. `COMMAND_REGISTRY.length` unchanged
(75, confirmed both before and after), so no rust-host regeneration
required, unlike I18/I20's top-level-verb path. Made a narrow, flagged, Lead-
accepted scope extension: 2 regex updates to `test/cli/coordination.test.mjs`'s
R5 drift-guard subverb enumeration (necessary plumbing, not scope creep).

## Independent test + review (round 1, opus, parallel)

Both agents red-teamed the new CLI against the group-thinking pack gate
directly (non-member protocol, protocolRef mismatch, `agent-led` kind,
disallowed step types, cross-protocol resume, unsupported flags like
`--pack-path`/`--resume`/`--actors`) — every refusal fired correctly, no
bypass found, 0 HIGH findings. Two real MEDIUM test-coverage gaps found
independently by both agents:
- **MEDIUM-1**: the resume test at `test/cli/coordination-pack.test.mjs`
  only asserted the SECOND `pack run` call's own response shape — it would
  pass even if that call silently opened a brand-new session under the
  same `coordinationId` instead of genuinely resuming.
- **MEDIUM-2**: `bin/fgos.mjs` wires `cliTier: flags.tier` into
  `runGroupThinkingRequest` exactly like the already-tested `cliExecutor`,
  but no test exercised `--tier` at all (live behavior was correct; only
  the regression test was missing).

LOW findings: `show-protocol` is intentionally unscoped to pack membership
(matches the plan's own "wraps `loadCoordinationProtocol`" wording, not a
bypass — `pack run` still refuses); all `pack` subverbs share one flag
allowlist (matches `coordination start`'s existing pattern); a plan-ID
citation in a test comment (repo convention precedent, not a defect).

## Fix round 1 (26791ff53, 0e936aa89)

- **MEDIUM-1 fixed**: rewrote the resume test to replay the session's real
  on-disk ledger (`replaySession`) and check both calls' assignments carry
  the correct `protocol-operation:<id>@<version>#<opId>` stamp
  (`legality-facts.mjs`'s own reserved-constraint mechanism) — proving both
  the convene (call 1) and propose (call 2) operations settled against the
  SAME session, not two disjoint ones a resume bug could silently produce.
- **MEDIUM-2 fixed**: added a `--tier flagship` test using a `{model}`-
  capturing fake executor script; asserts the resolved model reaches
  `flagship-test-model` (a value only that tier's policy resolution
  produces), proving the flag reaches real dispatch policy, not just CLI
  parsing.
- **LOW-1 addressed**: added a positive test confirming `show-protocol`
  succeeds on a real, non-pack-member protocol (proving the wider scope is
  the intended, stable shape), plus a one-line clarifying doc note.
- **Addendum — stale skill prose fixed**: `core/skills/fgos-group-thinking/
  SKILL.md` claimed "exactly five step kinds" (schema actually has seven,
  including `human-turn`/`close`) and that close is always automatically
  attempted (false — it only fires on an explicit `close: true` or a
  `{type: "close"}` step, both routes through the same quorum gate). Fixed
  now rather than deferred to I24a, since I24a depends on this file's
  accuracy and this unit's diff already touches it.
- **Addendum — pre-existing gate-refusal test added**: no test anywhere
  covered `group-thinking-pack.mjs`'s refusal to resume an existing
  `agent-led` session under a declared-protocol pack request. This
  predates I23 but I24a is about to build on this exact gate — added the
  test now rather than leaving it uncovered.

LOW-2 (shared flag allowlist) and LOW-3 (plan-ID in test comment) left
untouched — both match established repo convention, not defects.

## Lead final verification and merge

Independently re-read every commit's diff directly and re-ran the tests:
- `test/cli/coordination-pack.test.mjs` + `test/cli/coordination.test.mjs`:
  67/67 pass (own run, matching the fixer's report).
- Confirmed the 3 skill mirrors (`core`, `.agents`, `plugins/fgOS`) are
  byte-identical after `npm run build:skills`.
- Full `env -u CLAUDE_CODE_SESSION_ID npm test` on the worktree: 7923 pass,
  0 fail, exit 0 — fully clean, no flake this round.

`git -C /home/vantt/projects/forgentX merge --no-ff unit/I23` from the main
checkout onto `main@387570ed3` (post-I22), `ort` strategy, clean auto-merge
(CHANGELOG.md not touched by I22, no conflict). `integratedSha =
94c2aaf49e8aa0bfe6cf9e3c5031919377269ec3`. Reran
`coordination-pack.test.mjs` + `coordination.test.mjs` +
`command-registry.test.mjs` (71/71 pass) and reconfirmed
`COMMAND_REGISTRY.length === 75` on the merged tree.

## Unresolved question raised by the tester (resolved here)

Tester asked whether the L3 stale-prose fix belonged in I23 or I24a — Lead
decided I23, since the file was already in this unit's diff and I24a is
about to depend on its accuracy; folded into the addendum above.
