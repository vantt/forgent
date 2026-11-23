//! `fgos authority locate` as a process, over the real model of this checkout: a Vietnamese and an English
//! description of the same work both rank the `durable-file` component first, in a `fgos.v1` envelope. The
//! loader and the ranking rules are owned by the crate's tests (`packages/component-authority/rust/`); this
//! file proves the wiring of the binary over them.

use std::fs;
use std::path::{Path, PathBuf};
use std::process::Command;

fn repo_root() -> PathBuf {
    PathBuf::from(env!("CARGO_MANIFEST_DIR"))
        .join("../..")
        .canonicalize()
        .unwrap()
}

fn copy_dir(from: &Path, to: &Path) {
    fs::create_dir_all(to).unwrap();
    for entry in fs::read_dir(from).unwrap() {
        let entry = entry.unwrap();
        let target = to.join(entry.file_name());
        if entry.file_type().unwrap().is_dir() {
            copy_dir(&entry.path(), &target);
        } else {
            fs::copy(entry.path(), target).unwrap();
        }
    }
}

/// A fresh checkout has no `.fgos`: the verb needs a project, so the test builds one holding a copy of the real model.
fn temp_project() -> PathBuf {
    let project =
        std::env::temp_dir().join(format!("fgos-authority-locate-{}", std::process::id()));
    let _ = fs::remove_dir_all(&project);
    fs::create_dir_all(project.join(".fgos")).unwrap();
    let model = Path::new("packages/component-authority/model");
    copy_dir(&repo_root().join(model), &project.join(model));
    project
}

fn locate_first(sentence: &str) -> serde_json::Value {
    let project = temp_project();
    let output = Command::new(env!("CARGO_BIN_EXE_fgos"))
        .args(["authority", "locate", sentence, "--json"])
        .env_remove("FGOS_CONFINED")
        .env_remove("FGOS_HEAD_REQUEST_SOCKET")
        .current_dir(&project)
        .output()
        .unwrap();
    let _ = fs::remove_dir_all(&project);
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
