# fgOS Documentation

```txt
Document type: Documentation portal
Audience: Human reviewer, maintainer, implementer, agent
Purpose: Route readers into the fgOS documentation system
Design status: Accepted
Implementation: Partial
Provenance: Promoted from documentation-system redesign
Writer type: Human + agent coauthor
Canonical for: Top-level documentation entry
Use this when: You need to enter the fgOS docs
Do not use this for: Area-specific behavior or implementation detail
Last reviewed: 2026-09-13
Related:
- `docs/doc-governance.md`
- `docs/reading-map.md`
- `docs/platform/README.md`
```

This is the top-level portal for fgOS documentation.

## 1. Read First

| Need | Read |
|---|---|
| Documentation rules | [doc-governance.md](doc-governance.md) |
| What to read first | [reading-map.md](reading-map.md) |
| Platform/system design docs | [platform/README.md](platform/README.md) |
| Current legacy product/source map | [specs/reading-map.md](specs/reading-map.md) |
| User docs | [user/](user/) target; existing [how-to/](how-to/), [reference/](reference/), [explanation/](explanation/) during migration; `docs/tutorials/` is a planned/legacy slot not present in this checkout |

## 2. Main Spaces

| Space | Role |
|---|---|
| [platform/](platform/) | Platform-wide and area-specific system docs |
| [user/](user/) | Target user-facing docs organized by Diataxis |
| [generated/](generated/) | Target generated projections |
| [knowledge/](knowledge/) | Retrospective learning |
| [history/](history/) | Archive, discussions, migration source, retired context |
| [templates/](templates/) | Documentation templates |

## 3. Transitional Status

The documentation system is being migrated. Legacy roots such as
`docs/specs/**` and `docs/architect/**` remain active until their content is
promoted, redirected, or retired.

## 4. Related Files

| Relationship | File |
|---|---|
| governs documentation system | [doc-governance.md](doc-governance.md) |
| routes readers by purpose | [reading-map.md](reading-map.md) |
| platform documentation portal | [platform/README.md](platform/README.md) |
| legacy/current detailed source map | [specs/reading-map.md](specs/reading-map.md) |
