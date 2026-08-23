# tsk-2lg — pattern-based allowlist for iron-law-evidence.md meta-citations in launcher-vocabulary-guard

Mode: **tiny** (1 flag: existing covered behavior — this touches an
existing test's own allowlist/negative-check logic. No auth/data-model/
audit-security/external-system/public-contract/cross-platform/multi-domain
flags apply; a single-file, additive logic change).

No local `CONTEXT.md` — direct-entry item (the `clarify -> decompose`
dormant edge fired straight through: `fgos-clarifying`'s own intent
verdict was `clear`, so `fgos-coding-exploring` never ran). The item's own
description already carries the full spec: the repeated pattern (5
separate manual `ALLOWED_FILES` additions across tsk-33w, tsk-4eu, tsk-2uo
x2, and the automated-changelog-compound-learn item), the proposed fix
shape (a path-pattern exemption alongside `ALLOWED_FILES`, not instead of
it), and the one hard constraint (the main NEGATIVE check must keep
catching real leaks outside this exact pattern).

## Approach

`test/docs/launcher-vocabulary-guard.test.mjs` already generalizes one
allowlist category this same way: `HERDR_HISTORY_DOC` (line 65) is a
regex-based dir/path exemption sitting next to `ALLOWED_FILES`'s
per-file `Map`, checked in `isDirAllowed()` alongside the
`ALLOWED_DIR_PREFIXES` prefix list. This item adds a second regex-based
exemption of the same shape, scoped to the one recurring file shape named
in the item description: `docs/history/<any-id>/iron-law-evidence(-<suffix>)?.md`.

Why this exact shape is safe to generalize (confirmed by reading all 6
matching `ALLOWED_FILES` entries already in the file today):

| Existing entry | Path shape |
|---|---|
| `docs/history/launcher-vocabulary-rename/iron-law-evidence.md` | `docs/history/<id>/iron-law-evidence.md` |
| `docs/history/tsk-33w-capacity-dispatch-command-audit-field/iron-law-evidence.md` | same |
| `docs/history/tsk-4eu-executors-key-tier-validation/iron-law-evidence.md` | same |
| `docs/history/tsk-2uo-launcher-vocabulary-guard-allowlist/iron-law-evidence.md` | same |
| `docs/history/automated-changelog-compound-learn/iron-law-evidence.md` | same |
| `docs/history/automated-changelog-compound-learn/iron-law-evidence-tsk-3ip.md` | `docs/history/<id>/iron-law-evidence-<suffix>.md` |

Every one of these is a meta-citation: an item's own `iron-law-evidence.md`
quoting this guard's own NEGATIVE assertion message (which itself contains
the literal pinned word, e.g. `pinned term "orchestrator" leaked back
into: ...`) as real pre-existing-failure transcript evidence — never fresh
prose deploying the term. This is structural, not incidental: any item
that documents a real pre-existing failure of *this exact guard* in its
own `docs/history/<id>/iron-law-evidence*.md` is quoting the guard's own
output by construction, which is exactly the shape the item's description
asks to stop hand-adding one entry at a time for.

Scope discipline (per the item's own hard constraint): the new pattern
covers ONLY this one path shape. It does not touch `ALLOWED_DIR_PREFIXES`,
`HERDR_HISTORY_DOC`, or any of the remaining ~24 `ALLOWED_FILES` entries
(decision docs, DISCUSSION.md citations, how-to guides, etc.) — those
don't share a generalizable path shape (each is a one-off, per the item's
own description) and stay hand-listed exactly as before. A real
"orchestrator" leak anywhere else in the tree — including any OTHER file
under `docs/history/**` that isn't named `iron-law-evidence*.md` at the
feature-dir top level — is still caught by the unchanged NEGATIVE check.

Implementation shape:
- Add `IRON_LAW_EVIDENCE_META_CITATION` regex next to `HERDR_HISTORY_DOC`
  (same file, same section): `/^docs\/history\/[^/]+\/iron-law-evidence(-[^/]+)?\.md$/`.
- Check it in `isDirAllowed()` alongside `HERDR_HISTORY_DOC.test(file)`.
- Remove the 6 now-redundant `ALLOWED_FILES` entries listed in the table
  above (DRY — the pattern subsumes them; leaving stale duplicate entries
  would just be dead weight the next reader has to reconcile against the
  new pattern).
- Add a `POSITIVE`-style self-check test asserting the new pattern matches
  the 6 real historical paths above (true positive) and does NOT match a
  sibling file in the same feature dir with a different name, e.g.
  `docs/history/tsk-2uo-launcher-vocabulary-guard-allowlist/plan.md` (true
  negative) — same self-check discipline the file already applies to
  `isDirAllowed`/`ALLOWED_FILES` (lines 141-149).

Impact-analysis posture: not applicable — no runtime code symbol is
touched, only this one test file's own allowlist/negative-check logic;
nothing here leans on blast-radius evidence.

## Risk map

| Component | Risk | Proof point |
|---|---|---|
| `IRON_LAW_EVIDENCE_META_CITATION` regex + `isDirAllowed()` wiring | low — additive exemption, narrowly scoped to one path shape | new self-check test (true positive on the 6 real paths, true negative on a sibling non-evidence file) |
| Removing the 6 redundant `ALLOWED_FILES` entries | low — pure dedup, pattern already covers the same paths | `node --test test/docs/launcher-vocabulary-guard.test.mjs` (the item's own recorded `verify`) stays green after removal |
| Main NEGATIVE check strength | the one thing that must not regress | existing `NEGATIVE self-check: a synthetic in-scope violation is actually caught` test (lines 136-139) still passes unchanged — it targets a path outside the new pattern, so it keeps proving real leaks are still caught |

## No split

One file (`test/docs/launcher-vocabulary-guard.test.mjs`), one additive
regex plus a dedup cleanup. Proceeds as itself.

## Outstanding questions

None
