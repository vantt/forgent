# Phase06 doctrine evidence and placement review

Scope: the five accepted handwritten positions in `AGENTS.md`; no new permanent wording/anchor test. PC1 `git status --porcelain -- AGENTS.md CLAUDE.md` was empty before editing. User explicitly selected **Hoàn tất trên nhánh execution**: phases integrated/committed in this execution branch satisfy the Phase06 execution prerequisite; no main merge/push was authorized, and the separate Plan B main-integration barrier stays closed.

## Five standing rules (L8)

| Rule | Observed placement and reason it must hold without a Workflow |
| --- | --- |
| H5 decide/report rather than re-ask | Exact accepted Vietnamese sentence, three-space indentation immediately after priority2 and before priority3. Must guide every turn before workflow selection. |
| No test backdoor | Merged into DoD question5; genuine behavior, not test-only skip switches/branches. Governs every proof path. |
| Scratch/root hygiene | Immediately after DoD, before Legacy-Node boundary; pointer to the hook's single allowlist, separately landed authority, wiring check and root-only merge exception. Governs all repository work. |
| Standard Rust/dev/activation door | Existing Legacy-Node section, not a second section; compatibility entry boundary retained, activated-versus-working-tree decision and real dev/doctor owners. Governs every CLI invocation. |
| Canonical shared source/render distinction | Existing Dispatch paragraph; canonical `core/skills/_shared/executor-dispatch-fallback.md`, skill-relative reference, generated surfaces and rebuild door. Thin-wrapper wording scoped to fgOS so it does not misdescribe other skills. Governs every dispatching skill. |

Independent reviewer `DoctrineReview` found the source placements correct, zero findings in narrow source closure (confidence0.99). Its first handoff flagged missing durable evidence; this report supplies that required artifact, not a code patch. Parent independently ran a throwaway Eval validation against `git show HEAD:AGENTS.md` and `HEAD:CLAUDE.md`; no helper file remains.

## Mechanical preservation proof

Exact H5 placement passed. Every canonical shared Markdown path mentioned in AGENTS was read successfully: `core/skills/_shared/executor-dispatch-fallback.md`. Obsolete byte-identical/generated-source pointer absent. Each generated block and CLAUDE matched HEAD byte-for-byte; SHA256 values independently agreed with the reviewer's observations:

- MDView block: `087becbe15478c10f7c2d490f9a56ebbf5e94523c78503b16c971cf260341908`
- GitNexus block: `b06ca4710276ae94f16dcda260b15ece65ae56834e9c296d62e8ed8c5e56ac9d`
- fgOS instruction projection: `657cdb0cd5e96667dff8ea4fca79c41229ba25423459823beb2ddb2ff7c7dc09`
- CLAUDE: `473df70d0879413dac335100339bb5157ee58aef78ef08800acacbb9a96db1b5`

No component-boundary change: this phase changes standing collaborator behavior only, not a platform component, authority owner, runtime state store or cross-area dependency. Checked `docs/platform/component-boundary.md`; Phase04 runtime/builder ownership remains in Packaging-Distribution.

## Integration barrier and final gates

Actual main HEAD at review: `13d1c096b287c0b781103af70d6c1e286fd3d490`; execution pre-doctrine HEAD `76f6d0249e131ce351435eb4953f0ab152d382e0`. Reviewer observed execution HEAD is not an ancestor of main. Parent's actual main `git cat-file -e HEAD:test/e2e/root-file-guard-hook.test.mjs` failed (file absent from that commit). Therefore **Plan B barrier remains closed**; a branch-local doctrine commit never claims otherwise.

At source review, final npm/Rust gates were pending. Final evidence now closes both: Rust176/176 tests across fgos, fgctl, fgos-host-runtime and fgos-distribution (`final-rust-tests.md`); standard `env -u CLAUDE_CODE_SESSION_ID npm test` once, exit0,6875pass/0fail/8skip/65existingTODO of6948total (`final-node-tests.md`). The skipped/TODO cases are not executed proof. No overall doctor-readiness-green or main-integration claim.

Final pre-commit `detect-changes` saw17staged files/14indexed symbols and
reportedLOW/0processes, but falsely mapped five symbols to unchanged
`domains/coding/AGENTS.md`; issue reported. Do not treat that degraded graph as
exact scope proof. Actual staging inventory contains only rootAGENTS and the
owned plan/report/journal files; generated-block/CLAUDE preservation above is
the direct proof. No executable source or test changed after the final suite.
