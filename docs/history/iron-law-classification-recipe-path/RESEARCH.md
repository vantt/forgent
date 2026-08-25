# Research — iron-law-classification-recipe-path (tsk-ri8)

## Round 1 — 2026-08-24 (discovery stage)

**Asked:** Does `docs/how-to/produce-failing-test-first-proof-for-an-iron-law-gated-diff.md`
AND `fgos-coding-implement`'s `verify-commit-and-iron-law.md` reference doc
both document the Iron-Law classification recipe as a bare relative path
`listWork('.fgos')`? Does `paths(dir)` in `src/state/store.mjs` join `dir`
directly with `events.jsonl`/`state.json` with no `.fgos`-subdir resolution
of its own, confirming the item's claim that even an absolute repo-root
path reproduces the same silent-empty failure? Is direction (a)'s proposed
fix (`git rev-parse --path-format=absolute --git-common-dir`) already a
precedented pattern elsewhere in this repo?

**Checked / found:**

1. **Only ONE of the two named docs actually contains the recipe** — the
   item's premise is partially inaccurate:
   - `domains/coding/skills/fgos-coding-implement/references/verify-commit-and-iron-law.md:56-64`
     contains the exact one-liner:
     ```
     node --input-type=module -e "
     import { changedFiles } from './src/runner/merge.mjs';
     import { classifyIronLaw } from './src/evolve/iron-law.mjs';
     import { listWork } from './src/state/store.mjs';
     const item = listWork('.fgos').work[process.argv[1]];
     const filesChanged = changedFiles('.', item);
     ...
     ```
     Confirmed: this is byte-identical to its generated mirror
     `plugins/fgOS/skills/fgos-coding-implement/references/verify-commit-and-iron-law.md`
     (`diff` reports no difference) — a fix to the canonical
     `domains/coding/...` copy needs the standard mirror-regen step, not a
     second hand-edit.
     **Also note:** `changedFiles('.', item)` on line 61 is the SAME class
     of bug as `listWork('.fgos')` — a bare relative `.` assumed to be the
     main-checkout cwd. Both arguments on this one recipe need the fix, not
     just the `listWork` call. The item's own text only names `listWork`.
   - `docs/how-to/produce-failing-test-first-proof-for-an-iron-law-gated-diff.md`
     (read in full, 154 lines) does **not** contain this code recipe at
     all. It documents a different, related topic (producing the
     failing-test-first evidence transcript for `iron-law-evidence.md`) and
     only references `classifyIronLaw`/`changedFiles` in prose (lines 70,
     75, 84, 98-100, 112, 142) — no copy-pasteable one-liner, no
     `listWork` call anywhere in the file (`grep -n "listWork"` — no
     match).
   - **Correction for planning:** the actual fix surface is ONE file
     (`domains/coding/skills/fgos-coding-implement/references/verify-commit-and-iron-law.md`,
     mirrored to `plugins/fgOS/skills/fgos-coding-implement/references/verify-commit-and-iron-law.md`),
     not two. The how-to doc is unaffected by this bug and needs no
     change.

2. **`paths(dir)` confirmed to do a bare join, no `.fgos` resolution:**
   `src/state/store.mjs:89-91`:
   ```js
   function paths(dir) {
     return { logPath: path.join(dir, 'events.jsonl'), viewPath: path.join(dir, 'state.json') };
   }
   ```
   Confirms the item's second-paragraph claim: passing an absolute
   repo-root path instead of a `.fgos`-suffixed dir reproduces the same
   silent-empty-result failure, because `paths()` never appends `.fgos`
   itself — the caller must already pass the `.fgos`-suffixed dir.

3. **`listWork`'s silent-empty behavior on a missing log is explicitly
   documented as BY DESIGN, not a bug in itself** —
   `src/state/store.mjs:1406-1414` (docblock on the neighboring `readyWork`
   function, describing the same `currentView(dir)` core `listWork` also
   calls):
   > "A missing log rebuilds to an empty view (`{ work: {}, decisions: [] }`),
   > so `frontier` on it returns `[]` — never an error, exit 0, exactly
   > like `listWork` on an uninitialized dir."
   This is load-bearing for the legitimate case of a genuinely
   uninitialized `.fgos` store (fresh install, no events yet) — that case
   must NOT throw. **This creates real tension for proposed direction
   (b)** (making `listWork`/`paths()` fail loudly on a missing
   `events.jsonl`): a fail-loud change at this layer cannot distinguish
   "wrong path" from "genuinely fresh store" without an additional signal
   (e.g., checking the *directory* exists vs. checking the *file* exists)
   — sizing this needs planning's own judgment, not assumed as free.

4. **The CLI layer's existing "fail clearly on bad `--dir`" behavior
   (which the item says is "already solved"), confirmed:**
   `bin/fgos.mjs:4326`:
   ```js
   if (entry?.requiresExistingStore && !fs.existsSync(dir)) {
   ```
   This check lives in the CLI dispatch layer only (`bin/fgos.mjs`), gating
   on `requiresExistingStore`-flagged verbs before they ever reach
   `listWork`. It does NOT cover the documented direct-import one-liner
   (`import { listWork } from './src/state/store.mjs'`), which calls
   `listWork`/`paths()` directly with no such existence check in front of
   it — confirming the item's own claim that the CLI's fix does not extend
   to the doc-recipe's code path.

5. **Direction (a)'s proposed resolution pattern is heavily precedented
   in this repo already** — not a new pattern being invented for this fix:
   ```bash
   root=$(git rev-parse --path-format=absolute --git-common-dir | xargs dirname)
   ```
   appears verbatim in `src/runner/paths.mjs:75`, `src/setup/git-hooks.mjs:41`,
   `src/cli/invocation-fault-log.mjs:51`, and (as a documented recipe
   pattern) in at least 6 other skill docs under `plugins/fgOS/skills/`
   (`discover`, `retro-next`, `plan-next`, `cleanup-next`, `plan`,
   `discover-next`), plus `fgos-coding-discovering/SKILL.md` itself (the
   skill currently running this research). `src/runner/worktree.mjs:946`
   and `src/runner/merge.mjs:830` show the same absolute-resolution
   discipline applied specifically around `listWork`/`.fgos` (merge.mjs
   already builds `path.join(lockRoot, '.fgos')` before calling
   `listWork`, i.e. the exact fix shape direction (a) proposes, already
   used correctly elsewhere in the same file whose merge crash this item's
   description reports).

**Still open (for planning, not discovery):** whether to take direction
(a) only (doc fix, low risk, precedented pattern, scoped to one file +
its mirror) or also pursue (b) (code-level fail-loud change, higher risk,
tension with the legitimate uninitialized-store case documented above).
This is a scope/sizing decision, not a fact gap — evidence above is
sufficient to size either option.

**Verdict: clear** — the bug is confirmed real and precisely scoped (one
canonical doc file + its byte-identical mirror), the fix pattern is
well-precedented in this same repo, and the open question about scope
((a) alone vs. (a)+(b)) is a sizing decision for `fgos-coding-planning`,
not a product ambiguity that needs a person at `exploring`.
