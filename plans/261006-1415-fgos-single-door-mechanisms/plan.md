---
title: "fgOS single-door mechanisms: binding, render, doctor/dev door and root hygiene"
description: "H1/H3/H5: one binding source, generated headers, doctor/dev door, gated root cleanup and one doctrine writer. Advisory capability completion is a separate plan."
status: completed
priority: P2
branch: feat/single-door-mechanisms
tags: [harness, skills, distribution, doctor, githooks, agents-md, rul11]
created: 2026-10-06
---

# fgOS single-door mechanisms — original scope restored

## Decision and scope

This remains the original single-door/harness hygiene plan. Advisory completion was added during scope-gap research and has now been separated into [advisory-capability-completion](../261006-1408-advisory-capability-completion/plan.md) at owner's request.

> Historical separation-revision note: the planning worktree held documents only; neither plan revision itself authorized implementation. Main unrelated changes, runtime/config/release/hooks/junk files were untouched by that revision.

**Current execution: completed and integrated into main at `a004bb598`.** All Phase00–06 evidence and supported-CLI status synchronization are complete. See [main integration and current barriers](reports/main-integration.md), [merged-source verification](reports/main-integration-tests.md), and the earlier [entire-plan sync/evidence](reports/final-plan-sync.md), [doctrine review](reports/phase-06-doctrine-review.md), [branch Node result](reports/final-node-tests.md), and [Rust result](reports/final-rust-tests.md). Main's newer independent work was preserved. The exact merged-source full-suite gate passed in an isolated checkout with the store guard intact; both busy-main isolation failures remain recorded. Doctrine and the permanent root-hook behavior test are now on main, and the configured main hook was exercised after merge: the named main-integration prerequisite is satisfied. Advisory remains pending; no remote push, restage or global activation occurred. Full-suite skips/TODO and doctor-readiness limits are not counted as passing proof. Original requirements and historical snapshots below remain retained.

Goal: H1 binding/render/canonical door/recovery-source, H3 root hygiene, H5 ask-vs-decide doctrine. Do not promise that roster/config cleanup completes advisory cognition, specialist, dialogue or crash recovery. Those are acceptance of the new plan, not prerequisites for doctor/root hygiene.

## Read first and established evidence

- `docs/specs/reading-map.md`, runner spec/bind and handoff contract; distribution portal/spec/vision before install/setup/doctor changes.
- Harness synthesis `plans/reports/harness-investigation-261006-synthesis.md` §5 V1–V4/V7/V8/V10/V15, §7 H1/H3/H5 and merged red-team findings.
- [Phase00 baseline](reports/phase-00-baseline.md): inspected HEAD b3d8fa4, stale/degraded GitNexus index, retired roster tokens, render/root/manifests/callers inventories. Counts are snapshot evidence, not evergreen assertions.
- [Phase03 read-only research](reports/phase-03-canonical-door-research.md): D1=B, argument forwarding, cwd/source distinction and unresolved Cargo target/verifier compatibility. Research is not runtime acceptance.
- [Separation/progress report](reports/pm-261006-single-door-progress.md). New plan's [owner challenges](../261006-1408-advisory-capability-completion/reports/owner-challenges-and-rationale.md) explains why cognitive migration differs from binding cleanup.

## Facts retained — pre-implementation baseline

1. Architecture skill still hardcodes retired executor/model/coordination APIs. Phase01 removes infrastructure duplication and makes current interface/limits truthful, not a feature rewrite.
2. Generated Markdown headers are missing; Claude wrappers call assembled content canonical. Existing assembly/drift/mirror doors own the fix; current counts are Phase00 evidence.
3. `fgos:dev` names the existing Rust dev host. Plain fgos is activated release; stage/upgrade updates it. fgctl dev activation remains a separate plan, not reopened here.
4. Doctor compares legacy Node payload contents, excluding dependencies; does not certify Rust binary freshness. Restage and exercise real shim.
5. H1d already closed by e92cfe66f/d74dfea58 into one catchup recovery playbook; T03 env backdoor absent in inspected baseline. Verify-close, no new mechanism.
6. Root deletion remains gated by final G1 confirmation and tag tree proof; AGENTS has one writer and fresh PC1.

## Phases and dependencies

| # | Phase | Depends on | Scope / evidence |
|---|---|---|---|
| 00 | [Baseline/preconditions](phase-00-preconditions-and-verify-close.md) | — | Baseline read-only evidence supplied; fresh gates retained |
| 01 | [Config binding and truthful advisory interface](phase-01-architecture-panel-roster-single-source.md) | 00 | Minimal original H1a cleanup, not advisory completion |
| 02 | [Generated render headers](phase-02-skill-render-generated-header.md) | 01 | Own generator/full header regeneration and first restage |
| 03 | [Canonical dev-door research](phase-03-canonical-door-research-decision.md) | 00 | Evidence complete, D1=B |
| 04 | [Doctor drift + fgos:dev](phase-04-doctor-active-release-drift-check.md) | 02, 03 | Comparator/registry/dev cwd/target/shim proof |
| 05 | [Root guard + gated cleanup](phase-05-root-file-guard-and-junk-cleanup.md) | 04 | Hook behavior and G1/D2 |
| 06 | [Single doctrine writer + final acceptance](phase-06-agents-md-single-writer.md) | 02, 04, 05 | Five original doctrine edits/PC1/full suite |

Graph: `00 → 01 → 02 → 04 → 05 → 06`; independently `00 → 03 → 04`. No expanded advisory phases remain executable here. Old 07/08/09 and preservation matrix migrated to new plan 02/03/04 and reports.

## Cross-plan contract — narrow barriers, no whole-plan dependency

- Original01 owns only minimal binding/truth cleanup in canonical architecture skill. New advisory03 must incorporate that landed commit before full rewrite of the SAME source. Advisory01/02 research/runtime feasibility may proceed independently; original02/04/05/06 do not wait for advisory completion.
- Original02 owns generated-header implementation. New advisory04 owns regenerating/restaging its own later source cutover through existing build/release doors, using whatever generator revision is explicitly selected; it does not need to wait for all original hygiene. Neither plan claims the other's acceptance.
- Canonical skill writer, shared runner spec/changelog writers, render outputs and release/build artifacts require one integration baton at a time. Rebase/reconcile latest sources before build; never regenerate stale copies over another cutover. If advisory03 is already writing same skill, serialize original01 before it; do not race.
- Do not add mutual or whole-plan blockedBy/blocks: only the named source barrier exists. Runtime dependencies discovered through tools must be explicit, not invented as plan-wide waits. Plan B convention requires original06's integrated AGENTS/root-guard barrier; that integration prerequisite is now satisfied by [actual main proof](reports/main-integration.md), not merely branch-local completion.

## Gates and locked decisions

| ID | Contract |
|---|---|
| PC1 | Historical clean commit 5df843bdb; fresh AGENTS/CLAUDE ownership check before06. Preserve unrelated edits, no auto-revert |
| D1=B | Existing Rust dev host via `npm run fgos:dev -- <verb>`; plain activated fgos updated via restage/upgrade. Dev activation separate |
| D2 | Move tsk-1op-case-study-note.md into docs/history using current layout; do not delete |
| G1 | Final inventory/confirmation before deleting 30 tracked scratch files/local output. Annotated pre-root-junk-cleanup tag TREE must contain all30; tag cannot save untracked output.txt |
| Binding safety | Existing config/bind owns routing and required read-only posture. Missing safe binding refuses honestly; do not weaken config or claim live confinement from policy resolution |
| Final DoD | Own original behavior/docs/projections/shim/root-hook proof and final full suite; no requirement to complete new advisory functionality |

## Acceptance criteria

B1. Active infrastructure pin/retired invocation promises removed from owned skill; current config/bind provenance and failure posture observed. Preserve cognitive intent as doctrine and link unresolved capability work, not silently delete goals or advertise them as implemented. Temporary scans for source wording; no permanent model-token/roster/mock-forwarding tests.

B2. Generated targets under .agents, fgOS plugin/shared and Claude wrappers/references carry correct generated header/marker. Preserve frontmatter/prune/mirror behavior; actual header inventory reconciles historical 20-vs14 gap.

B3. Doctor active-release-matches-checkout registered/tests/spec/how-to; changed/missing/extra behavior, dependencies excluded, correct source/activation ownership, safe symlink/errors and outside-source skip. Existing Rust dev host named, caller cwd INIT_CWD and concrete compatible Cargo target layout proved. Restaged shim doctor passes; no Rust-freshness claim.

B4. Root hook rejects unapproved new root files and same-commit allowlist bypass, supports worktrees/merge path and unrelated projects; all16 known hook consumers + actual hook smoke. No bypass guidance.

B5. Only after G1, approved scratch files absent, note moved and local output handled. Tag tree preserves all30; remeasure legitimate intervening root changes before applying historical14 count.

B6. One AGENTS doctrine commit: canonical shared pointer, exact H5 choice-vs-ask sentence, dev/release door, scratch/no-backdoor. Fresh PC1, generated blocks preserved, temporary placement validation; Plan B barrier opens only after integration and permanent root-hook behavior test on main.

B7. `env -u CLAUDE_CODE_SESSION_ID npm test` green after original changes integrated, focused consumer checks and actual CLI/hook/shim smoke recorded. New advisory tests/quality not asserted as passed by this plan.

## Safety, prior art and exclusions

Before code: relevant specs, symbol upstream impact/warn HIGH or CRITICAL, LSP exported references, git history/prior art. Dispatch decide before out-of-turn work. No source changes in this separation assignment.

Keep all original red-team corrections: dependency exclusion, old setup overwriting renders until restage, allowlist landed separately on main, MERGE_HEAD only root-guard exception, INIT_CWD, custom target/verifier confinement, safe comparator errors, correct store/source roots, tag tree proof. Seven builder consumers and sixteen hook consumers remain in detailed phases; source wording/incidental forwarding is temporary validation, not new permanent tests.

Scope exclusions: new advisory runtime/cognitive completion, H2 convention, H4 general A/B, H6 documentation-authority migration, fgctl dev activation, AgentKit/ClaudeKit/rtk/hook/global rules changes, new provider/registry/scheduler/store. Required original guarantees are not removed by scope separation. Record legacy-spec edits as exceptions for documentation migration; do not touch its worktree.

Rollback coherent original phases independently, regenerate via existing build door; tracked deletions recover from preservation tag, local untracked output not recoverable from tag. Do not rewrite stored Workflow/Unit history. Implementation is a separate instruction, not implied by this document.
