# COOK P6: fgos-cook on a real ak:plan, measured

Trial run of `fgos-cook` (roadmap P6) on [the pane launch plan](../261022-1037-herdr-pane-launch-ready/plan.md), built with `ak:plan --hard` from backlog `p-a178ca5c`. Lead `COOK`, machine `fg-server`, workspace `~/projects/forgent`, 2026-10-22. Active release during the run: `ce430e51…` (SEAT + T0, built from main `8e27162e6`), so the tier data below is SEAT-era.

## Outcome

- **The fix is on main and active on `fg-server`.** It is main `172b3906b` in release `fe017e04…`, active since 2026-10-23 00:56. It adds a ready-shell handshake before the launch line, starts panes with `DISABLE_AUTO_UPDATE=true`, and dismisses agent start banners as per-CLI data before the brief. `foreground-not-agent` is untouched. Live proof is in [Land and live proof](#land-and-live-proof). Backlog `p-a178ca5c` is closed, and the separate fault found live is `p-4bkfiw7d3j`.
- **The cook case did not converge.** Case `wf-run-1792641377395-053acb20` used 11 of 14 dispatches over about 4.5 hours. It delivered phases 1 and 2. `child-verified` was never recorded, and the conductor stopped twice on escalation triggers. I stopped the case there. A Sonnet developer then finished phases 3 and 4 and the review fixes in the same worktree, in about 15 minutes of agent time. I verified it independently.
- **Owner questions: 0.** The conductor asked the lead 2 questions (`milestone-not-recorded`, and a dirty file the runner would not land). Both were escalation triggers of the skill, and both were answered inside the frame.

## Measurements

### Slices and paths (the cook case)

| # | Activity | Route | Pattern | Seats (executor / model / tier) | Outcome |
|---|---|---|---|---|---|
| 1 | judge-ambiguity | should | solo | claude / sonnet / advanced | execution-failure (outbox not writable) |
| 2 | lock-decisions | may-instead | solo | gemini / gemini-3.8-flash-high / advanced | run 01 cancelled `foreground-not-agent` (the bug); `--resume` run 02 pass |
| 3 | judge-ambiguity | should | solo | gemini | pass, `decisions-locked` |
| 4 | validate-plan | should | solo | claude / sonnet | execution-failure (outbox) |
| 5 | validate-plan (`code:debug`) | should | solo | claude / sonnet | execution-failure (outbox) |
| 6 | validate-plan (`code:implement`) | should | solo | gemini | pass, `plan-validated` |
| 7 | implement-item, phase 1 | should | solo | gemini | pass, commit `77ce9108c`, no verify receipt |
| 8 | fix-verify-red, phase 1 findings | may-instead | reviewed | gemini; reviewer deepseek-v4-pro; red-team xai grok-4.5 | producer commit `149821a90`; the session died mid-review; adopt-incomplete, settled execution-failure |
| 9 | fix-verify-red, Node counter regression | should | reviewed (2 rounds) | gemini; deepseek; xai | findings; verify timed out (35 min), no receipt |
| 10 | implement-item, phase 2 | should | reviewed (2 rounds) | gemini; deepseek; xai | findings; commits `3607d3c2b`, `932158c7d` |
| 11 | fix-verify-red, `core_rules.rs` | should | reviewed requested, ran 1 round | gemini | execution-failure: path dirty before launch, nothing committed |

- **Slices:** 11 dispatches charged, 5 writing and 6 read-only. 4 settled `pass`, 2 `findings` and 5 `execution-failure`; 3 refusals.
- **Paths chosen:** 9 `should` and 2 `may-instead`, with no unlisted route. The conductor picked rigor, capability and pattern itself, because the route table is still pending.
- **Review rounds:** 5 in all, every one in a `reviewed` slice. Solo slices have no reviewer seat.
- **Verify fails:** no worker's own verify failed. Three regressions got past slice-level verify:
  - phase 1 broke 11 terminal rows of `crash-matrix-adopt-resume.test.mjs`;
  - phase 2 left `core_rules.rs` red;
  - phase 1 left `client-route.test.mjs` asserting the old typing behaviour.

  All three were found by the full suite or by the conductor, never by the slice.
- **Wall time:** 10:56 to 15:27, which includes about an hour lost to a session crash. Writing slices took 32 to 67 minutes each.
- **Seat launch failures:** 1 `foreground-not-agent` cancel in 8 herdr launches (row 2). That is the bug this plan fixes, live on the active release.

### Cost by tier

fgOS recorded **no token or cost data** for any dispatch: the usage fields are `null` or `"unsupported"` for gemini/omp, deepseek, xai and claude. The tier picture comes from bindings only:

- Every seat ran at `advanced`, the SEAT config default here: producers on gemini `gemini-3.8-flash-high`, reviewers on deepseek `v4-pro`, red-team on xai `grok-4.5`.
- The failed read-only seats were claude `sonnet`, also at `advanced`.
- `--override` was not used, and nothing raised a tier.

In-session Claude subagents (Claude Code's own counts, not fgOS):

| Work | Agents | Model | Subagent tokens |
|---|---|---|---|
| Plan (scout, draft, 3 red-team, apply, fact-check) | 7 | sonnet ×6, haiku ×1 | ≈ 770k |
| Cook conductor (two runs) | 1 | sonnet | ≈ 502k |
| Developer (phases 3–4, review fixes, test fix) | 1 | sonnet | ≈ 476k |
| Independent review | 1 | sonnet | ≈ 124k |

### Questions to a human

- **Owner:** 0.
- **Lead, asked by the conductor:** 2, both real triggers:
  1. `milestone-not-recorded` after a solo `implement-item`;
  2. a test file the runner refused to commit because it was dirty before launch.

## Why the case did not converge (evidence)

1. **Solo writing slices never record `child-verified`.** The guide declares `implement-item` `reviewed`, but `fgos run` without `--pattern` ran `solo`. That produced no verify receipt, so the milestone stayed unreached (`docs/specs/workflow.md:474`). The skill's route-table reference tells the conductor to leave the pattern out.
2. **Claude read-only seats cannot write their outbox.** 3 of 3 failed. `dispatch decide` said openai, `bind()` fell to claude: they disagree. This went to `SEAT` (board 12:10).
3. **Slice scope misses callers' tests.** Two of three stalls came from a test file outside the declared writes. The runner then never lands a path that was dirty before launch, so the file stayed stuck (board 15:35).
4. **Reviewers cannot run the terminal rows they are asked to check.** There is no bwrap inside their sandbox, so those rows skip there.
5. **A controller crash during a reviewed slice is not recoverable.** Both orphan attempts adopted as `adopt-incomplete`, and the producer's commit went uncounted.
6. **The case worktree's `.fgos/config.json` is skip-worktree and stripped to `herdr`.** In that worktree, `npm test` shows 6 red runner-config files that are green in a clean checkout. The same flag also blocks merging main into the case worktree.

## Decision: the mechanical `--plan` path

**Nothing is left to retire.** `src/workflow/plan-source.mjs`, its tests and `fgos workflow start --plan` were removed in `cb9bf5f58`. `rg plan-source` hits only `docs/specs/workflow.md` (the history table). `fgos-run` Mode B now runs one phase or a bounded wave as the plan stands, and says so. Keep Mode B as it is.

**Reverse when** `fgos-cook` closes a medium plan inside its frame. Mode B could then fold into it as cook's own single-phase case.

## Decision: old `/fgOS:deliver`

**Keep `/fgOS:deliver` as the Work-item door. Do not merge it into `fgos-cook` now.**

- Its input is different: a free-text request becomes a Work item and walks submit → explore → plan/validate → implement → return. `fgos-cook`'s input is an existing plan.
- The name collision the roadmap worried about is already gone: `/fgOS:cook` was renamed to `/fgOS:deliver` in `ad6c3d6b2`.
- `fgos-cook` has not yet closed a medium plan, so it cannot take over deliver's end-to-end job.

**Reverse when** `fgos-cook` closes a medium plan inside its frame with `child-verified` recorded for every writing slice. Then reopen whether deliver should become "plan with `ak:plan`, then cook".

## Proposed additions (each waits for the owner's choice; RUL104)

1. **The conductor passes the guide's pattern for every writing activity**, so `implement-item` runs `reviewed`, and the skill's route-table reference says so.
   - Problem: finding 1 (rows 7 and 11).
   - Benefit: the milestone records progress.
2. **Writes are expanded to the tests that exercise the changed code before dispatch**, as a step in `reading-ak-plans.md`.
   - Problem: finding 3.
   - Benefit: no stuck dirty files, and fewer fix slices.
3. **`dispatch decide` uses the same pool-usability check as `bind()`.**
   - Problem: finding 2.
   - Benefit: the conductor's capability choice predicts the real seat. This belongs to SEAT.
4. **fgOS records usage for omp, pi and agy runs.**
   - Problem: cost by tier is unmeasurable today.
   - Benefit: P6's cost question gets an answer.

## Land and live proof

- **Quiet window.** It was requested on the board at 18:40 and got no answer. The owner said at 00:16 to coordinate and decide alone, so I scheduled the window for 00:50 (board 00:25). No `COOK hold` was posted.
  - At 00:50 no process was running the active release or `fgctl`, and no fd was open under the workspace `.fgos` or the release store. The only exception was the test queue lock.
  - Other lanes' worktree tests kept running; they use their own staged host.
  - Only one fgOS workspace exists on `fg-server`.
- **Release.** `sha256:fe017e043fe4bb09c326c9eddc8335507e6a21e3063711f851c06bac8326cec2`, built from main `45578a9cf` in the clean detached worktree `forgent-worktrees/land-261023`.
  - The Cargo target was `/home/vantt/projects/.cargo-out-land-261023`; the build waited for IDENT's `cargo test` to finish first.
  - `manifest.json` has `git-wal-v1`.
  - `fgctl` was reinstalled from the same tree.
- **Steps**, all following `landing-261022-1018`:
  1. Old-release `doctor --fix`: `lock-holders` 1 held (a live fgOS process), `git-operation-journal` pendingCount 0.
  2. Backups went to `.fgos/runtime/landing-261023/`, with rollback digest `ce430e51…`.
  3. Canonical JSON over `.fgos`: 3,735 files, 14,152 documents, 0 mismatches, so `canonical-corpus: all equal`.
  4. `fgctl stage` and `upgrade` ran from a script with cwd `/tmp` at 00:56. `distribution.json` was restored, and the hashes of `.fgos/config.json`, `AGENTS.md`, `CLAUDE.md`, `.claude/settings.json` and `~/.fgos/config.json` were unchanged. `fgctl verify` returned 0.
  5. `doctor --fix` exited 0. `fgos setup` added no keys, the seat-binding conversion was `unchanged`, and the refspecs stayed the same.
- **Doctor through the shim:** 142 checks, 11 not passed.
  - Every `terminal-*`, `lock-*`, `process-containment`, `run-supervisor-route` and `state-root` row passes, and `git-operation-journal` shows pendingCount 0.
  - New since the last land is `git-mutation-one-door`, with 5 `unresolved-binary` sites from CFG `03c99bc61`. They are present on main without this change, and `SEAT` accepted the same on the owner machine.
  - `run-attempts-stuck` lists the two orphan attempts of the crashed cook unit `unit-run-1792645758161-5ae5d454`. `doctor --fix` and `dispatch recover` cannot close them: recover takes standalone runs only. I left them untouched rather than write `closed.json` by hand.
  - The rest predate this land.
- **Smoke.**
  - Gateway `start` and `status` (running, reachable), then `stop`.
  - `fgos lock fence gateway --yes` showed `free`.
- **Live proof.** Eight read-only `fgos run` passes went to gemini/omp through herdr panes in the owner's oh-my-zsh shell.
  - I read pane `w4:p44` every 0.5 s during a launch. It shows `printf '%s%s\n' fgos-ok- 56920cd6…`, then the joined token `fgos-ok-56920cd6…`, and only then `cd '<runDir>' && '<launcher.sh>'`.
  - The pane shell started by herdr has `DISABLE_AUTO_UPDATE=true` in its environment.
  - 7 of 8 runs passed.
  - The failure, `unit-run-1792691991881-bb9ea1d6`, is a different fault: omp drew its ready screen, and about 7 s later the shell held the tty again, so `foreground-not-agent` refused the brief and cancelled the run. Nothing ran in the shell. It is new backlog item `p-4bkfiw7d3j`; COOK row 2 shows the same symptom on the old release.
- **Not proven live:** the agy start banner. No agy seat was chosen on this machine, and the banner text comes from the backlog wording.
- **Rollback:** stop everything, run `fgctl upgrade --from ~/.local/state/fgos/releases/sha256:ce430e51ec2f52f4f0131850e1417ab1d6f1886cc3a5b91fd3837c05886ad1f9` from cwd `/tmp`, restore `distribution.json` from `.fgos/runtime/landing-261023/`, and `cp .fgos/runtime/landing-261023/fgctl.prev ~/.local/bin/fgctl`.

## Unresolved questions

- `p-4bkfiw7d3j`: why the agent loses the tty foreground about 7 s after a clean launch, in 1 of 8 runs. It goes to the terminal-control part of the HARDEN T2 council.

- The agy start-banner marker (`meet gemini`) comes from the backlog wording, not from a captured screen. If the real wording differs, agy behaves as before, and a data change fixes it.
