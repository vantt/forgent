# Component Authority Specification

```txt
Document type: BA-grade area specification
Audience: Human reviewer, maintainer, implementation agent, tool author
Purpose: Define the single structural model of layers, components, decision kinds, doors, contracts, and file-to-component mappings
Design status: Accepted (CA-D1..CA-D5, plans/discussions/ds-at6x3xj2ng-component-authority/DISCUSSION.md §4, signed by CA-D5)
Canonical: Yes
Owner: Component authority
Source: packages/component-authority/
Contracts: packages/component-authority/contracts/
Last reviewed: 2026-11-21
Related:
- docs/platform/component-boundary.md
- docs/platform/architecture-map.md
- docs/platform/platform-foundations.md
- docs/platform/governance.md
- docs/platform/convention/spec.md
- docs/platform/documentation/subcomponents/document-identity/spec.md
- docs/platform/documentation/subcomponents/admission/spec.md
- docs/platform/agent-confinement/spec.md
- docs/platform/system-overview/spec.md
Implementation: In progress
Provenance: Created from plans/discussions/ds-at6x3xj2ng-component-authority/DISCUSSION.md and plan plans/261121-2109-component-authority/plan.md
Writer type: Agent draft writer
Canonical for: Who owns what: components, subcomponents, decision kinds, doors, contract index, file-to-component mappings, and the locate and declare doors
Use this when: Finding which component owns a decision kind, door, contract, or path, declaring new structural elements, or understanding system authority boundaries
Do not use this for: Runtime agent confinement (Agent Confinement Authority), contract contents, RULs, L1-L10 platform laws, design principles, or decision records
Supersedes: docs/platform/proposals/component-authority-boundary-map.md
Superseded by: None recorded
```

## 1. Purpose and boundary

Component Authority is the platform component that answers "who owns what" across fgOS. It maintains a single machine-readable structural model of layers, components, subcomponents, decision kinds, doors, contracts, and file-to-component mappings.

**Component Authority holds design ownership and grants no runtime permission. It is not Agent Confinement Authority.** Runtime execution boundaries, sandbox containment, and isolation enforcement are owned exclusively by Agent Confinement Authority (`docs/platform/agent-confinement/spec.md`). Component Authority does not enforce runtime permissions, process containment, or operating system guards.

### Owns

- The single machine-readable structural model located at `packages/component-authority/model/`.
- The structural model schema in `packages/component-authority/contracts/model.v1.json`.
- The single decision kind: "who owns what" (components, subcomponents, decision kinds, doors, contract index, file-to-component mappings).
- The `locate` and `declare` doors for discovering and registering structural authority.
- The generation of derived human-readable ownership views across platform documentation.

### Must not own

- **Contract contents**: Schemas, fixtures, golden vectors, and validation logic remain co-located with the providing component (such as each package's `contracts/` directory). Component Authority indexes contracts (metadata, provider, consumers, paths) but never duplicates their contents.
- **Runtime agent confinement**: OS-level sandboxing, bwrap containment, and execution process isolation belong to Agent Confinement Authority (`docs/platform/agent-confinement/spec.md`).
- **Business rules and RULs**: Individual area specifications own their domain and architectural business rules.
- **Platform foundation laws (L1–L10) and design principles**: Platform Foundations (`docs/platform/platform-foundations.md`) exclusively owns core locked design laws and system principles.
- **Decision records and narratives**: Decision narratives (D-ADR, D-ID) remain in each owning area's decision directory or specification.

## 2. Data model

The structural model stores six distinct row kinds under `packages/component-authority/model/`, validated against `packages/component-authority/contracts/model.v1.json`:

### 2.1 Layers, rules, domains, and tiers

Defined in `layers.json` (created by phase 2 of the plan, migrating from `docs/architecture-manifest.json`):
- `layers`: Ordered architectural layer names (`entry`, `use-case`, `infra`, `domain`, `kernel`) defining allowed one-directional import flows.
- `rules`: Structural layering rules (`one-directional-layer`, `domain-siloing`, `tier-downward`).
- `domains`: Registered business and execution domains (`coding`, `council`, `marketing`).
- `tierNames`: Descriptive names for numeric tiers 0 through 9.
- `tierExceptions`: Explicit exceptions with path, tier, and documented rationale.

`tiers.json` and its schema definition arrive with phase 2.

### 2.2 Components and subcomponents

Defined in `components.json`:
- `id`: Unique identifier (e.g., `component-authority`).
- `canonical`: Primary canonical display name.
- `aliases`: Array of synonyms and alternate terms (e.g., `["ownership registry", "authority ledger"]`).
- `meaning`: Clear single-sentence summary of component purpose.
- `parent`: Optional parent component ID for hierarchical subcomponents.
- `layer`: Architectural layer (`entry`, `use-case`, `infra`, `domain`, `kernel`).
- `tier`: Numeric tier assignment (0–9).
- `paths`: Array of repository-relative directory or path prefixes owned by the component.
- `exceptions`: Per-path overrides `{path, layer?, tier?, reason}`.
- `owns`: Array of responsibilities and boundaries owned.
- `mustNotOwn`: Array of explicit non-goals and forbidden boundaries.
- `spec`: Canonical specification path.
- `source`: Array of primary implementation source paths.
- `status`: Lifecycle state (`live`, `designed`, `planned`, `draft`, `retired`).

### 2.3 Decision kinds

Defined in `decision-kinds.json` (created by phase 3 of the plan):
- `id`: Stable decision kind identifier.
- `canonical`: Canonical name.
- `aliases`: Alternative and legacy scope strings (derived from `docs/platform/governance.md#decision-scope-to-holder-table`).
- `meaning`: Sentence explaining the scope of decisions covered.
- `owner`: Exactly one component ID that owns this decision kind.
- `narrative`: Canonical path where decision narratives live.

### 2.4 Doors

Defined under `doors/` (one JSON file per door job, created by phase 2 of the plan):
- `job`: Description of the single-door job being protected.
- `kind`: Door kind identifier (`door`).
- `patterns`: Regular expression patterns matching both primitive operations and canonical/alias symbols.
- `allowed`: Allowed caller files, either plain strings or objects with `{path, reason}`.
- `debt`: Transitional callers awaiting retirement, each with `{path, reason}`.
- `reason`: Explanation of why this door exists and how callers are bounded.
- `retiredBy`: Phase, plan, or condition under which debt entries are eliminated.
- `owner`: Optional component ID owning the guarded mechanism.

### 2.5 Contract index

Defined in `contracts.json` (created by phase 4 of the plan):
- `id`: Unique contract identifier (e.g., CTR code or package contract name).
- `canonical`: Canonical contract name.
- `aliases`: Alternate names or legacy designations.
- `meaning`: Clear sentence stating what interaction the contract governs.
- `provider`: Exactly one component ID responsible for publishing and maintaining the contract.
- `consumers`: Array of component IDs consuming the contract.
- `guards`: Optional array of guards or checking mechanisms.
- `version`: Version token or number.
- `path`: Path to contract schema, specification, or definition file.
- `evidence`: Array of test paths, golden vector files, or replay fixtures verifying the contract.
- `status`: Lifecycle status (`live`, `designed`, `planned`).

### 2.6 Files

Transitional file-to-layer mapping (`files.json`, created by phase 2 of the plan) moved from `docs/architecture-manifest.json` during model migration. In phase 3, layer and tier assignments are derived directly from component path mappings, rendering `files.json` obsolete.

## 3. Operations: `locate` and `declare`

Component Authority provides two operational doors (specified for implementation in sibling plan `plans/261121-2110-component-authority-doors/plan.md`):

### 3.1 `locate`

`locate` accepts a natural language sentence describing an intended task or capability and returns matching components, decision kinds, doors, and contracts.

- First: Matches against canonical names, recorded aliases, and meaning sentences.
- Once documentation H2 search lands: Integrates with the hybrid search mechanism (BM25 + embeddings, via pkm + OHS) from Documentation H2 (`docs/platform/documentation/subcomponents/document-identity/spec.md`).

### 3.2 `declare`

`declare` registers a new structural row (component, decision kind, door, or contract) or relocates an existing row.

- Reuses the admission model from Documentation H2 (`docs/platform/documentation/subcomponents/admission/spec.md`): an independent reviewer verifies the declaration within an approved frame.
- **A new component or new decision kind always requires project owner approval.**
- Moving a decision kind between components requires an approved plan naming the surviving owner.
- When new synonyms are identified, they are recorded as aliases on the existing row to prevent duplicate implementations.

CLI verb shapes (sibling plan `plans/261121-2110-component-authority-doors/plan.md`):

```text
fgos authority locate "<sentence>"
fgos authority declare --kind <kind> --row <file>
```

## 4. Callers and enforcement points

Component Authority is invoked across the system lifecycle:

1. **Documentation**: During discussion and specification authoring, authors call `locate` before creating new component or contract definitions to discover existing authorities, and call `declare` when a new authority is approved.
2. **Planning**: During plan creation, every new capability, function, or module must map via `locate` to an existing authority row, or include a `declare` step. Any plan overlapping an existing component must explicitly name the survivor. Plan review gates reject plans lacking this mapping.
3. **Implementation**: Implementers call `locate` before writing helper utilities, replacing ad-hoc prose searches in `domains/coding/skills/fgos-coding-implement/SKILL.md`.
4. **Land gate and `npm test`**: Deterministic checks validate the structural model:
   - Import direction conforms to layer definitions.
   - Guarded doors are respected (matching primitive invocations and aliases, never plain keyword blacklists).
   - Every source file maps to exactly one component.
   - Every contract has exactly one provider component and an existing file.
5. **Periodic review**: Automated reviews reconcile the model with codebase evolution.

## 5. Generated views and retired ledgers

The model at `packages/component-authority/model/` is the single source of truth for repository structure and authority. All human-readable ownership views are generated deterministically from this model:

- `docs/platform/component-boundary.md`
- Section 6 and Section 7 of `docs/platform/architecture-map.md`
- Area Map and Shared Entities in `docs/platform/system-overview/spec.md`
- Shared Entities tables in area specifications
- The component owner table in `docs/platform/README.md`
- The decision scope to holder table in `docs/platform/governance.md`

### Retired ledgers

With the establishment of Component Authority, previous disparate ownership ledgers are consolidated and retired:
- `docs/platform/proposals/component-authority-boundary-map.md`: Retired; useful boundary definitions are incorporated into the model.
- `docs/architecture-manifest.json`: Fully migrated into `packages/component-authority/model/` and retired in phase 7.

## 6. Settled facts

1. Component authority is design ownership, not runtime permission. It does not replace or duplicate Agent Confinement Authority (`docs/platform/agent-confinement/spec.md`).
2. Every contract in the system has exactly one provider component.
3. When porting from Node to Rust, twin implementations are forbidden (decision 2 in section 7). The legacy implementation is removed in the same change, and the commit message and specification record the final commit SHA of the removed implementation.
4. Subcomponents are modeled as component rows with a `parent` field rather than maintained in a separate ledger.
5. Business rules (RULs), platform foundation laws (L1–L10), and decision records remain outside the structural model; the model points to their locations.

## 7. Lịch sử quyết định

### Quyết định 1 — Authority, boundary và contract là yếu tố hạng nhất của toàn hệ thống

- **Ngày**: 2026-11-21
- **Lời chủ dự án**: "chọn A, mở discussion riêng đi em" và "authority/boundary và contract là yếu tố hạng nhất của cả system"
- **Nguồn**: `plans/discussions/ds-at6x3xj2ng-component-authority/DISCUSSION.md` §4 decision 1; rounds 12–14 của `orchestration-skeleton`
- **Nội dung**: Xác lập việc quản lý authority, boundary và contracts là yếu tố hạng nhất của hệ thống, tách riêng thành một chủ đề nghiên cứu và giải quyết độc lập thay vì xử lý tạm bợ hoặc gom chung vào các kế hoạch khác.

### Quyết định 2 — Cấm giữ twin khi port sang Rust

- **Ngày**: 2026-11-21
- **Lời chủ dự án**: "anh không muốn giữ bản node để làm chi, git có rồi thì truy lịch sử cũng được, chỉ cần ghi chuyển rust thì có note đầy đủ tham chiếu bản cũ."
- **Nguồn**: `plans/discussions/ds-at6x3xj2ng-component-authority/DISCUSSION.md` §4 decision 2, §3 row 3d
- **Nội dung**: Cấm duy trì triển khai song song (twin) giữa Node và Rust khi thực hiện chuyển đổi. Bản cũ phải được xoá trong cùng đợt cắt chuyển, toàn bộ caller phải được chuyển sang bản Rust. Lịch sử được truy xuất qua Git; commit và lịch sử quyết định ghi rõ commit SHA cuối cùng còn giữ bản cũ.

### Quyết định 3 — Thành phần mới component-authority quản lý quyền sở hữu

- **Ngày**: 2026-11-21
- **Lời chủ dự án**: "ok, chọn thành phần mới component-authority" (Q4) và "giữ component-authority" (round 12)
- **Nguồn**: `plans/discussions/ds-at6x3xj2ng-component-authority/DISCUSSION.md` §4 decision 3, §3 row 4
- **Nội dung**: Quyền sở hữu và ranh giới kiến trúc được giao cho một thành phần mới, nhỏ gọn, cô lập mang tên `component-authority`. Thành phần này chỉ thực hiện công việc quản lý mô hình cấu trúc, cung cấp hai cửa `locate` và `declare`, tái sử dụng năng lực tìm kiếm và mô hình admission của Documentation H2 (`docs/platform/documentation/subcomponents/admission/spec.md`).

### Quyết định 4 — Gộp tầng kiến trúc vào mô hình cấu trúc duy nhất

- **Ngày**: 2026-11-21
- **Lời chủ dự án**: "ok, gộp: một mô hình cấu trúc" (Q5)
- **Nguồn**: `plans/discussions/ds-at6x3xj2ng-component-authority/DISCUSSION.md` §4 decision 4, §3 row 4a(iv)
- **Nội dung**: Gộp toàn bộ dữ liệu tầng kiến trúc (layers, rules, tiers, mapping file) từ `docs/architecture-manifest.json` vào mô hình cấu trúc của `component-authority`, loại bỏ tình trạng duy trì hai tập tin bản đồ kiến trúc song song.

### Quyết định 5 — Duyệt thiết kế tổng thể của component-authority

- **Ngày**: 2026-11-21
- **Lời chủ dự án**: "ok duyệt."
- **Nguồn**: `plans/discussions/ds-at6x3xj2ng-component-authority/DISCUSSION.md` §4 decision 5, §6
- **Nội dung**: Phê duyệt toàn bộ thiết kế kiến trúc và vận hành của `component-authority`: hai cửa `locate`/`declare`, các điểm kiểm tra tại planning/land, tự động sinh các bản đọc cho người và thu hồi các sổ cũ; quản lý contract theo chỉ mục; subcomponent là hàng có `parent`; quy tắc kinh doanh và bản ghi quyết định nằm ngoài mô hình.
