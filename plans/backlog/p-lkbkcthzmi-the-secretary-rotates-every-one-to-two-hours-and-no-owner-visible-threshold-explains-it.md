---
id: p-lkbkcthzmi
title: "The secretary session rotates every one to two hours and no owner-visible threshold explains it (session rotation, priority medium; source: owner via Miu, 2026-11-23)"
status: proposed
priority: P2
area: session rotation
created: 2026-11-23
---

# Why

`.fgos/runtime/session-rotation/secretary-miu/` shows eight soft rotations on 2026-11-23 (06:26, 08:16, 12:47, 14:30, 14:55, 15:49, 16:52, 19:19), two of them 25 minutes apart, and the rotation log reaches generation 42. Each rotation starts a session that reloads the whole rule set and skill list and rereads the portfolio, with a cold cache. The owner asked whether this costs tokens and thinks it rotates too often. No config key for the threshold was found in `.fgos/config.yaml`, and the log does not record the context level at each rotation, so neither the trigger nor the real cost can be read from the files.

# Done when

The rotation log records the reason and the context level of each rotation. The threshold that triggers a soft rotation is named in the session-host spec and set in `core/config-standard`. The token cost of one rotation is measured once and written down. The owner decides whether the threshold changes.

# Notes

Do not change the threshold before the measurement exists. Related: `p-bakpfrvigb`, `p-vbv57yc4d5`.
