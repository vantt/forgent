//! The doctor rows of `fgos doc locate`. The model row checks the embedding model on this machine and its fix fetches
//! it; the index row is a read-only pointer to `fgos doc index status`. Locate answers from text alone without the
//! model, so neither row ever fails: what they find is a `warning:`.

use super::{judged, Rows};
use crate::wiring::doc_locate::locate_paths;
use fgos_distribution::doctor::{timed, FixResult, RowOutcome, RowResult};
use fgos_documentation::pkm::{self, ModelCheck, ModelSource};
use fgos_documentation::port::IndexKind;
use std::path::Path;

pub const ROWS: &[&str] = &["doc-locate-model", "doc-locate-index"];
pub const FIXES: &[&str] = &["doc-locate-model-fetch"];

/// The config key that names where the fix fetches the model from.
const MODEL_SOURCE_KEY: &str = "docLocate.modelSource";

pub const GROUP: Rows = Rows {
    rows: ROWS,
    fixes: FIXES,
    judge,
    fix,
};

fn judge(root: &Path, ids: &[&str]) -> Vec<RowOutcome> {
    ids.iter()
        .map(|id| {
            timed(|| match *id {
                "doc-locate-model" => model_row(&pkm::check_model(&locate_paths(root).model_dir)),
                "doc-locate-index" => index_row(root),
                other => unreachable!("documentation group asked for row {other}"),
            })
        })
        .collect()
}

fn fix(root: &Path, ids: &[&str]) -> Vec<FixResult> {
    ids.iter()
        .map(|id| match *id {
            "doc-locate-model-fetch" => fetch(root, id),
            other => unreachable!("documentation group asked for fix {other}"),
        })
        .collect()
}

/// The model row: ok when every file matches, a warning naming the files otherwise.
fn model_row(check: &ModelCheck) -> RowOutcome {
    let detail = serde_json::json!({
        "model": check.version,
        "dir": check.dir.display().to_string(),
        "missing": check.missing,
        "corrupt": check.corrupt,
    });
    let message = if check.usable() {
        format!("the embedding model {} is complete", check.version)
    } else {
        format!(
            "warning: the embedding model {} has {} missing and {} corrupt files, so fgos doc locate answers from \
             text alone; run `fgos doctor --fix`",
            check.version,
            check.missing.len(),
            check.corrupt.len()
        )
    };
    RowOutcome::Judged(RowResult {
        passed: true,
        status: None,
        message: Some(message),
        fix_command: None,
        detail: Some(detail),
        elapsed_ms: None,
    })
}

/// The index pointer row: ok when ready or when this project has no corpus or no index yet.
fn index_row(root: &Path) -> RowOutcome {
    let paths = locate_paths(root);
    if !paths.docs_root.is_dir() {
        return judged(true, "no docs/ corpus here, so there is no locate index");
    }
    if !paths.search_db.exists() {
        return judged(
            true,
            "no locate index yet; the first `fgos doc locate` starts one",
        );
    }
    let status = pkm::index_status(&paths, None);
    if status.state == IndexKind::Ready {
        return judged(
            true,
            format!("the locate index is ready ({} chunks)", status.total),
        );
    }
    let state = serde_json::to_value(status.state)
        .ok()
        .and_then(|v| v.as_str().map(str::to_owned))
        .unwrap_or_default();
    judged(
        true,
        format!("warning: the locate index is {state}; run `fgos doc index status`"),
    )
}

/// Fetches whatever the model is missing from the configured source.
fn fetch(root: &Path, id: &str) -> FixResult {
    let source_text = fgos_config::provider::effective_value(root, MODEL_SOURCE_KEY)
        .ok()
        .flatten()
        .and_then(|v| v.as_str().map(str::to_owned));
    let source = match source_text.as_deref().map(pkm::parse_model_source) {
        None => ModelSource::default(),
        Some(Ok(source)) => source,
        Some(Err(why)) => {
            return FixResult::done(id, false, format!("{MODEL_SOURCE_KEY}: {why}"));
        }
    };
    let model_dir = locate_paths(root).model_dir;
    if pkm::check_model(&model_dir).usable() {
        return FixResult::done(id, false, "the embedding model is already complete");
    }
    let mut fetched = Vec::new();
    match pkm::fetch_model(&model_dir, &source, &mut |line| fetched.push(line)) {
        Ok(dir) => FixResult::done(
            id,
            true,
            format!("fetched the embedding model into {}", dir.display()),
        ),
        // A missing `curl` or a refused download is said here; the row keeps warning.
        Err(why) => FixResult::done(
            id,
            !fetched.is_empty(),
            format!("the embedding model could not be fetched: {why}"),
        ),
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use std::path::PathBuf;

    /// A scratch folder under the temp dir, removed when the test ends.
    struct Scratch(PathBuf);

    impl Scratch {
        fn new(name: &str) -> Scratch {
            let dir = std::env::temp_dir().join(format!(
                "fgos-doctor-documentation-{name}-{}",
                std::process::id()
            ));
            let _ = std::fs::remove_dir_all(&dir);
            std::fs::create_dir_all(&dir).unwrap();
            Scratch(dir)
        }

        fn path(&self) -> &Path {
            &self.0
        }
    }

    impl Drop for Scratch {
        fn drop(&mut self) {
            let _ = std::fs::remove_dir_all(&self.0);
        }
    }

    fn message(outcome: &RowOutcome) -> (&str, serde_json::Value) {
        match outcome {
            RowOutcome::Judged(r) => {
                assert!(r.passed, "the model row never fails");
                (
                    r.message.as_deref().unwrap(),
                    r.detail.clone().unwrap_or_default(),
                )
            }
            RowOutcome::Unavailable { message, .. } => panic!("unavailable: {message}"),
        }
    }

    #[test]
    fn an_empty_model_folder_warns_and_lists_every_missing_file() {
        let root = Scratch::new("empty");
        let check = pkm::check_model(root.path());
        let outcome = model_row(&check);
        let (text, detail) = message(&outcome);
        assert!(text.starts_with("warning:"), "{text}");
        assert!(text.contains("fgos doctor --fix"), "{text}");
        assert!(
            !detail["missing"].as_array().unwrap().is_empty(),
            "{detail}"
        );
        assert!(detail["corrupt"].as_array().unwrap().is_empty(), "{detail}");
    }

    #[test]
    fn a_model_file_with_wrong_bytes_warns_and_is_listed_as_corrupt() {
        let root = Scratch::new("corrupt");
        let empty = pkm::check_model(root.path());
        let first = &empty.missing[0];
        let path = empty.dir.join(first);
        std::fs::create_dir_all(path.parent().unwrap()).unwrap();
        std::fs::write(&path, b"not the model").unwrap();
        let outcome = model_row(&pkm::check_model(root.path()));
        let (text, detail) = message(&outcome);
        assert!(text.starts_with("warning:"), "{text}");
        assert_eq!(detail["corrupt"], serde_json::json!([first]), "{detail}");
        assert!(
            !detail["missing"]
                .as_array()
                .unwrap()
                .iter()
                .any(|m| m == first.as_str()),
            "{detail}"
        );
    }

    #[test]
    fn a_project_without_a_corpus_or_an_index_passes_the_index_row_without_a_warning() {
        let root = Scratch::new("index");
        let bare = index_row(root.path());
        let (text, _) = message(&bare);
        assert!(!text.starts_with("warning:"), "{text}");
        std::fs::create_dir(root.path().join("docs")).unwrap();
        let corpus = index_row(root.path());
        let (text, _) = message(&corpus);
        assert!(text.contains("first `fgos doc locate`"), "{text}");
        assert!(
            !root.path().join(".fgos").exists(),
            "the pointer row writes nothing"
        );
    }
}
