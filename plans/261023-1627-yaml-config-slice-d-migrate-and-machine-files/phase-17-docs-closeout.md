# Phase 17: Spec status, docs, board, closeout, final gates

Depends on all phases except 16 (parked on G-D1 by default). Suggested executor: haiku for the text edits, sonnet for the final gates and the board. AGENTS.md L5 question 6: a settled decision goes to the decision record, a settled spec fact into the owning spec.

## Files it may touch

`docs/platform/config/spec.md`, `docs/specs/confinement-authority.md` (status only; the amendment landed in phase 01), `docs/platform/secrets/spec.md` (status line only), `docs/specs/distribution.md` (row 5b: the token file and `private/`; row 7: the new rows; one decision-history line), `docs/specs/runner.md` (the account inventory location sentences: RUL65b and neighbours that say `~/.fgos/config.json`; read first, edit the smallest owning sentences), `docs/specs/reading-map.md`, `docs/platform/component-boundary.md` (Config row), `docs/backlog.md` (p-a189ff31), `CHANGELOG.md`, board `plan.md` (CFG row, shared-file table row, G6 note) and `log.md`, `test/suite-baseline.json` only if the baseline lists test files by name and the new tests need entries (read it; phase 00 checks).

## Edits (each re-verified against the tree at edit time)

1. **Config spec header and status.** `Implementation status`: crate additions done (machine files, two-stage moves, comment renderer, project migration, doctor rows, native verbs); native door `config` namespace has `check`, `fix`, `accounts` (Slice C adds the rest); readers of accounts and token moved; live migration of this repository per G-D1. Section 11: the doctor-row sentence now says the rows are computed in Rust and registered by `src/setup/config-checks.mjs` (D25). Section 13: amend three sentences with the decisions D9 (two stages and the flag), D12 (`[migrate]` tag in the reason after the actor), D15 (`$comment` text not equal to the render becomes a free note), D14 (global-only values in a project file), D16 (backup names), D17 (`--dry-run`). Section 16: G6 -> done with the date, the probe evidence line and the commit. Section 18: one dated decision-history line naming D1-D25's spec-visible ones and pointing to this plan.
2. **Confinement spec status.** The header `coverage` and the section 9.3 text confirm "implemented"; section 13 settled facts gets one line with the date and the live probe result.
3. **Distribution spec.** Row 5b: a second row or sentence for `~/.fgos/private/` (0700) with `accounts.yaml` and `gateway-token`, created by `fgos setup` through the doctor fix; row 7: add `config-parse`, `config-schema`, `config-legacy-shadowed`, `config-format-legacy-json`, `config-doc-drift`, `config-comment-missing-doc`, `config-comment-missing-why`, `config-comment-migrated-why`, `config-unknown-key`, `config-redundant-value`, `config-key-in-wrong-file`, `config-global-permissions`, `config-secret-outside-private`, `config-migrate-backup-stale`, `config-machine-files` and note that `gateway-token-configured` now reads the token file ("a module adding one updates this row in the same change").
4. **Runner spec, backlog, reading-map, component-boundary.** Smallest owning sentences; keep each file's language (Vietnamese in reading-map and the board).
5. **CHANGELOG.md `## [Unreleased]`** (users see these): the new `fgos config` verbs; `~/.fgos/private/` with `accounts.yaml` and `gateway-token`; the gateway reads the token file; account pools read from `accounts.yaml`; confined workers cannot read `~/.fgos/private`; new doctor rows; `fgos setup` creates the machine files; `gateway` is no longer seeded into config files. Link the rollout guide.
6. **Board.** CFG row: Slice D landed with the date, what is parked (phase 16 on G-D1, stage 2 per machine on G-D3), the next step Slice C with the adjusted scope list from plan.md; shared-file table row: add CFG to the confinement files and `command-route*.json` entries; `log.md`: one line at the top with the commit, the probe evidence, the four budget numbers and the facts that surprised the plan (found in phase 00: the `gateway` default seeds a global-only key into every project file; the checks module is a shim).
7. **Decisions.** If `fgos decision-index` covers the amended specs, run it and commit its output (the repo regenerates the projection); no hand edits to `docs/decisions/`.
8. **Idea items.** Open backlog items for the ideas the owner picks (I1-I6) and for the tùm lum seen outside scope; none is built here.

## Final gates (sequential; `free -g` first, at least 8 GB available)

1. Crate: `cargo test -p fgos-config --jobs 4` (also `--features host-provider`); `cargo clippy -p fgos-config --jobs 4 -- -D warnings`; `cargo fmt --check -p fgos-config`; `cargo test -p fgos --jobs 4`; `cargo test --manifest-path apps/fgos-gateway/Cargo.toml --jobs 4`; `cargo deny --config .github/cargo-deny.toml check advisories bans sources` (the new packages are none beyond what Slice B listed; if `cargo-deny` is not installed say so, as Slice A did).
2. Node: the focused files first (`node --test` over the confinement, config, setup files named in phases 02, 03, 07, 11-13), then merge `origin/main` and re-run step 1 if Rust changed.
3. `cargo test --workspace --jobs 4` in the background through the harness; wait on the returned PID; read the exit code on the very next statement.
4. Only after it finished: `npm test` the same way. Never both at once. The 18 red cases that were red before (backlog p-5d2e1c9a) are named and not made worse; a new red case is fixed, never weakened.
5. Count and record the budget: the Rust source command in plan.md (delta), Rust test lines (`find packages/config/rust/tests apps/fgos/tests -name '*.rs' | xargs wc -l`, delta), fixture lines, Node source and test lines. Over 2,900 Rust source lines is a stop-and-report, not a landing.
6. Re-run the plan's success-criteria commands and record each result in the landing commit or the board line; include the probe output of phase 02 and the machine evidence of phase 15.
7. Merge to main from the linked worktree per the board's landing rules (a landing that changes confinement argv and the readers is a "stops everything" landing: sequential across the three workspaces, owner picks the time); post the board line.

## Owning proofs

None added; this phase verifies. Spec facts are checked by `rg` at edit time and again in step 6.

## Validation

All gates green; spec links resolve (spot check with `rg -n "](" <edited file>`); the board row and log line exist; `fgos doctor` on the main machine shows the new rows green or warn as planned; `fgos config check` on this repository reports exactly the findings the plan lists until phase 16 runs.

## Risk

| Risk | L x I | Mitigation |
|---|---|---|
| Spec edits collide with HARDEN or DOC edits to `docs/platform/*/spec.md` | M x L | send the diff before merge; land second rebases and re-reads meaning |
| `cargo test --workspace` or `npm test` fails for a reason outside this slice | M x M | read the failure, record the commit that introduced it, ask; never weaken a test |
| Out of RAM | M x H | `free -g` gate, `--jobs 4`, sequential gates |

## Rollback

Revert the docs commit; the code facts are true independently, so a revert is needed only if a fact turns out wrong.
