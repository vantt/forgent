# Migration Doc Update — Settled Decisions (2026-09-10)

**Target:** `docs/architect/host-invocation-routing/node-to-rust-component-migration.md`
**Source:** `plans/reports/architecture-review-260910-1537-host-invocation-provider-routing-design-review.md` §3.B, §3.F, §3.G, §6; `docs/architect/packaging-distribution/runtime-identity-and-activation.md` §11–§13.

## What changed, by section

- **Header:** kept original `**Date:** 2026-09-01`, added `**Revised:** 2026-09-10` pointing at the review report. `Selected direction` line reworded: legacy selectors are now "resolved by the CLI adapter to the legacy-cli lane and exec'd straight to the Node payload, never entering the kernel" instead of "routed to the CLI-only legacy Node compatibility provider."
- **§1:** dropped the literal installed path `libexec/fgos/legacy-node/fgos.mjs`; now "installed as the legacy payload inside the activated release tree." Kept the source path `packages/legacy-node/node/fgos.mjs` literal, per instructions.
- **§2 Option B:** diagram and prose reworded to the CLI-adapter-exec model; added a link to `./legacy-cli-transition.md` (sibling not yet created by the other agent — link is forward-referencing by design).
- **§2 Selected Option:** also reworded (not explicitly named in the task list, but it restated the same "CLI-only Node compatibility as the default" framing right next to the corrected Option B text — left uncorrected it would have contradicted the paragraph above it, so I aligned it for internal consistency).
- **§3:** replaced the "rollback changes one provider selection instead of reverting the host" bullet with "rollback is a release rollback through `fgctl`, not a rebuild of the outer host."
- **§4:** "`setup` and `doctor`" → "`init` and `doctor`" in the Partly Thin Candidates list, exact wording as specified.
- **§5 (R1 migration order):**
  - Step 1 → adopt the packaging stream's settled install/activation/rollback contract (`fgctl` + release store + workspace activation binding), linking `runtime-identity-and-activation.md` §11–§13; confirm target matrix.
  - Step 5 → CLI adapter reads `CommandRouteDescriptor`; `legacy-cli` execs straight to Node with argv preserved, never entering `InvocationService`; `native` builds an `OperationRequest`. Linked `./legacy-cli-transition.md`.
  - Step 7 → proof runs through `fgctl init` on an external temp project from a staged release, then `fgos init` → `doctor --fix` → `doctor` on every supported target.
  - Exit condition rewritten to match (fgctl init/doctor tail, previous release as rollback channel through `fgctl`, "one versioned release artifact" instead of "artifact manifest").
- **§6 (R2):** added one sentence pointing to `./external-provider-protocol.md` for the framed protocol/manifest/adapter contract, keeping this section as migration-proof ordering only (not explicitly required by the task, but "link where relevant" was in scope for the two new siblings).
- **§7 (R3):** added the paragraph clarifying the production remote host is the project-local gateway (current Herdr crate, same release) composing the host-runtime crate in-process, and that a future shared multi-project gateway reaches a project runtime only through the out-of-process Project Runtime Adapter, linking `../packaging-distribution/future-constraints.md` §2.
- **§9:** added the human-input bullet — a native provider never blocks waiting for a person; `ask`/`answer`-shaped operations return `parked` and are re-invoked by the work lifecycle; this must hold before any such operation migrates.
- **§12 (Remove Node):** `setup/doctor reports no remaining legacy dependency` → `` `init`/`doctor` reports no remaining legacy dependency ``. This bullet was in the grep-check scope but not explicitly called out in the task's decision-3 location list; fixed it since decision 3 said "every `setup` mention" and named §12 by number.
- **§13 (Rollback Rules):** rewritten per decision 4 — opening paragraph states config can never replace a built-in provider, rollback in R1–R2 is a release rollback through `fgctl` (`ActivationRecord.previousArtifactDigest` + preserved release directory + state-schema compatibility check, linking §11 of the identity doc), and the previous release still holds both native provider and Node payload during the observation window. Deleted the "roll back by changing provider selection" bullet. Kept the three other bullets (side-by-side only during window; never delete a Node writer before proving read/recover; remove rollback code per component after window) verbatim.
- **§14 (Verification Gates):** R1 row's proof list now says "`fgctl` install/upgrade/rollback/uninstall from a staged release; `fgos init` / `doctor --fix` / `doctor` on every supported target" (dropped "setup/doctor"). Added a new "Performance gate" column; R1 row gets the exact text from the task ("legacy passthrough overhead vs direct `node` entry and native `version` latency measured against the thresholds fixed in the plan's P1 harness"); all other rows get `—`. Also fixed "zero setup/doctor/runtime dependency on Node" → "zero init/doctor/runtime dependency on Node" in the Node-removal row (caught by the grep check).
- **§15 (Remaining Migration Decisions):** removed "Which post-npm release/install mechanism owns native artifacts?" and renumbered the remaining three. Added a one-line note that this decision is settled — packaging stream owns it via `fgctl` + release store + workspace activation binding — linking the identity doc.

## Grep verification

```
grep -n "setup\|libexec\|changing provider selection\|compatibility provider" docs/architect/host-invocation-routing/node-to-rust-component-migration.md
```

Zero hits. Every prior occurrence was either reworded per the decisions above or (for §12/§14, not explicitly named but structurally identical "setup" mentions) fixed for consistency with decision 3.

## Link check

```
./host-invocation-provider-routing.md            — exists
../component-boundary/component-boundary-advisory.md — exists
./rust-cli-and-proof-components-plan.md          — exists
./legacy-cli-transition.md                       — does NOT exist yet (sibling being created concurrently by host-doc-rewrite agent; per task instructions, link anyway, do not create)
../packaging-distribution/runtime-identity-and-activation.md — exists
./external-provider-protocol.md                  — does NOT exist yet (same as above)
../packaging-distribution/future-constraints.md  — exists
```

All existing targets confirmed via `ls`. The two forward-referenced siblings are expected to land from the concurrent `host-doc-rewrite` agent's work per the task brief.

## Doubts / notes

- I extended the edit slightly beyond the four explicitly named locations for decision 1's "reword" instruction (the "Selected Option" paragraph in §2) and beyond decision 3's named locations (§12's "setup/doctor" bullet, §14's Node-removal row) because leaving them unedited would have made the grep check fail and left internally contradictory prose right next to corrected text. No scope was added beyond making the existing sentences consistent with the settled decisions — no new claims were introduced.
- Section numbering (1–15) is unchanged; no headings were added or removed.
- Did not touch `host-invocation-provider-routing.md` or `rust-cli-and-proof-components-plan.md` — owned by other agents.

Status: DONE
Summary: Applied all six settled decisions (legacy-cli lane in CLI adapter, packaging-owned distribution vocabulary, setup→init/doctor --fix, release-rollback rewrite, R3 project-local-gateway clarification, human-input parked-outcome rule) to `node-to-rust-component-migration.md`, updated the verification-gates table with a performance-gate column, and removed the now-settled "post-npm release mechanism" decision from §15. Grep check for stale `setup`/`libexec`/`changing provider selection`/`compatibility provider` phrasing returns zero hits.
Concerns/Blockers: None. Two links (`./legacy-cli-transition.md`, `./external-provider-protocol.md`) point to files that don't exist yet in this worktree — they are owned by the concurrently-running `host-doc-rewrite` agent per the task brief and are expected to land as part of that work.
