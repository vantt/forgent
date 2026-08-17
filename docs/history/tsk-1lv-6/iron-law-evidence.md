# Iron Law evidence: tsk-1lv-6

`classifyIronLaw` (`src/evolve/iron-law.mjs`), run against this item's own
committed diff (commit `41b5b065`):

```json
{
  "required": false,
  "matchedFlags": [],
  "matchedModules": []
}
```

Unlike every prior sibling in this feature (`tsk-1lv-1` through
`tsk-1lv-5`), this item's own diff touches none of the self-modifying
gate/verify machinery `MODULE_RULES` lists — its 5 changed files are 2
skill-prose files, `docs/architecture-manifest.json`, and a new pure
report module plus its test file. No inherited-module citation is needed
either: no prior sibling's own evidence covers a module this item never
touches.

## Verify command

```
node --test test/report/authoritative-match.test.mjs
```

## Failing-before / passing-after transcript (this item's own new module)

`src/report/authoritative-match.mjs` did not exist before this item
(`git show HEAD~1:src/report/authoritative-match.mjs` → `fatal: path ...
exists on disk, but not in 'HEAD~1'`), so "before" is the module absent:

**Before** (real transcript, module moved aside):

```
$ mv src/report/authoritative-match.mjs /tmp/authoritative-match.mjs.aside
$ node --test test/report/authoritative-match.test.mjs

code: 'ERR_MODULE_NOT_FOUND'
✖ test/report/authoritative-match.test.mjs (34.234621ms)
ℹ tests 1
ℹ pass 0
ℹ fail 1
```

**After** (real transcript, module restored):

```
$ mv /tmp/authoritative-match.mjs.aside src/report/authoritative-match.mjs
$ node --test test/report/authoritative-match.test.mjs

ℹ tests 15
ℹ pass 15
ℹ fail 0
```

## Collateral checks run (this item's own footprint: 2 skill files + manifest)

```
$ node --test test/skills/fgos-mirror.test.mjs   # 13/13 pass — .agents/ and
                                                  # plugins/fgOS/ copies of
                                                  # fgos-coding-compounding/SKILL.md
                                                  # confirmed byte-identical
$ node --test test/architecture.test.mjs         # 3/3 pass — new module
                                                  # registered, one row per
                                                  # .mjs file, layering intact
$ node --test test/cli/fgos-manifest.test.mjs    # 11/11 pass — unaffected,
                                                  # run as a sanity check
                                                  # since command-registry.mjs
                                                  # was not touched this item
```

## Full suite

```
$ npm test
ℹ tests 3574
ℹ pass 3567
ℹ fail 2
```

The 2 failures are the same pre-existing, environment-caused baseline
every prior sibling in this feature also reported unchanged
(`test/runner/dispatch.test.mjs`'s `agy` reference-capacity assertions —
depend on a locally-installed `agy` binary this environment does not
have; unrelated to `docs/architecture-manifest.json`,
`src/report/authoritative-match.mjs`, or either `SKILL.md`).

## `src/report/frontmatter.mjs` — footprint-listed, no code change

The item's own footprint lists `src/report/frontmatter.mjs`, but no edit
was made to it. `authoritative_for` is a flat scalar frontmatter key —
`parseFrontmatter`/`renderFrontmatter` already handle it generically
(neither function enumerates known keys; both operate on whatever
`key: value` pairs a doc's frontmatter block actually contains). This was
confirmed by direct testing, not assumed: `findAuthoritativeMatch`'s own
unit tests exercise realistic `{path, authoritativeFor}` candidate shapes
that a caller would build from `parseFrontmatter(doc).meta.authoritative_for`,
and DISCUSSION.md's own round-10 note for this task
(`docs/history/canonical-decision-projection/DISCUSSION.md:1341`) already
recorded the same conclusion ahead of implementation: "`authoritative_for`
vào frontmatter (`src/report/frontmatter.mjs` đã có, mở rộng)" — the field
slots into what the module already supports, it does not require
extending the module's shape.

## D8's "harness backstop" — what was and was not built

D8 (`docs/history/canonical-decision-projection/CONTEXT.md`): "tìm-trước-
khi-tạo = doctrine ... + harness backstop (check mechanical trong verify
chain) — KHÔNG BAO GIỜ một hàm gate sống." Built exactly that split:

- **Doctrine** — `fgos-coding-compounding/SKILL.md` step 3 now instructs
  scanning `authoritative_for` for a skeleton match before deciding a
  target path from quadrant+filename guesswork, and to create a new doc
  with its own `authoritative_for` line so later captures on the same
  topic find it.
- **Harness backstop** — `findDuplicateAuthoritativeClaims` (mechanical,
  unit-tested, callable) mirrors bee's own `duplicate_authoritative_for`
  bundle-wide check, grouping candidates by skeleton-normalized
  `authoritativeFor` and reporting every group with more than one member.
  It is exported for a verify chain to call, but this item does not wire
  it into `bin/fgos.mjs` or any CLI verb — doing so would make it a live
  gate, which D8 explicitly rules out. Wiring a caller (retrospective's
  four-door sweep is the natural fit, mirroring `tsk-1lv-5`'s own doors)
  is future work, out of this item's own declared footprint.

## D6 — reconcile exception

The "do not delete, shorten, or restructure" rule (both the grow-vs-create
bullet and its twin in Red Flags) now carries an explicit exception: when
a new capture genuinely contradicts existing prose, reconciling
(retiring/rewriting the contradicted part) is correct — silently leaving
two mutually-exclusive claims standing side by side is the red flag,
not the reconcile. Deleting/shortening prose the new capture does not
actually contradict remains disallowed; the exception is narrow.
