# Packaging independent review: source-distribution 2

Content pin: `baef3a075899f83d515a28ab66abd6c3d55201c5`

Author: `codex-session:8@2026-10-13`; assembler: `codex-session:9@2026-10-13`. All proposals remain pending.

## claim_45e83e644c43384e188c16e20172a52c

Source: docs/specs/distribution.md#unheaded-block-15

Target: docs/platform/packaging-distribution/spec.md#unheaded-block-92

Source identity digest: `b1e15730d97d645508d833b30133c31d6ac119466d80377b70c7815d0b8e08b3`

Target identity digest: `b1e15730d97d645508d833b30133c31d6ac119466d80377b70c7815d0b8e08b3`

Source shown SHA256: `b1e15730d97d645508d833b30133c31d6ac119466d80377b70c7815d0b8e08b3`

Target shown SHA256: `b1e15730d97d645508d833b30133c31d6ac119466d80377b70c7815d0b8e08b3`

### Proposed decision

| Field | Value |
|---|---|
| claimId | claim\_45e83e644c43384e188c16e20172a52c |
| sourceUnitDigest | b1e15730d97d645508d833b30133c31d6ac119466d80377b70c7815d0b8e08b3 |
| targetOwner | docs/platform/packaging-distribution/spec.md |
| targetAnchor | unheaded-block-92 |
| claimKind | specification |
| disposition | move |
| reviewStatus | pending |
| authoredBy | codex-session:8@2026-10-13 |
| rationale | The complete unheaded-block from docs/specs/distribution.md#unheaded-block-15, under "Lịch sử quyết định", is retained at docs/platform/packaging-distribution/spec.md#unheaded-block-92. All clauses, conditions, enumerations and dated status are kept; relative-link changes preserve destinations. The named owner is the packaging-distribution/spec.md topic owner; carriage does not certify current implementation. |

### Source unit

```text
- **2026-10-12 — `fgctl init` downloads by default (RUL15 (fgctl init downloads a checksum-verified release when no source is given)).** Before this, a plain `fgctl init` in a project with no pin failed with "`--from <source>` is required", so a first install meant downloading the release tarball by hand. Owner decision: no source and no pin means the latest GitHub release; `FGCTL_VERSION` selects an exact tag; `FGCTL_FROM` and `--from` select a non-release build; checksum verification is mandatory; the transport is the system `curl` rather than a new HTTP crate (same behavior and override as `install.sh`, no TLS stack to carry in `fgctl`). Prior art: `fgctl init --from` (the release-asset door, kept unchanged and now equivalent to `FGCTL_FROM`), `install.sh`'s `FGCTL_VERSION`/`FGCTL_ASSET_BASE_URL`/`FGCTL_TARGET` (reused, not redefined). Same day, follow-up: the pin now records the tag, so a pinned workspace whose release is not staged on this machine downloads it instead of needing a source; only a digest-only legacy pin still needs `FGCTL_FROM`/`FGCTL_VERSION`/`--from`, because a digest names no download.
- **2026-10-13 — Windows is a native release target (RUL16 (Windows is a native release target: same assets, an installer and launchers that need no POSIX shell)).** Owner decision: the level is "native, complete" (PowerShell and `cmd.exe`, no Git Bash, no WSL), with `tar.gz` kept as the single archive format and macOS left out of scope. Prior art, reused: the Windows CI hardening track made the Rust workspace build and the release-tree staging work on Windows (the `fgos.exe` entry, colon-free release store directory names, drive-letter-safe archive validation), and an earlier change wrote `.cmd` launchers on Windows that ran the `sh` shims through a `sh` on `PATH`; that required Git for Windows, so it is replaced by launchers that read `activation.json` themselves. Missing before: a Windows release asset, `install.ps1`, a Windows consumer proof, and any check that the launchers exist. Also in this change: the Linux asset moves from `ubuntu-latest` (binaries then needed glibc 2.39 and printed a loader warning on Ubuntu 22.04, glibc 2.35) to `ubuntu-22.04`, with a CI gate on the glibc symbol versions.
```

### Target unit

```text
- **2026-10-12 — `fgctl init` downloads by default (RUL15 (fgctl init downloads a checksum-verified release when no source is given)).** Before this, a plain `fgctl init` in a project with no pin failed with "`--from <source>` is required", so a first install meant downloading the release tarball by hand. Owner decision: no source and no pin means the latest GitHub release; `FGCTL_VERSION` selects an exact tag; `FGCTL_FROM` and `--from` select a non-release build; checksum verification is mandatory; the transport is the system `curl` rather than a new HTTP crate (same behavior and override as `install.sh`, no TLS stack to carry in `fgctl`). Prior art: `fgctl init --from` (the release-asset door, kept unchanged and now equivalent to `FGCTL_FROM`), `install.sh`'s `FGCTL_VERSION`/`FGCTL_ASSET_BASE_URL`/`FGCTL_TARGET` (reused, not redefined). Same day, follow-up: the pin now records the tag, so a pinned workspace whose release is not staged on this machine downloads it instead of needing a source; only a digest-only legacy pin still needs `FGCTL_FROM`/`FGCTL_VERSION`/`--from`, because a digest names no download.
- **2026-10-13 — Windows is a native release target (RUL16 (Windows is a native release target: same assets, an installer and launchers that need no POSIX shell)).** Owner decision: the level is "native, complete" (PowerShell and `cmd.exe`, no Git Bash, no WSL), with `tar.gz` kept as the single archive format and macOS left out of scope. Prior art, reused: the Windows CI hardening track made the Rust workspace build and the release-tree staging work on Windows (the `fgos.exe` entry, colon-free release store directory names, drive-letter-safe archive validation), and an earlier change wrote `.cmd` launchers on Windows that ran the `sh` shims through a `sh` on `PATH`; that required Git for Windows, so it is replaced by launchers that read `activation.json` themselves. Missing before: a Windows release asset, `install.ps1`, a Windows consumer proof, and any check that the launchers exist. Also in this change: the Linux asset moves from `ubuntu-latest` (binaries then needed glibc 2.39 and printed a loader warning on Ubuntu 22.04, glibc 2.35) to `ubuntu-22.04`, with a CI gate on the glibc symbol versions.
```

### Unified diff

```diff
No text difference.
```

## claim_797fb0be5db3c260c97745cd0894bec8

Source: docs/specs/distribution.md#edge-cases-settled

Target: docs/platform/packaging-distribution/spec.md#edge-cases-settled

Source identity digest: `e68ffed7e8c4e5523fe33183c439acd593fb7441ac8cc17af557e45e749e796c`

Target identity digest: `27d796445bca33db32cf7b287a079e920f33f612ace58427a56f40ea607b3f66`

Source shown SHA256: `48ac64e5fb8bfd811c1820103d0e9fb6b41b97780783b3e894a3ff54ecacef39`

Target shown SHA256: `9d431d903923af6fed1b346a65e0b7d0d0d63b6613b8cc742bd0d6651be8374b`

### Proposed decision

| Field | Value |
|---|---|
| claimId | claim\_797fb0be5db3c260c97745cd0894bec8 |
| sourceUnitDigest | e68ffed7e8c4e5523fe33183c439acd593fb7441ac8cc17af557e45e749e796c |
| targetOwner | docs/platform/packaging-distribution/spec.md |
| targetAnchor | edge-cases-settled |
| claimKind | specification |
| disposition | move |
| reviewStatus | pending |
| authoredBy | codex-session:8@2026-10-13 |
| rationale | The complete heading from docs/specs/distribution.md#edge-cases-settled, under "Edge Cases Settled", is retained at docs/platform/packaging-distribution/spec.md#edge-cases-settled. Only heading depth changes; the direct section payload follows the original source order. The named owner is the packaging-distribution/spec.md topic owner; carriage does not certify current implementation. |

### Source unit

```text
## Edge Cases Settled

- A package marked as not intended for public registry publication can still
  be installed directly from its GitHub repository — that restriction only
  blocks publishing to a public registry, not this installation path.
- Both CLI entry points (`fgos` and `fgos-runner`) are installed identically,
  executable immediately after install — a fresh install does not require
  the installer to separately locate or make executable the autonomous-loop
  runner command.
- Calling `fgos`/`fgos-runner` (via the dev checkout shell helper) from
  inside a linked git worktree of this repository always runs the MAIN
  checkout's entry point, never that worktree's own local copy — accepted
  as-is for this mechanism, not treated as a defect.
- A package manager whose own policy blocks lifecycle scripts for
  git-hosted dependencies (e.g. pnpm 10+'s `allowBuilds`) never blocks
  installing this package, because this package's install never declares a
  lifecycle script in the first place (per str88-fgos-pnpm-lifecycle) —
  there is nothing for that policy to approve or refuse.
- `fgos setup` run a second time with nothing new to do reports that
  plainly rather than silently repeating (or silently no-oping without
  saying so).
- `fgos doctor`'s `config-not-stale` check on a machine where `fgos setup`
  was never run reports "not configured yet", not an error and not a
  silently-created file.
- A release tree staged for `fgctl` (`scripts/build-rust-distribution.mjs`)
  carries the legacy-node payload TOGETHER WITH its production dependencies
  (the package's `dependencies` and theirs), copied next to the sources, so
  every verb runs from the installed release alone. Before this, the staged
  tree held no dependencies and any verb that loads one (`fgos workflow`,
  found when dogfooding a project that had run `fgctl init`) failed with a
  missing-package error while `fgos version` and `fgos doctor` still passed.
  A dependency that is not installed when the tree is built fails the build
  instead of thinning the payload; two installed copies of one name are
  refused. The external-consumer CI step runs a dependency-loading verb for
  this reason, because `version` never imports one.
```

### Target unit

```text
#### Edge Cases Settled

- A package marked as not intended for public registry publication can still
  be installed directly from its GitHub repository — that restriction only
  blocks publishing to a public registry, not this installation path.
- Both CLI entry points (`fgos` and `fgos-runner`) are installed identically,
  executable immediately after install — a fresh install does not require
  the installer to separately locate or make executable the autonomous-loop
  runner command.
- Calling `fgos`/`fgos-runner` (via the dev checkout shell helper) from
  inside a linked git worktree of this repository always runs the MAIN
  checkout's entry point, never that worktree's own local copy — accepted
  as-is for this mechanism, not treated as a defect.
- A package manager whose own policy blocks lifecycle scripts for
  git-hosted dependencies (e.g. pnpm 10+'s `allowBuilds`) never blocks
  installing this package, because this package's install never declares a
  lifecycle script in the first place (per str88-fgos-pnpm-lifecycle) —
  there is nothing for that policy to approve or refuse.
- `fgos setup` run a second time with nothing new to do reports that
  plainly rather than silently repeating (or silently no-oping without
  saying so).
- `fgos doctor`'s `config-not-stale` check on a machine where `fgos setup`
  was never run reports "not configured yet", not an error and not a
  silently-created file.
- A release tree staged for `fgctl` (`scripts/build-rust-distribution.mjs`)
  carries the legacy-node payload TOGETHER WITH its production dependencies
  (the package's `dependencies` and theirs), copied next to the sources, so
  every verb runs from the installed release alone. Before this, the staged
  tree held no dependencies and any verb that loads one (`fgos workflow`,
  found when dogfooding a project that had run `fgctl init`) failed with a
  missing-package error while `fgos version` and `fgos doctor` still passed.
  A dependency that is not installed when the tree is built fails the build
  instead of thinning the payload; two installed copies of one name are
  refused. The external-consumer CI step runs a dependency-loading verb for
  this reason, because `version` never imports one.
```

### Unified diff

```diff
--- "docs/specs/distribution.md#edge-cases-settled"
+++ "docs/platform/packaging-distribution/spec.md#edge-cases-settled"
@@ -1,4 +1,4 @@
-## Edge Cases Settled
+#### Edge Cases Settled
 
 - A package marked as not intended for public registry publication can still
   be installed directly from its GitHub repository — that restriction only
```

## claim_8d6b06dae659395981e196d4f7d33c15

Source: docs/specs/distribution.md#unheaded-block-16

Target: docs/platform/packaging-distribution/spec.md#unheaded-block-93

Source identity digest: `adbe84814a993cfb5f57b2646665d448fe34ee2d2583e6b2f930855f035722e8`

Target identity digest: `adbe84814a993cfb5f57b2646665d448fe34ee2d2583e6b2f930855f035722e8`

Source shown SHA256: `adbe84814a993cfb5f57b2646665d448fe34ee2d2583e6b2f930855f035722e8`

Target shown SHA256: `adbe84814a993cfb5f57b2646665d448fe34ee2d2583e6b2f930855f035722e8`

### Proposed decision

| Field | Value |
|---|---|
| claimId | claim\_8d6b06dae659395981e196d4f7d33c15 |
| sourceUnitDigest | adbe84814a993cfb5f57b2646665d448fe34ee2d2583e6b2f930855f035722e8 |
| targetOwner | docs/platform/packaging-distribution/spec.md |
| targetAnchor | unheaded-block-93 |
| claimKind | specification |
| disposition | move |
| reviewStatus | pending |
| authoredBy | codex-session:8@2026-10-13 |
| rationale | The complete unheaded-block from docs/specs/distribution.md#unheaded-block-16, under "Edge Cases Settled", is retained at docs/platform/packaging-distribution/spec.md#unheaded-block-93. All clauses, conditions, enumerations and dated status are kept; relative-link changes preserve destinations. The named owner is the packaging-distribution/spec.md topic owner; carriage does not certify current implementation. |

### Source unit

```text
- A package marked as not intended for public registry publication can still
  be installed directly from its GitHub repository — that restriction only
  blocks publishing to a public registry, not this installation path.
- Both CLI entry points (`fgos` and `fgos-runner`) are installed identically,
  executable immediately after install — a fresh install does not require
  the installer to separately locate or make executable the autonomous-loop
  runner command.
- Calling `fgos`/`fgos-runner` (via the dev checkout shell helper) from
  inside a linked git worktree of this repository always runs the MAIN
  checkout's entry point, never that worktree's own local copy — accepted
  as-is for this mechanism, not treated as a defect.
- A package manager whose own policy blocks lifecycle scripts for
  git-hosted dependencies (e.g. pnpm 10+'s `allowBuilds`) never blocks
  installing this package, because this package's install never declares a
  lifecycle script in the first place (per str88-fgos-pnpm-lifecycle) —
  there is nothing for that policy to approve or refuse.
- `fgos setup` run a second time with nothing new to do reports that
  plainly rather than silently repeating (or silently no-oping without
  saying so).
- `fgos doctor`'s `config-not-stale` check on a machine where `fgos setup`
  was never run reports "not configured yet", not an error and not a
  silently-created file.
- A release tree staged for `fgctl` (`scripts/build-rust-distribution.mjs`)
  carries the legacy-node payload TOGETHER WITH its production dependencies
  (the package's `dependencies` and theirs), copied next to the sources, so
  every verb runs from the installed release alone. Before this, the staged
  tree held no dependencies and any verb that loads one (`fgos workflow`,
  found when dogfooding a project that had run `fgctl init`) failed with a
  missing-package error while `fgos version` and `fgos doctor` still passed.
  A dependency that is not installed when the tree is built fails the build
  instead of thinning the payload; two installed copies of one name are
  refused. The external-consumer CI step runs a dependency-loading verb for
  this reason, because `version` never imports one.
```

### Target unit

```text
- A package marked as not intended for public registry publication can still
  be installed directly from its GitHub repository — that restriction only
  blocks publishing to a public registry, not this installation path.
- Both CLI entry points (`fgos` and `fgos-runner`) are installed identically,
  executable immediately after install — a fresh install does not require
  the installer to separately locate or make executable the autonomous-loop
  runner command.
- Calling `fgos`/`fgos-runner` (via the dev checkout shell helper) from
  inside a linked git worktree of this repository always runs the MAIN
  checkout's entry point, never that worktree's own local copy — accepted
  as-is for this mechanism, not treated as a defect.
- A package manager whose own policy blocks lifecycle scripts for
  git-hosted dependencies (e.g. pnpm 10+'s `allowBuilds`) never blocks
  installing this package, because this package's install never declares a
  lifecycle script in the first place (per str88-fgos-pnpm-lifecycle) —
  there is nothing for that policy to approve or refuse.
- `fgos setup` run a second time with nothing new to do reports that
  plainly rather than silently repeating (or silently no-oping without
  saying so).
- `fgos doctor`'s `config-not-stale` check on a machine where `fgos setup`
  was never run reports "not configured yet", not an error and not a
  silently-created file.
- A release tree staged for `fgctl` (`scripts/build-rust-distribution.mjs`)
  carries the legacy-node payload TOGETHER WITH its production dependencies
  (the package's `dependencies` and theirs), copied next to the sources, so
  every verb runs from the installed release alone. Before this, the staged
  tree held no dependencies and any verb that loads one (`fgos workflow`,
  found when dogfooding a project that had run `fgctl init`) failed with a
  missing-package error while `fgos version` and `fgos doctor` still passed.
  A dependency that is not installed when the tree is built fails the build
  instead of thinning the payload; two installed copies of one name are
  refused. The external-consumer CI step runs a dependency-loading verb for
  this reason, because `version` never imports one.
```

### Unified diff

```diff
No text difference.
```

## claim_18420261f445f01acf39c262a9ce170c

Source: docs/specs/distribution.md#open-gaps

Target: docs/platform/packaging-distribution/spec.md#open-gaps

Source identity digest: `2d111809d1df3c0a73705ed19792a4096aa30c155891982e6af1bf70d935ff35`

Target identity digest: `3c9b4fc33a1e34edca18ff8772fa5723ac85887b6ed36b987245a612c5f6e06e`

Source shown SHA256: `91949674fd2f880625ac837743a22243b91f24adb24acee25684f0ee690a17a8`

Target shown SHA256: `298ded0fbcb5e573c276240156c8bb87013b15b7a6a2076f767709464cf2cc60`

### Proposed decision

| Field | Value |
|---|---|
| claimId | claim\_18420261f445f01acf39c262a9ce170c |
| sourceUnitDigest | 2d111809d1df3c0a73705ed19792a4096aa30c155891982e6af1bf70d935ff35 |
| targetOwner | docs/platform/packaging-distribution/spec.md |
| targetAnchor | open-gaps |
| claimKind | specification |
| disposition | move |
| reviewStatus | pending |
| authoredBy | codex-session:8@2026-10-13 |
| rationale | The complete heading from docs/specs/distribution.md#open-gaps, under "Open Gaps", is retained at docs/platform/packaging-distribution/spec.md#open-gaps. Only heading depth changes; the direct section payload follows the original source order. The named owner is the packaging-distribution/spec.md topic owner; carriage does not certify current implementation. |

### Source unit

```text
## Open Gaps

(none — coverage is full for the mechanisms this feature adds. `fgos doctor
--fix` now exists for real, per RUL11 (doctor --fix exists and is real, runs every registered fix) above — its own further extension
(which checks eventually get a registered fix) is ordinary registry growth,
tracked per-module, not a gap in this spec.)

Specified by RUL13 (customer customization lives in one tracked workspace folder) but not built yet: the `fgctl init` skeleton and README, and routing the unit-level and capability-level `persona:` names through the same three-tier lookup (only `--seats @name` uses it today; those names are still read from `core/agents` of the working project in `renderPersonaSection`, `src/runner/dispatch/assignment.mjs`). How an extension declares its root is undefined: no extension loader exists, only the domain layer.
```

### Target unit

```text
#### Open Gaps

(none — coverage is full for the mechanisms this feature adds. `fgos doctor
--fix` now exists for real, per RUL11 (doctor --fix exists and is real, runs every registered fix) above — its own further extension
(which checks eventually get a registered fix) is ordinary registry growth,
tracked per-module, not a gap in this spec.)

Specified by RUL13 (customer customization lives in one tracked workspace folder) but not built yet: the `fgctl init` skeleton and README, and routing the unit-level and capability-level `persona:` names through the same three-tier lookup (only `--seats @name` uses it today; those names are still read from `core/agents` of the working project in `renderPersonaSection`, `src/runner/dispatch/assignment.mjs`). How an extension declares its root is undefined: no extension loader exists, only the domain layer.
```

### Unified diff

```diff
--- "docs/specs/distribution.md#open-gaps"
+++ "docs/platform/packaging-distribution/spec.md#open-gaps"
@@ -1,4 +1,4 @@
-## Open Gaps
+#### Open Gaps
 
 (none — coverage is full for the mechanisms this feature adds. `fgos doctor
 --fix` now exists for real, per RUL11 (doctor --fix exists and is real, runs every registered fix) above — its own further extension
```

## claim_4ef3a246eb6f72de0409c2cc711b6f7a

Source: docs/specs/distribution.md#unheaded-block-17

Target: docs/platform/packaging-distribution/spec.md#unheaded-block-94

Source identity digest: `f2aa140aabef20a5a98af537527987721e90af6779c22a7a854dc6b9f0979b31`

Target identity digest: `f2aa140aabef20a5a98af537527987721e90af6779c22a7a854dc6b9f0979b31`

Source shown SHA256: `f2aa140aabef20a5a98af537527987721e90af6779c22a7a854dc6b9f0979b31`

Target shown SHA256: `f2aa140aabef20a5a98af537527987721e90af6779c22a7a854dc6b9f0979b31`

### Proposed decision

| Field | Value |
|---|---|
| claimId | claim\_4ef3a246eb6f72de0409c2cc711b6f7a |
| sourceUnitDigest | f2aa140aabef20a5a98af537527987721e90af6779c22a7a854dc6b9f0979b31 |
| targetOwner | docs/platform/packaging-distribution/spec.md |
| targetAnchor | unheaded-block-94 |
| claimKind | specification |
| disposition | move |
| reviewStatus | pending |
| authoredBy | codex-session:8@2026-10-13 |
| rationale | The complete unheaded-block from docs/specs/distribution.md#unheaded-block-17, under "Open Gaps", is retained at docs/platform/packaging-distribution/spec.md#unheaded-block-94. All clauses, conditions, enumerations and dated status are kept; relative-link changes preserve destinations. The named owner is the packaging-distribution/spec.md topic owner; carriage does not certify current implementation. |

### Source unit

```text
(none — coverage is full for the mechanisms this feature adds. `fgos doctor
--fix` now exists for real, per RUL11 (doctor --fix exists and is real, runs every registered fix) above — its own further extension
(which checks eventually get a registered fix) is ordinary registry growth,
tracked per-module, not a gap in this spec.)
```

### Target unit

```text
(none — coverage is full for the mechanisms this feature adds. `fgos doctor
--fix` now exists for real, per RUL11 (doctor --fix exists and is real, runs every registered fix) above — its own further extension
(which checks eventually get a registered fix) is ordinary registry growth,
tracked per-module, not a gap in this spec.)
```

### Unified diff

```diff
No text difference.
```

## claim_e7c9f593b4b15dfa15ae91707e9a64ec

Source: docs/specs/distribution.md#unheaded-block-18

Target: docs/platform/packaging-distribution/spec.md#unheaded-block-95

Source identity digest: `291f58705fa5b9342b82921aa8ab5eb129462c0bb6c7320a817a6a70fbac6e74`

Target identity digest: `291f58705fa5b9342b82921aa8ab5eb129462c0bb6c7320a817a6a70fbac6e74`

Source shown SHA256: `291f58705fa5b9342b82921aa8ab5eb129462c0bb6c7320a817a6a70fbac6e74`

Target shown SHA256: `291f58705fa5b9342b82921aa8ab5eb129462c0bb6c7320a817a6a70fbac6e74`

### Proposed decision

| Field | Value |
|---|---|
| claimId | claim\_e7c9f593b4b15dfa15ae91707e9a64ec |
| sourceUnitDigest | 291f58705fa5b9342b82921aa8ab5eb129462c0bb6c7320a817a6a70fbac6e74 |
| targetOwner | docs/platform/packaging-distribution/spec.md |
| targetAnchor | unheaded-block-95 |
| claimKind | specification |
| disposition | move |
| reviewStatus | pending |
| authoredBy | codex-session:8@2026-10-13 |
| rationale | The complete unheaded-block from docs/specs/distribution.md#unheaded-block-18, under "Open Gaps", is retained at docs/platform/packaging-distribution/spec.md#unheaded-block-95. All clauses, conditions, enumerations and dated status are kept; relative-link changes preserve destinations. The named owner is the packaging-distribution/spec.md topic owner; carriage does not certify current implementation. |

### Source unit

```text
Specified by RUL13 (customer customization lives in one tracked workspace folder) but not built yet: the `fgctl init` skeleton and README, and routing the unit-level and capability-level `persona:` names through the same three-tier lookup (only `--seats @name` uses it today; those names are still read from `core/agents` of the working project in `renderPersonaSection`, `src/runner/dispatch/assignment.mjs`). How an extension declares its root is undefined: no extension loader exists, only the domain layer.
```

### Target unit

```text
Specified by RUL13 (customer customization lives in one tracked workspace folder) but not built yet: the `fgctl init` skeleton and README, and routing the unit-level and capability-level `persona:` names through the same three-tier lookup (only `--seats @name` uses it today; those names are still read from `core/agents` of the working project in `renderPersonaSection`, `src/runner/dispatch/assignment.mjs`). How an extension declares its root is undefined: no extension loader exists, only the domain layer.
```

### Unified diff

```diff
No text difference.
```

## claim_d992e79d0cffb916c68bf73be5dd33d1

Source: docs/specs/distribution.md#visuals

Target: docs/platform/packaging-distribution/spec.md#visuals

Source identity digest: `03682969962ed31c046c8a9de64dc0e02755ac7a97c42f286059251298f3e856`

Target identity digest: `89ef28e9d464cbb1c6c1edb1b7fd5eaf494a10dc6b24f8af7d5be75ff6bd916d`

Source shown SHA256: `74718daafed663f039eb033dbc7c91eff749d85ead764fd2774e21f593c22bc2`

Target shown SHA256: `1edc5f6d0b198e463d97f31ab14c25481bfa6a0941d97b0ab3c2c986b84d4555`

### Proposed decision

| Field | Value |
|---|---|
| claimId | claim\_d992e79d0cffb916c68bf73be5dd33d1 |
| sourceUnitDigest | 03682969962ed31c046c8a9de64dc0e02755ac7a97c42f286059251298f3e856 |
| targetOwner | docs/platform/packaging-distribution/spec.md |
| targetAnchor | visuals |
| claimKind | specification |
| disposition | move |
| reviewStatus | pending |
| authoredBy | codex-session:8@2026-10-13 |
| rationale | The complete heading from docs/specs/distribution.md#visuals, under "Visuals", is retained at docs/platform/packaging-distribution/spec.md#visuals. Only heading depth changes; the direct section payload follows the original source order. The named owner is the packaging-distribution/spec.md topic owner; carriage does not certify current implementation. |

### Source unit

```text
## Visuals

Not applicable — no screen; this is a command-line install flow.
```

### Target unit

```text
#### Visuals

Not applicable — no screen; this is a command-line install flow.
```

### Unified diff

```diff
--- "docs/specs/distribution.md#visuals"
+++ "docs/platform/packaging-distribution/spec.md#visuals"
@@ -1,3 +1,3 @@
-## Visuals
+#### Visuals
 
 Not applicable — no screen; this is a command-line install flow.
\ No newline at end of file
```

## claim_a84463023d9ac4e9ff86edae6ccd1bd4

Source: docs/specs/distribution.md#unheaded-block-19

Target: docs/platform/packaging-distribution/spec.md#unheaded-block-96

Source identity digest: `84ea69d22b8a2aa754f14016550c25df1336715f9701bbfe4f0108195a852bb7`

Target identity digest: `84ea69d22b8a2aa754f14016550c25df1336715f9701bbfe4f0108195a852bb7`

Source shown SHA256: `84ea69d22b8a2aa754f14016550c25df1336715f9701bbfe4f0108195a852bb7`

Target shown SHA256: `84ea69d22b8a2aa754f14016550c25df1336715f9701bbfe4f0108195a852bb7`

### Proposed decision

| Field | Value |
|---|---|
| claimId | claim\_a84463023d9ac4e9ff86edae6ccd1bd4 |
| sourceUnitDigest | 84ea69d22b8a2aa754f14016550c25df1336715f9701bbfe4f0108195a852bb7 |
| targetOwner | docs/platform/packaging-distribution/spec.md |
| targetAnchor | unheaded-block-96 |
| claimKind | specification |
| disposition | move |
| reviewStatus | pending |
| authoredBy | codex-session:8@2026-10-13 |
| rationale | The complete unheaded-block from docs/specs/distribution.md#unheaded-block-19, under "Visuals", is retained at docs/platform/packaging-distribution/spec.md#unheaded-block-96. All clauses, conditions, enumerations and dated status are kept; relative-link changes preserve destinations. The named owner is the packaging-distribution/spec.md topic owner; carriage does not certify current implementation. |

### Source unit

```text
Not applicable — no screen; this is a command-line install flow.
```

### Target unit

```text
Not applicable — no screen; this is a command-line install flow.
```

### Unified diff

```diff
No text difference.
```

## claim_aa28053a8a4b2ff13690fc6a20044b9f

Source: docs/specs/distribution.md#pointers-implementation

Target: docs/platform/packaging-distribution/spec.md#pointers-implementation

Source identity digest: `f45aeba53fa3144eaec9bf04c50a58c55356471c3dc0e3e0af31be4a6e027db9`

Target identity digest: `851884c939509226f78c3caadf8509ec1afffbe99c5067cf97630ae6887b01ab`

Source shown SHA256: `e33e000f861a79217fc35071f71bf8f1c1cb03ef1ceb0ddb70f4be5a853d077b`

Target shown SHA256: `d348bb89d80d501507641e13110bdb5e5a06465c7cd17ff7ef0f34676c80a3c8`

### Proposed decision

| Field | Value |
|---|---|
| claimId | claim\_aa28053a8a4b2ff13690fc6a20044b9f |
| sourceUnitDigest | f45aeba53fa3144eaec9bf04c50a58c55356471c3dc0e3e0af31be4a6e027db9 |
| targetOwner | docs/platform/packaging-distribution/spec.md |
| targetAnchor | pointers-implementation |
| claimKind | specification |
| disposition | move |
| reviewStatus | pending |
| authoredBy | codex-session:8@2026-10-13 |
| rationale | The complete heading from docs/specs/distribution.md#pointers-implementation, under "Pointers (implementation)", is retained at docs/platform/packaging-distribution/spec.md#pointers-implementation. Only heading depth changes; the direct section payload follows the original source order. The named owner is the packaging-distribution/spec.md topic owner; carriage does not certify current implementation. |

### Source unit

```text
## Pointers (implementation)

- `repo/package.json` — `version`, `files`, `bin.fgos`, `bin.fgos-runner`
  fields define the installable surface.
- `repo/README.md` — `## Install` section states the exact command for users.
- `repo/test/install-packaging.test.mjs` — real end-to-end proof: packs the
  package, installs it into a scratch location, and verifies both the
  content allowlist and that running the installed binary from a fresh
  external project creates its own data directory there, not in the source
  repo.
- `docs/coexistence.md` — what happens after install, at `fgos init` time.
- `repo/scripts/fgos-shell-integration.sh` — the dev checkout shell helper;
  defines the `fgos`/`fgos-runner` shell functions, resolving the checkout
  root via `git rev-parse --path-format=absolute --git-common-dir` (never
  `--show-toplevel`, which resolves wrong inside a linked worktree).
- `repo/test/scripts/fgos-shell-integration.test.mjs` — real-git-checkout
  proof: repo-root resolution, linked-worktree resolution, and the
  no-git-repo error path, for both functions.
- `repo/README.md` — "Dev shell helpers" note under `## Install` links the
  helper file with one-line sourcing instructions; the "Contributing" note
  documents the manual `npm run setup:hooks` command.
- `repo/package.json` — `scripts["setup:hooks"]` runs the same command the
  automatic `prepare` script used to run; `scripts.prepare` no longer
  exists.
- `repo/scripts/install-git-hooks.mjs` — the contributor hooks setup logic
  itself, unchanged; only its trigger moved from automatic to manual.
- `repo/test/scripts/install-git-hooks.test.mjs` — includes the regression
  case asserting `package.json` has no `prepare` key and does have
  `setup:hooks`.
- `repo/src/setup/ansi.mjs` — hand-rolled ANSI color helpers behind
  `--pretty`, zero dependency.
- `repo/src/setup/config-merge.mjs` — `mergeConfigDefaults`, the
  general-purpose deep-merge-fill-missing-only utility (arrays treated as
  leaves); `repo/src/runner/dispatch.mjs`'s `ensureRunnerConfig` calls it
  when a config file already exists.
- `repo/src/setup/shell-rc.mjs` — bash/zsh rc-file detection and idempotent
  source-line insertion.
- `repo/src/setup/checks.mjs` — `fgos doctor`'s check registry (Data
  Dictionary #7).
- `repo/bin/fgos.mjs` — `setup`/`doctor` verb dispatch, `--pretty` rendering
  gated to only these two verbs (CTR001 unchanged for every other verb).
- `repo/src/cli/command-registry.mjs` — `setup`/`doctor` verb manifest
  entries.
- `repo/docs/architecture-manifest.json` — layer registration for the four
  `src/setup/*.mjs` files.
- `repo/test/setup/*.test.mjs` — unit and real-CLI proof for all of the
  above.
```

### Target unit

```text
#### Pointers (implementation)

- `repo/package.json` — `version`, `files`, `bin.fgos`, `bin.fgos-runner`
  fields define the installable surface.
- `repo/README.md` — `## Install` section states the exact command for users.
- `repo/test/install-packaging.test.mjs` — real end-to-end proof: packs the
  package, installs it into a scratch location, and verifies both the
  content allowlist and that running the installed binary from a fresh
  external project creates its own data directory there, not in the source
  repo.
- `docs/coexistence.md` — what happens after install, at `fgos init` time.
- `repo/scripts/fgos-shell-integration.sh` — the dev checkout shell helper;
  defines the `fgos`/`fgos-runner` shell functions, resolving the checkout
  root via `git rev-parse --path-format=absolute --git-common-dir` (never
  `--show-toplevel`, which resolves wrong inside a linked worktree).
- `repo/test/scripts/fgos-shell-integration.test.mjs` — real-git-checkout
  proof: repo-root resolution, linked-worktree resolution, and the
  no-git-repo error path, for both functions.
- `repo/README.md` — "Dev shell helpers" note under `## Install` links the
  helper file with one-line sourcing instructions; the "Contributing" note
  documents the manual `npm run setup:hooks` command.
- `repo/package.json` — `scripts["setup:hooks"]` runs the same command the
  automatic `prepare` script used to run; `scripts.prepare` no longer
  exists.
- `repo/scripts/install-git-hooks.mjs` — the contributor hooks setup logic
  itself, unchanged; only its trigger moved from automatic to manual.
- `repo/test/scripts/install-git-hooks.test.mjs` — includes the regression
  case asserting `package.json` has no `prepare` key and does have
  `setup:hooks`.
- `repo/src/setup/ansi.mjs` — hand-rolled ANSI color helpers behind
  `--pretty`, zero dependency.
- `repo/src/setup/config-merge.mjs` — `mergeConfigDefaults`, the
  general-purpose deep-merge-fill-missing-only utility (arrays treated as
  leaves); `repo/src/runner/dispatch.mjs`'s `ensureRunnerConfig` calls it
  when a config file already exists.
- `repo/src/setup/shell-rc.mjs` — bash/zsh rc-file detection and idempotent
  source-line insertion.
- `repo/src/setup/checks.mjs` — `fgos doctor`'s check registry (Data
  Dictionary #7).
- `repo/bin/fgos.mjs` — `setup`/`doctor` verb dispatch, `--pretty` rendering
  gated to only these two verbs (CTR001 unchanged for every other verb).
- `repo/src/cli/command-registry.mjs` — `setup`/`doctor` verb manifest
  entries.
- `repo/docs/architecture-manifest.json` — layer registration for the four
  `src/setup/*.mjs` files.
- `repo/test/setup/*.test.mjs` — unit and real-CLI proof for all of the
  above.
```

### Unified diff

```diff
--- "docs/specs/distribution.md#pointers-implementation"
+++ "docs/platform/packaging-distribution/spec.md#pointers-implementation"
@@ -1,4 +1,4 @@
-## Pointers (implementation)
+#### Pointers (implementation)
 
 - `repo/package.json` — `version`, `files`, `bin.fgos`, `bin.fgos-runner`
   fields define the installable surface.
```

## claim_b5695d38282e111f8ed06656b2efa433

Source: docs/specs/distribution.md#unheaded-block-20

Target: docs/platform/packaging-distribution/spec.md#unheaded-block-97

Source identity digest: `dafeb397fad0ae82979e931d86c897ed92c0d4769a5e303569c6c82f36da4bb9`

Target identity digest: `dafeb397fad0ae82979e931d86c897ed92c0d4769a5e303569c6c82f36da4bb9`

Source shown SHA256: `dafeb397fad0ae82979e931d86c897ed92c0d4769a5e303569c6c82f36da4bb9`

Target shown SHA256: `dafeb397fad0ae82979e931d86c897ed92c0d4769a5e303569c6c82f36da4bb9`

### Proposed decision

| Field | Value |
|---|---|
| claimId | claim\_b5695d38282e111f8ed06656b2efa433 |
| sourceUnitDigest | dafeb397fad0ae82979e931d86c897ed92c0d4769a5e303569c6c82f36da4bb9 |
| targetOwner | docs/platform/packaging-distribution/spec.md |
| targetAnchor | unheaded-block-97 |
| claimKind | specification |
| disposition | move |
| reviewStatus | pending |
| authoredBy | codex-session:8@2026-10-13 |
| rationale | The complete unheaded-block from docs/specs/distribution.md#unheaded-block-20, under "Pointers (implementation)", is retained at docs/platform/packaging-distribution/spec.md#unheaded-block-97. All clauses, conditions, enumerations and dated status are kept; relative-link changes preserve destinations. The named owner is the packaging-distribution/spec.md topic owner; carriage does not certify current implementation. |

### Source unit

```text
- `repo/package.json` — `version`, `files`, `bin.fgos`, `bin.fgos-runner`
  fields define the installable surface.
- `repo/README.md` — `## Install` section states the exact command for users.
- `repo/test/install-packaging.test.mjs` — real end-to-end proof: packs the
  package, installs it into a scratch location, and verifies both the
  content allowlist and that running the installed binary from a fresh
  external project creates its own data directory there, not in the source
  repo.
- `docs/coexistence.md` — what happens after install, at `fgos init` time.
- `repo/scripts/fgos-shell-integration.sh` — the dev checkout shell helper;
  defines the `fgos`/`fgos-runner` shell functions, resolving the checkout
  root via `git rev-parse --path-format=absolute --git-common-dir` (never
  `--show-toplevel`, which resolves wrong inside a linked worktree).
- `repo/test/scripts/fgos-shell-integration.test.mjs` — real-git-checkout
  proof: repo-root resolution, linked-worktree resolution, and the
  no-git-repo error path, for both functions.
- `repo/README.md` — "Dev shell helpers" note under `## Install` links the
  helper file with one-line sourcing instructions; the "Contributing" note
  documents the manual `npm run setup:hooks` command.
- `repo/package.json` — `scripts["setup:hooks"]` runs the same command the
  automatic `prepare` script used to run; `scripts.prepare` no longer
  exists.
- `repo/scripts/install-git-hooks.mjs` — the contributor hooks setup logic
  itself, unchanged; only its trigger moved from automatic to manual.
- `repo/test/scripts/install-git-hooks.test.mjs` — includes the regression
  case asserting `package.json` has no `prepare` key and does have
  `setup:hooks`.
- `repo/src/setup/ansi.mjs` — hand-rolled ANSI color helpers behind
  `--pretty`, zero dependency.
- `repo/src/setup/config-merge.mjs` — `mergeConfigDefaults`, the
  general-purpose deep-merge-fill-missing-only utility (arrays treated as
  leaves); `repo/src/runner/dispatch.mjs`'s `ensureRunnerConfig` calls it
  when a config file already exists.
- `repo/src/setup/shell-rc.mjs` — bash/zsh rc-file detection and idempotent
  source-line insertion.
- `repo/src/setup/checks.mjs` — `fgos doctor`'s check registry (Data
  Dictionary #7).
- `repo/bin/fgos.mjs` — `setup`/`doctor` verb dispatch, `--pretty` rendering
  gated to only these two verbs (CTR001 unchanged for every other verb).
- `repo/src/cli/command-registry.mjs` — `setup`/`doctor` verb manifest
  entries.
- `repo/docs/architecture-manifest.json` — layer registration for the four
  `src/setup/*.mjs` files.
- `repo/test/setup/*.test.mjs` — unit and real-CLI proof for all of the
  above.
```

### Target unit

```text
- `repo/package.json` — `version`, `files`, `bin.fgos`, `bin.fgos-runner`
  fields define the installable surface.
- `repo/README.md` — `## Install` section states the exact command for users.
- `repo/test/install-packaging.test.mjs` — real end-to-end proof: packs the
  package, installs it into a scratch location, and verifies both the
  content allowlist and that running the installed binary from a fresh
  external project creates its own data directory there, not in the source
  repo.
- `docs/coexistence.md` — what happens after install, at `fgos init` time.
- `repo/scripts/fgos-shell-integration.sh` — the dev checkout shell helper;
  defines the `fgos`/`fgos-runner` shell functions, resolving the checkout
  root via `git rev-parse --path-format=absolute --git-common-dir` (never
  `--show-toplevel`, which resolves wrong inside a linked worktree).
- `repo/test/scripts/fgos-shell-integration.test.mjs` — real-git-checkout
  proof: repo-root resolution, linked-worktree resolution, and the
  no-git-repo error path, for both functions.
- `repo/README.md` — "Dev shell helpers" note under `## Install` links the
  helper file with one-line sourcing instructions; the "Contributing" note
  documents the manual `npm run setup:hooks` command.
- `repo/package.json` — `scripts["setup:hooks"]` runs the same command the
  automatic `prepare` script used to run; `scripts.prepare` no longer
  exists.
- `repo/scripts/install-git-hooks.mjs` — the contributor hooks setup logic
  itself, unchanged; only its trigger moved from automatic to manual.
- `repo/test/scripts/install-git-hooks.test.mjs` — includes the regression
  case asserting `package.json` has no `prepare` key and does have
  `setup:hooks`.
- `repo/src/setup/ansi.mjs` — hand-rolled ANSI color helpers behind
  `--pretty`, zero dependency.
- `repo/src/setup/config-merge.mjs` — `mergeConfigDefaults`, the
  general-purpose deep-merge-fill-missing-only utility (arrays treated as
  leaves); `repo/src/runner/dispatch.mjs`'s `ensureRunnerConfig` calls it
  when a config file already exists.
- `repo/src/setup/shell-rc.mjs` — bash/zsh rc-file detection and idempotent
  source-line insertion.
- `repo/src/setup/checks.mjs` — `fgos doctor`'s check registry (Data
  Dictionary #7).
- `repo/bin/fgos.mjs` — `setup`/`doctor` verb dispatch, `--pretty` rendering
  gated to only these two verbs (CTR001 unchanged for every other verb).
- `repo/src/cli/command-registry.mjs` — `setup`/`doctor` verb manifest
  entries.
- `repo/docs/architecture-manifest.json` — layer registration for the four
  `src/setup/*.mjs` files.
- `repo/test/setup/*.test.mjs` — unit and real-CLI proof for all of the
  above.
```

### Unified diff

```diff
No text difference.
```
