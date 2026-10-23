//! Writes the seed corpus from the golden fixtures: `seed <corpus-dir>` fills `<dir>/parse`,
//! `<dir>/edit_reparse` and `<dir>/merge`. Inputs past 64 KiB (the byte-bound probes) are skipped, and past 8 KiB for `edit_reparse`.

#[path = "../../../tests/common/mod.rs"]
mod common;

use std::collections::hash_map::DefaultHasher;
use std::hash::{Hash, Hasher};
use std::path::Path;

use common::{fixture_cases, id, resolve_input};
use fgos_yaml_doc::merge::MergeRule;
use fgos_yaml_doc::Value;
use fgos_yaml_doc_fuzz::{encode_edit, encode_value, OPS};

const SEED_BYTES: usize = 64 * 1024;
const EDIT_SEED_BYTES: usize = 8 * 1024;

fn write(dir: &Path, label: &str, bytes: &[u8]) {
    let mut hasher = DefaultHasher::new();
    bytes.hash(&mut hasher);
    let name = format!("{label}-{:016x}", hasher.finish());
    std::fs::write(dir.join(name), bytes).expect("write seed");
}

fn main() {
    let root = std::env::args().nth(1).expect("usage: seed <corpus-dir>");
    let root = Path::new(&root);
    let [parse_dir, edit_dir, merge_dir] =
        ["parse", "edit_reparse", "merge"].map(|name| root.join(name));
    for dir in [&parse_dir, &edit_dir, &merge_dir] {
        std::fs::create_dir_all(dir).expect("create corpus dir");
    }
    let (mut parse_n, mut edit_n, mut merge_n) = (0, 0, 0);
    for case in fixture_cases("parse") {
        let input = resolve_input(&case["input"]);
        if input.len() > SEED_BYTES {
            continue;
        }
        for profile in 0..2u8 {
            let mut bytes = vec![profile];
            bytes.extend_from_slice(&input);
            write(&parse_dir, id(&case), &bytes);
            parse_n += 1;
        }
    }
    for case in fixture_cases("edit") {
        let input = resolve_input(&case["input"]);
        // Each input is written once per profile and operation: keep the big ones for `parse`.
        if input.len() > EDIT_SEED_BYTES {
            continue;
        }
        for profile in 0..2u8 {
            for op in 0..OPS {
                for pick in [0u8, 1] {
                    let bytes = encode_edit(profile, op, pick, op % 2 == 0, &input, "new text");
                    write(&edit_dir, id(&case), &bytes);
                    edit_n += 1;
                }
            }
        }
    }
    for case in fixture_cases("merge") {
        let layers = &case["input"]["layers"];
        let mut bytes = vec![0u8, layers.as_array().map_or(0, |l| l.len().min(4)) as u8];
        for layer in layers.as_array().into_iter().flatten().take(4) {
            encode_value(&Value::from_json(&layer["value"]), 0, &mut bytes);
        }
        write(&merge_dir, id(&case), &bytes);
        merge_n += 1;
    }
    let _ = MergeRule::Deep;
    println!("seeded: parse {parse_n}, edit_reparse {edit_n}, merge {merge_n}");
}
