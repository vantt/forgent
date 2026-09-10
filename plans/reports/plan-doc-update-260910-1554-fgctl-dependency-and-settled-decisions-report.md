# Report: fgctl Dependency And Settled Decisions Applied To The Rust Host Plan

**Date:** 2026-09-10.
**File modified:** `docs/architect/host-invocation-routing/rust-cli-and-proof-components-plan.md` (511 → 629 lines).
**Source:** `plans/reports/architecture-review-260910-1537-host-invocation-provider-routing-design-review.md` §3.B/C/D/E/F/I, §6; `docs/architect/packaging-distribution/runtime-identity-and-activation.md` §11–14; `docs/architect/packaging-distribution/README.md` §7.

## Per-package changes

- **Header:** added `**Revised:** 2026-09-10 (…design-review.md)` line; rewrote
  the `Status` blocker clause to name only the remaining §3 decisions (target
  matrix, preview-vs-stable, compatibility-window) and the packaging stream's
  `fgctl` walking skeleton; added a `**Distribution/activation authority:**`
  link to `runtime-identity-and-activation.md`.
- **§1 Outcome:** R1 bullet now says "install, init/doctor, …" with a
  parenthetical splitting fgctl-owned (install/upgrade/rollback/uninstall)
  from local (init/doctor) authority.
- **§3 Decisions:** struck items 2 ("native archive publication…"), 3
  ("upgrade and rollback channel"), and 4 ("release artifact naming…") as
  settled, each with a `runtime-identity-and-activation.md` §-pointer. Kept 1
  (target matrix) and renumbered "preview vs stable" as 5 and
  "compatibility-window duration" as 6 (carried out of the old item 3). Closed
  the old "may setup/doctor download an upgrade" decision as **never**, with
  the Command Authority Matrix citation, and pointed to the P0 inventory
  deliverable for the `setup` verb removal. Rewrote the closing paragraph to
  target the packaging stream instead of `docs/distribution-vision.md`.
- **§4 Delivery Graph:** added `PK["PK: fgctl walking skeleton (packaging
  stream)"] --> P6`; renamed the `P4` node label to `P4 CLI adapter legacy
  exec`; added a note that `PK` is delivered by the packaging stream's own
  plan and is an external dependency, not a new P-package (P-numbering stays
  P0–P9).
- **§5 P0:** added three deliverables — (a) confirm the packaging walking
  skeleton's interface (release tree layout, activation fields, `fgctl init`
  tail); (b) inventory every `fgos setup` caller and record the migration
  path; (c) kept the distribution-decision-update bullet but scoped it to the
  three remaining §3 items and pointed at the packaging stream. Exit gate:
  "setup/doctor owner" → "init/doctor registration owner"; unresolved
  distribution choices reworded to name decisions 1/5/6 plus the walking
  skeleton as the only P6 blockers. (Scout evidence and P2 target areas had no
  setup-only file references to remove — verified by grep, nothing changed
  there.)
- **§6 P1:** step 2 now also captures "wall-clock timing per case"; added a
  new **Performance gates** subsection with (a) legacy-exec-overhead
  measurement vs. direct `node`, placeholder `≤ 25 ms p50`, marked "initial
  budget, confirm in P0"; (b) native `version` placeholder `≤ 10 ms p50`; (c)
  both become P6 regression gates.
- **§8 P3:** added a lead sentence stating the kernel's single contract
  (`OperationRequest` → `ProviderOutcome`) and that `legacy-cli` never enters
  it, linking to `./legacy-cli-transition.md`. Deliverables: replaced
  "encoded-message types" with typed in-process `OperationRequest`/
  `ProviderOutcome` (EncodedMessage deferred to P7; built-ins, including
  `version`, never decode bytes); made the catalog explicitly a compile-time
  `const` array (no linker/cache/manifest scan until P7); replaced "Shared
  invocation service" with an explicit pure-Router-vs-`InvocationService`-
  pipeline split (admit → select → grant → invoke → normalize → record).
  Step 4 reworded to name the pipeline explicitly. Exit gate gained "the
  Router is unit-testable with no I/O and no async runtime."
- **§9 P4 (renamed from "Transparent Node CLI Compatibility" to "CLI Adapter
  Legacy Exec"):** added a lead paragraph describing the CLI-adapter-only
  exec path (descriptor lookup → direct exec, argv/stdin/cwd/env/signal
  preserved, one invocation record via the shared recorder, no
  `OperationRequest`, no `InvocationService`) and linked
  `./legacy-cli-transition.md`. Deliverables reworded to match ("CLI adapter
  descriptor lookup and direct-exec path…bypassing InvocationService
  entirely"; added the shared-recorder invocation-record bullet). Payload
  deliverable: dropped the literal `libexec/fgos/legacy-node/fgos.mjs`
  install path, replaced with "follows the release tree manifest contract
  owned by the packaging stream…not a path hardcoded here." Step 8 and the
  exit gate: "compatibility provider" → "the CLI adapter's legacy exec path" /
  "the route kind (`legacy-cli`) is visible in captured diagnostics."
- **§11 P6 (Distribution And Installed-Entry Cutover):** full step rewrite.
  Lead paragraph now states install/activation/upgrade/rollback/uninstall are
  packaging-stream-owned, this package only builds the release tree `fgctl`
  consumes, and the old `<install-root>/libexec/...` layout is superseded.
  Steps 1–6 replaced: confirm remaining §3 decisions → extend
  `scripts/build-rust-distribution.mjs` to produce a release tree + manifest
  consumable by `fgctl` (kept the build-script deliverable, reworded its
  output) → build reproducible artifacts per the manifest contract → prove
  `fgctl init` (clean + repeated/idempotent, plus read-only `doctor` and
  scoped `doctor --fix`) against an external temp project → prove `fgctl
  upgrade`/`fgctl repair` (rollback) → prove uninstall via `fgctl` (no
  home-grown uninstaller). Steps 7–11 kept (doctor check registration via the
  real `src/setup/checks.mjs` registry, safe-fix registration, README/
  CHANGELOG update naming the `setup`→`init`/`doctor --fix` migration, entry
  flip, compatibility window). Exit gate: "from outside the repo" →
  "through `fgctl init` from outside the repo"; added the P1
  performance-gate regression clause; "no lifecycle script builds/downloads
  implicitly" scoped to "outside `fgctl`."
- **§12 P7:** added a lead line linking `./external-provider-protocol.md` and
  noting this is where `EncodedMessage` is introduced (built-ins never carry
  it). Exit gate: "Built-in, compatibility, and process providers" → "Built-in
  and process providers…`legacy-cli` selectors never reach the router."
- **§14 P9:** added the human-input rule ("the provider never blocks on human
  input; a `parked` outcome is the only allowed response…applies to P9 and
  any later native migration slice").
- **§15 Test And Review Gates table:** "R1 release" row: "setup/doctor" →
  "init/doctor," "external install/upgrade/rollback/uninstall" → "…via
  `fgctl`," added the legacy-exec/`version` latency-budget clause. Added one
  sentence carving out the §6/§11 performance gates as the sole place timing
  (not process-spy) is the proof.
- **§16 Commit And Rollback Slices:** item 7 "setup/doctor" → "init/doctor."
  Rewrote the rollback paragraph: "distribution rollback channel" →
  explicit `fgctl` release rollback via `ActivationRecord.previousArtifactDigest`
  + preserved release directory, stated R1–R2 use no other channel and config
  never selects/replaces a built-in provider; "roll back a read by changing
  one binding" clarified as a code-level binding change + new release, never
  a runtime provider-selection toggle (bindings stay immutable/static in
  R1–R2).
- **§18 Definition Of Done:** item 3 "Setup/doctor" → "Init/doctor"; item 4
  "External install, upgrade, rollback, and uninstall reproduce…" gained
  "via `fgctl`."

Untouched: §2 Non-Goals, §7 P2, §10 P5, §13 P8, §17 Risks table (content
already consistent with the settled decisions — no `setup`/`libexec`/
provider-naming hits found there by grep). P-numbering (P0–P9) unchanged;
`PK` added purely as an external graph node.

## Grep verification

```
grep -n "setup\|libexec\|passthrough provider\|compatibility provider\|distribution-vision\|specs/distribution" rust-cli-and-proof-components-plan.md
```

Remaining hits, all intentional:

- L69, L73, L120–122, L451 — describe the **closed/removed** `fgos setup`
  verb and the P0 inventory/migration deliverable; required by decision 6 to
  document the removal, not a leftover "setup" design.
- L78 — `docs/specs/distribution.md is regenerated from it later`: required
  wording per the task's decision 5 replacement text.
- L413 — `<install-root>/libexec/...` appears only inside the sentence saying
  that layout is *superseded* by the release tree manifest contract.
- L445 — `src/setup/checks.mjs` is the real, current doctor check-registry
  file path (confirmed against `AGENTS.md`'s install/setup/doctor gate
  section); this is the module path, not the deprecated CLI verb, so it
  stays per the instruction to "keep doctor registrations."

`passthrough provider` / `compatibility provider`: zero hits (confirmed with
a separate grep, exit code 1).

## Link resolution

- `./host-invocation-provider-routing.md`, `./node-to-rust-component-migration.md`,
  `../component-boundary/component-boundary-advisory.md`,
  `../packaging-distribution/runtime-identity-and-activation.md` — all exist,
  resolve.
- `./legacy-cli-transition.md`, `./external-provider-protocol.md` — do not
  exist yet in this session (they are being created concurrently by the
  `host-doc-rewrite`/`migration-doc-update` agents per the task brief); links
  are correct relative paths and will resolve once those files land.

## Doubts / unresolved

- None blocking. One judgment call: kept `src/setup/checks.mjs` literal path
  references (P6 step 7, §5 exit-gate context) because they name the real,
  still-current doctor-registry module, distinct from the deprecated `fgos
  setup` CLI verb the task asked to remove — flagging this explicitly in case
  the product owner wants that module renamed too as part of the verb
  removal (out of this plan's scope per the P0 deliverable's own text: "the
  verb's removal is a CHANGELOG-visible CLI contract change scheduled in its
  own change").
