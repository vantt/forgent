//! The holder-lock doctor rows on Windows, through the real `fgos` binary: the guarantee reads
//! `lockfileex`/`kernel`, the two-process probe runs over the `lock-hold` helper (this crate's own binary plays
//! the helper role), and the borrow vectors run with real git. The rows a Node payload would judge are not
//! asked for here; the doctor answers whatever they say.
#![cfg(windows)]

use std::path::PathBuf;
use std::process::Command;

fn fresh_dir(name: &str) -> PathBuf {
    let dir = std::env::temp_dir().join(format!("fgos-doctor-lock-{name}-{}", std::process::id()));
    let _ = std::fs::remove_dir_all(&dir);
    std::fs::create_dir_all(&dir).unwrap();
    dir
}

fn row(report: &serde_json::Value, id: &str) -> serde_json::Value {
    report["data"]["checks"]
        .as_array()
        .expect("a doctor report lists its checks")
        .iter()
        .find(|check| check["id"] == id)
        .unwrap_or_else(|| panic!("the report has no row {id}"))
        .clone()
}

#[test]
fn the_lock_rows_pass_on_windows_with_a_green_probe_and_green_borrow_vectors() {
    let base = fresh_dir("rows");
    let project = base.join("project");
    std::fs::create_dir_all(project.join(".fgos")).unwrap();
    let git = |args: &[&str]| {
        let status = Command::new("git")
            .args(args)
            .current_dir(&project)
            .status()
            .unwrap();
        assert!(status.success(), "git {args:?}");
    };
    git(&["init", "-q"]);
    let home = base.join("home");
    let state = base.join("state");
    std::fs::create_dir_all(&home).unwrap();
    std::fs::create_dir_all(&state).unwrap();
    let run = |args: &[&str]| {
        let output = Command::new(env!("CARGO_BIN_EXE_fgos"))
            .arg("doctor")
            .args(args)
            .current_dir(&project)
            .env("HOME", &home)
            .env("USERPROFILE", &home)
            .env("FGOS_STATE_ROOT", &state)
            .output()
            .expect("failed to execute fgos");
        serde_json::from_slice::<serde_json::Value>(&output.stdout).unwrap_or_else(|error| {
            panic!(
                "no doctor report ({error}): {}",
                String::from_utf8_lossy(&output.stderr)
            )
        })
    };
    // The lock directories are made by the fix; the row then measures them.
    let fixed = run(&["--fix", "--json"]);
    let kernel = row(&fixed, "lock-kernel-semantics");
    assert_eq!(kernel["passed"], true, "{kernel}");
    let text = kernel["message"].as_str().unwrap();
    assert!(!text.starts_with("warning:"), "{text}");
    assert!(
        text.contains("\"driver\":\"lockfileex\",\"exclusion\":\"kernel\""),
        "{text}"
    );
    assert!(text.contains("two-process probe green"), "{text}");
    let vectors = row(&fixed, "lock-borrow-vectors");
    assert_eq!(vectors["passed"], true, "{vectors}");
    assert!(
        vectors["message"]
            .as_str()
            .unwrap()
            .starts_with("all 4 vectors and the sibling check green"),
        "{vectors}"
    );
    let _ = std::fs::remove_dir_all(&base);
}
