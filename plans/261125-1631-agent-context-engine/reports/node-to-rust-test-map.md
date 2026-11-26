# Node test to Rust test that now owns it

Source of the left column: `test/setup/instruction-registry.test.mjs` (42 tests) and
`test/setup/instruction-composition.test.mjs` (18 tests). Right column: tests of the crate
`packages/agent-context-engine/rust/tests/` (`cargo test -p fgos-agent-context-engine --all-features`, 93 tests). Names
are the exact Rust test names; `file::name`.

How to read a row. **owned**: the named Rust test proves the behaviour; the Node test may be deleted with the Node code.
**removed**: the behaviour no longer exists (reason given); delete the Node test. **later**: the owning proof is written
by a later unit (host door, owner registry adapter, migrated units); the Node test is deleted only after that proof
exists. Three rows are **later**: R27-R29 (manifest half), R41 and R42.

## Composition (`instruction-composition.test.mjs`)

| # | Node test | Rust owner | Note |
|---|---|---|---|
| C1 | emits a stable IR ordered laws, boundaries, procedures, preferences, host adapters | `compose::orders_laws_boundaries_procedures_preferences_host_adapters`; `set::the_same_set_is_always_the_same_bytes_with_sorted_keys_and_one_newline` | owned. The audience key, target and `effectiveSetRelativePath` are removed: one set for the repo, ASC selects by `when:`; the file name `rules.json` is the host door's constant (later unit). |
| C2 | keeps high-authority laws effective when narrower procedures refine them | `compose::a_narrower_procedure_refines_a_law_and_the_law_stays_in_force` | owned. `refinedBy` is dropped from the output (not in `effective-rules.v1`). |
| C3 | rejects duplicate active ids without valid supersession | `compose::a_rule_in_force_from_two_files_is_refused`; `check::an_id_used_by_two_files_is_refused_even_when_neither_is_in_force` | owned. The "older copy that shares the id" case is removed: ids are unique across the vault (pkm R16). |
| C4 | allows explicit supersession and records inactive provenance | `compose::a_replaced_rule_stays_in_force_and_its_successor_may_follow_it`; `compose::a_replaced_rule_whose_window_ended_is_left_out_of_the_set` | owned with a change: supersession is the replaced lifecycle, valid inside its window and left out after `valid_to` (pkm decides which); the `inactive` list is removed (not in the set contract). |
| C5 | rejects equal-authority override without ordered specificity winner | `compose::an_override_at_equal_scope_has_no_ordered_winner` | owned |
| C6 | rejects component authority claiming repo scope to override platform preferences | `compose::a_component_may_not_claim_the_repo_scope`; `rule_unit::a_component_or_domain_root_may_not_claim_the_repo_or_platform_scope` | owned (composition keeps the guard for hand-built units; the reader refuses it first). |
| C7 | orders broad scope before narrow scope regardless of caller specificity | `compose::orders_broad_scope_before_narrow_whatever_the_specificity` | owned |
| C8 | rejects narrower attempts to override laws | `compose::a_narrower_rule_may_not_override_a_law` | owned (refusal `rule-law-overridden`) |
| C9 | requires law supersession decision evidence | `compose::a_law_is_replaced_only_by_a_platform_authority_law` | owned with a change: the evidence is the sealed replaced triple (`replaced`, `superseded_by`, `valid_to`) on a law whose successor is a platform-authority law. |
| C10 | rejects unverified forged law supersession decisions | none | removed: `supersessionDecision` is not a field of `rule-unit.v1`; no decision id is read. |
| C11 | rejects caller-forged law supersession verification flags | none | removed (same reason; no verification flag exists). |
| C12 | rejects caller-provided law supersession allowlists | none | removed (same reason). |
| C13 | accepts law supersession only with verified decision evidence | `compose::a_law_is_replaced_only_by_a_platform_authority_law` | owned (the platform-law successor passes; others refused). |
| C14 | accepts law supersession when a real generated decision index escapes pipes | none | removed: the decision index is no longer read by the rule store. |
| C15 | treats supersession target filtered by host applicability as missing from the effective set | `compose::a_dependency_missing_or_not_in_force_is_refused` | owned for "named but not in force"; host filtering is removed (`when:` is applied by ASC, not by composition). |
| C16 | rejects mutually exclusive active instructions and boundary conflicts | `compose::mutually_exclusive_rules_and_conflicting_boundaries_are_refused`; `compose::rules_joined_by_conflicts_with_do_not_conflict_when_their_when_cannot_both_hold` | owned. The second test replaces the old "co-apply by host" rule with "co-apply unless a shared `when:` key has no common value". |
| C17 | rejects missing dependencies and impossible ordering relationships | `compose::a_dependency_missing_or_not_in_force_is_refused`; `compose::an_ordering_the_base_order_cannot_honour_is_refused_and_never_reordered` | owned |
| C18 | composeAllInstructionSets emits repo plus owner-scoped sets | `compose::one_set_holds_platform_component_and_domain_rules_in_one_order` | owned with a change: one set holds every rule in force; per-audience sets are removed. |

Behaviours the Node composer had that its tests never named, now with a Rust owner: override and forbid retiring a
preference (`compose::a_narrower_scope_overrides_a_preference_and_retires_it`, `..._forbids_...`), a target-less
override (`an_override_or_forbid_that_names_no_target_is_refused`), only preferences overridable
(`only_preferences_permit_override`), host adapters unable to change meaning (`a_host_adapter_cannot_change_the_meaning_of_a_rule`),
boundary refinement by owner only (`a_rule_may_not_override_a_boundary_and_a_boundary_is_refined_by_its_owner_only`),
unknown `conflicts_with` target (`a_conflicts_with_target_that_does_not_exist_is_refused`), dependency cycle
(`a_dependency_cycle_is_refused`), `depends_on` ordering (`depends_on_puts_the_dependency_first_inside_the_base_order`), tie
breaks (`ties_break_by_authority_then_source_then_id`), mutual replacement (`two_rules_that_replace_each_other_are_refused`),
non-law replacement authority (`a_non_law_is_replaced_by_its_owner_or_by_platform_authority_only`), sorted conflicts
(`conflicts_come_back_sorted_and_without_repeats`).

## Registry (`instruction-registry.test.mjs`)

| # | Node test | Rust owner | Note |
|---|---|---|---|
| R1 | extractInstructionFrontmatter extracts valid YAML frontmatter and body | `store::reads_units_from_core_components_and_domains_with_their_sources` | owned |
| R2 | ...throws INVALID_METADATA when frontmatter block is missing | `store::a_file_without_readable_frontmatter_is_refused_and_every_bad_file_is_reported_together` | owned (`rule-unit-invalid`) |
| R3 | ...throws INVALID_METADATA on malformed YAML | same | owned |
| R4 | ...throws INVALID_METADATA when frontmatter is not an object | same; `rule_unit::the_frontmatter_must_be_a_mapping` | owned |
| R5 | discoverInstructionSources discovers fragments from core, components, and domains | `store::reads_units_from_core_components_and_domains_with_their_sources` | owned |
| R6 | handles missing or empty directories gracefully | `store::missing_or_empty_roots_read_as_no_rules` | owned |
| R7 | classifies all 5 canonical instruction kinds correctly | `rule_unit::every_force_mode_scope_and_lifecycle_of_the_contract_is_accepted` | owned |
| R8 | throws INVALID_METADATA when id is missing | `rule_unit::a_missing_required_field_names_the_field` | owned |
| R9 | ...when id contains invalid characters | `rule_unit::an_id_must_be_lower_case_words_joined_by_dashes` | owned with a change: the id pattern is lower-case words joined by dashes (dots, underscores and capitals are no longer ids). |
| R10 | ...when kind is invalid | `rule_unit::kind_mode_scope_lifecycle_and_specificity_outside_the_contract_are_refused` | owned |
| R11 | ...when mode is invalid | same | owned |
| R12 | ...when scope is invalid | same | owned |
| R13 | rejects component or domain roots claiming repo scope | `rule_unit::a_component_or_domain_root_may_not_claim_the_repo_or_platform_scope`; `rule_unit::a_domain_may_not_claim_the_component_scope_nor_a_component_the_domain_scope` | owned |
| R14 | ...when specificity is not a number | `rule_unit::kind_mode_scope_lifecycle_and_specificity_outside_the_contract_are_refused` | owned (a non-negative integer is required) |
| R15 | records supersessionDecision when law replacement evidence is declared | none | removed (`supersessionDecision` is not a field; see C10) |
| R16 | rejects law supersession decisions absent from the decision index | none | removed |
| R17 | ...found only in malformed decision-index prose | none | removed |
| R18 | rejects generated-looking decision-index facsimiles | none | removed |
| R19 | rejects canonical-looking decision-index rows not backed by state.decisions | none | removed |
| R20 | accepts generated decision indexes with escaped pipes | none | removed |
| R21 | throws INVALID_METADATA when appliesTo is invalid | `rule_unit::when_must_be_a_mapping_of_keys_to_lists_of_strings`; `rule_unit::an_unknown_key_is_refused_and_so_are_the_retired_ones` | owned: `appliesTo` becomes `when:`; the old key is refused by name. |
| R22 | throws DUPLICATE_ID when two files share the same id in the same root | `check::an_id_used_by_two_files_is_refused_even_when_neither_is_in_force` | owned (path-independent) |
| R23 | ...across different roots | same; `store::pkm_findings_become_refusals_with_the_rule_id_of_the_node` (pkm R16 wiring) | owned |
| R24 | throws UNKNOWN_OWNER when declared owner is not in knownOwners | `check::an_owner_that_is_neither_core_nor_a_known_component_or_domain_is_refused` | owned (`rule-owner-unknown`) |
| R25 | throws UNKNOWN_OWNER when component folder is not in knownOwners | `store::a_component_or_domain_directory_outside_the_authority_model_is_refused` | owned |
| R26 | throws AUTHORITY_MISMATCH when declared owner does not match root authority owner | `rule_unit::the_root_fixes_the_authority_and_the_owner_must_match_it` | owned (`rule-unit-invalid`) |
| R27 | UNKNOWN_OWNER under default options when component is not in manifest | `store::a_component_or_domain_directory_outside_the_authority_model_is_refused` | owned for the refusal; **later** for reading the model: the host `OwnerRegistry` adapter test (over `fgos authority model`) owns "the registry is the model". |
| R28 | ...when domain is not in manifest | same | same split |
| R29 | ...when no manifest exists and component is present | same | same split |
| R30 | InstructionRegistry: map returns standard Array | none | removed: the corpus is a plain `Vec`; a JS class with frozen indexes has no Rust counterpart. |
| R31 | filter returns InstructionRegistry and preserves lookup | none | removed (same) |
| R32 | slice returns InstructionRegistry and preserves lookup | none | removed (same) |
| R33 | concat returns InstructionRegistry and preserves lookup | none | removed (same) |
| R34 | query methods return InstructionRegistry and preserve lookup | none | removed (same) |
| R35 | post-construction mutation throws on frozen instance | none | removed (same; Rust ownership) |
| R36 | post-construction index assignment throws on frozen instance | none | removed (same) |
| R37 | lookup index cannot be corrupted or mutated externally (regression) | none | removed (same) |
| R38 | throws CONTAINMENT_VIOLATION when symlink points outside root | `store::a_symlink_that_leaves_the_repository_is_refused` | owned |
| R39 | ignores non-.md files and non-lowercase extension files | `store::only_lower_case_md_files_outside_dot_names_are_read` | owned |
| R40 | supports custom roots as internal/test-only options | none | removed: the store takes one repository root; fixtures are temporary repositories. |
| R41 | discovers real canonical instructions in repository | none yet | **later**: the seven real units migrate to `rule-unit.v1` in a later unit; the door round trip (`cargo test -p fgos --test context_engine`) owns "the real repository reads and compiles". Do not delete the Node test before that exists. |
| R42 | discoverKnownOwners admits top-level component ids and component-authority, rejects subcomponents with parent | none yet | **later**: the host `OwnerRegistry` adapter test owns it. |

(The registry file has 42 tests; rows R1-R42 are in file order, R27-R29 are the three "default options" tests.)

## Behaviours the crate adds and owns (no Node counterpart)

- Contract vectors: `vectors::the_valid_unit_vector_is_clean`, `vectors::every_refusal_of_the_contract_has_a_vector_that_raises_it`,
  `vectors::the_effective_set_vector_reads_and_its_digest_is_the_canonical_digest_of_its_rules`,
  `vectors::a_set_compiled_from_the_valid_unit_is_the_effective_set_vector`,
  `vectors::the_refusal_codes_categories_and_phases_are_those_of_the_contract`,
  `vectors::the_when_key_registry_is_the_contract_with_its_version`, `vectors::the_unit_schema_requires_what_the_reader_requires`.
- Set reader and digest: `set::*` (round trip, key-order independence, versions refused before the digest, malformed files).
- `when:` keys: `check::a_when_key_must_be_in_the_registry`, `check::a_static_key_accepts_only_its_listed_values_and_an_empty_list_is_refused`,
  `check::a_live_key_is_checked_against_the_callers_values_and_unchecked_without_them`.
- Probe findings: G-A `rule_unit::an_edge_must_be_a_wikilink_...`; G-C `rule_unit::a_rule_without_valid_from_is_refused_...` and
  `store::in_force_follows_lifecycle_and_dates_and_accounts_for_every_file` (counts add up); G-D
  `rule_unit::replacement_fields_belong_to_a_replaced_rule_only`; G-E same as G-A (raw frontmatter read); G-F
  `rule_unit::the_file_stem_must_equal_the_id`; G-G `compose::mutually_exclusive_rules_...`, `store::a_repository_with_conflicting_rules_in_force_is_refused_...`;
  G-K `check::nearest_rule_hits_keep_only_the_rules_in_force`; the pkm index as a view `store::the_index_is_a_view_outside_the_tree_...`,
  `store::the_index_is_rebuilt_when_a_unit_changes`, `store::a_long_list_of_rules_in_force_is_never_cut`.
