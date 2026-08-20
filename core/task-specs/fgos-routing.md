# task-spec: fgos-routing

domain: core | role: session | scope: lifecycle-entry | requires-skill: fgos-routing

## Input
- Workspace context and state view (`fgos list`, `fgos ready`, `fgos triage`, `fgos stale`, `fgos rollup`).
- Claim request parameters (optional `--id <id>` for `discovery`/`exploring`/`planning` stages; omitted `--id` pulling next frontier item for `executing`).
- Domain registry mapping (`src/state/workflow-stage-graphs.mjs`).

## Output
- Active claim held on one work item (`fgos take --role session [--id <id>]`).
- Resolved item `domain` and `stage`.
- Mode/lane classification (`tiny`, `small`, `standard`, `high-risk`, `spike`) for `planning`-stage items based on mechanical flag counting.
- Resolution of the next skill to load (`skillForStage(getDomain(domain), stage)`).
- Or item parked in `awaiting-human` with attached question (`fgos ask <id>`).

## Gates
- Soft: Mode gate — decide plan lane (`tiny`/`small`/`standard`/`high-risk`/`spike`) before routing to `fgos-coding-planning`.
- Hard: Engine verb transition authority (`resolveDiscovery`/`resolvePlan` in `src/intake/`) always overrides session judgment; `fgos return <id>` for returning verified work.

## Verify-template
- N/A — entry and routing coordination task, produces no code artifact directly.

## Collaboration

| Trigger | Call | To | Reason | Bóng về mang |
|---|---|---|---|---|
| A decision genuinely requires human input | ask (async) | human | ask | answer / decision recorded (`fgos answer`) |
| Claimed item stage resolved | route (sync) | stage-skill | route | next stage execution |
| No trigger matches | — proceed to resolved stage skill — | | | |
