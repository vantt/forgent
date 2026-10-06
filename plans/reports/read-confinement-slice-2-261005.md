# Read confinement, slice 2 (blind units that receive their inputs, live canary), 2026-10-05

Branch `worktree-agent-ab3f6b7f52e54c8ec`, built on slice 1 (`d010c75e7`, merged main `a8fc46d1e`). No decision record (slice 3). Impact gate: no impact-analysis provider registered, inactive.

## Fix 1: hand-off copies in the role's own round directory

Deviation from the design: B copied only `unit-run:` reports, only with `anonymizeInputs`, into `<unitDir>/inputs/` shared by all roles; a blind unit with `unit-run:` or `gate-answer:` input was refused `blind-ref-hidden`.

Fixed in the one resolver, `resolveUnitInputs` (`src/runner/execution/handoff-refs.mjs`), plus one helper, `copyHandoffsInto`:

- With `blind`, the resolver (same resolution, same named failures) copies nothing at creation. It lists in `inputMap` every `unit-run:` input, every `gate-answer:` input and every other ref inside a hidden root (`resolveBlindHiddenRoots`, the same function the driver uses), with the name its copy gets and the sha256 of the bytes resolved. `refs` keeps only what a blind worker can read where it lies. Both go to `unit.json` (`resolvedInputs`, `inputMap`).
- At each dispatch (`run.mjs` `dispatchBound`), `copyHandoffsInto(assignmentDir, ...)` copies byte for byte into `<round dir>/inputs/<name>` (the dir slice 1 binds back read-only, so only that role reads its copy). The role's context refs list the copies. One copy per role, nothing shared between roles of the unit.
- In-run hand-offs get the same treatment: a blind panel synthesizer's panelist reports are copied into its own dir (they were also hidden-root refs).
- Names: `seat-A...` for `unit-run:` inputs when `anonymizeInputs` is on, else `<n>-<role>-r<round>` / `<n>-gate-<step>`. Unconditional for blind units, no need for `anonymizeInputs`. Non-blind units are untouched (default and `anonymizeInputs` paths byte-identical, existing tests unchanged).
- Failures: source missing is `copy-failed` / `no-such-run` etc. at creation (before any directory exists); a source edited after settle is `report-changed-after-settle`, at creation and again at copy time. A copy already in place with the recorded sha256 is reused, so a resume reads the same files without the source. A fallback attempt has its own round dir and gets its own copies from the same list. `blind-ref-hidden` now only fires for refs that cannot be copied.

Tests, written against real bwrap (hermetic, fixtures under `/var/tmp`): `test/runner/execution/handoff-refs.test.mjs` (5 new: classification and names, anonymized naming, named failures, byte-identical copy / resume reuse / changed source / missing source, hidden-root predicate) and `test/runner/execution/run.test.mjs` (3 new plus a blind panel synthesizer test, replacing the old `blind-ref-hidden` expectation): a confined blind worker lists its refs, reads the copies (report and gate answer), gets `ENOENT` on both absolute sources, `unit.json` holds `resolvedInputs: ['docs/a.md']` and the `inputMap`, a resume with the source deleted still passes; anonymized copy is `seat-A.md` in the role dir with no earlier run id in the assignment and no shared `<unitDir>/inputs`; an edited or missing source is refused with the named reason.

## Fix 2: herdr socket mask and `--unshare-pid` under a live herdr pane

Measured, no code change needed. Blind units in herdr panes (claude, codex, xai/pi) were detected by herdr and tracked: `visibility.json` `agentKnownToHerdr: detected`, `outcome: settled`, and the polled `herdr pane list` status moved `unknown` -> `working` -> idle (claude: 15:50:54 unknown, 15:50:58 working to 15:51:37, 15:51:39 idle after settle; codex and pi: `unknown` -> `working` until settle). Pane processes were not killed by the argv check. So the mask on `~/.config/herdr` and `--unshare-pid` do not stop detection, and the sibling-socket (`ENOENT`) and sibling-cmdline (`ENOENT`) checks of slice 1 still hold (argv unchanged, `test/runner/dispatch-confinement-blind.test.mjs` green). The worker's own herdr hook socket is hidden, which costs nothing observable: detection is by process and screen. No `blind-unsupported-transport` needed.

One finding outside blind: `agy-herdr-mucdong` fails with and without blind (see canary table).

## Live canary

Unit A (deepseek, `pi-cli-bwrap-openrouter`, unblind) wrote nonce `HX-7f3a91c2d4` in its report only. Each family then ran unit B, `blind: true`, `inputs: ['unit-run:<A>/producer']`, objective: state the `NONCE:` line of the ref in the brief, `cat` the absolute path of A's report, `ls .fgos/assignments`. Pass = nonce read from the copy, `cat` gives `No such file or directory`, `ls` lists only its own unit run. Run through `node bin/fgos.mjs run --unit <f> --pattern solo --override '{"scope":{},"executor":..,"invocation":..}'` from this worktree (state under `/home/vantt/projects/forgentX/.fgos`), secrets sourced into the child shell only. 11 live runs used of 12.

| Family | Executor / invocation | Result | Evidence (unit run id, under `.fgos/assignments/`) |
|---|---|---|---|
| (source unit) | deepseek / pi-cli-bwrap-openrouter, unblind | pass, nonce in report | `unit-run-1791189500373-7444d6ac` |
| claude | claude-herdr / claude-herdr-bwrap (herdr) | pass; nonce read, `cat` ENOENT, `ls` own chain only; `agentKnownToHerdr: detected`; status unknown -> working -> idle (second run, polled) | `unit-run-1791189547867-74aba333`, `unit-run-1791190252943-d876370a` (status poll run, `/tmp/canary/poll-claude.txt`) |
| openai (codex) | openai / codex-herdr-fgovn (herdr) | pass, same three results, detected, `unknown` -> `working` | `unit-run-1791189613231-1dcff212` |
| openai (codex) | openai / codex-cli-bwrap | pass, same three results | `unit-run-1791190308324-5e9be035` |
| xai | xai / pi-herdr-vantt (herdr) | pass, same three results, detected | `unit-run-1791189680679-e0dd6f6a` |
| glm | glm / pi-cli-bwrap-openrouter | pass, same three results | `unit-run-1791189764815-0219c0b1` |
| deepseek | deepseek / pi-cli-bwrap-openrouter | pass, same three results | `unit-run-1791189860993-98238582` |
| agy (gemini) | gemini / agy-herdr-mucdong (herdr) | **fail, not caused by blind**: `foreground process in pane ... does not match prepared command argv; process killed and pane closed`. The same unit unblind (`unit-c`, "reply ok") fails identically | blind `unit-run-1791189946830-3eade2a1`, control `unit-run-1791190046174-dad588cf` (second agy run, `/tmp/canary/c-agy-herdr.out`) |
| agy (gemini) | gemini / agy-cli-bwrap-mucdong | **inconclusive**: provider `RESOURCE_EXHAUSTED` (account quota, resets in 39 min), exit 3, no report | `unit-run-1791190124824-563209b8` |

Not run: claude-cli-bwrap, pi variants of openai and the other cli-bwrap executors (same `pi` / `codex` CLIs and bwrap shape as the families above that passed). Panes: every pane the runs created closed itself; none left. I deleted the four `/tmp/fgos-confinement/disp_*` dirs the cli runs left.

## Workflows

Blind is now on, because the families their runs can bind passed the canary and the fail-closed refusal covers the rest:

- `delphi`: `propose-round-1` (independent) and `propose-round-2` (reads the synthesized feedback as an anonymized copy; with Fix 1 and `anonymizeInputs` it is the real Delphi round 2).
- `nominal-group`: `generate-ideas`.
- `group-cognition`: `sense-making-panel`.

Test: the end-to-end Delphi, nominal-group and group-cognition workflow tests (real bwrap, fake executors) pass with the flags, and a new test pins which steps are blind.

Intentionally not blind:

- `architecture-advisory` (`shape-proposals`) and `business-discussion` (`explore-perspectives`): their capability pools (this repo's `.fgos/config.json`) include `gemini` (agy), which did not pass the canary, and the steps have a framing hand-off. Simplest choice: leave the steps non-blind rather than edit the pool, since the pool is a per-project fact and agy-herdr is broken with or without blind.
- Later steps (synthesizers, critique, voting, ranking, `reviewed` steps): they read peer verdicts on purpose, or add nothing blindness protects.
- Pools of the blind steps are per project (the YAML ships none; `delphi:propose`, `nominal-group:generate`, `group-cognition:explore` have no pool in this repo's config). A project whose pool lists agy for a blind step should drop it or stay on a family that passed: agy fails the herdr transport regardless of blind.

## Deviations and their fixes

1. B copied only `unit-run:`, only with the flag, into a dir shared by roles: fixed as above (per-role copies, unconditional, gate answers and in-run refs included).
2. Design said B copies on creation into the role dir; the role dir (and fallback dirs) are not known then, so the copy happens at dispatch from the sources recorded and hashed in `unit.json`. A resume of the same role reuses the copy; if the source was lost before a role's first copy, the unit fails with a named reason rather than running without its input.
3. Fix 2's risk did not materialize, so the shape is unchanged.

## Files

`src/runner/execution/handoff-refs.mjs`, `src/runner/execution/run.mjs`; `core/workflows/delphi.yaml`, `nominal-group.yaml`, `group-cognition.yaml`; tests `test/runner/execution/handoff-refs.test.mjs`, `run.test.mjs`, `test/workflow/discussion-workflows.test.mjs`; docs `docs/specs/confinement-authority.md` §9.2, `docs/specs/runner.md`, `docs/routing-handoff-contract.md`, `docs/how-to/configure-and-operate-agent-confinement.md`, `CHANGELOG.md`. No new `.mjs` file, so `docs/architecture-manifest.json` is unchanged. The doctor row list is unchanged (no new check). No component-boundary change.

Narrow runs, all green (`test/architecture.test.mjs`, `test/runner/execution/*`, `test/workflow/*`, `test/runner/dispatch-confinement-*` : 353; `test/setup/*`: 686). I did not run the full suite.

## Open

- agy: `agy-herdr-mucdong` foreground-process mismatch (breaks unblind too) and the mucdong cli quota; re-run the canary once either is fixed.
- A project config, not this repo, decides each blind step's pool; a doctor check that a blind step's pool holds only blind-proven families is not built.

Status: DONE_WITH_CONCERNS
