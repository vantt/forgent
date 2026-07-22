---
type: explanation
title: Why a work item's id is TSK<hash>, not a bare hash
tags: [id-generation, work-item, id-systems]
timestamp: 2026-07-22T00:00:00.000Z
source_capture_ids: []
---

# Why a work item's id is TSK<hash>, not a bare hash

fgOS's work-item id format was locked as a fixed literal prefix followed by a
hash (`TSK<hash>`), not a bare hash on its own — and the way that surfaced is
itself worth keeping, because it shows a specific way a plan can look verified
while quietly shipping the wrong thing.

A plan generating this id reasoned that a bare hash was "still a valid kebab
string, so no schema/contract change" — and that reasoning was true and
useless at the same time. It checked the id against the *pattern* every id
must satisfy, but never went back to re-read the actually decided literal
format recorded earlier (`TSK<hash>`, not a bare hash). Passing the pattern
check made the plan feel proven while it silently regressed the specific
decision it was supposed to implement.

A second, independent problem sat underneath the first: a bare hash also
violates the id pattern's own letter-start requirement roughly 89% of the
time, since a hash is effectively random and the pattern requires the id to
begin with a letter. That's a different failure class from the first — one is
about losing track of a decision, the other is about a probabilistic
assumption nobody checked empirically — but the fix for both is the same
literal prefix.

The rule that generalizes from this: when a plan claims a change is "safe"
against a locked decision, it has to re-cite the specific decision text, not
just the pattern/schema the output must satisfy — schema-validity is
necessary evidence that a locked decision survived, but never sufficient on
its own. And when a generator feeds a hash or otherwise-random value into a
format with a structural constraint (like "must start with a letter"), the
constraint should be anchored with a fixed literal prefix that guarantees it
unconditionally, rather than relying on a conditional or probabilistic guard
to happen to satisfy it most of the time.

---

**Source:** `docs/history/learnings/critical-patterns.md` —
[20260718] "A plan can pass its own schema check while silently regressing the
decision it implements" (feature work-id-tsk-hash).
