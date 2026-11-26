//! The write-time check over a corpus, the `when:` key check, and the compile that follows a clean check.

mod common;

use std::collections::BTreeSet;

use common::*;
use fgos_agent_context_engine::check::{check, compile, OwnerList};
use fgos_agent_context_engine::refusal::RefusalCode;
use fgos_agent_context_engine::rule::{Kind, Lifecycle};
use fgos_agent_context_engine::when_keys::{check_when, NoLiveValues, ValueSource};

fn owners() -> OwnerList {
    OwnerList(
        ["coding", "packaging-distribution"]
            .iter()
            .map(|s| s.to_string())
            .collect(),
    )
}

fn codes(rules: &[fgos_agent_context_engine::rule::RuleFile]) -> Vec<RefusalCode> {
    check(rules, &in_force(rules), &owners(), &NoLiveValues)
        .iter()
        .map(|r| r.code)
        .collect()
}

struct Live(Vec<&'static str>);

impl ValueSource for Live {
    fn values(&self, key: &str) -> Option<Vec<String>> {
        (key == "cli").then(|| self.0.iter().map(|s| s.to_string()).collect())
    }
}

#[test]
fn a_clean_corpus_has_no_refusal_and_compiles_to_a_set_in_composition_order() {
    let rules = vec![
        rule("a-procedure").when("role", &["producer"]).build(),
        rule("a-law").kind(Kind::Law).build(),
        rule("domain-rule").domain("coding").build(),
    ];
    assert_eq!(codes(&rules), []);
    let set = compile(&rules, &in_force(&rules), &owners(), &NoLiveValues).unwrap();
    let ids: Vec<&str> = set.rules.iter().map(|r| r.id.as_str()).collect();
    assert_eq!(ids, ["a-law", "a-procedure", "domain-rule"]);
    assert_eq!(set.rules[1].when["role"], ["producer"]);
    assert_eq!(set.rules[1].sources, ["core/instructions/a-procedure.md"]);
    assert_eq!(set.rules[1].title.as_deref(), Some("a-procedure"));
}

#[test]
fn a_rule_not_in_force_is_checked_but_left_out_of_the_set() {
    let rules = vec![
        rule("kept-rule").build(),
        rule("draft-rule").lifecycle(Lifecycle::Draft).build(),
    ];
    let set = compile(&rules, &in_force(&rules), &owners(), &NoLiveValues).unwrap();
    assert_eq!(set.rules.len(), 1);
    let rules = vec![rule("draft-rule")
        .lifecycle(Lifecycle::Draft)
        .when("colour", &["red"])
        .build()];
    assert_eq!(codes(&rules), [RefusalCode::WhenKeyUnknown]);
}

#[test]
fn a_refused_corpus_compiles_to_every_refusal_and_no_set() {
    let rules = vec![
        rule("bad-key").when("colour", &["red"]).build(),
        rule("bad-dep").depends(&["missing-rule"]).build(),
    ];
    let refusals = compile(&rules, &in_force(&rules), &owners(), &NoLiveValues).unwrap_err();
    let codes: BTreeSet<RefusalCode> = refusals.iter().map(|r| r.code).collect();
    assert_eq!(
        codes,
        [
            RefusalCode::WhenKeyUnknown,
            RefusalCode::DependencyNotInForce
        ]
        .into()
    );
}

#[test]
fn an_owner_that_is_neither_core_nor_a_known_component_or_domain_is_refused() {
    let rules = vec![rule("ghost-rule").component("no-such-component").build()];
    assert_eq!(codes(&rules), [RefusalCode::OwnerUnknown]);
    let rules = vec![
        rule("core-rule").build(),
        rule("coding-rule").domain("coding").build(),
    ];
    assert_eq!(codes(&rules), []);
}

#[test]
fn an_id_used_by_two_files_is_refused_even_when_neither_is_in_force() {
    let rules = vec![
        rule("same-id").lifecycle(Lifecycle::Draft).build(),
        rule("same-id")
            .domain("coding")
            .lifecycle(Lifecycle::Draft)
            .build(),
    ];
    let refusals = check(&rules, &in_force(&rules), &owners(), &NoLiveValues);
    assert_eq!(refusals.len(), 1);
    assert_eq!(refusals[0].code, RefusalCode::IdDuplicate);
    assert!(refusals[0]
        .message
        .contains("domains/coding/instructions/same-id.md"));
}

#[test]
fn a_replacement_that_does_not_exist_is_refused() {
    let rules = vec![rule("old-rule").replaced_by("no-such-rule").build()];
    assert_eq!(codes(&rules), [RefusalCode::ReplacementIncomplete]);
    let rules = vec![
        rule("old-rule").replaced_by("new-rule").build(),
        rule("new-rule").build(),
    ];
    assert_eq!(codes(&rules), []);
}

#[test]
fn a_composition_conflict_is_raised_as_its_refusal() {
    let rules = vec![
        rule("a-rule").conflicts(&["b-rule"]).build(),
        rule("b-rule").build(),
    ];
    assert_eq!(codes(&rules), [RefusalCode::ConflictInForce]);
}

#[test]
fn refusals_come_back_sorted_and_name_the_rule_and_its_file() {
    let rules = vec![
        rule("zz-rule").when("colour", &["red"]).build(),
        rule("aa-rule").when("shape", &["round"]).build(),
    ];
    let refusals = check(&rules, &in_force(&rules), &owners(), &NoLiveValues);
    assert_eq!(refusals.len(), 2);
    assert_eq!(refusals[0].ids, ["aa-rule"]);
    assert_eq!(
        refusals[0].source.as_deref(),
        Some("core/instructions/aa-rule.md")
    );
}

#[test]
fn a_when_key_must_be_in_the_registry() {
    let when = rule("x-rule").when("colour", &["red"]).build().unit.when;
    let r = check_when("x-rule", &when, &NoLiveValues).unwrap_err();
    assert_eq!(r.code, RefusalCode::WhenKeyUnknown);
    assert_eq!(r.ids, ["x-rule"]);
}

#[test]
fn a_static_key_accepts_only_its_listed_values_and_an_empty_list_is_refused() {
    let ok = rule("x-rule")
        .when("kind", &["head", "hook"])
        .build()
        .unit
        .when;
    assert!(check_when("x-rule", &ok, &NoLiveValues).is_ok());
    let bad = rule("x-rule")
        .when("kind", &["head", "spaceship"])
        .build()
        .unit
        .when;
    assert_eq!(
        check_when("x-rule", &bad, &NoLiveValues).unwrap_err().code,
        RefusalCode::WhenValueInvalid
    );
    let empty = rule("x-rule").when("kind", &[]).build().unit.when;
    assert_eq!(
        check_when("x-rule", &empty, &NoLiveValues)
            .unwrap_err()
            .code,
        RefusalCode::WhenValueInvalid
    );
}

#[test]
fn a_live_key_is_checked_against_the_callers_values_and_unchecked_without_them() {
    let when = rule("x-rule")
        .when("cli", &["claude", "mystery"])
        .build()
        .unit
        .when;
    assert!(check_when("x-rule", &when, &NoLiveValues).is_ok());
    let r = check_when("x-rule", &when, &Live(vec!["claude", "codex"])).unwrap_err();
    assert_eq!(r.code, RefusalCode::WhenValueInvalid);
    assert!(r.message.contains("mystery"));
    let ok = rule("x-rule").when("cli", &["claude"]).build().unit.when;
    assert!(check_when("x-rule", &ok, &Live(vec!["claude", "codex"])).is_ok());
}

#[test]
fn several_when_keys_are_all_checked() {
    let when = rule("x-rule")
        .when("role", &["producer"])
        .when("kind", &["head"])
        .when("zzz", &["a"])
        .build()
        .unit
        .when;
    assert_eq!(
        check_when("x-rule", &when, &NoLiveValues).unwrap_err().code,
        RefusalCode::WhenKeyUnknown
    );
}

#[test]
fn nearest_rule_hits_keep_only_the_rules_in_force() {
    use fgos_agent_context_engine::check::{keep_in_force, NearestHit};
    let rules = vec![
        rule("live-rule").build(),
        rule("draft-rule").lifecycle(Lifecycle::Draft).build(),
    ];
    let hit = |id: &str, score| NearestHit {
        id: id.into(),
        score,
    };
    let hits = vec![
        hit("draft-rule", 0.99),
        hit("live-rule", 0.95),
        hit("gone-rule", 0.9),
    ];
    assert_eq!(
        keep_in_force(hits, &in_force(&rules)),
        [hit("live-rule", 0.95)]
    );
}
