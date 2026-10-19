# Mechanical recheck request — escaped-literal inventory

Authority: owner A51 and Lead L12-28 plus the four rulings supplied with this rework. Input **42edba2b08d26ab8dcabe4859a301e1589fa8e6b**. Step-02k is superseded as an acceptance packet; its bytes and review remain historical evidence. Inventory only: coarse classes/roles are advisory, all dynamic constructions untraced, no per-edge action/patch/target semantics accepted. No consumer edit, Step 3 patch, runtime parity or authority flip is requested.

Write ONE independent report here: **review-a38-step-02l-inventory-01.md**. Lead owns dispatch and acceptance; the author has not launched a reviewer. Recheck only the five points below. Keep the prior review's verified mechanics as context rather than widening this request.

Read this request, `step-02l-{parser,inventory,probes,replay,accounting}.py`, `step-02l-verification.json`, and the generated review view. Human payload must remain ≤400,000 bytes (verification records its exact total). Full census files, reconciliation and exclusions are machine inputs, not model-context dumps. Read source bytes only for required witnesses and random samples. Scratch only `/tmp/fgos-work/`; unset `CLAUDE_CODE_SESSION_ID`; at most one heavy job at a time. Do not run fgOS, git writes, services, read state/secrets, or edit consumers, tests, gates, baselines, instructions, skills, switchboard or the protected manifests.

## 1. Replay and hashes

From the plan worktree, retain the absolute report directory:

```sh
report_dir="$PWD/plans/260925-documentation-authority-unification/reports/phase-08"
env -u CLAUDE_CODE_SESSION_ID python3 "$report_dir/step-02l-replay.py" --input-commit 42edba2b08d26ab8dcabe4859a301e1589fa8e6b > /tmp/fgos-work/review-02l-worktree.json
```

Then from `/tmp`, using the same absolute `report_dir`:

```sh
env -u CLAUDE_CODE_SESSION_ID python3 "$report_dir/step-02l-replay.py" --input-commit 42edba2b08d26ab8dcabe4859a301e1589fa8e6b > /tmp/fgos-work/review-02l-tmp.json
cmp /tmp/fgos-work/review-02l-worktree.json /tmp/fgos-work/review-02l-tmp.json
sha256sum /tmp/fgos-work/review-02l-worktree.json /tmp/fgos-work/review-02l-tmp.json
env -u CLAUDE_CODE_SESSION_ID python3 "$report_dir/step-02l-replay.py" --input-commit 42edba2b08d26ab8dcabe4859a301e1589fa8e6b --review-view > /tmp/fgos-work/review-02l-view.json
```

Require PASS/exit 0, byte equality, verification SHA agreement; independently hash code, complete census, supplemental artifacts and inherited dependencies. Replay rebuilds census, per-cause reconciliation and exclusions from committed bytes and checks the historical class-3 population read-only at **1a0f61ac53433292e08fb378ebbb6c1c72fd3b74**. `step-02j` is never regenerated. A nonzero absent-edge count requires `step-02l-class3-addendum.json`; zero requires no addendum. Compare counts in verification with the replay.

## 2. Escaped coverage with an independent grep

Independently scan committed safe candidate blobs for every legacy root and ROOTFILES authority allowing zero or more backslashes before `/` and `.`. Include regex delimiters (`/docs\/.../`, `/^docs\/.../`), escaped-string separators (`docs\\/architect`), regex text preceded by `\n`, and `docs\/(?:architect|platform)\/`. Preserve root boundaries so `docs/reference-learning-system.md` does not mean `docs/reference/`. Use your own grammar, not TOKEN, ESCAPED or the author's grep function. Never enumerate contents of `.fgos`, secrets, ignored/external installations or this plan. Stream hits to scratch and inspect differences.

Every line named in `review-a38-step-02k-inventory-01.md` must have an escaped edge, including dispatch:230/280 and both occurrences at knowledge-bootstrap:115. The replay explicitly asserts all listed lines. Check the additional escaped hits independently. Compare spans, source digest, normalized target and Git-tree existence; regex prefixes remain inventory evidence, never runtime target proof.

## 3. Four Lead rulings

- Class 4 dynamic/default-root construction at `scripts/generate-shipped-path-inventory.mjs:41`, the bare `'docs'` in ALLOWED_ROOTS; no guessed static target.
- Class 6 config-consumer edge for `.gitignore:1`, `docs/distillery/`.
- `step-02l-exclusions.json`: exactly 13 non-Markdown `archive/plans/**` root-hit files, each exact path/digest/bytes and explicit archived-history exclusion from classes 4–6. Recompute the list mechanically; Markdown plan history remains the earlier prose population.
- Only Markdown headings and declared carriage regions set heading/carriage flags. Shell/TOML comments must not become history headings. Verify `step-02l-reconciliation.json` before/after counts and every changed flag. Reconcile per-class edge/file/dynamic deltas against step-02k by cause.

## 4. Probe

Run the replay's probes: preserve all inherited checkpoints and prior inventory probes. The new escaped-literal witness must fail the actual step-02k extractor and pass step-02l. Inspect all legacy-root/ROOTFILES probes with 1–3 escaped separators, regex/string/newline delimiters, escaped dot, comment flags and the three population/default-root rulings. Historical unspecified labels stay unspecified. Nine deliberate record mutations remain rejected.

## 5. Ten fresh random edges per class

New seed **A51-step02l-recheck-20261019-escaped-73c8**. Independently rank SHA-256(seed + NUL + edgeId), ascending, tie edgeId; first 10 in each of classes 4/5/6. Use exactly these 30 rows, exposed in the bounded review view. Read `git show <input>:<consumerPath>`; verify digest, complete matched expression, every physical line/column span, normalized target, Git-tree existence/prefix distinction and carriage/history flags. Record all 30 ids. This fresh sample supplements the mandatory escaped witnesses, not replaces them.

Report PASS/REWORK for this bounded recheck, evidence/hashes, the five results and remaining gaps. Untraced writers remain a later rewrite dependency; advisory semantics are outside this request.
