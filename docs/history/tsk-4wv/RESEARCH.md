# RESEARCH — tsk-4wv (final verify pass, dispatch-redesign batch)

## Round 1 — 2026-08-18 (discovery stage)

### Asked

Three ambiguity points from the item description:

1. Is the reported `bin/fgos.mjs` `decision` verb bug real — does `fgos
   decision write <text>` leak the literal token `write` into the stored
   decision text?
2. Is the driver/worker boundary in `fgos-coding-implement/SKILL.md`
   (enforced only by prose, "Stop reading after this section") a live,
   currently-unmitigated structural gap, or is it already closed at the
   mechanical/file level by `../_shared/coding-worker-contract.md`
   existing as a separate file?
3. Is the merged state of the batch (tsk-2uf, tsk-2uf-1, tsk-2uf-2,
   tsk-2uf-3, tsk-3wl5, tsk-7u7) coherent on `main` HEAD — tests green, no
   leftover TODO/stub markers?

### Checked / Found

**Point 1 — `bin/fgos.mjs` `decision` verb, positional-arg leak.**

- `bin/fgos.mjs:1942`:
  ```js
  const text = requireField(flags.text ?? (positional.length ? positional.join(' ') : undefined), 'decision requires --text "..."');
  ```
  `positional` comes from `parseArgs(rest)` where `rest = process.argv.slice(3)`
  (`main()`, `bin/fgos.mjs:4119-4120`) — i.e. everything after the verb
  word `decision`. Any non-`--flag` token the caller types after `decision`
  lands in `positional` and gets silently joined with spaces into the
  stored decision text when `--text` is omitted.
- Confirmed via the actual corrupted event already committed:
  `.fgos/events.jsonl` contains a decision payload whose `text` literally
  starts with `"write D-ADR0036: Khoá RUL11 ..."` — proof the original
  caller ran something like `fgos decision write "D-ADR0036: ..."`
  (unquoted leading word `write`, no `--text`), and `positional.join(' ')`
  absorbed `write` as the first word of the stored text.
- Checked every real call site: `bin/fgos.mjs` itself only ever documents
  `'decision requires --text "..."'` (no `write` sub-verb is parsed or
  recognized anywhere in the file); every skill that calls this verb
  (`fgos-coding-shaping`, `fgos-coding-validating`, `fgos-coding-planning`,
  `fgos-coding-exploring`, `fgos-coding-discovering`) uses `--text`
  explicitly (`.agents/skills/**/SKILL.md`, `grep -rn "fgos decision"`);
  every test (`test/e2e/pr-gate.test.mjs`, `test/state/decision-scope-
  field.test.mjs`, etc.) also uses `--text` explicitly. **Zero real call
  sites rely on the positional-join fallback.**
- Compared to `submit` (`bin/fgos.mjs:1166`): `const text =
  requireField(positional[0], ...)` — takes only `positional[0]`, not a
  join of every positional token. `decision`'s `positional.join(' ')` is
  strictly more permissive/dangerous than `submit`'s own convention for a
  similar free-text field.
- Checked the batch's own diff (`git diff 79d24bac~1 c70f32d0 -- bin/
  fgos.mjs`): the batch only added `edit --role` and `decision --kind`
  support: the `positional.join(' ')` line is untouched. Confirms the bug
  is still live, unfixed by the just-merged batch.
- **Verdict: bug is real.** Minimal correct fix: remove the silent
  `positional.join(' ')` fallback and require `--text` explicitly — this
  matches the ONLY syntax any real caller (skill, doc, test) has ever
  used, so it is a no-regression, no-scope-creep fix that eliminates the
  entire failure class (not just the literal word `write`) rather than
  special-casing one token.

**Point 2 — driver/worker boundary mechanical enforcement.**

- `.agents/skills/fgos-coding-implement/SKILL.md`'s "Driver vs. worker"
  section (line 21) does split the file into a driver half and tells an
  out-of-process worker to "Stop reading after this section" (line 43) and
  read only `../_shared/coding-worker-contract.md` instead — a real,
  separate file (142 lines, added in this same batch by tsk-2uf-2) that IS
  a genuinely independent worker-only document.
- But the actual dispatch path that hands a worker its instructions —
  `src/runner/dispatch/prepare.mjs`'s `buildPrompt` (`skillPath =
  \`.claude/skills/${skillName}/SKILL.md\`, line 113) plus the prompt
  template `src/runner/prompt-templates/worker-prompt-skill-pointer.txt`
  ("read {skillPath} in your own checkout ... it governs how this work
  item must be done") — points the worker at the FULL combined driver+
  worker `SKILL.md`, never at `coding-worker-contract.md` directly. The
  worker-only file exists, but nothing in the actual dispatch wiring
  points there — the boundary is enforced ONLY by the "stop reading" prose
  living inside the same file the worker is told to open in full.
- **Verdict: the broader structural gap is real and currently
  unmitigated** — an out-of-process worker (or its own retrieval/
  summarization step) that reads past the "stop reading" line still has
  the driver-only Flow steps/`fgos handoff`/`fgos return` text in its
  context, exactly the independent-review concern the item cites. This
  confirms the item's own framing precisely: the mechanical boundary
  exists at the FILE level (`coding-worker-contract.md`) but not at the
  DISPATCH level (`skillPath` still resolves to the combined file).
- Scope judgment (not a research finding, a decision left to this item's
  own close-out): hardening this for real means changing what `skillPath`
  resolves to for an out-of-process worker dispatch (`prepare.mjs`) and/or
  restructuring how `fgos-coding-implement/SKILL.md` is split on disk —
  a `src/runner/dispatch/*.mjs` change with cross-cutting effect on every
  domain's dispatch path, well beyond a `tier: light` verify-checkpoint
  item's proportionate scope, and explicitly outside what this item's
  brief authorizes touching without a "genuine, disclosed reason" (which
  this research supplies, but scoping the actual fix does not belong in
  this item). Recommendation: leave as a disclosed, accepted limitation
  for now; worth a dedicated follow-up item if/when it is prioritized.

**Point 3 — batch merge coherence.**

- `git log --oneline --all --grep` confirms all six merge commits
  (`79d24bac` tsk-2uf, `83961b57`/`a0c50097` tsk-2uf-1/tsk-2uf-3,
  `3ca070f8` tsk-3wl5, `298019ed` tsk-7u7, `c70f32d0` tsk-2uf-2) are on
  `main` HEAD, and `c70f32d0` is exactly tsk-4wv's own
  `branchHeadAtTake` — the batch is fully merged, nothing dangling.
- `grep -n "TODO\|FIXME\|XXX\|not implemented"` across every file the
  batch touched (`src/runner/dispatch.mjs`, `src/runner/dispatch/*.mjs`,
  `bin/fgos.mjs`, `.agents/skills/fgos-coding-implement/SKILL.md`,
  `.agents/skills/_shared/coding-worker-contract.md`) — zero hits (after
  excluding tsk-id references, which are not markers). No `.skip`/`.todo`
  left in the batch's own new test files.
- Full `npm test` on this worktree (main HEAD, `c70f32d0`): **3650 tests,
  3645 pass, 0 fail, 5 skipped, 0 todo.** The 5 skips are all pre-existing,
  environment-conditional "canary (bee)" tests that self-report `bee
  installation not found — canary chỉ chạy trong checkout xưởng` — an
  honest, expected skip outside the factory checkout, not a batch
  regression.
- **Verdict: batch state is coherent.** No follow-up needed beyond this
  item's own scope.

### Still open

None — all three points resolved to a `clear` verdict with the evidence
above.
