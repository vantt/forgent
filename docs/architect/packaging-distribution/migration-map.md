```txt
Title: Packaging Distribution Documentation Migration Map
Audience: human maintainer, architecture collaborator, documentation agent
Purpose: Map current distribution-related sources to the target documentation area before rewriting
Design status: Draft
Canonical: No
Source type: Human-agent migration planning note
Last reviewed: 2026-09-13
```

# 1. Purpose

This map prepares the rewrite of packaging/distribution documentation into the target `docs/platform/packaging-distribution/` area.

It answers:

- which current documents and implementation evidence matter;
- what authority each source has right now;
- whether the source is generated, hand-curated, discussion-derived, historical, or proof;
- where each source should land in the new documentation shape;
- what must be verified against code before canonical rewrite.

No canonical document is moved by this map.

# 2. Target Area Shape

```txt
docs/platform/packaging-distribution/
  README.md
  spec.md
  architecture/
    runtime-identity-and-activation.md
    fgctl-and-local-fgos.md
    future-constraints.md
  contracts/
    release-manifest.md
    activation-binding.md
    distribution-pin.md
    projection-ledger.md
    setup-doctor-registry.md
  verification/
    implementation-alignment.md
    install-and-release-proof.md
  history/
    distribution-baseline.md
```

# 3. Authority Classes

| Class | Meaning | Rewrite rule |
| --- | --- | --- |
| Current shipped behavior | Describes behavior implemented in code/tests today. | Can be promoted into `spec.md` only after code/test scan. |
| Architecture target | Accepted or near-accepted design direction, but not necessarily fully implemented. | Promote into `architecture/` with `Implementation Alignment`. |
| Contract candidate | Exact schema, boundary, state record, or command ownership rule. | Extract into `contracts/` after verifying implementation status. |
| Rationale | Explains why direction changed. | Link from spec/architecture; avoid turning outdated facts into current truth. |
| Historical baseline | Retired or legacy state preserved for traceability. | Move to `history/`; do not make normative. |
| Verification evidence | Code paths, tests, scripts, CI proof. | Link from `verification/`; do not mix into long prose. |
| Generated/legacy projection | Old generated or generated-like view. | Keep as source until promoted; later replace with redirect/status note. |

# 4. Document Migration Map

| Source | Source type | Authority now | Target destination | Action |
| --- | --- | --- | --- | --- |
| `docs/specs/distribution.md` | Generated/curated legacy spec | Current shipped behavior plus legacy framing | `docs/platform/packaging-distribution/spec.md`, `contracts/setup-doctor-registry.md`, `verification/install-and-release-proof.md`, `history/distribution-baseline.md` | Extract facts by section; remove long implementation essays from spec; link proof instead. |
| `docs/distribution-vision.md` | Hand-curated vision/rationale | Rationale; partly superseded by later implementation | `docs/platform/packaging-distribution/history/distribution-vision.md` or rationale links from architecture/spec | Reconcile dated claims; mark which open questions are now implemented. |
| `docs/architect/packaging-distribution/README.md` | Discussion-derived architecture portal | Architecture target portal | `docs/platform/packaging-distribution/README.md` | Promote as area portal seed; make human scan path explicit. |
| `docs/architect/packaging-distribution/runtime-identity-and-activation.md` | Discussion-derived architecture/contract draft | Architecture target and contract candidate | `architecture/runtime-identity-and-activation.md`, `contracts/release-manifest.md`, `contracts/activation-binding.md`, `contracts/distribution-pin.md`, `contracts/projection-ledger.md` | Split design narrative from exact records/contracts; add implementation status per claim. |
| `docs/architect/packaging-distribution/future-constraints.md` | Discussion-derived architecture constraints | Future constraint only | `architecture/future-constraints.md` | Preserve as future-only; prevent readers from treating gateway/shared web as current scope. |
| `docs/architect/packaging-distribution/scope-map.md` | Discussion-derived scope classifier | Useful migration guide | `README.md` scope section or `history/scope-map.md` | Mine for boundary rules; retire after portal covers it. |
| `docs/architect/packaging-distribution/workspace-runtime-model.md` | Redirect/pointer | Superseded pointer | Redirect/status note only | Retire after links point to workspace topology. |
| `docs/architect/packaging-distribution/history/distribution-baseline.md` | Hand-curated history | Historical baseline and scattered source preservation | `history/distribution-baseline.md` | Preserve; extract still-current facts before archiving. |
| `docs/architect/workspace-topology.md` | Cross-area architecture | External dependency consumed by packaging-distribution | Link from `README.md` and `architecture/runtime-identity-and-activation.md` | Do not move into packaging-distribution. |
| `docs/specs/reading-map.md` | Legacy map | Current legacy navigation | Later update or redirect after migration | Update only after new docs exist. |
| `docs/reading-map.md` | New documentation map | Target navigation layer | Add packaging-distribution area after promotion | Update after area portal exists. |
| `docs/doc-governance.md` | Documentation governance | Canonical governance | Add `Implementation Alignment` rule later | Separate governance update after distribution plan is accepted. |
| `README.md` | User-facing install documentation | Current user-facing intent | Link as external user-facing source from spec/verification | Reconcile with implementation and spec; do not bury maintainer details in README. |

# 5. Implementation Evidence Map

| Evidence surface | Evidence paths | Claims it can prove | Target verification doc |
| --- | --- | --- | --- |
| Native/Rust distribution build | `scripts/build-rust-distribution.mjs`, `test/rust-host/release-tree.test.mjs` | Release tree creation, legacy Node payload packaging, manifest/release content shape. | `verification/install-and-release-proof.md` |
| `fgctl` stage/init/upgrade | `test/rust-host/fgctl-stage.test.mjs`, `test/rust-host/fgctl-init.test.mjs`, `test/rust-host/fgctl-upgrade.test.mjs` | `fgctl` acquisition/staging/init/upgrade behavior and workspace installation flow. | `verification/implementation-alignment.md` |
| External consumer install script | `scripts/ci-external-consumer.sh`, `test/install/install-sh.test.mjs` | Install script produces executable `fgctl`, project init, runtime JSON, repair/upgrade smoke path. | `verification/install-and-release-proof.md` |
| Legacy Node CLI payload | `bin/fgos.mjs`, `package.json`, `bin/fgos-runner.mjs`, `test/install-packaging.test.mjs` | npm compatibility, `fgos`/`fgos-runner` binaries, Node payload still works. | `verification/install-and-release-proof.md` |
| Shell helper resolution | `scripts/fgos-shell-integration.sh`, `test/scripts/fgos-shell-integration.test.mjs` | Resolution tiering: workspace installation, dev checkout, project-local install, global install fallback. | `verification/implementation-alignment.md` |
| Setup/doctor registry | `src/setup/checks.mjs`, `src/setup/registrations.mjs`, `src/setup/config-merge.mjs`, `bin/fgos.mjs`, `test/setup/*.test.mjs` | Registered checks/fixes/defaults, read-only doctor default, `doctor --fix`, setup running registered fixes, config merge behavior. | `contracts/setup-doctor-registry.md`, `verification/implementation-alignment.md` |
| Plugin/dev-skill packaging | `plugins/fgOS/skills/`, `src/setup/skill-wrappers.mjs`, `test/skills/fgos-mirror.test.mjs` | Plugin skill distribution and mirror integrity. | Possible `contracts/plugin-skill-packaging.md` if too large for setup/doctor contract. |
| Global/project config precedence | `src/config/global-config.mjs`, `test/config/global-config.test.mjs`, `src/config/shared-config-file.mjs` | Project config overrides global config; missing global resolves safely. | `spec.md`, `contracts/setup-doctor-registry.md` |
| Command registry exposure | `src/cli/command-registry.mjs`, `test/cli/command-registry.test.mjs`, `test/cli/fgos-version.test.mjs` | Which commands are visible and how setup/doctor/version surfaces are registered. | `verification/implementation-alignment.md` |

# 6. Implementation Alignment Seed

This seed should become `docs/platform/packaging-distribution/verification/implementation-alignment.md`.

| Design claim | Implementation status | Evidence | Gap / next action |
| --- | --- | --- | --- |
| `fgctl` is the recommended install/bootstrap entry. | partial | `README.md`, `scripts/ci-external-consumer.sh`, `test/rust-host/fgctl-init.test.mjs`, `test/rust-host/fgctl-upgrade.test.mjs` | Verify current release asset/install script path before canonical spec wording. |
| Legacy npm/Node install remains compatibility path. | implemented | `README.md`, `package.json`, `bin/fgos.mjs`, `bin/fgos-runner.mjs`, `test/install-packaging.test.mjs` | Spec must label this compatibility, not primary target. |
| Runtime identity is digest-based through `artifactDigest`. | partial | `docs/architect/packaging-distribution/runtime-identity-and-activation.md`, `scripts/ci-external-consumer.sh`, `test/rust-host/*` | Confirm exact manifest digest implementation before contract extraction. |
| Workspace commands enter through `.fgos/installation/bin/fgos`. | partial | `scripts/fgos-shell-integration.sh`, `scripts/ci-external-consumer.sh`, `test/scripts/fgos-shell-integration.test.mjs` | Verify shim behavior in Rust host code before making hard contract. |
| Activation is per-workspace via `.fgos/installation/activation.json`. | partial | `runtime-identity-and-activation.md`, `scripts/ci-external-consumer.sh`, `test/rust-host/fgctl-upgrade.test.mjs` | Extract exact `activation.json` shape from implementation before writing contract. |
| `fgctl` must not write host-visible projections directly. | planned/unknown | Architecture docs | Need code scan for current projection materialization path before canonical claim. |
| `fgos doctor` default path is read-only. | implemented | `docs/specs/distribution.md`, `bin/fgos.mjs`, `test/setup/*.test.mjs` | Preserve as spec rule and link tests. |
| `fgos doctor --fix` runs registered fixes then reports. | implemented | `docs/specs/distribution.md`, `src/setup/registrations.mjs`, `bin/fgos.mjs`, `test/setup/*.test.mjs` | Extract into `contracts/setup-doctor-registry.md`. |
| `fgos setup` also runs registered fixes. | implemented | `docs/specs/distribution.md`, `bin/fgos.mjs`, `docs/history/setup-runs-registered-fixes/CONTEXT.md` | Add exact tests/evidence in verification doc. |
| Project config overrides global config. | implemented | `src/config/global-config.mjs`, `test/config/global-config.test.mjs`, `docs/specs/distribution.md` | Keep in spec; link config contract if created. |
| Plugin-only consumers receive required dev skills. | implemented | `docs/specs/distribution.md`, `plugins/fgOS/skills/`, `test/skills/fgos-mirror.test.mjs` | Decide whether to split plugin packaging into its own contract. |

# 7. Rewrite Work Order

1. Create `docs/platform/packaging-distribution/README.md` as the human portal.
2. Create `verification/implementation-alignment.md` from section 6, expanded with exact links and statuses.
3. Rewrite `spec.md` from `docs/specs/distribution.md` and `README.md`, keeping only current state and user-visible rules.
4. Promote `runtime-identity-and-activation.md` into architecture plus extracted contracts.
5. Extract `setup-doctor-registry.md` because it is already implemented and heavily referenced.
6. Move historical/rationale material after all still-current facts are extracted.
7. Update reading maps and old path redirects/status notes.

# 8. Open Questions Before Canonical Rewrite

| Question | Why it matters | Current recommendation |
| --- | --- | --- |
| Should setup/doctor be its own area? | It is broad, but still directly tied to install/runtime readiness. | Keep as packaging-distribution contract for this rewrite. Split later only if it gains independent lifecycle ownership. |
| Should `plugin-skill-packaging` be a separate contract? | It is distribution-related but can bloat setup/doctor docs. | Start as a subsection; split when the section exceeds a compact contract. |
| Is `fgctl` implementation complete enough to call it current behavior? | README says recommended; architecture says target; tests show real progress. | Use `partial` until release/install path is verified end to end. |
| Should old `docs/specs/distribution.md` be edited directly? | It may be generated/legacy projection and is still referenced by AGENTS. | Do not edit first. Promote into `docs/platform/packaging-distribution/spec.md`, then redirect/update references. |
| Where should workspace topology live? | Distribution depends on it, but does not own state topology. | Keep it platform-wide and link it. |

# 9. Promotion Checklist

Before marking any promoted distribution doc canonical:

- code/test scan was run in the same rewrite round;
- each design claim has an implementation status;
- implemented claims link to code/test evidence;
- planned or partial claims have gaps and next actions;
- old source docs are either linked, redirected, or explicitly archived;
- `docs/reading-map.md` and legacy `docs/specs/reading-map.md` agree on the current read path;
- human reader can find current behavior without reading governance first.
