# plan.md — tsk-r81: CHANGELOG entry for herdr-spawn generalization work

Mode: tiny

0-1 flags (no auth/authorization/data-model/audit-security/external-
systems/public-contract/cross-platform/covered-behavior/weak-proof/
multi-domain flag genuinely applies — this is a doc-only addition, no
code path touched) → tiny.

## Approach

Add one bullet under `## [Unreleased]` → `### Changed` in `CHANGELOG.md`,
matching the file's existing bullet style (one paragraph per change,
citing the item id(s) and the concrete user-visible behavior). Summarize:
the config-driven `herdr-spawn` adapter generalization (any agent CLI
dispatches through a real herdr pane via config, not just an invisible
`cli-spawn` subprocess), the `agy`→`agy-cli` rename + `agy-herdr` addition,
the `-i` interactiveMode redesign, and the false-idle polling race fix —
citing tsk-5jl, tsk-2ii, tsk-10j, tsk-2rr.

No alternatives to reject, no risk map beyond "doc-only, no code" — this
is the single honest smallest path.

## Shape

One bullet, one file. No split.

## Outstanding questions

None
