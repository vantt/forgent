# W1 D2: scan successors, convention/holder table, composition parks (Doer brief)

Status: Lead brief under L12-137. Gates G1 (families 8/13/17) and G7 parks. Records-only outputs.

Common rules: read `preflip-execution-plan.md` §1-§2 (your gate rows) and §4, `w1-review-notes.md` (review findings that land in your scope), the named register sections in `../phase-08/step-08-preflip-gates.json` and the cited owner answers completely. Never a git write, never the fgos CLI against this repo, never `.fgos/` or secrets, never `scripts/run-tests.mjs` or `npm test`. Python `python3 -B`; scratch `/tmp/fgos-work/<brief-name>/`. Single tests only: `env -u CLAUDE_CODE_SESSION_ID FGOS_HOST_BIN=<releasePath>/bin/fgos node --test <file>` (`releasePath` from `/home/vantt/projects/forgentX/.fgos/installation/activation.json`); report what could not run. No pair accounting. No `owner-answers.md`/`progress.md`/`preflip-gate-status.json` writes: write `receipt.md` + `receipt.json` (commands, exits, counts, touched ids) in your own directory. Anything outside the writable list: stop, report `needsWrites`. Final message: first line a conventional commit subject (at most 100 characters, no plan ids, phase or finding labels), then a short Vietnamese summary (anh/em).

Tasks:
1. **Family 8:** compose successor scan sets (48 members) and a GAP-05 placement proposal for the Lead.
2. **Family 13:** per-area decision convention + citation-drift recursive `docs/platform/**/spec.md` scan.
3. **Family 17:** area-to-holder table for `fgos decision --scope`.
4. **G7 parks:** the 101 parked specs: render parks become a core/ patch + scratch `npm run build:skills` regeneration diff (in a scratch copy, never this worktree's generated dirs); hunk parks recomposed at current bytes. **Compose every park ON TOP of the already-approved spec's `expectedAfterSha256` for the same file** (w1-review-notes lists files), else fuzz=0 fails. Recompose the two G7 REWORK specs from the notes (c5 `test/cli/fgos-merge.test.mjs` stray blank line; c7 `docs/how-to/fix-bare-citation-findings.md` RUL home → `docs/platform/runner/subcomponents/h-6979005beaf7/spec.md#business-rules`). Also compose a patch spec carrying confinement §13.1 (credentialStore setup, `docs/specs/confinement-authority.md#unheaded-block-140`) into `docs/platform/agent-confinement/spec.md` (G0 b5 finding). Every spec: `beforeSha256`, diff, rollbackDiff, `expectedAfterSha256`, own fuzz=0 roundtrip.
5. Replay the owning guards on a scratch post-move copy; coverage ⊇ current, no rebaseline.

Writable (exact): plans/260925-documentation-authority-unification/reports/phase-09/composition/** only.
