# Claude folder trust and claude logins; codex/agy trust-store writes (branch `harden/t5-p05`)

The phase is done in the scope of owner decision 66, which replaced decision 63.

- The codex/agy half landed on main as `de7454638..8f521eb2f`; its earlier report section is summarised at the end.
- The claude half is on `harden/t5-p05`, based on `61bc1428b`: commits `ef1f42132` (the red row) and `4ef0b4079` (the fix).

## Commits (claude half)

| Commit | What |
|---|---|
| `ef1f42132` | Red row cherry-picked from the red-proofs branch. Its content was rewritten in `4ef0b4079` to match decision 66; see red → green below. |
| `4ef0b4079` | Folder-trust entries in claude's store are add-only and serialised. Claude logins become a renewable layout with a probe call. Includes tests, CHANGELOG, a run-supervisor spec line, the lock-registry row and the regenerated census. |

## What changed

**1. Unconfined claude pane: add-only trust, read back, never removed.**

- `src/run-supervisor/trust-store.mjs` `seedTrust`:
  - It takes the new machine lock `agent-trust-store`, so fgOS's own seeds run one at a time.
  - It reads the store, adds the entry, and reads it back. An entry that was lost is added again, at most 3 writes; after that it fails with `trust-not-kept`.
  - It never removes anything. `removeTrust` is deleted.
  - Writes go through the durable writer `writeStore`, the same one codex and agy use (realpath, so a linked store stays a link; mode kept).
- `herdr-round.mjs`: a claude entry no longer sets `trustWritten`, so no `controller/trust-context.json` is written for claude and `abandon()` cannot remove it. Codex and agy behave as before (`REMOVABLE_TRUST_KINDS`).
- `cleanup-trust.mjs`: the claude branch is gone. A record of kind claude, left by an older release, is answered `not-removed`.
- New lock row: `packages/holder-lock/contracts/lock-registry.v1.json` gets `agent-trust-store` (mutex, machine scope, rank 80, `<lockRoot>/agent-trust-store.lock`). `src/setup/holder-lock-checks.mjs` gets its lock-file scan entry, the same pattern as the recent `worker-session` row.

**2. Confined claude pane: login renewed at the source before the run.**

- `provider-credential-renewal.mjs`: Claude Code (`.claude/.credentials.json`, `claudeAiOauth`) is now one of the renewable `LAYOUTS`. It reads, marks a login due, applies a renewal and stages a copy, following the codex pattern.
- `credentialLayout` names a home-files source by that file. `EXPIRY_LAYOUTS` is deleted, since claude is now in `LAYOUTS`.
- `provider-credential-probe.mjs`: claude call `claude -p <prompt> --no-session-persistence --tools ''` (`Read` when tools are allowed), with HOME set to the login home.
- No new wiring was needed. The existing opt-in in `assignment-runner.mjs` (refresh-ahead for every launch that may copy a credential) now renews claude sources.
- Scope note: the standard `claude-herdr-bwrap` invocation declares no `credentialStore`, so it reads `~/.claude` in place and nothing is copied or renewed. This path applies only to an account or executor that declares a claude store with `files: ['.claude/.credentials.json']`.

**3. A login renewed inside a confined claude home is kept for hand recovery.**

- `credentialWriteBackTarget` now returns a target for claude, so `finalize-home` stages the copy as agent origin.
- The layout's `identity` is always `null`: claude tokens are opaque and name no account the provider signs. `applyAgentCopies` therefore never probes or applies the copy; it stays in `pending/`.
- The existing `credential-copies-retained` doctor row lists it, in the wording that a copy whose tokens name no signed account is never applied. The gate was not changed.

## Red → green evidence

| Case | On base (`61bc1428b` src) | After `4ef0b4079` |
|---|---|---|
| `herdr-private-home-trust`: an unconfined claude pane's trust entry survives concurrent seeds (4 child writers × 10 seeds), and fgOS never removes a trust entry | red: `every seeded entry is in the store afterwards` | green |
| Same case with the read-back and re-add but the lock taken out (experiment, not committed) | red in 3 of 3 runs | — |
| `provider-credential-renewal`: claude in the per-layout refresh-ahead case (fake CLI renews the scratch copy, source gets the new pair, rest of the file kept) | new; claude was `unsupported-layout` | green |
| `provider-credential-renewal`: renewed login never applied while its tokens name no signed account (claude half: staged, not probed, source untouched, doctor lists `agent`) | new | green |
| `provider-credential-probe`: claude call built with HOME, no tools | new | green |

The lock experiment is why the lock exists. Read-back alone cannot keep an entry that another fgOS writer drops after the read-back. Concurrent panes are the case that dropped 297 of 400 entries.

## Tests retired or moved

| Test | Reason | New owner |
|---|---|---|
| `dispatch-trust-store`: "B3: removeTrust deletes only its own entry…" | Behaviour removed | — |
| `dispatch-trust-store`: "B3: a seed followed by a remove returns the store to its exact prior contents" | Behaviour removed | — |
| `dispatch-trust-store`: claude store mode case | Remove half dropped (behaviour removed); the seed half stays | Same test |
| `terminal-groups`: "the folder-trust entry a seat wrote is taken back by the cleanup step…" | Claude take-back removed; rewritten as the wiring proof that a claude entry is written and never taken back, including from an old record (`not-removed`) | Same test, rewritten |
| `terminal-groups`: "a controller that fails before the handover … takes the trust entry out again" | Moved from a claude store to an agy store; take-back still exists for agy | Same test |
| `holder-lock-checks`: lock count | 24 → 25 locks | Same test |

## Checks run

- Focused (`node scripts/run-tests.mjs`, `HERDR_*`/`CLAUDE*` unset, 31 files: trust-store, herdr trust, renewal, probe, per-cli sources, confinement p04/p05, terminal-*, attempt-steps, contracts, crash matrices, holder-lock contract tests, holder-lock-checks, architecture, doc-health, decision-citation drift, …): all pass. The only failures were `release-tree` and `install-packaging`, which fail the same way on base in a focused run: the release addon is not built in my cargo dir.
- Rust: `cargo test -p fgos-holder-lock`, `-p fgos-config --test lock_rows` and `-p fgos-event-store --test registry_rows` all pass (these read the registry). No Rust source changed, so I skipped clippy, cross-target checks and fmt.
- `git-one-door-scan --root .`: 0 undeclared; census regenerated.
- **Full suite** (`/dev/shm/t5p05-full.log`): 8751 tests, 8718 pass, **1 fail**, 32 skipped.
  - The failure is the known frozen V7n addendum test.
  - **One `run-tests: ERROR`:** the suite left one `fgos-tp-*` directory behind. It is not from this change: the six changed test files, run alone, leave nothing behind and print no ERROR. The log does not name the file that left it.

## Net size (`4ef0b4079`)

- Node src: +53 (renewal +29, probe +10, trust-store +8, herdr-round +4, cleanup-trust +1, holder-lock-checks +1).
- Tests: +30. Lock registry JSON: +9.
- The phase estimate (Node −35, tests −40) was for decision 63's private-config design. Decision 66 keeps the claude seed and adds a layout, a probe call and a lock, so this phase grows instead of shrinking.

## Deviations

- **The `agent-trust-store` lock is not in decision 66's wording.** The decision names add-only plus read-back. The experiment above shows read-back alone fails the coordinator's test ("every entry present afterwards") every time, so I serialised fgOS's own seeds through the existing holder-lock door, the same way `worker-session` was added.
- **Still open: claude itself can drop the entry.** Claude can save an older copy of `~/.claude.json` between fgOS's read-back and its own start. That pane then stops at the trust dialog, reported by name. The run-supervisor spec now states this.
- **No live claude call was run.** That the claude probe actually renews depends on Claude Code refreshing a login whose `expiresAt` has passed, and on its refresh token rotating. Both are assumed, not measured. If the token does not rotate, the renewal is judged `not-renewed` and the source stays as it was.

## Codex/agy half (landed `de7454638..8f521eb2f`)

- Durable writes keep links.
- A codex section ends at the next table header, and the key is written escaped.
- A failed removal is reported `remove-failed`.
- Four cases went red → green; details are in the main-branch version of this report.

## Items for other phases

- P06 (`herdr-round.mjs`): only the `REMOVABLE_TRUST_KINDS` lines changed.
- The guide for the owner machine should note the new lock row and that `~/.claude.json` keeps fgOS worktree entries; they are no longer removed.
- Backlog row H-T4c was not created; it goes to P13 per the phase file.

Status: DONE_WITH_CONCERNS
Summary: Claude folder trust is add-only, serialised by a new `agent-trust-store` lock row and read back before the pane runs; the claude remove path is gone. Confined claude logins renew at the source through a new claude layout and probe call, and a pane-renewed claude login is staged and kept for hand recovery.
Concerns/Blockers: the lock row goes beyond the decision's wording (needed by the evidence above); the claude probe renewal is proven only with a fake CLI; the full suite reported one leftover `fgos-tp-*` directory that does not come from this change.
