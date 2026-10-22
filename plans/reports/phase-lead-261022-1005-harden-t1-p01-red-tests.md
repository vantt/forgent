# HARDEN T1 phase 1 — red tests (phase lead report)

Branch `harden/t1-p01-red-tests`. No production code changed; every mutation was reverted (`git status` clean after each).
Run command for Node files: the phase file's `runSelectedTests` one-liner with `env -u CLAUDE_CODE_SESSION_ID`, `</dev/null`, CARGO_TARGET_DIR on ext4. Rust: `cargo test -p fgos-process --test containment_bwrap a_refused_mount_is_named_in_the_containment_error`.

| Case | File:line | Title | Red / pin | Evidence | SHA |
|---|---|---|---|---|---|
| S-F1 | test/state/hot-lock-multiprocess.test.mjs:195 | a record that cannot be read or judged is never cleaned: the waiter times out as lock-record-unreadable, naming fgos lock fence, and the bytes stay | red | `unjudgeable: actual null, expected 'lock-record-unreadable'`; the child script now also prints `message` | 94ed90399 |
| P-N9 | test/state/hot-lock-tx.test.mjs:156 | a record that changed after it was judged dead is never reclaimed | pin | green; red only under mutation M2 below (not the plan's mutation) | 89bc869a2 |
| P-N8 | test/state/hot-lock-tx.test.mjs:172 | clearing a record removes only the bytes the person saw | pin | green; compare at `hot-lock.mjs:112` made `if (current.state === 'absent') return false;` -> red (`actual true, expected false`) | 78e775fdb |
| RT-M2 | test/holder-lock/facade-multiprocess.test.mjs:102 | a lock handed to a spawned child stays held through the parent release while the child tree lives | pin | green (7/7 in file); no mutation run, per the phase file | d3e14c654 |
| RT-M5 | test/runner/dispatch-r9-performance-cache.test.mjs:23 | the attestation store follows the state-root pin, even when XDG_STATE_HOME is blank | red | actual `<scratch>/xdg-elsewhere/fgos/attestations`, expected `<scratch>/attestations` | 71fb65cc7 |
| T0-R1 guard | test/git/native-load.test.mjs:91 | the door canonicalises the shared vectors to their exact bytes and still refuses every value JSON would silently change | pin | green; mutation `JSON.stringify(value)` -> `value = JSON.parse(JSON.stringify(value))` in `src/native/door.mjs:74` makes it red (`Missing expected exception`; the existing :74 case also goes red) | bacebce7c |
| T0-R2 | test/git/native-load.test.mjs:106 | a durable write refuses an omitted or invalid mode by name before it touches any file | red | `actual code 'NumberExpected' (Failed to convert napi value Undefined into rust type u32), expected 'durable-file-mode-invalid'` | 87a12893f |
| RT-M11 / R3 | packages/process/rust/tests/containment_bwrap.rs:221 (+ fixtures/bwrap-refuses-mount.sh) | a_refused_mount_is_named_in_the_containment_error | red | `the refused mount is named, got: bwrap ended without reporting a gate pid (user namespaces unavailable?)` | ece8efbb2 |
| baseline | test/suite-baseline.json | refresh | n/a | 583/8058 -> 601/8202 (the baseline was already stale on the integration branch; 8 of the 144 added calls are mine); 0 new clone groups | d4df63a43 |

Fix phase / owner after the fix: S-F1, P-N9, P-N8, RT-M5, RT-M11, T0-R1, T0-R2 -> phase 4; RT-M2 -> phase 2.

## Findings against the phase file (no behaviour improvised)

1. **P-N9's stated mutation does not turn it red.** Deleting `hot-lock.mjs:132-133` alone leaves P-N9 green (8/8), because `unlinkRecordIfUnchanged` (:112) re-compares the bytes and returns `changed`. The two compares guard each other. The case goes red (`actual 'cleaned', expected 'changed'`) only when 132-133 are deleted **and** :112 is relaxed to `absent`-only (mutation M2; P-N8 goes red with it). So the proof is a real pin of "never reclaimed", but phase 4's one-read direct-unlink shape must keep one of the two checks; that is exactly what the test enforces.
2. **T0-R1 vector loop duplicates an existing owner.** `test/event-store/canonical-vectors.test.mjs:9-13` already runs all 18 vectors through the same door (`canonicalJson(JSON.parse(rawInput))`), and `native-load.test.mjs:74` already has four of the five refusals. What the new case adds is the hole, nested `NaN`, and `Infinity` refusals plus a vector check inside the door's own file, as the table asked. Under design principle 8 the lead may prefer to drop the vector loop and keep only the refusals; I delivered the table as written.
3. **RT-M11 red message differs from the table's.** On current code the error is `bwrap ended without reporting a gate pid (user namespaces unavailable?)` from `read_child_pid` (`linux.rs` ~line 428), not a fixed string at :429; the fixture needed no `--info-fd` handling. The behaviour (the refused mount line is dropped) is as described.
4. RT-M2 pin: the pid-file child keeps the inherited fd 3 and hands it to a grandchild with `stdio[3] = 3`; it passes today. Not run under the phase-2 mutation (it does not exist yet).
5. `fgos convention path` fails in the worktree (no `.fgos/installation`); the report path above came from running it in the main checkout (read-only call).
6. S-F1 failing assertion is the `unjudgeable` case; the three-case loop is under `Promise.all`, so garbage and noPid are expected to pass the new `reason` and `message` assertions once the first is fixed (they pass them today in isolation by construction: the unreadable branch).

## Test-cost line

Added 8 cases, retired 0, weakened 0 (S-F1 removed one exemption, so it asserts more). New spawns: RT-M2 one `node` child plus one grandchild (`// boundary: process-level lock handover`); RT-M11 one fixture shell child; P-N9 one short-lived node child. No new `fgos` host or `fgctl` spawn. CLI-call cost, measured on the branch (tests add none): `fgos --help` 107 ms, `fgos list` 393 ms (median of 5, load 1).
