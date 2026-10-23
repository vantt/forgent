# W2 D5: archive design, local rehearsal and checkout timing (Doer brief)

Status: Lead brief under L12-129 and L12-137 (LOCAL only: no push, no main). Gate G8.

Common rules: read `preflip-execution-plan.md` §1-§2, `w1-review-notes.md` and `owner-answers.md` (L13-*) in this directory, and the receipts of the wave-1 Doers that your task builds on. Never a git write in this repository (temporary test-fixture repositories under /tmp are fine), never the fgos CLI against this repo, never `.fgos/` or secrets, never `scripts/run-tests.mjs` or `npm test`. Python `python3 -B`; scratch `/tmp/fgos-work/<brief-name>/`. Single tests only: `env -u CLAUDE_CODE_SESSION_ID FGOS_HOST_BIN=<releasePath>/bin/fgos node --test <file>` (`releasePath` from `/home/vantt/projects/forgentX/.fgos/installation/activation.json`); report what could not run. No pair accounting; no `owner-answers.md`/`progress.md`/`preflip-gate-status.json` writes: write `receipt.md` + `receipt.json` in your own directory. Anything outside the writable list: stop, report `needsWrites`. Final message: first line a conventional commit subject (at most 100 characters, no plan ids, phase or finding labels), then a short Vietnamese summary (anh/em).

Tasks:
1. **Design** (`archive/design.md` + `archive/manifest.json`): which plan files move off the tip (bulk records), which stay (plan.md, phase files, owner answers, small records, everything a retained check or test reads); the archive ref name; the main-side manifest format (path → blob id, size, sha256, archive commit).
2. **Readers:** every reader in `../phase-08/step-08-tree-prune-manifest.json` scriptRefs plus any test/script that reads a moving file: a repoint-or-retire patch set (patch specs, not applied) under `archive/reader-patches/`.
3. **Rehearsal in scratch only:** clone the repo with `git clone --no-hardlinks` into `/tmp/fgos-work/archive/`, create the archive ref and the reduced tip there, apply the reader patches, run the retained owning tests in that clone, and measure `git worktree add --detach` of the reduced tip (3 runs). Report tip size and seconds. The real repository gets no ref, branch or commit from you.

Writable (exact): plans/260925-documentation-authority-unification/reports/phase-09/archive/**.
