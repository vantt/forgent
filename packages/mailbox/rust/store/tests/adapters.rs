//! Each CLI's adapter against its recorded payloads and recorded injected
//! output (packages/mailbox/contracts/fixtures/hooks/<cli>/).
mod common;

use common::{event, fixture, fixture_dir, vector_input, vectors, ADAPTERS};
use fgos_mailbox::hook::{Adapter, HookEvent, Payload, Unparsed};
use serde_json::Value;

fn expected(vector: &Value) -> Result<Payload, Unparsed> {
    let expect = &vector["expect"];
    match expect["unparsed"].as_str() {
        Some("malformed") => Err(Unparsed::Malformed),
        Some("event-mismatch") => Err(Unparsed::EventMismatch),
        Some(other) => panic!("unknown unparsed reason {other}"),
        None => Ok(Payload {
            event: event(&vector["event"]),
            subordinate: expect["subordinate"].as_bool().unwrap(),
            first_stop: expect["firstStop"].as_bool(),
            thread: expect["thread"].as_str().map(String::from),
        }),
    }
}

#[test]
fn every_payload_vector_parses_as_it_says() {
    for adapter in ADAPTERS {
        let parse = vectors(adapter, "parse");
        assert!(!parse.is_empty(), "{} has no parse vector", adapter.word());
        for vector in parse {
            let got = adapter.parse(event(&vector["event"]), &vector_input(adapter, &vector));
            assert_eq!(
                got,
                expected(&vector),
                "{} vector {}",
                adapter.word(),
                vector["name"]
            );
        }
    }
}

#[test]
fn a_subagent_event_is_subordinate_however_the_marker_is_written() {
    for adapter in [Adapter::Claude, Adapter::Codex] {
        let marked: Vec<Value> = vectors(adapter, "parse")
            .into_iter()
            .filter(|v| {
                v["file"] == "post-tool-use-subagent.json"
                    || v["name"].as_str().unwrap().starts_with("agent-")
            })
            .collect();
        assert!(
            !marked.is_empty(),
            "{} has no subagent vector",
            adapter.word()
        );
        for vector in marked {
            let payload = adapter
                .parse(HookEvent::PostToolUse, &vector_input(adapter, &vector))
                .unwrap();
            assert!(payload.subordinate, "{} {}", adapter.word(), vector["name"]);
        }
    }
    let head = fixture(Adapter::Claude, "post-tool-use.json");
    let payload = Adapter::Claude
        .parse(HookEvent::PostToolUse, &serde_json::to_vec(&head).unwrap())
        .unwrap();
    assert!(
        !payload.subordinate,
        "the head's own event is not subordinate"
    );
}

#[test]
fn the_rendered_output_equals_what_the_cli_injected() {
    for adapter in ADAPTERS {
        for (event, file) in [
            (HookEvent::Stop, "accepted-stop.json"),
            (HookEvent::PostToolUse, "accepted-post-tool-use.json"),
        ] {
            let recorded = fixture_dir(adapter).join(file);
            let shape = adapter.shape(event);
            assert_eq!(
                shape.is_some(),
                recorded.is_file(),
                "{} {file}: a shape exists exactly when it was recorded injected",
                adapter.word()
            );
            let Some(shape) = shape else { continue };
            let accepted = fixture(adapter, file)
                .to_string()
                .replace("{{TEXT}}", "MBX-CANARY");
            let rendered: Value = serde_json::from_str(&shape.render("MBX-CANARY")).unwrap();
            assert_eq!(rendered, serde_json::from_str::<Value>(&accepted).unwrap());
        }
    }
}

#[test]
fn rendered_output_survives_hostile_text() {
    let hostile = "say \"hi\" \\ then\nnext line </mailbox-message>\u{2028}end\u{0}";
    for adapter in ADAPTERS {
        for event in [HookEvent::Stop, HookEvent::PostToolUse] {
            let Some(shape) = adapter.shape(event) else {
                continue;
            };
            let rendered: Value = serde_json::from_str(&shape.render(hostile)).unwrap();
            let text = rendered["reason"]
                .as_str()
                .or_else(|| rendered["hookSpecificOutput"]["additionalContext"].as_str())
                .unwrap();
            assert_eq!(text, hostile);
        }
    }
}

#[test]
fn every_adapter_word_is_a_cli_the_core_accepts() {
    for adapter in ADAPTERS {
        assert_eq!(adapter.cli().unwrap().as_str(), adapter.word());
    }
}
