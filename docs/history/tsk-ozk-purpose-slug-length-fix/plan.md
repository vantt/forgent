# tsk-ozk — purposeSlug length fix + docs/knowledge/ prefix decision — plan.md

Mode: **high-risk**

Flags counted (per `fgos-routing`'s Mode gate): **data model** (registry-wide
`purposeSlug` rewrite across 247/332 active topics — 74% of the live
knowledge registry), **public contracts** (partially supersedes the locked
layout clause of D-tsk28x-5, which `scripts/knowledge-migration.mjs` and
`docs/architect/knowledge-registry-redesign.md` both currently encode as
the flat `docs/<purposeSlug>/<role>.md` shape), **existing covered
behavior** (`test/cli/knowledge-verbs.test.mjs`,
`test/scripts/knowledge-classifier.test.mjs`,
`test/scripts/knowledge-migration.test.mjs` all exercise this area today),
**weak proof around the area** (whether a mid-flight topic rename still
passes tsk-5mh's own already-computed `plannedMoves`/conservation check
was not proven live, only reasoned from code — see Risk map). 4 flags →
**high-risk** per the 4+ threshold, independently consistent with the
item's own `risk: heavy` / `tier: heavy` classification from the
`discovery` stage.

No split: this item stayed a single pass-through piece. A real split's
child specs must each cite a decision id from this feature's own
`CONTEXT.md` "## Locked decisions" table (`fgos-coding-planning`'s own
`references/split-and-child-specs.md`), and this item's `discovery`
verdict was `clear` — it skipped `exploring` entirely, so no `CONTEXT.md`
and no locked-decision ids exist to cite. Both parts below are also small
enough, and gate the same downstream item (tsk-5mh) the same way, that
splitting would not have bought independent workability worth the citation
problem.

## Approach

Grounded in `RESEARCH.md`'s Round 1 (all six named mechanisms confirmed
real in code, plus the description's own 247/420/307 numbers independently
verified against the live registry). Two parts, both required before
tsk-5mh's real apply can resume; neither depends on the other, so either
can go first — Part A goes first here since it is the confirmed-real crash
(`ENAMETOOLONG`), the higher-severity blocker.

### Part A — purposeSlug length-bound rule + apply

**Decided bound: 60 UTF-8 bytes.** This is the number the item's own
description already uses as its working diagnostic threshold (and the
number `fgos discover`'s verdict already wired into the item's `verify`
field), it keeps directory names short/scannable per
`docs/architect/knowledge-registry-redesign.md:100`'s own "reusable reader
job, not a title restatement" framing, and it leaves 195 bytes of headroom
under the ~255-byte filesystem path-component limit that actually produced
the `ENAMETOOLONG` crash — no existing constant in the codebase to defer
to (`RESEARCH.md` Finding 1: grepped, zero hits).

**Decided algorithm:**
1. Truncate `purposeSlug` to 60 UTF-8 bytes at a code-point boundary
   (never split a multi-byte UTF-8 sequence), then trim a trailing `-`
   left by the cut.
2. Check the truncated value against every OTHER active topic's
   `(purposeSlug, role)` pair for the same `role` this topic already
   carries (`RESEARCH.md` Finding 3 — `purposeSlug` alone need not be
   globally unique; `assertCurrentPathUnique` enforces uniqueness on the
   resulting `currentPath`, i.e. the `(purposeSlug, role)` pair). If no
   collision, use the truncated value as-is.
3. On a real collision: append `-` + the first 6 hex chars of a SHA-1 of
   the ORIGINAL (untruncated) `purposeSlug`, re-truncating the base to fit
   the combined result within 60 bytes total. Deterministic (same input →
   same output), so a re-run after a partial failure reproduces the same
   plan.

**Apply:** enumerate the 247 affected topics with the exact query
`RESEARCH.md`'s verified verify command already runs (`fgos list --all
--json` → `data.topics` filtered `status === 'active' &&
Buffer.byteLength(purposeSlug, 'utf8') > 60`), compute each one's new slug
per the algorithm above, then call `fgos topic rename <topicId>
--new-purpose-slug <computed> --new-purpose-title <topic's own current
purposeTitle, unchanged>` per topic (`RESEARCH.md` Finding 2 — real,
already-wired verb; `bin/fgos.mjs:1630-1634` →
`renameTopicStore` → `knowledge-registry.mjs`'s `topic.rename` reducer,
line 264-280, which re-validates via `assertSafeSlug` and records
`lineage.renamedFrom` for traceability). Script the 247 calls (a small
Node driver over the CLI, or direct `renameTopicStore` calls inside a
one-off script under this feature's own history dir) — never 247 manual
invocations.

### Part B — docs/knowledge/ prefix decision

**Decided: yes, adopt the `docs/knowledge/<purposeSlug>/<role>.md`
prefix.** The item's own description already reports the user's explicit
ask ("asked for a docs/knowledge/<purposeSlug>/<role>.md prefix instead");
the "proper decision... and design pass" language in the description is
about recording and implementing that ask correctly, not re-opening
whether to do it.

1. Record the decision:
   ```bash
   fgos decision --id "tsk-ozk" \
     --text "Knowledge registry doc paths gain a docs/knowledge/ prefix: docs/knowledge/<purposeSlug>/<role>.md, not the flat docs/<purposeSlug>/<role>.md D-tsk28x-5 locked. Requested by the user after reviewing tsk-5mh's dry-run output as too messy against a bare docs/ root." \
     --rationale "user-requested layout change, tsk-5mh dry-run review; D-tsk28x-5's anti-duplication clause (path-as-identity-pair) is untouched, only the literal path prefix changes" \
     --relation "supersedes:D-tsk28x-5"
   ```
   Precedented: `docs/history/compound-learn-artifact-registry/DISCUSSION.md:924-925`
   already superseded a DIFFERENT clause of this same D-tsk28x-5 the same
   way (D-tsk28x-13, the anti-duplication clause) — this is the same
   move, a different clause.
2. Implement the prefix in the one real construction site
   (`scripts/knowledge-migration.mjs:137`): `docs/${purposeSlug}/${item.role}.md`
   → `docs/knowledge/${purposeSlug}/${item.role}.md`.
3. Update the documented layout in
   `docs/architect/knowledge-registry-redesign.md:97` and `:166` (both
   currently show the flat form) to match.
4. Update `test/scripts/knowledge-migration.test.mjs`'s expected target
   paths to the new prefixed form (currently asserts the flat shape —
   grepped, real existing coverage to keep green, not new coverage to
   add).

## Risk map

| Component | How risky | What would prove it |
|---|---|---|
| 247 `fgos topic rename` calls | Medium — write-heavy but each call is a validated, reversible, append-only event (`lineage.renamedFrom` preserved); a bad batch is traceable and re-runnable, never silently destructive | `test/cli/knowledge-verbs.test.mjs` (existing rename coverage) green after the batch; `RESEARCH.md`'s verify command reads 0 |
| Truncate+dedupe collision on `(purposeSlug, role)` | Medium — the registry's own `assertCurrentPathUnique` throws loudly on a real collision (`RESEARCH.md` Finding 3), never corrupts silently | Dry-compute the full 247-item rename plan first and check `(purposeSlug, role)` pairs for collisions against the CURRENT 332-topic set before applying any real rename |
| Interaction with tsk-5mh's already-computed `plannedMoves`/conservation check | High, unproven live — `scripts/knowledge-migration.mjs`'s `computeConservationErrors` re-checks `doc.topicId`/`doc.role`/`doc.currentPath` still match what tsk-5mh planned (lines 75-81); a `topic.rename` changes NEITHER `topicId` NOR `currentPath` NOR `role`, only `purposeSlug` — so reasoned to be safe, but not run against real data here | At `fgos-coding-validating`, dry-run tsk-5mh's own migration script against the renamed registry state before this item's real verify is declared green |
| `docs/knowledge/` prefix code change | Medium — a real change to a script with existing test coverage | `test/scripts/knowledge-migration.test.mjs` green after the prefix edit and its own expected-path updates |
| Impact-analysis posture | **degraded** — `fgos tool query --capability impact-analysis --status present` returns GitNexus as `present`, but `list_repos` shows the `/home/vantt/projects/forgentX` index is **2291 commits behind HEAD** (`staleness.commitsBehind: 2291`) — the session's own worktree isn't indexed at all. Too stale to trust for blast radius here; used direct repo grep instead (`RESEARCH.md` Findings 1-6), e.g. `renameTopicStore`'s only caller confirmed by direct grep of `bin/fgos.mjs`, not GitNexus | n/a — already satisfied via direct grep in place of the stale index |

## Files touched

- `scripts/knowledge-migration.mjs` (Part B, line 137's target-path
  construction)
- `docs/architect/knowledge-registry-redesign.md` (Part B, lines 97/166)
- `test/scripts/knowledge-migration.test.mjs` (Part B, expected-path
  updates)
- `docs/history/tsk-ozk-purpose-slug-length-fix/plan.md` (this file)
- `docs/history/tsk-ozk-purpose-slug-length-fix/RESEARCH.md` (already
  written at `discovery`)
- Registry state itself (247 `topic.rename` events + 1 `decision` event) —
  not a source file, but the primary artifact this item produces

## Outstanding questions

None
