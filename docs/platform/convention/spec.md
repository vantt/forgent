# Convention Component Specification

```txt
Document type: BA-grade area specification
Audience: Human reviewer, maintainer, implementation agent, tool author
Purpose: Define the executable source of truth for fgOS names and repository-relative placement
Design status: Accepted
Implementation status: Proposed
Canonical: Yes
Owner: Convention component
Source: packages/convention/rust
Contracts: packages/convention/contracts/
Last reviewed: 2026-10-10
Related:
- docs/platform/component-boundary.md
- docs/platform/host-invocation-routing/contracts/operation-catalog.md
- docs/io-contract.md
```

## 1. Purpose and admission rule

Convention owns executable rules that **generate**, **resolve**, or **check** a name or repository-relative path. A proposed rule enters this component only when it can be expressed as one of those deterministic operations and backed by golden cases for generation or resolution plus checking.

Convention is not a general utility package. It does not own generic formatting, string helpers, content inspection, link or anchor checks, cross-file graph checks, or stateful allocation. A deterministic format used by a state owner may become a later convention kind; allocation and uniqueness remain with that state owner.

The first implementation exposes one native Rust operation, `convention.query`, through:

- `fgos convention name`
- `fgos convention path`
- `fgos convention check`
- `fgos convention classify`

The CLI presenter owns the public `fgos.v1` envelope. The component returns typed outcomes and named provider errors.

## 2. Ownership boundary

### Owns

- Versioned rule data in `packages/convention/contracts/convention.rules.v1.json`.
- Versioned request/outcome contract and golden cases in `packages/convention/contracts/`.
- Deterministic generation of canonical names and paths for registered kinds.
- Pure checking of caller-supplied repository-relative paths.
- Bounded filesystem enumeration for `check --all` under rule-declared scopes.
- Pure path classification for rule shapes supported by schema v1.

### Must not own

- `.fgos` storage-root resolution; `src/runner/paths.mjs` remains its owner until Rust owns those callers.
- Fixed artifacts inside a run directory, including `agent-report.md`; Execution/run-result owns them.
- Stateful id or sequence allocation, including decision ids.
- Plan-directory creation or naming behavior of external `ak plan create`; Convention checks compatible output but does not replace that tool.
- AgentKit/ClaudeKit `## Naming` prompt blocks or any external kit implementation.
- Document body, frontmatter, metadata, links, anchors, duplicate prose, or cross-file graph health; the documentation plan's Node `doc-health` module owns those body/graph concerns.
- Project-overlay discovery or loading while Q13 remains open.

No source trait or `apps/fgos/src/wiring/` module is required: Convention reads no work-state, run-result, or other component state.

## 3. Rule model

`convention.rules.v1.json` is the only source for kind names, templates, accepted compatibility forms, locations, scopes, postures, and violation codes. Rust embeds it with `include_str!`. Node clients, hooks, doctor checks, and agent instructions must not duplicate templates, kinds, or directories.

Every rule has a stable `id`, one `kind`, exactly one `shape`, a `posture`, and a `scope`:

- `shape`: `name-template | placement-glob`; any other value fails rule loading with `invalid-rule-shape`.
- `posture`: `block | warn`.
- `scope`: rule-owned repository-relative path patterns used by `check --all` and callers that filter changed paths.
- Optional documentation-reservation flags: `canonical`, `metadataExempt`, `generated`, and `requiredMetadataFields`.
- A `warn` rule may carry a per-rule `cutoff` commit. The cutoff is not global.

A kind belongs to exactly one shape.

### 3.1 `name-template`

A name template recognizes and generates one repository artifact name. The initial kinds are:

| Kind | Canonical generated name | Canonical location | Accepted compatibility forms |
|---|---|---|---|
| `report` | `{type}-{YYMMDD-HHMM}-{slug}.md` | `plans/reports/` | Canonical form with optional `-report` suffix before `.md`; an external `GH-<n>` type prefix is accepted by `check` |
| `plan` | `{YYMMDD-HHMM}-{slug}` | direct child directory of `plans/`, containing `plan.md` and `phase-NN-<name>.md` | Directory names emitted by `ak plan create` that satisfy the timestamp and slug rules |
| `journal` | `journal-{YYMMDD-HHMM}-{slug}.md` | `plans/journals/` | Existing external-tool form `{YYYY-MM-DD}-{slug}.md`; `docs/journals/` is reported as informational `wrong-location`, not migrated by this plan |

Canonical generation never emits a compatibility form.

`type` is an open vocabulary, not an enum. Canonical input must normalize to lowercase ASCII segments separated by single `-`; the compatibility checker additionally accepts the external `GH-<n>` form. The parser identifies the timestamp structurally rather than maintaining a type list.

A slug is normalized by lowercasing ASCII, replacing each run outside `[a-z0-9]` with `-`, collapsing repeated `-`, and trimming leading/trailing `-`. No transliteration or Unicode-normalization dependency is added. Empty output is `invalid-slug`.

### 3.2 `placement-glob` reservation

Schema v1 reserves `placement-glob` for path-only document kinds without installing any real fgOS documentation kind. A placement rule contains:

- a slash-separated repository-relative glob;
- named single-segment placeholders written `<name>`;
- `*` for one path segment and `**` for zero or more complete path segments;
- `cardinality: singleton | collection`;
- `scope`, `posture`, and the optional documentation flags above.

Literal segments outrank placeholders, placeholders outrank `*`, and `*` outranks `**`. If equal-specificity rules match the same path, rule loading fails as ambiguous rather than depending on declaration order.

The first implementation exercises this shape only with synthetic contract fixtures. It does not install document placement policy.

### 3.3 Project overlay reservation — Q13 open

A future project overlay may add rules or replace packaged rules by matching `id`; an overlay rule will use the same versioned rule schema, and project entries will win over packaged entries with the same `id`. Global/project precedence must follow Packaging-Distribution, and introducing an overlay file or config key must register setup merge and doctor checks.

The overlay's location and filename are intentionally undecided (Q13). Plan B must not discover, load, merge, or enforce an overlay. Repositories outside the fgOS source tree therefore receive no packaged fgOS-specific document rules in this plan. Implementation requiring an overlay location stops at the owner gate.

## 4. Operations

All path output uses `/`, is relative to the caller-provided `--dir`, and rejects absolute paths or `..` traversal.

### 4.1 `name`

```text
fgos convention name --kind report|plan|journal [--type <type>] --slug <slug>
  [--at <RFC3339>] [--dir <root>]
```

For compatibility, `--type report|plan|journal` may select the kind when `--kind` is absent; for `report`, a separate report type remains required. The typed request contract removes that CLI ambiguity before entering the provider.

Successful `data`:

```json
{"kind":"report","name":"report-261006-1415-harness-audit.md","at":"2026-10-06T14:15:00+07:00","offset":"+07:00"}
```

### 4.2 `path`

Accepts the same naming inputs plus optional `--plan <plan-dir>`. Successful `data` is `{kind, path}`. A report without `--plan` resolves under `plans/reports/`. `--plan` resolves under `plans/<plan-dir>/reports/`. The per-plan reports location is a generation option only; it is outside the phase-05 hook/doctor scope.

### 4.3 `check`

```text
fgos convention check [--dir <root>] [--all | -- <path>...]
```

For explicit paths, checking is a pure string operation and does not read the filesystem. Paths follow `--`, so names beginning with `-` are data. `--all` enumerates only rule-declared scopes beneath `--dir`, does not follow directory symlinks, and ignores unrelated paths.

Successful `data`:

```json
{"checked":1,"violations":[{"path":"plans/reports/report-261006-x.md","code":"pattern-mismatch","message":"report name is missing a valid YYMMDD-HHMM timestamp"}]}
```

Violations are a successful completed outcome and exit 0. Hook and doctor callers apply posture. Invalid command input is a named provider error and exits 1 through the current host presenter.

A basename that identifies a registered kind at a noncanonical location reports `wrong-location`. An unrelated path outside every rule is ignored by `check`; `classify` reports `unknown-kind` for the same path.

Enforcement scope for the initial `report`, `plan`, and `journal` rules is deliberately narrow:

- pre-commit considers only newly added `*.md` files directly under `plans/reports/` and `plans/journals/`;
- nested evidence, per-plan `reports/` directories, fixed names such as `acceptance.md`, and non-Markdown files are outside that scope;
- all three initial kinds use `posture: warn`; phase 05 must not block a commit;
- old files remain visible as counts/examples, while the per-rule cutoff distinguishes newly introduced violations.

### 4.4 `classify`

```text
fgos convention classify [--dir <root>] -- <path>
```

This operation classifies only `placement-glob` rules; `name-template` kinds are checked through `check` and never receive an invented cardinality. It does not read the filesystem or document body. A match returns `{kind, cardinality, scope}`. No placement match is `unknown-kind`. Schema-v1 proof uses synthetic `placement-glob` rules only; no real documentation kind is packaged by this plan.

## 5. Time rule

An explicit `--at` must be RFC3339 with an offset. Its civil date and time are formatted in that supplied offset; equivalent instants with different offsets may therefore produce different names intentionally.

Without `--at`, the provider uses the process-local civil time and returns its numeric offset. Unix obtains the offset through the one shared host-runtime civil-time implementation; unsupported platforms fall back to UTC and return `+00:00`. Callers and tests inject time/offset into pure operations.

Timestamp fields are calendar-validated, including month/day/leap-year and hour/minute bounds. A shape match with an impossible timestamp is `invalid-timestamp`, not merely `pattern-mismatch`.

## 6. Stable errors

| Code | Meaning |
|---|---|
| `invalid-kind` | Requested kind is absent or unsupported. |
| `invalid-type` | Report type cannot be normalized or violates the type shape. |
| `invalid-slug` | Slug normalizes to empty or violates the accepted input contract. |
| `invalid-at` | `--at` is not valid RFC3339 with an offset. |
| `invalid-plan-dir` | `--plan` is not a valid plan-directory name. |
| `invalid-rule-shape` | Rule data uses a shape outside the schema-v1 enum. |
| `pattern-mismatch` | A scoped artifact name does not match an accepted form. |
| `invalid-timestamp` | A syntactically located timestamp is not a valid civil date/time. |
| `wrong-location` | A recognized kind is outside an accepted location. |
| `unknown-kind` | `classify` cannot map a path to any rule. |

Messages are diagnostic text; consumers branch on code or process exit category, never message substrings.

## 7. Routing and host contract

- Operation id: `convention.query`.
- Owning component: `convention`.
- Effect: `Read`.
- Idempotency: `Safe`.
- Allowed host kinds: `cli`, `remote`.
- Streaming: none.
- Request/outcome contracts: `convention.query.request@1.0.0` and `convention.query.outcome@1.0.0`.
- Public successful presentation: one `fgos.v1` envelope.

`convention.query` satisfies the validating `<component>.<object-type>` operation-id grammar used by the current catalog; the catalog's reparse test remains the executable gate.

The Rust host is the single implementation. A Node caller uses `invokeHost`; it does not reproduce kinds, patterns, directories, or validation. The client recognizes an old host only from the exact trimmed diagnostic `fgos: unknown verb "convention". Usage: fgos <command> [args...]` with validation exit 4 (or, if the host later exposes a structured verb list, an explicit absence there), never from broad stderr substrings. It maps that case to `host-version-mismatch`.

Every call uses a 5-second process timeout so a stuck host cannot hang a commit or doctor run. The phase-05 caller behavior is closed and nonblocking:

| Result | Hook | Doctor |
|---|---|---|
| success with violations | print each warning; continue | `passed: true` with counts and up to three examples |
| `host-unavailable` | print one warning; skip | `passed: true` with pass-skip reason |
| `host-version-mismatch` | print one warning; skip | `passed: true` with pass-skip reason |
| `host-exec-error`, including provider exit 1 | print one warning with the category; skip | `passed: true` with pass-skip reason and category |
| `host-invalid-envelope` | print one warning with the category; skip | `passed: true` with pass-skip reason and category |
| timeout | categorize as `host-exec-error`, print one warning; skip | `passed: true` with timeout pass-skip reason |

No host failure or client-load failure causes phase-05 hook/doctor to enforce a guessed local fallback. Provider input errors remain visible as `host-exec-error`; callers do not reinterpret stderr text as a convention violation.

## 8. Extensions

An extension may invoke the user-installed `fgos convention ... --json` command or not use Convention. It must not assume `FGOS_HOST_BIN`:

- `apps/fgos/src/legacy_exec.rs` sets `FGOS_HOST_BIN` only for the legacy Node payload;
- external process providers inherit the host environment and configured manifest environment, but the supervisor does not inject `FGOS_HOST_BIN`;
- `host.callback` is accepted as manifest vocabulary, but no reverse request channel is implemented by the external adapter/frame path.

Therefore `fgos.component.v1` does not currently provide provider-to-host callbacks. Adding a callback channel or injecting a host binary into providers is separate host-runtime work with explicit capability and recursion design.

`ExternalWasm` is design-only: current Rust packages/apps and Cargo manifests contain no WASM provider implementation, and preserved intent HI-I018 leaves WASM future.

## 9. Initial golden vectors

The contract fixture is authoritative; this table records the required behavioral boundary.

| Operation | Input | Expected |
|---|---|---|
| `name` | report, type `report`, slug `harness-audit`, at `2026-10-06T14:15:00+07:00` | `report-261006-1415-harness-audit.md` |
| `path` | same, no plan | `plans/reports/report-261006-1415-harness-audit.md` |
| `path` | same, plan `261006-1415-fgos-convention-component` | `plans/261006-1415-fgos-convention-component/reports/report-261006-1415-harness-audit.md` |
| `check` | `plans/reports/harness-audit-261006.md` | `pattern-mismatch` |
| `check` | `plans/reports/report-261006-x.md` | `pattern-mismatch` |
| `check` | `plans/reports/report-261399-2561-x.md` | `invalid-timestamp` |
| `check` | `plans/report-261006-1415-x.md` | `wrong-location` |
| `check` | `plans/reports/report-261006-1415-x.md` | no violation |
| `check` | `plans/261006-1415-fgos-convention-component/plan.md` | no violation |
| `classify` | synthetic singleton and collection placement paths | matching kind/cardinality/scope |
| `classify` | unmatched synthetic path | `unknown-kind` |

Golden data must include every kind × supported operation success, every stable error, an explicit non-`+07:00` offset, `placement-glob` match/non-match for singleton/collection, and rejection of an unknown `shape`. Synthetic placement rules must not encode a real fgOS document kind.

## 10. Doctor and release behavior

`convention-conformance` is a registered doctor check and is listed in the Packaging-Distribution check registry and legacy distribution spec. It calls the thin client against the caller's working-tree top level.

- Existing or warning-posture violations: `passed: true` with counts and at most three examples.
- Missing/old host: `passed: true` with a pass-skip reason; never a guessed local implementation.
- A future block-posture violation introduced after its cutoff may return `passed: false`; no initial kind has block posture.
- Phase 05 applies packaged internal rules only in the fgOS source repository. Overlay-aware project behavior is deferred with Q13 because Plan B does not load overlays.

The release containing the native verb must be staged and activated before plain `fgos` can enforce it. Merging source alone does not refresh an activated release.

## 11. Deferred candidates

| Candidate | Disposition | Reason |
|---|---|---|
| `branchNameFor` / `fgw/<id>` | Later candidate | Deterministic generation/checking, but no demonstrated cross-language drift yet. |
| `nextFreeDecisionId` | Never allocate here; formatting may be reconsidered | Allocation depends on repository state and belongs to the decision-state writer. |
| `scripts/next-doc-id.mjs` | Never allocate here; formatting may be reconsidered | Scans mutable state to choose the next number. |
| Run-directory artifact names | Not Convention | Execution/run-result contract owns fixed artifact identity. |

Review deterministic id formatting only after evidence of drift between owners or after the Rust host owns the corresponding writer.

## 12. Resolved questions and evidence

| Question | Resolution | Evidence |
|---|---|---|
| Q1 provider callback | No implemented reverse callback channel; `host.callback` is linker vocabulary only. | `packages/host-runtime/rust/src/providers/external_process/registry.rs` (`DEFAULT_KNOWN_CAPABILITIES`); `adapter.rs` (`EncodedMessage`, one request then outcome); `bound_invocation_supervisor.rs` (`invoke_with_cancellation`); host-routing intent HI-I014. |
| Q2 WASM | Design-only/future. | `docs/platform/host-invocation-routing/intent-preservation-ledger.md` HI-I018; no Rust/Cargo match for `ExternalWasm` or `wasm`. |
| Q3 extension host access | Extensions invoke user-visible `fgos`; `FGOS_HOST_BIN` is not a provider contract. | `apps/fgos/src/legacy_exec.rs` (`FGOS_HOST_BIN` injection); external supervisor `Command` environment setup. |
| Q4 composition | Built-in provider registered in catalog, static composition provider table, invocation service, CLI projector; no wiring source. | `packages/host-runtime/rust/src/catalog.rs`; `apps/fgos/src/main.rs`; `apps/fgos/src/cli_projector.rs`. |
| Q5 later generators | Branch naming may qualify later; stateful number allocation never belongs here. | `src/runner/worktree.mjs::branchNameFor`; `src/runner/merge.mjs::nextFreeDecisionId`; `scripts/next-doc-id.mjs`. |
| Q6 journal | Canonical `plans/journals/` with canonical `journal-YYMMDD-HHMM-slug.md`; accept external `YYYY-MM-DD-slug.md`; do not move journals. | Existing two writers/locations and red-team correction in the approved plan. |
| Q7 report type | Open, shape-checked vocabulary; accept external `GH-<n>` and `-report` compatibility forms. | Existing report inventory and red-team correction. |
| Q8 slug | ASCII normalization without transliteration; empty is `invalid-slug`. | Rust standard-library boundary; no Unicode dependency needed. |
| Q9 timezone | Process-local civil time; explicit `--at` keeps its own offset; unsupported local-offset platforms use UTC. | Current external naming tools use local civil time; shared host-runtime helper prevents another algorithm copy. |
| Q10 package layout | `packages/convention/{contracts,rust/{src,tests}}`, Node client in `src/convention/`. | Existing `packages/observe/` layout. |
| Q11 old host | Thin client maps the exact `unknown verb \"convention\"` validation diagnostic to `host-version-mismatch`; broad stderr matching is forbidden. | Current host rejects unknown selectors; current `invokeHost` mismatch handling is too broad and subcommand-specific. |
| Q12 missing host | Hook/doctor warn or pass-skip; never block. | Hook availability must not make repository commits impossible. |
| Q13 project overlay location | **Open and reserved only.** Plan B does not build overlay discovery/loading. | Owner instruction 2026-10-10; setup/doctor registration cannot be designed until location/config form is chosen. |

## 13. Decision history

### 2026-10-06 — One Rust authority for executable conventions

Convention is a platform-core component with versioned rule data and golden cases. Native Rust is the only implementation; language-specific callers use the CLI/host boundary.

### 2026-10-06 — Compatibility without migration

Canonical generation uses the selected report/plan/journal forms. Checking accepts forms that active external tools still emit. Existing report and journal trees are not renamed or consolidated. Initial enforcement is warning-only and narrowly scoped.

### 2026-10-07 — Reserve document placement without taking document health

Schema v1 reserves `placement-glob`, cardinality, classification, per-kind posture/scope, and documentation flags. No real documentation kind, body check, metadata check, or link check ships in Plan B.

### 2026-10-10 — Keep project overlay location open

The merge-by-rule-id semantic is reserved, but overlay location, setup merge, doctor discovery, loading, and enforcement remain unimplemented until Q13 is explicitly decided.
