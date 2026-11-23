## Step 3 — model checks move into the crate

All checks live in `packages/component-authority/rust/tests/model_checks.rs`, reading the real model from `CARGO_MANIFEST_DIR/../../..`. Both Node files are deleted. `test/suite-baseline.json` held no entry for either file (grep found none), so nothing was dropped there. `apps/fgos/tests/authority.rs` was not needed: the crate integration test reaches the real repository itself.

Schema rules the typed loader already owns (`Model::load` with `deny_unknown_fields`, required fields, value types): required/unknown fields, string/array typing, door `allowed`/`debt` item shape, `layers` required fields. The Node loops for those are retired because a model violating them cannot load (owner: `model.rs` tests `an_unknown_field_is_refused`, `an_unknown_field_inside_a_tier_exception_is_refused`). Enums, ranges and non-empty rules are asserted explicitly.

| Retired Node test | Owning Rust test (model_checks.rs) |
|---|---|
| components: model files validate against model.v1.json | `every_model_row_obeys_the_enums_ranges_and_non_empty_rules_of_the_schema` (+ loader for required/unknown/types) |
| first row of components is component-authority | `first_row_of_components_is_component_authority` |
| component ids are unique | `component_ids_are_unique` |
| every parent reference exists | `every_parent_component_reference_exists_in_components` |
| every decision-kind owner exists | `every_decision_kind_owner_exists_in_components` |
| every spec/source/narrative path exists | `every_spec_source_and_decision_kind_narrative_path_exists_on_disk` |
| every component paths[] entry exists | `every_component_paths_entry_exists_on_disk` |
| canonical/aliases unique (case-insensitive) | `canonical_and_aliases_are_unique_across_components_and_decision_kinds_case_insensitively` |
| contracts rows validate against $defs/contract | `contracts_rows_obey_the_enums_and_non_empty_rules_of_the_schema` (guards/version shape checked there) |
| one row per package/prose contract file | `every_top_level_package_contract_file_and_every_prose_contract_has_exactly_one_row` |
| provider exists in components | `every_contract_row_has_exactly_one_provider_that_exists_in_components` |
| every consumer exists | `every_contract_consumer_exists_in_components` |
| live/designed rows name an existing path | `live_and_designed_contract_rows_name_an_existing_path` |
| id/canonical/aliases unique across contracts | `contract_id_canonical_and_aliases_are_unique_case_insensitively` |
| provider vs longest-prefix owner carries reason | `a_provider_differing_from_the_longest_prefix_path_owner_carries_a_reason` |
| synthetic: coverage/provider/path checks name file or row | `synthetic_coverage_provider_and_path_existence_checks_fail_with_the_named_file_or_row` |

Added: `contract_guards_outside_the_schema_shapes_are_refused` (the typed loader keeps `guards` as raw JSON, so the string-or-string-array rule needs its own proof).

Not run: cargo and node were refused in this session, so nothing was compiled or executed, including `cargo fmt`. Lead should run `cargo fmt --all -- --check`, `cargo test -p fgos-component-authority`, `cargo test -p fgos --test authority`.

Status: DONE_WITH_CONCERNS
Summary: Every case of components.test.mjs and contracts.test.mjs is now a Rust test in the crate's `tests/model_checks.rs`; both Node files deleted.
Concerns: Rust code was never compiled or formatted (cargo refused); `test/suite-baseline.json` had no entries for the deleted files so it is unchanged; the Node tests' pure type/required/unknown-field loops are owned by the typed loader instead of being re-asserted.
