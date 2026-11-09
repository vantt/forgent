---
phase: 05
title: "Config door ergonomics: unknown keys are refused with a did-you-mean, the reason error names the flag, explain resolves runtime keys"
status: pending
depends_on: []
parallel: "group G1 with P03 and P09; touches only packages/config and one cli test"
effort: ~0.5d
net_size: "Rust about +60 / Node 0 / tests about +40 (estimate)"
---

# Phase 05 - Config door (F7, T3 config layer)

## Context

UX-15, CMD-10. Live run: `fgos config set dispatch.cancelWaitM ...` writes the typo, `config check` then warns `unknown` with `fix: null`; `config set` without `--reason` fails with `config-comment-reason-required` and no fix (`packages/config/rust/src/write.rs:27`, `grammar.rs:13`; asserted at `apps/fgos/tests/cli_tests.rs:2385`); `config explain dispatch.cancelWaitMs` answers `described: false` for a key doctor reports with a default `[AUDIT]`. `config edit` is not here: it is a new verb and sits in Owner ideas.

The Vietnamese `config` error the user saw is `bin/fgos.mjs:5216` (`chỉ có ở Rust host`, the npm channel), handled in P07. `packages/config/rust/src` contains no Vietnamese (grep checked).

## Requirements

1. `config set` and `config patch` of a key the schema does not define are refused, listing the nearest keys (pure edit-distance function over the schema's key paths). Step 1 reads the schema for legitimate free-form keys (`additionalProperties`); only if one exists, a documented opt-out is added; otherwise no new flag (RUL104).
2. The reason error reads `config-comment-reason-required: add --reason "<why>"`.
3. `config explain <key>` resolves a runtime key or names the schema that owns it, instead of `described: false`.
4. Errors report every problem at once where the write has several (CMD-10).

## Files

**Modify:** `packages/config/rust/src/write.rs`, `grammar.rs` or the schema owner (step 1), `apps/fgos/tests/cli_tests.rs` (extend the `:2385` case), `CHANGELOG.md`.
**Create:** none. **Delete:** none.
**Tests to retire:** none; the existing reason test gains the new text assertion.

## Red tests first

In the config crate's tests (owner of the behaviour): a typo key is refused with the right suggestion; a valid key still writes; the reason error contains `--reason`; explain of a runtime key is described. One wiring assertion in `cli_tests.rs`.

## Net size

Rust about +60 (suggest 30, refuse 15, explain 15); tests about +40.

## Steps

1. Read the schema key source and `explain`'s lookup. 2. Red tests. 3. Implement. 4. CHANGELOG.

## Validation

FR config crate tests and `apps/fgos/tests/cli_tests.rs`; scratch-HOME `fgos config set dispatch.cancelWaitM 5 --reason x` by hand.

## Risks

| Risk | L x I | Mitigation |
|---|---|---|
| Refusing unknown keys breaks a flow that writes extension keys | Low x Med | step 1 greps writers (`rg "config set" scripts src docs`); the schema decides |
| Config layer is T3; T9 and WORK read it | Low x Low | contract unchanged for valid keys |

## Rollback

Revert; nothing persisted differently.

## Closes

UX-15, CMD-10 (config reason).
