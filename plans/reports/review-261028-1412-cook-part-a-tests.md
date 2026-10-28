# Review: tests on `cook/pattern-catalog-part-a`

Reviewer: TEST lane. Read-only. Merge-base `2d4032560`. Branch HEAD read from `/home/vantt/projects/forgent-worktrees/cook-part-a`.
Rule used: design principle 8 (One proof) and L5 q5, plus L10 (retire the old mechanism in the same change).

## Totals

| Item | Count |
|---|---|
| `test(` titles added (diff with rename detection, regex `^\+\s*test\(`) | 183 |
| `test(` titles removed | 29 |
| Added tests I judge justified (own behaviour, right layer, right file) | about 165 |
| Added tests with a finding (duplicate, layer, cost, naming or weakening) | 18 |
| Of those, delete or merge outright | 7 |

The count differs from the "+250" in the brief. My regex counts only top-level `test(` lines. Treat 183 as a floor.

Timing was skipped. `pgrep` shows `node scripts/run-tests.mjs` running with cwd `/home/vantt/projects/forgent-worktrees/cook-part-a`, so I did not start a second run there.

## L10 verdict: old `patterns/*` versus new `loops/*`

Clean. The old mechanism is gone: `patterns/index.mjs`, `presets.mjs` and `solo.mjs` are deleted in `src`, and their three test files are deleted. The debate, panel, reviewed, role-tasks and architecture-guard tests were moved by rename (R82 to R86), not copied. `patterns/` now holds only `catalog.mjs` and `catalog-entries.mjs`, which is a new mechanism that owns `catalog.test.mjs`. No finding here, except the weakening in F12.

One source-level note that explains two test overlaps (F10): retired-key detection exists twice, in `src/runner/execution/patterns/catalog-entries.mjs:380-441` and in `src/runner/dispatch/retired-config-keys.mjs` (used by `config.mjs`). That is two doors for one rule.

## Findings

| # | Where | Rule broken | Evidence | Fix |
|---|---|---|---|---|
| F1 | `test/runner/execution/loops/index.test.mjs:145` `paramTableOf returns the param table...` | One proof | It asserts the exact key list of each loop. `debate.test.mjs:177`, `panel.test.mjs:184`, `reviewed.test.mjs:521`, `solo.test.mjs:105` already assert the same keys and the type, scalar and requestable flags. `DEFAULT_MAX_ROUNDS === 2` is asserted here and in `reviewed.test.mjs:522`; `DEFAULT_REBUTTAL` here and in `debate.test.mjs:178`. | Keep only what the dispatcher owns: null for unknown, `toString`, `__proto__`, `null`, `123`, and the `{loop}` object form. Delete the four key-list blocks and the two DEFAULT asserts. |
| F2 | `loops/index.test.mjs:66` `runLoop dispatches effective parameters and custom seats` | One proof | Same behaviour as `loops/solo.test.mjs:113` `runSolo honors declared seats passed through params` (solo, one `advisor` seat). | Delete `index.test.mjs:66`. The solo test owns it. |
| F2b | `loops/debate.test.mjs:168` `runLoop dispatches debate loop by name...` | Wrong file | The wiring proofs for solo, reviewed and panel sit in `index.test.mjs` (owner of `runLoop`). The debate one sits in `debate.test.mjs`. | Move it to `index.test.mjs`, so each of the four loops has one wiring proof in one place. |
| F3 | `loops/solo.test.mjs:127` and `:152` | One proof | `verify runs once after a passing producer` and `pass yields a verify result and a harness receipt` run the same pass path. The second adds one assert (`isVerifyResult`). | Merge into one test. |
| F4 | `test/runner/execution/run.test.mjs:1950` `same name or one selector runs when explicit selectors do not conflict` | One proof, cost | The selector rules are owned by `patterns/catalog.test.mjs:1693` `selection precedence chain...` (it covers the no-conflict case). This test makes two full `runUnit` runs in a git repo to prove the same thing. | Delete it. |
| F5 | `run.test.mjs:1940` `conflicting explicit pattern selectors refuse selector-conflict...` | Cost | The refusal is owned by `catalog.test.mjs:1701-1717`. The only run-level behaviour is "reserves nothing". It builds a git repo with `setupGitRepo()` for a refusal that happens before any git use. | Keep as the single wiring proof, but shrink it to the `assignments` dir check, or accept as is. Low priority. |
| F6 | `run.test.mjs:2204` `a pinned unit keeps its effective seats on resume...` | One proof | Same behaviour as `run.test.mjs:2146` (resume uses the pin, not live config) and `loops/index.test.mjs:85` `runLoop uses pin effective seats over recomputed config` (same roster, same id `u-pinned-roster`). The second resume in 2204 repeats the first assertion. | Delete the second-resume half. Keep one of 2146/2204 as the run-level wiring proof and index:85 as the loop-level proof. Share the 40-line unit-record literal in 2146, 2204 and 2286 through one `pinnedRecord()` helper. |
| F7 | `run.test.mjs` `a solo record with a command does not settle before verify completes...` | One proof | Its first half (no command settles `pass` via `writeUnitSummary`) repeats `unit-summary.test.mjs:484`, case `u-solo-no-cmd`. | Drop the no-command half. Keep the resume-runs-verify half. |
| F8 | `test/cli/run-verb.test.mjs:431` `fgos run refuses conflicting parameters between param and params` | Layer, one proof | `param-request-conflict` is owned by `run-request.test.mjs:119` and `:126` (same key in `params` and `param`). The CLI test spawns fgos to re-prove it. | Delete. The flag plumbing is already proven by the other new CLI tests. |
| F9 | `run-verb.test.mjs:453` `fgos run standalone request is admitted without a reason...` | Layer, phantom risk | It wraps `runCli` in `try/catch` and reads `err.stdout`, so a crash and a pass look alike. The request-to-pin behaviour (`provenance.params.maxRounds === 'request'`) is owned in-process by `catalog.test.mjs` (`resFalsyParam.pin.provenance.params.rebuttal === 'request'`). | Remove the try/catch and use a fixture that completes, or drop the test. The comment admits the fixture may refuse after admission. |
| F10 | `test/cli/fgos-case-doors.test.mjs:78` | Layer, cost | Two fgos spawns, one for `--param` and one for `--params`. Both reach the same `requestFromFlags` path owned by `run-request.test.mjs`. The refusal itself is owned by `catalog.test.mjs:2027` and `run-case-admission.test.mjs:394`. | Use one spawn (`--param`). |
| F11 | `test/cli/plan-lint.test.mjs:190` | One proof | The typo finding (`pattern.unknown` for the misspelled name) repeats `test/report/capability-plan-lint.test.mjs:661`. The only new thing at CLI level is that project config is read. | Keep the custom-pattern-accepted assert, drop the typo assert. |
| F12 | `catalog.test.mjs:209`, `:224` (second half), `:245` versus `test/runner/dispatch-config-patterns.test.mjs:302` | One proof | Both files refuse `defaultRule`, `research-fan-out-gated` and a mixed `reviewed` entry with `config-key-retired` or a config error. They run two separate detectors (see note above). | Fix the source first: one retired-key detector. Then keep one proof (the loader one, which also covers the file door), and delete the three `checkCatalog` copies. |
| F13 | `dispatch-config-patterns.test.mjs` titles `bounds validity at load (S9)` and `retired keys refusal (S18)` | Stable Code Artifacts rule | Finding codes in test names. | Rename without S9 and S18. |
| F14 | `catalog.test.mjs:896` `shipped pattern lookup does not read inherited properties or mutate global object` | Phantom test | `assert.strictEqual(Object.isFrozen(Object), false)` is true in any process. The `entries.constructor !== Object` assert is the only real check, and `:813`, `:876` and `:1064` cover the same inherited-property hardening. | Fold the one real assert into `:1064`, delete `:896`. |
| F15 | `test/setup/runner-config-conversion.test.mjs:400` `setup CLI prints global guidance...` | Layer, cost | Two full `fgos setup` spawns (`--pretty`, then `--json`). The in-process test at `:218` already proves the conversion status. | One spawn with `--json` as the single wiring proof. Move the `/global config holds retired keys/` text check to a unit test of the notice builder, if one exists. |
| F16 | `test/runner/execution/run-case-admission.test.mjs:380` | One proof | The "no reason refuses" half repeats `catalog.test.mjs:1597`. The "with reason records the swap in the pin" half is unique. | Keep, but cut the refusal half down to the single `admit` call count assert. Low priority. |
| F17 | `run.test.mjs` and `run-case-admission.test.mjs` import lines | Rule 6 smell | Both add `try { fs.accessSync('/var/tmp', W_OK) } catch { process.env.FGOS_TEST_FIXTURE_ROOT = os.tmpdir() }` before a top-level `await import(...)`. This is a per-machine env workaround pasted into two test files. `test/helpers/fixture-dir.mjs` already owns `FGOS_TEST_FIXTURE_ROOT`. | Put the fallback in `fixture-dir.mjs` or drop it. Do not set env in test files. |
| F18 | Weakening: deleted `patterns/presets.test.mjs` and `patterns/index.test.mjs` preset tests | Weakening | The old `PRESETS ... immutable shapes` test asserted `rfc.params.maxRounds === 1`, the exact `research-fan-out` seats (3 researchers + synthesizer, no `members`) and `consult` solo with an `advisor` seat. Now `dispatch-config-patterns.test.mjs:30` asserts only `minCheckers` for code-change and rfc, and the fixed `advisor` seat for consult. Nothing asserts rfc `maxRounds: 1` (set in `core/config-standard/runner.yaml:892`). `seats.test.mjs:244` and `seat-resolver.test.mjs:123` check only counts (3 producers, 4 launches), not seat names. The four `runPattern dispatches named preset ...` tests are gone with no resolver-level replacement for consult, research-fan-out and code-change. | Add to `dispatch-config-patterns.test.mjs:30`: `patterns.rfc.defaults.maxRounds === 1` and the research-fan-out seat list. Add one `resolveCollaboration` case each for `consult` and `research-fan-out` in `catalog.test.mjs`, asserting seats. |

## Checked and not a finding

- `catalog.test.mjs` (48 tests, 2041 lines) is one big file, but each test owns a distinct validation rule. `checkCatalog` seat multiplicity (`:568`) versus `seat-resolver.test.mjs:279` and `run-case-admission.test.mjs:364` are three different layers with three different callers. Kept.
- `loops/*.test.mjs` moves keep their asserts. The reviewed, panel and debate diffs only rename `pattern` to `loop` and add param-table tests.
- `test/architecture.test.mjs` +3 tests: rename completeness, retired literal allowlist, manifest vs disk. Each has a different subject. Kept.
- `run-request.test.mjs` (17 tests): single owner of `requestFromFlags`. Many are small refusals, but no other file owns them (apart from F8).
- `skip` / `todo`: none added. No test-only branches in `src`. The only env writes in tests are `HOME`/`USERPROFILE` (saved and restored) and F17.
- Fixture cost: new `catalog.test`, `index.test`, `loops/solo.test`, `run-request.test` are in-memory. Git repos appear only in `run.test.mjs` and `run-case-admission.test.mjs` (`setupGitRepo`), where the run door is the subject.

## Recommended order

1. F18 (weakening). Add the asserts before the branch lands.
2. F12 (single retired-key detector, then delete test copies) and F6/F4/F8 (plain deletes).
3. F1, F2, F2b, F3, F7, F11, F14, F15 (trim or merge).
4. F9, F10, F13, F17 (cleanup).
