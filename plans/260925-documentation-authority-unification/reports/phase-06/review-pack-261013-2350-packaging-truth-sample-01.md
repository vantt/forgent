# Packaging independent review: truth-sample 1

Content pin: `baef3a075899f83d515a28ab66abd6c3d55201c5`

Author: `codex-session:8@2026-10-13`; assembler: `codex-session:9@2026-10-13`. All proposals remain pending.

## Truth sample 1

Path: `docs/platform/packaging-distribution/spec.md#unheaded-block-44`

Unit digest: `ab6f59a399bcc3e0973366bfcb52f6fbf4906d35cd95be996bd630f8cac4ee14`

Shown digest: `ab6f59a399bcc3e0973366bfcb52f6fbf4906d35cd95be996bd630f8cac4ee14`

```text
`AGENTS.md` is the primary portable projection when a host supports it. Host-specific files such as Claude or Gemini context files should be generated only for host syntax, plugin/extension behavior, command surfaces, or compatibility gaps.
```

Independent reviewer: check every current assertion against code; record assertions, false units and denominators. No author verdict.
## Truth sample 2

Path: `docs/platform/packaging-distribution/contracts/skill-package-distribution.md#unheaded-block-11`

Unit digest: `6243e500e00b9ac6c14a9430c85ac0c5ffb12ae145edddb5a17b8096ed84de5b`

Shown digest: `6243e500e00b9ac6c14a9430c85ac0c5ffb12ae145edddb5a17b8096ed84de5b`

```text
| Surface | Status | Evidence |
| --- | --- | --- |
| Assemble canonical skills from `core/skills` and `domains/*/skills` into `.agents/skills` | implemented | `src/setup/skill-wrappers.mjs`, `scripts/build-skill-wrappers.mjs`, `test/setup/skill-wrappers.test.mjs` |
| Generate Claude wrapper skills from `.agents/skills` | implemented | `src/setup/skill-wrappers.mjs`, `test/setup/skill-wrappers.test.mjs` |
| Mirror `fgos-*` dev skills into the fgOS plugin for plugin-only consumers | implemented | `plugins/fgOS/skills/`, `test/skills/fgos-mirror.test.mjs` |
| Detect missing/stale plugin skill packaging through doctor/fix registry | implemented | `src/setup/registrations.mjs`, `test/skills/fgos-mirror.test.mjs` |
| Generate Gemini CLI extension package layout and commands | partial | `src/setup/skill-wrappers.mjs` (`generateGeminiSkillPackage`), `test/setup/skill-wrappers.test.mjs` |
```

Independent reviewer: check every current assertion against code; record assertions, false units and denominators. No author verdict.
## Truth sample 3

Path: `docs/platform/packaging-distribution/code-panel-rollout-plan.md#unheaded-block-58`

Unit digest: `117363655206262f311d1576d4ca93f6a91adf02dfb6f4237447afd31a78f723`

Shown digest: `117363655206262f311d1576d4ca93f6a91adf02dfb6f4237447afd31a78f723`

```text
Reviewer focus:

- Was this done after P7 proof?
- Are users given a clear path: `fgctl init` plus local `fgos doctor --fix`?
```

Independent reviewer: check every current assertion against code; record assertions, false units and denominators. No author verdict.
## Truth sample 4

Path: `docs/platform/packaging-distribution/contracts/repository-runtime-layout.md#unheaded-block-18`

Unit digest: `d5254551e36825082ed4f57c656f0a5b100999e5ddd72d527c1186d2f0fa9162`

Shown digest: `d5254551e36825082ed4f57c656f0a5b100999e5ddd72d527c1186d2f0fa9162`

````text
```json
{
  "schemaVersion": 1,
  "activationId": "act_000001a08fe31d00",
  "workspaceId": "8d3322d88fba3bd8",
  "artifactDigest": "sha256:08e33ffd77ccae43fd3b9f3034c9d4c28bdc1d8c69966f913ed66707a0486ec4",
  "status": "ready-published",
  "history": [
    { "status": "staging", "timestamp": "2026-09-14T00:00:00.000Z" },
    { "status": "verified", "timestamp": "2026-09-14T00:00:01.000Z" },
    { "status": "preparing", "timestamp": "2026-09-14T00:00:02.000Z" },
    { "status": "ready-published", "timestamp": "2026-09-14T00:00:03.000Z" }
  ],
  "updatedAt": "2026-09-14T00:00:03.000Z"
}
```
````

Independent reviewer: check every current assertion against code; record assertions, false units and denominators. No author verdict.
## Truth sample 5

Path: `docs/platform/packaging-distribution/spec.md#unheaded-block-17`

Unit digest: `7b947a76cec219e5010de59f1adbed679d654248fa52932833fb80be325661da`

Shown digest: `7b947a76cec219e5010de59f1adbed679d654248fa52932833fb80be325661da`

```text
Contributors can source:
```

Independent reviewer: check every current assertion against code; record assertions, false units and denominators. No author verdict.
## Truth sample 6

Path: `docs/platform/packaging-distribution/contracts/projection-ledger.md#unheaded-block-19`

Unit digest: `46a1d10e0b7d35041c5505d91bc659d4c9e7e8b77f1f5d4b0d0777a02a930f3c`

Shown digest: `46a1d10e0b7d35041c5505d91bc659d4c9e7e8b77f1f5d4b0d0777a02a930f3c`

```text
Each projected path needs an ownership class:
```

Independent reviewer: check every current assertion against code; record assertions, false units and denominators. No author verdict.
## Truth sample 7

Path: `docs/platform/packaging-distribution/spec.md#unheaded-block-9`

Unit digest: `6471d511f68c7a56550873cf7418f082d15bcfe040150e807f9ac6f3edcfef50`

Shown digest: `6471d511f68c7a56550873cf7418f082d15bcfe040150e807f9ac6f3edcfef50`

```text
With no pin and no explicit source, `fgctl init` downloads the latest release through the system `curl` and refuses unless the asset matches its `SHA256SUMS` entry. `FGCTL_VERSION=<tag>` selects an exact tag (pre-releases are never "latest"); `FGCTL_FROM=<path | URL>` or `--from` installs a non-release build. `install.sh` itself defaults to the latest release and takes `FGCTL_VERSION` the same way.
```

Independent reviewer: check every current assertion against code; record assertions, false units and denominators. No author verdict.
## Truth sample 8

Path: `docs/platform/packaging-distribution/contracts/activation-binding.md#unheaded-block-21`

Unit digest: `dbf8dbfef2ba662c57de06f78ad450a238098cd8069d2f513587dc429ecdddd5`

Shown digest: `dbf8dbfef2ba662c57de06f78ad450a238098cd8069d2f513587dc429ecdddd5`

```text
Possible transaction statuses:
```

Independent reviewer: check every current assertion against code; record assertions, false units and denominators. No author verdict.
## Truth sample 9

Path: `docs/platform/packaging-distribution/spec.md#unheaded-block-55`

Unit digest: `e3b0d1af248f4abb69cb8ec6c67d70d375955fc9eaed87c6dd8410d74a47b02b`

Shown digest: `e3b0d1af248f4abb69cb8ec6c67d70d375955fc9eaed87c6dd8410d74a47b02b`

```text
This document maps those concerns to the architecture documents that should own
or reference them.
```

Independent reviewer: check every current assertion against code; record assertions, false units and denominators. No author verdict.
## Truth sample 10

Path: `docs/platform/packaging-distribution/spec.md#unheaded-block-78`

Unit digest: `cd74dfc705f04854cfa17eebf4d9491c6d8006a272e739e8463415183d6a81f5`

Shown digest: `cd74dfc705f04854cfa17eebf4d9491c6d8006a272e739e8463415183d6a81f5`

```text
[Workspace Topology Architecture](../../architect/workspace-topology.md)
```

Independent reviewer: check every current assertion against code; record assertions, false units and denominators. No author verdict.
## Truth sample 11

Path: `docs/platform/packaging-distribution/verification/install-and-release-proof.md#unheaded-block-14`

Unit digest: `380d5cb658fe03b6cf908339c07a1e1c2134d7690c364550c9e6dc6c00c4572e`

Shown digest: `380d5cb658fe03b6cf908339c07a1e1c2134d7690c364550c9e6dc6c00c4572e`

```text
- Link evidence from docs instead of embedding long test explanations in specs.
- Treat a passing local unit test as local proof, not release proof.
- Treat external consumer CI as the strongest install/release proof.
- Re-scan code before changing claim status in `implementation-alignment.md`.
```

Independent reviewer: check every current assertion against code; record assertions, false units and denominators. No author verdict.
## Truth sample 12

Path: `docs/platform/packaging-distribution/contracts/skill-package-distribution.md#unheaded-block-15`

Unit digest: `4dc182ca9a9502d457d9d5ba8c1e9dffe52c1459a5bc22c81eaf0474a7bdc4a1`

Shown digest: `4dc182ca9a9502d457d9d5ba8c1e9dffe52c1459a5bc22c81eaf0474a7bdc4a1`

```text
The correct canonical location is determined by component authority:
```

Independent reviewer: check every current assertion against code; record assertions, false units and denominators. No author verdict.
## Truth sample 13

Path: `docs/platform/packaging-distribution/contracts/release-manifest.md#unheaded-block-7`

Unit digest: `5b12fd1fa4f3ab432b19f5620fb11972fb1dc19c6b38564a9f4d7297dff5d7ad`

Shown digest: `5b12fd1fa4f3ab432b19f5620fb11972fb1dc19c6b38564a9f4d7297dff5d7ad`

```text
- The Rust host resolves the Node CLI entrypoint exclusively through `manifest.components.legacyNode`, never `PATH`, never `cwd`, and never hardcoded outside the manifest.
- Omission of `components.legacyNode` is a schema validation error.
- Empty, absolute, or parent-traversing `root`, `entry`, or `digest` fails `ReleaseManifest::validate_legacy_node_invariant`.
- `entry` is relative to `root`; it must not repeat the `root` prefix.
```

Independent reviewer: check every current assertion against code; record assertions, false units and denominators. No author verdict.
## Truth sample 14

Path: `docs/platform/packaging-distribution/spec.md#unheaded-block-94`

Unit digest: `f2aa140aabef20a5a98af537527987721e90af6779c22a7a854dc6b9f0979b31`

Shown digest: `f2aa140aabef20a5a98af537527987721e90af6779c22a7a854dc6b9f0979b31`

```text
(none — coverage is full for the mechanisms this feature adds. `fgos doctor
--fix` now exists for real, per RUL11 (doctor --fix exists and is real, runs every registered fix) above — its own further extension
(which checks eventually get a registered fix) is ordinary registry growth,
tracked per-module, not a gap in this spec.)
```

Independent reviewer: check every current assertion against code; record assertions, false units and denominators. No author verdict.
## Truth sample 15

Path: `docs/platform/packaging-distribution/contracts/distribution-pin.md#unheaded-block-12`

Unit digest: `90970e1148a1744047765bc8f2d93346bb881b91e982483eefb4168451df4f7d`

Shown digest: `90970e1148a1744047765bc8f2d93346bb881b91e982483eefb4168451df4f7d`

```text
The pin records desired selection policy. It does not prove what is active. In
V1 the pin is tracked project state at:
```

Independent reviewer: check every current assertion against code; record assertions, false units and denominators. No author verdict.
## Truth sample 16

Path: `docs/platform/packaging-distribution/code-panel-rollout-plan.md#unheaded-block-42`

Unit digest: `bf6ae9f9db8e66a0cbd8eed7305cd926966ac1d85a66518c85fec47c66a44d4a`

Shown digest: `bf6ae9f9db8e66a0cbd8eed7305cd926966ac1d85a66518c85fec47c66a44d4a`

```text
Reviewer focus:

- Does ordering protect effect, not just text order?
- Are conflicts explicit instead of silently resolved by last-write-wins?
```

Independent reviewer: check every current assertion against code; record assertions, false units and denominators. No author verdict.
## Truth sample 17

Path: `docs/platform/packaging-distribution/verification/install-and-release-proof.md#unheaded-block-9`

Unit digest: `5436a95c42be8bcb624f6f896d0230c3a36200060b23ce19ae75449784271aa8`

Shown digest: `5436a95c42be8bcb624f6f896d0230c3a36200060b23ce19ae75449784271aa8`

```text
This proves the preview release channel exists as published assets, not only
as local release-shaped files. The preview claim remains deliberately narrower
than stable/default graduation: release-owner approval is still required before
this status becomes stable/default.
```

Independent reviewer: check every current assertion against code; record assertions, false units and denominators. No author verdict.
## Truth sample 18

Path: `docs/platform/packaging-distribution/architecture/fgctl-and-local-fgos.md#unheaded-block-13`

Unit digest: `3200e28a2754c7a271be1f3adbb4bcf4f944782148fd8a0584b5dcb3770fab1c`

Shown digest: `3200e28a2754c7a271be1f3adbb4bcf4f944782148fd8a0584b5dcb3770fab1c`

```text
V1 `fgctl` is a Rust bootstrap binary. It may be built from the same source
tree as the future Rust host, but its authority is different: machine/project
runtime control, not project workflow semantics.
```

Independent reviewer: check every current assertion against code; record assertions, false units and denominators. No author verdict.
## Truth sample 19

Path: `docs/platform/packaging-distribution/contracts/instruction-composition-and-projection.md#unheaded-block-20`

Unit digest: `c99db16e39712efdf185387e263b3788b872ef103a20b040490efc493a70e899`

Shown digest: `c99db16e39712efdf185387e263b3788b872ef103a20b040490efc493a70e899`

```text
Priority numbers may break ties within the same kind and scope. They must not be the primary source of authority.
```

Independent reviewer: check every current assertion against code; record assertions, false units and denominators. No author verdict.
## Truth sample 20

Path: `docs/platform/packaging-distribution/contracts/release-manifest.md#unheaded-block-3`

Unit digest: `6d77abaee74b79997b3f25983575ebb2e534e8d9831385dd46ed9150a7b61d98`

Shown digest: `6d77abaee74b79997b3f25983575ebb2e534e8d9831385dd46ed9150a7b61d98`

```text
The schema is frozen at `schemaVersion: 1`. Rust serde definitions live in `packages/distribution/rust/src/manifest.rs` (`ReleaseManifest`).
```

Independent reviewer: check every current assertion against code; record assertions, false units and denominators. No author verdict.
## Truth sample 21

Path: `docs/platform/packaging-distribution/spec.md#unheaded-block-21`

Unit digest: `3087a6ad3be768852a17337632e9d4a5bb80d9fd6e788cf759831f3aca4a6252`

Shown digest: `3087a6ad3be768852a17337632e9d4a5bb80d9fd6e788cf759831f3aca4a6252`

```text
The target runtime selection rule is:
```

Independent reviewer: check every current assertion against code; record assertions, false units and denominators. No author verdict.
## Truth sample 22

Path: `docs/platform/packaging-distribution/contracts/release-manifest.md#unheaded-block-14`

Unit digest: `3e69f5309c46f933c74b52c6b3ec9c8b684a0f686fa0ae36e99d609832c8b61a`

Shown digest: `3e69f5309c46f933c74b52c6b3ec9c8b684a0f686fa0ae36e99d609832c8b61a`

````text
The digest formula is:

```txt
fileDigest = sha256(file bytes as emitted by the release build)
artifactDigest = sha256(canonical-json(release tree manifest without artifactDigest))
```
````

Independent reviewer: check every current assertion against code; record assertions, false units and denominators. No author verdict.
## Truth sample 23

Path: `docs/platform/packaging-distribution/architecture/fgctl-and-local-fgos.md#unheaded-block-3`

Unit digest: `d6e2e95a2ce5436d92323744e02fb85a42731e6a43e027e0b8a4ce55d777a045`

Shown digest: `d6e2e95a2ce5436d92323744e02fb85a42731e6a43e027e0b8a4ce55d777a045`

````text
```txt
fgctl selects and repairs the runtime.
local fgos runs project workflow semantics under the selected runtime.
```
````

Independent reviewer: check every current assertion against code; record assertions, false units and denominators. No author verdict.
## Truth sample 24

Path: `docs/platform/packaging-distribution/spec.md#unheaded-block-53`

Unit digest: `afa4c17c539557aef31c16b3a5ed32351c0b90839d0e1ccff797fd3ea1e66104`

Shown digest: `afa4c17c539557aef31c16b3a5ed32351c0b90839d0e1ccff797fd3ea1e66104`

```text
**Status:** Historical architecture discussion map.
**Date:** 2026-09-04.
**Purpose:** Preserve the concern split that was promoted into
`docs/platform/packaging-distribution/**` without letting this old map compete
as the current navigation surface.
```

Independent reviewer: check every current assertion against code; record assertions, false units and denominators. No author verdict.
## Truth sample 25

Path: `docs/platform/packaging-distribution/architecture/future-constraints.md#unheaded-block-7`

Unit digest: `093dfd342ad7acdf730df29f9c3c7e72e57ba7c85e52eaa31c6f66fadc0fa0ab`

Shown digest: `093dfd342ad7acdf730df29f9c3c7e72e57ba7c85e52eaa31c6f66fadc0fa0ab`

```text
It should not infer runtime identity from `PATH` alone.
```

Independent reviewer: check every current assertion against code; record assertions, false units and denominators. No author verdict.
## Truth sample 26

Path: `docs/platform/packaging-distribution/contracts/activation-binding.md#unheaded-block-27`

Unit digest: `ccb205fdc5120e6287ab2067b178cb8c998e156c606d0282c8d7e02821feece0`

Shown digest: `ccb205fdc5120e6287ab2067b178cb8c998e156c606d0282c8d7e02821feece0`

```text
In that context the candidate may run preflight checks and write only staging
records under the installation transaction. It must not write host-visible
projection paths, execute general workflow mutations, or claim/write shared
work-state as the active runtime.
```

Independent reviewer: check every current assertion against code; record assertions, false units and denominators. No author verdict.
## Truth sample 27

Path: `docs/platform/packaging-distribution/spec.md#unheaded-block-49`

Unit digest: `1e6300b4a03d7d2581eb49a4c32ea8dc8ffb59fb28c697e65527bb6453980c05`

Shown digest: `1e6300b4a03d7d2581eb49a4c32ea8dc8ffb59fb28c697e65527bb6453980c05`

```text
Use:

- `verification/implementation-alignment.md` for claim-by-claim status;
- `verification/install-and-release-proof.md` for proof paths and commands.
```

Independent reviewer: check every current assertion against code; record assertions, false units and denominators. No author verdict.
## Truth sample 28

Path: `docs/platform/packaging-distribution/verification/install-and-release-proof.md#unheaded-block-17`

Unit digest: `6a838503d80c838c649167ceff151326e6f7a7a7c6e4f3b6f63d7157d5d337ed`

Shown digest: `6a838503d80c838c649167ceff151326e6f7a7a7c6e4f3b6f63d7157d5d337ed`

```text
- The public release posture is preview.
- External installs default `fgos` through the Rust host.
- Public docs may state that Rust host is the default installed runtime.
- Rust host is the default runtime path for activated workspace installs.
- Legacy Node fallback is deprecated immediately as a public/default runtime
  posture.
- Legacy Node fallback may remain only as an explicit escape hatch during a
  short compatibility window. It must require an intentional selector such as
  an environment variable, flag, or equivalent supported mechanism; it must not
  silently catch Rust-host failures.
- Any escape-hatch invocation must emit a warning, log entry, or proof marker
  that distinguishes deliberate legacy fallback use from default Rust-host use.
- The escape hatch remains supported for 30 calendar days after the preview
  release publication date. The public preview tag `v0.1.0` was published on
  2026-09-18, so the earliest removal date for this preview release is
  2026-10-18 unless a later release decision replaces that support promise.
```

Independent reviewer: check every current assertion against code; record assertions, false units and denominators. No author verdict.
## Truth sample 29

Path: `docs/platform/packaging-distribution/contracts/distribution-pin.md#unheaded-block-10`

Unit digest: `5e8cd6969cc76c9fa07e3861b5b1bf5f9d6083a33d1f5cb970349a76844dacab`

Shown digest: `5e8cd6969cc76c9fa07e3861b5b1bf5f9d6083a33d1f5cb970349a76844dacab`

```text
| Claim | Evidence |
| --- | --- |
| Pin struct frozen and documented | `packages/distribution/rust/src/init.rs` (`TrackedDistributionPin`, `DistributionPin`) |
| Activation stores `pinSnapshot` | `packages/distribution/rust/src/init.rs` (`publish_and_tail`) |
| Architecture distinguishes pin from activation | `docs/architect/packaging-distribution/runtime-identity-and-activation.md` |
| Pin reconciliation & mismatch tests | `test/rust-host/fgctl-init.test.mjs` (Item 2, Item 5) |
| Schema golden tests (full, minimal, forward-compat) | `packages/distribution/rust/tests/schema_golden.rs`, `packages/distribution/rust/tests/goldens/distribution-pin-*.json` |
```

Independent reviewer: check every current assertion against code; record assertions, false units and denominators. No author verdict.
## Truth sample 30

Path: `docs/platform/packaging-distribution/architecture/runtime-identity-and-activation.md#unheaded-block-53`

Unit digest: `0a68b45b9aad074b7be63e3f7d810b871adee57edd805f6ea71849d1534f09f4`

Shown digest: `0a68b45b9aad074b7be63e3f7d810b871adee57edd805f6ea71849d1534f09f4`

```text
Added in candidate — not carried; restoration tracked by dropped-001 and Plan C.
```

Independent reviewer: check every current assertion against code; record assertions, false units and denominators. No author verdict.
