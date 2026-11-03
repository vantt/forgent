# User Documentation

```txt
Document type: User docs portal
Audience: fgOS user, maintainer, agent
Purpose: Route user-facing documentation by reader need
Design status: Accepted
Implementation: Partial
Provenance: Promoted from documentation-system redesign
Writer type: Human + agent coauthor
Canonical for: Target user-facing documentation structure
Use this when: You need tutorials, how-to guides, reference, or explanation
Do not use this for: Internal platform authority or implementation contracts
Last reviewed: 2026-09-13
Related:
- `docs/platform/governance.md`
- `docs/platform/documentation/operations/portals/docs-portal.md`
```

fgOS user-facing docs follow Diataxis:

| Need | Deferred target path | Retained path after platform cutover |
|---|---|---|
| Learn by doing | `docs/user/tutorials/` (not created) | `docs/tutorials/` (tracked `.gitkeep` only; no tutorial content) |
| Complete a task | `docs/user/how-to/` | `docs/how-to/` |
| Look up facts | `docs/user/reference/` | `docs/reference/` |
| Understand concepts | `docs/user/explanation/` | `docs/explanation/` |

The platform-authority cutover does not retire or rename the retained user-doc
roots above, nor does it create `docs/user/tutorials/`. Mapped end-user content
is also under `docs/knowledge/**`. The target `docs/user/**` remains a separate
future migration; do not infer approval or new directories from this table.
