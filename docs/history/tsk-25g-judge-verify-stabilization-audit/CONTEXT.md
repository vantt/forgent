# CONTEXT: tsk-25g — audit tsk-5cf's judgeVerifySemanticCorrectness fix + one more stabilization attempt

## Feature boundary

`tsk-5cf` (docs/history/tsk-5cf-judge-verify-second-pass-instability/CONTEXT.md)
locked a two-part fix for `judgeVerifySemanticCorrectness`'s contradictory
round-to-round verdicts: D1a (stabilize the judge with prior-round context)
and D1b (a `--force` escape hatch). While working `tsk-5mc`, the same
contradictory-verdict failure mode reproduced live a second time (7 dispute
rounds, docs/history/tsk-5mc-verify-vacuous-pass-multiglob/CONTEXT.md),
despite `--force` shipping and working operationally. This item audits
whether D1a actually shipped, and — since scout found it did — makes one
further bounded attempt at strengthening it before permanently accepting
`--force` as the answer. Scope also folds in a related gap found during
the audit: `resolveDecompose`'s per-child verify check has neither
mechanism at all. No other judge (`judgeDiscovery`'s first pass,
`judgeDecompose`'s splitting logic) is in scope — only the second,
independent `judgeVerifySemanticCorrectness` pass and its two call sites.

## Locked decisions

| ID | Decision |
|----|----------|
| D1 | One more stabilization attempt only, then stop either way: extend `judgeVerifySemanticCorrectness`'s `priorRejection` context in `resolveDiscovery` (`src/intake/discovery.mjs:643-660`) from threading only the single most-recent rejection reason (`view.gates[id].ask`, a last-value-only slot) to threading the FULL accumulated rejection history for the item's current verify-dispute streak. Empirically re-test on a live dispute. If the judge still contradicts an earlier round's own stated criteria after this change, close the stabilization angle permanently — document that `--force` is the accepted answer and do not attempt a third mechanism. |
| D2 | Fold the decompose-path gap into this item's scope: extend `resolveDecompose`'s per-child `judgeVerifySemanticCorrectness` call (`src/intake/plan.mjs:703`) to also thread `priorRejection` context and accept a `--force` override, matching what `resolveDiscovery` already has. Same root function, same already-designed fix shape — mechanical extension, not new design work. |

## Pinned terms

- **"D1a" / "the stabilize half"** — the mechanism that threads a prior
  round's own rejection reason into the next round's judge prompt so the
  judge is instructed not to contradict itself (`buildVerifyCheckPrompt`'s
  `priorRejection` parameter, `src/intake/judge-executor.mjs:305-329`).
  Confirmed shipped in `resolveDiscovery` only, not `resolveDecompose`.
- **"D1b" / "the override"** — the `--force` CLI flag on `fgos discover`
  (`src/cli/command-registry.mjs:142`) that lets a caller proceed past a
  disputed second-pass verdict, always logged, refused when the
  disagreement is `mechanical: true` (a syntactic fact, not a judgement
  call) or when the item is already parked `awaiting-human`. Confirmed
  shipped in `resolveDiscovery` only, not `resolveDecompose`.
- **"full accumulated rejection history" (D1)** — every rejection reason
  recorded across the item's current unbroken dispute streak for this
  verify field, not just the immediately-prior round. Exact storage/plumbing
  shape (new field vs. reusing an existing log) is left to `fgos-coding-planning`.
- **"one more attempt" (D1)** — exactly one round of empirical re-test with
  the strengthened mechanism; a further contradiction after this ends the
  stabilization angle, mirroring the "try at most one more round" limit
  `tsk-5mc`'s own CONTEXT.md already applied to itself.

## Scout evidence

- `src/intake/discovery.mjs:643-660` — `resolveDiscovery`'s verify-dispute
  handling: threads `view?.gates?.[id]?.ask` (the immediately-prior round's
  rejection reason, a single most-recent-value slot per `replay.mjs`'s
  ask/answer fold) into `judgeVerifySemanticCorrectness` as `priorRejection`.
  Confirms D1a genuinely shipped here — not merely designed and abandoned.
- `src/intake/discovery.mjs:669-680` — `--force` override wiring: proceeds
  past a disputed verdict only when `callerVerdict?.force === true AND
  secondPass.mechanical !== true`; refuses if the item is already
  `awaiting-human` (a prior park), pointing at the real resume path
  (`fgos answer`) instead. Confirms D1b genuinely shipped here too.
- `src/intake/judge-executor.mjs:305-329` (`buildVerifyCheckPrompt`) —
  when `priorRejection` is non-empty, injects a `priorSection` explicitly
  instructing the judge: don't contradict your own prior round's stated
  reason unless a genuinely new, different reason applies. Confirms the
  prompt-level mechanism D1a's decision described is real, not a no-op.
- `src/intake/judge-executor.mjs:340-397` (`judgeVerifySemanticCorrectness`)
  — fail-safe stance unchanged: any spawn/parse failure or non-boolean
  `agrees` folds to `{agrees: false}`, matches `discovery.mjs`'s own D4.
  `matchesKnownBadVerifyPattern` mechanical pre-check (tsk-12t) runs before
  the LLM spawn and is explicitly `--force`-immune (D6, checked in the
  `resolveDiscovery` override branch).
- `src/intake/plan.mjs:699-714` (`resolveDecompose`'s per-child check)
  — calls `judgeVerifySemanticCorrectness({title, tier}, child.verify, cfg)`
  with only 3 args: no `priorRejection` threaded, and the surrounding
  `if (disputedChild)` branch has no `--force`/`callerVerdict.force` check
  at all — parks straight to `need-human` unconditionally. Confirms D2's
  gap is real: a decompose-time disputed child has no escape today.
- `docs/history/tsk-5mc-verify-vacuous-pass-multiglob/CONTEXT.md` — the
  live reproduction this item audits: round 4 demanded real execution over
  structural checks; round 5 demanded structural checks back over the
  execution proof round 4 asked for; round 6 combined both per round 5's
  own request; round 7 disputed a narrower sed-fragility point. This
  happened at `clarify` stage (`resolveDiscovery`, where D1a *is* active),
  confirming the contradiction reproduced despite the context-injection
  mechanism running for real, not because it was absent.
- `docs/history/tsk-5cf-judge-verify-second-pass-instability/CONTEXT.md` —
  original design doc for D1a/D1b; first live reproduction on `tsk-4xg`
  (10 rounds). Confirms this is a second independent reproduction of the
  same failure shape, not a one-off.
- GitNexus `impact({target: "judgeVerifySemanticCorrectness", direction:
  "upstream"})`, repo `/home/vantt/projects/forgentX`: risk `HIGH`, 3
  affected symbols, upstream callers `resolveDiscovery` (`discovery.mjs`,
  direct), `resolveDecompose` (`decompose.mjs`, direct), `runWatch`
  (`src/runner/loop.mjs`, indirect via the autonomous watch loop). Matches
  the two call sites found by direct grep — no third caller missed.
  `fgos tool query --capability impact-analysis --status present`: GitNexus
  registered, `status: "present"` — impact-analysis: full, freshly checked
  this session.

## Canonical references

- `docs/history/tsk-5cf-judge-verify-second-pass-instability/CONTEXT.md`
- `docs/history/tsk-5mc-verify-vacuous-pass-multiglob/CONTEXT.md`
- `docs/explanation/judge-verdict-second-pass-semantic-check.md`
- `docs/decisions/0025` (product priority order — grounds D1's "one bounded
  attempt, not open-ended investment" framing)

## Outstanding questions deferred to planning

- Exact plumbing for "full accumulated rejection history" (D1) — new
  stored field vs. deriving it from existing decision/ask log entries — is
  an implementation choice for `fgos-coding-planning`.
- Exact empirical re-test procedure for D1's "one more attempt" (which
  live or synthetic dispute scenario proves the strengthened mechanism
  either holds or still contradicts) is left to planning/execution to
  design, following the same RED/GREEN empirical discipline
  `tsk-5mc`'s own CONTEXT.md already used for its verify text.
- Exact `--force`/`priorRejection` wiring shape for `resolveDecompose`
  (D2) — e.g. whether the CLI-level `--force` flag needs a new surface on
  `fgos plan` or reuses `fgos discover`'s existing flag plumbing — is
  an implementation choice for `fgos-coding-planning`.
