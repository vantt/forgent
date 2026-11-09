---
phase: 15
title: "One symlink-refusal leaf for the distribution build script and the skill wrappers"
status: completed (landed 184d50017)
depends_on: ["T8's writers on `src/setup/skill-wrappers.mjs` landed (T8 P01-P03, P11 are on main; re-check with `git log -S'lstatPlain' origin/main -- src/setup/skill-wrappers.mjs` before editing)"]
parallel: "packaging leaf; file-disjoint from every phase here except `skill-wrappers.mjs`, which T8's render phase (P12) only regenerates around"
effort: ~0.25d
net_size: "Node about -12; Rust 0; tests about +8 (the leaf's own test; a new module, so a new file is allowed by principle 8)"
---

# Phase 15 - Symlink-refusal leaf (T9-19, baseline D8, simplicity B13)

## Context

Two places refuse a symlink with their own copy: `scripts/build-rust-distribution.mjs:151,245,370,396` and `src/setup/skill-wrappers.mjs:55` (`lstatPlain`, with its caller at `:70`). One door, principle 1: a leaf both import.

## Requirements

1. New `src/util/refuse-symlink.mjs` with the one function (named after what it does: it lstat-s a path, returns the stat or `null` when absent as `lstatPlain` does at `skill-wrappers.mjs:55-67`, and throws a named refusal naming the path for a link). One message shape; the build script's four sites (`:151-152`, `:245-246`, `:370-371`, `:396`) differ in wording today, so any test that asserts their old text is updated to the leaf's and named.
2. `scripts/build-rust-distribution.mjs` and `src/setup/skill-wrappers.mjs` import it; their private copies go. Layer check: a `scripts/` file importing `src/util` is a downward import; run `test/architecture.test.mjs`.

## Files

**Create:** `src/util/refuse-symlink.mjs`, its test `test/util/refuse-symlink.test.mjs`.

**Modify:** `scripts/build-rust-distribution.mjs`, `src/setup/skill-wrappers.mjs` (one import and the deleted function), `docs/architecture-manifest.json` (row for the leaf), `packages/git/contracts/mutation-census.v1.json` (regenerate if a hashed file changes).

**Delete:** the private `lstatPlain` and the script's inline copies.

**Tests to retire:** none; the existing link-refusal cases in `test/setup/skill-wrappers.test.mjs` and the distribution script's test keep their assertions (they now pass through the leaf; the leaf's own test is the single owner of the refusal logic and says why in its title).

## Red tests first

The leaf's test: a regular file passes, a symlink to a file is refused by name, a symlink to a directory is refused, a missing path throws the same error as `lstat`.

## Net size

Node about -12 (four inline copies -22, leaf +10); tests +8.

## Steps

1. `rg -n "isSymbolicLink|lstatSync" scripts/build-rust-distribution.mjs src/setup/skill-wrappers.mjs` with `file:line`; confirm the four script sites and the one setup site are the same check.
2. Red test; leaf; import; delete; manifest; census.

## Validation (focused)

FR `test/util/refuse-symlink.test.mjs test/setup/skill-wrappers.test.mjs test/architecture.test.mjs` plus the distribution script's test (`rg -l "build-rust-distribution" test`); land gate. No `build:skills` run (T8 P12 owns it).

## Risks

| Risk | L x I | Mitigation |
|---|---|---|
| T8 P12 re-renders while this edits `skill-wrappers.mjs` | L x L | one import line plus a deletion; the later merger rebases; no generated surface touched |

## Rollback

Revert the merge commit.

## Done when

Red then green; `rg -n "lstatPlain" src scripts` nothing.
