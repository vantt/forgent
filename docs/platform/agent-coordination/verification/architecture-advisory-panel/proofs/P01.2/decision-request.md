Phase 4 — Ask Reluctantly But Clearly | Cell P01.2 | Coordinator

## Verdict: no Decision Request sent yet — reasoning below

Per SCOUT BEFORE ASK, evaluated every candidate gap surfaced by
interpretation.md and scout-report.md for (a) genuine user-exclusivity and
(b) materiality (would the recommendation actually differ by answer).

| Candidate gap | User-exclusive? | Material now? | Disposition |
|---|---|---|---|
| Whether "local ownership" means a cache, replica, or independent authority | Partially — scoutable in part (existing local state = none found), but final scope is the person's own intent | Yes, in principle | **Not asked yet** — each Phase 5 shaper states its own explicit working definition instead (doctrine already requires this); if shapers converge on materially different scopes, the disagreement itself becomes the question, sharper than asking blind now |
| Whether the pressure is latency, offline, install/distribution, or iteration velocity | No — scout-answerable | Scout already answered in part (found launcher-coordination drift as the concrete strain, not a duplication/latency problem) | **Resolved by scouting**, not asked |
| Whether "native" implies reimplementation or relocation (interpretation's own "most likely to change the answer" item) | No — scout-answerable (library extractability) | Yes | **Resolved by scouting**: scout report shows the shell has zero `Engine`/`SqliteStore`/renderer/indexer of its own — nothing to relocate. Local ownership would mean genuine reimplementation, not relocation. Carried into Phase 5 as a settled fact, not a question. |
| Whether the shell is a product bet or a spike | **Yes — only the person can say** | Affects how much investment is worth recommending, but does not flip the underlying technical recommendation itself (the technical answer to "should the shell own registry/render/search locally" doesn't change based on this; the *investment level* to recommend building it out does) | **Not asked now** — carried as an explicit named dependency into Phase 7/8. The synthesizer states the recommendation conditional on this, and Phase 8's explanation names it plainly as "the part that stays theirs" per doctrine, rather than treated as blocking. |
| Whether the decision is already made (PRD.md already states thin-client) | N/A — already answered by the person directly on 2026-09-06 ("mdview vẫn chưa quyết") after being told this exact question | No | **Answered** — not re-asked. See scout-report.md's Coordinator's note. |

**No question meets both bars (user-exclusive AND material enough to change
what Phase 5 should produce) strongly enough to justify interrupting now.**
The panel proceeds into Phase 5 with three explicit carried-forward
defaults, stated in every shaper's prompt:

1. "Local ownership" scope is each shaper's own to define explicitly and
   state up front — divergence here is itself useful signal, not an error.
2. Local ownership means genuine reimplementation (scout-confirmed: no
   existing library code to relocate).
3. The "product bet vs. spike" question is out of scope for the technical
   recommendation itself; it will be surfaced explicitly to the person in
   Phase 8 as the part of this decision that remains theirs regardless of
   what the panel recommends technically.

This is a recorded decision, not a skipped step — this file exists so a
successor coordinator does not re-ask what was already reasoned through.
