---
id: convention-paths
kind: procedure
owner: core
scope: repo
mode: append
specificity: 10
title: Convention Paths
description: Report, plan and journal names and paths come from fgos convention name|path --json, never built by hand
lifecycle: live
valid_from: 2026-11-26
related:
  - "[[before-touching-code]]"
---

# Convention Paths

**Convention paths.** For report, plan, and journal names and locations—including paths placed in briefs for other agents—use `fgos convention name|path --json`, never construct them; parallel agents MUST choose distinct slugs, and pre-commit `convention check` warnings do not block commits.
