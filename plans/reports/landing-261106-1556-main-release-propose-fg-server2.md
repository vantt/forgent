# Landing: main `63757415e` release on this machine (fg-server2)

Landed 2026-11-06 15:50-15:53 (Asia/Saigon) at the owner's word ("máy này em tự làm đi"), in `/home/vantt/projects/forgent`, the only fgOS workspace on this machine. Steps follow `landing-261023-0847-main-release-fg-server2.md`.

## Outcome

Release `sha256:9b6bb72314c6ff307e0d432e5cae87fba725f96f65db727ad039b1342628fd54` is active since 15:52, built from `origin/main` `63757415e` (891 staged files, 46 MB). The previous release `sha256:eca6312f8642c4a1ff8838923ea39251c3c468bec4432ac87d458381c8acd995` stays in the store. Rollback: `fgctl upgrade --from <staged previous>` (backups in `.fgos/runtime/landing-261106/`).

It carries `fgos workflow propose` and the `fgos-cook` skill that calls it. Before this release plain `fgos workflow propose` fell into the old `workflow feature` step `propose` and printed unrelated JSON without an error.

## Checks

- Preconditions: no `run-tests`, `fgos`, `fgctl` or gateway process running; load 1.1 (was 25 an hour earlier, before the orphan test process was stopped and TEST removed a 76 GB cargo target).
- Canonical JSON check over the project `.fgos`: 29,352 documents, 0 mismatches.
- `fgos doctor --fix` before and after: exit 0. Before: 147 checks, 8 not passed. After: 146 checks, 7 not passed (`executor-profile-warnings` no longer fails). The seven left were all failing before: `executor-skills-installed`, `tool-registry-configured`, `work-step-vocabulary`, `doc-current-path-missing`, `doc-source-conservation`, `agent-cli-project-trusted`, and `active-release-matches-checkout` (changed=14: the main checkout is newer than the build tip, expected).
- `fgctl verify` ok. Protected files (`.fgos/config.json`, `AGENTS.md`, `CLAUDE.md`, `.claude/settings.json`, global config) and fetch refspecs unchanged. `distribution.json` restored from backup.
- `fgos dispatch decide --for execute`: out-of-process. `fgos run "Reply with exactly the word OK"`: the seat answered OK.
- Plain `fgos workflow propose --request ... --writes ... --verify ...` prints the five-part question and the commands.

## For the other machines

Nothing runs on them until they activate a release from main at or after `946d7f1cc`. `fgctl stage` needs `CARGO_TARGET_DIR` exported for the distribution script, otherwise it cannot find `libfgos_node_addon.so`.
