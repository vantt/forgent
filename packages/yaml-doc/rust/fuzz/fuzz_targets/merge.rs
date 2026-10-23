//! Up to four small layers and a per-path rule table: no panic, and every leaf of the merged value
//! (anything but a non-empty mapping or sequence) names a layer that holds that path.
#![no_main]

use fgos_yaml_doc::merge::{merge, MergeRule};
use fgos_yaml_doc::{rule, Segment, Value};
use fgos_yaml_doc_fuzz::{decode_value, value_at, Reader};
use libfuzzer_sys::fuzz_target;

fn leaves(value: &Value, path: &mut Vec<Segment>, out: &mut Vec<Vec<Segment>>) {
    match value {
        Value::Map(entries) if !entries.is_empty() => {
            for (key, child) in entries {
                path.push(Segment::Key(key.clone()));
                leaves(child, path, out);
                path.pop();
            }
        }
        Value::Seq(items) if !items.is_empty() => {
            for (index, child) in items.iter().enumerate() {
                path.push(Segment::Index(index));
                leaves(child, path, out);
                path.pop();
            }
        }
        _ => out.push(path.clone()),
    }
}

fn pick(path: &[Segment], seed: u8) -> Option<MergeRule> {
    let hash = path.iter().fold(u32::from(seed), |h, s| {
        h.wrapping_mul(31).wrapping_add(match s {
            Segment::Key(k) => u32::from(k.as_bytes().first().copied().unwrap_or(0)),
            Segment::Index(i) => *i as u32 + 100,
        })
    });
    [
        None,
        Some(MergeRule::Deep),
        Some(MergeRule::Replace),
        Some(MergeRule::Leaf),
    ][(hash % 4) as usize]
}

fuzz_target!(|data: &[u8]| {
    let mut reader = Reader::new(data);
    let seed = reader.byte();
    let count = reader.byte() % 5;
    let layers: Vec<Value> = (0..count).map(|_| decode_value(&mut reader, 0)).collect();
    let refs: Vec<&Value> = layers.iter().collect();
    let rules = move |path: &[Segment]| pick(path, seed);
    match merge(&refs, &rules) {
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
        }
        Ok(merged) => {
            for (path, layer) in &merged.origins {
                let holder = layers
                    .get(*layer)
                    .expect("origin names a layer that exists");
                assert!(
                    value_at(holder, path).is_some(),
                    "origin layer does not hold the path"
                );
            }
            let mut found = Vec::new();
            leaves(&merged.value, &mut Vec::new(), &mut found);
            if !refs.is_empty() {
                for path in found {
                    assert!(
                        merged.origins.iter().any(|(p, _)| *p == path),
                        "a leaf has no origin: {path:?} in {:?} from {layers:?}",
                        merged
                    );
                }
            }
        }
    }
});
