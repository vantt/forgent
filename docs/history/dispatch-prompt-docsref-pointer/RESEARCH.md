# RESEARCH — tsk-2ux (buildPrompt never surfaces docsRef/plan.md)

## Round 1 — 2026-08-23

**Asked:** In `src/runner/dispatch/prepare.mjs`'s `buildPrompt`, confirm the
exact current mechanism used to resolve and render `skillPath` into the
rendered out-of-process worker prompt (which placeholder it fills, where
it's read/injected), to know the exact pattern to mirror for docsRef/plan.md.
Also: does the same gap apply to `CONTEXT.md`, not just `plan.md`?

**Checked:**
- `src/runner/dispatch/prepare.mjs:104-127` (`buildPrompt`)
- `src/runner/prompt-templates.mjs` (`selectTemplate`, `renderTemplate`)
- `src/runner/prompt-templates/worker-prompt-skill-pointer.txt`,
  `worker-prompt-discovery.txt`, `worker-prompt-default.txt`
- `src/intake/plan.mjs:38-106` (`readLockedContext`, `resolveContentRoot`)
- `src/state/store.mjs:280,563-564` (`docsRef` field shape)
- `src/runner/dispatch/cli.mjs:193-227` (`spawnWorker`, the only caller that
  threads `stage` through to `buildPrompt`)

**Found:**

1. **`skillPath` rendering mechanism** (`prepare.mjs:110-113,124-127`):
   `buildPrompt` resolves `domainName = resolveDomainName(work.domain)`,
   `skillName = skillForStage(domainObj, stage)`, then builds a plain path
   string `skillPath = `.claude/skills/${skillName}/SKILL.md`` — no
   filesystem read, no root resolution. This string is passed as one key in
   the `vars` object to `renderTemplate(templateName, vars)`
   (`prompt-templates.mjs:86-92`), which does literal `{key}` substring
   replace per key. `worker-prompt-skill-pointer.txt` and
   `worker-prompt-discovery.txt` both declare a `# Agent skill` section that
   renders `{skillPath}` as an instruction: *"read {skillPath} in your own
   checkout"* — i.e. it's a **pointer for the worker to read itself**, never
   inlined content. `worker-prompt-default.txt` has no `{skillPath}`
   placeholder at all; per `prompt-templates.mjs:58-61` docstring, an unused
   var passed to `renderTemplate` is harmless (no error, just never
   substituted).

2. **`readFirst` (the "Files to read first" section)** (`prepare.mjs:100-102`):
   computed purely from `work.footprint` (`Array.isArray(work.footprint) &&
   work.footprint.length ? work.footprint.join(', ') : '(không có)'`) — zero
   awareness of `docsRef`, confirming the item's own description. Only
   `worker-prompt-default.txt` and `worker-prompt-skill-pointer.txt` declare
   a `{readFirst}` placeholder (the "# Files to read first" section);
   `worker-prompt-discovery.txt` has no such section at all.

3. **`docsRef` field shape** (`store.mjs:280`, `plan.mjs:38-60`): `docsRef`
   is a plain editable string field on the work item (`EDITABLE_FIELDS`),
   set by `fgos-coding-exploring`/`fgos-coding-planning` via `fgos edit
   --docsRef` once either writes into `docs/history/<feature>/`.
   `readLockedContext(repoRoot, docsRef)` (used elsewhere, in-process, by
   `discovery.mjs`/`plan.mjs` for their own trust-signal/coverage checks)
   reads **both** `CONTEXT.md` and `plan.md` from that same directory in one
   loop (`plan.mjs:50`) — the two files are already treated as one uniform
   pair everywhere else in the codebase. **This directly answers the item's
   open question: the gap applies identically to `CONTEXT.md`, not just
   `plan.md` — there is no existing asymmetry between the two files to
   preserve or special-case.**

4. **No root-resolution needed for the fix**: `readLockedContext`/
   `resolveContentRoot` (`plan.mjs:46-106`) exist to let the *driving
   session* (running from the main checkout or an arbitrary cwd) read
   CONTEXT.md/plan.md content directly, in-process, for its own judgment —
   they resolve which of several candidate roots (cwd, the item's own
   `fgw/<id>` worktree, or stateRoot) actually has the committed file today.
   `buildPrompt`'s fix does **not** need either function: like `skillPath`,
   a docsRef pointer only needs to be rendered as a **path string** the
   worker reads in *its own* checkout — and `fgos-coding-exploring`/
   `fgos-coding-planning`'s own hard rule already requires committing
   CONTEXT.md/plan.md to the item's own branch before advancing the stage,
   so the worker's own worktree (checked out on exactly that branch) always
   has it. `work.docsRef` is already available on `work`, the same object
   `buildPrompt` already receives — no new stored field, no new parameter,
   confirming the item's own "Suggested fix direction" (render-time only).

5. **Template applicability**: the item's three corroborated live cases
   (tsk-37d, tsk-4oq, tsk-5dnt) were all Implement-stage (`executing`)
   out-of-process dispatches — i.e. all rendered via
   `worker-prompt-skill-pointer.txt` (the `domain: 'coding'` rule in
   `prompt-templates.mjs:37`, since `stage` defaults to `'executing'`),
   which already has a `{readFirst}`/"Files to read first" section to extend.
   `worker-prompt-discovery.txt` (stage `'discovery'`) has no such section,
   and a `discovery`-stage item's `docsRef` is essentially never populated
   yet (exploring/planning — which write it — run strictly after
   discovery), so it is not a practical target for this fix today.

**Still open (implementer's call, not discovery's):** exact wording/format
of the new prompt text (append to `{readFirst}` vs. a new dedicated
`{docsRefPointer}` var + template section) and whether it warns when
`docsRef` is set but a file under it turns out to be missing (mirrors
`skillPath`'s own no-existence-check stance, or diverges) — both are
render-string design choices for `fgos-coding-planning`/implement, not
open evidence gaps.

**Verdict:** `clear`, verify: `node --test test/runner/dispatch.test.mjs`
(existing suite covering `buildPrompt`/template rendering, confirmed via
GitNexus — implementer extends this suite's own `buildPrompt` cases with
`docsRef`-populated fixtures rather than adding a new file).
