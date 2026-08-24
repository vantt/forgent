# RESEARCH — tsk-3km: worker-prompt-skill-pointer.txt / worker-prompt-default.txt never state the [DONE]/[BLOCKED] requirement inline

## Round 1 (2026-08-24, discovery)

**Asked:** Do `src/runner/prompt-templates/worker-prompt-skill-pointer.txt`
and `worker-prompt-default.txt` currently omit the `[DONE]`/`[BLOCKED]`
completion-signal requirement inline, as the item describes? What exact
self-contained pattern does `worker-prompt-discovery.txt` use that could be
mirrored? What is the real 3-hop chain the item describes, and does it
actually resolve to `coding-worker-contract.md`'s Layer 1 rule 4? Is
template rendering a plain string-substitution (safe to add a static
section) or something more dynamic? Does any existing test assert on these
templates' content (for a real verify command)?

**Checked:**

- `src/runner/prompt-templates/worker-prompt-skill-pointer.txt` (47 lines,
  read in full).
- `src/runner/prompt-templates/worker-prompt-default.txt` (39 lines, read in
  full).
- `src/runner/prompt-templates/worker-prompt-discovery.txt` (65 lines, read
  in full).
- `.agents/skills/_shared/coding-worker-contract.md` (204 lines, read in
  full).
- `src/runner/prompt-templates.mjs` (`TEMPLATE_RULES`, `selectTemplate`,
  `renderTemplate`).
- `test/runner/prompt-templates.test.mjs` (golden-render tests).
- `grep -rn "worker-prompt-default\|worker-prompt-skill-pointer\|worker-prompt-discovery" src/ --include="*.mjs"` (non-test hits only).
- `grep -n "worker-prompt\|DONE\|BLOCKED" test/runner/dispatch.test.mjs`.

**Found:**

- **Confirmed: neither template states the token requirement inline.**
  Read both files in full — `worker-prompt-skill-pointer.txt` has sections
  `# Goal`, `# Agent skill`, `# Description`, `# Directive`, `# Files to
  read first`, `# Worktree boundary`, `# Expected proof`, `# Constraints`,
  `# Reporting discovered work` — none of them mention `[DONE]`/`[BLOCKED]`
  anywhere. `worker-prompt-default.txt` has the same set minus `# Agent
  skill` (it has NO `{skillPath}` placeholder at all — it never even
  reaches the 3-hop chain the item describes; a non-coding-domain dispatch
  through this template today has literally zero indirection path to the
  token requirement, an even more severe instance of the same gap).
- **The 3-hop chain is real and confirmed.** `worker-prompt-skill-pointer.txt`'s
  `# Agent skill` section points the worker at `{skillPath}` (rendered as
  e.g. `.claude/skills/fgos-coding-implement/SKILL.md`, a thin wrapper per
  its own header comment) → that file's canonical source
  `.agents/skills/fgos-coding-implement/SKILL.md` → which points at
  `../_shared/coding-worker-contract.md` (per that contract file's own
  `Precedent` section, confirmed: "`.agents/skills/fgos-coding-implement/SKILL.md`
  — the driver half this contract was split out of; the file `{skillPath}`
  points a dispatched worker at today"). `coding-worker-contract.md`'s
  Layer 1 rule 4 is where `[DONE]`/`[BLOCKED]` is actually specified.
- **`worker-prompt-discovery.txt`'s self-contained pattern (the one to
  mirror, adapted).** It has its own `# How to finish` section, placed
  right after `# Worktree boundary`, stating its completion protocol
  directly — but note it uses a DIFFERENT vocabulary
  (a fenced ` ```fgos-verdict ` JSON block with `{clear, verify, ...}`),
  because discovery-stage workers report a research verdict, not a
  done/blocked signal. The pattern worth mirroring for
  `worker-prompt-skill-pointer.txt`/`worker-prompt-default.txt` is
  structural (a same-named `# How to finish` section, inline, right after
  `# Worktree boundary`, stated directly rather than only reachable through
  an indirection chain) — not its literal JSON contents, which belong to a
  different stage's contract (`coding-worker-contract.md`'s Layer 1 rule 4:
  `[DONE]` / `[BLOCKED] <reason>`, "exiting is not signaling").
- **Rendering is plain string-substitution — a static addition is safe.**
  `prompt-templates.mjs`'s own header comment states substitution is
  "plain `{placeholder}` string-replace only — never a template engine",
  confirmed in `renderTemplate` (`text.split(`{${key}}`).join(...)` per
  key, no control flow). Adding a static, placeholder-free `# How to
  finish` section to both templates needs no new `vars` key and cannot
  interact with existing placeholders.
- **Existing golden tests will need updating as part of implementing this
  fix, not before.** `test/runner/prompt-templates.test.mjs` has two
  byte-for-byte golden-render assertions (`renderTemplate(worker-prompt-default.txt, ...)`
  and `renderTemplate(worker-prompt-skill-pointer.txt, ...)`) that assert
  the full rendered text — these are the real, mechanical proof that the
  new section landed correctly (and in the right position) once the
  templates are edited; they are expected to need editing alongside the
  templates, not a pre-existing gap. No test currently asserts presence of
  `[DONE]`/`[BLOCKED]` text in these two templates specifically (searched
  `test/runner/dispatch.test.mjs` — its `[DONE]`/`[BLOCKED]` hits are all
  about `executeExecutorCli`'s runtime *detection* of the tokens in a
  worker's stdout, a different, already-shipped mechanism from what this
  item is about: whether the worker is ever TOLD the vocabulary in the
  first place).
- **Scope precedent — a related but distinct item exists.**
  `docs/history/dispatch-execute-unsignaled-outcome/RESEARCH.md` (tsk-4oq)
  covers the CODE-side detection mechanism (`executeExecutorCli`'s own
  `outcome` field) — already shipped, per `coding-worker-contract.md`'s own
  tsk-5gd finding (backtick-stripping fix). This item (tsk-3km) is the
  distinct, still-open half: the PROMPT never states the requirement to
  the worker in the first place, independent of how well the detection
  code parses it once said. No overlap in file footprint (this item edits
  `src/runner/prompt-templates/*.txt` + its golden test; tsk-4oq's
  footprint was `src/runner/dispatch/cli.mjs`).

**Still open (for planning):** the exact wording of the new `# How to
finish` section (should closely mirror `coding-worker-contract.md`'s Layer
1 rule 4 language so the two never drift), and whether to add it identically
to both templates or trim slightly for `worker-prompt-default.txt` (which
has no `{skillPath}`/`# Agent skill` section to sit alongside) — a planning
detail, not a scope ambiguity.

**Verdict:** `clear`. Verify (real, runnable, narrow to the touched
templates + their own golden tests):

```bash
node --test test/runner/prompt-templates.test.mjs
```
