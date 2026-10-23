//! Owning proof of the comment grammar: reasons, actor, doc and why lines, header, blocks and
//! parsing, over `contracts/fixtures/grammar.v1.json`. Every produced line also passes YAML
//! Document's own comment guard unchanged, so the two layers agree.
use std::path::Path;

use fgos_config::grammar::{
    block_for_changed_key, block_for_new_key, doc_lines, header_lines, parse_block, why_line,
    Actor, Reason,
};
use fgos_identity::{Source, WriterId, WriterIdentity};
use fgos_yaml_doc::comment::sanitize;
use fgos_yaml_doc::Comments;
use serde_json::{json, Value};

fn writer(spec: &Value) -> WriterIdentity {
    let (id, source) = match (spec["session"].as_str(), spec["pid"].as_u64()) {
        (Some(s), _) => (WriterId::Session(s.to_string()), Source::Env),
        (_, Some(p)) => (WriterId::Pid(p as u32), Source::Pid),
        _ => panic!("writer needs session or pid"),
    };
    WriterIdentity {
        id,
        source,
        env_var: None,
    }
}

fn comments(lines: &Value) -> Comments {
    Comments {
        above: lines
            .as_array()
            .unwrap()
            .iter()
            .map(|l| l.as_str().unwrap().to_string())
            .collect(),
        inline: None,
    }
}

fn reason(input: &Value) -> Reason {
    Reason::parse(input["reason"].as_str().unwrap()).unwrap()
}

fn lines(list: &[String]) -> Value {
    json!(list)
}

#[test]
fn grammar_cases_hold() {
    let path = Path::new(env!("CARGO_MANIFEST_DIR")).join("../contracts/fixtures/grammar.v1.json");
    let file: Value = serde_json::from_str(&std::fs::read_to_string(path).unwrap()).unwrap();
    for case in file["cases"].as_array().unwrap() {
        let (id, input, expect) = (&case["id"], &case["input"], &case["expect"]);
        let text = input["text"].as_str().unwrap_or_default();
        let produced: Vec<String> = match input["kind"].as_str().unwrap() {
            kind @ ("reason" | "suggested") => {
                let parsed = if kind == "reason" {
                    Reason::parse(text)
                } else {
                    Reason::suggested(text)
                };
                match (parsed, expect["code"].as_str()) {
                    (Err(refusal), Some(code)) => {
                        assert_eq!(refusal.code, code, "{id}");
                        let yaml = refusal.yaml.map(|y| y.rule.to_string());
                        assert_eq!(yaml.as_deref(), expect["yaml"].as_str(), "{id}");
                    }
                    (Ok(parsed), None) => {
                        let line = why_line(
                            &Actor::from_writer(&writer(&json!({"session": "w"}))),
                            &parsed,
                        );
                        assert_eq!(
                            line,
                            format!("@fgos:why [w] {}", expect["reason"].as_str().unwrap()),
                            "{id}"
                        );
                        sanitize(&line).unwrap();
                    }
                    (other, _) => panic!("{id}: {other:?}"),
                }
                continue;
            }
            "actor" => {
                let actor = Actor::from_writer(&writer(&input["writer"]));
                vec![why_line(&actor, &Reason::parse("r").unwrap())]
            }
            "header" => header_lines(input["version"].as_u64().unwrap() as u32),
            "doc" => {
                let lines = doc_lines(&input["node"], input.get("standard"));
                assert_eq!(&json!(lines), &expect["lines"], "{id}");
                lines
            }
            "new_block" => {
                let actor = Actor::from_writer(&writer(&input["writer"]));
                block_for_new_key(
                    &input["node"],
                    input.get("standard"),
                    &actor,
                    &reason(input),
                )
            }
            "changed_block" => {
                let actor = Actor::from_writer(&writer(&input["writer"]));
                block_for_changed_key(&comments(&input["existing"]), &actor, &reason(input))
            }
            "parse" => {
                let block = parse_block(&comments(&input["existing"]));
                let got = json!({"doc": block.doc, "why": block.why, "free": block.free});
                assert_eq!(&got, expect, "{id}");
                continue;
            }
            other => panic!("{id}: unknown kind {other}"),
        };
        if expect.get("lines").is_some() {
            assert_eq!(&lines(&produced), &expect["lines"], "{id}");
        } else if expect.get("line").is_some_and(|l| !l.is_null()) && input["kind"] == "actor" {
            assert_eq!(produced[0], expect["line"].as_str().unwrap(), "{id}");
        }
        for line in &produced {
            assert_eq!(sanitize(line).unwrap(), vec![format!("# {line}")], "{id}");
        }
    }
}

#[test]
fn reason_parse_has_no_actor_parameter() {
    // The only way to name an actor is a WriterIdentity: `Reason::parse(&str)` takes the reason alone
    // and `why_line` takes an `Actor`, which only `Actor::from_writer` builds.
    let actor = Actor::from_writer(&writer(&json!({"pid": 1})));
    assert_eq!(
        why_line(&actor, &Reason::parse("ok then").unwrap()),
        "@fgos:why [1] ok then"
    );
}
