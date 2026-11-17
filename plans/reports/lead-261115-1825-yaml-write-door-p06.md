# yaml-write-door p06: knowledge canary writer

Branch yaml-write-door/p06, base 09e22e726. Commit adds `writeFrontmatter` import and replaces the hand-written fence in `scripts/knowledge-canary.mjs`; census regenerated (no site change).

Gates green: knowledge-canary, git-mutation-census, architecture, doc-health, decision-citation-drift; one-door scan 0 undeclared. No fence literal left; no main entry in the script (no addon-ensure needed). Shared target ywd-node-target used (no Rust change). No CHANGELOG line.

## Lessons
- A wait loop with `pgrep -f <worktree>` matched itself/other processes and hung; poll by pid or just rerun the command in background.
