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
- `docs/doc-governance.md`
- `docs/README.md`
```

fgOS user-facing docs follow Diataxis:

| Need | Target path | Current active path during migration |
|---|---|---|
| Learn by doing | `docs/user/tutorials/` | `docs/tutorials/` |
| Complete a task | `docs/user/how-to/` | `docs/how-to/` |
| Look up facts | `docs/user/reference/` | `docs/reference/` |
| Understand concepts | `docs/user/explanation/` | `docs/explanation/` |

During migration, existing user-doc roots remain active. New or moved user docs
should follow the target `docs/user/**` structure once the migration plan is
approved.
