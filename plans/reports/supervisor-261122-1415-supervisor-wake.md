# Supervisor wake, 2026-11-22 14:15 (+07)

## Queue

- `87f7f0de66b7452c` (`session-idle`, ref `106fdda5-666f-4ff8-af79-73b3a15762ad`, 07:12Z): `fgos session read` on the
  ref answers `session-not-found` with no candidates, so the session is gone and nothing remains to act on. Marked handled.

## Running plans

- **261122-0118-heads-stable-and-able** (`leadLive: true`): the lead is busy polling ticket `c-22469-1795331612629`
  (phase 5). Phase 6 landed as `32e39e0ea`. Phase 8 is parked on `q-2ul3tjw3kd`, and phase 2 steps 8-10 wait on
  `q-lnq3nbjssw`. Phase 9's `watcher tune session-idle --disarm` is applied in the working tree but not committed;
  its commit is still open. Left alone.
- **261118-1341-s6a-execution-tier-rust** (`leadLive: true`, role `lead:S6A`, `claude-pbzb@fg-server2`): phases 0-19c
  are done and 20-22 are draft. Phase 21 deletion part 1 landed as `c55e86c43`. The lead's subagent has been running part
  2b for 1h12m and is polling `gate-2a2.txt`. That is a real, verified wait, so the lead was left alone. An earlier wake's
  "Check the wait you named" prompt is still in its input box.

## Admission

No plan is admissible: 2 of 4 leads are live and 3 lanes are free, but no row reads `admissible: true`.

## For the secretary

- `q-4qtu54bnxz` and `q-vgwalbohwj` still show as open, but they belong to 261122-0800-red-tests-and-backlog-sweep. That
  plan closed at 12:34 (`6a91c7cb8`), and its lead is gone. They look stale and could be cancelled. The supervisor
  never acks or cancels questions.
- 35 plan directories are unreadable to `fgos supervisor plans`, through missing frontmatter, an empty priority or a
  missing phase table (unchanged).
