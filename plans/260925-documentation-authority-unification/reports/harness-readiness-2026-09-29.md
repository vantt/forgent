# Harness readiness: running Phase 4 through fgOS coordination/dispatch with Observe

Date: 2026-09-29. Scope: can the remaining phases (starting with Phase 4, *Freeze the minimum constitution and migration method*) be driven through fgOS `coordination` + `dispatch`, and can the Observe component (`fgos metrics` / `fgos friction`, plan `plans/260929-1501-metrics-friction-rust-native/` on `main`) measure the run?

## 1. Evidence from this track's own previous coordination runs

Phase 2 of this plan (legacy "Phase 01") was driven through `core.coordination-protocol.standalone-master-coordination-loop` in six sessions (`.fgos/coordination/sessions/documentation-authority-unification--phase-01*` in the main checkout):

| Session | Runs (role/executor: status(verdict) duration) |
|---|---|
| `--phase-01` | doer/gemini done(pass) 30m · reviewer/gemini done(pass) 3m · red-team/xai failed(findings) 6m · fixer/gemini 25m · reviewer/gemini 12m · red-team/xai findings 7m · fixer/gemini 22m · reviewer/gemini **no-evidence** 3m · red-team/xai findings 9m · fixer/gemini 18m |
| `--phase-01-final` | doer/gemini 18m · reviewer/gemini pass 3m · red-team/xai findings 11m · fixer/gemini 4m · reviewer/gemini pass 1m · red-team/xai pass 4m |
| `--phase-01-review-fix` | doer/gemini 18m · reviewer/gemini **no-evidence** 3m · red-team/xai findings 7m · fixer/gemini 13m · reviewer/gemini pass 9m · red-team/xai findings 7m · fixer/gemini 5m |
| `--phase-01-repro-fix`, `-repro-fix-2`, `-test-fixture-fix` | single doer runs (0–30m) |

What this shows:

1. **The reviewer was effectively a rubber stamp.** It ran on the same provider as the doer (gemini) and passed in 1–3 minutes, while the red-team (xai) found issues in almost every round. The protocol declares `distinctProviderFrom: preferred`, which was not enforced.
2. **Red-team findings are recorded as `status: failed`.** That is the verdict/infra conflation that the RunResult plan (`plans/260929-1703-runresult-classification-single-path/`, decision D1-A/D2-A) removes. Until that lands, xai looks like an unreliable executor in raw status counts, when in fact it is the only role producing real signal.
3. **Sessions were never closed.** None of the six reached a terminal status. Rounds continued in new sessions instead of within one, so per-phase measurement is fragmented. `fgos doctor` now has a `coordination-sessions-closed` check (commit `4358e88c0`).
4. Legacy Phase 02 (now Phase 3) was not run through coordination.

## 2. Role and executor configuration (**superseded by §5 Revision 2**)

The protocol hard-codes `code:implement` (doer, fixer) and `code:review` (reviewer, red-team). This track is mostly documentation, with some gate scripts. The config (`.fgos/config.json` `runner.capabilities`) has better-fitting capabilities: `execute` (prefer `claude`) and `review` (non-code artifact review, read-only confinement), but the protocol does not reference them.

The protocol does **not** need to change: `coordination run` with a declared-protocol request accepts per-actor pins `actors[].{executor, invocation, tier, persona, fallbackExecutors}` (`src/verbs/coordination/run.mjs:111-140`), and pins take precedence over capability preferences.

**Proposed actor pins for Phase 4:**

| Role | Executor | Why |
|---|---|---|
| doer | `claude` (strong tier) | Constitution/migration-method design needs a strong model; gemini-flash was the previous doer |
| reviewer | `openai` (`codex-cli-bwrap`, read-only) | Must be a different provider from the doer; read-only confinement fits |
| red-team | `xai` | Proven to find real issues on this track |
| fixer | `claude` | Same provider as doer, keeps the fix context consistent |

Open point: the protocol's `code:*` labels remain semantically wrong for docs work (routing still works through the pins). A proper fix is a follow-up outside this track: capability parameters per session, or doc-flavoured capabilities in the protocol.

## 3. Can Observe measure it?

**Observe status (2026-09-29 evening):** being implemented on `main`; the crate exists but is uncommitted and not staged. Nothing is usable through the `fgos` shim until **M1** (F1 + F3 + stage).

| What we want to know | Observe source | Ready? |
|---|---|---|
| Case identity, window, manual interventions, verdict | `metrics case open/close` (store in the main checkout's `.fgos/observe/`) | After M1 |
| Runs per role/executor, verdict vs infra, duration | `run-result` source (F2) | After M2. Verdict/infra split is exact only after RunResult plan D2-A; before that, `classification` raw groups |
| Rounds per session, first-pass review | `coordination` source (F2/F4) | After M2. Needs the session to be **closed**, otherwise #3 is empty |
| Tokens of Lead + dispatched runs | `claude-transcripts` source | **Gap**, see below |
| Tokens of gemini/xai/openai runs | RunResult `usage` (RunResult plan, phase 4) | Not yet. xai runs via pi report usage, which is parseable |
| Friction | `fgos friction` | Empty for this experiment. This track is not a Work item, and substrate producers (the Producer draft plan) are not built yet |

**Gap found:** the `claude-transcripts` source only accepts transcript dirs equal to the project encoding or starting with `<enc>--claude-worktrees-` (Observe plan, F2 red-team rule). This track's worktree lives at `~/projects/forgentX-phase00-documentation-authority-unification`, whose transcript dir is `-home-vantt-projects-forgentX-phase00-...`. It is **dropped at the directory level**, even though the per-record `cwd` filter would accept it (it is in `git worktree list`). Fix: select transcript dirs by the encoding of every path in `git worktree list`, then keep the `cwd` filter. This is a change to the Observe plan (F2).

## 4. Preconditions before starting Phase 4 this way

1. **Authorization:** plan §5 requires an explicit human authorization per phase. Phase 4 is currently `not-authorized`.
2. **Observe M1 reached** (case journal on the shim), so the case can be opened before the first dispatch. Everything else is computed retroactively later.
3. **Observe F2 transcript fix** for worktrees outside `.claude/worktrees`.
4. **One session per phase, closed explicitly** at the end (and after each authorized re-run), so rounds and first-pass are measurable.
5. Open the case with `--sessions <coordinationId>` so the scorecard binds to the session rather than only the time window.

## 5. Revision 2 (2026-09-29, late): cost-aware harness, correct capabilities

Section 2 above (master loop with actor pins) is **withdrawn**: it runs doer + reviewer + red-team + fixer every round with `code:*` capabilities, which is both wrong for documentation and too expensive. A re-check of what the current fgOS mechanisms actually allow:

| Mechanism | Writes files? | Capability | Seen by Observe? | Fit for this track |
|---|---|---|---|---|
| Declared protocol `standalone-master-coordination-loop` | yes (doer/fixer) | hard-coded `code:implement` / `code:review` | yes | **No** for docs: wrong capability, 4 runs per round. Only for a substantial code slice |
| `dispatch execute --contract` | **no**: `mutation: mutating` is rejected (`src/runner/dispatch/execution-contract.mjs:12`) | from contract | yes (assignment runs) | Read-only tasks only |
| `dispatch execute <executor>` (plain door) | yes | `--for <capability>` | **no**: writes `.fgos/dispatch-runs/`, which Observe does not read | No (breaks "Observe usable") |
| `coordination run`, `kind: "agent-led"` | no (`primaryRole` ∈ `reviewer`, `researcher`, `advisor`) | `task.capabilities` passed through (`src/verbs/coordination/run.mjs:671`) | yes (session + assignment runs) | **Yes, for review/research** with capability `review` (non-code, read-only confinement) |
| Declared read-only protocols: `group-thinking-rfc-review-lite` (proposer + 2 objectors), `declared-consult`, `independent-research-fan-out-fan-in` | no | none declared (actor pins) | yes | **Yes, for decision gates** (one-off multi-view objection instead of a red-team every round) |

**Consequence:** in today's fgOS there is **no path that dispatches a mutating non-code worker and is also visible to Observe**. Documentation authoring therefore stays with the **Lead** (the session working in this worktree, via `ak:cook` or directly). fgOS coordination is used where it is cheap and correct: independent review and decision objection.

### Proposed harness per phase type

| Phase type | Authoring | Independent check | Budget |
|---|---|---|---|
| **Doc** (default) | Lead inline | 1 `agent-led` session, `primaryRole: reviewer`, `task.capabilities: ["review"]`, `mutation: read-only`, actor pinned to a provider **different from the Lead** (e.g. `openai`, since `review` has no `prefer` and would otherwise fall back to the default `claude`). If findings: Lead fixes, then **one** re-review | ≤ 2 review runs per phase |
| **Decision** (method freeze, cutover approval) | Lead drafts the decision record | Doc review above **plus one** `group-thinking-rfc-review-lite` session (proposer + 2 objectors, read-only) on the decision itself | +1 session, once |
| **Code slice** (gate scripts, resolver, checks) | Lead inline | 1 `agent-led` reviewer session with `task.capabilities: ["code:review"]` (the correct capability for code) | ≤ 2 review runs |
| Substantial code (only if a phase turns out code-heavy) | master loop is acceptable **only** for that slice, with `code:*` | as protocol | per protocol, bounded by `aggregateBounds.maxRounds` |

Compare with the previous Phase 2 run: 3 master-loop rounds ≈ 10 runs and ≈ 150 minutes of worker time in one session, plus 4 extra sessions.

### Observe usage (so the run is measured from the first step)

- One Observe case per phase: `fgos metrics case open doc-authority-p<N> --harness fgos --task "<phase title>"` **before** starting. Close it with `--interventions <n> --verdict <…> --sessions <ids of the review/decision sessions>`.
- Close every coordination session explicitly (`coordination close`); a doctor check now flags sessions that are never closed.
- What Observe will show: Lead tokens (transcripts), review runs with verdict/infra split, session duration and assignment count, manual interventions, commits in the case window.
- Known limits:
  1. Lead tokens need the transcript fix for worktrees outside `.claude/worktrees` (follow-up of the Observe plan).
  2. The verdict/infra split is exact only after the RunResult plan (D2-A).
  3. Observe #3 "first-pass" is defined for the master loop (fixer presence). For agent-led review sessions, read the verdict of the review runs instead.
  4. Friction stays empty: this track is not a Work item, and no substrate producers exist yet.

### Open fgOS gap (not in this track)

A mutating, **non-code**, Observe-visible dispatch path does not exist. If dispatching documentation authoring to a worker is wanted later, it needs an fgOS change (for example, allow the `execute` capability as a declared-protocol doer in a doc-flavoured protocol). That belongs in a separate fgOS plan, not in this track.
