# plan.md — tsk-6al: return skips redundant verify when a worker already proved it

Mode: standard

Lane decided directly (no `fgos-routing` Orient pass in this drive — pick ->
driving -> discovering -> planning, discovery verdict `clear` skipped
`exploring`). Applied `fgos-routing`'s own Mode-gate table directly:
- **public contracts** (`fgos return`'s CLI surface gains a new flag;
  `dispatch.mjs execute`'s result shape gains a field)
- **existing covered behavior** (`bin/fgos.mjs` case `'return'` is the one
  gate every coding item's `doing -> awaiting-approval/blocked` transition
  goes through; `test/cli/fgos-return.test.mjs` already covers it heavily)
- **weak proof around the area** (this exact hazard class — a stale sha
  wrongly trusted to skip a real check — already burned this repo once,
  see `docs/history/tsk-3ft-branchheadatreturn-stale-after-manual-reset/`)

3 flags, no hard-gate flag (no auth/data-loss/audit-security/external-
provider/removed-validation) → **standard**, not high-risk.

## Approach

No `CONTEXT.md` exists for this item — discovery verdict was `clear`
(`docs/history/tsk-6al-return-skip-redundant-verify/RESEARCH.md` Rounds
1-2), which skips `exploring` entirely, so there is no locked-decisions
doc to cite here. Every claim below traces to RESEARCH.md's own
file:line citations instead.

**Chosen path** (RESEARCH.md Round 2's finding: 3 compounding gaps, fixing
any one alone is a no-op — all three land together):

1. `src/runner/dispatch/cli.mjs`'s `executeExecutorCli` (around cli.mjs:518-530):
   when `hasSignal` is true AND the signal found is `[DONE]` specifically
   (never `[BLOCKED]` — a blocked worker never claims done, so there is
   nothing to call "verified"), include the already-computed `headAfter`
   sha in the returned result (e.g. as `verifiedSha`). Today `headAfter`
   is computed unconditionally at cli.mjs:520 but only spread into the
   result when `hasSignal` is **false** (cli.mjs:526) — the one branch
   that never needs it.
2. `fanoutBatchExecutorCli` (cli.mjs:709-821, the only caller that chains
   `pick -> executeExecutorCli -> return` for an out-of-process worker):
   after `executeExecutorCli` returns (cli.mjs:777-796), if the result
   carries `verifiedSha`, thread it into the following `fgos return` call
   (cli.mjs:798-802) as a new flag — exact flag name decided at
   implementation time, sketched here as `--worker-verified-sha <sha>`.
3. `bin/fgos.mjs`'s `case 'return'` (bin/fgos.mjs:3030-3290): accept the
   new optional flag. On the branch-source path only (bin/fgos.mjs:3085-3190
   — the only return path an out-of-process worker's work ever reaches,
   since Layer 2 rule 1 of `coding-worker-contract.md` confines a worker to
   one isolated worktree/branch; main-source `take` claims are always
   human/session per `claimRole`), if the flag is present AND equals
   `branchHead` (already computed at bin/fgos.mjs:3089) exactly, skip the
   `runGoalCheck` call at bin/fgos.mjs:3132 and record the same
   `awaiting-approval` outcome the existing green-verify branch already
   records (bin/fgos.mjs:3152-3164), tagged so the skip is visible in the
   item's own history/output — mirroring `merge.mjs:1257`'s own skip-message
   convention ("verify skipped: ... already verified green at return").
   If the flag is absent, or present but does not match `branchHead`
   (someone committed again after the worker's own verify ran), fall
   straight through to the existing unconditional `runGoalCheck` call —
   never trust a stale flag.

**Order:** `fgos graph tsk-6al --json` was run — tsk-6al has no `deps` and
does not appear in the global `criticalPath` (`[tsk-4vo, tsk-3t9, tsk-3t9-4,
tsk-67u, tsk-1q3, tsk-4zo, tsk-19y, tsk-19y-3, tsk-19y-2, tsk-19y-1]`) or
`topUnblock` (`[]`) — no cross-item sequencing constraint. Order below is
purely intra-item: the signal must be captured and threaded (upstream)
before `return` can consume it (downstream).

1. `src/runner/dispatch/cli.mjs` — add `verifiedSha` to `executeExecutorCli`'s
   `[DONE]` result; thread it through `fanoutBatchExecutorCli`'s return call.
2. `bin/fgos.mjs` — accept the new return flag; add the skip branch.
3. `test/cli/fgos-return.test.mjs` (+ the dispatch/cli test file) — new
   assertions per the risk map's proof points below.
4. `CHANGELOG.md` `## [Unreleased]` — per AGENTS.md's install/setup/doctor
   gate: this changes `fgos return`'s own behavior/flag surface, a thing a
   user of fgOS would see.

## Risk map

**Impact-analysis posture: degraded.** `fgos tool query --capability
impact-analysis --status present` returns GitNexus as `present`
(`mcp__gitnexus__list_repos` confirms an index registered for
`/home/vantt/projects/forgentX`), but that index reports
`staleness.commitsBehind: 1047` — badly stale. A direct
`mcp__gitnexus__impact` query for `executeExecutorCli` (`direction:
upstream`, `repo: /home/vantt/projects/forgentX`) returned `"Target
'executeExecutorCli' not found"` — consistent with the staleness (the
function likely postdates the indexed snapshot; `dispatch.mjs`'s own
barrel-file comment documents a `tsk-2uf-1` module split that created
`dispatch/cli.mjs` from a former single 2204-line file). Per this repo's
own impact-analysis capability gate (`CLAUDE.md`), a suspicious
"not found" is cross-checked with `rg`/direct read instead of trusted
blind — done in RESEARCH.md Rounds 1-2: `rg -n "runGoalCheck\(item"
bin/fgos.mjs` confirms exactly 2 call sites (both touched by this plan,
both read directly); `executeExecutorCli`'s result object has exactly 2
real in-repo consumers — `fanoutBatchExecutorCli` (destructures nothing
by name beyond `status`/`signal`/`errorClass`, cli.mjs:804-809, so an
added key is inert to it until this plan's own step 2 reads it) and
`bin/fgos.mjs`'s `execute` CLI subcommand (cli.mjs:869-883, which
`JSON.stringify`s the whole result to stdout — an added key is inert
there too). Blast radius is NOT GitNexus-confirmed; it is grep/read-
confirmed and recorded here as weaker evidence per the gate's own
disclosure requirement.

| Component | Risk | Proof point (owed to `fgos-coding-validating`) |
| --- | --- | --- |
| `bin/fgos.mjs` case `'return'` | medium — the one gate every coding item's `doing -> awaiting-approval/blocked` transition goes through, both branch- and main-source paths | `test/cli/fgos-return.test.mjs` stays fully green, plus new cases: (a) no flag passed -> byte-identical unconditional verify (default path unchanged), (b) flag present and matches `branchHead` -> verify skipped, outcome recorded as `awaiting-approval`, skip is visible in the recorded output/friction, (c) flag present but stale (branch moved since the flag's sha) -> falls through to a real verify, never silently skips |
| `src/runner/dispatch/cli.mjs` (`executeExecutorCli`, `fanoutBatchExecutorCli`) | light — additive field on an already-computed value; existing consumers only destructure named fields, so an added key is inert to them until this plan's own step 2 reads it | existing dispatch cli tests stay green; new test: `verifiedSha` appears on a `[DONE]` result and is absent on `[BLOCKED]`/`unsignaled` results |

## Shape

Concrete cases to prove against (standard-mode depth):

- **Boundary — worker reports `[BLOCKED]`.** No verified sha exists at
  all; `return` must behave exactly as it does today (unconditional
  verify) — nothing here ever produces a `verifiedSha` for a blocked
  worker.
- **Existing behavior that must not regress — a human/session `fgos
  return` with no worker involved.** This is the overwhelming majority of
  `return` calls today. The new flag is simply never passed in this path,
  so it must be byte-identical to current behavior: no flag -> old
  unconditional-verify code path, unchanged.
- **Staleness (the hazard this repo already burned once on the analogous
  `merge.mjs` mechanism — see `docs/history/
  tsk-3ft-branchheadatreturn-stale-after-manual-reset/`).** The flag's sha
  does not match the branch's current tip at return time (e.g. a person
  committed again after the worker's own `[DONE]` verify ran). Must NOT
  skip — falls straight through to a real `runGoalCheck`.
- **Partial failure.** `executeExecutorCli`'s adapter call itself
  fails/times out before any `[DONE]`/`[BLOCKED]` — `hasSignal` is false,
  the existing `unsignaled` branch already covers this and is untouched by
  this plan.

## Split decision

No split. One coherent piece: the three touched points (capture, thread,
consume) must land together — RESEARCH.md Round 2 already established
that closing any one of the three gaps alone is a no-op, so nothing here
is honestly separable into an independently workable smaller item.

## Outstanding questions

None
