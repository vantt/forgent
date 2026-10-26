//! Where an agent CLI keeps its own state on this machine, as the CLI
//! itself resolves it. One resolver per directory, shared by every reader
//! (Observe's transcripts, the mailbox's head finder), so the rule exists
//! once. Pure functions over the variables' values: the caller reads the
//! environment once.
use std::ffi::OsStr;
use std::path::PathBuf;

/// Claude Code's config directory: `CLAUDE_CONFIG_DIR` when it is set,
/// else `$HOME/.claude`; `None` when neither variable is set.
pub fn claude_config_dir(
    home: Option<&OsStr>,
    claude_config_dir: Option<&OsStr>,
) -> Option<PathBuf> {
    match claude_config_dir {
        Some(dir) => Some(PathBuf::from(dir)),
        None => home.map(|home| PathBuf::from(home).join(".claude")),
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn claude_config_dir_prefers_its_variable_then_home_and_is_none_without_either() {
        let home = OsStr::new("/home/u");
        let custom = OsStr::new("/srv/claude");
        assert_eq!(
            claude_config_dir(Some(home), Some(custom)),
            Some(PathBuf::from("/srv/claude"))
        );
        assert_eq!(
            claude_config_dir(None, Some(custom)),
            Some(PathBuf::from("/srv/claude"))
        );
        assert_eq!(
            claude_config_dir(Some(home), None),
            Some(PathBuf::from("/home/u/.claude"))
        );
        assert_eq!(claude_config_dir(None, None), None);
    }
}
