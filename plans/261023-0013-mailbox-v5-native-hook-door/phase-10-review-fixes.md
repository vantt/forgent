---
phase: 10
title: "V5 review fixes"
status: done
priority: P1
effort: "1d"
dependencies: [9]
---

# Phase 10: V5 review fixes

## Goal

Close the findings of the independent review `reports/code-review-v5.md` that block a merge (H1, H2, M1, M4), plus M2, M3 and the lows, under the same rules as phases 1–9: test first, mutants killed, one commit per item, no live run.

## Decisions (plan owner (agent), 2026-10-23; also spec §17)

1. **H1.** The generated OMP/Pi extension imports only `node:` builtins. Its owning test imports the file the installer wrote. `checkOmpHook`/`checkPiHook` share one check that compares the file byte for byte with the generator, so a drifted file fails doctor.
2. **H2.** The mailbox rows install only when the project sets `mailbox.enabled: true`. The name follows spec §16 item 23, option (b). It is a contract key with reader `setup` and default false.
   - **Provisional** until the owner answers item 23. If the owner chooses (a), only the key's default changes, not the installer.
   - Opting out removes exactly the installer's hook objects, matched by exact command.
   - The doctor row `mailbox-hook` reports `not enabled` or `enabled`. The Codex row stays plain.
3. **M1.** The `mailbox` section is registered empty: overrides only. The loader treats an empty section as no override. The shared fixture `contracts/fixtures/config/mailbox-section.v1.json`, which only mirrored the copied values, is retired; the loader's own test owns the empty section.
4. **M2.**
   - `main_checkout_root` resolves a back-link that git wrote relative to the admin directory, then compares real paths. This change goes to OPC `forgent-35` for review.
   - A submodule stays refused, with its own cause (`trusted-main-gitfile-unsupported`). Supporting it would change the Git driver's trust rule for a gitfile with no `commondir`, which is the Git lane's decision.
   - The verbs answer a place with no record from the new contract text `[record.unavailable]`. This covers no repository, no `.fgos`, and an unsupported checkout. The text never says "try once more".
5. **M3.** The smallest honest option is a file, not a log line. The latest call that skipped or failed its drain writes one JSON object to `runtime/mailbox/hook-outcome.json`, written like the breaker file. Benign calls and the doctor probe write nothing, and the file goes only into an existing mailbox directory. This closes V4 M6.
6. **M4.** One `[Unreleased]` line in `CHANGELOG.md`.
7. **Lows.**
   - **L1:** the entry wraps its run in `catch_unwind` and exits 0. There is no test: no product path can trigger a panic without a test-only switch.
   - **L2:** `CLAUDE_PROJECT_DIR` is read for Claude Code only.
   - **L3:** facts measured on another platform are not used.
   - **L5:** the shim is replaced through `fgos_durable_file`. This goes to DIST for review.
   - **L6a:** a native flag gate never lists a positional parameter.
   - **L6b:** repeated hook flags are proven to be usage errors.
   - **L6c:** only a call that reached the record resets the breaker.
   - **L4:** documented in spec §8.

## Notes

- **Commits:**

  | Commit | Item |
  |---|---|
  | `2cae00341` | H1 |
  | `0f7adfd51` | H2 and M1 |
  | `6b47b1903` | M2, Git part, for OPC review |
  | `82d1286cb` | M2, permanent text |
  | `23bcaab47` | M3 and L6c, store |
  | `d7669af40` | M3 wiring, L1, L2 |
  | `02ecf25b2` and `33ee702bb` | L3 |
  | `a8e3ff321` | L6a |
  | `fbcbe4665` | L6b |
  | `b0e39084a` | L5, for DIST review |
  | `ee94a7d34` | M4 |
  | the docs commit | spec and phase file |

- **Mutants:** 24 killed, 0 survived.

  | Item | Killed |
  |---|---|
  | H1 | 2 |
  | H2 and M1 | 7 |
  | M2, Git part | 3 |
  | M2, permanent text | 2 |
  | M3, L2, L6c | 7 |
  | L3 | 1 |
  | L6b | 2 |

  - L5 and L6a are shown by their tests failing before the fix.
  - L1 has no mutant, for the reason given in decision 7.
- **The live harness opts its cases in** (`mailbox.enabled: true`). It could not be dry-run: Claude Code on this machine moved to 2.1.309, which is not under `testedAgainst`. Adding that version needs a recording run (a live invocation), and that waits for the controller.
