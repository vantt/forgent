---
authoritative_for: why fgOS registers a doctor check confirming every stage name across ALL of a domain's registered workflows resolves to a real skillMap entry
---

# Why a doctor check verifies every workflow stage has a `skillMap` owner

`skillMap`/`roleGraph` stay domain-level by design, not per-workflow — a
deliberate choice made when the domain → N workflows hierarchy landed
(`docs/explanation/why-capability-executor-and-capacity-are-three-separate-concepts.md`'s
sibling architecture work covers the general hierarchy shape). That design
means one thing has to stay true as more workflows get registered under
the same domain: every stage name any workflow's `stages` array names has
to resolve to a real `skillMap` entry (an explicit `null` is allowed —
meaning "this position is intentionally mechanical" — but a missing key is
not).

## The gap this closes

An independent architecture review, done while auditing `tsk-2t9c`'s
landed work, flagged the real risk: once a *second* workflow registers
under a domain, nothing was checking that its own stage names actually had
a skill owner. A stage name with no `skillMap` entry at all wouldn't fail
loudly at registration time — it would fail silently, at runtime, the
first time the driving loop actually reached that stage on a real item and
found nothing to resolve.

## Why doctor time, not runtime

Catching this at `fgos doctor` time — by walking `domain.workflows[*]
.stages` for every registered domain and confirming each stage name has a
`domain.skillMap` entry (explicit `null` counted as covered) — turns a
silent runtime gap into a loud, pre-flight one. This is the same shape
every other `registerCheck` entry follows: a small, independently testable
check registered into the open doctor registry, not a special case bolted
onto the driving loop itself.

## Source

`tsk-ogx`. Verify: `node --test test/setup/checks.test.mjs`.
