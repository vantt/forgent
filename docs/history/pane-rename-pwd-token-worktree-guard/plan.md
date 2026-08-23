# Plan — tsk-1ml

Mode: tiny

1 flag applies (existing covered behavior: the 4-way mirror set is
already checked by `test/skills/fgos-mirror.test.mjs`) — a single
one-line mechanical substitution, replicated identically across 4 known
mirror copies of one file, verified by an existing test. No auth/
authorization/data-model/audit-security/external-system/public-contract/
cross-platform/weak-proof/multi-domain concerns.

## Approach

**Chosen path:** in `references/loop-mechanics.md` Step 5 (all 4 mirror
copies), replace the literal `"$PWD"` token in the pane-rename command
with a literal placeholder `"<path>"`, plus a prose instruction telling
the invoking session to substitute its own already-known absolute
worktree path there — never the unresolved shell variable. This is the
exact same fix shape (and near-identical prose wording) `tsk-3rg`/
`tsk-jyn` already shipped for the sibling `root=$(git rev-parse ...)`
occurrence earlier in the same file, evidenced verbatim in
`docs/history/driving-discovering-worktree-guard-note/RESEARCH.md`.

**Alternatives rejected:**
- Have the isolation guard itself special-case this invocation shape, or
  resolve `$PWD` before its own complexity check (one of the item's own
  two originally-proposed fix directions) — **not achievable**. RESEARCH.md
  Round 1 confirms the guard is a Claude Code harness-level built-in, not
  implemented anywhere in this repo; the same conclusion two independent
  prior items already reached for the same guard
  (`tsk-3rg`, `worktree-guard-compound-command-prose-fix`).

**Risk map:**
| Component | How risky | What proves it |
|---|---|---|
| 4 mirror copies of one doc line | light — prose-only, no code path changed | `test/skills/fgos-mirror.test.mjs` (mirror-consistency) + a live repro inside a worktree-isolated session, same shape as this item's own RESEARCH.md Round 1 |

No medium/high-risk entries — no proof point beyond the verify below is
needed. `impact-analysis` posture: GitNexus registered and `present`
(`fgos tool query --capability impact-analysis --status present`), but
not invoked for a proof point here — this fix has no blast-radius
dependency (a doc line read by an LLM, not a code symbol with callers) so
GitNexus's code-graph reach has nothing to answer here; noted for the
record per the capability-gate instruction, not because the plan leans on
it.

**Files touched (identical one-line edit in each, per RESEARCH.md's
already-confirmed 4-way mirror set):**
1. `domains/coding/skills/fgos-coding-driving/references/loop-mechanics.md:87`
2. `plugins/fgOS/skills/fgos-coding-driving/references/loop-mechanics.md:87`
3. `.agents/skills/fgos-coding-driving/references/loop-mechanics.md:87`
4. `.claude/skills/fgos-coding-driving/references/loop-mechanics.md:87`

Order does not matter — the 4 files are already-established byte-identical
mirrors of one canonical source; the same edit applies to each
independently, no dependency between them.

## Shape

Direct note (tiny mode, no phased plan needed): each of the 4 files gets
its Step 5 pane-rename block changed from

```bash
bash plugins/fgOS/skills/terminal/rename.sh "<id>" "$PWD"
```

to

```bash
bash plugins/fgOS/skills/terminal/rename.sh "<id>" "<path>"
```

with a preceding prose sentence naming `<path>` as the session's own
already-known absolute worktree path (the same one `EnterWorktree` just
switched into, or the main-checkout root pre-`EnterWorktree`) and stating
plainly why: a worktree-isolated session's own isolation guard refuses
this exact command when it can't statically verify a path behind an
unresolved shell variable stays inside the worktree, even though the
identical script is safe to run with a literal, already-resolved path —
confirmed live for this item (RESEARCH.md Round 1: `"$PWD"` refused,
literal resolved path succeeds, same session, same script, same args).

No split — this is one honest, direct piece.

## Verify

Already synced onto the item at discovery (real, not a placeholder) —
`fgos-coding-validating`/`fgos-coding-implement` will run this as-is,
no further edit needed here:

```
node --test test/skills/fgos-mirror.test.mjs
```

Strengthened here with the concrete positive/negative shape this class of
prose fix needs (per `docs/how-to/write-verify-for-a-skill-prose-change.md`
— the doc's own literal path glob names `SKILL.md` files but its
rationale, no static shell command can assert LLM-interpreted runtime
prose behavior, applies identically to a `SKILL.md`'s own `references/`
file), to be run as an additional pre-return check inside `fgos-coding-implement`
before calling `fgos return`, alongside the stored `verify` command above:

```bash
npm test && \
grep -qF 'rename.sh "<id>" "<path>"' domains/coding/skills/fgos-coding-driving/references/loop-mechanics.md && \
grep -qF 'rename.sh "<id>" "<path>"' plugins/fgOS/skills/fgos-coding-driving/references/loop-mechanics.md && \
grep -qF 'rename.sh "<id>" "<path>"' .agents/skills/fgos-coding-driving/references/loop-mechanics.md && \
grep -qF 'rename.sh "<id>" "<path>"' .claude/skills/fgos-coding-driving/references/loop-mechanics.md && \
! rg -q --hidden --glob '!.git' --glob '!node_modules' 'rename\.sh "<id>" "\$PWD"' .
```

POSITIVE (each mirror carries the fixed line) + NEGATIVE (the old broken
`"$PWD"`-token line is gone repo-wide, not just in the 4 known copies) +
`npm test` (full-suite regression, including the mirror-consistency test
that already covers this exact 4-file set).

## Outstanding questions

None
