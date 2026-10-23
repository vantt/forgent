# Phase 14: Spec amendment, docs, board, closeout, final gates

Depends on all. The spec amendments (steps 1-3) do not depend on the owner's answer in phase 13 and may land earlier, as soon as phase 00 has recorded the facts; steps 4-6 wait for every phase. Suggested executor: haiku for the text edits (exact wording below), sonnet for the final gates and the board.

## Context

AGENTS.md L5 question 6 (what learning is left behind) and the platform rule that a settled spec fact goes into the owning spec. Two claims in `docs/platform/config/spec.md` are stale, and the slice settled several facts inside the spec's silence. Amendments go through "Lịch sử quyết định", never silently (spec header).

## Files it may touch

`docs/platform/config/spec.md`, `docs/specs/reading-map.md`, `docs/platform/component-boundary.md` (the Config row only), `plans/261017-1313-fgos-platform-program-board/plan.md` (CFG row, shared-file table row for the registry), `plans/261017-1313-fgos-platform-program-board/log.md` (one line at the top). `CHANGELOG.md`: no line (nothing a user of fgOS sees changes: no consumer links the crate, no file or default changes; stated in the commit message so the next reader does not re-ask).

## Amendments to the Config spec (each re-verified against the tree at edit time)

1. **Section 10 replaced** by "Holder-lock bootstrap (settled)": Holder-lock no longer reads config. Commit `a620881e7` (2026-10-22) deleted `lock.predecessorKillWaitMs`, its reader `readPredecessorKillWaitMs` and the doctor row `lock-predecessor-kill-wait`; every caller waits `DEFAULT_KILL_WAIT_MS` (2000 ms, `src/holder-lock/protocol.mjs:18`, used at `src/holder-lock/index.mjs:198`). Config takes its locks through `LockScope` with the same constant, so there is no cycle and no `lock` descriptor; a file that still carries `lock.predecessorKillWaitMs` holds an undescribed key, which migration drops. Section numbers 11-18 keep their numbers. Before writing, re-run `rg -n "readPredecessorKillWaitMs|predecessorKillWaitMs" src packages apps test --glob '!target'` and `rg -n "config\.json|readSharedConfig|loadGlobalConfig" src/holder-lock packages/holder-lock --glob '!target'`; both must find nothing, else stop and say what remains.
2. **Acceptance 11** becomes: "Config's own lock acquisition does not read config, and no Holder-lock path reads config (the `rg` in section 10 finds nothing)."
3. **Section 4 counts and rules.** Replace "The 15 `registerConfigDefault` calls in `src/setup/registrations.mjs` become descriptors in the first slice; the hand-written merge rules (`sanitizeGlobal`, the global-only account inventory, the `sectionOf` copies in `terminal-control`, `holder-lock-checks` and `run-supervisor-checks`) become descriptor fields." with: "The 14 `registerConfigDefault` calls in `src/setup/registrations.mjs` become descriptors in the first slice (the config file has 15 top-level sections; `lock` has no registration and is retired, section 10). The hand-written merge rules become descriptor fields or are retired: the seat-binding capability keys refused in the global file become `scope: project-only`; the account inventory becomes `file: accounts` with `scope: global-only`; the one remaining `sectionOf` copy (`terminal-control`) and `mergeWithGlobalConfig`'s fill-missing merge are the merge primitive's own defaults; the `runner.rigorToTier`, stale-tier-key and extended-cell filters of `sanitizeGlobal` serve older releases on the machine and are not fields." Add three sentences to the dialect description: an entry that does not state `scope`, `sensitivity`, `file` or `merge` inherits it from the nearest ancestor entry (D20); a map entry may be set to `null` by a file only where the `<any>` child lists `values: [null]` (D16); a descriptor keeps `scope: both` on a non-public key only with a `justification` text (D5, the field spec section 3 rule 1 already presupposed). Add `justification` to the field table.
4. **Header lines.** `Implementation status`: "Slice A (YAML Document) and Slice B (crate `fgos-config`: descriptors, standard, snapshot, write transaction, locks `project-config` and `global-config`) done; Node door, migration, doctor checks and `~/.fgos/private` not started". `Source (planned)` and `Contracts (planned)` lose "(planned)". `Last reviewed` set to the landing date.
5. **Decision history, one dated line** (landing date), listing: section 10 replaced by the settled fact and why (the commit); the registration count corrected from 15 to 14 and what 15 and 17 were (definition and error strings); `sectionOf` sentence corrected; rank-80 leaf rows and the owner value `config`; D5, D10, D16, D19, D20, D11 and D17 each in one clause; the write refusal for legacy JSON and its sequencing consequence for Slice C (so a reader of the spec finds it); pointer to this plan.
6. **Gates table, section 16:** no change in G-numbers; add nothing.

## Other edits

- `docs/specs/reading-map.md` line for the Config spec: status "crate xong ở Slice B (fgos-config, `core/config-schema/`, hai lock), cửa Node/migrate/doctor chưa làm"; add `packages/config/rust` and `packages/config/contracts` as source and contracts; keep the file's Vietnamese.
- `docs/platform/component-boundary.md` Config row: same status wording as the YAML Document row got in Slice A (grep `config/spec.md` for the row).
- Board `plan.md` CFG row: Slice B landed with the date, the next step "Slice C: native door `config` namespace and facade", the two owner action items (remove `runner.rigorToTier` from global files before Slice C; the dead `lock.predecessorKillWaitMs` in the project file), the unresolved Slice C questions of this plan (confined fact, C/D sequencing). The shared-file table row for `lock-registry*.json`: add CFG to the lanes that touched it. Board `log.md`: one line at the top (`- YYYY-MM-DD HH:MM (session, lane CFG): ...`, newest first) naming the landing commit, the amended spec sections and the facts in this plan's phase 00 (14 calls, section 10 settled).
- Doc registry: run `fgos doctor` (or the doc-registry check the repo uses; `docRegistry.enforce` is true in the project config) after adding the contract `README.md`; add registry entries only if the check asks.
- Packaging: `test/install-packaging.test.mjs` and `release-tree.test.mjs` mention the lock registry; run them (alone) to confirm the release payload still lists `core/config-schema/` where `core/` is copied (descriptors are `include_str!`-ed into the crate, so they need not ship as files, but the tree test must not trip on new top-level paths).

## Final gates (sequential; `free -g` first, at least 8 GB available)

1. Crate: `cargo test -p fgos-config --jobs 4`; `cargo clippy -p fgos-config --jobs 4 -- -D warnings`; `cargo fmt --check -p fgos-config`; `cargo deny --config .github/cargo-deny.toml check advisories bans sources` (no new crate expected: `Cargo.lock` diff is the new package entry only; if `cargo-deny` is not installed on this machine, say so, as Slice A did).
2. Merge `origin/main`; re-run step 1 if the merge brought Rust changes.
3. `cargo test --workspace --jobs 4` in the background through the harness; wait on the returned PID; read its exit code on the very next statement.
4. Only after it finished: `npm test` the same way. Never both at once.
5. Re-run the success criteria commands of plan.md and record each result in the landing commit message or the board log line.
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
