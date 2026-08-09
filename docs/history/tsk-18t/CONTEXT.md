# tsk-18t — check-decision-supersession.mjs không đọc được `superseded_by` dạng LIST

## Feature boundary

Fix `scripts/check-decision-supersession.mjs` so it accepts `superseded_by`
in either scalar (`superseded_by: 0012`) or list (`superseded_by: [0028,
0029]`) form when checking a superseded record's backward pointer. Cover
both forms with tests. Separately: confirm and record whether this checker
runs against the real `docs/decisions/` anywhere in `npm test`/CI, since
it currently only runs against fixtures.

Out of scope (old debt, not this item — see "Deferred" below): the
`0027: supersedes frontmatter is not a clean list of ids` finding, and the
two `0026: no row found in 0000-index.md` findings.

## Locked decisions

| ID | Decision |
|----|----------|
| D1 | The checker's line 77 comparison (`target.meta.superseded_by !== record.id`) must accept both scalar and list `superseded_by`, normalizing to an array and checking membership (`.includes(record.id)`) rather than strict equality. The list form itself is correct and must not be "fixed" back to a scalar — `docs/decisions/0026-...md:9` genuinely carries `superseded_by: [0028, 0029]` because 0026 was superseded twice (0028 renamed orchestrator→launcher; 0029 fixed three vocabulary clauses), and `0029-...md` explicitly documents choosing a list over an overwrite for that reason. |
| D2 | Confirmed real gap: `scripts/check-decision-supersession.mjs` has no npm script and is never invoked in CI. `.github/workflows/ci.yml` only runs `npm test` (`node --test 'test/**/*.test.mjs'`), and the existing test suite (`test/scripts/check-decision-supersession.test.mjs`) only spawns the script against temp fixture directories, never against the real `docs/decisions/`. So `npm test` can stay green while real decision docs drift undetected. |
| D3 | Close the D2 gap by adding `npm run check:decision-supersession` (a standalone script, following the exact precedent of the sibling checker `check:events-seq` → `node scripts/check-events-seq-contiguity.mjs`), **not** by wiring it into CI or `npm test`. Rationale: (a) the item's own `verify` field only requires checking and documenting the gap, not closing it via CI — wiring into CI would be scope creep beyond what was asked; (b) `check:events-seq` is the direct sibling of this checker and already follows exactly this "own script, not CI-gated" convention, so this keeps the repo consistent; (c) the actual failure mode this checker guards against is decision-doc cross-reference hygiene, not a functional/runtime risk, matching the item's own `risk: low` / `tier: light`. CI-wiring (option B, rejected here) is a legitimate follow-up if stronger protection is wanted later, but is a separate, deliberate item — the same "tách item riêng nếu muốn dọn" pattern the item's own description already applied to the three out-of-scope findings above. User explicitly approved this recommendation over the CI-wiring alternative. |

## Pinned terms

None beyond what the item description already pins (list-vs-scalar
`superseded_by`, the three out-of-scope findings).

## Scout evidence

- `scripts/check-decision-supersession.mjs:77` — the strict scalar `!==`
  comparison that is the bug's root cause.
- `docs/decisions/0026-vision-orchestrator-roottask-capacity-native-vs-cli-spawn.md:9`
  — carries `superseded_by: [0028, 0029]`, confirming the list form is a
  real, intentional double-supersession, not drift.
- `docs/decisions/0029-sua-dinh-nghia-roottask-subtask-capacity-t1-cua-0026.md:84-88`
  — explicitly documents choosing `superseded_by: [0028, 0029]` (a list)
  over overwriting the existing `superseded_by: 0028` pointer.
- `docs/decisions/0028-doi-ten-orchestrator-thanh-launcher.md:63` — the
  first supersession of 0026, confirming two real, distinct supersede
  events.
- `.github/workflows/ci.yml` — confirmed the only CI step is `npm test`;
  no separate step runs any `check-*.mjs` script against real repo state.
- `package.json` `scripts` — confirmed `check-decision-supersession.mjs`
  has no npm script today, and `check:events-seq` (`node
  scripts/check-events-seq-contiguity.mjs --log .fgos/events.jsonl`) is the
  direct sibling precedent: its own npm script, not referenced anywhere in
  `.github/workflows/ci.yml`.
- `test/scripts/check-decision-supersession.test.mjs` — confirmed every
  existing test either calls the pure functions directly or spawns the CLI
  against a `fs.mkdtempSync` fixture dir; none point at the real
  `docs/decisions/`.
- `scripts/install-git-hooks.mjs` — confirmed no git hook references this
  checker either.

## Impact-analysis posture

`fgos tool query --capability impact-analysis --status present` returned
GitNexus `present` (freshly checked 2026-08-09). Posture: **full** per
`CLAUDE.md`'s gate — the MUST rules (run `impact()` before editing a
symbol, `detect_changes()` before committing) apply as written for the
implementation step. Not exercised in this clarify stage since no code was
edited here.

## Canonical references

- `scripts/check-decision-supersession.mjs`
- `test/scripts/check-decision-supersession.test.mjs`
- `docs/decisions/0026-vision-orchestrator-roottask-capacity-native-vs-cli-spawn.md`
- `docs/decisions/0028-doi-ten-orchestrator-thanh-launcher.md`
- `docs/decisions/0029-sua-dinh-nghia-roottask-subtask-capacity-t1-cua-0026.md`
- `.github/workflows/ci.yml`
- `package.json`

## Deferred (explicitly out of scope for tsk-18t)

- `0027: supersedes frontmatter is not a clean list of ids -- check by
  hand` — pre-existing finding, unrelated to the list-vs-scalar bug.
- `0026: no row found in 0000-index.md (expected a "[0026]" anchor)` (×2,
  once per supersede event) — pre-existing finding, unrelated to this bug.
- Wiring `check-decision-supersession` into CI/`npm test` (rejected
  alternative B in D3) — a legitimate future item if stronger protection
  against decision-doc drift is wanted, but deliberately not this item's
  scope.

## Outstanding questions

None
