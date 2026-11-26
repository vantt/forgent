# Phase 6 step 3: the three CHANGELOG lines, ready to insert

Owner answer `q-x5fpm4dtvl` (2026-11-26, "Widen now") puts `CHANGELOG.md` in phase 6's footprint. The lead cannot
land the frontmatter change itself: `fgos land --paths plan.md` was refused `footprint-change-refused` (ticket
`c-1270-1795682992672`). Once the supervisor lands `- CHANGELOG.md` into the `plan.md` frontmatter `footprint`, insert
these three lines directly under `## [Unreleased]` in `CHANGELOG.md`:

```markdown
- Added: the host now reports the end of a head. A head whose run directory holds `closed.json` and that `session stop` never retired shows as `ended` in `fgos.head.state`, and `lead-ended` fires on `retired` or `ended`, so the supervisor learns that a lead finished or died even if nobody raised it.
- Added: the supervisor's wake closes finished heads through one door. It stops an idle planner once its plan lands as `draft` or `ready` (new `plan-drafted` watcher row) and an idle lead once its plan is `done`, whether the role is `head:lead-*` or `lead:<LANE>`. `fgos session stop --role` now accepts a lead's short `lead:<LANE>` role.
- Changed: a live lead whose every open phase has an open owner question (`plan:<dir>#phase-NN` or `plan:<dir>`) holds no working slot. `fgos supervisor plans` counts it in `leadsWaiting`, not `leadsLive`, so a ready plan is admitted while that lead waits.
```
