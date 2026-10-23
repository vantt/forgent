# Phase 8 closure review B, round 3: verification of the round-2 rework

Pin: `/home/vantt/projects/forgentX-s8-review` at `27c2b2cde` (the fix is `890715ead`, the records follow-up is `27c2b2cde`). Read-only: no git writes, no fgos CLI against this repo, no npm test. Scratch: `/tmp/fgos-work/review-B3/`. Host: `FGOS_HOST_BIN=<releasePath>/bin/fgos`, releasePath `sha256:447cb9a4…`, with git addon bootstrap `--import /tmp/fgos-work/review-B3/boot.mjs` (`ensureScriptAddon()`).

## Verdict: APPROVE

All four round-2 findings are fixed. The fix introduced no regression in the refusal contract. The one behaviour change (lease refusal now comes before prompt-argument validation) is fail-closed and keeps exit code 4. Details are below.

## Per-finding table

| Finding | Status | Evidence |
|---|---|---|
| **M1**: git spec §9 restated the reverted "always pass target" rule | FIXED | `docs/platform/git/spec.md:393` now says "Only declared resolution files require an explicit `target`; otherwise Land selects the current target under its merge slot, and both runner and Workflow doors re-admit the actual prepared source/target before publication (§7)". This matches §7 (`:351`) and the code: `src/runner/merge.mjs:929` sets `...(files.length > 0 && { target: pinned })`, and `src/workflow/runner.mjs:626-635` passes no target and runs `admitLease(candidate.source, candidate.target)`. A grep for other "always pass(es) … target" or "including when declarations are empty" wording in `docs/`, `packages/git/`, `src/` and `CHANGELOG.md` finds nothing. |
| **M2**: a non-holder `fgos run "<prompt>" --provider` rewrote `.fgos/config.json` before admission | FIXED | `bin/fgos.mjs:2920-2926`: `admitDocumentationExecution` now runs before `adhocUnitFromPrompt` (and so before `ensureRunnerConfigForDir`) and before port construction. The same admission object is still passed to `runUnit`, with no second read. Reproduction `/tmp/fgos-work/review-B3/probe.mjs` hashes the whole `.fgos/` tree before and after each run, in two lease states × two config states × 9 argument shapes (36 child runs). **Lease held, non-holder:** all 18 runs exit 4 and change 0 files under `.fgos/`. That covers prompt, prompt `--provider x-agent`, prompt `--provider nope`, prompt `--writes` without a worktree, prompt `--writes --worktree <other wt>`, `--unit <file>`, `--resume`, and both the minimal-config and absent-config variants. The config-absent `--provider` case (the bootstrap write at `config.mjs:468`) is also clean. The bindings sentinel is never created. **Control (lease not held):** the same invocations do write `.fgos/config.json` (default-key fill or bootstrap), `assignments/…` and the `--resume` sentinel. So the probe detects writes, and the clean held result is real rather than vacuous. |
| **L2**: human `docs-lease status` on a corrupt sidecar printed NaN/undefined | FIXED | `bin/fgos.mjs:3874` branches on `res.state === 'corrupt'` before the held branch and prints "sidecar is corrupt; failing closed" plus the repair command. That command is valid: `abandonDocumentationCutoverLease` accepts the `corrupt` status (`documentation-cutover-lease.mjs:223`, `repair: 'corrupt-sidecar'`). The new e2e assertion asserts the JSON `{state:'corrupt', held:true, sidecar:null}`, an equal exit code, the corrupt line, and no `NaN|undefined`. |
| **Scorecard** land-vs-manual-commit count, 9/9 vs 8 | FIXED (scorecard). Low residual in records. | `step-08-phase-08-scorecard.md:127` and `:136` now say **8/8**. The file has 8 `test(` calls at the pin. `owner-answers.md:2756` records the correction. The historical rows `owner-answers.md:2583` ("7/9 → 9/9") and `:2621` ("9/9") still carry the wrong denominator. They are append-only history and the correction note supersedes them, so no action is required. |

## Tests (single files, `env -u CLAUDE_CODE_SESSION_ID`, FGOS_HOST_BIN as above)

| File | Result |
|---|---|
| `test/runner/execution/run-case-admission.test.mjs`, pattern `documentation lease admission` | 1/1, exit 0. It now loops the CLI child over `--resume`, a prompt, a prompt with `--provider okay`, and `--unit`, and asserts exit 4, the lease message, byte-identical config and no sentinel. The fixture config lacks most `DEFAULT_RUNNER_CONFIG` keys, so the pre-fix `--provider` path would have rewritten it. The test is therefore a real regression guard. |
| `test/e2e/documentation-cutover-lease-hooks.test.mjs` | 35/35, exit 0, including the human-mode `status` case that carries the corrupt rendering assertions. |

The full `run-case-admission` file and the Land files were not rerun: they are not touched by `890715ead`, and round 2 already recorded their sandbox-only worker failures.

## Regression check on the reorder

- **Validation order for non-holders while a lease is held:** errors raised inside `adhocUnitFromPrompt` now report `documentation cutover lease is held` instead of the specific validation message. These are an unknown `--provider`, `--writes` without a linked worktree, an empty `--input`, and an invalid persona. The exit code is unchanged (4 for both). Flags validated before line 2917 still win over the lease refusal; for example, `--timeout zz` printed its own message in both states. This is fail-closed, so it is not a defect. For a holder, or when no lease is held, the ordering and messages are unchanged: in the probe's unheld runs, an unknown provider and `--writes` without a worktree both kept their validation messages.
- **Outside a git repository:** `admitDocumentationExecution` maps `not-a-repository` to allowed. A run from a non-git directory gives the same "must run inside a git repository" refusal for `--writes`, and creates no `.fgos`.
- **Other changes in this commit:** the census digest refresh (`mutation-census.v1.json`) covers only `bin/fgos.mjs`. The CHANGELOG line now matches the observed behaviour ("writes nothing, including no config bootstrap or case-bindings sentinel").

## New defects

None.

Status: DONE
Summary: APPROVE. `890715ead` fixes M1 (§9 now agrees with §7 and the code), M2 (36-run probe: every held-lease non-holder `fgos run` path, with and without `--provider`, with `--unit`, with `--resume`, and with config present or absent, exits 4 and leaves `.fgos/` byte-identical, while the unheld controls do write), L2 (the corrupt status text is clear and covered), and the scorecard count (8/8). Both touched test files are green (1/1, 35/35). The only behaviour shift is fail-closed: a non-holder now sees the lease refusal before prompt-argument validation, with the same exit code.
