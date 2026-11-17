//! The coexistence manifest: read-only detection of other agent harnesses in a project, and the
//! `.fgos/coexistence.json` file that states fgOS's own territory for them.
//!
//! Detection only ever tests for existence and reads another harness's files, never writes, renames or
//! deletes there; a detection problem (an unreadable `AGENTS.md`) is recorded as data in the manifest, never
//! raised, so it can never fail `fgos init`. Writing the manifest is the one write, through Durable File.
//! Contract: `docs/platform/coexistence/spec.md`.

use serde_json::{json, Map, Value};
use std::io;
use std::path::{Path, PathBuf};

/// Directory markers: start narrow, extend by adding rows, never by branching new detection logic.
const DIR_MARKERS: [(&str, &str); 4] = [
    ("bee", ".bee"),
    ("claude", ".claude"),
    ("codex", ".codex"),
    ("cursor", ".cursor"),
];

/// The managed-block convention of bee's own `AGENTS.md`.
const AGENTS_MD_MARKER: (&str, &str) = ("bee", "<!-- BEE:START -->");

/// The file name under the data directory.
pub const MANIFEST_FILE: &str = "coexistence.json";

/// One detected harness and the markers that showed it.
#[derive(Debug, Clone, PartialEq, Eq)]
pub struct Harness {
    pub name: String,
    pub markers: Vec<String>,
}

/// What a scan found.
#[derive(Debug, Clone, PartialEq, Eq)]
pub struct Detection {
    pub detected_harnesses: Vec<Harness>,
    pub agents_md_read_error: Option<String>,
}

/// Node's wording of the failure of reading `path`, for the two causes a project hits; any other cause keeps
/// the operating system's own text.
fn read_error_message(error: &io::Error, path: &Path) -> String {
    match error.raw_os_error() {
        Some(13) => format!("EACCES: permission denied, open '{}'", path.display()),
        Some(21) => "EISDIR: illegal operation on a directory, read".to_string(),
        _ => error.to_string(),
    }
}

/// Read-only scan of `root` for other agent-harness markers. A directory marker and an `AGENTS.md` block of
/// the same harness collapse into one entry with both markers listed.
pub fn detect_harnesses(root: &Path) -> Detection {
    let mut found: Vec<Harness> = DIR_MARKERS
        .iter()
        .filter(|(_, dir)| root.join(dir).exists())
        .map(|(name, dir)| Harness {
            name: (*name).to_string(),
            markers: vec![(*dir).to_string()],
        })
        .collect();
    let mut agents_md_read_error = None;
    let agents = root.join("AGENTS.md");
    if agents.exists() {
        match std::fs::read(&agents) {
            Ok(bytes) => {
                if String::from_utf8_lossy(&bytes).contains(AGENTS_MD_MARKER.1) {
                    let marker = AGENTS_MD_MARKER.1.to_string();
                    match found.iter_mut().find(|h| h.name == AGENTS_MD_MARKER.0) {
                        Some(existing) => existing.markers.push(marker),
                        None => found.push(Harness {
                            name: AGENTS_MD_MARKER.0.to_string(),
                            markers: vec![marker],
                        }),
                    }
                }
            }
            Err(e) => agents_md_read_error = Some(read_error_message(&e, &agents)),
        }
    }
    Detection {
        detected_harnesses: found,
        agents_md_read_error,
    }
}

/// The OS temporary directory as Node's `os.tmpdir()` names it: the first of `TMPDIR`, `TMP`, `TEMP` that is
/// set and non-empty with one trailing slash dropped, else `/tmp`; the platform's own on Windows.
pub fn os_tmpdir(lookup: impl Fn(&str) -> Option<String>) -> PathBuf {
    if cfg!(windows) {
        return std::env::temp_dir();
    }
    let chosen = ["TMPDIR", "TMP", "TEMP"]
        .iter()
        .find_map(|key| lookup(key).filter(|v| !v.is_empty()))
        .unwrap_or_else(|| "/tmp".to_string());
    let trimmed = if chosen.len() > 1 {
        chosen.strip_suffix('/').unwrap_or(&chosen)
    } else {
        &chosen
    };
    PathBuf::from(trimmed)
}

/// The `.fgos/coexistence.json` manifest for `root`: fgOS's own territory, machine-readable, for another
/// harness to check. `territory` is descriptive, not derived from `root`: it documents what fgOS already does.
pub fn build_manifest(root: &Path, tmpdir: &Path) -> Value {
    let detection = detect_harnesses(root);
    let harnesses: Vec<Value> = detection
        .detected_harnesses
        .iter()
        .map(|h| json!({ "name": h.name, "markers": h.markers }))
        .collect();
    let mut manifest = Map::new();
    manifest.insert("v".into(), json!(1));
    manifest.insert(
        "territory".into(),
        json!({
            "data": ".fgos/",
            "worktrees": {
                "descriptor": "<tmpdir>/fgos-worktrees",
                "resolved": tmpdir.join("fgos-worktrees").to_string_lossy(),
            },
            "branches": "fgw/*",
        }),
    );
    manifest.insert("detected_harnesses".into(), Value::Array(harnesses));
    if let Some(error) = detection.agents_md_read_error.filter(|e| !e.is_empty()) {
        manifest.insert("agentsMdReadError".into(), Value::String(error));
    }
    Value::Object(manifest)
}

/// The manifest as the file holds it: two-space indented JSON and a newline.
pub fn manifest_bytes(manifest: &Value) -> Vec<u8> {
    let mut text = serde_json::to_string_pretty(manifest).unwrap_or_default();
    text.push('\n');
    text.into_bytes()
}

/// Builds and writes `<data_dir>/coexistence.json` for the project at `root`, and returns the manifest that
/// was written so a caller can report the detected harnesses without re-reading the file. A genuine write
/// failure (an unwritable `data_dir`) is the error; detection never is.
pub fn write_coexistence_manifest(
    root: &Path,
    data_dir: &Path,
    tmpdir: &Path,
) -> io::Result<Value> {
    let manifest = build_manifest(root, tmpdir);
    std::fs::create_dir_all(data_dir)?;
    match fgos_durable_file::replace_durably_with_mode(
        data_dir,
        MANIFEST_FILE,
        &manifest_bytes(&manifest),
        0o666,
    ) {
        Ok(_) => Ok(manifest),
        // The file is installed; only its durability or cleanup failed.
        Err(e) if e.installed.is_some() => Ok(manifest),
        Err(e) => Err(e.source),
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::test_scratch::scratch;

    fn names(d: &Detection) -> Vec<(String, Vec<String>)> {
        d.detected_harnesses
            .iter()
            .map(|h| (h.name.clone(), h.markers.clone()))
            .collect()
    }

    #[test]
    fn an_empty_project_has_no_harness() {
        let d = detect_harnesses(&scratch("empty"));
        assert!(d.detected_harnesses.is_empty());
        assert_eq!(d.agents_md_read_error, None);
    }

    #[test]
    fn each_directory_marker_names_its_harness_in_a_fixed_order() {
        let root = scratch("dirs");
        for dir in [".cursor", ".claude", ".bee", ".codex"] {
            std::fs::create_dir(root.join(dir)).unwrap();
        }
        let d = detect_harnesses(&root);
        let got: Vec<String> = d
            .detected_harnesses
            .iter()
            .map(|h| h.name.clone())
            .collect();
        assert_eq!(got, ["bee", "claude", "codex", "cursor"]);
    }

    #[test]
    fn a_bee_block_in_agents_md_joins_the_directory_marker_into_one_entry() {
        let root = scratch("bee");
        std::fs::create_dir(root.join(".bee")).unwrap();
        std::fs::write(root.join("AGENTS.md"), "x\n<!-- BEE:START -->\ny").unwrap();
        assert_eq!(
            names(&detect_harnesses(&root)),
            vec![(
                "bee".to_string(),
                vec![".bee".to_string(), "<!-- BEE:START -->".to_string()]
            )]
        );
        let alone = scratch("bee-alone");
        std::fs::write(alone.join("AGENTS.md"), "<!-- BEE:START -->").unwrap();
        assert_eq!(
            names(&detect_harnesses(&alone)),
            vec![("bee".to_string(), vec!["<!-- BEE:START -->".to_string()])]
        );
    }

    #[test]
    fn an_agents_md_without_the_block_detects_nothing() {
        let root = scratch("plain");
        std::fs::write(root.join("AGENTS.md"), "# rules\n").unwrap();
        assert!(detect_harnesses(&root).detected_harnesses.is_empty());
    }

    #[test]
    fn an_unreadable_agents_md_is_recorded_as_data_never_raised() {
        let root = scratch("unreadable");
        std::fs::create_dir(root.join("AGENTS.md")).unwrap();
        let d = detect_harnesses(&root);
        assert!(d.detected_harnesses.is_empty());
        let error = d.agents_md_read_error.as_deref().expect("a recorded error");
        // The text is the OS's own for reading a directory; Node's name for it is what a Unix host answers.
        #[cfg(unix)]
        assert_eq!(error, "EISDIR: illegal operation on a directory, read");
        let manifest = build_manifest(&root, Path::new("/tmp"));
        assert_eq!(manifest["agentsMdReadError"], error);
    }

    #[test]
    fn the_manifest_file_has_the_bytes_node_wrote() {
        let root = scratch("bytes");
        std::fs::create_dir(root.join(".claude")).unwrap();
        let data = root.join(".fgos");
        write_coexistence_manifest(&root, &data, Path::new("/tmp")).unwrap();
        // The resolved directory is the tmpdir joined with the platform's own separator.
        let resolved = Path::new("/tmp").join("fgos-worktrees");
        let resolved = serde_json::to_string(resolved.to_str().unwrap()).unwrap();
        let expected = "{\n  \"v\": 1,\n  \"territory\": {\n    \"data\": \".fgos/\",\n    \"worktrees\": {\n      \"descriptor\": \"<tmpdir>/fgos-worktrees\",\n      \"resolved\": RESOLVED\n    },\n    \"branches\": \"fgw/*\"\n  },\n  \"detected_harnesses\": [\n    {\n      \"name\": \"claude\",\n      \"markers\": [\n        \".claude\"\n      ]\n    }\n  ]\n}\n";
        let expected = expected.replace("RESOLVED", &resolved);
        assert_eq!(
            std::fs::read_to_string(data.join(MANIFEST_FILE)).unwrap(),
            expected
        );
    }

    #[test]
    fn an_empty_detection_writes_an_empty_array_and_a_rewrite_replaces_the_file() {
        let root = scratch("rewrite");
        let data = root.join(".fgos");
        write_coexistence_manifest(&root, &data, Path::new("/t")).unwrap();
        let first = std::fs::read_to_string(data.join(MANIFEST_FILE)).unwrap();
        assert!(first.contains("\"detected_harnesses\": []"));
        std::fs::create_dir(root.join(".codex")).unwrap();
        let manifest = write_coexistence_manifest(&root, &data, Path::new("/t")).unwrap();
        assert_eq!(manifest["detected_harnesses"][0]["name"], "codex");
        assert!(std::fs::read_to_string(data.join(MANIFEST_FILE))
            .unwrap()
            .contains("codex"));
    }

    #[test]
    fn an_unwritable_data_directory_is_the_error() {
        let root = scratch("blocked");
        let blocker = root.join("file");
        std::fs::write(&blocker, "").unwrap();
        assert!(
            write_coexistence_manifest(&root, &blocker.join("sub"), Path::new("/tmp")).is_err()
        );
    }

    // Windows answers its own temporary directory whatever the variables say.
    #[cfg(windows)]
    #[test]
    fn the_tmpdir_is_the_platforms_own_on_windows() {
        assert_eq!(os_tmpdir(|_| Some("/a".into())), std::env::temp_dir());
    }

    #[cfg(unix)]
    #[test]
    fn the_tmpdir_follows_the_first_variable_set_and_drops_one_trailing_slash() {
        let env = |pairs: &'static [(&'static str, &'static str)]| {
            move |key: &str| {
                pairs
                    .iter()
                    .find(|(k, _)| *k == key)
                    .map(|(_, v)| v.to_string())
            }
        };
        assert_eq!(os_tmpdir(env(&[])), PathBuf::from("/tmp"));
        assert_eq!(
            os_tmpdir(env(&[("TMP", "/a/"), ("TEMP", "/b")])),
            PathBuf::from("/a")
        );
        assert_eq!(
            os_tmpdir(env(&[("TMPDIR", ""), ("TEMP", "/b")])),
            PathBuf::from("/b")
        );
        assert_eq!(os_tmpdir(env(&[("TMPDIR", "/")])), PathBuf::from("/"));
    }
}
