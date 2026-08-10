# RESEARCH: redundant full-log reads on every state verb

## Round 1 (tsk-3jh, stage discovery)

**Checked:** `src/state/replay.mjs:523-526` (`rebuildView`), `src/state/
events.mjs`, `src/state/store.mjs` (`listWork`, `moveWork`, `addOutcome`,
`editWork`, `registerTool`), `src/runner/claim-port.mjs` (`claimWork`,
the item's own cited call chain).

**Found (confirms item's own claim):** every read/write helper in
`store.mjs` independently calls `rebuildView(logPath)` (full `readEvents`
+ `foldEvents`), with no caching even within one synchronous call chain.
`claimWork` calls `listWork` → `readRawEvents` → `moveWork` → `addOutcome`
in sequence, matching the item's own measured "7 lượt đọc log đầy đủ."

**Important correction found while designing the fix (not assumed):**
`moveWork`'s and `registerTool`'s own internal `before = rebuildView(logPath)`
— read INSIDE `withEventsLockAndRefresh`'s locked callback — is NOT a
redundant read. It is the CAS (compare-and-set) mechanism itself: reading
fresh under the lock is what catches a concurrent write from another
process between the caller's earlier read and this write attempt. Removing
it would be a real correctness regression (lost-update risk), not a safe
optimization — this project's own sessions have repeatedly hit real
multi-process lock contention on this exact file (`main-checkout-lock`),
so the risk is not theoretical. `addOutcome` has no such pre-read (it's a
pure additive append, no "from" state to CAS against).

**The one genuinely safe, redundant read:** `claimWork`'s own `listWork(dir)`
(full read+fold) followed later by `readRawEvents(dir)` (full read again,
outside any lock, nothing mutates in between) parse the *same* file twice
for two different projections of the same data.  `readRawEvents(dir)` is
literally `readEvents(logPath)` — the same first step `rebuildView`
itself performs. `foldEvents` (`replay.mjs:30`) is already exported and
pure, so `claimWork` can read raw events once and derive both the raw
array and the folded view from that one read, with zero signature changes
anywhere in `store.mjs`.

**Effect, honestly measured against the item's own numbers:** this
removes 1 of `claimWork`'s 7 full-log reads (7→6) — real but modest, not
a fix for the fixed per-verb tax the item's own broader evidence
describes. The rest (`moveWork`'s CAS-necessary reread, per-verb
`rebuildView` calls across the whole CLI) need a structurally different
fix — captured separately as a proposal:
`plans/260810-2004-fgos-state-daemon-mcp-proposal/plan.md` (single-writer
daemon, discussed live with the user, explicitly out of this item's own
scope).

**Verdict:** `{clear: true, verify: "node --test test/runner/claim-port.test.mjs && npm test"}`
