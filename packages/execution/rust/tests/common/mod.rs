//! The machine a vector describes, as the tool probe reads it: `pathCommands` (the only programs on PATH),
//! `files` (relative path -> text under the repository root) and `git` (a repository with one commit, whose
//! `HEAD` is never a commit an index records). Shared by every golden file whose vectors probe tools.

use fgos_execution::tools::{Head, ToolProbe};
use serde_json::Value;

pub struct VectorProbe {
    path_commands: Vec<String>,
    files: Vec<(String, String)>,
    git: bool,
}

impl VectorProbe {
    pub fn of(vector: &Value) -> Self {
        let machine = vector.get("machine");
        VectorProbe {
            path_commands: machine
                .and_then(|m| m.get("pathCommands"))
                .and_then(Value::as_array)
                .map(|list| {
                    list.iter()
                        .filter_map(|c| c.as_str().map(str::to_string))
                        .collect()
                })
                .unwrap_or_default(),
            files: machine
                .and_then(|m| m.get("files"))
                .and_then(Value::as_object)
                .map(|files| {
                    files
                        .iter()
                        .map(|(path, text)| {
                            (path.clone(), text.as_str().unwrap_or_default().to_string())
                        })
                        .collect()
                })
                .unwrap_or_default(),
            git: machine.and_then(|m| m.get("git")) == Some(&Value::Bool(true)),
        }
    }
}

impl ToolProbe for VectorProbe {
    fn present(&self, command: &str) -> bool {
        !command.contains('/') && self.path_commands.iter().any(|c| c == command)
    }

    fn scan_target_exists(&self, scan_target: &str) -> bool {
        let dir = format!("{}/", scan_target.trim_end_matches('/'));
        self.files
            .iter()
            .any(|(path, _)| path == scan_target || path.starts_with(&dir))
    }

    fn index_commit(&self, scan_target: &str) -> Option<String> {
        let meta = format!("{}/meta.json", scan_target.trim_end_matches('/'));
        let (_, text) = self.files.iter().find(|(path, _)| *path == meta)?;
        serde_json::from_str::<Value>(text)
            .ok()?
            .get("lastCommit")?
            .as_str()
            .map(str::to_string)
    }

    fn head(&self) -> Head {
        if self.git {
            Head::Commit("the commit of the vector's repository".into())
        } else {
            Head::NotARepository
        }
    }
}
