# Plan — fgos-coding-driving claim step branch by domain.worktreeBacked

Item: tsk-5y5 | CONTEXT.md: same directory

## Mode

**tiny** — flag count: 1 of 10 (`multi-domain`: the change is specifically
about domain-aware claim branching). All others (auth, authorization, data
model, audit/security, external systems, public contracts, cross-platform,
existing covered behavior, weak proof around the area) do not apply — this
is a prose-only edit to 2 mirrored skill-doc files, no code path, no
runtime behavior change for the only domain that exists today (`coding`,
always `worktreeBacked:true`, so its behavior is explicitly unchanged by
D1). A couple of files, one direct task — matches `tiny` exactly, not
`small`/`standard`.

`fgos graph --json` confirms tsk-5y5 sits in its own size-1 component (no
deps, no children today) — not on any critical path, nothing to order
against.

## Approach

Chosen path: apply D1 + D2 (both locked in `CONTEXT.md`) verbatim as a
single atomic prose edit to both mirror files.

Alternatives considered and rejected:
- **Defer the fix** — rejected already, upstream of this item: the
  research report (`plans/reports/internal-research-260804-1230-...md`
  §5) states fix-now was chosen before this item was even filed; not
  re-litigated here.
- **Change `bin/fgos.mjs` (engine code)** — rejected. The item's own
  description and D1 are explicit: `claimWork`'s `isolate` param and
  `take --id`'s stage-agnostic claim already support both branches
  (verified in CONTEXT.md's scout evidence); no engine change is needed
  or wanted.
- **Leave Red Flags/D9-D10 intro untouched** — rejected per D2 (user's
  explicit choice in the `fgos-coding-exploring` gate round): add one clarifying
  line instead, to prevent a future reader seeing the new branch as
  contradicting the coding-only disclaimer.

Risk map:

| Component | Risk | Proof point |
|---|---|---|
| `fgos-coding-driving/SKILL.md` prose (hard rule + loop pseudocode + Red Flags line) | Low — doc-only, no code path, no test surface, no behavior change for the only domain in production use today (`coding`) | The verify command already locked via `fgos discover` (recorded on the item, `gates.contextApprove.verify`): both mirror files stay byte-identical; both the hard-rule paragraph and the loop pseudocode's claim step read `domain.worktreeBacked`; the `true` path is unchanged (`fgos pick` + `EnterWorktree`); the `false` path specifies `fgos take --role session --id <id> --dir root`, explicitly skips `EnterWorktree`, and invokes the executing-stage skill at the main checkout; the Red Flags section carries the added D2 clarifying line |

No medium/high risk entries — nothing here needs a `fgos-coding-validating` proof
point beyond re-confirming the verify command above is runnable and
matches what actually got written.

Impact-analysis capability gate (`CLAUDE.md`): checked in `fgos-coding-exploring`
(GitNexus present, freshly checked → **full** posture) — moot for this
item regardless, since no symbol/function is edited; no blast-radius proof
point applies to a prose-only doc change.

Files touched (both edited together, in the same commit, to preserve the
byte-identical-mirror invariant `CONTEXT.md`'s scout evidence already
confirmed holds today):
- `.claude/skills/fgos-coding-driving/SKILL.md`
- `.agents/skills/fgos-coding-driving/SKILL.md`

## Shape

Direct note (tiny mode — no phased breakdown needed):

1. In both files, the "Claim right before the FIRST invocation..." hard
   rule (currently unconditional `fgos pick` + `EnterWorktree`): read
   `domain.worktreeBacked` before claiming. `true` → today's text,
   unchanged. `false` → `fgos take --role session --id <id> --dir root`,
   no `EnterWorktree`, invoke the executing-stage skill directly at the
   current (main-checkout) cwd.
2. In both files, the loop pseudocode's claim step (currently
   "claim `id` (`fgos pick`) and enter its worktree BEFORE invoking"):
   same branch, expressed as pseudocode consistent with the hard rule's
   prose.
3. In both files, the "Red flags" section: add one line (D2) stating the
   `worktreeBacked` branch reads an already-registered per-domain field
   and is not itself an assertion that the loop generalizes to a new
   domain — so it does not contradict the existing D9/D10 disclaimer.
4. Confirm `diff` between the two files still exits 0 after the edit.

Concrete cases worth being able to point to afterward (tiny-mode depth —
no dedicated test, since none exists for this file type):
- A reader following the hard rule for a hypothetical future
  `worktreeBacked:false` domain with a real executing-stage skill sees the
  correct `take`-based path, not a forced worktree.
- A reader following the hard rule for today's only real domain (`coding`,
  `worktreeBacked:true`) sees byte-for-byte the same instructions as
  before this change.
- A reader of "Red flags" does not conclude the new branch contradicts
  D9/D10.

## Split

No split. One honest piece of work — both files edited together as a
single item, no child items created.

## Proof surface (for the gate below and for `fgos-coding-validating`)

Verify (already the item's own live `verify` field, set during
`fgos-coding-exploring`'s gate and confirmed by `fgos discover --verdict clear`):
per-file `worktreeBacked` present in both the hard-rule and loop-pseudocode
locations, `true`-path unchanged, `false`-path names `fgos take --role
session --id <id> --dir root` with no `EnterWorktree`, Red Flags carries
the D2 line, and the two mirror files stay byte-identical via `diff`.
