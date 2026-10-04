# Dogfood on mdview (2026-10-04)

Target: `/home/vantt/projects/mdview` (Rust project, already had a legacy `.fgos/` from an earlier adoption, git clean at start).
fgOS used: staged release built from forgentX HEAD `02e07cecd` via `scripts/build-rust-distribution.mjs` and `fgctl init --from` (the same path an external consumer's CI uses).
Lead = the agent (me) acting as the person driving. No push, no merge in mdview.

## Verdicts on the four questions

| # | Question | Verdict |
|---|---|---|
| 1 | Setup and doctor clean without hand-editing | **No.** 8 of 94 checks still fail after init, doctor --fix and the deprecated setup; 3 needed hand-editing or knowledge from outside the tool |
| 2 | One Unit through `fgos run --pattern reviewed` in herdr | **Partly.** Producer committed a correct change and the red-team passed; the reviewer role failed, so the run ended `blocked`. Needed 4 manual steps first |
| 3 | Right person, independence, transport provenance | **Partly.** Executor, invocation, transport and posture are recorded per role; provider family and the independence requirement are not |
| 4 | A Workflow with a human gate | **Blocked, not run.** Every `workflow` verb fails in an fgctl-installed release (missing `yaml` package) |

## Measurements

| Measure | Value |
|---|---|
| Doctor failures: before init / after init + doctor --fix / after deprecated setup | 21 / 19 / 8 of 94 |
| Commands run to reach a first working `fgos run` | about 25 (10 for setup, 15 for routing and run attempts) |
| Hand interventions that no tool step covered | 6 (below) |
| `fgos run` attempts before one executed | 5 refusals or failures, 1 executed |
| Longest wait | 93 s for the executed reviewed run |
| End state | one commit `ff70efd` on branch `dogfood/agents-description` in worktree `~/projects/mdview--wt--dogfood-agents`; run outcome `blocked` |

Hand interventions: (1) find `fgctl`, which is not on PATH (only `target/release/fgctl` inside forgentX); (2) delete the retired `runner.models` key that setup left behind and the runner refuses; (3) copy executors and capability `prefer` lists from another project, because onboarding leaves no runnable executor set; (4) create a linked git worktree by hand (mutating runs refuse the main checkout and the message does not say how); (5) pin executors with `--override` three times (the configured preference pins an unconfined invocation, so workspace-write is refused; two executors need a per-project folder trust that only a person can give); (6) the one-line fix of the placeholder itself was done by the producer, not by me.

## Findings, most severe first

1. **Workflows cannot run from any fgctl-installed release.** `fgos workflow start` fails with `Cannot find package 'yaml'` (`libexec/legacy-node/src/workflow/loader.mjs`). `scripts/build-rust-distribution.mjs:120` skips `node_modules`, none of 6 staged releases has one, and forgentX's own installation fails the same way. `workflow` is the main request-to-run door. Not reproduced on a published release tarball, only on the same build script's output. Needs a decision: bundle dependencies or stop depending on them in the legacy payload.
2. **The reviewer role is given the producer's task.** All roles of a Unit run get the same objective. The xai reviewer tried to perform the edit, hit a read-only error and reported `blocked`; the Claude red-team inferred its job from the `Role:` label and verified the commit correctly. This is the opus review's finding 5 (per-role data never reaches the brief), now seen in a real run. The cross-provider review step only works when the reviewing model guesses its role.
3. **Doctor recommends a deprecated command.** 14 of its failure messages say "run fgos setup"; `setup` has been deprecated since 2026-09-14 and the documented path (`fgctl init`, `doctor --fix`, `doctor`) leaves those failing. Only the deprecated command cleared most of them, and it also leaves a retired `runner.models` key that the runner refuses.
4. **Onboarding yields no runnable executor set.** After init, doctor and setup, `decide --for code:implement` answers `unavailable` (no `prefer`, one empty `openai` executor). A new project cannot run anything headless without hand-writing executors and preferences.
5. **Hidden per-project, per-executor trust.** codex and agy have not been told to trust the project; nothing in doctor checks it. The failure surfaces as "foreground process does not match prepared command argv", while the real reason (`trustSeedFailed: ... root is not itself trusted`) sits in `visibility.json`.
6. **`fgctl` is not on PATH** after a dev install, `fgctl init --help` is rejected, and `fgctl init` prints nothing on success while leaving untracked files in the project (`docs/decisions/`, `docs/doc-registry.*`, `docs/enduser-docs-index.json`); the deprecated `setup` adds `.agents/`, `.claude/settings.json`, `.claude/skills/`.
7. **Provenance gap.** The recorded binding has executor, invocation, transport, posture; no provider family, and `independentOf` is empty even for the reviewer and red-team, so a stranger cannot tell from the record that independence was required or met.
8. **Mutating runs need a worktree the tool does not create.** The refusal names the rule, not the command.
9. **Doctor's remaining legacy debt** in mdview (17 unresolvable outcome sources, 5 stale coordination sessions, friction migration not run) is data from the earlier adoption; none of it is fixed by `doctor --fix`.

## Left in mdview (nothing committed to its main, nothing pushed)

- Worktree `~/projects/mdview--wt--dogfood-agents`, branch `dogfood/agents-description`, commit `ff70efd` (one line of `AGENTS.md`, correct against the README).
- Untracked files listed in finding 6, and `.fgos/config.json` edited by hand (backups at the job tmp dir).
- To undo: `git -C ~/projects/mdview worktree remove --force ../mdview--wt--dogfood-agents && git -C ~/projects/mdview branch -D dogfood/agents-description`, then delete the untracked files above.

## Not measured

Wait time for the person (the run was driven by me, no human was waiting); a published-release install (only a local build); the Workflow human gate (blocked by finding 1); the reviewed run with all roles succeeding.

## Unresolved questions

- Is the missing `yaml` package also true of the published GitHub release tarballs?
- Should a fresh project get a default executor set from `fgctl init`, or is that meant to be a person's job?
- Should folder trust be a doctor check per executor family?
