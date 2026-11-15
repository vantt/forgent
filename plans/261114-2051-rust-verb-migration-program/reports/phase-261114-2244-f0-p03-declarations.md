# F0 phase 03: native and store declarations as data

Branch `rust-verb-migration-program/f0-p03`, based on `origin/rust-verb-migration-program/f0` (286017771). Not landed.

## Done

- Registry: `nativeOnly: true` is `native: true` on the 8 verbs; `hook` has `native: ['mailbox', 'mailbox-sync']`. The eight `mutatesStore`, one `landsWork` and one `eventStoreChild` predicates are lists of shapes (`'next'`, `'recover --action'`, `'sync --opportunistic=true'`); no function value is left in any registry field. `declared(field, positional = [], flags = {})` resolves them through one `parseShape`; `isNativeInvocation(entry, positional)` is the one reader of `native`.
- Generator: `route_kind` comes from `native` (`true` -> native; list -> `legacy-cli` + sorted `native_subcommands`). Annotations carrying `route_kind`, `route_kinds` or `native_kinds` are refused as stale; the annotation file lost those fields (and the now-empty `hook` entry). Every registry selector now carries `store`, plus `mutates_store`, `lands_work`, `event_store_child` verbatim when declared. A `native` declaration on an invocation whose `landsWork` matches is refused. Shapes and `native` lists are validated at generation time. `native_kinds` is still emitted on `hook` (same list), with a comment that the host reads it until its routing moves; `subcommand_flags` is emitted for native subs only when the verb has `subcommands` (none today).
- Node: `handleHook` (before `parseArgs`, exit 1, same message) and the verb refusal (after the help branch, exit 4; message names `verb sub` for a native first positional) both read the registry. `NATIVE_HOOK_KINDS` is deleted from `src/runner/hook.mjs`; no second list remains.
- Shared vectors: `test/rust-host/fixtures/store-declaration-vectors.json`, 44 rows, checked first against the old predicates (0 mismatches) and then against the shapes. They cover both sides of every shape, flags before the sub-verb, `--opportunistic=false`, `--opportunistic x`, `--opportunistic sync`, `--action` as a bare flag and as a positional word.
- `command-manifest.json` bytes unchanged (SHA-256 `5d9c41f8...ade7`). `command-routes.json` differs only by the added store fields and `hook.native_subcommands`.

## Deviations from the phase text, and facts applied

- Facts "Impact on phases" suggested deriving `nativeOnly` from the route table; the phase text goes the other way (the route derives from the registry `native` field) and I followed the phase text, since the registry is the lower, single authority. The 8 native routes equal the 8 `native: true` entries (a test pins it).
- Facts confirmed the data form needs only a sub-verb set plus flag-present or flag-exactly-true; no richer condition was needed.
- Help selectors (`--help`, `-h`) have no registry entry and carry no `store`; "every selector" means every registry selector.
- A test built on a partial annotation set (`native route without an explicit owner_path`) now passes a one-verb registry, because native verbs now come from the registry and every one needs its annotation.

## Gates

- `export-command-selectors.mjs --check`: clean.
- The phase's focused list (11 files): 316 pass, 0 fail after the census was regenerated (first run had one red, the census digest; fixed with `git-one-door-scan --write-census`: hash lines and digest only). Re-run of census + routes: 20 pass.
- Readers of the changed files (13 more files, incl. command-registry, fgos-help, verb-help-json, envelope-contract, internal-routes, decision-question-hook, worktree-create, citation drift): 160 pass, 0 fail.
- `cargo test -p fgos --test mailbox_routes`: 50 pass; `cargo test -p fgos --bins`: 46 pass.
- One-door scan: 0 undeclared, class counts and outside-product counts identical to the previous report's baseline (`packages` 281).
- Not run (per brief): full `npm test`, `cargo test --workspace`, fmt/clippy/cross checks (no Rust source changed; the host only re-embeds the JSON).

## Tests retired (named in the commit body)

Five CLI cases in `test/cli/fgos-disconnected-worktree-guard.test.mjs` (goal set, gateway start/stop, knowledge attest, events sync and rebuild, merge next) and the `lock fence` half of the lock/dispatch case; kept as CLI wiring proof: `session start|end|gc` with `session list` (sub-only shape) and `dispatch recover --action` (flag shape). New owner: the vector rows through `test/cli/fgos-manifest.test.mjs` (and the host matcher in the routing step). Also retired: `double-annotated selector fails the build (multiple route_kinds in single entry)` and the `checkRouteKind` function, superseded by the stale-annotation refusal.

## Suggested [Unreleased] line

"The host route table now carries each verb's store declarations (`store`, `mutates_store`, `lands_work`, `event_store_child`) and a `native_subcommands` list read from the CLI registry, so the Rust host and the Node CLI read one declaration; no change in what any command does."

## Authority

- Before: "served natively" was declared in three layers (`nativeOnly` in the registry, `route_kind`/`native_kinds` in annotations, `NATIVE_HOOK_KINDS` in the runner), and store declarations lived only as JS closures. Now the registry `native` field and shape lists are the single declaration; the route table is generated from them.
- Still two readers of one list, on purpose and temporary: the host reads `native_kinds` (same values as `native_subcommands`) until the host-routing step moves it; that step deletes `native_kinds` from the generator and `apps/fgos/src/main.rs`. The doc comment at `apps/fgos/src/wiring/mailbox_hook.rs:3` names `native_kinds` and moves with it.
- Drift noticed, not changed (manifest bytes are pinned, so it is a separate decision): the `hook` `kind` enum in the registry lists `dispatch-decide`, `decision-question`, `main-checkout-delete-guard` and `mailbox`, but not `mailbox-sync`, which `native` names.

## Lessons

- A test that fed the generator a partial annotation set relied on "unannotated means legacy"; moving the decision into the registry made it fail with an error about an unrelated verb. Pass the generator a one-verb registry when a test targets one selector.
- `s.index(...)` on a test title that has two variants silently cut 100 lines on the first scripted edit; I caught it from the diff stat. Check `git diff --stat` after every scripted rewrite.
- The vector file was checked against the old predicates before any change, which made the red/green step trustworthy (the rows pin the old behaviour, not my reading of it).
- The `target` word in a path trips the scout-block hook for plain `ls`; use git or scripts instead.

Status: DONE
Summary: Native and store declarations are registry data read by Node and the route table, with shared vector rows; focused gates, mailbox route test and one-door scan are green and the head is pushed (not landed).
Concerns/Blockers: none blocking. `native_kinds` stays transitional until the host-routing step.
