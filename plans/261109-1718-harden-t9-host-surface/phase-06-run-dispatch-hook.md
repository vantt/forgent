---
phase: 06
title: "Run, dispatch, hook verdicts, agents and tool arms: buildRunRequest, one verdict per hook kind judged against the project dir, decide split from the assignment runner"
status: pending
depends_on: ["05 landed, or 04 landed if 05 is not approved"]
parallel: "T5 layer; beside P07 (file-disjoint)"
effort: ~2d
net_size: "Node: bin about -300, src about +260, scripts about -170; Rust 0; tests about -150 (estimate)"
---

# Phase 06 - Run, dispatch, hook (T9-01 High, T9-10, T9-16, T9-21; X1, X9, L-3, L-8)

## Context

**T9-01 (High, reproduced by red-team).** The hook guard is written twice with different outcomes. Claude: `scripts/dispatch-decide-hook.mjs` fails closed on a `config-*` refusal (`:25-31,67-92`) and takes the project from the payload `cwd` (`:61`). agy: an inline branch in `handleHook` (`bin/fgos.mjs:5023-5161`, agy branch inside it) wraps `decideExecutorCli` in `catch { // fail-open }` (arbitration `:5083-5085`) and takes `workspacePaths[0]`; it also spawns a second Node (`:5138` region). A payload `cwd` of `/tmp`, `/nonexistent` or `$HOME` gives exit 0 for a call that blocks from the project. `scripts/decision-question-hook.mjs:36-60` reads the transcript, the agy branch does not.

**T9-10 / X1.** `run` (`:2790-2952`) writes the same "push an unscoped override, fill where unset" block three times (arbitration `:2829-2862`); `adhocUnitFromPrompt` (`:472-528`) holds the slug at `:514` which copies `src/workflow/propose.mjs:41` `slugOf` (only the fallback word differs). `unitOverridesOf` (`src/workflow/unit-handoff.mjs:193`) has different semantics (seat-scoped, `origin: 'workflow'`) and is **not** merged (L-3). Effort is validated per executor in `bind.mjs:264-268`, so `run` does not skip it.

**T9-16.** `decide` writes JSON to stdout and then throws (`:2665-2668` region), so the shell writes a second error to stderr. **T9-21.** `src/git/main-checkout-delete-guard.mjs:1-24` calls itself "last line of defence" but does not judge interpreters, `rsync --delete`, glob `mv`, `shred` (red-team: 30 strings).

Reused doors: `src/runner/execution/run-request.mjs` (94 lines; extend), `src/runner/dispatch/cli.mjs` (496 lines: split `decide` and `probe-account` from the assignment runner so the hook and `decide` load about 60 modules, not 145), `src/state/decision-question.mjs`, `scripts/dispatch-decide-hook.mjs` and `scripts/decision-question-hook.mjs` (become thin entries), `decideExecutorCli`, the registry `subcommands`. The native `hook mailbox` (18 ms) is already the floor; **no new native hook** (decision 76(b), X14).

## Requirements

1. **One verdict per hook kind behind one payload normalizer** for the Claude and agy formats, run in-process by `fgos hook <kind>`: `decideDispatchHook` beside `cli.mjs`, `checkDecisionQuestion` in `src/state/decision-question.mjs`. The project comes from the harness project dir (`CLAUDE_PROJECT_DIR`, the agy workspace root), never a payload `cwd`; a payload `cwd` outside it is judged against the project. **L-8: a config refusal fails closed in both formats**; an unparseable payload follows one rule in both (named in the test table). The agy branch, the second Node spawn and the duplicated script bodies go. The hook scripts keep only what the harness registration needs (a thin entry that calls `fgos hook <kind>`). The Node `hook` refuses the native kinds (`mailbox`, `mailbox-sync`) by name, because it is reached for them only on the unsupported direct-node channel (`ALLOWED_HOOK_KINDS`, `bin/fgos.mjs:5021`, knows `mailbox` but not `mailbox-sync`; T9-14 hook half).
2. **`buildRunRequest(flags, positional, roots)`** in `run-request.mjs`: provider validation, persona resolve, confined-write refusal, case-admission wiring, the three fold blocks as **one local helper**, one `slugOf` leaf shared with `workflow/propose.mjs` (a function in an existing util module; a new file only if no home exists, reported). `adhocUnitFromPrompt` moves with it.
3. **`dispatch`**: `decide` parsed once with one error shape and one stream (T9-16); `KNOWN_DISPATCH_SUBVERBS` (`:2643-2652`) read from the registry (P01); `retiredDispatchDoorMessage` (`:979-997`) moves next to the use case. `agents` (`:3970-3977`) and `tool` (`:3978-4021`): provider listing and tool validation move into their use cases; arms keep flags and print.
4. **T9-21**: the header of `main-checkout-delete-guard.mjs` and `worktree-safety.md` name what the guard does not judge. Text only; idea F-6 (more rules) is not taken.
5. The exit-code map stays in the shell.

## Files

**Create:** possibly one `slugOf` home (decided in step 1; prefer an existing util module).

**Modify:** `src/runner/execution/run-request.mjs`, `src/runner/dispatch/cli.mjs` (and the new split module name taken from step 1), `src/state/decision-question.mjs`, `scripts/dispatch-decide-hook.mjs`, `scripts/decision-question-hook.mjs`, `src/workflow/propose.mjs` (slug import), `src/git/main-checkout-delete-guard.mjs` (header), `worktree-safety.md` (find by `rg -l "worktree-safety" docs core`), `bin/fgos.mjs` (`:472-528`, `:979-997`, `:2639-2952`, `:3970-4021`, `:5023-5161`), `test/scripts/dispatch-decide-hook.test.mjs`, `test/scripts/decision-question-hook.test.mjs`, `test/cli/dispatch-retired-doors.test.mjs` (`:159` wiring), `test/runner/execution/run-request.test.mjs`, `test/cli/run-verb.test.mjs`, `packages/git/contracts/mutation-census.v1.json` (regenerate), `CHANGELOG.md` ("agy hooks now refuse when the project config is unusable, as Claude hooks do"; plus the `decide` error shape line if user-visible).

**Delete:** the agy inline branch and its second spawn, the duplicated script bodies (about 170 lines), the three fold copies, the duplicate slug, the sub-verb lists of `dispatch`/`tool`.

**Tests to retire:** hook cases that spawn the script or the CLI to check a verdict (`test/scripts/dispatch-decide-hook.test.mjs`, `decision-question-hook.test.mjs`) are re-pointed at the verdict functions: one fixture table per format (config refusal, cwd outside, malformed JSON); the wiring proof is `test/cli/dispatch-retired-doors.test.mjs:159`. `run-verb` cases that assert a refusal through a spawned CLI move to `run-request.test.mjs`; `run-verb.test.mjs` keeps one wiring case per branch (prompt, `--unit`, `--resume`, `--case`). Each title names its new owner.

## Red tests first

- Verdict table (both formats): payload `cwd` `/tmp`, `/nonexistent`, `$HOME` is judged against the project and blocks where the project blocks (red-team reproduction); a `config-*` refusal blocks in agy as in Claude.
- `buildRunRequest`: one case per refusal, each failing today only as a spawned-CLI case.
- `decide`: a refusal writes one error on one stream.

## Net size

bin about -300 (hook -115, run -165, `decide`/sub-verb lists -20); src +260 (verdicts +120, `buildRunRequest` +140); scripts -170; tests -150. This is the layer's largest phase and the net depends on the verdict-table tests replacing, not adding to, the script tests.

## Steps

1. Callers by `rg` of `handleHook`, `decideExecutorCli`, `adhocUnitFromPrompt`, `retiredDispatchDoorMessage` with `file:line`; list the harness registrations (`rg -n "dispatch-decide-hook|decision-question-hook" .claude plugins src/setup core`) so the thin entries match them.
2. Red tests; verdict functions; normalizer; entries; arm.
3. `buildRunRequest` and the fold helper; slug leaf.
4. `decide` split; measure `fgos hook dispatch-decide` and `dispatch decide` module counts and wall time (quiet machine, before/after table in the report; targets in the plan's criterion 4).
5. Text edits (T9-21); census; CHANGELOG.

## Validation (focused)

FR `test/scripts/dispatch-decide-hook.test.mjs test/scripts/decision-question-hook.test.mjs test/cli/dispatch-retired-doors.test.mjs test/runner/execution/run-request.test.mjs test/cli/run-verb.test.mjs test/workflow/propose*.test.mjs`; one real Agent/Task call through the Claude harness and one agy payload piped by hand; land gate. Independent reviewer; CHANGELOG line present (L-8).

## Risks

| Risk | L x I | Mitigation |
|---|---|---|
| Fail-closed agy hook blocks a user with a broken config | M x M | refusal names the file and fix; matches Claude; CHANGELOG |
| The harness project dir is unset in some harness | M x H | normalizer falls back to the registration's own root, never to a payload `cwd`; case in the table; an unresolvable project fails closed with a clear message |
| `buildRunRequest` changes override precedence | L x H | goldens of the override list for each of four branches before and after |
| Thin script entry is slower than the old script in a cold start | L x L | measured in step 4 |

## Rollback

Revert the merge commit; scripts return to their full bodies. Hooks registered by users call the same script paths either way.

## Done when

Red then green; agy inline branch gone (`rg -n "workspacePaths" bin` nothing); measured table in the report; reviewer APPROVE.
