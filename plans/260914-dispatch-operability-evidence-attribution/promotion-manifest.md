# Promotion Manifest

**Verdict:** READY
**Scope:** design promotion only; no runtime behavior ships in this track.

| Target | Section | Content class | Collision check | Promotion |
|---|---|---|---|---|
| `docs/architect/agent-coordination/contracts/assignment-run-runresult.md` | RunResult | contract addendum | append planned v2/observation note; preserve existing contract text | Add D01-D05 planned design summary. |
| `docs/specs/runner.md` | Dispatch operability planned design | BA/spec pointer | append new subsection near CoordinationSession/dispatch vocabulary | Add user-facing spec pointer and negative capabilities. |
| `docs/specs/reading-map.md` | agent-coordination area row | reading pointer | update existing row without removing current history pointers | Add DOEA design artifacts as planned design authority. |

Promotion rules:

- Label all promoted behavior as planned/proposed until implementation proof
  exists.
- Do not edit `CHANGELOG.md`; no user-visible runtime behavior shipped.
- Do not edit source/config/test files.
- Do not overwrite unrelated concurrent documentation edits.

## Decision IDs

The promoted content carries DOEA-01 through DOEA-13 as design decision labels
inside this track. They are not platform-wide ADRs unless a future
implementation track settles them into the repo decision system.
