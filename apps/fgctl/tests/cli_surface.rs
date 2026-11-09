//! The `fgctl` command surface as a user or an agent meets it: a child
//! process with its own HOME and state directories, so nothing of the real
//! machine is read or written.

use std::path::{Path, PathBuf};
use std::process::{Command, Output};

/// A scratch directory removed on drop, without a new dev-dependency.
struct Scratch(PathBuf);

impl Scratch {
    fn new(name: &str) -> Self {
        let dir = std::env::temp_dir().join(format!("fgctl-surface-{name}-{}", std::process::id()));
        std::fs::create_dir_all(&dir).expect("create scratch dir");
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

fn fgctl(home: &Path, args: &[&str]) -> Output {
    let mut command = Command::new(env!("CARGO_BIN_EXE_fgctl"));
    command
        .args(args)
        .current_dir(home)
        .env("HOME", home)
        .env("XDG_STATE_HOME", home.join("state"))
        .env("FGOS_STATE_ROOT", home.join("state").join("fgos"));
    for name in ["FGOS_STATE_HOME", "FGCTL_FROM", "FGCTL_VERSION"] {
        command.env_remove(name);
    }
    command.output().expect("spawn fgctl")
}

fn text(bytes: &[u8]) -> String {
    String::from_utf8_lossy(bytes).into_owned()
}

#[test]
fn version_flag_prints_one_identifying_line_and_exits_zero() {
    let dir = Scratch::new("version");
    let out = fgctl(dir.path(), &["--version"]);
    assert_eq!(out.status.code(), Some(0));
    let stdout = text(&out.stdout);
    assert!(stdout.starts_with("fgctl "), "{stdout}");
    assert_eq!(stdout.lines().count(), 1, "{stdout}");
    assert_eq!(text(&fgctl(dir.path(), &["version"]).stdout), stdout);
}

#[test]
fn version_json_is_a_bare_object_with_name_and_version() {
    let dir = Scratch::new("version-json");
    let out = fgctl(dir.path(), &["version", "--json"]);
    assert_eq!(out.status.code(), Some(0));
    let value: serde_json::Value = serde_json::from_slice(&out.stdout).expect("json on stdout");
    assert_eq!(value["name"], "fgctl");
    assert_eq!(value["version"], env!("CARGO_PKG_VERSION"));
    assert!(value.get("commit").is_some() && value.get("commitTime").is_some());
}

#[test]
fn every_verb_answers_help_on_stdout_with_exit_zero() {
    let dir = Scratch::new("help");
    for verb in [
        "stage", "status", "init", "upgrade", "repair", "verify", "version",
    ] {
        let out = fgctl(dir.path(), &[verb, "--help"]);
        assert_eq!(out.status.code(), Some(0), "{verb}: {}", text(&out.stderr));
        let stdout = text(&out.stdout);
        for field in ["Changes on disk", "Examples", "Exit codes", "Next"] {
            assert!(
                stdout.contains(field),
                "{verb} help lacks `{field}`:\n{stdout}"
            );
        }
        assert!(
            text(&out.stderr).is_empty(),
            "{verb}: {}",
            text(&out.stderr)
        );
    }
    for args in [&["--help"][..], &["help"], &["-h"], &["help", "upgrade"]] {
        let out = fgctl(dir.path(), args);
        assert_eq!(out.status.code(), Some(0), "{args:?}");
        assert!(!out.stdout.is_empty(), "{args:?}");
    }
}

#[test]
fn unknown_verb_exits_two_and_suggests_the_closest_verb() {
    let dir = Scratch::new("unknown-verb");
    let out = fgctl(dir.path(), &["upgrde"]);
    assert_eq!(out.status.code(), Some(2));
    let stderr = text(&out.stderr);
    assert!(stderr.contains("did you mean `fgctl upgrade`"), "{stderr}");
    assert!(out.stdout.is_empty());

    let far = fgctl(dir.path(), &["bogus"]);
    assert_eq!(far.status.code(), Some(2));
    assert!(
        text(&far.stderr).contains("fgctl --help"),
        "{}",
        text(&far.stderr)
    );
}

#[test]
fn unknown_flag_and_missing_value_exit_two_and_name_the_verb_help() {
    let dir = Scratch::new("unknown-flag");
    let out = fgctl(dir.path(), &["init", "--overide-pin", "x"]);
    assert_eq!(out.status.code(), Some(2));
    let stderr = text(&out.stderr);
    assert!(stderr.contains("did you mean `--override-pin`"), "{stderr}");
    assert!(stderr.contains("fgctl init --help"), "{stderr}");

    let missing = fgctl(dir.path(), &["stage", "--from"]);
    assert_eq!(missing.status.code(), Some(2));
    assert!(
        text(&missing.stderr).contains("--from needs a value"),
        "{}",
        text(&missing.stderr)
    );

    let repeated = fgctl(dir.path(), &["upgrade", "--from", "a", "--from", "b"]);
    assert_eq!(repeated.status.code(), Some(2));
    assert!(
        text(&repeated.stderr).contains("more than once"),
        "{}",
        text(&repeated.stderr)
    );

    let required = fgctl(dir.path(), &["stage"]);
    assert_eq!(required.status.code(), Some(2));
    assert!(
        text(&required.stderr).contains("--from"),
        "{}",
        text(&required.stderr)
    );
}

#[test]
fn no_arguments_print_task_ordered_get_started_and_exit_zero() {
    let dir = Scratch::new("no-args");
    let out = fgctl(dir.path(), &[]);
    assert_eq!(out.status.code(), Some(0));
    let stdout = text(&out.stdout);
    assert!(stdout.contains("Get started"), "{stdout}");
    let init = stdout.find("fgctl init").expect("init step");
    let run = stdout.find("fgos run").expect("run step");
    assert!(init < run, "{stdout}");
    assert!(stdout.contains("fgos doctor --json"), "{stdout}");
}
