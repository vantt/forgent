# Review a38 step-04 wave3 p28

Part 28, set step04-032, category A. Pin dc24ce645.

## core/skills/_shared/ak-cook-worker-contract.md
Verdict: ok. Slots reviewed: 3 (1 source slot and 2 render-joins), whole file read (40 lines).

- Source line 6, `docs/specs/runner.md`, "Skills reach `bind()`": parked, with no diff. The passage content is the `supports.skills` / `skills-unavailable` bind rule, which currently lives only in `docs/specs/runner.md` line 1145. My search for live holders found none, so the park stands:
  - `git grep` for "Skills reach", `skills-unavailable` and `supports.skills` over docs/platform finds no runner-spec holder. The only hit is the `executor-skills-installed` doctor-check row in the packaging docs, which is not the bind rule.
  - docs/platform/runner/** contains no skills-binding passage. The only nearby mention is the Unit/capability row, which points to `core/skills/_shared/capability-matching.md`.
  - The other hits (CHANGELOG, bind.mjs, tests and the renders) are not doc holders.
  - The park note correctly calls for carrying the rule to a live holder before redirecting, so it is a dependency note that cannot be run as a patch.
- Render joins for `.agents` and `plugins` (source line 6 maps to render line 7 under the one-line generated header): render-join with no render diff, and the source outcome is stated as parked. Both render bodies equal the source.
- The file has no other path-like references.

Defects: none. Record-text notes: none.

Counts: set step04-032 reviewed 1 file, 3 slots, rework 0. Stratum: category A.

Status: DONE
