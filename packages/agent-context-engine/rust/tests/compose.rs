//! Composition of the rules in force: order, relationships, law protection, conflict and dependency checks.

mod common;

use common::*;
use fgos_agent_context_engine::compose::{compose, ConflictCode};
use fgos_agent_context_engine::refusal::RefusalCode;
use fgos_agent_context_engine::rule::{Kind, Lifecycle, Mode, Scope};

#[test]
fn orders_laws_boundaries_procedures_preferences_host_adapters() {
    let rules = vec![
        rule("domain-procedure").domain("coding").build(),
        rule("host-syntax")
            .scope(Scope::Host)
            .kind(Kind::HostAdapter)
            .build(),
        rule("repo-preference").kind(Kind::Preference).build(),
        rule("repo-boundary").kind(Kind::Boundary).build(),
        rule("repo-law").kind(Kind::Law).build(),
        rule("repo-procedure").build(),
    ];
    assert_eq!(
        composed_ids(&rules),
        [
            "repo-law",
            "repo-boundary",
            "repo-procedure",
            "domain-procedure",
            "repo-preference",
            "host-syntax"
        ]
    );
}

#[test]
fn orders_broad_scope_before_narrow_whatever_the_specificity() {
    let rules = vec![
        rule("repo-procedure").build(),
        rule("component-session-procedure")
            .component("packaging-distribution")
            .scope(Scope::Session)
            .spec(0)
            .build(),
    ];
    assert_eq!(
        composed_ids(&rules),
        ["repo-procedure", "component-session-procedure"]
    );
}

#[test]
fn one_set_holds_platform_component_and_domain_rules_in_one_order() {
    let rules = vec![
        rule("domain-procedure").domain("coding").build(),
        rule("component-procedure")
            .component("packaging-distribution")
            .build(),
        rule("repo-law").kind(Kind::Law).build(),
    ];
    assert_eq!(
        composed_ids(&rules),
        ["repo-law", "component-procedure", "domain-procedure"]
    );
}

#[test]
fn ties_break_by_authority_then_source_then_id() {
    let rules = vec![
        rule("b-rule")
            .source("core/instructions/z/b-rule.md")
            .build(),
        rule("a-rule")
            .source("core/instructions/z/a-rule.md")
            .build(),
        rule("c-rule")
            .source("core/instructions/a/c-rule.md")
            .build(),
    ];
    assert_eq!(composed_ids(&rules), ["c-rule", "a-rule", "b-rule"]);
}

#[test]
fn a_narrower_procedure_refines_a_law_and_the_law_stays_in_force() {
    let rules = vec![
        rule("platform-law")
            .kind(Kind::Law)
            .body("Never bypass platform law.")
            .build(),
        rule("domain-procedure")
            .domain("coding")
            .mode(Mode::Refine)
            .refines(&["platform-law"])
            .build(),
    ];
    let ordered = compose(&rules, &in_force(&rules)).unwrap();
    assert_eq!(
        ordered
            .iter()
            .map(|r| r.unit.id.as_str())
            .collect::<Vec<_>>(),
        ["platform-law", "domain-procedure"]
    );
    assert_eq!(ordered[0].body, "Never bypass platform law.");
}

#[test]
fn a_rule_in_force_from_two_files_is_refused() {
    let rules = vec![
        rule("same-id").source("core/instructions/a.md").build(),
        rule("same-id").source("core/instructions/b.md").build(),
    ];
    let conflicts = conflicts_of(&rules);
    assert!(has(&conflicts, ConflictCode::DuplicateActiveId));
    assert_eq!(conflicts[0].to_refusal().code, RefusalCode::IdDuplicate);
}

#[test]
fn a_replaced_rule_stays_in_force_and_its_successor_may_follow_it() {
    let rules = vec![
        rule("old-procedure").replaced_by("new-procedure").build(),
        rule("new-procedure").build(),
    ];
    assert_eq!(composed_ids(&rules), ["new-procedure", "old-procedure"]);
}

#[test]
fn a_replaced_rule_whose_window_ended_is_left_out_of_the_set() {
    let rules = vec![
        rule("old-procedure").replaced_by("new-procedure").build(),
        rule("new-procedure").build(),
    ];
    let mut in_force = in_force(&rules);
    in_force.remove("old-procedure");
    let ordered = compose(&rules, &in_force).unwrap();
    assert_eq!(ordered.len(), 1);
    assert_eq!(ordered[0].unit.id, "new-procedure");
}

#[test]
fn a_law_is_replaced_only_by_a_platform_authority_law() {
    for successor in [
        rule("successor").build(),
        rule("successor").kind(Kind::Law).domain("coding").build(),
    ] {
        let rules = vec![
            rule("old-law")
                .kind(Kind::Law)
                .replaced_by("successor")
                .build(),
            successor,
        ];
        let conflicts = conflicts_of(&rules);
        assert!(has_message(
            &conflicts,
            ConflictCode::IllegalLawOverride,
            "platform-authority law"
        ));
        assert_eq!(conflicts[0].to_refusal().code, RefusalCode::LawOverridden);
    }
    let rules = vec![
        rule("old-law")
            .kind(Kind::Law)
            .replaced_by("new-law")
            .build(),
        rule("new-law").kind(Kind::Law).build(),
    ];
    assert_eq!(composed_ids(&rules), ["new-law", "old-law"]);
}

#[test]
fn a_non_law_is_replaced_by_its_owner_or_by_platform_authority_only() {
    let by_other_owner = vec![
        rule("old-procedure")
            .component("packaging-distribution")
            .replaced_by("successor")
            .build(),
        rule("successor").domain("coding").build(),
    ];
    assert!(has_message(
        &conflicts_of(&by_other_owner),
        ConflictCode::IllegalOverride,
        "cannot replace"
    ));
    let by_platform = vec![
        rule("old-procedure")
            .component("packaging-distribution")
            .replaced_by("successor")
            .build(),
        rule("successor").build(),
    ];
    composed_ids(&by_platform);
    let by_owner = vec![
        rule("old-procedure")
            .domain("coding")
            .replaced_by("successor")
            .build(),
        rule("successor").domain("coding").build(),
    ];
    composed_ids(&by_owner);
}

#[test]
fn two_rules_that_replace_each_other_are_refused() {
    let rules = vec![
        rule("rule-a").replaced_by("rule-b").build(),
        rule("rule-b").replaced_by("rule-a").build(),
    ];
    assert!(has_message(
        &conflicts_of(&rules),
        ConflictCode::IncompatibleOrdering,
        "replace each other"
    ));
}

#[test]
fn an_override_at_equal_scope_has_no_ordered_winner() {
    let rules = vec![
        rule("base-pref").kind(Kind::Preference).build(),
        rule("same-scope-override")
            .kind(Kind::Preference)
            .mode(Mode::Override)
            .refines(&["base-pref"])
            .build(),
    ];
    assert!(has(
        &conflicts_of(&rules),
        ConflictCode::IncompatibleOrdering
    ));
}

#[test]
fn a_component_may_not_claim_the_repo_scope() {
    let mut illegal = rule("component-repo-override")
        .component("packaging-distribution")
        .kind(Kind::Preference)
        .mode(Mode::Override)
        .refines(&["platform-pref"])
        .build();
    illegal.unit.scope = Scope::Repo;
    let rules = vec![
        rule("platform-pref").kind(Kind::Preference).build(),
        illegal,
    ];
    let conflicts = conflicts_of(&rules);
    assert!(has_message(
        &conflicts,
        ConflictCode::IllegalOverride,
        "cannot claim scope \"repo\""
    ));
}

#[test]
fn a_narrower_scope_overrides_a_preference_and_retires_it() {
    let rules = vec![
        rule("base-pref").kind(Kind::Preference).build(),
        rule("domain-override")
            .domain("coding")
            .kind(Kind::Preference)
            .mode(Mode::Override)
            .refines(&["base-pref"])
            .build(),
    ];
    assert_eq!(composed_ids(&rules), ["domain-override"]);
}

#[test]
fn a_narrower_scope_forbids_a_preference_and_retires_it() {
    let rules = vec![
        rule("base-pref").kind(Kind::Preference).build(),
        rule("domain-forbid")
            .domain("coding")
            .kind(Kind::Preference)
            .mode(Mode::Forbid)
            .refines(&["base-pref"])
            .build(),
    ];
    assert_eq!(composed_ids(&rules), ["domain-forbid"]);
}

#[test]
fn an_override_or_forbid_that_names_no_target_is_refused() {
    let rules = vec![rule("lonely")
        .domain("coding")
        .kind(Kind::Preference)
        .mode(Mode::Forbid)
        .build()];
    assert!(has_message(
        &conflicts_of(&rules),
        ConflictCode::MissingDependency,
        "names no target"
    ));
}

#[test]
fn only_preferences_permit_override() {
    let rules = vec![
        rule("base-procedure").build(),
        rule("domain-override")
            .domain("coding")
            .mode(Mode::Override)
            .refines(&["base-procedure"])
            .build(),
    ];
    assert!(has_message(
        &conflicts_of(&rules),
        ConflictCode::IllegalOverride,
        "only preferences permit override"
    ));
}

#[test]
fn a_host_adapter_cannot_change_the_meaning_of_a_rule() {
    let rules = vec![
        rule("base-pref").kind(Kind::Preference).build(),
        rule("adapter")
            .kind(Kind::HostAdapter)
            .scope(Scope::Host)
            .mode(Mode::Override)
            .refines(&["base-pref"])
            .build(),
    ];
    assert!(has_message(
        &conflicts_of(&rules),
        ConflictCode::IllegalOverride,
        "host adapter"
    ));
}

#[test]
fn a_narrower_rule_may_not_override_a_law() {
    let rules = vec![
        rule("locked-law").kind(Kind::Law).build(),
        rule("domain-override")
            .domain("coding")
            .mode(Mode::Override)
            .refines(&["locked-law"])
            .build(),
    ];
    let conflicts = conflicts_of(&rules);
    assert!(has(&conflicts, ConflictCode::IllegalLawOverride));
    assert_eq!(conflicts[0].to_refusal().code, RefusalCode::LawOverridden);
}

#[test]
fn a_rule_may_not_override_a_boundary_and_a_boundary_is_refined_by_its_owner_only() {
    let rules = vec![
        rule("a-boundary")
            .kind(Kind::Boundary)
            .component("packaging-distribution")
            .build(),
        rule("b-override")
            .domain("coding")
            .kind(Kind::Preference)
            .mode(Mode::Override)
            .refines(&["a-boundary"])
            .build(),
    ];
    assert!(has_message(
        &conflicts_of(&rules),
        ConflictCode::IncompatibleBoundaryAuthority,
        "boundary"
    ));
    let rules = vec![
        rule("a-boundary")
            .kind(Kind::Boundary)
            .component("packaging-distribution")
            .build(),
        rule("b-refine")
            .domain("coding")
            .mode(Mode::Refine)
            .refines(&["a-boundary"])
            .build(),
    ];
    assert!(has_message(
        &conflicts_of(&rules),
        ConflictCode::IncompatibleBoundaryAuthority,
        "refine boundary"
    ));
}

#[test]
fn mutually_exclusive_rules_and_conflicting_boundaries_are_refused() {
    let rules = vec![
        rule("boundary-a")
            .kind(Kind::Boundary)
            .conflicts(&["boundary-b"])
            .build(),
        rule("boundary-b")
            .kind(Kind::Boundary)
            .conflicts(&["boundary-a"])
            .build(),
        rule("mode-a").conflicts(&["mode-b"]).build(),
        rule("mode-b").conflicts(&["mode-a"]).build(),
    ];
    let conflicts = conflicts_of(&rules);
    assert!(has(&conflicts, ConflictCode::IncompatibleBoundaryAuthority));
    assert!(has(&conflicts, ConflictCode::MutuallyExclusive));
    assert!(conflicts
        .iter()
        .all(|c| c.to_refusal().code == RefusalCode::ConflictInForce));
}

#[test]
fn rules_joined_by_conflicts_with_do_not_conflict_when_their_when_cannot_both_hold() {
    let rules = vec![
        rule("for-producer")
            .when("role", &["producer"])
            .conflicts(&["for-reviewer"])
            .build(),
        rule("for-reviewer").when("role", &["reviewer"]).build(),
    ];
    assert_eq!(composed_ids(&rules).len(), 2);
    let overlapping = vec![
        rule("for-producer")
            .when("role", &["producer"])
            .conflicts(&["also-producer"])
            .build(),
        rule("also-producer")
            .when("role", &["producer", "reviewer"])
            .build(),
    ];
    assert!(has(
        &conflicts_of(&overlapping),
        ConflictCode::MutuallyExclusive
    ));
}

#[test]
fn a_conflicts_with_target_that_does_not_exist_is_refused() {
    let rules = vec![rule("lonely").conflicts(&["no-such-rule"]).build()];
    assert!(has_message(
        &conflicts_of(&rules),
        ConflictCode::MissingDependency,
        "unknown rule"
    ));
}

#[test]
fn a_dependency_missing_or_not_in_force_is_refused() {
    let rules = vec![
        rule("depends-missing").depends(&["missing-rule"]).build(),
        rule("depends-draft").depends(&["draft-rule"]).build(),
        rule("draft-rule").lifecycle(Lifecycle::Draft).build(),
    ];
    let conflicts = conflicts_of(&rules);
    assert!(has_message(
        &conflicts,
        ConflictCode::MissingDependency,
        "unknown rule \"missing-rule\""
    ));
    assert!(has_message(
        &conflicts,
        ConflictCode::MissingDependency,
        "\"draft-rule\", which is not in force"
    ));
    assert_eq!(
        conflicts[0].to_refusal().code,
        RefusalCode::DependencyNotInForce
    );
}

#[test]
fn an_ordering_the_base_order_cannot_honour_is_refused_and_never_reordered() {
    let rules = vec![
        rule("host-adapter-first")
            .kind(Kind::HostAdapter)
            .scope(Scope::Host)
            .build(),
        rule("late-procedure")
            .depends(&["host-adapter-first"])
            .build(),
    ];
    assert!(has(
        &conflicts_of(&rules),
        ConflictCode::IncompatibleOrdering
    ));
}

#[test]
fn a_dependency_cycle_is_refused() {
    let rules = vec![
        rule("rule-a").depends(&["rule-b"]).build(),
        rule("rule-b").depends(&["rule-a"]).build(),
    ];
    assert!(has(
        &conflicts_of(&rules),
        ConflictCode::IncompatibleOrdering
    ));
}

#[test]
fn depends_on_puts_the_dependency_first_inside_the_base_order() {
    let rules = vec![
        rule("a-first").depends(&["z-last"]).build(),
        rule("z-last").build(),
    ];
    assert_eq!(composed_ids(&rules), ["z-last", "a-first"]);
}

#[test]
fn conflicts_come_back_sorted_and_without_repeats() {
    let rules = vec![
        rule("zzz").depends(&["missing-one"]).build(),
        rule("aaa").depends(&["missing-two"]).build(),
    ];
    let conflicts = conflicts_of(&rules);
    assert_eq!(conflicts.len(), 2);
    assert_eq!(conflicts[0].ids, ["aaa"]);
}
