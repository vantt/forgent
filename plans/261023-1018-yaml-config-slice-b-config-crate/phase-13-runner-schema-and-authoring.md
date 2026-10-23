# Phase 13: The `runner` section schema, authored from the tuned catalog; OWNER GATE G-B2

Depends on 12 (so on the phase 03 validator sign-off for its proofs) and, for the content, on the owner's answer (G-B2 was answered A on 2026-10-23 10:40; this phase asks again only for an entry that fits none of R1-R4). Suggested executor: opus for the classification worksheet and the question text only if the sonnet pass produced an incoherent table; sonnet for authoring; independent sonnet reviewer pass on the machine-specific scrub before landing. **This phase stops at the gate**; the section schema is not committed to `core/config-schema/` before the answer.

## Context

Spec section 4: "The first standard is authored from this repository's tuned catalog, not from the setup seed" (0 of 36 seeded capabilities still equal the seed, folded review H2). Authoring "strips nothing machine-specific because the catalog holds none ... to be confirmed per executor in the plan". Evidence already collected: `.fgos/config.json` is 1,557 lines; `runner.capabilities` has 42 entries (keys seen: `description`, `prefer`, `tier`, `serves`, `rigor`, `confinement`, `maxTier`, `seats`, `roles`, `aliases`); `runner.executors` has 8 (`claude, glm, gitnexus, herdr, openai, gemini, xai, deepseek`); line 1151 of the file names the `xai-vantt` profile in an executor description, so the "no machine-specific content" premise is already false once; `gateway: {port, token: null}` and `lock.predecessorKillWaitMs` sit in the project file although `gateway` is global-only and `lock` is retired.

## Files it may touch

`core/config-schema/runner.yaml` (after the gate), `packages/config/contracts/fixtures/authoring-source.config.json`, `contracts/fixtures/repo-differences.v1.json`, `tests/authoring_equivalence.rs`, one appended line in `src/bundle.rs`, a seat-ladder pin in `tests/authoring_equivalence.rs` (D9). Scratch worksheet: `.fgos/runtime/tmp/standard-authoring.md`.

## Steps before the gate

1. Merge `origin/main`. Copy `.fgos/config.json` as it is on `origin/main` to `contracts/fixtures/authoring-source.config.json` and record its sha256 and the commit in `repo-differences.v1.json` (`source`). Re-do this copy if the file changes before landing (SEAT, MP-B1, TEST edit it).
2. **Machine-specific scan, per entry.** For each of the 8 executors and 42 capabilities, and for `modelPolicies`, `tierFallback`, `patterns`, `defaults`, `coordination`: list every string that contains an absolute path, a home directory, a user or profile name (`vantt`, `grok-vantt`, `xai-vantt`), a host name, a port, an environment variable reference (`homeEnv`, `env`), `credentialStore`, `resourceBindings`, a token-looking string, or a `prefer` entry naming an executor family the standard does not ship (binding skips a family the machine lacks, per spec; verify by reading `src/runner/execution/bind.mjs` for the skip rule and cite the line). Output a table: path, content class, verdict (`standard as is`, `scrub text`, `project difference`, `needs owner`).
3. **Classification worksheet.** Proposed rule set (for the gate):
   - R1 catalogs and tables: `runner.capabilities`, `runner.executors` (after scrub), `runner.modelPolicies`, `runner.tierFallback`, `runner.patterns` (including the `patterns.seatBinding.schema` marker the loader requires, `assertProjectConverted`, `src/runner/dispatch/config.mjs:~425`), `runner.defaults`, `runner.coordination`: standard = this repository's tuned values.
   - R2 scalar settings the code already defaults: `timeoutMs` (code default 900000, this repository 2100000), `idleTimeoutMs`, `parallel`, `maxTier`, `confinement.strict`: standard = today's code default (what every reader assumes when the key is absent); this repository's value stays a difference with its `@fgos:why` at migration.
   - R3 project-specific: `runner.executor` (`x-fgos-absent: detected`, D1), `runner.generatedPaths` (this repository's skill render paths; standard `[]`), any `--allowedTools` list naming this repository's build commands.
   - R4 account material: `runner.llmAccounts`, `runner.providers.<name>.accounts`: `x-fgos-file: accounts`, never in the standard.
   - Seat ladder: the doc text for `modelPolicies`, `tierFallback`, `maxTier` from the ladder contract (D9).
4. Fill the decision question below with the worksheet's real counts (how many entries per verdict) and the three or four most consequential items by name, then post it. Set the board's CFG note: "Slice B waits for owner on the standard's content (phase 13)".

## Owner gate G-B2: decision question (core/skills/_shared/decision-question.md)

**What is happening.** The first release standard is being written from this repository's tuned catalog. Every project that runs a release containing it will inherit these values for any key its own file does not set, so the choice of what is "standard" and what stays "this repository's own choice" changes the effective behaviour of other projects on their next upgrade. Phases 00-12 are done; only the `runner` section schema and the closeout wait.

**Cause (what was checked).** 42 capabilities, 8 executors and the scalar settings were scanned entry by entry for machine- or owner-specific content (list in the worksheet; example: the `xai` executor text names a login profile). Scalars were compared with what the code assumes when a key is absent (`timeoutMs` 900000 against this repository's 2100000). Evidence: `.fgos/runtime/tmp/standard-authoring.md` [executor fills: N entries standard as is, N scrubbed, N project differences, N needs owner] and the pinned source `packages/config/contracts/fixtures/authoring-source.config.json`.

**Options.**
- **A. Catalogs from the tuned file, scalars from code defaults, project specifics stay differences (the rule set R1-R4).** Gain: other projects get the tuned executor/capability/model/tier tables the owner runs daily, and nothing about timeouts or parallelism changes for them. Harm: a project that relied on the stale seed's capability values sees the tuned ones (intended, spec section 3 evidence). Cost: about 1,800 lines of schema YAML (data, counted apart from Rust), 6 scrub edits, no code.
- **B. Everything from the tuned file, including scalars (`timeoutMs` 2100000, `maxTier: flagship`, `parallel`).** Gain: one source of truth, equivalence is trivially "no differences". Harm: other projects silently get this repository's longer timeouts and its highest model tier ceiling, which is a cost and behaviour change not about catalogs. Cost: same size, fewer difference rows.
- **C. Catalog entries only for capabilities and executors; `modelPolicies`, `tierFallback` and `patterns` stay seeded as today.** Gain: smallest behaviour change. Harm: keeps the stale seed alive for the tables that caused the owner's finding (`rigorToTier`, `mini` fallback warnings) and splits the standard in two sources, against the spec's single complete standard.

**Recommendation.** A: it is the reading of spec section 4 (the catalog is tuned and the seed is stale) without letting a project-sized choice such as a timeout or a tier ceiling leak into every other project. Items marked `needs owner` in the worksheet are listed one by one in the same message with a proposed verdict each; the owner can answer "A, with these overrides".

**Scope of the answer.** A yes on A authorizes: committing `runner.yaml` with the R1-R4 content and the scrub edits listed in the worksheet, the pinned source and difference list, and building the equivalence proof on them. It does not authorize: changing any value in this repository's own `.fgos/config.json` (migration is Slice D), adding an `x-fgos-` annotation beyond the closed list, or deciding the release/upgrade order for other projects. A different answer changes only which rows of the worksheet move between "standard" and "difference"; it costs a rewrite of the section schema and the difference list, not new phases.

## Steps after the gate

5. Write `core/config-schema/runner.yaml` as one JSON Schema 2020-12 document in YAML (comments welcome): a `properties` entry for every `runner.*` key (`type`, one-line `description`, `x-fgos-scope`, `-sensitivity`, `-file`, `-merge` as in spec sections 3-4; each catalog is the map's `default` with `additionalProperties` describing one entry; repeated shapes through `$defs`/`$ref`): `runner.executor` and `runner.executors.<name>` are `x-fgos-sensitivity: command` with `x-fgos-scope: both` and an `x-fgos-justification`; `runner.llmAccounts` and `runner.providers.<name>.accounts` are `x-fgos-file: accounts`, `x-fgos-scope: global-only`, `x-fgos-sensitivity: secret-reference` where they name a login store, no default; the five seat-binding keys under `runner.capabilities.<name>` are `x-fgos-scope: project-only`; `runner.executor` is `x-fgos-absent: detected`; `modelPolicies`, `tierFallback`, `maxTier` carry the ladder text as `description`); the catalog `default` values from the worksheet. Parse limits: the file must be under `strict-config`'s 1 MiB and depth 32 (`packages/yaml-doc/contracts/limits.v1.json`; the schema path to a catalog `default` adds about 6 levels to the catalog's own depth); record the measured size and depth.
6. `tests/authoring_equivalence.rs` (the one proof of "standard + differences reads back as this repository's config"):
   - `differences = diff(authoring-source, standard)` computed path by path, with maps compared per entry and lists as leaves; assert the list of difference paths equals `repo-differences.v1.json`'s `differences` (reviewed list: `runner.executor`, `runner.generatedPaths`, `runner.timeoutMs`, ... whatever the gate settled), each with a one-line reason;
   - `merge(differences-layer, standard)` through the snapshot pipeline (a temp project file written from the differences, global file absent) equals the authoring source **except** the four documented exclusions: `gateway.*` (global-only, refused in a project file: the test asserts the refusal by name), `lock.*` (retired, undescribed, kept), `runner.$comment` (becomes `@fgos:doc` at Slice D; the test asserts the key is present in the source and absent from the standard), and any path the owner moved at the gate. The exclusion list is data in `repo-differences.v1.json`; a path outside it that differs fails the test;
   - the standard contains no value found by the scrub list (the worksheet's search strings are data in the fixture: `vantt`, `/home/`, `homeEnv`, `credentialStore`, `resourceBindings`, `token`), asserted over the serialized standard;
   - the seat ladder `description` text equals the rendering of `packages/seat-binding/contracts/seat-binding.tier-ladder.v1.json` (D9);
   - lint clean (phase 04's standing test), and the first-slice scope list still holds.
7. Record in the commit message: measured size and depth of `runner.yaml`, `snapshot` time on the pinned source (informational, no assertion), counts of differences and exclusions.
8. Post the board log line for the phase; update the CFG note.

## Owning proofs

| Behaviour | Proof |
|---|---|
| Standard + differences equals the tuned repository config except named exclusions; no machine-specific string in the standard; ladder text pinned | `tests/authoring_equivalence.rs` |
| `runner.yaml` is a legal section schema set | phase 04 standing lint test |
| Scope, file placement and sensitivity of the real `runner` keys (accounts only in the accounts file, seat-binding keys project-only, `command` keys from the trusted root) | one case each in `tests/authoring_equivalence.rs`, because the section schema under test is the real one; the generic rules stay owned by phase 06's and 09's runners |

## Validation

`cargo test -p fgos-config --test authoring_equivalence --test golden_lint --test registry_defaults --jobs 4`, clippy, fmt.

## Risk

| Risk | L x I | Mitigation |
|---|---|---|
| The standard carries machine- or owner-specific content (seen: `xai-vantt`) | H x M | per-entry scan, reviewer pass, the serialized-standard search in the test, the owner gate |
| The tuned catalog moves before landing | M x M | pinned copy with sha256; re-copy and re-run at phase start and just before landing; later drift is Slice D's `check` and idea I5 |
| The equivalence proof is circular (differences computed by the same merge it then checks) | M x M | the pinned `differences` list is reviewed data; the test fails when any path outside it differs, and the standard's content comes from the section schema text, not from the source at test time |
| `runner.yaml` too large or deep for `strict-config` | L x M | measured in step 5; if over, splitting into a second file is not allowed (spec: one file per section), so the catalog values are trimmed only by the owner's decision |
| Gate unanswered | M x L | 00-12 land; 14 can land its spec amendments (they do not depend on `runner`), leaving only the CFG row note and the success criterion about equivalence open |

## Rollback

Revert: the section schema, the fixtures and the test come out together; `src/bundle.rs` loses one line. Nothing links the crate.
