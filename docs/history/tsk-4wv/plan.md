# plan.md — tsk-4wv (final verify pass, dispatch-redesign batch)

Mode: small

Flag count for the lane decision (fgos-routing's mode-gate, 0-1 → tiny/small):
only "existing covered behavior" applies (the `decision` verb already has
test coverage this change must not break — `test/cli/fgos-decision-kind
.test.mjs`, `test/state/decision-scope-field.test.mjs`, `test/e2e/pr-gate
.test.mjs`). No auth/data-model/audit-security/external-system/public-
contract-break/cross-platform/weak-proof/multi-domain flag applies — the
CLI syntax being removed (`fgos decision write <text>`, i.e. the silent
`positional.join(' ')` fallback) has zero real callers (see RESEARCH.md
Point 1), so removing it changes no observed contract. 1 flag → **small**
(a few files, no gray areas), not standard.

## Approach

This item bundles three previously-deferred findings from the just-merged
`dispatch-redesign` batch (tsk-2uf/-1/-2/-3, tsk-3wl5, tsk-7u7). Discovery
stage (see `RESEARCH.md`) resolved all three to `clear` with real evidence:

1. **Real bug, fix it** — `bin/fgos.mjs`'s `decision` verb case
   (`bin/fgos.mjs:1942`) silently joins ALL positional args with spaces
   into the stored decision text when `--text` is omitted:
   ```js
   const text = requireField(flags.text ?? (positional.length ? positional.join(' ') : undefined), 'decision requires --text "..."');
   ```
   Confirmed exploitable via the actual corrupted event already committed
   to `.fgos/events.jsonl` (`"write D-ADR0036: Khoá RUL11 ..."`). Zero
   real callers (5 skill files, every test) use anything but `--text`
   explicitly — the positional-join path is dead-but-dangerous convenience
   code, not a documented syntax. Impact-analysis gate: GitNexus present
   (`fgos tool query --capability impact-analysis --status present`), but
   `bin/fgos.mjs` is the known zero-indexed-symbol gap (tsk-38h, confirmed
   again live: `impact({target:"runVerb", direction:"upstream", file_path:
   "bin/fgos.mjs"})` → "Target 'runVerb' not found", 0 impacted) — not a
   blocker per `CLAUDE.md`'s own gate (degraded posture disclosed, not
   silently trusted). Cross-check per that same gate: grep across
   `.agents/skills/**/SKILL.md` and `test/**` confirms no caller depends
   on the positional-join behavior (RESEARCH.md Point 1's own evidence
   IS this cross-check).

   **Fix:** remove the `positional.length ? positional.join(' ') :
   undefined` fallback; require `--text` explicitly, matching every real
   caller's existing usage byte-for-byte. This eliminates the entire
   failure class (any stray leading word, not just literally "write")
   rather than special-casing one token.

   Add a regression test asserting `fgos decision` (no `--text`, only
   positional args) now refuses with a clear validation error instead of
   silently storing corrupted text — proves the fix and prevents the class
   from regressing silently.

2. **Real gap, not fixed here (disclosed, deferred)** — the driver/worker
   boundary in `.agents/skills/fgos-coding-implement/SKILL.md` is enforced
   only by prose ("Stop reading after this section"); the mechanical
   worker-only file (`../_shared/coding-worker-contract.md`) already
   exists (added by tsk-2uf-2), but `src/runner/dispatch/prepare.mjs`'s
   `buildPrompt` (`skillPath = \`.claude/skills/${skillName}/SKILL.md\`,
   line 113) still points an out-of-process worker at the FULL combined
   file, never at the worker-only one — see RESEARCH.md Point 2 for the
   full evidence chain. Hardening this (changing what an out-of-process
   worker's dispatch prompt points at, and/or restructuring the skill
   file split) is a cross-cutting `src/runner/dispatch/*.mjs` change
   affecting every domain's dispatch path — disproportionate to this
   item's `tier: light` scope, and outside the "genuine, disclosed
   reason" bar for touching that module in this item. **Decision: leave
   as a documented, accepted limitation for now.** No code change in this
   item for point 2 — see Outstanding questions below for how this gets
   tracked forward.

3. **Confirmed clean, no action needed** — batch merge coherence: all six
   merge commits are on `main` HEAD (`c70f32d0`, exactly tsk-4wv's own
   `branchHeadAtTake`); `npm test` on this exact HEAD is fully green
   (3650 tests, 3645 pass, 0 fail, 5 pre-existing environment-conditional
   canary skips); no leftover TODO/FIXME/stub markers in any file the
   batch touched. See RESEARCH.md Point 3.

## Shape

One piece, no split — items 2 and 3 above are dispositions (a scope
judgment and a clean-bill-of-health check), not code changes; only item 1
is real implementation work, and it is small enough (one file, one
existing test file extended) to stay as this item itself rather than
splitting further.

Files touched: `bin/fgos.mjs` (remove the positional-join fallback in the
`decision` case), `test/cli/fgos-decision-kind.test.mjs` (or a new
`test/cli/fgos-decision.test.mjs` if the existing file's scope doesn't fit
— add one test: `decision` with no `--text` and only positional args
refuses with a validation error, exit 4).

No split — proceeds as itself (pass-through).

## Verify

```
npm test
```

Full suite, per the absolute constraint on this item ("run the FULL npm
test suite after any change [to bin/fgos.mjs], not just a targeted
subset") and this repo's own DoD bar (`AGENTS.md` §5: "npm test (state +
cli + runner + e2e suite) green; new or changed behavior gets a matching
test"). The new regression test above is what makes this command actually
prove the fix, not just prove nothing regressed.

## Outstanding questions

None
