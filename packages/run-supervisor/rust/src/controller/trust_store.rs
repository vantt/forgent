//! The one door onto an agent CLI's folder-trust store, ported from `src/run-supervisor/trust-store.mjs`
//! with its behaviour unchanged.
//!
//! Trust is derived, never invented: an entry is only written for a path whose repo root is already
//! trusted by a person. Three formats share that one policy: claude's `~/.claude.json`, codex's
//! `config.toml` (and the hook trust beside it) and agy's `settings.json`.
//!
//! The JSON stores belong to other tools, so their key order and layout are kept exactly: they are read
//! into an insertion-ordered value (`Json`) and written back as `JSON.stringify(value, null, 2)` would.
//! codex's own hook trust hash is the one place keys are sorted (`sorted_json`), by UTF-16 code units
//! as codex does, and it is deliberately not the Canonical JSON of `fgos-canonical-json`.

use fgos_durable_file::replace_durably_with_mode;
use fgos_holder_lock::{lock_root, Acquire, Mode, Resource, Wait, DEFAULT_KILL_WAIT_MS};
use serde_json::{Map, Value};
use sha2::{Digest, Sha256};
use std::fs;
use std::io::{self, Read};
use std::path::{Component, Path, PathBuf};

const SEED_TRIES: usize = 3;
const SEED_LOCK_WAIT_MS: u64 = 30_000;
const MAX_PROJECT_FILE_BYTES: u64 = 1024 * 1024;
const DEFAULT_HOOK_TIMEOUT_SEC: i64 = 600;
const MATCHERLESS_EVENTS: [&str; 2] = ["user_prompt_submit", "stop"];

/// Every refusal and every failure of this door; `code` lets a caller branch without matching text.
#[derive(Debug, Clone, PartialEq)]
pub struct TrustStoreError {
    pub code: &'static str,
    pub message: String,
    pub detail: Map<String, Value>,
}

impl TrustStoreError {
    fn new(code: &'static str, message: impl Into<String>) -> Self {
        Self {
            code,
            message: message.into(),
            detail: Map::new(),
        }
    }

    fn with(mut self, key: &str, value: &str) -> Self {
        self.detail
            .insert(key.to_string(), Value::String(value.to_string()));
        self
    }
}

impl std::fmt::Display for TrustStoreError {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        write!(f, "{}", self.message)
    }
}

impl std::error::Error for TrustStoreError {}

type Result<T> = std::result::Result<T, TrustStoreError>;

// ---------------------------------------------------------------------------------------------------
// An insertion-ordered JSON value, serialised the way JavaScript's `JSON.stringify` does.

/// JSON that keeps the order of an object's keys (a duplicate key keeps its first place, last value).
#[derive(Debug, Clone, PartialEq)]
pub enum Json {
    Null,
    Bool(bool),
    Num(f64),
    Str(String),
    Arr(Vec<Json>),
    Obj(Vec<(String, Json)>),
}

impl Json {
    fn get(&self, key: &str) -> Option<&Json> {
        match self {
            Json::Obj(entries) => entries.iter().find(|(k, _)| k == key).map(|(_, v)| v),
            _ => None,
        }
    }

    fn get_mut(&mut self, key: &str) -> Option<&mut Json> {
        match self {
            Json::Obj(entries) => entries.iter_mut().find(|(k, _)| k == key).map(|(_, v)| v),
            _ => None,
        }
    }

    /// Set `key`: in place when present, appended otherwise (`obj[key] = value`).
    fn set(&mut self, key: &str, value: Json) {
        if let Json::Obj(entries) = self {
            match entries.iter_mut().find(|(k, _)| k == key) {
                Some((_, slot)) => *slot = value,
                None => entries.push((key.to_string(), value)),
            }
        }
    }

    fn is_object(&self) -> bool {
        matches!(self, Json::Obj(_))
    }

    fn as_str(&self) -> Option<&str> {
        match self {
            Json::Str(s) => Some(s),
            _ => None,
        }
    }

    /// `entry?.hasTrustDialogAccepted === true` for `map[key]`.
    fn trusted_at(&self, key: &str) -> bool {
        matches!(
            self.get(key)
                .and_then(|entry| entry.get("hasTrustDialogAccepted")),
            Some(Json::Bool(true))
        )
    }

    /// Parse a JSON document (strict: no comments, no trailing commas).
    pub fn parse(text: &str) -> std::result::Result<Json, String> {
        let mut parser = Parser {
            bytes: text.as_bytes(),
            text,
            at: 0,
        };
        parser.skip_ws();
        let value = parser.value(0)?;
        parser.skip_ws();
        if parser.at != parser.bytes.len() {
            return Err(format!("unexpected character at position {}", parser.at));
        }
        Ok(value)
    }

    /// `JSON.stringify(value, null, 2)`.
    pub fn pretty(&self) -> String {
        let mut out = String::new();
        self.write(&mut out, Some(0));
        out
    }

    /// `JSON.stringify(value)`.
    pub fn compact(&self) -> String {
        let mut out = String::new();
        self.write(&mut out, None);
        out
    }

    fn write(&self, out: &mut String, indent: Option<usize>) {
        match self {
            Json::Null => out.push_str("null"),
            Json::Bool(b) => out.push_str(if *b { "true" } else { "false" }),
            Json::Num(n) => out.push_str(&js_number(*n)),
            Json::Str(s) => write_string(out, s),
            Json::Arr(items) => {
                if items.is_empty() {
                    out.push_str("[]");
                    return;
                }
                out.push('[');
                for (i, item) in items.iter().enumerate() {
                    if i > 0 {
                        out.push(',');
                    }
                    newline(out, indent.map(|d| d + 1));
                    item.write(out, indent.map(|d| d + 1));
                }
                newline(out, indent);
                out.push(']');
            }
            Json::Obj(entries) => {
                if entries.is_empty() {
                    out.push_str("{}");
                    return;
                }
                out.push('{');
                for (i, (key, value)) in entries.iter().enumerate() {
                    if i > 0 {
                        out.push(',');
                    }
                    newline(out, indent.map(|d| d + 1));
                    write_string(out, key);
                    out.push(':');
                    if indent.is_some() {
                        out.push(' ');
                    }
                    value.write(out, indent.map(|d| d + 1));
                }
                newline(out, indent);
                out.push('}');
            }
        }
    }
}

fn newline(out: &mut String, depth: Option<usize>) {
    if let Some(depth) = depth {
        out.push('\n');
        for _ in 0..depth {
            out.push_str("  ");
        }
    }
}

/// A JSON string as `JSON.stringify` writes it.
fn write_string(out: &mut String, s: &str) {
    out.push('"');
    for c in s.chars() {
        match c {
            '"' => out.push_str("\\\""),
            '\\' => out.push_str("\\\\"),
            '\u{8}' => out.push_str("\\b"),
            '\u{c}' => out.push_str("\\f"),
            '\n' => out.push_str("\\n"),
            '\r' => out.push_str("\\r"),
            '\t' => out.push_str("\\t"),
            c if (c as u32) < 0x20 => out.push_str(&format!("\\u{:04x}", c as u32)),
            c => out.push(c),
        }
    }
    out.push('"');
}

/// A number as JavaScript prints it: integers without a fraction, no `+` in exponents.
fn js_number(n: f64) -> String {
    if !n.is_finite() {
        return "null".to_string();
    }
    if n == 0.0 {
        return "0".to_string();
    }
    let magnitude = n.abs();
    if (1e-6..1e21).contains(&magnitude) {
        return format!("{n}");
    }
    let text = format!("{n:e}");
    match text.split_once('e') {
        Some((mantissa, exp)) if exp.starts_with('-') => format!("{mantissa}e{exp}"),
        Some((mantissa, exp)) => format!("{mantissa}e+{exp}"),
        None => text,
    }
}

struct Parser<'a> {
    bytes: &'a [u8],
    text: &'a str,
    at: usize,
}

impl Parser<'_> {
    fn skip_ws(&mut self) {
        while matches!(self.bytes.get(self.at), Some(b' ' | b'\t' | b'\n' | b'\r')) {
            self.at += 1;
        }
    }

    fn eat(&mut self, literal: &str) -> bool {
        if self.text[self.at..].starts_with(literal) {
            self.at += literal.len();
            true
        } else {
            false
        }
    }

    fn value(&mut self, depth: usize) -> std::result::Result<Json, String> {
        if depth > 512 {
            return Err("nesting too deep".to_string());
        }
        match self.bytes.get(self.at) {
            None => Err("unexpected end of JSON input".to_string()),
            Some(b'{') => {
                self.at += 1;
                let mut entries: Vec<(String, Json)> = Vec::new();
                self.skip_ws();
                if self.eat("}") {
                    return Ok(Json::Obj(entries));
                }
                loop {
                    self.skip_ws();
                    if self.bytes.get(self.at) != Some(&b'"') {
                        return Err(format!("expected a string key at position {}", self.at));
                    }
                    let key = self.string()?;
                    self.skip_ws();
                    if !self.eat(":") {
                        return Err(format!("expected ':' at position {}", self.at));
                    }
                    self.skip_ws();
                    let value = self.value(depth + 1)?;
                    match entries.iter_mut().find(|(k, _)| *k == key) {
                        Some((_, slot)) => *slot = value,
                        None => entries.push((key, value)),
                    }
                    self.skip_ws();
                    if self.eat(",") {
                        continue;
                    }
                    if self.eat("}") {
                        return Ok(Json::Obj(entries));
                    }
                    return Err(format!("expected ',' or '}}' at position {}", self.at));
                }
            }
            Some(b'[') => {
                self.at += 1;
                let mut items = Vec::new();
                self.skip_ws();
                if self.eat("]") {
                    return Ok(Json::Arr(items));
                }
                loop {
                    self.skip_ws();
                    items.push(self.value(depth + 1)?);
                    self.skip_ws();
                    if self.eat(",") {
                        continue;
                    }
                    if self.eat("]") {
                        return Ok(Json::Arr(items));
                    }
                    return Err(format!("expected ',' or ']' at position {}", self.at));
                }
            }
            Some(b'"') => Ok(Json::Str(self.string()?)),
            Some(b't') if self.eat("true") => Ok(Json::Bool(true)),
            Some(b'f') if self.eat("false") => Ok(Json::Bool(false)),
            Some(b'n') if self.eat("null") => Ok(Json::Null),
            Some(b'-' | b'0'..=b'9') => self.number(),
            Some(_) => Err(format!("unexpected token at position {}", self.at)),
        }
    }

    fn number(&mut self) -> std::result::Result<Json, String> {
        let start = self.at;
        if self.bytes.get(self.at) == Some(&b'-') {
            self.at += 1;
        }
        match self.bytes.get(self.at) {
            Some(b'0') => self.at += 1,
            Some(b'1'..=b'9') => self.digits(),
            _ => return Err(format!("bad number at position {start}")),
        }
        if self.bytes.get(self.at) == Some(&b'.') {
            self.at += 1;
            if !matches!(self.bytes.get(self.at), Some(b'0'..=b'9')) {
                return Err(format!("bad number at position {start}"));
            }
            self.digits();
        }
        if matches!(self.bytes.get(self.at), Some(b'e' | b'E')) {
            self.at += 1;
            if matches!(self.bytes.get(self.at), Some(b'+' | b'-')) {
                self.at += 1;
            }
            if !matches!(self.bytes.get(self.at), Some(b'0'..=b'9')) {
                return Err(format!("bad number at position {start}"));
            }
            self.digits();
        }
        self.text[start..self.at]
            .parse::<f64>()
            .map(Json::Num)
            .map_err(|e| e.to_string())
    }

    fn digits(&mut self) {
        while matches!(self.bytes.get(self.at), Some(b'0'..=b'9')) {
            self.at += 1;
        }
    }

    fn hex4(&mut self) -> std::result::Result<u32, String> {
        let end = self.at + 4;
        let digits = self.text.get(self.at..end).ok_or("bad unicode escape")?;
        let value =
            u32::from_str_radix(digits, 16).map_err(|_| "bad unicode escape".to_string())?;
        self.at = end;
        Ok(value)
    }

    fn string(&mut self) -> std::result::Result<String, String> {
        self.at += 1;
        let mut out = String::new();
        loop {
            let rest = &self.text[self.at..];
            let c = rest.chars().next().ok_or("unterminated string")?;
            self.at += c.len_utf8();
            match c {
                '"' => return Ok(out),
                c if (c as u32) < 0x20 => return Err("bad control character in string".to_string()),
                '\\' => {
                    let e = self.text[self.at..]
                        .chars()
                        .next()
                        .ok_or("unterminated string")?;
                    self.at += e.len_utf8();
                    match e {
                        '"' => out.push('"'),
                        '\\' => out.push('\\'),
                        '/' => out.push('/'),
                        'b' => out.push('\u{8}'),
                        'f' => out.push('\u{c}'),
                        'n' => out.push('\n'),
                        'r' => out.push('\r'),
                        't' => out.push('\t'),
                        'u' => {
                            let first = self.hex4()?;
                            let code = if (0xd800..0xdc00).contains(&first) && self.eat("\\u") {
                                let second = self.hex4()?;
                                if (0xdc00..0xe000).contains(&second) {
                                    0x10000 + ((first - 0xd800) << 10) + (second - 0xdc00)
                                } else {
                                    return Err("lone surrogate in string".to_string());
                                }
                            } else {
                                first
                            };
                            out.push(char::from_u32(code).ok_or("lone surrogate in string")?);
                        }
                        _ => return Err("bad escape in string".to_string()),
                    }
                }
                c => out.push(c),
            }
        }
    }
}

/// codex's key order (UTF-16 code units), recursively. Not RFC 8785: the trust hash must match what codex
/// computes, so this is not the Canonical JSON door.
fn sorted_json(value: &Json) -> Json {
    match value {
        Json::Arr(items) => Json::Arr(items.iter().map(sorted_json).collect()),
        Json::Obj(entries) => {
            let mut sorted: Vec<(String, Json)> = entries
                .iter()
                .map(|(k, v)| (k.clone(), sorted_json(v)))
                .collect();
            sorted.sort_by(|a, b| a.0.encode_utf16().cmp(b.0.encode_utf16()));
            Json::Obj(sorted)
        }
        other => other.clone(),
    }
}

// ---------------------------------------------------------------------------------------------------
// Files

fn is_absolute(path: &str) -> bool {
    Path::new(path).is_absolute()
}

/// Where the operator's own claude store is: the declared path, else `.claude.json` in the config directory
/// they moved claude to, else the one beside their home.
pub fn operator_claude_store_path(
    trust_store_path: Option<&Path>,
    claude_config_dir: Option<&str>,
    home: &Path,
) -> PathBuf {
    if let Some(path) = trust_store_path {
        return path.to_path_buf();
    }
    match claude_config_dir {
        Some(dir) if !dir.is_empty() => Path::new(dir).join(".claude.json"),
        _ => home.join(".claude.json"),
    }
}

fn store_error(
    code: &'static str,
    what: &str,
    store_path: &Path,
    why: impl std::fmt::Display,
) -> TrustStoreError {
    TrustStoreError::new(
        code,
        format!("{what} at \"{}\" {why}.", store_path.display()),
    )
    .with("storePath", &store_path.to_string_lossy())
}

/// Read and parse a JSON store, refusing loudly rather than inventing an empty one. A missing file and an
/// unparseable file are different failures.
fn read_store(store_path: &Path) -> Result<Json> {
    let raw = match fs::read_to_string(store_path) {
        Ok(raw) => raw,
        Err(err) if err.kind() == io::ErrorKind::NotFound => {
            return Err(TrustStoreError::new(
                "missing-store",
                format!("trust store not found at \"{}\".", store_path.display()),
            )
            .with("storePath", &store_path.to_string_lossy()));
        }
        Err(err) => {
            return Err(store_error(
                "unreadable-store",
                "trust store",
                store_path,
                format!("could not be read: {err}"),
            ))
        }
    };
    Json::parse(&raw).map_err(|err| {
        store_error(
            "unreadable-store",
            "trust store",
            store_path,
            format!("is not valid JSON: {err}"),
        )
    })
}

/// Replace a store's bytes through the durable door. A store reached through a link is written where the link
/// points; its own permission bits are kept, and one that does not exist yet is created owner-only.
fn write_store(store_path: &Path, body: &str) -> Result<()> {
    let mut target = store_path.to_path_buf();
    #[cfg_attr(not(unix), allow(unused_mut))]
    let mut mode = 0o600u32;
    match fs::canonicalize(store_path) {
        Ok(real) => {
            #[cfg(unix)]
            {
                use std::os::unix::fs::PermissionsExt;
                match fs::metadata(&real) {
                    Ok(meta) => mode = meta.permissions().mode() & 0o777,
                    Err(err) => {
                        return Err(store_error(
                            "write-failed",
                            "trust store",
                            store_path,
                            format!("could not be resolved: {err}"),
                        ))
                    }
                }
            }
            target = real;
        }
        Err(err) => {
            if err.kind() != io::ErrorKind::NotFound || fs::symlink_metadata(store_path).is_ok() {
                return Err(store_error(
                    "write-failed",
                    "trust store",
                    store_path,
                    format!("could not be resolved: {err}"),
                ));
            }
        }
    }
    let written = (|| -> io::Result<()> {
        let dir = target.parent().unwrap_or_else(|| Path::new("."));
        fs::create_dir_all(dir)?;
        let name = target
            .file_name()
            .and_then(|n| n.to_str())
            .ok_or_else(|| io::Error::other("store path has no file name"))?;
        replace_durably_with_mode(dir, name, body.as_bytes(), mode)
            .map(|_| ())
            .map_err(|err| err.source)
    })();
    written.map_err(|err| {
        store_error(
            "write-failed",
            "trust store",
            store_path,
            format!("could not be written: {err}"),
        )
    })
}

fn write_store_json(store_path: &Path, data: &Json) -> Result<()> {
    write_store(store_path, &format!("{}\n", data.pretty()))
}

/// A project file the agent can write, read without following a link, without blocking on a pipe, bounded.
fn read_agent_file(path: &Path, max_bytes: u64) -> io::Result<Vec<u8>> {
    let mut options = fs::OpenOptions::new();
    options.read(true);
    #[cfg(unix)]
    let file = {
        use std::os::unix::fs::OpenOptionsExt;
        options.custom_flags(libc::O_NOFOLLOW | libc::O_NONBLOCK);
        options.open(path)?
    };
    #[cfg(windows)]
    let file = fgos_durable_file::open_no_reparse(&mut options, path)?;
    let meta = file.metadata()?;
    if !meta.is_file() {
        return Err(io::Error::new(
            io::ErrorKind::InvalidInput,
            "not a regular file",
        ));
    }
    if meta.len() > max_bytes {
        return Err(io::Error::new(
            io::ErrorKind::InvalidData,
            format!("file larger than {max_bytes} bytes"),
        ));
    }
    let mut bytes = Vec::new();
    file.take(max_bytes).read_to_end(&mut bytes)?;
    Ok(bytes)
}

/// The `projects` object of a claude store, or a typed schema-drift refusal.
fn projects_of<'a>(store: &'a Json, store_path: &Path) -> Result<&'a Json> {
    match store.get("projects") {
        Some(projects) if projects.is_object() => Ok(projects),
        _ => Err(TrustStoreError::new(
            "schema-drift",
            format!("trust store at \"{}\" has no usable \"projects\" object -- the store's shape changed and this module must not guess.", store_path.display()),
        )
        .with("storePath", &store_path.to_string_lossy())),
    }
}

/// Trust state of one path: `Some(true)`, `Some(false)`, or `None` when the path is absent.
pub fn read_trust(store_path: &Path, project_path: &str) -> Result<Option<bool>> {
    let store = read_store(store_path)?;
    let projects = projects_of(&store, store_path)?;
    Ok(projects
        .get(project_path)
        .map(|entry| matches!(entry.get("hasTrustDialogAccepted"), Some(Json::Bool(true)))))
}

/// The shape of one `projects[<path>]` entry claude.json's own schema expects; a fresh value every call.
pub fn trusted_project_entry() -> Json {
    Json::Obj(vec![
        ("allowedTools".into(), Json::Arr(vec![])),
        ("hasTrustDialogAccepted".into(), Json::Bool(true)),
        ("mcpServers".into(), Json::Obj(vec![])),
        ("enabledMcpjsonServers".into(), Json::Arr(vec![])),
        ("disabledMcpjsonServers".into(), Json::Arr(vec![])),
        ("history".into(), Json::Arr(vec![])),
    ])
}

/// Roots a workspace's trust may be derived from: the declared repo root and, for a linked worktree, the main
/// checkout that owns it. Never invents a root.
pub fn trust_roots(project_path: &Path, repo_root: &str) -> Vec<String> {
    let mut roots = vec![repo_root.to_string()];
    let common = std::process::Command::new("git")
        .arg("-C")
        .arg(project_path)
        .args(["rev-parse", "--path-format=absolute", "--git-common-dir"])
        .env("GIT_OPTIONAL_LOCKS", "0")
        .stdin(std::process::Stdio::null())
        .stderr(std::process::Stdio::null())
        .output();
    if let Ok(output) = common {
        if output.status.success() {
            let common_dir = PathBuf::from(
                String::from_utf8_lossy(&output.stdout).trim_end_matches(['\n', '\r']),
            );
            if common_dir.file_name().is_some_and(|name| name == ".git") {
                if let Some(owner) = common_dir.parent() {
                    let owner = owner.to_string_lossy().into_owned();
                    if !roots.contains(&owner) {
                        roots.push(owner);
                    }
                }
            }
        }
    }
    roots
}

/// Per-process approval of the MCP servers a project declares in its own `.mcp.json`, as extra claude
/// arguments; `[]` when there is nothing to approve or the root is not trusted.
pub fn claude_mcp_approval_args(cwd: &Path, repo_root: &str, store_path: &Path) -> Vec<String> {
    let approved = || -> Option<Vec<String>> {
        let bytes = read_agent_file(&cwd.join(".mcp.json"), MAX_PROJECT_FILE_BYTES).ok()?;
        let parsed = Json::parse(std::str::from_utf8(&bytes).ok()?).ok()?;
        let names: Vec<String> = match parsed.get("mcpServers") {
            Some(Json::Obj(entries)) => entries.iter().map(|(k, _)| k.clone()).collect(),
            _ => Vec::new(),
        };
        if names.is_empty() {
            return None;
        }
        let resolved = resolve_path(&cwd.to_string_lossy());
        for root in trust_roots(Path::new(&resolved), repo_root) {
            if read_trust(store_path, &root).ok()? == Some(true) {
                let settings = Json::Obj(vec![(
                    "enabledMcpjsonServers".into(),
                    Json::Arr(names.into_iter().map(Json::Str).collect()),
                )]);
                return Some(vec!["--settings".to_string(), settings.compact()]);
            }
        }
        None
    };
    approved().unwrap_or_default()
}

fn invalid_path(label: &str, value: &str, key: &str, prefix: &str) -> TrustStoreError {
    TrustStoreError::new(
        "invalid-path",
        format!("{prefix}{label} must be an absolute path, got \"{value}\"."),
    )
    .with(key, value)
}

/// Record trust for `project_path`, derived from an already-trusted `repo_root`, and read it back before
/// returning (an entry lost in between is added again, at most `SEED_TRIES` times, then `trust-not-kept`).
/// Add-only. Takes the machine's `agent-trust-store` lock. Returns whether this call wrote the entry.
pub fn seed_trust(store_path: &Path, project_path: &str, repo_root: &str) -> Result<bool> {
    let prefix = "trust seed refused: ";
    if !is_absolute(project_path) {
        return Err(invalid_path(
            "projectPath",
            project_path,
            "projectPath",
            prefix,
        ));
    }
    if !is_absolute(repo_root) {
        return Err(invalid_path("repoRoot", repo_root, "repoRoot", prefix));
    }
    let root = lock_root();
    let busy = |why: String| {
        TrustStoreError::new(
            "store-busy",
            format!("trust seed for \"{project_path}\" {why}"),
        )
        .with("projectPath", project_path)
    };
    fs::create_dir_all(&root)
        .map_err(|err| busy(format!("could not take the trust-store lock: {err}.")))?;
    let resource = Resource::new("agent-trust-store", root.join("agent-trust-store.lock"));
    let handle = match fgos_holder_lock::acquire(
        &resource,
        Mode::Ex,
        Wait::Ms(SEED_LOCK_WAIT_MS),
        DEFAULT_KILL_WAIT_MS,
    ) {
        Acquire::Acquired(handle) => handle,
        Acquire::Held { reason, .. } => {
            return Err(busy(format!(
                "waited {SEED_LOCK_WAIT_MS}ms for the trust-store lock ({}).",
                reason.as_str()
            )))
        }
        Acquire::Timeout { .. } => {
            return Err(busy(format!(
                "waited {SEED_LOCK_WAIT_MS}ms for the trust-store lock (timeout)."
            )))
        }
        Acquire::Unavailable { detail, .. } => {
            return Err(busy(format!(
                "could not take the trust-store lock: {detail}."
            )))
        }
    };
    let outcome = seed_trust_locked(store_path, project_path, repo_root);
    let _ = fgos_holder_lock::release(handle);
    outcome
}

fn seed_trust_locked(store_path: &Path, project_path: &str, repo_root: &str) -> Result<bool> {
    let mut wrote = false;
    for attempt in 0..=SEED_TRIES {
        let mut store = read_store(store_path)?;
        let projects = projects_of(&store, store_path)?;
        if !projects.trusted_at(repo_root) {
            return Err(TrustStoreError::new(
                "untrusted-root",
                format!("trust seed refused for \"{project_path}\": its repo root \"{repo_root}\" is not itself trusted, so there is nothing to derive trust from."),
            )
            .with("projectPath", project_path)
            .with("repoRoot", repo_root));
        }
        if projects.trusted_at(project_path) {
            return Ok(wrote);
        }
        if attempt == SEED_TRIES {
            break;
        }
        if let Some(projects) = store.get_mut("projects") {
            projects.set(project_path, trusted_project_entry());
        }
        write_store_json(store_path, &store)?;
        wrote = true;
    }
    Err(TrustStoreError::new(
        "trust-not-kept",
        format!(
            "trust entry for \"{project_path}\" was lost from \"{}\" after {SEED_TRIES} writes.",
            store_path.display()
        ),
    )
    .with("projectPath", project_path)
    .with("storePath", &store_path.to_string_lossy()))
}

/// The config of a confined claude pane, in its private config directory: first-run state and folder trust,
/// derived only for a `repo_root` the person already trusts in `root_store_path`. Returns whether it wrote.
pub fn seed_claude_config_trust(
    config_path: &Path,
    project_path: &str,
    repo_root: &str,
    root_store_path: &Path,
) -> Result<bool> {
    if !is_absolute(project_path) {
        return Err(invalid_path(
            "projectPath",
            project_path,
            "projectPath",
            "trust seed refused: ",
        ));
    }
    if read_trust(root_store_path, repo_root)? != Some(true) {
        return Err(TrustStoreError::new(
            "untrusted-root",
            format!("trust seed refused for \"{project_path}\": its repo root \"{repo_root}\" is not trusted in \"{}\", so there is nothing to derive trust from.", root_store_path.display()),
        )
        .with("projectPath", project_path)
        .with("repoRoot", repo_root));
    }
    let mut config = if config_path.exists() {
        read_store(config_path)?
    } else {
        Json::Obj(vec![])
    };
    if !config.is_object() {
        return Err(store_error(
            "schema-drift",
            "trust store",
            config_path,
            "is not a JSON object",
        ));
    }
    let mut projects = match config.get("projects") {
        None => Json::Obj(vec![]),
        Some(_) => projects_of(&config, config_path)?.clone(),
    };
    if matches!(config.get("hasCompletedOnboarding"), Some(Json::Bool(true)))
        && projects.trusted_at(project_path)
    {
        return Ok(false);
    }
    if !projects.trusted_at(project_path) {
        projects.set(project_path, trusted_project_entry());
    }
    let theme = match config.get("theme") {
        Some(Json::Str(theme)) => theme.clone(),
        _ => "dark".to_string(),
    };
    config.set("hasCompletedOnboarding", Json::Bool(true));
    config.set("theme", Json::Str(theme));
    config.set("projects", projects);
    write_store_json(config_path, &config)?;
    Ok(true)
}

// ---------------------------------------------------------------------------------------------------
// codex: config.toml

/// A TOML basic string: JSON string escapes are valid TOML escapes; DEL is the one extra character to escape.
fn toml_basic_string(value: &str) -> String {
    let mut out = String::new();
    write_string(&mut out, value);
    out.replace('\u{7f}', "\\u007f")
}

fn codex_project_header(project_path: &str) -> String {
    format!("[projects.{}]", toml_basic_string(project_path))
}

/// Whether `text` holds `trust_level\s*=\s*"trusted"`.
fn has_trusted_level(text: &str) -> bool {
    let mut from = 0;
    while let Some(found) = text[from..].find("trust_level") {
        let after = &text[from + found + "trust_level".len()..];
        let after = after.trim_start();
        if let Some(rest) = after.strip_prefix('=') {
            if rest.trim_start().starts_with("\"trusted\"") {
                return true;
            }
        }
        from += found + "trust_level".len();
    }
    false
}

/// Where the `[projects."<path>"]` table of one path sits in `body`: from its header line up to the next line
/// that starts a table header, or the end of the file.
fn codex_section_range(body: &str, project_path: &str) -> Option<(usize, usize)> {
    let header = codex_project_header(project_path);
    let mut start: Option<usize> = None;
    let mut offset = 0;
    for line in body.split_inclusive('\n') {
        let opens_table = line.trim_start_matches([' ', '\t']).starts_with('[');
        if let Some(start) = start {
            if opens_table {
                return Some((start, offset));
            }
        } else if opens_table && line.trim().starts_with(&header) {
            start = Some(offset);
        }
        offset += line.len();
    }
    start.map(|start| (start, offset))
}

fn unreadable_codex(config_path: &Path, err: impl std::fmt::Display) -> TrustStoreError {
    TrustStoreError::new(
        "unreadable-store",
        format!(
            "could not read codex config at {}: {err}",
            config_path.display()
        ),
    )
    .with("configPath", &config_path.to_string_lossy())
}

/// Is this exact path trusted in codex's config.toml? Not a TOML parser: it looks for the one section shape
/// codex writes, and says `None` when it cannot tell.
pub fn read_codex_trust(config_path: &Path, project_path: &str) -> Result<Option<bool>> {
    if !is_absolute(project_path) {
        return Err(TrustStoreError::new(
            "invalid-path",
            format!("readCodexTrust: projectPath must be absolute, got \"{project_path}\"."),
        ));
    }
    let body = match fs::read_to_string(config_path) {
        Ok(body) => body,
        Err(err) if err.kind() == io::ErrorKind::NotFound => return Ok(None),
        Err(err) => return Err(unreadable_codex(config_path, err)),
    };
    Ok(codex_section_range(&body, project_path)
        .map(|(start, end)| has_trusted_level(&body[start..end])))
}

fn with_one_trailing_newline(body: &str) -> String {
    format!("{}\n", body.trim_end_matches('\n'))
}

fn untrusted_codex_root(
    what: &str,
    project_path: &str,
    repo_root: &str,
    root_store: &Path,
) -> TrustStoreError {
    TrustStoreError::new(
        "untrusted-root",
        format!("{what} for \"{project_path}\": its repo root \"{repo_root}\" is not itself trusted in {}, so there is nothing to derive trust from.", root_store.display()),
    )
    .with("projectPath", project_path)
    .with("repoRoot", repo_root)
    .with("configPath", &root_store.to_string_lossy())
}

/// Trust one workspace for codex, derived from a root codex already trusts. Append-only and idempotent.
/// `root_config_path` is the account's own config; `config_path` is where the entry is written.
pub fn seed_codex_trust(
    config_path: &Path,
    project_path: &str,
    repo_root: &str,
    root_config_path: Option<&Path>,
) -> Result<bool> {
    if !is_absolute(project_path) {
        return Err(TrustStoreError::new(
            "invalid-path",
            format!("seedCodexTrust: projectPath must be absolute, got \"{project_path}\"."),
        ));
    }
    if !is_absolute(repo_root) {
        return Err(TrustStoreError::new(
            "invalid-path",
            format!("seedCodexTrust: repoRoot must be absolute, got \"{repo_root}\"."),
        ));
    }
    let root_store = root_config_path.unwrap_or(config_path);
    if read_codex_trust(config_path, project_path)? == Some(true) {
        return Ok(false);
    }
    if read_codex_trust(root_store, repo_root)? != Some(true) {
        return Err(untrusted_codex_root(
            "codex trust seed refused",
            project_path,
            repo_root,
            root_store,
        ));
    }
    let body = match fs::read_to_string(config_path) {
        Ok(body) => body,
        Err(err) if err.kind() == io::ErrorKind::NotFound && root_store != config_path => {
            String::new()
        }
        Err(err) => return Err(unreadable_codex(config_path, err)),
    };
    let entry = format!(
        "\n{}\ntrust_level = \"trusted\"\n",
        codex_project_header(project_path)
    );
    write_store(
        config_path,
        &format!("{}{entry}", with_one_trailing_newline(&body)),
    )?;
    Ok(true)
}

/// Drop one workspace's codex trust entry. Returns whether anything was there.
pub fn remove_codex_trust(config_path: &Path, project_path: &str) -> Result<bool> {
    if read_codex_trust(config_path, project_path)?.is_none() {
        return Ok(false);
    }
    let body = fs::read_to_string(config_path).map_err(|err| unreadable_codex(config_path, err))?;
    let Some((start, end)) = codex_section_range(&body, project_path) else {
        return Ok(false);
    };
    write_store(config_path, &format!("{}{}", &body[..start], &body[end..]))?;
    Ok(true)
}

// ---------------------------------------------------------------------------------------------------
// codex: hook trust

/// The command codex runs, and so hashes, on `platform`: `commandWindows` replaces `command` on windows only.
fn codex_hook_command(handler: &Json, platform: &str) -> Option<Json> {
    let windows = match handler.get("commandWindows") {
        Some(Json::Null) | None => handler.get("command_windows"),
        other => other,
    };
    match windows {
        Some(Json::Str(command)) if platform == "win32" => Some(Json::Str(command.clone())),
        _ => handler.get("command").cloned(),
    }
}

/// The trust hash codex computes for one command hook on `platform` (the platform the seat runs on).
pub fn codex_hook_trust_hash(
    event_name: &str,
    matcher: Option<&str>,
    handler: &Json,
    platform: &str,
) -> String {
    let mut hook: Vec<(String, Json)> = vec![("type".into(), Json::Str("command".into()))];
    if let Some(command) = codex_hook_command(handler, platform) {
        hook.push(("command".into(), command));
    }
    let timeout = match handler.get("timeout") {
        Some(Json::Null) | None => Json::Num(DEFAULT_HOOK_TIMEOUT_SEC as f64),
        Some(other) => other.clone(),
    };
    hook.push(("timeout".into(), timeout));
    hook.push((
        "async".into(),
        Json::Bool(matches!(handler.get("async"), Some(Json::Bool(true)))),
    ));
    if let Some(Json::Str(message)) = handler.get("statusMessage") {
        hook.push(("statusMessage".into(), Json::Str(message.clone())));
    }
    let mut identity = vec![
        ("event_name".to_string(), Json::Str(event_name.to_string())),
        ("hooks".to_string(), Json::Arr(vec![Json::Obj(hook)])),
    ];
    if let Some(matcher) = matcher {
        if !MATCHERLESS_EVENTS.contains(&event_name) {
            identity.push(("matcher".to_string(), Json::Str(matcher.to_string())));
        }
    }
    let digest = Sha256::digest(sorted_json(&Json::Obj(identity)).compact().as_bytes());
    format!(
        "sha256:{}",
        digest
            .iter()
            .map(|byte| format!("{byte:02x}"))
            .collect::<String>()
    )
}

/// One hook of a hooks.json that was hashed: its codex state key and trust hash.
#[derive(Debug, Clone, PartialEq, Eq)]
pub struct HookTrustEntry {
    pub key: String,
    pub hash: String,
}

/// One hook that could not be hashed faithfully, named with the reason.
#[derive(Debug, Clone, PartialEq, Eq)]
pub struct HookTrustSkipped {
    pub key: String,
    pub reason: String,
}

/// What `codex_hook_trust_entries` found in one hooks.json.
#[derive(Debug, Clone, PartialEq, Eq, Default)]
pub struct HookTrustEntries {
    pub entries: Vec<HookTrustEntry>,
    pub skipped: Vec<HookTrustSkipped>,
}

/// `fooBar` -> `foo_bar` (a lower-case letter or digit followed by an upper-case letter, non-overlapping).
fn snake_event(event: &str) -> String {
    let chars: Vec<char> = event.chars().collect();
    let mut out = String::new();
    let mut i = 0;
    while i < chars.len() {
        if i + 1 < chars.len()
            && (chars[i].is_ascii_lowercase() || chars[i].is_ascii_digit())
            && chars[i + 1].is_ascii_uppercase()
        {
            out.push(chars[i]);
            out.push('_');
            out.push(chars[i + 1]);
            i += 2;
        } else {
            out.push(chars[i]);
            i += 1;
        }
    }
    out.to_lowercase()
}

/// Hook entries of a hooks.json as hashed entries, plus the handlers that could not be hashed faithfully.
pub fn codex_hook_trust_entries(
    hooks_json_path: &Path,
    platform: &str,
) -> Result<HookTrustEntries> {
    let unreadable = |err: &dyn std::fmt::Display| {
        TrustStoreError::new(
            "unreadable-store",
            format!(
                "could not read codex hooks at {}: {err}",
                hooks_json_path.display()
            ),
        )
        .with("hooksJsonPath", &hooks_json_path.to_string_lossy())
    };
    let bytes = match read_agent_file(hooks_json_path, MAX_PROJECT_FILE_BYTES) {
        Ok(bytes) => bytes,
        Err(err) if err.kind() == io::ErrorKind::NotFound => return Ok(HookTrustEntries::default()),
        Err(err) => return Err(unreadable(&err)),
    };
    let parsed = std::str::from_utf8(&bytes)
        .map_err(|err| unreadable(&err))
        .and_then(|text| Json::parse(text).map_err(|err| unreadable(&err)))?;
    let mut found = HookTrustEntries::default();
    let Some(Json::Obj(events)) = parsed.get("hooks") else {
        return Ok(found);
    };
    let hooks_path = hooks_json_path.to_string_lossy();
    for (event, groups) in events {
        let event_name = snake_event(event);
        let Json::Arr(groups) = groups else { continue };
        for (group_index, group) in groups.iter().enumerate() {
            let Some(Json::Arr(handlers)) = group.get("hooks") else {
                continue;
            };
            for (handler_index, handler) in handlers.iter().enumerate() {
                let key = format!("{hooks_path}:{event_name}:{group_index}:{handler_index}");
                let reason = if event_name == "session_end" {
                    Some("event session_end is not hashed here".to_string())
                } else if !matches!(handler.get("type"), Some(Json::Str(kind)) if kind == "command")
                    || !matches!(handler.get("command"), Some(Json::Str(_)))
                {
                    let kind = handler
                        .get("type")
                        .map_or_else(|| "undefined".to_string(), Json::compact);
                    Some(format!("handler type {kind} is not a command"))
                } else if handler.get("additionalContextLimit").is_some() {
                    Some("additionalContextLimit is not normalised here".to_string())
                } else {
                    None
                };
                match reason {
                    Some(reason) => found.skipped.push(HookTrustSkipped { key, reason }),
                    None => found.entries.push(HookTrustEntry {
                        key,
                        hash: codex_hook_trust_hash(
                            &event_name,
                            group.get("matcher").and_then(Json::as_str),
                            handler,
                            platform,
                        ),
                    }),
                }
            }
        }
    }
    Ok(found)
}

fn codex_hook_header(key: &str) -> String {
    format!("[hooks.state.{}]", toml_basic_string(key))
}

/// What `seed_codex_hook_trust` did: the keys it wrote and the hooks it could not seed.
#[derive(Debug, Clone, PartialEq, Eq, Default)]
pub struct HookTrustSeeded {
    pub keys: Vec<String>,
    pub skipped: Vec<HookTrustSkipped>,
}

/// Trust the project's codex hooks in `config_path`, which must be a worker's private config. Idempotent: a
/// key already present (at any indentation) is left as it is.
pub fn seed_codex_hook_trust(
    config_path: &Path,
    project_path: &str,
    repo_root: &str,
    root_config_path: Option<&Path>,
    platform: &str,
) -> Result<HookTrustSeeded> {
    if !is_absolute(project_path) {
        return Err(TrustStoreError::new(
            "invalid-path",
            format!("seedCodexHookTrust: projectPath must be absolute, got \"{project_path}\"."),
        ));
    }
    let mut hook_files: Vec<PathBuf> = Vec::new();
    for dir in [project_path, repo_root] {
        if is_absolute(dir) {
            let file = Path::new(dir).join(".codex").join("hooks.json");
            if !hook_files.contains(&file) {
                hook_files.push(file);
            }
        }
    }
    let mut entries = Vec::new();
    let mut skipped = Vec::new();
    for file in &hook_files {
        let found = codex_hook_trust_entries(file, platform)?;
        entries.extend(found.entries);
        skipped.extend(found.skipped);
    }
    if entries.is_empty() {
        return Ok(HookTrustSeeded {
            keys: vec![],
            skipped,
        });
    }
    let root_store = root_config_path.unwrap_or(config_path);
    if read_codex_trust(root_store, repo_root)? != Some(true) {
        return Err(untrusted_codex_root(
            "codex hook trust seed refused",
            project_path,
            repo_root,
            root_store,
        ));
    }
    let body = match fs::read_to_string(config_path) {
        Ok(body) => body,
        Err(err) if err.kind() == io::ErrorKind::NotFound => String::new(),
        Err(err) => return Err(unreadable_codex(config_path, err)),
    };
    let fresh: Vec<&HookTrustEntry> = entries
        .iter()
        .filter(|entry| {
            !body.contains(&codex_hook_header(&entry.key)) && !body.contains(&entry.key)
        })
        .collect();
    if fresh.is_empty() {
        return Ok(HookTrustSeeded {
            keys: vec![],
            skipped,
        });
    }
    let sections: String = fresh
        .iter()
        .map(|entry| {
            format!(
                "\n{}\ntrusted_hash = \"{}\"\n",
                codex_hook_header(&entry.key),
                entry.hash
            )
        })
        .collect();
    write_store(
        config_path,
        &format!("{}{sections}", with_one_trailing_newline(&body)),
    )?;
    Ok(HookTrustSeeded {
        keys: fresh.iter().map(|entry| entry.key.clone()).collect(),
        skipped,
    })
}

// ---------------------------------------------------------------------------------------------------
// agy: settings.json

/// Where agy keeps its trust store under a given HOME (the HOME the agy process itself runs under).
pub fn default_agy_settings_path(home: &Path) -> PathBuf {
    home.join(".gemini")
        .join("antigravity-cli")
        .join("settings.json")
}

/// `path.resolve`: against the working directory, lexically, no trailing separator.
fn resolve_path(path: &str) -> String {
    let joined = if is_absolute(path) {
        PathBuf::from(path)
    } else {
        std::env::current_dir().unwrap_or_default().join(path)
    };
    let mut out = PathBuf::new();
    for component in joined.components() {
        match component {
            Component::CurDir => {}
            Component::ParentDir => {
                if !matches!(
                    out.components().next_back(),
                    Some(Component::RootDir | Component::Prefix(_)) | None
                ) {
                    out.pop();
                }
            }
            other => out.push(other.as_os_str()),
        }
    }
    out.to_string_lossy().into_owned()
}

fn matches_path(entry: &Json, target: &str) -> bool {
    let Json::Str(entry) = entry else {
        return false;
    };
    if entry == target {
        return true;
    }
    let (entry, target) = (resolve_path(entry), resolve_path(target));
    entry == target || (cfg!(windows) && entry.to_lowercase() == target.to_lowercase())
}

/// Read agy's settings.json to check whether a path is trusted; `None` when it cannot tell.
pub fn read_agy_trust(settings_path: &Path, project_path: &str) -> Option<bool> {
    let raw = fs::read_to_string(settings_path).ok()?;
    match Json::parse(&raw).ok()?.get("trustedWorkspaces")? {
        Json::Arr(list) => Some(list.iter().any(|entry| matches_path(entry, project_path))),
        _ => None,
    }
}

/// Read agy's settings.json, refusing (never inventing `{}`) when the file exists but cannot be understood.
/// A missing file is an empty store.
pub fn read_agy_store(settings_path: &Path) -> Result<Json> {
    if !settings_path.exists() {
        return Ok(Json::Obj(vec![]));
    }
    let agy = |code, why: String| {
        TrustStoreError::new(
            code,
            format!("agy trust store at \"{}\" {why}", settings_path.display()),
        )
        .with("settingsPath", &settings_path.to_string_lossy())
    };
    let raw = fs::read_to_string(settings_path)
        .map_err(|err| agy("unreadable-store", format!("could not be read: {err}.")))?;
    let parsed = Json::parse(&raw)
        .map_err(|err| agy("unreadable-store", format!("is not valid JSON: {err}.")))?;
    if !parsed.is_object() {
        return Err(agy(
            "schema-drift",
            "is not a JSON object -- its shape changed and this module must not guess.".to_string(),
        ));
    }
    Ok(parsed)
}

fn trusted_workspaces(store: &Json) -> Vec<Json> {
    match store.get("trustedWorkspaces") {
        Some(Json::Arr(list)) => list.clone(),
        _ => Vec::new(),
    }
}

/// Trust one workspace for agy, derived from a root agy already trusts. Idempotent.
pub fn seed_agy_trust(
    settings_path: &Path,
    project_path: &str,
    repo_root: &str,
    root_settings_path: Option<&Path>,
) -> Result<bool> {
    if settings_path.to_string_lossy().trim().is_empty() {
        return Err(TrustStoreError::new(
            "invalid-path",
            format!(
                "agy trust seed refused: settingsPath must be a non-empty string, got \"{}\".",
                settings_path.display()
            ),
        ));
    }
    let prefix = "agy trust seed refused: ";
    if !is_absolute(project_path) {
        return Err(invalid_path(
            "projectPath",
            project_path,
            "projectPath",
            prefix,
        ));
    }
    if !is_absolute(repo_root) {
        return Err(invalid_path("repoRoot", repo_root, "repoRoot", prefix));
    }
    let mut store = read_agy_store(settings_path)?;
    let trusted = trusted_workspaces(&store);
    let root_store = root_settings_path.unwrap_or(settings_path);
    let root_list = if root_store == settings_path {
        trusted.clone()
    } else {
        trusted_workspaces(&read_agy_store(root_store)?)
    };
    if !root_list.iter().any(|entry| matches_path(entry, repo_root)) {
        return Err(TrustStoreError::new(
            "untrusted-root",
            format!("agy trust seed refused for \"{project_path}\": its repo root \"{repo_root}\" is not itself trusted in {}, so there is nothing to derive trust from.", root_store.display()),
        )
        .with("projectPath", project_path)
        .with("repoRoot", repo_root)
        .with("settingsPath", &root_store.to_string_lossy()));
    }
    if trusted
        .iter()
        .any(|entry| matches_path(entry, project_path))
    {
        return Ok(false);
    }
    let mut next = trusted;
    next.push(Json::Str(project_path.to_string()));
    store.set("trustedWorkspaces", Json::Arr(next));
    write_store_json(settings_path, &store)?;
    Ok(true)
}

/// Drop one workspace's agy trust entry. Returns whether anything was there.
pub fn remove_agy_trust(settings_path: &Path, project_path: &str) -> Result<bool> {
    let mut store = read_agy_store(settings_path)?;
    let mut list = match store.get("trustedWorkspaces") {
        Some(Json::Arr(list)) => list.clone(),
        _ => return Ok(false),
    };
    let Some(index) = list
        .iter()
        .position(|entry| matches_path(entry, project_path))
    else {
        return Ok(false);
    };
    list.remove(index);
    store.set("trustedWorkspaces", Json::Arr(list));
    write_store_json(settings_path, &store)?;
    Ok(true)
}
