# Research — worker-prompt-iron-law-evidence-timing (tsk-3ys)

## Round 1 — 2026-08-24

**Asked:** Does the out-of-process worker prompt template (or the code that
builds it) already have access to the `classifyIronLaw` result at
prompt-build time, before dispatch — so it could be injected as data instead
of asking the worker to run it itself? Which template file(s) actually need
the fix? What exact recipe does the driver-side flow use for producing
failing-test-first evidence, and can the worker reuse it verbatim inside its
own isolated worktree?

**Checked (repo, all citations `file:line` against this worktree's checkout
at `fgw/tsk-3ys`, branched from main after tsk-3km merged):**

- `src/runner/iron-law-gate.mjs:57-59` (`ironLawForItem`) — calls
  `changedFiles(repoRoot, item, ...)` (`src/runner/merge.mjs:364-378`), which
  diffs `trunk...branch` via real `git diff --name-only`. This is only
  meaningful AFTER the item's branch has real commits — at prompt-BUILD time
  (before the worker has done anything) the diff is empty/nonexistent. So
  `required:true/false` cannot be precomputed and injected into the prompt;
  it can only be known after work is committed. This forecloses the
  description's alternative option ("fgos cung cấp kết quả required:true/
  false sẵn trong prompt context") — confirmed infeasible, not just unused.
- `rg -n "classifyIronLaw" src bin --glob "*.mjs"` — only one real call site
  outside the definition/tests: `src/runner/iron-law-gate.mjs:59`, used by
  `src/verbs/merge/merge.mjs:94`, `src/verbs/merge/sync-root.mjs:66`,
  `src/verbs/merge/approve.mjs:285` — all merge-time gates, none reachable
  from a worker's own dispatch. No standalone CLI verb exposes it (checked
  `bin/fgos.mjs` — only comments/evidence-path helper at lines 190-205, no
  `iron-law` subcommand). Confirms a worker must invoke `classifyIronLaw`
  directly via a `node --input-type=module -e` snippet, same shape every
  existing `iron-law-evidence.md` in `docs/history/*/` already uses.
- `.agents/skills/fgos-coding-implement/references/verify-commit-and-iron-law.md:23-75`
  — the exact driver-side recipe to mirror: commit first (or, for an
  out-of-process worker, reuse the worker's own already-landed commit — the
  same file's own "If mechanism was out-of-process" branch, lines 37-41,
  already tells the DRIVER to skip re-committing and classify the worker's
  commit directly), THEN run `classifyIronLaw` against the real committed
  diff via
  `import { changedFiles } from './src/runner/merge.mjs'; import { classifyIronLaw } from './src/evolve/iron-law.mjs'; import { listWork } from './src/state/store.mjs'; const item = listWork('.fgos').work[id]; ...`
  — write `docs/history/<id>/iron-law-evidence.md` when `required:true`,
  commit it as a follow-up commit before `fgos return`.
- **Worktree constraint, not present in the driver-side recipe:** confirmed
  live (`ls -la .fgos` from inside this item's own worktree,
  `/home/vantt/projects/forgentX/.claude/worktrees/tsk-3ys-Bl5nor`) — no
  `.fgos/` directory exists in a linked worktree (ADR0020, also stated in
  `fgos-coding-discovering/SKILL.md:50-52`). The driver's own `listWork
  ('.fgos')` step is therefore NOT copy-pasteable into the worker prompt —
  the worker template's own existing Constraints section already forbids
  touching `.fgos/` at all ("Never call `fgos` yourself and never write to
  `.fgos/` directly"). `changedFiles(repoRoot, item, opts)`
  (`src/runner/merge.mjs:364`) only actually needs `item.id` (used to
  resolve the branch name) — not the full stored item — and a worktree
  shares the same git object database/refs as the main checkout, so `git
  diff trunk...branch` resolves correctly run from inside the worker's own
  worktree with `repoRoot: '.'`. `detectTrunk` (`src/runner/merge.mjs`,
  called by `changedFiles`'s own default) is a pure `git` lookup, no
  `.fgos/` dependency either (confirmed via `rg -n "detectTrunk"` — only
  `git` calls). So the worker CAN run the classification without touching
  `.fgos/`, but needs its own id from a source other than the store: derived
  from its own current branch name, `branchNameFor` (`fgw/<id>`,
  `src/runner/worktree.mjs`) — `git branch --show-current` stripped of the
  `fgw/` prefix — never from `listWork`.
- `src/runner/prompt-templates.mjs:35-38` (`TEMPLATE_RULES`) — confirms
  `worker-prompt-skill-pointer.txt` is the ONLY template selected for
  `domain: 'coding'` (the item's own named target, matching its
  description exactly); `worker-prompt-default.txt` is the fallback for
  every OTHER domain. `src/evolve/iron-law.mjs:19-33` (`MODULE_RULES`) only
  lists fgOS's own self-modifying source paths (`src/runner/`,
  `src/evolve/`, `bin/fgos.mjs`, `src/state/store.mjs`, etc.) — this repo's
  own dogfooded source, never a target any non-`coding`-domain item could
  touch. Confirms `worker-prompt-default.txt`/`worker-prompt-discovery.txt`
  are out of this item's real scope; only `worker-prompt-skill-pointer.txt`
  needs the addition.
- `src/runner/prompt-templates/worker-prompt-skill-pointer.txt` (current
  state, post-tsk-3km) — read in full. tsk-3km already landed a "# How to
  finish" section (the `[DONE]`/`[BLOCKED]` completion-signal contract) right
  before "# Expected proof". No `{id}` placeholder is threaded into
  `renderTemplate`'s vars today (`src/runner/dispatch/prepare.mjs:120-132` —
  `title/kind/description/feedbackSection/action/readFirst/docsRefPointer/
  refs/verify/domain/skillPath`, no `id`). Confirms the worker must derive
  its own id from its branch name at runtime rather than from a new template
  placeholder — keeps this item's footprint to the template file alone, no
  `prepare.mjs` code change needed.
- `docs/how-to/produce-failing-test-first-proof-for-an-iron-law-gated-diff.md`
  (read in full) — the concrete stash-based recipe to point the worker at:
  identify the affected test file(s), `git stash push -- <implementation
  files only, never test files>`, run the same test command and capture the
  real red output, `git stash apply` (never `pop`, until green is
  reconfirmed), rerun and confirm green, optionally run the full suite, write
  `docs/history/<id>/iron-law-evidence.md` with the real matched
  flags/modules and red/green transcript excerpts, commit as a follow-up
  commit. Same file's own "Watch out for" section is the exact bug this
  item's own decisions already reproduced live (tsk-2l0/tsk-5cf): running
  `classifyIronLaw` before committing reads an empty diff and gives a false
  `required:false` — the worker prompt must say explicitly to run the check
  AFTER its own commit lands.

**Still open:** none — every point needed to write the template addition is
resolved above.

**Verdict:** `clear`. Verify: `npm test -- test/runner/prompt-templates.test.mjs`
(the existing contract test file already pinning
`worker-prompt-skill-pointer.txt`'s fixed sections — a new section must not
break it, and if the test suite has its own convention for asserting a
section's presence, the same convention should cover the new "Iron Law
evidence" section).
