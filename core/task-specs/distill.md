# task-spec: distill

domain: core | role: reference-analyst | capability: reference-learning | requires-skill: distill

## Input
- Reference sources (git repos, papers, living docs) in `intake.md` or registered under `docs/distillery/sources/`.
- Learning taxonomy `docs/distillery/taxonomy.txt`.
- Helper script `node scripts/distill.mjs`.

## Output
- Per-source indexes `docs/distillery/sources/<name>.md` with atomic cursors (`seal`).
- Cross-source comparison matrix `docs/distillery/comparison-matrix.md`.
- Single source of truth for adoption decisions `docs/distillery/porting-log.md` (candidate rows with `R# E# F#` scores).
- Deep-dive reports `docs/distillery/deep-dives/<topic>.md`.
- Consult reports in host project reports directory.

## Gates
- Soft: Cost-tiering protocol (mechanical inventory -> cheap subagents; classification -> host agent). Idempotent layout `docs/distillery/`.
- Hard: `references/` is strictly read-only. Mandatory `seal` after delta analysis. Triage and adoption decisions belong strictly to HUMAN (propose candidate rows, never decide adoption). Cursors computed from clone/source, never hand-guessed.

## Verify-template
- Verification check: `node scripts/distill.mjs check [<name>]`.

## Collaboration

| Trigger | Call | To | Reason | Bóng về mang |
|---|---|---|---|---|
| Mechanical inventory needed for large repo delta | assist (sync) | helper subagent | inventory-extract | file/symbol feature list |
| Intake item or candidate porting row needs adoption decision | advise (async) | human | adoption-triage | human decision (accept/reject candidate) |
| No trigger matches | — execute distill workflow — | | | |
