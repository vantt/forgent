# W42 review: G4 scanner, lease hook and cutover-order fixes

Commits: d0dcc24ec (scanner), dc15c5030 (hook), 8d5dbabc5 (register order). HEAD 12b9e520f. Read-only. Details are in [w42-g4-fixes-review.json](w42-g4-fixes-review.json).

## Verdict: REWORK (one medium hook change, one medium scanner gap); otherwise approved

| Id | Severity | Verdict | Finding |
|---|---|---|---|
| R1 | medium | REWORK | Published-history admission also lets main **rewind** to an older published commit. Reproduced: c2 (held) to c1 is admitted at HEAD and refused before the fix. Afterwards the local main sidecar is absent, so scoped commits on main pass both hooks locally. Fix: admit only when `next === origin/main`, or when old is an ancestor of next and next is an ancestor of origin/main. |
| R2 | low | APPROVE | Spoof: `git update-ref refs/remotes/origin/main <x>` then moving main to x is admitted (reproduced). This is no worse than `-c core.hooksPath=` and the lease is convention plus typed doors. No sound local fix exists, only a server-side one. Name it in section 7's uncovered routes. |
| S1–S3 | none | APPROVE | All three HARDEN items are fixed. Against the 6215e614f scanner, all 21 new leaf cases are red and the 20 old cases stay green. |
| S4 | medium | REWORK | `export * from`, `export * as ns from` and namespace re-export hide a `reset --hard` caller. The scan stays at 0 undeclared on the old and new scanner, so this is not a regression and no wrapper is exposed today. Section 17 no longer names any alias gap. Refuse these re-exports, or restore the open-gap sentence. |
| S5 | low | APPROVE | Trailing-spread verbs (`['diff', ...x]`) are now accepted for hook and tooling verb checks. `--output` can write a file but cannot move a ref. |
| S6 | low | APPROVE | An unresolved (not literal) program can still be declared configured-binary when it has no escapes. This is the pre-existing rule, and it is optional to tighten. |
| S7 | none | APPROVE | Retiring the five configured declarations is justified. The three sites in scratch auto-classify as config, a literal-git replacement flags them, and class counts equal HARDEN's. Their own retireWhen is met, so this is **within HARDEN's verdict**. Name it in the re-review request; no separate OK is needed. |
| H1 | none | APPROVE | The empty-tree ids are correct (sha256 checked in scratch). The leaseGitRead declaration (d9a1f33e…, +merge-base) matches the scan. `--write-census` exits 0 with a clean tree. |
| H2 | low | APPROVE | The section 7, 17 and 18 edits and CHANGELOG lines are accurate, except that R1, R2 and S4 are missing. |
| C1 | low | APPROVE | The order matches L13-30/31. verify.py 0, controls.py 39/39 rejected (verification.json restored). L13-32 (OPC MERGE before lease, HARDEN re-review before Land) is not encoded yet because the commit predates it. |
| T1 | low | APPROVE | lease 17/0, declarations 45/0, census-drift 3/0, git-mutation-census 1/0. one-door.test.mjs is 4/2 (addon-not-shipped). Nobody has run it with an addon. |

## Before the lease

1. R1: add the forward-or-tip constraint plus a unit case.
2. R2: add the spoof sentence to section 7.
3. S4: refuse star or namespace re-exports, or document them as an open gap.
4. Run `test/git/one-door.test.mjs` through an addon-shipping door.
5. Encode L13-32 in the register order.
