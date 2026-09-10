# Phase 01 — Command-Route Descriptor Generator

Depends on: Phase 00 closed.

## Objective

Generate one checked `CommandRouteDescriptor` artifact from the live Node
command registry plus explicit migration annotations, so no cell hand-
maintains a second command list. This is the routing input every later
Rust/harness cell reads to know which selectors are `legacy-cli` vs.
`native`.

## Requirements

- R1: `packages/host-runtime/contracts/command-route-annotations.json`
  annotates only `version` (`route_kind: "native"`,
  `operation_id: "distribution.build.show"`); every other of the 73
  `COMMAND_REGISTRY` selectors is unannotated and defaults to `legacy-cli`.
- R2: `scripts/export-command-selectors.mjs` reads
  `src/cli/command-registry.mjs`'s `COMMAND_REGISTRY` plus the annotations
  file and emits `packages/host-runtime/contracts/command-routes.json`: one
  object per selector with `selector`, `route_kind` (`legacy-cli` |
  `native`), `operation_id` (native only), `legacy_payload` (`"legacy-node"`,
  legacy-cli only), `owner_path`, `compatibility_tests` (non-empty array) —
  field set matches `legacy-cli-transition.md` §2's minimum-fields block. A
  `sub`-positional selector stays one entry (see P00 R2).
- R3: Output key order is deterministic (selectors sorted lexicographically)
  so an unchanged registry regenerates byte-identical output.
- R4: `--check` regenerates in memory, diffs against the committed file, and
  exits non-zero with a summary of the diff on drift; exits 0 silently when
  clean.
- R5: The generator fails the process (exit non-zero, no partial file
  written) when: an annotation names a selector absent from
  `COMMAND_REGISTRY` (stale annotation), an annotation declares more than
  one `route_kind` for the same selector (double-bound), or any
  `COMMAND_REGISTRY` selector ends up with no route in the output (unlisted
  selector — should be structurally impossible given R1's default, but the
  generator asserts it rather than assuming it).
- R6: `scripts/explain-command-route.mjs <selector>` reads only the
  committed `command-routes.json` (never re-derives from the registry) and
  prints `route_kind`, `owner_path`, `legacy_payload`-or-`operation_id`, and
  `compatibility_tests` for that selector; exits non-zero with a clear
  message for an unknown selector.
- R7: `test/rust-host/command-routes.test.mjs` proves: drift detection (a
  mutated copy of the committed file fails `--check`), an unlisted selector
  fails the build, a double-annotated selector fails the build, and all 73
  `COMMAND_REGISTRY` selectors — including every `sub`-positional one —
  appear exactly once in the generated output.

## Files

Likely touch:

- `scripts/export-command-selectors.mjs` (new)
- `scripts/explain-command-route.mjs` (new)
- `packages/host-runtime/contracts/command-route-annotations.json` (new)
- `packages/host-runtime/contracts/command-routes.json` (new, generated + committed)
- `test/rust-host/command-routes.test.mjs` (new)

Do not touch:

- `src/cli/command-registry.mjs` (read-only input to the generator)
- `apps/fgos/**`, `packages/host-runtime/rust/**`, `packages/distribution/rust/**`, `Cargo.*` (rust-kernel/rust-workspace lease)
- `plans/260910-1700-rust-host-r1-kernel/plan.md`

## Verification

```sh
node scripts/export-command-selectors.mjs --check
node --test test/rust-host/command-routes.test.mjs
node scripts/explain-command-route.mjs version
node scripts/explain-command-route.mjs bogus-selector; echo "exit=$?"
```

- The `--check` run exits 0 against the committed artifact.
- `command-routes.test.mjs` passes, including the drift/unlisted/double-bound
  negative cases.
- `explain-command-route.mjs version` prints `route_kind: native` and
  `operation_id: distribution.build.show`; the bogus-selector call exits
  non-zero.
- Capability annotation for this cell: `code:implement`.
