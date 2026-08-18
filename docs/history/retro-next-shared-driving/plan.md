# plan.md — tsk-3cx: generalize the driver's advance-axis; retro-next and cleanup-next as launchers

Mode: **high-risk**

Flag count: **4** — public contracts, existing covered behavior, audit/security,
weak proof around the area. Independently, one **hard-gate flag** fires on its
own: *removing a validation* — `CONTEXT.md` D2 removes `fgos-coding-driving`'s
unconditional refusal to drive past `awaiting-approval`. Either trigger alone
lands this at `high-risk`; both do.

No lane was handed off by `fgos-routing` for this item (it was driven straight
through `fgos-coding-driving`, which does not run Orient's mode gate), and no
prior `Mode:` line existed — so the lane was decided here via
`fgos-routing`'s own Mode-gate subsection, per this skill's direct-entry
fallback.

Why not smaller: a `standard` lane would not honestly cover D2. Converting the
merge gate's protection from structural (the driver refuses) to conventional
(no launcher ships a ceiling past it) is a governance change to a safety gate
that five callers depend on, and the change surface is LLM-interpreted prose
that no static check can assert at runtime. Those two facts together are
exactly what the `high-risk` lane exists for.

`impact-analysis: full` — `fgos tool query --capability impact-analysis
--status present` returned `gitnexus` `present` at this pass (same posture
`CONTEXT.md`'s Scout evidence recorded; not re-queried).

## Approach

**The whole change surface is skill prose.** Scouted directly: `rg -n
"ceiling" src bin` returns no ceiling logic anywhere in `src/` or `bin/` —
the driver's ceiling comparison, its advance-axis, and its stop conditions
all live in `.claude/skills/fgos-coding-driving/SKILL.md` and are
interpreted at runtime by the session reading it. `skillForStage` and
`parkReasonForStatus` (`src/state/workflow-stage-graphs.mjs`) already accept
any key and already return `undefined`/`null` for an unregistered one, so
D1's position-based lookup needs **no code change and no new registry
field**. D5 already ruled out the one registry addition that was on the
table (`waiting-ttl`).

Chosen path: three independent prose edits, split into three child items,
with only the risky one carrying the `high-risk` lane.

Rejected alternatives:

- **Add a `verbMap` alongside `skillMap`** so the driver could run
  `fgos cleanup` itself at a position with no registered skill. Rejected:
  the item's own purpose is removing a hand-rolled mechanism, and this adds
  one. `CONTEXT.md` D4's own parenthetical already leans the other way
  ("today's rule: stop and let the caller's own mechanical verb cover it").
- **Keep it as one item.** Rejected: the `high-risk` lane is driven almost
  entirely by the driver edit; bundling forces high-risk ceremony onto two
  trivial launcher edits and makes one verify cover three unrelated files.
- **Route `cleanup-next` through the driver.** Rejected on scout evidence,
  see the finding below.

### Finding: `cleanup-next`'s folding is real but small

`CONTEXT.md` D4 folds `cleanup-next` into this item, and left *how* to
`fgos-coding-planning` as shaping. Scouting it (`plugins/fgOS/skills/cleanup-next/
SKILL.md`, steps 2-5) shows it **invokes no skill at all** — it picks a
TTL-pre-filtered item, runs the `fgos cleanup <id>` CLI verb, and classifies
by that subprocess's real exit code. There is nothing for a driver to drive,
and its exit-code classification is **correct**, not the defect `retro-next`
has: `retro-next` classifies by exit code *after* invoking an in-session
skill where no exit code exists, whereas `cleanup-next` genuinely spawns a
subprocess.

So D4 is honored by bringing `cleanup-next` to the same *launcher
vocabulary* — emitting the standard `stop-reason: lock-timeout` marker line
instead of describing that condition only in prose — and by recording
explicitly that its exit-code branch stays. It is not honored by making it
call a driver that would immediately stop. This narrows the piece; it does
not reopen D4 (which locked inclusion, never a mechanism).

### Risk map

| Component | How risky | What would prove it |
|---|---|---|
| Driver: `awaiting-approval` becomes an overridable ceiling (D2) | **High** — removes a validation; the human merge gate's protection becomes conventional | At `fgos-coding-validating`: confirm no launcher in `plugins/fgOS/skills/**` ships a default ceiling past `awaiting-approval`, and that the driver prose states the convention explicitly as a named constraint, not a passing remark. Blast-radius evidence available (`impact-analysis: full`) but of limited use — the coupling is prose-to-prose, not symbol-to-symbol, so a `rg` sweep over `plugins/fgOS/skills/**/SKILL.md` is the real check |
| Driver: position-based advance-axis (D1) | **Medium** — five callers read this contract (`cook`, `pick`, `discover-next`, and the clarify/planning/execution sweeps); a wrong generalization silently changes what every one of them drives | At `fgos-coding-validating`: re-read each of the five callers' own ceiling arguments against the new prose and confirm each still resolves to the same behavior it has today |
| Stale docs describing today's driver behavior | **Medium** — `docs/explanation/why-cook-and-pick-were-retrofitted-to-call-fgos-coding-driving.md` and `docs/how-to/advance-a-clarify-or-decompose-stage-item-with-discover-decompose.md` both describe current semantics | At `fgos-coding-validating`: grep both for claims D1/D2 invalidate; any hit is in P1's scope, not a follow-up |
| Launcher edits (P2, P3) | **Low** — single-file prose, behavior deliberately unchanged (D3) | Their own verify commands |
| Proof is inherently weak for all three | **Structural** — skill prose is LLM-interpreted; no static check asserts runtime behavior (`docs/how-to/write-verify-for-a-skill-prose-change.md`) | Accepted, not fixable here. Every verify below follows that doc's mandated `npm test && POSITIVE && NEGATIVE` shape, which proves the deliverable exists and the old pattern is gone — never that the prose is understood |

### Order

P1 first (P2 depends on it: a launcher must not point at a ceiling the
driver does not yet honor). P3 is independent of both and may run in
parallel with either. `fgos graph --json` reports this item in a
single-node component with no dependents, so no critical-path ordering
constraint applies beyond P1→P2. (`topUnblock` was skipped by the engine at
552 nodes — above its greedy ceiling — so it contributed nothing here.)

## Shape

Three children, footprints disjoint — created as `tsk-2sr` (P1),
`tsk-3i4` (P2, `deps: [tsk-2sr]`), `tsk-kia` (P3, no deps):

**P1 — driver: generalize the advance-axis, make `awaiting-approval` an
overridable ceiling.** Touches `.claude/skills/fgos-coding-driving/SKILL.md`
plus a `## [Unreleased]` line in `CHANGELOG.md` (per `AGENTS.md`'s
install/setup/doctor gate: a user of fgOS sees this behavior change), plus
any stale claims in the two docs named in the risk map. Carries the
`high-risk` lane. Adds a section headed exactly `## Advance-axis: position,
not stage`, states `awaiting-approval is the DEFAULT ceiling, overridable`,
names the launcher convention as a constraint, and removes the clause
saying merge/approve `stays out of this loop`'s reach.

**P2 — `retro-next` becomes a launcher.** Touches
`plugins/fgOS/skills/retro-next/SKILL.md`. Replaces steps 4-6's hand-rolled
invoke-skill / `move <id> --to cleanup` / classify-by-exit-code sequence
with: pick one, set `ceiling: status:cleanup`, call the driver, relay its
stop verbatim. Observable behavior identical to today (D3).

**P3 — `cleanup-next` adopts launcher vocabulary.** Touches
`plugins/fgOS/skills/cleanup-next/SKILL.md`. Emits the standard
`stop-reason: lock-timeout` marker line, and records that its exit-code
classification stays because it runs a real subprocess. Does not call the
driver (see the finding above).

### Cases worth proving against

- A launcher that supplies **no** ceiling must still stop at
  `awaiting-approval` — D2's "default" half is what keeps today's behavior
  intact, and is the easiest half to lose while writing the "overridable"
  half.
- An item at `cleanup` — the driver resolves no skill there; the existing
  "skill is null → stop" rule must still fire rather than falling through.
- An item at `retrospective` whose synthesis skill does not confirm complete
  — `retro-next` must still report it skipped without moving it to
  `cleanup`, exactly as today.
- The five existing driver callers, each re-read against the new prose.

## Assumptions

- `skillForStage`/`parkReasonForStatus` need no code change, because both
  already accept any key and return a null-ish value for an unregistered
  one. Grounded in reading both functions
  (`src/state/workflow-stage-graphs.mjs:475-492`), not assumed.
- No new test file is needed: the existing suite covers the registry
  functions, and skill prose has no runtime assertion surface. Flagged here
  so `fgos-coding-validating` checks it rather than inheriting it silently.

## Outstanding questions

None
