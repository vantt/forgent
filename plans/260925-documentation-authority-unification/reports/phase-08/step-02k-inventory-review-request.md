# Mechanical-only inventory review request

Authority: A51 points 1/5 and Lead L12-28 under A42. Review **inventory mechanics only** for classes 4/5/6; class/role labels are advisory. Do not review per-edge actions, mappings, exact patch text or Step 3 semantics. Author no patch and edit no consumer. Do not run fgOS, access state/secrets, run git writes, change the protected Phase 6 manifests, or run more than one heavy job. Scratch only `/tmp/fgos-work/`; unset `CLAUDE_CODE_SESSION_ID` on test/replay commands.

Write ONE independent report under this directory: `review-a38-step-02k-inventory-01.md` (unique reserved name supplied in the assignment). Lead owns dispatch/accounting/acceptance. This author has not launched a reviewer.

## Fixed inputs and bounded reading

Input commit **`42edba2b08d26ab8dcabe4859a301e1589fa8e6b`**. Replays MUST carry `--input-commit` explicitly; artifacts committed later do not change the input tree. Historic class-3 replay requires the different flag `--input-commit 1a0f61ac5`; it is not the input for this review.

Human input bundle: this request, `step-02k-{parser,inventory,probes,replay}.py`, `step-02k-verification.json`, and the bounded review view generated below. Total must be **≤400,000 bytes** as recorded in verification. Do not paste the multi-MB census files into the model context. Machine replay streams all their committed bytes; sample view exposes only 10 edge records/class, counts, independent-grep results and per-file class-4 deltas. Inherited probe scripts/census inputs are machine dependencies pinned in verification, not additional human payload. Stop and report if the bounded-input total breaches 400 KB.

Three full census files `step-02k-census-class{4,5,6}.json` contain the A51 fields for every edge. Dynamic constructions are grouped by consumer file with a file digest and compact `callSites` tuples; decode their fields via `dynamicCallSiteColumns`. Every call site is **untraced**. A repository suffix existence lookup for a runtime-relative/external literal certifies only that suffix, never runtime cwd behavior. Generic joins/templates/config roots without nearby docs cues are retained as a conservative superset so indirect writers are listed rather than guessed. The source digest/class inherit from the file group/container. No behavioral acceptance follows.

Recorded definitions are unchanged: class 4 generators/projections/checkers; class 5 tests/fixtures; class 6 runtime readers/writers including gateway, CLI help and setup/doctor defaults. The earlier 53-file class-4 set is retained and expanded to all scripts, report sources, generated skill projections, known generated indexes and UI-spec tools. Frozen baselines remain literal inventory only. Historical `docs/history/**` and deep `docs/{architect,platform}/**/verification/**` payloads belong to earlier history/payload classes and are excluded here. Class-3 projection views may overlap class 4; overlapping inventory does not authorize hand-editing a render. State, secrets, ignored/external installations and this plan are excluded. Non-text candidates are explicitly listed.

## Commands (read-only, serial)

From the plan worktree root, set an absolute local variable (this has no state/config effect):

```sh
report_dir="$PWD/plans/260925-documentation-authority-unification/reports/phase-08"
env -u CLAUDE_CODE_SESSION_ID python3 "$report_dir/step-02k-replay.py" --input-commit 42edba2b08d26ab8dcabe4859a301e1589fa8e6b > /tmp/fgos-work/review-02k-worktree.json
```

Then, in `/tmp` with the same absolute `report_dir`:

```sh
env -u CLAUDE_CODE_SESSION_ID python3 "$report_dir/step-02k-replay.py" --input-commit 42edba2b08d26ab8dcabe4859a301e1589fa8e6b > /tmp/fgos-work/review-02k-tmp.json
cmp /tmp/fgos-work/review-02k-worktree.json /tmp/fgos-work/review-02k-tmp.json
sha256sum /tmp/fgos-work/review-02k-worktree.json /tmp/fgos-work/review-02k-tmp.json
env -u CLAUDE_CODE_SESSION_ID python3 "$report_dir/step-02k-replay.py" --input-commit 42edba2b08d26ab8dcabe4859a301e1589fa8e6b --review-view > /tmp/fgos-work/review-02k-view.json
```

Require exit 0/PASS for both full replays, exact output equality and agreement with verification. Recompute output/code/dependency SHA-256 independently with `sha256sum` or `hashlib`, including the complete census files (machine-only). Replay reads source bytes using `git cat-file --batch`; population and existence use `git ls-tree -r -t -z` at the explicit input commit. No filesystem target-existence fallback is allowed. Verify all syntax/class probes, all 222 inherited regressions, and deliberate wrong-construction/record rejection; historical inherited class labels remain unspecified rather than invented.

## Independent checks

1. Recompute the 10 random spot checks **per class** independently: seed `A51-step02k-mechanical-20261019-42edba2b`; rank sha256(seed + NUL + edgeId), ascending, tie edgeId, first 10. Do not substitute easier rows. For each of the 30 edges, read `git show 42edba2b08d26ab8dcabe4859a301e1589fa8e6b:<consumerPath>` and check digest, complete matched expression, every physical line/column span, target and Git-tree existence (including pattern/prefix lookup distinction). Check carriage/history region flags against their recorded heading evidence; semantic class/role disagreements are notes, not Step 2 rework.
2. Independently enumerate candidate surface paths via `git ls-tree`; compare the classifier's original seed members and expanded class rules. Cross-check gateway `apps/fgos-gateway/`, CLI `bin/`/`src/cli/`, setup/doctor, UI-spec tools, report generators, tests/fixtures and generated projections. Explain every difference against the initial class-4 census; `edgeDeltaReconciled` must equal `edgeDelta`.
3. Independently grep committed bytes for `docs/specs`, `docs/architect`, `path.join('docs'` (both quote styles, including whitespace/newlines) and **all legacy roots**: `docs/{ui-spec,contracts,history,how-to,explanation,decisions,reference,tutorials,distillery}` plus `ROOTFILES` root authorities, registry-prefix consumers and split literals. Use boundary-aware roots so `docs/reference-learning-system.md` is not mistaken for the `docs/reference/` root. Search with a grammar independent of `TOKEN`/`DYNAMIC`. `git grep -n -E` accepts the input commit and exact enumerated safe paths after `--`; never grep `.fgos`, secret files or excluded plan/state paths. Stream large output to scratch and read only differences. The author's separate `grep_audit` is a cross-check, not independent reviewer evidence.
4. For every independently found dynamic construction, locate its exact call site in `dynamicConstructions`. Include joins/resolves (multiline included), template strings, configured/default roots and indirect writers. Review the compact per-file call-site list mechanically in streamed chunks; compare to source, not only to the author's grep line coverage. No trace/no docs cue does not imply preserve or patch. Flag any genuinely missing docs-related construction. The conservative unrelated call sites are advisory extra inventory, not missing runtime proof.

Report replay/hash/existence/span and independent-grep results, all 30 checked edge ids, unexplained population/dynamic gaps and class-4 delta. Class labels/role hints and all untraced runtime coordinates remain advisory; no semantic patch review, native adoption, runtime parity, production tests or Phase 9 authority flip is requested. The gate is complete inventory on mechanical evidence. Untraced dynamic writers remain blocked for their later rewrite batch.
