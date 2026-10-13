# Code review: credential phase 02 final delta and the per-CLI store merge

Independent review, read-only. Tree: detached worktree `phase02-review`, HEAD `8098d7be2` (merge of `fix/credential-phase-02-safety` into local main, which carries `1f911229f`).

## Verdict

**Merge-ready to push: yes.** No finding breaks the invariant: no copy that may hold the only valid refresh token is deleted. One Medium (M1, in `1f911229f`): copies at the account root are stranded when an account switches to per-CLI stores, and doctor's wording is wrong for them. Fix it soon after the push. It does not block, because the stranded copies are kept and reported.

## Evidence

| Check | Result |
|---|---|
| Focused tests: renewal, per-CLI, credential hygiene, herdr trust, import graph, credential probe, citation drift | 195/195 pass |
| `test/setup/credential-copies-retained-check.test.mjs` | 8/8 pass |
| `scripts/check-decision-citation-drift.mjs` | exit 0 |
| `provider-*.mjs` imports of `confinement/` | none (grep). The guard test "no provider module reaches into confinement" passes |
| `test/architecture.test.mjs` | not run here: `yaml` cannot be resolved through `NODE_PATH` under ESM. The full-suite run is the coordinator's |

Scratch probes used real SQLite fixtures and the real provisioning, removal, renewal and doctor paths. They live under the session scratchpad (`probe-a.mjs`, `probe-a3b.mjs`, `probe-b.mjs`), use fake tokens, and print statuses only.

### Part A: branch delta `db4a7e28f..a4e24208e`

The WAL was written by a child with `wal_autocheckpoint=0` that SIGKILLs itself. The pane's main file stays byte-identical to the source.

| Case | sqlite | `loadSqlite` stubbed null |
|---|---|---|
| A1: `-wal` mode 000 holds the newer token | `failed/stage-failed`, `keepHome:true`, 0 pending | same |
| A1b control: `-wal` readable | `applied`, source got the new token | `staged`, 1 pending |
| A2: 8 byte-identical pending copies, unreadable `-wal` | 8 kept (none deduped) | n/a |
| A2 control: same copies, readable `-wal` | dropped down to 5 | n/a |
| A3: real hot rollback journal (DELETE mode, cache spill, SIGKILL; journal 9728 B, main changed) | `staged`, staged files `agent.db` + `agent.db-journal` | same |
| A4: non-empty `-shm` only, readable or mode 000 | `unchanged` (home may go) | same |
| A5: readable newer `-wal` + mode 000 `-shm` | `stage-failed`, `keepHome:true` | same |
| A6: `agent.db` + `-wal` copied without `-shm`, then a read-only open | newer row read | n/a |

All of the delta's claims hold, with one correction. `statSync` succeeds on a mode-000 file, so an unreadable `-wal` or `-shm` fails at `copyFileSync` (EACCES), not at the stat. `writeBackRenewedCredential` maps that to `stage-failed`, so the outcome is the same.

### Part B: merge `8098d7be2` with `1f911229f`

| Case | Result |
|---|---|
| B1: real `prepareBwrap` (unpinned lease, command `/usr/bin/pi`) | marker `store:"pi"`, `home` = pi source. Removal under a busy lock stages into `stores/pi/pending` (root `pending/` empty) |
| B1: refresh-ahead of the codex store | leaves the pi copy alone; codex home unchanged |
| B1: refresh-ahead of the pi store (source fresh, leftovers present) | applies the copy to the pi home; `stores/pi/pending` emptied; codex home unchanged |
| B2: `stores/pi/pending` = 1 unique (oldest) + 5 identical, source entry unidentifiable, plus one staged write-back | 5 left: the unique copy kept, 4 duplicates kept, 2 duplicates dropped |
| B3: held pi home (marker `store:pi`), settled by refresh-ahead of the account's **codex** store | settled into the pi store and applied to the pi home; codex home unchanged |
| B3: same, settled by `fixCredentialCopiesRetained` (doctor `--fix`) | 1 removed; pi home got the login |
| B4: pending copy left at the account root, account now per-CLI, pi refresh-ahead | root copy never applied; still reported (see M1) |

Every phase-02 mechanism resolves the store directory through `credentialStoreDir(..., cli)`:
- refresh-ahead: `provider-credential-renewal.mjs:846`
- marker: `:986`
- settle: `:1010`
- write-back: `:1043`

`capPendingCopies`, `torn/`, the cooldown and scratch homes all take that directory. The account lock stays one per account (`provider-capacity.mjs` `accountLockDirFor`), so every store's directory is mutated under the same lock. `heldHomes.has/settle` select by provider and account. Each home then settles into the store named in its own marker, and B3 shows that is correct.

## Findings

### M1 (Medium, in `1f911229f`): copies at the account root are stranded after an account switches to `credentialSources`

**What happens.** Refresh-ahead and write-back for a per-CLI store only look in `stores/<cli>/` (`:846`, `:1043`). If the account still has `pending/`, `torn/` or scratch copies at the account root from its single-store period, nothing ever applies them. The reverse switch strands `stores/<cli>/` the same way. These copies are kept and doctor lists them (B4), so the invariant holds.

**What is wrong.** Doctor tells the owner "a dispatch for that account applies them" (`registrations.mjs:5452`). For stranded copies that is false, so a copy that may hold the only valid token waits indefinitely while the owner is told it will be applied. Renewal is live in the real callers:
- `cli.mjs:1292`, `:1471`, `:1623`
- `operation-choice.mjs:2220`
- `execution/run.mjs:378`

**Fix.**
- When an account directory has a `stores/` subdirectory (or the inventory declares `credentialSources`), report root copies as "not applied automatically after the switch to per-CLI stores; recover by hand". Do the same in reverse for `stores/*` of a single-store account.
- Document this in RUL80.
- Do **not** auto-apply root copies to a per-CLI store. A copy read through the wrong layout (a Codex `auth.json` read as pi) fails with `unexpected-shape`. That code is in `COPY_UNUSABLE_CODES` (`:526`), so `applyLeftovers` would delete the copy.

### L1 (Low, created by the merge): doctor cannot say which store is over the limit

`inspectPendingCopiesOverLimit` pushes `{provider, accountId, count}` per store with no store field (`:668`). B2 shows two rows with the same identity and counts 6 and 8. The doctor text (`registrations.mjs:5451-5452`) names only provider/account, so the owner cannot tell which `stores/<cli>` to look in. Add `store` to the rows and to the message.

### L2 (Low, doc drift created by the merge)

- RUL75 item 4 (`docs/specs/runner.md:1093`) says "Pending copies are limited to five per account", and §13.2 (`confinement-authority.md:1370`) says "5 bản mỗi account". The cap is now per store (`capPendingCopies(storeDir)`).
- RUL80 (`runner.md:1098`) lists `pending/`, scratch homes and cooldown under `stores/<cli>/` but not `torn/`. The code puts torn copies there (`renewInScratch` uses the store directory), and the merge test covers it.
- CHANGELOG and the plan are otherwise consistent on both sides.

### L3 (Low, branch delta; the -shm question you asked): an unreadable `-shm` holds a home for no data reason

`stage()` copies `-shm` and fails on any error other than ENOENT (`:467-475`). A5 shows that a pane with a readable newer `-wal` and an unreadable `-shm` fails staging and keeps the home. After 5 attempts the home is held, and `--fix` cannot settle it while the permission stays broken. A6 shows `-shm` is not needed: `agent.db` + `-wal` without `-shm` opens read-only and yields the newer row, because SQLite rebuilds the index from the WAL.

**Judgement.** The current behaviour is safe: nothing is lost and the home is retained. But it turns a harmless index-file fault into a long-term hold that only the owner can clear.

**Recommendation.** Stop copying `-shm` in the no-sqlite branch: `['', '-wal', '-journal']`. Do not merely skip `-shm` on error. Copying a stale index brings nothing, and the identity rules already ignore it. This is not a blocker; do it as a one-line follow-up with an A5-style test.

### L4 (Low, informational, branch delta): a staged hot-journal copy can never be resolved automatically

**What the journal holds.** A hot rollback journal holds the pages as they were *before* the transaction, so the committed state is the old row. The comment at `:401-402` ("a login renewed after the last checkpoint lives only here") is wrong for `-journal`.

**What happens to such a copy.**
- A read-only open of a hot-journal copy fails with SQLITE_READONLY_ROLLBACK (errcode 776). `applyRenewedCredential` therefore returns `apply-deferred/unreadable-db` on every attempt (`probe-a3b.mjs`).
- The copy stays in `pending/` forever, and doctor warns about it every day.

**Why keeping it is still right.** Rolling back would discard pages that may carry a token the server already rotated. Keeping the raw files for hand recovery is the conservative choice. Fix the comment, and consider having doctor tell the owner to recover such copies by hand.

**Plan open question 79** ("tests use fake bytes ... not a real hot journal") remains true of the test suite. A3 is the real-fixture evidence.

## Scope notes

- The coordinator's conflict resolution in `inspectRetainedCredentialCopies` (scan `stores/<cli>` and `torn/` in each store) is correct and covered by the test at `test/runner/provider-credential-renewal.test.mjs:1915`.
- No token values appear in any stderr line, doctor message or marker (B2 `noTokens:true`; markers hold names and paths only).
- Refresh-ahead for a per-CLI account loops over its stores, and each store waits for the account lock separately (up to `probeTimeout + margin`). The worst-case delay before launch grows with the number of stores. This is acceptable.

## Unresolved questions

1. Does any real account-lock directory currently hold root `pending/`, `torn/` or scratch copies for an account that is now on `credentialSources` (for example openai/tetcu72)? Not checked: real credential copies were out of bounds. If yes, M1 is live today.
2. L3: is dropping `-shm` from `stage()` acceptable to the owner, or should a `-shm` fault keep holding the home?
