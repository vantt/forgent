# Phase 1: Spec, model schema and the self row

## Inputs
- `plans/discussions/ds-at6x3xj2ng-component-authority/DISCUSSION.md`: the hand-off, §3 rows 1a, 1b, 3b, 4, 4a, 4b, §4 CA-D1..CA-D5, and §6 (the approved design, CA-D5).
- `docs/platform/convention/spec.md`: the header block and section style of a small component spec.
- `docs/platform/documentation/subcomponents/document-identity/spec.md` and `.../admission/spec.md`: the locate-before-write and admission models that `locate` and `declare` reuse.
- `docs/platform/governance.md#decision-scope-to-holder-table`: where a new area's decision narrative goes.
- `docs/architecture-manifest.json`: field names to carry into the schema.

## Files it may write
docs/platform/component-authority/spec.md, packages/component-authority/contracts/model.v1.json, packages/component-authority/model/components.json, docs/platform/README.md, docs/reading-map.md

## Steps
1. Write `docs/platform/component-authority/spec.md` with the convention-spec header. Set `Design status: Accepted`,
   `Canonical: Yes`, `Owner: Component authority`, `Source: packages/component-authority/`, and cite CA-D5 as the
   signing approval. Sections:
   - Purpose and boundary. The component owns one decision kind: who owns what. That covers components,
     decision kinds, doors, the contract index, and file-to-component mapping. **It holds design ownership and
     grants no runtime permission. It is not Agent Confinement Authority.** It must not own contract contents,
     RUL, L1-L10, design principles, or decision records.
   - Data: the six row kinds of §6, with each field.
   - The two doors, `locate` and `declare` (behaviour per §6). The verb shape is `fgos authority locate "<sentence>"`
     and `fgos authority declare --kind <kind> --row <file>`, implemented by the sibling plan. Name-and-alias
     matching comes first; meaning search arrives with documentation H2 search. `declare` reuses admission. A new
     component or decision kind always asks the owner, and moving a decision kind needs a plan that names the survivor.
   - Who calls: documentation, planning, implement, land gate and `npm test`, periodic review.
   - Generated views and the retired ledgers (§6 last paragraph).
   - Settled facts.
   - "Lịch sử quyết định": one entry per CA-D1..CA-D5, with date, owner words and source, as L5 question 6 requires.
2. Write `packages/component-authority/contracts/model.v1.json`, a JSON Schema (draft 2020-12) with one `$defs`
   entry per row kind:
   - `layers`: layers, rules, domains, tierNames.
   - `component`: `id`, `canonical`, `aliases[]`, `meaning`, `parent?`, `layer`, `tier`, `paths[]`, `exceptions[]` of `{path, layer?, tier?, reason}`, `owns[]`, `mustNotOwn[]`, `spec`, `source[]`, `status`.
   - `decisionKind`: `id`, `canonical`, `aliases[]`, `meaning`, `owner` (one component id), `narrative` (path).
   - `door`: today's manifest fields, kept as they are (`job`, `kind`, `patterns`, `allowed`, `debt`, `reason`, `retiredBy`), plus optional `owner`.
   - `contract`: `id`, `canonical`, `aliases[]`, `meaning`, `provider`, `consumers[]`, `guards?`, `version?`, `path?`, `evidence[]`, `status`.
   - `files`: path to layer, which phase 3 retires.

   No twin field and no debt-with-deadline field (CA-D2). The door `debt` field stays only until the sibling plan
   retires it.
3. Create `packages/component-authority/model/components.json` as an array whose first and only row is
   `component-authority`: canonical `component-authority`, aliases `["ownership registry", "authority ledger"]`,
   a meaning sentence, `paths: ["packages/component-authority/", "docs/platform/component-authority/"]`, and spec
   and status fields.
4. Add the area row to `docs/platform/README.md` §2 and the spec to `docs/reading-map.md`.

## Verify
- `node -e "JSON.parse(require('fs').readFileSync('packages/component-authority/contracts/model.v1.json'))"`
  and the same for `components.json`.
- `npm test -- test/docs` (doc checks) is green, and every path cited in the spec exists (`rg -o` the backticked paths and `test -e` each).

## Rollback
Revert the phase commit; nothing reads these files yet.
