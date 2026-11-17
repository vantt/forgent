//! The machine a vector describes, shared by the replays of the Execution contracts: [`VectorMachine`] for the
//! executor-model facts, [`VectorProbe`] for the tool probe (`pathCommands`, `files` relative to the repository
//! root, `git`: a repository with one commit, whose `HEAD` is never a commit an index records). Each replay reads
//! the part its vectors describe; the allow covers the part it leaves unread.
#![allow(dead_code)]

use fgos_execution::ports::{Backend, Machine};
use fgos_execution::tools::{Head, ToolProbe};
use serde_json::{json, Value};

pub struct VectorMachine {
    path_commands: Vec<String>,
    registry: Option<Value>,
    home: Option<String>,
    herdr: bool,
}

impl VectorMachine {
    /// The machine of `vector`, inside herdr when `herdr` says so.
    pub fn of(vector: &Value, herdr: bool) -> Self {
        let machine = vector.get("machine");
        let registry = machine
            .and_then(|m| m.get("registry"))
            .and_then(|doc| match doc {
                Value::String(raw) => serde_json::from_str::<Value>(raw).ok(),
                Value::Null => None,
                other => Some(other.clone()),
            })
            .filter(|doc| {
                doc.get("contract") == Some(&json!("confinement-backend-registry.v1"))
                    && doc.get("confinementBackends").is_some_and(Value::is_object)
            });
        VectorMachine {
            path_commands: machine
                .and_then(|m| m.get("pathCommands"))
                .and_then(Value::as_array)
                .map(|list| {
                    list.iter()
                        .filter_map(|c| c.as_str().map(str::to_string))
                        .collect()
                })
                .unwrap_or_default(),
            registry,
            home: machine
                .and_then(|m| m.get("home"))
                .and_then(Value::as_str)
                .map(str::to_string),
            herdr,
        }
    }
}

impl Machine for VectorMachine {
    fn on_path(&self, program: &str) -> bool {
        !program.contains('/') && self.path_commands.iter().any(|c| c == program)
    }

    fn posture_backend(&self, id: &str) -> Option<Backend> {
        let instance = self
            .registry
            .as_ref()?
            .get("confinementBackends")?
            .get(id)?;
        Some(Backend {
            enabled: instance.get("enabled") != Some(&json!(false)),
            kind: instance
                .get("type")
                .and_then(Value::as_str)
                .unwrap_or_default()
                .to_string(),
            executable: instance
                .get("executable")
                .and_then(Value::as_str)
                .filter(|e| !e.is_empty())
                .map(str::to_string),
        })
    }

    fn herdr_present(&self) -> bool {
        self.herdr
    }

    fn home_dir(&self) -> Option<String> {
        self.home.clone()
    }
}

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
