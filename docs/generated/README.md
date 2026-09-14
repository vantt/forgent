# Generated Documentation

```txt
Document type: Generated docs portal
Audience: Human reviewer, maintainer, agent
Purpose: Route generated documentation and projection artifacts
Design status: Accepted
Implementation: Partial
Provenance: Promoted from documentation-system redesign
Writer type: Human + agent coauthor
Canonical for: Target generated-docs structure
Use this when: You need generated projections or regeneration rules
Do not use this for: Editing source truth directly
Last reviewed: 2026-09-13
Related:
- `docs/doc-governance.md`
- `docs/templates/generated.md`
```

Generated docs are projections from declared sources. They must declare source
of truth, generator, freshness rule, and do-not-edit status.

Known generated/projection artifacts during migration:

| Artifact | Source / generator |
|---|---|
| `docs/doc-registry.md` | `fgos doc-registry` |
| `docs/doc-registry.json` | `fgos doc-registry` |
| `docs/decisions/index.md` | `fgos decision-index` |
| `docs/enduser-docs-index.json` | `fgos docs-index` |
| `docs/ui-spec/generated/**` | UI spec build tooling |

Do not hand-edit generated artifacts. Change the source of truth or generator.
