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
        (key == "agentCli").then(|| self.0.iter().map(|s| s.to_string()).collect())
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
fn the_keys_of_the_first_registry_are_refused_as_unknown() {
    for key in ["kind", "cli"] {
        let when = rule("x-rule").when(key, &["head"]).build().unit.when;
        assert_eq!(
            check_when("x-rule", &when, &NoLiveValues).unwrap_err().code,
            RefusalCode::WhenKeyUnknown,
            "{key}"
        );
    }
}

#[test]
fn a_static_key_accepts_only_its_listed_values_and_an_empty_list_is_refused() {
    let ok = rule("x-rule")
        .when("sessionType", &["head", "hand-opened"])
        .build()
        .unit
        .when;
    assert!(check_when("x-rule", &ok, &NoLiveValues).is_ok());
    let bad = rule("x-rule")
        .when("sessionType", &["head", "spaceship"])
        .build()
        .unit
        .when;
    assert_eq!(
        check_when("x-rule", &bad, &NoLiveValues).unwrap_err().code,
        RefusalCode::WhenValueInvalid
    );
    let setup = rule("x-rule")
        .when("agentLifecycle", &["setup"])
        .build()
        .unit
        .when;
    assert_eq!(
        check_when("x-rule", &setup, &NoLiveValues)
            .unwrap_err()
            .code,
        RefusalCode::WhenValueInvalid
    );
    let empty = rule("x-rule").when("sessionType", &[]).build().unit.when;
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
        .when("agentCli", &["claude", "mystery"])
        .build()
        .unit
        .when;
    assert!(check_when("x-rule", &when, &NoLiveValues).is_ok());
    let r = check_when("x-rule", &when, &Live(vec!["claude", "codex"])).unwrap_err();
    assert_eq!(r.code, RefusalCode::WhenValueInvalid);
    assert!(r.message.contains("mystery"));
    let ok = rule("x-rule")
        .when("agentCli", &["claude"])
        .build()
        .unit
        .when;
    assert!(check_when("x-rule", &ok, &Live(vec!["claude", "codex"])).is_ok());
}

#[test]
fn several_when_keys_are_all_checked() {
    let when = rule("x-rule")
        .when("role", &["producer"])
        .when("sessionType", &["head"])
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

// --- the nearest-rule check, over a stub of the search port

mod nearest {
    use std::cell::RefCell;

    use super::*;
    use fgos_agent_context_engine::check::{
        check_nearest, NearestHit, NearestOutcome, NearestRules, SearchUnavailable,
    };
    use fgos_agent_context_engine::rule::RuleFile;

    /// The threshold of the pack profile (`audit.implicit.min`).
    const MIN: f32 = 0.93;

    // Pair 6b of the model probe: scored 0.948 by the real embedding model.
    const OLD_TEXT: &str = "Units and plans must never pin infrastructure (`executor`, `provider`, `model`, `tier` ...)";
    const NEW_TEXT: &str = "Units, patterns, plans, and driver prompts never pin executors, providers, models, tiers ...";

    struct Stub {
        answer: Result<Vec<NearestHit>, SearchUnavailable>,
        asked: RefCell<Vec<String>>,
    }

    impl NearestRules for Stub {
        fn nearest(&self, unit: &RuleFile) -> Result<Vec<NearestHit>, SearchUnavailable> {
            self.asked.borrow_mut().push(unit.unit.id.clone());
            self.answer.clone()
        }
    }

    fn stub(hits: &[(&str, f32)]) -> Stub {
        Stub {
            answer: Ok(hits
                .iter()
                .map(|(id, score)| NearestHit {
                    id: (*id).into(),
                    score: *score,
                })
                .collect()),
            asked: RefCell::default(),
        }
    }

    fn run(rules: &[RuleFile], changed: &[&str], port: &Stub) -> NearestOutcome {
        let changed: Vec<&RuleFile> = rules
            .iter()
            .filter(|r| changed.contains(&r.unit.id.as_str()))
            .collect();
        check_nearest(&changed, rules, &in_force(rules), MIN, port)
    }

    #[test]
    fn a_paraphrase_of_an_in_force_rule_at_the_threshold_is_refused_naming_both_rules_the_score_and_the_fix(
    ) {
        let rules = vec![
            rule("old-rule").body(OLD_TEXT).build(),
            rule("new-rule").body(NEW_TEXT).build(),
        ];
        let port = stub(&[("old-rule", 0.948)]);
        let out = run(&rules, &["new-rule"], &port);
        assert_eq!(out.refusals.len(), 1, "{out:?}");
        let r = &out.refusals[0];
        assert_eq!(r.code, RefusalCode::NearDuplicate);
        assert_eq!(r.ids, ["new-rule", "old-rule"]);
        assert_eq!(r.source.as_deref(), Some("core/instructions/new-rule.md"));
        for needle in [
            "0.948",
            "0.93",
            "superseded_by",
            "related",
            "checked, distinct",
        ] {
            assert!(r.message.contains(needle), "{needle}: {}", r.message);
        }
        assert_eq!(*port.asked.borrow(), ["new-rule"]);
    }

    #[test]
    fn a_distinct_rule_passes_and_a_hit_just_under_the_threshold_never_refuses() {
        let rules = vec![rule("old-rule").build(), rule("new-rule").build()];
        let out = run(&rules, &["new-rule"], &stub(&[("old-rule", 0.80)]));
        assert_eq!(out, NearestOutcome::default());
        let out = run(&rules, &["new-rule"], &stub(&[("old-rule", 0.929)]));
        assert_eq!(out.refusals, []);
    }

    #[test]
    fn a_hit_between_the_advisory_floor_and_the_threshold_is_printed_and_never_refuses() {
        let rules = vec![rule("old-rule").build(), rule("new-rule").build()];
        let out = run(&rules, &["new-rule"], &stub(&[("old-rule", 0.88)]));
        assert_eq!(out.refusals, []);
        assert_eq!(out.advisories.len(), 1);
        let a = &out.advisories[0];
        assert_eq!(
            (a.id.as_str(), a.nearest.as_str()),
            ("new-rule", "old-rule")
        );
        assert_eq!(a.score, 0.88);
        assert_eq!(a.source, "core/instructions/new-rule.md");
    }

    #[test]
    fn only_the_top_three_hits_by_rank_are_candidates_and_a_hit_under_the_floor_is_none() {
        let rules: Vec<RuleFile> = ["u", "a", "b", "c", "d", "e"]
            .iter()
            .map(|id| rule(id).build())
            .collect();
        let hits = [
            ("a", 0.90),
            ("b", 0.89),
            ("c", 0.88),
            ("d", 0.87),
            ("e", 0.50),
        ];
        let out = run(&rules, &["u"], &stub(&hits));
        let named: Vec<&str> = out.advisories.iter().map(|a| a.nearest.as_str()).collect();
        assert_eq!(named, ["a", "b", "c"]);
        let out = run(&rules, &["u"], &stub(&[("a", 0.83)]));
        assert_eq!(out.advisories, []);
    }

    #[test]
    fn a_declared_relation_in_either_direction_lets_the_unit_through() {
        for new in [
            rule("new-rule").related(&["old-rule"]).build(),
            rule("new-rule").refines(&["old-rule"]).build(),
            rule("new-rule").depends(&["old-rule"]).build(),
            rule("new-rule").conflicts(&["old-rule"]).build(),
        ] {
            let rules = vec![rule("old-rule").build(), new];
            let out = run(&rules, &["new-rule"], &stub(&[("old-rule", 0.99)]));
            assert_eq!(out, NearestOutcome::default(), "{:?}", rules[1].unit);
        }
        // `superseded_by` on the old rule names the new one; `related` on the old rule is read the same way.
        let rules = vec![
            rule("old-rule").replaced_by("new-rule").build(),
            rule("new-rule").build(),
        ];
        assert_eq!(
            run(&rules, &["new-rule"], &stub(&[("old-rule", 0.99)])),
            NearestOutcome::default()
        );
        let rules = vec![
            rule("old-rule").related(&["new-rule"]).build(),
            rule("new-rule").build(),
        ];
        assert_eq!(
            run(&rules, &["new-rule"], &stub(&[("old-rule", 0.99)])),
            NearestOutcome::default()
        );
    }

    #[test]
    fn the_unit_itself_and_rules_not_in_force_are_never_the_nearest_rule() {
        let rules = vec![
            rule("draft-rule").lifecycle(Lifecycle::Draft).build(),
            rule("new-rule").build(),
            rule("other-rule").build(),
        ];
        let hits = [("new-rule", 1.0), ("draft-rule", 0.99)];
        assert_eq!(
            run(&rules, &["new-rule"], &stub(&hits)),
            NearestOutcome::default()
        );
    }

    #[test]
    fn a_unit_not_in_force_is_not_searched_and_nor_is_a_lone_rule() {
        let rules = vec![
            rule("draft-rule").lifecycle(Lifecycle::Draft).build(),
            rule("old-rule").build(),
        ];
        let port = stub(&[("old-rule", 0.99)]);
        assert_eq!(
            run(&rules, &["draft-rule"], &port),
            NearestOutcome::default()
        );
        let lone = vec![rule("only-rule").build()];
        assert_eq!(run(&lone, &["only-rule"], &port), NearestOutcome::default());
        assert!(port.asked.borrow().is_empty());
    }

    #[test]
    fn a_search_that_cannot_run_is_one_refusal_naming_the_model_fetch_fix() {
        let rules = vec![
            rule("old-rule").build(),
            rule("new-rule").build(),
            rule("newer-rule").build(),
        ];
        let port = Stub {
            answer: Err(SearchUnavailable("the model is missing".into())),
            asked: RefCell::default(),
        };
        let out = run(&rules, &["new-rule", "newer-rule"], &port);
        assert_eq!(out.refusals.len(), 1, "{out:?}");
        assert_eq!(out.refusals[0].code, RefusalCode::SearchUnavailable);
        assert!(out.refusals[0].message.contains("doc-locate-model-fetch"));
        assert!(out.refusals[0].message.contains("the model is missing"));
        assert_eq!(out.advisories, []);
    }
}
