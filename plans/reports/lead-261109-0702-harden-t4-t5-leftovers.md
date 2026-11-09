# HARDEN lead: T4 and T5 leftovers

Machine fg-server2, branch `harden/t6-leftovers` on origin/main `b7c7c372c`, 2026-11-09 07:02 (Asia/Saigon).

## Result

| Item | State on main | Evidence |
|---|---|---|
| T5 stale comment | fixed | `runtime-inspection.mjs` doc comment on `findCoordinationSessionOwningAssignment` cut from 15 lines to 4; comment-only diff (no code line changed) |
| H-T4a addon hashed per process | still open, T9 H13 and TEST | `src/native/door.mjs:51-56` |
| H-T4b probe cache misses in tests | still open, TEST | no TEST reply on the board after 11-04 17:54; override still read in `src/runner/dispatch/confinement/attestation-store.mjs` |
| H-T4c claude.json unlocked write | closed for claude; residual for codex and agy | `9df771d3e` (claude store add-only, seeds under `agent-trust-store` lock); residual in backlog `p-dlnzf4fqru` (larger than 30 lines: two seeds and two removals plus a two-writer test) |
| H-T4d provider-capacity re-judge | closed | `4597694c0` (verdict from receipt cause); reset-time text parse stays by design, receipt has no reset time (`231c91f51`) |
| H-T4e cliSpawnAdapter | closed | `8dabc57d1`, `23740e065`; `git grep cliSpawnAdapter -- src test` empty |
| H-T4f pane of a killed controller | closed | `6349e2c8b`, `7b82bf9b2`, test `9d70a47cd` (intent records the pane slot; adopt releases it) |
| H27 (CFG) | closed | config spec section 3 (files hold only differences), CFG lane closed 10-25 |
| H28 (WORK) | closed | `ffec96b7e`; only `retired_cutover_grant` stays in `packages/git/rust/src/wal.rs:168` for old-intent digests |
| Fence probe in `identity_log.rs` | gone | `b2739a0ea`, `feb5e2d50`; no `.fgos/events` probe in `apps/fgos/src/wiring/` |

No red-test fix was needed: every small item was already fixed or is owned elsewhere.

## Gate

Focused: 8 test files that read `runtime-inspection.mjs` or the recover door, plus architecture, doc-health, citation-drift: 80 of 81 pass. The one failure (`check-decision-citation-drift` real-repo CLI run) reports D-local citations in `.agents/skills/ak-*` files, which are git-ignored AgentKit installs; nothing this change touches. Full `npm test` skipped: the only source change is a comment (verified by diff), no Rust touched.
