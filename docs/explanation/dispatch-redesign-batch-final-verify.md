---
authoritative_for: fgos decision positional-args leak fix, driver/worker boundary disclosed gap, dispatch-redesign batch final verify pass
---

# Final verify pass on the dispatch-redesign batch: one bug fixed, one gap disclosed

`tsk-4wv` was a close-out verify pass on the whole `tsk-2uf`/`tsk-3wl5`/
`tsk-7u7` dispatch-redesign batch, chasing three findings an independent
review had raised but not yet resolved.

## Fixed: `fgos decision`'s silent positional-args leak

`bin/fgos.mjs`'s `decision` verb used to accept a text fallback:

```js
const text = requireField(flags.text ?? (positional.length ? positional.join(' ') : undefined), 'decision requires --text "..."');
```

Any non-`--flag` token typed after the verb word `decision` landed in
`positional` and got silently space-joined into the stored text when
`--text` was omitted. This wasn't hypothetical — a real corrupted event
was already committed to `.fgos/events.jsonl`: a decision whose text
literally started with `"write D-ADR0036: ..."`, proof someone ran `fgos
decision write "D-ADR0036: ..."` (unquoted leading word, no `--text`) and
the fallback absorbed `write` as the first word.

Checked every real call site (every `SKILL.md` under `.agents/skills/`,
every test) — all of them already used `--text` explicitly; **zero real
callers relied on the positional fallback**. The fix removes it entirely
rather than special-casing the literal word `write`:

```js
const text = requireField(flags.text, 'decision requires --text "..."');
```

This eliminates the whole failure class (any stray leading token), not
just the one word that happened to trigger it, and changes nothing for
any caller that already used `--text` — which was all of them.

## Disclosed, not fixed: the driver/worker boundary is prose-enforced, not dispatch-enforced

`tsk-2uf-2` split `fgos-coding-implement/SKILL.md` into a driver half and
a worker half, telling an out-of-process worker to "Stop reading after
this section" and read `../_shared/coding-worker-contract.md` instead — a
real, separate, worker-only file (see
`docs/reference/coding-worker-contract-shape.md`).

But the actual dispatch wiring never points there. `src/runner/dispatch/
prepare.mjs`'s `buildPrompt` resolves `skillPath =
.claude/skills/${skillName}/SKILL.md` — the **full combined** driver+
worker file — and the prompt template tells the worker to "read
{skillPath} ... it governs how this work item must be done." The
worker-only contract file exists, but nothing in the dispatch path
actually hands it to the worker directly. The boundary is enforced only
by the "stop reading" instruction living *inside* the same file the
worker is told to open in full — an out-of-process worker (or its own
retrieval/summarization step) that reads past that line still sees the
driver-only Flow steps and `fgos handoff`/`fgos return` instructions.

**This was left as a disclosed, accepted limitation, not fixed here.**
Fixing it for real means changing what `skillPath` resolves to for an
out-of-process worker dispatch — a `src/runner/dispatch/*.mjs` change
with cross-cutting effect on every domain's dispatch path, judged well
beyond this verify-checkpoint item's proportionate scope. If prioritized,
it needs its own dedicated item — this is a known open gap, not a
resolved one, and a future session finding a worker having read
driver-only instructions should trace back here rather than assume it's
already fixed.

## Confirmed clean: the batch itself

All six merge commits (`tsk-2uf`, `tsk-2uf-1`, `tsk-2uf-2`, `tsk-2uf-3`,
`tsk-3wl5`, `tsk-7u7`) were confirmed on `main` HEAD, no dangling
TODO/FIXME/`.skip` markers in any file the batch touched, and a full
`npm test` run at that HEAD reported 3650 tests, 3645 pass, 0 fail, 5
skipped (all pre-existing, environment-conditional "canary (bee)" skips
outside the factory checkout — not a batch regression).
