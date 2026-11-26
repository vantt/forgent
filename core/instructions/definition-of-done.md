---
id: definition-of-done
kind: law
owner: core
scope: repo
mode: append
specificity: 10
title: Definition of Done (platform-foundations L5)
description: The six questions a stranger agent with no chat history must be able to answer for any change (L5)
lifecycle: live
valid_from: 2026-11-26
related:
  - "[[design-principles]]"
---

# Definition of Done (platform-foundations L5)

A stranger agent with no chat history should be able to answer, for any change:

1. **What to read first?** `docs/reading-map.md`, then the relevant area spec.
2. **What kind of work is this?** Check it against the area's spec and
   `plans/backlog.md`; a new product area gets a spec before it gets code.
3. **What contract does it touch?** `docs/platform/runner/contracts/routing-handoff.md` for
   agent-to-agent boundaries; the area spec's Shared Entities table for
   in-process contracts.
4. **How much risk?** Does it change a locked law in `docs/platform/platform-foundations.md`,
   or existing covered behavior in the test suite? Either raises the bar.
5. **What proof means done?** `npm test` (state + cli + runner + e2e suite) and
   `cargo test --workspace` green. One owning proof per behaviour: rule
   design-principles, principle 8. Before adding a
   test, find the behaviour's owning proof and extend it; deleting or replacing a
   mechanism retires its tests in the same change. Green must come from real
   behavior: never add an env switch, flag, or test-only code branch that skips
   checks to make tests pass; fix production code or the fixture instead.
6. **What learning gets left behind?** A settled decision narrative goes into
   the area's `spec.md` decision-history section, or `decisions/` where present; a settled fact goes into the exact area or
   subcomponent `spec.md`. Resolve both through
   `docs/platform/governance.md#decision-scope-to-holder-table`.
