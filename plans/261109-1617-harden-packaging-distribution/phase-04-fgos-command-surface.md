---
phase: 04
title: "fgos command surface: --version, Get started on no args, per-verb help, setup out of the help list, no ANSI off a TTY, did-you-mean"
status: pending
depends_on: ["in-flight (1) landed (apps/fgos/src/main.rs)", "in-flight (2) landed (command registry)", "P02 landed (bin/fgos.mjs chain)"]
parallel: "group G3 with P06"
effort: ~1d
net_size: "Node about +40 / Rust about +70 / tests about +60; about -10 deleted prose (estimate)"
---

# Phase 04 - fgos command surface (F3, fgos half)

## Context

CMD-04, CMD-06, CMD-15, CMD-16, CMD-09, CMD-12. `fgos --version` answers `unknown verb "--version"` with exit 4 (`apps/fgos/src/main.rs:236-262`; asserted at `apps/fgos/tests/cli_tests.rs:121` and `:480`); the `version` verb is `bin/fgos.mjs:1001`; `fgos` with no args is `unknown verb ""`; `fgos --help` is 513 lines `[AUDIT]`; per-verb help is four lines each and is the "manifest door" that refuses with exit 4 (`bin/fgos.mjs` `refuseHelp`, about `:4604`); `fgos setup` is a visible verb and a README step (`src/cli/command-registry.mjs:2222-2235`, flagged `deprecated`); ANSI is written to a non-TTY (`src/setup/ansi.mjs` exists).

**Exit code (Q-A).** `EXIT_CODES.precondition` is already 2 in the one map (`src/state/store.mjs:53`), and 4 is `validation`, which usage errors share today. Default: keep 4 for `fgos`, record the deviation from CMD-08 in the checklist; apply 2 only if the owner answers Q-A that way (then every caller and the two cli tests move in this phase).

## Requirements

1. `fgos --version` is `fgos version`: the Rust host maps the flag to the `version` route (one place). `version --json` carries a non-null `gitCommit` in a release (VER-04 SHOULD; only if the build already knows it, else reported).
2. No args: "Get started" (3 steps, the same as P03, P06, README) and "Agents / automation" (`fgctl init`, `fgos doctor --json`, run each `next`), exit 0 (CMD-15, CMD-19).
3. `init`, `doctor`, `config`, `uninstall`, `run` help carries the CMD-16 fields, sourced from the one command-registry entry (the help door stays outside the envelope, as its comment says). `uninstall`'s text is written in P08.
4. `setup`: listed under a single "Compatibility" line, not among the verbs; behaviour unchanged. Step 1 reads how help is generated (`apps/fgos/src/cli_presenter.rs` `[UNVERIFIED]`, `src/cli/command-registry.mjs`); a `hidden` flag is added only if the existing `deprecated` field cannot do it, and the report says so.
5. No ANSI when stdout is not a TTY or `NO_COLOR` is set: one gate in `src/setup/ansi.mjs`.
6. Unknown verb or flag: did-you-mean over the route table (`command_routes()`), exit per Q-A.

## Files

**Modify:** `apps/fgos/src/main.rs` (after in-flight (1)), `bin/fgos.mjs` (`version`, help refusal; calls only), `src/cli/command-registry.mjs` (after in-flight (2)), `src/setup/ansi.mjs`, `apps/fgos/tests/cli_tests.rs`, `CHANGELOG.md`.
**Create:** none. **Delete:** the long `setup` deprecation prose (kept as one pointer line).
**Tests to retire:** none; the two exit-4 assertions stay if Q-A keeps 4.

## Red tests first

`apps/fgos/tests/cli_tests.rs`: `--version` exits 0 and matches `version`; no args exits 0 and lists the 3 steps; `doctr` prints `did you mean doctor`. `test/setup/ansi.test.mjs`: `NO_COLOR` and non-TTY give plain text. Help-field tests extend the registry help test (step 1 names it).

## Net size

Node about +40, Rust about +70, tests about +60, about -10 prose.

## Steps

1. Read help generation and the exit-4 call sites (`rg "exit(4)" apps/fgos/src`: 6 sites at `main.rs:247,260,378,386,393,423`). 2. Red tests. 3. Host, registry, ansi. 4. CHANGELOG.

## Validation

FR `apps/fgos/tests/cli_tests.rs`, `test/setup/ansi.test.mjs`, the registry help test, `test/architecture.test.mjs`; `fgos`, `fgos --version`, `fgos doctor --help`, `fgos doctr` by hand through `npm run fgos:dev --`.

## Risks

| Risk | L x I | Mitigation |
|---|---|---|
| Exit 2 collides with `precondition` | High x Med | Q-A default keeps 4 |
| Registry and help edits collide with T9 and in-flight (2) | Med x Med | chain; arms touched only as calls; T9 notified |
| Hiding `setup` strands users of the legacy path | Low x Low | still callable; listed under Compatibility |

## Rollback

Revert the merge.

## Closes

CMD-04, CMD-06, CMD-15, CMD-16 (fgos side); CMD-09 and CMD-12 partials; CMD-19 (SHOULD). CMD-08 for fgos only if Q-A moves to 2.
