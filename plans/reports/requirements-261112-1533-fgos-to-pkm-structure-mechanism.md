# Requirements from fgOS to pkm: a structure mechanism

Date: 2026-11-12. From the DOCOS lead of fgOS (`claude-wfgg@design-lap`), at the owner's request, to the maintainers of `pkm` inside `vantt/momentell`. Self-contained: a reader of `momentell` needs nothing from the fgOS repository to act on it; fgOS paths are quoted only as context.

## 1. Why

fgOS keeps its documentation as Markdown in git: 691 maintained documents today. It has grown by copies: a writer that cannot find the existing document writes a new one. fgOS is designing a structure for its documentation (facets, controlled vocabularies, "locate before write", self-improvement). The owner's direction on 2026-11-12:

- **pkm supports the mechanism**: the concept of a structure as a whole-vault perspective on top of its graph.
- **The concrete structure comes from the system that uses pkm**: fgOS declares its own; a personal vault could declare PARA; pkm ships no structure of its own (presets as examples are fine).

This document lists what fgOS needs from that mechanism. It does not ask pkm to adopt any fgOS value.

## 2. What pkm-core already has (read from `crates/pkm-core/src`, 2026-11-12)

| Need | Already in pkm-core | Gap |
|---|---|---|
| Read a folder of Markdown, links, frontmatter | `vault` (wikilinks, embeds, Markdown links `[text](path.md)`) | header blocks that are not YAML frontmatter (R3) |
| Typed schema, controlled vocabularies, validation | `schema` (`schema.yaml` v3: node types, enums, `required_if`), `validate` | facets and placement are not part of the schema (R1, R2) |
| Search through OHS | `ohs` (long-lived `ohs serve --stdio`, `search`, `read`, `vectors`, `neighbors`) | a locate call shaped for "where does this draft belong" (R5) |
| Near-meaning pairs, k nearest neighbours | `pairs` | — |
| Clusters of notes about one thing | `zones` | expose per facet value (R6) |
| Machine proposals as a review queue | `propose` (rule-based kinds, written as notes in `_Đề xuất/` with `status: chờ`) | structural kinds and a pluggable sink (R7) |
| Vault-specific edges | `adapter` (built-in `e11`) | — |
| SQLite index | `index` (rusqlite, bundled) | — |

## 3. Requirements

### R1. Declare a structure

A consumer declares one structure profile as a data file it owns (not code), loaded by pkm. A profile has:

- **facets**, each with: name; kind `locating` (one value per note, closed list) or `narrowing` (many values, each must resolve against a register); a closed list of values, each with a one-line description; at most one closed sub-level per value (`broader`/`narrower`); and where the value is read from (R2);
- **registers** for narrowing facets, shaped like SKOS: per entry a `prefLabel`, `altLabel`s, labels per language (`@en`, `@vi`), `broader`, `related`, and a status (`active`, `retired` with successor);
- a version, so a note can say which profile version placed it.

pkm defines the format and validates profiles. pkm holds no facet values itself.

### R2. Place every note

For each note, pkm computes its facet values from sources the profile names: a path pattern (for example `docs/platform/<area>/...`), a frontmatter key, or a header field (R3). pkm reports:

- notes with no value for a required locating facet;
- values outside the closed list;
- narrowing values that do not resolve against their register.

Output as validator findings, like today's schema problems.

### R3. Notes without YAML frontmatter

fgOS platform documents open with a fenced `txt` block of `Key: value` lines (for example `Document type: BA-grade area specification`), not YAML frontmatter, and carry no `type`. pkm needs either a reader for such a header block, declared by the profile, or a way for the profile to assign a default `type` by path. A note with no frontmatter must not be invalid by default.

Also seen while indexing the fgOS corpus with OHS: 6 documents carry invalid YAML frontmatter (an unquoted title starting with a backtick). pkm should report such a note and keep indexing the rest.

### R4. Markdown links resolve like the files say

fgOS links are relative Markdown links with anchors, for example `[spec](../../spec.md#61-the-check-command)`, resolved from the linking note's folder. About 2,750 such links exist. Please confirm relative resolution and anchors, and treat them as edges.

### R5. Locate: where does this draft belong?

One call, available from the library API and the CLI or MCP:

- **input:** draft text (one paragraph or more), optional facet filters (one or more values per facet), optional `top` (default 10);
- **ranking:** hybrid search through OHS, aggregated to **documents** (best sections kept), because document-level ranking beat section-level ranking for short queries in fgOS's measurement;
- **output:** per document: path, title, facet values, the best sections with heading paths, per-branch scores; documents outside the filters that score in the top ranks are still returned and marked `outside-filter`;
- **no verdict from the score.** In fgOS's measurement, queries with no real owner scored as high as queries with one; the caller decides by reading.

Query language: fgOS's agents translate their draft into the corpus language before calling (Vietnamese queries over English documents scored 0% at top 3 as written and 91.7% after translation). pkm passes text through unchanged. Optional and welcome: feed register `altLabel`s by language into the OHS `vi` pack lexicon, so lexical search can bridge languages for human users.

### R6. Structure overview: the whole-vault perspective

A report per facet value and sub-value: note count and size; orphans (no incoming links); clusters (`zones`) inside the value; near-meaning pairs that cross values (`pairs`); unresolved names that recur (register candidates). Machine-readable (JSON) first; a view in the Obsidian plugin is pkm's choice.

### R7. Structural proposals into a pluggable sink

Extend `propose` with structural kinds, still rule-based:

| Kind | Signal |
|---|---|
| split a value | count or size above a profile threshold, cut along clusters |
| new sub-value | repeated locate results with no candidate for the same cluster (needs the consumer's locate log as input) |
| move a note | the note's best-matching value differs from its placed value, persistently |
| merge duplicates | near-meaning pair above threshold across two notes |
| retire a value | no note and no locate hit for a profile-defined period |
| register entry | a recurring unresolved name; two names that always co-occur (alias) |

The sink is chosen by the consumer: today's `_Đề xuất/` notes for a vault; for fgOS, a JSON stream the fgOS side turns into work items. pkm never applies a structural change itself; it proposes.

### R8. Library first

fgOS's foundations are Rust and link Rust crates directly. fgOS needs pkm-core as a library crate with a narrow, documented API for R1 to R7, the OHS client included, with no Obsidian-specific assumption in the core (vault-specific behaviour stays in adapters). The CLI and MCP stay thin layers over the same API. See section 5 for the repository question.

### R9. Read-only on the consumer's files

pkm writes only its own index and outputs. It never edits, moves or creates a file inside the consumer's tree; for fgOS, every change to a document goes through fgOS's own write door.

## 4. How fgOS will check it

On the fgOS corpus (691 documents) with fgOS's profile:

- placement covers every platform document from its path alone, and reports the user documents that lack a value;
- locate on fgOS's gold set (37 same-subject groups; 24 developer notes in English) reaches at least the OHS figures already measured: 91.7% of notes find a group member in the top 3;
- the overview lists the known large value (`agent-coordination`, 429 documents) and the known duplicate groups among near-meaning pairs.

Measurement and gold set: `plans/reports/measurement-261112-1314-docos-document-identity-recall.md` in the fgOS repository (`vantt/forgent`), sections 3 and 6.

## 5. Repository question for the owner

pkm-core is already a clean library crate inside the `momentell` workspace (dependencies: `rusqlite` bundled, `regex`, `serde_json`, `unicode-normalization`, `chrono`; no Obsidian crate). Two ways for fgOS to link it:

1. **Git dependency on the momentell workspace member** (`git = ".../momentell", package = "pkm-core", tag = ...`). Zero setup; fgOS then pins a momentell tag, so pkm releases follow the app's cadence, and building fgOS needs access to the whole private app repository.
2. **pkm-core (with the `pkm` CLI and MCP) in its own repository**, consumed by momentell and fgOS through pinned tags. One-time cost: move the crates with history, move the Python-parity tests and `spec/spec.lock` with them, add a release flow. Gains: its own release cadence, an API kept honest by two consumers, and no access to app code needed to build fgOS.

The lead recommends option 2, done as a mechanical move before fgOS writes code against the API. Not decided here.

**Update, 2026-11-12 evening:** the owner chose option 2. pkm now lives in `vantt/pkm` (release 0.1.0, crates `pkm-core`, `pkm-cli`, `pkm-mcp`, `pkm-lifecycle`, with an integration guide). R8 is met in shape; R1 to R7 and R9 remain open against that repository.

**Update, 2026-11-12 night:** the owner decided that fgOS links `pkm-core` into its own `fgos` binary, pinned by tag, and exposes its own `fgos doc` verbs behind a locate port (no `fgos pkm` passthrough). The embedding needs that follow from it (OHS index path and settings as typed configuration, no output or panics from the library, the OHS child owned by the session, a small stable API) were added to [`vantt/pkm` issue 1](https://github.com/vantt/pkm/issues/1); a separate older-glibc binary is no longer needed for fgOS.

## 6. Open questions

1. Which repository owns the profile format (R1), and is it versioned with `schema.yaml` or separately?
2. Does the locate log (R7, "new sub-value") stay with the consumer, passed in per run, or may pkm keep it in its index?
3. Licence of pkm for fgOS: the owner allowed fgOS to use `ohs-lang-vi` on 2026-11-12; pkm itself needs the same statement. *Answered 2026-11-12 night: the owner allows fgOS to link and distribute pkm inside fgOS releases.*
