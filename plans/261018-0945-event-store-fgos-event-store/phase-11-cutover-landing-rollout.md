# Phase 11: cutover landing and rollout

- **Depends on:** phase 10 go note; runbook step 0; Git 01 landed with its fence reported on every workspace of every machine of Q2 (Git 01 step 14); owner picks the hour.
- **Lead:** big lead `forgentx-95` (opus), one machine at a time; agents on other machines follow the same runbook and report on the board.
- **Effort:** 10h including waits.
- **Unblocks:** Git 07 (its release rebases on this commit; target 2026-11-13 with this cutover by 2026-11-10, Git D10).

## Context

- Spec §18 steps 1-7 and rollback, §14 joining and leaving, §21 setup fixes, holder-lock §12 stop-everything pattern (quiesce scan), board rule: stop-everything landings run one at a time.
- Board D7: per-machine release pins on `.fgos/distribution.json`; follow the board's sync guide for activation on the second machine.

## Runbook

0. **Preconditions (big lead, days before).** The owner's machine and repository list (Q2) is recorded; Git 01's `fgctl` and fence are on every listed machine (M2); a release containing Git 05 is built and activated on every workspace and `fgos internal git-grant-check --protocol 1` answers (Git merges 05 dormant, so this step is ours); Q5 answered or its default (b) with M9 merged.
1. **Rebase and re-gate (within 24 h before the hour).** Rebase phase 09's commit onto main's HEAD; rerun phase 10's gating items on the rebased commit; then freeze main except for the cutover.
2. **Stop.** On every listed machine: stop every fgOS writer; `fgos internal quiesce-scan` clean on each workspace root; each machine commits and pushes its tracked event changes to main with the current release (they still merge by `merge=union`). Pull main on machine A; if main moved, return to step 1.
3. **Baseline (machine A, forgent).** With the current release: `fgos rebuild`, then copy view and `revision` of `.fgos/cache/state.json` to `.fgos/runtime/tmp/es-cutover/baseline.json` (§18 step 2; the snapshot anchor is excluded).
4. **Migrate forgent.** Cwd in the main checkout:
   - Q5 (a): land the reviewed code commit by the normal door, then `npm --prefix .claude/worktrees/es-p09 run fgos:dev -- events migrate --baseline .fgos/runtime/tmp/es-cutover/baseline.json`.
   - Q5 (b): `npm --prefix .claude/worktrees/es-p09 run fgos:dev -- events migrate --baseline .fgos/runtime/tmp/es-cutover/baseline.json`, whose commit step runs through `node .claude/worktrees/es-p09/scripts/event-store/cutover-source-commit.mjs <rebased commit>`.
   `migrate` runs the setup-fix bodies, imports `refs/fgos/legacy`, checks parity (any difference stops here, nothing committed) and makes the grant commit with the fence file.
5. **Publish.** `git push` main first; only then build, stage and activate the release from the new HEAD on this workspace, `fgos setup`, and `fgos events sync` (pushes own ref and `refs/fgos/legacy` at the fenced OID). If the main push is rejected: revert locally, reactivate the old release, nothing was published; return to step 1.
6. **Other workspaces on machine A** (mdview, mcp-skill-hub, each in turn): activate the same release; `fgos events migrate`; `git push`; `fgos events sync`; doctor green.
7. **Other machines.** Pull main in each workspace; activate the release (board guide for D7); `fgos setup`; `fgos events sync` (fetch); `fgos rebuild`; compare the Work view with machine A's baseline (`view` and `revision` equal); doctor green.
8. **Resume.** Writers resume. Board ES row: landed, release id, commit, fence counts; Git 07 unblocked; the observe `.jsonl` inventory item recorded (D16).
9. **After landing:** item 10 (Q4) if not done; first opportunistic sync observed on each machine within `eventStore.sync.intervalSec`; `git-operation-journal` shows no unresolved PublicationCas.

## Machine retirement rule

Before a machine is retired or reinstalled: `fgos events sync` until `fgos events status` shows nothing unsealed and nothing unpublished. A reinstalled machine may set `git config fgos.machineId <old-id>`; either way is safe (§14).

## Validation

```bash
fgos internal quiesce-scan --protocol 1 --root <workspace>      # clean on every workspace in step 2
fgos internal git-grant-check --protocol 1 --operation probe    # step 0: a typed refusal proves the route exists on the activated host
fgos events status --json                                        # after step 5/6/7: nothing unpublished, refspec present
fgos doctor --json                                               # event-store-* and git-* green on every workspace
git ls-files .fgos | grep -E '^\.fgos/(events(/|\.jsonl)|state\.json)'   # expect no output
```

## Risk

| Risk | L × I | Mitigation / signal and response |
|---|---|---|
| A machine was missed | Low × High | Q2 is a hard precondition; the tracked fence file makes its old release fail with `ENOTDIR` once it pulls; the hook refuses added event paths; unpushed old shards are recovered by a person. |
| Parity fails during step 4 | Low × High | Rehearsed on copies in phase 10; on failure stop, nothing is committed, writers resume on the old release. |
| Push of `refs/fgos/*` refused | Low × Medium | Q3 probe; events stay local and `status` shows it; owner decides. |
| Second machine builds a different release digest | Medium × Low | Board D7 guide; the release content is the same commit. |

## Rollback

- Before step 5's main push: revert the cutover commit (both commits under Q5 a) locally, reactivate the previous release; `refs/fgos/legacy` was not pushed and stays unread.
- After the push: spec §18 rollback. `fgos events export --format legacy-layout --out <dir>` writes the legacy files and a parity report; a person decides; writers stop; the files are committed; the previous release is activated through the new `fgctl` (Git C5 refuses while Git WAL records are pending).
