# launcher-vocabulary-rename — plan

Mode: **small** (0 of the 10 mode-gate flags apply — no auth,
authorization, data model, audit/security, external systems, public
contracts, cross-platform, existing covered behavior touched, weak proof
area, or multi-domain concern; this is a prose/vocabulary rename across
docs + 3 code comments, no runtime behavior changes). Per
`fgos-routing`'s own Mode-gate table, 0-1 flags is tiny/small; "small" fits
better than "tiny" given the real file count (~30+ candidate spots to
triage, one new decision record, one new guard test) — more than "a couple
of files, one direct task."

`impact-analysis: full` (GitNexus present; informational only — no code
symbol is being renamed, this is text substitution in prose/comments).

## Approach

Chosen path: apply the term rename directly across the item's own named
scope, spot-check the broader scout list from CONTEXT.md against the
allowlist (D1/D2 decisions + the item's own PHẠM VI ĐỔI/ALLOWLIST), author
new decision record `docs/decisions/0028-<slug>.md` that partially
supersedes 0026 (naming only, per CONTEXT.md D1), and write the guard test
last so it locks in whatever the finished state actually looks like.

Rejected alternative: blanket `sed`-style find/replace across every
`rg -l orchestrator` hit. Rejected because the item's own description is
explicit that several senses of "orchestrator" coexist in this repo
(herdr-plugin's `PaneOrchestrator`, distillery's upstream-source usage,
merge-design's unrelated "grand orchestrator" phrase in old plans/reports)
— a blind batch edit would corrupt allowlisted files. CONTEXT.md's scout
evidence already confirms the allowlisted paths carry real, distinct
matches.

Files likely touched (spot-checked against CONTEXT.md's scout list; ✓ =
uses 0026's sense, needs the rename; — = allowlisted/unrelated, skip):

| Path | Verdict |
|---|---|
| `docs/decisions/0026-vision-orchestrator-roottask-capacity-native-vs-cli-spawn.md` | ✓ body prose (~15 spots per item description) — filename itself stays (D2) |
| `docs/decisions/0028-<slug>.md` (new) | new file, "launcher" throughout, `supersedes: [0026]` frontmatter |
| `docs/history/two-layer-dispatch/CONTEXT.md`, `DISCUSSION.md` | ✓ named in item scope |
| `docs/how-to/wire-a-skill-through-the-native-vs-cli-spawn-dispatch-decision.md` | ✓ named in item scope |
| `docs/how-to/reuse-the-shared-capacity-dispatch-fallback-fragment.md` | ✓ named in item scope |
| `src/runner/worker-log.mjs`, `loop.mjs`, `dispatch.mjs` | ✓ comment-only, named in item scope |
| `herdr-plugin/src/{main,pick,ports}.rs` | — allowlisted (`PaneOrchestrator`, distinct Rust concept) |
| `docs/distillery/**` | — allowlisted (verbatim upstream extraction) |
| `plans/reports/**` | — allowlisted (historical records) |
| `docs/history/herdr-*` | — allowlisted when about `PaneOrchestrator`; still spot-check each, not blanket-skip |
| `.claude/skills/{fgos-clarifying,fgos-coding-exploring,_shared/capacity-dispatch-fallback,fgos-coding-planning,fgos-coding-implement,fgos-coding-validating}` + `.agents/skills/` mirrors (12 files) | — **no edit**: these cite 0026's own filename, which D2 keeps unchanged; the word "orchestrator" here is a correct path citation, not a term-misuse instance |
| `docs/architecture-map.md`, `docs/backlog.md`, `docs/decisions/0013-...md`, `docs/enduser-docs-index.json`, `docs/explanation/*.md` (4 files), remaining `docs/history/*/{CONTEXT,plan,session-source,repro-notes}.md` (~20 files) | **unclassified — triage each individually during execution** against 0026's sense vs. an unrelated/generic use of the word "orchestrator"; not pre-classified here since CONTEXT.md deferred this per-spot check to execution rather than guessing in bulk |

Risk map:

| Component | Risk | Proof point |
|---|---|---|
| Guard-test allowlist correctness (missing an exempt path → false positive; missing a real instance → recidivism) | medium | the item's own verify command (`npm test && node --test test/docs/launcher-vocabulary-guard.test.mjs`) — POSITIVE half proves "launcher" exists where expected, NEGATIVE half proves "orchestrator" is gone from every non-allowlisted fgOS-owned prose path, both required per `docs/how-to/write-verify-for-a-skill-prose-change.md` |
| Triaging ~25 unclassified files wrong (renaming a spot that used "orchestrator" in an unrelated sense, or missing a real 0026-sense spot) | medium | same guard test's NEGATIVE half catches any missed real spot; a wrongly-renamed unrelated spot is not caught mechanically — read each unclassified file's actual sentence before editing, not just its filename |
| New decision record 0028 breaking STR72's backward-pointer requirement | light | `docs/decisions/0000-index.md` line 30-32's own rule: 0026 must gain `superseded_by: 0028` in frontmatter, 0028 must carry `supersedes: [0026]` — verify by reading both files' frontmatter after the edit, no automated check exists for this today (documented gap, not silently assumed correct) |

## Shape

Single piece, no split (see Decide the split below). Concrete cases to
prove against, scaled to `small`:
- Guard test true-positive: a synthetic "orchestrator" string added to an
  in-scope fgOS-owned prose file must fail the test (sanity-checks the
  regex/allowlist isn't vacuously permissive).
- Guard test true-negative: the 12 skill-mirror files, `docs/distillery/**`,
  `plans/reports/**`, and `herdr-plugin/**/*.rs` must NOT trip the guard
  even after the rename lands (allowlist correctness, both directions).
- `docs/decisions/0026-...md`'s own filename is byte-identical before and
  after (D2's own claim, checkable via `git diff --stat` showing no rename).

## Decide the split

One honest piece. The item already carries a single, real, runnable verify
command (`npm test && node --test test/docs/launcher-vocabulary-guard.test.mjs`)
that only passes once the whole rename + guard test + new decision record
are all in place together — splitting into siblings would mean each piece
either can't verify independently or duplicates the same guard test, with
no independent-workability gain. Proceeds as `tsk-2cw` itself.

## Assumptions (unproven, flagged for fgos-coding-validating)

- The ~25 "unclassified" files in the Approach table each get a real,
  individual read during execution rather than a keyword-only judgment —
  pinned here as a plan-level expectation, not verified by this plan
  itself.
- No other pinned-term guard test already exists that this new one would
  collide with or duplicate (`test/skills/fgos-mirror.test.mjs` is cited by
  the item description as a *structural* precedent, not a vocabulary guard
  — assumed non-overlapping, unproven).
