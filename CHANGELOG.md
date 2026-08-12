# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Changed

- `fgos doctor` gained a `delivered-not-on-trunk` check: it names any item
  whose status says its work was handed over (`delivered`, `retrospective`,
  `cleanup`, `done`) while its own `fgw/<id>` branch is still not reachable
  from the trunk. `delivered` is reachable through a bare `fgos move`, which
  merges nothing and asks for no proof that anything merged, so real tested
  work could sit outside `main` with nothing reporting it — `root-drift`
  only walks root items, and `fgos stale` waits a three-day TTL and then
  says "forgotten", not "unmerged". The check separates the two causes: a
  branch that merged nowhere needs its content landed, while one that landed
  on a root branch that has not synced needs `fgos sync-root` on the root
  instead.
- `fgos discover` and `fgos plan` no longer send the reader to each other
  when neither serves the item's stage. Each gate now checks whether its
  sibling would actually accept the item; when neither does, both say so
  plainly and point at `fgos doctor`'s stage-vocabulary check, instead of
  forming a closed referral loop with no way out.

- The `decompose` stage/verb/launcher family is renamed to `plan`: the CLI
  verb `fgos decompose` is now `fgos plan`, the slash command
  `/fgOS:decompose` is now `/fgOS:plan`, and the stage a coding-domain item
  sits at while being shaped is now called `planning`. The verdict values
  (`pass-through` / `need-human` / `decompose`) are unchanged — they name
  an outcome, not a stage. `decompose` itself survives as a legacy,
  drain-only stage alias so items already parked there before this change
  keep advancing through their existing edges; no new item can land on it.
  Five stage skills gain a `coding-` prefix to match the domain-prefix
  convention every other stage skill already follows:
  `fgos-exploring`→`fgos-coding-exploring`, `fgos-planning`→
  `fgos-coding-planning`, `fgos-validating`→`fgos-coding-validating`,
  `fgos-compounding`→`fgos-coding-compounding`, `fgos-code-implement`→
  `fgos-coding-implement`.
- The `clarify` stage is retired entirely — it is no longer a stage at
  all. The understand-the-ask pass it used to run moved to an Init-time
  helper (`fgos-clarifying`) that `/fgOS:submit` calls BEFORE the item is
  created, so an item is now born with the cleaned-up title/description
  and its domain already settled. Unlike `decompose`, no drain-only alias
  is kept: every item still open on `clarify` was migrated onto a real
  stage first, so nothing is stranded. `discovery` is now the coding
  domain's first stage, and no item can be created at, or moved to,
  `clarify` anymore.
- A `discovery` verdict now picks WHICH EDGE the item takes, instead of
  every item walking one fixed chain. `clear` skips `exploring` entirely
  and lands the item straight on `planning`; `unclear` advances it to
  `exploring` and parks it there for a person, so whoever answers resumes
  already sitting at the stage where the Socratic pass happens instead of
  looping back through discovery on the same unresolved question.
  Previously an unclear verdict parked the item in place, at whatever
  stage it was already on.
- `tier`/`kind`/`risk` are no longer judged from the raw submit text. The
  `fgos submit` verb still stamps its mechanical keyword-derived values,
  but those are now explicitly a temporary placeholder: stage
  `discovery`'s own skill (`fgos-coding-discovering`) makes the real call
  once, on the research evidence it just gathered, reading each domain's
  declared `kind`/`risk` vocabulary rather than a hardcoded list. No
  caller re-judges them at intake anymore — a wrong placeholder is
  corrected later by discovery's own judgment, not earlier by guessing
  harder at the ask. The `submit-assist-classify` capacity is retired
  outright, with no migration: it only ever described how to call a
  helper, never held a judgment that needed handing over.
- `/fgOS:retro-next` is now a launcher in the strict sense: it sweeps,
  picks one item, and hands it to `fgos-coding-driving` with an explicit
  `ceiling: status:cleanup`, relaying whatever the driver reports. It no
  longer resolves the synthesis skill, invokes it, moves the item, or reads
  a subprocess exit code itself. Observable behavior is unchanged —
  synthesis runs, the item lands at `cleanup`, the run stops there — but it
  now inherits the driver's park/anchor handling and its
  `stop-reason: lock-timeout` relay instead of duplicating thinner versions.
- `fgos-coding-driving` now resolves each iteration's next step from the
  item's **position** rather than always from `stage`: `stage` while it is
  live, `status` once it freezes at `awaiting-approval`. This makes the
  driver able to carry an item through the post-merge chain
  (`retrospective` → `cleanup`) that previously needed hand-rolled
  sequencing in each launcher. No registry or code change was required —
  `skillMap` has mixed stage and status keys since decision `0027` D5.
- `/fgOS:cleanup-next` now reports a stuck shared lock with the same
  `stop-reason: lock-timeout` marker line every other launcher and the
  driver already use, instead of describing that condition only in prose —
  so `/fgOS:cleanup-loop` reads the one loop-stopping category off a line
  rather than inferring it. Its exit-code classification is unchanged and
  documented as deliberate: unlike `/fgOS:retro-next`, it runs a real CLI
  subprocess, so an exit code genuinely exists to read.
- `awaiting-approval` changes from an unconditional stop into the driver's
  **default, overridable ceiling**. A caller that supplies no ceiling stops
  there exactly as before, so existing behavior is unchanged; a caller that
  deliberately passes a further `status:*` ceiling can drive past it. The
  merge gate stays a human decision, now protected by a named launcher
  convention (no launcher ships a default ceiling past `awaiting-approval`)
  rather than by the driver refusing structurally.

### Fixed

- `fgos check`'s entropy report no longer under-counts the backlog waiting
  at the front of the lifecycle. The signal filtered on the literal stage
  name `clarify`, which the coding domain retired entirely, so it reported
  0 forever while every open item genuinely parked at the domain's real
  entry stage (`discovery`) went uncounted. It now resolves each item's own
  domain entry stage, and the row is labelled `stage-entry` instead of
  `stage-clarify` to match what it actually counts.

### Removed

- The `orchestrator` word ban (`test/docs/launcher-vocabulary-guard.test.mjs`
  and its 28-entry allowlist) is retired, per decision `0031`. Decision
  `0028` banned the term while it carried no meaning; decision `0029` D17
  then assigned it one — the T0 aggregate layer (N units, stays engaged),
  the role `/fgOS:*-loop` and `fgos-fanout` actually play. The guard was
  left blocking fgOS's own current vocabulary, and a word-level grep cannot
  tell the retired sense from the assigned one. Writing `orchestrator` in
  that assigned sense no longer fails the suite. `launcher` remains the only
  correct name for the one-unit, fire-and-forget role — that half of `0028`
  stands.

### Added

- `fgos discover` accepts `--tier`, `--kind`, and `--risk` alongside
  `--verdict clear`, so an interactive session can record the classification
  it just judged in the same call that resolves discovery, instead of
  remembering a separate `fgos edit`. This is the same data contract a
  headless worker already had through its `fgos-verdict` block, and both
  paths now run it through one shared guard: nothing is applied unless the
  discovery outcome actually resolves clear, so an unclear verdict or a
  parked verify dispute still changes no classification. A value outside the
  item's own domain vocabulary is refused as a validation error (exit 4)
  before the item moves at all, and omitting a flag leaves that field
  untouched.
- Repo-invariant checks now run alongside an item's own `verify`, at both
  `fgos return` and the post-merge gate of `fgos approve`. The commands are
  declared per project in `.fgos/config.json` under `invariantChecks.commands`
  (this repo's default: `node --test test/architecture.test.mjs`), registered
  into `fgos setup`'s config-merge and visible to `fgos doctor` as the new
  `invariant-checks-configured` check. They are a hard gate: a red invariant
  blocks the return and aborts the merge, naming the command that failed.
  A project with no `invariantChecks` section behaves exactly as before —
  nothing runs, nothing changes. This closes the gap where a repo-wide
  invariant broken by one item could land on main and stay red across later
  merges, because no item's own narrow `verify` happened to touch it.

- `fgos doctor` gained a `work-stage-vocabulary` check: it names any open
  item sitting at a stage its own domain no longer registers. Until now
  only `risk`/`kind` drift was surfaced this way, so an item stranded on a
  retired stage — which no `fgos edit` can correct, since `stage` has no
  editable door — stayed invisible until some other command tripped over
  it. The `discover` pool now derives its candidate stages from the same
  source the `fgos discover` verb checks against, so it can no longer offer
  an item that the verb would then refuse.

- `fgos promote-to-component` gained an opt-in `--trust-dir` flag: with an
  explicit `--dir` also passed, it can now run from inside a linked
  worktree instead of refusing outright. Default behavior (no flag) is
  unchanged. See `docs/how-to/recover-approve-sync-root-from-inside-a-
  worktree-with-trust-dir.md`'s new `promote-to-component` section.

### Changed

- `fgos approve` no longer re-runs an item's checks when the tree it is about
  to merge is provably the exact tree `return` already verified green (main
  has not advanced past the fork, and the branch tip still matches the SHA
  recorded at return). In that case both the item's `verify` and the
  invariant checks are skipped, and the merge report says so explicitly.
  Whenever main HAS advanced, the merged tree is genuinely different and
  every check runs as before.

- `fgos doctor` gained a new check, `events-jsonl-contiguous`: the shared
  `.fgos/events.jsonl` is now checked for seq breaks/duplicates that an
  ordinary git merge can leave behind (a new `.gitattributes` entry routes
  it through git's built-in `union` merge driver, closing the underlying
  merge-conflict-hand-resolution class of event loss). `fgos doctor --fix`
  repairs a found break by deduping exact-duplicate lines and renumbering
  `seq` contiguously — no event is ever dropped by the fix.

- Work-item `kind` and `risk` now have a per-domain vocabulary, declared by
  the domain itself (`DOMAINS.<domain>.classification`) and enforced at the
  write door alongside the existing `tier` enum. Coding declares
  `kind: bug|chore|design|docs|feature|task` and
  `risk: light|standard|heavy`. A domain that declares no vocabulary is
  unaffected — any non-empty string still passes, exactly as before.

- `pick`/`take` now transparently reclaim a `doing` item whose `human`/
  `session` claim has genuinely gone quiet — no new verb or flag. When a
  claim conflict would otherwise refuse unconditionally, the existing
  claim's worktree/branch activity (real commit + file-edit signal, not
  session/process identity) is checked first; past a conservative
  threshold (same `agentMs`/`humanMs` split `/fgOS:stale` already uses),
  the stale claim is released and the new claim reattaches to the
  existing branch (never force-removed). Runner claims stay untouched
  (`startupReap`'s own domain), and only a live `pick` attempt (never
  `take`, never a `runner` caller) can trigger it. Every other case —
  recent activity, or unreadable evidence — refuses exactly as before.

- The shared config file gains a `herdrOrchestrator: {autoDiscover,
  autoMerge, autoRetro, autoCleanup}` section (all off by default,
  fail-closed on a missing or malformed value) for the herdr-plugin
  dashboard's future auto-launch toggles. Surfaced by `fgos doctor`'s new
  `herdr-launcher-configured` check and merged in by `fgos setup`, same
  as every other registered config default.

- The herdr-plugin dashboard auto-launches a guarded agent pane running
  `/fgOS:discover <id>` for the first `discovery`-stage, `todo`-status
  item it finds, once per poll tick, when `herdrOrchestrator.autoDiscover` is
  on (off by default). Guarded against double-launching the same item via
  a dedicated pane label, kept separate from the dashboard's existing
  In-Process pane tracking so it never shows up there as a phantom task.

- The herdr-plugin dashboard also auto-launches into the fixed
  `fg:operation` tab when `herdrOrchestrator.autoMerge`/`autoRetro`/
  `autoCleanup` are on (all off by default): the left pane runs
  `/fgOS:merge-loop`, the right pane runs `/fgOS:retro-loop` or
  `/fgOS:cleanup-loop`, alternating by priority. Guarded against
  double-launching via a dedicated fixed pane title per toggle, same as
  auto-discover.

### Changed

- `/fgOS:submit` run from a live session now clarifies the ask before the
  item is created: `fgos-clarifying` reads the raw text and hands back the
  cleaned-up title/description and the domain, and `fgos submit` is called
  with those. It never judges `tier`/`kind`/`risk` itself — stage
  `discovery` does that, once, on real evidence. Any question it needs to
  ask is asked while you are still in the conversation, rather than days
  later at a discovery sweep. The `fgos submit` verb itself is unchanged — still mechanical,
  still no model call — so a bare shell, cron, another agent, or the
  dogfood fixture replay all behave exactly as before.

### Fixed

- An item parked for a person after being judged NOT clear at `discovery`
  was still recorded in the settlement channel as having passed, because
  the settlement record keyed only on the item leaving `discovery` — which
  an unclear verdict now also does. Where the item had no real verify yet,
  the record's detail read as the literal "chưa xác định — bổ sung thủ
  công" placeholder. A settlement is now recorded only when the verdict
  that drove the move was clear. Records already written for real clear
  passes are unaffected; nothing is re-derived or silenced retroactively.
- Items could be stored with a `risk` value nothing in the system reads
  (`low`/`medium`/`high`), which silently disabled two behaviors rather
  than failing: the human-confirmation gate that fires before a
  `risk: heavy` root is split, and the risk discount in the priority
  formula (which fell back to its `standard` weighting). Such a value is
  now rejected when written. Items already stored with one keep replaying
  and stay editable; only a write that actually touches the field is held
  to the vocabulary.

- Merging could fail for reasons that had nothing to do with the work being
  merged. The event-log concurrency test queued 800 serialized lock
  acquisitions against a 2s per-acquisition budget, so under the load of a
  full test run it could exceed that budget and fail — and because that run
  is what `fgos approve`/`fgos return` use to verify a merge, the merge was
  rolled back and an innocent item was parked in `blocked`. Observed three
  times in one day on two unrelated items. The test now queues an amount
  the budget was actually documented for, and still fails loudly if the
  append lock itself regresses.

### Removed

- The standalone `fgos-submit-assist` skill. Its own steps had no reason
  left to exist on their own: title derivation always lived in the
  `submit` verb itself, and its tier/kind/risk classification now happens
  once at stage `discovery`, on real research evidence, for every item
  regardless of which caller created it. Use `/fgOS:submit` directly; it
  now does strictly more than this skill did.

## [0.1.0]

Baseline snapshot of the public surface as of this entry.

### Added

- `fgos` CLI with 49 verbs covering the work-item lifecycle (submit,
  clarify/decompose/execute, review/merge, and maintenance operations).
- `fgos-runner` bin entry for the automated runner loop.
- Install/setup/doctor/uninstall story: `fgos setup` (global/project config
  merge), `fgos doctor` (check registry), and their uninstall counterpart.
