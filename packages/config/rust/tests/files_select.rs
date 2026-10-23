//! One source per scope (spec section 3) on real directories.
#![cfg(unix)]
use fgos_config::files::{select_source, FileError, Source, TOMBSTONE};
use std::fs;
use std::os::unix::fs::symlink;
use std::path::{Path, PathBuf};

fn scope(name: &str, yaml: Option<&[u8]>, json: Option<&[u8]>) -> PathBuf {
    let root =
        std::env::temp_dir().join(format!("fgos-config-select-{name}-{}", std::process::id()));
    let _ = fs::remove_dir_all(&root);
    fs::create_dir_all(root.join(".fgos")).unwrap();
    if let Some(bytes) = yaml {
        fs::write(root.join(".fgos/config.yaml"), bytes).unwrap();
    }
    if let Some(bytes) = json {
        fs::write(root.join(".fgos/config.json"), bytes).unwrap();
    }
    root
}

type Case<'a> = (&'a str, Option<&'a [u8]>, Option<&'a [u8]>, &'a str);

fn select(root: &Path) -> Result<Source, FileError> {
    select_source(root, Path::new(".fgos"), 1024)
}

fn kind(source: Result<Source, FileError>) -> String {
    match source {
        Ok(Source::Absent) => "absent".into(),
        Ok(Source::Yaml(_)) => "yaml".into(),
        Ok(Source::LegacyJson(_)) => "json".into(),
        Err(FileError::Refused(refusal)) => refusal.code.into(),
        Err(other) => panic!("{other:?}"),
    }
}

#[test]
fn exactly_one_source_is_chosen_and_both_files_are_config_legacy_shadowed() {
    let tomb = TOMBSTONE.as_bytes();
    let tomb_nl = format!("{TOMBSTONE}\n");
    let cases: [Case; 9] = [
        ("none", None, None, "absent"),
        ("yaml", Some(b"a: 1\n"), None, "yaml"),
        ("json", None, Some(b"{}"), "json"),
        (
            "both",
            Some(b"a: 1\n"),
            Some(b"{}"),
            "config-legacy-shadowed",
        ),
        ("tomb", None, Some(tomb), "absent"),
        ("tomb-nl", None, Some(tomb_nl.as_bytes()), "absent"),
        ("tomb-yaml", Some(b"a: 1\n"), Some(tomb), "yaml"),
        (
            "tomb-near",
            None,
            Some(b"moved to .fgos/config.yaml; upgrade fgOS\n\n"),
            "json",
        ),
        (
            "tomb-prefix",
            None,
            Some(b" moved to .fgos/config.yaml; upgrade fgOS"),
            "json",
        ),
    ];
    for (name, yaml, json, expected) in cases {
        assert_eq!(kind(select(&scope(name, yaml, json))), expected, "{name}");
    }
}

#[test]
fn a_symlinked_config_json_next_to_a_yaml_is_refused_not_ignored() {
    let root = scope("symlinked-json", Some(b"a: 1\n"), None);
    fs::write(root.join("elsewhere.json"), b"{}").unwrap();
    symlink(root.join("elsewhere.json"), root.join(".fgos/config.json")).unwrap();
    assert_eq!(kind(select(&root)), "config-path-symlink");
}
