# RESEARCH.md — tsk-13b

## Round 1 — 2026-08-13 (discovery stage, fgos-researching)

### Q1: Does `hasRealVerify()` really exact-match only 2 constants?

Checked: `src/intake/discovery.mjs`.

```
74: export const FALLBACK_VERIFY = 'chưa xác định — bổ sung thủ công';
84: export const RETIRED_P14_PLACEHOLDER = 'chưa xác định — P15 bổ sung';
89: function hasRealVerify(verify) {
90:   return typeof verify === 'string' && verify.trim() && verify !== FALLBACK_VERIFY && verify !== RETIRED_P14_PLACEHOLDER;
91: }
```

Confirmed exactly as the item describes: strict `!==` against two literal
constants, no prefix/pattern check. Callers using it: lines 327, 478, 506
(`resolveDiscovery`/`resolvePlan`-adjacent code), all delegate straight to
`hasRealVerify(work.verify)`.

Searched the rest of `src/` and `bin/` for any other placeholder-detection
logic that might already be pattern-based:

```
grep -rn "chưa xác định" src bin
```

Only 3 hits total, all in `src/intake/discovery.mjs` (the two constants
above) plus one more:

```
bin/fgos.mjs:85: const SUBMIT_VERIFY_SENTINEL = 'chưa xác định — P15 bổ sung';
```

`SUBMIT_VERIFY_SENTINEL` is a *third* literal (same text as
`RETIRED_P14_PLACEHOLDER`, defined independently in a different module) —
no shared import, no pattern helper. Nothing anywhere in `src/`/`bin/`
recognizes the `'chưa xác định —'` prefix generically. **Bug premise
confirmed against real source, not the description's paraphrase.**

Also confirms option (b) from the item's own two options ("normalize every
placeholder-generation site to the two exported constants") is harder than
it looks: there is no evidence in `src/`/`bin/`/`.claude/skills/` of a
central prompt or template that generates the *other* free-text
placeholder variants seen in the live backlog (e.g. `'chưa xác định — cần
thiết kế (...)'`) — those are written ad hoc by whichever session created
the item, following a prose convention, not a code path. Normalizing (b)
would mean constraining every future session's free text at write time,
not a one-file code fix; pattern-matching (a) is the smaller, purely
mechanical fix confined to `hasRealVerify()` itself.

### Q2: Is the live backlog evidence (4 cited ids) still accurate?

Checked: `node bin/fgos.mjs list --all --json --dir <repo-root>`, filtered
for `verify` strings starting with `'chưa xác định —'` but not equal to
either of the two exact constants.

Result — 3 of the original 4 ids still live, 1 has resolved off the list:

| id | status | verify (truncated) |
|---|---|---|
| tsk-8v1 | todo | `chưa xác định — clarify sẽ khoá` |
| tsk-45f | todo (stage: discovery) | `chưa xác định — cần thiết kế (planning sẽ chốt: unit test adapter ...)` |
| tsk-3y2 | todo (stage: discovery) | `chưa xác định — cần thiết kế (planning sẽ chốt: test giả lập impact() ...)` |

`tsk-7l9` (originally cited) no longer appears — consistent with the
current git log showing `fix(tsk-4n8)`/`docs(tsk-4n8)` commits that landed
around the same area; the item description itself flagged this id as
possibly stale. 704 total work items scanned.

**Verdict for both branches: evidence confirmed.** Bug premise holds
against real source; live-backlog count is 3 (not 4), does not change the
conclusion that the bug is real and currently live.
