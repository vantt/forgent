//! The sole Git spawn door. Raw argv and borrowed spawn are crate-private.
use crate::*;
use fgos_process::containment::{self, ContainmentDriver, SpawnSpec, StartMode};
use fgos_process::DomainState;
use std::collections::BTreeMap;
use std::fs::{self, File};
use std::io::Read;
use std::path::{Path, PathBuf};
use std::sync::atomic::{AtomicBool, AtomicU64, Ordering};
use std::sync::{mpsc, Arc, Mutex, OnceLock};
use std::time::{Duration, Instant};

const PATH_LIMIT: usize = 64 * 1024 * 1024;
const DIFF_LIMIT: usize = 50 * 1024 * 1024;
const STDERR_LIMIT: usize = 64 * 1024;
static SERIAL: AtomicU64 = AtomicU64::new(0);
static GIT: OnceLock<Option<PathBuf>> = OnceLock::new();
// One selected executable and one floor result, including failures, per process.
static FLOOR: OnceLock<Result<GitFloorVerdict>> = OnceLock::new();

/// Effective config record: origin, normalized key, byte-preserving value.
type ConfigRecord = (Vec<u8>, String, Vec<u8>);
type ConfigEnvironment = (Option<std::ffi::OsString>, Option<std::ffi::OsString>);
#[derive(PartialEq, Eq)]
struct ConfigStamp {
    paths: Vec<PathBuf>,
    // Identity includes inode, length, mtime and ctime; missing inputs are
    // tracked too, without reading whole config files on the hot path.
    files: Vec<Option<String>>,
}
impl ConfigStamp {
    fn read(paths: Vec<PathBuf>) -> Result<Self> {
        let files = paths
            .iter()
            .map(|p| match fs::metadata(p) {
                Ok(m) => {
                    #[cfg(unix)]
                    let identity = {
                        use std::os::unix::fs::MetadataExt;
                        format!(
                            "{}:{}:{}:{}:{}:{}:{}",
                            m.dev(),
                            m.ino(),
                            m.len(),
                            m.mtime(),
                            m.mtime_nsec(),
                            m.ctime(),
                            m.ctime_nsec()
                        )
                    };
                    #[cfg(not(unix))]
                    let identity = format!("{}:{:?}:{:?}", m.len(), m.modified(), m.created());
                    Ok(Some(identity))
                }
                Err(e) if e.kind() == std::io::ErrorKind::NotFound => Ok(None),
                Err(e) => Err(io(e)),
            })
            .collect::<Result<Vec<_>>>()?;
        Ok(Self { paths, files })
    }
}

fn refusal(cause: impl Into<String>) -> OperationError {
    OperationError {
        code: ResultCode::Refused,
        cause: cause.into(),
        retryable: false,
        operation_id: None,
        receipt: None,
        exit_code: None,
        signal: None,
        stderr: Vec::new(),
    }
}
fn io(error: std::io::Error) -> OperationError {
    refusal(format!("git-driver-io: {error}"))
}

#[derive(Clone, Copy, PartialEq, Eq)]
#[allow(dead_code)] // Other operation layers arrive after this inspection checkpoint.
pub(crate) enum Policy {
    Inspect,
    Publication,
    Remote,
    HookContext,
}

/// Same-process opaque holder authority; operation layers validate the seal
/// binding before supplying it. Captured bytes return only after borrow cleanup.
pub(crate) trait BorrowedSpawn {
    fn run_borrowed(
        &self,
        spec: &fgos_holder_lock::BorrowSpec,
        io: &fgos_holder_lock::BorrowIo,
    ) -> Result<fgos_holder_lock::BorrowIoOutcome>;
}
impl BorrowedSpawn for fgos_holder_lock::Handle {
    fn run_borrowed(
        &self,
        spec: &fgos_holder_lock::BorrowSpec,
        io: &fgos_holder_lock::BorrowIo,
    ) -> Result<fgos_holder_lock::BorrowIoOutcome> {
        fgos_holder_lock::run_borrowed_io(self, spec, io).map_err(|e| refusal(e.to_string()))
    }
}

struct Scrubbed(BTreeMap<String, String>);
impl Scrubbed {
    fn new() -> Self {
        Self(
            std::env::vars_os()
                .filter_map(|(k, v)| {
                    let (k, v) = (k.into_string().ok()?, v.into_string().ok()?);
                    (!k.to_ascii_uppercase().starts_with("GIT_")).then_some((k, v))
                })
                .collect(),
        )
    }
}
/// Constructed only from validated Git-supplied hook authority, never an env bag.
#[allow(dead_code)]
struct HookContext {
    git_dir: PathBuf,
    work_tree: PathBuf,
    index: PathBuf,
}
#[allow(dead_code)]
impl HookContext {
    fn environment(&self) -> Result<Scrubbed> {
        let mut env = Scrubbed::new();
        for (key, path) in [
            ("GIT_DIR", &self.git_dir),
            ("GIT_WORK_TREE", &self.work_tree),
            ("GIT_INDEX_FILE", &self.index),
        ] {
            env.0.insert(
                key.into(),
                path.to_str()
                    .ok_or_else(|| refusal("non-utf8-hook-authority"))?
                    .into(),
            );
        }
        Ok(env)
    }
}

pub struct GitDriver {
    state_root: PathBuf,
    hooks: PathBuf,
    git: PathBuf,
    containment: Box<dyn ContainmentDriver>,
    publication_config: Mutex<BTreeMap<PathBuf, ConfigStamp>>,
    config_sources: Mutex<BTreeMap<ConfigEnvironment, Vec<PathBuf>>>,
}
impl GitDriver {
    /// state_root is a caller-owned trusted directory, not a repository path.
    pub fn new(state_root: &Path) -> Result<Self> {
        let state_root = fs::canonicalize(state_root).map_err(io)?;
        trusted_directory(&state_root)?;
        let hooks = state_root.join("git-empty-hooks");
        match fs::create_dir(&hooks) {
            Ok(()) => {
                #[cfg(unix)]
                {
                    use std::os::unix::fs::PermissionsExt;
                    fs::set_permissions(&hooks, fs::Permissions::from_mode(0o500)).map_err(io)?;
                }
            }
            Err(e) if e.kind() == std::io::ErrorKind::AlreadyExists => (),
            Err(e) => return Err(io(e)),
        }
        check_hooks(&hooks)?;
        let git = GIT
            .get_or_init(|| {
                std::env::split_paths(&std::env::var_os("PATH").unwrap_or_default())
                    .filter(|p| p.is_absolute())
                    .map(|p| p.join(if cfg!(windows) { "git.exe" } else { "git" }))
                    .find_map(|p| {
                        if p.is_file() {
                            fs::canonicalize(p).ok()
                        } else {
                            None
                        }
                    })
            })
            .clone()
            .ok_or_else(|| refusal("git-unavailable"))?;
        Ok(Self {
            publication_config: Mutex::new(BTreeMap::new()),
            config_sources: Mutex::new(BTreeMap::new()),
            state_root,
            hooks,
            git,
            containment: containment::select(&Default::default())
                .map_err(|e| refusal(e.to_string()))?,
        })
    }

    pub fn git_floor_verdict(&self) -> Result<&GitFloorVerdict> {
        match FLOOR.get_or_init(|| self.probe_floor()) {
            Ok(verdict) => Ok(verdict),
            Err(error) => {
                // Floor probes cannot publish or carry an operation receipt.
                let mut cached = refusal(format!("git-floor-probe-failed: {}", error.cause));
                cached.exit_code = error.exit_code;
                cached.signal = error.signal;
                cached.stderr = error.stderr.clone();
                Err(cached)
            }
        }
    }

    fn require_floor(&self) -> Result<()> {
        if self.git_floor_verdict()?.supported {
            Ok(())
        } else {
            Err(refusal("git-floor-unsupported"))
        }
    }

    /// Resolve only from an explicit trusted main checkout (or bare repository).
    /// Linked gitdir authority is read from the main registration, never .git.
    pub fn resolve_repo(&self, path: &Path, trusted_main: &Path) -> Result<ResolveRepo> {
        self.require_floor()?;
        let main = fs::canonicalize(trusted_main).map_err(io)?;
        let path = fs::canonicalize(path).map_err(io)?;
        let common = if main.join(".git").is_dir() {
            let dir = main.join(".git");
            if fs::symlink_metadata(&dir)
                .map_err(io)?
                .file_type()
                .is_symlink()
            {
                return Err(refusal("untrusted-worktree"));
            }
            fs::canonicalize(dir).map_err(io)?
        } else if main.join("HEAD").is_file() && main.join("objects").is_dir() {
            main.clone()
        } else {
            return Ok(ResolveRepo::NotARepository);
        };
        let mut git_dir = common.clone();
        let bare = common == main;
        let work_tree = if bare { None } else { Some(path.clone()) };
        if path != main {
            let mut found = None;
            if let Ok(entries) = fs::read_dir(common.join("worktrees")) {
                for entry in entries {
                    let admin = entry.map_err(io)?.path();
                    let backlink = fs::read(admin.join("gitdir")).map_err(io)?;
                    let backlink = line(&backlink)?;
                    if Path::new(backlink) == path.join(".git") {
                        let registered_common = fs::read(admin.join("commondir")).map_err(io)?;
                        if fs::canonicalize(admin.join(line(&registered_common)?)).map_err(io)?
                            != common
                        {
                            return Err(refusal("untrusted-worktree"));
                        }
                        found = Some(fs::canonicalize(admin).map_err(io)?);
                    }
                }
            }
            git_dir = found.ok_or_else(|| refusal("untrusted-worktree"))?;
        }
        let mut repo = RepoHandle {
            common_dir: common.clone(),
            trusted_main_root: main,
            object_format: ObjectFormat::Sha1,
            git_dir,
            work_tree,
            layout: RepoLayout {
                refs: RefStorage::Files,
                shallow: common.join("shallow").exists(),
                alternates: common.join("objects/info/alternates").exists(),
                promisor: false,
            },
        };
        self.preflight(&repo)?;
        let format = self.checked(
            &repo,
            &["rev-parse", "--show-object-format"],
            Policy::Inspect,
        )?;
        repo.object_format = match line(&format)? {
            "sha1" => ObjectFormat::Sha1,
            "sha256" => ObjectFormat::Sha256,
            _ => return Err(refusal("unsupported-object-format")),
        };
        let refs = self.checked(&repo, &["rev-parse", "--show-ref-format"], Policy::Inspect)?;
        repo.layout.refs = match line(&refs)? {
            "files" => RefStorage::Files,
            "reftable" => RefStorage::Reftable,
            _ => return Err(refusal("unsupported-ref-storage")),
        };
        let config = self.config(&repo)?;
        repo.layout.promisor = config.iter().any(|(_, k, v)| {
            (k.ends_with(".promisor") && v != b"false") || k == "extensions.partialclone"
        });
        Ok(ResolveRepo::Repository(repo))
    }

    /// Operation-layer door: even config reads borrow the caller's seal.
    pub(crate) fn publication_call(
        &self,
        repo: &RepoHandle,
        handle: &fgos_holder_lock::Handle,
        args: &[&str],
        input: &[u8],
        remote: bool,
        transport_timeout: Duration,
    ) -> Result<Output> {
        self.require_floor()?;
        fgos_holder_lock::validate(handle)
            .map_err(|e| refusal(format!("publication-borrow-unavailable: {e}")))?;
        self.publication_preflight(repo, handle)?;
        self.invoke_input(
            Some(repo),
            &repo.trusted_main_root,
            args,
            if remote {
                Policy::Remote
            } else {
                Policy::Publication
            },
            Some(handle),
            true,
            PATH_LIMIT,
            if remote {
                transport_timeout
            } else {
                Duration::from_secs(30)
            },
            input,
        )
    }

    fn publication_preflight(
        &self,
        repo: &RepoHandle,
        handle: &fgos_holder_lock::Handle,
    ) -> Result<()> {
        let environment = (
            std::env::var_os("HOME"),
            std::env::var_os("XDG_CONFIG_HOME"),
        );
        let mut sources = self
            .config_sources
            .lock()
            .map_err(|_| refusal("config-cache-poisoned"))?;
        let globals = if let Some(paths) = sources.get(&environment) {
            paths.clone()
        } else {
            let mut paths = Vec::new();
            // Ask the selected Git, including absent config inputs. Origin
            // records alone cannot reveal a missing system/global file that
            // appears later, and a custom Git prefix must never be guessed.
            for variable in ["GIT_CONFIG_SYSTEM", "GIT_CONFIG_GLOBAL"] {
                let out = self.invoke_input(
                    Some(repo),
                    &repo.trusted_main_root,
                    &["var", variable],
                    Policy::Publication,
                    Some(handle),
                    true,
                    PATH_LIMIT,
                    Duration::from_secs(30),
                    &[],
                )?;
                if !out.success {
                    return Err(out.error("git-config-paths-unavailable"));
                }
                for path in std::str::from_utf8(&out.stdout)
                    .map_err(|_| refusal("non-utf8-config-path"))?
                    .lines()
                {
                    let path = PathBuf::from(path);
                    if !path.is_absolute() {
                        return Err(refusal("relative-config-path"));
                    }
                    paths.push(path);
                }
            }
            sources.insert(environment, paths.clone());
            paths
        };
        drop(sources);
        let mut paths = globals;
        paths.extend([
            repo.common_dir.join("config"),
            repo.git_dir.join("config.worktree"),
        ]);
        let mut cache = self
            .publication_config
            .lock()
            .map_err(|_| refusal("config-cache-poisoned"))?;
        if let Some(stamp) = cache.get(repo.common_dir()) {
            // origins outside standard paths are kept as dependencies too.
            let mut known = paths.clone();
            known.extend(stamp.paths.iter().filter(|p| !paths.contains(p)).cloned());
            if ConfigStamp::read(known)? == *stamp {
                return Ok(());
            }
        }
        let before = ConfigStamp::read(paths.clone())?;
        let config = self.invoke_input(
            Some(repo),
            &repo.trusted_main_root,
            &["config", "--null", "--show-origin", "--list"],
            Policy::Publication,
            Some(handle),
            true,
            PATH_LIMIT,
            Duration::from_secs(30),
            &[],
        )?;
        if !config.success {
            return Err(config.error("git-config-failed"));
        }
        for (origin, key, _) in parse_config(&config.stdout)? {
            if command_config(&key) {
                return Err(refusal(format!("repository-config-untrusted: {key}")));
            }
            if let Some(path) = origin.strip_prefix(b"file:") {
                let path = PathBuf::from(
                    std::str::from_utf8(path).map_err(|_| refusal("non-utf8-config-origin"))?,
                );
                let path = if path.is_absolute() {
                    path
                } else {
                    repo.trusted_main_root.join(path)
                };
                if !paths.contains(&path) {
                    paths.push(path);
                }
            }
        }
        // Do not cache a decision across a config change during the read.
        if paths == before.paths && before == ConfigStamp::read(before.paths.clone())? {
            cache.insert(repo.common_dir.clone(), before);
        }
        Ok(())
    }

    // Deliberately re-read effective config each time. No stale config identity
    // cache, including includeIf/global/system changes, can authorize a call.
    fn config(&self, repo: &RepoHandle) -> Result<Vec<ConfigRecord>> {
        let out = self.invoke(
            Some(repo),
            &repo.trusted_main_root,
            &["config", "--null", "--show-origin", "--list"],
            Policy::Inspect,
            None,
            false,
            PATH_LIMIT,
            Duration::from_secs(30),
        )?;
        if !out.success {
            return Err(out.error("git-config-failed"));
        }
        parse_config(&out.stdout)
    }
    fn preflight(&self, repo: &RepoHandle) -> Result<()> {
        for (_, key, _) in self.config(repo)? {
            if command_config(&key) {
                return Err(refusal(format!("repository-config-untrusted: {key}")));
            }
        }
        Ok(())
    }
    fn checked(&self, repo: &RepoHandle, args: &[&str], policy: Policy) -> Result<Vec<u8>> {
        self.require_floor()?;
        self.preflight(repo)?;
        let out = self.invoke(
            Some(repo),
            &repo.trusted_main_root,
            args,
            policy,
            None,
            true,
            if args.first() == Some(&"diff") {
                DIFF_LIMIT
            } else {
                PATH_LIMIT
            },
            Duration::from_secs(30),
        )?;
        if out.success {
            return Ok(out.stdout);
        }
        let cause = if repo.layout.promisor {
            "promisor-object-unavailable"
        } else if repo.layout.alternates {
            "alternate-object-unavailable"
        } else if repo.layout.shallow {
            "shallow-history-incomplete"
        } else {
            "git-command-failed"
        };
        Err(out.error(cause))
    }

    #[allow(clippy::too_many_arguments)]
    fn invoke(
        &self,
        repo: Option<&RepoHandle>,
        cwd: &Path,
        args: &[&str],
        policy: Policy,
        loan: Option<&dyn BorrowedSpawn>,
        hardened: bool,
        limit: usize,
        timeout: Duration,
    ) -> Result<Output> {
        self.invoke_input(repo, cwd, args, policy, loan, hardened, limit, timeout, &[])
    }

    #[allow(clippy::too_many_arguments)]
    fn invoke_input(
        &self,
        repo: Option<&RepoHandle>,
        cwd: &Path,
        args: &[&str],
        policy: Policy,
        loan: Option<&dyn BorrowedSpawn>,
        hardened: bool,
        limit: usize,
        timeout: Duration,
        input: &[u8],
    ) -> Result<Output> {
        check_hooks(&self.hooks)?;
        let mut argv = vec![text_path(&self.git)?];
        argv.extend(
            [
                "--no-replace-objects",
                "-c",
                "core.fsmonitor=false",
                "-c",
                "gc.auto=0",
                "-c",
                "maintenance.auto=false",
                "-c",
                "rerere.enabled=false",
                "-c",
                "merge.autoStash=false",
            ]
            .map(str::to_owned),
        );
        if policy != Policy::HookContext {
            argv.extend([
                "-c".into(),
                format!("core.hooksPath={}", text_path(&self.hooks)?),
            ]);
        }
        if policy != Policy::Remote {
            argv.extend(["-c".into(), "protocol.allow=never".into()]);
        }
        if policy != Policy::Remote && hardened {
            argv.push("--no-lazy-fetch".into());
        }
        if policy == Policy::Inspect {
            argv.push("--no-optional-locks".into());
        }
        if let Some(repo) = repo {
            argv.push(format!("--git-dir={}", text_path(&repo.git_dir)?));
            if let Some(w) = &repo.work_tree {
                argv.push(format!("--work-tree={}", text_path(w)?));
            }
        }
        for (i, arg) in args.iter().enumerate() {
            argv.push((*arg).to_owned());
            if i == 0 && *arg == "update-ref" {
                argv.push("--no-deref".into());
            }
        }
        if policy == Policy::Remote && args.contains(&"protocol.file.allow=always") {
            let verb = args
                .iter()
                .find(|a| matches!(**a, "push" | "fetch" | "ls-remote"));
            if let Some(verb) = verb {
                let service = if *verb == "push" {
                    "receive-pack"
                } else {
                    "upload-pack"
                };
                let option = if *verb == "push" {
                    "--receive-pack"
                } else {
                    "--upload-pack"
                };
                // Git's local transport scrubs the client's config. Carry the
                // hook prohibition explicitly to its server-side Git process.
                let quote = |s: &str| format!("'{}'", s.replace('\'', "'\"'\"'"));
                let command = format!(
                    "{} -c {} {}",
                    quote(&text_path(&self.git)?),
                    quote(&format!("core.hooksPath={}", text_path(&self.hooks)?)),
                    service
                );
                let at = argv.iter().position(|a| a == "--").unwrap_or(argv.len());
                argv.insert(at, format!("{option}={command}"));
            }
        }
        if args.first() == Some(&"diff") {
            argv.extend(["--no-ext-diff", "--no-textconv", "--no-relative"].map(str::to_owned));
        }
        let mut env = Scrubbed::new();
        env.0.insert("LC_ALL".into(), "C".into());
        env.0.insert("LANGUAGE".into(), String::new());
        if policy != Policy::Remote {
            env.0.insert("GIT_NO_LAZY_FETCH".into(), "1".into());
        }
        env.0.insert("GIT_TERMINAL_PROMPT".into(), "0".into());
        if policy == Policy::Publication || (policy == Policy::Remote && loan.is_some()) {
            let loan = loan.ok_or_else(|| refusal("publication-borrow-required"))?;
            let result = loan.run_borrowed(
                &fgos_holder_lock::BorrowSpec {
                    argv,
                    cwd: Some(cwd.into()),
                    env: env.0,
                    clear_env: true,
                    stdio: fgos_holder_lock::BorrowStdio::Null,
                },
                &fgos_holder_lock::BorrowIo {
                    stdin: input.to_vec(),
                    stdout_limit: limit,
                    stderr_limit: STDERR_LIMIT,
                    deadline: Instant::now()
                        .checked_add(timeout)
                        .ok_or_else(|| refusal("invalid-git-deadline"))?,
                },
            )?;
            return Ok(Output {
                stdout: result.stdout,
                stderr: redact(&result.stderr),
                success: result.outcome.exit == Some(0),
                code: result.outcome.exit,
            });
        }
        if !input.is_empty() {
            return Err(refusal("git-input-requires-borrow"));
        }
        let (stdout_r, stdout_w) = std::io::pipe().map_err(io)?;
        let (stderr_r, stderr_w) = std::io::pipe().map_err(io)?;
        let spec = SpawnSpec {
            argv,
            bwrap_prefix: None,
            fd_map: Vec::new(),
            env: env.0,
            cwd: cwd.into(),
            stdin: None,
            stdout: Some(pipe_file(stdout_w)),
            stderr: Some(pipe_file(stderr_w)),
            mode: StartMode::Direct,
        };
        let id = format!(
            "git-{}-{}",
            std::process::id(),
            SERIAL.fetch_add(1, Ordering::Relaxed)
        );
        let mut domain = self
            .containment
            .create(&id)
            .map_err(|e| refusal(e.to_string()))?;
        let mut spawned = self
            .containment
            .spawn_in(&mut domain, spec)
            .map_err(|e| refusal(e.to_string()))?;
        let overflow = Arc::new(AtomicBool::new(false));
        let out = capture(stdout_r, limit, overflow.clone());
        let err = capture(stderr_r, STDERR_LIMIT, overflow.clone());
        let start = Instant::now();
        let mut stopped = None;
        let status = loop {
            if let Some(status) = spawned.child.try_wait().map_err(io)? {
                break status;
            }
            if overflow.load(Ordering::Relaxed) || start.elapsed() >= timeout {
                stopped = Some(if overflow.load(Ordering::Relaxed) {
                    "git-output-limit"
                } else {
                    "git-timeout"
                });
                self.containment.kill_all(&mut domain, 0);
                break spawned.child.wait().map_err(io)?;
            }
            std::thread::sleep(Duration::from_millis(2));
        };
        // A root exit is not proof that pipe-owning descendants have exited.
        if self.containment.is_empty(&mut domain) != DomainState::Empty {
            self.containment.kill_all(&mut domain, 0);
            if self.containment.is_empty(&mut domain) != DomainState::Empty {
                // Readers are detached, never block indefinitely on an escapee.
                return Err(refusal("containment-unproven"));
            }
        }
        let stdout = out
            .recv_timeout(Duration::from_secs(1))
            .map_err(|_| refusal("containment-unproven"))?
            .map_err(io)?;
        let stderr = redact(
            &err.recv_timeout(Duration::from_secs(1))
                .map_err(|_| refusal("containment-unproven"))?
                .map_err(io)?,
        );
        if let Some(cause) = stopped {
            return Err(refusal(cause));
        }
        if overflow.load(Ordering::Relaxed) {
            return Err(refusal("git-output-limit"));
        }
        Ok(Output {
            stdout,
            stderr,
            success: status.success(),
            code: status.code(),
        })
    }
    fn probe_floor(&self) -> Result<GitFloorVerdict> {
        let out = self.invoke(
            None,
            &self.state_root,
            &["--version"],
            Policy::Inspect,
            None,
            false,
            4096,
            Duration::from_secs(10),
        )?;
        let version = line(&out.stdout)?
            .strip_prefix("git version ")
            .ok_or_else(|| refusal("git-version-invalid"))?
            .to_owned();
        let numeric: Vec<u32> = version
            .split('.')
            .take(3)
            .map(|s| s.parse().unwrap_or(0))
            .collect();
        let contract: serde_json::Value =
            serde_json::from_str(include_str!("../../contracts/git-floor.v1.json"))
                .expect("floor contract");
        let minimum: Vec<u32> = contract["minimum"]
            .as_array()
            .expect("floor")
            .iter()
            .map(|n| n.as_u64().expect("number") as u32)
            .collect();
        let mut verdict = GitFloorVerdict {
            version,
            minimum: contract["minimumVersion"].as_str().unwrap().into(),
            supported: false,
            probes: Vec::new(),
        };
        if numeric < minimum {
            return Ok(verdict);
        }
        let dir = self.state_root.join(format!(
            "git-floor-{}-{}",
            std::process::id(),
            SERIAL.fetch_add(1, Ordering::Relaxed)
        ));
        fs::create_dir(&dir).map_err(io)?;
        let result = self.probe_features(&dir, &mut verdict);
        // Probe evidence is diagnostic, not operation evidence; no WAL is here.
        let cleanup = fs::remove_dir_all(&dir).map_err(io);
        result?;
        cleanup?;
        verdict.supported = verdict.probes.iter().all(|p| p.passed);
        Ok(verdict)
    }
    fn probe_features(&self, dir: &Path, verdict: &mut GitFloorVerdict) -> Result<()> {
        let run = |args: &[&str]| {
            self.invoke(
                None,
                dir,
                args,
                Policy::Inspect,
                None,
                true,
                PATH_LIMIT,
                Duration::from_secs(10),
            )
        };
        if !run(&["init", "--bare", "--quiet", "."])?.success {
            return Err(refusal("git-floor-probe-init"));
        }
        let marker = dir.join("hook-ran");
        fs::write(
            dir.join("hooks/reference-transaction"),
            b"#!/bin/sh\nprintf ran > hook-ran\n",
        )
        .map_err(io)?;
        #[cfg(unix)]
        {
            use std::os::unix::fs::PermissionsExt;
            fs::set_permissions(
                dir.join("hooks/reference-transaction"),
                fs::Permissions::from_mode(0o700),
            )
            .map_err(io)?;
        }
        // hash an empty file without stdin; --literally is intentionally absent.
        fs::write(dir.join("empty"), b"").map_err(io)?;
        let blob = run(&["hash-object", "-w", "empty"])?;
        let oid = line(&blob.stdout)?;
        let first = run(&["update-ref", "refs/probe/victim", oid])?;
        let sym = run(&["symbolic-ref", "refs/probe/symbolic", "refs/probe/victim"])?;
        let del = run(&["update-ref", "--no-deref", "-d", "refs/probe/symbolic", oid])?;
        let victim = run(&["rev-parse", "--verify", "refs/probe/victim"])?;
        let symbolic = run(&["symbolic-ref", "-q", "refs/probe/symbolic"])?;
        verdict.probes.push(FloorProbe {
            name: "update-ref-no-deref".into(),
            passed: first.success
                && sym.success
                && del.success
                && victim.success
                && line(&victim.stdout)? == oid
                && !symbolic.success,
            evidence: "exact-old symbolic delete preserves victim".into(),
        });
        let suppressed = first.success && !marker.exists();
        let control = run(&[
            "-c",
            "core.hooksPath=hooks",
            "update-ref",
            "refs/probe/control",
            oid,
        ])?;
        verdict.probes.push(FloorProbe {
            name: "hook-suppression".into(),
            passed: suppressed && control.success && marker.exists(),
            evidence: "trusted hooksPath suppresses reference-transaction; enabled control runs it"
                .into(),
        });
        let hook = run(&["hook", "run", "--ignore-missing", "pre-commit"])?;
        verdict.probes.push(FloorProbe {
            name: "hook-run".into(),
            passed: hook.success,
            evidence: "hook run --ignore-missing accepted".into(),
        });
        // A real promisor repository whose transport would leave a marker if
        // lazy fetching ran. A missing object must fail without that transport.
        let fetch_marker = dir.join("fetch-ran");
        let transport = dir.join("transport");
        if fetch_marker.to_string_lossy().contains('\'') {
            return Err(refusal("unsupported-probe-path"));
        }
        fs::write(
            &transport,
            format!(
                "#!/bin/sh\nprintf ran > '{}'\nexit 1\n",
                fetch_marker.display()
            ),
        )
        .map_err(io)?;
        #[cfg(unix)]
        {
            use std::os::unix::fs::PermissionsExt;
            fs::set_permissions(&transport, fs::Permissions::from_mode(0o700)).map_err(io)?;
        }
        for args in [
            vec!["config", "remote.origin.promisor", "true"],
            vec!["config", "remote.origin.url", "ssh://example.invalid/repo"],
            vec![
                "config",
                "core.sshCommand",
                transport
                    .to_str()
                    .ok_or_else(|| refusal("non-utf8-state-root"))?,
            ],
        ] {
            if !run(&args)?.success {
                return Err(refusal("git-floor-probe-config"));
            }
        }
        let missing = "1234567890123456789012345678901234567890";
        let read = run(&["cat-file", "-e", missing])?;
        let suppressed = !read.success && !fetch_marker.exists();
        let control = self.invoke(
            None,
            dir,
            &["cat-file", "-e", missing],
            Policy::Remote,
            None,
            false,
            PATH_LIMIT,
            Duration::from_secs(10),
        )?;
        verdict.probes.push(FloorProbe {
            name: "no-lazy-fetch".into(),
            passed: suppressed && !control.success && fetch_marker.exists(),
            evidence:
                "missing promisor object does not fetch; lazy-enabled control invokes SSH transport"
                    .into(),
        });
        Ok(())
    }
}

pub(crate) struct Output {
    pub(crate) stdout: Vec<u8>,
    pub(crate) stderr: Vec<u8>,
    pub(crate) success: bool,
    pub(crate) code: Option<i32>,
}
impl Output {
    pub(crate) fn error(self, cause: &str) -> OperationError {
        let mut e = refusal(cause);
        e.exit_code = self.code;
        e.stderr = self.stderr;
        e
    }
}
fn text_path(path: &Path) -> Result<String> {
    path.to_str()
        .map(str::to_owned)
        .ok_or_else(|| refusal("non-utf8-authority-path"))
}
fn line(bytes: &[u8]) -> Result<&str> {
    let bytes = bytes.strip_suffix(b"\n").unwrap_or(bytes);
    std::str::from_utf8(bytes).map_err(|_| refusal("git-protocol-invalid-utf8"))
}
fn trusted_directory(path: &Path) -> Result<()> {
    let meta = fs::symlink_metadata(path).map_err(io)?;
    if !meta.is_dir() || meta.file_type().is_symlink() {
        return Err(refusal("untrusted-driver-directory"));
    }
    #[cfg(unix)]
    {
        use std::os::unix::fs::MetadataExt;
        // The state root must belong to this process's user, not a repository.
        if meta.mode() & 0o022 != 0 || meta.uid() != current_uid() {
            return Err(refusal("untrusted-driver-directory"));
        }
    }
    Ok(())
}
#[cfg(unix)]
fn current_uid() -> u32 {
    // SAFETY: getuid has no preconditions.
    unsafe { libc::getuid() }
}
fn check_hooks(path: &Path) -> Result<()> {
    trusted_directory(path)?;
    if fs::read_dir(path).map_err(io)?.next().is_some() {
        return Err(refusal("trusted-hooks-not-empty"));
    }
    #[cfg(unix)]
    {
        use std::os::unix::fs::PermissionsExt;
        if fs::metadata(path).map_err(io)?.permissions().mode() & 0o777 != 0o500 {
            return Err(refusal("trusted-hooks-permissions"));
        }
    }
    Ok(())
}
#[cfg(unix)]
fn pipe_file(pipe: std::io::PipeWriter) -> File {
    use std::os::fd::OwnedFd;
    File::from(OwnedFd::from(pipe))
}
#[cfg(windows)]
fn pipe_file(pipe: std::io::PipeWriter) -> File {
    use std::os::windows::io::OwnedHandle;
    File::from(OwnedHandle::from(pipe))
}
fn capture(
    mut input: impl Read + Send + 'static,
    limit: usize,
    overflow: Arc<AtomicBool>,
) -> mpsc::Receiver<std::io::Result<Vec<u8>>> {
    let (tx, rx) = mpsc::channel();
    std::thread::spawn(move || {
        let result = (|| {
            let mut bytes = Vec::new();
            let mut buf = [0; 8192];
            loop {
                let n = input.read(&mut buf)?;
                if n == 0 {
                    return Ok(bytes);
                }
                let take = n.min(limit.saturating_sub(bytes.len()));
                bytes.extend_from_slice(&buf[..take]);
                if take < n {
                    overflow.store(true, Ordering::Relaxed);
                }
            }
        })();
        let _ = tx.send(result);
    });
    rx
}
fn redact(bytes: &[u8]) -> Vec<u8> {
    // Preserve Git's diagnostic text while redacting URL userinfo and query
    // credentials. Config refusals never include values in the first place.
    String::from_utf8_lossy(bytes)
        .split_inclusive(char::is_whitespace)
        .map(|part| {
            if let Some(scheme) = part.find("://") {
                let start = scheme + 3;
                let end = part[start..].find('/').map_or(part.len(), |i| start + i);
                let mut result = part.to_owned();
                if let Some(at) = part[start..end].rfind('@') {
                    result.replace_range(start..start + at, "[redacted]");
                }
                if let Some(q) = result.find('?') {
                    result.truncate(q);
                    result.push_str("?[redacted]");
                }
                result
            } else {
                part.to_owned()
            }
        })
        .collect::<String>()
        .into_bytes()
}
fn command_config(key: &str) -> bool {
    key == "diff.external"
        || key == "core.sshcommand"
        || key == "gpg.program"
        || key == "credential.helper"
        || key == "include.path"
        || key.starts_with("includeif.")
        || (key.starts_with("filter.")
            && [".clean", ".smudge", ".process"]
                .iter()
                .any(|s| key.ends_with(s)))
        || (key.starts_with("diff.") && key.ends_with(".textconv"))
        || (key.starts_with("merge.") && key.ends_with(".driver"))
        || (key.starts_with("url.") && key.ends_with(".insteadof"))
        || (key.starts_with("remote.")
            && [".uploadpack", ".receivepack"]
                .iter()
                .any(|s| key.ends_with(s)))
}
/// Config --null --show-origin emits alternating origin NUL key LF value NUL.
fn parse_config(bytes: &[u8]) -> Result<Vec<ConfigRecord>> {
    let fields = nul_records(bytes)?;
    if fields.len() % 2 != 0 {
        return Err(refusal("git-config-protocol"));
    }
    fields
        .as_chunks::<2>()
        .0
        .iter()
        .map(|pair| {
            let split = pair[1]
                .iter()
                .position(|b| *b == b'\n')
                .unwrap_or(pair[1].len());
            let key = std::str::from_utf8(&pair[1][..split])
                .map_err(|_| refusal("git-config-protocol"))?
                .to_ascii_lowercase();
            let value = pair[1].get(split + 1..).unwrap_or_default().to_vec();
            Ok((pair[0].to_vec(), key, value))
        })
        .collect()
}
/// Byte preserving; a missing final delimiter is corrupt, never partial success.
fn nul_records(bytes: &[u8]) -> Result<Vec<&[u8]>> {
    if bytes.is_empty() {
        return Ok(Vec::new());
    }
    if bytes.last() != Some(&0) {
        return Err(refusal("git-nul-protocol-truncated"));
    }
    Ok(bytes[..bytes.len() - 1].split(|b| *b == 0).collect())
}

/// Read-only WAL observations use the same hardened driver as repository
/// inspection. No raw Git spawn or filesystem ref parser in the journal.
pub struct WalReader<'a> {
    pub driver: &'a GitDriver,
    pub repo: &'a RepoHandle,
}
impl crate::wal::RecoveryReader for WalReader<'_> {
    fn read_ref(&self, reference: &str) -> crate::wal::WalResult<crate::wal::ObservedRef> {
        use crate::wal::{ObservedRef, Tip, WalError};
        RefName::parse(reference).map_err(|_| WalError::RecoveryRequired)?;
        // Also catches a dangling symbolic ref, which for-each-ref omits.
        if self
            .driver
            .checked(
                self.repo,
                &["symbolic-ref", "--quiet", "--", reference],
                Policy::Inspect,
            )
            .is_ok()
        {
            return Ok(ObservedRef::Symbolic);
        }
        match self.driver.checked(
            self.repo,
            &["show-ref", "--exists", "--", reference],
            Policy::Inspect,
        ) {
            Ok(_) => (),
            Err(e) if e.exit_code == Some(2) => return Ok(ObservedRef::Direct(Tip::Absent)),
            Err(_) => return Err(WalError::RecoveryRequired),
        }
        // for-each-ref succeeds for an absent ref, unlike rev-parse. Recheck
        // exact name: its pattern argument also matches descendants.
        let bytes = self
            .driver
            .checked(
                self.repo,
                &[
                    "for-each-ref",
                    "--format=%(refname)%00%(objectname)%00%(symref)",
                    "--",
                    reference,
                ],
                Policy::Inspect,
            )
            .map_err(|_| WalError::RecoveryRequired)?;
        for line in bytes.split(|b| *b == b'\n').filter(|l| !l.is_empty()) {
            let parts: Vec<_> = line.split(|b| *b == 0).collect();
            if parts.len() != 3 {
                return Err(WalError::RecoveryRequired);
            }
            if parts[0] != reference.as_bytes() {
                continue;
            }
            if !parts[2].is_empty() {
                return Ok(ObservedRef::Symbolic);
            }
            let oid = std::str::from_utf8(parts[1]).map_err(|_| WalError::RecoveryRequired)?;
            Oid::parse(oid, self.repo.object_format()).map_err(|_| WalError::RecoveryRequired)?;
            return Ok(ObservedRef::Direct(Tip::Oid(oid.into())));
        }
        Err(WalError::RecoveryRequired)
    }
    fn candidate_intact(&self, intent: &crate::wal::Intent) -> crate::wal::WalResult<bool> {
        if let crate::wal::Tip::Oid(oid) = intent.candidate() {
            Oid::parse(oid, self.repo.object_format())
                .map_err(|_| crate::wal::WalError::RecoveryRequired)?;
            if self.repo.layout().shallow {
                return Ok(false);
            }
            return Ok(self
                .driver
                .checked(self.repo, &["cat-file", "-e", "--", oid], Policy::Inspect)
                .is_ok()
                && self
                    .driver
                    .checked(
                        self.repo,
                        &["rev-list", "--objects", oid, "--"],
                        Policy::Inspect,
                    )
                    .is_ok());
        }
        Ok(true)
    }
}

impl Inspect for GitDriver {
    fn configured_fetch_refspecs(
        &self,
        repo: &RepoHandle,
        remote: &str,
    ) -> Result<Vec<ConfigFact>> {
        config_facts(self, repo, &format!("remote.{remote}.fetch"))
    }
    fn push_refspecs(&self, repo: &RepoHandle, remote: &str) -> Result<Vec<ConfigFact>> {
        config_facts(self, repo, &format!("remote.{remote}.push"))
    }
    fn remote_url(&self, repo: &RepoHandle, remote: &str) -> Result<String> {
        let out = self.checked(repo, &["remote", "get-url", "--", remote], Policy::Inspect)?;
        Ok(line(&redact(&out))?.into())
    }
    fn machine_id(&self, repo: &RepoHandle) -> Result<Option<ConfigFact>> {
        Ok(config_facts(self, repo, "fgos.machineid")?.pop())
    }
    fn git_floor_verdict(&self) -> Result<GitFloorVerdict> {
        let v = GitDriver::git_floor_verdict(self)?;
        Ok(GitFloorVerdict {
            version: v.version.clone(),
            minimum: v.minimum.clone(),
            supported: v.supported,
            probes: v
                .probes
                .iter()
                .map(|p| FloorProbe {
                    name: p.name.clone(),
                    passed: p.passed,
                    evidence: p.evidence.clone(),
                })
                .collect(),
        })
    }
    fn fetch_mapping_provenance(
        &self,
        _repo: &RepoHandle,
        _remote: &str,
    ) -> Result<Option<FetchMappingProvenance>> {
        let wal = match crate::wal::Wal::open_existing(_repo.common_dir(), crate::wal::OsFileSystem)
        {
            Ok(wal) => wal,
            Err(crate::wal::WalError::Io(e)) if e.kind() == std::io::ErrorKind::NotFound => {
                return Ok(None)
            }
            Err(e) => return Err(refusal(format!("git-wal-unreadable: {e}"))),
        };
        let scan = wal.scan(100_000).map_err(|e| refusal(e.to_string()))?;
        if !scan.complete || scan.entries.iter().any(|e| e.error.is_some()) {
            return Err(refusal("git-wal-unreadable"));
        }
        let mut facts = Vec::new();
        for entry in scan.entries {
            if let Ok(chain) = wal.inspect(&entry.operation_id) {
                if matches!(
                    chain.outcome(),
                    Some(crate::wal::Outcome::Transfer {
                        acknowledged: true,
                        unknown: false,
                        ..
                    })
                ) {
                    if let crate::wal::OperationKind::ConfigChange(change) = &chain.intent().kind {
                        let crate::wal::ConfigChange {
                            remote,
                            url,
                            refspecs,
                            ..
                        } = change.as_ref();
                        if remote == _remote {
                            facts.push((
                                std::fs::metadata(
                                    _repo
                                        .common_dir()
                                        .join("fgos/git/operations")
                                        .join(&entry.operation_id),
                                )
                                .and_then(|m| m.modified())
                                .map_err(io)?,
                                FetchMappingProvenance {
                                    operation_id: entry.operation_id,
                                    remote_url: url.clone(),
                                    refspecs: refspecs.clone(),
                                },
                            ));
                        }
                    }
                }
            }
        }
        facts.sort_by_key(|(time, _)| *time);
        Ok(facts.pop().map(|(_, fact)| fact))
    }

    fn resolve_repo(&self, path: &Path) -> Result<ResolveRepo> {
        GitDriver::resolve_repo(self, path, path)
    }
}
fn config_facts(driver: &GitDriver, repo: &RepoHandle, key: &str) -> Result<Vec<ConfigFact>> {
    driver
        .config(repo)?
        .into_iter()
        .filter(|(_, k, _)| k == &key.to_ascii_lowercase())
        .map(|(origin, _, value)| {
            Ok(ConfigFact {
                value,
                origin: PathBuf::from(
                    line(&origin)?
                        .strip_prefix("file:")
                        .unwrap_or(line(&origin)?),
                ),
            })
        })
        .collect()
}

#[cfg(test)]
mod tests {
    use super::*;
    use std::process::Command;
    struct Temp(PathBuf);
    impl Temp {
        fn new() -> Self {
            let p = std::env::temp_dir().join(format!(
                "fgos-git-driver-{}-{}",
                std::process::id(),
                SERIAL.fetch_add(1, Ordering::Relaxed)
            ));
            fs::create_dir(&p).unwrap();
            #[cfg(unix)]
            {
                use std::os::unix::fs::PermissionsExt;
                fs::set_permissions(&p, fs::Permissions::from_mode(0o700)).unwrap();
            }
            Self(p)
        }
    }
    impl Drop for Temp {
        fn drop(&mut self) {
            let _ = fs::remove_dir_all(&self.0);
        }
    }
    fn git(dir: &Path, args: &[&str]) -> Vec<u8> {
        let out = Command::new("git")
            .current_dir(dir)
            .args(args)
            .output()
            .unwrap();
        assert!(
            out.status.success(),
            "{:?}: {}",
            args,
            String::from_utf8_lossy(&out.stderr)
        );
        out.stdout
    }
    fn resolve(driver: &GitDriver, path: &Path) -> RepoHandle {
        match driver.resolve_repo(path, path).unwrap() {
            ResolveRepo::Repository(r) => r,
            _ => panic!("not repo"),
        }
    }
    #[test]
    #[cfg(unix)]
    fn publication_borrow_hash_object_binary_round_trip() {
        use fgos_holder_lock::{acquire, release, Acquire, Mode, Resource, Wait};
        let state = Temp::new();
        let dir = Temp::new();
        git(&dir.0, &["init", "-q"]);
        // A real executable hook would fail the operation if hooks were enabled.
        let hook = dir.0.join(".git/hooks/reference-transaction");
        fs::write(&hook, b"#!/bin/sh\nexit 91\n").unwrap();
        use std::os::unix::fs::PermissionsExt;
        fs::set_permissions(&hook, fs::Permissions::from_mode(0o700)).unwrap();
        let driver = GitDriver::new(&state.0).unwrap();
        let repo = resolve(&driver, &dir.0);
        let resource = Resource::new("event-seal", state.0.join("seal.lock"));
        let handle = match acquire(&resource, Mode::Ex, Wait::Try, 2000) {
            Acquire::Acquired(h) => h,
            other => panic!("{other:?}"),
        };
        let input: Vec<u8> = (0..=255).cycle().take(256 * 1024).collect();
        let out = driver
            .invoke_input(
                Some(&repo),
                &dir.0,
                &["hash-object", "--stdin", "-w"],
                Policy::Publication,
                Some(&handle),
                true,
                PATH_LIMIT,
                Duration::from_secs(10),
                &input,
            )
            .unwrap();
        assert!(out.success);
        assert!(out.stderr.is_empty());
        let oid = line(&out.stdout).unwrap();
        let read = driver
            .invoke(
                Some(&repo),
                &dir.0,
                &["cat-file", "blob", oid],
                Policy::Publication,
                Some(&handle),
                true,
                PATH_LIMIT,
                Duration::from_secs(10),
            )
            .unwrap();
        assert!(read.success);
        assert_eq!(read.stdout, input);
        // Also exercise a hook-capable borrowed command through the same policy.
        let commit = git(
            &dir.0,
            &[
                "-c",
                "user.name=Test",
                "-c",
                "user.email=t@e",
                "commit-tree",
                "4b825dc642cb6eb9a060e54bf8d69288fbee4904",
                "-m",
                "test",
            ],
        );
        let updated = driver
            .invoke(
                Some(&repo),
                &dir.0,
                &["update-ref", "refs/test/borrow", line(&commit).unwrap()],
                Policy::Publication,
                Some(&handle),
                true,
                PATH_LIMIT,
                Duration::from_secs(10),
            )
            .unwrap();
        assert!(updated.success, "{:?}", updated.stderr);
        let control = Command::new("git")
            .current_dir(&dir.0)
            .args(["update-ref", "refs/test/control", line(&commit).unwrap()])
            .output()
            .unwrap();
        assert!(
            !control.status.success(),
            "the installed hook must reject the control"
        );
        release(handle);
    }
    #[test]
    fn floor_and_all_repository_backends() {
        let state = Temp::new();
        let driver = GitDriver::new(&state.0).unwrap();
        let floor = driver.git_floor_verdict().unwrap();
        assert!(floor.supported, "{floor:?}");
        assert_eq!(floor.probes.len(), 4);
        for refs in ["files", "reftable"] {
            for format in ["sha1", "sha256"] {
                let repo = Temp::new();
                git(
                    &repo.0,
                    &[
                        "init",
                        "--quiet",
                        &format!("--ref-format={refs}"),
                        &format!("--object-format={format}"),
                    ],
                );
                let r = resolve(&driver, &repo.0);
                assert_eq!(
                    r.object_format(),
                    if format == "sha1" {
                        ObjectFormat::Sha1
                    } else {
                        ObjectFormat::Sha256
                    }
                );
                assert_eq!(
                    r.layout.refs,
                    if refs == "files" {
                        RefStorage::Files
                    } else {
                        RefStorage::Reftable
                    }
                );
                assert!(!r.layout.shallow && !r.layout.alternates && !r.layout.promisor);
                assert_eq!(
                    r.common_dir(),
                    fs::canonicalize(repo.0.join(".git")).unwrap()
                );
            }
        }
        let outside = Temp::new();
        assert!(matches!(
            driver.resolve_repo(&outside.0, &outside.0).unwrap(),
            ResolveRepo::NotARepository
        ));
    }
    #[test]
    fn config_preflight_reloads_and_names_every_command_key() {
        let state = Temp::new();
        let dir = Temp::new();
        git(&dir.0, &["init", "-q"]);
        let driver = GitDriver::new(&state.0).unwrap();
        let repo = resolve(&driver, &dir.0);
        for key in [
            "filter.x.clean",
            "filter.x.smudge",
            "filter.x.process",
            "diff.external",
            "diff.x.textconv",
            "merge.x.driver",
            "gpg.program",
            "include.path",
            "includeIf.gitdir:x.path",
            "credential.helper",
            "url.x.insteadOf",
            "remote.x.uploadpack",
            "remote.x.receivepack",
            "core.sshCommand",
        ] {
            git(&dir.0, &["config", key, "/nonexistent/command"]);
            let err = driver
                .checked(&repo, &["status", "--porcelain=v1", "-z"], Policy::Inspect)
                .unwrap_err();
            assert!(
                err.cause.starts_with("repository-config-untrusted:"),
                "{key}: {err:?}"
            );
            git(&dir.0, &["config", "--unset", key]);
        }
        assert!(driver
            .checked(&repo, &["status", "--porcelain=v1", "-z"], Policy::Inspect)
            .unwrap()
            .is_empty());
    }
    #[test]
    fn layouts_preserve_missing_object_diagnostics_without_fetch() {
        let state = Temp::new();
        let dir = Temp::new();
        git(&dir.0, &["init", "-q"]);
        let driver = GitDriver::new(&state.0).unwrap();
        git(&dir.0, &["config", "remote.origin.promisor", "true"]);
        git(
            &dir.0,
            &["config", "remote.origin.url", "/definitely/not/a/remote"],
        );
        let repo = resolve(&driver, &dir.0);
        assert!(repo.layout.promisor);
        let err = driver
            .checked(
                &repo,
                &["cat-file", "-t", "1234567890123456789012345678901234567890"],
                Policy::Inspect,
            )
            .unwrap_err();
        assert_eq!(err.cause, "promisor-object-unavailable");
        assert!(!err.stderr.is_empty());
        git(&dir.0, &["config", "--unset", "remote.origin.promisor"]);
        fs::write(
            dir.0.join(".git/objects/info/alternates"),
            b"/missing/alternate\n",
        )
        .unwrap();
        let repo = resolve(&driver, &dir.0);
        assert!(repo.layout.alternates);
        let err = driver
            .checked(
                &repo,
                &["cat-file", "-t", "1234567890123456789012345678901234567890"],
                Policy::Inspect,
            )
            .unwrap_err();
        assert_eq!(err.cause, "alternate-object-unavailable");
        assert!(!err.stderr.is_empty());
        fs::remove_file(dir.0.join(".git/objects/info/alternates")).unwrap();
        fs::write(
            dir.0.join(".git/shallow"),
            b"1234567890123456789012345678901234567890\n",
        )
        .unwrap();
        let repo = resolve(&driver, &dir.0);
        assert!(repo.layout.shallow);
    }
    #[test]
    fn linked_registration_and_fake_gitdir() {
        let state = Temp::new();
        let dir = Temp::new();
        let linked = Temp::new();
        git(&dir.0, &["init", "-q"]);
        git(
            &dir.0,
            &[
                "-c",
                "user.name=Test",
                "-c",
                "user.email=t@e",
                "commit",
                "--allow-empty",
                "-qm",
                "initial",
            ],
        );
        git(
            &dir.0,
            &["worktree", "add", "--detach", linked.0.to_str().unwrap()],
        );
        let driver = GitDriver::new(&state.0).unwrap();
        fs::write(linked.0.join(".git"), b"gitdir: /untrusted\n").unwrap();
        let repo = match driver.resolve_repo(&linked.0, &dir.0).unwrap() {
            ResolveRepo::Repository(r) => r,
            _ => panic!(),
        };
        assert_eq!(
            repo.common_dir(),
            fs::canonicalize(dir.0.join(".git")).unwrap()
        );
        let alien = Temp::new();
        assert_eq!(
            driver.resolve_repo(&alien.0, &dir.0).unwrap_err().cause,
            "untrusted-worktree"
        );
        assert!(matches!(
            driver.resolve_repo(&linked.0, &linked.0).unwrap(),
            ResolveRepo::NotARepository
        ));
    }
    #[test]
    fn output_ceiling_and_borrow_gate() {
        let state = Temp::new();
        let dir = Temp::new();
        git(&dir.0, &["init", "-q"]);
        let driver = GitDriver::new(&state.0).unwrap();
        let repo = resolve(&driver, &dir.0);
        fs::write(dir.0.join("file"), vec![b'x'; 10000]).unwrap();
        let oid = git(&dir.0, &["hash-object", "-w", "file"]);
        let err = driver
            .invoke(
                Some(&repo),
                &dir.0,
                &["cat-file", "blob", line(&oid).unwrap()],
                Policy::Inspect,
                None,
                true,
                100,
                Duration::from_secs(10),
            )
            .err()
            .unwrap();
        assert_eq!(err.cause, "git-output-limit");
        let err = driver
            .invoke(
                Some(&repo),
                &dir.0,
                &["hash-object", "-w", "file"],
                Policy::Publication,
                None,
                true,
                100,
                Duration::from_secs(10),
            )
            .err()
            .unwrap();
        assert_eq!(err.cause, "publication-borrow-required");
        fs::write(dir.0.join("large"), vec![b'x'; 16 * 1024 * 1024]).unwrap();
        let err = driver
            .invoke(
                Some(&repo),
                &dir.0,
                &["hash-object", "large"],
                Policy::Inspect,
                None,
                true,
                100,
                Duration::ZERO,
            )
            .err()
            .unwrap();
        assert_eq!(err.cause, "git-timeout");
        #[cfg(unix)]
        {
            use std::os::unix::fs::PermissionsExt;
            fs::set_permissions(&driver.hooks, fs::Permissions::from_mode(0o700)).unwrap();
        }
        fs::write(driver.hooks.join("injected"), b"x").unwrap();
        assert_eq!(
            driver
                .checked(&repo, &["status", "-z"], Policy::Inspect)
                .unwrap_err()
                .cause,
            "trusted-hooks-not-empty"
        );
    }
    #[test]
    fn scrubbed_environment_cannot_supply_git_authority() {
        let state = Temp::new();
        let driver = GitDriver::new(&state.0).unwrap();
        let out = Command::new(std::env::current_exe().unwrap())
            .args(["--exact", "driver::tests::scrubbed_environment_child"])
            .env("GIT_DIR", "/worker/repository")
            .env("GIT_ALTERNATE_OBJECT_DIRECTORIES", "/worker/objects")
            .env("GIT_REPLACE_REF_BASE", "refs/worker/")
            .env("GIT_CONFIG_COUNT", "1")
            .env("GIT_CONFIG_KEY_0", "core.sshCommand")
            .env("GIT_CONFIG_VALUE_0", "worker-command")
            .env("FGOS_TEST_STATE", &state.0)
            .output()
            .unwrap();
        assert!(
            out.status.success(),
            "{}",
            String::from_utf8_lossy(&out.stdout)
        );
        assert!(driver.git_floor_verdict().unwrap().supported);
    }
    #[test]
    fn scrubbed_environment_child() {
        if let Some(state) = std::env::var_os("FGOS_TEST_STATE") {
            let driver = GitDriver::new(Path::new(&state)).unwrap();
            assert!(driver.git_floor_verdict().unwrap().supported);
            assert!(Scrubbed::new().0.keys().all(|k| !k.starts_with("GIT_")));
        }
    }
    #[test]
    fn every_policy_passes_the_c_locale_to_real_git_children() {
        let state = Temp::new();
        let repo_dir = Temp::new();
        git(&repo_dir.0, &["init", "-q"]);
        let driver = GitDriver::new(&state.0).unwrap();
        let repo = resolve(&driver, &repo_dir.0);
        let resource = fgos_holder_lock::Resource::new("locale", state.0.join("locale.lock"));
        let handle = match fgos_holder_lock::acquire(
            &resource,
            fgos_holder_lock::Mode::Ex,
            fgos_holder_lock::Wait::Try,
            2000,
        ) {
            fgos_holder_lock::Acquire::Acquired(h) => h,
            other => panic!("{other:?}"),
        };
        for policy in [
            Policy::Inspect,
            Policy::Remote,
            Policy::HookContext,
            Policy::Publication,
        ] {
            let loan = if policy == Policy::Publication {
                Some(&handle as &dyn BorrowedSpawn)
            } else {
                None
            };
            let out = driver
                .invoke(
                    Some(&repo),
                    &repo_dir.0,
                    &[
                        "-c",
                        "alias.locale=!printf '%s/%s' \"$LC_ALL\" \"$LANGUAGE\"",
                        "locale",
                    ],
                    policy,
                    loan,
                    false,
                    1024,
                    Duration::from_secs(5),
                )
                .unwrap();
            assert!(out.success, "{:?}", out.stderr);
            assert_eq!(out.stdout, b"C/");
        }
    }
    #[test]
    fn floor_is_shared_across_concurrent_driver_instances() {
        let first_state = Temp::new();
        let second_state = Temp::new();
        let first = GitDriver::new(&first_state.0).unwrap();
        let second = GitDriver::new(&second_state.0).unwrap();
        let (a, b) = std::thread::scope(|scope| {
            let a = scope.spawn(move || first.git_floor_verdict().unwrap() as *const _ as usize);
            let b = scope.spawn(move || second.git_floor_verdict().unwrap() as *const _ as usize);
            (a.join().unwrap(), b.join().unwrap())
        });
        assert_eq!(
            a, b,
            "all drivers must share the same process floor verdict"
        );
    }
    #[test]
    fn nul_parsers_and_redaction_preserve_bytes() {
        assert_eq!(
            nul_records(b"a\nb\0\xff \0").unwrap(),
            vec![b"a\nb".as_slice(), b"\xff ".as_slice()]
        );
        assert!(nul_records(b"partial").is_err());
        let config = parse_config(b"file:/a\0filter.x.clean\nfirst\nsecond\0").unwrap();
        assert_eq!(config[0].2, b"first\nsecond");
        assert!(parse_config(b"origin\0").is_err());
        assert_eq!(
            redact(b"fatal: https://user:secret@host/repo?token=secret\n"),
            b"fatal: https://[redacted]@host/repo?[redacted]"
        );
    }
}
