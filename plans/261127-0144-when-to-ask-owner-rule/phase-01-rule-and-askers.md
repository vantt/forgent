# Phase 1: Write the rule and repoint the askers

Capability: `code:implement`.

## Inputs

- `plans/discussions/ds-jxoz3h2qgk-when-to-ask/DISCUSSION.md`: section 4 (WA-D1 to WA-D8) and section 6 (the design).
  The section 6 text is the source; the draft below is its English rendering and must not drift from it.
- `core/skills/_shared/decision-question.md`: the `## Approved frame (khung đã duyệt)` section being replaced.
- `core/instructions/decision-question-template.md`: the always-loaded one-liner.
- `test/docs/rul11-anchor-phrase.test.mjs` lines 48-53: the test that asserts the one-liner reaches `AGENTS.md`.
- `scripts/build-skill-wrappers.mjs` (`npm run build:skills`, also regenerates the `AGENTS.md` projection block and
  `.fgos/instructions/effective/`), `scripts/project-agents.mjs` (renders `core/agents/*.yaml` into
  `.claude/agents/*.md`), `scripts/git-one-door-scan.mjs` (census writer, read back by
  `test/setup/git-mutation-census.test.mjs`).
- `docs/platform/questions/spec.md` section 11 (decision history table).

## Files it may write

`core/skills/_shared/decision-question.md`, `core/instructions/decision-question-template.md`,
`core/skills/_shared/coordination-driver.md`, `core/skills/_shared/plan-contract.md`, `core/skills/fgos-lead/SKILL.md`,
`core/skills/fgos-supervisor/SKILL.md`, `core/skills/fgos-secretary/SKILL.md`,
`domains/coding/skills/fgos-coding-planning/references/approach-and-shape.md`, `core/agents/secretary.yaml`,
`core/agents/supervisor.yaml`, `core/agents/shaper.yaml`, `docs/platform/questions/spec.md`,
`test/docs/rul11-anchor-phrase.test.mjs`, and the generated surfaces `.claude/agents/{secretary,supervisor,shaper}.md`,
`AGENTS.md`, `.fgos/instructions/effective/**`, `packages/git/contracts/mutation-census.v1.json`, `.agents/skills/**`,
`plugins/fgOS/skills/**`, `.claude/skills/**` (regenerated only, never hand-edited).

## Steps

1. In `core/skills/_shared/decision-question.md`, replace the whole `## Approved frame (khung đã duyệt)` section
   (from its heading to the paragraph before "Open discovery questions") with the section below. Keep the five
   parts, the discovery paragraph and "Make it easy to answer" unchanged. In the last paragraph, change "When to ask
   and how to batch: AGENTS.md product priority #2." to "How to batch: AGENTS.md product priority #2; when to ask:
   the section above."

   ```markdown
   ## When to ask the owner (khi nào hỏi chủ) {#when-to-ask}

   **Principle.** The owner answers only questions that set or change a direction: a large change of function, of how
   things are organized, or a new rule set. An actionable task is never asked as "this is risky, shall I?". Find a safe,
   reversible way to do it, do it, and report it. Ask only when no such way exists, and then ask about the way.

   **The approved frame is the approved goal:** the outcome and acceptance criteria the owner approved, the standing
   constraints (trust boundaries), and the owner's orders and deadlines. A plan's file list (footprint) and size budget
   are the planner's chosen direction, not the owner's frame: widening them to meet the plan's own acceptance is
   actionable. A child item shares its parent's frame. The frame may be narrowed, never widened by the agent.

   ### Three questions before you propose or ask (every agent)

   1. **Is the intent clear?**
      - Which goal or milestone does this serve? Read the project's goal set when it exists.
      - Look for signs the owner thinks differently: he picked another option than the recommended one, or answered
        in free text; a new owner order points away from the written goal; your recommendations keep being overridden
        in one class of work.
      - On such a sign, ask once and briefly, "what intent is behind this?", in conversation or a discussion (not as an
        A/B question), and record the answer as a direction.
      - If the answer lives in the machine (code, logs, state, docs), look it up. Ask the owner only for what lives in
        his head: what he wants, what matters more.
   2. **Does the fastest direction deviate from the approved goal?**
      - Path test (phép thử con đường): list the ways to the goal and take the fastest. A piece that governs or unlocks
        others goes first. Known debt is written into the thing that will track it. Check the product priority order.
      - Deviation means: different from the approved outcome or acceptance; harming another running goal, another
        plan, or another project that uses fgOS; crossing a standing constraint (a trust boundary); missing an order or
        deadline the owner set. Never derive a higher intent of the owner to override a written outcome or acceptance;
        changing an approved goal is an owner question.
      - If unsure whether it deviates, measure cheaply (look it up, try it reversibly) instead of asking.
      - No deviation: do it. A deviation with another direction that avoids it: take that direction. A deviation no
        direction avoids: ask the owner, naming the best path and its deviation, in the five-part form, batched, and
        park only the blocked part while the rest moves on.
   3. **Is there a real reverse path?** (cost of waiting against cost of being wrong, giá phải chờ so với giá làm sai;
      a lens, not a forcing rule)
      - With a reverse path, act now; do not wait. Without one, make it first (seal the current state, including state
        outside the worktree such as the event store, config, release activation or a remote), never "just do it".
      - Splitting work into the smallest pieces that can run in parallel is always right. Splitting it into many
        releases that each keep the system stable and compatible is a human-speed habit; an agent that finishes in a
        few hours may take one big step, untidy inside, once its reverse path is worked out. Use this lens when the
        infrastructure at decision time allows it.

   **After deciding:** record the decision where the work lives (commit message, the plan's phase table, the discussion
   log). The secretary gathers these by plan and by file into her report when the owner returns; a pattern that repeats
   becomes a direction question. There is no separate report channel.

   ### Not owner questions

   - **Missing hands:** a confined head cannot run a host step. Raise it for the supervisor when it holds the grant
     (`git recover`, `worktree remove --delivered-to main`, `config patch`, landing plan files such as a footprint
     widen). Release activation stays the owner's by design. A step no session can run (today: full `npm test` and
     `cargo test --workspace` from a head) is an infrastructure gap, not a decision.
   - **Precedent:** turning a run of identical owner answers into a rule is the coach's job, not each agent's memory.

   ### Quick table

   | Do not ask: find a way, do it, report | Ask the owner |
   |---|---|
   | Widen a footprint to meet the plan's own acceptance | Change an approved outcome or acceptance, including taking on debt instead of finishing |
   | Clean up what is on main or can be rebuilt | Change organization or ownership; a new rule set; a large change of function (usually in a discussion) |
   | Recover through an existing door | Widen a standing trust boundary |
   | Re-confirm something already settled (cite its D-id) | Options that truly tie and depend on the owner's wish |
   | A technical trade-off with a clear best option | Unclear intent (the signs in question 1) |

   Mess inside the frame: Rule: rul11-tum-lum (in AGENTS.md; set in .fgos/instructions/effective/rules.json).
   Consolidating by building a new tool or engine is a decision question. Done means done inside the frame: a gate that
   cannot be met without changing an approved outcome or acceptance is a decision question; a gate that needs one more
   file is not. Progress is behaviour passing its declared check, not a pile of evidence; evidence that needs staging
   (breaking something on purpose, writing the verdict into the prompt) means the gate cannot be met, so ask.
   ```

2. In `core/instructions/decision-question-template.md`, replace the last sentence of the body ("Inside the approved
   frame (scope + budget set at approval) decide and report; about to leave it, stop and ask in this template.") with:
   "Ask the owner only to set or change a direction. Before asking, run the three questions of its section When to
   ask (is the intent clear; does the fastest direction deviate from the approved goal; is there a real reverse path).
   Inside the approved goal, decide, do it, and record it where the work lives." Keep the id and frontmatter.
3. In `test/docs/rul11-anchor-phrase.test.mjs`, the test "AGENTS.md carries the decision-question template law…":
   change the third assertion to the new sentence "Ask the owner only to set or change a direction." with a message
   naming the when-to-ask stop point. It stays the owning proof that the always-loaded layer carries the rule.
4. Repoint the askers:
   - `core/skills/fgos-lead/SKILL.md` land refusal table: `land-outside-footprint` becomes "the branch changed a path
     outside the footprint: fix the branch; if the path is needed to meet the plan's acceptance, raise a footprint widen
     for the supervisor (`fgos supervisor raise`), never the owner"; `land-recovery-required` becomes "raise it for the
     supervisor, which holds `fgos git recover`". The Never line "Decide outside the plan's scope and acceptance
     criteria: park the phase and say why." becomes "Change the plan's approved outcome or acceptance yourself: that is
     an owner question (`../_shared/decision-question.md#when-to-ask`); widening its files to meet them is not."
   - `core/skills/fgos-supervisor/SKILL.md`: the Never line "Decide outside the approved frame (…)" points at
     `core/skills/_shared/decision-question.md#when-to-ask`; the ask line adds "only after its three questions".
   - `core/skills/fgos-secretary/SKILL.md`: where she relays owner questions (line about the five-part form), add that
     she relays only questions that pass the when-to-ask rule and reports self-decisions gathered by plan and by file.
   - `core/skills/_shared/coordination-driver.md` line "Ask a person only when …": replace "a frame that must be
     widened" with "a change to the approved goal (`decision-question.md#when-to-ask`)".
   - `core/skills/_shared/plan-contract.md` section 3 item 6: "only what the owner alone can answer" gains "per
     `decision-question.md#when-to-ask`".
   - `domains/coding/skills/fgos-coding-planning/references/approach-and-shape.md` lines 39-41: the plan states its
     approved goal (outcome and acceptance) as the frame; `paths:` and `budget:` stay as the planner's estimate and are
     labelled as such, widened by the plan's own lead path, not by an owner question.
   - `core/agents/{secretary,supervisor,shaper}.yaml` `must_escalate` line "Anything outside the approved frame (scope
     and budget set at approval)" becomes "A change to an approved goal: outcome, acceptance, a standing constraint, or
     an owner order (decision-question.md, When to ask)".
5. In `docs/platform/questions/spec.md` section 11, add a short paragraph and rows: settled in
   `plans/discussions/ds-jxoz3h2qgk-when-to-ask/DISCUSSION.md` section 4, planned in
   `plans/261127-0144-when-to-ask-owner-rule/plan.md`; one row per WA-D1 to WA-D8 with its one-line decision and
   "where it lands: `core/skills/_shared/decision-question.md#when-to-ask`" (WA-D4 and WA-D8: "handed off").
6. Regenerate, never hand-edit: `npm run build:skills` (also refreshes the `AGENTS.md` block and
   `.fgos/instructions/effective/`; if it leaves them stale, run the context engine compile door named in plan
   `261125-2041-gather-fgos-rules-to-one-owner`); `node scripts/project-agents.mjs`; the census through
   `scripts/git-one-door-scan.mjs` (its write mode; see the script header).

## Verify

```bash
grep -c "which files/contracts may change" core/skills/_shared/decision-question.md          # 0
git grep -n -e "scope and budget set at approval" -e "scope + budget set at approval" -- core domains AGENTS.md .claude/agents   # nothing
grep -n "ask the owner to run" core/skills/fgos-lead/SKILL.md                                 # nothing
npm run build:skills && node scripts/project-agents.mjs && git status --porcelain -- .agents plugins .claude AGENTS.md .fgos/instructions   # empty once committed
node --test test/docs/rul11-anchor-phrase.test.mjs test/setup/git-mutation-census.test.mjs
```

Pass: the three greps print as stated, the rebuild leaves no diff, and both tests are green.

## Rollback

`git revert` the phase commit: it holds the new section, every pointer edit and the regenerated surfaces together.
