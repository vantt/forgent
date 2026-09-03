---
type: explanation
title: Why the pre-commit hook got its own shorter main-checkout-lock TTL
tags: []
source_capture_ids: [tsk-1d9]
framework: diataxis
mode: explanation
---
# Why the pre-commit hook got its own shorter main-checkout-lock TTL

`.githooks/pre-commit` acquires `.fgos/main-checkout.lock` on every commit
and — by design — never releases it (see
`docs/explanation/main-checkout-lock-release-on-exit-opt-in.md`: the hook
must keep the lock alive between a session's own sequential commits, or a
concurrent session's `pick`/`take` could slip into the gap and recreate
the STR65 index-clobbering race). Until `tsk-1d9`, that lock's TTL was the
same 180-second `DEFAULT_TTL_MS` every other caller (`claimWork`,
`mergeRunnerItem`) also used.

## The real cost of one shared TTL

A project-instability scan measured the last 60 commits' own cadence:
median gap 95s, 68% under the 180s TTL — meaning during active work the
main checkout sat locked roughly two-thirds of the time, blocking any
other session's `fgos take`/`pick`/`approve` for up to 180s each time:

> "Đo cadence 60 commit gần nhất: median gap 95s, 68% gap < 180s TTL ->
> lúc làm việc tích cực main checkout bị khóa ~2/3 thời gian dưới identity
> của một session."
> — real item description, `tsk-1d9`

Reproduced live: a commit at 09:37 blocked a `fgos pick` at 09:38 for a
full 2 minutes, with `lock-status` showing the holder as a plain string
identity (unable to be liveness-probed) with 36s left on its TTL — the
same `pick` completed in 1.1s once the TTL actually expired.

## Why the fix wasn't "release the lock sooner"

The item's own initial framing — "the hook never releases, so just make
it release" — was checked against the lock module's own design comment
and rejected outright: `.githooks/pre-commit` must never release on exit,
by name, per the design `main-checkout-lock-release-on-exit-opt-in.md`
already documents. Reversing that would be reversing a verified decision
without new evidence contradicting the decision itself — the new scan
data changes the *tradeoff*, not the "never release on exit" conclusion.

## Why one shared TTL was actually serving two different needs

The same scan separately measured a legitimate `mergeRunnerItem` verify
run taking 184.9s — already exceeding the very same 180s
`DEFAULT_TTL_MS` the hook was using. One constant was serving two callers
with genuinely different real-duration needs: the hook only needs to
protect one commit-to-commit gap (should be short), while
`merge.mjs`/`claim-port.mjs` need minutes for a real verify run to
complete. Lowering the shared TTL globally to fix the hook's cost would
have made the merge path's own already-observed 184.9s case worse, not
better.

## The resolution: split the TTL, not the release behavior

Presented three options to a person — split the TTL, lower it globally
and accept the merge-path regression risk, or stop for deeper
investigation — and split was chosen: a new hook-specific `HOOK_TTL_MS`
(20 seconds) for `.githooks/pre-commit`'s own fallback, while
`claim-port.mjs` and `merge.mjs` keep passing `DEFAULT_TTL_MS` (180s)
exactly as before, untouched. Every caller of `acquireMainCheckoutLock`
was traced (4 sites) to confirm only the hook's own TTL fallback needed
to change; the existing `FGOS_MAIN_CHECKOUT_LOCK_TTL_MS` env var already
fully overrides either constant at runtime, so no new escape hatch was
needed.

20 seconds was a judgment call, not a value empirically derived from the
cadence data — the median-gap-95s figure spans all 60 commits regardless
of identity, conflating same-session sequences with cross-session
handoffs, and no cleaner same-session-only figure was available. It's
long enough to cover a typical stage-commit-stage-commit sequence within
one turn, and roughly 9x shorter than 180s. Named tradeoff: a same-session
pause longer than 20s between commits now narrows the self-recognition
protection window to 20s instead of 180s — thinner, not eliminated, and
tunable further via the existing env var if 20s proves wrong in practice.

## A tension with a prior safety comment, resolved by asking rather than guessing

`DEFAULT_TTL_MS`'s own code comment cites measured real inter-commit gaps
of ~2–3.5 minutes as the reason the shared TTL couldn't safely go much
below 3 minutes — on its face, in tension with the new 20s hook-specific
value. The report that comment cited no longer exists anywhere in git
history (`git log --all --diff-filter=A` found nothing). Rather than
guess past a dated, committed safety comment, this was raised directly
with a person, who confirmed the old 2–3.5min figure was never measuring
the same thing the new 20s figure covers (same-session sequential-commit
gaps) — the 20s value stood.

## Related

- `docs/explanation/main-checkout-lock-release-on-exit-opt-in.md` — the
  prior, unreversed decision this item's own D0 verified rather than
  guessed past: why the hook must never release on exit.
- `docs/history/tsk-1d9-pre-commit-hook-ttl-split/CONTEXT.md` — full
  decision record (D0–D5).
- `plans/reports/project-instability-scan-260809-1608-ship-faster-stability-report.md`
  — the scan (finding 1 and finding 5) that surfaced both the blocking
  cost and the merge-path TTL tension.
