# Lead report: yaml-write-door p07 (agent projection writer)

Branch yaml-write-door/p07, head a5285f3c9 (base 09e22e726). Two commits: red test, then writer.

- scripts/project-agents.mjs: frontmatter built as a meta object (name, description String(), tools comma string, skills only when non-empty) and written with writeFrontmatter(meta, `\n${body}\n`, sourcePath). No '---' literal left. assertSingleLine kept.
- test/scripts/project-agents.test.mjs: tools test keeps exact title (D1), asserts meta.tools; skills test renamed, asserts meta.skills deep-equal; colon-space description assertion added as its own test (the bug removed; the phase allowed adding it to an existing test, a separate test was clearer; owns quoting).
- Census regenerated with --write-census (4 lines). .claude/agents/*.md not regenerated.
- Green: project-agents (18), project-agents + git-mutation-census (19), architecture, doc-health, citation-drift, check-decision-codes, one-door scan 0 undeclared. Shared target ywd-node-target.
- Red proven: the colon test failed with syntax-error on the old writer; the two value-level assertions passed on old bytes (same behaviour, by value).
- Unreleased line for phase 09: none user-visible until Q1 regenerates agents.
- This report is untracked in the worktree (not part of the phase's files).

## Lessons
- run-tests of several files exceeds the 120s tool timeout; run in background.
- The two retitled/by-value assertions cannot go red against old bytes; only the new quoting test is the red proof.
