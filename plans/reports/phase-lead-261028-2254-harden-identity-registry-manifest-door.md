# Identity stream joins the consumer manifest door

Branch `harden/identity-registry-manifest-door`, commit `ea2f5fb94` (base origin/main `1a42938f2`).
Reviewers: lead:ES (crate change), IDENT (`identity_log.rs`).

## What changed (+96 / -29, 6 files)

| File | Change |
|---|---|
| `packages/event-store/rust/build.rs` | Existing build script split into `result_codes` (unchanged) and new `consumer_contracts`: reads `../contracts/consumers.v1.json`, checks `v == 1` and that each `contractFile` is a safe repo-relative path, emits `include_str!` of each file into `OUT_DIR/consumer_contracts.rs`, `rerun-if-changed` on manifest and every contract. |
| `packages/event-store/rust/src/registry.rs` | `Registry::shipped()`: `Registry::default()` + `register()` of every embedded manifest contract. Same rules as `load_files` (same `register`). |
| `apps/fgos/src/wiring/identity_log.rs` | Removed `CONTRACT` include of the Identity contract and the hand `Registry::default()+register`; now `Registry::shipped()`. Doc comment updated. |
| `apps/fgos/tests/cli_tests.rs` | Identity publish test appends the remote machine's event with `Registry::shipped()`; the `sealOnWrite == false` assertion reads the shipped registry instead of the raw JSON. |
| `packages/event-store/rust/tests/registry_identity_layout.rs` | New test `shipped_registry_registers_every_manifest_consumer_as_loading_its_files`. |
| `packages/git/contracts/mutation-census.v1.json` | Regenerated (line shifts). |

## Design choice (why build-time embed)

Only door that read the manifest before: Node `src/event-store/consumers.mjs` -> `registryFiles()` -> addon `open_store` -> `Registry::load_files` (runtime paths under the payload root). The host has no cheap payload root (resolving it means the full release-manifest verification of `legacy_exec::resolve_payload_path`, and cargo tests run without a release), which is why the old code embedded the contract. Embedding the *manifest's* list in the store crate keeps one list (the manifest) with no runtime layout search. It extends the crate's existing build script (already generates from `result-codes.v1.json`); no new crate dependency, the store crate embeds consumer data only (no consumer code), consistent with `registry.rs` "No consumer code is imported here". No release payload `files` change needed (compile-time).

The audit's (T3-2) fence probe at `identity_log.rs:57` was not in scope; untouched.

## On-disk compatibility

Stream `project:identity`, types `identity.session-published` / `identity.session-ended`, scope `project`, `sealOnWrite: false`, schemaVersion 1: all still read from the same file `packages/identity/contracts/identity-event-streams.v1.json`, now via the manifest entry `identity`. The registry is only consulted at append (validate type/scope/version); reads/folds don't touch it. Extra types now registered in the host (work, porting, mailbox) are never appended by the host. Proof: `identity_register_publishes_and_resolve_answers_a_session_of_another_machine` (append via host + remote append via shipped registry + sync + resolve) green.

## Tests run

- `cargo test -p fgos-event-store -j 4`: all binaries ok (incl. `registry_identity_layout` 10/10, new test passes).
- `cargo test -p fgos -j 4 identity`: 10 + 7 + 10 passed, 0 failed.
- `cargo clippy -p fgos-event-store -p fgos --all-targets -- -D warnings`: clean.
- `cargo check -p fgos-event-store` and `-p fgos` for `x86_64-pc-windows-msvc` and `aarch64-apple-darwin`: clean.
- Node `test/event-store/consumers.test.mjs` via `runChosenTests`: 3 pass, 0 fail, no ERROR lines.
- Census: `git-one-door-scan --write-census`: 0 undeclared.

## Retired tests and new owners

No test deleted. The CLI test's hand registration of the Identity contract was replaced; the property "shipped registry equals the manifest's contracts" is now owned by `shipped_registry_registers_every_manifest_consumer_as_loading_its_files` (crate level). The host wiring proof stays the CLI identity publish test.

## Docs lines for DOC

- `docs/platform/event-store/spec.md:120` — after "Rust consumers (observe, `fgos-work-state`) link the crate." add: "A native caller registers the consumers of `contracts/consumers.v1.json` through `Registry::shipped()`, which the crate's build script embeds from that manifest; the payload loads the same files by path (`registryFiles()`)."
- `docs/platform/event-store/spec.md:968` and `:1068` — "The shipped registry remains empty until cutover" / "The consumer registry remains empty" are stale (four consumers are registered); propose deleting those sentences.
- `docs/platform/identity/spec.md:117` — append: "The host registers the stream through the Event Store consumer manifest (`Registry::shipped()`), not a contract copy of its own."

## Open questions

1. lead:ES: the addon (`packages/git/node-addon/src/event_store.rs:222`) still takes `registry_files` from Node at runtime; it could use `Registry::shipped()` too, but `test/event-store/verbs.test.mjs:111` builds a custom manifest under a temp payload root and relies on the runtime path. Left as is: one list, two readers (build-time crate, runtime Node). Decide whether to fold the addon onto `shipped()`.
2. IDENT/ES: the `.fgos/events` fence probe in `identity_log.rs` (audit T3-2 second half) remains; a separate item if wanted.
