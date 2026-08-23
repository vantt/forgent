# CONTEXT: coding-classify-intake — alive-or-dead verdict

Item: `tsk-49u`. Written retroactively (D0 below) because `clarify` jumps
straight to `decompose` for every item (finding 6,
`plans/reports/project-instability-scan-260809-1608-ship-faster-stability-report.md`)
— `fgos-coding-exploring`, the only stage that would normally write this file, is
structurally unreachable. This mirrors the same gap `tsk-36i` itself hit.

## Locked decisions

- **D0.** This item's original scope ("main is red") was refuted before
  work started — `tsk-4fk` (merged, `cc1666f`) already fixed the failing
  assertion. Repurposed, with explicit human sign-off (session
  `AskUserQuestion`, "Repurpose tsk-49u to answer aliveness now"), to
  answer the report's own open question instead: is the
  `coding-classify-intake` capacity (`.fgos/config.json`) genuinely alive
  in production, or dead config?

- **D1.** Traced the real dispatch path (`src/runner/dispatch.mjs`):
  `spawnWorker`'s own `capacityIdForWork` only ever resolves the domain's
  `executing`-stage skill name (`fgos-coding-implement` for `coding`) — it
  never reaches a capacity by any other name. The one designed consumer
  of `coding-classify-intake` by name was `.claude/skills/fgos-submit-
  assist/SKILL.md`'s classify step, via the shared
  `_shared/capacity-dispatch-fallback.md` pattern — confirmed by reading
  `docs/history/coding-classify-intake-capacity-rename/plan.md:56-67`
  (the original rename item, `tsk-3fj`), which explicitly deferred fixing
  that consumer's stale name reference to a sibling item, `tsk-4ns`.

- **D2.** `tsk-4ns` (child of `tsk-5wz`) already ran, already decided, and
  is already merged (`fgw/tsk-5wz` → `main` `aaa3038`, landed mid-session
  while this item was in progress): its own description named the same
  four valid dispatch reasons `capacity-dispatch-fallback.md` uses (cheaper
  model / different provider / resource isolation / parallelism), found
  none applied, and stripped `fgos-submit-assist`'s dispatch branch
  entirely — confirmed by reading the live `main` copy of that SKILL.md
  (`.claude/skills/fgos-submit-assist/SKILL.md:50`: "this step used to
  optionally dispatch to a `submit-assist-classify` capacity").

- **D3.** Verdict: **dead, by a deliberate and already-executed decision**,
  not neglect. What was actually still orphaned: the `.fgos/config.json`
  `runner.capacities.coding-classify-intake` entry itself — `tsk-4ns`'s own
  footprint never touched it. Confirmed zero remaining references anywhere
  in `src`/`bin`/`docs`/`.claude/skills` outside that config entry and its
  own pinning test (`test/runner/dispatch.test.mjs:646-656`).

- **D4.** With explicit human sign-off (second `AskUserQuestion`, "Remove
  the orphaned entry now"), removed the entry: a direct main-checkout
  hand-commit (`.fgos/config.json` can never ride a `fgw/<id>` branch,
  ADR0020) plus a companion commit on `fgw/tsk-49u` rewriting the test
  that pinned the entry's existence to instead pin its absence — same
  split-commit shape `tsk-3fj`'s own plan.md already used for the original
  rename.

## Outstanding questions

None
