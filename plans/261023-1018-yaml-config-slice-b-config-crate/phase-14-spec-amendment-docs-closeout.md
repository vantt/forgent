# Phase 14: Spec status, docs, board, closeout, final gates

Depends on all. The spec amendments that settled facts (section 10 replaced by the Holder-lock fact, acceptance 11, the registration count of 14, the one `sectionOf` copy, and the JSON Schema section 4 with its decision-history lines) were made on 2026-10-23 at the owner's JSON Schema decision, not here. This phase only verifies they still hold, records the landing in the spec header and history, and closes the docs and board. Suggested executor: haiku for the text edits, sonnet for the final gates and the board.

## Context

AGENTS.md L5 question 6 (what learning is left behind) and the platform rule that a settled spec fact goes into the owning spec. Amendments go through "Lịch sử quyết định", never silently (spec header).

## Files it may touch

`docs/platform/config/spec.md`, `docs/specs/reading-map.md`, `docs/platform/component-boundary.md` (the Config row only), `plans/261017-1313-fgos-platform-program-board/plan.md` (CFG row, shared-file table row for the registry), `plans/261017-1313-fgos-platform-program-board/log.md` (one line at the top). `CHANGELOG.md`: no line (nothing a user of fgOS sees changes: no consumer links the crate, no file or default changes; stated in the commit message so the next reader does not re-ask).

## Spec edits (each re-verified against the tree at edit time)

1. **Re-verify, do not rewrite.** `rg -n "readPredecessorKillWaitMs|predecessorKillWaitMs" src packages apps test --glob '!target'` and `grep -c "^registerConfigDefault(" src/setup/registrations.mjs` (14) and `rg -n "sectionOf" src` (only `src/terminal-control/config.mjs:40`) still match section 10, acceptance 11 and section 4 as amended. If one no longer holds, stop and say what changed.
2. **Header lines.** `Implementation status`: "Slice A (YAML Document) and Slice B (crate `fgos-config`: section schemas as JSON Schema, standard, snapshot, write transaction, locks `project-config` and `global-config`) done; Node door, migration, doctor checks and `~/.fgos/private` not started". `Source (planned)` and `Contracts (planned)` lose "(planned)". `Last reviewed` set to the landing date.
3. **Decision history, one dated line** (landing date): the settled-inside-the-silence decisions of this slice a reader of the spec would otherwise miss, each in one clause: `x-fgos-justification` (D5), the legacy-JSON write refusal and its sequencing consequence for Slice C (D11), Durable File owns open-beneath (D17), scope inheritance from ancestor schema nodes (D20), null permission by `type` containing `"null"` (D16), validation on the effective value with findings reduced to keyword and paths (D22, D23), rank-80 lock rows and owner value `config`, the validator crate and version recorded in `packages/config/upgrade-record.md` (phase 03); pointer to this plan.
4. **Gates table, section 16:** no change in G-numbers; add nothing.

## Other edits

- `docs/specs/reading-map.md` line for the Config spec: status "crate xong ở Slice B (fgos-config, `core/config-schema/`, hai lock), cửa Node/migrate/doctor chưa làm"; add `packages/config/rust` and `packages/config/contracts` as source and contracts; keep the file's Vietnamese.
- `docs/platform/component-boundary.md` Config row: same status wording as the YAML Document row got in Slice A (grep `config/spec.md` for the row).
- Board `plan.md` CFG row: Slice B landed with the date, the next step "Slice C: native door `config` namespace and facade", the two owner action items (remove `runner.rigorToTier` from global files before Slice C; the dead `lock.predecessorKillWaitMs` in the project file), the unresolved Slice C questions of this plan (confined fact, C/D sequencing). The shared-file table row for `lock-registry*.json`: add CFG to the lanes that touched it. Board `log.md`: one line at the top (`- YYYY-MM-DD HH:MM (session, lane CFG): ...`, newest first) naming the landing commit, the amended spec sections and the facts in this plan's phase 00 (14 calls, section 10 settled).
- Doc registry: run `fgos doctor` (or the doc-registry check the repo uses; `docRegistry.enforce` is true in the project config) after adding the contract `README.md`; add registry entries only if the check asks.
- Packaging: `test/install-packaging.test.mjs` and `release-tree.test.mjs` mention the lock registry; run them (alone) to confirm the release payload still lists `core/config-schema/` where `core/` is copied (section schemas are `include_str!`-ed into the crate, so they need not ship as files, but the tree test must not trip on new top-level paths).

## Final gates (sequential; `free -g` first, at least 8 GB available)

1. Crate: `cargo test -p fgos-config --jobs 4`; `cargo clippy -p fgos-config --jobs 4 -- -D warnings`; `cargo fmt --check -p fgos-config`; `cargo deny --config .github/cargo-deny.toml check advisories bans sources` (new packages are `fgos-config` and exactly the validator crate and transitive crates listed in `packages/config/upgrade-record.md`, nothing else; if `cargo-deny` is not installed on this machine, say so, as Slice A did).
2. Merge `origin/main`; re-run step 1 if the merge brought Rust changes.
3. `cargo test --workspace --jobs 4` in the background through the harness; wait on the returned PID; read its exit code on the very next statement.
4. Only after it finished: `npm test` the same way. Never both at once.
5. Count and record the budget (plan.md "Budget"): Rust source lines (the command in plan.md), Rust test lines, schema YAML lines; the landing commit message and board line carry the three numbers. Over 1,500 source lines is a stop-and-report, not a landing.
5b. Re-run the success criteria commands of plan.md and record each result in the landing commit message or the board log line.
6. Merge to main from the linked worktree per the board's landing rules (this slice stops no workspace and needs no activation: nothing links the crate); post the board line.

## Owning proofs

This phase adds none. Spec facts are verified by `rg` at edit time and again in step 5; the behaviour proofs are the earlier phases'.

## Validation

All gates green; spec links resolve (`rg -n "](" docs/platform/config/spec.md` spot check of the edited sections); the board row and log line exist.

## Risk

| Risk | L x I | Mitigation |
|---|---|---|
| Spec edit collides with HARDEN or DOC edits to `docs/platform/*/spec.md` (board shared-file table) | M x L | send HARDEN and DOC the diff before merge; land second means rebase and re-check meaning |
| `cargo test --workspace` fails for a reason outside this slice | M x M | read the failure; if unrelated to `fgos-config`, record it with the commit that introduced it and ask; never weaken a test |
| Out of RAM | M x H | `free -g` gate, `--jobs 4`, sequential gates |

## Rollback

Revert the docs commit (spec, reading-map, component-boundary, board). The amended facts are true independently of the crate, so reverting is only needed if a fact turns out wrong.
