# Guide: take the Work → Event Store cutover on the other machines

Written 2026-10-24 14:30 (Asia/Saigon) by the WORK lane for every machine other than `fg-server2` (machine A); updated 21:05 after machine A's cutover (second attempt, board log 21:00).

**Machine A finished on 2026-10-24 20:58.** The values for this guide:

- `MAIN` = `51bee6b536ec82096f1df724eb4212d5c105f0af`, the grant commit `chore(events): move event truth to refs/fgos (D-ADR0055)`. Its parent is the merge `42c5a0a55` (`merge: work/es-cutover …`), whose second parent is the code tip `af78ed91d`. Main is newer than `MAIN` (board lines, and `301cb430a` records the `eventStore.*` config defaults in forgent's tracked `.fgos/config.json`).
- `REV` = `af617cb5602a82d8c1ff844a7fc0d79b1836866cead655a7380b8d46cc4b6747`, with `counts.work` 1195 and `counts.decisions` 5545 (forgent's Work consumer, before and after the cutover).
- Release on machine A: `sha256:882b8df676cda24e7d0a2837a7c97aea485faffe8500c5737e10cb4e21863fb6` (858 files), built from `af78ed91d`. A machine that builds its own release from `origin/main` gets the same payload; its digest is for reference only (board D7).
- `refs/fgos/legacy` on origin = `7e456df674eee1f41cecaf288089269bff9527ae` (= the fence's `legacyRefOid`).

**Until a machine runs this guide, do not `git pull` main there and do not push tracked event files** (`.fgos/events.jsonl`, `.fgos/events/*`): the old release cannot read the fence, and shards pushed now are not part of the imported history. Work written on a machine after `MAIN` stays in its working tree; step 1 finds it, and a person recovers it with WORK.

## What changes

- Work's event history leaves the tracked files `.fgos/events.jsonl`, `.fgos/events/*.jsonl` (and `.fgos/state.json`, the two backups, `docs/distillery/state/porting/events.jsonl` and `state.json` in forgent). Main now holds a regular file `.fgos/events` (the fence) and the history lives in `refs/fgos/legacy` and `refs/fgos/events/*`, fetched by `fgos events sync`.
- An old release cannot read a fenced checkout (`ENOTDIR` on `.fgos/events`). So on every workspace: **fetch, build, pull, activate, in that order, and run no plain `fgos` between the pull and the activation.**
- New verbs `fgos events sync|status|export|migrate`; `fgos rebuild` prints a per-consumer summary with the view `revision`. Full list: `CHANGELOG.md` `[Unreleased]`.

## Steps for one workspace that is already migrated on main (forgent / forgentX on every machine)

Run from a shell whose cwd is outside the workspace unless a step says `cd`.

1. **Stop check.** Stop Work writes on this machine (board line). The old release still counts every process with cwd in the workspace (shells and Claude Code sessions too; the narrower rule ships with the new release), so `fgos internal quiesce-scan --protocol 1 --root <workspace>` → `clean` needs those sessions to `cd` out or exit; never kill them. `git -C <workspace> status --porcelain --untracked-files=all -- .fgos/events .fgos/events.jsonl` must be empty, and `git -C <workspace> log --oneline MAIN..HEAD -- .fgos/events .fgos/events.jsonl` too after the fetch of step 2. Anything there is Work this machine wrote after machine A imported main: stop and tell WORK; nothing is lost while the files stay where they are.
2. **Fetch only.** `git -C <workspace> fetch origin`; `git -C <workspace> log --oneline -3 origin/main` shows `MAIN` (or newer).
3. **Build the release from `origin/main` in a clean worktree** (as in the landing reports; Cargo target on ext4, never `/tmp`):
   ```bash
   fgos worktree create <scratch-worktree> --detach --base origin/main
   cd <scratch-worktree>
   export CARGO_TARGET_DIR=<ext4 dir of its own>
   cargo build --locked --release --workspace
   node scripts/build-rust-distribution.mjs --out <staged dir>
   cd /tmp
   ```
4. **Backups** into `<workspace>/.fgos/runtime/tmp/landing-es-cutover-261024/`: `.fgos/distribution.json`, `.fgos/installation/activation.json`, `.fgos/config.json`, `~/.fgos/config.json` (mode 600), `git config --get-all remote.origin.fetch`, `sha256sum` of `.fgos/config.json AGENTS.md CLAUDE.md .claude/settings.json ~/.fgos/config.json`, `git rev-parse HEAD`, `~/.local/bin/fgctl`. If the workspace has local edits of tracked files, also `git diff -- <file> > <backup>/<file>.patch` for each.
5. **Pull with local-edit care.** `git -C <workspace> status --short | grep -v '^??'`.
   - No local edits: `git -C <workspace> merge --ff-only origin/main`.
   - Local edits in files main does not change (check `git diff --name-only HEAD origin/main -- <file>` is empty): `merge --ff-only` keeps them.
   - Local edits in a file main changes: save the patch (step 4), `git checkout -- <file>`, `merge --ff-only`, `git apply --3way <patch>`, `git restore --staged <file>`. Never `git stash` in a main checkout.
   Check: `git -C <workspace> rev-parse HEAD` = `origin/main`; `git -C <workspace> ls-files .fgos | grep -E '^\.fgos/(events/|events\.jsonl|state\.json)'` prints nothing; `git -C <workspace> ls-files .fgos/events` prints the fence.
6. **Activate at once** (board D7 guide: restore `distribution.json` after the upgrade):
   ```bash
   cd /tmp
   cargo install --locked --path <scratch-worktree>/apps/fgctl --root ~/.local --force   # same CARGO_TARGET_DIR as step 3
   fgctl stage --from <staged dir>
   cd <workspace> && fgctl upgrade --from <staged dir> </dev/null; echo upgrade-exit $?
   cp <backup>/distribution.json .fgos/distribution.json
   sha256sum -c <backup>/hashes.txt; fgctl verify; echo verify-exit $?
   cd /tmp
   ```
   Expect both exits 0. A changed `AGENTS.md` is acceptable only when the uncommitted AgentKit block is still there exactly once (`grep -c AGENTKIT-OMP:START AGENTS.md` = 1) and the committed part equals HEAD.
7. **Setup and history.** In `<workspace>`:
   - `fgos setup --json </dev/null`: exit 0; it adds the fetch refspecs `+refs/fgos/events/*:refs/fgos/remotes/origin/events/*` and `+refs/fgos/legacy*:refs/fgos/remotes/origin/legacy*`; for forgent the `eventStore` defaults already come with main (`301cb430a`), so `configAddedKeys` is empty; it may add them to the global `~/.fgos/config.json`. Nothing else.
   - `fgos events sync --json </dev/null`: fetches `refs/fgos/legacy` (and the per-machine `refs/fgos/events/*` refs of machines that already wrote after their cutover; right after machine A there may be none).
   - `fgos rebuild --json </dev/null`: the Work consumer's `revision` must equal `REV` and its `counts.work` the same count as on machine A. A different revision: stop, do not resume writers, send the JSON to WORK.
8. **Doctor green.** `fgos doctor --json </dev/null`: every `event-store-*` row passes (no `event-store-migration-required`, `event-store-legacy-layout` passes), `active-release-matches-checkout` passes, the `git-*` rows as at the previous landing. `fgos events status --json`: `refspecMissing` false, `integrityErrors` and `missing` empty.
9. **Resume** writers on this workspace and write one board line: machine, workspace, release digest, `revision` = `REV`, doctor result.

## Workspaces that still carry their own tracked event files (mdview, mcp-skill-hub on the owner machine)

These are separate repositories; their own main has no fence yet. Each one needs its own `fgos events migrate`, which writes a grant commit in that repository. **Only after the owner says "go" for that repository.**

1. Steps 1-4 and 6 above for the workspace (pull its own main normally first: it has no fence yet, so the old release can still read it; activate the same release built in step 3 of forgentX).
2. Baseline with the **old** release before activating (step order): `fgos rebuild --json`, then write `.fgos/runtime/tmp/es-cutover/baseline.json` = `.fgos/cache/state.json` without `snapshot` (the node one-liner of the runbook step 3).
3. After activation: `fgos events migrate --check --baseline .fgos/runtime/tmp/es-cutover/baseline.json --json` → `parity.equal: true`, 0 differences. Any difference: stop, nothing is committed.
4. `fgos events migrate --baseline .fgos/runtime/tmp/es-cutover/baseline.json --json` → `commit.status: committed`; `git push origin main`; `fgos events sync`; then steps 7-9.

## Máy owner (`design-lap`): forgentX, mdview, mcp-skill-hub

- **forgentX:** làm theo các bước 1-9 ở trên (máy A đã xong 10-24 20:58, giá trị ở đầu file). Cần owner nói "go" trước khi activate (như mọi landing trên máy owner). So `revision` sau `fgos rebuild` với `REV` của máy A; khác thì dừng, không cho writer chạy lại.
- **mdview** và **mcp-skill-hub:** chỉ `fgos events migrate` sau khi owner nói "go" cho từng repo, theo phần "Workspaces that still carry their own tracked event files". Làm lần lượt từng repo; mỗi repo một grant commit riêng trên main của nó, push xong mới làm repo tiếp theo. Chưa có "go" thì vẫn activate release mới được (Work trên repo đó bị từ chối ghi với `event-store-migration-required` cho tới khi migrate), hoặc giữ release cũ trên workspace đó — owner chọn.
- Ghi lên board một dòng cho mỗi workspace: release digest, `revision`, kết quả doctor.

## Machine `fg-server` (one workspace `~/projects/forgent`)

Steps 1-9 for forgent; nothing else. It needs only its own machine's permissions.

## Follow-up upgrade for machines already cut over (fg-server, design-lap)

Added 2026-10-24 23:59. fg-server and design-lap (forgentX) cut over at 21:43–21:58 on releases built from `95a1b1f9b`. Upgrade each workspace once more, to a release built from `origin/main` **at or after `55018b032`**. That one upgrade brings two fixes together:

- WORK `8650cac60`: `event-store-legacy-layout` passes on clones that never had the import's data tree object. On these machines the row was red even though the data was correct.
- HARDEN T3-04a (`48a45a5f5`, Observe stores and the agent protocol).

Steps: 3, 4 and 6 above (build from `origin/main` in a clean worktree, back up, `fgctl stage` + `fgctl upgrade`, restore `distribution.json`, `fgctl verify`), then `fgos setup` and `fgos doctor --fix`. No pull, migrate or Work stop beyond the few minutes of the upgrade. Then run every check below with `</dev/null`:

1. `fgos doctor --json`: every `event-store-*` row passes, **including `event-store-legacy-layout`**.
2. HARDEN T3-04a checks (source: `plans/reports/landing-261024-2249-harden-t3a-agent-protocol-observe-this-machine.md`):
   - `observe-dir-writable`, `observe-host-resolvable`, `observe-run-coverage` and `observe-friction-migrated` all pass.
   - `observe-host-resolvable` reads the friction store. If it fails, a shard cannot be read: stop and report it, and do not delete files.
   - `observe-run-coverage` reports "directories Node N, host N" with the same N on both sides.
   - `fgos metrics coverage > /dev/null` finishes in under 0.5 s.
   - `fgos friction list` exits 0 and prints the records.
   - Nothing needs migrating: `friction record` and `resolve` no longer migrate legacy friction. That fence stays until H33.
3. Rollback: reactivate the previous release. Neither fix writes an on-disk format the older release cannot read.
4. Write one board line per workspace with the machine, the workspace, the release digest and the doctor result.

Do not touch the stray shards under `.fgos/runtime/tmp/landing-es-cutover-261024/untracked-events/`. They wait for `fgos events import-legacy` (WORK, 2026-10-25).

## Rollback

- Before step 5 on a workspace: nothing changed; resume writers on the old release.
- After step 5 but before step 6 finished: activate the old release again only after main is unfenced (machine A's rollback B2). Until then keep writers stopped and tell WORK.
- After activation: spec §18 (`fgos events export --format legacy-layout`, a person decides). Machine A's runbook section B is the procedure.
