# Carry: Phase 11 Step 2 Changelog Lines

`CHANGELOG.md` is outside this plan's footprint (owner order 2026-11-23 07:45), and the run door refuses it
(`write-outside-footprint`). lead:SUPERVISOR lands these lines verbatim as the first bullets under `## [Unreleased]` and
changes nothing else.

```markdown
- Added: confined head sessions record friction (`fgos friction record`) through their request socket, the supervisor head patches project config (`fgos config patch`), a lead head raises a coordination event (`fgos supervisor raise`), and the secretary and supervisor heads may replace `plans/backlog.md` with `fgos session write`. A live head's grant stays the one set when it started; a grant change reaches it at its next rotation or restart.
- Changed: a head's request routes run the active release on every request, so a long-lived head picks up a newly activated release without a restart.
- Added: the land door runs the plan contract check on landed plan directories (gate placeholder `{plans}`) and removes a landed branch's clean worktree after a branch land.
- Fixed: a head rotation whose executor died is resolved on the lineage's normal path, and `fgos doctor` shows one pointer row while one is open; a rotation's handoff now carries the predecessor's last message and its task's portfolio files, and `rotation.log` records the true outcome.
- Changed: the secretary head keeps a Claude provider pin like the other coordinating heads, and arms a 15-minute check for new owner questions and mail on every start.
- Fixed: a pool account login near expiry is renewed even while a live head seat shares it.
```
