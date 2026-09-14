# Documentation Reading Map

```txt
Document type: Reading map
Audience: Human reviewer, maintainer, implementer, agent
Purpose: Tell readers what to read first by purpose
Design status: Accepted
Implementation: Partial
Provenance: Promoted from documentation-system redesign
Writer type: Human + agent coauthor
Canonical for: Documentation entry routing
Use this when: You need to decide which fgOS docs to read first
Do not use this for: Documentation governance or complete file inventory
Last reviewed: 2026-09-13
Related:
- `docs/doc-governance.md`
- `docs/platform/README.md`
- `docs/specs/reading-map.md`
```

This map is a reader route, not a complete inventory. The legacy
`docs/specs/reading-map.md` remains the detailed product/source map during
migration.

## 1. Start Here

| Need | Read |
|---|---|
| Understand documentation rules | [doc-governance.md](doc-governance.md) |
| Understand platform-wide docs | [platform/README.md](platform/README.md) |
| Understand packaging, install, activation, setup, and doctor | [platform/packaging-distribution/README.md](platform/packaging-distribution/README.md) |
| Understand current legacy source map | [specs/reading-map.md](specs/reading-map.md) |
| Shape a new multi-round design | Create or update a discussion scratchpad |
| Understand an area | `docs/platform/<area>/README.md`, or current legacy `docs/specs/<area>.md` during migration |

## 2. Reader Journeys

### 2.1. New Human Reviewer

1. `docs/README.md`
2. `docs/platform/README.md`
3. The relevant `docs/platform/<area>/README.md`
4. `spec.md`
5. Architecture, contracts, decisions, and verification as linked by the area
   README.

### 2.2. Implementer Or Agent

1. `docs/doc-governance.md`
2. `docs/platform/README.md`
3. Area README.
4. Area `spec.md`.
5. Relevant contracts.
6. Verification expectations.

### 2.3. Architecture Shaping

1. Area README and current spec.
2. Related platform anchors such as `vision.md`, `platform-foundations.md`,
   `architecture-map.md`, and `component-boundary.md`.
3. Existing architecture and decisions.
4. Discussion scratchpad for active shaping.
5. Promotion into canonical docs after review.

### 2.4. User-facing Documentation

Use Diataxis-style user docs:

```txt
docs/user/tutorials/
docs/user/how-to/
docs/user/reference/
docs/user/explanation/
```

During migration, the existing roots remain active:

```txt
docs/tutorials/
docs/how-to/
docs/reference/
docs/explanation/
```

## 3. Transitional Note

The target structure is being introduced incrementally. When both legacy and
target docs exist, prefer the document with the clearest canonical metadata and
latest review date, and surface conflicts instead of silently reconciling them.

## 4. Related Files

| Relationship | File |
|---|---|
| governs documentation system | [doc-governance.md](doc-governance.md) |
| platform portal | [platform/README.md](platform/README.md) |
| legacy/current detailed source map | [specs/reading-map.md](specs/reading-map.md) |
