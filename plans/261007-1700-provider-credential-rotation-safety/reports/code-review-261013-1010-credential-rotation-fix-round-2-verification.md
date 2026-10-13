# Verification: credential rotation fix round 2

Reviewer: an independent code-reviewer. I am not the author and did no earlier review. Scope: `git diff ee861c078 fb77206b9` (commits `df18cd1e9`, `24b975f79`, `fb77206b9`), read against the [independent fix-round review](code-review-261013-0943-credential-rotation-fix-round-independent.md), the [organization critique](design-critique-261013-0948-credential-rotation-code-organization.md) and the "Fix round 2" section of the [implement report](implement-261013-phase-01-credential-rotation.md). I edited no source, test or doc. I touched no real store and no real CLI.

## Verdict

**Merge-ready: yes.**
- The High regression is fixed. I re-ran the repro and the copy is now kept.
- Both Mediums are fixed.
- The cleanups preserve behaviour, apart from two small Codex provisioning changes (L2).
- One Medium remains. It is not a regression: base `ee861c078` behaves the same. But it breaks the stated invariant, so it should become a tracked item.

## Verification run

- Focused suites at HEAD (`NODE_PATH=… env -u CLAUDE_CODE_SESSION_ID node --test`), all exit 0:
  - renewal, probe, capacity and confinement-backend-p03: 138/138 pass.
  - credential-hygiene, quarantine-probe, account-rotation, run-herdr and assignment-dispatch: 128/128 pass.
- New tests against the old code: I extracted base `src/` with `git archive ee861c078` into the scratchpad and ran the HEAD test files on it.
  - In the renewal file, 8 of the 9 new or changed tests fail. This matches the author's claim.
  - The probe file fails at import, because `expandCredentialHome` was not exported at base.
- Ad-hoc repro: `scratchpad/repro-r2.mjs` (fake tokens, temp dirs, injected spawn, `PATH=/nonexistent`). I ran it against both trees:

| Scenario | base `ee861c078` | HEAD `fb77206b9` |
|---|---|---|
| A. Refresh-ahead; source torn (`{"xai": {"ty`) during the call | `failed/not-renewed`, pending 0 (copy lost) | `failed/apply-deferred`, pending 1 holding `FAKE-R2`, no scratch left |
| A'. Same, but the source file is missing during the call | `not-renewed`, lost | `apply-deferred`, pending 1 |
| B. Dead runner's `scratch-*` plus a torn source, then a write-back | write-back `unchanged` | write-back `staged`; the scratch is kept and the pane copy is staged |
| D. omp write-back, `node:sqlite` unavailable | `unchanged` (the home is then removed) | `unchanged` (same) |
| E. pi store where entry is unidentified; the owner rotates another entry during each of 5 dispatches | 5x `unchanged` | 5x `staged`, **pending 5**; refresh-ahead returns `skipped/entry-unidentified` and never drains them |

## Checks that hold

1. **apply-deferred path.**
   - `applyRenewedCredential` (`provider-credential-renewal.mjs:517-540`) reads the source before any verdict.
   - Source failures, an unidentified entry, and source-side throws during apply (`SOURCE_SIDE_THROWS`, `:503`) all return `apply-deferred`. `source-changing` and SQLite busy errors still throw.
   - On `apply-deferred`, `renewInScratch` renames the scratch into `pending/`; if the rename fails, the `scratch-*` stays where it is and is still a leftover. It then records a cooldown and returns `failed/apply-deferred` (`:714-724`).
   - Every remaining delete site:
     - `:696`: the scratch was never called.
     - `:725`: only `applied`, `unchanged` (source read) or `unreadable` (the copy itself is unusable, `COPY_UNUSABLE_CODES` `:502`).
     - `:597`: everything except `apply-deferred` or a throw.
     - `:790`: a staging dir only.
   - None of these is reached with an unread or unidentified source. The exception is the write-back home removal in M1 below.
2. **Write-back status.**
   - `staged` is returned when `final` still exists.
   - Otherwise the status comes from the outcome of that copy (`:802-803`), so `applied` is no longer reported for a dropped copy.
3. **Owner match.**
   - The lone-entry shortcut is gone (`:491-494`). `owner === null` (Codex only) matches.
   - The fgOS provider ids are `claude`, `gemini`, `xai` and `openai` (runner.md RUL70). Against pi keys, the only prefix hit is `openai` → `openai-codex`, which is intended.
   - Two or more prefix hits give `entry-unidentified`, which is a safe skip. I found no false positive.
4. **`withKillTimeout`.**
   - It now lives in `provider-credential-probe.mjs:44-53`.
   - Both refresh-ahead (`renewal:700`) and `createCredentialProbe` (`probe:129`) use it. `onSpawn` records `timeout`'s own pid.
   - The new probe test asserts the wrapped args.
5. **Cleanups.**
   - `expandCredentialHome` (`probe:30-38`) covers everything the old copies accepted:
     - the old renewal version, plus `$HOME`;
     - the old probe version, plus `~` and the `(?=\/|$)` guard;
     - the old bwrap version, which used `process.env.HOME` and therefore expanded to `/…` when `HOME` was unset (now it uses `os.homedir()`).
   - The rename is complete: there are 0 hits for `provisionSelectedCodexCredential`.
   - `SAFE_KEY` removal: `providerAccountDir` (`provider-capacity.mjs:172-175`) requires a string. Account ids are validated as strings at config load (`validateAccountId`), and provider ids are normalized config keys. No caller passes a number, so rejecting `7` changes nothing in practice.
6. **Opt-in off.**
   - `cleanup.mjs` and `recordCredentialWriteBack` are untouched by this round.
   - A home with no `credentialWriteBack` field is removed as before.
7. **Secrets.**
   - New code paths return fixed codes only. The only new stderr text is the existing refresh-ahead line, which carries a status and a reason code.
   - Tests use `FAKE-*` values.

## Findings

### Medium (M1): write-back still deletes a pane-renewed copy when the copy cannot be read for a reason that may pass. Not a regression (base is the same), but it breaks the stated invariant.

- **Where:**
  - `copyIsNewer` (`renewal.mjs:546-547`) returns `'not-newer'` for any copy read failure.
  - `writeBackRenewedCredential` then returns `unchanged` (`:780`).
  - `removeConfinementDir` (`cleanup.mjs:166-173`) then removes the home with `rmSync`.
- **It disagrees with `applyRenewedCredential`.** That function classifies `sqlite-unavailable` and `unreadable-db` on the copy as `apply-deferred` (`:521`), meaning "may pass, keep".
- **A staging failure has the same effect.** A failure at `:789-791` (for omp, `stage` needs `VACUUM INTO`, `:452-455`) returns `failed`, and the home is deleted anyway.
- **Trigger (repro D):**
  - Conditions: an omp account, and a Node without an unflagged `node:sqlite`. `package.json` declares `engines >=18`, and Node 22.5-22.12 needs a flag.
  - Provisioning falls back to a plain copy (`copyCredentialFiles`, `:165-171`), and the marker is still written.
  - The pane's omp renews the login inside the copy. Removal then reports `unchanged` and deletes the only valid refresh token.
- **Doc conflict.** runner.md RUL75 item 3 now says a copy is deleted only "when the source was read successfully and proves the copy is not newer, or when the copy itself is unusable". `sqlite-unavailable` is not "unusable" by the code's own classification.
- **Fix (follow-up item is fine):**
  - Return `'undetermined'` from `copyIsNewer` for copy codes outside `COPY_UNUSABLE_CODES`.
  - Give omp `stage` a plain-copy fallback (`agent.db` plus `-wal` and `-shm`; the pane's processes are already stopped) when SQLite is unavailable.
  - Alternatively, do not record `credentialWriteBack` for an omp layout when `loadSqlite()` is null, and state that in RUL75.

### Low (L1): pending copies grow without bound for an account whose entry cannot be identified, and refresh-ahead never drains them. The "Known cost" claim is wrong.

- **Where:** the undetermined branch of `copyIsNewer` (`:551-554`) stages a copy when any copy entry, of any provider, has a refresh token the source does not hold.
- **How it grows:**
  - An unrenewed pane copy taken before the owner's CLI rotated any entry in the source holds an old token. It is therefore staged on every such dispatch.
  - `applyLeftovers` keeps each one (`entry-unidentified`).
  - `refreshAhead` returns `skipped` at `:659`, before `applyLeftovers` (`:670`), so the copies are never re-tried there.
  - Repro E: 5 dispatches gave 5 pending copies.
- **What the docs say:**
  - The implement report says "an unrenewed copy is dropped as before, so pending copies do not pile up per dispatch". That holds only when the source did not change.
  - runner.md item 4 says "the next refresh-ahead … applies it". That is false while the entry stays unidentified.
- **Impact:** no token is lost. The cost is disk growth (owner-only token files) and a removal re-read per dispatch, on an account that is already misconfigured. The stderr `skipped (entry-unidentified)` line appears every dispatch, but it does not mention pending copies.
- **Fix:**
  - Decide "undetermined" per key. Stage only when some candidate entry (owner matches the provider, or `null`) has no same-key source entry, or `isReplacement(copyEntry, sameKeySourceEntry)` is true. A stale copy has the earlier expiry and drops out.
  - Correct the runner.md sentence.

### Low (L2): Codex provisioning now rejects two inputs it used to accept, regardless of opt-in.

`bwrap.mjs:61-62` now goes through `copyCredentialFiles` (`renewal.mjs:142-170`). Two previously working configs now fail closed:
- `<home>/auth.json` as a symlink that resolves outside the home (for example a dotfiles-managed file). Before, it went through `copyFileSync`, which follows symlinks.
- A relative Codex `home`. Before, it was resolved against the cwd.

The critique called this a "safer Codex copy", and the refresh-ahead path already had these checks. Still, the implement report names only the change of message. One line in CHANGELOG or RUL75 would close the gap.

### Low (L3): one new test is phantom for the change it names.

- `write-back reports applied only when the copy was applied, and unchanged when it was dropped as not newer` passes against base.
- Its second call returns `unchanged` from the early exit at `:780`, not from the new outcome branch at `:803`.
- The `applied`-versus-`unchanged` choice after a copy is staged and then removed is never exercised.
- A case where `copyIsNewer` is `undetermined` but `applyLeftovers` finds the copy not newer would pin it. Example: stage with a torn source, then repair the source before applying, using the `tryLock` seam.

### Low (L4): the doctor and dispatch now expand a home differently.

- The shared helper gained `$HOME` support.
- The doctor's `expandHome` (`src/setup/registrations.mjs:4300`) did not, so a `$HOME/...` home works at dispatch but the doctor reports its files as missing.
- The author kept the doctor helper on purpose, for its messages. The minimal fix is to add the `$HOME` replace there too.

### Low (L5): the component-boundary row understates the dependency.

- `docs/platform/component-boundary.md:68` names only the removal-time call.
- `bwrap.mjs` also imports from renewal at provisioning time (`copyCredentialFiles`, `credentialWriteBackMarker`), and imports `expandCredentialHome` from the probe module (`bwrap.mjs:15-16`).
- confinement-authority §13.2 and runner.md items 2-3 otherwise match the code.

## Answers to the remaining checks

- **Cooldown on apply-deferred (`:722`): sound.**
  - Leftovers are applied before the cooldown check (`:670` before `:676`), so a kept copy is still applied on the next dispatch.
  - The cooldown only stops a new probe call within 30 minutes.
- **Can pending grow?**
  - From refresh-ahead: no. A new scratch needs a readable, identified source, and the leftovers are drained first.
  - From write-back: yes, in the unidentified case (L1).
- **Can a needed copy still be dropped?** Only through M1, which is the write-back path, pre-existing.

## Unresolved questions

- Does pi or omp write its store atomically? If not, a probe killed at `timeout` in the middle of a write leaves a torn scratch. That counts as `unreadable` and is deleted (`:725`), possibly with a redeemed refresh inside. The torn file cannot be parsed either way, but keeping it would allow recovery by hand.
- Should a pending copy that stays `entry-unidentified` be surfaced by `fgos doctor`? Right now it holds the only valid token silently until the store becomes identifiable.

Status: DONE_WITH_CONCERNS
Summary: The High regression is fixed and confirmed by repro on both trees (renewed copies now go to pending/ with honest apply-deferred and staged statuses), the two Mediums and the cleanups check out, and 266 focused tests pass; merge-ready.
Concerns/Blockers: Pre-existing Medium M1: write-back still deletes a pane-renewed omp copy when `node:sqlite` is unavailable or the copy db cannot be opened. Low L1: pending copies grow without bound for accounts whose entry cannot be identified, contrary to the implement report's "Known cost".
