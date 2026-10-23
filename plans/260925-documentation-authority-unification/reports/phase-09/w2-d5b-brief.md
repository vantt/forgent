# W2 D5b: archive design fixes (Doer brief)

Status: Lead brief under L12-129, L12-137 (LOCAL only). Review: `reviews/w2-g8-archive-review.{json,md}` (summary `w2-review-notes.md` section G8).

Common rules: read `preflip-execution-plan.md` §1-§2, `w1-review-notes.md` and `owner-answers.md` (L13-*) in this directory, and the receipts of the wave-1 Doers that your task builds on. Never a git write in this repository (temporary test-fixture repositories under /tmp are fine), never the fgos CLI against this repo, never `.fgos/` or secrets, never `scripts/run-tests.mjs` or `npm test`. Python `python3 -B`; scratch `/tmp/fgos-work/<brief-name>/`. Single tests only: `env -u CLAUDE_CODE_SESSION_ID FGOS_HOST_BIN=<releasePath>/bin/fgos node --test <file>` (`releasePath` from `/home/vantt/projects/forgentX/.fgos/installation/activation.json`); report what could not run. No pair accounting; no `owner-answers.md`/`progress.md`/`preflip-gate-status.json` writes: write `receipt.md` + `receipt.json` in your own directory. Anything outside the writable list: stop, report `needsWrites`. Final message: first line a conventional commit subject (at most 100 characters, no plan ids, phase or finding labels), then a short Vietnamese summary (anh/em).

Lead decisions: move the "small-record" tranche too (files kept only by the 1 MB threshold with no reader); keep only files a retained check/test/script reads or the plan's own navigation needs (plan.md, phase files, owner answers, briefs, gate status), each with a stated reason.

Tasks:
1. Every retirement spec names the real owning proof of the behaviour it retires (test/script that still proves it) or states "behaviour retired with the plan"; the 10 current Phase 9 gate replayers (census-join, composition, preserve-premise, carries) are marked retire-at-final-pin and the tip is measured both with and without them.
2. Name the pair accounting for the archive removal commit in the design (check A would flag the moved paths); dry-run check A on the rehearsal clone after accounting and show it green.
3. Re-derive the retained set under the decision above; give real reasons for live product inputs (alias-table.json, claim-and-disposition-vocabulary.json, shipped-path-conventions-inventory.json, dropped-claims-register.json, plan.md …); slim the main-side manifest (retained-audit rows out of the main manifest, into the archive) and keep `archive/**` itself small.
4. Rehearse again in scratch; measure `git worktree add --detach` on real disk (not tmpfs; record the filesystem from `stat -f`), 3 runs; report tip bytes.

Writable (exact): plans/260925-documentation-authority-unification/reports/phase-09/archive/**.
