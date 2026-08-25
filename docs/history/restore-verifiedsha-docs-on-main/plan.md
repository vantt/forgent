Mode: tiny

Flag count: 0 (no auth/data-model/audit/external-systems/public-contract/
cross-platform/multi-domain concerns; a two-file prose restoration).

## Approach

`main` currently lacks `--worker-verified-sha`/`verifiedSha` documentation
in `.claude/skills/fgos-coding-implement/references/{return-mechanics.md,
implement-and-collaboration.md}` (and, confirmed by direct read on this
branch, ALSO in their canonical source
`domains/coding/skills/fgos-coding-implement/references/` and the
assembled `.agents/skills/...` copy, and the `plugins/fgOS/skills/...`
mirror — all four currently 0 matches for `worker-verified-sha`). This is
a real regression: `bin/fgos.mjs:3159` confirms `--worker-verified-sha` is
a live, implemented CLI flag; the documentation describing it existed
before commit `180f58cf` (an out-of-process dispatch from tsk-ri8 that
mis-landed on `fgw/tsk-3gr` and rode along into `main` via that item's own
merge, carrying an unrelated `npm run build:skills` side effect that
overwrote these 2 files with stale canonical content).

A prior attempt (tsk-ri8's own branch, commit `7657f290`) fixed this via
`git revert`, but that revert brought the files back to match the 3-way
merge BASE exactly — so when `fgw/tsk-ri8` merged into `main`, git saw
"no change on tsk-ri8's side relative to base" for those 2 paths and kept
main's already-regressed version. A revert-shaped fix cannot survive a
merge against a base that already diverged this way.

**Forward-fix, canonical-source-first:** edit the CANONICAL source
(`domains/coding/skills/fgos-coding-implement/references/{return-mechanics.md,
implement-and-collaboration.md}`) to add back the exact content — verified
directly from git history (`git show 5dc41c7e:.claude/skills/...`, the
commit right before tsk-ri8's own regression fix, which itself matches
the pre-regression content) — then run `npm run build:skills` to
regenerate `.agents/skills/...`, `.claude/skills/...`, and
`plugins/fgOS/skills/...` from that canonical source. This is a genuine
forward diff against current `main` (not a revert-to-base), so it will
show as a real change on both sides of any future 3-way merge and
survive normally. It also fixes the ROOT cause (canonical source itself
was missing this content, not just a downstream mirror), so a future
`npm run build:skills` run anywhere else in this repo won't silently
regress it again the same way.

**Alternatives rejected:** hand-editing only the `.claude/skills/...`
mirror (as the original, now-reverted fix effectively did) — rejected,
same reason as tsk-ri8's own plan: contradicts the canonical-source
convention and would drift the next time anyone runs `build:skills`.

**Risk:** light — two prose reference files, canonical source + 3
regenerated mirrors, no runtime code path touched.

## Shape

Single tiny piece, no split.

1. Edit `domains/coding/skills/fgos-coding-implement/references/return-mechanics.md`:
   restore the `--worker-verified-sha`-aware framing (the
   `fgos return <id> [--worker-verified-sha <sha>]` usage line and its
   surrounding paragraph explaining when to pass the flag).
2. Edit `domains/coding/skills/fgos-coding-implement/references/implement-and-collaboration.md`:
   restore the `verifiedSha`-aware framing in the out-of-process dispatch
   branch (confirming the worker's commit, then reading `verifiedSha`
   from the `execute` call's JSON stdout if present).
3. Run `npm run build:skills` to regenerate `.agents/skills/...`,
   `.claude/skills/...`, `plugins/fgOS/skills/...` from the canonical
   source.
4. Confirm all four copies match (byte-identical for the canonical +
   3 mirrors) and contain the restored content.

## Outstanding questions

None.
