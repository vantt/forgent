# Independent review request: Steps 3 and 4

Review the two parts as one logical A38 request. A reviewer must not have
authored the reviewed rows. Prefer one architecture/contract reviewer for Part
1 and a different vocabulary reviewer for Part 2. Do not resolve CTR010, invent
contract ids, edit files or run native inventory/global comparison jobs.

## Pins and limits

| Part | Entries | Bytes | SHA-256 | Unique output report |
|---|---:|---:|---|---|
| `review-input-step-03-step-04-01/part-01-architecture-contracts.json` | 22 | 2,114 | `c6b558006590700899ad4963b1ac99bbb3454f4c0a3e3b2401f48728c79e320f` | `review-a38-step-03-04-architecture-01.md` |
| `review-input-step-03-step-04-01/part-02-vocabulary.json` | 13 | 1,400 | `201871b9411c8883f52db1d0672f0b3d7460f3fb1d9e659f2c2f7dfa9f9d5f3c` | `review-a38-step-03-04-vocabulary-01.md` |

Both parts are below 60 entries and 400 KB. The index pins four primary
evidence/check files. Recompute every pin with this portable light command:

```sh
node -e "const fs=require('fs'),c=require('crypto'); for(const p of process.argv.slice(1)){console.log(c.createHash('sha256').update(fs.readFileSync(p)).digest('hex'),p)}" \
  plans/260925-documentation-authority-unification/reports/phase-07/review-input-step-03-step-04-01/part-01-architecture-contracts.json \
  plans/260925-documentation-authority-unification/reports/phase-07/review-input-step-03-step-04-01/part-02-vocabulary.json \
  plans/260925-documentation-authority-unification/reports/phase-07/step-03-contract-boundary-matrix.json \
  plans/260925-documentation-authority-unification/reports/phase-07/step-04-vocabulary-rows.json \
  plans/260925-documentation-authority-unification/reports/phase-07/step-03-checks.json \
  plans/260925-documentation-authority-unification/reports/phase-07/step-04-checks.json
```

## Part 1 — architecture and contracts

Read the part, matrix, readable report, component boundary, current Agent
Coordination spec, Assignment/Run/RunResult contract, architecture contract
registry and Gateway OpenAPI. For every one of 22 entries return `ok` or
`rework` with a cited reason. Confirm:

- the cognition→protocol/policy→assignment→dispatch→runtime→evidence→work-driver
  chain is complete and current-vs-history status is not blurred;
- every producer and all consumers are named with payload/failure behavior,
  implementation evidence and state-write/decision/runtime authority;
- counts are 10 compatible, one incompatible, four missing contract ids, six
  parked and six inventory-only;
- the Gateway registry row is absent, the two CTR010 meanings really collide,
  and both rows stay parked pending L11-7;
- X-STALE-01..06 are inventory-only and Step 5 remains their sole writer;
- no second state-write owner or unsupported implementation claim slipped in.

Light commands only:

```sh
jq -e '(.rows|length)==22 and ([.rows[].id]|unique|length)==22' plans/260925-documentation-authority-unification/reports/phase-07/step-03-contract-boundary-matrix.json
rg -n 'CTR010|confinement-authority.v1|fgos-gateway.v1' docs/platform/architecture-map.md docs/platform/herdr-web-dashboard/contracts/fgos-gateway-api-v1.yaml
rg -n 'retired|CollaborationPattern|Workflow runner|Team Cognition' docs/platform/agent-coordination/spec.md docs/platform/component-boundary.md
```

Write only `review-a38-step-03-04-architecture-01.md` with totals, per-entry
verdicts, rework list, stop-condition assessment and `Status: DONE`.

## Part 2 — vocabulary

Read the part, vocabulary rows, readable report, post-review edit log and the
three candidate diffs. For every one of 13 entries return `ok` or `rework` with
a cited reason. Confirm:

- all ten requested term families have one meaning owner, allowed aliases and
  prohibited conflations;
- A43 responsibility rings never imply classes, entities, schema types,
  modules or runtime objects;
- exactly three reviewed candidate corrections occurred and they change only
  stale citation/visible-label wording;
- X-DEFECT-01..05 remain rationale-only Phase 9 rows;
- no mass replacement, history erasure, vocabulary/checker edit, promotion or
  authority change occurred.

Light commands only:

```sh
jq -e '(.rows|length)==10 and (.candidateEdits|length)==3 and (.deferredRationaleRows|length)==5' plans/260925-documentation-authority-unification/reports/phase-07/step-04-vocabulary-rows.json
git diff -- docs/platform/runner/architecture/h-7af1f0242611.md docs/platform/host-invocation-routing/architecture/host-use-cases.md docs/platform/runner/operations/h-51f5cd7279fd.md
rg -n 'class|entity|schema type|runtime object|responsibility ring' plans/260925-documentation-authority-unification/reports/phase-07/step-04-vocabulary-rows.json
```

Write only `review-a38-step-03-04-vocabulary-01.md` with totals, per-entry
verdicts, rework list, stop-condition assessment and `Status: DONE`.

## Shared exclusions

Do not run `fgos`, npm test, native inventory generation, D/E, comparator,
generator/regeneration, or any command that writes the working tree. Do not
edit candidate content. This review accepts or rejects the bounded records; it
does not close Step 9 accounting or decide CTR010.
