//! The machine facts the executor model reads. The host implements [`Machine`] over the real machine; a test
//! implements it over a described one. Later derivations that need more (the lease state, a tool's index) add
//! their own small trait next to their module; this one stays what the facts of this crate need.

/// One entry of the machine's confinement backend registry, as the posture check reads it.
#[derive(Debug, Clone, PartialEq, Eq)]
pub struct Backend {
    /// `false` only when the registry says `enabled: false`; an entry that does not say is enabled.
    pub enabled: bool,
    /// The registry's `type` (`bwrap` is the only one that can carry a posture).
    pub kind: String,
    /// The registry's `executable`; `None` when it names none (the posture check then looks for `bwrap`).
    pub executable: Option<String>,
}

pub trait Machine {
    /// Whether `program` can be started: a bare name found on PATH, or a path that is an executable file.
    fn on_path(&self, program: &str) -> bool;
    /// The registry entry named `id`. `None` when there is no such entry, no registry, or a registry that is
    /// unreadable or invalid (such a registry carries nothing).
    fn posture_backend(&self, id: &str) -> Option<Backend>;
    /// Whether the session runs inside herdr.
    fn herdr_present(&self) -> bool;
    /// The user's home directory, which a `~`, `${HOME}` or `$HOME` in an account's login store stands for.
    fn home_dir(&self) -> Option<String>;
}
