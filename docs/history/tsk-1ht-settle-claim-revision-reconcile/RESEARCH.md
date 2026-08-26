# Research — tsk-1ht: settleClaim revision-CAS has no reconcile path

## Round 1 — 2026-08-26 (discovery stage)

**Asked:** Verify the bug report's root-cause claims (settleClaim's
unconditional CAS refuse, getItemDurableRevision hashing the whole item
JSON) and find whether the codebase already has a mechanism to distinguish
"same claim-holder's own legitimate mid-lifecycle write" from "a genuinely
different actor's conflicting write", since that distinction is what an
"explicit reconcile" branch would need.

**Checked (repo, direct read — all in this checkout):**

1. `src/state/store.mjs:1001-1124` (`settleClaim`) — full body read.
   - Line 1062-1066 and 1086-1088: settleClaim already DOES check writer
     identity, but only for *who is calling settle* (`currentWriterId` vs
     `claim.writerId`) — not for who caused the revision drift.
   - Line 1101-1105: the revision check is exactly as reported —
     unconditional `throw new StoreError('conflict', ...)` on any
     `curRev !== freshClaim.preClaimRevision`, zero reconcile branch, no
     use of writer identity at all here. **Confirmed as reported.**

2. `src/state/runtime-coordination.mjs:49-53` (`getItemDurableRevision`) —
   confirmed: `crypto.createHash('sha256').update(JSON.stringify(item))...`
   — hashes the item's entire JSON. **Confirmed as reported.**

3. Searched `writerId` usage repo-wide
   (`rg -n "writerId" src/state/store.mjs`) — no per-mutating-function
   check exists anywhere else that gates writes by claim ownership. Any
   caller (any writerId) can call `editWork`/`moveWork` etc. on a claimed
   item; only `settleClaim` itself checks writer identity, and only
   against its OWN caller, not against whoever produced the intervening
   edits.

4. **Key finding — the reconcile primitive already exists, just unused
   here.** Every mutating event door in `store.mjs` unconditionally stamps
   `payload.writer = resolveWriterIdentity(dir)` before appending (seen at
   lines ~468 `work.edit`, ~502 `work.resolve-park-reason`, ~712, ~1401,
   ~1496, ~1533 — same pattern each time). `src/state/events.mjs:451` does
   the analogous stamp (`src`) at the raw-event layer. So every event in
   `events.jsonl` already carries who wrote it. `getItemDurableRevision`
   only hashes the CURRENT snapshot and throws away this provenance — a
   reconcile branch could instead replay/scan the events for `id` since
   the claim's `acquiredAt`/`preClaimRevision` snapshot and check whether
   every one of them was written by `claim.writerId` (the same session
   that's now settling). If yes, the drift is self-caused and
   reconcilable; if any event in that window has a different writer, it's
   a genuine conflict and settleClaim should keep refusing exactly as
   today.

5. `test/state/runtime-coordination.test.mjs`:
   - Line 444-460: "CAS/revision conflict leaves the claim untouched" —
     constructs the conflict by acquiring a claim with a
     `preClaimRevision` that will never match (`'a-revision-that-will-
     never-match'`), no writer-identity distinction involved at all.
   - Line 503-523: "a durable content change with the SAME status is not
     flagged stale... but settleClaim still catches it via
     preClaimRevision" — this is the test whose comment claims to
     simulate "a real edit by a different actor, not this claim's own
     doing" (line 510), but the test body calls `editWork(dir, {...})`
     directly in the same process with NO distinct writer identity setup
     at all (no writerId override, no separate session). **The existing
     test suite has no test that actually constructs two DIFFERENT
     writerIds racing on the same claimed item** — the "different actor"
     framing in that comment is aspirational, not mechanically enforced
     by the test. This means today's tests would not distinguish a
     same-writer-reconcile fix from a regression, as long as the fix
     still refuses when `editWork` is called with a genuinely different
     `resolveWriterIdentity(dir).id` than the claim's `writerId`.

6. `docs/architect/doing-coordination-redesign.md`:
   - §16.3 (line 807-812) literal text: "Settlement after durable revision
     drift fails or goes through explicit reconcile." — quote in the item
     matches verbatim.
   - §9.2 (line 472-489), the "Successful Return For Approval" spec,
     already lists as an input precondition: "durable item still matches
     preClaimRevision **or accepted reconcile rule**" (line 477) — the doc
     anticipated needing a reconcile rule back when this section was
     written, but never specified what that rule is. No existing
     precedent/pattern for a reconcile step exists anywhere else in the
     codebase today (grep found none).

**Verdict: clear.**

Root cause is fully confirmed with line citations, no ambiguity is left
about whether the bug is real. The one open design question (what exactly
"legitimate self-drift" means) is answerable directly from evidence already
gathered here, not a product decision needing a person: reconcile when
every `events.jsonl` entry for `id` since the claim's own
`preClaimRevision` snapshot was written by `claim.writerId`; keep refusing
otherwise. This is planning's job to shape into an actual diff — nothing
further here is unclear enough to need `exploring`.

**Verify (handed to discover's `--verify`):** Reproduce tsk-1sl's own
sequence end to end (`fgos pick` → `fgos edit`/`fgos discover`/`fgos gate-
approve`/`fgos plan`, all as the SAME writer → `fgos return`) and confirm
`return` now succeeds; then run `test/state/runtime-coordination.test.mjs`
to confirm the existing CAS-conflict-must-refuse tests still pass
unchanged, plus a NEW test that constructs two distinct `writerId`s writing
to the same claimed item (a case the current suite does not cover) and
confirms settleClaim still refuses in that case.
