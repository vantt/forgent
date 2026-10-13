# Code review: credential phase 02, write-ahead log sidecar (rounds 2-3)

Independent check of `fix/credential-phase-02-safety` at db4a7e28f. The previous review was at 7c266c3ed, and the base is origin/main 4e3ea0e9b. Read-only. Worktree `/home/vantt/projects/forgentX-worktrees/phase02-review`.

Scratch trees (git archive of 7c266c3ed, c28d1ce17 and db4a7e28f, plus HEAD tests on the two older `src` trees) and the probe scripts are in the session scratchpad under `walv/`. The fixtures are real SQLite WAL databases. Each has an omp-shaped `auth_credentials` table (provider, credential_type, data JSON with access, refresh and expires, disabled_cause, updated_at, identity_key), and every value is fake. No real credential store was opened.

## Verdict

Merge-ready: **no, one small fix first.**

- The WAL fix works on every requested scenario, both with and without `node:sqlite`.
- One new token-loss path came in with the byte-identity rule (M1 below). It is a one-line fix plus a test.

## Checks run

| Check | Result |
|---|---|
| Focused tests at HEAD (renewal + retained check) | 94/94 pass |
| HEAD tests on 7c266c3ed `src` | 6 fail: the byte-identity, raw-dedupe, WAL and torn-any-age tests, plus the doctor-wording test |
| HEAD tests on c28d1ce17 `src` | 2 fail: exactly the two WAL tests |
| Citation guard test + `check-decision-citation-drift.mjs` | 31/31; exit 0 |
| `provider-*.mjs` imports of `confinement/` | none (grep), and the import-guard test passes |
| Probe at HEAD (real WAL fixtures) | all PASS (table below) |
| Same probe on c28d1ce17 | (1), (1b) and (4b) **lose the token** without sqlite: `unchanged`, source still R1, 0 pending |

### Real-fixture probe at db4a7e28f

The pane `agent.db` main file was confirmed byte-identical to the source's (sha) in every case. The newer refresh token lives only in `-wal`, written by a child process with `wal_autocheckpoint=0` that SIGKILLs itself, so no checkpoint and no close happen. Check (1b) instead copies the files while the writer still holds the database open.

| Case | sqlite available | `loadSqlite` stubbed null |
|---|---|---|
| (1) crash-left WAL holds a newer refresh, main file identical | `applied`; source holds R2 | `staged`; pending has `agent.db` + `-wal` + `-shm`; applying it later with sqlite puts R2 in the source |
| (1b) files copied while the writer is open | `applied` | `staged` |
| (2) two pending copies: same `agent.db`, different real WALs, plus padding over the cap | both kept (7 left) | both kept (7 left; the cap ran and dropped nothing) |
| (2b/4) same main file and WAL, only `-shm` differs | n/a | deduped: the older one is dropped (correct, because `-shm` is a rebuildable index) |
| (3) 12 non-renewing dispatches, WAL absent on both sides | n/a | 0 staged, all `unchanged` (the earlier M1 stays fixed) |
| (3) 12 dispatches, zero-byte WAL on both sides (source held open after `wal_checkpoint(TRUNCATE)`) | n/a | 0 staged |
| (4a) main file identical, random `-shm` only | `unchanged` | `unchanged` |
| (4b) newer refresh in WAL, stale pre-write `-shm` | `applied` | `staged` |
| (5) main file identical, `-journal` present (random bytes, not a valid hot journal) | `unchanged` | `unchanged` |

Observation (3c): the owner's omp holds the source open with an uncheckpointed write, so the source `-wal` is 4152 bytes. Without sqlite, every dispatch stages a copy. The raw dedupe then holds the account at 5 pending, so disk use stays bounded. This is not a finding.

Check (5), per the coordinator: at db4a7e28f `-journal` is not in `sidecars` (`provider-credential-renewal.mjs:402`). The no-sqlite `stage()` copies only `''`, `-wal` and `-shm` (`:466`). A copy whose main file is identical but which has a `-journal` is therefore judged `not-newer` and its home is deleted. It does not fail safe by construction. This is recorded as the known pending follow-up, not as a new finding. A real hot-journal fixture was not built.

## Findings

### M1 (Medium, regression since 7c266c3ed): an unreadable non-empty `-wal` counts as absent, so the home is deleted or its pending copy is deduped away

**Cause.** `sidecarBytes` swallows every read error as "absent" (`provider-credential-renewal.mjs:573-579`, `catch { /* absent */ }`). Two places rely on it:

- `filesIdentical` (`:587`). Its "no sidecar" premise is then unproven, yet `copyIsNewer` turns `undetermined` into `not-newer`. `writeBackRenewedCredential` returns `unchanged` (`:1026`), and `removeConfinementDir` removes the home (`confinement/cleanup.mjs:200`; only `failed` + `keepHome` keeps it).
- `rawFingerprint` (`:718`). A copy whose WAL cannot be read hashes the same as a copy with no WAL.

**Repro** (scratch `walv/scripts/eacces*.mjs`; a real WAL holding FAKE-R2, `chmod 000` on `agent.db-wal`, uid 1000):

| Path | HEAD | 7c266c3ed |
|---|---|---|
| write-back with sqlite | `{"status":"unchanged"}`: home removed, R2 lost | `stage-failed`, `keepHome: true` |
| write-back without sqlite | `{"status":"unchanged"}`: home removed, R2 lost | `stage-failed`, `keepHome: true` |
| cap: pending `…001` (same main file + unreadable WAL) vs `…002` (same main file, no WAL), over the limit | `…001` dropped as a duplicate | n/a (the raw dedupe did not exist yet) |

**What breaks.** The invariant says a copy is deleted only once it is proven not newer. Here an `EACCES`, `EMFILE`, `EIO` or `EISDIR` on the sidecar stands in for that proof. The trigger is rare, since the pane runs as the same uid, but the outcome is the exact token loss this phase exists to prevent.

**Fix.** In `sidecarBytes`, treat only `ENOENT` as absent. On any other error, have `filesIdentical` return false and `rawFingerprint` return null. Add a test with an unreadable `-wal` for both paths.

### L1 (Low, test gap): the new WAL tests use fake bytes, not a real WAL

- The tests write `'FAKE-WAL-BYTES'`, `'W1'` and `'W2'` (renewal test, ompPaneHome and the dedupe test). They prove the byte rule, but not that a real crash-left WAL (main file unchanged, refresh only in the log) is caught by both the sqlite and no-sqlite paths.
- The probe above shows that it is caught.
- Optional: add one fixture that uses the SIGKILL-child technique.

## Invariant hunt: delete paths touched since 7c266c3ed

| Path | Proof used | Holds? |
|---|---|---|
| write-back `unchanged` through `filesIdentical` (`:599-601`, `:1026`) | main file bytes equal and no non-empty `-wal` on either side; only overrides `undetermined`, never `newer` | yes, except M1 and the pending `-journal` |
| `capPendingCopies` raw fingerprint (`:714-720`, `:731-748`) | main file bytes + non-empty `-wal` equal; `-shm` ignored (correct) | yes, except M1 |
| `capPendingCopies` parsed fingerprint | key + refresh + expiry (accepted in the previous review) | unchanged |
| `applyLeftovers` / `renewInScratch` / `settleHeldCredentialHome` | no change since 7c266c3ed | unchanged |
| any age-based delete | none found; `torn/` is only listed, never removed | yes |

Concurrency: the source can change during `filesIdentical`. The source only moves forward, so equality with any earlier source state still proves the copy renewed nothing.

## Previous review (7c266c3ed) follow-up

| Item | Status |
|---|---|
| M1 (growth without sqlite) | fixed (check 3) |
| L1 (`torn/` only for probe scratch) | documented: plan item 14 and the spec sentence "`torn/` covers the probe's scratch copy only" |
| L2 (doctor over-limit wording) | fixed (`registrations.mjs:5445`) |
| L3 (torn reported only after a day) | fixed (`:683`) |

Docs:
- The doctor text is values-free (provider, account, count and age only).
- RUL75 (runner.md), confinement-authority, CHANGELOG `[Unreleased]` and plan items 14-15 match the code. They state "non-empty write-ahead log on either side" and "bytes of the store files and of a non-empty write-ahead log".

## Unresolved questions

1. M1: fix before merge (recommended; one line plus a test), or record it as an open item?
2. `-journal` follow-up: the coordinator says a later commit adds it. Its test needs a real hot journal. The no-sqlite `stage()` must also copy `-journal`, not only count it as a sidecar.
3. Real omp `agent.db` size and per-run write behaviour are still unmeasured. If omp writes non-auth rows on every run, the main file differs after a clean close, and identity never matches. Growth is then bounded only by the raw dedupe, which needs identical bytes.

Status: DONE_WITH_CONCERNS
Summary: The write-ahead log fix is verified on real SQLite WAL fixtures with and without node:sqlite (cases 1-4 pass at HEAD; 1, 1b and 4b lose the token on c28d1ce17), and the M1 disk growth stays fixed. Not merge-ready: an unreadable non-empty -wal is treated as absent, so the home is deleted (repro'd at HEAD; base kept it).
Concerns/Blockers: M1 (sidecarBytes swallows non-ENOENT errors, provider-credential-renewal.mjs:579); -journal not handled (known pending item).
