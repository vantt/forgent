# tsk-12t — mechanical known-bad-verify-pattern check

## Feature boundary

`judgeVerifySemanticCorrectness` (`src/intake/judge-executor.mjs`) is the
independent second-pass judge that checks a proposed `verify` command
before it gets locked onto a work item. It currently only asks an LLM
whether the command semantically proves the item's claim — it never
mechanically checks the command's *text* against the already-documented
known-bad-pattern class in
`docs/how-to/avoid-vacuous-pass-with-node-test-test-name-pattern.md`
(the `node --test --test-name-pattern` reporter-format mismatch: Node's
default reporter never prints TAP-style `# pass`/`# fail` lines, so a
verify command grepping for that literal shape can never correctly detect
pass/fail, regardless of what the tested code actually does).

`tsk-4sz` hit exactly this mistake live: its proposed verify
(`grep -qE "^# pass [1-9]"`) is the exact wrong-reporter-format bug
`tsk-580` already hit and documented. The second-pass LLM judge disputed
that verify 3 times over content/coverage concerns but never caught the
format bug — it only surfaced empirically when `fgos return`'s real spawn
ran the command and it silently failed.

This item adds a cheap, mechanical pre-check for that one known trap class
(reporter-format mismatch only — not the separate, harder-to-detect
vacuous-match trap the same how-to doc also describes), so it never has to
rely on the LLM catching a known syntactic anti-pattern every single time.

## Scout evidence

- `docs/how-to/avoid-vacuous-pass-with-node-test-test-name-pattern.md` —
  the canonical trap doc. Title itself scopes to `node --test
  --test-name-pattern` specifically, not TAP output in general.
- `src/intake/judge-executor.mjs:347` (`judgeVerifySemanticCorrectness`) —
  the actual shared function both callers below invoke; `buildVerifyCheckPrompt`
  (line 305) never references the how-to doc today.
- **GitNexus impact query** (`impact-analysis: full` — GitNexus present,
  freshly checked via `fgos tool query --capability impact-analysis
  --status present`) confirmed `judgeVerifySemanticCorrectness` has **two**
  independent call sites, not one:
  - `src/intake/discovery.mjs:652` (`resolveDiscovery`, stage `clarify`) —
    the case this item's own title names.
  - `src/intake/plan.mjs:703` (`resolveDecompose`, stage `decompose`,
    per-child `verify` during chia-việc) — an equally-real second exposure
    to the same bug class the item description did not originally name.
- `docs/explanation/fgos-choke-point-pattern.md` — confirms the existing
  fgOS convention for exactly this shape of gap: when the same higher-level
  decision needs to apply at every caller of a shared primitive, the fix
  belongs *inside* the shared primitive (here, `judgeVerifySemanticCorrectness`
  itself), not duplicated per call site.
- `src/runner/loop.mjs:978` — the runner's blind clarify sweep calls
  `resolveDiscovery` with no surrounding `try/catch`; a newly-thrown error
  type from deep inside would be an unvetted crash risk, unlike the
  existing `putInAwaiting` park path already proven safe there.

## Locked decisions

| ID | Decision |
|----|----------|
| D1 | The mechanical check lives inside `judgeVerifySemanticCorrectness` (`src/intake/judge-executor.mjs`), run before the LLM spawn — the one shared function both `resolveDiscovery` and `resolveDecompose` already call, so both callers are fixed with no call-site changes. |
| D2 | The check only trips when the verify string BOTH references Node's test runner (`node --test` / `--test-name-pattern`) AND matches the wrong-reporter grep shape (e.g. `/\^#\s*(pass\|fail)\b/`) — not a bare pattern-anywhere match — scoped exactly to the how-to doc's own documented trap, to avoid false-positiving a legitimate TAP-consuming verify from an unrelated tool. |
| D3 | On a trip, return the existing `{agrees: false, reason}` shape `judgeVerifySemanticCorrectness` already returns for an LLM disagreement, but mark the reason as mechanical (a distinct field or prefix) so both callers can tell it apart from an LLM-sourced disagreement. |
| D4 | Short-circuit: skip the `runJudgeExecutor` LLM spawn entirely once the mechanical check trips — return immediately, per the item's own stated rationale (cheaper than a per-call LLM judgement). |
| D5 | Out of scope: no change to `buildVerifyCheckPrompt` (the LLM prompt) and no change to `fgos-coding-exploring`'s `SKILL.md` prose. The mechanical gate at the shared choke point is self-enforcing regardless of either; the separate vacuous-match trap stays the LLM judge's job. |
| D6 | The mechanical trip is **not** forceable via the existing `--force` override. It is a syntactic fact (Node's default reporter never prints `^# pass`/`^# fail`), not a judgement call an LLM could plausibly get wrong. Both call sites (`resolveDiscovery`, `resolveDecompose`) must check D3's mechanical marker before honoring `--force`, and must refuse to let `--force` bypass a mechanical-flagged disagreement — unlike today's uniform `--force` handling of any LLM disagreement. |

## Pinned terms

- **Known-bad-pattern trap (this item's scope)** — the reporter-format
  mismatch only: a verify command targeting `node --test
  --test-name-pattern` whose pass/fail check greps for a TAP-style
  `^# pass`/`^# fail` line, which Node's default reporter never emits.
- **Vacuous-match trap (explicitly out of scope)** — a `node --test
  --test-name-pattern` command that matches zero real tests but still
  reports a pass via the file-wrapper count. Not mechanically detectable
  by a regex; stays the LLM second-pass judge's job (unchanged by this item).

## Outstanding questions deferred to planning

- Exact mechanical marker shape for D3 (a new `{agrees, reason,
  mechanical: true}` field vs. a reason-string prefix `judgeVerifySemanticCorrectness`'s
  two callers parse) — implementation detail, not a product decision.
- Exact regex for D2 and how `--force`'s existing call-sites
  (`discovery.mjs`, `decompose.mjs`) read the D3 marker before honoring
  `--force` — implementation detail.

## References

- `docs/how-to/avoid-vacuous-pass-with-node-test-test-name-pattern.md`
- `docs/explanation/fgos-choke-point-pattern.md`
- `src/intake/judge-executor.mjs`
- `src/intake/discovery.mjs`
- `src/intake/plan.mjs`
