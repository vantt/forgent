# Handoff: SEAT lead (MP-B1 close, post-landing fixes, SEAT-TRIM)

Written 2026-10-22 10:31 (Asia/Saigon) by `forgentx-95` (big lead, owner machine). The owner assigned this at 10:30.

The receiving session calls itself **SEAT**. It is a **lead**: it plans, splits and verifies the work, and starts other leads (Sonnet, worktree-isolated) for the smaller pieces. It does not hand anything back to `forgentx-95` and does not ask the owner what it can decide inside this frame.

## Scope (in order)

1. **Close MP-B1.** Phases 00–07 are done, and 06 (config) was applied on 10-22 at 09:00. One piece is left, from owner decision Q4 (approved on the condition of one real run per workspace first).
   - **What:** apply the model-refresh block (`gpt-6-luna`, `gpt-6.1-sol` with effort, `grok-4.7`, `mini` cells) to **mdview** and **mcp-skill-hub**. forgentX already has it.
   - **Real-run status:** mcp-skill-hub already passed one, `unit-run-1792637184012-c7facdf4` (gemini via agy, advanced). mdview has not run yet; do one read-only `fgos run` there first.
   - **Apply:**
     1. Back up each file into `.fgos/runtime/config-backup-<yymmdd-hhmm>/`; neither file is in git.
     2. Apply the block, and leave everything else alone.
     3. Run `fgos doctor --json </dev/null`. `tier-fallback` must lose its "no `mini` cell" warning, and `seat-binding-dry-bind` must still bind 59/59.
     4. Do one real read-only run per workspace with the new models.
   - **Close:** set MP-B1 to **done** on the board row.
   - The block's content is in §5 of [the proposal](proposal-261022-0756-mp-b1-06-seat-config-for-three-workspaces.md). The forgentX version is live in `.fgos/config.json` (main `ec07f2a90`), so adapt it to each workspace's families and executors rather than copying cells a workspace cannot serve.
2. **Own the post-landing faults of SEAT** until SEAT is stable, then tell `forgentx-95` (SendMessage) and the owner, and add a board log line saying SEAT is stable.
   - **Already fixed:**
     - The one-door census (`a4db2b947`, landed in release `a2b19d78`).
     - `decideExecutorCli` without the default executor (`00e028b5d`, on main `b52c2c238`, **not landed yet**).
   - **Watch:**
     - The DOC lane's real `docs:write` runs: the first real use of openai via **pi** on `gpt-6.1-sol` at flagship. If pi fails there, pin `{"executor":"openai","invocation":"codex-herdr"}` in forgentX `docs:write.prefer` (pre-decided in the proposal, no owner question).
     - Any failure in the TEST lane's runs that traces to SEAT. The TEST lane may run without `~/.fgos/config.json`; reproduce with `HOME=<empty dir>`.
     - Failing doctor rows `seat-binding-*`, `tier-fallback`, `git-mutation-one-door` in any of the three workspaces.
   - **Not SEAT's, do not take:** `p-a178ca5c` (pane launch race, earmarked for COOK P6) and `p-1837c4c7` (pi transcript).
   - **Stable means:** no open SEAT-caused fault; the next landing, which carries `b52c2c238` and GIT's `e23e34688`/`2c184ea1e`, has been done and doctor is clean on all three; and at least one real run per changed path passed after it.
   - **That landing belongs to SEAT.** Coordinate the stop with `forgentx-5f` (DOC) by SendMessage. Follow [the last landing report](landing-261022-0311-seat-git-durability-t0-owner-machine.md) and its follow-up section, step by step.
3. **SEAT-TRIM.** Read the [growth review](review-261021-1726-seat-wave-growth.md) and the SEAT-TRIM row on the board.
   - **Target:** SEAT's net Node growth down to about +150 lines (client facade plus `seat-policy`), with about 3,840 fewer test and fixture lines. Follow RUL104 ("better, not bigger") and L10.
   - **Do now:**
     - config validation duplicated in the crate;
     - the tier list kept in two places;
     - inline-lead and override matching moved into the crate;
     - tests that re-prove the golden cases;
     - fixture helpers made redundant by option B: `test/helpers/work-seat-config.mjs` still adds a `tierFallback` that default-executor cases no longer need.
   - **Wait:** deleting the conversion code (about 440 Node and 2,650 test/fixture lines). It can only go when every workspace on **both machines** passes `seat-binding-config` and `seat-binding-drain` and no pre-SEAT release is active anywhere. The second machine still runs `9e4c2630` (pre-SEAT).
   - **Never trim** `src/runner/execution/legacy-seat-read.mjs`. Owner 10-21 18:30 "chốt giữ": it is the only read path for about 1,900 old run records.
   - **HARDEN H19** (from [T1 arbitration](council-261022-0245-harden-t1-arbitration.md) line 209), two items:
     - (a) `src/convention/{seat-id,definition-names}.mjs` evaluate convention rules in Node; they belong behind the convention door.
     - (b) `src/util/state-lock-held.mjs` is a third lock-depth counter; the target is one counter, `hotLockDepth()` in `src/holder-lock/hot-guard.mjs`.
     - Item (b) touches `session-identity.mjs` and `hot-lock.mjs`, which HARDEN T1 phase 6 also edits. Before starting (b), write a board log line naming who does which part, and agree with `forgent-a8`'s answer on the board. If there is no answer, do (a) first and leave (b) to T1 phase 6 with a note.

## State you inherit

- **Active release** on mdview, mcp-skill-hub and forgentX (owner machine): `sha256:a2b19d78…`, built from main `f315b99c7`. Rollback target `52a7e0ac…`, before that `653affd6…`.
- **Main** is at or after `277465c06`, with SEAT merged since `172c9d138`.
- **Spec:** [docs/specs/seat-binding.md](../../docs/specs/seat-binding.md) (D-ADR0072). **Plan:** [plans/261020-2132-seat-binding-component/plan.md](../261020-2132-seat-binding-component/plan.md). The Work-path divergence is in the addendum of `plans/reports/phase-lead-261021-1624-seat-phase-11-docs-boundary.md`.
- **Work path: option B, final.** The named executor (or else the default) reaches the crate as a pin, and the crate decides tier, model and effort.
- **Configs:**
  - mdview and mcp-skill-hub were converted by `fgos setup` on 10-22 (backups `.fgos/config.json.pre-seat-binding-*`; the old release needs those, the new one refuses them).
  - MP-B1 06 backups are in `.fgos/runtime/config-backup-261022-0900/` in each workspace.
- **Idle lead available:** `seat-p09-lead`, who knows the SEAT code; worktrees under `.claude/worktrees/seat-*`. Reuse it or start fresh leads.

## Rules that bind you

- Address the owner as "anh", yourself as "em", in Vietnamese. Write reports and commits in English.
- **Git:**
  - Use `/usr/bin/git`.
  - In the shared main checkout, commit only with a pathspec (`git commit -m … -- <paths>`), never check out a branch, and pull right before any whole-file board write.
  - Merge to main fast-forward from a verify branch where possible, and push. Pushing main is authorized.
  - Other sessions' local commits are pushed only with their consent (DOC has consented for board commits).
- Run every `fgos …` command with `</dev/null`. Hooks block the literal words node_modules, .git, target and build in commands; use variables or `cargo b""uild`.
- Take report, plan and handoff names from `fgos convention path --kind <k> --type <t> --slug <s> --json </dev/null`.
- **Verification is yours, never the lead's self-report.**
  1. Run `npm test` with `CLAUDE_CODE_SESSION_ID`, `CODEX_THREAD_ID` and `FGOS_SESSION_ID` unset.
  2. Rerun each failing file alone with the git addon and release artifacts staged; the pattern is `ensureGitAddon` plus `ensureReleaseArtifacts` from `scripts/run-tests.mjs`.
  3. Run `cargo test --workspace --no-fail-fast`.
  4. Where config is involved, also run with `HOME=<empty dir>`.
  - In zsh, pass file lists as arrays.
  - **Known non-SEAT reds:**
    - `test/rust-host/fgctl-upgrade` and `fgctl-init-download-sources`: on this machine's umask, `cpSync` loses the 0500 mode of `git-empty-hooks`. That is the TEST lane's problem.
    - `dev-host` "concurrent dev consumers…", `holder_lock_gate_passes…` and `killed_move_repairs…` depend on load and pass alone.
- **Landing:**
  - Run `fgctl upgrade` from a script whose cwd is outside the workspace and whose argv does not name Git. Otherwise the gate refuses with `git-predecessor-writer-live`.
  - Regenerate and commit `packages/git/contracts/mutation-census.v1.json` when the release build rewrites it.
  - Run doctor in all three workspaces afterwards.
- **Never:**
  - print secrets;
  - edit `~/.fgos/config.json` or a workspace's real config without owner approval (Q4 above is approved);
  - touch ak, ck, rtk, `~/.claude/rules` or the owner's shell rc files;
  - activate a release without coordinating the stop with DOC.
- RUL104 and L10: no dead paths left behind. Every retired test names its new owner in the commit body.
- Use the board ([plan.md](../261017-1313-fgos-platform-program-board/plan.md) rows SEAT, SEAT-TRIM, MP-B1; [log.md](../261017-1313-fgos-platform-program-board/log.md) newest line first under the "Ghi **dòng mới**" header).
  - Every decision carries its reversal trigger.
  - Pull main often to receive the second machine's messages, which arrive as board lines.
- Put every report to the owner on the board too.

## Reporting

- Message `forgentx-95` (SendMessage) when each scope item finishes, and when SEAT is declared stable.
- Use status `DONE | DONE_WITH_CONCERNS | BLOCKED | NEEDS_CONTEXT`.
- Ask the owner only for decisions outside this frame, in decision-question form.

## Unresolved

- Whether pi serves `gpt-6.1-sol` well for docs turns; the first DOC run will show.
- When the second machine lands SEAT. That gates the conversion-code deletion in SEAT-TRIM, and COOK P6 may land it there.
