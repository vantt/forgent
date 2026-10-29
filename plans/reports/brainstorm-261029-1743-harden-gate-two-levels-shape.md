# Human gates in two levels: proposed shape

- **Lead:** lead:HARDEN (`claude-p74h@fg-server2`), 2026-10-29.
- **Owner ask (17:40):** move `gate-bypass` to Rust if possible. Longer term, redesign the gate in two levels. The low level runs where the agent manages the gate and really decides. The upper level (Work, the information wrapper that talks to people) stores the questions and what was approved, for display only.
- **Facts:** [research-261029-1740-harden-gate-two-levels-facts.md](research-261029-1740-harden-gate-two-levels-facts.md).
- **Status:** proposal only. Nothing is built. Three owner questions are at the end.

## What is wrong today

1. **The skill gates are prose.**
   - `fgos gate-check` only answers yes or no.
   - The skill text tells the agent to obey that answer, ask the person, then write `gate-approve`.
   - No verb refuses the next step when that did not happen.
   - The `actor: human|bypass` field is whatever the agent typed.
2. **The record is the authority, which is what the owner does not want.**
   - `src/intake/plan.mjs:723-744` releases its parks by reading `view.gates[id].approved` and comparing ask text.
   - `discovery.mjs:354` takes the verify command from the `contextApprove` record.
3. **"Approved" has four shapes:**
   - `gates[id].approved`;
   - `gates[id].<gate>.actor`;
   - the workflow's `gate.answer`;
   - the runner's `awaiting-approval → delivered`.

   Only the workflow one is bound to the content it approved (a subject digest).
4. **Policy is read twice.**
   - The bypass level is read by Node `readGateBypassLevel` and by Rust `read_gate_bypass_level`, each with the legacy `.fgos/gate-bypass.json` fallback.
   - The risk-keyword floor is used three ways: gate-bypass, Iron Law, and fanout prose.
5. **Questions asked in chat leave no pending record**, so the dashboard cannot show them.

## Proposed shape

### Low level: one gate door, beside the action

One Rust component owns every human gate. It has three operations.

- **`decide(subject)`** answers `auto`, `ask` or `deny`.
  - The subject is the content to approve, named by a digest, plus its kind and size.
  - The policy is the current one moved into Rust and read once: the bypass level, the risk-keyword floor, no open items, and reversibility.
  - It is monotone toward asking.
- **`grant(subject digest, answer, source)`** writes a grant.
  - It accepts an answer only from a channel the agent cannot forge:
    - the host-side hook that sees the real result of `AskUserQuestion` (a `PostToolUse` row beside today's `decision-question` row);
    - the dashboard;
    - `fgos answer` from a session that is not an agent session (identity, decision 51).
  - An `auto` decision writes a grant with source `policy`.
- **`require(subject digest)`** is called by the door that performs the guarded step: discover advance, materialize, merge or approve, and the workflow's writing activity.
  - It refuses when no grant matches the digest.
  - A changed subject means a new digest, so an old approval never carries over.

The grant lives with the action (the run or case it belongs to), like today's workflow `gate-answers/`. The workflow consent guard (`case-admission.mjs` `human-consent`, digest-bound) is already this shape. The proposal moves it down and makes every gate use it, rather than adding a new mechanism beside it (L10).

### Upper level: Work shows, never decides

- The gate door emits `gate.asked`, `gate.granted` and `gate.auto` events. Work folds them into the item view, so the dashboard shows pending questions and the approval history.
- No code reads the Work view to allow or refuse a step.
- `plan.mjs` and `discovery.mjs` move to `require` and to the grant's own data.

### What goes away (L10)

- `canAutoApprove` and `canAutoApproveMergedGate` become one `decide`.
- The Node `readGateBypassLevel`, and the legacy-node twin of the `gate-bypass` verb.
- The `gate-approve` verb and its self-declared `actor`.
- The `gates[id].approved` and ask-text match in `plan.mjs`.
- The retired `planApprove` read.
- The prose steps in `gate-mechanics.md` that ask the agent to self-enforce.
- The legacy `.fgos/gate-bypass.json` fallback: an owner choice, since it changes how a user configures the level.

## Placement and order

- The gate door sits below Work and Workflow and above Identity and Config. Its policy reads config, and its human check reads identity.
- This is a new shared component plus a contract change across Work, Workflow, the runner and the coding skills, so it is not a HARDEN fix under RUL104. It belongs with the Work batch after T5, as its own plan.
- A step that fits HARDEN now: move the level reader and `gate-check` into Rust as the first piece of `decide`, deleting the Node twins. This is the owner's "move gate-bypass to Rust". It is still a Work-owned file set, so it waits for WORK's agreement or for the Work batch.

## Risk from facts, not keywords (owner, 18:30)

The owner reports that keyword gates are inaccurate: they block the wrong things and miss others.

The evidence agrees:
- tsk-224 measured an 83.6% false trigger on plan prose and narrowed the haystack. It kept the word list.
- One list (`src/intake/risk-keywords.mjs`, 34 EN/VI words) gates five places: submission tiering (`classify.mjs`), Iron Law (`iron-law.mjs`), the heavy-risk park (`plan.mjs`), gate-bypass, and the fanout prose.
- A word in a description says what someone wrote about the work, not what the work does. "Delete" in "delete a dead helper" blocks. A schema change described as "tidy the store" passes.

Proposal: `decide` reads facts of the action and never words.

| Fact | Where it comes from | Available |
|---|---|---|
| Which paths it writes | the Unit's declared `writes` before work; the real diff after | both |
| Whether a written path is in a risky class (migrations, schema, CI, credentials, public contracts, the Git and lock cores) | one path-class table in config, project over global | both |
| Whether it deletes tracked files or data | the diff | after |
| Whether it reaches outside the worktree (network, push, an external API, writes outside the checkout) | the Unit's capability and confinement facts | both |
| How big it is and how far it reaches | diff size; callers from impact analysis when that tool is present | after |

Rules:
- The strongest check runs on the real diff, at merge or approve, where facts are certain.
- Gates before any work exists (context, plan) use the declared `writes` and capability.
- The agent's own risk judgment may raise a decision to `ask`, never lower it, as tsk-224 already does for reversibility.
- The keyword list is retired from every gate, along with the fanout prose that copies it. A description word may still be shown to the human as a hint, never as a block.
- Iron Law RUL35 uses the same list. Moving it is a separate supersede of that rule, so it is an owner question.

## Owner answer and HARDEN's challenge (2026-10-30 03:18)

The owner chose 1a, 2a, 3a and 4a, then asked why HARDEN did not challenge the two-level split. HARDEN accepted the split too quickly. Five points weaken the shape as written above and change it.

1. **Two stores drift.** A grant kept "beside the action" and a copy in Work are two records of one fact. If the projection is late or lost, the dashboard shows a question as pending after it was approved, or the reverse.
   - Change: one log, two roles. The gate door is the only writer of gate events, and Work is a pure, rebuildable projection of them. The split is about who may decide from the record, not about where the record lives.
2. **Approvals cross machines and outlive agents.** The owner answers from the dashboard on another machine, often hours later, after the asking agent has compacted or ended. A grant kept only with a local run would not reach the agent or would die with it.
   - Change: gate events ride the Event Store that already syncs between machines. The pending question is durable, and a new session for the same work finds the grant.
3. **A byte digest asks too often.** A rebase, a typo fix or a reworded plan changes the digest and would ask the human again. That goes against priority 2 (release the human).
   - Change: a grant binds to an approved frame: the scope (paths and capability), the budget, and the risk class, as the decision-question template already defines. A change inside the frame keeps the grant, and a change outside it asks again. An exact digest is used only where the content is final, such as merge consent.
4. **The hook channel is Claude-only.** Codex and agy have no `AskUserQuestion` result hook, and a person may answer in plain chat text.
   - Change: the hook is one channel among three. For other CLIs the answer goes through the dashboard or a human session's CLI. A plain-chat answer is not a grant, and the agent re-asks through a channel that is one.
5. **Declared writes can be incomplete before work.** The check before work may say `auto`, and the real diff may then touch a risky path.
   - Change: the merge-time check on the real diff stays mandatory. It may ask late, after work is done. That costs rework, never safety.

## Owner questions

1. **Where the approval truth lives.**
   - (a) A grant beside the action, bound to a digest; Work is display only. Recommended, and it matches the owner's two levels.
   - (b) Keep the Work log as the truth and only tidy it.
2. **How a human answer is proven.**
   - (a) Accept only host-side channels: the hook on the real `AskUserQuestion` result, the dashboard, and the CLI from a non-agent session. Recommended. It is the only option where the agent cannot approve itself.
   - (b) Keep the self-declared answer.
3. **When.**
   - (a) Write the plan now. Build it with the Work batch after T5. The Rust move of the level reader and `gate-check` goes first. Recommended.
   - (b) Start the Rust move now in agreement with WORK, and design the rest later.
4. **What risk is decided from.**
   - (a) Facts of the action: written paths against one path-class table, deletions, reach outside the worktree, and size. Retire the keyword list from every gate, Iron Law included, by superseding RUL35. Recommended.
   - (b) The same facts for the gates, but Iron Law keeps its words.
   - (c) Keep the keywords and tune the list.
