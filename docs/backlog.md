# Product Backlog

<!--
GENERATED FILE — do not hand-edit.
Rendered by `bee backlog render` from event-sourced PBI records in .bee/backlog.jsonl (backlog-unification D1/D3).
Regenerate: `bee backlog render --write`. Check freshness: `bee backlog render --check`.
Deterministic: byte-identical for the same backlog.jsonl contents — status-grouped, id-sorted entries, LF endings,
never a generation timestamp or any other wall-clock value.
-->

| ID | Story | CoS | Status | Feature |
|----|-------|-----|--------|---------|
| p-52815b3f | Extend fgos-runner startup preflight gate with clean-worktree, git-version, and disk-space checks | resolveRepoRoot() in repo/src/runner/loop.mjs rejects at runner startup (before the claim loop) when the target repo has a dirty worktree, an unsupported git version, or insufficient disk space -- same validation-error pattern as the existing HEAD-resolve check shipped in STR86, never inside the per-item retry path. Deferred repo-wide checks named in STR86's own decision log are no longer unfiled backlog. | proposed | str86-runner-preflight-checks |

## Done / Declined

- [p-aa00ed92] Fix false version-drift failure in bee upgrade verification when bee and plugin versions already match — done
