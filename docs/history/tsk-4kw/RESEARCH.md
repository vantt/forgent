# RESEARCH — tsk-4kw

Accumulating record. Each round appends its own dated section; nothing here
is ever overwritten by a later round.

## Round 1 — 2026-08-13

### Asked

1. Does the defect still hold at base `a5a13e76`? (It was established at
   `ebe5674d`; main has moved since, so this needs re-confirming, not
   assuming.)
2. Are there any OTHER `addDecision` call sites in `src/` or `bin/` that
   omit `kind`, besides the two named — so this fix is not partial the
   same way the one it fixes was?
3. Would adding `kind: 'engine'` to those two calls break a currently
   passing test?
4. What verify shape fits, and where should a red-first test live?

### Checked

Repo-first; nothing in the goal named anything absent from the repo, so no
external lookup fired.

- `rg -n "kind !== 'engine'" src/state/cleanup-harness.mjs`
- `rg -n "addDecision\(" src bin` — the complete call-site census
- `sed -n` on each of the five `bin/fgos.mjs` sites
- `rg -ln "sync-root|promote-to-component" test/`, then
  `rg -n "decisions|decisionsById"` across every file that matched
- `rg -n "checkRetrospectiveContent" -A 3 test/state/cleanup-harness.test.mjs`

### Found

**Goal 1 — still true at `a5a13e76`.**

- `src/state/cleanup-harness.mjs:260` still carries the exact filter:
  `const hasDecision = (view?.decisionsById?.[id] ?? []).some((d) => d?.kind !== 'engine');`
- `bin/fgos.mjs:3957` — `sync-root`'s `addDecision({text, rationale, id})`,
  no `kind`. (Was `:3880` at the earlier base; the call itself is
  unchanged, only its line moved.)
- `bin/fgos.mjs:4161` — `promote-to-component`'s
  `addDecision({text, rationale, id})`, no `kind`. (Was `:4084`.)

**Goal 2 — exactly two, and the census actively strengthens the case.**

Five `addDecision` call sites exist in `bin/`, thirteen in `src/`:

| Site | `kind` | Correct? |
|---|---|---|
| `bin/fgos.mjs:1472` (`move --to delivered` override) | `'engine'` | yes |
| `bin/fgos.mjs:1926` (`fgos decision` verb) | none | **yes** — free-text, a person's own decision; must stay untagged |
| `bin/fgos.mjs:2236` (`driver-report`) | `'engine'` | yes — the tsk-qrs D10 fix |
| `bin/fgos.mjs:3957` (`sync-root`) | none | **NO — the defect** |
| `bin/fgos.mjs:4161` (`promote-to-component`) | none | **NO — the defect** |
| `src/intake/discovery.mjs` ×4, `src/intake/plan.mjs` ×6, `src/runner/claim-port.mjs:290` | all `'engine'` | yes |

`bin/fgos.mjs:1472` is the load-bearing find: it did not exist at the
earlier base, and whoever added it since tagged it `kind: 'engine'`
correctly. So the convention is understood and applied by default — these
two are genuine outliers, not the leading edge of a pattern nobody follows.
Nothing else is missing a tag. The fix is complete at two call sites.

**Goal 3 — no test would break.**

`rg -ln "sync-root|promote-to-component" test/` matches 8 files
(`entropy`, `drift-status`, `checks`, `fgos-approve`, `fgos-merge`,
`fgos-post-merge`, the CLI harness, `promote-engine`). Grepping every one
of them for `decisions|decisionsById` returns **no output at all** — not a
single test reads the decision records these two verbs write. They assert
on merge outcome and status, never on the decision log. Adding a field to
those two payloads is invisible to the existing suite.

**Goal 4 — `npm test`, with the red-first test in the file that already
owns this gate.**

`test/state/cleanup-harness.test.mjs` already covers
`checkRetrospectiveContent` directly (imported at :9), including the two
tsk-qrs D10 tests at :399 ("NOT ok when the only decision is an engine
record such as a driver report") and :412 ("ok when a real non-engine
decision sits alongside engine records"). A new test proving the
`sync-root` shape is rejected belongs immediately alongside those, in the
same `// --- checkRetrospectiveContent ---` block, following their exact
existing shape (build a `view` literal, call the function, assert on `ok`).

This is code, not skill prose, so
`docs/how-to/write-verify-for-a-skill-prose-change.md`'s POSITIVE/NEGATIVE
grep shape does not apply. `npm test` is the standing answer and genuinely
covers the change, because the new behavior is asserted by a real test
rather than by a text search.

### Still open

Nothing for any of the four goals.

### Verdict returned to caller

`{clear: true, verify: "npm test"}`
