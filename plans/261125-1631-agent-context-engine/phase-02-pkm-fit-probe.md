# Phase 2: pkm fit probe

ACE-D6 makes pkm the engine. This phase proves, with running code, what pkm v0.7.0 does for rules and records each
gap, before the crate depends on it. It writes no repository code: the probe is a throwaway Cargo project under
`.fgos/runtime/tmp/ace-pkm-probe/`, and the only tracked output is the report.

## Context

What the plan read in the source (`/home/vantt/.cargo/git/checkouts/pkm-c7040410687dc811/d488fe0/`), to be
confirmed by running it:
- Custom node types and edges come from a pack file next to a profile (README "Type riêng của vault"); edges declare
  `inverse`, `group`, `domain`, `range`, `cardinality`.
- Built-in edges include `superseded_by`/`supersedes`, `amends`/`amended_by`, `related` (symmetric), `supports`,
  `disputes` (`crates/pkm-core/src/schema/schema.yaml`). There is no `conflicts_with`, `depends_on` or `refines`.
- `Graph::in_force` and `in_force_units` (`crates/pkm-core/src/query.rs:1418`, `:743`) give the effective set by
  lifecycle class and date window, at note level and at the level of units inside a note.
- `validate` (`crates/pkm-core/src/validate.rs`): R12 (replaced without replacement or end date, broken chain), R14
  (schema errors, domain and range), R15 (cardinality one), R16 (duplicate id within the declared scope), R17
  (unresolved bare id), R18 (bad `replaces`/`amends` unit target).
- `audit` (`crates/pkm-core/src/service.rs:540`): `implicit-replacement` and its unit form, near-duplicate pairs of
  the same type by cosine (default 0.93), and `stale-citation`. Needs search ready (embedder and worker).
- `related.rs`: personalized PageRank over typed edges, seeded by search hits.
- `crates/pkm-lifecycle` is pkm's own install, doctor and version tooling, not note lifecycle; ACE does not need it.
- How fgOS links pkm today: `packages/documentation/rust/Cargo.toml` (`pkm-core` and `pkm-lifecycle` with feature
  `search`, `pkm-embed`, static ONNX Runtime) and the `Session`/`search` use in `packages/documentation/rust/src/pkm.rs`.

## Requirements

Answer each question with a passing or failing probe and the output quoted:
1. Can ACE declare a `rule` type with its own roles and the edges `refines`, `depends_on`, `conflicts_with` in a pack
   file, and does `index build` accept the three unit roots with `writes: none` and the db outside the tree?
2. Does `in_force` return only live, deprecated and in-window replaced rules, and exclude draft, rejected, retracted?
3. Do R12, R15, R16 fire on the matching broken fixtures? Is a dangling `depends_on` target reported, and by which
   rule? (If none, ACE checks it.)
4. Does anything in pkm act on `conflicts_with` between two in-force rules? (Expected: no; ACE checks it.)
5. Does `implicit-replacement` find the paraphrase pairs of clusters 1, 6 and 9 of the P2 report at the default
   threshold, and at which threshold does it find them without flooding? Use the real texts.
6. Can a single new draft rule be compared to the in-force set (nearest search with the draft as query) without
   writing it into the tree first?
7. Index build and query times on the current corpus, and whether any of it needs the network.

## Files

- `plans/261125-1631-agent-context-engine/reports/pkm-fit.md` (tracked).
- `.fgos/runtime/tmp/ace-pkm-probe/**` (scratch, never committed).

## Steps

1. Create the scratch Cargo project with the same pkm tag and features as `fgos-documentation`.
2. Write a profile and a pack file for type `rule`, and fixtures: the 7 current units converted by hand, plus one
   broken fixture per question.
3. Run each probe; record command, output and verdict in the report.
4. List every gap with the ACE-side mitigation, or mark it blocking.

## Validation

The report answers all seven questions with quoted output. A reader can rerun the probe from the report.

## Risk

A blocking gap (for example, no unit-level nearest search for a draft) changes phase 3 and 4. Then phase 3 does not
start; the gap goes to the owner as a five-part question, with "ask pkm upstream" as one option.

## Rollback

Delete the report. The scratch tree is never tracked.
