---
type: explanation
title: Why the judge-discovery and judge-decompose capacities were removed
tags: [dispatch, judge, native-first-dispatch, cleanup]
source_capture_ids: [tsk-4w4]
authoritative_for: why the judge-discovery/judge-decompose capacity entries were deleted from .fgos/config.json
---
# Why the `judge-discovery` and `judge-decompose` capacities were removed

`tsk-4w4`. Two capacity entries in `.fgos/config.json`,
`judge-discovery` and `judge-decompose`, had become orphaned: no code
anywhere called them once the Native-First Dispatch Doctrine (`tsk-27y`)
fully retired the mechanism they served — a nested `claude -p` subprocess
judging discovery/decompose verdicts instead of the live session
reasoning it directly.

Confirmed by a repo-wide grep (`src/`/`bin/`/`test/`/`docs/`): the only
remaining references were the config entries themselves plus a test
fixture that builds its own standalone config object rather than reading
the real committed one — not a real consumer either way.

**Fix**: both orphaned entries deleted from `.fgos/config.json`. This is
distinct from — and simpler than — a related finding
(`docs/explanation/why-dispatch-mjs-was-redesigned-around-task-not-agent-capacity.md`'s
D10) that the `for: "judge"` naming collision between these two entries
was harmless and needed no code fix; that finding was about a naming
collision in still-live config, this item is about the entries no longer
having any reason to exist at all.
