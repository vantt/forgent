# events-jsonl-merge-abort-truncation-gap — CONTEXT

## Feature boundary

tsk-1ji closes the real-world efficacy gap in `.fgos/events.jsonl`'s
truncation protection: the shared, git-tracked, append-only event log has
repeatedly lost already-appended events under concurrent multi-session
load on this repo's shared main checkout (tsk-6al, tsk-4oq, tsk-5dnt,
tsk-1el — evidence gathered by tsk-24e), and the existing detection-only
guard (`src/state/events-jsonl-truncation-guard.mjs`, tsk-cgg) only runs
when a human explicitly invokes `fgos doctor`, leaving hours-long
detection gaps. This item's own first planning pass hypothesized a
specific fgOS-internal mechanism (`git merge --abort` on the main
checkout) and, per `fgos-coding-validating`'s Round 5 empirical
reproduction, that specific hypothesis is falsified — none of three
realistic git fixtures reproduced a silent discard. This CONTEXT.md
re-scopes the fix around **tsk-24e's own D1/D2 decisions** (already
human-approved in a parallel session), which tsk-24e's own D3 explicitly
hands to this item to carry forward. Out of scope: re-investigating or
re-deciding tsk-24e's own already-closed D1/D2 (cited, not reopened);
tsk-24e's own remaining scope (evidence-gathering only, tsk-24e itself
implements nothing).

## Locked decisions

| D-ID | Quyết định |
|---|---|
| — | planning->exploring hand-back: the planned fix's core mechanism (git merge --abort silently discarding a concurrent .fgos/events.jsonl append) is empirically falsified -- the real root cause behind tsk-4oq's data loss is unconfirmed and needs a person to choose which direction to chase next |
| — | Context handed off from tsk-24e's own exploring/planning pass (2026-08-20), for whoever builds this item's fix: (1) D1 (tsk-24e CONTEXT.md) locked detect-and-warn as the preferred guard shape over blocking -- no clean git-native pre-reset/pre-checkout-force hook exists without real plumbing risk (closest primitive: the reference-transaction hook, real but nontrivial), and a false-positive block risks refusing a person's own legitimate recovery operation, worse than the data loss it prevents; matches the events-jsonl-contiguous doctor-check precedent (detect + fgos doctor --fix, never blocks). (2) D2 locked time-based periodic as the preferred cadence shape over per-verb-call (real git-commit overhead + log noise) or checkpoint-only (reproduces the exact multi-hour exposure gap already observed) -- directly bounds wall-clock exposure, matching this item's own observed failure shape and yours (the 2.5h blind window before doctor caught it). (3) Structural fact confirmed by grep: main-checkout-lock is NOT currently consulted anywhere in src/state/ -- only claimWork (pick/take) and merge.mjs call acquireMainCheckoutLock. Your own direction (a) 'wired into pick/return/approve's own main-checkout-lock acquisition' would be a genuinely NEW integration point for return/discover/edit, not reuse of an existing call site. (4) Nuance: an ordinary git checkout already refuses by itself when it would discard uncommitted tracked changes -- only FORCE variants (reset --hard, checkout -f) plus stash (your own confirmed fingerprint) bypass that native protection; narrows the real guard surface. (5) tsk-24e's own tsk-1el decision (a stale main-checkout-lock correlating with a fgos return data-loss instance) was investigated and is most likely coincidental, not causal -- return never touches main-checkout-lock at all, so don't spend time chasing that correlation as a lead. Full detail: docs/history/tsk-24e/CONTEXT.md and RESEARCH.md (both Round 1 and Round 2). |
| D1 | tsk-1ji's fix scope is tsk-24e's own D1+D2 -- both a non-blocking detect-and-warn guard for raw git force-ops (reset --hard/checkout -f/clean -fd) touching .fgos/events.jsonl on the main checkout, and a time-based periodic auto-commit cadence for .fgos/events.jsonl. The earlier planning-stage Approach (an abortMergeIfPossible snapshot/restore fix) is dropped -- fgos-coding-validating's own Round 5 empirical reproduction found it does not match the real mechanism. |

## Pinned terms

- **Live shared store**: `.fgos/events.jsonl` at the main checkout
  root — the one file this item's fix protects.
- **Detect-and-warn** (not block): the guard reports/warns on a raw
  force-checkout/reset/clean touching `.fgos/events.jsonl`, but never
  refuses the underlying git operation itself — per tsk-24e's own D1,
  matching the existing `events-jsonl-truncation-guard` doctor-check
  precedent (detect + `fgos doctor --fix`, never a hard refusal).
- **Time-based periodic auto-commit**: a fixed wall-clock interval,
  independent of how many `fgos` verb calls happened — per tsk-24e's own
  D2, chosen specifically to bound the exposure window (how long
  `.fgos/events.jsonl` sits uncommitted) rather than the call count.

## Scout evidence cited

- `fgos show tsk-24e --json` (read live, 2026-08-20T13:10Z) — tsk-24e's
  own decision log:
  - **D1** (2026-08-20T12:20:28Z): "guard behavior for a raw
    force-checkout/reset threatening uncommitted `.fgos/events.jsonl` is
    detect-and-warn, never block — matches this repo's existing
    `events-jsonl-contiguous` doctor-check precedent... Blocking
    rejected: no clean git-native pre-reset/pre-checkout-force hook
    exists without real plumbing risk, and a false-positive block would
    refuse a person's own legitimate recovery operation, a worse failure
    mode than the data loss it prevents."
  - **D2** (2026-08-20T12:20:35Z): "auto-commit cadence for
    `.fgos/events.jsonl` on the shared main checkout is time-based
    periodic (a fixed wall-clock interval, independent of how many `fgos`
    verb calls happened), not per-verb-call and not checkpoint-only.
    Per-verb-call rejected: real git-commit overhead on every single
    mutating call across potentially many concurrent sessions, plus git
    log/blame noise. Checkpoint-only... rejected: reproduces the exact
    gap already observed today."
  - The Gate's own recorded human answer (2026-08-20T12:12:09Z,
    `settlement.recent[0]`): "(c) both: (1) a code-level guard
    blocking/warning on a raw `git reset --hard`/`checkout -f`/`clean
    -fd` touching `.fgos/events.jsonl` on the main checkout... AND (2) an
    auto-commit cadence... tsk-1el stale-lock correlation: adequately
    explained as coincidental, no separate follow-up."
  - **D3** (2026-08-20T12:27:15Z, `rationale`: "User approved (live
    conversation)"): "tsk-24e's own remaining scope narrows to
    evidence-gathering/diagnosis (already complete)... tsk-1ji
    (currently claimed/planning by a different concurrent session,
    deps: [tsk-24e, tsk-cgg])... is already carrying forward a fix shape
    matching D1/D2... D1/D2 stay valid as guidance for whoever implements
    the fix; tsk-24e itself will not duplicate tsk-1ji's plan."
- `docs/history/events-jsonl-merge-abort-truncation-gap/RESEARCH.md`
  Round 5 (this item's own `fgos-coding-validating` pass) — three
  throwaway git fixtures reproducing the originally-planned
  `abortMergeIfPossible` mechanism; none show a silent discard. This is
  the evidence that triggered the planning->exploring hand-back this
  CONTEXT.md resolves.
- `src/state/events-jsonl-truncation-guard.mjs` (tsk-cgg, done) — the
  existing detect-only check D1 explicitly cites as the precedent shape
  to extend/wire into a more real-time trigger, not replace.
- RESEARCH.md Rounds 1-4 (this item's own discovery-stage and recovered
  research) — the fgOS-internal git-operation call-site audit (six real
  call sites, none of them an uncontrolled main-checkout risk outside the
  now-falsified merge-abort path) remains valid background context for D2
  below, even though the merge-abort-specific fix itself is superseded.

## Outstanding questions

None
