---
id: p-6hqvgokerb
title: "A finished planner or lead stays open because the stop rule waits for a status the plan never reaches (supervisor, priority medium; source: owner, 2026-11-21 22:50, \"những gì xong sao không đóng vậy?\")"
status: done
priority: P2
area: supervisor
created: 2026-11-21
---

# Why

`core/skills/fgos-supervisor/SKILL.md` stops a planner "once its plan is `ready`", but planners now land their plan as `draft` for the owner's approval, so the stop never fires: `head:planner-component-authority` stayed idle after both of its draft plans landed (261121-2109, 261121-2110) until lead:SUPERVISOR stopped it at 22:50. Leads started by hand (for example lead:WINCI, plan 261121-1456 done at 27f530a3f) hold a short role, not a `head:` role, so `session stop` refuses them and nothing closes their tab.

# Done when

A planner is stopped as soon as its plan lands, whether as `draft` or `ready`, and every lead whose plan is `done` is closed by the same door whatever role name it holds; a fixture shows both closed within one wake.

# Notes

Migrated from the legacy backlog table. Original status: proposed.

# Closing note

Done by plan `261124-2143-head-lifecycle-events`. Owning proof: the close fixture `one_wake_stops_the_idle_heads_of_landed_and_done_work_and_leaves_a_busy_one_and_a_lead_of_another_plan` (`packages/supervision/rust/tests/wake.rs`); the short-role stop is proven by `a short-role lead whose Identity record names a head lineage ends through that head supervisor and gets the stamp` (`test/session-host/head-stop.test.mjs`), with the real adapter wiring in `a_wake_stops_an_idle_finished_lead_through_the_real_adapter_and_session_stop_names_its_role` (`apps/fgos/tests/supervision_verbs.rs`).
