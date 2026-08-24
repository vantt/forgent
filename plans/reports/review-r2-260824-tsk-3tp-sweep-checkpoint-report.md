# Review R2 — tsk-3tp sweep-checkpoint redesign (behavioral/e2e lens)

Branch under review: `fgw/tsk-3tp` (worktree `.claude/worktrees/tsk-3tp-0YK44Z`),
HEAD `c784cb9e` (round-1 fix already applied). Scope: behavioral/e2e only, per
task — not correctness/regression or spec/safety (separate rounds).

## 1. Full test suite

Command: `FGOS_DISABLE_OPPORTUNISTIC_CHECKS=1 node --test` (bare, no npm
wrapper), full run, ~2m47s.

```
ℹ tests 3882
ℹ pass 3876
ℹ fail 1
ℹ cancelled 0
ℹ skipped 5
```

The single failure is `herdr-plugin/web/src/api/client.test.ts` — the known
pre-existing, unrelated failure that also fails on `main`. No other
failures.

Note (informational, not a finding against this item): the task brief
flagged `test/runner/claim-port.test.mjs`'s "claimWork reads the event log
fully 4 times per call, not 6 or 7" assertion as a known pre-existing
red (tracked tsk-3tb). Running it in isolation and inside the full suite,
it is currently **green** (4 reads, passes) — better than the documented
baseline, not a regression. Flagging only so the discrepancy with the
briefing is visible; does not change the verdict.

## 2. Real behavioral scenarios (disposable repos, not this worktree)

All three scenarios ran against fresh `mkdtemp` git repos under `/tmp`,
importing `mergeRunnerItem` / `runOpportunisticMainCheckoutChecks` directly
from the worktree's `src/`, driving real `git` subprocesses — no mocking.
Scripts and full output were produced and then cleaned up; the essential
results:

**Scenario 1 — merge with dirty `.fgos/events/` shard (same repo, lockRoot
== repoRoot, the common root->main approve shape).**
Created a feature branch with a real commit, left an untracked dirty shard
file under `.fgos/events/`, called `mergeRunnerItem`. Result: the landing
commit's `diff-tree -m` listing includes the shard path; working tree is
clean after; exactly one new commit lands (the merge commit itself, subject
`Merge branch 'fgw/scenario1-item'`) — no separate checkpoint commit rides
alongside it. **PASS.**

**Scenario 2 — quiet period, no merges: sparse fallback timing.**
Committed a shard once (baseline), then dirtied it again and pinned its
mtime 10s after that baseline commit. With `fallbackIntervalSec: 60`:
- At `nowSec` = baseline+30 (30s elapsed, under the 60s interval):
  HEAD unchanged, file still shows `M` in `git status` — **no early fire**,
  confirmed.
- At `nowSec` = baseline+70 (70s elapsed, past the interval): a new commit
  lands, working tree clean, commit subject is exactly
  `chore(.fgos): fallback events checkpoint`. **Fires correctly after the
  interval, not before. PASS.**

**Scenario 3 — leaf->parent shape, `lockRoot !== repoRoot` (the exact class
round-1 review found broken).** Two separate disposable repos stand in for
the ephemeral worktree (`repoRoot`, where the merge commit itself lands) and
the real main checkout (`lockRoot`, the only place `.fgos/` lives per
ADR0020). After `mergeRunnerItem(repoRoot, item, { lockRoot })`:
`repoRoot` gains the merge commit; `lockRoot`'s HEAD is unchanged but its
index shows the shard staged (`A  .fgos/events/...`) — not lost, not
silently dropped. A subsequent real commit made directly against `lockRoot`
(standing in for the next root->main approve or the sparse fallback)
picks up that staged file, proving the data genuinely reaches history
eventually rather than sitting stranded. **PASS** — independently
reconfirms the round-1 fix (`merge.mjs:1356-1389`, staging computed
against `lockRoot`, not `repoRoot`) holds under a real two-repo setup, not
just the existing unit test.

## 3. Legacy trigger fully gone

- `grep -rn "periodic events.jsonl checkpoint" src/ bin/ scripts/` — zero
  hits anywhere in live code. Only appearances left in the repo are
  historical narrative under `docs/history/*/[plan|iron-law-evidence].md`
  (immutable records of prior items), which is correct and expected.
- `src/state/events-jsonl-truncation-guard.mjs` (read in full) no longer
  defines `PERIODIC_CHECKPOINT_INTERVAL_SEC` or
  `DEFAULT_CHECKPOINT_EVENT_THRESHOLD` — only
  `DEFAULT_CHECKPOINT_FALLBACK_INTERVAL_SEC = 3600` and the sparse-fallback
  branch (`runOpportunisticMainCheckoutChecks`, lines 250-477), which
  commits as `chore(.fgos): fallback events checkpoint` — a deliberately
  different literal, so a grep for the old string is real proof.
- Scenario 1's produced commit history and scenario 2's produced commit
  history were both grepped for the legacy literal: absent in both.
- `CHANGELOG.md`'s `## [Unreleased]` entry accurately describes the
  retirement (interval 900s / threshold 50 -> sweep + 3600s fallback).

## 4. Env-var opt-out check

`FGOS_DISABLE_OPPORTUNISTIC_CHECKS` is still present
(`events-jsonl-truncation-guard.mjs:320`, `package.json:27`'s own `test`
script, several test files). This is **not a leftover** from the old
mechanism: it was never exclusive to the retired periodic-commit branch —
it gates the whole `runOpportunisticMainCheckoutChecks` entry point
(truncation-guard warning AND the new sparse fallback both), and the
parent plan.md's own test-plan explicitly required it "vẫn opt-out sạch
(giữ tương thích tới P2)" (still a clean opt-out, kept). Confirmed the P2
child (`tsk-3tp-2`, commit `92e533a8`) deliberately scoped its deletions to
the **seq-contiguity** surface only (`events-jsonl-contiguity.mjs` and its
scripts/tests/doctor-check) — a different module from the truncation-guard
— and did not touch this env var, matching the declared/actual footprint.
No dead env-var reference found in code or docs.

## 5. `fgos doctor` surfaces the new mechanism

Ran `node bin/fgos.mjs doctor` for real inside the worktree (which, per
ADR0020, has no `.fgos/` at all — an ephemeral worktree never carries it).
Output includes:

```
"description": ".fgos/config.json exists and has every current registered default key",
"passed": false,
"message": "stale config — missing keys: checkpoint — run fgos setup"
```

This confirms `registerConfigDefault({ id: 'checkpoint', key: 'checkpoint',
shape: { fallbackIntervalSec: 3600 } })`
(`src/setup/registrations.mjs:1674-1678`) is genuinely wired into the
generic `checkConfigNotStale` check doctor already runs (same registry
every other config section uses) — not just declared in source but
actually detected live. No dedicated bespoke `checkpoint`-only check
function exists beyond this generic one, which matches exactly what the
plan (and the Install/setup/doctor gate) asked for: registration into
config-merge + doctor's check registry, nothing more.

## Verdict: CLEAN

All five behavioral checks confirmed with real, disposable-repo evidence
(not just reading code or trusting the existing unit tests): dirty shards
genuinely land inside the merge commit (both same-root and
lockRoot-!==-repoRoot shapes), the sparse fallback fires exactly at its
configured boundary and not before, the legacy dedicated checkpoint
commit/trigger is completely gone from live code and from real commit
history, the opt-out env var's continued presence is a documented,
intentional decision rather than a missed cleanup, and the new
`checkpoint` config surfaces through `fgos doctor` for real. Full test
suite is green modulo the one known pre-existing unrelated failure.
