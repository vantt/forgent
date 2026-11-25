---
id: ds-f3x53nlibp
title: "Head lifecycle events: end of work, stop rule and lead slots"
status: settled
source:
  - p-pv7ha3l5ss
  - p-iatzcg2gee
  - p-6hqvgokerb
  - p-tyowvhthul
created: 2026-11-24
---

discussion: settled

The owner chose on 2026-11-24 to bring three open rows into one plan, after plan `261124-0004-heads-operate-without-owner`, which gives every head the rule that its last action raises a handoff. The request is complete as written and is seeded here unchanged so a planner can bind to it.

## Hand-off to the planner

- **Outcome:** the supervisor always learns that a head's work has ended, whether the head reported it or died, and acts on it: it reads the result, closes the finished head, and frees the lane. A lead that only waits outside does not hold a working slot.
- **Constraints:** blockedBy plan `261124-0004-heads-operate-without-owner`. The first phase is a diagnosis: when a lead ends, is an event raised that the watcher drops, or is none raised; the row `p-iatzcg2gee` records the cause as unknown. Extend the existing supervision queue, watcher and stop rule (one door); the host, not the head, emits the end-of-session event, so it works when a head crashes or forgets. The head-side rule (last action raises a handoff with what it did and where the result is, what it waits on, and why it stopped) belongs to plan 0004, not here. Decide from real session state, not from a copy in memory.
- **The three rows keep their own done conditions:** `p-iatzcg2gee` (an ended lead, finished or failed, produces an event with no one raising it by hand; the supervisor reads its result and frees the lane; one owning test drives an ended lead with an empty queue); `p-6hqvgokerb` (a planner is stopped as soon as its plan lands as draft or ready, and every lead whose plan is done is closed by the same door whatever role name it holds; a fixture shows both closed within one wake); `p-tyowvhthul` (admission counts a lead whose plan names an external wait as not holding a working slot, or raises the lane count from measured capacity, whichever the owner picks; the rule is written in the supervisor spec; one owning test drives two leads, one waiting outside, and shows the ready plan admitted).
- **Non-goals:** the head-side handoff rule, the planner raise right and the skill wording (plan 0004 phase 3); confinement (plan `p-fsg6aolefe`); any change to how a plan is approved as ready.
- **Acceptance criteria:** (1) the diagnosis names the cause; (2) the three rows' done conditions each hold with one owning proof; (3) the close of each of the three rows is in the plan's acceptance; (4) a head that dies after its last action still produces an end event.
- **Open points:** for `p-tyowvhthul` the owner has not picked between "count a waiting lead as free" and "raise the lane count from measured capacity"; the planner asks it as one question, not blocking the other two rows. After planning, do not set the plan to `ready`; tell the supervisor.
