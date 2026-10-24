# Review r3 of Part A (rewritten spec-draft.md)

Scope: `spec-draft.md` (391 lines) against `part-b-evidence-hardening.md` and code at the working tree. Read-only. Line numbers are those of `spec-draft.md` unless stated. Code facts re-checked: `src/runner/dispatch/config.mjs` 290-300, 1484-1525, 1715-1850; `core/config-schema/runner.schema.yaml` 179-235; `core/config-standard/runner.yaml` 820-841; `src/runner/execution/seat-resolver.mjs` 105-125, 139-160, 195-225; `src/setup/registrations.mjs:281`; `run.mjs:211-221, 768`; `docs/platform/config/spec.md` 120-140.

## Critical

None.

## High

### H1. The `seatBinding` move (SC-R3) silently defeats the fence it exists for (area 2)
- Spec 230 / 329 moves the marker from `runner.patterns.seatBinding` to `runner.seatBinding`, reason given: "`runner.patterns` becomes the catalog". Spec 239 and RR-P3 (356) reason only about the global file.
- Code: the marker's stated purpose is "a release that does not know this key refuses the whole file (its patterns map is strict), which is what keeps an older release from binding seats against a config it cannot read" (`config.mjs:1494-1495`). That refusal comes only from `ALLOWED_PATTERNS_KEYS` (`:1488-1491`). `validateRunnerConfigShape` has no strict top-level `runner` allowlist, and `runner.schema.yaml` sets no `additionalProperties:false` at the root. So an older release reading a converted project file (no `runner.patterns`, new `runner.loops`, new `runner.seatBinding`) ignores all three, loads, and binds seats with default tuning and without the project's bounds. Nothing refuses it. The `seatSchema: 2` fence (spec 191) protects only resume of unit records, not config reads.
- Fix: state the fence explicitly. Either keep a marker under a key older releases reject (for example a second value in `runner.patterns`, which contradicts the catalog and so needs an owner decision), or make an older-release refusal a stated non-goal and drop the claim in 13.2/RR-P3. Also fill the same hole for `docs/specs/seat-binding.md` line 245, which describes the marker as the fence, and amend that spec row in section 18 (not listed today).

### H2. Upgrade path for existing project configs and running cases is undefined (area 2)
- 13.2 (239) says the validator "refuses the retired keys by name". Every existing project file carries `runner.patterns.seatBinding` (written by `registrations.mjs:281` and `FRESH_PROJECT_RUNNER_CONFIG`) and often `patterns.reviewed`. The standard file itself ships `patterns.defaultRule/reviewed/seatBinding` (`runner.yaml:821-841`). So at the first run of the new release every project that has not yet run `fgos setup` hard-fails config load, including `fgos setup` itself if it loads through the same validator. Spec 239 gives translation for the global file only (SC-R4), not for project files, and does not say the validator is bypassed for setup/doctor.
- Running cases: spec 202 says an unpinned schema-1 record "behaves exactly as today". Today's behaviour re-expands the stored selector against `PRESETS` and reads `runner.patterns.reviewed` from the pinned config snapshot (`run.mjs` 773, 1438-1441). Both are removed or renamed. Not stated: whether the snapshot is re-validated under the new shape, and what a schema-1 record whose selector is the now-retired `research-fan-out-gated` does (spec 78 retires it; 164 checks only skills, not saved Units or live records). `legacy-seat-read.mjs` is named as a decoder (233) but never tied to this.
- Fix: one paragraph: (a) project retired keys are read through the same one-way translation as global until setup runs, or setup is exempt and the refusal text says so; (b) resume of a schema-1 record reads its snapshot through that translation and maps `research-fan-out-gated` (and every retired preset name) through the legacy decoder, with a test row in S11/S18.

### H3. Invariants and catalog entry have no concrete schema (area 4, and areas 1 and 3 depend on it)
- Spec 70-74 name `promise`, `loop`, `defaults`, `invariants` but not the invariant shape. "required checkers, required seats, locked `roleTasks`, locked `rebuttal`" has no field names, no value types, and no definition of "tighten" or "weaken" for locked `roleTasks` (a replaced text: weaker? equal?) or locked `rebuttal`. The weakening check (`pattern-invariant-weakened`, 76, 139) cannot be implemented without that.
- Spec 76 says a layer may "override the `defaults` of a shipped name" yet 13.1 retires old `runner.patterns.reviewed.{maxRounds,checkersByRigor}`, which is syntactically the same path as the new catalog entry `runner.patterns.reviewed`. Whether an override entry of a shipped name needs `promise` and `loop` (70-71 say required), whether defaults merge per key or replace as one object, and how the validator tells a retired `patterns.reviewed.maxRounds` (retired key) from a valid entry are all unspecified. The spec 83 "Not verified" note about a replace annotation is partly answerable: `docs/platform/config/spec.md:139-140` says a map merges per entry (`x-fgos-merge: deep`) and `x-fgos-merge: replace` applies to a whole section, "which the schema must allow", with no per-entry replace. So the entry-level replace claimed at 76 is not supported by Config today and the fallback is "a hazard check in the resolver", which is the very per-key semantic the spec says it avoids. Decide now: per-key deep merge for shipped-name overrides plus a validator comparison against the shipped entry, or forbid overrides of `loop`/`invariants` outright.
- `roleTasks` shape inside `defaults` (map keyed by seat or kind, `role-tasks.mjs:98`), seat entry shape inside `defaults.seats`, and the pin's `digest` canonicalisation (182) are likewise left to a guess.
- Fix: add the JSON Schema fragment for one catalog entry and one merge table (shipped name, custom name, per layer) to section 5. Fold in the replace question with the Config owner before approval, not at implementation.

### H4. Capability `minCheckers` is a replaceable default in 8.2 and a floor in 8.3 and 12 (areas 1, 3, 4)
- 8.2 (118) lists "capability default (`minCheckers` only)" below `request` in the replaceable chain, so `--param`/`--params '{"minCheckers":["reviewer"]}'` replaces it. 8.3 (122) unions "the capability policy (today the coding red-team)" as a floor, and 124 says a below-floor request is a minimum with the floor unioned. Section 12 (216) says the capability entry's `minCheckers` "replaces the default" only via config, and the result is "still unioned" with `checkersByRigor` and invariants. Which of the two does a request below a capability `minCheckers` get? The provenance classes list `capability` under both `params` (185) and `checkers` (186). S7 and S14 cannot be written without the answer. If 8.2 wins, a request drops `red-team` from `code:implement`, a weaker roster than today's code. If 8.3 wins, 8.2 is wrong.
- Fix: decide: capability `minCheckers` (explicit config) is a floor against a request and a replaceable default only against another config layer; reword 8.2 to put capability above request for this one key, or remove it from the replaceable chain.

### H5. Two codes for one case, and a case with no owner (area 3)
- Roster missing a required checker for a pattern invariant: 8.5 line 139 gives it to `pattern-invariant-weakened` ("a layer, request or `unit.seats` changes a locked invariant"), line 140 and 125 give the same case ("a reviewed roster missing a required role or seat") to `seat-multiplicity`. Example: `unit.seats` for `code-change` without `red-team`. Both rows fire.
- Request `minCheckers` below an invariant: 8.3 (124) unions it and refuses nothing; 8.5 (139) says a request changing a locked invariant refuses. Pick one.
- Reserved seat ids `verify`/`verifier` (11.3, 208; S13) are refused by `checkDeclaredSeats`, but no 8.5 row owns the code and today's function throws `invalid-seat-id`/no code for most failures (`seat-resolver.mjs:143-160`). Likewise `minCheckers: ["x"]` has `param-invalid` in 8.5 (136) while `checkerSeatsOf` throws `unknown-checker-seat` (`:118`); the spec does not say that code is retired.
- `--param minCheckers=reviewer` / `--param seats=...` (scalar-only form, 156): which code? None is named.
- Fix: one owner per case: add rows for reserved ids and non-scalar `--param`; resolve the roster/invariant overlap (suggest `seat-multiplicity` only when no invariant is named, otherwise `pattern-invariant-weakened`); say which existing codes are replaced.

### H6. An explicit `--pattern` swap defeats the activity's pattern and its invariants with no reason or record (area 1)
- 7.1 (98-103): `--pattern <name>` (step 3) beats the activity unit (step 4). 9.2 (170) names `--pattern solo` as "the escape". `param-reason-required` (142) applies to "a request", and 7.1 (104) says a request "carries no pattern of its own", so `--pattern` on a case needs no `--reason`. Yet the pin has `requested.pattern` (180) for a request that cannot carry one.
- Result: on an activity declaring `reviewed`/`code-change`, a conductor may pass `--pattern solo` (or a project-declared pattern with no invariants) and receive a weaker roster. Pattern invariants, which 8.3 makes a floor, are bound to the pattern name and so disappear with the name. Part A defers detection to B9 ("optional", Part B file line 21) and Part B "can land later, or never" (Part B line 3). The headline promise (41, "never a weaker receipt than the milestone guard") therefore has no Part A enforcement; spec 212 says so only for the no-command case.
- Fix (small, in scope): require `--reason` whenever a case dispatch's explicit selector differs from a non-null `activityUnit.pattern`, record it in the pin (`requested.pattern`, `baseline.source`), and say in section 1 or RR-P6 that until B6/B9 the promise is unenforced for explicit swaps.

## Medium (blocks implementation)

### M1. `--param` parsing and bounds application are unspecified (area 4)
- 9.1 (156) says "typed by the loop's schema" with no rule for: integer vs boolean literals (`true`/`1`), empty value, a value containing `=`, a repeated key (the spec only covers `--params` vs `--param`, 158), whitespace, unknown key (should be `param-unknown`, not stated for the CLI-only form), `maxRounds=1.5`.
- 8.4 (129) does not say when bounds are checked relative to merge: against the request value only, or against the effective winner when the winner came from a request; `min > max`, non-integer bounds, and bounds on a param the loop does not read (13.3 246 says "must be params the loop reads"; the refusal code at config load is not in 8.5 either, and `pattern-invariant-weakened` is the wrong name). Part A ships `maxRounds` as the only bounded param, so a closed rule is cheap.

### M2. Global-file catalog entries and older releases (area 2)
- 5 (76) layers "project > global > shipped", but 13.2 only handles converting the old `runner.patterns.reviewed`. A user-written global `runner.patterns.<custom>` or `runner.loops` breaks every older activated release that reads the global file (allowlist at `config.mjs:1488-1491`, strict). RR-P3 names the risk, but no rule says global catalog declarations are forbidden or warned until doctor sees no older release. Make that explicit in 13.2 (and doctor, 249).

## Part B leakage and duplicate ownership (areas 3 and 6)

- `defaultRule` has two owners: Part A drops it (13.1 line 229, 13.2, CHANGELOG 251) while `part-b-evidence-hardening.md` B10 (line 22) still lists "retire `runner.patterns.defaultRule.mutatingMinRigor`" as a Part B hygiene item. Remove B10 from Part B or from Part A; at present both are scheduled and Part B says it "may ship first".
- Part B still says "Replaces 'unchanged' in Part A's evidence note" (B3 row) for a note that no longer exists in the rewritten Part A. Edit.
- Part A section 8.3 (123) and 15 (313-314) carry Part B's admission content (the codes `verify-command-required`, `verdict-seat-required`, the proposal field list). It is framed as a dependency, so I treat it as acceptable, but the field list is a Part B contract; a single reference to B6/B9 would be enough. Low.

## Old vocabulary left in normative text (area 5)

- 9.2 (165): `fgos run --pattern <preset> --unit <file>`; should be `<name>`.
- 1 (16): "Named presets are a code constant" is problem text, acceptable. `docs/platform/config/spec.md:139` and the Part A amendment row (385, 391) still say "preset"/"workflow presets"; the config spec amendment row (394) should also replace "the patterns, the workflow presets" in the standard-catalog sentence.
- 18 (390) quotes `CollaborationPattern` verbatim from runner.md (allowed as quote) but names no replacement beyond "loops and patterns per section 2".
- No other normative use of "pattern" meaning loop found in sections 4-12; section 13.1 correctly lists `patternName`.

## Checked and fine

- Reserved ids `verify`/`verifier` match `isVerifyResult` regex and `VERIFY_SEAT` (`seat-resolver.mjs:35`).
- Unit-file params carry no free-form object (census 166), so Unit files do not bypass `bounds`; only `seats` and registered steps (project-authored) do.
- `seatSchema` fence at `run.mjs:211-221` (writes 1 at 768) matches spec 191.
- Rename scope and `wf-physical-rename` boundary (235, 54) are consistent with `docs/backlog.md:8`.

## Unresolved questions
1. H1: is losing the older-release config fence acceptable, or must a refusing marker survive in `runner.patterns`?
2. H3: does Config accept entry-level replace, or is per-key deep merge plus a resolver check the decided semantic?
3. H4: is capability `minCheckers` a floor against requests (recommended) or a request-replaceable default?
4. H6: is an explicit `--pattern` swap on an activity allowed without a reason in Part A?

Status: DONE
