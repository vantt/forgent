# w39: review of the register refresh in commit 45da92781

Light, independent, read-only review of the records changes in 45da92781. The working tree was checked at HEAD 5752f5a0e. Brief: `w39-register-refresh-brief.md`. Rulings: L13-29, L13-30 and L13-31. Machine record: `w39-register-refresh-review.json`.

## Result: 11 APPROVE, 0 REWORK (1 medium note, 1 low note)

- **Reproduction:** I ran `reconcile.py` in a scratch clone at the register's pin 0e5925d38, using the 45da92781 scripts and inputs. It exited 0, and the output is byte-identical to the commit.
- **Proofs at HEAD:** `verify.py` exit 0, `controls.py` exit 0 (36 controls), `rebind.py --check` exit 0. The only change from these runs was the volatile `checkedAtHead`, which I restored.
- **L13-30:** the record is accurate. It has the verbatim owner text, the packet 6586bbc46, and the allowed and not-allowed scope. The lead:LAND condition is recorded as pending. Order steps 2–3 are done and steps 4–8 are pending. G8 is covered by A and is not executed. G5 and G9 owner items stay open.
- **`linkIntoMoveSet`:** removed from the register, from `verify.py` and from its control. The `linkGuard` checks are kept, and a new cross-check reads `fchain/check.json`. No check was weakened.
- **Ownership audit:** stated at 23e3c34b7 as 0 unaccounted pairs, B ok, reproduction 8/8, 58 exceptions dropped. All 3 pinned input hashes equal HEAD.
- **Citations:** rebind status cites W26 for 0–148 and w33 for 149–154, and only the status line of the rebind file changed. G7 cites the w33 link-retargets review, item `work-state-rebase`. `affectedGates` adds G9 for w35 and w37, and cutover readiness for w32.
- **Review entry and follow-ups:** the w38 entry for e7e6c129c is 11/0. The summary clause is cleared. Both new followUps are present with owner lead:DOC.

## Notes

1. **Medium: the start order conflicts with L13-31.** L13-31 was recorded after the brief, so this is not a defect of the commit, but the register is now out of date on it.
   - The register's order puts "Acquire documentation write lease" before "Final main import; record F". `ownerDecision.condition.requiredBefore` names the lease step, and `verify.py` hard-codes that order.
   - L13-31 orders it differently: the board freeze notice comes first, then the F import after HARDEN answers, with the freeze held by convention. The real lease comes only after G11 release R and the G10 rehearsal. The release 2bef8cb2 has no docs-lease verb.
   - Fix: before the F import, refresh through `reconcile.py` and update the `verify.py` order pin and its control to match.
2. **Low:** the condition and summary say LAND confirms "before the lease". The owner's condition applies to every option-A step, starting with the board notice and the F import. Fold this into the same refresh.
