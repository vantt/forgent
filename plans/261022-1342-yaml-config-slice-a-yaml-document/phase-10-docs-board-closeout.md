# Phase 10: Docs, board, closeout, final gates

Depends on all phases. Suggested executor: sonnet.

## Context

AGENTS.md L5 questions 5 and 6, "Before touching code" and the board rules. Plans and reports are stateful records; the spec holds the settled fact.

## Files it may touch

- `docs/platform/yaml-document/spec.md`: header `Implementation status` ("Slice A landed: crate, fixtures, fuzz, Rust consumers moved; Node door not started"); section 9 table records the chosen candidate and its upgrade-record path (one fact line, not a copy of the record); section 15 gets one dated entry: parser choice, vendoring layout, owner sign-off date, decisions D1-D7 where they became spec-level facts (D1 node counting, D2 BOM, D5 empty comment line, D6 merge null semantics).
- `docs/platform/config/spec.md` section 13 "Tests" and section 16 "G5": mark the helper landed with the final count (one line each).
- `docs/specs/reading-map.md` line 57: "chưa thi công" changes to the landed state (crate exists; Node door pending); add the contracts path.
- `docs/platform/component-boundary.md`: record `No component-boundary change` in the implementation note unless the table lists planned components, in which case move the YAML Document row from planned to implemented (check, then edit the smallest surface).
- `CHANGELOG.md` `## [Unreleased]`: only if phase 08 found a user-visible difference.
- Board `plans/261017-1313-fgos-platform-program-board/plan.md`: update the CFG row's status cell and add one line at the top of its `log.md` (grep by lane ID, never read it whole). Edit only its own lane row; the shared-file line (128-129) names collisions: `.github/cargo-deny.toml` and `Cargo.toml` are listed for CFG.
- `plans/261022-1342-yaml-config-slice-a-yaml-document/plan.md`: statuses via `ak plan --help` contract, not by editing status cells by hand.

## Steps

1. Merge main. Re-grep every claim written in docs (`rg`, `git log`), update stale numbers.
2. Edits above; verify links with a link check over the touched files (`rg -n "\]\(" <file>` then existence test for relative targets).
3. Make touched markdown viewable (MDView `mdview_view_file`, or `mdview open`) only for the spec update if the owner wants to review.
4. Setup/doctor gate answer in the PR note: no config default, env var or infra file added; `cargo-fuzz` and nightly are upgrade-time developer tools only.
5. Final gates, strictly sequential. First `free -g` (need 8 GB available). Then in the background facility: `cargo test --workspace --locked --jobs 4`; read its exit code on the next statement; wait for it to finish completely. Only then `npm test`, same observation rule. Never both at once. Also run `cargo fmt --all -- --check` and `cargo clippy --locked --workspace --all-targets --jobs 4 -- -D warnings` before the test gates.
6. `detect_changes()` (or `git diff --stat main...`) against main to confirm only files in the ownership table changed.
7. Final message to the owner: result against the success criteria in plan.md; Follow-ups list; Ideas section pointer.

## Owning proofs

This phase adds none. It records where each proof lives: fixtures (`packages/yaml-doc/contracts`), runners (`packages/yaml-doc/rust/tests`), consumers' own suites, fuzz targets.

## Validation

`cargo test --workspace`, `npm test`, `cargo deny ... check advisories bans sources` (both manifests), plan success-criteria checklist all ticked with evidence.

## Risk

| Risk | L x I | Mitigation |
|---|---|---|
| Doc edits collide with lanes DOC and HARDEN on specs | M x L | board says HARDEN messages DOC before spec merges; here only status and history lines, rebase on conflict |
| Final suite fails for an unrelated reason (other lane's break on main) | M x M | compare with a clean main run; name the unrelated failure; do not weaken tests |

## Rollback

Revert the docs commit; code phases stand independently.
