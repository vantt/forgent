---
title: Explanatory prose can outlive the locked decision that superseded it
framework: diataxis
mode: explanation
---

# Explanatory prose can outlive the locked decision that superseded it

## Three real lines caught contradicting a locked D-ID (tsk-15d)

`tsk-5td`'s design discussion (`DISCUSSION.md`) locked several decisions
(D1, D3, D7/D8) that superseded conceptual claims made earlier in
committed explanation and spec docs. Nothing linked the newer decision to
the older prose, so the older prose kept asserting the superseded model
until someone specifically grepped for it:

1. `docs/explanation/why-fgos-dispatch-splits-into-gather-packets-and-a-gated-exec-packet.md`
   described gather/exec as splitting "along two orthogonal axes." D1 had
   already replaced that model with a two-tier tree — a `rootTask` can
   never itself be a `gather`, so the two dimensions aren't independent
   the way "orthogonal" claims.
2. Any doc still labeling `kind` as describing *transport* was wrong per
   D3: `kind` actually names which *category of provider* something is
   (where the provider lives), not the transport it uses. Two
   counter-examples killed the older "transport" reading directly: `mcp`
   and `skill` share one probe branch but use opposite transports
   (JSON-RPC over stdio vs. a markdown file loaded straight into the
   session) — same `kind`, different transport. `cli` and `binary` are
   two different *values* for the same protocol — different `kind`, same
   protocol.
3. `docs/specs/system-overview.md`'s claim that `work` is the *only* T2
   value was already stale by the time D7/D8 landed elsewhere — recorded
   in this item's own description explicitly so a later reader wouldn't
   go try to "fix" it again.

## Why this drift is easy to miss

A locked decision like a D-ID lives in its own discussion document
(`DISCUSSION.md`), while the conceptual claim it supersedes lives in a
separate, already-committed explanation or spec doc written before that
decision existed. There's no structural link between the two — no test,
no cross-reference, nothing that breaks when the newer decision
contradicts the older prose. The older doc keeps reading as confidently
correct as the day it was written, because from its own text there is no
sign anything superseded it.

This is a different flavor of doc drift than an enumerable list drifting
out of sync with a code-side test (see
`docs/explanation/spec-docs-drift-silently-when-only-code-has-an-exact-match-test.md`
for that case) — there, the doc claims a *set* that a real test checks in
code. Here, the doc asserts a *conceptual model* (an architecture shape,
a field's meaning) that only a person re-reading both the newer decision
and the older prose side by side would ever catch.

## What this item did — and didn't — fix

`tsk-15d` corrected exactly the three lines named above, each cited
against its specific superseding D-ID, and left a note in
`system-overview.md` itself so a future reader wouldn't rediscover the
same already-settled question. It did not add any mechanism to catch the
next instance of this same drift — like the sibling doc's own note about
its "exact-match test" gap, finding and fixing a specific occurrence of
this pattern is not the same as closing the general risk that it recurs
elsewhere, for a decision not yet grepped for.
