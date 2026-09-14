# Code-Panel Rollout Plan: Packaging-Distribution

```txt
Document type: Implementation plan
Audience: Code-panel coordinator, implementation agent, reviewer, red-team
Purpose: Break packaging-distribution work into independently reviewable code-panel packets
Design status: Draft
Implementation status: Planned
Canonical: Yes, after review
Owner: Packaging-distribution
Source type: Derived from docs/platform/packaging-distribution/** and the source preservation audit
Last reviewed: 2026-09-14
Related:
- docs/platform/packaging-distribution/README.md
- docs/platform/packaging-distribution/verification/source-preservation-audit.md
- docs/platform/packaging-distribution/verification/implementation-alignment.md
- docs/platform/packaging-distribution/contracts/skill-package-distribution.md
- docs/platform/packaging-distribution/contracts/instruction-composition-and-projection.md
- docs/platform/packaging-distribution/contracts/repository-runtime-layout.md
```

## 1. Operating Rule

Each packet below is intended to be run as one code-panel job: one concrete change, one independent review, one red-team pass, and one proof bundle.

After the preservation audit, every packet must run in its own branch/worktree. Finished packets merge into a panel integration branch, not directly into `main`.

The main checkout is only for reading, coordination, and the final merge after the whole panel track is complete.

Recommended branch shape:

```txt
main
  └─ panel/packaging-distribution-rollout
       ├─ pd-code-panel-domain-move
       ├─ pd-rust-schema-freeze
       ├─ pd-instruction-source-registry
       └─ ...
```

The panel integration branch is the source of truth for combining packet outputs, resolving cross-packet conflicts, and running whole-track verification.

## 2. Coordinator Setup

Before opening any packet:

1. Read `docs/specs/reading-map.md`.
2. Read `docs/platform/packaging-distribution/README.md`.
3. Read `docs/platform/packaging-distribution/verification/source-preservation-audit.md`.
4. Read the contract named in the packet.
5. Create or update the panel integration branch.
6. Create a dedicated branch/worktree for the packet from the current panel integration branch.
7. Keep compatibility surfaces until the packet's proof says they can be retired.

No packet may silently delete a legacy/history detail. If a detail moves, update `source-preservation-audit.md`.

Coordinator note, 2026-09-14:
Recent host-invocation R1 handoff proof edits in this plan and the packaging-distribution verification docs are accepted for the active track. Apply them by packet boundary: P6 owns the Rust manifest/release handoff fields and manifest-based Rust host fallback proof; P7 owns the workspace activation end-to-end proof where `.fgos/installation/bin/fgos version --runtime-json` reports `host: "rust"` and the activated `artifactDigest`. Keep implementation-alignment status partial until release assets and public/default posture are decided.

## 3. Packet Queue

| Packet | Branch/worktree suggestion | Goal | Primary contract | Depends on |
| --- | --- | --- | --- | --- |
| P0 | already done in main audit pass | Preserve legacy/source detail before implementation | `verification/source-preservation-audit.md` | none |
| P1 | `pd-code-panel-domain-move` | Move `fgos-code-panel` canonical source to coding domain | `contracts/skill-package-distribution.md` | P0 |
| P2 | `pd-skill-source-layout` | Lock skill source discovery and generated adapter layout | `contracts/skill-package-distribution.md` | P1 |
| P3 | `pd-instruction-source-registry` | Add canonical instruction source registry | `contracts/instruction-composition-and-projection.md` | P0 |
| P4 | `pd-instruction-merge-policy` | Implement effective instruction-set composition | `contracts/instruction-composition-and-projection.md` | P3 |
| P5 | `pd-instruction-renderers` | Render effective instruction set into `AGENTS.md` and host adapters | `contracts/instruction-composition-and-projection.md` | P4 |
| P6 | `pd-rust-schema-freeze` | Freeze Rust-side packaging records and tests | `contracts/release-manifest.md`, `contracts/activation-binding.md`, `contracts/distribution-pin.md` | P0 |
| P7 | `pd-rust-init-tail` | Prove `fgctl init/repair/upgrade` orchestration tail | `contracts/setup-doctor-registry.md`, `architecture/fgctl-and-local-fgos.md` | P6 |
| P8 | `pd-legacy-setup-retirement` | Deprecate or retire legacy `fgos setup` target behavior | `contracts/setup-doctor-registry.md` | P7 |
| P9 | `pd-legacy-doc-redirects` | Add redirects/status notes for old architecture docs | `verification/source-preservation-audit.md` | P1-P8 as applicable |

## 4. Parallel Execution Model

Packets may run in parallel only when their dependencies and edit surfaces do not overlap in a way that makes review meaningless.

All parallel branches must start from the latest `panel/packaging-distribution-rollout` branch. When a packet closes, merge it back into that panel branch, then rebase or recreate any still-open packet branches that need its changes.

Do not merge any packet branch directly to `main`.

### 4.1 Dependency Graph

```txt
P0 done
├─ P1 ── P2 ─────────┐
├─ P3 ── P4 ── P5 ───┼─ P9
└─ P6 ── P7 ── P8 ───┘
```

### 4.2 Recommended Waves

| Wave | Packets | Parallel? | Merge target | Notes |
| --- | --- | --- | --- | --- |
| W0 | P0 | already done | `panel/packaging-distribution-rollout` | Preservation audit seeds the track. |
| W1 | P1, P6 | yes | panel branch | P1 touches skill/domain boundary; P6 touches Rust packaging records. They should not share code surfaces. |
| W2 | P2, P3, P7 | conditional | panel branch | P2 starts after P1 lands. P7 starts after P6 lands. P3 can run beside them if it avoids generated skill surfaces. |
| W3 | P4 | no, unless P2/P7 still running cleanly | panel branch | P4 depends on P3 and owns merge-policy logic. |
| W4 | P5, P8 | yes if surfaces are separated | panel branch | P5 depends on P4. P8 depends on P7. Hold P5 if P2 is still changing generated host surfaces. |
| W5 | P9 | no | panel branch, then main | Final docs redirects/status notes after implementation status is known. |

### 4.3 Packet Merge Protocol

When a packet finishes:

1. Run the packet's proof commands in its worktree.
2. Record changed implementation status in `verification/implementation-alignment.md`.
3. Record any promoted/superseded legacy detail in `verification/source-preservation-audit.md`.
4. Merge the packet branch into `panel/packaging-distribution-rollout`.
5. Run a panel-branch smoke proof for the touched area.
6. Rebase or recreate still-open dependent packet branches from the updated panel branch.

Packet owners, reviewers, red-team, and the packet coordinator should complete packet-scope proof, doc/status updates, pass/fail reporting, packet-to-panel merge, and panel-branch smoke proof through the code-panel track. Do not route ordinary packet implementation back to the human/coordinator as hand work when the packet can still progress.

For P6/P7 closeout, report:

1. Which proof commands passed.
2. Whether `.fgos/installation/bin/fgos version --runtime-json` entered the Rust host and matched the activated digest.
3. Which docs/status rows were updated.
4. Whether any claim remains partial and why.
5. Which release decisions still need human/coordinator approval.

The following decisions remain coordinator/release-owner decisions even when packet tests pass: preview versus stable/default public release, Node fallback compatibility window, whether installed/default runtime claims may flip, whether the panel branch may merge to `main`, and whether host-invocation R1 may move from current partial to implemented.

The panel track merges to `main` only after P9 closes and whole-track verification has passed.

## 5. Packet Details

### P1: Move `fgos-code-panel` To Coding Domain

Goal:
Move the canonical skill source from `core/skills/fgos-code-panel/` to `domains/coding/skills/fgos-code-panel/`.

Expected changes:

- Move canonical skill files.
- Keep generated or compatibility projection for the old host-visible locations.
- Verify no duplicate canonical skill id is introduced.
- Update docs and tests that name the source path.

Proof:

- Skill wrapper/projection tests pass.
- Mirror test still proves plugin/Codex/Claude-visible skill surfaces.
- `verification/implementation-alignment.md` row for `fgos-code-panel` moves from planned to implemented or partial with evidence.

Reviewer focus:

- Does the move prove code-panel is a coding-domain application surface?
- Did any consumer rely on old canonical path instead of generated host path?
- Are compatibility aliases explicit and temporary?

### P2: Lock Skill Source Layout

Goal:
Make skill source-of-truth rules executable and hard to regress.

Expected changes:

- Discover canonical skills from `core/skills/` and `domains/*/skills/`.
- Treat `.agents/skills`, `.claude/skills`, plugin bundles, and Gemini package output as generated adapter targets.
- Add duplicate-id and shared-fragment collision checks.
- Keep host trigger vocabulary mapped from canonical skill intent.

Proof:

- Unit tests for source discovery.
- Projection tests for existing Codex/OpenAI and Claude surfaces.
- A negative test for duplicate canonical skill ids.

Reviewer focus:

- Does the generator have exactly one canonical source per skill?
- Are host adapters generated, not edited as source?
- Is Gemini represented as a package target without pretending every host has native slash-command support?

### P3: Add Instruction Source Registry

Goal:
Create the canonical source layout for rules/instructions without rendering yet.

Expected changes:

- Add registry/discovery for `core/instructions/`, `components/<component>/instructions/`, and `domains/<domain>/instructions/`.
- Classify instruction fragments as law, boundary, procedure, host-adapter, or preference.
- Add metadata needed for authority, specificity, and applicability.

Proof:

- Registry tests for discovery, invalid metadata, duplicate ids, and unknown owners.
- Docs updated to point away from `docs/platform/<component>/instructions/*.md` as runtime source.

Reviewer focus:

- Are docs and runtime instructions separated?
- Is component/domain authority encoded, not inferred from prose?

### P4: Implement Instruction Merge Policy

Goal:
Compose discovered instruction fragments into a machine-readable effective instruction set.

Expected changes:

- Apply order: laws, boundaries, procedures broad-to-narrow, preferences broad-to-narrow, host adapters last.
- Add conflict behavior for same authority, cross-authority override, and mutually exclusive instructions.
- Emit a stable intermediate representation before any host renderer.

Proof:

- Golden tests for ordering.
- Conflict tests for equal authority and specificity.
- Regression test proving high-authority rules remain effective after narrower procedures render.

Reviewer focus:

- Does ordering protect effect, not just text order?
- Are conflicts explicit instead of silently resolved by last-write-wins?

### P5: Render Instruction Projections

Goal:
Render the effective instruction set into host-visible files.

Expected changes:

- Render primary portable `AGENTS.md`.
- Render `CLAUDE.md`, `GEMINI.md`, or other host-specific files only when adapter behavior requires them.
- Add projection ledger/stale detection.
- Register doctor/fix checks for stale or conflicting generated files.

Proof:

- Renderer golden tests.
- Doctor check detects stale generated projection.
- Doctor fix repairs generated projection without overwriting unmanaged user content.

Reviewer focus:

- Is render a thin adapter over the effective set?
- Does the ledger protect user-authored files and generated files separately?

### P6: Freeze Rust Packaging Records

Goal:
Move packaging-distribution authority toward Rust by freezing the records Rust must own.

Expected changes:

- Freeze or document serde structs for `ReleaseManifest`, `ActivationBinding`, `DistributionPin`, and topology/root records.
- Add schema/golden tests for backward-compatible reading.
- Ensure `components.legacyNode.root` and `components.legacyNode.entry` remain the only legacy Node locator.
- Preserve the host-invocation release handoff fields needed by the Rust host: native `bin/fgos`, `entries.fgos`, `components.legacyNode`, and `artifactDigest`.

Proof:

- Rust unit tests.
- Existing `test/rust-host/*` release/stage/init tests pass.
- Route/manifest proof shows the released Rust host can report its runtime identity and locate the legacy Node payload only through manifest fields.
- Platform contracts updated with exact schema shape.

Reviewer focus:

- Does Rust own runtime identity without absorbing workflow semantics?
- Are schema migrations explicit?
- Do the frozen records give host-invocation enough information to prove native `version` and manifest-based legacy fallback in a release tree?

### P7: Prove `fgctl` Init/Repair/Upgrade Tail

Goal:
Make the target onboarding pipeline real.

Expected changes:

- `fgctl init`, `fgctl repair`, and `fgctl upgrade` acquire/stage/verify as needed.
- Publish ready activation binding atomically.
- Invoke active local runtime tail: `fgos init`, then `fgos doctor --fix`, then `fgos doctor`.
- Prove the stable workspace command `.fgos/installation/bin/fgos version --runtime-json` enters the Rust host and reports the activated release digest.
- Keep candidate preflight from writing host-visible projections before activation.

Proof:

- Integration tests for init, repair, and upgrade.
- Failure tests for candidate preflight, activation publish, and local tail failure.
- External-consumer proof that installed `fgctl init --from <asset>` activates a workspace whose local `fgos version --runtime-json` reports `host: "rust"` and an `artifactDigest` matching the verified release manifest.
- Implementation alignment updated from partial/planned to implemented where proven.

Reviewer focus:

- Does `fgctl` orchestrate rather than reimplement local runtime behavior?
- Can a failed tail leave the workspace in a diagnosable state?
- Does this packet close the packaging side of host-invocation R1 without claiming preview/stable public posture by itself?

### P8: Deprecate Or Retire Legacy `fgos setup`

Goal:
Remove `fgos setup` as target behavior only after equivalent replacement proof exists.

Expected changes:

- Decide whether `fgos setup` remains a compatibility alias, prints a deprecation path, or is removed from new command surfaces.
- Update command registry, docs, changelog, and tests.
- Keep old behavior reachable only if compatibility policy requires it.

Proof:

- Command registry tests.
- CLI tests for deprecation or removal behavior.
- Migration docs prove replacement command path.

Reviewer focus:

- Was this done after P7 proof?
- Are users given a clear path: `fgctl init` plus local `fgos doctor --fix`?

### P9: Redirect Legacy Architecture Docs

Goal:
Stop old docs from competing with promoted platform docs.

Expected changes:

- Add status notes or redirects to `docs/architect/packaging-distribution/**`.
- Keep historical facts in `history/distribution-baseline.md`.
- Update source preservation audit rows as each old source becomes fully promoted or explicitly historical.

Proof:

- Link scan or docs test if available.
- Manual read-through of all old packaging-distribution docs.

Reviewer focus:

- Did any detail disappear instead of being promoted, historized, or superseded?
- Does `README.md` remain the obvious portal?

## 6. Rust-First Variant

If the chosen direction is Rust-first packaging-distribution, reorder implementation after P1:

1. P1: move `fgos-code-panel` to coding domain.
2. P6: freeze Rust packaging records.
3. P7: prove `fgctl` init/repair/upgrade tail.
4. P3-P5: implement instruction registry, merge, and render.
5. P2: harden full skill distribution layout if P1 exposed generator gaps.
6. P8: retire legacy setup.
7. P9: redirect legacy docs.

In this variant, do not port the whole doctor/fix registry to Rust early. Rust owns runtime identity, staging, verification, activation, and orchestration. The selected local runtime owns workspace semantics, projection, and doctor/fix behavior until a later migration explicitly moves those responsibilities.

Rust-first parallel waves:

| Wave | Packets | Notes |
| --- | --- | --- |
| RW1 | P1, P6 | Same as normal W1. |
| RW2 | P7, P3 | P7 proves Rust orchestration while P3 prepares instruction source registry. |
| RW3 | P4, P2 | P4 depends on P3; P2 depends on P1. Keep generated-surface edits coordinated. |
| RW4 | P5, P8 | P5 depends on P4; P8 depends on P7. |
| RW5 | P9 | Final cleanup and main merge gate. |

## 7. Close Criteria

The rollout is complete when:

- every packet is either implemented or explicitly deferred in `implementation-alignment.md`;
- every legacy source row in `source-preservation-audit.md` is preserved, superseded, or historized;
- code-panel has proven at least one real domain-owned skill move;
- Rust `fgctl` owns the packaging runtime boundary without owning unrelated workflow semantics;
- the host-invocation R1 handoff is explicit: a workspace activation enters the Rust host for native `version`, and the release manifest remains the only legacy Node payload locator for unmigrated routes;
- generated host surfaces are reproducible from one canonical source of truth.

Final merge to `main` requires:

- all closed packet branches merged into `panel/packaging-distribution-rollout`;
- no unresolved packet-to-packet conflicts on the panel branch;
- whole-track proof commands recorded in the panel closeout;
- `source-preservation-audit.md` updated for every legacy/source detail touched by the track.
