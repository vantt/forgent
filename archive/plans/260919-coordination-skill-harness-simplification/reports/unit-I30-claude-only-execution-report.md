# Unit I30 — Claude-only parallel execution report

Runbook: `runbook-claude-only-parallel-execution.md`. Branch `unit/I30`,
worktree `.claude/worktrees/coordination-skill-harness-i30-contract-versioning`,
base `main@dafe6ebcf` (post Phase-7-decomposition-review corrections),
integrated `main@638cf1332`.

Phase 7, items 1 and 4b (narrowed after decomposition review, not the
originally-drafted broader scope). File-disjoint from I32, ran in parallel.

## Implementer (sonnet, fullstack-developer)

Added `contractVersion` to `fgos coordination show`/`chain --json`'s data
envelopes — new sibling versions `coordination-show.v1`/
`coordination-chain.v1` (judgment call: minted new versions rather than
reusing `coordination-actions.v1`, since `show`'s and `chain`'s data shapes
are both structurally distinct from the actions-projection shape;
`status`'s own existing `contractVersion` field left untouched). Ported the
`capability` and `distinctProviderFrom` PolicyPatch fields into the
canonical `flow-definition.md`, cross-checked against
`schema.mjs`/`binding.mjs` before copying (not blindly copied from the
legacy doc — confirmed accurate). Added a drift test. Fixed two pre-existing
exact-shape test assertions the new field broke
(`coordination-chain.test.mjs`, `coordination.test.mjs`).

Found and correctly declined to silently fix an incidental gap:
`preferInvocation`/`repeatMode` PolicyPatch fields are undocumented in BOTH
the canonical and legacy contract docs — outside item 4b's stated charter
(which named only `capability`/`distinctProviderFrom`), flagged as a
follow-up candidate in CHANGELOG.md rather than silently expanded into.

Substituted a manual grep-based blast-radius check for GitNexus `impact()`
since this agent's toolset doesn't include GitNexus MCP tools — reasonable
given the actual change is additive-only (a new field on an existing return
shape), and the manual check correctly found the only two real callers.

## One coordination gap, caught and closed same-day

Unit I32 closed mid-flight (while I30 was running) with a proposed
one-sentence doc clarification about `readOnlyRedirects` vs.
`capability.prefer`. Lead applied it to the legacy doc directly and asked
I30 to port the same sentence into the canonical doc it was already
touching — but the message crossed with I30 already finishing its own work,
so the port was missed in the first report. Lead caught this via direct
diff (grepped the canonical doc, confirmed the sentence was absent) and
asked for a follow-up. Implementer read the legacy doc's real current text,
ported it verbatim (byte-compared, confirmed exact match, not a paraphrase),
and amended the existing `unit/I30` commit rather than adding a churn
commit. Lead independently reconfirmed the byte-identical match before
proceeding.

## Lead final verification and merge

Independently reproduced both contractVersion fields via CLI probe
description matching the implementer's own; independently confirmed the
ported PolicyPatch content directly against `schema.mjs`; independently
diffed the two docs' clarification sentence for byte-identity; ran the
touched test files myself (68/68 pass) before and after the amendment;
ran the full suite myself: 7971 tests, 7847 pass, 51 fail — all 51
confirmed (via failure-file grep) to be the same pre-existing
`test/rust-host/*` binary-missing gap every worktree-based unit this track
has hit, zero overlap with this diff.

`git -C /home/vantt/projects/forgentX merge --no-ff unit/I30` from the main
checkout onto post-decomposition-review main, `ort` strategy, clean
auto-merge, no conflicts. `integratedSha =
638cf13320d26883ea053b4cbdb0e19d1b06ecf3`. Reran the 3 key suites on the
merged tree: 68/68 pass.

## Process note

This unit is a small, concrete example of the same discipline the rest of
this track has relied on: a peer unit's finding (I32's clarification
sentence) needed to reach a concurrently-running unit (I30) before that
unit's own commit was final, the message crossed in transit, and Lead's own
direct verification (not trusting the "DONE" report at face value) caught
the gap the same turn rather than letting it silently ship as a fresh
canonical/legacy drift point — the exact class of bug this unit's own item
4b existed to fix.

## Unresolved / follow-up

- `preferInvocation`/`repeatMode` PolicyPatch fields undocumented in both
  contract doc copies — named, not fixed, candidate for a future unit.
