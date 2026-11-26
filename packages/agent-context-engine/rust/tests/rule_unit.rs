//! Reading one unit: the frontmatter schema, the authority of the root, the link form and the lifecycle fields.

use fgos_agent_context_engine::refusal::RefusalCode;
use fgos_agent_context_engine::rule::{Authority, Kind, Lifecycle, Mode, RuleFile, Scope};
use serde_json::{json, Value};

const SOURCE: &str = "core/instructions/example-rule.md";

fn base() -> Value {
    json!({
        "id": "example-rule", "owner": "core", "kind": "procedure", "mode": "append", "scope": "repo",
        "specificity": 10, "title": "Example rule", "lifecycle": "live", "valid_from": "2026-11-25"
    })
}

fn with(patch: Value) -> Value {
    let mut v = base();
    for (k, val) in patch.as_object().unwrap() {
        if val.is_null() {
            v.as_object_mut().unwrap().remove(k);
        } else {
            v[k] = val.clone();
        }
    }
    v
}

fn refused(front: Value, source: &str) -> RefusalCode {
    RuleFile::read(&front, "body", source)
        .expect_err("the unit is refused")
        .code
}

fn invalid(patch: Value) -> String {
    let r = RuleFile::read(&with(patch), "body", SOURCE).expect_err("the unit is refused");
    assert_eq!(r.code, RefusalCode::UnitInvalid, "{r}");
    r.message
}

#[test]
fn reads_a_valid_unit_with_its_body_trimmed_and_its_edges_as_bare_ids() {
    let front = with(json!({
        "description": "d", "when": {"role": ["producer"]},
        "refines": ["[[other-rule]]"], "depends_on": ["[[a-rule]]", "[[b-rule]]"],
        "conflicts_with": ["[[c-rule]]"], "related": ["[[d-rule]]"]
    }));
    let file = RuleFile::read(&front, "\n# Title\n\ntext\n\n", SOURCE).unwrap();
    assert_eq!(file.body, "# Title\n\ntext");
    assert_eq!(file.authority, Authority::Platform);
    assert_eq!(file.unit.refines, ["other-rule"]);
    assert_eq!(file.unit.depends_on, ["a-rule", "b-rule"]);
    assert_eq!(file.unit.conflicts_with, ["c-rule"]);
    assert_eq!(file.unit.related, ["d-rule"]);
    assert_eq!(file.unit.when["role"], ["producer"]);
    assert_eq!(file.unit.description.as_deref(), Some("d"));
}

#[test]
fn every_force_mode_scope_and_lifecycle_of_the_contract_is_accepted() {
    for kind in Kind::ALL {
        let file = RuleFile::read(&with(json!({"kind": kind.as_str()})), "b", SOURCE).unwrap();
        assert_eq!(file.unit.kind, kind);
    }
    for mode in Mode::ALL {
        assert_eq!(
            RuleFile::read(&with(json!({"mode": mode.as_str()})), "b", SOURCE)
                .unwrap()
                .unit
                .mode,
            mode
        );
    }
    for scope in Scope::ALL {
        assert_eq!(
            RuleFile::read(&with(json!({"scope": scope.as_str()})), "b", SOURCE)
                .unwrap()
                .unit
                .scope,
            scope
        );
    }
    for life in [
        Lifecycle::Draft,
        Lifecycle::Rejected,
        Lifecycle::Live,
        Lifecycle::Deprecated,
        Lifecycle::Retracted,
    ] {
        assert_eq!(
            RuleFile::read(&with(json!({"lifecycle": life.as_str()})), "b", SOURCE)
                .unwrap()
                .unit
                .lifecycle,
            life
        );
    }
}

#[test]
fn a_missing_required_field_names_the_field() {
    for field in [
        "id",
        "owner",
        "kind",
        "mode",
        "scope",
        "specificity",
        "title",
        "lifecycle",
        "valid_from",
    ] {
        let message = invalid(json!({ field: null }));
        assert!(message.contains(field), "{field}: {message}");
    }
}

#[test]
fn a_rule_without_valid_from_is_refused_because_pkm_would_drop_it_silently() {
    assert!(invalid(json!({"valid_from": null})).contains("silently drops out"));
}

#[test]
fn an_id_must_be_lower_case_words_joined_by_dashes() {
    for bad in ["Has_Upper", "has space", "-lead", "trail-", "dou--ble", ""] {
        let front = with(json!({"id": bad}));
        assert_eq!(refused(front, SOURCE), RefusalCode::UnitInvalid, "{bad}");
    }
}

#[test]
fn the_file_stem_must_equal_the_id() {
    let r = RuleFile::read(&base(), "b", "core/instructions/other-name.md").unwrap_err();
    assert_eq!(r.code, RefusalCode::UnitInvalid);
    assert!(r.message.contains("file stem"));
}

#[test]
fn kind_mode_scope_lifecycle_and_specificity_outside_the_contract_are_refused() {
    assert!(invalid(json!({"kind": "decree"})).contains("kind"));
    assert!(invalid(json!({"mode": "replace"})).contains("mode"));
    assert!(invalid(json!({"scope": "galaxy"})).contains("scope"));
    assert!(invalid(json!({"lifecycle": "zombie"})).contains("lifecycle"));
    assert!(invalid(json!({"specificity": "high"})).contains("specificity"));
    assert!(invalid(json!({"specificity": -1})).contains("specificity"));
    assert!(invalid(json!({"specificity": 1.5})).contains("specificity"));
}

#[test]
fn an_unknown_key_is_refused_and_so_are_the_retired_ones() {
    assert!(invalid(json!({"colour": "red"})).contains("unknown frontmatter key"));
    assert!(invalid(json!({"appliesTo": ["*"]})).contains("appliesTo"));
    assert!(invalid(json!({"supersedes": ["x"]})).contains("supersedes"));
}

#[test]
fn the_frontmatter_must_be_a_mapping() {
    let r = RuleFile::read(&json!(["a", "b"]), "b", SOURCE).unwrap_err();
    assert_eq!(r.code, RefusalCode::UnitInvalid);
}

#[test]
fn a_file_outside_the_three_roots_is_refused() {
    assert_eq!(
        refused(base(), "docs/example-rule.md"),
        RefusalCode::UnitInvalid
    );
    assert_eq!(
        refused(base(), "core/other/example-rule.md"),
        RefusalCode::UnitInvalid
    );
}

#[test]
fn the_root_fixes_the_authority_and_the_owner_must_match_it() {
    let domain = with(json!({"owner": "coding", "scope": "domain"}));
    let file = RuleFile::read(&domain, "b", "domains/coding/instructions/example-rule.md").unwrap();
    assert_eq!(file.authority, Authority::Domain("coding".into()));
    let component = with(json!({"owner": "packaging-distribution", "scope": "component"}));
    let file = RuleFile::read(
        &component,
        "b",
        "components/packaging-distribution/instructions/example-rule.md",
    )
    .unwrap();
    assert_eq!(
        file.authority,
        Authority::Component("packaging-distribution".into())
    );
    let mismatch = with(json!({"owner": "someone-else"}));
    let r = RuleFile::read(&mismatch, "b", SOURCE).unwrap_err();
    assert_eq!(r.code, RefusalCode::UnitInvalid);
    assert!(r.message.contains("mismatches"));
}

#[test]
fn a_component_or_domain_root_may_not_claim_the_repo_or_platform_scope() {
    for scope in ["repo", "platform"] {
        let front = with(json!({"owner": "coding", "scope": scope}));
        let r =
            RuleFile::read(&front, "b", "domains/coding/instructions/example-rule.md").unwrap_err();
        assert_eq!(r.code, RefusalCode::UnitInvalid);
        assert!(r.message.contains("cannot claim scope"), "{r}");
        let front = with(json!({"owner": "packaging-distribution", "scope": scope}));
        assert!(RuleFile::read(
            &front,
            "b",
            "components/packaging-distribution/instructions/example-rule.md"
        )
        .is_err());
    }
}

#[test]
fn a_domain_may_not_claim_the_component_scope_nor_a_component_the_domain_scope() {
    let front = with(json!({"owner": "coding", "scope": "component"}));
    assert!(RuleFile::read(&front, "b", "domains/coding/instructions/example-rule.md").is_err());
    let front = with(json!({"owner": "packaging-distribution", "scope": "domain"}));
    assert!(RuleFile::read(
        &front,
        "b",
        "components/packaging-distribution/instructions/example-rule.md"
    )
    .is_err());
}

#[test]
fn an_edge_must_be_a_wikilink_because_pkm_makes_no_edge_from_a_bare_id() {
    for key in ["refines", "depends_on", "conflicts_with", "related"] {
        for bad in ["bare-id", "[[Upper]]", "[[with space]]", "[[]]", "[other]"] {
            let message = invalid(json!({ key: [bad] }));
            assert!(
                message.contains("wikilinks") && message.contains(key),
                "{key} {bad}: {message}"
            );
        }
        assert!(invalid(json!({ key: "[[one-rule]]" })).contains("list"));
    }
}

#[test]
fn replacement_fields_belong_to_a_replaced_rule_only() {
    assert!(invalid(json!({"valid_to": "2027-01-01"})).contains("only with lifecycle replaced"));
    assert!(invalid(json!({"superseded_by": "[[other-rule]]"}))
        .contains("only with lifecycle replaced"));
}

#[test]
fn a_replaced_rule_needs_its_successor_and_its_end_date() {
    for patch in [
        json!({"lifecycle": "replaced"}),
        json!({"lifecycle": "replaced", "superseded_by": "[[other-rule]]"}),
        json!({"lifecycle": "replaced", "valid_to": "2027-01-01"}),
    ] {
        assert_eq!(
            refused(with(patch), SOURCE),
            RefusalCode::ReplacementIncomplete
        );
    }
    let ok = with(
        json!({"lifecycle": "replaced", "superseded_by": "[[other-rule]]", "valid_to": "2027-01-01"}),
    );
    let file = RuleFile::read(&ok, "b", SOURCE).unwrap();
    assert_eq!(file.unit.superseded_by.as_deref(), Some("other-rule"));
    assert_eq!(file.unit.valid_to.as_deref(), Some("2027-01-01"));
}

#[test]
fn a_superseded_by_that_is_not_a_wikilink_is_refused() {
    let front = with(
        json!({"lifecycle": "replaced", "superseded_by": "other-rule", "valid_to": "2027-01-01"}),
    );
    assert_eq!(refused(front, SOURCE), RefusalCode::UnitInvalid);
}

#[test]
fn dates_must_be_real_calendar_days() {
    for bad in [
        "2026-13-01",
        "2026-02-30",
        "26-01-01",
        "2026/01/01",
        "tomorrow",
    ] {
        assert!(
            invalid(json!({"valid_from": bad})).contains("valid_from"),
            "{bad}"
        );
    }
    assert!(RuleFile::read(&with(json!({"valid_from": "2028-02-29"})), "b", SOURCE).is_ok());
    assert!(RuleFile::read(&with(json!({"valid_from": "2027-02-29"})), "b", SOURCE).is_err());
}

#[test]
fn when_must_be_a_mapping_of_keys_to_lists_of_strings() {
    assert!(invalid(json!({"when": ["producer"]})).contains("when"));
    assert!(invalid(json!({"when": {"role": "producer"}})).contains("list"));
    assert!(invalid(json!({"when": {"role": [1]}})).contains("strings"));
}

#[test]
fn the_default_specificity_of_a_scope_runs_from_broad_to_narrow() {
    let order: Vec<u32> = [
        Scope::Repo,
        Scope::Component,
        Scope::Domain,
        Scope::Project,
        Scope::Command,
        Scope::Skill,
        Scope::Session,
        Scope::Host,
    ]
    .iter()
    .map(|s| s.default_specificity())
    .collect();
    assert_eq!(order, [10, 20, 30, 40, 50, 60, 70, 80]);
    assert_eq!(Scope::Platform.default_specificity(), 10);
    assert_eq!(Scope::Workspace.default_specificity(), 40);
}
