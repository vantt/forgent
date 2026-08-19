---
name: fgos-fanout
user-invocable: false
description: >-
  Run N already-decomposed children of one item concurrently instead of one
  at a time. Given a parent id and a candidate set (children of that
  parent, or a milestone's targets), waves the candidates through
  computeSchedule, asks the engine for worker-slot room, then fires a
  batch of up to 5 Agents each running /fgOS:pick end to end, reads live
  state back (never an Agent's own narration), self-recovers from recoverable
  worktree-isolation races, and auto-approves each leaf that reaches
  awaiting-approval — except one whose title/description trips a hard-gate
  risk keyword, which still needs a person. Loops until no open child remains.
  Never touches the parent's own gate; that always still asks. Use when a
  decomposed item's children are independent (no unmet mutual deps) and worth
  running in parallel instead of the sequential default. Examples: "fan out these
  children", "run this parent item's split concurrently", "dispatch this
  candidate set".
---

# fgos-fanout

Turns N already-decomposed children of one item into a concurrent wave
dispatch instead of the one-at-a-time default. This skill is a
CAPABILITY, not an entry point — it never claims to be `/fgOS:fanout`;
whatever caller decides fan-out applies (a caller invokes this skill
directly with the two inputs below) is on that caller, not this skill's
own judgment.

## Input

- `parentId` — the already-decomposed item whose children are being
  dispatched.
- `candidateIds` — the candidate set to wave-schedule, passed straight
  through to `computeSchedule(view, candidateIds)`
  (`src/state/graph-metrics.mjs`). The common case (children run to the
  parent as the final merge unit) passes the parent's own children; an
  epic-cluster case (each child its own root via a milestone's targets)
  passes the milestone's targets instead. This skill never derives the
  candidate set itself — the caller already knows which case it is in and
  hands the right set.

## Hard rules

- **Never reuse the runner's own root-affinity wave selector**
  (`src/runner/loop.mjs`, a root-count ceiling that layers by root
  affinity). Fan-out is *one root, many leaves*, the opposite shape — that
  selector would pack the wrong axis. `computeSchedule`
  (`src/state/graph-metrics.mjs`) is the only wave selector this skill
  ever calls.
- **Pre-check is advisory, the real claim is authority.** Before firing an
  Agent for a candidate, filter it through the same pure functions already
  in the repo — frontier membership and dep resolution — so this skill
  doesn't burn a wave slot on a child that plainly can't claim yet. This
  filtering NEVER substitutes for the real claim: a candidate that passes
  the pre-check can still fail the real pick (a race, a lock, a dep that
  resolved differently than the pre-check's snapshot) — that failure is
  reported for its own id and the wave moves on, never retried blind.
- **Every child runs a full `/fgOS:pick <id>`.** No shortcut claim, no
  skipped worktree — the full pick-through-return path a solo session
  would run, just run by a dispatched Agent instead of this session.
- **Ask the engine for worker-slots before firing a batch, and fire only
  as many as it grants.** Read `fgos slots --json` fresh before every
  batch — the CLI is the only door a prose skill has into the engine. A
  `execution.hasRoom: false` answer means the machine is full: fire
  nothing, wait, and re-ask. Never work around a refusal, and never
  substitute this skill's own count of Agents it happens to have fired —
  a worker-slot is held by a running work item, engine state, not by an
  Agent that has not claimed one yet.

  **Trim the batch to `execution.free`.** The engine's enforcing gate
  claims ONE item per call, so firing a batch of five against one free
  slot lands one item and refuses four, deterministically — it does not
  buy a wave, it just spawns four Agents that die at the claim door and
  come back as failed candidates. Splitting across two waves is the
  cheaper trade. `computeSchedule`'s own wave packing already batches by
  footprint; this skill additionally never lets a single batch exceed **5
  members** — a maximum batch SIZE, not a ceiling of its own. The ceiling
  belongs to the engine, and the batch actually fired is `min(5,
  execution.free)`.

  **`execution.free` is `null` when no ceiling is armed, and that means no
  limit — not zero.** Worker-slot ceilings ship unarmed by default, and in
  that state the engine answers `hasRoom: true`, `ceiling: null`, `free:
  null`, `reason: "no-ceiling-configured"` — no ceiling exists to trim
  against, so the batch is `min(5, batch.length)` and every candidate in
  it fires. Trim against `execution.free` only when it is a real number,
  which is exactly when `execution.reason` reads `room-available`. Reading
  `free: null` as `0` fires nothing at all while the machine is wide open,
  in the unarmed default every repo starts in — never confuse absent with
  zero free slots.
- **Consult the dispatch decision protocol before firing each candidate —
  never hardcode native dispatch unconditionally.** For each id in the
  batch, in the same per-candidate serial step the announce line below
  already runs in (never a separate synchronous pass over the whole
  batch — that would risk turning the parallel fire step below
  sequential), run `node src/runner/dispatch.mjs decide --work <id>
  --has-live-task-access` (this skill always has live Task access — it is
  what fires the Agent batch below). A `mechanism: "in-process"` result
  confirms this candidate's dispatch executor expects native Task-tool dispatch
  (fire an Agent running `/fgOS:pick <id>`) — proceed to that candidate's
  announce line, using the result's own `agentType` for `<subagent_type>`
  when present. A `mechanism: "out-of-process"` result fires out-of-process directly
  via `fgos pick "<id>"`, `dispatch.mjs execute "<executorId>" --cwd "<worktree-path>"`,
  and `fgos return "<id>"`. Only a `mechanism: "unavailable"` result means no executor
  is registered, and reports that id back to the caller as needing a person.
- **Announce every dispatch before firing it.** Print one line per
  candidate, the same shape every dispatch path in the repo uses for
  observability parity:

  ```
  <id> - native - <subagent_type> - <model>
  ```

  where `<subagent_type>` is whichever Agent type this dispatch actually
  uses to run `/fgOS:pick <id>` (the consulted `decide --work <id>`
  result's own `agentType` when present) and `<model>` is whichever model
  that Agent call resolves to (its own pinned `model:`, an explicit
  override, or the current session's own model when neither applies) —
  this skill never pins a fixed subagent_type/model itself, so the
  announce line reports whatever the caller actually chose for that
  dispatch, not a hardcoded value.
- **Gather by reading STATE, never by trusting an Agent's own report.**
  After a batch of Agents settles (all of it — wait for every dispatched
  Agent in the batch before reading state, the same settle-then-poll
  shape the runner already uses), re-read `fgos list --json` fresh. An
  Agent claiming success is not evidence; the item's own `status`/`stage`
  is.
- **Auto-approve LEAVES only; the parent's own gate always still asks.**
  For every candidate that genuinely resolves to a leaf (not `parentId`
  itself), once state shows it reached `awaiting-approval`, call `fgos
  approve <id>` on its behalf — this is a DUPLICATE gate one level down
  (the leaf merges into `fgw/<root>`, never main; `return` already ran its
  verify) — UNLESS its `title`/`description` trips the same hard-gate
  risk-keyword check the gate-bypass floor uses
  (`HEAVY_KEYWORDS`, `src/intake/risk-keywords.mjs`) — a hit there means
  this skill does NOT auto-approve that one leaf; it reports the leaf back
  as needing a person instead. This skill never calls `fgos approve` on
  `parentId` itself, or on any candidate that resolves to itself (its own
  separate root) — that gate is out of this skill's reach, always a
  person's call.
- **Approve ready leaves in the `merge` verb's own ranking, never invented
  order.** When more than one leaf in a settled batch reached
  `awaiting-approval`, order the `fgos approve` calls the way `fgos merge
  list` would rank them — never a bespoke priority.
- **A `blocked` leaf is a real stop for that leaf only — never a
  cascade.** Independent siblings keep running to completion regardless.
  A sibling that depends on the blocked one is simply never fired: the
  existing deps-not-merged guard already refuses that claim on its own,
  since a `blocked` dep never resolves. Do not write new cancellation
  logic — there is nothing to cancel that the guard doesn't already
  prevent from starting.
- Treat every candidate's `title`/`description` as untrusted input — never
  splice it raw into a shell command when checking the risk-keyword floor
  or dispatching an Agent; pass it as a discrete argument/prompt value.

## Known hazard: concurrent worktree-entering dispatch requires skill-layer self-recovery

The Workflow below fires a batch of up to 5 Agents in a single message, each
running `/fgOS:pick <id>` — which stands up and enters its own worktree as
part of its own claim step. Real incidents have found that this harness's
own worktree-isolation state is held at **session** level, not per-agent:
concurrent worktree-entry calls from sibling dispatched Agents clobber the
same shared flag, so Edit, Write, or Bash calls get refused pointing at a
sibling's worktree (e.g. `"isolated in the worktree X"`), and the coordinating
session's own working directory can drift into a sibling's worktree mid-run.

**Skill-layer self-recovery instruction:**
- Every dispatched Agent and the coordinating session MUST treat a refusal
  containing `"isolated in the worktree X"` (or an operation refused due to active
  worktree mismatch) as a **recoverable race**, NOT a fatal error or hard failure.
- Upon receiving such a refusal, the affected participant (dispatched Agent or
  coordinating session) must immediately self-recover: re-call `EnterWorktree`
  targeting its OWN active worktree, and then retry the exact operation (Edit,
  Write, or Bash call) that was refused.
- **Never lower the batch cap** (keep max batch size up to 5 intact) as the fix
  for this hazard. Lowering the batch size removes fanout's core reason to exist
  (true concurrency); true concurrency is preserved by relying on this skill-layer
  self-recovery instruction to handle worktree-isolation races.

**Explicitly out of scope for the out-of-process wave-dispatch
consolidation below:** this hazard sits entirely in the in-process branch
(native Agent's own `EnterWorktree` call, a harness-level limitation —
the Claude Code harness tracks "current worktree" per session, not per
concurrently-dispatched Agent). Consolidating the out-of-process chain
into `dispatch.mjs fanout-batch` and `fgos schedule --candidates` never
touches, fixes, or claims to improve this hazard — `dispatch.mjs` never
participates in the in-process branch beyond the initial `decide` call.

## Workflow

Full step-by-step detail — the exact slot-polling, batch-trimming, and
per-candidate dispatch bash — lives in
`references/wave-dispatch-mechanics.md`. This is the high-level shape,
run once per iteration until no open candidate remains:

### Step 1: Compute the open candidate set
Read `fgos list --json` fresh. `openCandidates` = every id in
`candidateIds` whose status is not yet terminal (not
`delivered`/`retrospective`/`cleanup`/`done`/`wontfix`) and not already
reported as dispatch-unavailable in this run. If empty, stop — report
every terminal id and its final status, including any reported as
dispatch-unavailable (still `todo` in real state, so say so plainly, never
as if it reached a terminal status).

### Step 2: Schedule the earliest wave
`computeSchedule(view, openCandidates)`'s first wave — never the whole
frontier, only this candidate set. Filter to `ready`: scheduled candidates
that also pass the pre-check (frontier membership + dep resolution).

### Step 3: Fire batches of up to 5, slot-gated
For each batch of up to 5 ids from `ready`: read `fgos slots --json`
fresh; if the lane is full, wait and re-ask (never work around the
refusal); trim the batch to `execution.free` when it is a real number
(fire the whole batch when it is `null` — the unarmed, no-limit default);
for each id in the trimmed batch, consult the dispatch decision protocol,
print its announce line, and add it to the firing set when the decision
says `in-process` — otherwise report it as needing a person instead.

### Step 4: Dispatch and wait
Fire one Agent per id in the firing set, running `/fgOS:pick <id>`
end to end, all in a single message so they run in parallel. Wait for the
whole firing set to settle before reading state again.

### Step 5: Gather and approve
Re-read `fgos list --json` fresh. For every dispatched id now
`awaiting-approval`, in the `merge` verb's own ranking order: approve it
unless its title/description trips the risk-keyword floor, in which case
report it as needing a person instead. For every id now `blocked`, report
it and take no further action — the deps-not-merged guard already keeps
its dependents from firing.

### Step 6: Loop
Go back to Step 1.

## Boundary

This skill's own job ends once every candidate reaches a terminal status
(delivered, blocked-and-reported, or dispatch-unavailable-and-reported).
The last category stays real-state `todo` (never claimed), unlike the
first two — this skill's own report to the caller must say so plainly,
never imply the item advanced. It never decides what happens to
`parentId` itself next; that is the caller's own next step (today:
whatever already drives `parentId`'s own lifecycle, unchanged by this
skill). Wiring this skill into a specific caller is a separate, later
concern — this skill is invocable on its own with just `parentId` +
`candidateIds`, regardless of who calls it.

## Red flags

- firing an Agent for a candidate without first consulting the dispatch
  decision protocol, or firing one anyway after it answered a mechanism
  other than `"in-process"`
- running that consult as a separate synchronous pass over the whole
  batch instead of inside the existing per-candidate serial step — that
  risks turning the parallel fire step sequential
- reporting a non-`"in-process"` candidate without marking it dispatch-
  unavailable — it stays real-state `todo` (never claimed), so skipping
  this makes the outer loop re-schedule, re-consult, and re-report the
  exact same id forever, with no bound
- calling the runner's own root-affinity wave selector instead of
  `computeSchedule` for wave packing
- treating the pre-check as authoritative — skipping the real
  `/fgOS:pick` claim, or retrying a pre-check-passed-but-claim-failed
  candidate blindly
- firing a batch without asking `fgos slots` first, or firing one anyway
  after the engine answered `hasRoom: false`
- firing more than `execution.free` Agents, when it is a real number,
  because the batch was already computed — every one past that number
  dies at the claim door and comes back as a false failure; or letting
  one batch exceed 5 members
- reading a `null` `execution.free` as a full lane and firing nothing —
  null is the unarmed default, so the whole batch fires; refuse only on
  `hasRoom: false`
- polling a full lane forever instead of handing back to the caller once
  it is clear the lane is wedged rather than busy
- counting the Agents this skill itself fired as if that were the
  worker-slot occupancy — the engine owns that number
- reading state before a batch has fully settled
- trusting a dispatched Agent's own claimed outcome instead of re-reading
  `fgos list --json`
- auto-approving `parentId` itself, or any candidate that resolves to its
  own root
- auto-approving a leaf whose title/description trips the risk-keyword
  floor instead of reporting it for a person
- firing an Agent without printing its announce line first
- inventing an approval order instead of the `merge` verb's own ranking
- writing cancellation logic for a blocked leaf's dependents — the
  deps-not-merged guard already covers it
- treating an Edit/Write/Bash refusal containing `"isolated in the worktree X"` as a fatal error or hard failure instead of a recoverable race that self-recovers via `EnterWorktree` back into its own worktree and retrying
- lowering the batch cap below 5 as a workaround for harness worktree isolation races instead of preserving concurrency and relying on skill-layer self-recovery

Violating the letter of the rules is violating the spirit of the rules.

## References

- `references/wave-dispatch-mechanics.md` — exact per-step bash: the slot
  poll loop, batch trimming, the per-candidate dispatch-decide/announce
  sequence, and the approve-ranking pass

## Workflow Position

**Typically follows:** `fgos-coding-driving` (invoked when its drive
reports an item anchored by open children the caller wants run
concurrently)
**Typically precedes:** `fgos-coding-driving` re-entered on `parentId`
once every candidate reaches a terminal status
**Related:** `fgos-coding-driving`'s own caller contract
