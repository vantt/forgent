# RESEARCH.md — tsk-blk

## Round 1 — 2026-08-13 (fgos-researching, stage discovery)

**Goal:** confirm how to write 2 tests without changing current behavior.

**(1) Gate-name drift guard.** Read `test/cli/command-registry.test.mjs:44-67`
— the existing `judge*` guard derives a "declared" set via a regex over
every `.mjs` file under `src/`, then flags any `judge[A-Z]...` mention in
registry prose not in that set. Generalized this exact pattern to
`canAutoApprove[A-Za-z0-9_]*` (function names, not gate-string values) —
directly catches the class of bug found earlier this session
(`canAutoApproveValidate` named in prose after `tsk-224` deleted it).
`GATE_APPROVE_GATES` (`src/state/store.mjs:818`) is deliberately NOT the
"live" source for a gate-*name* guard — it intentionally still accepts
`'planApprove'` for backward-compat replay of historical records (6
in-flight items confirmed carrying one, per the parent cook session's own
audit), so a guard treating that set as "live-only" would produce false
positives against `command-registry.mjs`'s own accurate post-`tsk-2tk`
prose (which explicitly documents `planApprove` as legacy-accepted).
Scoped this item to the function-name half only — the gate-name
*attribution* half (which skill owns which gate) has no equally clean
mechanical derivation and is left for a future item if warranted (YAGNI).

**(2) childSpecs JSON.parse safety.** Confirmed exact location:
`.claude/skills/fgos-coding-validating/SKILL.md:264`,
`const childSpecs = JSON.parse(process.argv[4]);` inside a `node -e`
one-liner, no try/catch. Repro (`node -e` with malformed JSON, run
directly): `SyntaxError`, stdout empty, stderr carries a raw stack trace,
exit 1. `test/state/gate-bypass.test.mjs`'s existing
`canAutoApproveMergedGate` tests all pass `childSpecs` as already-parsed
JS arrays — none exercise the JSON.parse call, because that call lives in
the SKILL.md's own snippet, not in `gate-bypass.mjs` itself. A pure unit
test of the exported function can never reach this line.

## Decision: extraction-based subprocess test

To test the SKILL.md's own documented snippet without letting the test and
the doc drift apart, the test extracts the real `node -e` script text from
`.claude/skills/fgos-coding-validating/SKILL.md` at run time (regex over
the fenced code block) and runs it as a real subprocess against a fixture
`.fgos` dir (`addWork` + a `gate-bypass.json` config). Verified: reverting
just the fix's `.catch(() => console.log('false'))` locally and rerunning
reproduces the exact real failure (empty stdout, raw `SyntaxError` stack
trace on stderr) — confirms the test is not vacuous.

## Verify / classification

Real verify (ran, green): `node --test test/state/gate-bypass.test.mjs
test/cli/command-registry.test.mjs test/skills/fgos-mirror.test.mjs`
(58/58 pass) plus a full `npm test` before return.

Item's auto-classification (`risk: standard, tier: standard, kind: bug`)
is already accurate — two focused test additions plus one one-line
`.catch()` robustness fix, same shape/weight as `tsk-2tk`'s already-approved
scope. No reclassification needed.

**Clear.**
