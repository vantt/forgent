```txt
Title: Packaging Distribution Documentation Rewrite Plan
Audience: human maintainer, architecture collaborator, documentation agent
Purpose: Plan the rewrite of packaging/distribution documentation before moving canonical docs
Design status: Draft
Canonical: No
Source type: Human-agent planning note
Last reviewed: 2026-09-13
```

# 1. Goal

Rewrite the packaging/distribution documentation so a human can quickly answer:

- what is shipped today;
- what design is accepted but not fully implemented yet;
- which runtime/install authority owns each action;
- which code/tests prove each claim;
- which old generated/hand-curated docs are still source material only.

This plan does not move or rewrite canonical content yet. It defines the scan result, target shape, open decisions, and migration sequence.

# 2. Scan Result

## 2.1 Primary Source Documents

| Source | Current role | Rewrite treatment |
| --- | --- | --- |
| `docs/specs/distribution.md` | Current BA/state spec for the old Node/npm/setup/doctor distribution layer, with many implemented facts and test links. | Preserve as current-state source; split into current shipped behavior, contracts, and historical context during rewrite. |
| `docs/distribution-vision.md` | Vision and rationale for install/setup/doctor becoming stable, reusable, self-fixing, global/project aware, and CI-backed. | Preserve as rationale; reconcile outdated statements against newer implementation and architecture docs. |
| `docs/architect/packaging-distribution/README.md` | Current architecture package portal for the new fgctl/project-local runtime direction. | Promote into the new packaging-distribution area portal or use it as the seed for that portal. |
| `docs/architect/packaging-distribution/runtime-identity-and-activation.md` | Main architecture contract draft for release identity, activation, pins, shims, manifest, repair, rollback. | Promote as architecture/contract source after implementation alignment scan. |
| `docs/architect/packaging-distribution/workspace-runtime-model.md` | Pointer to the renamed topology doc. | Retire or keep only as redirect after migration. |
| `docs/architect/workspace-topology.md` | Cross-area topology contract consumed by distribution. | Keep outside distribution; link from distribution docs as a platform contract dependency. |
| `docs/architect/packaging-distribution/future-constraints.md` | Future gateway/shared-web constraints. | Keep as future constraints; do not present as current implementation. |
| `docs/architect/packaging-distribution/history/distribution-baseline.md` | Curated history of old npm/global/setup facts and scattered references. | Move/promote into history after current facts have been extracted. |
| `docs/specs/reading-map.md` | Legacy doc/source map that points to distribution docs and source files. | Update only after target docs exist. |
| `README.md` | User-facing install instructions now prefer `fgctl`; npm is compatibility. | Must be reconciled with distribution spec and current code scan. |

## 2.2 Related Implementation Surface Found In Code Scan

| Surface | Evidence paths | Notes |
| --- | --- | --- |
| Native/Rust distribution and `fgctl` path | `scripts/build-rust-distribution.mjs`, `scripts/ci-external-consumer.sh`, `test/rust-host/fgctl-stage.test.mjs`, `test/rust-host/fgctl-init.test.mjs`, `test/rust-host/fgctl-upgrade.test.mjs`, `test/rust-host/release-tree.test.mjs` | This proves the new direction is not only prose; rewrite needs an implementation-alignment table for each claim. |
| Legacy Node payload | `bin/fgos.mjs`, `scripts/build-rust-distribution.mjs`, `test/rust-host/*`, `package.json` | Must be documented as compatibility payload/bridge, not as the only distribution model. |
| Project-local runtime/shim resolution | `scripts/fgos-shell-integration.sh`, `test/scripts/fgos-shell-integration.test.mjs`, `scripts/ci-external-consumer.sh` | Shell helper already recognizes `.fgos/installation/bin/fgos` before dev/project/global tiers. |
| Setup/doctor registry | `src/setup/checks.mjs`, `src/setup/registrations.mjs`, `src/setup/config-merge.mjs`, `bin/fgos.mjs`, `test/setup/*.test.mjs` | This is both distribution-adjacent and operational. Need decide whether it stays under distribution or becomes a separate area later. |
| Install packaging proof | `test/install-packaging.test.mjs`, `test/install/install-sh.test.mjs`, `test/install/coexist.test.mjs` | Rewrite should link these as verification, not bury them in prose. |
| User install docs | `README.md`, `docs/how-to/cut-a-fgos-release-tag.md` | README already describes `fgctl` as recommended and npm as compatibility. |
| Plugin/dev-skill packaging | `plugins/fgOS/skills/`, `test/skills/fgos-mirror.test.mjs`, `src/setup/skill-wrappers.mjs` | Distribution touches this, but it may deserve a sub-contract rather than bloating the main spec. |

# 3. Documentation Standard Gap

The current documentation standard has status, evidence, and verification sections, but it does not yet force a direct design-versus-implementation comparison.

For this rewrite, every maintained distribution document that contains normative design claims should include this block:

| Design claim | Implementation status | Evidence | Gap / next action |
| --- | --- | --- | --- |
| Short, testable claim | `implemented`, `partial`, `planned`, `superseded`, or `unknown` | Code/test/doc links | What remains or why no action is needed |

This should later be promoted into `docs/doc-governance.md` and the templates as an `Implementation Alignment` rule.

# 4. Proposed Target Shape

Target area name: `packaging-distribution`.

Target human-facing title: `Packaging And Distribution`.

Proposed destination after migration:

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

Cross-area dependencies should stay outside the area and be linked:

| Dependency | Suggested owner |
| --- | --- |
| Workspace topology | Platform-wide architecture, not packaging-distribution |
| Host invocation routing / Rust host command dispatch | Host/runtime area |
| Confinement backend setup/doctor checks | Confinement authority area, linked from packaging-distribution |
| Gateway/shared web future | Gateway area plus distribution future constraints |

# 5. Rewrite Method

## 5.1 Phase 1 - Freeze Inventory

Create a source inventory before rewriting:

- list every distribution-related doc;
- classify each as current truth, architecture target, history, generated projection, or verification evidence;
- identify whether each source appears generated, hand-curated, or discussion-derived;
- record source authority and target destination.

Output: inventory table in the rewrite plan or a short `migration-map.md`.

## 5.2 Phase 2 - Decide Authority Model

Settle these labels before editing canonical docs:

| Question | Recommended answer |
| --- | --- |
| Is `docs/specs/distribution.md` canonical after rewrite? | No; it remains legacy/current-state source until promoted into `docs/platform/packaging-distribution/spec.md`. |
| Is `runtime-identity-and-activation.md` current implementation truth? | Not fully; it is architecture target plus partial implementation, so it needs `Implementation Alignment`. |
| Does setup/doctor belong in packaging-distribution? | For now yes as a packaging-distribution contract, but keep it separable as `contracts/setup-doctor-registry.md`. |
| Does workspace topology belong inside packaging-distribution? | No; packaging-distribution consumes it and links to it. |

## 5.3 Phase 3 - Write The Area Portal

Create `docs/platform/packaging-distribution/README.md` with:

- who should read this area;
- what to read first by purpose;
- current shipped model versus target runtime model;
- owner boundaries;
- links to spec, architecture, contracts, verification, and history.

The portal must be scannable for humans without requiring them to read governance first.

## 5.4 Phase 4 - Rewrite The Spec

Rewrite `docs/specs/distribution.md` into `docs/platform/packaging-distribution/spec.md`.

The new spec should be BA/state-oriented:

- user-visible install/setup/doctor behavior;
- supported install channels;
- global/project/dev checkout precedence;
- setup/doctor rules;
- package/plugin distribution facts;
- compatibility guarantees;
- known non-goals.

It should not carry long implementation essays. Those move to architecture, contracts, verification, or history.

## 5.5 Phase 5 - Promote Architecture

Promote the architecture package into smaller docs:

- `runtime-identity-and-activation.md`: identity, roots, activation, lifecycle;
- `fgctl-and-local-fgos.md`: ownership split between global bootstrap/control and local project runtime;
- `future-constraints.md`: shared gateway/web constraints, explicitly future-only.

Each architecture doc must carry `Implementation Alignment`.

## 5.6 Phase 6 - Extract Contracts

Move exact schemas and boundaries into contracts:

- `ReleaseManifest`;
- `ActivationRecord`;
- `.fgos/distribution.json` pin;
- projection ledger;
- setup/doctor registry;
- plugin/dev-skill packaging contract if it remains too large for `setup-doctor-registry.md`.

Contracts should link directly to implementation and tests.

## 5.7 Phase 7 - Build Verification View

Create `verification/implementation-alignment.md` to track:

- design claim;
- implementation status;
- code/test evidence;
- gap;
- next validation command.

This is the main answer to “mức độ triển khai so với thiết kế”.

## 5.8 Phase 8 - Redirect And Retire Legacy Docs

Only after the new docs are reviewed:

- update `docs/reading-map.md` and legacy `docs/specs/reading-map.md`;
- add redirect stubs or status notes to old paths;
- move historical content into `history/`;
- delete temporary discussion/rewrite notes when their decisions are promoted.

# 6. Recommended Document Structure

For each maintained packaging-distribution document:

```txt
Title:
Audience:
Purpose:
Design status:
Implementation status:
Canonical:
Owner:
Last reviewed:
```

Then use this section order:

1. Purpose And Audience
2. Current State
3. Target Design
4. Ownership And Boundaries
5. Contracts
6. Implementation Alignment
7. Verification
8. Open Questions
9. Related Documents

Small docs can omit empty sections, but must keep metadata, numbered headers, and related links.

# 7. Open Decisions

| Decision | Why it matters | Recommendation |
| --- | --- | --- |
| Area folder name: `distribution` or `packaging-distribution` | Human navigation and existing terms differ. | Use folder `packaging-distribution`; title can be `Packaging And Distribution`. |
| Setup/doctor ownership | It is currently central to install reliability, but may become its own area. | Keep under packaging-distribution for this rewrite; split later only if it grows independent contracts. |
| Spec status after Rust/fgctl migration | Old spec still has implemented truths but old framing. | Rewrite with explicit current/target split; do not delete old file until links are updated. |
| README versus spec authority | README already presents `fgctl` as recommended. | Treat README as user-facing current intent; verify against code/tests before finalizing spec. |
| Plugin packaging placement | It is distribution-related but can dominate the spec. | Extract to contract or subpage if it exceeds a compact section. |

# 8. Non-Negotiable Rules For The Rewrite

- Do a fresh doc scan before editing canonical docs.
- Do a fresh code/test scan before changing factual implementation claims.
- Every design claim must be tagged as implemented, partial, planned, superseded, or unknown.
- Every implemented claim needs code/test evidence or a named verification gap.
- Links between related docs are part of quality, not decoration.
- Human spatial navigation must work: folder placement and README summaries must make the system understandable before reading governance.

# 9. First Concrete Next Step

Create a migration map for the packaging-distribution area:

| Source | Type | Authority now | Target destination | Action |
| --- | --- | --- | --- | --- |
| `docs/specs/distribution.md` | generated/curated spec | current-state source | `docs/platform/packaging-distribution/spec.md` | extract and rewrite |
| `docs/distribution-vision.md` | hand-curated vision | rationale | history or architecture rationale links | reconcile |
| `docs/architect/packaging-distribution/runtime-identity-and-activation.md` | discussion-derived architecture | target design | `architecture/runtime-identity-and-activation.md` plus contracts | split/promote |
| `docs/architect/packaging-distribution/history/distribution-baseline.md` | history | evidence | `history/distribution-baseline.md` | preserve |
| code/test scan result | implementation evidence | proof | `verification/implementation-alignment.md` | link and validate |

After that map is reviewed, rewrite the area portal first, not the deep spec.
