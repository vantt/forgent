---
id: p-vbv57yc4d5
title: "Every head Stop-hook rotation request is refused bad-measure at the host, so no head rotates and no stop-trace line is written (session rotation, priority high; source: owner via Miu, 2026-11-22; same family as p-4r4h3jqtth)"
status: done
priority: P1
area: session-rotation
created: 2026-11-22
---

# Why

Miu generation 28 started at 2026-11-21T17:02Z and did not rotate in about 8 hours, even though the secretary's soft threshold is 0.15. Its supervise log (`.fgos/assignments/head-secretary-miu-28/runs/01/supervisor.log`) shows that all 27 `session rotate` requests from its Stop hook were refused with `route bad-measure: fraction must be a number of at least 0, or null` (validated by `checkMeasure`, `src/session-rotation/rotate.mjs:94`). Because the host refuses the request before writing anything, no `stop-trace.jsonl` exists for any lineage under `.fgos`, so nothing recorded the measured fraction or the decision. Lead and planner heads show the same refusal, for example `head-lead-forgent-261121-1314-coding-a3528-*` and `head-planner-heads-stable-and-able-1`.

In the working tree, the Rust hook (`apps/fgos/src/wiring/session_rotation_hook.rs`, `stop`) sends `fraction` as a JSON number or null, which matches the validator. The cause is not proven. Likely suspects are a version mismatch between the hook in the activated release and its request route, or a transport step that drops or stringifies `fraction`.

# Done when

The cause is named with evidence, either from the activated release or from a captured request. A Stop at or above soft from a live head reaches the host and writes a `stop-trace.jsonl` line, and a head over soft rotates. The owning proof covers the hook's real request shape across the request socket. A refused stop leaves a trace line or an incident row instead of failing silently.

# Notes

Found by the supervisor while handling a coordination-help event from Miu. Interim: an owner-requested manual `fgos session rotate secretary --name miu` likely still works, because it sends no measure (not verified live).
