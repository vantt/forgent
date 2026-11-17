//! The machine a vector describes, shared by the replays of the Execution contracts.

use fgos_execution::ports::{Backend, Machine};
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
