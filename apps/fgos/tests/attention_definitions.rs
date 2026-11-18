//! The shipped attention definitions (`core/attention/definitions`), run by the real binary over real records: plans
//! from a git history read by the composition root's plan source, a head state and a run attempt written through
//! `fgos metrics record`, and the threshold from the project config file. No code names a definition; detection is
//! the files.

#![cfg(unix)]

use serde_json::Value;
use std::io::Write;
use std::os::unix::fs::PermissionsExt;
use std::path::{Path, PathBuf};
use std::process::{Command, Stdio};

const SINCE: &str = "2026-11-18T10:00:00Z";
const NOW: &str = "2026-11-18T12:00:00Z";
const STALLED: &str = "261118-0900-stalled";
const ATTEMPTED: &str = "261118-0900-attempted";

fn definitions_dir() -> PathBuf {
    Path::new(env!("CARGO_MANIFEST_DIR")).join("../../core/attention/definitions")
}

/// A scratch project with its own state root and home, so neither the machine's Git door state nor its global
/// config reaches the answer.
struct Project {
    base: PathBuf,
    root: PathBuf,
}

impl Project {
    fn new(name: &str) -> Self {
        let base =
            std::env::temp_dir().join(format!("fgos_attention_{name}_{}", std::process::id()));
        let _ = std::fs::remove_dir_all(&base);
        let root = base.join("root");
        for dir in [&root, &base.join("state"), &base.join("home")] {
            std::fs::create_dir_all(dir).unwrap();
            std::fs::set_permissions(dir, std::fs::Permissions::from_mode(0o700)).unwrap();
        }
        let project = Self { base, root };
        project.git(&["init", "-q", "-b", "main"]);
        // A root commit has no parent to compare with, so the plans come after one.
        project.git(&["commit", "-q", "--allow-empty", "-m", "root"]);
        project
    }

    fn command(&self, program: impl AsRef<std::ffi::OsStr>) -> Command {
        let mut command = Command::new(program);
        command
            .current_dir(&self.root)
            .env("FGOS_STATE_ROOT", self.base.join("state"))
            .env("HOME", self.base.join("home"));
        command
    }

    fn git(&self, args: &[&str]) {
        let status = self
            .command("git")
            .args(["-c", "user.name=t", "-c", "user.email=t@example.invalid"])
            .args(args)
            .env("GIT_AUTHOR_DATE", "2026-11-18T09:00:00Z")
            .env("GIT_COMMITTER_DATE", "2026-11-18T09:00:00Z")
            .status()
            .unwrap();
        assert!(status.success(), "git {args:?}");
    }

    /// A plan under the plan contract committed as running at 09:00, before the caller's window opens.
    fn running_plan(&self, dir: &str) {
        let plan = self.root.join("plans").join(dir);
        std::fs::create_dir_all(&plan).unwrap();
        std::fs::write(
            plan.join("plan.md"),
            "---\ncontract: plan-v1\nstatus: running\npriority: P1\n---\n",
        )
        .unwrap();
        self.git(&["add", "-A"]);
        self.git(&["commit", "-qm", dir]);
    }

    fn metrics(&self, args: &[&str], stdin: &str) -> Value {
        let mut child = self
            .command(env!("CARGO_BIN_EXE_fgos"))
            .arg("metrics")
            .args(args)
            .arg("--dir")
            .arg(&self.root)
            .arg("--json")
            .stdin(Stdio::piped())
            .stdout(Stdio::piped())
            .stderr(Stdio::piped())
            .spawn()
            .unwrap();
        child
            .stdin
            .take()
            .unwrap()
            .write_all(stdin.as_bytes())
            .unwrap();
        let output = child.wait_with_output().unwrap();
        let stdout = String::from_utf8_lossy(&output.stdout);
        assert!(
            output.status.success(),
            "metrics {args:?}: stdout={stdout} stderr={}",
            String::from_utf8_lossy(&output.stderr)
        );
        serde_json::from_str::<Value>(&stdout).unwrap()["data"].clone()
    }

    fn record(&self, line: &str) {
        let written = self.metrics(&["record", "--json", "-"], line);
        assert_eq!(written["written"], 1, "{written}");
    }

    /// Each shipped definition's answer: its row subjects, or the reason it is unmeasured or failed.
    fn attention(&self) -> Vec<(String, Result<Vec<String>, String>)> {
        let defs = definitions_dir();
        let answer = self.metrics(
            &[
                "query",
                "--def",
                defs.to_str().unwrap(),
                "--since",
                SINCE,
                "--now",
                NOW,
            ],
            "",
        );
        answer["definitions"]
            .as_array()
            .unwrap()
            .iter()
            .map(|d| {
                let name = d["name"].as_str().unwrap().to_owned();
                let gap = d["unmeasured"].as_str().or(d["error"].as_str());
                let rows = match gap {
                    Some(reason) => Err(reason.to_owned()),
                    None => Ok(d["rows"]
                        .as_array()
                        .unwrap()
                        .iter()
                        .map(|r| r["group"]["subject.id"].as_str().unwrap().to_owned())
                        .collect()),
                };
                (name, rows)
            })
            .collect()
    }
}

impl Drop for Project {
    fn drop(&mut self) {
        let _ = std::fs::remove_dir_all(&self.base);
    }
}

#[test]
fn the_shipped_attention_definitions_flag_a_gone_head_and_a_stalled_plan_and_the_config_key_moves_the_threshold(
) {
    let project = Project::new("shipped");
    project.running_plan(STALLED);
    project.running_plan(ATTEMPTED);
    project.record(
        r#"{"id":"head-1","kind":"fgos.head.state","ts":"2026-11-18T11:00:00Z","subject":{"kind":"head","id":"head:planner-x"},"attrs":{"fgos.head.state":"gone"}}"#,
    );
    // A run attempt names its plan by the ref a unit carries, `plans/<dir>`: the same id the plan source gives it.
    project.record(&format!(
        r#"{{"id":"attempt-1","kind":"fgos.run.attempt","ts":"2026-11-18T11:30:00Z","subject":{{"kind":"run","id":"unit/r1"}},"refs":[{{"kind":"plan","id":"plans/{ATTEMPTED}"}}],"attrs":{{"fgos.outcome":"pass"}}}}"#
    ));

    // The standard threshold (60 minutes): the plan idle since 09:00 is flagged although it went running before the
    // caller's window; the plan with an attempt at 11:30 is not.
    let standard = vec![
        (
            "head-gone".to_owned(),
            Ok(vec!["head:planner-x".to_owned()]),
        ),
        (
            "plan-no-progress".to_owned(),
            Ok(vec![format!("plans/{STALLED}")]),
        ),
    ];
    assert_eq!(project.attention(), standard);

    // Five hours reaches back past the 09:00 commit, so no plan is stalled any more.
    std::fs::create_dir_all(project.root.join(".fgos")).unwrap();
    std::fs::write(
        project.root.join(".fgos/config.yaml"),
        "dispatch:\n  attention:\n    planNoProgressMinutes: 300\n",
    )
    .unwrap();
    let answers = project.attention();
    assert_eq!(answers[0], standard[0]);
    assert_eq!(answers[1], ("plan-no-progress".to_owned(), Ok(vec![])));
}
