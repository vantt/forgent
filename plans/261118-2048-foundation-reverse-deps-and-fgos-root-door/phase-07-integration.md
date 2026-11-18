# Phase 07: integration, docs and full gate

Wave 7. Depends on 6. Capability `code:test`. Effort 0.25d.

## Steps

1. Full gate: `npm test` through the repo test runner; read both failure sources (failing tests and leak/clone ERROR
   lines). `git diff --stat origin/main -- '*.rs' 'Cargo.*'` is empty, so `cargo test --workspace` is not required;
   say so in the report.
2. Plan acceptance criteria 1-6, each with the command and its output.
3. Docs, only where a fact changed:
   - `docs/platform/event-store/spec.md:970-971`: add the `fgosDir` field from phase 3 to the rebuild context list.
     The same paragraph (:968-975) has two sentences the validation report (R7) calls stale; re-read the paragraph and `packages/event-store/contracts/consumers.v1.json` before editing, and fix only what is confirmed stale.
   - No `CHANGELOG.md` line: nothing a user of fgOS sees changes (phase 4 changes only an unsupported channel; if
     validating chose the `nativeHelperExe` step, still internal).
   - `docs/platform/component-boundary.md:1041` names `src/state/fgos-file-registry.mjs`; update to the `src/util/` path.
   - `docs/backlog.md` row `p-zs23zde4mh` (:21, text says "36 files"; update to the corrected 35): status and a link to this plan and its integration report.
4. Write `reports/integration.md` in this plan directory: what moved, the before/after `git grep` counts (35 files to
   2 allowed, 5 Work debt and 2 home joins owned by the global directory door), net lines (Node, tests), the HARDEN criterion status (met for T0-T6 and T9; Work residue
   named), and the stale criterion text "`.fgos` lookup: T1" (the door is T2, the leaf T0).
5. Set phase statuses to `done` (plan-v1 has no `landed`).

## Validation

Full suite green; `plan-contract-check --plan` on this plan passes.

## Risk and rollback

None beyond the earlier phases.
