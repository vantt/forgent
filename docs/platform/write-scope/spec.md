# Write-scope Component Specification

```txt
Document type: BA-grade area specification
Audience: Owner, maintainer, implementation agent
Purpose: One authority for what a declared path scope means and whether two scopes can touch the same path, for one scope and for a whole set of them
Design status: Settled by the owner in the discussion of plans/261119-0030-resource-referee-graph-write-scope-stack (decisions 1-6, 17, 19, 22); the numeric limits were measured in phase 1
Implementation: Partial. The grammar, the matcher and the pairwise literal-prefix test exist as the crate fgos-write-scope under packages/git/write-scope; the move to packages/write-scope and the set-level function are plan phases 2 and 3
Canonical: Yes for the scope below, from the day the plan lands
Owner: Write-scope component (proposed)
Source: packages/git/write-scope today; packages/write-scope after plan phase 2 (crate fgos-write-scope, name unchanged)
Contracts: none of its own file; the numeric limits are in section 8 until plan phase 3 turns them into constants with their one owning test
Provenance: plans/261119-0030-resource-referee-graph-write-scope-stack/plan.md and reports/facts.md at base 40949614f077844005a986ca1f0f75c0c5e8f508 (2026-11-19)
Writer type: Agent draft writer
Canonical for: The scope-entry grammar, what a scope covers, the one may-overlap meaning, the lexical caveat, the set-level colliding-pairs function, the error policy for an entry that cannot be read and for an empty scope, and the limits of the set-level function
Use this when: Changing how a declared write scope is read or compared, or adding a caller that asks whether two scopes collide
Do not use this for: Granting paths to a run (Execution), enforcing a grant at commit (Git), the order of work (graph), or a verdict about a set of units (resource-referee)
Last reviewed: 2026-11-19
Related:
- plans/261119-0030-resource-referee-graph-write-scope-stack/plan.md
- plans/261119-0030-resource-referee-graph-write-scope-stack/reports/facts.md
- docs/platform/git/spec.md (section 6, RUL84)
- docs/platform/graph/spec.md
- docs/platform/resource-referee/spec.md
- docs/platform/component-boundary.md
```

## 1. Purpose and owned decisions

A run declares the paths it may write: a list of entries such as `docs/platform`, `src/**/*.mjs` or
`packages/git/rust/src/lib.rs`. Several places ask a question about those lists, and until now each
answered it with its own code. This component owns the answer.

It owns exactly these decisions:

1. **Grammar.** Which spellings of an entry are legal, and the one canonical spelling (section 3).
2. **Coverage.** Whether a given path lies in a scope (section 4).
3. **May-overlap.** Whether two scopes can touch the same path, with a stated soundness contract (section 5).
4. **Colliding pairs.** Given a set of items that each carry a scope, which pairs may touch the same path (section 6).
5. **Error policy.** What happens to an entry that cannot be read and to an empty scope (section 7).

It owns no policy. It does not know what a run, a plan phase, a Work item or a worktree is, and it never
decides whether a collision is acceptable; that belongs to the caller and, for verdicts, to
`resource-referee`.

## 2. Shared entities

| Entity | Meaning | Where defined |
|---|---|---|
| Entry | One string a person or tool wrote to name a path or a family of paths | section 3 |
| Canonical entry | The one spelling of an entry that every comparison uses | section 3 |
| Scope | A list of entries | section 4 |
| Item | `{ id, scopes }`: an id the caller chose and one or more scopes (lists of entries) | section 6 |
| Collision | An unordered pair of items whose scopes may touch the same path, with the entries of the first item that caused it | section 6 |
| Problem | An item-level report: one entry that does not canonicalize, one empty scope, one item beyond a per-item limit | section 7 |

## 3. Grammar

An entry is canonicalized by `canonicalize` (`packages/git/write-scope/src/lib.rs`, mirrored by
`canonicalizeWriteEntry` in `src/runner/dispatch/write-scope.mjs`). The rules, all taken from the code
that runs today:

- Leading and trailing whitespace is removed, using the ECMAScript whitespace set (it includes U+FEFF and
  U+3000 and excludes U+0085), repeated until the result is a fixed point (`docs /` becomes `docs`).
- Empty segments and `.` segments are dropped; `./docs`, `docs/` and `docs//` are one entry.
- Consecutive `**` segments collapse to one.
- Refused, by naming the entry: an absolute path (leading `/`), a backslash or NUL byte, an entry with
  nothing left after cleaning (`""`, `.`), a `..` segment, a first segment starting with `:` (git pathspec
  magic), and `**` that is not a whole segment (`ab**`).
- `*` inside one segment and `**` as a whole segment are the only glob characters. Every other character,
  `[ ] { } ! ? ( )` included, is literal.
- Duplicates are removed by `canonicalize_all`, keeping first-seen order.

The grammar is lexical: it reads the bytes of the entry and nothing else (section 5.2).

## 4. Coverage

`matches(path, scope)` answers whether a repo-relative path lies in a scope. A plain entry covers the path
itself and everything beneath it, by whole segments (`docs` covers `docs/a` and not `docs-old/a`). An entry
containing a glob must match the whole path. A queried path that is absolute, escapes with `..`, or carries
a backslash or NUL never matches, and nothing under `.fgos` ever matches, not even `**`. Query bytes are
never trimmed, and a byte path that is not UTF-8 is refused with a lossless hex diagnostic.

This is what Git enforces at commit and what dispatch enforces at run time. It is unchanged by this plan.

## 5. May-overlap

### 5.1 The meaning

Two entries **may overlap** when the literal leading segments of one lie inside, or equal, the literal
leading segments of the other. The literal leading segments of an entry are the segments before the first
one that contains `*`; an entry that starts with a glob segment has an empty prefix, which overlaps
everything. Two scopes may overlap when any entry of one may overlap any entry of the other. Concretely:

| a | b | may overlap | why |
|---|---|---|---|
| `src` | `src/a.mjs` | yes | `src/a.mjs` lies inside `src` |
| `src/fo*` | `src/foo.mjs` | yes | prefix of the first is `src`, which holds `src/foo.mjs` |
| `src/a/**` | `src/b/**` | no | prefixes `src/a` and `src/b` are disjoint |
| `docs` | `docs-old/x` | no | whole segments only |
| `src/a*` | `src/b*` | yes | both prefixes are `src`; the rule does not look inside a segment |
| `**` | anything | yes | empty prefix |

This is the rule `fgos_write_scope::overlaps` applies to the prefixes of two entries
(`packages/git/write-scope/src/lib.rs:149`) and `writeScopesOverlap` applies to two scopes
(`src/runner/dispatch/write-scope.mjs:186`). It is the meaning dispatch admission already uses
(`src/workflow/case-admission.mjs:171`). It is chosen because it is the only one of the meanings found in
the repository (section 5.3) that is both sound and cheap enough to hold on a set.

### 5.2 The soundness contract

**May-overlap is sound over lexical paths: it never answers "disjoint" when the same spelling rules say one
file is covered by both entries.** Proof sketch: a path covered by a plain entry lies beneath it, and a path
covered by a glob entry starts with its literal leading segments, so every path covered by an entry starts
with that entry's prefix. A path covered by both entries starts with both prefixes, and two prefixes of one
path are always equal or one inside the other. The converse does not hold: the rule is conservative, so
`src/a*` and `src/b*` may-overlap although no file matches both. A refusal built on it says so, and a caller
that must run beside another narrows its entries.

The word *lexical* is part of the contract. These are **outside** it, and every verdict that rests on
may-overlap carries this caveat:

- **Case folding.** `src/x` and `SRC/x` are different entries here; on a case-insensitive file system they
  name one file.
- **Unicode normalisation.** Two spellings of one name (precomposed and decomposed) are different entries.
- **Symlinks.** A path that goes through a symlink inside the repository is compared as written.
- **`.fgos`.** Coverage never matches `.fgos`, but may-overlap compares prefixes and so can report an
  overlap on it; this errs toward "overlap".

A claim of "disjoint" therefore means "disjoint as spelled". Nothing in this component reads the file
system.

### 5.3 The meanings found today, and the choice

Five different meanings of "do these two paths collide" live in seven code sites in the repository. They were
run on one set of pairs (`reports/facts.md`, section 3). One is chosen; the rest are replaced in the door plan
or recorded as debt.

| # | Meaning | Where | What it does | Fate |
|---|---|---|---|---|
| 1 | Equal strings only | `footprintOverlapAmong`, `src/state/graph-metrics.mjs:599` | `src` and `src/a.mjs` do not collide; globs compared as strings. Not sound | Replaced by the chosen meaning in the Work adapter (door plan) |
| 2 | Containment, character cut | `overlaps`, `scripts/plan-contract-check.mjs:34`; `overlaps`, `packages/supervision/rust/src/portfolio.rs:200` | Cuts the entry at the first `*` character, not at a segment, and does not canonicalize: `src/fo*` becomes `src/fo`, which does not contain `src/foo.mjs`; `./src` is not `src`. Not sound. Both readers also delete every `*` before the rule sees it (`portfolio.rs:318`, `plan-contract-check.mjs:42`) | Replaced (door plan) |
| 3 | Containment, segment cut | `fgos_write_scope::overlaps`; `writeScopesOverlap` | The chosen meaning | **Chosen** |
| 4 | Regex glob | `pathsOverlap`, `src/report/capability-plan-lint.mjs:99` | Tests one entry as a regex against the other's text: `src/a*` and `src/*b` come out disjoint although `src/ab` matches both. Not sound | Replaced (door plan) |
| 5 | Glob intersection | `globsMeet`, `src/runner/dispatch/write-scope.mjs:142` (built on `segmentsMeet`, line 111) | Segment-wise intersection of two patterns, used by propose and classify. Answers a different question (can two patterns name a file, plain entries as exact paths, not subtrees) | Recorded debt, not a target: allow-listed with a `retiredBy` by the door plan |

The seven sites are: the Rust crate and the JS port (meaning 3, two sites), the plan-check script and the
supervisor reader (meaning 2, two sites), `footprintOverlapAmong` (1), `pathsOverlap` (4) and `globsMeet` (5).

## 6. Colliding pairs

The set-level function answers "which pairs of items may touch the same path" in one call.

Input: a list of items `{ id, scopes }`, where `scopes` is a list of entries (an item with several scopes
passes them concatenated; the pair test is per entry). Items are compared in input order.

Output:

```text
{ pairs:     [ { a, b, shared } ],
  problems:  [ { item, code, entry?, why? } ],
  truncated: null | { reason, limit } }
```

- A pair is reported once, with `a` before `b` in input order. `shared` lists the entries of `a`, in `a`'s
  own spelling and declaration order, each once, that may overlap at least one entry of `b`. The spelling is
  as declared, not canonical, because it is what a person resolving the collision typed.
- Pairs are ordered by the input position of `a`, then of `b`. The same input gives the same bytes.
- The function is a pairwise comparison of canonicalized entries. It builds no index and measures no
  threshold; if one timing recorded at the door plan's landing shows it is too slow, an index becomes a
  separate item (plan decision 19). It is proven against a naive pairwise oracle in Rust.
- A JavaScript copy of this function does not exist and none is added. The JS port stays a pinned copy of
  the single-scope functions only (section 9).

## 7. Error policy

An item never silently drops out of the comparison, because "I could not read it" must not look like "it
collides with nothing" (plan decision 17).

| Situation | Result | Code |
|---|---|---|
| An entry does not canonicalize (`.`, `..`, absolute, backslash, empty, `ab**`) | The item is reported in `problems` with the entry as written and the reason. The item's other entries are still compared | `entry-invalid` |
| An item has no entries at all (an empty or missing footprint) | Reported in `problems`; the item is not compared and is **not** claimed disjoint | `scope-empty` |
| An entry longer than the entry limit, or an item with more entries than the per-item limit | Reported in `problems` (an item-level finding); the rest of the set is still evaluated; the offending entry or surplus is not compared | `entry-too-long`, `scope-too-large` |

Callers decide what a problem means. The door and the plan check refuse; the supervisor marks that one plan
not admissible; `resource-referee` turns each into a blocking finding. The Work adapters differ on purpose,
by a named exception (plan decision 17): an entry that does not canonicalize makes that one item conflict
with everything, but a missing or empty footprint keeps meaning "no claim" in Work, because Work footprints
are optional and an item without one has never conflicted. That exception is recorded in the door plan and
is the only departure from this section.

## 8. Limits and truncation

The colliding-pairs function is the only function of the three new packages that may return a partial
answer. It stops at a cap and says so; it never returns a partial answer without `truncated`.

| Limit | Value | Basis |
|---|---|---|
| Entry length | 1024 bytes | longest footprint entry in any plan table or frontmatter today: 95 bytes |
| Entries per item | 512 | longest footprint today: 95 entries in one frontmatter, 35 in one table cell |
| Emitted pairs | 100000 | the number of items allowed in a graph (20000) makes more than a few thousand pairs a sign of one hot path |
| Pair comparisons | 50000000 | one comparison is one entry against one entry |
| Input bytes | 4 MiB per file the caller reads | largest `plan.md` today 128519 bytes; largest phase file 87072 bytes |

The values come from `reports/facts.md`, section 4. When the pairs cap or the comparison cap is reached the
function returns the pairs it already has, in the deterministic order above, with
`truncated: { reason: "pairs-cap" | "comparison-cap", limit: <number> }`. A caller that does not use the
referee must refuse to treat the answer as complete: the plan check errors and a Work adapter throws a named
error. The referee takes `truncated` as a fact and emits the blocking `facts-truncated` finding
(resource-referee spec, section 5). Per-item breaches are problems (section 7), not truncation.

## 9. Boundaries

**Why the crate leaves `git/`.** `fgos-write-scope` sits under `packages/git/` but three components use it:
Git (`packages/git/rust/src/land.rs:286`, `scoped_commit.rs`), the Node addon
(`packages/git/node-addon/src/git/write_scope.rs`) and the supervisor
(`packages/supervision/rust/src/land.rs:463`, `Cargo.toml:10`). It has had no spec of its own and no row in
`component-boundary.md`. The git spec already asked for a leaf: RUL84 says the lowest shared write-scope
leaf owns grammar, matcher and expansion, "may initially be a leaf module of the Git package but imports no
operations or consumer" (`docs/platform/git/spec.md`, section 6). This plan keeps that rule and takes the
step the sentence anticipated: its own directory and its own spec. The crate name `fgos-write-scope` and its
dependency-free status do not change.

**What stays elsewhere.** Execution owns which paths a run is granted; Git enforces a grant at commit. This
component only reads and compares spellings.

**The JS port.** `src/runner/dispatch/write-scope.mjs` is a second implementation of the single-scope
functions, not the thin facade that RUL84 asked for; the facade switch was never made. Until dispatch moves,
the port stays and is pinned to the Rust rule by `test/git/write-scope-parity.test.mjs`, which runs the
golden suite `test/runner/write-scope.test.mjs` through the addon as well as through Node. Plan phase 3 adds
whole-scope `overlaps` cases to that one golden suite so both sides run them; no second parity file exists.

**Guard against a new copy.** The door plan adds a `door` entry to `docs/architecture-manifest.json` whose
patterns match only definitions of the rule (`export function pathsOverlap`, `footprintOverlapAmong`,
`fn overlaps(` in `.rs` files under `packages/`), with the pinned JS port and `globsMeet` listed as debt with
a `retiredBy`.

## 10. Non-goals

- A change to coverage (`matches`), the grammar, or `expand` (generated-path widening).
- A trie, a measurement gate, or a JavaScript colliding-pairs function.
- Reading the file system, resolving symlinks, or folding case or Unicode.
- A policy about which collisions are acceptable.
- Replacing `globsMeet` or the path-matching copies in `src/runner/merge.mjs:163` and
  `src/runner/frozen-judge.mjs:52`; both are recorded follow-ups.

## 11. Lịch sử quyết định

| Id | Decision | Where it lands here |
|---|---|---|
| plan decision 1 | `packages/write-scope` leaves `packages/git/` | section 9 |
| plan decision 2 | Claims to colliding pairs is a set-level function of this component, not a layer of its own | section 6 |
| plan decision 6 | Dispatch keeps its JS `write-scope.mjs`; a conformance test pins it to the Rust rule until dispatch moves | section 9 |
| plan decision 7 | Only this function can truncate; per-item limits are item-level findings | sections 7, 8 |
| plan decision 15 | No new external crate; result types stay plain | section 6 |
| plan decision 17 | An entry that does not canonicalize, and an empty scope, are reported, never dropped | section 7 |
| plan decision 19 | Deterministic pairwise comparison, no trie, no measurement gate | section 6 |
| plan decision 22 | The contract is lexical: case folding, Unicode normalisation and symlinks are outside it | section 5.2 |
| phase 1 | The meaning is containment by literal leading segments; the numeric limits above were fixed from measured maxima | sections 5.1, 8 |
