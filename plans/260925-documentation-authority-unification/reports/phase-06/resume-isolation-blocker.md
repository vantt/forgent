# Resume isolation blocker

Date: 2026-10-07
Executor: codex-session:1@2026-10-07
Resume HEAD: `1cc92d7db383b78dafebebf6a057c3d87163afa0`
State: stopped under isolation stop condition 8; not ready for full tooling review

## Authorized amendment

Owner amendment A2 is committed in `3693ade08` and present in owner-answers.md. It resolves hold-review-status: hold/rework on unknown-blocking retains blocking; other dispositions retain pending; record the note without approval identity/date; route held unknown-blocking rows to the owner queue. The gate invariant remains unchanged.

No A2 regression or implementation edit has started. Resume prerequisites failed first.

## Observed isolation failure

The worktree is clean, on the required branch, and HEAD descends from the recorded last green conservation commit `789870507`. An intervening commit `1cc92d7db` adds draft integrity/consumer-rewrite materials outside the Phase 6 allowlist. These are pre-existing inputs at resume, not executor changes; they are preserved untouched.

The prescribed check A scans every first-parent non-merge commit from B0 through HEAD, without filtering who created the commit. Its description says own commits, but its actual command also includes this intervening commit. Result: exit 1, exactly five disallowed paths.

Executed from the required worktree, after pwd and branch verification:

```sh
git log --first-parent --no-merges --name-only --format= dbe5c432852837ea01e6025b35868bcb7271495d..HEAD | sort -u | node -e 'const ok=JSON.parse(require("fs").readFileSync(process.argv[1],"utf8"));const bad=require("fs").readFileSync(0,"utf8").split("\n").filter(Boolean).filter(p=>!ok.some(x=>p===x||p.startsWith(x)));console.log(bad.join("\n"));process.exit(bad.length?1:0)' plans/260925-documentation-authority-unification/reports/phase-06/allowed-paths.json
```

Disallowed paths, all introduced by `1cc92d7db`:

- `plans/260925-documentation-authority-unification/reports/phase-07-08-prep/consumer-survey.json`
- `plans/260925-documentation-authority-unification/reports/phase-07-08-prep/consumer-survey.md`
- `plans/260925-documentation-authority-unification/reports/phase-07-08-prep/open-questions.md`
- `plans/260925-documentation-authority-unification/reports/phase-07-08-prep/phase-07-draft.md`
- `plans/260925-documentation-authority-unification/reports/phase-07-08-prep/phase-08-draft.md`

No allowlist, B0 pin, phase rule or check command was changed. No reset, checkout, main write or history rewrite was attempted.

## Required owner decision

Recommended: authorize a narrow check-A invocation amendment accounting for only the exact five paths introduced by commit `1cc92d7db`, as an externally supplied owner-input exception. Every other commit/path remains subject to the original allowlist, including future executor edits to those five paths. Do not grant a blanket reports/phase-07-08-prep prefix allowance, move B0 or erase the intervening commit.

Alternative: revise the allowed-path contract to permit that directory. Broader than needed; not recommended. Neither option is implemented by the executor.

## Evidence limits and next action

Current check A is red. B through H were not rerun after the isolation stop. The previously recorded 803/803 tests and both green A1 conservation proofs belong to `789870507`, not a new verification of this resume HEAD. A2 failing-before/passing-after regressions, unchanged-gate proof, remaining tooling/maps, scoped strict E and full independent tooling review are UNPROVEN for this resume.

Owner queue: resume-owner-input-isolation is open; hold-review-status is resolved by A2. No archive/delete decision list, new real-conflict resolution, claim hold, promoted-document edit or real approval has been authored.

Owner/reviewer should examine this report, allowed-paths.json, check A and stop condition 8 in the phase contract, plus commit `1cc92d7db`'s five-path diff. This is a blocker escalation, not a full tooling review request.

Next: owner commits the narrow isolation amendment; rerun the amended isolation check and remaining resume checks; add red regressions for both hold and rework; implement A2; prove the unchanged gate accepts both outputs; update progress; continue sequentially from T3 through the remaining tooling/maps; stop at the full independent tooling review checkpoint.
