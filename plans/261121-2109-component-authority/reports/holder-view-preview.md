# Holder view preview (component-authority)

DOCOS keeps the holder table shape (scope → holder file or directory) and wants this
generated view before the hand-written table in `docs/platform/governance.md` is replaced
(see `plans/261121-2109-component-authority/reports/docos-boundary-answer.md`).

The render script owns the `governance-holder-table` view with `required: false`, so
`node scripts/component-authority-render.mjs --check` does **not** demand its markers
until DOCOS accepts this preview and the markers are inserted.

## Generated table

Decision scopes, one row per decision kind, scope aliases retained. <!-- rendered from packages/component-authority/model/ by `node scripts/component-authority-render.mjs`; edit the model, never this block -->

| Scope (legacy alias retained) | Read first | Facts and RULs | Narrative home |
| --- | --- | --- | --- |
| confinement-authority → agent-confinement | `docs/platform/agent-confinement/README.md` | `docs/platform/agent-confinement/spec.md` | `docs/platform/agent-confinement/decisions/` |
| distribution → packaging-distribution | `docs/platform/packaging-distribution/README.md` | `docs/platform/packaging-distribution/spec.md` | `docs/platform/packaging-distribution/decisions/` |
| enduser-docs-authoring → work-state | `docs/platform/work-state/README.md` | `docs/platform/work-state/spec.md` | `docs/platform/work-state/decisions/` |
| enduser-docs-index → work-state | `docs/platform/work-state/README.md` | `docs/platform/work-state/spec.md` | `docs/platform/work-state/decisions/` |
| observe → observe | `docs/platform/observe/README.md` | `docs/platform/observe/spec.md` | `docs/platform/observe/decisions/` |
| questions → questions | `docs/platform/questions/spec.md` | `docs/platform/questions/spec.md` | `docs/platform/questions/spec.md` |
| runner → runner | `docs/platform/runner/README.md` | `docs/platform/runner/spec.md`; `docs/platform/runner/subcomponents/h-02842f76ffd2/spec.md`; `docs/platform/runner/subcomponents/h-2e032393add1/spec.md`; `docs/platform/runner/subcomponents/h-37aced3896a8/spec.md`; `docs/platform/runner/subcomponents/h-6979005beaf7/spec.md`; `docs/platform/runner/subcomponents/h-6df5686d0d54/spec.md`; `docs/platform/runner/subcomponents/h-ce5b9771a26a/spec.md`; `docs/platform/runner/subcomponents/h-d3b49ef7edf5/spec.md`; `docs/platform/runner/subcomponents/h-f34e0d170d89/spec.md` | `docs/platform/runner/decisions/` |
| work-state → work-state | `docs/platform/work-state/README.md` | `docs/platform/work-state/spec.md` | `docs/platform/work-state/decisions/` |
| component-authority → component-authority | `docs/platform/component-authority/spec.md` | `docs/platform/component-authority/spec.md` | `docs/platform/component-authority/spec.md` |

## Row-by-row diff against the hand-written table

| Scope | Status | Current narrative home | Generated narrative home | Notes |
| --- | --- | --- | --- | --- |
| component-authority → component-authority | added | — | `docs/platform/component-authority/spec.md` | present only in the generated view |
| confinement-authority → agent-confinement | same | `docs/platform/agent-confinement/decisions/` | `docs/platform/agent-confinement/decisions/` | — |
| distribution → packaging-distribution | same | `docs/platform/packaging-distribution/decisions/` | `docs/platform/packaging-distribution/decisions/` | — |
| enduser-docs-authoring → work-state | changed | `docs/platform/work-state/decisions/` | `docs/platform/work-state/decisions/` | col2 differs; col3 differs |
| enduser-docs-index → work-state | changed | `docs/platform/work-state/decisions/` | `docs/platform/work-state/decisions/` | col2 differs; col3 differs |
| observe → observe | same | `docs/platform/observe/decisions/` | `docs/platform/observe/decisions/` | — |
| questions → questions | changed | `docs/platform/questions/spec.md#11-lịch-sử-quyết-định` | `docs/platform/questions/spec.md` | col4 differs |
| runner → runner | same | `docs/platform/runner/decisions/` | `docs/platform/runner/decisions/` | — |
| work-state → work-state | same | `docs/platform/work-state/decisions/` | `docs/platform/work-state/decisions/` | — |
