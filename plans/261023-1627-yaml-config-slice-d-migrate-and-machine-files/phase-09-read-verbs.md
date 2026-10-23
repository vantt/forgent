# Phase 09: Native verbs, read side (`show`, `explain`, `standard`, `check`)

Depends on 08 and 03. Suggested executor: sonnet. Caps: `inspect.rs` 170, `provider.rs` 340 (shared with phase 10), `apps/fgos` projector/main/catalog 330 (shared).

## Context

Spec section 11: `fgos config` is a native verb. The host already routes `convention`, `identity`, `friction`, `metrics`, `version` and `gate-bypass` natively; the pattern is: operation descriptors in `packages/host-runtime/rust/src/catalog.rs`, a request projector in `apps/fgos/src/cli_projector.rs`, a provider in the owning crate behind a feature (`packages/identity/rust/Cargo.toml`: `provider`, default on there; here default off, D3 phase 03), a route annotation in `command-route-annotations.json`, the generated `command-routes.json` (`scripts/export-command-selectors.mjs`) and the registry entry in `src/cli/command-registry.mjs`. This phase builds the read half; phase 10 appends the write half to the same files.

## Files it may touch

`src/inspect.rs` (about 170 lines: text and data for show, explain, standard), `src/provider.rs` (feature `host-provider`: two operations `config.read` and `config.write`; this phase implements `config.read`), `apps/fgos/Cargo.toml` (`fgos-config` with the feature), `apps/fgos/src/cli_projector.rs`, `apps/fgos/src/main.rs` (the native-flag and stdin tables, if needed), `packages/host-runtime/rust/src/catalog.rs` (two descriptors: `config.read` effect Read, `config.write` effect Write), `packages/host-runtime/contracts/command-route-annotations.json` and `command-routes.json`, `src/cli/command-registry.mjs`, `test/rust-host/command-routes.test.mjs` (expected selector list), `apps/fgos/tests/cli_tests.rs` (config read cases).

## Design

- **Roots.** The verbs resolve: project root from `--dir` or the cwd's git work tree; `trusted_root` = `RepoHandle::trusted_main_root()` (D22; `packages/identity/rust/src/project.rs:144` is the existing use); global dir = `~/.fgos` from `HOME` (the provider reads the environment, the crate does not); class = `session_class(env lookup)` (phase 03); detectors = the Slice B port with no detection yet (Slice C supplies the real PATH probe; a detected key shows as absent).
- **`show [--path <p>]`**: `snapshot` then `redact::render_for_display` (`redact.rs:47`), with provenance per leaf (layer, file, line, column) and revisions; `--path` uses YAML Document's path text form (`fgos_yaml_doc::path::parse_path`) and prints the subtree; secret references print as references, `secret-value` as `<redacted>`. A failing snapshot prints every refusal (all or nothing) and exits non-zero; **until this repository is migrated that is the expected output here** (D19 of Slice B).
- **`explain <path>`**: the schema node (`Schemas::resolve`): description, type, enum or bounds, standard value (`Standard::value_at`), scope, file, sensitivity, owner (root `$comment` first line), and where the current value comes from when the snapshot succeeds (provenance). A path with no node says "undescribed" and still reports the file that holds it.
- **`standard [--path <p>]`**: the bundled standard files in section order with their `@fgos:doc` lines (the bytes `Standard::bundled` holds). With `--path`, the minimal copyable fragment: the ancestors' keys with their doc lines and the node's own subtree, produced by parsing the bundled file and removing the siblings with `CommentLoss::Acknowledge` (read-only on the in-memory document). No account, token or detected value exists in it by construction (Slice B lint).
- **`check`**: `doctor::check` with the `check` severities; non-zero exit when any `fail`; `--json` returns the findings. No write.
- **Output.** The standard `--json` envelope the other native verbs use; text through `apps/fgos/src/cli_presenter.rs` the way `identity` does it (one small match arm). No value ever appears in a finding or an error.
- **Native flags table.** `accepted_flags` / `subcommand_flags` in the route entry list the verbs' flags so unknown flags fail the same way as other native verbs (`apps/fgos/src/main.rs:unknown_native_flag`).

## Steps

1. Merge `origin/main`; post a board line (shared: `catalog.rs`, route JSON, `main.rs`, `command-registry.mjs`); look at the last commit that added a native verb (`5e7e299ca` identity, 1,542 lines of which about 330 are host wiring) as the template.
2. Provider and descriptors; projector unit tests (`cli_projector.rs` tests module: each verb and flag maps to the right request; unknown flag; `--path` text form; `--json`); then `inspect.rs` with a golden over a fixture project (small: show with provenance, explain of one `x-fgos-scope` key, standard of one path).
3. Regenerate the routes through `scripts/export-command-selectors.mjs` (the script, not by hand); run `test/rust-host/command-routes.test.mjs`; fix the registry entry text (one description per verb).
4. `cli_tests.rs`: one end to end case per read verb against a temp project and a temp `HOME` (the way the identity cases build theirs, `cli_tests.rs:1191-1260`).
5. `cargo test -p fgos --jobs 4`, `cargo test -p fgos-config --features host-provider --jobs 4`, clippy, fmt; report line counts per module against the caps.

## Owning proofs

| Behaviour | Proof |
|---|---|
| Argument projection | projector unit tests (lowest layer) |
| Show, explain, standard content, redaction | `inspect.rs` golden over a fixture project (the redaction itself is Slice B's `golden_no_echo.rs`) |
| Check semantics | phase 08 (not repeated) |
| The verb is routed and runs | one `cli_tests.rs` case per verb (wiring only) |

## Risk

| Risk | L x I | Mitigation |
|---|---|---|
| Shared files collide (`catalog.rs`, route JSON, `main.rs`, registry) | M x M | board line first; merge `origin/main` at start and end; the generated JSON is regenerated, not hand-merged |
| `standard --path` fragment is not valid YAML to paste | L x M | golden: the fragment parses under `strict-config` and validates against the schema as a project file |
| A verb prints a value | L x H | `show` goes only through `render_for_display`; no-echo cases appended in phase 08 cover `check`; `explain` prints the standard value only when the node is not secret (the Slice B doc-line rule) |
| The projector table in `main.rs` drifts from the registry | L x L | the existing `command-routes-drift` doctor row and route test catch it |

## Rollback

Revert: new route and descriptors disappear; `fgos config` returns to "unknown command"; nothing else calls it.
