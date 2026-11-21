# Grant audit runbook

Run in the fixture project `/home/vantt/projects/doors-audit-fixture`, never the real project, with two throwaway heads on the
activated release: `head:secretary-doors-audit-sec` and `head:supervisor-doors-audit-sup`. Each head runs its own commands from
its sandbox through its request socket and answers with the command, the exit code and the first line of output. A power with
no passing proof is removed from `GRANTS` in `src/session-host/head-grants.mjs`.

Grant source: `GRANTS` in `src/session-host/head-grants.mjs`.

## Secretary head (expect exit 0 unless marked refused)
1. `fgos supervisor queue --json`, `fgos supervisor plans --json` (lists `261121-0900-audit-noop`), `fgos slots --json`.
2. `fgos supervisor raise --kind coordination-chore --ref audit-noop --reason "grant audit" --json`.
3. `fgos supervisor wake --json` (fixture only; the supervisor throwaway is the one woken, so run it last, after step 6 below).
4. `fgos run "print the word audit" --json` (read-only, one unit); refused: `--writes x` without a linked worktree
   (`writes-need-linked-worktree`), a run over `secretary.run.maxMinutes`.
5. `fgos metrics record` with one `fgos.coordination.act` record: accepted; with another kind: refused.
6. `fgos session stop` of the supervisor throwaway is run by the lead through the secretary last.
7. Refused as not granted: `fgos supervisor handled`, `fgos session read`, `fgos session type`, `fgos watcher tune`, `fgos metrics prune`.
8. `fgos land --paths docs/backlog.md --message "audit: backlog write"` lands only a portfolio file; any other path is refused.

## Supervisor head
1. `fgos supervisor raise` as above; `fgos session read head:secretary-doors-audit-sec --lines 20`.
2. `fgos session type head:secretary-doors-audit-sec --text "audit ping"`: refused `target-not-stuck` first; after the
   secretary raised an event naming it (`--ref head:secretary-doors-audit-sec`), accepted.
3. `fgos watcher tune --arm <definition>` and `--disarm`, then one `--set` inside its schema bounds (accepted) and one
   outside (refused).
4. `fgos run "print the word audit" --json`.
5. `fgos metrics record` (accepted for `fgos.coordination.*`), `fgos metrics prune` (dry run), then `--apply` on fixture records.
6. `fgos session stop` of a non-head (a lead or worker name): refused `stop-target-not-head`.
7. Mailbox and peers verbs as listed in `GRANTS.supervisor`.

## Record
For each line the lead writes command, exit code and output into `grant-audit.md`, including refusals with their codes.
The unproven items to settle: `--override` acceptance of a `tier` key, `watcher tune` from a confined caller, screen read
and type through a real terminal, wake from inside a sandbox, reply size of a control-heavy screen.
