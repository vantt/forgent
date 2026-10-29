//! A document plus one edit chosen from the document's own paths: no panic, a refused edit leaves
//! the bytes as they were, an accepted edit leaves a document that parses to the same value.
#![no_main]

use fgos_yaml_doc::{parse, rule, CommentLoss, Value};
use fgos_yaml_doc_fuzz::{decode_edit, paths_of, same_value, value_at};
use libfuzzer_sys::fuzz_target;

fuzz_target!(|data: &[u8]| {
    let Some(input) = decode_edit(data) else {
        return;
    };
    let Ok(mut doc) = parse(input.document, input.profile, "fuzz.yaml") else {
        return;
    };
    let paths = paths_of(doc.value(), 64);
    let path = paths[usize::from(input.pick) % paths.len()].clone();
    let ack = if input.acknowledge {
        CommentLoss::Acknowledge
    } else {
        CommentLoss::Refuse
    };
    let before = doc.to_bytes();
    let text = input.text.clone();
    let value = Value::Str(text.clone());
    let result = match input.op {
        0 => doc.set(&path, value.clone(), ack),
        1 => doc.remove(&path, ack),
        2 => doc.set_comment_block(&path, &[text.clone()]),
        _ => doc.comments_at(&path).map(|_| ()),
    };
    match result {
        Err(refusal) => {
            assert_ne!(
                refusal.rule,
                rule::YAML_INTERNAL_ERROR,
                "a panic was caught: {refusal}"
            );
            assert!(
                rule::ALL.contains(&refusal.rule),
                "unnamed rule {}",
                refusal.rule
            );
            assert_eq!(
                doc.to_bytes(),
                before,
                "a refused edit changed the document"
            );
        }
        Ok(()) => {
            let again = parse(&doc.to_bytes(), input.profile, "fuzz.yaml")
                .expect("an accepted edit left a document that does not parse");
            assert!(
                same_value(again.value(), doc.value()),
                "the document's value is not its bytes' value"
            );
            if input.op == 0 && !path.is_empty() {
                assert_eq!(
                    value_at(doc.value(), &path),
                    Some(&value),
                    "set did not land"
                );
            }
            if input.op == 2 {
                let original = parse(&before, input.profile, "fuzz.yaml")
                    .expect("the document parsed a moment ago");
                assert!(
                    same_value(doc.value(), original.value()),
                    "a comment edit changed the meaning"
                );
            }
        }
    }
});
