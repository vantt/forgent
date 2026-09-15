# Track Closeout — code-implementation-track-policy

**Track branch:** `code-implementation-track-policy` (2 cells, both merged)
**Track worktree:** `/home/vantt/projects/code-implementation-track-policy-track`
**Mode:** docs-only rollout (`plan.md` rev 2)

## Cells

| Cell | Merge commit | Trace |
|---|---|---|
| P01 — Authoring template and coding verification fragment | `06e73303` | [`docs/architect/agent-coordination/verification/code-implementation-track-policy/p01.md`](../../../docs/architect/agent-coordination/verification/code-implementation-track-policy/p01.md) |
| P02 — Plan-loop wording, baseline step, and routing (+ R10 bug fix) | `ddb9e78e` | [`docs/architect/agent-coordination/verification/code-implementation-track-policy/p02.md`](../../../docs/architect/agent-coordination/verification/code-implementation-track-policy/p02.md) |

## Deliverables

- `docs/how-to/author-a-plan-loop-track.md` (new)
- `domains/coding/instructions/verification-discipline.md` (new)
- `core/skills/fgos-plan-loop/SKILL.md` — baseline step, proof-scope objective sentences, close-rule wording, routing trigger phrases
- `domains/coding/skills/fgos-code-panel/SKILL.md` — one routing line + `grantedContextRefs` bug fix (R10, user-approved scope addition)
- `CHANGELOG.md` — two `## [Unreleased]` entries
- `.agents/`, `.claude/`, `plugins/fgOS/` — regenerated projections for both changed skills, verified byte-identical to source

## Track-level Acceptance (plan.md)

1. `grep -rn "trackKind\|executionPolicy" core/ domains/ docs/` — returns nothing **except** this closeout's and both cells' own trace docs quoting the verification commands that check for those exact strings (self-referential, not real usage; confirmed no `trackKind`/`executionPolicy` schema/field exists anywhere in `core/`, `domains/`, or the authored how-to/fragment content).
2. `core/skills/fgos-plan-loop/SKILL.md` §5 gains the baseline step (line 603, "0. Baseline, once, before the loop below ever runs."); no domain name in the new R2/R3/R4/R5 sentences (verified — see P02 trace).
3. `npm run build:skills` on track HEAD reproduces `.agents/`/`.claude/`/`plugins/` byte-identical (`git status --porcelain` empty). `node --test test/skills/*.test.mjs test/setup/*instruction*.test.mjs` — 90/90 pass. (Note: the plan's own literal `test/skills*` glob resolves to the bare directory `test/skills`, which this Node version's `--test` flag mishandles as a module-resolution target rather than a discovery root — reproduced identically on pristine `main`, a pre-existing tooling quirk in the Acceptance wording itself, not caused by this track. `test/skills/*.test.mjs` is the corrected equivalent and is what was actually run.)
4. `CHANGELOG.md` `## [Unreleased]` carries both the how-to/fragment entry (P01) and the plan-loop wording/routing entry (P02).

## Final full-suite gate (track HEAD, before merge to main)

```sh
npm test   # with CLAUDE_CODE_*/CLAUDECODE env vars unset
```

Result: 105 raw failures. Diffed against the recorded baseline (103 failures at `f60cae1b`, see `plan.md` Execution Inputs): 103 exact matches (environmental — missing compiled `target/release/{fgctl,fgos}` in a fresh, never-`cargo build`'d worktree) + 2 duplicate-titled entries for one test (`test/skills/fgos-mirror.test.mjs`: "every fgos-* dev-skill file pair mirrored into plugins/fgOS/skills is byte-identical to its .agents/skills source"), which failed with `ENOENT` on a `*.tmp-<pid>-<timestamp>-<random>` path under `.agents/skills/fgos-coding-implement/references/` — a snapshot-then-read race against a real atomic-write test elsewhere in the full suite that writes into the same tree, not a content defect. Re-ran `node --test test/skills/fgos-mirror.test.mjs` in isolation: 13/13 pass, confirming this is a suite-concurrency flake, not caused by this track's diff.

**Triage: 0 patch-related, 103 pre-existing/environmental (matches baseline exactly), 2 flake (non-reproducible in isolation).** Full proof stands; missing-proof gate is not tripped.

## Deferred (not part of this track, tracked separately)

- `tsk-1bh` — coordination-engine bug: `resolveBindingAuthorization` always resolves the oldest unconsumed authorization for a `(nodeId, operationId, targetActorId)` binding (blocking a corrected retry once a bad one exists), and a first-pass-actor-genuinely-failed session that's fixed only via recheck can never satisfy quorum to close. Engine-only fix, explicitly out of this track's scope.
- RT-12c (P01) — `docs/enduser-docs-index.json` regeneration for the new how-to; generated-artifact housekeeping, out of this cell's file scope.
- How-to gap (P02) — no documented tree-equality shortcut for the non-inference rule when `testedSha != integratedSha` but the merge tree is byte-identical (observed directly at P02's own merge). Follow-up for a future revision of `docs/how-to/author-a-plan-loop-track.md`.
- Known suite-concurrency flake class (this closeout) — the `.agents/skills/fgos-coding-implement/references/return-mechanics.md` atomic-write-vs-mirror-test race observed above; worth a look from whoever owns `plans/260915-0455-test-suite-feedback-cost/` (not this track's scope).

## Reproduce the evidence

```sh
git -C /home/vantt/projects/forgentX log --oneline -1 code-implementation-track-policy   # track HEAD
cd <track worktree>
npm run build:skills && git status --porcelain .agents .claude plugins   # expect empty
node --test test/skills/*.test.mjs test/setup/*instruction*.test.mjs      # expect 90/90
env -u CLAUDECODE -u CLAUDE_CODE_SESSION_ID npm test                      # expect the 103-failure baseline (+/- the documented flake)
```
