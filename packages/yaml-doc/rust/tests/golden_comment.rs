//! Owning proof of the comment injection guard, over `fixtures/comment.v1.json`.
mod common;

use common::*;
use fgos_yaml_doc::comment::sanitize;

#[test]
fn comment_guard_matches_the_golden_cases() {
    for case in fixture_cases("comment") {
        let name = id(&case);
        let text = case["input"]["text"].as_str().expect("input.text");
        let expect = &case["expect"];
        match case["kind"].as_str().expect("kind") {
            "block" => match sanitize(text) {
                Ok(lines) => {
                    let want: Vec<&str> = expect["lines"]
                        .as_array()
                        .expect(name)
                        .iter()
                        .map(|l| l.as_str().expect(name))
                        .collect();
                    assert_eq!(lines, want, "{name}");
                }
                Err(refusal) => assert_refusal(name, &refusal, expect),
            },
            other => panic!("{name}: unknown kind {other}"),
        }
    }
}
