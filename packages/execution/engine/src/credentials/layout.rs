//! The login layouts. Each knows where its login lives, when it expires, how to make a copy look due, and how
//! to merge a newer entry into the source. A read result is `Read` with entries `{key, expiresMs, dueMs}`;
//! `due_ms` is when the CLI itself would renew it.

use std::fs;
use std::path::{Path, PathBuf};

use serde_json::Value;

use super::files::*;
use super::ports::{OmpRow, RowUpdate, SqliteAdapter, SqliteFailure};

/// Codex renews a login on its own when the access token is within five minutes of expiry, and falls back to
/// the age of `last_refresh` (eight days) when the token cannot be read; a login is treated as due at whichever
/// of the two comes first.
pub const CODEX_REFRESH_INTERVAL_MS: f64 = 8.0 * 24.0 * 60.0 * MINUTE_MS;

const CODEX_AUTH_CLAIM: &str = "https://api.openai.com/auth";

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum Layout {
    PiAuthJson,
    CodexAuthJson,
    OmpAgentDb,
    ClaudeConfig,
    ClaudeHome,
}

pub const ALL_LAYOUTS: [Layout; 5] = [
    Layout::PiAuthJson,
    Layout::CodexAuthJson,
    Layout::OmpAgentDb,
    Layout::ClaudeConfig,
    Layout::ClaudeHome,
];

/// What a layout's entry carries beyond its key and expiry.
#[derive(Debug, Clone)]
pub enum EntryValue {
    /// A pi entry, or the claude `claudeAiOauth` object.
    Json(Value),
    Codex {
        tokens: Value,
        last_refresh: Option<Value>,
    },
    Omp(OmpRow),
}

#[derive(Debug, Clone)]
pub struct Entry {
    pub key: String,
    /// Whose entry this is (pi: the key, omp: the row's provider); `None` for a store of one provider.
    pub owner: Option<String>,
    pub expires_ms: f64,
    pub due_ms: f64,
    /// Only ever compared in memory, never returned or printed.
    pub refresh: Option<String>,
    pub value: EntryValue,
}

pub struct Read {
    pub entries: Vec<Entry>,
    pub doc: Option<Value>,
    pub raw: Option<String>,
}

fn to_ms(expires: f64) -> f64 {
    if expires < 1e12 {
        expires * 1000.0
    } else {
        expires
    }
}

fn finite(value: Option<&Value>) -> Option<f64> {
    value.and_then(Value::as_f64).filter(|n| n.is_finite())
}

/// The refresh token of an entry: the first of `refresh`, `refresh_token`, `refreshToken` that is a string.
pub fn refresh_of(object: &Value) -> Option<String> {
    ["refresh", "refresh_token", "refreshToken"]
        .iter()
        .find_map(|name| object.get(name).and_then(Value::as_str).map(str::to_owned))
}

/// The account an access token was issued to, as the provider signed it (the ChatGPT account claim of an
/// OpenAI token). A plain field beside the token is the agent's word and never counts.
fn token_account(token: &Value) -> Option<String> {
    let jwt = jwt_payload(token)?;
    let id = jwt
        .payload
        .get(CODEX_AUTH_CLAIM)?
        .get("chatgpt_account_id")?
        .as_str()?;
    (!id.is_empty()).then(|| id.to_owned())
}

pub fn omp_key(row: &OmpRow) -> String {
    format!("{}\u{0}{}", row.id, row.provider)
}

fn omp_entries(rows: &[OmpRow]) -> Vec<Entry> {
    rows.iter()
        .filter_map(|row| {
            let data: Value = serde_json::from_str(&row.data).ok()?;
            let expires = finite(data.get("expires")).filter(|_| data.is_object())?;
            Some(Entry {
                key: omp_key(row),
                owner: Some(row.provider.clone()),
                expires_ms: expires,
                due_ms: expires,
                refresh: refresh_of(&data),
                value: EntryValue::Omp(row.clone()),
            })
        })
        .collect()
}

/// A copy entry replaces the source's only when its expiry is strictly later and its refresh token is a
/// different one; `require_future` is for a fresh renewal, where an expiry already past means "not renewed".
pub fn is_replacement(
    copy: &Entry,
    source_expires: f64,
    source_refresh: Option<&str>,
    now: f64,
    require_future: bool,
) -> bool {
    copy.expires_ms > source_expires
        && (!require_future || copy.expires_ms > now)
        && refresh_differs(copy.refresh.as_deref(), source_refresh)
}

fn refresh_differs(copy: Option<&str>, source: Option<&str>) -> bool {
    match (copy, source) {
        (None, s) => s.is_none(),
        (Some(_), None) => true,
        (Some(c), Some(s)) => c != s,
    }
}

pub struct ApplyArgs<'a> {
    pub now: f64,
    pub key: Option<&'a str>,
    pub require_future: bool,
    pub sqlite: &'a dyn SqliteAdapter,
}

impl Layout {
    pub fn name(self) -> &'static str {
        match self {
            Layout::PiAuthJson => "pi-auth-json",
            Layout::CodexAuthJson => "codex-auth-json",
            Layout::OmpAgentDb => "omp-agent-db",
            Layout::ClaudeConfig => "claude-config-credentials-json",
            Layout::ClaudeHome => "claude-credentials-json",
        }
    }

    pub fn from_name(name: &str) -> Option<Layout> {
        ALL_LAYOUTS.into_iter().find(|l| l.name() == name)
    }

    pub fn files(self) -> &'static [&'static str] {
        match self {
            Layout::PiAuthJson | Layout::CodexAuthJson => &["auth.json"],
            Layout::OmpAgentDb => &["agent.db"],
            Layout::ClaudeConfig => &[".credentials.json"],
            Layout::ClaudeHome => &[".claude/.credentials.json"],
        }
    }

    /// Files SQLite keeps beside the store while it is open. A login renewed after the last checkpoint lives
    /// only in the write-ahead log; a hot rollback journal is kept for the files it guards.
    pub fn sidecars(self) -> &'static [&'static str] {
        match self {
            Layout::OmpAgentDb => &["agent.db-wal", "agent.db-journal"],
            _ => &[],
        }
    }

    /// A copy carries the source's own refresh token, so a seat that refreshed inside its home would spend it.
    pub fn seat_must_not_refresh(self) -> bool {
        matches!(self, Layout::ClaudeConfig | Layout::ClaudeHome)
    }

    fn claude_file(self) -> &'static str {
        self.files()[0]
    }

    pub fn identity(self, entry: &Entry) -> Option<String> {
        match (&entry.value, self) {
            (EntryValue::Json(v), Layout::PiAuthJson) => token_account(v.get("access")?),
            (EntryValue::Codex { tokens, .. }, _) => token_account(tokens.get("access_token")?),
            (EntryValue::Omp(row), _) => {
                let data: Value = serde_json::from_str(&row.data).ok()?;
                token_account(data.get("access")?)
            }
            _ => None,
        }
    }

    pub fn read(self, home: &Path, agent: bool, sqlite: &dyn SqliteAdapter) -> Result<Read, Code> {
        match self {
            Layout::PiAuthJson => {
                let parsed = read_json_file(&home.join("auth.json"), agent)?;
                let map = parsed.doc.as_object().ok_or("unexpected-shape")?;
                let mut entries = Vec::new();
                for (key, value) in map {
                    if value.is_object()
                        && value.get("type").and_then(Value::as_str) == Some("oauth")
                    {
                        if let Some(expires) = finite(value.get("expires")) {
                            let ms = to_ms(expires);
                            entries.push(Entry {
                                key: key.clone(),
                                owner: Some(key.clone()),
                                expires_ms: ms,
                                due_ms: ms,
                                refresh: refresh_of(value),
                                value: EntryValue::Json(value.clone()),
                            });
                        }
                    }
                }
                if entries.is_empty() {
                    return Err("unexpected-shape");
                }
                Ok(Read {
                    entries,
                    doc: Some(parsed.doc),
                    raw: Some(parsed.raw),
                })
            }
            Layout::CodexAuthJson => {
                let parsed = read_json_file(&home.join("auth.json"), agent)?;
                let tokens = parsed
                    .doc
                    .get("tokens")
                    .filter(|t| {
                        t.is_object() && t.get("access_token").is_some_and(Value::is_string)
                    })
                    .ok_or("unexpected-shape")?
                    .clone();
                let exp = jwt_expiry_ms(&tokens["access_token"]);
                let by_age = parsed
                    .doc
                    .get("last_refresh")
                    .and_then(Value::as_str)
                    .and_then(parse_date_ms)
                    .map(|t| t + CODEX_REFRESH_INTERVAL_MS);
                if exp.is_none() && by_age.is_none() {
                    return Err("unexpected-shape");
                }
                let due = exp
                    .unwrap_or(f64::INFINITY)
                    .min(by_age.unwrap_or(f64::INFINITY));
                let entry = Entry {
                    key: "codex".into(),
                    owner: None,
                    expires_ms: exp.or(by_age).unwrap_or(due),
                    due_ms: due,
                    refresh: refresh_of(&tokens),
                    value: EntryValue::Codex {
                        tokens,
                        last_refresh: parsed.doc.get("last_refresh").cloned(),
                    },
                };
                Ok(Read {
                    entries: vec![entry],
                    doc: Some(parsed.doc),
                    raw: Some(parsed.raw),
                })
            }
            Layout::OmpAgentDb => {
                let file = home.join("agent.db");
                let checked = if agent {
                    omp_agent_files_check(home)
                } else {
                    fs::metadata(&file).map(|_| ())
                };
                checked.map_err(|e| read_fail_code(&e))?;
                let rows = sqlite.oauth_rows(&file).map_err(|e| {
                    if e == SqliteFailure::Unavailable {
                        "sqlite-unavailable"
                    } else {
                        "unreadable-db"
                    }
                })?;
                let entries = omp_entries(&rows);
                if entries.is_empty() {
                    return Err("unexpected-shape");
                }
                Ok(Read {
                    entries,
                    doc: None,
                    raw: None,
                })
            }
            Layout::ClaudeConfig | Layout::ClaudeHome => {
                let parsed = read_json_file(&home.join(self.claude_file()), agent)?;
                let oauth = parsed
                    .doc
                    .get("claudeAiOauth")
                    .filter(|o| o.is_object())
                    .ok_or("unexpected-shape")?;
                let expires = to_ms(finite(oauth.get("expiresAt")).ok_or("unexpected-shape")?);
                let entry = Entry {
                    key: "claudeAiOauth".into(),
                    owner: None,
                    expires_ms: expires,
                    due_ms: expires,
                    refresh: refresh_of(oauth),
                    value: EntryValue::Json(oauth.clone()),
                };
                Ok(Read {
                    entries: vec![entry],
                    doc: Some(parsed.doc),
                    raw: Some(parsed.raw),
                })
            }
        }
    }

    /// Make a scratch copy say "due" so the CLI renews it before its call; the refresh token is untouched.
    pub fn mark_due(
        self,
        home: &Path,
        keys: &[String],
        now: f64,
        sqlite: &dyn SqliteAdapter,
    ) -> Result<(), String> {
        match self {
            Layout::PiAuthJson => {
                let file = home.join("auth.json");
                let mut parsed = read_json_file(&file, false).map_err(str::to_owned)?;
                for key in keys {
                    if let Some(entry) = parsed.doc.get_mut(key).filter(|e| e.is_object()) {
                        let expires = entry.get("expires").and_then(Value::as_f64).unwrap_or(0.0);
                        let due = if expires < 1e12 {
                            (now / 1000.0).floor() - 3600.0
                        } else {
                            now - 60.0 * MINUTE_MS
                        };
                        entry["expires"] = Value::from(due as i64);
                    }
                }
                write_plain(&file, serialize_json(&parsed.doc, &parsed.raw).as_bytes())
                    .map_err(|_| "write-failed".to_owned())
            }
            Layout::CodexAuthJson => {
                // Both rules are made to say "due": `last_refresh` long ago, and the access token's `exp` claim
                // moved into the past (only the payload segment, which Codex reads without verifying).
                let file = home.join("auth.json");
                let mut parsed = read_json_file(&file, false).map_err(str::to_owned)?;
                parsed.doc["last_refresh"] = Value::from("2000-01-01T00:00:00Z");
                if let Some(mut jwt) = parsed
                    .doc
                    .get("tokens")
                    .and_then(|t| t.get("access_token"))
                    .and_then(jwt_payload)
                {
                    jwt.payload.insert(
                        "exp".into(),
                        Value::from(((now / 1000.0).floor() - 3600.0) as i64),
                    );
                    jwt.parts[1] = b64url_encode(
                        serde_json::to_string(&Value::Object(jwt.payload))
                            .unwrap_or_default()
                            .as_bytes(),
                    );
                    parsed.doc["tokens"]["access_token"] = Value::from(jwt.parts.join("."));
                }
                write_plain(&file, serialize_json(&parsed.doc, &parsed.raw).as_bytes())
                    .map_err(|_| "write-failed".to_owned())
            }
            Layout::OmpAgentDb => {
                let past = now - 60.0 * MINUTE_MS;
                sqlite
                    .update_rows(&home.join("agent.db"), &mut |rows| {
                        Ok(omp_entries(rows)
                            .into_iter()
                            .filter(|e| keys.contains(&e.key))
                            .filter_map(|e| match e.value {
                                EntryValue::Omp(row) => {
                                    let mut data: Value = serde_json::from_str(&row.data).ok()?;
                                    data["expires"] = Value::from(past as i64);
                                    Some(RowUpdate {
                                        id: row.id,
                                        provider: row.provider,
                                        data: serde_json::to_string(&data).ok()?,
                                        updated_at: None,
                                    })
                                }
                                _ => None,
                            })
                            .collect())
                    })
                    .map(|_| ())
            }
            Layout::ClaudeConfig | Layout::ClaudeHome => {
                let target = home.join(self.claude_file());
                let mut parsed = read_json_file(&target, false).map_err(str::to_owned)?;
                parsed.doc["claudeAiOauth"]["expiresAt"] =
                    Value::from((now - 60.0 * MINUTE_MS) as i64);
                write_plain(&target, serialize_json(&parsed.doc, &parsed.raw).as_bytes())
                    .map_err(|_| "write-failed".to_owned())
            }
        }
    }

    /// Merge the copy's entries into the source. The error is a fixed code (`entry-unidentified`,
    /// `source-changing`, a read code) or `write-failed`.
    pub fn apply(
        self,
        source_home: &Path,
        copy: &Read,
        args: &ApplyArgs<'_>,
    ) -> Result<Vec<String>, String> {
        match self {
            Layout::PiAuthJson => {
                let file = source_home.join("auth.json");
                for _ in 0..3 {
                    let mut source = read_json_file(&file, false).map_err(str::to_owned)?;
                    if !source.doc.is_object() {
                        return Err("unexpected-shape".into());
                    }
                    let mut applied = Vec::new();
                    for entry in &copy.entries {
                        if args.key.is_some_and(|k| k != entry.key) {
                            continue;
                        }
                        let current = source.doc.get(&entry.key).filter(|c| {
                            c.is_object() && c.get("type").and_then(Value::as_str) == Some("oauth")
                        });
                        let Some(expires) = current.and_then(|c| finite(c.get("expires"))) else {
                            if args.key.is_some() {
                                return Err("entry-unidentified".into());
                            }
                            continue;
                        };
                        let refresh = refresh_of(current.unwrap_or(&Value::Null));
                        if is_replacement(
                            entry,
                            to_ms(expires),
                            refresh.as_deref(),
                            args.now,
                            args.require_future,
                        ) {
                            if let EntryValue::Json(value) = &entry.value {
                                source.doc[&entry.key] = value.clone();
                                applied.push(entry.key.clone());
                            }
                        }
                    }
                    if applied.is_empty() {
                        return Ok(applied);
                    }
                    if write_if_unchanged(
                        &file,
                        &source.raw,
                        &serialize_json(&source.doc, &source.raw),
                    )? {
                        return Ok(applied);
                    }
                }
                Err("source-changing".into())
            }
            Layout::CodexAuthJson => {
                let file = source_home.join("auth.json");
                for _ in 0..3 {
                    let source = self
                        .read(source_home, false, args.sqlite)
                        .map_err(str::to_owned)?;
                    let (current, next) = (&source.entries[0], copy.entries.first());
                    let Some(next) = next.filter(|n| {
                        is_replacement(
                            n,
                            current.expires_ms,
                            current.refresh.as_deref(),
                            args.now,
                            args.require_future,
                        )
                    }) else {
                        return Ok(vec![]);
                    };
                    let EntryValue::Codex {
                        tokens,
                        last_refresh,
                    } = &next.value
                    else {
                        return Ok(vec![]);
                    };
                    let (mut doc, raw) = (
                        source.doc.unwrap_or(Value::Null),
                        source.raw.unwrap_or_default(),
                    );
                    doc["tokens"] = tokens.clone();
                    if let Some(last) = last_refresh {
                        doc["last_refresh"] = last.clone();
                    }
                    if write_if_unchanged(&file, &raw, &serialize_json(&doc, &raw))? {
                        return Ok(vec!["codex".into()]);
                    }
                }
                Err("source-changing".into())
            }
            Layout::OmpAgentDb => {
                // A row update in one transaction, never a replacement of the file: the owner's omp may hold the
                // database open, and every other row and column must stay as it is.
                let updates =
                    args.sqlite
                        .update_rows(&source_home.join("agent.db"), &mut |rows| {
                            let current = omp_entries(rows);
                            let mut updates = Vec::new();
                            for entry in &copy.entries {
                                if args.key.is_some_and(|k| k != entry.key) {
                                    continue;
                                }
                                let target = current.iter().find(|c| c.key == entry.key);
                                if target.is_none() && args.key.is_some() {
                                    return Err("entry-unidentified".to_owned());
                                }
                                let (Some(target), EntryValue::Omp(row)) = (target, &entry.value)
                                else {
                                    continue;
                                };
                                if is_replacement(
                                    entry,
                                    target.expires_ms,
                                    target.refresh.as_deref(),
                                    args.now,
                                    args.require_future,
                                ) {
                                    updates.push(RowUpdate {
                                        id: row.id.clone(),
                                        provider: row.provider.clone(),
                                        data: row.data.clone(),
                                        updated_at: Some(row.updated_at.clone()),
                                    });
                                }
                            }
                            Ok(updates)
                        })?;
                Ok(updates
                    .iter()
                    .map(|u| format!("{}\u{0}{}", u.id, u.provider))
                    .collect())
            }
            Layout::ClaudeConfig | Layout::ClaudeHome => {
                let target = source_home.join(self.claude_file());
                for _ in 0..3 {
                    let source = self
                        .read(source_home, false, args.sqlite)
                        .map_err(str::to_owned)?;
                    let current = &source.entries[0];
                    let Some(next) = copy.entries.first().filter(|n| {
                        is_replacement(
                            n,
                            current.expires_ms,
                            current.refresh.as_deref(),
                            args.now,
                            args.require_future,
                        )
                    }) else {
                        return Ok(vec![]);
                    };
                    let EntryValue::Json(oauth) = &next.value else {
                        return Ok(vec![]);
                    };
                    let (mut doc, raw) = (
                        source.doc.unwrap_or(Value::Null),
                        source.raw.unwrap_or_default(),
                    );
                    doc["claudeAiOauth"] = oauth.clone();
                    if write_if_unchanged(&target, &raw, &serialize_json(&doc, &raw))? {
                        return Ok(vec!["claudeAiOauth".into()]);
                    }
                }
                Err("source-changing".into())
            }
        }
    }

    /// Stage a private home's login into `staging_dir` (through the agent-file door).
    pub fn stage(
        self,
        copy_home: &Path,
        staging_dir: &Path,
        sqlite: &dyn SqliteAdapter,
    ) -> Result<(), String> {
        let stage_err = |_: std::io::Error| "stage-failed".to_owned();
        match self {
            Layout::PiAuthJson | Layout::CodexAuthJson => {
                stage_copy_file(&copy_home.join("auth.json"), &staging_dir.join("auth.json"))
                    .map_err(stage_err)
            }
            Layout::ClaudeConfig | Layout::ClaudeHome => {
                let file = Path::new(self.claude_file());
                if let Some(dir) = file.parent().filter(|d| !d.as_os_str().is_empty()) {
                    make_dir(&staging_dir.join(dir), false).map_err(stage_err)?;
                }
                stage_copy_file(&copy_home.join(file), &staging_dir.join(file)).map_err(stage_err)
            }
            Layout::OmpAgentDb => {
                // SQLite opens the store and its log by path: each must be a plain file of the home before it does.
                omp_agent_files_check(copy_home).map_err(stage_err)?;
                let destination = staging_dir.join("agent.db");
                if sqlite.snapshot(&copy_home.join("agent.db"), &destination) {
                    return Ok(());
                }
                // No snapshot: the files as they are, write-ahead log and rollback journal included. The pane's
                // processes are already stopped, so nothing is writing to them.
                for suffix in ["", "-wal", "-journal"] {
                    let from = copy_home.join(format!("agent.db{suffix}"));
                    match fs::metadata(&from) {
                        Ok(_) => {}
                        Err(e)
                            if e.kind() == std::io::ErrorKind::NotFound && !suffix.is_empty() =>
                        {
                            continue
                        }
                        Err(_) => return Err("stage-failed".into()),
                    }
                    stage_copy_file(
                        &from,
                        &PathBuf::from(format!("{}{suffix}", destination.display())),
                    )
                    .map_err(stage_err)?;
                }
                Ok(())
            }
        }
    }
}

/// A staged file is on disk before the staging directory is renamed into `pending/`: it is installed through the
/// durable-file door (new name only, owner-only), which syncs the file and its directory.
fn stage_copy_file(from: &Path, to: &Path) -> std::io::Result<()> {
    let bytes = read_agent_file(from, MAX_COPY_FILE_BYTES)?;
    let (Some(dir), Some(name)) = (to.parent(), to.file_name().and_then(|n| n.to_str())) else {
        return Err(std::io::Error::other("no staging name"));
    };
    fgos_durable_file::install_once_with_mode(dir, name, &bytes, 0o600)
        .map(|_| ())
        .map_err(|e| std::io::Error::other(e.to_string()))
}

/// The file is replaced only when it still holds what the merge was based on; the owner's own CLI does not
/// take the account lock, so a change in between means the merge is recomputed from the new content.
fn write_if_unchanged(file: &Path, expected_raw: &str, content: &str) -> Result<bool, String> {
    let current = fs::read(file).map_err(|e| read_fail_code(&e).to_owned())?;
    if String::from_utf8_lossy(&current) != expected_raw {
        return Ok(false);
    }
    write_file_atomic(file, content).map_err(|_| "write-failed".to_owned())?;
    Ok(true)
}

/// The omp store of a private home and every sidecar SQLite would open beside it: none may be a link, a pipe,
/// a socket or a device, which SQLite would follow or block on. A missing store is `NotFound`.
pub fn omp_agent_files_check(home: &Path) -> std::io::Result<()> {
    for name in [
        "agent.db",
        "agent.db-wal",
        "agent.db-journal",
        "agent.db-shm",
    ] {
        let meta = match fs::symlink_metadata(home.join(name)) {
            Ok(m) => m,
            Err(e) if e.kind() == std::io::ErrorKind::NotFound && name != "agent.db" => continue,
            Err(e) => return Err(e),
        };
        let kind = meta.file_type();
        #[cfg(unix)]
        let special = {
            use std::os::unix::fs::FileTypeExt;
            kind.is_fifo() || kind.is_socket() || kind.is_char_device() || kind.is_block_device()
        };
        #[cfg(not(unix))]
        let special = false;
        if kind.is_symlink() || special {
            return Err(std::io::Error::new(
                std::io::ErrorKind::InvalidData,
                "not a plain file",
            ));
        }
    }
    Ok(())
}

/// The non-empty sidecar files of a layout in `dir`: `(found, unreadable)`. A zero-byte file, or one that is
/// not there, counts as absent; any other read error means nothing can be said about it.
pub fn sidecar_bytes(layout: Layout, dir: &Path, agent: bool) -> (Vec<(String, Vec<u8>)>, bool) {
    let (mut found, mut unreadable) = (Vec::new(), false);
    for name in layout.sidecars() {
        let file = dir.join(name);
        let bytes = if agent {
            read_agent_file(&file, MAX_COPY_FILE_BYTES)
        } else {
            fs::read(&file)
        };
        match bytes {
            Ok(b) if !b.is_empty() => found.push(((*name).to_owned(), b)),
            Ok(_) => {}
            Err(e) if e.kind() == std::io::ErrorKind::NotFound => {}
            Err(_) => unreadable = true,
        }
    }
    (found, unreadable)
}
