//! `fgos authority locate` as a process, over the real model of this checkout: a Vietnamese and an English
//! description of the same work both rank the `durable-file` component first, in a `fgos.v1` envelope. The
//! loader and the ranking rules are owned by the crate's tests (`packages/component-authority/rust/`); this
//! file proves the wiring of the binary over them.

use std::path::PathBuf;
use std::process::Command;

fn repo_root() -> PathBuf {
    PathBuf::from(env!("CARGO_MANIFEST_DIR"))
        .join("../..")
        .canonicalize()
        .unwrap()
}

fn locate_first(sentence: &str) -> serde_json::Value {
    let output = Command::new(env!("CARGO_BIN_EXE_fgos"))
        .args(["authority", "locate", sentence, "--json"])
        .current_dir(repo_root())
        .output()
        .unwrap();
    assert!(
        output.status.success(),
        "locate {sentence:?}: {}{}",
        String::from_utf8_lossy(&output.stdout),
        String::from_utf8_lossy(&output.stderr)
    );
    let envelope: serde_json::Value = serde_json::from_slice(&output.stdout).unwrap();
    assert_eq!(envelope["contract"], "fgos.v1", "{envelope}");
    envelope["data"]["matches"][0].clone()
}

#[test]
fn a_vietnamese_and_an_english_description_of_atomic_writes_both_rank_durable_file_first() {
    for sentence in ["ghi file nguyên tử", "atomic file write"] {
        let first = locate_first(sentence);
        assert_eq!(first["id"], "durable-file", "{sentence}: {first}");
        assert_eq!(first["kind"], "component", "{sentence}: {first}");
        assert_eq!(first["matchedOn"], "alias", "{sentence}: {first}");
    }
}
