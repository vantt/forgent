# CONTEXT — cutting npm test CPU by blocking real `claude` CLI spawns

Item: `tsk-1opx`. Companion research round:
[`RESEARCH.md`](./RESEARCH.md) (verdict `clear`).

## Feature boundary

In scope for this first unit: making the 10 `fgos setup` spawns in
`test/setup/checks-setup-*.test.mjs` block the real `claude` CLI, using the
harness constant that already exists for exactly that purpose. Then
measuring the result.

Out of scope for this first unit: `test/cli` spawn-cost work, git-fixture
pooling, any change to `src/setup/registrations.mjs`, and the three
`fgos doctor` spawns in `test/setup/checks.test.mjs` (see D4). No production
source file is touched at all — this unit changes test env plumbing only.

## Locked decisions

| ID | Decision | Why it can be trusted | Cost if wrong |
|---|---|---|---|
| D1 | The first unit is exactly the 10 occurrences of `{ ...process.env, HOME: homeDir }` in the 5 `test/setup/checks-setup-*.test.mjs` files, changed to `{ ...NO_CLAUDE_ENV, HOME: homeDir }`. Nothing else. | Direct instruction from the person who claimed the item, given with the explicit constraint "keep the plan small". Sites enumerated and counted in the repo: config:45,58 envelope:46,64 hookspath:44,57 rc-line:44,71 idempotent:44,68. | Low. If the 10 turn out not to be the whole win, the measurement in D5 exposes it immediately and a follow-up item takes the rest. |
| D2 | Use the existing `NO_CLAUDE_ENV` harness constant; do not invent a new stub, fixture, or seam. | `NO_CLAUDE_ENV` is `{ ...process.env, FGOS_CLAUDE_COMMAND: '/nonexistent/fgos-test-claude-binary' }` (`test/setup/helpers/setup-checks-harness.mjs:41`), re-exported at `:116`, and already imported at line 16 of all 5 target files. It is a strict superset of `process.env`, so the swap removes no environment variable (RESEARCH F1). `FGOS_CLAUDE_COMMAND` is a documented test-only seam (`src/setup/registrations.mjs:822,285`; RESEARCH F2). | Very low. The constant is the sanctioned mechanism, and the swap is additive. |
| D3 | The edit must cover **both** syntactic shapes and land all 10 sites — not a find-replace on one literal string. | 9 sites are the property form `env: { ...process.env, HOME: homeDir }`; the 10th, `test/setup/checks-setup-idempotent.test.mjs:44`, is a variable binding `const env = { ...process.env, HOME: homeDir };` (RESEARCH F4). A replace keyed on the property-form literal matches 9 and silently leaves one ~11s real-CLI spawn behind. | Medium if ignored — it would look like a partial, unexplained ~11s residue in the measurement and invite a wrong conclusion about the root cause. |
| D4 | The three `fgos doctor` spawns at `test/setup/checks.test.mjs:971,984,997` are **out** of this first unit, recorded as a deliberate boundary and a candidate follow-up. | Same leak by the same mechanism — `checkClaudePluginMarketplace` is registered once in the check registry (`src/setup/registrations.mjs:931`), so `doctor` reaches it exactly as `setup` does (RESEARCH F3, F6) — and the same file already uses `NO_CLAUDE_ENV` elsewhere (`checks.test.mjs:20,473,752,772,775`). But the person's scope names only `checks-setup-*.test.mjs`. | Low. Deferring costs some remaining CPU, which the D5 measurement will quantify rather than hide. |
| D5 | Measure before extending. Re-run the item's own verify command after the edit and record real numbers; only then may `test/cli` spawn cost be considered. | Explicit instruction from the person, and consistent with the item's own history: its first architectural assumption (git-fixture pooling) was disproved by measurement — a real git repo costs 13ms, while the unblocked `fgos setup` costs 11,031ms vs 126ms blocked. | Low, and this is the guard against the item ballooning on a second unmeasured assumption. |

| D6 | The item's `verify` becomes the runnable command `npm test`. The test-count / CPU / wall-clock thresholds move to the review gate, read from this feature's own Measured result table. | `fgos return` executes `verify` through `/bin/sh`. The original field was Vietnamese prose, so it died immediately on the `(` in `(ngoai loi guard orchestrator co san)` — `/bin/sh: 1: Syntax error: "(" unexpected`, exit 2 — and could never pass regardless of the code. Decided by the person 2026-08-11 after the defect was surfaced rather than worked around. | Low. The thresholds are still checked, by a reader at review instead of by the shell; `/usr/bin/time` reports numbers but cannot assert a threshold, so no single command could have enforced them as written. |

No test intentionally exercises the real `claude` binary, so the item's
"if a test intentionally wants the real claude, keep it and record why"
constraint has an empty answer set: every test touching that path either
blocks it or points `FGOS_CLAUDE_COMMAND` at a purpose-built stub script
(`test/setup/plugin-marketplace-doctor-check.test.mjs:97-103`; RESEARCH F5).
Nothing needs preserving.

## Pinned terms

- **"blocked" / "unblocked"** — whether a spawned `fgos` process inherits
  `FGOS_CLAUDE_COMMAND` pointing at a nonexistent path (blocked, ~126ms) or
  falls through to the real `claude` on this machine (unblocked, ~11,031ms).
  Not about network reachability or any fgOS-level feature flag.
- **"the 10 tests"** — the 10 enumerated `{ ...process.env, HOME: homeDir }`
  sites in `test/setup/checks-setup-*.test.mjs`, spanning both syntactic
  shapes per D3. Not "10 test files" (there are 5) and not the 3 further
  sites in `checks.test.mjs` (D4).

## Scout evidence

Gathered and cited in full in [`RESEARCH.md`](./RESEARCH.md) round 1
(F1–F6). Paths that matter downstream:

- `test/setup/helpers/setup-checks-harness.mjs:41,116` — `NO_CLAUDE_ENV`
- `src/setup/registrations.mjs:828-829` — `claudeCommand()`
- `src/setup/registrations.mjs:834,848,902,914` — the four real-CLI spawn sites
- `src/setup/registrations.mjs:860,931` — the check and its single registration
- `test/setup/checks-setup-*.test.mjs` — the 10 edit sites
- `test/setup/checks.test.mjs:971,984,997` — D4's deferred sites

`impact-analysis: full` — `gitnexus` is registered and reports `status:
present` (`fgos tool query --capability impact-analysis --status present`,
2026-08-11). Per `CLAUDE.md`'s gate, `present` attests installation only,
never index freshness. Recorded for a later reader; it does not reshape any
decision above, since this unit edits no production symbol.

## Canonical references

- `docs/history/tsk-25b-test-wallclock-split/plan.md` — where this item's
  original probe measurements were recorded
- `AGENTS.md` — definition of done (L5), `npm test` as the proof gate

## Outstanding questions

None
