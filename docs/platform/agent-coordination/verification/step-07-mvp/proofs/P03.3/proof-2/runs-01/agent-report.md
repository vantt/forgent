# Advisor findings — plan.md vs CONTEXT.md consistency (tsk-44e)

Scope: `docs/history/p03-3-proof2-work-lookup-proto-guard/{CONTEXT.md,plan.md}`, read-only.

## Verdict

**Consistent.** plan.md's steps implement exactly the three locked decisions
in CONTEXT.md, nothing more and nothing less. Every load-bearing factual
claim in CONTEXT.md (line numbers, shared lookup pattern, error-message
shape) was cross-checked against the live source and still holds.

## Per-decision check

**D1 (root cause)** — `listWork(fgosDir).work[workIdArg]` at `cli.mjs:621`
(`decideExecutorCli`, reached by both the `decide` CLI subcommand and the
`decide --work` programmatic entry — one shared function, confirmed by
reading `runDispatchCli`'s `case 'decide'`) and at `cli.mjs:1027` (the
`execute --contract --work` branch) — both confirmed live, unguarded
bracket access on a plain object, no `hasOwnProperty` check. Matches
CONTEXT.md D1 verbatim, including the cited line number.

**D2 (fix approach)** — plan.md's Approach section adds the exact
`Object.prototype.hasOwnProperty.call(...)` guard D2 specifies, at both
sites, and explicitly excludes the `Object.create(null)`-at-the-source
alternative D2 named and rejected (with the same "broader blast radius,
future item" framing carried over almost word-for-word). No drift.

**D3 (regression coverage)** — plan.md commits to two new tests in
`test/runner/assignment-dispatch.test.mjs` for `--work __proto__` /
`--work constructor` against both call sites, matching D3 exactly. Verified
that file already imports `decideExecutorCli` and exercises the
`--contract --work` door via `execFileSync(... 'src/runner/dispatch.mjs',
'execute', '--contract', ..., '--work', ...)` (e.g. the existing "fails
clearly" test at line ~1107 for an ordinary unknown id) — the harness the
new tests need already exists, no new test scaffolding required.

**Mode gate / Verify** — plan.md's "small" mode and its
`FGOS_DISABLE_OPPORTUNISTIC_CHECKS=1 node --test
test/runner/assignment-dispatch.test.mjs` verify command are consistent
with D3's named test file and with the item's own narrow, single-pattern
scope.

**Outstanding questions** — both files say "None"; agreed, no open gap
found between them.

## Minor, non-blocking observation

Plan.md's mode-gate justification calls the lookup "already covered by
test/runner/assignment-dispatch.test.mjs." True for the `--contract --work`
side (an existing unknown-id test already exercises that exact call site).
For the `decide --work` side, the file only exercises `decideExecutorCli`
via `{ assignment: ... }`, not `{ work: ... }` — no pre-existing test drives
an *unknown* work id through that path today. This doesn't change what
plan.md commits to (it still adds a guard + a new test at both sites) and
doesn't block the plan; it just means the "already covered" framing is
slightly optimistic for one of the two sites. Worth a one-line correction
if CONTEXT.md/plan.md are ever revised, not worth blocking on given this
item closes `wontfix` after the proof.

## Unresolved questions

None.
