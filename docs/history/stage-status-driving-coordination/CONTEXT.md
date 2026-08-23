# CONTEXT: why `stage` and `status` are driven by two separate mechanisms, not one unified loop (tsk-1bl, tsk-2xt)

## Feature boundary

A work item has two independent dimensions: `stage` (per-domain, forward-only —
`clarify → decompose → executing`, `src/state/stage-fsm.mjs` +
`workflow-stage-graphs.mjs`) and `status` (domain-agnostic, can move backward —
`todo/doing/blocked/awaiting-human/awaiting-approval/delivered/retrospective/
cleanup/done/wontfix`, `src/state/status-fsm.mjs`). `fgos-coding-driving`
(`.claude/skills/fgos-coding-driving/SKILL.md`) already drives one claimed
item across the `stage` axis. Separately, `retro-next`/`cleanup-next`
(wrapped by `retro-loop`/`cleanup-loop`) drive the post-merge `status` chain
(`delivered → retrospective → cleanup → done`) as a whole-pool batch sweep.

The question explored here: should these become **one unified driving-loop
mechanism** that reads both `stage` and `status` and decides which axis is
"live" at each iteration — i.e. a genuinely 2-axis-aware decision procedure,
not a 1-axis-blind one? Answer: **no** — rejected after two rounds of
independent advisory review, with concrete evidence. The rejection is not
about the decision logic being insufficiently smart (a 2-axis-aware version
was the actual proposal under review); it is that crossing one specific
boundary (`awaiting-approval → delivered`) is a **policy wall**, not an
engineering gap, and four further mechanical facts break automatic
continuation even after a human manually crosses that wall.

## Locked decisions

| ID | Decision |
|----|----------|
| D1 | `awaiting-approval → delivered` (merge/approve) is reserved for a human decision, structurally — never automated by any driving loop regardless of how the loop's handler-resolution logic is designed. This is not a limitation of 1-axis vs 2-axis decision logic: even a loop that correctly identifies `awaiting-approval` as "stage is frozen, status is the real signal" still cannot legally decide to cross this specific edge on its own authority. `fgos-coding-driving`'s own hard stop here (added per `tsk-19j-4`, closing a real "unlimited ceiling's first real run" safety gap) stays exactly as-is. |
| D2 | Even granting a human has manually crossed D1 (status now reads `delivered`), a single loop object resuming automatic drive through `retrospective → cleanup → done` hits four independent structural breaks, none related to axis-selection logic: (a) `fgos-coding-compounding` does not self-advance `status` the way `discover`/`decompose`/`return` do — a caller must separately run `fgos move <id> --to cleanup` after it; (b) `fgos retrospective` sweeps every item currently at `delivered`, not the one id a per-item loop is driving — invoking it from a single-item loop reverses D9 of `docs/history/work-item-status-delivered-retrospective-cleanup/CONTEXT.md` ("processed by a separate loop… never inline in return/approve") with no new evidence; (c) `cleanup`'s TTL gate (D7, same CONTEXT.md) does not no-op when not yet elapsed — `assessCleanupReadiness` actively parks the item `cleanup → blocked` with a reason (`src/state/cleanup-harness.mjs`), which a naive continuous loop would misread as a real failure; (d) stage-axis work runs inside the item's own worktree, but `approve` refuses to run from any worktree at all, and `cleanup` operates on `process.cwd()` in the main checkout — the three phases (build / merge / cleanup) are not reachable from one continuous process location. |
| D3 | Coordination between the two axes already exists and is correct **by construction**, via the item's own `status`/`stage` fields as shared, asynchronously-polled state — not via one loop calling the other. `RESOLVED_STATUSES` (D13, `work-item-status-delivered-retrospective-cleanup/CONTEXT.md`, `src/state/frontier.mjs`) already includes `delivered`/`retrospective`/`cleanup`, so `depsReady`/`hasOpenDescendant` unblock dependents the instant an item reaches `delivered` — nothing downstream ever waits on the post-merge chain finishing. Zero-latency-sensitivity is why no direct call between the two loops is needed. |
| D4 | The one real gap in D3's coordination is **observability of the handoff**, not control: no staleness/liveness detector covers `delivered`/`retrospective`/`cleanup` the way `classifyStaleDoing` covers `doing` — an item can sit unprocessed indefinitely with no advisory surface noticing. Closed by `tsk-1bl` (`classifyStalePostDelivery`, pure/read-only, mirrors `classifyStaleDoing`'s shape). Thresholds locked: `delivered` stale after 3 days from its entry-into-`delivered` event; `cleanup` stale after `ttlDays + 3` days (grace period added on top of the real TTL, D7 below — never counted from cleanup-entry directly, to avoid flagging every item still legitimately waiting on TTL); `retrospective` stale after 3 days from its `delivered -> retrospective` entry event — same threshold and same entry-anchored-age shape as `delivered` (D7 below). |
| D7 | `retrospective`'s staleness threshold — left open in D4's original wording ("deferred to whoever implements `tsk-1bl`") — is locked at 3 days, user-confirmed directly (not a session proposal), matching `delivered`'s own threshold exactly. Anchor event: the item's own `delivered -> retrospective` transition (`work.move` event, `payload.to === 'retrospective'`) — the same event `retro-pool.mjs`'s `latestRetrospectiveEntry` (`src/state/retro-pool.mjs:19-24`) already reads for FIFO ordering, confirmed present in this scout pass. This closes the "Outstanding, explicitly deferred" item below. |
| D8 | **Added mid-`decompose`, `fgos-coding-planning` → `fgos-coding-exploring` hand-back (tsk-2xt's own material gap).** `tsk-2xt`'s scope expands beyond D5/D6's original retro/cleanup-only automation to all four herdr-launcher domains — auto-discover, auto-merge, auto-retro, auto-cleanup — each independently toggleable, per a 2026-08-06 user exchange recorded verbatim in `tsk-2xt`'s own item description (the grounding evidence for this decision; not re-asked here since the description already states it with full specificity). Auto-discover launches a `fg:agents-N` pane (existing `pick.rs::open_pick_pane` layout pattern, same mechanism `herdr-launch-agent-from-work-item`/`herdr-shared-launch-agent` already document) running `/fgOS:discover <id>` for an item detected ready at stage `clarify`. Auto-merge/auto-retro/auto-cleanup launch into the two fixed `fg:operation` panes (`tsk-5lr`, `herdr-operation-tab-layout/CONTEXT.md` D1/D2 — left pane by smaller `x` = merge-loop, right pane = retro-loop/cleanup-loop alternating by priority), running `/fgOS:merge-loop`, `/fgOS:retro-loop`/`/fgOS:cleanup-loop` respectively. All four reuse the herdr-plugin's existing poll cycle (`main.rs`'s `POLL_INTERVAL`/`last_poll`) — no new poll loop — same as D5 already established for retro/cleanup alone; this also resolves the "poll cadence" item under Outstanding below (no separate cadence decision needed, the existing cycle is reused as-is). |
| D9 | Auto-merge's unattended `merge-loop` launch does **not** conflict with this same document's D1 ("`awaiting-approval → delivered` is reserved for a human decision, structurally — never automated by any driving loop"): `docs/history/merge-standardization/CONTEXT.md` D6 already separately locked that `merge next`/`merge-loop` runs unattended, agent-driven, and that CTR005's `role: 'human'` attribution is structural inside `approve` itself (hardcoded at the call site, `moveWork(..., { role: 'human' })`) regardless of what invokes it — an agent-driven skill calling `approve` already satisfies that gate as-is. That same document's D7 also records a second safety gate, the Iron Law, which `merge next` never auto-acknowledges on its own authority — a risky self-modifying diff still stops and reports rather than merging. D1 above is about `fgos-coding-driving`'s own per-item stage-axis loop specifically (it never proceeds past `awaiting-approval` itself); `tsk-2xt`'s auto-merge toggle only auto-launches the already-sanctioned, separately-gated `merge-loop` mechanism unattended — it builds no new path across that human wall. |
| D10 | Two points the item's own description already marks as deliberately deferred past this stage, confirmed here rather than re-asked: (a) settings storage form — a dedicated config file vs. an env var in the `FGOS_HERDR_SKIP_PERMISSIONS` style — is left to `fgos-coding-planning`, per the description's own "quyết định cần chốt lúc plan/decompose" wording; (b) the anti-double-launch title-guard's fragility against a user manually renaming a pane is left to implementation time, per the description's own wording. Neither is a `fgos-coding-exploring`-stage product decision — both are pinned here as confirmed-deferred so `fgos-coding-planning` does not need to re-derive that deferral. |
| D5 | The second real gap is that `/fgOS:retro-loop`/`/fgOS:cleanup-loop` run 100% manually today (confirmed: no cron/scheduler exists anywhere in this repo). Closed by `tsk-2xt` — a herdr plugin (`herdr-fgos`, `herdr-plugin/src/`) that polls the existing pickers (`pickNextRetrospectiveItem`/`pickNextCleanupItem`) on its own render cycle and auto-launches a pane running `/fgOS:retro-next`/`/fgOS:cleanup-next`, reusing the exact `herdr pane split` + `herdr pane run` mechanism already proven by `tsk-19y-3` (`docs/how-to/launch-claude-in-a-new-herdr-pane-from-a-plugin.md`). |
| D6 | `tsk-2xt` deliberately chose the herdr-launch route over extending `fgos-runner --watch` (the existing headless daemon, confirmed via `src/runner/loop.mjs` to never import either pool picker today). Extending `--watch` would require dispatching `fgos-coding-compounding` via a blind headless `claude -p` worker — the same class of context-blind subprocess judgment (`judgeDiscovery`/`judgeDecompose`) that `tsk-31l` spent this same working session closing off for the pre-merge axis. Applying that pattern to `fgos-coding-compounding` (which needs a live session's real Diataxis classification and doc-writing judgment, per D9 of the delivered/retrospective/cleanup CONTEXT.md) would reopen the same "mù" problem on the other axis. The herdr route keeps a real, live Claude session — unattended, but not blind — consistent with that same session's broader direction. |

## Resulting design

```
PHASE 1 — stage axis, one claimed item, in its own worktree, live session
  clarify → decompose → executing
  driven by fgos-coding-driving; hard-stops at awaiting-human / blocked /
  awaiting-approval (never proceeds past awaiting-approval — D1)

──── HUMAN GATE (the only structurally-required human step in this chain) ────
  approve/merge (CTR005), awaiting-approval → delivered

PHASE 2 — status axis, whole pool, main checkout, batched
  delivered → retrospective → cleanup → done
  driven by retro-next/cleanup-next (wrapped by retro-loop/cleanup-loop),
  picking from the pool, not tied to phase 1's specific id or session
```

The two phases never call each other; they coordinate through the item's own
`status` field (D3). `tsk-1bl` adds observability of that handoff; `tsk-2xt`
adds automatic triggering of phase 2 (replacing today's fully-manual
invocation) without merging the two mechanisms.

## Evidence trail

Full evidence (file:line citations for every claim in D1/D2) came from two
rounds of independent advisory review (Opus, brainstormer persona) inside
this same working session — not re-derived here; the review transcripts are
not persisted as a separate artifact, but every citation above was verified
directly against the named files at review time:
`.claude/skills/fgos-coding-driving/SKILL.md`,
`docs/history/work-item-status-delivered-retrospective-cleanup/CONTEXT.md`,
`plugins/fgOS/skills/retro-next/SKILL.md`,
`plugins/fgOS/skills/cleanup-next/SKILL.md`, `bin/fgos.mjs` (`retrospective`/
`cleanup`/`approve`/`move` cases), `src/state/cleanup-harness.mjs`,
`src/state/retro-pool.mjs`, `src/state/impact.mjs`, `src/runner/loop.mjs`.

D8/D9's mid-`decompose` addition (`fgos-coding-planning` → `fgos-coding-exploring`
hand-back) additionally cited `plugins/fgOS/skills/merge-next/SKILL.md`,
`docs/history/merge-standardization/CONTEXT.md` (D6/D7),
`docs/history/herdr-operation-tab-layout/CONTEXT.md` (D1/D2), and
`docs/history/fgos-terminal-close-autoclose/CONTEXT.md`. Impact-analysis
capability gate at this pass: `fgos tool query --capability impact-analysis
--status present` returned `gitnexus` present — posture `full` (this skill
produces no proof points itself; recorded here for `fgos-coding-planning` to read
without re-querying).

## Related

- `tsk-31l` (delivered) — closed the equivalent "mù" gap on the pre-merge
  axis (`/fgOS:discover`/`/fgOS:plan`/`discover-next` now route through
  `fgos-coding-driving`/`fgos-coding-exploring`/`fgos-coding-planning` instead of calling
  the bare CLI verb blind). D6 above extends the same reasoning to this
  axis's own automation choice.
- `tsk-3id` (delivered) — unrelated file-naming cleanup (`fsm.mjs`/
  `stage.mjs` → `status-fsm.mjs`/`stage-fsm.mjs`), surfaced in passing during
  this same exploration when confirming which module owns which axis.

## Outstanding, explicitly deferred

- ~~Poll cadence for `tsk-2xt`'s herdr-side detection loop, and whether herdr
  exposes a way to list running panes/titles for the anti-double-launch
  guard, or whether that needs its own state file — not investigated in this
  session, left to `tsk-2xt`'s implementer.~~ **Resolved by D8/D10.** Poll
  cadence reuses the existing `main.rs` poll cycle (no new cadence to pick).
  The anti-double-launch guard uses `herdr pane list` directly (per
  `tsk-2xt`'s own description) — herdr already exposes that listing, so no
  separate state file is needed for it; the guard's remaining fragility
  against a manually-renamed pane title is pinned in D10 as deferred to
  implementation time, not a gap here.

## Outstanding questions

None
