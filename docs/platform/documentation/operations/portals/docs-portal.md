# fgOS Documentation

```txt
Document type: Portal
Audience: Maintainer, implementer, agent
Purpose: Define the stated scope and preserve its source provenance and limits
Design status: Accepted at atomic cutover
Implementation: Historical source retained; current truth not certified
Provenance: docs/README.md at ad2ca83e245bbd76c0d275cc30366457b26c8df3
Writer type: Agent draft writer
Canonical: Yes
Canonical for: The document scope stated above; source implementation limits remain explicit
Use this when: Reading the scope, contracts and implementation limits stated here
Do not use this for: Standalone implemented-behavior proof or claims outside the stated scope
Last reviewed: 2026-10-14
Related:
- docs/platform/documentation/operations/portals/docs-portal.md#fgos-documentation
Supersedes: The mapped source location at atomic cutover
Superseded by: None
```

This is the top-level portal for fgOS documentation.

## 1. Read First

| Need | Read |
|---|---|
| Documentation rules | [governance.md](../../../governance.md) |
| What to read first | [reading-map.md](../../../../reading-map.md) |
| Platform/system design docs | [platform/README.md](../../../README.md) |
| Current detailed source map | [reading-map.md](../../../../reading-map.md); prior-source lineage: `docs/specs/reading-map.md` (retired, not a reading route) |
| User docs | [knowledge/](../../../../knowledge/) plus retained [tutorials/](../../../../tutorials/), [how-to/](../../../../how-to/), [reference/](../../../../reference/), [explanation/](../../../../explanation/); `docs/tutorials/` contains a tracked `.gitkeep`, not tutorial content. `docs/user/**` remains a separate target, not an invented active directory. |

## 2. Main Spaces

| Space | Role |
|---|---|
| [platform/](../../..) | Platform-wide and area-specific system docs |
| [user/](../../../../user) | Target user-facing docs organized by Diataxis |
| [generated/](../../../../generated) | Target generated projections |
| [knowledge/](../../../../knowledge) | Retrospective learning |
| [history/](../../../../history) | Archive, discussions, migration source, retired context |
| [templates/](../../history/templates) | Documentation templates |

## 3. Transitional Status

After the approved atomic cutover and conservation checks, maintained
`docs/specs/**` and `docs/architect/**` are retired. These spellings describe
prior-source lineage only. Current routing is `docs/reading-map.md`; each
claim has one promoted holder or explicitly retained root authority.

## 4. Related Files

| Relationship | File |
|---|---|
| governs documentation system | [governance.md](../../../governance.md) |
| routes readers by purpose | [reading-map.md](../../../../reading-map.md) |
| platform documentation portal | [platform/README.md](../../../README.md) |
| current detailed source map | [reading-map.md](../../../../reading-map.md); prior-source lineage: `docs/specs/reading-map.md` (retired, not a reading route) |


## Source Metadata

````text
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
- `docs/platform/governance.md`
- `docs/reading-map.md`
- `docs/platform/README.md`
```
````
