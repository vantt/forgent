//! Where an agent CLI keeps its own state on this machine, as the CLI
//! itself resolves it. One resolver per directory, shared by every reader
//! (Observe's transcripts, the mailbox's head finder), so the rule exists
//! once. Pure functions over the variables' values: the caller reads the
//! environment once.
use serde_json::Value;
use std::ffi::OsStr;
use std::io::Read;
use std::path::{Path, PathBuf};

/// The most of a Claude Code session file [`read_claude_session`] reads; the file is a few hundred bytes.
const MAX_SESSION_FILE_BYTES: u64 = 64 * 1024;

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

/// What Claude Code keeps about one of its own processes in
/// `<config dir>/sessions/<pid>.json` while it runs: the process, its session,
/// the session's name and the messaging socket it listens on (a new one on
/// every restart). Every field is optional: a reader checks what it relies on.
#[derive(Debug, Clone, Default, PartialEq, Eq)]
pub struct ClaudeSession {
    pub pid: Option<u32>,
    pub session_id: Option<String>,
    /// The process start time text, as process facts read it (`procStart`, a string or a number in the file).
    pub proc_start: Option<String>,
    pub name: Option<String>,
    /// Where the name came from (`derived` by the CLI, or given by `/rename`).
    pub name_source: Option<String>,
    pub socket: Option<String>,
}

/// The fields of one parsed session file; `None` when the document is not an
/// object. The one reader of the file's shape, shared by the mailbox's head
/// finder and the supervisor's bind.
pub fn claude_session(doc: &Value) -> Option<ClaudeSession> {
    let doc = doc.as_object()?;
    let text = |key: &str| {
        doc.get(key)
            .and_then(Value::as_str)
            .filter(|v| !v.is_empty())
            .map(String::from)
    };
    Some(ClaudeSession {
        pid: doc
            .get("pid")
            .and_then(Value::as_u64)
            .and_then(|pid| u32::try_from(pid).ok()),
        session_id: text("sessionId"),
        proc_start: match doc.get("procStart") {
            Some(Value::String(text)) => Some(text.clone()),
            Some(Value::Number(n)) => Some(n.to_string()),
            _ => None,
        },
        name: text("name"),
        name_source: text("nameSource"),
        socket: text("messagingSocketPath"),
    })
}

/// The session file of process `pid` under `sessions_dir`, read once (a
/// regular file, at most 64 KiB) and parsed by [`claude_session`]; `None` when
/// it is missing, unreadable or names another pid.
pub fn read_claude_session(sessions_dir: &Path, pid: u32) -> Option<ClaudeSession> {
    let path = sessions_dir.join(format!("{pid}.json"));
    if !std::fs::symlink_metadata(&path).ok()?.is_file() {
        return None;
    }
    let mut bytes = Vec::new();
    std::fs::File::open(&path)
        .ok()?
        .take(MAX_SESSION_FILE_BYTES)
        .read_to_end(&mut bytes)
        .ok()?;
    let doc: Value = serde_json::from_slice(&bytes).ok()?;
    claude_session(&doc).filter(|session| session.pid == Some(pid))
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

    #[test]
    fn a_session_file_is_read_with_its_name_socket_and_start_time_and_only_for_its_own_pid() {
        let dir = std::env::temp_dir().join(format!("fgos-cli-dirs-{}", std::process::id()));
        std::fs::create_dir_all(&dir).unwrap();
        std::fs::write(
            dir.join("42.json"),
            r#"{"pid":42,"sessionId":"uuid-1","procStart":"123","name":"lead-ab","nameSource":"derived","messagingSocketPath":"/tmp/s.sock"}"#,
        )
        .unwrap();
        std::fs::write(dir.join("43.json"), r#"{"pid":42,"procStart":7}"#).unwrap();
        let read = read_claude_session(&dir, 42).unwrap();
        assert_eq!(
            read,
            ClaudeSession {
                pid: Some(42),
                session_id: Some("uuid-1".into()),
                proc_start: Some("123".into()),
                name: Some("lead-ab".into()),
                name_source: Some("derived".into()),
                socket: Some("/tmp/s.sock".into()),
            }
        );
        // A file under another pid's name, a missing file and a document that is not an object answer nothing.
        assert_eq!(read_claude_session(&dir, 43), None);
        assert_eq!(read_claude_session(&dir, 44), None);
        assert_eq!(claude_session(&serde_json::json!([1])), None);
        assert_eq!(
            claude_session(&serde_json::json!({"procStart": 7}))
                .unwrap()
                .proc_start
                .as_deref(),
            Some("7")
        );
        std::fs::remove_dir_all(&dir).unwrap();
    }
}
