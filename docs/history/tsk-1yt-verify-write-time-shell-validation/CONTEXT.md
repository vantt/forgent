---
item: tsk-1yt
stage-at-write: clarify
---

# tsk-1yt — validate `work.verify` as runnable shell at write time

## Feature boundary

`work.verify` is never validated as syntactically-parseable shell at the
point it is written — only checked for "non-empty string" (or nothing at
all, on some write paths). The real execution happens much later, in
`goal-check.mjs`'s `runCommand`, via `spawn(command, { shell: true, cwd })`
— on this repo's POSIX runtime that resolves to `/bin/sh -c <command>`. A
`verify` string containing unescaped shell metacharacters (bare `(`,
unmatched quotes, unescaped backticks) is accepted silently at write time
and only breaks at `fgos return`/`fgos approve`, producing a false
`blocked` verdict on otherwise-correct work.

This item closes that gap: every write path that can set `work.verify`
must reject (or park, depending on the path — see D3) a value that is not
valid, parseable shell, at write time instead of at execution time.

## Locked decisions

| ID | Decision |
|----|----------|
| D1 | Scope covers all write paths that can set `work.verify`: `fgos add --verify`, `fgos edit --verify`, `fgos gate-approve --verify` (direct writes, `store.mjs`), **and** `fgos discover --verdict clear --verify` plus `fgos discover --verdict decompose`'s per-child `verify` (the judged-verdict path, both routed through `judgeVerifySemanticCorrectness` in `verify-pattern-check.mjs`). Decompose child verify was not named explicitly in the item's own title/description, but it shares the exact same second-pass hook (`decompose.mjs:705` calls the identical function `discovery.mjs:329` calls) — excluding it would leave the identical bug class open in a sibling code path, contradicting the item's own goal of making this failure mode harder to hit again. Locked as a scout-grounded default, not asked to a person (fgOS priority #2 — ask only when a person's judgment is genuinely required; this was a straight DRY/consistency read of already-wired code, not a product judgment call). |
| D2 | Validation checks syntax only (is this parseable shell?), never semantics (does this command do the right thing?) — same boundary `judgeVerifySemanticCorrectness`'s own doc comment already draws for the existing pattern-check ("this file does NOT catch... a verify that is syntactically fine shell but targets the wrong claim"). A syntactically valid but semantically wrong verify stays out of this item's scope. |
| D3 | Failure behavior differs by path, matching each path's own existing shape: the three direct-write CLI verbs (`add`/`edit`/`gate-approve`) reject the write outright (same `StoreError('validation', ...)` shape `store.mjs:814`'s existing empty-string check already uses) — there is no verdict object to park there. The judged-verdict path (`discover --verdict clear`, decompose child verify) parks the item in `awaiting-human`, mechanical and non-`--force`-overridable, identical to how an existing `judgeVerifySemanticCorrectness` disagreement already behaves today (tsk-12t D6 precedent) — this is a new check added to the same existing mechanism, not a new mechanism. |

## Pinned terms

- **"valid, runnable shell"** — parses without a syntax error under the
  same shell `goal-check.mjs` actually executes verify through
  (`/bin/sh -c`, since `spawn(cmd, {shell:true})` resolves there on this
  repo's Linux runtime). Not "the command succeeds" — only "the shell
  doesn't choke on the string before any real check runs."

## Scout evidence

- `src/runner/goal-check.mjs:36` — `spawn(command, { shell: true, cwd })`, the one real execution path every write surface below eventually feeds.
- `src/state/store.mjs:814` (`recordGateApprove`) — only existing check on any write path today: non-empty string. `addWork`/`editWork` (same file) have no verify check at all.
- `src/intake/verify-pattern-check.mjs` (`judgeVerifySemanticCorrectness`) — existing mechanical, non-`--force`-overridable second-pass judge (tsk-12t D1/D2/D4/D6), currently scoped to one documented reporter-format trap only, not shell-syntax validity.
- `src/intake/discovery.mjs:329` — calls `judgeVerifySemanticCorrectness(verdict.verify)` on the `discover --verdict clear` path; disagreement parks in `awaiting-human` unless `--force` (except when `mechanical: true`, per tsk-12t D6, which no `--force` overrides).
- `src/intake/decompose.mjs:705` — calls the identical function on each child's `verify` during `discover --verdict decompose`.
- `docs/how-to/fix-a-verify-command-broken-by-mixed-in-prose.md` — two prior live incidents (tsk-34y, tsk-45u) hitting this exact defect class (`Syntax error: "(" unexpected`, `Syntax error: Unterminated quoted string`), confirming this is recurring, not hypothetical.
- Capability gate (`CLAUDE.md`): `fgos tool query --capability impact-analysis --status present` → gitnexus `present` → **impact-analysis: full**. Not load-bearing for this item (no code changed by `fgos-exploring` itself); recorded for the implementer.

## Canonical references

- `docs/how-to/fix-a-verify-command-broken-by-mixed-in-prose.md`
- `src/intake/verify-pattern-check.mjs`
- `docs/decisions/` — tsk-12t (mechanical/non-force-overridable second-pass precedent, cited above)

## Outstanding questions

None
