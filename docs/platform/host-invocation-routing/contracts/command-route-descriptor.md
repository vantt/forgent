# Contract: Command Route Descriptor

```txt
Document type: Contract
Audience: Human reviewer, architect, maintainer, implementation agent
Purpose: Define per-selector native versus legacy CLI routing and repair ownership
Design status: Draft
Canonical: Yes, after review
Owner: Host invocation
Last reviewed: 2026-09-18
Related:
- docs/platform/host-invocation-routing/architecture/legacy-cli-transition.md
- docs/platform/host-invocation-routing/verification/compatibility-harness.md
Implementation: Current partial
Provenance: `docs/platform/host-invocation-routing/contracts/command-route-descriptor.md` at `947dc310396071a4d530216d5c06d05993d63bf5`
Writer type: Original writer attribution not recorded; retained source provenance
Canonical for: The stated document scope; source implementation limits remain explicit
Use this when: Define per-selector native versus legacy CLI routing and repair ownership
Do not use this for: Authority beyond the declared scope or implementation truth without the cited verification
Supersedes: The mapped source location; source provenance is retained
Superseded by: None recorded
```

Correction — checked route snapshot (2026-11-15): `packages/host-runtime/contracts/command-routes.json` has 80 selectors: 72 `legacy-cli` and eight native (`config`, `convention`, `friction`, `gate-bypass`, `identity`, `mailbox`, `metrics`, `version`). The two help selectors (`--help`, `-h`) are gone: the host answers help before it reads the table, so help is not a route. (`preflight` was retired on 2026-11-13.) This recount supersedes current-count wording; dated proof records remain historical.

## 1. Contract

Every selector has exactly one generated `CommandRouteDescriptor`.

Minimum fields:

| Field | Rule |
| --- | --- |
| `selector` | Canonical command/subcommand selector. |
| `route_kind` | Exactly one of `legacy-cli` or `native`. Derived from the registry `native` field in `src/cli/command-registry.mjs` (`true` is `native`; anything else, including a list of sub-verbs, is `legacy-cli`); an annotation cannot set it. |
| `operation_id` | Required only for native semantic routing. |
| `legacy_payload` | Required only for `legacy-cli`; names `legacy-node`. |
| `owner_path` | Canonical implementation boundary to edit. |
| `compatibility_tests` | Named parity/vector suites required for repair. |
| `native_subcommands` | Optional, and only on a `legacy-cli` selector: the sorted first positionals (sub-verbs or hook kinds) the host serves natively before the composition root; every other one reaches the legacy payload. Derived from the registry `native` list. Today only `hook` carries it, with `["mailbox", "mailbox-sync"]`. |
| `subcommands`, `subcommand_flags`, `accepted_flags` | Native routes and native sub-verbs only: the flags each native sub-verb (or the whole verb) accepts, projected from the registry; the host rejects any other flag by name. |
| `store` | Required on every route: what the verb needs of the project store, `none`, `open`, `read` or `require` (one registry value, read by the Node shell and the host). |
| `mutates_store` | Optional: `true` for the whole verb, or the invocation shapes (`next`, `recover --action`) that write the store. |
| `lands_work` | Optional: `true` or the invocation shapes that land work. The generator refuses a selector that lands work and is declared native (land release has no Rust owner). |
| `event_store_child` | Optional: `true` or the invocation shapes (`seal`, `sync --opportunistic=true`) that are the Event Store's own child process and so never start the lifecycle trigger. |

## 2. Rules

- The registry decides the route, what is native and the store fields; `command-route-annotations.json` may only name `selector`, `operation_id`, `owner_path`, `subcommands`, `legacy_payload` and `compatibility_tests`, and `scripts/export-command-selectors.mjs` refuses any other annotation field (a retired name such as `native_kinds` cannot return).
- Help is not a route. `fgos --help`, `-h` and `<verb> --help` are answered by the host from `command-manifest.json` before the table is read.
- The shape lists of `store`, `mutates_store`, `lands_work` and `event_store_child` are matched by the host and by the Node shell over the shared rows of `test/rust-host/fixtures/store-declaration-vectors.json`.
- A descriptor may not name both routes as active.
- An unlisted selector fails the build.
- Generated metadata is validated for drift and is not a second hand-maintained source of truth.
- `scripts/explain-command-route.mjs <selector>` should read the same artifact used by routing.

## 3. Implementation Alignment

| Design claim | Implementation status | Evidence | Gap / next action |
| --- | --- | --- | --- |
| Descriptor exists for every selector. | `current partial` | [../../../../packages/host-runtime/contracts/command-routes.json](../../../../packages/host-runtime/contracts/command-routes.json), [../../../../test/rust-host/command-routes.test.mjs](../../../../test/rust-host/command-routes.test.mjs) | Current snapshot has 80 selectors: 72 `legacy-cli`, eight native, no help routes. Keep drift tests current as selectors move. |
| `legacy-cli` preserves provider-owned argv. | `implemented preview` | [../../../../apps/fgos/src/main.rs](../../../../apps/fgos/src/main.rs), [../../../../apps/fgos/src/legacy_exec.rs](../../../../apps/fgos/src/legacy_exec.rs), [../verification/r1-rust-host-proof.md](../verification/r1-rust-host-proof.md) | Full compatibility-vector cleanup remains future, but manifest-owned legacy CLI lane is proven for preview. |

## 4. Related Files

| Relationship | File |
| --- | --- |
| legacy transition | [../architecture/legacy-cli-transition.md](../architecture/legacy-cli-transition.md) |
| compatibility harness | [../verification/compatibility-harness.md](../verification/compatibility-harness.md) |
| legacy payload | [legacy-payload.md](legacy-payload.md) |
