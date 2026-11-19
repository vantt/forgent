# Resource-referee Component Specification

```txt
Document type: BA-grade area specification
Audience: Owner, maintainer, implementation agent
Purpose: One authority for applying a ruleset, given as data, to facts about a set of units and their resource claims, and returning findings and a verdict. It never acts
Design status: Settled by the owner in the discussion of plans/261119-0030-resource-referee-graph-write-scope-stack (decisions 1-5, 7, 10-13, 16, 17, 22, 23, 26); the catalog and limits were fixed in phase 1
Implementation: Spec and contract only (plan phase 1). The crate packages/resource-referee/rust is a skeleton from phase 2 and is filled in phase 5; no Node binding exists until a Node caller does
Canonical: Yes for the scope below, from the day the plan lands
Owner: Resource-referee component (proposed)
Source (planned): packages/resource-referee/rust (crate fgos-resource-referee)
Contracts: packages/resource-referee/contracts/resource-referee.v1.json
Provenance: plans/261119-0030-resource-referee-graph-write-scope-stack/plan.md and reports/facts.md at base 40949614f077844005a986ca1f0f75c0c5e8f508 (2026-11-19)
Writer type: Agent draft writer
Canonical for: The claim vocabulary and its space registry, the units-file shape, the closed catalog and the floor, the finding classes and codes, verdict derivation, the policy rules, the limits, and what the catalog cannot express
Use this when: Deciding whether a set of units may run together under a policy, or adding a check to the catalog
Do not use this for: What a path scope means or how two scopes compare (write-scope), the facts about order and cycles (graph), reading a plan table or a policy file (the door), or acting on a verdict (the caller)
Last reviewed: 2026-11-19
Related:
- plans/261119-0030-resource-referee-graph-write-scope-stack/plan.md
- plans/261119-0030-resource-referee-graph-write-scope-stack/reports/facts.md
- packages/resource-referee/contracts/resource-referee.v1.json
- docs/platform/write-scope/spec.md
- docs/platform/graph/spec.md
- docs/platform/component-boundary.md
- core/skills/_shared/plan-contract.md (section 4)
```

## 1. Purpose and owned decisions

Today every caller that asks "may these units run together" hard-codes its own rules: the plan check, the
supervisor's admission, plan-lint, Work's decompose gate, the workflow admission guard. This component takes
those rules out of the callers. It is given facts and a ruleset as data and returns a verdict with reasons.

It owns:

1. **Claims:** the vocabulary for what a unit wants, `{ space, ref }`, and the closed registry of spaces (section 3).
2. **The units-file shape** the planner door reads (section 3).
3. **The closed catalog of checks with open parameters,** and the floor no policy can remove (section 4).
4. **Findings, their classes and stable codes, and the verdict derivation** (section 5).
5. **Policy rules:** replace semantics, the identity echo, what a ruleset may and may not say (section 6).
6. **The limits** (section 7), and **what the catalog cannot express** (section 9).

It holds **no default policy** (the default belongs to the door), compares no claims itself (the caller
passes collisions as facts), reads no file and computes no hash. It never acts: a verdict is an answer, and
what happens next is the caller's decision. The name is `resource-referee`; `referee` alone is already a seat
name in the execution catalog (`test/runner/execution/patterns/catalog.test.mjs:676,692,2135`, role `judge`)
and the planner verb is therefore `fgos resource-check` (plan decisions 10, 26).

## 2. Shared entities

| Entity | Meaning |
|---|---|
| Unit (node) | `{ id, claims?, readOnly?, dependsOn?, layer? }` |
| Claim | `{ space, ref }`: one thing the unit wants to hold |
| Facts | The units, the graph package's output for them, the colliding pairs, the problems write-scope reported and an optional `truncated` marker |
| Ruleset | A list of `{ check, class?, params? }`, data from the caller |
| Floor | The five checks that always run and always block |
| Finding | `{ code, class, check, nodes, evidence }` |
| Verdict | `accept`, `accept-with-advice` or `reject`, with the findings, the policy identity echoed, counts and caveats |

## 3. Claims and the units file

A claim names a space and a reference inside it. The registry in the contract is closed:

| Space | Compared by | Meaning |
|---|---|---|
| `path` | write-scope may-overlap | a repo-relative path or glob |
| `ref` | exact equality | a git ref name |
| `port` | exact equality | a network port as a decimal string |

An unknown space is refused by name (`claim-space-unknown`), so a misspelt space can never pass as "no
collision". The referee does not compare claims: for `path` the door calls write-scope's colliding-pairs
function, for the other spaces it groups by exact `(space, ref)`, and both feed the referee as `exclusions`.
The equality spaces are listed because two parallel units can contend for them as for a file (a dev server's
port per worktree, a git ref that two lands both move); more spaces are added by a contract change with a
caller that needs them. `ref` and `port` have no caller in these plans and are the first thing to cut if the
owner wants the registry at `path` alone (reports/facts.md, section 6).

**An empty list is not "disjoint".** A unit declares `claims` or `readOnly: true`; a unit with neither, and a
unit whose `claims` is an empty list while not read-only, is a blocking finding. A read-only unit may omit `claims` or give `[]`; only a non-empty `claims` beside `readOnly: true` is refused. This closes the loophole in
`packages/supervision/rust/src/portfolio.rs:200`, where an empty footprint never overlaps anything, which
would break the soundness contract of write-scope (plan decision 13). `readOnly` is asserted by the caller,
is not verified, and every verdict lists the read-only units and says so.

**The `--units` file** is `{ "v": 1, "units": [ { id, claims?, readOnly?, dependsOn?, layer? } ] }`, defined
field by field in the contract. It is a neutral shape and not the `Unit` file schema, because a real Unit
treats empty `writes` as read-only (`src/runner/execution/unit.mjs:125`) since dispatch enforces it; this
component must not read an empty list that way. Unknown fields are refused by name. `layer` is the layer the
author declared, an integer from 1, optional per unit.

## 4. The catalog and the floor

The catalog is closed: a ruleset can choose checks and set their parameters, never add code. This is the
middle between per-application code (what exists now) and an expression language (a second thing to secure
and to keep stable).

| Check | Floor | Default class | Parameters | What it judges |
|---|---|---|---|---|
| `no-cycles` | yes | blocking | none | the graph has no cycle |
| `no-dangling-edges` | yes | blocking | none | every dependency names a unit |
| `claims-declared` | yes | blocking | none | every unit declares claims or `readOnly`; entries canonicalize; per-item limits hold |
| `facts-not-truncated` | yes | blocking | none | no fact was cut short by a cap |
| `no-exclusion-in-one-layer` | yes | blocking | none | no colliding pair sits in one declared layer |
| `declared-layers-valid` | no | blocking | none | every unit is declared in a layer later than all it depends on |
| `max-layer-width` | no | advisory | `max` (integer from 1, required) | no declared layer holds more than `max` non-read-only units |

**The floor takes no parameters and is always blocking.** A ruleset may name a floor check only bare or with params `{}` (a no-op); any parameter key, or a `class`, is refused by name (`floor-check-not-configurable`); a policy therefore cannot
turn the collision check into a warning. The floor runs whether or not the ruleset names its checks. The
layer checks judge the layers the author declared, and are vacuous when no unit declares one. The hot-file
rule needs no check of its own: two phases that list the same file in one layer collide under the footprint
rule (plan decision 11).

Left out of v1 on purpose, because nothing in a plan table carries an attribute for them to read: a numeric
attribute check (phase size, risk) and alone-in-layer.

## 5. Findings and the verdict

| Code | Class | Check | Raised when |
|---|---|---|---|
| `cycle` | blocking | `no-cycles` | the graph reports a non-trivial component; evidence is the canonical cycle |
| `dangling-edge` | blocking | `no-dangling-edges` | a unit depends on an id that is not a unit |
| `claims-missing` | blocking | `claims-declared` | a unit has neither `claims` nor `readOnly: true` |
| `footprint-empty` | blocking | `claims-declared` | `claims` is an empty list and the unit is not read-only |
| `footprint-entry-invalid` | blocking | `claims-declared` | a `path` claim does not canonicalize (a write-scope problem) |
| `claims-over-limit` | blocking | `claims-declared` | a unit exceeds the claims-per-unit or entry-length limit |
| `read-only-with-claims` | blocking | `claims-declared` | `readOnly: true` beside a non-empty `claims` (absent or `[]` claims beside `readOnly: true` is fine) |
| `facts-truncated` | blocking | `facts-not-truncated` | the `truncated` fact is set |
| `exclusion-in-one-layer` | blocking | `no-exclusion-in-one-layer` | a colliding pair is declared in one layer |
| `layer-order-violation` | per rule | `declared-layers-valid` | a unit is not later than a unit it depends on |
| `layer-missing` | per rule | `declared-layers-valid` | some unit declares a layer and this one does not |
| `layer-width-exceeded` | per rule | `max-layer-width` | a declared layer is wider than `max` |

Codes are stable: one code, one meaning, never reused. Every finding has the shape
`{ code, class, check, nodes, evidence }`.

**Verdict derivation, from classes only.** Any blocking finding gives `reject`. No blocking and at least one
advisory finding gives `accept-with-advice`. No finding gives `accept`. A truncated fact set always gives
`facts-truncated`, which is blocking whatever the ruleset says, so a truncated input never yields `accept` or
`accept-with-advice`. A caller that bypasses the referee must refuse an incomplete answer itself (write-scope
spec, section 8).

The verdict also carries: the policy identity it was given, echoed verbatim (so a verdict from a weaker
policy is visibly from that policy); counts of units, read-only units and units that declared a layer; the
read-only unit ids; and the two caveats that always travel with it, *lexical* (case folding, Unicode
normalisation and symlinks are outside the path rule) and *read-only asserted* (not verified).

## 6. Policy

A ruleset is data given by the caller. It **replaces** the default's non-floor rules; it never replaces the
floor. The floor is what a stranger can rely on when reading any `accept`. Because a ruleset can only choose
among catalog checks and adjust a non-floor check's class and parameters, it can weaken a verdict by
dropping the layer checks or downgrading them to advisory; it cannot switch off collisions, cycles, dangling
edges, undeclared claims or truncation. The verdict names the policy it ran under, in `--json` and in the
human output alike.

The package holds no default ruleset. The planner door ships its default (the floor plus
`declared-layers-valid`) as data inside the door, and the repository ships no policy file. A policy file is
operator input named explicitly, never discovered from a plan directory, and a missing or unreadable one is a
refusal by the door, never a fall back to the default (plan decision 11). The package never sees a path: the
caller passes `{ source, sha256 }` as opaque strings for the echo.

A ruleset is refused before anything is evaluated when it names an unknown check, an unknown parameter, a
parameter of the wrong type or range, a check twice, a floor check with any parameter key or a class (bare or `params: {}` is accepted as a no-op), or more than
200 rules.

## 7. Limits and refusals

| Limit | Value | Behaviour |
|---|---|---|
| Units | 20000 | set-level: refused by name |
| Rules | 200 | set-level: refused by name |
| Input bytes, per input document (a file the door reads, or the JSON text a binding receives) | 4 MiB | set-level: refused by name; measured against `plan.md` at most 128519 bytes |
| Exclusions in `facts.exclusions` | 100000 | set-level: refused by name; equals the emitted-pairs cap of write-scope |
| Problems in `facts.problems` | 100000 | set-level: refused by name; same bound as exclusions |
| Claims per unit | 512 | per-item: the finding `claims-over-limit`; the rest is still evaluated |
| Claim `ref` length | 1024 bytes | per-item: the same finding |
| Id length | 256 bytes | refused by name (an id is how the unit is named) |

Set-level breaches never give a partial answer. A refusal returns no findings and names the code, the field
or limit and the index of the first offending item. The numbers, with their measurements, are in
`reports/facts.md`, section 4. The door escapes every value taken from an input file before it prints it;
this package returns values raw and never builds human text from file content.

## 8. Boundaries

The referee sits above `graph` and `write-scope` and below every application. It imports neither; the
caller passes it their outputs as facts, so it can be tested with hand-built facts and replaced in no other
package. The door plan owns the door `fgos resource-check --plan <dir> | --units <file.json> [--policy
<file>]`, the default policy, the phase-table reader, the file readers and the human output.

`resource-referee` has no addon binding in these plans: no Node caller exists, and one is added when one
does (plan decision 16).

## 9. What the catalog cannot express

The catalog was checked against the rules callers hard-code today. What it expresses is listed first, then
each gap with its resolution.

**Expressed.** Plan contract section 4: footprints disjoint in one wave (floor), a wave later than the waves
of its dependencies (`declared-layers-valid`), one writer per hot file per wave (the same footprint rule).
Admission guard 3, write scope (`src/workflow/case-admission.mjs:168`): writes disjoint from every live
reservation, by passing the proposal and the live reservations as units. The guard compares the proposal against each live reservation only (`case-admission.mjs:171`) and never the reservations among themselves, so the mapping must not put them in one layer as peers of each other: the door builds exclusions from the proposal-against-reservation pairs alone, and overlaps among live reservations raise no finding.

| Rule | Where | Why the catalog cannot say it | Resolution |
|---|---|---|---|
| Phase table has exactly the columns id, title, depends-on, footprint, wave, status (order free) | plan-contract section 4, phase table | a table-shape rule, not a fact about a set of units | Stays in `scripts/plan-contract-check.mjs` table parsing; the door reads units, not tables |
| Layers stay serial (a lower layer lands before the one above starts) | plan-contract section 4, Waves | an execution ordering rule at run time, not a property of the declared layers | Stays with the supervisor and the workflow; `declared-layers-valid` judges only that a layer is later than its dependencies |
| Phase fits one short leader | plan-contract section 4, Size | no unit attribute carries a size | Stays judgement; a numeric attribute check is left out of v1 (plan decision 12) |
| One integration phase in the last wave | plan-contract section 4, Integration | needs a unit role | Stays in the plan-contract skill; not a table attribute |
| One Workflow case per parallel phase, at most two slices per case | plan-contract section 4, Execution | a workflow rule, not a set-of-units fact | Stays in the workflow guide |
| Phase file contents (inputs, steps, verify, rollback) | plan-contract section 4, Phase file | a document-shape rule | Stays in `scripts/plan-contract-check.mjs` section checks |
| Entry: a write needs a write-effect activity and its milestones hold | admission guard 1 | reads the case projection | Stays in `case-admission.mjs`; recorded follow-up |
| The guide's MUST rows | admission guard 2 | guide-defined, read from the guide | Stays in `case-admission.mjs`; recorded follow-up |
| Binding: the worktree is this case's | admission guard 4 | an identity fact about the worktree | Would be an equality claim space `worktree`; not added without a caller |
| Frame counters (dispatches, mutating dispatches, seat launches left) | admission guard 5 | numeric budget, no numeric check | Left out of v1 with the numeric attribute check |
| Route: listed or unlisted | admission guard 6 | names the activity route | Stays in `case-admission.mjs` |

The plan names five admission guards; the code has six, the sixth being the route guard
(`case-admission.mjs:218`). The gap list above covers all six. None of the gaps blocks the plans: every
rule the plan check, the supervisor and the door need is expressed, and the rest remain where they are.

## 10. Non-goals

- A default policy, a policy file in this repository, an expression language, or per-application code in the package.
- A numeric attribute check, alone-in-layer, or any check that needs data a plan table does not carry.
- Acting on a verdict: refusing a plan, starting a run, writing a file.
- Reading files, hashing, or escaping text for display (the door).
- A Node binding before a Node caller exists.

## 11. Lịch sử quyết định

| Id | Decision | Where it lands here |
|---|---|---|
| plan decision 4 | A closed catalog of checks with open parameters; no default policy in the package | sections 1, 4, 6 |
| plan decision 5 | `claims` `{ space, ref }` is the input vocabulary | section 3 |
| plan decision 7 | Refuse oversize set-level input by name; per-item breaches are item-level findings; `truncated` is a fact the referee turns into a blocking finding | sections 5, 7 |
| plan decisions 10, 26 | The door is `fgos resource-check`; `referee` alone collides with an execution seat name | section 1 |
| plan decision 11 | `--policy` replaces the default and never the floor; the verdict echoes the policy identity; no default in the package | sections 4, 6 |
| plan decision 12 | Catalog v1: the floor, declared layers valid, and an optional maximum layer width; no numeric attribute check, no alone-in-layer | section 4 |
| plan decision 13 | Every unit declares claims or `readOnly`; an empty list is unknown; `readOnly` is caller-asserted; the space registry is closed | section 3 |
| plan decision 17 | An entry that does not canonicalize is reported by unit and entry | section 5 |
| plan decision 22 | The path rule is lexical and every verdict says so | section 5 |
| plan decision 31 | A plan with zero phases is a blocking finding in the door, never `accept` | contract `emptyFacts` |
| phase 1 | The registry holds `path`, `ref` and `port`; the codes, limits and gap list were fixed here | sections 3, 5, 7, 9 |
