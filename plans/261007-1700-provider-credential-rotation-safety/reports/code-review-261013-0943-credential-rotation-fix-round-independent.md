# Independent review: credential rotation fix round

Reviewer: independent code-reviewer. I did not write this code and did not do the first review. Scope: fix commit `7ccc723bd` plus `git diff 4a1cb41ac...42abe4808 -- src test`, read against the [first review](code-review-261013-credential-rotation-implementation.md) and the [fix-round table](implement-261013-phase-01-credential-rotation.md#fix-round). No source, test or doc was edited. No real account store or CLI was touched.

## Verification run

- The worktree has no `node_modules`, so tests ran with `NODE_PATH=/home/vantt/projects/forgentX/node_modules`.
  - `env -u CLAUDE_CODE_SESSION_ID node --test test/runner/provider-credential-renewal.test.mjs test/runner/provider-capacity.test.mjs test/runner/provider-credential-probe.test.mjs`: 89/89 pass, exit 0.
  - `test/runner/assignment-dispatch.test.mjs`: 81/81 pass, exit 0.
- Ad-hoc repro, kept in the session scratchpad only. It used temp dirs, fake tokens and an injected spawn. I ran it against `42abe4808` and against `7ccc723bd^` (the tree extracted with `git archive`). The results are quoted under each finding.

## What holds (checked, not findings)

- **H1 core rule.** `isReplacement` (`provider-credential-renewal.mjs:236-240`) requires a strictly later expiry and a different refresh token. `requireFuture` is true only on the fresh scratch result (`:702`). Write-back (`:535`) and leftovers (`:568`) pass false. A dead runner's marked-due scratch, where the call never ran, is refused by the same-refresh test even when the source expired long ago, and the fix-round test covers it. Leftovers apply in order and each must beat the current source, so an older copy can never overwrite a newer source.
- **H2 scoping.** The window, mark-due (`:687`, `key`), apply (`:279`, `:431`) and write-back (`:532-535`) all use the one selected key. When a prefix like `google-` matches two keys, the result is `entry-unidentified`, a safe skip. pi apply replaces only `source.doc[key]`. omp apply updates `WHERE id = ? AND provider = ?` inside `BEGIN IMMEDIATE` with ROLLBACK, never replaces the file, and is WAL-safe against a live omp. A busy owner either throws (pi/Codex retry 3 times, then `source-changing`) or exceeds `busy_timeout`, and in both cases the copy is kept on the leftover path.
- **M1 wrapper.** `withKillTimeout` (`:671-679`) builds `timeout --kill-after=5 <ceil(s)> <cmd> <args...>`, resolves `timeout` from `env.PATH ?? process.env.PATH`, and falls back to the plain command. On Windows the PATH entry `timeout.exe` (the wait command) is never matched, because no extension is appended. The recorded lock child is `timeout`'s own pid, so the lock frees once it exits. GNU `timeout` signals its whole process group. The threshold stays `max(60 min, 90 s + 5 min)` = 60 min, and the lock wait is 120 s.
- **Secrets.** All new stderr lines carry fixed codes and provider/account ids only: `cleanup.mjs:171`, `assignment-runner.mjs:2212`, and `copyCredentialFiles` `:182`, which names the file only. Parser messages are still swallowed (`:93-95`, `:387`). No token reaches results, markers or errors.
- **Opt-in.** With no `credentialWriteBack` in the marker, `removeConfinementDir` (`cleanup.mjs:166-174`) does one marker read and then the same `fs.rmSync` as before. `stopProcessesInside` runs only on the reaper path, as it did before. The marker field is set only inside `if (typeof opts.providerCredentialRenew === 'function' ...)` (`assignment-runner.mjs:2201-2216`) and `recordCredentialWriteBack` (`bwrap.mjs` +74). One behaviour is not gated by opt-in: `agent.db` provisioning now always goes through `VACUUM INTO`, via `copyCredentialFiles`. That is intended and is not a removal-path change.

## Findings

### High: a renewed copy is deleted when the source read fails. This is new in the fix, and the only good refresh token is lost.

- **Where:**
  - The H2 fix added a source read to `applyRenewedCredential` (`:517-523`). A read failure returns `{status: 'unreadable', code: source.code}` and does not throw.
  - Before the fix, `layout.apply` read the source itself and threw, which every caller treated as "keep the copy".
- **Path 1: refresh-ahead scratch (`:701-707`).** The new return is not a throw, so the catch at `:703` never fires. `fs.rmSync(scratch)` runs and the result is reported as `not-renewed`. The comment at `:698-699` ("the scratch copy then holds the only good pair") is now false for this case. The scratch has already redeemed P1, so the account is left with a spent token.
- **Path 2: leftovers (`:570`).** `unreadable-file`, `unreadable-json` and `unexpected-shape` from the source are in `DISCARDABLE_CODES` (`:557`), so a pending or scratch copy is removed. The comment at `:569` says source-side problems keep the copy, but only `entry-unidentified` does.
- **Path 3: write-back status (`:784`).** `fs.existsSync(final) ? 'staged' : 'applied'` reports `applied` for a copy that was discarded.
- **Repro.** The same script was run on both trees. The source `auth.json` was left mid-write (`{"xai": {"ty`) while the scratch call renewed P1 to P2:
  - Fix tree: `{"status":"failed","reason":"not-renewed"} scratch leftovers kept: 0`. Pre-fix tree: `apply-failed ... kept: 1`.
  - Write-back with the source torn between stage and try-lock. Fix tree: `{"status":"applied"} pending entries left: 0`. Pre-fix tree: `staged ... 1`.
- **Other triggers:**
  - The same happens with omp when the source open fails (`unreadable-db`) inside the 90 s call window.
  - It also happens when the selected entry becomes unidentifiable after the call, because `entry-unidentified` is returned as `unreadable` and then rm'd at `:707`.
- **Fix:**
  1. Make a source-side read failure distinguishable from a copy-side failure. Either throw, or return a distinct status such as `source-unreadable`.
  2. In `renewInScratch`, remove the scratch only on `applied`, or on `unchanged` with a readable source.
  3. In `applyLeftovers`, keep the copy on any source-side code.
  4. Derive the write-back status from the apply outcome, not from whether the file exists.
  5. Add tests: a torn source during the scratch call, and during leftover apply.

### Medium: a lone oauth entry is selected even when it belongs to another provider, so part of the original H2 failure remains.

- **Where:** `selectProviderEntry` (`:493`). `entries.length === 1` returns the entry without checking `owner`.
- **Failure:**
  - Setup: a pi `auth.json` (or an omp profile) holds the dispatched provider as an API key, which is not an entry, plus one abandoned oauth login of another provider.
  - The abandoned login drives the window, so every cooldown period (30 min) spends a real CLI call and records `failed/not-renewed`.
- **Repro:** `xai: api_key` plus `github-copilot` oauth expired 30 days ago, dispatched provider `xai`. Result: `{"status":"failed","reason":"not-renewed"} spawns: 1`.
- **Likelihood:** low for pi, where per runner.md RUL70 an account dir carries one provider. More plausible for multi-provider omp profiles.
- **Fix:** apply the single-entry shortcut only when `owner === null` (Codex). Otherwise require the owner match. The fix-round test "a lone oauth entry is the one" should use a matching owner.

### Medium: the lazy unlock probe now holds the account lock with no deadline after its runner dies.

- **Where:**
  - `provider-capacity.mjs:925` now records the probe child, which was the L1 fix.
  - `createCredentialProbe` (`provider-credential-probe.mjs:100-105`) calls `runCredentialProbe` with no `withKillTimeout` wrap. Only `renewInScratch` (`renewal.mjs:693`) wraps.
- **Failure:**
  - The runner is SIGKILLed while an unlock probe runs, and the detached `pi`/`omp`/`codex` hangs.
  - `isGenerationHeld` (`:452-455`) keeps the lock while that child lives.
  - Every refresh-ahead on the account then waits 120 s and skips (`lock-busy`), and every write-back only stages, indefinitely. This is the original M1 defect, moved onto the unlock path by the L1 fix.
- **Fix:** apply the same wrap in `createCredentialProbe`, or inside `runCredentialProbe` so that both callers share it. Add a test that checks the wrapped args for the unlock probe.

### Low: a copy entry without a recognisable refresh field replaces a source entry that has one.

- **Where:** `refreshDiffers` (`:228`) treats null as "differs". pi apply (`:281-283`) checks only `type === 'oauth'` and a finite `expires` before replacing the whole entry. Codex (`:352`) and omp (`:435-438`) do the same, with no shape check of the replacement.
- **Repro:** a pane copy `{type: 'oauth', access, expires: +6 h}` with no `refresh`, against a source holding P1. Result: `applied`, and the source no longer has a refresh field. Pre-fix behaves the same, so this is not a regression.
- **Fix:** refuse a replacement whose `refreshOf(copy)` is null while `refreshOf(source)` is a string. Only "both null" should fall back to the expiry-only rule.

### Low: retained leftovers have no age bound, and the module header contradicts the new rule.

- **Unbounded leftovers.** A kept leftover (`entry-unidentified`, `unreadable-db`) makes `hasLeftovers` true forever (`:641`). Every dispatch on the account then takes the lock and re-reads. It is cheap, but nothing surfaces it (no doctor check, as already noted).
- **Stale header.** The header at `:15-16` still says the replacing entry must be "still in the future". That now holds only for the fresh scratch result.

## Not re-raised

These are already recorded in the fix round:
- M2 (accepted and documented).
- L3 (no change).
- The probe still uses the CLI's default model, so a multi-provider store can still report `not-renewed` for the dispatched provider.

## Recommended order

1. Fix the High finding before merge. It reverses the safety the fix round was meant to add.
2. Fix the lone-entry owner check and wrap the unlock probe.
3. Fix the two Lows.

## Unresolved questions

- Does pi write `auth.json` atomically (temp file and rename) and take a lockfile? This decides how often the High finding's torn-read trigger happens in practice. It does not decide whether the code is correct, because the omp `unreadable-db` and `entry-unidentified` triggers exist anyway.
- When omp's own refresh fails on a spent token, does it set `disabled_cause` on the row? If it does, a valid pending copy for that row is never applied, because `OMP_SELECT` filters it out, and it is then discarded as `unexpected-shape` or kept forever as `entry-unidentified`.

Status: DONE_WITH_CONCERNS
Summary: The core H1 rule, the H2 key scoping, the omp row update, the timeout wrap and the opt-in gating are correct, and all 170 focused tests pass. But the fix introduced a reproduced High regression: when the source read fails, a renewed scratch, pending or leftover copy is deleted (and reported as not-renewed or applied), where the previous code kept it.
Concerns/Blockers: Two Mediums remain: a lone unrelated oauth entry is still selected, and the unlock probe holds the account lock unbounded after its runner dies (L1 fix without the M1 wrap).
