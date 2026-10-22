//! Owning proof of edits, comments on a document, the re-parse check and `comment-would-be-lost`,
//! over `fixtures/edit.v1.json`. Every case runs under each profile it lists; after a refusal the
//! document must still be the bytes it was before the refused operation.
mod common;

use common::*;
use fgos_yaml_doc::path::parse_path;
use fgos_yaml_doc::{parse, CommentLoss, Document, Position, Value};
use serde_json::Value as Json;

fn text_of(bytes: &[u8]) -> String {
    String::from_utf8_lossy(bytes).into_owned()
}

/// Applies one operation; `Ok(Some(comments))` for a read.
fn apply(doc: &mut Document, op: &Json) -> Result<Option<Json>, fgos_yaml_doc::Refusal> {
    let name = op["op"].as_str().expect("op");
    let path = parse_path(op["path"].as_str().expect("op path")).expect("op path parses");
    let value = || Value::from_json(&op["value"]);
    match name {
        "set" => doc.set(&path, value()).map(|()| None),
        "insert" => {
            let key = op["key"].as_str().expect("insert key");
            let position = match op["after"].as_str() {
                Some(after) => Position::After(after),
                None => Position::End,
            };
            doc.insert(&path, key, value(), position).map(|()| None)
        }
        "remove" => {
            let ack = if op["acknowledge"].as_bool().unwrap_or(false) {
                CommentLoss::Acknowledge
            } else {
                CommentLoss::Refuse
            };
            doc.remove(&path, ack).map(|()| None)
        }
        "setCommentBlock" => {
            let lines: Vec<String> = op["lines"]
                .as_array()
                .expect("lines")
                .iter()
                .map(|l| l.as_str().expect("line").to_string())
                .collect();
            doc.set_comment_block(&path, &lines).map(|()| None)
        }
        "setInlineComment" => doc
            .set_inline_comment(&path, op["text"].as_str().expect("text"))
            .map(|()| None),
        "commentsAt" => doc.comments_at(&path).map(|c| {
            Some(serde_json::json!({
                "block": c.above,
                "inline": c.inline,
            }))
        }),
        other => panic!("unknown op {other}"),
    }
}

#[test]
fn edits_match_the_golden_cases() {
    let mut failures = Vec::new();
    for case in fixture_cases("edit") {
        let name = id(&case).to_string();
        let input = resolve_input(&case["input"]);
        let expect = &case["expect"];
        for profile in profiles_of(&case) {
            let label = format!("{name} [{}]", profile.name());
            let mut doc = match parse(&input, profile, "edit.yaml") {
                Ok(doc) => doc,
                Err(refusal) => {
                    failures.push(format!("{label}: input refused: {refusal}"));
                    continue;
                }
            };
            let mut read = None;
            let mut refused = None;
            for op in case["ops"].as_array().expect("ops") {
                let before = doc.to_bytes();
                match apply(&mut doc, op) {
                    Ok(result) => read = result.or(read),
                    Err(refusal) => {
                        if doc.to_bytes() != before {
                            failures.push(format!("{label}: a refusal changed the document"));
                        }
                        refused = Some(refusal);
                        break;
                    }
                }
            }
            let outcome = check(&label, &doc, &input, expect, read, refused);
            if let Err(message) = outcome {
                failures.push(message);
            }
        }
    }
    assert!(
        failures.is_empty(),
        "{} failing:\n{}",
        failures.len(),
        failures.join("\n")
    );
}

fn check(
    label: &str,
    doc: &Document,
    input: &[u8],
    expect: &Json,
    read: Option<Json>,
    refused: Option<fgos_yaml_doc::Refusal>,
) -> Result<(), String> {
    if expect["refusal"].is_object() {
        let Some(refusal) = refused else {
            return Err(format!("{label}: expected a refusal, got none"));
        };
        let want = expect["refusal"]["rule"].as_str().unwrap_or("");
        return if refusal.rule == want {
            // The refusal must also leave a document that still means what it meant.
            match parse(&doc.to_bytes(), doc.profile(), "edit.yaml") {
                Ok(_) => Ok(()),
                Err(e) => Err(format!("{label}: document left unparsable: {e}")),
            }
        } else {
            Err(format!(
                "{label}: rule {} (want {want}): {refusal}",
                refusal.rule
            ))
        };
    }
    if let Some(refusal) = refused {
        return Err(format!("{label}: unexpected refusal: {refusal}"));
    }
    if expect["unchanged"] == true {
        return if doc.to_bytes() == input {
            Ok(())
        } else {
            Err(format!(
                "{label}: bytes changed:\n{}",
                text_of(&doc.to_bytes())
            ))
        };
    }
    if let Some(want) = expect["output"].as_str() {
        let got = text_of(&doc.to_bytes());
        return if got == want {
            Ok(())
        } else {
            Err(format!(
                "{label}: output\n--- got\n{got:?}\n--- want\n{want:?}"
            ))
        };
    }
    if expect["comments"].is_object() {
        return if read.as_ref() == Some(&expect["comments"]) {
            Ok(())
        } else {
            Err(format!(
                "{label}: comments {read:?}, want {}",
                expect["comments"]
            ))
        };
    }
    Err(format!("{label}: no known expectation"))
}
