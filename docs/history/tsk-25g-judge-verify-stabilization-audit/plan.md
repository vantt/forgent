# plan.md: tsk-25g — one more stabilization attempt + decompose-path parity

## Lane

**standard** (phased plan). No `fgos-routing` Orient step ran this session
(item entered via `/fgOS:pick` → `fgos-coding-driving` directly, not a
routing sweep) — lane derived here instead, from CONTEXT.md's own locked
scope: 2 independent-but-related changes across `discovery.mjs`,
`decompose.mjs`, `judge-executor.mjs`, `replay.mjs`, `command-registry.mjs`
(5 files); one outcome (D1) is genuinely bimodal, not a known-good
implementation; blast radius on `judgeVerifySemanticCorrectness` is `HIGH`
(GitNexus, confirmed in CONTEXT.md) — every future item through
`resolveDiscovery`/`resolveDecompose` is affected. This clears `small`
(more than one proof point needed, real uncertainty on D1) but does not
need `high-risk` (no security/data-loss/irreversible-external-effect
surface — internal judge-prompt logic only, fully reversible via git,
no user-facing or persisted-data schema change).

## fgos graph read

`fgos graph --json`: tsk-25g is its own isolated component (size 1, no
deps/blockers). Not on `criticalPath`, not in `topUnblock` — this item
does not gate or get gated by any other open work. Ordering below is
therefore judgment-based (cheapest/most-certain piece first), not
informed by graph unblock data, since there is none to read here.

## Approach

**No split — one honest piece of work, two phases.** D1 (bimodal,
`discovery.mjs`) and D2 (deterministic, `decompose.mjs`) touch different
files with no dependency between them, which would normally argue for a
split (fgos-coding-planning step 4). Kept as one item instead: both phases are
small (a handful of lines each, matching an already-existing sibling
implementation for D2), both belong to the same underlying fix
(`judgeVerifySemanticCorrectness`'s two call sites), and this item's own
proposed verify (already accepted by the second-pass judge — see
CONTEXT.md's Gate section, `outcome: clear`) already covers both phases in
one command; splitting would mean re-deriving two separate verify commands
for pieces this size, net overhead exceeding the benefit.

**Phase order: D2 before D1.** D2 is deterministic and low-risk (mirrors
an already-proven pattern); ship it first so the decompose-path escape
hatch exists regardless of D1's outcome. D1 is the uncertain piece and
depends on nothing D2 produces, so doing it second costs nothing.

### Phase 1 — D2: decompose-path parity (deterministic)

Extend `resolveDecompose`'s per-child verify check
(`src/intake/plan.mjs:699-714`) to match what `resolveDiscovery`
already has:

- Thread `priorRejection` into the per-child
  `judgeVerifySemanticCorrectness` call (currently 3 args, no history) —
  same shape as `discovery.mjs:651-652`, sourced from that child's own
  prior-round rejection (new: decompose has no per-child dispute rounds
  today, since a disputed child parks the WHOLE decompose verdict
  unconditionally — `priorRejection` here is only non-empty on a RETRY
  call after a human resumes an `awaiting-human` decompose dispute via
  `fgos answer`, mirroring discovery's own path).
- Add a `--force` override to the `disputedChild` branch
  (`decompose.mjs:707-714`), gated the same way `discovery.mjs:669-680`
  gates it: refuse when `secondPass.mechanical === true`, refuse when the
  item is already `awaiting-human` (point at `fgos answer` instead), log
  the override via `fgos decision` when taken.
- Add `force: { type: 'boolean', ... }` to the `decompose` CLI command's
  parameters (`src/cli/command-registry.mjs`, currently absent — confirmed
  by reading the full parameter list, no `force` key exists there today,
  unlike `discover`'s `command-registry.mjs:142`), same description shape.
- Test coverage: extend `test/intake/plan.test.mjs` with a disputed
  per-child verify case exercising both the refusal paths (mechanical,
  already-parked) and the successful override.

**Proof point:** the two structural `grep` checks tsk-25g's own accepted
verify already names (`priorRejection` present near the per-child judge
call, `.force`/`force ===` present near the `disputedChild` branch) — real,
mechanical, already RED-confirmed against the current repo state this
session (see CONTEXT.md's Gate section).

### Phase 2 — D1: discovery-path full-history threading (bimodal)

**Storage locus (locked here, not left to execution):** extend the
existing `ask`/`answer` fold in `src/state/replay.mjs` (`gates[id]`
object build, currently overwrites `.ask` each event —
`replay.mjs:200-205`) to ALSO accumulate an `askHistory` array key on the
same lazy `gates[id]` object (`askHistory: [...(view.gates[id]?.askHistory
?? []), ask]` alongside the existing single-slot `ask` overwrite — no new
top-level work-item field, no new event kind, additive to the same object
three other gate keys — `contextApprove`/`planApprove`/`validateApprove` —
already coexist on (`replay.mjs:428-431`). Chosen over a new `work.*`
field because disputes are already `ask`/`answer` events in the log;
folding history into the existing per-item view object that already
tracks them is the smaller change, and `validateWorkShape`
(`src/state/work.mjs:227+`) validates known fields by type without
rejecting additive ones — confirmed by reading it, `mergeAfter` is an
existing precedent for exactly this "optional, not in DEFAULTS,
lazy-additive" shape.

**Prompt change:** `discovery.mjs:651` reads `view.gates[id].askHistory`
(full array) instead of just `.ask` (single value); passes it to
`judgeVerifySemanticCorrectness`/`buildVerifyCheckPrompt`
(`judge-executor.mjs:305-329`), which renders EVERY entry in the
`priorSection` (each round labeled, e.g. "Vòng 1 bị từ chối vì X; Vòng 2
bị từ chối vì Y"), keeping the same "don't contradict your own prior
reason" instruction — now anchored against the whole streak, not just the
immediately-prior round.

**Empirical re-test (the actual proof this phase needs):** once the code
change lands, re-run the same adjacent-round-contradiction shape that
broke this in `tsk-5mc` (round 4 vs round 5: propose a verify, get a
structural objection, propose a fix addressing it, get an execution
objection contradicting the structural one) against a live or scripted
two-round dispute on a throwaway item, with the strengthened prompt
active. This is exactly the mode this item's own D1 decision already
named as "one more attempt" — `fgos-coding-validating`'s reality check is where
this proof gets executed and judged, not here.

**Bimodal outcome, both branches already scoped:**
- **Holds** (no contradiction across the re-tested rounds): code change
  ships as designed above; log a decision `D1-resolved: full-history
  threading holds — <round summary>` via `fgos decision --id tsk-25g`.
- **Still contradicts:** revert the `askHistory`-threading behavior change
  (keep the `replay.mjs` accumulation itself if harmless, or drop it too if
  unused elsewhere — implementer's call at that point, not designed
  further here since it never ships), and log `D1-resolved: stabilization
  closed permanently — --force is the accepted answer, see <round
  evidence>` via the same `fgos decision --id tsk-25g` call. Either branch
  satisfies this item's own verify (`grep -q "D1-resolved:"`).

**Impact-analysis posture:** `impact-analysis: degraded` (revised at
`fgos-coding-validating` — GitNexus registered and `status: "present"`
[`fgos tool query`], but its index was flagged stale mid-session, last
indexed at commit `251d0b5`, behind this item's own two doc-only commits
on `fgw/tsk-25g`; CONTEXT.md's original scout call recorded `full` when it
ran, before that drift). The gap: the `HIGH` risk / 3-caller result
(`resolveDiscovery`, `resolveDecompose`, `runWatch`) is not re-confirmed
against the current index state. Treated as still usable, not discarded,
because it was cross-checked against a direct `grep` at the time (matched
exactly, not a suspicious zero-result) — but re-run `impact` on
`judgeVerifySemanticCorrectness` and `buildVerifyCheckPrompt` again at
execution time regardless (per CLAUDE.md's MUST rule), since this plan
itself may shift line numbers cited above once Phase 1 lands first, and a
fresh index is cheap insurance either way.

## Risk map

| Component | Risk | Proof point |
|---|---|---|
| `decompose.mjs` per-child check (D2) | LOW — mirrors an already-shipped pattern exactly | the 2 structural greps (already RED-confirmed, already accepted by the second-pass judge as this item's own verify) |
| `command-registry.mjs` `--force` flag on `decompose` (D2) | LOW — additive CLI param, no existing flag renamed/removed | `fgos plan --help`-equivalent (schema listing) shows the new flag; covered by the same test file addition |
| `replay.mjs` `askHistory` accumulation (D1) | MEDIUM — touches a shared fold function every gate-bearing item's view passes through | targeted `test/state/replay.test.mjs` (or nearest existing replay test file) case: an item with 2+ ask events accumulates all of them in `askHistory` while `ask` itself keeps overwriting as before (no regression to the existing single-slot consumer) |
| `discovery.mjs`/`judge-executor.mjs` full-history prompt (D1) | MEDIUM-HIGH — the actual empirical bet; may not fix the instability | the adjacent-round re-test described in Phase 2 above, run for real at `fgos-coding-validating`; **this is the one proof point this plan cannot pre-verify** — it is the reality check itself |

## Assumptions

- `replay.mjs`'s `ask`/`answer` fold is the only place `gates[id].ask` is
  written (confirmed by reading the two fold sites at `replay.mjs:200-205`
  and `:428-431` — the second is a disjoint set of gate keys, not another
  `ask` writer). If a further writer exists elsewhere, `fgos-coding-validating`
  should re-grep before trusting this.
- Adding `askHistory` does not require a schema migration for existing
  items with no prior `ask` events — the array is built purely from
  events already in the log on next replay, same as every other
  `view.*` derived field.

## Validated at `fgos-coding-validating`

- **`askHistory` additive safety (was: "confirm no other code path reads
  `.ask` assuming it is the only history"):** RESOLVED. Grepped every
  `.ask` reader in `src/`/`bin/`: `discovery.mjs:220` (first-pass judge's
  own "most recent question" display), `decompose.mjs:170` (same
  display), `decompose.mjs:659`/`:667` (risk/blast-radius bypass-reason
  string match against the single most-recent `.ask`), `awaiting-context.mjs:74`
  (surfaces `.ask` into a context object). None assume `.ask` is the ONLY
  history — all four read the single-slot value for purposes unrelated to
  verify-dispute history, and none break if an ADDITIVE `askHistory` key
  coexists alongside `.ask`'s unchanged overwrite semantics. Confirmed
  safe.
- **Phase 2's empirical re-test (D1's actual bet): ATTEMPTED, INCONCLUSIVE.**
  Ran a real 4-round probe through the actual `fgos discover` pathway on a
  throwaway item (`tsk-2wp`, now `wontfix`): round A got a real objection,
  round B got a second real objection on a different axis, then joined
  A+B context was manually injected (simulating the not-yet-built
  `askHistory` mechanism) before round C. Round C's objection was a
  legitimate repeat of round B's flaw (the proposed verify was genuinely
  still broken), not a contradiction — across all 3 disputed rounds the
  judge was **consistent**, never reversing an earlier round's own stated
  criteria. This means the specific failure mode D1 targets (a later round
  contradicting an earlier round's own ask, as `tsk-4xg`/`tsk-5mc` both
  hit) could NOT be forced to reproduce synthetically in this session —
  it is inherently a rare, non-deterministic LLM failure mode observed on
  real work items, not one reliably triggerable on demand against a
  vacuous throwaway item with no real underlying claim to verify. Neither
  confirms nor refutes whether full-history threading would have stopped
  a REAL contradiction, had one occurred. This is a genuinely open
  question, carried forward as-is (see Feasibility Matrix below and the
  Gate section) — not something further planning-stage work can close
  without actually building Phase 2's code and hitting a real live
  dispute.
