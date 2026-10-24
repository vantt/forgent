# Assessment: standard pools for a one-vendor machine, and the session-lead inline path

SEAT (`claude-lcpq@design-lap`, `lead:SEAT`), 2026-10-24 21:18. This assessment answers the two tasks CFG handed to SEAT on the board at 20:55. The owner set the frame: CFG's branch only carries code to SEAT, and SEAT decides what lands and in what form. The owner also asked for a serious assessment before any change.

Read first: [seat-binding spec](../../docs/specs/seat-binding.md) §6.3 (precedence and walk) and line 112 (the inline-lead exit). The code is `packages/seat-binding/rust/src/rank.rs` and `policy.rs`.

## Task 1: branch `seat/standard-single-vendor-coverage` (`4890009b5`)

### What CFG claims, checked

| Claim | Checked against | Verdict |
|---|---|---|
| A `prefer` list narrows and never widens | `rank.rs` `run_bases`: candidates come only from the prefer bases, and nothing surviving means a refusal. `walk_order` and the `fallback_families` filter allow `tierFallback` only within the list's families. Spec §6.3: "capability chỉ thu hẹp" (approved in `e0e52312a`). | True |
| Seven standard pools name no `openai` | Every prefer list in `core/config-standard/runner.yaml` on main, enumerated with a script | True: `advise`, `execute`, `fgos-coding-implement`, `code:implement`, `code:test`, `code:refactor`, `coding:implement` |
| So a project that configures nothing, on a machine holding only Codex, is refused on the default capability of `fgos run` | `execute` is the default capability, and its list was gemini/deepseek/glm/claude | True |
| This repository keeps its own lists | `.fgos/config.json` here declares the same seven lists without `openai`. The migration rule keeps the effective value, so they are recorded in `repo-differences.v1.json`, and `golden_migrate` moves 16→23 kept, 256→249 dropped. | True. This is correct: migration must not change what this repo runs. Whether this repo should also fall back to Codex is the owner's taste, not part of this fix. |

**Rule versus data.** The fix belongs in the data, not in the rule. Widening the walk to `tierFallback` when every listed executor is absent would change the approved §6.3 law. It would also override pools that list one family on purpose (for example `advise` pins the confined invocations). Adding `openai` at the end of each list keeps every order before it and only adds a last resort.

**Correction after the independent review (21:40): the red-team role pools are a real gap, not an intentional one.** The first version of this report claimed a red-team checker can never bind on a one- or two-provider machine because its independence is pairwise. That is true only at rigor high or critical (`seat-resolver.mjs` `requiresDistinctFamilies`; `patterns/reviewed.mjs:291`). At the default standard rigor, a checker has to differ only from the producer. `seat-resolver.mjs:116` adds a `red-team` seat to every `code:*` unit whatever the rigor. So on a machine with Claude and Codex but no xai, the producer binds Claude, the reviewer binds Codex, and the red-team seat (`[xai]`) is refused: **every reviewed `code:*` unit is refused there.** The same goes for `marketing:*.roles.red-team = [claude]` on a machine holding Codex and another family but no Claude.

**Revised decision:** append the missing families after the taste, giving `code:*.roles.red-team = [xai, claude, openai]` and `marketing:*.roles.red-team = [claude, openai]`. Independence still filters out the producer's family, and xai stays first where it is present. This repository keeps its own lists as recorded differences, as with the seven pools. The proof covers role pools too, with no exemption.

**Missing piece: a proof.** CFG's branch adds no test that keeps the property. SEAT adds one owning proof at the lowest layer that sees the bundled standard: `packages/config/rust/tests/golden_standard.rs` (the file says it owns "what the standard layer holds"). The behaviour under test: every producer pool of the standard (capability `prefer`, `seats.*.prefer`, `personas.*.prefer`) that names agent executors names both `claude` and `openai`, and every `tierFallback.<tier>` names both. Role pools (`roles.*.prefer`) are covered too. No existing test proves this; `golden_standard` checks fixtures, not the bundled file's coverage.

**Decision:** land the branch's change, plus the two red-team lists and the proof. It must land before or together with Slice C. Until Slice C, Node does not read the standard set, so the change has no runtime effect on main today.

## Task 2: the session-lead inline path (`inline_lead_for`)

### Facts

- **When it fires:** the crate seats the session lead inline only when the seat configured no candidate at all, the seat is not blind and it needs no skill (`rank.rs:155-163`, spec line 112).
- **What "configured" counts:** the prefer bases: the unit preference, plus the seat list resolved through §6.3, whose last row is `tierFallback.<tier>` (`policy.rs` `resolve_prefer`). An override base counts as one.
- **With the standard set as the base layer** (Slice C), every tier has a `tierFallback` with `minItems: 1`, so "configured" is never 0. The path cannot be reached through config.
- **It is already unreachable today** in every activated workspace on the owner machine: forgentX, mdview and mcp-skill-hub each declare `tierFallback` for all six tiers.
- **No production door reaches it today (independent review):** `inlineLeadOf` returns nothing for a headless session (`bind.mjs:249`). `fgos run` passes no session, so `run.mjs:1033` defaults to `headless: true`, and the workflow runner, case start, work dispatch, operation choice, loop, dry-bind and `bindWorkSeat` are all headless. No `headless: false` exists in `src/` or `bin/`. Only tests reach the path. `fgos dispatch decide` never calls `bind()`, so the PreToolUse hook is unaffected.
- **It was never used:** none of the three workspaces' `.fgos/assignments` holds a `pending-inline.json`, and none holds a binding with source `session-lead-inline`. forgentX has about 2,000 unit runs; the only mention is the text of a spec-review packet from 10-20.
- **What CFG reports:** two tests in `test/runner/execution/run.test.mjs` go red on `cfg/slice-c-c` because they need that path: "requesting inline work does not publish a settled unit before the result is recorded" and "summary I/O failure cannot replace the original execution error". That branch is not on origin, so SEAT has not run them.

### Options

| Option | What it means | Verdict |
|---|---|---|
| A. Remove the path | Delete the crate's `inline_lead`/`InlineLead`/`Mechanism::Inline`, the `inlineLeadOf` and inline branches in `bind.mjs`, the pending-inline branch and `recordInlineRun` in `run.mjs`, the `fgos run record` verb, the `inlineAllowed` posture field and the pending-inline status of the unit summary. Also remove: `operation-choice.mjs` `pendingInline` (`unit-pending-inline`); `unit-summary.mjs` (the pending-inline status and the `inline` summary field, observe metric); the `account-rotation.mjs` guard; the `only-inline-candidate-left` handling in `run.mjs`; the `explainSeat` guards; `inlineAllowed` in `seat-resolver.mjs` and `legacy-seat-read.mjs`, with its asserts in `solo`, `panel` and `run-verb` tests. Retire their tests, and update the specs (seat-binding, runner incl. line 3149, observe line 60) and the CHANGELOG. **Keep** `provenance.kind === 'inline'` (the ADR-006 inline Assignment, a different mechanism). | **Chosen.** It follows L10 and RUL104 (simpler, no new mechanism), matches what runs today, and loses no recorded use. |
| B. Make it reachable by widening the gate (for example "only `tierFallback` configured and nothing survived") | The lead would run a seat after supply or policy filtered every candidate | Rejected. It brings back exactly the bypass spec line 112 removed: the lead skips tier, cell and ceiling rules. |
| C. Make it reachable by explicit request (for example `--provider lead`) | A new door | Rejected now. It would be a new feature with no evidenced need (RUL104); it can be proposed separately if a real case appears. |
| D. Keep the code and give the two tests a config without `tierFallback` | The tests would prove a path production cannot reach | Rejected. Green must come from real behaviour. |

### Sequencing and blast radius

- Removing the path on main before Slice C changes nothing observable in any activated workspace on the owner machine, since all three already have `tierFallback` everywhere. Other machines' workspaces should be checked the same way before the land line is written. SEAT will ask on the board.
- **File collisions:** `src/runner/execution/run.mjs` is in COOK's Part A plan (phase 06, not started). `bin/fgos.mjs` is touched by `mailbox/v1-v3` and `work/es-cutover`, but in other verbs. Whoever lands second reviews the other's change.
- **Removed user-visible surface:** `fgos run record` (inline evidence recording). It has no recorded use. A CHANGELOG line will say so.

## Plan

1. Task 1: add the coverage proof to `golden_standard.rs`, then run `cargo test -p fgos-config`. Keep CFG's commit.
2. Task 2: remove the path (option A) in a separate commit on the same branch. Run `cargo test -p fgos-seat-binding` plus the affected Node test files through `scripts/run-tests.mjs` (it needs the addon build, which is heavy IO; SEAT asks DOC for a quiet window). Then run an independent review, since the change touches shared runner files.
3. Tell CFG on the board when the branch is ready for Slice C. The branch lands on main after the Work cutover allows writes on design-lap, or CFG merges it with Slice C.

## Open

- The claim that `configured` is never 0 relies on the base layer filling every missing tier of `tierFallback` key by key: the schema does not require every tier, and the crate takes an absent or empty tier as an empty list. That holds for Node's `mergeConfigDefaults`; Slice C's Rust merge must do the same (CFG to confirm). The headless fence makes the removal safe either way.
- Not checked: whether the Rust `config init` is already wired to `fgos init`. If it is, new projects see the standard change before Slice C.

- The `fgos run record` removal is reversible from history if a real need appears later.
- Other machines' workspaces must be confirmed to have `tierFallback` for all tiers before this lands ahead of Slice C. If any lacks it, land together with Slice C instead.
