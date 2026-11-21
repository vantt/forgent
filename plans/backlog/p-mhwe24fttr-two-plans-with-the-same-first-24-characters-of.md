---
id: p-mhwe24fttr
title: "Two plans with the same first 24 characters of their directory name cannot both start a lead (session-host, priority medium; source: owner via Miu, 2026-11-20; supervisor question q-w33h3vozt7)"
status: done
priority: P2
area: session-host
created: 2026-11-20
---

# Why

A head name is `forgent-` plus the plan directory cut to 24 characters so it fits 32. Plans `261119-1730-supervision-powers-cores` and `-doors` cut to the same name, and starting the lead for cores failed `grant-invalid (plan-ambiguous)`; the supervisor had to ask the owner, who chose to rename one directory. Any two plans of one topic made in the same minute will collide again. Finding (supervisor, 2026-11-21): the owner sees the herdr **tab** label, built by `Display::tab_label` in `packages/terminal-control/rust/src/port.rs` as the first 8 characters of the head name (`SHORT_ID_CHARS`) then ` · ` then the persona title; plan lead names are `<project handle>-<plan dir>`, so every plan lead's tab reads `forgent- · lead`. `herdr pane rename` changes only the pane label, which the owner does not see; `herdr tab rename` does change what the owner sees but is a hand fix that a restart or new head loses.

# Done when

A head's tab label reads `<role>: <subject>`, for example `lead: cores`, `lead: work-data`, `shaper: skeleton` (owner 2026-11-21: panes are hard to tell apart, the role comes first, and the separator after the role is `: `; inside the subject the owner accepts `.` or `-`). This amends the separator of `docs/platform/terminal-control/spec.md` section 5 rule 5 (today ` · `) for every tab, a spec change the owner has decided, made in the core and not in head-start; the role is shown whole, so the 8-character cut must not turn `secretary` into `secretar`. It is built only through the existing structured display fields of the terminal-control spec section 5 rule 5 (`id`, `title`, `role`, `agent`, `model`, `session`; no caller formats label text, one core cuts and joins), so the fix is to feed the head start's display fields the head's role and its plan or discussion title from the existing session record, not to invent a new naming scheme or a new name field. Prior art: `docs/platform/terminal-control/spec.md` section 5 rule 5 and the label commit d49a80206 (2026-10-23) that built labels in one place; today a head start passes the head name as `id` and the persona as `title`, which is why the cut name shows. The head name stays unique by construction (for example it keeps the distinguishing tail or carries a short id, not only the leading characters), two plans that share their first 24 characters both start a lead, and no rename is needed; an owning test starts leads for two such plans.

# Notes

Migrated from the legacy backlog table. Original status: done (plan 261121-0707-head-tab-labels, commit f6f88e8d6).
