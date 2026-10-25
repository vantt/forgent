//! The one resolution of the fgOS state root and of the lock root under it.
//! Vectors: `packages/holder-lock/contracts/state-root.vectors.v1.json`.

use std::path::{Path, PathBuf};

/// The variable a resolved root is pinned under. The host exports it before
/// exec of the Node payload, and dispatch pins it into every child so a
/// sandbox `HOME` never moves the root.
pub const PINNED_ROOT_ENV: &str = "FGOS_STATE_ROOT";

/// Which input decided the root.
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum Source {
    /// `FGOS_STATE_ROOT`, used verbatim.
    Pinned,
    /// `FGOS_STATE_HOME`, used verbatim.
    FgosStateHome,
    /// `<XDG_STATE_HOME>/fgos`.
    XdgStateHome,
    /// `<HOME>/.local/state/fgos`.
    Home,
    /// `<USERPROFILE>/.local/state/fgos`, only when `HOME` is unset.
    Userprofile,
    /// `.local/state/fgos`, relative.
    RelativeFallback,
}

impl Source {
    /// The contract name of this source.
    pub fn as_str(self) -> &'static str {
        match self {
            Source::Pinned => "pinned",
            Source::FgosStateHome => "fgos-state-home",
            Source::XdgStateHome => "xdg-state-home",
            Source::Home => "home",
            Source::Userprofile => "userprofile",
            Source::RelativeFallback => "relative-fallback",
        }
    }
}

/// The state root of this process's environment and the input that decided it.
pub fn state_root() -> (PathBuf, Source) {
    state_root_from(|key| std::env::var(key).ok())
}

/// Creates the state root (and any missing parent) when absent, owner-only on
/// Unix whatever the process umask, so the Git door's trust check accepts it.
/// An existing directory is left exactly as it is.
pub fn create_state_root(root: &Path) -> std::io::Result<()> {
    let mut builder = std::fs::DirBuilder::new();
    builder.recursive(true);
    #[cfg(unix)]
    {
        use std::os::unix::fs::DirBuilderExt;
        builder.mode(0o700);
    }
    builder.create(root)
}

/// The lock root: `<state root>/locks`.
pub fn lock_root() -> PathBuf {
    state_root().0.join("locks")
}

/// [`state_root`] over any environment lookup (a variable `get` returns
/// `None` for is unset). A blank value (empty or only whitespace) of the
/// override variables counts as unset; a non-blank one is used untrimmed.
/// `HOME` set to the empty string is set.
pub fn state_root_from(get: impl Fn(&str) -> Option<String>) -> (PathBuf, Source) {
    let non_blank = |key: &str| get(key).filter(|value| !value.trim().is_empty());
    if let Some(pinned) = non_blank(PINNED_ROOT_ENV) {
        return (PathBuf::from(pinned), Source::Pinned);
    }
    if let Some(home) = non_blank("FGOS_STATE_HOME") {
        return (PathBuf::from(home), Source::FgosStateHome);
    }
    if let Some(xdg) = non_blank("XDG_STATE_HOME") {
        return (PathBuf::from(xdg).join("fgos"), Source::XdgStateHome);
    }
    if let Some(home) = get("HOME") {
        return (PathBuf::from(home).join(".local/state/fgos"), Source::Home);
    }
    if let Some(profile) = get("USERPROFILE") {
        return (PathBuf::from(profile).join(".local/state/fgos"), Source::Userprofile);
    }
    (PathBuf::from(".local/state/fgos"), Source::RelativeFallback)
}
