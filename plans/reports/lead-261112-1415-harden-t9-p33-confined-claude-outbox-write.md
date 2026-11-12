# Lead report: a confined headless claude seat writes its outbox

Date 2026-11-12 (Asia/Saigon). Branch `harden/t9-p33-confined-claude-outbox-write`. Source: `plans/reports/debug-261112-1408-confined-claude-headless-outbox-denied.md`.

## What changed
- `core/config-standard/runner.yaml`: `claude-cli-bwrap` args now end `--permission-mode acceptEdits`. Never `--dangerously-skip-permissions`; bwrap still bounds writes.
- `src/runner/dispatch/cli.mjs`: `withRunDirReadAccess` renamed `withRunDirAccess` (it grants outbox write as well as brief read). A headless (`cli-spawn`) claude with an `outboxDir` gets `--add-dir <outbox>` and nothing else; the pane grant is unchanged. Shared splice helper `withAddDirs` replaces the inline one.
- `src/runner/dispatch/assignment-runner.mjs`: the rename, and the direct attempt's args go through the same door with `attemptPaths(...).outboxDir` (one hunk, approved by the big lead; P32 owns the rest of the file).
- Census regenerated; CHANGELOG line; phase 33 file and plan row.

## Prior art
`git log -S'acceptEdits'`: every claude worker invocation carried `acceptEdits` before the runner standard was authored (cfd670c43 and earlier); 221403acb copied it onto `claude-cli` only. No commit explains the omission on `claude-cli-bwrap`; it was never read-only-by-design (the same seat is told to write its outbox). `withRunDirReadAccess` came from d108f1857 for panes (read of settled reports) and was never extended to headless. So the omission looks accidental; no deliberate decision was reversed.

## Pane decision
`claude-herdr-bwrap` is unchanged. A real pane run (read-only prompt, `--provider claude`, inside herdr) passed with `output.complete: true` and wrote `outbox/report-1.md` using only the existing run-directory grant. The debug report's suspicion of the same gap does not hold; adding `acceptEdits` to the pane would be an unproven permission widening, so it was not done (one run is the evidence; a second pane gap would show up as `no-report`).

## Proofs
- `test/runner/execution/run-herdr.test.mjs` (owns the grant): the shipped standard's `claude-cli` and `claude-cli-bwrap` carry `acceptEdits`, and the grant adds exactly `--add-dir <outbox>`; a non-claude command is untouched; a seat without an outbox gets nothing. Note: the config edit was committed with the test, so the headless half was never observed red; the pane assertion I first wrote was red and then removed after the real run showed the pane needs nothing.
- Real run, headless, confined: `npm run fgos:dev -- run "Reply with exactly the word OK" --provider claude --json` (herdr env unset so bind picks cli): `cli-spawn`, `linux-gate`, envelope args end `--permission-mode acceptEdits --add-dir <...>/worker-output/outbox`, `output.complete: true`, report 27 bytes, sha256 3a76e146...
- Real run, pane: same command inside herdr, `herdr-spawn`, `output.complete: true`, report 49 bytes at `outbox/report-1.md`, sha256 8d3f68a6...
- `cargo test -p fgos-config -p fgos`: green.
- Focused set (run-herdr, assignment-dispatch, confinement-authority, driver-rununit, policy baseline, report-complete, architecture, doc-health, citation drift, config patterns): 223 pass, 1 fail = known document-identity citation drift.
- Census scan: 0 undeclared sites, census regenerated.
- Full `npm test` (log in /dev/shm): 8824 tests, 8791 pass, 2 fail = the two known reds (V7n addendum, document-identity citation drift); no run-tests ERROR lines.
- Backlog row `p-h2bwtllngz` (OPC non-blocking note): a claude cli-spawn invocation with the outbox grant but no `acceptEdits` gets a grant that silently does nothing; a check pairing the two is proposed.

## Authority
- Which directories a claude seat may use: Dispatch, `withRunDirAccess` (`cli.mjs`); the permission mode that lets it write there: the standard config. Both already sat in those layers; not moved.
- Held twice, left alone: the outbox path is fixed by `attemptPaths` (`direct-launch.mjs`, supervisor) and the prompt text in `brief.mjs` states the same path; the grant now reads it from `attemptPaths` rather than a third copy.

## Lessons
- A debug report's "likely the same gap" for a sibling invocation needs one real run before it becomes a config change; here the pane was fine.
- Edit-then-test hid the red step for the headless half; write the test before touching the config even when the fix is one line.
- Real `fgos run` inside herdr binds the pane; unset `HERDR_*` to prove the headless path.
- A name that says "read" hid that the same grant carried write; rename when the contract widens.
