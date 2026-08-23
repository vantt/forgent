# Rename skill `fgos-executing` → `fgos-coding-implement`

## Feature boundary

Rename the `coding` domain's `executing`-stage skill from `fgos-executing`
to `fgos-coding-implement`, everywhere the literal string is load-bearing or
descriptive — code, tests, skill docs, product docs — while leaving the
two governed state files (`.fgos/state.json`, `.fgos/events.jsonl`)
untouched. Not a behavior change to what the skill does; a naming change
to the skill's identity, including the `capacityId` it doubles as.

## Locked decisions

| ID | Decision |
|----|----------|
| D1 | Full rewrite covers all markdown docs, including dated historical snapshots: `docs/history/*`, `plans/*`, `plans/reports/*`. Does **not** cover `.fgos/state.json` or `.fgos/events.jsonl` — live materialized state and an append-only event log respectively; every skill in this repo carries a hard rule against writing `.fgos/` state directly (one-door-write, CTR001), and no verb exists to bulk-patch historical fields inside old records. Hand-editing those two files would falsify recorded events, not just relabel them. |
| D2 | The doc file `docs/how-to/smoke-test-fgos-executing-with-a-trivial-item.md` is renamed to `docs/how-to/smoke-test-fgos-coding-implement-with-a-trivial-item.md`, with the corresponding entry in `docs/enduser-docs-index.json` updated to match. |
| D3 | The `capacityId` string `fgos-executing` — used as the `coding` domain's `executing`-stage skillMap value in `src/state/workflow-stage-graphs.mjs` and as the runner's default dispatch lookup key in `src/runner/dispatch.mjs` — is renamed to `fgos-coding-implement` too, kept in full sync with the skill's display name. This is a runtime-behavior-adjacent change, not a pure doc edit: verified via `.fgos/config.json` (no `fgos-executing` key in its `capacities` block) and `.fgos/state.json`'s `tools` registry (only `gitnexus`, `submit-assist-classify` registered) that nothing live in this repo currently keys off the old literal string, so no other config needs a matching update here. Any external, out-of-repo local capacity config keyed literally `fgos-executing` would silently fall back to default after this change — accepted risk per explicit user choice. |

## Pinned terms

- **"live/current-state docs"** — docs describing the system as it exists
  today: `docs/specs/*`, `docs/reference/*`, `docs/explanation/*`,
  `docs/tutorials/*`, `docs/distillery/*`, `docs/how-to/*`, `CLAUDE.md`,
  `AGENTS.md`, every `SKILL.md` under `.claude/skills/`, its mirror under
  `.agents/skills/`, and `plugins/fgOS/skills/*/SKILL.md`. All in scope for
  D1.
- **"dated historical snapshot"** — anything under `docs/history/`,
  `plans/`, or `plans/reports/` that records a decision or plan as of a
  point in time. Per D1, these ARE rewritten (full find-and-replace),
  despite being point-in-time records — user's explicit choice, overriding
  the discovery-stage default recommendation to leave them untouched.
- **"governed state files"** — `.fgos/state.json` (live materialized
  state, read/written only through `fgos` verbs) and `.fgos/events.jsonl`
  (append-only event log). Both excluded from this rename regardless of
  D1's broader scope — a structural exception, not a scope narrowing of D1
  itself.

## Scout evidence

- `rg -- "fgos-executing" src bin test docs dogfood-fixture --glob "*.{mjs,cjs,md}"` —
  204 files match.
- `src/state/workflow-stage-graphs.mjs:90` — `executing: 'fgos-executing'`
  in the `coding` domain's `skillMap`; comment at line 81 also names it.
- `src/runner/dispatch.mjs` — consumes the skillMap value as the default
  `capacityId` for dispatch.
- Tests hardcoding the literal string: `test/runner/dispatch.test.mjs`
  (~19 refs), `test/runner/loop.test.mjs`, `test/runner/prompt-templates.test.mjs`,
  `test/state/workflow-stage-graphs.test.mjs`.
- Skill dir: `.claude/skills/fgos-executing/SKILL.md`, mirrored (identical
  content, separate real files, not a symlink) at
  `.agents/skills/fgos-executing/SKILL.md`.
- Cross-referencing `SKILL.md` files naming `fgos-executing` by name, both
  under `.claude/skills/` and `.agents/skills/`: `fgos-routing`,
  `fgos-coding-driving`, `fgos-coding-shaping`, `fgos-coding-exploring`,
  `fgos-coding-planning`, `fgos-coding-validating`.
- `plugins/fgOS/skills/{decompose,discover-next,cook}/SKILL.md` reference
  it in prose.
- `docs/specs/{reading-map,work-state,runner}.md`, several
  `docs/reference/*.md`, `docs/explanation/*.md`, `docs/tutorials/*.md`,
  `docs/distillery/deep-dives/tool-registry.md`, `docs/how-to/*.md`
  (including the file renamed per D2), and `CLAUDE.md`.
- `.fgos/config.json` `capacities` block: no `fgos-executing` key present
  today.
- `.fgos/state.json` `tools` registry: only `gitnexus`,
  `submit-assist-classify` registered — no `fgos-executing` entry.
- `.fgos/state.json`: 39 matches (historical task titles/notes/refs).
  `.fgos/events.jsonl`: 29 matches (event log). Both excluded per the
  governed-state-files exception above.
- `docs/enduser-docs-index.json` carries an entry pointing at
  `docs/how-to/smoke-test-fgos-executing-with-a-trivial-item.md` — must be
  updated to the new filename per D2.

## Impact-analysis capability gate

`fgos tool query --capability impact-analysis --status present` returned
one provider: `gitnexus`, `status: present`. Per `CLAUDE.md`'s gate:
**full** — the GitNexus "Always Do"/"Never Do" MUST rules apply as written
during implementation (run `impact()` before editing
`workflow-stage-graphs.mjs`'s `skillMap`/`skillForStage`, run
`detect_changes()` before committing).

## Canonical references

- `src/state/workflow-stage-graphs.mjs` — `skillMap`/`skillForStage`, the
  single source of truth `fgos-routing` and `fgos-coding-driving` both
  read from.
- `src/runner/dispatch.mjs` — capacityId resolution/default.
- `docs/enduser-docs-index.json` — end-user doc index, needs the D2
  filename update reflected.

## Outstanding questions deferred to planning

None — all three material decisions (scope boundary, doc filename,
capacityId sync) are locked. Planning's own job is sequencing the ~200
file edits safely (skill dir rename first vs. code first, GitNexus
`impact()`/`rename()` usage per AGENTS.md's Never-Do rule against raw
find-and-replace on tracked symbols, and how to batch the docs/history +
plans/reports rewrite without missing files).

## Addendum: D4 — this doc's own directory is a verify exception

| ID | Decision |
|----|----------|
| D4 | `docs/history/rename-fgos-executing-to-fgos-coding-implement/` (this directory, including this file) is excluded from the "zero leftover `fgos-executing` reference" verify check — both the content grep and the tracked-path check. This is the decision record ABOUT the rename itself; by definition it must keep naming the old skill to document what changed FROM and TO. Requiring it to scrub its own subject would make the verify command permanently unsatisfiable. This is a structural exception like the governed state files (D1's addendum), not a narrowing of D1's product-docs scope — every other `docs/history/*` file still gets the full rename. |

Surfaced by the second-pass verify judge during clarify (two prior
`verify-disputed` rounds also caught real gaps: a broken
`--exclude-dir` basename-only match against `.claude/worktrees/**`, a
missing `.fgos/events.jsonl.backup-*` exclusion, and the content-only
grep's blindness to a leftover directory/file still literally *named*
`fgos-executing` — all folded into the verify command below).

A third verify-disputed round caught one more gap: `rg` skips hidden
directories by default, so the content grep never scanned
`.claude/skills/**` or `.agents/skills/**` at all — exactly where scope
items 1 and 4 (the skill dir rename, the six cross-referencing SKILL.md
files) live. Fixed with `--hidden`.

A fourth verify-disputed round caught the verify command only asserting
the NEGATIVE (old string gone) and never the POSITIVE (new deliverables
actually exist) — deleting the skill dirs outright instead of renaming
them would have passed the same command clean. Added `test -f`/`grep -q`
assertions for the three renamed deliverables (skill dir frontmatter x2,
the D2 doc file, the D3 capacityId line).

A fifth round, caught by `fgos return`'s own re-verify (not a second-pass
judge dispute this time — the real thing): `fgos-executing`'s own Iron Law
evidence doc (`docs/history/tsk-f38/iron-law-evidence.md`, written during
Execute per that skill's rule 4) legitimately quotes the old literal string
in its failing-test-first transcript — same class of exception as D4, one
directory over. Added to the exclusion list.

Final verify command:

```
npm test && test -f .claude/skills/fgos-coding-implement/SKILL.md && test -f .agents/skills/fgos-coding-implement/SKILL.md && grep -q "^name: fgos-coding-implement$" .claude/skills/fgos-coding-implement/SKILL.md && grep -q "^name: fgos-coding-implement$" .agents/skills/fgos-coding-implement/SKILL.md && test -f docs/how-to/smoke-test-fgos-coding-implement-with-a-trivial-item.md && grep -q "executing: .fgos-coding-implement." src/state/workflow-stage-graphs.mjs && ! rg -l --hidden "fgos-executing" --glob "!node_modules" --glob "!.git" --glob "!.claude/worktrees/**" --glob "!.fgos/state.json" --glob "!.fgos/events.jsonl*" --glob "!docs/history/rename-fgos-executing-to-fgos-coding-implement/**" --glob "!docs/history/tsk-f38/**" . && ! git ls-files | grep "fgos-executing" | grep -v "^docs/history/rename-fgos-executing-to-fgos-coding-implement/" | grep -v "^docs/history/tsk-f38/"
```
